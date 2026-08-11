"""Tests for the Hannon & Biddle (2025) intraracial sample.

Paper: doi.org/10.1007/s12103-025-09879-8. Sample is 76,274 stops:
majority-Black districts 12/14/16/18/19/22/35/39, Jan 2022 - Aug 2025, sole
occupant, Black adult 18+, MVC-initiated, inter-twilight, unambiguous lighting.
"""

import pandas as pd
import pytest

from veil.intraracial import DISTRICTS, OUTCOMES, build_sample


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
                "date": pd.Timestamp("2023-12-21"),
                "sunset_local": pd.Timestamp("2023-12-21 16:35"),
                "dusk_local": pd.Timestamp("2023-12-21 17:05"),
            },
            {
                "date": pd.Timestamp("2023-06-21"),
                "sunset_local": pd.Timestamp("2023-06-21 20:31"),
                "dusk_local": pd.Timestamp("2023-06-21 21:02"),
            },
            {
                "date": pd.Timestamp("2024-10-03"),
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
