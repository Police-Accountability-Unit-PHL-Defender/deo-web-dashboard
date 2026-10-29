"""Model-fitting tests on synthetic data with a known planted effect."""
import numpy as np
import pandas as pd
import pytest
import statsmodels.api as sm
import statsmodels.formula.api as smf

from veil.models import (
    _DEGENERATE_BOUND,
    _collapse_sparse_levels,
    confidence_interval,
    fit_intraracial,
    fit_vod,
    predicted_probabilities,
)


def synthetic(n=6000, effect=-0.5, seed=0):
    """Build a frame where darkness genuinely lowers the outcome's odds."""
    rng = np.random.default_rng(seed)
    obscured = rng.integers(0, 2, n)
    logit = 0.2 + effect * obscured
    y = rng.random(n) < 1 / (1 + np.exp(-logit))
    return pd.DataFrame({
        "outcome": y.astype(int),
        "obscured_view": obscured,
        "clock_minutes": rng.integers(1028, 1235, n),
        "dow": rng.integers(0, 7, n),
        "year": rng.choice([2021, 2022, 2023, 2024], n),
        # District-qualified police service areas, the shape veil/sample.py
        # emits ("DD-P"). `psa` on its own is not a usable location control.
        "police_area": rng.choice(["18-1", "18-2", "22-1", "22-2"], n),
        "assigned_unit": rng.choice(["A", "B", "C"], n),
        "is_summer": rng.integers(0, 2, n),
    })


def test_recovers_a_planted_negative_effect():
    result = fit_vod(synthetic(effect=-0.5), outcome="outcome", full_controls=False)
    assert result["converged"]
    assert -0.7 < result["coef"] < -0.3, result["coef"]
    assert result["p"] < 0.001


def test_finds_nothing_when_there_is_nothing():
    result = fit_vod(synthetic(effect=0.0), outcome="outcome", full_controls=False)
    assert result["p"] > 0.05, result


def test_odds_ratio_matches_the_coefficient():
    result = fit_vod(synthetic(effect=-0.5), outcome="outcome", full_controls=False)
    assert result["odds_ratio"] == pytest.approx(np.exp(result["coef"]), rel=1e-6)


def test_full_controls_spec_runs_and_is_labelled():
    result = fit_vod(synthetic(), outcome="outcome", full_controls=True)
    assert result["spec"] == "model_2"
    assert result["n"] == 6000


def test_reduced_spec_is_labelled():
    result = fit_vod(synthetic(), outcome="outcome", full_controls=False)
    assert result["spec"] == "model_1"


def test_separation_is_reported_not_raised():
    """Sparse fixed-effect cells must degrade gracefully, not explode.

    "Gracefully" means exactly one of two outcomes, and this test rejects
    everything else. It used to assert ``converged is False or se > 0``,
    which passed for the precise Task-5 defect it was written against: a
    separated fit returning coef=-3.56e14 and a huge *positive* se
    alongside converged=True satisfies the right-hand disjunct, so the
    assertion could not fail on the bug.
    """
    df = synthetic(n=200)
    df["police_area"] = [f"area-{i}" for i in range(len(df))]  # one level per row
    result = fit_vod(df, outcome="outcome", full_controls=True)

    if result["converged"]:
        # Reported as usable, so the estimate must be on a plausible
        # log-odds scale -- not an exploded separation artifact.
        assert abs(result["coef"]) <= _DEGENERATE_BOUND, result
        assert 0 < result["se"] <= _DEGENERATE_BOUND, result
        assert result.get("degenerate") is not True, result
        # It converges here only because every singleton level folded into
        # OTHER, which removes the control entirely. Pin that, so a change
        # that stops collapsing cannot quietly land back on a garbage fit.
        assert result["other_row_share"]["police_area"] == pytest.approx(1.0), result
    else:
        # Reported as unusable, so it must say why rather than looking like
        # a finding to anything downstream.
        assert "error" in result, result


def test_collapse_sparse_levels_folds_rare_categories():
    series = pd.Series(["A"] * 50 + ["B"] * 30 + ["C"] * 5 + ["D"] * 2)
    collapsed = _collapse_sparse_levels(series, min_count=10)
    assert set(collapsed[series == "A"]) == {"A"}
    assert set(collapsed[series == "B"]) == {"B"}
    assert set(collapsed[series == "C"]) == {"OTHER"}
    assert set(collapsed[series == "D"]) == {"OTHER"}
    assert len(collapsed) == len(series)


