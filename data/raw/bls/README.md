# BLS Raw Inputs

Current raw files:
- `ors_2025_complete_dataset.xlsx`
- `ors_2023_complete_dataset.xlsx`

Planned/remaining raw files:
- oews_may_2024_extract
- occupational_projections_2024_2034_extract
- crosswalk_notes

Current use:
- the ORS workbooks feed `scripts/data/normalize_ors.py`, which generates `data/normalized/occupation_ors_structural_context.csv`
- that normalized ORS table is calibration-only and currently supports the human-guardrail structural check

These files provide employment, wage, openings, projection, and structural work-requirement context for calibration and labor market interpretation.
