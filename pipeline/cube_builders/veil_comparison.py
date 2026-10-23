"""Main no-MVC comparison and its sensitivity fits, rebuilt from the same archive."""
import pandas as pd
from veil.sensitivity import comparison_bundle, fit_specs


def build(conn):
    try:
        stops = pd.read_sql("SELECT * FROM car_ped_stops_veil_comparison", conn)
        metadata = pd.read_sql("SELECT * FROM veil_comparison_metadata", conn).iloc[0]
    except Exception as exc:
        raise SystemExit("Prepare the comparison table first: python -m veil.sensitivity --zip data/<backup>.zip --db data/<db>.db") from exc
    results = list(fit_specs(stops, ["black_white", "all_races"], end_year=int(metadata.end_year)))
    return comparison_bundle(results, int(metadata.end_year), metadata.source_archive), {}
