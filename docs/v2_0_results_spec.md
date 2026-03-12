# V2.0 Results Specification

## Scope

This is a supporting contract doc, not the main planning doc.

For current model status, roadmap, and next steps, read:
- `docs/role_transformation_overhaul_plan.md`

## Purpose

This document describes the current live `2.0` results contract as implemented in:
- `v2_engine.js`
- `app.js`
- `index.html`

Current live surfaces:
- `/` = model
- `/guide` = guide
- `/method` = methodology

## Current Public Result Order

The live page now renders results in this order:

1. role summary header
2. role fate headline with confidence
3. wave trajectory cards
4. structured narrative cards
5. `Role Fate Map`
6. task-level breakdown
7. recomposition summary
8. occupation assignment and evidence summary
9. labor-market context

The page still exposes wave trajectory as a secondary surface, but the primary public ontology is now `Role Fate`.

## Current Headline Surface

The live headline surface shows:
- `role_fate_label`
- `role_summary`
- `role_fate_confidence`
- top task under direct pressure
- primary displacement wave
- retained leverage tier
- personalization-fit tier
- occupation anchor

## Current Role Fate Map

The live `Role Fate Map` is rendered in the client from `task_breakdown.tasks`.

Current columns:
- `Current role`
- `Bargaining-power tasks`
- `Direct AI pressure`
- `Indirect spillover`
- `Retained leverage`

These columns are derived from task-level signals, not directly returned as a first-class `role_fate_map` object from the engine.

## Current Narrative Contract

The narrative panel now uses four structured cards:

1. `Likely Organizational Fate`
2. `Direct Pressure And Spillover`
3. `What Protects Bargaining Power`
4. `How Your Inputs Shift The Result`

These are powered by:
- `role_fate_readout.organizational_fate`
- `fate_drivers`
- `fate_counterweights`
- `narrative_summary`

## Current Result Object

The live engine returns these result fields as part of the app-facing contract:

```ts
type RoleFateState =
  | 'augmented'
  | 'compressed'
  | 'elevated'
  | 'split'
  | 'expanded'
  | 'collapsed'
  | 'mixed_transition'

type V2Result = {
  selected_role_category: string
  selected_occupation_id: string
  selected_occupation_title: string

  role_outlook: string
  role_outlook_label: string

  role_fate_state: RoleFateState
  role_fate_label: string
  role_fate_confidence: number
  role_fate_readout: {
    organizational_fate: string
    drivers: string[]
    counterweights: string[]
  }
  fate_drivers: string[]
  fate_counterweights: string[]
  role_summary: string
  occupation_explanation: {
    // Live-generated from the current edited run, not read from an offline CSV.
    role_transformation_type: string | null
    function_anchor_count: number
    primary_driver: string | null
    secondary_driver: string | null
    primary_counterweight: string | null
    evidence_profile: string | null
    confidence_band: string | null
    review_priority: string | null
    explanation_summary: string | null
  } | null

  questionnaire_profile: {
    function_centrality: number
    human_signoff_requirement: number
    liability_and_regulatory_burden: number
    relationship_ownership: number
    exception_and_context_load: number
    workflow_decomposability: number
    organizational_adoption_readiness: number
    ai_observability_of_work: number
    dependency_bottleneck_strength: number
    external_trust_requirement: number
    augmentation_fit: number
    substitution_risk_modifier: number
  }
  questionnaire_profile_source: 'native_profile' | 'legacy_answers' | 'default_profile'

  occupation_assignment: {
    role_category: string
    role_category_label: string
    selected_occupation_id: string
    selected_occupation_title: string
    onet_soc_code: string | null
    selector_weight: number
    anchor_confidence: number
    category_candidate_count: number
    category_candidate_rank: number | null
    occupation_prior_source: string | null
    assignment_method: string
    task_assignment_method: string
    dominant_task_clusters: Array<{
      task_cluster_id: string
      label: string
    }>
    selected_task_inputs: {
      dominant_task_ids: string[]
      critical_task_ids: string[]
      ai_support_task_ids: string[]
      support_task_ids: string[]
    }
    selected_composition: {
      active_task_count: number
      active_function_count: number
      added_dependency_count: number
      custom_function_link_count: number
      active_task_function_link_count: number
      share_override_count: number
      removed_task_count: number
      added_task_count: number
      removed_function_count: number
      added_function_count: number
    }
    role_defining_cluster: {
      task_cluster_id: string
      label: string
    } | null
    direct_task_evidence_count: number
    fallback_task_count: number
    questionnaire_effect: string
  }

  primary_displacement_wave: 'current' | 'next' | 'distant'
  wave_trajectory: {
    current: WaveSnapshot
    next: WaveSnapshot
    distant: WaveSnapshot
  }

  top_exposed_work: {
    task_cluster_id: string
    label: string
    share_of_role: number
    automation_difficulty: number
    wave_assignment: 'current' | 'next' | 'distant'
    exposure_level: 'low' | 'moderate' | 'high'
  } | null

  role_defining_work: {
    task_cluster_id: string
    label: string
    share_of_role: number
    retained_share: number
    wave_assignment: 'current' | 'next' | 'distant'
    automation_difficulty: number
  } | null

  exposed_task_share: number
  residual_role_strength: 'weak' | 'moderate' | 'strong'
  personalization_fit: 'weak' | 'moderate' | 'strong'
  function_metrics: {
    function_exposure_pressure: number
    retained_function_strength: number
    retained_accountability_strength: number
    retained_bargaining_power: number
    role_fragmentation_risk: number
    role_compressibility: number
    demand_expansion_signal: number
    delegation_likelihood: number
    headcount_displacement_risk: number
    role_transformation_type: string
    confidence_score: number
    support_high_pressure_share: number
    routine_high_pressure_share: number
    per_function_breakdown: Array<{
      function_id: string
      function_category: string | null
      role_summary: string | null
      function_statement: string | null
      function_weight: number
      exposure_pressure: number
      retained_strength: number
      supported_share: number
      exposed_share: number
      custom_link_count: number
    }>
  } | null

  recomposition_summary: RecompositionSummary
  transformation_map: {
    current_bundle: ClusterRow[]
    exposed_clusters: ClusterRow[]
    retained_clusters: ClusterRow[]
    elevated_clusters: ClusterRow[]
  }

  task_breakdown: {
    total_tasks_considered: number
    direct_evidence_tasks: number
    cluster_fallback_tasks: number
    user_selected_task_count: number
    tasks: RoleTaskRow[]
  }

  narrative_summary: {
    why_this_role_changes: string
    what_is_under_pressure: string
    what_stays_core: string
    personalization_fit_summary: string
  }

  evidence_summary: EvidenceSummary
  labor_market_context: LaborMarketContext | null
  diagnostics: Diagnostics
}
```

