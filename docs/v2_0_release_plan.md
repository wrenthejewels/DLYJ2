# V2.0 Release Plan

## Purpose

This document is the working source of truth for the `2.0` release.

Use it to track:
- product decisions
- current implementation status
- completed work
- open questions
- next steps

Future sessions should update this file when material progress is made.

## Product Goal

`2.0` replaces the current `1.0` homepage experience.

The current `1.0` model is a hazard-first displacement timeline model:
- questionnaire-driven
- METR-based capability curve
- job-level automation hazard
- compression hazard
- re-employment estimate

`2.0` is a different model.

It should primarily answer:
- which parts of a role are exposed
- whether that exposure is more likely augmentation or automation
- whether exposed tasks can be decoupled from the rest of the role
- what the residual task bundle looks like
- whether the transformed role remains viable
- whether the worker can adapt into the transformed role

Displacement timing may remain in some form, but only as a secondary output.

## Locked Product Decisions

These decisions are currently settled unless explicitly revised:

- `2.0` is the default homepage experience.
- `1.0` will eventually be archived separately rather than kept as the main product.
- The current hazard model will not remain the primary product ontology.
- The questionnaire concept stays, but outputs and internal mapping will change.
- The broad UI role categories from `1.0` remain useful as the front-door entry point.

## Proposed V2.0 Output Contract

The current recommended headline outputs are:

1. `Likely Role State`
2. `Most Exposed Task Cluster`
3. `Automation vs Augmentation Balance`
4. `Residual Role Viability`
5. `Adaptation Capacity`
6. `Transformation Pressure by 2030`

The current `1.0` style timeline outputs should be demoted to a secondary panel or derived summary, not removed from the model space entirely.

Examples of secondary timeline framing:
- `Secondary Displacement Hazard`
- `Displacement Window`
- `Bundle Collapse Risk`

## Conceptual Shift From 1.0 To 2.0

### 1.0 ontology

`1.0` is built around:
- METR capability growth
- task-duration buckets
- job-level hazard activation
- implementation delay
- compression hazard
- displacement timing

### 2.0 ontology

`2.0` should be built around:
- occupation prior
- task bundle structure
- task exposure evidence
- augmentation vs automation split
- bundle decoupling / O-Ring logic
- residual role viability
- worker adaptation capacity
- optional secondary hazard

### Practical implication

`2.0` is not a coefficient update to `1.0`.

It is a new primary model that can still produce a timing-like view as a downstream output.

## Current Repo State

### 1.0 product surface still live

The current public app and docs are still `1.0`:
- `index.html`
- `method/index.html`
- `guide/index.html`

These pages are still framed around:
- displacement timelines
- METR
- blue/green hazard curves
- risk by year
- re-employment likelihood

### 2.0 data foundation now exists

The repo now contains a substantial data and normalization layer for `2.0`.

Top-level additions:
- `data/`
- `docs/data/`
- `scripts/data/`

Key data/model infrastructure already added:
- normalized occupation tables
- task cluster tables
- task exposure evidence tables
- occupation prior tables
- labor market context tables
- source metadata and provenance
- normalization scripts and validators

## Data Work Completed

### Real sources integrated

The following real sources are already in the repo and wired into normalized outputs:

- `O*NET`
- `Anthropic Economic Index`
- `BLS OEWS 2024`
- `BLS employment projections`

### Partial source integrated

The following source is now partially integrated:

- `Manning / Aguirre 2026`

Important caveat:
- published paper tables only cover part of the current launch set
- mapped O*NET codes are medium-confidence because the paper does not publish O*NET codes directly

### Current Manning coverage

Current coverage of selected launch occupations:
- `15 / 34` covered by the extracted published tables
- `19 / 34` not covered

Because of this, Manning is currently treated as a partial occupation-prior layer, not the sole launch prior.

## Launch Occupation Coverage

The launch seed has been rebalanced to align with the broad role categories already exposed in the `1.0` UI.

Current launch scope:
- `34` selected occupations
- `2` stretch candidates

