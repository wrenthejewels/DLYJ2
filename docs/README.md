# Documentation Map

This file is the entrypoint for humans and LLMs starting a new session.

Project-level standing instructions live in:
- `AGENTS.md`

If there is any conflict between documents, use this precedence:

1. `v2_engine.js` and `app.js`
2. contract docs in `docs/`
3. the living working plan
4. the plain-speak build history
5. audit reports and review notes

## Read Order For New Sessions

Read these files in this order:

1. `AGENTS.md`
2. `docs/role_transformation_overhaul_plan.md`
3. `docs/v2_0_results_spec.md`
4. `docs/v2_0_questionnaire_spec.md`
5. `docs/data/role_transformation_contract.md`
6. `docs/data/task_role_graph_contract.md`
7. `docs/data/calibration_framework.md`
8. `docs/model_build_history.md`

Use `docs/data/schema_overview.md` when you need the data-layer map.
Use `docs/data/source_priority.md` when you need source precedence or fallback rules.
Use `docs/data/calibration_framework.md` when you need the empirical calibration / validation layer.

## What Each File Is For

### Current Source Of Truth

- `docs/role_transformation_overhaul_plan.md`
  - living working plan
  - current model state
  - current roadmap
  - next implementation targets
- `docs/v2_0_results_spec.md`
  - current engine output contract
  - current result/UI contract
- `docs/v2_0_questionnaire_spec.md`
  - current intake contract
  - current composition-editor contract
- `docs/data/role_transformation_contract.md`
  - current scoring-stack contract
  - current data/model layer description
- `docs/data/task_role_graph_contract.md`
  - current task-graph runtime contract
- `docs/data/schema_overview.md`
  - normalized data inventory
- `docs/data/source_priority.md`
  - evidence precedence and fallback logic
- `docs/data/calibration_framework.md`
  - empirical calibration and validation framework
  - non-runtime tuning and disagreement review

### Context, Not Canon

- `docs/model_build_history.md`
  - plain-speak evolution of the model
  - use for explanation, onboarding, and future writing
  - not the authoritative live spec

### Audit And Review Docs

These are useful, but they are not source-of-truth docs:

- `docs/data/*job_description_review_*.md`
- `docs/data/benchmark_validation_report.md`
- `docs/data/benchmark_disagreement_diagnostics.md`
- `docs/data/anthropic_2026_integration_report.md`
- `docs/data/launch_coverage.md`
- `docs/data/occupation_role_explanations.md`
- `docs/data/task_cluster_design.md`
- `docs/data/structural_calibration_report.md`

They should be treated as review artifacts, calibration notes, or design references unless one of the canonical docs explicitly promotes them.

## Maintenance Rule

When the model changes:

1. update `v2_engine.js`
2. update the relevant contract docs
3. update `docs/role_transformation_overhaul_plan.md`
4. update `docs/model_build_history.md` if the change is architecturally meaningful

Do not create a second top-level roadmap doc.
Do not create a second top-level “current state” doc.
If a temporary planning note becomes important, fold it back into the living working plan.