## Current Task Row Contract

```ts
type RoleTaskRow = {
  task_id: string
  onet_task_id: string
  task_statement: string
  task_type: string
  task_cluster_id: string
  task_cluster_label: string
  share_of_role: number
  selection_multiplier: number
  automation_difficulty: number
  wave_assignment: 'current' | 'next' | 'distant'
  direct_exposure_pressure: number
  indirect_dependency_pressure: number
  value_centrality: number
  bargaining_power_weight: number
  role_criticality: 'core' | 'supporting' | string
  ai_support_observability: number
  evidence_confidence: number
  direct_evidence_reliability: number
  mapping_method: string
  mapping_confidence: number
  evidence_type: string
  evidence_source: string | null
  observed_usage_share: number
  has_direct_evidence: boolean
  is_role_critical: boolean
  is_user_selected_dominant: boolean
  is_user_selected_critical: boolean
  is_user_selected_ai_support: boolean
  is_user_selected_support_task: boolean
  elevation_boost: number
  exposed_share: number
  retained_share: number
  retained_leverage: number
  exposure_score: number
  exposure_level: 'low' | 'moderate' | 'high'
  likely_mode: 'automation' | 'augmentation' | 'mixed'
}
```

The editable composition payload that drives this result is now:

```ts
type CompositionEdits = {
  removed_task_ids: string[]
  added_task_ids: string[]
  removed_function_ids: string[]
  added_function_ids: string[]
  task_share_overrides: Record<string, number>
  task_function_links: Array<{
    task_id: string
    function_id: string
  }>
}

type DependencyEdits = {
  added_edges: Array<{
    from_task_id: string
    to_task_id: string
  }>
}
```

The live model page now usually produces this payload through `getRoleComposition(occupationId)` plus the role graph editor, not through the older five-selector task-input flow.

The engine also exposes an occupation-scoped composition baseline through `getRoleComposition(occupationId)`, with source-bucketed tasks plus function anchors for the editor.
That baseline now includes the reviewed task-to-function graph for both display and live scoring; custom task-to-function links are additive overrides rather than the only function links the scorer sees.

## Structural Scores Now Used Publicly

The live page relies on these engine-level structural scores:
- `direct_exposure_pressure`
- `indirect_dependency_pressure`
- `retained_leverage_score`
- `residual_role_integrity`
- `exposed_core_share`
- `retained_core_share`
- `demand_expansion_modifier`
- `function_retention`
- `function_exposure_pressure`
- `retained_function_strength`
- `retained_accountability_strength`
- `retained_bargaining_power`
- `delegation_likelihood`
- `headcount_displacement_risk`
- `augmentation_fit`
- `substitution_risk_modifier`

Public wording rule:
- keep `residual_role_integrity`
- do not expose `coherence` as the primary public label
- when wave cards still display wave connectivity, label it as `retained integrity`

## Current Gaps Between Spec And Implementation

Still not implemented as first-class result objects:
- a direct `role_fate_map` payload from the engine
- explicit `split_risk`, `collapse_risk`, or `elevation_potential` fields
- source drill-down at the task-row UI level
- weighted user-entered task shares

Still implemented as transitional compatibility surfaces:
- `role_outlook`
- `role_outlook_label`
- wave trajectory cards
- legacy transformation cluster lists
- legacy-answer questionnaire compatibility fallback

Current explanation surface:
- the engine now returns a live explanation summary generated from the current edited run
- the explanation block is now aligned to the same task/function graph and function metrics that drive the live score
- the client also surfaces task-to-function links and user-declared support links in the composition flow before scoring

## Current Acceptance Criteria

The current live result is considered aligned when:

1. the page shows current task makeup before the task breakdown verdict logic becomes abstract
2. direct AI pressure and indirect spillover are separate visible concepts
3. bargaining-power tasks are shown explicitly
4. role fate is a first-class label with confidence
5. task-level rows carry the main explanation burden
6. public copy does not rely on `coherence` as the main explanatory term

## Next Result-Surface Work

Recommended next changes:
- return `role_fate_map` directly from the engine rather than rebuilding it in the client
- add source drill-down and task-level citations
- add weighted task-share controls so users can do more than tag a handful of tasks
- add explicit before/after deltas for composition edits
- reduce or remove the legacy-answer compatibility fallback as external callers migrate
