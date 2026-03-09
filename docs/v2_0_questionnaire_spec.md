# V2.0 Questionnaire Specification

## Purpose

This document defines the intended questionnaire structure for `2.0`.

It should be read together with:
- `docs/v2_0_release_plan.md`
- `docs/v2_0_results_spec.md`

The goal is not to preserve the current `1.0` questionnaire exactly.
The goal is to preserve the useful signal from the current intake while remapping it into the `2.0` transformation model.

## Core Design Principle

The `1.0` questionnaire was designed to estimate:
- technical capability transfer
- hazard timing
- implementation delay
- compression risk
- re-employment

The `2.0` questionnaire should instead estimate:
- occupation anchoring
- task composition
- exposure-relevant task properties
- coupling / decoupling
- residual bundle viability
- worker-specific fit with the retained role
- adoption context

It should not ask broad questions only because they were useful for the old hazard model.

## Recommended Intake Structure

The recommended `2.0` intake has six sections.

1. role anchoring
2. task composition
3. exposure conditions
4. coupling and residual bundle
5. adoption context
6. personalization fit

## Section 1: Role Anchoring

Purpose:
- determine the best occupation prior before personalization

Recommended fields:

### R1. Broad role category

Use the current broad category set from `index.html`:
- software
- admin
- data-analysis
- finance
- sales
- creative
- legal
- product-management
- consulting
- hr
- content-writing
- journalism
- engineering
- operations
- custom

Maps to:
- `selected_role_category`
- occupation candidates via `data/metadata/ui_role_category_map.csv`

### R2. Occupation candidate selection

After broad role selection, present:
- `2-3` suggested occupation matches
- optional `closest match` selection

Maps to:
- `selected_occupation_id`
- `selected_occupation_title`

### R3. Seniority / scope

Retain the current hierarchy-level concept, but reinterpret it for:
- residual bundle strength
- role elevation potential
- adaptation leverage

This should no longer primarily act as a hazard shield.

Maps to:
- residual viability modifiers
- personalization-fit modifiers
- likely role-state modifiers

### R4. Industry / operating environment

Optional for MVP if you want to minimize intake changes.

If included, use it for:
- adoption context
- quality thresholds
- regulated-environment modifiers

## Section 2: Task Composition

Purpose:
- estimate what the user's actual bundle looks like inside the selected occupation

This is the most important new section for `2.0`.

### Recommended fields

### T1. Top task families by time share

Ask the user to choose the `3-5` task families that dominate their time.

These should map onto your task clusters:
- drafting
- analysis
- research synthesis
- coordination
- client interaction
- QA/review
- decision support
- execution routine
- oversight strategy
- relationship management
- documentation
- workflow administration

Maps to:
- `transformation_map.current_bundle`
- `top_exposed_work`
- `recomposition_summary.workflow_compression`

### T2. Which tasks define the role's value

Ask:
- which tasks are most central to why the role exists

Purpose:
- distinguish high-time tasks from high-value tasks

Maps to:
- residual bundle viability
- role outlook
- `recomposition_summary.substitution_gap`

### T3. Which tasks are already partially supported by AI/tools

Ask:
- where AI or software already speeds up work

Purpose:
- calibrate exposure mode toward augmentation vs substitution

Maps to:
- mode of change
- exposed task share
- `recomposition_summary.organizational_conversion`

## Section 3: Exposure Conditions

Purpose:
- estimate how easy it is for exposed tasks to be absorbed by AI systems or AI-enabled coworkers

This section should reuse several current `1.0` questions, but with new semantics.

### Reuse / adapt current questions

#### Current Q1: Current AI Performance

Keep, but reinterpret as:
- observed domain-level AI capability for role-relevant tasks

Maps to:
- exposure intensity
- transformation pressure
- workflow compression

#### Current Q2: Data Availability

Keep, but narrow the interpretation to:
- how much role-relevant example work exists for training, imitation, or benchmarking

Maps to:
- exposure intensity
- workflow compression

#### Current Q3: Benchmark Clarity

Keep.

Maps to:
- automation likelihood
- QA cost / reviewability
- workflow compression

#### Current Q4: Task Digitization

Keep.

Maps to:
- exposure intensity
- automation likelihood
- workflow compression

#### Current Q5: Task Decomposability

Keep.

Maps to:
- exposure intensity
- decouplability
- workflow compression

#### Current Q6: Task Standardization

Keep.

Maps to:
- exposure intensity
- automation likelihood
- workflow compression

