# Data Layer

This directory holds the schema-first data contracts for the v2.0 model overhaul.

Structure:
- `raw/`: source mirrors or reduced extracts from upstream datasets.
- `normalized/`: model-facing CSVs consumed by future scoring logic.
- `crosswalks/`: ID and title mappings across taxonomies.
- `metadata/`: source registry and normalization notes.

Key normalized tables include:
- `occupations.csv`
- `occupation_aliases.csv`
- `occupation_tasks.csv`
- `occupation_task_clusters.csv`
- `occupation_exposure_priors.csv`
- `occupation_benchmark_scores.csv`