Important bridge file:
- `data/metadata/ui_role_category_map.csv`

This file maps the current broad role categories such as:
- `Administrative`
- `Data Analysis`
- `Product Management`
- `Journalism`
- `Engineering`

to backing occupations in the `2.0` launch set.

## Key Files

### Product pages

- `index.html`
- `method/index.html`
- `guide/index.html`

### 2.0 planning / docs

- `docs/v2_0_release_plan.md`
- `docs/data/launch_coverage.md`
- `docs/data/schema_overview.md`
- `docs/data/source_priority.md`
- `data/metadata/normalization_notes.md`
- `data/metadata/source_registry.yaml`

### Core normalized data

- `data/normalized/occupations.csv`
- `data/normalized/occupation_selector_index.csv`
- `data/normalized/occupation_tasks.csv`
- `data/normalized/task_cluster_membership.csv`
- `data/normalized/occupation_task_clusters.csv`
- `data/normalized/task_exposure_evidence.csv`
- `data/normalized/task_augmentation_automation_priors.csv`
- `data/normalized/occupation_exposure_priors.csv`
- `data/normalized/occupation_adaptation_priors.csv`
- `data/normalized/occupation_labor_market_context.csv`

### Metadata controlling launch behavior

- `data/metadata/launch_occupation_seed.csv`
- `data/metadata/ui_role_category_map.csv`
- `data/metadata/role_family_stub_profiles.csv`
- `data/metadata/role_family_cluster_profiles.csv`
- `data/metadata/occupation_stub_overrides.csv`

### Data pipeline scripts

- `scripts/data/seed_launch_stubs.ps1`
- `scripts/data/build_selector_index.ps1`
- `scripts/data/validate_normalized_data.ps1`
- `scripts/data/normalize_onet.ps1`
- `scripts/data/infer_task_clusters.ps1`
- `scripts/data/normalize_anthropic_ei.ps1`
- `scripts/data/normalize_bls.ps1`
- `scripts/data/normalize_manning_aguirre.ps1`

## Current Validation Status

The normalized layer currently validates successfully.

Latest known validated state:
- `34` occupations
- `669` normalized occupation-task rows
- `12` task clusters
- `10` registered sources
- `34` selected launch occupations
- `2` stretch occupations

## What Is Done

### Completed

- established the `2.0` data directory and schema structure
- created normalized CSV contracts
- created source registry and normalization notes
- built launch occupation seed and UI-to-occupation bridge
- integrated real O*NET occupation/task structure
- integrated real Anthropic task-level evidence
- integrated real BLS wage/employment/projection context
- integrated partial Manning occupation-level priors
- rebalanced launch occupations to cover the broad public role categories
- built validators and normalization scripts

### Completed but still provisional

- role-family fallback priors
- task-cluster inference
- partial Manning title-to-O*NET mapping
- quality indicators
- transition adjacency

These exist, but some are still heuristic rather than final research-grade inputs.

## What Is Not Done

### Product / UX

- `2.0` results page has not been implemented
- `2.0` homepage flow has not been implemented
- `1.0` cards are still live
- `1.0` charts are still live
- broad category selection has not yet been rewired to occupation candidates

### Model logic

- no actual `2.0` transformation engine yet
- no residual bundle scoring yet
- no decoupling / O-Ring logic yet
- no adaptation scoring logic using the new normalized layer yet
- no new secondary hazard derived from the new ontology yet

### Questionnaire

- current questionnaire still reflects `1.0` hazard logic
- no finalized `2.0` mapping from questionnaire responses to:
  - task mix
  - exposure mode
  - coupling
  - residual viability
  - adaptation

### Documentation

- `guide/index.html` still explains the `1.0` hazard model
- `method/index.html` still documents the `1.0` METR/hazard framework
- no public `2.0` methodology page exists yet

## Major Open Questions

These decisions should be resolved before large UI implementation begins:

1. Which parts of the current questionnaire remain unchanged, and which must be redesigned?
2. What exact form should the new secondary hazard output take?
3. Do we want occupation selection to be:
   - broad category only
   - category then occupation
   - inferred occupation candidates after questionnaire answers

The results-page structure and headline output contract are now documented in:
- `docs/v2_0_results_spec.md`

## Recommended V2.0 Architecture

### Intake

- keep broad role category entry
- map category to occupation candidates
- use questionnaire to personalize within the occupation prior

### Engine

1. occupation prior
2. task bundle reconstruction
3. task exposure scoring
4. augmentation vs automation split
5. bundle decoupling / residual role estimation
6. adaptation scoring
7. optional secondary hazard

### Result

- transformation-first summary
- task-level explanation
- residual role narrative
- adaptation summary
- secondary timing panel

## Recommended Workstreams

### Workstream 1: Output contract

Define:
- final headline cards
- narrative sections
- main chart
- secondary chart or timing panel

Status:
- substantially locked in `docs/v2_0_results_spec.md`

Remaining work:
- translate the spec into actual UI implementation

### Workstream 2: Questionnaire redesign

Define the `2.0` questionnaire schema and mapping rules.

Target dimensions:
- occupation anchoring
- task composition
- coupling / decoupling
- adoption context
- adaptation capacity

Status:
- now documented in `docs/v2_0_questionnaire_spec.md`

Remaining work:
- translate the spec into actual input fields and scoring code

### Workstream 3: Transformation model logic

Implement:
- exposure scoring
- automation vs augmentation balance
- residual bundle viability
- adaptation capacity
- secondary hazard summary

Status:
- first runtime scaffold now exists in `v2_engine.js`

Remaining work:
- improve scoring quality
- add direct task-family and residual-bundle inputs from the UI
- wire the current homepage flow to the engine output

### Workstream 4: Occupation prior improvement

Add broader occupation-level priors to reduce partial-source coverage gaps.

Best near-term candidate:
- Eloundou / GPTs-are-GPTs / EIG-style exposure dataset

### Workstream 5: Product migration

Replace the current homepage experience with `2.0` while retaining the `1.0` model only as internal history / later archive material.

### Workstream 6: Documentation rewrite

Rewrite:
- `guide/index.html`
- `method/index.html`

so the public explanation matches the `2.0` ontology.

## Recommended Near-Term Sequence

1. wire the homepage to category -> occupation candidates -> transformation outputs
2. add broader occupation-level exposure coverage
3. improve the transformation-engine scoring with the new intake fields
4. rewrite guide and methodology
5. finalize what secondary hazard output survives from `1.0`

## Acceptance Criteria For V2.0

`2.0` is ready when:

1. the homepage experience is transformation-first
2. the result distinguishes exposure from displacement
3. the result distinguishes augmentation from automation
4. the result shows what remains after exposed tasks are absorbed
5. the result expresses whether the residual bundle is still viable
6. the result includes worker adaptation capacity
7. any timing or hazard output is clearly secondary
8. public docs describe the actual `2.0` model rather than the current `1.0` model

## Session Update Protocol

When future sessions make meaningful progress, update this file with:

- what changed
- what remains blocked
- whether any major decisions changed
- whether the recommended next steps changed

Suggested update format:

### Session Update - YYYY-MM-DD

- completed:
- changed decisions:
- new blockers:
- next recommended step:

## Session Update - 2026-03-06

- completed:
  - created the `2.0` data foundation
  - integrated real O*NET, Anthropic, BLS, and partial Manning data
  - expanded and rebalanced the launch occupation set to `34` selected occupations
  - added a UI role-category bridge file
  - separated fallback priors from real Manning priors
- changed decisions:
  - `2.0` is now the intended default homepage experience
  - `1.0` will eventually be archived rather than remain the main public model
- new blockers:
  - no full `2.0` transformation engine yet
  - no final questionnaire redesign yet
  - Manning coverage remains partial
- next recommended step:
  - lock the `2.0` results-page structure and data contract before more implementation

## Session Update - 2026-03-06-B

