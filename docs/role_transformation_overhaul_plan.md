# Current Model Working Plan

## Read This First

This is the canonical living planning and handoff document for the current model.

A new session should read this document first to understand:
- what the live product is now
- what has already been implemented
- what the current model stack looks like
- what still needs to be done next

Supporting docs:
- `docs/README.md` = documentation entrypoint and source-of-truth routing
- `docs/v2_0_questionnaire_spec.md` = current intake and questionnaire contract
- `docs/v2_0_results_spec.md` = current result object and UI/result contract
- `docs/data/calibration_framework.md` = current empirical calibration / validation framework
- `docs/model_build_history.md` = plain-speak history of how the model evolved

## Documentation Structure

Keep this file as the one central planning and handoff doc.

Recommended doc roles:
- `docs/README.md` = first stop for doc routing and precedence
- `docs/role_transformation_overhaul_plan.md` = canonical current-state, roadmap, and next-steps document
- `docs/v2_0_questionnaire_spec.md` = supporting intake and questionnaire reference
- `docs/v2_0_results_spec.md` = supporting output/result contract reference
- `docs/data/calibration_framework.md` = canonical calibration-layer reference
- `docs/model_build_history.md` = plain-speak history and future writing input

Recommended merge decision:
- do not merge the questionnaire or results specs into this file, because they work better as narrow contract docs
- do not create a second top-level roadmap or release snapshot doc
- if future planning notes are created, fold them back into this file instead of creating another top-level roadmap

Update rule:
- update this file whenever the live model, roadmap, or implementation status materially changes
- update `docs/model_build_history.md` when the change is architecturally meaningful enough to matter for the model narrative

## Current Live Surface

Current live pages:
- `/` = model
- `/guide` = guide
- `/method` = methodology

Archived pages:
- `archive/legacy-pages/` = older model/guide/method surfaces kept for reference
- `archive/route-aliases/` = older `*2` / `*3` route snapshots and aliases

## Current Live Model Summary

The live model is a role-fate model built on top of:
- a mapped occupation anchor
- an occupation task inventory
- a task-role graph with dependency edges
- a task-source evidence resolver spanning live task evidence, reviewed task estimates, benchmark task labels, and proxy fallback
- a hybrid task-pressure stack where cluster priors still provide the fallback difficulty anchor, but strong resolved task evidence can now shift cluster baselines and blend into task-level automation difficulty and task-level direct pressure
- a structured role-refinement profile derived from the questionnaire
- labor-market context as a supporting layer

The live model currently outputs:
- a role-fate label
- a wave trajectory
- a role-fate map
- a task-level breakdown
- a recomposition summary
- evidence and occupation-assignment summaries
- an editable role composition layer built from source-bucketed tasks and function anchors

Current live role-fate labels:
- `Reinforced`
- `Shrinking`
- `Narrowed upward`
- `Polarized`
- `Growing`
- `Hollowed out`
- `Unclear trajectory`

## First-Pass Implementation Status

Implemented on `2026-03-10`:
- `job_description_task_evidence.csv`
- `role_functions.csv`
- `occupation_function_map.csv`
- `task_function_edges.csv`
- `function_accountability_profiles.csv`
- `task_source_evidence.csv`
- `occupation_source_priors.csv`
- `occupation_role_transformation.csv`
- `occupation_role_explanations.csv`

Implemented on `2026-03-13`:
- phase-1 direct task-evidence blending in the live browser scorer:
  - cluster priors still provided the baseline task-difficulty model
  - reliable resolved task evidence now blends into `direct_exposure_pressure` at the task row level
  - low-reliability task evidence remains confidence/coverage metadata only
- phase-2 task-derived cluster summaries in the live browser scorer:
  - public cluster surfaces now aggregate from scored task rows rather than the pre-task cluster bundle
  - `top_exposed_work` and `transformation_map` now reflect task-level pressure and spillover
- phase-3 task-derived wave engine in the live browser scorer:
  - reliable resolved task evidence now also blends into task-level `automation_difficulty`
  - task-derived cluster summaries now carry task-aggregated difficulty, absorption rate, and wave assignment
  - `wave_trajectory` and `primary_displacement_wave` are now recomputed from the task-derived cluster bundle rather than preserved from the pre-task cluster bundle
