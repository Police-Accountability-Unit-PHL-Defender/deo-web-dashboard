"""Quasi-binomial veil-of-darkness models.

Follows Hannon & Biddle (2026) Tables 1 and 2. The key regressor is
``obscured_view`` -- darkness -- so a negative coefficient means darkness
reduces the odds of the outcome, which is the direction that indicates
visibility-dependent selection.

Model 2 (the 2026 group-travel paper's fuller-controls specification) omits
the Knode et al. (2024) seasonality weight: the 2026 paper does not publish
that weight's formula. The formula was subsequently obtained from Knode et
al. (2024) supplemental S.2 (see ``seasonality.py``) and is applied to the
2025 intraracial models below via ``fit_intraracial`` -- it is NOT
retrofitted onto Model 2, so Model 2's figures predate that and still lack
the weight. Anything rendering a model_2 result must say so.
"""

import warnings

import numpy as np
import pandas as pd
import statsmodels.api as sm
import statsmodels.formula.api as smf
from scipy.stats import norm

# The two-sided 95% normal critical value. Taken from scipy rather than
# written as 1.96 so the intervals this module produces match the ones
# statsmodels' own `.conf_int()` reports to full precision.
Z95 = float(norm.ppf(0.975))


def confidence_interval(coef: float, se: float) -> tuple[float, float]:
    """The 95% Wald interval around a fitted coefficient.

    Wald, not profile-likelihood: it is what statsmodels' summary prints for
    these GLMs, so a reader checking our whiskers against a model summary
    sees the same numbers.
    """
    half = Z95 * se
    return coef - half, coef + half

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


# Hannon & Biddle (2025), Table 1, "Dark Out" column. Two of the six are
# deliberately not significant in the paper: the profiling effect shows up
# for young men, and inversely for older women, and nowhere else.
INTRARACIAL_TARGETS = {
    "is_young": -0.17,
    "is_male": -0.21,
    "young_male": -0.23,
    "young_female": 0.05,  # not significant
    "older_male": -0.01,  # not significant
    "older_female": 0.25,
}

# Hannon & Biddle (2025), Table 1, "Dark Out" column, standard errors. These
# were the decisive evidence for using `var_weights` rather than `freq_weights`
# in `fit_intraracial`: under the two weighting schemes the coefficients above
# are nearly identical, but `freq_weights` inflates `nobs` as though each row
# were replicated `weight` times, which drives its SEs an order of magnitude
# away from these published values while `var_weights` lands close.
INTRARACIAL_SE_TARGETS = {
    "is_young": 0.02,
    "is_male": 0.02,
    "young_male": 0.02,
    "young_female": 0.03,
    "older_male": 0.02,
    "older_female": 0.02,
}

# The control set the 2025 paper uses is identical to the 2026 paper's full
# model (_FULL above): obscured_view, the clock-minutes spline, day of week,
# year, police area, assigned unit, and summer. Reused rather than
# duplicated so the two specs cannot silently drift apart.


