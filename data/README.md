# Data Layer

This directory holds the schema-first data contracts for the v2.0 model overhaul.

Structure:
- `raw/`: source mirrors or reduced extracts from upstream datasets.
- `normalized/`: model-facing CSVs consumed by the live scoring logic and rebuild pipeline.
- `crosswalks/`: ID and title mappings across taxonomies.
- `metadata/`: source registry and normalization notes.

Key normalized tables include:
- `occupations.csv`
- `occupation_aliases.csv`
- `occupation_tasks.csv`
- `job_description_task_evidence.csv`
- `occupation_task_clusters.csv`
- `occupation_task_inventory.csv`
- `task_dependency_edges.csv`
- `role_functions.csv`
- `task_function_edges.csv`
- `task_source_evidence.csv`
- `occupation_exposure_priors.csv`
- `occupation_source_priors.csv`
- `occupation_benchmark_scores.csv`
- `occupation_benchmark_source_scores.csv`
- `task_benchmark_gpt4_labels.csv`
- `ability_benchmark_scores.csv`
- `occupation_role_transformation.csv`

Key review metadata includes:
- `job_description_review_sources.csv`
- `pilot_role_transformation_calibration.csv`