- phase-4 task-source evidence resolver in the live browser scorer:
  - `task_source_evidence.csv` now drives task-level evidence resolution at runtime
  - `live_task_evidence`, `reviewed_task_estimate`, and `benchmark_task_label` can all promote into the live task score before proxy fallback
  - proxy rows remain visible and can still backstop unresolved tasks, but they no longer block reviewed or benchmark task-level evidence from affecting the score
- phase-5 coverage-aware task-first cluster baselines in the live browser scorer:
  - cluster baselines can now shift toward resolved task evidence when a cluster has enough task-level evidence coverage and reliability
  - the public diagnostics now report how many cluster baselines used this task-first path
  - this is still a hybrid baseline, not yet a pure per-task prior model
- phase-6 task-first task baselines in the live browser scorer:
  - high-reliability task rows can now promote into `task_first_resolved_evidence` instead of only inheriting a cluster-seeded baseline
  - task-level baseline promotion now reduces the remaining task-evidence blend weight so the same evidence is not double-counted
  - public diagnostics now report how many task rows used this task-first task path
  - the promotion gate is now source-aware and mapping-confidence-aware so reviewed/live evidence can promote more readily than benchmark-only evidence
- phase-7 structural calibration scaffold:
  - `scripts/data/run_structural_calibration_report.js` now generates a non-runtime structural calibration target table and disagreement report
  - the first calibration layer compares live outputs against local quality-context, BLS labor-context, and adaptation-prior structural proxies
  - the generated calibration table and report now also recommend which model layer to review first when an occupation shows a meaningful mismatch
  - the review routing is now strength-aware so medium-strength structural mismatches can outrank weaker contextual proxies when triaging next tuning work
  - this layer is for review and tuning only, not direct runtime scoring
- phase-8 calibration-informed bargaining-power tuning:
  - the structural calibration queue surfaced a repeated overstatement in retained bargaining power for routine and support-heavy roles
  - the live scorer now derives `retained_bargaining_power` more from pressure-adjusted retained task leverage and less from raw bargaining-weight averages
  - support-heavy and routine-heavy work under high pressure now explicitly drags that metric down
- phase-9 calibration-informed routine-pressure tuning:
  - the strength-aware calibration queue surfaced a stronger structural miss in routine/admin-heavy occupations
  - the live scorer now uses adaptation-derived routine context to lift routine-task reachability and workflow compression for structurally routine, low-people-intensity roles
  - that lift is concentrated in execution, workflow-admin, documentation, and secondarily drafting-heavy bundles rather than applied uniformly across all work
- phase-10 official ORS calibration integration:
  - `scripts/data/normalize_ors.py` now derives `occupation_ors_structural_context.csv` from official BLS ORS `2025` preliminary data with `2023` backstop coverage
  - the human-guardrail calibration target is now primarily ORS-driven, using autonomy, supervisory responsibility, and pace-control structure rather than the older quality-only proxy
  - ORS remains calibration-only and is not a direct runtime scoring input
- phase-11 official ACS PUMS heterogeneity integration:
  - `scripts/data/normalize_acs_pums.py` now derives `occupation_heterogeneity_context.csv` from official `2024 ACS 1-year PUMS` Census API queries for the launch occupation set
  - the calibration layer now includes a role-heterogeneity / fragmentation check built from ACS wage dispersion, education dispersion, industry dispersion, and worker-mix spread
  - that ACS signal is scaled into a lower fragmentation-pressure target and conditioned on lower people intensity before it is compared with `role_fragmentation_risk`
  - ACS remains calibration-only and is not a direct runtime scoring input
  - the same ACS pass now also derives `occupation_industry_mix.csv` as the planned bridge into the next BTOS adoption-context layer

Implemented scripts:
- `build_job_description_evidence.ps1`
- `build_role_function_layer.ps1`
- `build_source_comparison_layer.ps1`
- `build_role_transformation_scores.ps1`
- `build_role_explanations.ps1`
- `rebuild_role_transformation_stack.ps1`

