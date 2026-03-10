# Role Transformation Contract

## Purpose

This document defines the first-pass normalized layer that sits above task exposure.

It makes the model answer not only:
- what tasks are exposed

But also:
- what function the role serves
- which tasks matter most to that function
- what accountability still stays with a human
- how likely the role is to compress, fragment, delegate, or retain its core

## New normalized files

### `job_description_task_evidence.csv`

Reviewed public-posting task-gap expansion layer.

Use it to:
- store non-O*NET task evidence for launch roles
- preserve provenance for manually reviewed task additions
- feed new tasks into the richer task inventory

Current coverage:
- all `34` modeled occupations now have reviewed posting-backed task-gap additions

### `task_source_evidence.csv`

Source-specific task evidence contract.

Each row preserves one task and one source view with:
- normalized exposure
- normalized augmentation
- normalized automation
- evidence weight
- confidence
- promotion status

Current source roles:
- `live_task_evidence`
- `reviewed_task_estimate`
- `benchmark_task_label`
- `cluster_prior_proxy`
- `fallback_task_proxy`

Current rule:
- cluster and fallback proxies remain visible, but they are now down-weighted when stronger task-level evidence already exists for the same task

### `occupation_source_priors.csv`

Source-specific occupation prior contract.

Use it to compare:
- live aggregate priors
- benchmark percentiles
- benchmark bundle summaries

This is the occupation-level comparison layer that keeps benchmarks visible without forcing them into the live task layer too early.

### `role_functions.csv`

Stores role summary and function anchors.

Current first pass:
- one primary function anchor for every launch occupation
- reviewed supplemental anchors for a targeted multi-anchor subset where one function anchor was too reductive
- role-family defaults for broad coverage
- occupation-specific overrides for function-sensitive roles

### `occupation_function_map.csv`

Binds each occupation to its function anchors and stores a `delegability_guardrail`.

Interpretation:
- higher guardrail means exposed tasks are less likely to eliminate the role outright because judgment, trust, authority, or liability still matter

### `task_function_edges.csv`

Maps every normalized task to one or more occupation function anchors.

Key fields:
- `task_to_function_weight`
- `accountability_weight`
- `judgment_requirement`
- `trust_requirement`
- `regulatory_liability_weight`
- `human_authority_requirement`

This is the bridge between flat task exposure and role-level function retention.

Current behavior:
- tasks can now bind to more than one function anchor where a reviewed split is warranted
- the scorer uses both the task-to-function edge weights and the occupation-level function weights when aggregating function pressure

### `function_accountability_profiles.csv`

Stores function-level accountability and institutional burden.

Use it to represent:
- who the role serves
- what the role is accountable for
- how much judgment, trust, liability, and authority remain human-owned

### `occupation_role_transformation.csv`

First-pass role-fate output.

Current metrics:
- `direct_task_pressure`
- `indirect_dependency_pressure`
- `function_exposure_pressure`
- `retained_function_strength`
- `retained_accountability_strength`
- `retained_bargaining_power`
- `role_fragmentation_risk`
- `role_compressibility`
- `demand_expansion_signal`
- `delegation_likelihood`
- `headcount_displacement_risk`
- `role_transformation_type`

### `occupation_role_explanations.csv`

Derived explanation layer for each occupation-level transformation output.

Use it to surface:
- the strongest pressure signals
- the strongest retained counterweight
- the current function-anchor mix
- the current evidence mix
- which occupations should be reviewed next because proxy dependence is still high

### `pilot_role_transformation_calibration.csv`

Stores reviewed occupation-level calibration adjustments for the reviewed set.

Use it to apply explicit, auditable changes where reviewed role logic still differs from first-pass outputs.

Current reviewed use:
- preserve stronger authority/accountability guardrails for lawyers
- promote data scientists toward augmented-core interpretation
- preserve recommendation/adoption value for management analysts
- increase recomposition pressure for technical writers
- preserve relationship and commitment work for sales representatives
- increase compression/displacement pressure for bookkeeping and clerical support roles
- preserve executive assistants as the higher-context admin contrast
- preserve project-management ownership, escalation handling, and client coordination
- preserve follow-through and judgment for broad business operations work
- increase compression pressure for customer support while keeping residual service ownership
- preserve more residual control value for accountants than for generic clerical finance support
- place paralegals under stronger recomposition pressure than attorney roles
- preserve trust, policy judgment, and manager coaching value in HR work
- preserve learning-program ownership while allowing stronger content-production recomposition
- increase direct tooling pressure for marketing analysis and marketing operations work
- preserve requirements and integration ownership for systems analysts
- preserve core engineering ownership for software developers despite higher exposure
- preserve operating ownership and resource decisions for operations managers
- preserve tradeoff judgment for finance-analysis work
- preserve decision interpretation in operations-research roles despite high modeling exposure
- preserve web-platform ownership while raising tooling pressure for web development work
- raise generation pressure for graphic-design execution while preserving brand direction
- raise generation pressure and recomposition for writers and authors
- preserve relationship and revenue ownership for advertising-oriented sales work
- preserve compliance authority, liability, and escalation ownership
- preserve supply coordination and tradeoff value in logistics work
- preserve technical ownership in electronics and mechanical engineering
- raise recomposition pressure for journalism while preserving reporting judgment
- preserve reputation and relationship coordination in public-relations work
- preserve editorial gatekeeping and quality-control value for editors
- increase compressibility pressure for statistical assistants relative to analyst roles

## Current scoring rule

The current stack now works like this:

1. Start with the richer task inventory.
2. Attach all available source-specific task evidence.
3. Aggregate direct task pressure per task.
4. Add indirect pressure through dependency edges.
5. Weight each task by how much it supports the role's function or functions.
6. Preserve human guardrails through accountability, trust, liability, and authority.
7. Produce role-transformation outputs instead of stopping at exposure.
8. Apply reviewed calibration overrides only where a manual review pass has explicitly justified them.

## Current limitations

- Job-description evidence now covers all `34` modeled occupations.
- Multi-anchor function coverage exists only for a reviewed subset of occupations.
- The transformation output is still a first-pass model and still depends on role-family defaults, benchmark floors, and cluster-prior proxies under the reviewed overrides.
- The new explanation layer is still review-facing; it is not yet surfaced directly in the end-user product.
- The live questionnaire layer still reflects an older friction-oriented runtime design and has not yet been fully reworked to map onto the new role-function model.
