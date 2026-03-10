# Role Transformation Overhaul Plan

## Read This First

This is the canonical planning and handoff document for the current model.

A new session should read this document first to understand:
- what the live product is now
- what has already been implemented
- what the current model stack looks like
- what still needs to be done next

Supporting docs:
- `docs/v2_0_questionnaire_spec.md` = current intake and questionnaire contract
- `docs/v2_0_results_spec.md` = current result object and UI/result contract
- `docs/v2_0_release_plan.md` = short release snapshot only, not the main plan

## Documentation Structure

Keep this file as the one central planning and handoff doc.

Recommended doc roles:
- `docs/role_transformation_overhaul_plan.md` = canonical current-state, roadmap, and next-steps document
- `docs/v2_0_questionnaire_spec.md` = supporting intake and questionnaire reference
- `docs/v2_0_results_spec.md` = supporting output/result contract reference
- `docs/v2_0_release_plan.md` = short snapshot of what is live, not a separate roadmap

Recommended merge decision:
- do not merge the questionnaire or results specs into this file, because they work better as narrow contract docs
- do not let `docs/v2_0_release_plan.md` grow into a second planning document
- if future planning notes are created, fold them back into this file instead of creating another top-level roadmap

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
- direct and fallback task evidence
- a structured role-refinement profile derived from the questionnaire
- labor-market context as a supporting layer

The live model currently outputs:
- a role-fate label
- a wave trajectory
- a role-fate map
- a task-level breakdown
- a recomposition summary
- evidence and occupation-assignment summaries

Current live role-fate labels:
- `Augmented`
- `Compressed`
- `Elevated`
- `Split`
- `Expanded`
- `Collapsed`
- `Mixed transition`

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
- unified task-source comparison rows across Anthropic, GPT task labels, cluster proxies, and stubs, with proxies down-weighted when task-level evidence exists
- unified occupation prior rows across live aggregates and benchmark sources
- occupation-level explanation summaries for all `34` modeled occupations
- first-pass runtime questionnaire redesign with structured role-refinement factors and a legacy-answer compatibility bridge
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
- task evidence still depends too much on cluster priors for the thinnest-covered occupations even after proxy down-weighting
- the live questionnaire now renders as core questions plus optional deeper modules, but it is still backed by the legacy-question compatibility bridge rather than a native factor-first payload

### What Has Been Done So Far

- Imported benchmark layers for `AIOE`, `Webb`, `SML`, and `GPTs are GPTs`
- Built a unified task-source evidence layer and occupation prior comparison layer
- Added a task-role graph with richer task inventory, dependency edges, and role-profile summaries
- Added a role-function layer with function anchors, accountability profiles, task-to-function edges, and reviewed supplemental anchors for split-function occupations
- Added a first-pass role-transformation scoring layer for all modeled occupations
- Added occupation-by-occupation explanation outputs so each transformation row has a plain-English audit summary
- Reduced proxy overreach by down-weighting cluster-prior task evidence when direct task evidence or benchmark task labels already exist
- Added a reviewed task-scoring layer for the highest-proxy occupation gap so Business Operations Specialists no longer reads as pure proxy coverage
- Extended the reviewed task-scoring layer to the remaining medium-priority evidence gaps:
  - Data Scientists
  - Paralegals and Legal Assistants
  - Sales Representatives of Services
- Added a reviewed supplemental function anchor for Paralegals and Legal Assistants so the role retains a distinct matter-coordination function instead of collapsing into one flat support anchor
- Added a first-pass runtime questionnaire redesign:
  - structured role-refinement profile under the hood
  - legacy `Q1..Q16` compatibility bridge
  - runtime scoring tied more directly to retained function, sign-off, substitution pressure, dependency drag, and augmentation fit
  - updated runtime copy so the questionnaire is framed as role refinement rather than generic friction
  - moved the visible UI to a schema-rendered core-questions plus optional-modules surface
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

The questionnaire migration is now in an intermediate implemented state.

What is live:
- the runtime engine accepts a structured questionnaire profile
- legacy numbered answers are translated into the new profile through a compatibility bridge
- runtime scoring now uses retained-function and authority-oriented factors more directly
- presets expose both legacy answer presets and derived questionnaire-factor presets
- the visible UI now presents:
  - a role-refinement readout
  - core questions
  - optional deeper modules
  - schema-rendered questionnaire content rather than hardcoded questionnaire markup

What is not finished yet:
- the questionnaire payload is still internally bridged from legacy question IDs rather than natively authored as factor objects
- module-level branching and specialized deep paths are still limited
- guide and methodology copy will still need continued tightening as the model evolves
- the long-term target should still be a native factor-based questionnaire payload rather than legacy question IDs

### What Still Needs To Be Done

- Extend multi-anchor function graphs beyond the first reviewed subset wherever one anchor still collapses distinct human-retained functions
- Improve task-to-function weighting where O*NET still overstates generic admin or workflow tasks
- Replace more cluster-proxy dependence with direct task evidence or reviewed benchmark promotion
- Promote the new occupation explanation layer into a more user-facing explanation surface and use it during review/calibration
- Finish the questionnaire migration by replacing the legacy-answer bridge with a native factor-based runtime contract
- Expand beyond the current `34` modeled occupations once the reviewed workflow is stable
- Evaluate whether the current output taxonomy needs refinement beyond:
  - `Augmented`
  - `Compressed`
  - `Elevated`
  - `Split`
  - `Expanded`
  - `Collapsed`
  - `Mixed transition`

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
- GPTs task labels = secondary task evidence / fallback
- AIOE = occupation + ability prior
- Webb = occupation benchmark prior
- SML = occupation benchmark prior

### Key output

A normalized exposure framework that answers:
- what each source says
- where sources agree
- where sources disagree
- which source is allowed to drive which layer

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

1. Extend the reviewed multi-anchor function layer beyond the first high-complexity subset, especially where one anchor still hides distinct advisory, supervisory, or relationship-retention functions.
2. Replace more cluster-prior proxy dependence with direct task evidence, GPT task-label promotion, or reviewed manual mapping for the highest-proxy occupations.
3. Use the new occupation explanation layer to run another occupation-by-occupation audit and tighten task-to-function weighting where explanations still look generic.
4. Finish the questionnaire migration by replacing the remaining legacy-answer bridge with a native factor-based runtime contract.
5. Expand the reviewed workflow to occupations beyond the current `34` once the explanation layer is stable.

## One-Sentence Summary

The next model should not ask only whether AI can do tasks inside a role.

It should ask whether AI changes the set of tasks, dependencies, and accountability relationships enough to replace the role's core function in the organization.
