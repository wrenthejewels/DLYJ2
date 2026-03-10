# Schema Overview

## Directory model

- `data/raw/`: external source mirrors or reduced extracts.
- `data/normalized/`: model-facing CSVs joined by canonical IDs.
- `data/crosswalks/`: mappings across occupation taxonomies.
- `data/metadata/`: provenance and normalization policy.

## Canonical keys

- `occupation_id`: stable internal occupation key
- `task_id`: stable internal task key
- `onet_soc_code`: canonical external occupation code for US-first launch
- `task_cluster_id`: stable reduced-task taxonomy key
- `source_id`: provenance key from `source_registry.yaml`

## Primary normalized joins

Core join path:
1. `occupations.csv`
2. `occupation_selector_index.csv`
3. `occupation_tasks.csv`
4. `occupation_task_clusters.csv`
5. `task_augmentation_automation_priors.csv`
6. `occupation_exposure_priors.csv`
7. `occupation_adaptation_priors.csv`
8. `occupation_benchmark_scores.csv`
9. `occupation_quality_indicators.csv`
10. `occupation_labor_market_context.csv`

Next role-fate extension:
11. `occupation_task_inventory.csv` (scaffolded richer task contract)
12. `task_dependency_edges.csv` (scaffolded role-graph edges)
13. `occupation_task_role_profiles.csv` (scaffolded role-graph summaries)

## Purpose of the normalized layer

This layer is designed so the future v2.0 model can answer:
- what tasks are exposed
- which tasks define the role's value
- which tasks carry bargaining power
- which supporting tasks are indirectly at risk because they depend on exposed core work
- whether exposed tasks are more likely augmented or automated
- whether exposed tasks decouple cleanly from the residual role
- how viable the residual role remains
- how adaptable the worker is relative to transformed role states

See `docs/data/task_role_graph_contract.md` for the first-step contract behind the role-fate redesign.