Current implementation scope:
- reviewed multi-anchor function graphs for the highest-complexity occupations, with single-anchor coverage retained elsewhere
- task-to-function weighting for every normalized task
- live role composition editing across O*NET tasks, reviewed job-posting tasks, reviewed role-review tasks, and value-defining functions
- task-to-function explanation links surfaced in the composition editor so users can see which selected tasks mainly support which functions
- lightweight user-declared dependency links between selected tasks, used as optional spillover adjustments during a run
- unified task-source comparison rows across Anthropic, GPT task labels, cluster proxies, and stubs, with proxies down-weighted when task-level evidence exists
- unified occupation prior rows across live aggregates and benchmark sources
- occupation-level explanation summaries for all `34` modeled occupations
- task-row evidence resolution from `task_source_evidence.csv`, with reviewed and benchmark task evidence now participating in live scoring alongside Anthropic task evidence
- task-row direct-evidence blending for both automation difficulty and direct pressure
- coverage-aware task-first cluster baselines, where strong resolved task evidence can now shift the cluster baseline before that baseline is projected onto task rows
- task-first task baselines, where high-reliability task rows can now promote into their own task-level baseline before any residual task-evidence blend is applied
- source-aware task-first task promotion, where live and reviewed evidence can promote more readily than benchmark labels and low-confidence task mappings are damped
- a first non-runtime empirical calibration layer with structural calibration targets and a generated disagreement report
- a first actionable non-runtime empirical calibration layer that also emits review-layer recommendations for disagreement triage
- a first calibration-informed runtime tuning pass on the repeated bargaining-power overstatement surfaced by that review queue
- a second calibration-informed runtime tuning pass on routine-pressure underestimation in admin-heavy occupations
- phase-2 task-derived cluster aggregation for exposed/retained cluster surfaces and top-exposed-cluster readouts
- phase-3 task-derived automation-difficulty and wave recomputation for public wave timing and cluster outputs
- runtime questionnaire redesign with native role-refinement factors and legacy-answer fallback retained only for compatibility
- reviewed public-job-posting task-gap coverage for all `34` modeled occupations
- reviewed role-transformation calibration for all `34` modeled occupations:
  - `5` function-heavy pilots
  - `4` routine-heavy contrast roles
  - `5` second-tranche launch roles
  - `5` third-tranche launch roles
  - `7` fourth-tranche launch roles
  - `8` fifth-tranche launch roles
- first-pass role transformation outputs for all `34` modeled occupations

Known current limits:
- multi-anchor function coverage exists only for a reviewed subset of the most obviously split roles, not yet for every occupation that may need it
- transformation scoring still relies on broad role-family defaults and benchmark floors underneath the reviewed overrides
- thin-coverage occupations still depend heavily on cluster priors for automation difficulty even after proxy down-weighting and the new task-first baseline layers
- the live engine now has both task-first cluster baselines and task-first task baselines, but low-coverage tasks still inherit a cluster-seeded fallback path
- the live questionnaire now renders as core questions plus optional deeper modules and writes a native factor-based role-refinement profile, but external legacy-answer fallback still exists in the engine for compatibility

### What Has Been Done So Far

- Imported benchmark layers for `AIOE`, `Webb`, `SML`, and `GPTs are GPTs`
- Built a unified task-source evidence layer and occupation prior comparison layer
- Added a task-role graph with richer task inventory, dependency edges, and role-profile summaries
- Added a role-function layer with function anchors, accountability profiles, task-to-function edges, and reviewed supplemental anchors for split-function occupations
- Added a first-pass role-transformation scoring layer for all modeled occupations
- Added occupation-by-occupation explanation outputs so each transformation row has a plain-English audit summary
- Reduced proxy overreach by down-weighting cluster-prior task evidence when direct task evidence or benchmark task labels already exist
- Promoted the source-comparison layer into the live task scorer so reviewed task estimates and benchmark task labels can now affect runtime task scoring instead of remaining comparison-only
- Added a first live direct-task-evidence runtime blend so sufficiently reliable task evidence can move task-level direct pressure and task-level automation difficulty without replacing the baseline cluster-prior layer
- Added a coverage-aware task-first cluster-baseline blend so clusters with enough resolved task evidence can shift the baseline difficulty path before task-row scoring
- Added a task-first task-baseline path so high-reliability task rows can now use their own resolved task evidence as the main baseline source rather than only adjusting a cluster-seeded baseline
- Tightened the task-first task-baseline path so source role and task-mapping confidence both affect whether a task actually promotes into that baseline
- Added a first structural calibration scaffold so live model outputs can now be compared against local non-runtime guardrail, labor-context, and wage-context targets before any future data is promoted into runtime
- Added task-derived cluster aggregation so the public cluster summaries and `top_exposed_work` now reflect scored task rows rather than only the pre-task cluster bundle
- Recomputed the live wave engine from the task-derived cluster bundle so public wave timing now follows the same bottom-up task stack as the public cluster layer
- Added a reviewed task-scoring layer for the highest-proxy occupation gap so Business Operations Specialists no longer reads as pure proxy coverage
- Extended the reviewed task-scoring layer to the remaining medium-priority evidence gaps:
  - Data Scientists
  - Paralegals and Legal Assistants
  - Sales Representatives of Services
