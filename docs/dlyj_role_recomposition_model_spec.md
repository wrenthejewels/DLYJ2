# DLYJ 2.0 Modeling Spec: Role Recomposition, Substitution, and Demand Rebound

## Purpose

This document turns the high-level modeling idea into an implementation-ready spec for a coding/design agent.

The goal is to move beyond a simple "you lose your job at x time" output and instead model:

\[
\text{AI capability} \rightarrow \text{task-level feasibility} \rightarrow \text{workflow-level compression} \rightarrow \text{role recomposition} \rightarrow \text{labor demand outcome}
\]

The model should estimate not just exposure, but the *post-AI organizational fate* of a role.

---

## 1. Modeling Goals

For each occupation `o`, the system should estimate:

- task-level automation feasibility
- task-level augmentation feasibility
- workflow compression
- organizational substitution potential
- transformation potential
- demand rebound / expansion
- net labor-demand pressure
- role-fate classification

The model should distinguish between:

- **automation**: AI substitutes directly for labor on a task
- **augmentation**: AI makes the human materially faster/better on a task
- **transformation**: the role survives, but its composition changes
- **compression**: fewer people are needed in the role
- **collapse**: the role becomes organizationally unnecessary or severely reduced

---

## 2. Occupation-Task Representation

Let occupation `o` contain tasks `i = 1, ..., N_o`.

Define task-share weights:

\[
w_{oi} \in [0,1], \qquad \sum_i w_{oi} = 1
\]

These can be derived from O*NET task importance/frequency and normalized.

For each task, define:

\[
A_{oi}(t) = \text{automation feasibility at time } t
\]

\[
G_{oi}(t) = \text{augmentation feasibility at time } t
\]

\[
H_{oi} = \text{human-essentialness}
\]

\[
C_{oi} = \text{coordination / exception burden}
\]

\[
R_{oi} = \text{regulatory / accountability friction}
\]

\[
Q_{oi} = \text{quality sensitivity}
\]

\[
J_{oi} = \text{embodied / social / judgment requirement}
\]

\[
X_{oi} = \text{exception / non-routine variance}
\]

\[
D_{oi} = \text{document / information intensity}
\]

\[
T_{oi} = \text{tacit / physical execution requirement}
\]

---

## 3. Task-Level Automation and Augmentation

### 3.1 Automation feasibility

For each task:

\[
z^{(A)}_{oi}(t)
=
\beta_0
+ \beta_1 E_{oi}
+ \beta_2 M_{oi}(t)
- \beta_3 X_{oi}
- \beta_4 R_{oi}
- \beta_5 Q_{oi}
- \beta_6 J_{oi}
\]

Where:

- `E_oi`: external exposure score
- `M_oi(t)`: capability-match score between the task and frontier AI systems at time `t`
- `X_oi`: non-routine variance / exception frequency
- `R_oi`: regulation/accountability barrier
- `Q_oi`: error-cost or accuracy sensitivity
- `J_oi`: social/physical/judgment requirement

Then define:

\[
A_{oi}(t) = \sigma(z^{(A)}_{oi}(t)) = \frac{1}{1 + e^{-z^{(A)}_{oi}(t)}}
\]

### 3.2 Augmentation feasibility

\[
z^{(G)}_{oi}(t)
=
\gamma_0
+ \gamma_1 E_{oi}
+ \gamma_2 M_{oi}(t)
+ \gamma_3 D_{oi}
- \gamma_4 X_{oi}
- \gamma_5 T_{oi}
\]

Then:

\[
G_{oi}(t) = \sigma(z^{(G)}_{oi}(t))
\]

In many cognitive occupations, `G_oi(t)` will exceed `A_oi(t)`.

---

## 4. Time-Varying Capability Frontier

Do not use static feasibility estimates.

Let `m_t` be a vector of AI frontier capabilities at time `t`, for example:

- coding
- research
- tool use
- long-horizon task execution
- multimodal perception
- reliability
- domain accuracy
- memory/context handling

Then define task-model fit:

\[
M_{oi}(t) = f(x_{oi}, m_t)
\]

Where `x_oi` is a task-feature vector.

This lets automation and augmentation evolve as AI capabilities improve.

---

## 5. Workflow Compression

Raw task exposure is not enough because tasks are interdependent.

Define direct task compression:

\[
\kappa_{oi}(t) = A_{oi}(t)\alpha_{oi} + (1 - A_{oi}(t))G_{oi}(t)\rho_{oi}
\]

