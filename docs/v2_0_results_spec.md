# V2.0 Results Specification

## Purpose

This document locks the next `2.0` results-page redesign.

The redesign replaces the current `current -> exposed -> residual` framing with a `Role Fate Map` that:
- starts from the user's current role makeup
- separates direct AI pressure from indirect dependency spillover
- identifies which tasks carry bargaining power
- explains the likely organizational fate of the role

This is a product and implementation spec, not public copy.

## Core Result Principle

The public result should answer, in this order:

1. what your role is made of today
2. which tasks actually carry bargaining power
3. which tasks face direct AI pressure
4. which other tasks lose value because they support exposed core work
5. what the role most likely becomes inside an organization

The result should not lead with:
- timing claims
- raw structural jargon such as `coherence`
- generic task-cluster labels without task-level grounding
- binary replace / not replace framing

## Public Page Structure

The default page order is:

1. role summary header
2. current role breakdown
3. primary `Role Fate Map`
4. bargaining-power and risk-driver summary
5. structured narrative explanation
6. labor-market context panel
7. collapsed `Show model details` section

The page should show the current task makeup before the verdict. Users need to see what is important in the role before the model explains what changes.

## Header

The result header should display:
- selected broad role category
- chosen occupation anchor
- one-line summary of the likely role fate

Example summary patterns:
- `AI is more likely to compress the execution layer of this role than remove the role outright.`
- `Your bargaining power stays concentrated in judgment-heavy and coordination-heavy work.`
- `If AI becomes strong on the role's core value tasks, this role is vulnerable to collapse rather than simple augmentation.`

## Primary Headline Surface

The old five-card briefing should be retired from the default public surface.

Default public treatment:
- one dominant `Role Fate` verdict
- one short summary paragraph
- four compact supporting readouts:
  - `Core bargaining-power tasks`
  - `Directly pressured tasks`
  - `Indirectly at-risk support tasks`
  - `What still anchors the role`

### 1. Role Fate

Type:
- text label plus confidence

Purpose:
- communicate the most likely organizational outcome if AI capability continues to improve on the exposed parts of the role

Allowed values:
- `Augmented`
- `Compressed`
- `Elevated`
- `Split`
- `Expanded`
- `Collapsed`
- `Mixed transition`

Definitions:
- `Augmented`: AI speeds up meaningful parts of the role, but bargaining-power tasks remain human-led
- `Compressed`: the role stays structurally similar, but fewer workers are needed
- `Elevated`: lower-level execution compresses and the retained role becomes more judgment-heavy, coordinating, or supervisory
- `Split`: the role separates into a smaller high-value core plus lower-cost execution work
- `Expanded`: AI increases span of control, output, or demand enough to offset substitution pressure
- `Collapsed`: the role's core organizational reason to exist weakens materially if AI performs the key value-defining tasks
- `Mixed transition`: the model sees multiple plausible trajectories without a dominant state

### 2. Core Bargaining-Power Tasks

Type:
- ranked task list

Purpose:
- show which tasks most explain why the role exists and why the worker keeps leverage

For each row, show:
- task statement
- value importance
- current share
- durability note

### 3. Directly Pressured Tasks

Type:
- ranked task list

Purpose:
- show which tasks face the highest direct automation or substitution pressure

For each row, show:
- task statement
- current share
- direct pressure level
- likely mode (`augmentation`, `automation`, `mixed`)

### 4. Indirectly At-Risk Support Tasks

Type:
- ranked task list

Purpose:
- show tasks that are not directly easy for AI, but are tied to exposed core tasks

For each row, show:
- task statement
- supporting relationship
- dependent exposed task
- indirect risk level

### 5. What Still Anchors The Role

Type:
- short structured summary

Purpose:
- explain what work still justifies the role after direct and indirect pressure are applied

Use `residual_role_integrity` in the engine, but never expose `coherence` as public terminology.

## Primary Visualization

The primary chart is now the `Role Fate Map`.

Minimum MVP columns:
- `Current role`
- `Core bargaining power`
- `Direct AI pressure`
- `Indirect spillover`
- `Retained leverage`

Recommended display rules:
- use occupation-specific task rows, not only cluster labels
- emphasize value-defining tasks visually, not only high-time-share tasks
- visually distinguish direct risk from indirect spillover
- keep the retained column focused on what remains valuable, not only what remains present

The user should be able to answer visually:
- what work defines this role now?
- what work is directly exposed?
- what work weakens because it depends on exposed core tasks?
- what part of the role still carries bargaining power?
- what organizational fate follows from that structure?

