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

- `1.0` remains the live default experience on the existing public routes until `2.0` is fully ready.
- `2.0` will be developed on parallel preview routes first:
  - `main2/index.html`
  - `guide2/index.html`
  - `method2/index.html`
- `1.0` will eventually be archived separately rather than kept as the main product.
- The current hazard model will not remain the primary product ontology.
- The questionnaire concept stays, but outputs and internal mapping will change.
- The broad UI role categories from `1.0` remain useful as the front-door entry point.

## Proposed V2.0 Output Contract

The current recommended headline outputs are:

1. `Role Outlook`
2. `Top Exposed Work`
3. `Mode Of Change`
4. `Residual Role Strength`
5. `Personalization Fit`

The public `2.0` main page should not include a timing panel or METR-derived hazard outputs.

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
- worker-specific fit with the retained role
- labor-market context as a separate panel

### Practical implication

`2.0` is not a coefficient update to `1.0`.

It is a new primary model and should stand on its own without the old timing layer.

## Current Repo State

### 1.0 product surface still live

The current public app and docs remain `1.0` on the existing routes:
- `index.html`
- `method/index.html`
- `guide/index.html`

These pages remain framed around:
- displacement timelines
- METR
- blue/green hazard curves
- risk by year
- re-employment likelihood

### 2.0 preview surface now split onto parallel pages

The in-progress `2.0` product surface now lives separately at:
- `main2/index.html`
- `guide2/index.html`
- `method2/index.html`

This allows the team to keep iterating on the new transformation-first experience without replacing the live `1.0` hazard-model output before cutover.

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
- `BLS CPS occupation-group unemployment`

### Archived source

The following source remains in the repo only as archived reference material:

- `Manning / Aguirre 2026`

Important caveat:
- it is no longer part of the active `2.0` selector, prior, or runtime logic
- published paper tables still do not cover the launch set cleanly enough for launch use

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

Live `1.0` pages:
- `index.html`
- `method/index.html`
- `guide/index.html`

Parallel `2.0` preview pages:
- `main2/index.html`
- `method2/index.html`
- `guide2/index.html`

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
- `data/normalized/occupation_benchmark_scores.csv`
- `data/normalized/occupation_labor_market_context.csv`
- `data/normalized/occupation_unemployment_monthly.csv`

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
- `scripts/data/normalize_bls_unemployment.ps1`
- `scripts/data/normalize_manning_aguirre.ps1`
- `scripts/data/rebuild_v2_priors.ps1`

## Current Validation Status

The normalized layer currently validates successfully.

Latest known validated state:
- `34` occupations
- `669` normalized occupation-task rows
- `12` task clusters
- `12` registered sources
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
- integrated BLS monthly occupation-group unemployment context
- rebuilt active occupation priors from O*NET, Anthropic, and BLS
- rebalanced launch occupations to cover the broad public role categories
- built validators and normalization scripts
- created parallel `2.0` preview routes at `main2/index.html`, `guide2/index.html`, and `method2/index.html`
- added a labor-market context panel and unemployment chart to the `2.0` preview

### Completed but still provisional

- role-family fallback priors
- task-cluster inference
- quality indicators
- transition adjacency

These exist, but some are still heuristic rather than final research-grade inputs.

## What Is Not Done

### Product / UX

- `2.0` preview pages now exist separately, but `2.0` has not replaced the live `1.0` routes
- the live homepage still shows the `1.0` cards and hazard output
- the live homepage still shows the `1.0` charts
- the live broad category selection has not yet been rewired to occupation candidates

### Model logic

- a first-pass `2.0` transformation engine now exists in `v2_engine.js` and is wired into the preview route
- the preview result now includes labor-market context and a 12-month BLS unemployment chart for the selected occupation's mapped occupation group
- residual bundle scoring still needs better calibration and direct task-bundle inputs
- decoupling / O-Ring logic is still only partial / heuristic
- personalization-fit scoring using the new normalized layer is still heuristic rather than final

### Questionnaire

- current questionnaire still reflects `1.0` hazard logic
- no finalized `2.0` mapping from questionnaire responses to:
  - task mix
  - exposure mode
  - coupling
  - residual role strength
  - personalization fit

### Documentation

- the live public docs at `guide/index.html` and `method/index.html` still explain the `1.0` hazard model
- the `2.0` documentation now lives on the parallel preview pages:
  - `guide2/index.html`
  - `method2/index.html`
- the preview docs still need a full rewrite before cutover

## Major Open Questions

These decisions should be resolved before large UI implementation begins:

