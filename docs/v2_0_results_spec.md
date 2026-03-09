# V2.0 Results Specification

## Purpose

This document locks the intended `2.0` results-page structure before major model and UI implementation.

It defines:
- the top-level outputs
- the page layout
- the primary chart
- the labor-market context panel
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

The default public page order is now:

1. role summary header
2. one primary verdict surface
3. short narrative explanation
4. primary transformation map
5. live task breakdown
6. labor-market context panel
7. collapsed `Show model details` section
8. optional refinement intake remains above the result, but only the short core refinement set should be visible by default

The page should show the verdict and the role-specific task change first. Internal diagnostics should remain available, but not at equal visual weight.

## Header

The result header should display:
- selected broad role category
- chosen or inferred occupation
- short one-line summary of the result

Example summary patterns:
- `Your role is more likely to be restructured than removed outright.`
- `The most exposed parts of your work are routine analysis and drafting, but the residual bundle remains viable.`
- `This role appears vulnerable to fragmentation if routine tasks are absorbed quickly.`

## Headline Surface

The engine still computes five core outputs for `2.0`, but the page should not duplicate them in multiple visual formats.

Default public treatment:
- one dominant `Role Outlook` verdict
- one short summary paragraph
- four compact supporting notes:
  - `Top exposed work`
  - `Mode of change`
  - `Residual role strength`
  - `Personalization fit`

Duplicate score-card grids should remain hidden or be removed from the default page surface.

### 1. Role Outlook

Type:
- text label

Purpose:
- communicate the model's top-level interpretation of what the role becomes

Allowed values should come from a small fixed label set:
- `Mostly augmented`
- `Routine work compressed`
- `Role becomes more senior`
- `Role becomes narrower`
- `Role fragments`
- `High displacement risk`

This is the primary card and should be visually dominant.

### 2. Top Exposed Work

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

### 3. Mode Of Change

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

### 4. Residual Role Strength

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

### 5. Personalization Fit

Type:
- tier or score

Purpose:
- estimate how well the user's stated task mix and work context fit the retained version of the role

Recommended tiers:
- `Strong`
- `Moderate`
- `Weak`

Optional supporting line:
- `Your answers fit the retained version of the role`
- `Your answers produce a mixed fit`
- `Your answers lean toward the more exposed part of the bundle`

## Primary Chart

The current `1.0` primary chart is:
- `Displacement Probability Over Time`
- blue technical-feasibility curve
- green displaced-employment curve

That chart should not remain the main visual in `2.0`.

### New primary chart

The recommended primary chart is a `Role Transformation Map`.

Minimum MVP version:
- left column: highest-share current task rows
- middle column: highest exposed-share task rows
- right column: highest retained-share task rows

Recommended data encoding:
- stacked bars or block columns
- task statements visible
- task-family tag visible on each row
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
- the displayed rows are derived from the live mapped O*NET task list, not from a generic shared family list alone

## Supporting Sections

### Exposed vs Retained Task Section

This section should list:
- top exposed task rows
- top retained task rows
- top current-share task rows

For each displayed task row, show:
- task statement
- task-family label
- share of role
- exposed share or retained share, depending on column
- likely mode
- short evidence note

### Likely Role Evolution Narrative

This should be a structured explanation, not freeform prose.

Recommended template:

1. `Why this role changes`
2. `What is under pressure`
3. `What stays core`
4. `How your answers shape the result`

### Recomposition Panel

This should remain a secondary explanatory layer, not a headline score, and it should live inside the collapsed `Show model details` surface by default.

Show:
- `Workflow compression`
- `Organizational conversion`
- `Substitution potential`
- `Recomposition gap`
- short interpretive note

Interpretation:
- workflow compression = technically compressible work implied by the current task bundle
- organizational conversion = how much of that compression currently looks likely to convert into fewer labor hours
- substitution potential = share of that compression that currently looks more likely to convert into fewer labor hours
- recomposition gap = exposed work that still looks more likely to be reorganized, absorbed, or redesigned than directly removed

### Labor Market Context Panel

This section provides market context, not a second model.

Recommended outputs:
- `U.S. employment`
- `Annual openings`
- `Median wage`
- `Growth`
- `Latest unemployment`
- `12-month BLS unemployment trend`

This panel should help interpret the result without driving the headline role labels.

## Evidence And Caveats Section

This section should explicitly tell the user:
- which evidence layers informed the result
- where the model used occupation priors
- where the model used task-level evidence
- where coverage is partial

It should be collapsed by default on the main page.

The default source explanation should be:
- `O*NET` for occupation and task structure
- `Anthropic Economic Index 2026-01-15` for primary task exposure and augmentation/automation evidence
- `BLS` for labor-market context
- legacy Anthropic `2025-03-27` extract only as fallback supporting coverage
- a derived launch prior only where occupation-level aggregation is needed

It should also display source-confidence language such as:
- `Evidence strength`
- `Occupation anchor strength`
- `Personalization signal strength`
- `Task coverage`
- `Residual bundle estimate uses structural inference`

These are descriptive readouts for interested users, not primary outputs.

## Recommended Result Object

This is the minimum app-facing result contract for the `2.0` engine.

