# Data Scripts

This directory contains the active source ingestion, normalization, comparison, and rebuild scripts for the live data/model pipeline.

Current script categories:
- fetch raw sources
- seed launch stubs from metadata
- build pilot job-description task evidence
- normalize O*NET raw exports
- normalize BLS labor extracts
- normalize BLS unemployment by occupation group
- normalize BLS ORS structural context
- normalize ACS PUMS occupation heterogeneity context
- derive ACS occupation-industry mix for downstream BTOS joins
- normalize Anthropic task evidence
- normalize AIOE benchmark extracts
- compare Anthropic release outputs before promoting a new release into the live priors
- compare benchmark-only sources against the live exposure prior
- diagnose large benchmark disagreements before any source-promotion decision
- rebuild launch occupation priors from O*NET, Anthropic, and BLS
- infer task clusters from O*NET task text
- build seeded task role-graph contracts from normalized task rows
- build role-function anchors and accountability profiles
- build source-comparison contracts across task and occupation layers
- build first-pass role-transformation outputs
- apply reviewed pilot calibration overrides for role-transformation outputs
- rebuild the role-transformation stack end to end
- normalize O*NET files
- normalize Anthropic Economic Index files
- normalize AIOE benchmark files
- normalize GPTs-are-GPTs benchmark files
- build selector index
- validate normalized joins
- generate structural calibration targets and reports from non-runtime BLS / quality-context / adaptation inputs, including strength-aware review-layer recommendations
- generate ORS-backed structural calibration targets and reports from non-runtime BLS / quality-context / adaptation inputs, including strength-aware review-layer recommendations
- generate ORS- and ACS-backed structural calibration targets and reports from non-runtime BLS, Census, quality-context, and adaptation inputs, including strength-aware review-layer recommendations

Planned next script families:
- normalize `BTOS` industry AI-adoption context for calibration-only joins
- perform a controlled `O*NET 30.2` refresh after schema review rather than as an incidental source bump

Current official calibration script:
- `normalize_ors.py`
  - reads official BLS ORS `2025` preliminary and `2023` backstop workbooks
  - maps launch occupations onto BLS SOC codes
  - writes `data/normalized/occupation_ors_structural_context.csv`
  - this table is calibration-only and currently feeds the human-guardrail check in `run_structural_calibration_report.js`
- `normalize_acs_pums.py`
  - queries the official Census `2024 ACS 1-year PUMS` API for the launch occupations
  - writes `data/normalized/occupation_heterogeneity_context.csv`
  - writes `data/normalized/occupation_industry_mix.csv`
  - this table is calibration-only and currently feeds the role-heterogeneity / fragmentation check in `run_structural_calibration_report.js`
