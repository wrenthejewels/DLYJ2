# V2.0 Results Specification

## Purpose

This document locks the intended `2.0` results-page structure before major model and UI implementation.

It defines:
- the top-level outputs
- the page layout
- the primary chart
- the secondary timing panel
- the minimum data contract required from the `2.0` model layer

This is a product and implementation spec, not public copy.

## Core Result Principle

The `2.0` results page should explain:
- what in the role is exposed
- whether exposure is more likely augmentation or automation
- what remains after exposed tasks are absorbed
- whether the remaining bundle is still viable
- whether the worker can adapt into the transformed role

It should not lead with:
- exact job-loss dates
- hazard curves
- binary replace/not-replace framing

## Page Structure

The recommended page order is:

1. role summary header
2. six headline result cards
3. primary transformation map
4. exposed vs retained task section
5. likely role evolution narrative
6. secondary timing and hazard panel
7. evidence and caveats

## Header

The result header should display:
- selected broad role category
- chosen or inferred occupation
- short one-line summary of the result

Example summary patterns:
- `Your role is more likely to be restructured than removed outright.`
- `The most exposed parts of your work are routine analysis and drafting, but the residual bundle remains viable.`
- `This role appears vulnerable to fragmentation if routine tasks are absorbed quickly.`

## Headline Cards

These six cards are the locked default headline outputs for `2.0`.

### 1. Likely Role State

Type:
- text label

Purpose:
- communicate the model's top-level interpretation of what the role becomes

Allowed values should come from a small fixed label set:
- `Mostly augmented`
- `Routine tasks absorbed`
- `Role becomes more senior`
- `Role narrows but remains viable`
- `Role fragments`
- `High displacement risk`

This is the primary card and should be visually dominant.

### 2. Most Exposed Task Cluster

Type:
- task-cluster label plus exposure level

Purpose:
- name the part of the user's work currently most under pressure

Example outputs:
- `Documentation`
- `Drafting`
- `Workflow Administration`
- `Analysis`

Secondary line:
- `High exposure`
- `Moderate exposure`

### 3. Automation vs Augmentation Balance

Type:
- split label plus supporting balance bar

Purpose:
- make the new `2.0` ontology explicit

Recommended tiers:
- `Mostly augmentation`
- `Mixed`
- `Mostly automation`

Recommended supporting display:
- simple 0-100 split bar with:
  - `augmentation`
  - `automation`

### 4. Residual Role Viability

Type:
- tier or score

Purpose:
- estimate whether the remaining task bundle still coheres into a viable role

Recommended tiers:
- `Strong`
- `Moderate`
- `Weak`

Optional supporting line:
- `Residual bundle still forms a stable role`
- `Residual bundle likely holds but narrows`
- `Residual bundle is at risk of collapsing into fragments`

### 5. Adaptation Capacity

Type:
- tier or score

Purpose:
- estimate the worker's ability to stay valuable within the transformed bundle or move into adjacent roles

Recommended tiers:
- `Strong`
- `Moderate`
- `Weak`

Optional supporting line:
- `High mobility into adjacent roles`
- `Some transition room`
- `Limited adaptation room without substantial retraining`

### 6. Transformation Pressure By 2030

Type:
- time-bounded forward-looking summary

Purpose:
- retain the timing dimension without reverting to `1.0` hazard framing

Recommended tiers:
- `Low`
- `Moderate`
- `High`

Optional subtitle:
- `Pressure reflects expected task absorption and role restructuring by 2030`

## Primary Chart

The current `1.0` primary chart is:
- `Displacement Probability Over Time`
- blue technical-feasibility curve
- green displaced-employment curve

That chart should not remain the main visual in `2.0`.

### New primary chart

The recommended primary chart is a `Role Transformation Map`.

Minimum MVP version:
- left column: current task bundle
- middle column: exposed tasks segmented by likely mode
  - augmentation
  - partial automation
  - high automation
- right column: residual bundle / transformed role

Recommended data encoding:
- stacked bars or block columns
- task-cluster labels visible
- exposed segments highlighted
- retained segments muted but legible

The user should be able to answer visually:
- what part of my current work is exposed?
- what is being absorbed?
- what remains?

### Chart sections

The chart should include:
- `Current role`
- `Exposed tasks`
- `Residual role`

### Chart subtitle

The subtitle should explain:
- this is a structural role-change map, not a direct layoff forecast

## Supporting Sections

### Exposed vs Retained Task Section

This section should list:
- top exposed task clusters
- top retained task clusters
- top elevated task clusters

For each exposed task cluster, show:
- cluster label
- share of role
- exposure level
- likely mode
- short evidence note

### Likely Role Evolution Narrative

This should be a structured explanation, not freeform prose.

Recommended template:

1. `What is changing`
2. `What gets absorbed`
3. `What remains`
4. `What kind of worker benefits in the transformed version of the role`

