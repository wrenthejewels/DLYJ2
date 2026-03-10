# DLYJ 2.0 Modeling Spec: Role Fate Map

## Purpose

This document defines the next modeling layer behind the `Role Fate Map`.

The goal is to move beyond:
- thin task lists
- direct exposure only
- residual-bundle explanations that hide the real reason the role keeps or loses leverage

The model should explain how AI changes the organizational fate of a role by combining:
- direct task pressure
- dependency spillover
- bargaining-power concentration
- retained-role integrity
- demand expansion

## 1. Modeling Goals

For each occupation `o`, estimate:
- direct AI pressure on tasks
- indirect pressure on support tasks tied to exposed core work
- retained bargaining power
- residual role integrity
- elevation potential
- split risk
- demand expansion modifier
- final role-fate classification

Public role-fate classes:
- `augmented`
- `compressed`
- `elevated`
- `split`
- `expanded`
- `collapsed`
- `mixed_transition`

## 2. Role-Task Representation

Let occupation `o` contain tasks `i = 1, ..., N_o`.

For each task, track:

\[
w_{oi} \in [0,1]
\]

Current role share.

\[
v_{oi} \in [0,1]
\]

Value centrality: how much the task explains why the role exists.

\[
b_{oi} \in [0,1]
\]

Bargaining-power weight: how much leverage the worker loses if AI performs the task well.

\[
d^{dir}_{oi} \in [0,1]
\]

Direct AI pressure.

\[
r_{oi} \in [0,1]
\]

Retained leverage if surrounding work changes.

Each task also needs:
- `role_criticality`: `core`, `supporting`, or `optional`
- upstream and downstream dependencies
- mode tendency: augmentation vs automation

## 3. Direct Task Pressure

Direct pressure is the model's estimate that a task is directly accelerated, partially substituted, or automated by AI.

\[
P^{dir}_{oi}
=
\alpha_1 A_{oi}
+ \alpha_2 G_{oi}
+ \alpha_3 E_{oi}
+ \alpha_4 M_{oi}
- \alpha_5 J_{oi}
- \alpha_6 R_{oi}
- \alpha_7 X_{oi}
\]

Where:
- `A_oi`: automation feasibility
- `G_oi`: augmentation feasibility
- `E_oi`: task exposure evidence
- `M_oi`: model-task capability fit
- `J_oi`: judgment / relationship requirement
- `R_oi`: regulation / accountability friction
- `X_oi`: exception burden

The normalized direct pressure is:

\[
d^{dir}_{oi} = \sigma(P^{dir}_{oi})
\]

## 4. Indirect Dependency Pressure

Some tasks are not directly easy for AI, but they lose value because they mainly support exposed core tasks.

Represent the occupation as a directed graph:

\[
\mathcal{G}_o = (V_o, \mathcal{E}_o)
\]

Each edge `i -> j` means task `i` supports task `j`.

Let `\delta_{ij}` be dependency intensity.

Define indirect pressure on task `i` as:

\[
d^{ind}_{oi}
=
\sum_{j \in downstream(i)} \delta_{ij} \cdot d^{dir}_{oj} \cdot v_{oj}
\]

Interpretation:
- support work tied to exposed value-defining tasks inherits real risk
- indirect pressure rises faster when the supported task is both exposed and central to the role's value

## 5. Bargaining Power

The model should not treat all retained work as equally valuable.

Task-level bargaining power:

\[
BP_{oi} = b_{oi} \cdot (1 - d^{dir}_{oi}) \cdot (1 - d^{ind}_{oi})
\]

Occupation-level retained bargaining power:

\[
BP_o = \sum_i w_{oi} \cdot BP_{oi}
\]

Interpretation:
- AI automating admin work does not destroy bargaining power if the core strategic tasks remain strong
- AI automating the value-defining tasks should sharply reduce bargaining power even if some support tasks remain

## 6. Residual Role Integrity

Replace vague public `coherence` language with an internal `residual_role_integrity` score.

\[
RRI_o
=
\beta_1 \sum_i w_{oi} r_{oi}
+ \beta_2 BP_o
+ \beta_3 C_o^{ret}
- \beta_4 Frag_o
\]

Where:
- `\sum_i w_{oi} r_{oi}` = retained leverage share
- `BP_o` = retained bargaining power
- `C_o^{ret}` = connectedness among retained core tasks
- `Frag_o` = role-fragmentation pressure after exposed work is removed

This is the main structural answer to:
- does the remaining work still justify a distinct role?

## 7. Fate-State Drivers

Compute six intermediate role-level scores:

\[
DEP_o = \sum_i w_{oi} d^{dir}_{oi}
\]

Direct exposure pressure.

\[
IDP_o = \sum_i w_{oi} d^{ind}_{oi}
\]

Indirect dependency pressure.

\[
EP_o
\]

Elevation potential: the extent to which retained work shifts toward oversight, coordination, judgment, or client accountability.

\[
SR_o
\]

Split risk: the extent to which a smaller high-value core remains separable from commoditized execution work.

\[
DEM_o
\]

Demand expansion modifier: whether AI increases output, span of control, or reachable demand.

\[
CR_o
\]

Collapse risk: whether exposed value-defining work is central enough that the role's reason to exist weakens materially.

## 8. Role Fate Classification

Use these priority rules:

1. `collapsed` if `CR_o` is high and `RRI_o` is weak
2. `split` if `SR_o` is high and a smaller high-value retained core remains
3. `elevated` if `EP_o` is high and retained bargaining power is strong
4. `expanded` if `DEM_o` is high enough to offset substitution pressure
5. `compressed` if direct plus indirect pressure is high but the role still clearly exists
6. `augmented` if AI mainly assists without materially weakening bargaining-power tasks
7. `mixed_transition` if no state clears the minimum confidence margin

This is intentionally organizational, not only technical.

## 9. Product Interpretation

The public explanation should follow this logic:

1. Identify the role's current high-time tasks
2. Identify the role's value-defining tasks
3. Estimate direct pressure on those tasks
4. Estimate indirect pressure on supporting work
5. Measure what still carries bargaining power
6. Classify the likely organizational fate

The core product sentence should be:

> Roles do not lose bargaining power because AI automates random support work.
> Roles lose bargaining power when AI becomes strong on the work that makes the role economically necessary.

## 10. Implementation Priorities

### Phase 1

Build:
- fuller task inventories
- value-centrality annotations
- bargaining-power annotations
- dependency-edge contract

### Phase 2

Build:
- direct pressure scoring
- indirect dependency pressure scoring
- residual role integrity
- role-fate classification

### Phase 3

Add:
- demand expansion channels
- scenario views
- uncertainty bands
- occupation-specific calibration

## 11. Minimal Engine Contract

The runtime should eventually emit:
- `role_fate_state`
- `role_fate_confidence`
- `bargaining_power_tasks`
- `directly_pressured_tasks`
- `indirectly_at_risk_tasks`
- `retained_leverage_tasks`
- `residual_role_integrity`
- `direct_exposure_pressure`
- `indirect_dependency_pressure`
- `elevation_potential`
- `split_risk`
- `demand_expansion_modifier`
- `collapse_risk`

## 12. One-Sentence Summary

DLYJ `2.0` should not ask only whether AI can do parts of your job.

It should ask whether AI becomes good enough at the tasks that give your role bargaining power, and what your employer is likely to do if that happens.