def fit_intraracial(df: pd.DataFrame, outcome: str) -> dict:
    """Fit one weighted intraracial model and return its obscured-view estimate.

    Weighting: the paper fits R's ``glm(..., family = quasibinomial, weights
    = w)``. R's ``weights=`` on a GLM are *prior weights* -- they rescale
    each observation's contribution to the variance function (effectively,
    how many "trials" a single row's Bernoulli draw represents) without
    pretending the row is actually several duplicated observations. The
    seasonality weight here (``quadratic_weights``: p*(1-p) plus a floor) is
    a fractional per-row multiplier, not an integer count of repeated
    observations, so statsmodels' ``freq_weights`` -- which literally
    inflates ``nobs`` and the degrees of freedom as if each row were
    replicated ``weight`` times -- is the wrong analogue and drives the
    quasi-binomial dispersion/SE calculation to the wrong scale.
    ``var_weights`` is statsmodels' variance-weight argument, the direct
    analogue of R's prior weights for a GLM, and is what is used here.
    """
    formula = f"{outcome} ~ {_FULL}"
    result = {
        "coef": float("nan"), "se": float("nan"), "odds_ratio": float("nan"),
        "p_value": float("nan"), "n": int(len(df)), "converged": False,
        "collapsed_units": 0, "min_unit_count": _MIN_UNIT_COUNT,
        "other_row_share": {},
    }
    try:
        df = df.copy()
        collapsed = 0
        for col in _SPARSE_COLUMNS:
            if col in df.columns:
                counts = df[col].value_counts()
                collapsed += int((counts < _MIN_UNIT_COUNT).sum())
                df[col] = _collapse_sparse_levels(df[col], _MIN_UNIT_COUNT)
                # Share of ROWS, not levels, exactly as fit_vod reports it:
                # many rare levels folding together is harmless, a large
                # fraction of the sample losing its fixed effect is not. Without
                # this the "OTHER bucket stays small" property has to be
                # re-derived by hand to be checked at all.
                result["other_row_share"][col] = (
                    float((df[col] == "OTHER").mean()) if len(df) else 0.0
                )
        result["collapsed_units"] = collapsed
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model = smf.glm(
                formula, data=df, family=sm.families.Binomial(), var_weights=df["weight"]
            )
            # scale="X2" gives quasi-binomial standard errors, mirroring
            # fit_vod and the paper's quasibinomial family.
            fit = model.fit(scale="X2")
        result.update(
            coef=float(fit.params["obscured_view"]),
            se=float(fit.bse["obscured_view"]),
            p_value=float(fit.pvalues["obscured_view"]),
            odds_ratio=float(np.exp(fit.params["obscured_view"])),
            n=int(fit.nobs),
            converged=bool(fit.converged),
        )
        if abs(result["coef"]) > _DEGENERATE_BOUND or result["se"] > _DEGENERATE_BOUND:
            result["converged"] = False
            result["degenerate"] = True
            result["error"] = (
                f"Degenerate fit: |coef|={abs(result['coef']):.3g}, se={result['se']:.3g} "
                f"exceeds the plausible log-odds bound ({_DEGENERATE_BOUND:g})."
            )
    except Exception as exc:  # separation, singular design matrix, empty cells
        result["error"] = f"{type(exc).__name__}: {exc}"
    return result


# Factor controls in _FULL whose reference (modal) level predicted_probabilities
# holds fixed. clock_minutes is the one numeric control and is held at its mean.
_INTRARACIAL_FACTOR_CONTROLS = ("dow", "year", "police_area", "assigned_unit", "is_summer")


def predicted_probabilities(df: pd.DataFrame, outcome: str) -> dict:
    """Average predicted probability of ``outcome`` at daylight vs. dark.

    Numeric controls (clock_minutes) are held at their sample mean; factor
    controls are held at their modal (most common) level. obscured_view is
    then set to 0 (daylight) and 1 (dark) and the fitted model's predicted
    probabilities are reported as percentages.
    """
    formula = f"{outcome} ~ {_FULL}"
    df = df.copy()
    for col in _SPARSE_COLUMNS:
        if col in df.columns:
            df[col] = _collapse_sparse_levels(df[col], _MIN_UNIT_COUNT)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        model = smf.glm(
            formula, data=df, family=sm.families.Binomial(), var_weights=df["weight"]
        )
        fit = model.fit(scale="X2")

    row = {"clock_minutes": float(df["clock_minutes"].mean())}
    for col in _INTRARACIAL_FACTOR_CONTROLS:
        row[col] = df[col].mode().iloc[0]

    frame = pd.DataFrame([row, row]).reset_index(drop=True)
    frame["obscured_view"] = [0, 1]

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        preds = fit.predict(frame)

    return {
        "daylight": round(float(preds.iloc[0]) * 100, 1),
        "dark": round(float(preds.iloc[1]) * 100, 1),
    }