Where:

- `\alpha_oi`: fraction of task time removable if automated
- `\rho_oi`: fraction of task time saved if only augmented

A naive occupation compression score is:

\[
K_o^{\text{naive}}(t) = \sum_i w_{oi} \kappa_{oi}(t)
\]

But this is too simple.

### 5.1 Dependency-adjusted compression

Represent the occupation as a task dependency graph:

\[
\mathcal{G}_o = (V_o, \mathcal{E}_o)
\]

Let `d_ij` be dependency intensity between tasks `i` and `j`.

Define a residual bottleneck penalty:

\[
P_o(t) = \lambda \sum_{(i,j) \in \mathcal{E}_o} d_{ij}(1 - \kappa_{oi}(t))(1 - \kappa_{oj}(t))
\]

Then effective workflow compression is:

\[
K_o(t) = \max \left(0, \sum_i w_{oi}\kappa_{oi}(t) - P_o(t) \right)
\]

Interpretation: bottleneck tasks reduce realized workflow compression.

---

## 6. Organizational Conversion and Substitution Gap

Technical compressibility is not the same as real labor substitution.

Define an organizational conversion factor:

\[
\Omega_o(t) \in [0,1]
\]

\[
\Omega_o(t)
=
\sigma(
\delta_0
+ \delta_1 M_o
+ \delta_2 L_o
+ \delta_3 P_o^{\text{proc}}
- \delta_4 B_o
- \delta_5 A_o^{\text{acct}}
- \delta_6 C_o^{\text{coord}}
- \delta_7 F_o
)
\]

Where:

- `M_o`: modularity of the role
- `L_o`: management willingness / labor-substitution culture
- `P_proc`: process standardization
- `B_o`: burden of exceptions
- `A_acct`: accountability load
- `C_coord`: coordination centrality
- `F_o`: institutional friction

Then actual substitution potential is:

\[
U_o(t) = K_o(t) \cdot \Omega_o(t)
\]

Define the **Substitution Gap** or **Recomposition Gap**:

\[
\text{Gap}_o(t) = K_o(t) - U_o(t) = K_o(t)(1 - \Omega_o(t))
\]

This is one of the most important outputs in the model.

It captures the difference between:
- what AI can technically compress
- what firms can actually convert into labor substitution

---

## 7. Role-State Transitions

Define role states:

\[
s \in \{\text{resilient}, \text{augmented}, \text{compressed}, \text{split}, \text{seniorized}, \text{collapsed}\}
\]

Use a time-varying transition model:

\[
\Pr(s_{o,t+1} = k)
=
\frac{\exp(\eta_k^\top Z_o(t))}{\sum_j \exp(\eta_j^\top Z_o(t))}
\]

Where `Z_o(t)` includes:

- workflow compression `K_o(t)`
- substitution potential `U_o(t)`
- substitution gap `Gap_o(t)`
- coordination centrality
- accountability load
- demand expansion
- wage level
- labor-supply elasticity
- industry AI adoption rate

This allows the system to output an interpretable role-fate classification instead of just a scalar risk score.

---

## 8. Labor Demand Dynamics

Let:

\[
L_o(t) = \text{employment in occupation } o \text{ at time } t
\]

Use:

\[
L_o(t+1) = L_o(t) \cdot \left[1 - \mu_o U_o(t) + \nu_o D_o(t) + \xi_o T_o(t) \right]
\]

Where:

- `U_o(t)`: substitution pressure
- `D_o(t)`: demand expansion / rebound
- `T_o(t)`: transformation term, capturing new human tasks or expanded supervisory work
- `\mu_o, \nu_o, \xi_o`: occupation-specific scaling parameters

Interpretation:

- substitution lowers labor demand
- demand rebound raises labor demand
- transformation can create new human work even when some tasks are automated

---

## 9. The Demand Elasticity Problem

This is the deepest part of the model.

You should not use a single hand-wavy "demand offset" parameter.

Instead, model labor demand as:

\[
L_o = \frac{q_o}{a_o}
\]

Where:

- `q_o`: service quantity produced
- `a_o`: labor productivity

Taking logs:

\[
\ln L_o = \ln q_o - \ln a_o
\]

Differentiate with respect to an AI shock `z`:

\[
\frac{d \ln L_o}{dz}
=
\frac{d \ln q_o}{dz}
-
\frac{d \ln a_o}{dz}
\]