#### Current Q8: Feedback Loop Speed

Keep.

Maps to:
- reviewability
- automation likelihood
- workflow compression

## Section 4: Coupling And Residual Bundle

Purpose:
- estimate whether exposed tasks can be removed cleanly and whether the remaining bundle still forms a job

This is the other major new section for `2.0`.

### Reuse / adapt current questions

#### Current Q7: Context Dependency

Keep.

Maps to:
- decouplability
- residual bundle viability
- `recomposition_summary.substitution_gap`

#### Current Q9: Tacit Knowledge

Keep.

Maps to:
- decouplability
- residual viability
- `recomposition_summary.substitution_gap`

#### Current Q10: Task Reallocation Risk

Keep, but rename.

Recommended new label:
- `Residual Bundle Fragility`

Current wording is still useful, but the model meaning should become:
- how easily the role breaks apart or gets absorbed if some tasks are removed

Maps to:
- residual viability
- role fragmentation risk
- organizational conversion
- `recomposition_summary.substitution_gap`

#### Current Q11: Human Judgment & Relationships

Keep.

Maps to:
- retained task strength
- augmentation vs automation balance
- residual viability
- lower organizational conversion

#### Current Q12: Physical Presence

Keep as a protective / non-digitizable factor.

Maps to:
- retained task strength
- exposure discounting
- lower organizational conversion

### Recommended new question

#### C1. If routine parts of your work were absorbed, would the remaining work still be enough to justify a distinct role?

This is a new direct `2.0` question and should not be inferred only indirectly.

Maps to:
- residual role viability
- likely role state
- `recomposition_summary.substitution_gap`

This is one of the clearest places where `2.0` should improve on `1.0`.

## Section 5: Adoption Context

Purpose:
- estimate whether technically exposed tasks are likely to be operationally absorbed soon

These questions should stay, but they are no longer the center of the model.

### Reuse current questions

#### Current Q13: Company AI Adoption Readiness

Keep.

Maps to:
- labor-market interpretation
- mode-of-change context
- organizational conversion

#### Current Q14: Labor Cost Pressure

Keep.

Maps to:
- automation pressure
- mode-of-change context
- organizational conversion

#### Current Q15: Labor Market Tightness

Keep.

Maps to:
- substitution pressure
- retained-role fit pressure
- organizational conversion

#### Current Q16: IT Infrastructure

Keep.

Maps to:
- adoption speed
- automation feasibility
- organizational conversion

## Section 6: Personalization Fit

Purpose:
- estimate whether the worker's stated scope, skills, and work mix fit the retained version of the role

### Reuse current questions

#### Current Q17: Skill Transferability

Keep.

Maps to:
- `personalization_fit`

#### Current Q18: Adaptability / Learning

Keep.

Maps to:
- `personalization_fit`

#### Current Q19: Job Performance

Keep, but demote its role.

It should not behave like a large hazard reducer.

Maps to:
- adaptation edge
- role-retention advantage

## Recommended Questionnaire Versioning

Do not preserve the old `Q1-Q19` numbering as the public conceptual model.

Internally you can keep backward-compatible IDs during migration if useful.

Recommended `2.0` public grouping:
- `Role`
- `Task Mix`
- `Exposure`
- `Bundle Integrity`
- `Adoption Context`
- `Fit`

Recommended internal migration approach:
- keep old IDs temporarily in code
- introduce a new mapping layer from old IDs to `2.0` dimensions
- later rename the actual UI questions once the transformation engine is in place

## Field-Level Mapping To V2Result

### selected_role_category

Comes from:
- R1 broad role category

### selected_occupation_id / selected_occupation_title

Comes from:
- R2 occupation candidate selection
- supported by `ui_role_category_map.csv`

### likely_role_state

Depends on:
- T1 task families
- T2 role-defining tasks
- Q7 context dependency
- Q9 tacit knowledge
- Q10 residual bundle fragility
- Q11 human judgment and relationships
- C1 residual distinct-role question
- personalization-fit section

### top_exposed_work

Depends on:
- occupation task-cluster priors
- T1 task-family weighting
- exposure conditions section
- task evidence priors

### exposed_task_share

Depends on:
- T1 task-family weighting
- Q1-Q6 and Q8 exposure conditions
- task evidence priors

### mode_of_change

Depends on:
- Q3 benchmark clarity
- Q5 decomposability
- Q6 standardization
- Q8 feedback speed
- Q11 human relationships
- Q12 physical presence
- current AI/tool support question in T3