## Structured Narrative

The narrative should be structured, not freeform.

Required sections:

1. `What defines the role today`
2. `What AI pressures first`
3. `Why bargaining power holds or weakens`
4. `What the role likely becomes`

The key sentence pattern should be:
- `If AI gets very good at X, then Y bargaining power weakens because Z.`

## Model Details Surface

The collapsed details surface should contain:
- direct exposure pressure
- indirect dependency pressure
- residual role integrity
- elevation potential
- split risk
- demand expansion modifier
- evidence strength and task coverage
- occupation anchor details

These should be legible labels, not unexplained internal scores.

## Recommended Result Object

This is the target app-facing contract for the redesigned result.

```ts
type RoleFateState =
  | 'augmented'
  | 'compressed'
  | 'elevated'
  | 'split'
  | 'expanded'
  | 'collapsed'
  | 'mixed_transition'

type TaskPressureMode = 'augment' | 'automate' | 'mixed'

type RoleTaskRow = {
  task_id: string
  task_statement: string
  task_family_id: string
  current_share: number
  value_centrality: number
  bargaining_power_weight: number
  direct_exposure_pressure: number
  indirect_dependency_pressure: number
  retained_leverage: number
  pressure_mode: TaskPressureMode
  role_criticality: 'core' | 'supporting' | 'optional'
  upstream_task_ids: string[]
  downstream_task_ids: string[]
  evidence_confidence: number
  source_labels: string[]
}

type RoleFateMap = {
  current_role: RoleTaskRow[]
  bargaining_power_tasks: RoleTaskRow[]
  directly_pressured_tasks: RoleTaskRow[]
  indirectly_at_risk_tasks: RoleTaskRow[]
  retained_leverage_tasks: RoleTaskRow[]
}

type V2Result = {
  selected_role_category: string
  selected_occupation_id: string
  selected_occupation_title: string
  role_fate_state: RoleFateState
  role_fate_label: string
  role_fate_confidence: number
  role_summary: string
  role_fate_map: RoleFateMap
  fate_drivers: string[]
  fate_counterweights: string[]
  residual_role_integrity: {
    score: number
    label: 'Strong' | 'Moderate' | 'Weak'
    note: string
  }
  bargaining_power_summary: {
    core_task_count: number
    exposed_core_share: number
    retained_core_share: number
    note: string
  }
  structural_scores: {
    direct_exposure_pressure: number
    indirect_dependency_pressure: number
    elevation_potential: number
    split_risk: number
    demand_expansion_modifier: number
  }
  narrative_summary: {
    current_role_definition: string
    direct_pressure_summary: string
    bargaining_power_summary: string
    role_fate_summary: string
  }
  evidence_summary: {
    task_coverage: number
    direct_task_evidence_confidence: number
    dependency_map_confidence: number
    occupation_anchor_confidence: number
    notes: string[]
  }
  labor_market_context: {
    employment_us: number
    annual_openings: number
    median_wage_usd: number
    projection_growth_pct: number
    latest_unemployment_rate: number | null
  } | null
  diagnostics: {
    direct_exposure_pressure: number
    indirect_dependency_pressure: number
    residual_role_integrity: number
    elevation_potential: number
    split_risk: number
    demand_expansion_modifier: number
    collapse_risk: number
    task_coverage_gap: number
  }
}
```

## Mapping To The Current Data Layer

The current normalized layer is still usable as a base, but it is not sufficient on its own.

Already useful:
- `data/normalized/occupation_tasks.csv`
- `data/normalized/occupation_task_clusters.csv`
- `data/normalized/task_exposure_evidence.csv`
- `data/normalized/task_augmentation_automation_priors.csv`
- `data/normalized/occupation_exposure_priors.csv`
- `data/normalized/occupation_labor_market_context.csv`

Still missing for the redesign:
- explicit task dependency edges
- value-centrality annotations
- bargaining-power annotations
- a cleaner distinction between core and supporting tasks
- stronger occupation coverage for thin task inventories

## Implementation Notes

- The current live page is an interim role-transformation briefing, not the final `Role Fate Map`.
- The first implementation pass should keep labor-market context secondary.
- The public result must never expose `coherence` again; replace it with `residual role integrity`.
- The public result should prefer task-level explanations over cluster-only labels whenever task rows are available.

## Next Dependency

The next required step is a task-data foundation pass:
- audit launch occupations for thin task coverage
- define the task/dependency schema
- add progressive structured task inputs that can override or enrich the occupation prior without forcing freeform uploads