- Added a reviewed supplemental function anchor for Paralegals and Legal Assistants so the role retains a distinct matter-coordination function instead of collapsing into one flat support anchor
- Added a first-pass runtime questionnaire redesign:
  - native role-refinement profile under the hood
  - named refinement-factor UI and presets
  - legacy `Q1..Q16` compatibility fallback retained only for external callers
  - runtime scoring tied more directly to retained function, sign-off, substitution pressure, dependency drag, and augmentation fit
  - updated runtime copy so the questionnaire is framed as role refinement rather than generic friction
  - moved the visible UI to a schema-rendered core-questions plus optional-modules surface
- Replaced the old post-selection task picker with an editable role composition layer:
  - source-bucketed O*NET tasks
  - reviewed public job-posting tasks
  - reviewed role-review tasks
  - value-defining function anchors
  - per-task function-link explanations
  - optional user-declared support links between selected tasks
- Extended reviewed supplemental function coverage for:
  - Human Resources Specialists
  - Management Analysts
  - Accountants and Auditors
  - Computer Systems Analysts
- Replaced seed-only job-description placeholders with reviewed public posting evidence for:
  - Lawyers
  - Data Scientists
  - Management Analysts
  - Technical Writers
  - Sales Representatives
  - Project Management Specialists
  - Business Operations Specialists, All Other
  - Customer Service Representatives
  - Accountants and Auditors
  - Paralegals and Legal Assistants
  - Human Resources Specialists
  - Training and Development Specialists
  - Market Research Analysts and Marketing Specialists
  - Computer Systems Analysts
  - Software Developers
  - General and Operations Managers
  - Financial and Investment Analysts
  - Operations Research Analysts
  - Web Developers
  - Graphic Designers
  - Writers and Authors
  - Advertising Sales Agents
  - Compliance Officers
  - Logisticians
  - Electronics Engineers, Except Computer
  - Mechanical Engineers
  - News Analysts, Reporters, and Journalists
  - Public Relations Specialists
  - Editors
  - Statistical Assistants
  - Bookkeeping, Accounting, and Auditing Clerks
  - Office Clerks, General
  - Secretaries and Administrative Assistants, Except Legal, Medical, and Executive
  - Executive Secretaries and Executive Administrative Assistants
- Added reviewed calibration overrides for:
  - Lawyers
  - Data Scientists
  - Management Analysts
  - Technical Writers
  - Sales Representatives
  - Bookkeeping Clerks
  - Office Clerks
  - Secretaries and Administrative Assistants
  - Executive Assistants
  - Project Management Specialists
  - Business Operations Specialists, All Other
  - Customer Service Representatives
  - Accountants and Auditors
  - Paralegals and Legal Assistants
  - Human Resources Specialists
  - Training and Development Specialists
  - Market Research Analysts and Marketing Specialists
  - Computer Systems Analysts
  - Software Developers
  - General and Operations Managers
  - Financial and Investment Analysts
  - Operations Research Analysts
  - Web Developers
  - Graphic Designers
  - Writers and Authors
  - Advertising Sales Agents
  - Compliance Officers
  - Logisticians
  - Electronics Engineers, Except Computer
  - Mechanical Engineers
  - News Analysts, Reporters, and Journalists
  - Public Relations Specialists
  - Editors
  - Statistical Assistants

### Questionnaire Redesign Status

The questionnaire migration is now mostly implemented.

What is live:
- the runtime engine accepts a native structured questionnaire profile
- the live app authors named refinement-factor inputs directly rather than numeric question IDs
- runtime scoring now uses retained-function and authority-oriented factors more directly
- presets are authored as named refinement-factor presets, with legacy answer presets kept only as compatibility exports
- the visible UI now presents:
  - a role-refinement readout
  - core questions
  - optional deeper modules
  - schema-rendered questionnaire content rather than hardcoded questionnaire markup

What is not finished yet:
- module-level branching and specialized deep paths are still limited
- guide and methodology copy will still need continued tightening as the model evolves
- the long-term cleanup question is whether to keep or fully remove the legacy `Q*` compatibility fallback for external callers

