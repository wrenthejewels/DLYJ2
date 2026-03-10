# V2.0 Questionnaire Specification

## Purpose

This document describes the current live intake contract for the `2.0` role-fate model.

It replaces the earlier aspirational intake spec. The live intake is now a hybrid:
- occupation anchoring
- five structured task selectors
- the legacy questionnaire, reinterpreted as a scoring layer

## Current Intake Flow

The live page collects inputs in this order:

1. broad role category
2. occupation anchor
3. hierarchy / seniority
4. optional structured task detail
5. optional legacy questionnaire

## Current Structured Task Inputs

The live direct-input block in `index.html` now exposes five occupation-specific selectors:

1. `Primary current task`
2. `Secondary current task`
3. `Value-defining task`
4. `Task already helped by AI`
5. `Support task tied to exposed work`

These selectors are populated from `engine.getTaskInventory(selectedOccupationId)`.

## Current Runtime Mapping

The client translates those five selectors into this runtime input contract:

```ts
type DirectTaskInputs = {
  dominantTaskIds: string[]
  roleCriticalTaskIds: string[]
  aiSupportTaskIds: string[]
  supportTaskIds: string[]
  dominantTaskClusters: string[]
  roleCriticalClusters: string[]
}
```

The current translation logic is:
- `Primary current task` + `Secondary current task` -> `dominantTaskIds`
- `Value-defining task` -> `criticalTaskIds`
- `Task already helped by AI` -> `aiSupportTaskIds`
- `Support task tied to exposed work` -> `supportTaskIds`
- selected task-family ids are derived from the chosen task options and used to tilt cluster weights

## Current Engine Effect Of Task Inputs

The engine currently applies those task inputs in four places:

### 1. Cluster-share tilting

Selected task-family ids are converted into cluster overrides:
- `+0.16` for dominant clusters
- `+0.10` for role-critical clusters

These weights are passed through `buildTaskOverrides(...)` before cluster normalization.

### 2. Task-share reweighting

Selected task rows receive multiplicative share boosts:
- dominant task: `+0.40`
- critical task: `+0.12`
- support task: `+0.18`

The task shares are then renormalized across the role.

### 3. Task-pressure adjustment

Current task-input effects on task-level scoring:
- critical task:
  - raises `bargaining_power_weight`
  - raises `value_centrality`
  - promotes the task toward `core`
- AI-assisted task:
  - raises `ai_support_observability`
  - lowers direct pressure slightly
  - raises retained leverage slightly
- support/spillover task:
  - raises indirect dependency pressure
  - raises dependency penalty

### 4. Role-fate interpretation

These task selections indirectly affect:
- `role_fate_state`
- `role_fate_label`
- `role_fate_confidence`
- `fate_drivers`
- `fate_counterweights`

## Current Questionnaire Layer

The live engine still consumes this legacy answer set:
- `Q1`
- `Q2`
- `Q3`
- `Q4`
- `Q5`
- `Q6`
- `Q7`
- `Q8`
- `Q9`
- `Q11`
- `Q12`
- `Q13`
- `Q14`
- `Q16`

Questions not currently active in the live engine:
- `Q10`
- `Q15`
- `Q17`
- `Q18`
- `Q19`

## Current Composite Signals

The live engine maps questionnaire answers into these composites:

```ts
capabilitySignal = avg(Q1, Q4, Q8)
couplingProtection = avg(Q7, Q9, Q11, Q12)
adoptionPressure = avg(Q13, Q14, Q16)
```

It also derives bundle friction dimensions:
- `exception_burden = avg(1-Q5, 1-Q6, Q7, Q9)`
- `accountability_load = avg(Q7, Q11)`
- `judgment_requirement = avg(Q7, Q9, Q11)`
- `document_intensity = avg(Q2, Q3, Q4, Q8)`
- `tacit_context_dependence = avg(Q7, Q9, Q12)`

All answers are first normalized to `[0, 1]`.

## Current Functional Interpretation By Section

### Role Anchoring

Current live fields:
- category
- occupation
- hierarchy

These drive:
- occupation resolution
- occupation candidate ranking
- seniority signal
- part of elevation and retained-role logic

### Task Composition

Current live fields:
- primary task
- secondary task

These drive:
- cluster-share tilting
- task-share reweighting
- visible current-role rows

### Value And Bargaining Power

Current live field:
- value-defining task

This drives:
- role-critical cluster weighting
- task-level bargaining power weighting
- retained leverage
- role-defining task selection

### AI Pressure And Support

Current live field:
- AI-assisted task

This drives:
- lower direct pressure on the selected task
- higher augmentation interpretation
- slightly stronger retained leverage

### Dependency And Spillover

Current live field:
- support task tied to exposed work

This drives:
- higher indirect dependency pressure
- higher dependency penalty
- stronger split/compression pressure in the role-fate classifier

### Adaptation And Demand Context

Current live fields:
- hierarchy
- `Q13`, `Q14`, `Q16`

These drive:
- `adoptionPressure`
- `demand_expansion_modifier`
- part of `role_fate_state`

## Current UX Rules

The live UI now enforces these behaviors:
- task selectors are occupation-specific
- duplicate task picks across the five selectors are disabled in the client
- all five task selectors are optional
- if no task is chosen, the engine falls back to the occupation prior

## Current Gaps

Still missing from the intake relative to the broader redesign:
- weighted task-share buckets
- explicit `AI-danger task` selection separate from `value-defining task`
- user-authored dependency links between chosen tasks
- direct residual-role-distinctiveness question
- deeper retained-role / span-of-control prompts

## Next Intake Work

Recommended next changes:

1. replace single task picks with rough weighted task buckets
2. add explicit `if AI got very good at this task, would bargaining power break?` prompts
3. let users declare a small number of dependency links between their chosen tasks
4. introduce a visible retained-role-distinctiveness question instead of inferring all of it from structure
