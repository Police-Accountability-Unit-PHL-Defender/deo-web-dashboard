"""Guards for the public headline's sample and the shipped numerical result."""
import json
from pathlib import Path

import pandas as pd
import pytest

from cube_builders import veil


def test_pooled_headline_fits_both_races_once_and_excludes_pandemic_year(monkeypatch):
    sample = pd.DataFrame({
        "year": [2019, 2019, 2020, 2021],
        "race": [veil.BLACK, veil.WHITE, veil.BLACK, veil.WHITE],
        "_district": ["12", "02", "12", "02"],
    })
    calls = []
    result = {
        "n": 3, "converged": True, "p_value": 0.01,
        "marginal_daylight_pct": 80, "marginal_dark_pct": 79,
        "marginal_effect_pp": -1, "marginal_effect_se_pp": 0.1,
        "marginal_ci_lo_pp": -1.2, "marginal_ci_hi_pp": -0.8,
    }

    def fake_fit(rows, outcome):
        calls.append((rows.copy(), outcome))
        return result

    monkeypatch.setattr(veil, "fit_intraracial", fake_fit)
    headline = veil._pooled_race_composition(sample)
    assert len(calls) == 1
    rows, outcome = calls[0]
    assert outcome == "is_black"
    assert rows.year.tolist() == [2019, 2019, 2021]
    assert rows.is_black.tolist() == [1, 0, 0]
    assert "is_black" not in sample  # input is not mutated
    assert headline["districts"] == ["02", "12"]
    assert 2020 not in headline["years"]
    assert headline["marginal_effect_pp"] == result["marginal_effect_pp"]


def test_shipped_headline_reconciles_with_annual_samples_and_predictions():
    path = Path(__file__).resolve().parents[2] / "public/cubes/veil.json"
    by_year = json.loads(path.read_text())["intraracial"]["by_year"]
    pooled = by_year["race_composition_pooled"]
    annual = [e for e in by_year["race_composition_overall"]
              if e["sample"] == "all_adults" and e["year"] in pooled["years"]]
    assert pooled["converged"]
    assert pooled["years"] == by_year["default_years"]
    assert pooled["n"] == sum(e["n"] for e in annual)
    assert pooled["marginal_effect_pp"] == pytest.approx(
        pooled["marginal_dark_pct"] - pooled["marginal_daylight_pct"]
    )
    weighted_annual = sum(e["n"] * e["marginal_effect_pp"] for e in annual) / pooled["n"]
    assert pooled["marginal_effect_pp"] == pytest.approx(weighted_annual, abs=0.1)
    assert pooled["marginal_ci_hi_pp"] < 0
    assert pooled["marginal_effect_pp"] == pytest.approx(-1.021591919, abs=1e-8)


def _fake_marginal(n=1):
    return {
        "n": n, "converged": True, "p_value": 0.01,
        "marginal_daylight_pct": 80, "marginal_dark_pct": 78,
        "marginal_effect_pp": -2, "marginal_effect_se_pp": 0.5,
        "marginal_ci_lo_pp": -3, "marginal_ci_hi_pp": -1,
    }


def test_young_men_pooled_fits_young_men_alone_and_tests_against_other_adults(monkeypatch):
    sample = pd.DataFrame({
        "year": [2019, 2019, 2020, 2021, 2021],
        "race": [veil.BLACK, veil.WHITE, veil.BLACK, veil.BLACK, veil.WHITE],
        "young_male": [1, 0, 1, 0, 1],
    })
    pooled_calls, difference_calls = [], []
    monkeypatch.setattr(veil, "fit_intraracial",
                        lambda rows, outcome: pooled_calls.append((rows.copy(), outcome)) or _fake_marginal())
    monkeypatch.setattr(veil, "fit_group_darkness_difference",
                        lambda rows, outcome, group: difference_calls.append((rows.copy(), outcome, group)) or {"converged": True})

    result = veil._pooled_young_men(sample)

    (young, outcome), = pooled_calls
    assert outcome == "is_black"
    assert young.year.tolist() == [2019, 2021] and young.young_male.eq(1).all()
    (everyone, outcome, group), = difference_calls
    assert (outcome, group) == ("is_black", "young_male")
    # Every adult in the headline years, so the comparison group is the other adults.
    assert everyone.year.tolist() == [2019, 2019, 2021, 2021]
    assert everyone.is_black.tolist() == [1, 0, 1, 0]
    assert 2020 not in result["years"]
    assert result["pooled"]["marginal_effect_pp"] == -2


def test_driving_equality_split_uses_the_effective_date_not_the_year(monkeypatch):
    sample = pd.DataFrame({
        "year": [2020, 2021, 2022, 2022, 2022, 2025],
        "race": [veil.BLACK] * 6,
        "ts_local": ["2020-06-01 19:00", "2021-06-01 19:00", "2022-03-02 23:59",
                     "2022-03-03 00:00", "2022-12-01 18:00", "2025-06-01 19:00"],
    })
    calls = []
    monkeypatch.setattr(veil, "fit_group_darkness_difference",
                        lambda rows, outcome, group: calls.append((rows.copy(), outcome, group)) or {"converged": True})

    result = veil._driving_equality_comparison(sample)

    (rows, outcome, group), = calls
    assert (outcome, group) == ("is_black", "after_driving_equality")
    assert rows.year.tolist() == [2021, 2022, 2022, 2022, 2025]
    assert rows.after_driving_equality.tolist() == [0, 0, 1, 1, 1]
    assert result["effective_date"] == "2022-03-03"


def test_shipped_subgroup_and_policy_comparisons_reconcile():
    path = Path(__file__).resolve().parents[2] / "public/cubes/veil.json"
    by_year = json.loads(path.read_text())["intraracial"]["by_year"]
    headline = by_year["race_composition_pooled"]
    young = by_year["race_composition_young_men_pooled"]
    annual_young = [e for e in by_year["race_composition_overall"]
                    if e["sample"] == "young_male" and e["year"] in young["years"]]
    assert young["years"] == headline["years"]
    assert young["pooled"]["converged"] and young["difference"]["converged"]
    assert young["pooled"]["n"] == sum(e["n"] for e in annual_young)
    assert young["difference"]["n"] == headline["n"]
    assert young["difference"]["n_group"] == young["pooled"]["n"]
    de = by_year["race_composition_driving_equality"]
    assert de["converged"] and de["n"] == headline["n"]
    assert de["effective_date"] == "2022-03-03"
    for result in (young["difference"], de):
        assert result["difference_pp"] == pytest.approx(
            result["effects"]["group"]["effect_pp"] - result["effects"]["reference"]["effect_pp"])