### What Still Needs To Be Done

- Extend multi-anchor function graphs further wherever one anchor still collapses distinct human-retained functions
- Improve task-to-function weighting where O*NET still overstates generic admin or workflow tasks
- Replace more cluster-proxy dependence with direct task evidence or reviewed benchmark promotion
- Expand task-first task-baseline coverage so more occupations can leave the cluster-seeded fallback path without becoming noisy
- Keep upgrading the calibration layer beyond the current ORS-backed human-guardrail check:
  - `BTOS`
- Promote the new occupation explanation layer into a more user-facing explanation surface and use it during review/calibration
- Add simple task-weight controls so users can mark selected work as major, medium, or minor rather than only in/out
- Add clearer result deltas that tell users exactly what their composition edits changed in the current run
- Decide whether to keep or remove the remaining legacy-answer compatibility fallback in the engine
- Expand beyond the current `34` modeled occupations once the reviewed workflow is stable
- Evaluate whether the current output taxonomy needs refinement beyond:
  - `Reinforced`
  - `Shrinking`
  - `Narrowed upward`
  - `Polarized`
  - `Growing`
  - `Hollowed out`
  - `Unclear trajectory`

### Autoresearch Agenda

Highest-value next research directions:
- empirical outcome calibration from official labor-market and work-organization data instead of only internal score tuning
- better within-occupation task heterogeneity so one occupation can represent more than one stable role shape
- clearer user-facing explanation of why exposed work does or does not destroy the role

Best external data directions to evaluate next:
- `BLS American Time Use Survey (ATUS)` for grounding how broad work categories and time use actually split in practice
- `Census Business Trends and Outlook Survey (BTOS)` AI-use modules for organization-level adoption and deployment context
- `O*NET Technology Skills / Tools and Technology` for task-tool adjacency and more explicit augmentation vs automation routing

Current official-source notes checked during autoresearch on `2026-03-13`:
- `BLS ORS`: official public-use datasets now span the first wave (`2018`), second wave final (`2023`), and third wave preliminary (`2025`). The repo now uses the `2025` preliminary workbook plus `2023` backstop coverage for the calibration-only ORS structural table.
- `ACS PUMS`: official Census PUMS `2024 ACS 1-year` microdata is now integrated through the Census API for the launch occupation set and feeds the calibration-only heterogeneity table.
- `BTOS`: official Census BTOS continues to publish business-condition and AI-use context at the firm/industry layer. This should stay calibration-only first; it is a context signal for adoption realization, not a direct task-automability input.
- `O*NET`: the official database release line has moved beyond the repo's current `30.1` footing. A controlled `30.2` refresh should be treated as a separate schema/data upgrade, not bundled casually into model tuning.

Ranked next integration order:
1. `BTOS` adoption-context layer
2. `O*NET 30.2` refresh and schema audit

Why this order:
- `BTOS` is useful, but it belongs outside runtime first because it says more about adoption context than technical task reachability.
- `O*NET 30.2` matters, but changing the core occupation/task substrate should be done deliberately after the stronger calibration layers are in place.

Directions that are probably weak unless new evidence appears:
- adding more benchmark score vendors without improving outcome calibration
- inventing more top-level labels before the current label set is externally stress-tested
- treating labor-market demand data as if it directly proves task automability

Concrete next build sequence:
1. Add a `BTOS`-derived industry adoption context table and map occupation exposure to industry-level AI-adoption context through occupation-industry mix, keeping it calibration-only.
2. Review whether the ORS and ACS layers together are strong enough to justify future multi-variant occupation modeling rather than one default role shape per occupation.
3. Review whether any of those calibration layers are strong enough to be promoted into runtime after at least one full calibration cycle.
4. Run a controlled `O*NET 30.2` refresh only after the stronger calibration layers have stabilized.

### Immediate ACS Review

Initial review conclusion from the ACS heterogeneity queue:
- strongest current multi-variant role-shape candidates:
  - `Editors`
  - `News Analysts, Reporters, and Journalists`
  - `Management Analysts`
  - `Technical Writers`
  - `Market Research Analysts and Marketing Specialists`
- watchlist rather than immediate split candidates:
  - `Web Developers`
  - `Operations Research Analysts`

Why this matters:
- these occupations look structurally diverse enough that one default occupation bundle may be hiding materially different stable role shapes
- the admin-heavy occupations still show more urgent misses in task pressure and bargaining-power calibration than in role-shape heterogeneity