### residual_role_strength

Depends on:
- T2 role-defining tasks
- Q7 context dependency
- Q9 tacit knowledge
- Q10 residual bundle fragility
- Q11 human relationships
- Q12 physical presence
- C1 residual distinct-role question

### personalization_fit

Depends on:
- Q17 transferability
- Q18 adaptability / learning
- Q19 performance
- occupation adaptation priors

## Keep / Change / Drop Summary

### Keep with minor reinterpretation

- Q1 Current AI Performance
- Q2 Data Availability
- Q3 Benchmark Clarity
- Q4 Task Digitization
- Q5 Task Decomposability
- Q6 Task Standardization
- Q7 Context Dependency
- Q8 Feedback Loop Speed
- Q9 Tacit Knowledge
- Q11 Human Judgment & Relationships
- Q12 Physical Presence
- Q13 Company AI Adoption Readiness
- Q14 Labor Cost Pressure
- Q15 Labor Market Tightness
- Q16 IT Infrastructure
- Q17 Skill Transferability
- Q18 Adaptability / Learning
- Q19 Job Performance

### Keep but rename / repurpose

- Q10 Task Reallocation Risk
  - new interpretation: residual bundle fragility

### Add for `2.0`

- direct task-family/time-share input
- role-defining task input
- current AI/tool support input
- direct residual-role viability question
- occupation candidate confirmation step

### Drop from center stage

- the old linkage from questionnaire responses directly into METR bucket hazard timing
- the current assumption that the questionnaire mainly exists to infer task-duration weights

## Recommended MVP Implementation Strategy

### Current implementation status

The current `2.0` UI now implements the visible intake refactor:
- category plus occupation anchoring is live on the main `2.0` page
- the visible questionnaire uses the new grouped section names
- direct task-family inputs now include:
  - top task family
  - secondary task family
  - value-defining task family
  - current AI/tool support
  - residual role distinctiveness
- those direct task-family inputs now feed the live engine through a pseudo-count bundle update rather than a flat post-hoc renormalization
- the live engine now also derives a secondary recomposition layer from the current intake:
  - workflow compression
  - organizational conversion
  - substitution potential
  - recomposition gap
- internal compatibility is still preserved through `Q1-Q19` IDs

What remains incomplete:
- the visible questionnaire still uses the old radio-grid shell rather than a bespoke `2.0` intake layout
- prefill logic still depends on legacy role presets and hierarchy assumptions
- the scoring layer now uses the direct `2.0` inputs materially, but it still relies on the existing question-to-signal translation rather than a fully re-derived `2.0` weighting system
- occupation cleanup is still needed for the largest benchmark-disagreement roles, where better questionnaire inputs cannot fully offset weak priors or weak bundle mapping
- the current questionnaire still does not collect the direct demand-elasticity inputs that would be needed for credible demand rebound or labor-demand forecasting

## Minimum New Fields Needed For First Real V2

If only a few new inputs can be added at first, prioritize:

1. occupation candidate confirmation
2. top task families / time share
3. direct residual-role viability question
4. current AI/tool support question
5. one explicit fit / scope question that helps distinguish retained-role fit from occupation-average fit

These add more `2.0` signal than renaming legacy questions alone.

## Source Alignment

The questionnaire should be designed around the active public evidence stack:

- `O*NET`
  - defines occupation anchoring and baseline task structure
- `Anthropic Economic Index 2026-01-15`
  - defines exposure and augmentation/automation interpretation at the task level
- `BLS`
  - informs labor-market context only and should not dictate questionnaire scoring

The questionnaire should not be designed around:
- `Manning / Aguirre`
- `METR` timing logic
- `OECD / PIAAC` launch-time scoring requirements
- `AIOE` or `ILO` benchmark inputs as direct public scoring drivers

The questionnaire also should not be stretched into:
- direct labor-demand forecasting
- price or quantity elasticity estimation
- time-varying frontier estimation

Those require new data, not just different question wording.

## Next Dependency

With the visible questionnaire refactor and direct-input scoring pass now implemented, the next recommended step is:
- improve occupation-prior coverage and targeted bundle cleanup for benchmark-disagreement roles, while reducing the remaining dependence on legacy prefill assumptions
- after the occupation cleanup pass, build a small labeled calibration set so the questionnaire-to-signal coefficients can be estimated or stress-tested instead of remaining hand-tuned