1. Which parts of the current questionnaire remain unchanged, and which must be redesigned?
2. How much personalization should come from explicit task-mix input versus occupation priors?
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
6. personalization-fit scoring

### Result

- transformation-first summary
- task-level explanation
- residual role narrative
- personalization-fit summary
- labor-market context panel

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
- personalization fit

Status:
- first runtime scaffold now exists in `v2_engine.js`

Remaining work:
- improve scoring quality
- add direct task-family and residual-bundle inputs from the UI
- wire the current homepage flow to the engine output

### Workstream 4: Occupation prior improvement

Improve occupation-level priors and precision on top of the launch-safe stack.

Current active stack:
- O*NET task structure
- Anthropic task exposure / augmentation evidence
- BLS labor-market context

Next candidate additions:
- Eloundou / GPTs-are-GPTs / EIG-style exposure dataset
- OECD / PIAAC benchmarks in a later phase

### Workstream 5: Source integration roadmap

Integrate additional sources in strict priority order:

1. `Anthropic Economic Index 2026-01-15`
   - normalize the imported raw release into the existing task and task-cluster pipeline
   - use it as the primary Anthropic task exposure and augmentation/automation layer
   - retain the older Anthropic extract only as documented fallback coverage where the 2026 release still does not resolve a mapped row

2. `Benchmark validation layer`
   - add `AIOE` and optionally `ILO refined GenAI exposure index` only as comparison layers
   - use them to sanity-check occupation priors and directional rankings
   - do not let them drive headline outputs unless they clearly outperform the active stack

3. `OECD / PIAAC phase`
   - use OECD only after the main role-briefing model is stable
   - apply it to autonomy, learning intensity, quality-of-work, and resilience context rather than primary exposure scoring

Explicit non-goals:
- do not restore `Manning / Aguirre` to active scoring
- do not promote internal stubs into public headline outputs
- do not reintroduce METR timing outputs into the `2.0` main page

### Workstream 6: Product migration

Continue building `2.0` on the parallel preview routes, then replace the current homepage experience only once the new outputs are ready. Retain the `1.0` model as a separate archive after cutover.

### Workstream 7: Documentation rewrite

Rewrite:
- `guide/index.html`
- `method/index.html`

so the public explanation matches the `2.0` ontology.

## Recommended Near-Term Sequence

1. keep the live `1.0` routes stable while iterating on `main2/index.html`, `guide2/index.html`, and `method2/index.html`
2. improve the `2.0` transformation-engine scoring with the new intake fields
3. tighten category-to-occupation selection so launch roles map more precisely to O*NET / BLS / Anthropic evidence
4. import any remaining benchmark data for `ILO` once a stable raw occupational extract is available
5. review the new benchmark validation report and inspect large disagreements before changing any public score logic
6. rewrite the preview guide and methodology pages

## Acceptance Criteria For V2.0

`2.0` is ready when:

1. the homepage experience is transformation-first
2. the result distinguishes exposure from displacement
3. the result distinguishes augmentation from automation
4. the result shows what remains after exposed tasks are absorbed
5. the result expresses whether the residual bundle is still viable
6. the result includes worker-specific fit with the retained role
7. the public `2.0` main page does not depend on timing or hazard outputs
8. public docs describe the actual `2.0` model rather than the current `1.0` model

## Current Source Strategy

### Active for public `2.0`

- `O*NET`
  - occupation structure
  - task bundle priors
  - work-context scaffolding
- `Anthropic Economic Index 2026-01-15 normalized task telemetry`
  - task exposure
  - augmentation vs automation split
  - evidence confidence inputs from work-use share, human-only ability, task success, and AI autonomy
- `BLS OEWS / projections / CPS`
  - labor-market context
  - selector support
  - monthly unemployment chart
- `src_v2_launch_aggregate_2026_03`
  - derived occupation prior built from the active stack above

### Present but not active in headline scoring

- `Anthropic Economic Index 2025-03-27 legacy extract`
  - retained only as fallback supporting coverage behind the primary 2026 Anthropic layer
- `AIOE`
  - imported and normalized as a benchmark-only validation layer
- `ILO refined GenAI exposure index`
  - raw chart data imported locally, but normalization is still blocked by the weak O*NET-to-ISCO join path
- `OECD / PIAAC`
  - planned later resilience / quality layer

### Explicitly excluded

- `Manning / Aguirre`
- legacy `METR` timing logic
- internal stub layers as public scoring inputs

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

## Session Update - 2026-03-08