Immediate prep for the next step:
- `occupation_industry_mix.csv` now exists specifically so the BTOS adoption-context layer can join industry AI-use context back to occupations through observed ACS industry mix rather than a loose occupation-level proxy

## Purpose

This document defines the next major overhaul of the role model.

The end goal is not only to measure task exposure to AI.

The end goal is to estimate:
- displacement risk
- role transformation
- retained bargaining power
- residual role integrity
- whether the role's core function still requires a human

Task exposure remains necessary, but it is only one layer.

## Problem Statement

The current stack is directionally useful, but it is still too task-centric in three ways:

1. O*NET task lists are incomplete for many real roles.
2. The model can overstate risk when exposed tasks do not equal the role's core function.
3. The dependency structure between tasks and the role's final organizational function is still too shallow.

Example:

A lawyer may have many high-exposure tasks:
- drafting
- research
- summarization
- document review

But the role's function is not "produce drafts."

The role's function is closer to:
- interpret the law
- advise clients under uncertainty
- act as accountable advocate
- carry professional and institutional responsibility

If AI helps with many tasks but does not replace that function, the role may transform without collapsing.

## North Star

The model should answer:

1. What is this role trying to accomplish?
2. What work is performed in service of that function?
3. Which tasks face direct AI pressure?
4. Which tasks lose value because upstream or downstream work changes?
5. Which parts of the role still carry bargaining power, accountability, trust, or institutional authority?
6. Does the remaining bundle still justify a distinct role?

## Design Principles

### 1. Function first, tasks second

Tasks should be modeled as being in service of a role function, not as the role itself.

### 2. Use a graph, not only a list

A pure sequential list is better than a flat task table, but still too narrow.

Many roles are not one clean chain.
They are better represented as a directed graph with:
- task nodes
- support relationships
- review relationships
- decision gates
- function nodes

Recommendation:

Do not model every role as one linear chain that ends in a single function.

Instead, model:
- several task chains
- one or more "function anchors"
- accountability / trust / judgment nodes above the task layer

That is more realistic and still compatible with o-ring style reasoning.

### 3. Separate evidence types

Direct task evidence, occupation priors, and structural role annotations should not be merged into one opaque score.

The stack should preserve:
- what is observed
- what is inferred
- what is benchmarked
- what is manually curated

### 4. Replace stubs wherever possible

Generated stubs are acceptable only as temporary fallback.

Launch roles should move toward:
- direct task evidence
- benchmark task labels
- manual review
- job-description-derived task expansions

### 5. Measure transformation, not only substitution

The model should explicitly distinguish:
- tasks AI can assist
- tasks AI can partially automate
- tasks AI can automate
- tasks whose value declines because connected work changes
- functions that remain human-accountable

## Proposed Model Stack

### Layer 1. Occupation and role identity

Keep:
- `occupations.csv`
- `occupation_aliases.csv`

Add stronger role-definition fields:
- canonical role summary
- role function statement
- accountability statement
- primary output / deliverable
- primary stakeholder served
- regulatory / trust burden

### Layer 2. Enriched task inventory

Current O*NET task lists remain the base layer, but should no longer be treated as complete.

Task inventory should be built from:
- O*NET tasks
- manual task expansions
- launch-role job description research
- benchmark task annotations where available

Each task should carry:
- source provenance
- whether it is O*NET-native or expanded
- whether it is core, supporting, optional, or situational
- whether it is directly user-facing, internally supporting, or institutionally accountable

### Layer 3. Function graph

Add a role-function layer above tasks.

This should include:
- function nodes
- task-to-task edges
- task-to-function edges
- accountability edges
- review / sign-off edges

Example:

For lawyers:
- research feeds drafting
- drafting feeds advice
- advice feeds advocacy / representation
- representation feeds role function
- accountability sits above several of those nodes

### Layer 4. Multi-source exposure normalization

Build a normalized framework that can compare sources without collapsing them too early.

Use:
- Anthropic task telemetry as the main direct task evidence layer
- GPTs-are-GPTs task labels as supporting task evidence
- AIOE ability and occupation scores as occupation / ability priors
- Webb as occupation benchmark prior
- SML as occupation benchmark prior

Recommended rule:

- task-level sources should inform direct task pressure
- occupation-level benchmark sources should calibrate priors and flag implausible outputs
- benchmark-only sources should not directly overwrite live task evidence unless explicitly promoted