Define:

\[
\chi_o = \frac{d \ln q_o}{dz}
\qquad
\theta_o = \frac{d \ln a_o}{dz}
\]

Then:

\[
\frac{d \ln L_o}{dz} = \chi_o - \theta_o
\]

This is the core employment equation.

Labor demand rises only if quantity expansion exceeds productivity improvement.

---

## 10. Demand Rebound Decomposition

Service quantity `q_o` should be modeled as a function of multiple AI-affected channels:

\[
q_o = Q_o(p_o, v_o, \tau_o, n_o, y)
\]

Where:

- `p_o`: effective price
- `v_o`: quality/performance
- `\tau_o`: turnaround time
- `n_o`: accessibility / number of use cases / addressable market
- `y`: income or aggregate demand shifter

Taking the total differential:

\[
d \ln q_o
=
\varepsilon_{p,o} d \ln p_o
+
\varepsilon_{v,o} d \ln v_o
+
\varepsilon_{\tau,o} d \ln \tau_o
+
\varepsilon_{n,o} d \ln n_o
+
\varepsilon_{y,o} d \ln y
\]

So under an AI shock:

\[
\chi_o
=
\varepsilon_{p,o}\frac{d \ln p_o}{dz}
+
\varepsilon_{v,o}\frac{d \ln v_o}{dz}
+
\varepsilon_{\tau,o}\frac{d \ln \tau_o}{dz}
+
\varepsilon_{n,o}\frac{d \ln n_o}{dz}
\]

This decomposition is critical.

Two jobs with similar exposure can have very different employment outcomes because their demand rebound differs.

---

## 11. Mapping Compression to Cost Decline

Let baseline unit cost be:

\[
c_o = w_o^L c_o^L + w_o^K c_o^K + w_o^O c_o^O
\]

Where labor, capital/software, and other costs sum to total service cost.

If AI reduces labor cost through workflow compression:

\[
c_o^L(t) = c_o^L(0)(1 - \lambda_o K_o(t))
\]

Then:

\[
c_o(t)
=
w_o^L c_o^L(0)(1 - \lambda_o K_o(t))
+ w_o^K c_o^K(t)
+ w_o^O c_o^O
\]

If market prices partially track cost declines:

\[
\frac{d \ln p_o}{dz} \approx \pi_o \frac{d \ln c_o}{dz}
\]

Where `\pi_o` is a price pass-through coefficient.

Then the price-demand channel is:

\[
\chi_o^{(p)}
=
\varepsilon_{p,o} \frac{d \ln p_o}{dz}
\]

In implementation, use absolute price elasticity carefully so lower prices map to higher quantities.

---

## 12. Quality, Speed, and Market Expansion Channels

### 12.1 Quality channel

\[
v_o(t) = v_o(0)(1 + \omega_o^{(v)} G_o(t))
\]

Then:

\[
\chi_o^{(v)} = \varepsilon_{v,o} \frac{d \ln v_o}{dz}
\]

### 12.2 Speed channel

\[
\tau_o(t) = \tau_o(0)(1 - \omega_o^{(\tau)} K_o(t))
\]

Then:

\[
\chi_o^{(\tau)} = \varepsilon_{\tau,o} \frac{d \ln \tau_o}{dz}
\]

### 12.3 Market-expansion channel

\[
n_o(t) = n_o(0)(1 + \omega_o^{(n)} K_o(t))
\]

Then:

\[
\chi_o^{(n)} = \varepsilon_{n,o} \frac{d \ln n_o}{dz}
\]

Final demand expansion:

\[
\chi_o
=
\chi_o^{(p)}
+
\chi_o^{(v)}
+
\chi_o^{(\tau)}
+
\chi_o^{(n)}
\]

This four-part decomposition is one of the most important parts of the model.

---

## 13. Estimating Demand Elasticity in Practice

You will probably not have enough causal evidence to estimate all elasticities directly for every occupation.

So build a hybrid latent scoring system.

### 13.1 Latent demand-expansion score

\[
\mathcal{E}_o^D
=
\alpha_1 \text{LatentDemand}_o
+ \alpha_2 \text{PriceSensitivity}_o
+ \alpha_3 \text{Backlog}_o
+ \alpha_4 \text{UnmetAccess}_o
+ \alpha_5 \text{ServiceFrequency}_o
+ \alpha_6 \text{MarketScalability}_o
- \alpha_7 \text{BudgetConstraint}_o
- \alpha_8 \text{Satiation}_o
\]