- completed:
  - created `docs/v2_0_results_spec.md`
  - locked the recommended `2.0` headline cards
  - locked the recommended transformation-first page structure
  - defined a minimum app-facing `V2Result` contract
  - moved the old `1.0` timeline outputs into a secondary-panel role in the spec
- changed decisions:
  - the primary `2.0` chart should be a `Role Transformation Map`
  - the current `1.0` chart should not remain the main result visual
- new blockers:
  - no questionnaire-to-result mapping yet
  - no actual `2.0` transformation engine implementing the result contract yet
- next recommended step:
  - define the `2.0` questionnaire mapping against the locked result contract

## Session Update - 2026-03-06-C

- completed:
  - created `docs/v2_0_questionnaire_spec.md`
  - mapped the current `Q1-Q19` intake into the `2.0` transformation model
  - identified which legacy questions can be kept, reinterpreted, or renamed
  - identified the minimum new `2.0`-specific fields needed for first launch
- changed decisions:
  - `Q1-Q19` can remain temporarily as an internal migration layer
  - a full questionnaire rewrite is not required before the first transformation-engine scaffold
- new blockers:
  - no model code yet turns questionnaire answers into the new `V2Result` contract
- next recommended step:
  - implement the first `2.0` transformation-engine scaffold against the normalized data and questionnaire mapping

## Session Update - 2026-03-06-D

- completed:
  - added `v2_engine.js` as the first runtime-capable `2.0` transformation-engine scaffold
  - added `scripts/test_v2_engine.js` as a local harness for validating the scaffold
  - implemented occupation resolution from the new UI role-category bridge
  - implemented first-pass scoring for:
    - exposed task share
    - automation vs augmentation balance
    - residual role viability
    - adaptation capacity
    - transformation pressure by 2030
    - secondary hazard summary
- changed decisions:
  - the first `2.0` engine will be heuristic and data-backed before it is fully research-tuned
- new blockers:
  - the homepage still does not call the new engine
  - the current UI does not yet collect the new `2.0`-specific inputs
- next recommended step:
  - wire the homepage flow to the new engine and render a first-pass `2.0` result object

## Session Update - 2026-03-06-E

- completed:
  - wired the homepage to `v2_engine.js`
  - added occupation-candidate resolution and user selection through the new occupation match dropdown
  - rendered the `2.0` headline cards, role transformation map, narrative blocks, and evidence summary on the homepage
  - demoted the old chart and hazard cards into a secondary timing view while preserving the legacy calculations
  - added graceful fallback behavior for `Other/Custom`, which still has no mapped launch occupation in `2.0`
- changed decisions:
  - `Other/Custom` will remain supported only by the secondary timing view until a proper `2.0` occupation-resolution path exists
- new blockers:
  - the homepage still relies on legacy `Q1-Q19` only and does not collect the new `2.0`-specific fields directly
  - the public guide and methodology still describe the old `1.0` ontology
- next recommended step:
  - add the minimum new `2.0` intake fields and start replacing the current guide and methodology with transformation-first documentation

## Session Update - 2026-03-06-F

- completed:
  - added minimum direct `2.0` intake fields on the homepage for:
    - primary task family
    - secondary task family
    - current AI/tool support
    - residual role strength after routine work is absorbed
  - wired those direct inputs into the `v2` engine without changing the legacy timing model
  - rewrote the top framing of `guide/index.html` so it explains the transformation model first and the timing view second
  - rewrote the top framing of `method/index.html` so it documents the `2.0` pipeline first and treats the old hazard math as a secondary appendix
- changed decisions:
  - the first production `2.0` homepage will use a hybrid intake: legacy `Q1-Q19` plus a narrow set of direct transformation fields
- new blockers:
  - the guide and methodology still contain substantial legacy timing detail further down the page, even though the public framing is now corrected
  - occupation-level exposure priors remain incomplete for uncovered launch roles
- next recommended step:
  - improve occupation-prior coverage and then tighten the downstream scoring logic around the new direct `2.0` inputs