def test_full_controls_spec_collapses_sparse_units():
    """assigned_unit/police_area levels below the threshold get folded first."""
    df = synthetic(n=2000)
    # Add plenty of rare assigned_unit levels alongside the common A/B/C ones.
    rng = np.random.default_rng(1)
    rare = rng.choice([f"rare-{i}" for i in range(20)], size=50)
    df.loc[df.index[:50], "assigned_unit"] = rare
    result = fit_vod(df, outcome="outcome", full_controls=True)
    assert result["spec"] == "model_2"
    assert result["min_unit_count"] == 100
    assert result["collapsed_units"] > 0


def test_degenerate_fit_is_flagged_not_reported_as_success():
    """Perfect separation must never be reported as a successful convergence."""
    df = synthetic(n=2000)
    df["outcome"] = df["obscured_view"]  # obscured_view perfectly predicts the outcome
    result = fit_vod(df, outcome="outcome", full_controls=False)
    assert result["converged"] is False
    assert result.get("degenerate") is True
    assert "error" in result


def test_confidence_interval_is_the_wald_interval_around_the_coefficient():
    """The 95% interval the trend chart's whiskers are drawn from.

    Pinned against statsmodels' own summary interval rather than a
    hand-rounded 1.96, so the whiskers and any published table agree.
    """
    lo, hi = confidence_interval(-0.25, 0.05)
    assert lo == pytest.approx(-0.348, abs=1e-3)
    assert hi == pytest.approx(-0.152, abs=1e-3)
    # Symmetric about the point estimate, and wider for a noisier estimate.
    assert (lo + hi) / 2 == pytest.approx(-0.25)
    wide_lo, wide_hi = confidence_interval(-0.25, 0.10)
    assert (wide_hi - wide_lo) > (hi - lo)


def test_confidence_interval_of_a_zero_se_estimate_is_a_point():
    assert confidence_interval(0.4, 0.0) == (0.4, 0.4)


def test_predicted_probabilities_are_averaged_over_observed_rows():
    """Pin g-computation, not an at-means/modal reference profile."""
    df = synthetic(n=6000, effect=-0.5)
    df["weight"] = 0.25 + np.linspace(0, 1, len(df))

    got = predicted_probabilities(df, "outcome")

    fit = smf.glm(
        'outcome ~ obscured_view + cr(clock_minutes, df=6, constraints="center")'
        ' + C(dow) + C(year) + C(police_area) + C(assigned_unit) + C(is_summer)',
        data=df,
        family=sm.families.Binomial(),
        var_weights=df["weight"],
    ).fit(scale="X2")
    expected = {}
    for label, value in (("daylight", 0), ("dark", 1)):
        counterfactual = df.copy()
        counterfactual["obscured_view"] = value
        expected[label] = round(float(fit.predict(counterfactual).mean()) * 100, 1)

    assert got == expected


def test_intraracial_fit_reports_probability_scale_marginal_change_and_interval():
    df = synthetic(n=6000, effect=-0.5)
    df["weight"] = 0.25 + np.linspace(0, 1, len(df))
    result = fit_intraracial(df, "outcome")

    assert result["converged"]
    assert result["marginal_effect_pp"] == pytest.approx(
        result["marginal_dark_pct"] - result["marginal_daylight_pct"]
    )
    assert result["marginal_effect_pp"] < 0
    assert result["marginal_ci_lo_pp"] < result["marginal_effect_pp"]
    assert result["marginal_ci_hi_pp"] > result["marginal_effect_pp"]
    assert result["marginal_effect_se_pp"] > 0


def test_marginal_predictions_are_not_the_modal_profile_predictions():
    """A nonlinear logit makes average predictions differ from at-means."""
    df = synthetic(n=6000, effect=-0.5)
    df["weight"] = 1.0
    df.loc[:2999, "clock_minutes"] = 1028
    df.loc[3000:, "clock_minutes"] = 1234

    got = predicted_probabilities(df, "outcome")

    fit = smf.glm(
        'outcome ~ obscured_view + cr(clock_minutes, df=6, constraints="center")'
        ' + C(dow) + C(year) + C(police_area) + C(assigned_unit) + C(is_summer)',
        data=df,
        family=sm.families.Binomial(),
        var_weights=df["weight"],
    ).fit(scale="X2")
    reference = {
        "clock_minutes": float(df.clock_minutes.mean()),
        "dow": df.dow.mode().iloc[0],
        "year": df.year.mode().iloc[0],
        "police_area": df.police_area.mode().iloc[0],
        "assigned_unit": df.assigned_unit.mode().iloc[0],
        "is_summer": df.is_summer.mode().iloc[0],
    }
    at_reference = []
    for value in (0, 1):
        row = pd.DataFrame([{**reference, "obscured_view": value}])
        at_reference.append(round(float(fit.predict(row).iloc[0]) * 100, 1))

    assert [got["daylight"], got["dark"]] != at_reference
