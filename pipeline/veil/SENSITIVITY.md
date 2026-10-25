# MVC and occupancy sensitivity

The public main result at `/snapshot#veil-of-darkness` uses adult non-Latino Black/white
sole-occupant vehicle stops without requiring a recorded MVC code. The direct
darkness × post-law interaction interval determines the significance headline;
the period-specific confidence intervals do not test the change between periods.
All sixteen specifications, annual results, subgroup results, district analyses,
and methods remain available at `/veil-sensitivity`. The main result is embedded in
Snapshot without a methods link; `/veil-of-darkness` redirects there. A paginated
methods report with findings and a technical handoff is generated from the cubes
by `scripts/build-veil-methods-pdf.py` into
`output/pdf/veil-of-darkness-methods.pdf`.

Quarterly `npm run update-data` now prepares all three veil analytic tables and
publishes both `veil.json` and `veil-comparison.json`. The main comparison and
sensitivities extend through the last full local calendar year supported by the
archive's `summary.json`, rather than today's clock. Legacy supporting annual
analyses retain their stated 2014–2025 window. Preparing and fitting the veil
models adds time to the quarterly update; the sixteen comparison fits currently
take several minutes each.

To rebuild only the comparison after preparing the main database, from `pipeline/`:

```bash
uv run python -m veil.sensitivity --zip data/<backup>.zip --db data/<database>.db
uv run python build_cubes.py --db data/<database>.db --only veil-comparison
```

The research command below can resume individual fits independently of the
quarterly build. Its report JSON is not the website's cube.

Run from `pipeline/`:

```bash
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 .venv/bin/python -m veil.sensitivity \
  --zip data/car_ped_stops_2026-07-20T03_45_06.zip --all-races
```

This experiment writes `reports/veil-sensitivity.json`; it does not change the
published cube or page. The `/tmp/deo-veil-sensitivity.pkl` cache contains derived
stop records from the named archive. Delete the result JSON to refit all models;
the script resumes completed keys otherwise. Use a separate `--out` when changing
the source archive so results from different vintages cannot mix.

The sixteen specifications cross two race universes, two MVC rules, and four
occupancy/outcome choices:

- Only non-Latino Black/white occupants, or all recorded racial categories.
- A recorded MVC code on at least one person, or every vehicle stop regardless
  of code. The literal `NA` is a recorded code, not a blank.
- Sole occupant, or any occupancy with anyone Black, more than half Black, or
  everyone Black. A 50/50 stop is retained with `majority_black = 0`.

**Black always means the non-Latino Black category used in the current chart.**
In the all-races universe, the reference is all stops that fail the chosen rule;
it is not a white-only reference.

Every stop counts once. All recorded people must have age 18+ and a recorded
Male/Female gender and race, preserving the current demographic completeness
rules when extending to multiple occupants. Officer assignment must be present.
There is no arrest exclusion. Person duplicates are removed by `objectid`.
Occupancy is inferred from records sharing UTC timestamp and location; the export
does not reliably distinguish driver from passenger or identify every person
physically inside a vehicle. Nearby unrelated stops can also be grouped together.
These outcomes describe recorded stop composition, not driver race or individual
stop risk.

Other choices match the public pre/post model: currently 2014–2019 and 2021–2025, the shared
evening comparison window, the sunset-to-dusk exclusion, 21 residential districts,
seasonality weights, and controls for clock time, weekday, year, police service
area, officer assignment, and summer. One darkness × post-law interaction model
produces both period effects and a direct test of their difference, standardized
over the same rows. The policy split uses the local date March 3, 2022.

The published reference is separately refitted from the existing analytic table.
The experimental sole-occupant Black/white model with MVC filtering has a small
additional difference: it groups vehicle records only. The published builder
groups vehicle and pedestrian records together before inferring sole occupancy.
862 additional qualifying vehicle stops become sole-occupant observations once
coincident pedestrian records are excluded; one observation in the published
sample is lost under the vehicle-only grouping. The net difference
is 861 stops (468,478 versus 467,617). The period effects move by less than 0.02
points. All experimental specifications use the same explicit vehicle definition,
so their MVC and occupancy comparisons do not vary this cleanup.

Sensitivity to a rule does not by itself identify the preferable rule or establish
a causal effect of the law.