### Secondary Timing And Hazard Panel

This is where the surviving timing logic belongs.

Recommended section title:
- `Secondary Timing View`

Recommended outputs:
- `Transformation pressure by year`
- `Secondary displacement hazard`
- `Possible displacement window`

This section should be collapsible or visually subordinate to the main transformation result.

It should not reuse the `1.0` card prominence.

## Evidence And Caveats Section

This section should explicitly tell the user:
- which evidence layers informed the result
- where the model used occupation priors
- where the model used task-level evidence
- where coverage is partial

It should also display source-confidence language such as:
- `Task evidence strong`
- `Occupation prior partial`
- `Residual bundle estimate uses structural inference`

## Recommended Result Object

This is the minimum app-facing result contract for the `2.0` engine.

```ts
type ResultTier = 'low' | 'moderate' | 'high'
type ViabilityTier = 'strong' | 'moderate' | 'weak'
type BalanceTier = 'mostly_augmentation' | 'mixed' | 'mostly_automation'
type RoleState =
  | 'mostly_augmented'
  | 'routine_tasks_absorbed'
  | 'role_becomes_more_senior'
  | 'role_narrows_but_remains_viable'
  | 'role_fragments'
  | 'high_displacement_risk'

type ResultTaskCluster = {
  task_cluster_id: string
  label: string
  share_of_role: number
  exposure_score: number
  augmentation_likelihood: number
  partial_automation_likelihood: number
  high_automation_likelihood: number
  residual_relevance?: number
  evidence_confidence: number
  primary_sources: string[]
}

type TransformationMap = {
  current_bundle: ResultTaskCluster[]
  exposed_clusters: ResultTaskCluster[]
  retained_clusters: ResultTaskCluster[]
  elevated_clusters: ResultTaskCluster[]
}

type SecondaryHazardSummary = {
  transformation_pressure_by_2030: number
  secondary_displacement_hazard?: number
  displacement_window_start?: number
  displacement_window_end?: number
  confidence: number
}

type V2Result = {
  selected_role_category: string
  selected_occupation_id: string
  selected_occupation_title: string
  likely_role_state: RoleState
  likely_role_state_label: string
  top_exposed_task_cluster: string
  exposed_task_share: number
  automation_vs_augmentation_balance: BalanceTier
  augmentation_share: number
  automation_share: number
  residual_role_viability: ViabilityTier
  adaptation_capacity: ViabilityTier
  transformation_pressure_2030: ResultTier
  transformation_map: TransformationMap
  narrative_summary: {
    what_is_changing: string
    what_gets_absorbed: string
    what_remains: string
    who_benefits: string
  }
  secondary_hazard?: SecondaryHazardSummary
  evidence_summary: {
    task_evidence_confidence: number
    occupation_prior_confidence: number
    residual_bundle_confidence: number
    notes: string[]
  }
}
```

## Mapping To Current Data Layer

The current normalized files already support much of this structure.

### Current bundle inputs

Use:
- `data/normalized/occupation_task_clusters.csv`
- optionally personalized later by questionnaire responses

### Exposure and automation mode inputs

Use:
- `data/normalized/task_augmentation_automation_priors.csv`
- `data/normalized/task_exposure_evidence.csv`

### Occupation prior inputs

Use:
- `data/normalized/occupation_exposure_priors.csv`
- `data/normalized/occupation_adaptation_priors.csv`

### Labor context inputs

Use:
- `data/normalized/occupation_labor_market_context.csv`

### Role-category bridge

Use:
- `data/metadata/ui_role_category_map.csv`

## What Replaces Current 1.0 Cards

Current `1.0` headline cards in `index.html` are:
- `50% Job Loss Risk`
- `90% Job Loss Risk`
- `Risk by 2030`
- `Risk by 2031`
- `Examine Re-Employment Likelihood`

These should be replaced by the six `2.0` headline cards defined above.

The old risk-year logic should move into the secondary timing panel.

## What Replaces Current 1.0 Chart

Current `1.0` chart:
- `Displacement Probability Over Time`

`2.0` replacement:
- `Role Transformation Map`

Secondary optional chart:
- `Transformation Pressure Over Time`

If a time-series view remains, it should not visually dominate the page.

## Visual Priority Rules

1. `Likely Role State` should be the most prominent card.
2. The transformation map should sit above any timing chart.
3. The secondary timing panel should be collapsible or visually lower-emphasis.
4. Evidence and caveats must be visible without requiring the methodology page.

## Implementation Notes

This spec does not require the final scoring model to exist yet.

It is sufficient for implementation planning if the app can consume a result object matching the shape above and render the locked sections.

The first UI implementation can use placeholder or heuristic values so long as:
- the page structure matches this spec
- the `1.0` headline cards are no longer the main result contract

## Next Dependency

With this spec locked, the next recommended step is:
- define the `2.0` questionnaire mapping so responses can populate the result contract above