- completed:
  - removed Manning from the active `2.0` selector and prior stack
  - rebuilt occupation exposure and adaptation priors from O*NET, Anthropic, and BLS inputs
  - added normalized BLS monthly unemployment data for mapped occupation groups
  - extended `v2_engine.js` to return labor-market context plus a 12-month unemployment series
  - added a labor-market context panel and unemployment chart to `main2/index.html`
- changed decisions:
  - Manning remains archived only and is not a launch input
  - official BLS monthly occupation-group unemployment is the launch unemployment chart, not custom role-level monthly estimates
- new blockers:
  - occupation-to-BLS unemployment mapping is still group-level rather than detailed-role monthly
  - preview guide and methodology pages still need to explain the new labor-market panel
- next recommended step:
  - retrofit the intake and role selector so users choose a more precise launch occupation before role-specific panels render

## Session Update - 2026-03-09-B

- completed:
  - removed the secondary timing view from the main `2.0` page surface
  - reworked the main `2.0` result into a five-factor role briefing
  - changed the main outputs to role outlook, top exposed work, mode of change, residual role strength, and personalization fit
  - kept labor-market metrics as a separate context panel rather than a headline score input
  - changed `Other/Custom` so it no longer falls back to the old timing-only behavior on the main `2.0` page
- changed decisions:
  - the main `2.0` page is now a role-structure briefing only, not a timing forecast
  - timing and METR hazard outputs are excluded from the public `2.0` main-page experience
- new blockers:
  - the guide and methodology pages still describe older output labels and timing concepts
  - the embedded legacy hazard code still exists under the hood and should be removed in a future cleanup pass
- next recommended step:
  - rewrite `guide2` and `method2` so the public explanation matches the new five-factor model contract

## Session Update - 2026-03-09-C

- completed:
  - defined a strict source-integration roadmap for `2.0`
  - locked Anthropic `2026-01-15` as the next real integration target
  - locked `AIOE` and `ILO` as benchmark-only layers unless proven better than the active stack
  - locked `OECD / PIAAC` as a later resilience / job-quality phase rather than a launch exposure input
- changed decisions:
  - the active public `2.0` role model is now explicitly `O*NET + Anthropic + BLS + derived launch prior`
  - non-active sources must be documented as either `benchmark`, `future phase`, or `excluded`
- new blockers:
  - no raw benchmark-source files for `AIOE` or `ILO` are present locally yet
  - the docs still need a corresponding rewrite on `guide2` and `method2`
- next recommended step:
  - import benchmark datasets and build a benchmark comparison normalizer against the now-live Anthropic 2026 stack

## Session Update - 2026-03-09-D

- completed:
  - integrated the Anthropic `2026-01-15` raw release into `normalize_anthropic_ei.ps1`
  - switched the live v2 normalized Anthropic path to the 2026 release with explicit O*NET-task aggregation rules
  - retained the older Anthropic `2025-03-27` extract only as fallback coverage for unresolved rows
  - added `scripts/data/compare_anthropic_releases.ps1` and generated `docs/data/anthropic_2026_integration_report.md`
- changed decisions:
  - the active public `2.0` task-evidence stack is now `O*NET + Anthropic 2026 + BLS`, with Anthropic `2025-03-27` retained as fallback only
  - richer Anthropic task telemetry now informs evidence confidence, not just exposure and mode shares
- new blockers:
  - no raw `AIOE` or `ILO` files are present locally yet, so benchmark validation cannot be implemented beyond documentation and source registration
  - a small number of legacy Anthropic fallback rows still remain until the 2026 release covers those mapped tasks directly
- next recommended step:
  - import benchmark datasets and build a benchmark comparison normalizer rather than expanding the public score stack further

## Session Update - 2026-03-09-E

- completed:
  - imported the raw `AIOE` benchmark workbooks into `data/raw/aioe`
  - imported the raw ILO occupation-exposure article and chart dataset into `data/raw/ilo`
  - added `scripts/data/normalize_aioe.ps1` to generate `occupation_benchmark_scores.csv`
  - added `scripts/data/compare_benchmark_sources.ps1` and generated `docs/data/benchmark_validation_report.md`
  - updated validation and schema docs so the benchmark layer is a first-class normalized contract
- changed decisions:
  - `AIOE` is now an imported benchmark-only source, not just a planned source-registry placeholder
  - `ILO` raw data is now imported, but normalization still remains pending until a stronger `O*NET -> ISCO` bridge exists
