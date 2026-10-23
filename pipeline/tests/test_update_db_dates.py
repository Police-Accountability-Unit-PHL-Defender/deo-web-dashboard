import io
import zipfile

import pytest

from update_db_models import TableFromZip


@pytest.mark.parametrize("suffix", ["", "T00:00:00Z"])
def test_loader_accepts_text_dates_and_legacy_utc_timestamps(suffix):
    table = TableFromZip(
        name="shootings",
        dt_col="date_",
        dtype_dict={},
        district_col="dist",
        psa_col=None,
        processing_query="SELECT date__local FROM shootings ORDER BY id",
        regroupby_cols=None,
    )
    archive = io.BytesIO()
    filename = "csvs/shootings/shootings_date__year_2026.csv"
    with zipfile.ZipFile(archive, "w") as z:
        z.writestr(filename, f"date_,dist\n2026-01-01{suffix},12\n2026-07-01{suffix},12\n")
    with zipfile.ZipFile(archive) as z:
        result = table.process_csv_file(
            z,
            filename,
            zip_filename_override=None,
            most_recent_quarter_start_dt="2026-07-01",
            remap_districts=False,
        )
    assert result.date__local.tolist() == [
        "2025-12-31 19:00:00",
        "2026-06-30 20:00:00",
    ]
