# V2.0 Questionnaire Specification

## Purpose

This document defines the intake for the `Role Fate Map` redesign.

The intake should no longer behave like a lightly repurposed hazard questionnaire. It should gather enough structure to:
- identify what the role actually consists of
- distinguish high-time tasks from high-value tasks
- identify which tasks already benefit from AI
- identify which support tasks depend on exposed core work
- estimate whether the role compresses, elevates, splits, expands, or collapses

## Core Design Principle

The intake should follow `progressive depth`.

Default users should answer a short, legible set of structured questions.
Power users should be able to go deeper without needing freeform uploads.

The default path should feel light.
The optional path should feel materially more specific.

## Recommended Intake Structure

The redesigned intake has six sections:

1. role anchoring
2. task composition
3. value and bargaining power
4. AI pressure and support
5. dependency and residual integrity
6. adaptation and demand context

Public-surface rule:
- category, occupation, and hierarchy remain the front-door defaults
- structured task composition follows immediately after anchoring
- deeper task-detail inputs stay optional
- freeform pasted documents are not part of the first redesign

## Section 1: Role Anchoring

Purpose:
- choose the best occupation prior before personalization

Fields:

### R1. Broad role category

Use the current role-category set from `index.html`.

Maps to:
- `selected_role_category`
- occupation suggestions

### R2. Occupation candidate selection

After category selection, show:
- `2-3` suggested occupation matches
- search across all mapped occupations

Maps to:
- `selected_occupation_id`
- `selected_occupation_title`

### R3. Seniority / scope

Retain the current hierarchy concept, but interpret it as:
- span of control
- decision authority
- retained-role leverage

Maps to:
- `elevation_potential`
- `demand_expansion_modifier`
- `personalization_fit`

## Section 2: Task Composition

Purpose:
- estimate the user's actual role makeup inside the selected occupation

This is the most important section in the redesign.

### Default fields

#### T1. Top task families by time share

Ask the user to choose the `3-5` task families that dominate their time.

Maps to:
- `role_fate_map.current_role`
- `direct_exposure_pressure`

#### T2. Concrete tasks you spend the most time on

Show a structured picker of occupation-specific tasks.

Allow the user to:
- choose up to `5` high-time tasks
- optionally mark one as `most of my week`

Maps to:
- `current_share`
- task-level weights inside the selected occupation

### Optional deepening

#### T3. Task weighting refinement

Allow the user to rebalance the selected tasks into rough buckets:
- `small share`
- `meaningful share`
- `dominant share`

This is intentionally bucketed, not a percent-entry UI.

## Section 3: Value And Bargaining Power

Purpose:
- separate time share from value share

### Required fields

#### V1. Which tasks most explain why the role exists?

Ask the user to pick up to `3` tasks that define the role's value.

Maps to:
- `bargaining_power_tasks`
- `value_centrality`
- `collapse_risk`

#### V2. Which tasks would still matter if AI handled the admin work?

Ask the user to select the tasks that still justify a distinct role after routine work is removed.

Maps to:
- `retained_leverage`
- `residual_role_integrity`
- `elevation_potential`

## Section 4: AI Pressure And Support

Purpose:
- separate tasks AI directly pressures from tasks AI currently helps with

### Required fields

#### A1. Which tasks already get faster with AI or software?

Ask the user to select tasks already accelerated by tools.

Maps to:
- `pressure_mode`
- `demand_expansion_modifier`
- augmentation vs substitution interpretation

#### A2. Which tasks would be dangerous if AI became very good at them?

Ask the user to select tasks whose automation would weaken bargaining power or role necessity.

Maps to:
- `exposed_core_share`
- `collapse_risk`
- `split_risk`

### Reused legacy questions

Keep and reinterpret:
- `Q1` observed AI capability
- `Q2` example-work availability
- `Q3` benchmark clarity
- `Q4` task digitization
- `Q5` decomposability
- `Q6` standardization
- `Q8` feedback speed

These remain supporting calibration questions rather than the visible center of the intake.

## Section 5: Dependency And Residual Integrity

Purpose:
- capture indirect task risk and whether the remaining work still forms a role