### Layer 5. Role transformation and displacement engine

The final engine should estimate:
- direct task pressure
- indirect dependency pressure
- retained bargaining power
- function retention
- function delegation
- accountability retention
- role fragmentation
- demand expansion
- final role-fate state

## Main Workstreams

## Workstream 1. Normalized Exposure Framework

### Goal

Create one comparison-ready exposure layer across all benchmark and live sources.

### Why

Right now the repo has useful source imports, but the active stack and benchmark stack are still too separate.

### Deliverables

- unified source comparison contract
- task-level evidence table with source-specific rows
- occupation-level prior table with source-specific rows
- source weighting and precedence rules
- benchmark disagreement diagnostics tied to promotion decisions

### Proposed rules

- Anthropic = primary live task evidence
- reviewed task estimates = promoted supporting task evidence
- GPTs task labels = secondary task evidence / fallback promotion tier
- AIOE = occupation + ability prior
- Webb = occupation benchmark prior
- SML = occupation benchmark prior

### Key output

A normalized exposure framework that answers:
- what each source says
- where sources agree
- where sources disagree
- which source is allowed to drive which layer

Current live status:
- cluster priors still provide the baseline difficulty prior
- resolved task evidence now blends into both task-level automation difficulty and task-level direct pressure when `direct_evidence_reliability > 0.20`
- the task-level resolver currently prioritizes `live_task_evidence`, then `reviewed_task_estimate`, then `benchmark_task_label`, then proxy fallback
- that blend weight is capped at `0.85`
- low-reliability task evidence still stays in confidence and coverage surfaces only
- public cluster summaries are now aggregated back up from scored task rows after direct pressure, spillover, and retained-share calculations
- wave trajectory is now recomputed from that task-derived cluster bundle rather than from the older pre-task cluster bundle

## Workstream 2. Task Gap Expansion

### Goal

Fill missing or thin task inventories for launch roles.

### Why

O*NET is useful, but it is not a complete description of the real work bundle for many modern roles.

### Approach

For each launch role:
- collect a curated set of real job descriptions
- extract missing tasks and responsibilities
- deduplicate against O*NET tasks
- classify new tasks as core / supporting / optional
- map them into existing or new task families
- score them with the same exposure machinery

### Important rule

Do not just add more task rows.

Add only tasks that materially improve the model's understanding of:
- role function
- trust/accountability burden
- cross-task dependency
- user/stakeholder responsibility

### Priority occupations

Start with roles that are:
- thinly covered
- function-sensitive
- highly exposed on benchmarks
- likely to be misread by pure task exposure

Initial examples:
- Lawyers
- Management Analysts
- Project Management Specialists
- Data Scientists
- Technical Writers
- Sales Representatives
- Business Operations Specialists

## Workstream 3. Function and Dependency Graph

### Goal

Model how tasks combine into the role's function.

### Why

This is the missing layer between "AI can do some tasks" and "the role is displaced."

### Recommendation

Use a directed graph, not only a sequential list.

The graph should support:
- multiple chains
- branching
- review loops
- coordination work
- sign-off / accountability nodes
- terminal function nodes

### New concepts

- `function_id`
- `function_statement`
- `task_to_function_weight`
- `accountability_weight`
- `judgment_requirement`
- `trust_requirement`
- `regulatory_liability_weight`
- `human_authority_requirement`

### New normalized files

- `role_functions.csv`
- `occupation_function_map.csv`
- `task_function_edges.csv`
- `function_accountability_profiles.csv`

### Scoring impact

This layer should help answer:
- can AI do the task?
- does that matter for the role's core function?
- if AI does the task, who still owns the outcome?
- what work remains economically necessary?

## Workstream 4. Transformation / Displacement Scoring

### Goal

Move from exposure scoring to role-fate scoring with explicit function retention logic.

### Proposed decomposition

For each role, compute:
- direct task pressure
- indirect dependency pressure
- function retention
- accountability retention
- bargaining power retention
- role fragmentation
- role compressibility
- demand expansion

### Proposed outputs

- `task_exposure_pressure`
- `function_exposure_pressure`
- `retained_function_strength`
- `retained_accountability_strength`
- `retained_bargaining_power`
- `role_fragmentation_risk`
- `delegation_likelihood`
- `headcount_displacement_risk`
- `role_transformation_type`

### Interpretation

