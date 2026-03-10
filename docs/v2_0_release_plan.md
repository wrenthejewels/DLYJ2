# V2.0 Release Plan

## Purpose

This document is the current source of truth for the next `2.0` redesign pass.

That pass replaces the interim role-transformation briefing with a `Role Fate Map` built on better task coverage, explicit task dependencies, and clearer public role outcomes.

## Product Goal

`2.0` should answer:
- what the role is made of today
- which tasks carry bargaining power
- which tasks face direct AI pressure
- which supporting tasks weaken because they depend on exposed core work
- whether the role is more likely to augment, compress, elevate, split, expand, or collapse

The product should not lead with:
- timing forecasts
- generic exposure labels without task grounding
- unexplained structural metrics such as `coherence`

## Locked Product Decisions

- The new public ontology is `Role Fate`, not the old five-card briefing.
- Default intake follows `progressive depth`: light by default, more structured if the user wants it.
- First-wave data strategy is `public sources + internal curation`.
- First-wave user evidence is structured task selection, not freeform document upload.
- Demand expansion remains a first-class modifier, but not the main headline ontology.
- The public role-fate taxonomy is:
  - `Augmented`
  - `Compressed`
  - `Elevated`
  - `Split`
  - `Expanded`
  - `Collapsed`
  - `Mixed transition`

## Current Repo State

The current live homepage is still an interim `2.0` result:
- it uses occupation-specific tasks, but task coverage is often thin
- it still relies on a flat task list plus cluster-level structure
- it uses a lightweight dependency proxy instead of a task graph
- it still exposes internal concepts such as residual-bundle quality too indirectly for public use

Current task-data snapshot:
- `669` normalized task rows across `33` occupations with task rows present
- average `20.3` task rows per covered occupation
- median `20`
- minimum `11`
- one mapped occupation currently has no normalized task rows:
  - `Business Operations Specialists, All Other`

Thin-coverage occupations already visible in the current normalized layer include:
- `Management Analysts` (`11` task rows)
- `Paralegals and Legal Assistants` (`12`)
- `Market Research Analysts and Marketing Specialists` (`13`)
- `Customer Service Representatives` (`13`)
- `Statistical Assistants` (`14`)
- `Technical Writers` (`15`)
- `Sales Representatives of Services...` (`15`)

## Workstreams

### 1. Result-surface redesign

Replace the current verdict surface with:
- current role breakdown
- role fate map
- bargaining-power summary
- direct pressure tasks
- indirect spillover tasks
- retained leverage summary

Status:
- spec approved
- implementation not started

### 2. Task-data foundation

Add the data needed for fuller role coverage:
- richer canonical task inventories
- core vs supporting task labels
- value-centrality / bargaining-power annotations
- task dependency edges

Status:
- first-step contract documented in `docs/data/task_role_graph_contract.md`
- scaffold CSVs added under `data/normalized/`
- seeded role-graph generator added at `scripts/data/build_task_role_graph.ps1`
- current seeded outputs:
  - `669` task inventory rows
  - `893` dependency edges
  - `34` occupation role profiles
  - `8` occupations still flagged for thin or missing task coverage

### 3. Intake redesign

Replace the current direct-input block with a structured task-intake flow:
- high-time tasks
- value-defining tasks
- AI-supported tasks
- AI-danger tasks
- support-task dependencies
- residual-role distinctiveness

Status:
- approved in `docs/v2_0_questionnaire_spec.md`
- implementation not started

### 4. Engine redesign

Replace the current wave-first scoring with a role-fate model driven by:
- direct exposure pressure
- indirect dependency pressure
- residual role integrity
- elevation potential
- split risk
- demand expansion modifier

Status:
- approved conceptually
- implementation not started

### 5. Documentation rewrite

Rewrite user-facing methodology and guide pages after the new result contract is live enough to document faithfully.

## Near-Term Sequence

1. lock the v2 docs around the role-fate ontology
2. audit task coverage and define the task/dependency contract
3. extend the normalized layer for role-task graph support
4. redesign the task intake to populate the new contract
5. replace the current outlook calculation with role-fate scoring
6. redesign the results surface around the new ordering and language
7. rewrite guide and methodology pages to match the shipped model

## Acceptance Criteria

`2.0` is ready for the redesign cutover when:

1. the page shows current role makeup before the verdict
2. the page clearly distinguishes direct AI pressure from indirect dependency spillover
3. the page identifies bargaining-power tasks explicitly
4. the public result never uses `coherence`
5. the engine can output one of the locked role-fate states with confidence
6. the task inventory for launch occupations is no longer obviously skeletal
7. labor-market context remains secondary to role-structure explanation

## Current Source Strategy

Use:
- `O*NET` as the task-structure spine
- `Anthropic Economic Index` as the main task-level AI evidence layer
- `BLS` as labor-market context
- internal curation where public task coverage is too thin or too generic

Candidate additions for this redesign phase:
- O*NET Detailed Work Activities
- BLS Occupational Outlook narrative task descriptions
- ESCO occupation-skill/task structure

Do not make these headline scoring inputs in the first pass:
- benchmark-only comparison layers
- freeform user documents
- labor-demand forecasting equations

## Session Update - 2026-03-10-D

- completed:
  - approved the `Role Fate Map` redesign plan
  - replaced the v2 results and questionnaire specs with the new ontology
  - documented a first-step task/dependency data contract
  - added normalized CSV scaffolds for the task-role graph layer
  - added and ran a seeded role-graph build script to populate the new normalized files
  - extended normalized-data validation to cover the new role-graph files
- changed decisions:
  - `Role Fate` replaces the old public five-card framing
  - explicit indirect task risk is now a first-class requirement
  - task coverage quality is now a blocker for trustworthy role-fate outputs
- new blockers:
  - normalized task coverage is thin for several launch occupations
  - the engine has no explicit task dependency graph yet
  - the intake does not yet collect value-defining tasks or support-task dependencies
- next recommended step:
  - extend the normalized layer with task role-graph fields, starting with the undercovered occupations
