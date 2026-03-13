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
9. `occupation_benchmark_source_scores.csv`
10. `task_benchmark_gpt4_labels.csv`
11. `ability_benchmark_scores.csv`
12. `occupation_quality_indicators.csv`
13. `occupation_labor_market_context.csv`

Current role-fate extension:
14. `occupation_task_inventory.csv` (live richer task contract)
15. `task_dependency_edges.csv` (live role-graph edges)
16. `occupation_task_role_profiles.csv` (live role-graph summaries)
17. `job_description_task_evidence.csv` (reviewed task-gap expansion evidence)
18. `task_source_evidence.csv` (source-specific task evidence contract)
19. `occupation_source_priors.csv` (source-specific occupation prior contract)
20. `role_functions.csv` (role summary and function anchors)
21. `occupation_function_map.csv` (occupation-to-function binding and guardrails)
22. `task_function_edges.csv` (task-to-function graph edges, including reviewed multi-anchor splits; now used by the live browser scorer as the baseline task-to-function graph)
23. `function_accountability_profiles.csv` (judgment, trust, liability, authority profiles)
24. `occupation_role_transformation.csv` (offline occupation-level audit/reference outputs from the broader transformation pipeline)
25. `occupation_role_explanations.csv` (offline occupation-level explanation summaries derived from the audit/reference outputs)
26. `occupation_structural_calibration_targets.csv` (non-runtime structural calibration targets comparing live model metrics to local BLS, quality-context, and adaptation-prior proxies, plus strength-aware review-layer recommendations for mismatch triage)

## Purpose of the normalized layer

This layer is designed so the live v2.x model can answer:
- what tasks are exposed
- which tasks define the role's value
- which tasks carry bargaining power
- which supporting tasks are indirectly at risk because they depend on exposed core work
- whether exposed tasks are more likely augmented or automated
- whether exposed tasks decouple cleanly from the residual role
- how viable the residual role remains
- how adaptable the worker is relative to transformed role states

Current live scoring note:
- `task_augmentation_automation_priors.csv` and `occupation_exposure_priors.csv` still provide the fallback baseline difficulty anchor in the browser scorer
- `task_source_evidence.csv` is now the runtime task-evidence resolver layer: it promotes live task evidence, reviewed task estimates, and benchmark task labels ahead of proxy fallback
- clusters with strong enough resolved task-evidence coverage can now shift their baseline difficulty toward task evidence before that baseline is projected onto task rows
- high-reliability task rows can now promote further into a task-first task baseline before residual evidence blending
- `task_exposure_evidence.csv` now primarily feeds the `live_task_evidence` tier inside that resolver and preserves Anthropic-specific observation metadata such as usage share
- task-level evidence rows continue to feed evidence confidence and `direct_coverage_ratio` even when they do not clear that threshold
- task-derived cluster summaries now drive the public cluster layer and the live wave trajectory
- `occupation_structural_calibration_targets.csv` is not a runtime input; it exists only for calibration, disagreement reporting, and tuning review

See `docs/data/task_role_graph_contract.md` for the first-step contract behind the role-fate redesign.
See `docs/data/role_transformation_contract.md` for the first-pass function and role-transformation layer.
See `docs/data/calibration_framework.md` for the empirical calibration scaffold.
