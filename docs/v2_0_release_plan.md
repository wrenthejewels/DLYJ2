# V2.0 Release Plan

## Status

This file is no longer the main planning document.

The canonical planning and handoff doc is:
- `docs/role_transformation_overhaul_plan.md`

Use this file only as a short release snapshot for the currently shipped surface.

## Purpose

This document gives a concise snapshot of what is live in the repo right now.

## Product Goal

`2.0` now aims to answer:
- what the role is made of today
- which tasks carry bargaining power
- which tasks face direct AI pressure
- which tasks weaken because they depend on exposed work
- what organizational fate the role most likely moves toward

## Current Shipped State

The repo now ships a working role-fate implementation with:
- occupation-specific task inventory inputs
- an editable role-composition studio with tasks, functions, and custom support links
- seeded + manually expanded task-role graph coverage
- direct and indirect task-pressure scoring
- calibrated `Role Fate` labels
- a task-derived `Role Fate Map`
- narrative drivers and counterweights

## Workstream Status

### 1. Result-surface redesign

Status:
- implemented

Current state:
- role-fate headline is live
- role-fate confidence is live
- five-column role-fate map is live
- structured narrative cards are live
- task-level breakdown is live

Still open:
- return `role_fate_map` directly from the engine instead of building it in the client
- add task-level source drill-down

### 2. Task-data foundation

Status:
- implemented baseline

Current state:
- task-role graph contract documented
- seeded role-graph build script live
- manual task and dependency expansions added for thin occupations
- normalized layer now includes:
  - `occupation_task_inventory.csv`
  - `task_dependency_edges.csv`
  - `occupation_task_role_profiles.csv`

Current snapshot:
- `710` task inventory rows
- `986` dependency edges
- `34` occupation role profiles
- all `34` launch occupations covered

Still open:
- more manual review of seeded weights
- stronger evidence and dependency coverage per occupation

### 3. Intake redesign

Status:
- phase 1 implemented

Current state:
- category, occupation, and hierarchy remain the anchor
- an editable role-composition studio is live with:
  - source-bucketed tasks
  - reviewed function anchors
  - custom task-to-task support links
  - custom task-to-function links
  - graph-level task-share overrides
- the visible questionnaire now renders as:
  - core questions
  - optional deeper modules
  - a live role-refinement readout
- the engine still uses the legacy-answer bridge under the hood to derive the structured role-refinement profile

Still open:
- lighter-weight task-share buckets on top of the current share-override controls
- explicit AI-danger task prompt
- retained-role distinctiveness prompt

### 4. Engine redesign

Status:
- implemented baseline

Current state:
- cluster shares blend occupation task-cluster priors with task-inventory summaries
- questionnaire answers are first converted into a structured role-refinement profile
- runtime scoring then uses:
  - `functionRetention`
  - `capabilitySignal`
  - `couplingProtection`
  - `adoptionPressure`
  - `augmentationFit`
  - `substitutionRiskModifier`
  - friction dimensions
- task-role graph scoring now produces:
  - `direct_exposure_pressure`
  - `indirect_dependency_pressure`
  - `retained_leverage_score`
  - `residual_role_integrity`
- role-fate classifier now emits:
  - `role_fate_state`
  - `role_fate_label`
  - `role_fate_confidence`
  - `role_fate_readout`
  - `fate_drivers`
  - `fate_counterweights`

Still open:
- explicit `split_risk`, `collapse_risk`, and `elevation_potential` fields
- formal calibration set beyond the current anchor occupations

### 5. Documentation rewrite

Status:
- implemented baseline, still evolving

Current state:
- `docs/v2_0_results_spec.md` updated to the live contract
- `docs/v2_0_questionnaire_spec.md` updated to the live intake
- `method/index.html` updated to describe the live math and functional flow
- `docs/role_transformation_overhaul_plan.md` is now the canonical planning doc

Still open:
- continue tightening `guide/index.html` and `method/index.html` as the live model evolves
- add source references on the methodology page if desired

## Current Validation Layer

The repo now includes:
- `scripts/test_v2_engine.js`
- `scripts/test_role_fate_calibration.js`
- `scripts/test_v2_ui_contract.js`

Current validation coverage:
- engine payload integrity
- task-inventory access
- composition edit propagation
- anchor occupation role-fate calibration
- UI contract for the role studio, dependency editor, schema-rendered questionnaire, and role-fate columns

## Recommended Next Sequence

1. add multi-anchor function graphs
2. reduce proxy dependence with more direct task evidence and benchmark promotion
3. write occupation-by-occupation explanation reports
4. replace the remaining legacy questionnaire bridge with a native factor-based runtime contract

## Release Readiness Read

The `2.0` role-fate pass is now good enough for continued iteration, but not final.

Main reasons:
- the ontology is now consistent
- the public result is materially clearer than the earlier exposure/residual surface
- the data layer supports dependency-driven spillover
- the classifier has an initial calibrated spread across multiple fate states

Main remaining risks:
- task weights are still partly seeded heuristics
- user task composition is still too coarse
- source drill-down is not yet visible in the UI
- manual browser QA across devices and occupations is still needed
