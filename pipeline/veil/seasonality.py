"""Knode et al. (2024) seasonality weights for veil-of-darkness models.

Knode, Wolfe & Carter (2024), Criminology 62(3), 364-375,
doi.org/10.1111/1745-9125.12366, supplemental S.2.

Traffic stops in an inter-twilight window are not evenly split between
daylight and darkness across the year: a December window is entirely dark, a
July one entirely light. Any group that drives more in one season than
another is then over-represented in one lighting condition for reasons that
have nothing to do with policing. The weight leans on dates where daylight
and darkness are closest to an even split, because those are the dates where
lighting is closest to random.

`p` is measured WITHIN the inter-twilight window, not across the whole day.
The supplemental's prose says "in a day", but the authors report 25,926 stops
carrying a weight of exactly zero -- impossible for a whole-day proportion at
these latitudes, and routine for a window-scoped one (every December date).
"""

import datetime as dt

import pandas as pd


def _minutes(t: dt.time) -> int:
    return t.hour * 60 + t.minute


def daylight_proportion(
    sun: pd.DataFrame, window_start: dt.time, window_end: dt.time
) -> pd.Series:
    """Share of the inter-twilight window spent in daylight, per date.

    Daylight runs until sunset; darkness starts at dusk. The ambiguous
    minutes between them are excluded from the model sample entirely, so the
    denominator here is daylight + darkness, not the whole window.
    """
    start, end = _minutes(window_start), _minutes(window_end)
    sunset = sun.sunset_local.dt.hour * 60 + sun.sunset_local.dt.minute
    dusk = sun.dusk_local.dt.hour * 60 + sun.dusk_local.dt.minute

    daylight = (sunset.clip(lower=start, upper=end) - start).clip(lower=0)
    dark = (end - dusk.clip(lower=start, upper=end)).clip(lower=0)

    total = daylight + dark
    p = (daylight / total).where(total > 0, 0.0)

    # The real table from veil.sun.load_sun_times names its date column
    # `stop_date` (object dtype holding datetime.date, not Timestamp). There
    # is no `date` column in real data -- a previous version of this
    # function checked for one and silently fell back to sun.index (a
    # positional RangeIndex) when it wasn't found, which joins to nothing
    # downstream. Fail loudly instead of guessing.
    if "stop_date" not in sun.columns:
        raise ValueError(
            "sun frame has no 'stop_date' column to index by "
            f"(got columns: {list(sun.columns)})"
        )

    # Normalise to pd.Timestamp (not datetime.date) so a later .map()/join
    # against other date-keyed series -- which in this codebase are
    # Timestamps, e.g. sunset_local/dusk_local -- matches exactly. Mixing
    # date and Timestamp objects as index labels compares unequal even for
    # the "same" calendar day, which would silently drop or duplicate rows
    # rather than raise.
    p.index = pd.to_datetime(sun.stop_date)
    return p


def quadratic_weights(p: pd.Series) -> pd.Series:
    """W = p(1-p), floored by adding the mean of those raw weights.

    The floor is the authors' own device, to stop dates whose window is
    wholly light or wholly dark from being dropped outright. It is the mean
    of OUR raw weights -- their .087 is Lansing's.
    """
    raw = p * (1 - p)
    return raw + raw.mean()
