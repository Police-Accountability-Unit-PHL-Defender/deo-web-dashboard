# Static inputs and where they come from

Every file here is vendored from an external source. This records what each one
is, how to refresh it, and what reads it — so a future update does not have to
reverse-engineer provenance from code comments.

## maps/hin_2025.geojson — 162 High Injury Network street segments
- Source: [ODP Vision Zero High Injury Network](https://opendataphilly.org/datasets/vision-zero-high-injury-network/)
- Refresh: `curl -L -o maps/hin_2025.geojson "https://hub.arcgis.com/api/v3/datasets/7e416319784a463fa0d8b528d7ccf511_0/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1"`
- Read by: `cube_builders/safety.py` (HIN map features)
- Verified 2026-08-09: download matches the vendored file exactly.
- Also mirrored as Carto table `high_injury_network_2025`, which is what
  `odp-data-backups` joins against when computing stop-to-HIN distance.

## maps/police_districts.geojson — 21 police districts
- Source: [ODP Police Districts](https://opendataphilly.org/datasets/police-districts/)
- Refresh: `curl -L -o maps/police_districts.geojson "https://opendata.arcgis.com/datasets/62ec63afb8824a15953399b1fa819df2_0.geojson"`
- Read by: `cube_builders/safety.py` (district choropleths)
- Also mirrored as Carto table `police_districts` (21 rows).

## maps/police_psas.geojson — 65 police service areas
- Source: [ODP Police Service Areas](https://opendataphilly.org/datasets/police-service-areas/), maintainer publicsafetygis@phila.gov
- Refresh: `curl -L -o maps/police_psas.geojson "https://hub.arcgis.com/api/v3/datasets/8dc58605f9dd484295c7d065694cdc0f_0/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1"`
- Read by: `update_db_models.py` (`find_new_psa`, assigning a PSA to each stop)
- **Schema drift:** the vendored copy is an older export with 12 legacy
  shapefile attributes (`PSA_NUM`, `PSACOV_`, `OLD_SECTOR`, `DESCRIPT`, …).
  Current downloads carry 7 lowercase fields (`psa_num`, `dist_numc`, …).
  The 65 `psa_num` values are identical, so a refresh is safe; `find_new_psa`
  matches the field case-insensitively for exactly this reason.

## data/demographics/police_service_area.csv — 2020 Census population by PSA
- Source: [ssuffian/censusify-philly](https://github.com/ssuffian/censusify-philly), `csvs/police_service_area.csv`
- Refresh (note: the upstream README names a `generate_csvs.py` that does not exist):
  ```bash
  git clone https://github.com/ssuffian/censusify-philly && cd censusify-philly
  CENSUS_API_KEY=<key from census.gov> \
    poetry run python src/censusify_philly/police_geographies.py download-raw
  poetry run python src/censusify_philly/police_geographies.py generate-csvs
  cp csvs/police_service_area.csv ../pipeline/data/demographics/
  ```
- Read by: `build_districts.py` at build time, plus one hand-maintained artifact:
  - `public/cubes/districts.json` — PSA rows aggregated to district, with
    `total`, `white`, `black` and `whiteness`. Regenerate with
    `uv run python build_districts.py`. Verified: PSAs 011 + 012 sum to
    district 01's total 38405 / white 20664 / 53.8%.
  - `POPULATION_BY_RACE` in `utils/snapshot.ts` — the five citywide totals.
    Still hand-maintained; update it by hand if this CSV changes.
- Verified 2026-08-09: byte-identical to upstream.

## data/demographics/police_geographies.csv — PSA/district/division crosswalk
- Source: `censusify-philly`'s `seed.py`, joining the ODP PSA and district files.
- Read by: nothing after the 2026-08 prune. Retained as provenance.

## Retired
Removed in the 2026-08 prune; recorded here so their origin survives.
- `hin_2020.geojson` — 241 segments, Carto `high_injury_network_2020`. Refresh:
  `https://phl.carto.com/api/v2/sql?filename=high_injury_network_2020&format=geojson&skipfields=cartodb_id&q=SELECT+*+FROM+high_injury_network_2020`.
  Used only by the deleted Dash HIN map. Note `odp-data-backups` still joins
  against the Carto table for stop-years up to 2018.
- `police_psas_old.geojson` — superseded by `police_psas.geojson`; no reader.
