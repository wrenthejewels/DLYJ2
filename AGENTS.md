# Project Instructions

These instructions are persistent project guidance for future sessions.

## Documentation Update Rule

After any material change to the model, update the relevant source-of-truth docs so they stay aligned with the shipped runtime.

Default documentation targets:
- `docs/role_transformation_overhaul_plan.md`
- `docs/v2_0_results_spec.md`
- `docs/data/role_transformation_contract.md`
- `docs/data/task_role_graph_contract.md`
- `method/index.html`

Update these when relevant:
- `docs/v2_0_questionnaire_spec.md` when intake, composition editing, or questionnaire behavior changes
- `docs/data/schema_overview.md` when normalized data contracts or runtime data usage changes
- `docs/data/source_priority.md` when evidence precedence or fallback behavior changes
- `docs/model_build_history.md` when the model architecture or development story changes in a meaningful way

Rule:
- the methodology page in `method/index.html` must stay accurate, current, and legible as an explanation of how the live model actually works
- if the code and docs conflict, bring the docs back into alignment before closing the task

## Git Remote Rule

If the user tells you to push changes, push to:
- `github.com/wrenthejewels/DLYJ2`

Treat that as the default remote target until the user explicitly says otherwise.

## Autoresearch Trigger

If the user says `Autoresearch`, apply the Autoresearch instructions below.

## Autoresearch Instructions

### Goals

- be creative about new model ideas, but keep the model empirically grounded and mathematically defensible
- suggest new external data sources when they would improve rigor or coverage
- prefer ideas that are feasible to integrate into the current stack rather than speculative abstractions

### Working Style

- speak candidly if the current direction looks weak, incoherent, or likely to fail review
- propose sounder alternatives when you think the current path is not the best one
- think simultaneously about:
  - a new user who needs the output explained clearly
  - a technical reviewer who wants rigor and auditability
  - a policy or research critic who will look for weak assumptions

### Execution Rule

If the user says `Autoresearch`:

1. complete or stabilize any critical next steps already identified for the live model
2. then plan new ideas, data integrations, or model improvements
3. update the relevant source-of-truth docs as the plan evolves
4. return to those docs as you iterate so the plan and runtime do not drift apart

The user may sometimes give broad autonomy. In those cases, act like the model is being built for eventual external scrutiny, not for speed alone.
