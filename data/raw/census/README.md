# Census Raw Inputs

Current API-backed sources:
- `2024 ACS 1-year PUMS`

Current use:
- `scripts/data/normalize_acs_pums.py` queries the official Census API directly for the launch occupations
- the script writes `data/normalized/occupation_heterogeneity_context.csv`
- the script also writes `data/normalized/occupation_industry_mix.csv`
- the script also writes `data/normalized/occupation_btos_sector_mix.csv`
- those normalized ACS tables are calibration-only and currently support the role-heterogeneity / fragmentation check plus the BTOS adoption-context join path

No bulk ACS raw extract is checked into the repo for this layer.
The calibration script summarizes the official API response directly into the normalized table.

Current BTOS use:
- `BTOS`
  - `scripts/data/normalize_btos.py` reads the official `AI_Supplement_Table.xlsx` download directly
  - the script writes `data/normalized/industry_ai_adoption_context.csv`
  - that normalized BTOS table is calibration-only and currently supports the adoption-context check in `scripts/data/run_structural_calibration_report.js`
  - current join path: BTOS industry context -> `occupation_btos_sector_mix.csv` -> occupation-level adoption-context calibration
