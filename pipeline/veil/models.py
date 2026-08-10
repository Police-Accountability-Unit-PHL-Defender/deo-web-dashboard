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
MODEL_TARGETS = {
    "driver_is_black.model_1": -0.116,
    "driver_is_black.model_2": -0.188,
    "has_black_passenger.model_1": -0.242,
    "has_black_passenger.model_2": -0.269,
}

_BASE = "obscured_view + cr(clock_minutes, df=6) + C(dow) + C(year)"
_FULL = _BASE + " + C(psa) + C(assigned_unit) + C(is_summer)"


def fit_vod(df: pd.DataFrame, outcome: str, full_controls: bool) -> dict:
    """Fit one veil-of-darkness model and return its obscured-view estimate."""
    formula = f"{outcome} ~ {_FULL if full_controls else _BASE}"
    spec = "model_2" if full_controls else "model_1"
    result = {
        "spec": spec, "n": int(len(df)), "coef": float("nan"), "se": float("nan"),
        "p": float("nan"), "odds_ratio": float("nan"), "converged": False,
    }
    try:
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
    except Exception as exc:  # separation, singular design matrix, empty cells
        result["error"] = f"{type(exc).__name__}: {exc}"
    return result