High task exposure should not imply high displacement if:
- core function remains human-owned
- accountability remains human-owned
- bargaining-power tasks remain intact
- AI mostly compresses support work rather than replacing the function

## Workstream 5. Calibration and Evaluation

### Goal

Make the model empirically defensible.

### Evaluation questions

- Does the model overpredict collapse for function-heavy professions?
- Does it underpredict compression for routine-support roles?
- Does replacing stubs with benchmark task labels improve plausibility?
- Do added job-description tasks improve role-fate explanations?

### Evaluation layers

- source agreement diagnostics
- occupation-by-occupation expert review
- launch-role manual calibration set
- sensitivity testing on function-weight assumptions

## Recommended Data Model Changes

### Keep and strengthen

- `occupation_tasks.csv`
- `occupation_task_inventory.csv`
- `task_dependency_edges.csv`
- `occupation_task_role_profiles.csv`
- `task_exposure_evidence.csv`
- `task_augmentation_automation_priors.csv`

### Add

- `role_functions.csv`
- `occupation_function_map.csv`
- `task_function_edges.csv`
- `function_accountability_profiles.csv`
- `job_description_task_evidence.csv`
- `task_source_evidence.csv`
- `occupation_source_priors.csv`

### Deprecate conceptually

The model should stop treating `occupation_exposure_priors.csv` as the main answer.

It should become one intermediate layer inside a broader role-transformation model.

## Source Strategy

### Use actively in the live stack

- Anthropic task telemetry
- GPTs-are-GPTs task labels
- O*NET tasks and work structure
- manual review for function and dependency layers

### Use as priors / calibration / benchmarks

- AIOE
- Webb
- SML
- GPTs occupation-level ratings

### Use only as temporary fallback

- internal stubs

## Implementation Phases

## Phase 1. Exposure normalization

Build:
- unified source comparison framework
- source-specific task evidence contract
- source-specific occupation prior contract
- precedence rules for task vs occupation evidence

Success condition:
- every launch role has a transparent source comparison view

Current shipped subset:
- resolved task evidence now influences live task-level automation difficulty and direct pressure when reliability clears the runtime threshold
- task-derived cluster summaries now drive the public cluster layer and top-exposed-cluster readouts
- the task-derived wave engine is now live on top of those task-derived cluster summaries
- the runtime task-source evidence resolver is now live
- the runtime now also has a coverage-aware task-first cluster-baseline path
- the runtime now also has a task-first task-baseline path for high-reliability task rows
- the remaining gap is expanding that task-first coverage without making thin occupations unstable

## Phase 2. Task-gap expansion

Build:
- job-description ingestion process
- role-by-role manual expansion workflow
- deduplication and provenance logic

Success condition:
- no launch role remains thin or obviously skeletal

## Phase 3. Function graph

Build:
- role function schema
- task-to-function edges
- accountability and trust annotations
- DAG-based dependency layer

Success condition:
- each launch role has at least one reviewed function graph

## Phase 4. Role transformation engine

Build:
- function-aware scoring
- transformation / displacement decomposition
- new public outputs

Success condition:
- the model can explain why a role transforms without assuming collapse from task exposure alone

## Phase 5. Calibration

Build:
- reviewed occupation set
- benchmark comparison panels
- scenario tests

Success condition:
- outputs are directionally credible across launch roles and benchmark-sensitive occupations

## Immediate Next Steps

1. Add weighted task-share controls to the composition editor so selected tasks can be marked as major, medium, or minor instead of only present or absent.
2. Add explicit result deltas that explain what changed after composition edits, for example which retained functions strengthened or which spillover links increased pressure.
3. Replace more cluster-prior proxy dependence with direct task evidence, GPT task-label promotion, or reviewed manual mapping for the highest-proxy occupations that still lean on fallback.
4. Push direct task evidence one layer deeper by deriving cluster automation difficulty from task rows wherever task-level evidence is strong enough.
5. Recompute the upstream wave engine bottom-up from task-derived cluster summaries instead of preserving a separate pre-task wave bundle.
6. Use the new occupation explanation layer to run another occupation-by-occupation audit and tighten task-to-function weighting where explanations still look generic.
7. Decide whether to keep or remove the remaining legacy-answer compatibility fallback after external callers are checked.

## One-Sentence Summary

The next model should not ask only whether AI can do tasks inside a role.

It should ask whether AI changes the set of tasks, dependencies, and accountability relationships enough to replace the role's core function in the organization.
