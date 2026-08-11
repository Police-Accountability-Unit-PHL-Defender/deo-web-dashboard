"""Tests for the Hannon & Biddle (2025) intraracial sample.

Paper: doi.org/10.1007/s12103-025-09879-8. Sample is 76,274 stops:
majority-Black districts 12/14/16/18/19/22/35/39, Jan 2022 - Aug 2025, sole
occupant, Black adult 18+, MVC-initiated, inter-twilight, unambiguous lighting.
"""

import sqlite3
from pathlib import Path

import pandas as pd
import pytest

from veil.intraracial import DISTRICTS, OUTCOMES, build_sample
from veil.sun import load_sun_times

REPO = Path(__file__).resolve().parents[1]
DB = REPO / "data" / "open_data_philly_2026_07_20.db"
PAPER_N = 76_274


def _stop(**kw):
    base = dict(
        ts_local=pd.Timestamp("2024-10-03 19:00"),
        stop_date=pd.Timestamp("2024-10-03"),
        districtoccur="12",
        psa="1",
        police_area="12-1",
        assigned_unit="12TH DISTRICT",
        race="Black - Non-Latino",
        age=25,
        gender="Male",
        is_mvc=1,
        clock_minutes=19 * 60,
        dow=3,
        is_summer=0,
        year=2024,
        lighting="daylight",
    )
    base.update(kw)
    return base


def _sun():
    # A real inter-twilight window (earliest dusk, latest sunset) only makes
    # sense across a full year of season diversity: a single day's dusk is
    # always after that same day's sunset, so a one-row sun table can never
    # produce a valid (start < end) window -- it would silently invert and
    # zero out every seasonality weight. Anchor winter/summer solstice dates
    # alongside the paper's own 3 October worked example (Knode et al. 2024,
    # sec 3.4: nearly equal daylight/darkness that day) so the window and
    # weight are both computed the way they would be from the real
    # multi-year sun-times table.
    return pd.DataFrame(
        [
            {
                "stop_date": pd.Timestamp("2023-12-21"),
                "sunset_local": pd.Timestamp("2023-12-21 16:35"),
                "dusk_local": pd.Timestamp("2023-12-21 17:05"),
            },
            {
                "stop_date": pd.Timestamp("2023-06-21"),
                "sunset_local": pd.Timestamp("2023-06-21 20:31"),
                "dusk_local": pd.Timestamp("2023-06-21 21:02"),
            },
            {
                "stop_date": pd.Timestamp("2024-10-03"),
                "sunset_local": pd.Timestamp("2024-10-03 18:51"),
                "dusk_local": pd.Timestamp("2024-10-03 19:20"),
            },
        ]
    )


def test_keeps_a_qualifying_stop():
    assert len(build_sample(pd.DataFrame([_stop()]), _sun())) == 1


def test_keeps_only_the_districts_the_paper_names():
    assert set(DISTRICTS) == {"12", "14", "16", "18", "19", "22", "35", "39"}
    assert len(build_sample(pd.DataFrame([_stop(districtoccur="09")]), _sun())) == 0


def test_drops_non_black_motorists():
    out = build_sample(pd.DataFrame([_stop(race="White - Non-Latino")]), _sun())
    assert len(out) == 0


def test_drops_minors():
    assert len(build_sample(pd.DataFrame([_stop(age=17)]), _sun())) == 0


def test_drops_non_mvc_stops():
    assert len(build_sample(pd.DataFrame([_stop(is_mvc=0)]), _sun())) == 0


def test_drops_ambiguous_lighting():
    assert len(build_sample(pd.DataFrame([_stop(lighting="ambiguous")]), _sun())) == 0


def test_drops_dates_outside_the_papers_window():
    early = _stop(ts_local=pd.Timestamp("2021-10-03 19:00"))
    late = _stop(ts_local=pd.Timestamp("2025-10-03 19:00"))
    assert len(build_sample(pd.DataFrame([early, late]), _sun())) == 0