Then map it into bounded elasticity estimates:

\[
\chi_o
=
\chi_{\min} + (\chi_{\max} - \chi_{\min}) \sigma(\mathcal{E}_o^D)
\]

Or estimate separate channel elasticities:

\[
\varepsilon_{p,o}
=
\varepsilon_p^{\min}
+
(\varepsilon_p^{\max} - \varepsilon_p^{\min}) \sigma(\mathcal{E}_{p,o})
\]

\[
\varepsilon_{v,o}
=
\varepsilon_v^{\min}
+
(\varepsilon_v^{\max} - \varepsilon_v^{\min}) \sigma(\mathcal{E}_{v,o})
\]

And similarly for speed and market-expansion elasticities.

---

## 14. Features That Should Drive Demand Elasticity

The agent should score each occupation on the following dimensions.

### A. Latent demand
How much demand exists but is currently unmet because the service is too expensive, too slow, too scarce, or too hard to access?

Possible proxies:
- long wait times
- high current service prices
- low penetration relative to need
- geographic underprovision
- strong informal/DIY substitute markets

### B. Price sensitivity
If the service gets cheaper, does usage rise materially?

High:
- consumer-facing discretionary services
- small business services
- modular digital services

Low:
- fixed annual compliance functions
- tightly budget-capped internal corporate functions
- procurement-constrained services

### C. Speed sensitivity
Does faster turnaround unlock more usage?

High:
- research
- coding/debugging
- customer support
- decision support
- analysis
- drafting

Low:
- slow-cycle regulated work where faster output does not increase throughput much

### D. Quality elasticity
If the service gets better, does quantity demanded rise?

High:
- tutoring
- design
- personalization-heavy services
- decision support
- diagnostics
- sales support

### E. Market scalability
Can the service be sold to many more users once it gets cheaper/faster?

High:
- digital/remote services
- low marginal distribution cost
- modular services

Low:
- highly local relationship-bound work
- labor bottlenecked, in-person services

### F. Saturation
Is demand naturally capped regardless of price or quality improvements?

High saturation reduces demand elasticity.

Examples:
- certain compliance/reporting functions
- narrow back-office functions
- some filing-oriented work with fixed annual demand

---

## 15. A Useful Summary Elasticity

Define labor-demand elasticity with respect to service cost:

\[
\epsilon_o^{L,c} = \frac{\partial \ln L_o}{\partial \ln c_o}
\]

Using `L = q / a`:

\[
\epsilon_o^{L,c}
=
\frac{\partial \ln q_o}{\partial \ln c_o}
-
\frac{\partial \ln a_o}{\partial \ln c_o}
\]

If AI reduces service cost by `\Delta \ln c_o < 0`, then:

\[
\Delta \ln L_o \approx \epsilon_o^{L,c} \cdot \Delta \ln c_o
\]

This gives a concise interpretable output:
- if demand expansion is strong, labor decline is softened
- if demand expansion is weak, labor contracts more sharply

---

## 16. Full Net Labor-Change Equation

Recommended structural form:

\[
\Delta \ln L_o(t)
=
-\mu_o U_o(t)
+
\nu_{p,o} |\varepsilon_{p,o}| \cdot (-\Delta \ln p_o(t))
+
\nu_{v,o} \varepsilon_{v,o} \Delta \ln v_o(t)
+
\nu_{\tau,o} \varepsilon_{\tau,o} (-\Delta \ln \tau_o(t))
+
\nu_{n,o} \varepsilon_{n,o} \Delta \ln n_o(t)
+
\xi_o T_o(t)
-
\zeta_o W_o(t)
\]

Where:

- `U_o(t)`: substitution pressure
- `p_o(t)`: effective service price
- `v_o(t)`: quality
- `\tau_o(t)`: turnaround time
- `n_o(t)`: addressable market size / service accessibility
- `T_o(t)`: transformation-created human work
- `W_o(t)`: wage compression / deskilling / downgrade pressure

Then update employment:

\[
L_o(t+1) = L_o(t) \exp(\Delta \ln L_o(t))
\]

---

## 17. Recommended High-Level Latent Indices

For implementation simplicity, the engine can compute five top-level normalized indices:

1. `Exposure_o`
2. `Compression_o`
3. `Substitution_o`
4. `DemandExpansion_o`
5. `Transformation_o`