```ts
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

type V2Result = {
  selected_role_category: string
  selected_occupation_id: string
  selected_occupation_title: string
  role_outlook: RoleState
  role_outlook_label: string
  role_summary: string
  top_exposed_work: {
    task_cluster_id: string
    label: string
    share_of_role: number
    exposure_score: number
    exposure_level: 'low' | 'moderate' | 'high'
  } | null
  role_defining_work: {
    task_cluster_id: string
    label: string
    share_of_role: number
    retained_share: number
    exposed_share: number
  } | null
  exposed_task_share: number
  mode_of_change: BalanceTier
  augmentation_share: number
  automation_share: number
  residual_role_strength: ViabilityTier
  personalization_fit: ViabilityTier
  recomposition_summary: {
    workflow_compression: number
    organizational_conversion: number
    substitution_potential: number
    substitution_gap: number
    summary_label: string
    summary_note: string
  }
  transformation_map: TransformationMap
  narrative_summary: {
    why_this_role_changes: string
    what_is_under_pressure: string
    what_stays_core: string
    personalization_fit_summary: string
  }
  evidence_summary: {
    task_evidence_confidence: number
    occupation_anchor_confidence: number
    personalization_confidence: number
    labor_context_confidence: number
    notes: string[]
  }
  labor_market_context: {
    employment_us: number
    annual_openings: number
    median_wage_usd: number
    wage_p25_usd: number
    wage_p75_usd: number
    projection_growth_pct: number
    unemployment_group_id: string | null
    unemployment_group_label: string | null
    unemployment_series_id: string | null
    latest_unemployment_rate: number | null
    latest_unemployment_period: string | null
    monthly_unemployment_series: Array<{
      year: number
      month: number
      month_label: string
      unemployment_rate: number | null
      is_missing: boolean
    }>
  } | null
  diagnostics: {
    occupation_prior_source: string | null
    occupation_prior_exposure: number
    occupation_prior_augmentation: number
    occupation_prior_automation: number
    occupation_prior_adaptive_capacity: number
    bundle_prior_concentration: number
    mean_cluster_prior_reliability: number
    mean_task_direct_reliability: number
    workflow_compression: number
    organizational_conversion: number
    substitution_potential: number
    substitution_gap: number
    adoption_pressure: number
    task_support_signal: number
    fragility: number
    critical_exposed_share: number
    critical_retained_share: number
    critical_absorbed_share: number
    personalization_fit_score: number
    residual_role_strength_score: number
    retained_transformed_share: number
    absorbed_share: number
  }
}
```

Public UI note:
- the live `2.0` page now derives the visible transformation-map rows from `task_breakdown.tasks`, ranking mapped task rows by current share, exposed share, and retained share
- the internal `transformation_map` cluster arrays remain available as analytical bundle surfaces, but they are no longer the primary public map view

### Live scoring notes

The current live engine also makes these implementation choices:

- cluster exposure, augmentation, and automation priors are shrunk toward occupation-level priors using evidence-confidence-weighted reliability rather than a simple average
- task-family overrides update the occupation bundle through a pseudo-count composition update rather than an unconstrained rescaling
- the user-selected `value-defining task family` receives extra weight in exposure, elevation, and top-exposed selection
- direct task evidence is shrunk toward cluster estimates using task-count-weighted reliability, so sparse task rows do not overpower the occupation anchor
- direct AI/tool support and adoption context now modify augmentation, automation, and absorbed-share calculations
- the live result now includes a secondary recomposition layer with workflow compression, organizational conversion, substitution potential, and recomposition gap
- labor-market context remains separate from the headline role labels

### Deferred recomposition roadmap

The following ideas are intentionally not part of the live `2.0` result yet:

- time-varying capability-frontier modeling
- dependency-graph penalties beyond the current lightweight structural proxy
- demand rebound decomposition and service-elasticity channels
- labor-demand equations or employment forecasts
- calibrated role-state transition models

These remain valid future work, but they require additional data and calibration beyond the current public stack.

### Calibration status

The live engine now has a reviewed calibration harness:

- calibration cases live in `data/metadata/v2_reviewed_calibration_set.csv`
- the evaluation harness lives in `scripts/evaluate_v2_calibration.js`
- the generated report lives in `docs/data/v2_calibration_report.md`

This is a reviewed launch-baseline calibration set, not a final research benchmark or causal validation layer.

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

Important implementation rule:
- these priors support occupation anchoring and confidence, but should not overpower task-level Anthropic evidence

### Labor context inputs

Use:
- `data/normalized/occupation_labor_market_context.csv`
- `data/normalized/occupation_unemployment_monthly.csv`

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

These should be replaced by the five `2.0` headline cards defined above.

## What Replaces Current 1.0 Chart

Current `1.0` chart:
- `Displacement Probability Over Time`

`2.0` replacement:
- `Role Transformation Map`

No timing replacement is required on the main `2.0` page.

## Visual Priority Rules

1. `Role Outlook` should be the most prominent card.
2. The transformation map should sit above the labor-market context panel.
3. Labor-market context should not visually overpower the transformation result.
4. Evidence and caveats must be visible without requiring the methodology page.

## Implementation Notes

This spec does not require the final scoring model to exist yet.

It is sufficient for implementation planning if the app can consume a result object matching the shape above and render the locked sections.

The first UI implementation can use placeholder or heuristic values so long as:
- the page structure matches this spec
- the `1.0` headline cards are no longer the main result contract

## Next Dependency

With the reviewed calibration harness now live, the next recommended step is:
- expand direct Anthropic task coverage for still stub-dependent clusters, especially legal/document-heavy work
- use the reviewed calibration set to stress-test future coefficient changes instead of tuning by feel

## Implementation Status

As of 2026-03-09, the results page is fully implemented in the live `2.0` page:

- the results HTML lives in `index.html` within the `#results-column` section
- the results rendering logic lives in `app.js` (all `renderV2*` and `updateV2Results` functions)
- the results computation lives in `v2_engine.js` (`computeResult`)
- the main page codebase is now split: `index.html` (HTML), `styles.css` (CSS), `app.js` (v2 JS)
- all v1 result cards (hazard years, risk by 2030/2031, re-employment, legacy chart) have been removed from the main page
- the full v1 archive is preserved at `main-old/index.html`
- the METR time-varying capability curve is not yet wired into v2 results (deferred)
