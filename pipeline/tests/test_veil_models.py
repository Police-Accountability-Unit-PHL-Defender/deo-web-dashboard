"""Model-fitting tests on synthetic data with a known planted effect."""

import numpy as np
import pandas as pd
import pytest

from veil.models import fit_vod


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
        "psa": rng.choice(["18-1", "18-2", "22-1", "22-2"], n),
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
    """Sparse fixed-effect cells must degrade gracefully, not explode."""
    df = synthetic(n=200)
    df["psa"] = [f"psa-{i}" for i in range(len(df))]  # one level per row
    result = fit_vod(df, outcome="outcome", full_controls=True)
    assert result["converged"] is False or result["se"] > 0