### New structured fields

#### D1. Which tasks mainly exist to support other tasks?

Allow the user to mark selected tasks as:
- `core`
- `supporting`
- `mixed`

Maps to:
- `role_criticality`
- dependency-edge weighting

#### D2. If AI handled the exposed tasks, what happens to the supporting work?

Ask the user to choose for each marked support task:
- `mostly stays`
- `shrinks a lot`
- `mostly disappears`

Maps to:
- `indirect_dependency_pressure`
- `residual_role_integrity`

#### D3. Would the remaining work still justify a distinct role?

This becomes a first-class question and should be visible.

Maps to:
- `residual_role_integrity`
- `role_fate_state`

### Reused legacy questions

Keep and reinterpret:
- `Q7` context dependency
- `Q9` tacit knowledge
- `Q10` residual bundle fragility
- `Q11` human judgment / relationship load
- `Q12` physical presence

## Section 6: Adaptation And Demand Context

Purpose:
- estimate retained-role fit and whether AI expands output or span of control

### Required fields

#### F1. If routine work shrank, would your role move up toward review, coordination, or decision-making?

Maps to:
- `elevation_potential`
- `role_fate_state`

#### F2. Would AI let you serve more clients, projects, or scope with the same team?

Maps to:
- `demand_expansion_modifier`
- `role_fate_state = expanded`

### Reused legacy questions

Keep:
- `Q13` organization AI adoption readiness
- `Q14` labor cost pressure
- `Q16` workflow integration readiness
- `Q17` skill transferability
- `Q18` adaptability / learning
- `Q19` job performance

De-emphasize:
- `Q15` labor market tightness as a primary role-fate driver

## Question Versioning

Do not present the intake publicly as `Q1-Q19`.

Public grouping should be:
- `Role`
- `Task makeup`
- `What creates value`
- `AI pressure`
- `Role integrity`
- `Fit and expansion`

Internally:
- keep compatibility mapping while the live engine still expects legacy fields
- add a translation layer from the new task-structured inputs into the existing runtime contract

## Field-Level Mapping To Result

### `role_fate_state`

Depends on:
- top task families
- concrete high-time tasks
- value-defining tasks
- support-task dependencies
- residual-role distinctiveness
- AI-danger tasks
- retained-role elevation path
- demand expansion inputs

### `bargaining_power_tasks`

Depends on:
- value-defining tasks
- retained-role tasks
- judgment / relationship inputs

### `directly_pressured_tasks`

Depends on:
- occupation task priors
- AI-support and AI-danger selections
- exposure-condition questions

### `indirectly_at_risk_tasks`

Depends on:
- support-task marking
- dependency responses
- residual integrity questions

### `residual_role_integrity`

Depends on:
- retained-role tasks
- context dependency
- tacit knowledge
- support-task dependency outcomes
- distinct-role question

### `demand_expansion_modifier`

Depends on:
- AI-support selections
- scope / span-of-control question
- seniority
- adoption context

## MVP Implementation Strategy

Phase 1:
- keep category, occupation, and hierarchy
- replace the current direct task-family inputs with a structured task-composition block
- add value-defining-task selection
- add support-task and residual-distinctiveness questions

Phase 2:
- let users mark dependency relationships between a small set of chosen tasks
- introduce task-bucket weighting for deeper users

Phase 3:
- consider optional document-assisted intake only after the structured path is stable

## Keep / Change / Drop Summary

### Keep, but demote

- most legacy exposure and context questions

### Keep, but reinterpret heavily

- `Q7`, `Q9`, `Q10`, `Q11`, `Q12`

### Add as first-class structured inputs

- concrete high-time task selection
- value-defining task selection
- AI-support task selection
- AI-danger task selection
- support-task marking
- residual-role distinctiveness
- span-of-control / demand expansion

### Exclude from the first redesign

- freeform uploads
- pasted job descriptions as a required input
- any path that forces the user to enter exact percentages

## Next Dependency

The next required step is to connect this intake to a richer task data layer with:
- fuller task inventories
- task dependency edges
- value-centrality annotations
- support-vs-core annotations
