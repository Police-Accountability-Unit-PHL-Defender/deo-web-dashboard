"""Count arrests only within intruded-upon stops, once per stop."""
import sqlite3

import pandas as pd

from update_db_models import CarPedStops


def test_arrests_during_intrusions_exclude_other_arrests_and_count_stops_once():
    rows = []
    # Two arrested people at one stop; arrest without intrusion;
    # intrusion without arrest; and a frisk-only stop with an arrest.
    for i, (stop, arrested, searched, frisked) in enumerate([
        (1, 1, 1, 0), (1, 1, 0, 0), (2, 1, 0, 0),
        (3, 0, 1, 0), (4, 1, 0, 1),
    ]):
        row = {name: None for name in CarPedStops.dtype_dict}
        row.update(id=i, datetimeoccur=f'2025-01-02T{stop + 12:02d}:00:00Z',
            datetimeoccur_local=f'2025-01-02 {stop + 7:02d}:00:00', location=f'Stop {stop}',
            stoptype='vehicle', districtoccur='12', psa='1', race='Black - Non-Latino',
            gender='Male', age=30, individual_arrested=arrested,
            individual_searched=searched, individual_frisked=frisked,
            vehicle_frisked=0, vehicle_searched=0,
            individual_contraband=0, vehicle_contraband=0)
        rows.append(row)
    with sqlite3.connect(':memory:') as conn:
        pd.DataFrame(rows).to_sql('car_ped_stops', conn, index=False)
        result = pd.read_sql(CarPedStops.get_processing_query('2025-10-01'), conn)
    assert result.n_stopped.sum() == 4
    assert result.n_intruded.sum() == 3
    assert result.n_arrested.sum() == 3
    assert result.n_arrested_intruded.sum() == 2