Then define:

\[
NDP_o(t) = U_o(t) - D_o(t) - T_o(t)
\]

Where:

- `NDP_o(t)`: net displacement pressure
- `U_o(t)`: substitution pressure
- `D_o(t)`: demand rebound
- `T_o(t)`: transformation creation

This gives you a manageable intermediate architecture while preserving the deeper structural logic.

---

## 18. Suggested Final Product Outputs

Instead of returning only a displacement date, return a richer role-fate view.

For each occupation, output:

- **Exposure**
- **Workflow compression**
- **Substitution potential**
- **Demand rebound**
- **Transformation potential**
- **Net displacement pressure**
- **Role fate classification**

Recommended role-fate classes:

- resilient
- augmented
- transformed
- compressed
- seniorized
- split
- collapsing

Also explain:
- what parts of the role get stripped away first
- what human functions remain durable
- whether demand rebound is strong enough to offset labor saving
- whether the role is more likely to compress at the junior level vs disappear entirely

---

## 19. The Core Modeling Insight

The central claim of the model is:

> Jobs are not displaced when their tasks are exposed.
> Jobs are displaced when organizations find a cheaper and workable way to recombine responsibility, coordination, and output around those exposed tasks.

That is why the model must include:

- workflow compression
- organizational conversion
- substitution gap
- demand rebound
- transformation creation

rather than just exposure scores.

---

## 20. Implementation Priorities for the Agent

### Phase 1
Build:
- task weighting
- automation feasibility
- augmentation feasibility
- compression score
- substitution potential
- basic demand rebound score

### Phase 2
Add:
- dependency graph penalties
- organizational conversion factor
- role-state transition model
- separate price/quality/speed/market expansion demand channels

### Phase 3
Add:
- scenario engine
- time-varying AI capability frontier
- uncertainty ranges
- occupation-specific parameter calibration
- narrative explanation layer

---

## 21. Minimal Pseudocode Sketch

```python
for occupation in occupations:
    tasks = load_tasks(occupation)

    for task in tasks:
        task.weight = normalize_task_weight(task.importance, task.frequency)
        task.capability_match = capability_match(task.features, frontier_model[t])

        task.automation = sigmoid(
            b0
            + b1 * task.exposure
            + b2 * task.capability_match
            - b3 * task.exception_rate
            - b4 * task.regulatory_barrier
            - b5 * task.quality_sensitivity
            - b6 * task.judgment_requirement
        )

        task.augmentation = sigmoid(
            g0
            + g1 * task.exposure
            + g2 * task.capability_match
            + g3 * task.document_intensity
            - g4 * task.exception_rate
            - g5 * task.physicality
        )

        task.compression = (
            task.automation * task.full_removability
            + (1 - task.automation) * task.augmentation * task.time_savings_if_augmented
        )

    naive_compression = sum(task.weight * task.compression for task in tasks)
    dependency_penalty = compute_dependency_penalty(tasks, task_graph[occupation])
    workflow_compression = max(0, naive_compression - dependency_penalty)

    organizational_conversion = sigmoid(
        d0
        + d1 * occupation.modularity
        + d2 * occupation.managerial_willingness
        + d3 * occupation.process_standardization
        - d4 * occupation.exception_burden
        - d5 * occupation.accountability_load
        - d6 * occupation.coordination_centrality
        - d7 * occupation.institutional_friction
    )

    substitution_potential = workflow_compression * organizational_conversion
    substitution_gap = workflow_compression - substitution_potential

    demand_rebound = (
        price_channel(occupation, workflow_compression)
        + quality_channel(occupation, workflow_compression)
        + speed_channel(occupation, workflow_compression)
        + market_expansion_channel(occupation, workflow_compression)
    )

    transformation_creation = estimate_transformation_creation(
        occupation,
        substitution_gap,
        coordination_features=occupation.coordination_centrality,
        accountability=occupation.accountability_load
    )

    net_displacement_pressure = (
        substitution_potential
        - demand_rebound
        - transformation_creation
    )

    role_fate = classify_role_fate(
        workflow_compression,
        substitution_potential,
        demand_rebound,
        transformation_creation,
        substitution_gap
    )
```

---

## 22. One-Sentence Summary for Product Positioning

DLYJ 2.0 should not ask only whether AI can do parts of your job.

It should ask what your employer is likely to do to your role once AI can perform those parts cheaply, reliably, and at scale.

