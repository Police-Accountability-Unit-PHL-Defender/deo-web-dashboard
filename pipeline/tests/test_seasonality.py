"""Tests for the Knode et al. (2024) seasonality weight.

Formula from supplemental S.2 of Knode, Wolfe & Carter (2024), Criminology
62(3): W = p(1-p), where p is the proportion of the inter-twilight window
spent in daylight, plus a constant floor equal to the mean of those weights.
"""

import datetime as dt

import pandas as pd
import pytest

from veil.seasonality import daylight_proportion, quadratic_weights


def _sun(rows):
    return pd.DataFrame(
        [
            {
                "date": pd.Timestamp(d),
                "sunset_local": pd.Timestamp(f"{d} {sunset}"),
                "dusk_local": pd.Timestamp(f"{d} {dusk}"),
            }
            for d, sunset, dusk in rows
        ]
    )


WINDOW = (dt.time(17, 8), dt.time(20, 35))


def test_midsummer_window_is_entirely_daylight():
    # Sunset after the window closes: every minute of the window is daylight.
    p = daylight_proportion(_sun([("2025-06-21", "20:34", "21:10")]), *WINDOW)
    assert p.iloc[0] == pytest.approx(1.0)


def test_midwinter_window_is_entirely_dark():
    # Dusk before the window opens: no daylight minutes inside it.
    p = daylight_proportion(_sun([("2025-12-21", "16:38", "17:07")]), *WINDOW)
    assert p.iloc[0] == pytest.approx(0.0)


def test_balanced_day_is_about_half_daylight():
    # Balanced under the sourced daylight/(daylight+dark) definition: the
    # ~29-minute twilight gap (sunset to dusk) is excluded from the
    # denominator, so a truly balanced day needs sunset-start == end-dusk,
    # not sunset at the window's raw arithmetic midpoint (that erodes the
    # dark side by the twilight gap and skews p to ~0.58).
    p = daylight_proportion(_sun([("2025-10-03", "18:37", "19:06")]), *WINDOW)
    assert p.iloc[0] == pytest.approx(0.5, abs=0.02)


def test_weights_peak_at_balance_and_bottom_at_the_extremes():
    p = pd.Series([0.0, 0.5, 1.0])
    w = quadratic_weights(p)
    assert w.iloc[1] > w.iloc[0]
    assert w.iloc[1] > w.iloc[2]
    assert w.iloc[0] == pytest.approx(w.iloc[2])


def test_weights_are_symmetric_about_a_half():
    # The authors' stated aim: probabilities equally far above and below
    # random chance are weighted the same.
    w = quadratic_weights(pd.Series([0.3, 0.7]))
    assert w.iloc[0] == pytest.approx(w.iloc[1])


def test_floor_is_the_mean_raw_weight_so_nothing_is_zeroed():
    p = pd.Series([0.0, 0.5, 1.0])
    raw = p * (1 - p)
    w = quadratic_weights(p)
    assert (w > 0).all(), "a zero weight would drop those stops entirely"
    assert w.iloc[0] == pytest.approx(raw.mean())
    assert w.iloc[1] == pytest.approx(0.25 + raw.mean())


def test_uses_p_times_one_minus_p_not_the_four_times_variant():
    # 1-(2p-1)^2 is exactly 4x p(1-p). Same shape, different scale, and the
    # scale reaches the standard errors through the dispersion parameter.
    w = quadratic_weights(pd.Series([0.5]))
    raw_mean = 0.25
    assert w.iloc[0] == pytest.approx(0.25 + raw_mean)
