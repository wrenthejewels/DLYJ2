# Census Raw Inputs

Current API-backed sources:
- `2024 ACS 1-year PUMS`

Current use:
- `scripts/data/normalize_acs_pums.py` queries the official Census API directly for the launch occupations
- the script writes `data/normalized/occupation_heterogeneity_context.csv`
- the script also writes `data/normalized/occupation_industry_mix.csv`
- that normalized ACS table is calibration-only and currently supports the role-heterogeneity / fragmentation check

No bulk ACS raw extract is checked into the repo for this layer.
The calibration script summarizes the official API response directly into the normalized table.

Next planned Census source:
- `BTOS`
  - intended use: calibration-only adoption context by industry
  - intended join path: BTOS industry context -> `occupation_industry_mix.csv` -> occupation-level adoption-context calibration
