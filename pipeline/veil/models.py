"""Quasi-binomial veil-of-darkness models.

Follows Hannon & Biddle (2026) Tables 1 and 2. The key regressor is
``obscured_view`` -- darkness -- so a negative coefficient means darkness
reduces the odds of the outcome, which is the direction that indicates
visibility-dependent selection.

Model 2 omits the Knode et al. (2024) seasonality weight, whose formula is
not reproduced in the paper. Anything rendering a model_2 result must say
so.
"""

import warnings

import numpy as np
import pandas as pd
import statsmodels.api as sm
import statsmodels.formula.api as smf

# Published coefficients, for reference and for the comparison display.
#
# `party_is_black` is deliberately NOT called `driver_is_black`: this sample
# never identifies a driver (see veil/sample.py's module docstring), and the
# homogeneous-party restriction makes it unnecessary -- the outcome is
# "the party police stopped was Black rather than white".
MODEL_TARGETS = {
    "party_is_black.model_1": -0.116,
    "party_is_black.model_2": -0.188,
    "has_black_passenger.model_1": -0.242,
    "has_black_passenger.model_2": -0.269,
}

# constraints="center" keeps cr() a natural cubic spline (as the paper
# specifies) but re-parameterises its basis so it no longer spans the
# constant function. Without this, cr(clock_minutes, df=6) + Intercept is
# rank-deficient by one column, and IRLS's absolute deviance-change
# tolerance is never satisfied even though the obscured_view estimate is
# stable -- the model looks unconverged when it is really just redundant.
_BASE = 'obscured_view + cr(clock_minutes, df=6, constraints="center") + C(dow) + C(year)'

# The location control is C(police_area), NOT C(psa). `psa` holds only five
# distinct values city-wide because PPD numbers service areas within each
# district, so C(psa) would pool PSA 2 of the 12th District with PSA 2 of the
# 7th -- four dummies standing in for 66 real areas. `police_area` is the
# district-qualified key ("02-1") built in veil/sample.py.
#
# `districtoccur` is deliberately NOT a separate term. A PSA nests inside
# exactly one district, so district dummies are a linear combination of the
# area dummies: adding both makes the design rank-deficient without adding
# information. The area fixed effects already absorb every district-level
# difference. (Once sparse areas collapse into OTHER the nesting is no
# longer exact, but adding a second, coarser geography the paper did not
# specify is not a change this reproduction should make.)
_FULL = _BASE + " + C(police_area) + C(assigned_unit) + C(is_summer)"

# Sparse fixed-effect levels (e.g. a specialist unit with a handful of stops)
# can perfectly separate a binary outcome: GLM then drives that level's
# coefficient toward +/-infinity while still reporting converged=True. 100
# was chosen by inspecting the real assigned_unit stop-count distribution: it
# leaves a wide margin past the point (~20 stops) where zero-cell levels
# against party_is_black disappear, while keeping every real unit as its own
# level. police_area needs the same treatment: a handful of the 66 areas are
# very thinly stopped in this evening window.
#
# Collapsing only protects the fit if the OTHER bucket stays small. If it
# ever swallowed a large share of ROWS the location control would be hollow
# again, so `other_row_share` is reported alongside every fit -- see
# tests/test_veil_models.py.
_MIN_UNIT_COUNT = 100

# A log-odds coefficient or standard error beyond this is not a real effect
# on this scale -- it is quasi/complete separation that GLM did not raise an
# exception for.
_DEGENERATE_BOUND = 10.0

_SPARSE_COLUMNS = ("assigned_unit", "police_area")


def _collapse_sparse_levels(series: pd.Series, min_count: int) -> pd.Series:
    """Fold levels occurring fewer than ``min_count`` times into "OTHER".

    Row count and index are preserved; only the rare categories' labels
    change.
    """
    counts = series.value_counts()
    rare = counts[counts < min_count].index
    return series.where(~series.isin(rare), "OTHER")


def fit_vod(df: pd.DataFrame, outcome: str, full_controls: bool) -> dict:
    """Fit one veil-of-darkness model and return its obscured-view estimate."""
    formula = f"{outcome} ~ {_FULL if full_controls else _BASE}"
    spec = "model_2" if full_controls else "model_1"
    result = {
        "spec": spec, "n": int(len(df)), "coef": float("nan"), "se": float("nan"),
        "p": float("nan"), "odds_ratio": float("nan"), "converged": False,
        "collapsed_units": 0, "min_unit_count": _MIN_UNIT_COUNT,
        "other_row_share": {},
    }
    try:
        if full_controls:
            df = df.copy()
            collapsed = 0
            for col in _SPARSE_COLUMNS:
                if col in df.columns:
                    counts = df[col].value_counts()
                    collapsed += int((counts < _MIN_UNIT_COUNT).sum())
                    df[col] = _collapse_sparse_levels(df[col], _MIN_UNIT_COUNT)
                    # Share of ROWS, not levels: many rare levels folding
                    # together is harmless, a large fraction of the sample
                    # losing its fixed effect is not.
                    result["other_row_share"][col] = (
                        float((df[col] == "OTHER").mean()) if len(df) else 0.0
                    )
                    result[f"{col}_levels"] = int(df[col].nunique())
            result["collapsed_units"] = collapsed
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model = smf.glm(formula, data=df, family=sm.families.Binomial())
            # scale="X2" gives quasi-binomial standard errors, adjusting for
            # under/overdispersion as the paper does.
            fit = model.fit(scale="X2")
        result.update(
            coef=float(fit.params["obscured_view"]),
            se=float(fit.bse["obscured_view"]),
            p=float(fit.pvalues["obscured_view"]),
            odds_ratio=float(np.exp(fit.params["obscured_view"])),
            n=int(fit.nobs),
            converged=bool(fit.converged),
        )
        if abs(result["coef"]) > _DEGENERATE_BOUND or result["se"] > _DEGENERATE_BOUND:
            result["converged"] = False
            result["degenerate"] = True
            result["error"] = (
                f"Degenerate fit: |coef|={abs(result['coef']):.3g}, se={result['se']:.3g} "
                f"exceeds the plausible log-odds bound ({_DEGENERATE_BOUND:g}); this is almost "
                "certainly quasi/complete separation in a sparse fixed-effect level, not a real "
                "effect. Numbers are left in place for inspection but must not be treated as a "
                "successful fit."
            )
    except Exception as exc:  # separation, singular design matrix, empty cells
        result["error"] = f"{type(exc).__name__}: {exc}"
    return result
