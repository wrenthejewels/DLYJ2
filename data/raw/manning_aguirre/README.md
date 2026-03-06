# Manning Aguirre Raw Inputs

Planned raw files:
- occupation_exposure_extract
- adaptive_capacity_extract
- appendix_table_extract
- paper_metadata

This source is expected to provide occupation-level exposure and adaptive capacity priors for the selector and summary layers.

Current state:
- `manning_aguirre_2026_occupation_data.csv` is present as a manual partial extract from published paper tables.
- The paper does not publish O*NET-SOC codes directly; mapped codes in the extract should be treated as medium-confidence occupation priors.
- Published coverage is partial, so uncovered launch occupations should continue using non-Manning fallback priors until a fuller table or replication package is available.
