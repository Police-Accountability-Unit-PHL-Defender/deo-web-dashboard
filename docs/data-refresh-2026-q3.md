# 2026-Q3 data refresh

Source: `car_ped_stops_2026-10-23T00_53_17.zip`, produced by
[backup run 39880699569](https://github.com/Police-Accountability-Unit-PHL-Defender/odp-data-backups/actions/runs/39880699569).
The stop export ends October 3; shootings end October 21. All three archive
summaries identify Q3 as the latest complete quarter.

Rebuild with the command in the README, including the July 20 backup as
`--row-order-reference-zip` and the existing 2022 MVC correction archive.

Carto regenerated its record IDs and added `gdb_geomattr_data` between the
July and October archives. Comparing every 2014–2025 stop record, excluding
generated IDs and the added metadata, finds identical records. Sorting only
by the new IDs would nevertheless change which person is treated as a stop's
driver. The reference archive preserves the previous person order by matching
the shared data fields, while keeping all newly reported records.

Carto also changed shootings dates to text. The loader now explicitly parses
dates as UTC before applying its existing Philadelphia timezone conversion;
old timestamps and new date strings receive the same treatment.

Compared with production's Q2 cubes:

| Data | Result |
| --- | --- |
| Q3 traffic stops | 43,239 added |
| Q3 shootings | 206 added |
| All pre-2026 stops, reasons, and HIN cube cells | Unchanged |
| Q1 and Q2 stop counts, driver demographics, and enforcement measures | Unchanged |
| Q2 people in stopped vehicles | 52,824 → 52,861; 31 cube rows changed |
| Q2 locatable HIN records | 51,958 → 51,997; 16 cube rows changed |
| Q2 locatable records on the HIN | 31,487 → 31,510 |
| Fixed-window scalars | Unchanged |

The October archive includes a fresh 1,000-point HIN sample. Because its hash
uses the regenerated source IDs, the selected points differ from July even
though the underlying 2025 stop records are unchanged.

Validation includes SQLite integrity and quarter bounds, regression tests
for both date formats and regenerated IDs, the full pipeline and dashboard
unit suites, and all rendered-page, interaction, and load-budget checks.