def test_window_start_boundary_is_exact():
    # WINDOW = ("2022-01-01", "2025-08-31"). The end bound is hand-rolled
    # (WINDOW[1] + 1 day, exclusive) and defines both the published n and
    # the page's "to August 2025" label, so pin all four corners exactly.
    before = _stop(ts_local=pd.Timestamp("2021-12-31 23:59"))
    assert len(build_sample(pd.DataFrame([before]), _sun())) == 0

    at_start = _stop(ts_local=pd.Timestamp("2022-01-01 00:00"))
    assert len(build_sample(pd.DataFrame([at_start]), _sun())) == 1


def test_window_end_boundary_is_exact():
    at_end = _stop(ts_local=pd.Timestamp("2025-08-31 23:59"))
    assert len(build_sample(pd.DataFrame([at_end]), _sun())) == 1

    after = _stop(ts_local=pd.Timestamp("2025-09-01 00:00"))
    assert len(build_sample(pd.DataFrame([after]), _sun())) == 0


def test_derives_all_six_outcomes():
    out = build_sample(pd.DataFrame([_stop(age=25, gender="Male")]), _sun())
    row = out.iloc[0]
    assert set(OUTCOMES) <= set(out.columns)
    assert row.is_young == 1 and row.is_male == 1 and row.young_male == 1
    assert row.young_female == 0 and row.older_male == 0 and row.older_female == 0


def test_age_boundary_29_is_young_and_30_is_not():
    # The paper dichotomises at 18-29 versus 30+.
    assert build_sample(pd.DataFrame([_stop(age=29)]), _sun()).iloc[0].is_young == 1
    assert build_sample(pd.DataFrame([_stop(age=30)]), _sun()).iloc[0].is_young == 0


def test_older_female_is_the_inverse_corner():
    row = build_sample(pd.DataFrame([_stop(age=45, gender="Female")]), _sun()).iloc[0]
    assert row.older_female == 1
    assert row.is_young == 0 and row.is_male == 0


def test_obscured_view_marks_darkness():
    out = build_sample(pd.DataFrame([_stop(lighting="dark")]), _sun())
    assert out.iloc[0].obscured_view == 1


def test_every_row_carries_a_positive_seasonality_weight():
    out = build_sample(pd.DataFrame([_stop()]), _sun())
    assert (out.weight > 0).all()


# --- Added per dispatch: a null gender must never fall through to Female,
# and a null age must never fall through to "adult". Both must be excluded
# as a stated restriction, not merely happen to be excluded by accident of
# comparison semantics. ---


def test_drops_null_gender_rather_than_counting_it_as_female():
    out = build_sample(pd.DataFrame([_stop(gender=None)]), _sun())
    assert len(out) == 0


def test_drops_blank_gender_rather_than_counting_it_as_female():
    out = build_sample(pd.DataFrame([_stop(gender="")]), _sun())
    assert len(out) == 0


def test_drops_null_age():
    out = build_sample(pd.DataFrame([_stop(age=None)]), _sun())
    assert len(out) == 0


def test_drops_null_assigned_unit():
    # Every model formula includes C(assigned_unit); patsy silently drops a
    # null-valued row before fitting. Stating this as a sample restriction
    # keeps the sample's row count and every model's reported `n` in
    # agreement (see I7 / build_sample's docstring).
    out = build_sample(pd.DataFrame([_stop(assigned_unit=None)]), _sun())
    assert len(out) == 0


def test_no_row_ever_has_a_null_weight():
    stops = pd.DataFrame(
        [
            _stop(),
            _stop(gender=None),
            _stop(age=None),
            _stop(districtoccur="09"),
        ]
    )
    out = build_sample(stops, _sun())
    assert len(out) == 1
    assert out.weight.notna().all()