- new blockers:
  - the current `crosswalk_onet_to_isco.csv` is still explicitly a placeholder, which blocks credible ILO occupation benchmarking
  - benchmark disagreements now need substantive review before any source-promotion decision is made
- next recommended step:
  - inspect the largest benchmark disagreements and decide whether they reflect Anthropic task coverage issues, occupation bundling issues, or expected conceptual differences

## Session Update - 2026-03-09-F

- completed:
  - added `scripts/data/diagnose_benchmark_disagreements.ps1`
  - generated `docs/data/benchmark_disagreement_diagnostics.md` to classify large AIOE disagreements into coverage-gap, stub-dependency, low-confidence, or conceptual-review buckets
- changed decisions:
  - benchmark review is now a reproducible diagnostic step, not a manual interpretation pass
- new blockers:
  - several high-gap occupations still need human review even after automated bucketing, especially where the benchmark is high but the live exposure prior remains low
- next recommended step:
  - review the `conceptual_gap_review` occupations first and decide whether the issue is occupation bundling, Anthropic task coverage, or an expected methodology difference with AIOE

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

## Session Update - 2026-03-09

- completed:
  - restored the live `index.html`, `guide/index.html`, and `method/index.html` routes to the older `1.0` hazard-model experience
  - created parallel `2.0` preview entry points at `main2/index.html`, `guide2/index.html`, and `method2/index.html`
  - updated the preview-page navigation so the new files cross-link within the `2.0` preview set
- changed decisions:
  - `2.0` should no longer replace the live homepage incrementally on the same files
  - `2.0` should be developed on parallel preview routes until the full cutover is ready
- new blockers:
  - the `2.0` preview content still needs to diverge further from the legacy hazard-model presentation
  - there is not yet a cutover checklist for swapping the live routes from `1.0` to `2.0`
- next recommended step:
  - continue `2.0` UI and documentation work only on the new preview routes, leaving the live `1.0` pages unchanged

## Session Update - 2026-03-09-G

- completed:
  - promoted the `2.0` model to the live root route while preserving the archived `1.0` homepage at `main-old/index.html`
  - refactored the `2.0` entry flow from legacy role presets into `category -> occupation -> hierarchy -> questionnaire`
  - added direct occupation search so users can jump straight to a mapped launch occupation even when the broad category is imperfect
  - rewrote the visible questionnaire copy and grouping around the `2.0` model:
    - `Exposure Conditions`
    - `Bundle Integrity`
    - `Retained Work`
    - `Adoption Context`
    - `Personalization Fit`
  - added a new `value-defining task family` input and wired it into the engine as `roleCriticalClusters`
- changed decisions:
  - broad role categories are now helper filters, not the primary identity of the model
  - the `2.0` intake is now explicitly occupation-anchored, even though legacy `Q1-Q19` compatibility remains in code
- new blockers:
  - the scoring layer still uses the current questionnaire-to-signal translation rather than a fully re-derived `2.0` weighting system
  - benchmark-disagreement occupations still need targeted occupation-prior and task-bundle cleanup
- next recommended step:
  - tighten the downstream scoring logic and occupation-prior coverage around the new direct `2.0` inputs, starting with the largest benchmark-disagreement roles

## Session Update - 2026-03-09-H

- completed:
  - tightened the live `2.0` scoring layer so direct questionnaire inputs now materially change the output:
    - role-defining task families now receive extra weight in exposure, elevation, retained-bundle interpretation, and top-exposed selection
    - current AI/tool support and adoption context now modify augmentation, automation, and absorbed-share calculations
    - the residual-role and personalization-fit scores now use role-critical retained-share diagnostics instead of relying only on the occupation prior and broad structural signals
  - expanded the live result payload with explicit `role_defining_work` and richer diagnostics for adoption pressure, tool support, and critical-cluster transformation
  - aligned the `2.0` methodology and spec docs to the live formulas and result contract
- changed decisions:
  - direct `2.0` inputs are now first-class score drivers, not just UI hints layered on top of occupation priors
  - occupation priors remain anchor inputs, but cluster-level task evidence and role-critical user inputs now dominate more of the public result
- new blockers:
  - benchmark-disagreement occupations still need targeted occupation-prior and task-bundle cleanup
  - the questionnaire still runs through the legacy `Q1-Q19` compatibility layer rather than a fully re-derived `2.0` signal system
  - prefill behavior still carries some legacy category and hierarchy assumptions
- next recommended step:
  - improve occupation-prior coverage and targeted mappings for disagreement-heavy roles such as Management Analysts, Market Research Analysts, Human Resources Specialists, Accountants and Auditors, and Lawyers
