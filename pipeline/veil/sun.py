"""Load committed Philadelphia sun times and derive the inter-twilight window.

The window is the interval between the earliest civil dusk and the latest
sunset across the year -- the only span in which a given clock time is
sometimes light and sometimes dark. That overlap is what the
veil-of-darkness test compares.
"""

import datetime as dt
from pathlib import Path

import pandas as pd

DEFAULT_PATH = Path(__file__).resolve().parents[1] / "data" / "philadelphia_sun_times.csv"


def load_sun_times(path: Path | None = None) -> pd.DataFrame:
    df = pd.read_csv(path or DEFAULT_PATH)
    df["stop_date"] = pd.to_datetime(df["stop_date"]).dt.date
    df["sunset_local"] = pd.to_datetime(df["sunset_local"])
    df["dusk_local"] = pd.to_datetime(df["dusk_local"])
    return df


def inter_twilight_window(df: pd.DataFrame) -> tuple[dt.time, dt.time]:
    """Return (earliest civil dusk, latest sunset), truncated to the minute."""
    earliest_dusk = df.dusk_local.dt.time.min()
    latest_sunset = df.sunset_local.dt.time.max()
    return (
        dt.time(earliest_dusk.hour, earliest_dusk.minute),
        dt.time(latest_sunset.hour, latest_sunset.minute),
    )