def test_real_table_read_plainly_still_builds_the_sample():
    # The obvious way to load this table -- no parse_dates -- hands
    # ts_local and stop_date to build_sample as plain strings (sqlite TEXT).
    # Task 4's cube builder reads the table exactly this way, so this is the
    # integration path that actually matters, not just the Timestamp-typed
    # fixtures the other tests pass in.
    if not DB.exists():
        pytest.skip(f"{DB} not present")
    with sqlite3.connect(DB) as conn:
        stops = pd.read_sql("SELECT * FROM car_ped_stops_veil_intraracial", conn)
    assert stops.ts_local.dtype == object  # confirms this is the str-typed path

    out = build_sample(stops, load_sun_times())

    assert abs(len(out) - PAPER_N) / PAPER_N < 0.05
    assert out.weight.notna().all()


# --- models -------------------------------------------------------------
#
# These run against the real veil table. If it is missing, build it:
#   uv run python -m veil.build --zip data/car_ped_stops_2026-07-20T03_45_06.zip \
#       --db data/open_data_philly_2026_07_20.db

from veil.models import INTRARACIAL_SE_TARGETS, INTRARACIAL_TARGETS, fit_intraracial, predicted_probabilities


@pytest.fixture(scope="module")
def sample():
    if not DB.exists():
        pytest.skip(f"{DB} not built")
    with sqlite3.connect(DB) as conn:
        stops = pd.read_sql("SELECT * FROM car_ped_stops_veil_intraracial", conn)
    return build_sample(stops, load_sun_times())


def test_sample_size_lands_near_the_published_76274(sample):
    # The paper reports n = 76,274. Our backup vintage and PPD's later
    # corrections move this a little; more than 10% apart means the sample
    # construction is wrong, not that the data moved.
    assert len(sample) == pytest.approx(76_274, rel=0.10)


@pytest.mark.parametrize("outcome", list(INTRARACIAL_TARGETS))
def test_coefficients_land_near_table_1(sample, outcome):
    got = fit_intraracial(sample, outcome)
    assert got["converged"], f"{outcome} did not converge"
    assert got["coef"] == pytest.approx(INTRARACIAL_TARGETS[outcome], abs=0.08)


@pytest.mark.parametrize("outcome", list(INTRARACIAL_SE_TARGETS))
def test_standard_errors_land_near_table_1(sample, outcome):
    # SEs, not just coefficients, were the decisive evidence for var_weights
    # over freq_weights: the two weighting schemes give near-identical
    # coefficients but SEs that differ by an order of magnitude. Pin them too.
    got = fit_intraracial(sample, outcome)
    assert got["se"] == pytest.approx(INTRARACIAL_SE_TARGETS[outcome], abs=0.01)


def test_a_models_n_equals_the_sample_length(sample):
    # `sample.n` on the cube and every model's `n` must agree: the page
    # states the sample's row count as "the sample the coefficients come
    # from," so build_sample must restrict away anything a model's formula
    # would otherwise silently drop (see assigned_unit, I7).
    result = fit_intraracial(sample, "is_young")
    assert result["n"] == len(sample)


def test_the_two_null_results_stay_null(sample):
    # These nulls are part of the finding: profiling shows up for young men
    # and inversely for older women, and nowhere else. A reproduction that
    # makes either significant is wrong.
    for outcome in ("young_female", "older_male"):
        assert fit_intraracial(sample, outcome)["p_value"] > 0.05, outcome


def test_the_four_significant_results_stay_significant(sample):
    for outcome in ("is_young", "is_male", "young_male", "older_female"):
        assert fit_intraracial(sample, outcome)["p_value"] < 0.001, outcome


def test_young_male_probability_drops_from_about_26_to_about_22(sample):
    # The one pair the paper states numerically in prose (p.1086).
    probs = predicted_probabilities(sample, "young_male")
    assert probs["daylight"] == pytest.approx(26, abs=2.5)
    assert probs["dark"] == pytest.approx(22, abs=2.5)
    assert probs["daylight"] > probs["dark"]


def test_older_female_probability_rises_after_dark(sample):
    # Figure 1's inverse panel: roughly 15% to 18%.
    probs = predicted_probabilities(sample, "older_female")
    assert probs["dark"] > probs["daylight"]
