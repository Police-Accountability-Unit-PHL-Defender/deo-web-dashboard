"""Sun-time tests.

This component silently produced a 12-hour error during exploration (the
J2000 epoch is noon, not midnight), so the known-good values below are
pinned against published Philadelphia almanac times.
"""

import datetime as dt

import pytest

from veil.sun import inter_twilight_window, load_sun_times


@pytest.fixture(scope="module")
def sun_df():
    return load_sun_times()


@pytest.mark.parametrize(
    "date,expected_sunset",
    [
        (dt.date(2025, 6, 21), dt.time(20, 32)),
        (dt.date(2025, 12, 21), dt.time(16, 38)),
        (dt.date(2025, 3, 20), dt.time(19, 12)),
        (dt.date(2025, 11, 2), dt.time(16, 57)),
    ],
)
def test_sunset_matches_almanac(sun_df, date, expected_sunset):
    row = sun_df[sun_df.stop_date == date].iloc[0]
    actual = row.sunset_local.time()
    minutes = abs(
        (actual.hour * 60 + actual.minute) - (expected_sunset.hour * 60 + expected_sunset.minute)
    )
    assert minutes <= 2, f"{date}: got {actual}, expected ~{expected_sunset}"


def test_dusk_is_after_sunset_by_about_half_an_hour(sun_df):
    delta = (sun_df.dusk_local - sun_df.sunset_local).dt.total_seconds() / 60
    assert delta.min() > 20, f"min gap {delta.min()} min"
    assert delta.max() < 45, f"max gap {delta.max()} min"


def test_inter_twilight_window(sun_df):
    earliest_dusk, latest_sunset = inter_twilight_window(sun_df)
    assert earliest_dusk == dt.time(17, 5), earliest_dusk
    assert latest_sunset == dt.time(20, 33), latest_sunset


def test_covers_the_data_range(sun_df):
    assert sun_df.stop_date.min() <= dt.date(2014, 1, 1)
    assert sun_df.stop_date.max() >= dt.date(2026, 12, 31)
