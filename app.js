// app.js — V2 application logic extracted from index.html
// State, questionnaire, formatting, engine access, rendering, and event wiring.

// ─── 1. State variables ──────────────────────────────────────────────────────

let selectedRole = null;
let selectedOccupationId = null;
let lastV2Result = null;
let v2EnginePromise = null;
let v2TaskBreakdownExpanded = false;

// ─── 2. Question Labels ──────────────────────────────────────────────────────

const QUESTION_LABELS = {
    Q1: 'Observed AI Capability',
    Q2: 'Example Work and Documentation',
    Q3: 'Benchmark and Review Clarity',
    Q4: 'Task Digitization',
    Q5: 'Task Independence',
    Q6: 'Task Standardization',
    Q7: 'Context Dependency',
    Q8: 'Feedback and Review Speed',
    Q9: 'Tacit Knowledge',
    Q11: 'Human Judgment and Relationship Load',
    Q12: 'Physical or On-Site Dependence',
    Q13: 'Organization AI Adoption Readiness',
    Q14: 'Labor Cost Pressure',
    Q16: 'Workflow Integration Readiness'
};
const QUESTION_IDS = Object.keys(QUESTION_LABELS);
const CORE_REFINEMENT_QUESTIONS = [1, 5, 7, 11, 13, 16];

// ─── 3. Utility functions ────────────────────────────────────────────────────

function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
}

function toScore(raw) {
    if (typeof raw !== 'number' || Number.isNaN(raw)) return 2;
    if (raw >= 1 && raw <= 5) {
        return Math.max(0, Math.min(4, raw - 1));
    }
    return Math.max(0, Math.min(4, raw));
}

function norm(value) {
    return clamp(toScore(value) / 4, 0, 1);
}

function safeSetText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    } else {
        console.warn(`Element with ID '${elementId}' not found`);
    }
}

// ─── 4. Questionnaire functions ──────────────────────────────────────────────

function getQuestionValue(questionNum) {
    const checked = document.querySelector(`input[name="q${questionNum}"]:checked`);
    return checked ? parseFloat(checked.value) : 3;
}

function applyQuestionPreset() {
    const presets = window.WWILMJ_PRESETS;
    if (!presets || typeof presets.buildQuestionPreset !== 'function') {
        console.warn('[applyQuestionPreset] WWILMJ_PRESETS.buildQuestionPreset missing');
        return;
    }
    if (!selectedRole) {
        console.warn('[applyQuestionPreset] No role selected');
        return;
    }

    const seniorityLevel = document.getElementById('hierarchy-select')?.value || '1';
    const answerMap = presets.buildQuestionPreset(selectedRole, parseInt(seniorityLevel));

    Object.entries(answerMap || {}).forEach(([qid, value]) => {
        const qNum = qid.replace('Q', '');
        const radio = document.querySelector(`input[name="q${qNum}"][value="${value}"]`);
        if (radio) {
            radio.checked = true;
        }
    });
}

function resetQuestionsToNeutral() {
    const presets = window.WWILMJ_PRESETS;
    const neutral = presets && presets.NEUTRAL_ANSWERS ? presets.NEUTRAL_ANSWERS : {};
    const activeQs = [1,2,3,4,5,6,7,8,9,11,12,13,14,16];
    for (const i of activeQs) {
        const target = neutral[`Q${i}`] ?? 3;
        const radio = document.querySelector(`input[name="q${i}"][value="${target}"]`);
        if (radio) {
            radio.checked = true;
        }
    }
}

function initializeRefinementLayout() {
    const coreGrid = document.getElementById('v2-core-refinement-grid');
    const advancedDetails = document.getElementById('v2-advanced-refinement');
    const advancedBody = document.getElementById('v2-advanced-refinement-body');
    const advancedHelper = document.getElementById('v2-advanced-helper');

    if (!coreGrid || !advancedDetails || !advancedBody) {
        return;
    }

    const questionnaireCard = coreGrid.closest('.card');
    if (!questionnaireCard) {
        return;
    }

    const categories = Array.from(questionnaireCard.querySelectorAll('.category'));
    if (!categories.length) {
        return;
    }

    const coreQuestionNodes = CORE_REFINEMENT_QUESTIONS
        .map((questionNum) => questionnaireCard.querySelector(`input[name="q${questionNum}"]`)?.closest('.question'))
        .filter(Boolean);

    coreQuestionNodes.forEach((questionNode) => {
        coreGrid.appendChild(questionNode);
    });

    categories.forEach((category) => {
        const remainingQuestions = category.querySelectorAll('.question');
        if (!remainingQuestions.length) {
            category.remove();
            return;
        }

        const count = remainingQuestions.length;
        const countLabel = category.querySelector('.category-count');
        if (countLabel) {
            countLabel.textContent = `${count} question${count === 1 ? '' : 's'}`;
        }
        advancedBody.appendChild(category);
    });

    const advancedQuestionCount = advancedBody.querySelectorAll('.question').length;
    if (advancedHelper) {
        advancedHelper.textContent = `${advancedQuestionCount} more question${advancedQuestionCount === 1 ? '' : 's'}`;
    }
    if (!advancedQuestionCount) {
        advancedDetails.hidden = true;
    }
}

// ─── 5. V2 Formatting helpers ────────────────────────────────────────────────

function formatV2Label(value) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    return String(value)
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, function(match) { return match.toUpperCase(); });
}

function formatConfidence(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }

    return `${Math.round(numeric * 100)}%`;
}

function toMetricBand(value, thresholds = [0.35, 0.65], labels = ['Low', 'Moderate', 'Strong']) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }

    if (numeric >= thresholds[1]) {
        return labels[2];
    }
    if (numeric >= thresholds[0]) {
        return labels[1];
    }
    return labels[0];
}

function formatLabeledMetric(value, thresholds = [0.35, 0.65], labels = ['Low', 'Moderate', 'Strong']) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }

    return `${toMetricBand(numeric, thresholds, labels)} · ${formatConfidence(numeric)}`;
}

function formatBandMetric(value, band, thresholds = [0.35, 0.65], labels = ['Low', 'Moderate', 'Strong']) {
    const tier = toMetricBand(value, thresholds, labels);
    const low = Number(band?.low);
    const high = Number(band?.high);
    if (!Number.isFinite(low) || !Number.isFinite(high)) {
        return tier;
    }
    return `${tier} · ${Math.round(low * 100)}-${Math.round(high * 100)}%`;
}

function formatCoverageMetric(directCount, fallbackCount) {
    const direct = Math.max(0, Number(directCount) || 0);
    const fallback = Math.max(0, Number(fallbackCount) || 0);
    const total = direct + fallback;
    if (!total) {
        return '-';
    }

    return `${Math.round((direct / total) * 100)}% direct · ${direct}/${total} tasks`;
}

function formatCompactNumber(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }

    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: numeric >= 1000000 ? 1 : 0
    }).format(numeric);
}

function formatCurrency(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(numeric);
}

function formatSignedPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }

    return `${numeric > 0 ? '+' : ''}${numeric.toFixed(1)}%`;
}

// ─── 6. V2 Engine access ────────────────────────────────────────────────────

async function getV2Engine() {
    if (!window.DLYJV2 || typeof window.DLYJV2.create !== 'function') {
        throw new Error('v2 engine runtime is unavailable.');
    }

    if (!v2EnginePromise) {
        v2EnginePromise = window.DLYJV2.create({ basePath: '' });
    }

    return v2EnginePromise;
}

async function populateOccupationCandidates(roleCategory, preserveCurrent = true) {
    const topSelect = document.getElementById('top-occupation-select');
    const resultSelect = document.getElementById('occupation-match-select');
    const selects = [topSelect, resultSelect].filter(Boolean);
    if (!selects.length) return [];

    const setEmptyState = (label, disabled = true) => {
        selects.forEach((select) => {
            select.disabled = disabled;
            select.innerHTML = `<option value="">${label}</option>`;
            select.classList.remove('selected');
        });
    };

    if (!roleCategory || roleCategory === 'custom') {
        const label = roleCategory === 'custom'
            ? 'Choose the closest mapped category instead'
            : 'Select category first';
        setEmptyState(label, true);
        selectedOccupationId = null;
        return [];
    }

    let engine;
    try {
        engine = await getV2Engine();
    } catch (error) {
        console.error('[V2] Failed to load occupation candidates:', error);
        setEmptyState('V2 occupation data unavailable', true);
        selectedOccupationId = null;
        return [];
    }

    const candidates = engine.getOccupationCandidates(roleCategory, 5) || [];
    selects.forEach((select) => {
        select.innerHTML = '';
    });

    if (!candidates.length) {
        setEmptyState('No mapped occupations available', true);
        selectedOccupationId = null;
        return [];
    }

    candidates.forEach((occupation) => {
        selects.forEach((select) => {
            const option = document.createElement('option');
            option.value = occupation.occupation_id;
            option.textContent = occupation.title;
            select.appendChild(option);
        });
    });

    const candidateIds = new Set(candidates.map(item => item.occupation_id));
    const preferredId = preserveCurrent && selectedOccupationId && candidateIds.has(selectedOccupationId)
        ? selectedOccupationId
        : candidates[0].occupation_id;

    selects.forEach((select) => {
        select.disabled = false;
        select.value = preferredId;
        select.classList.add('selected');
    });
    selectedOccupationId = preferredId;
    return candidates;
}

// initializeOccupationSearch is defined inside the DOMContentLoaded handler
// because it references the occupationSearchLookup Map and DOM elements
// scoped to that closure.

// ─── 7. V2 Rendering functions ──────────────────────────────────────────────

let v2UnemploymentChart = null;

function renderV2UnemploymentChart(laborContext) {
    const canvas = document.getElementById('v2-unemployment-chart');
    const emptyState = document.getElementById('v2-unemployment-empty');
    if (!canvas || !emptyState) {
        return;
    }

    if (v2UnemploymentChart) {
        v2UnemploymentChart.destroy();
        v2UnemploymentChart = null;
    }

    const series = Array.isArray(laborContext?.monthly_unemployment_series)
        ? laborContext.monthly_unemployment_series
        : [];

    if (!series.length) {
        canvas.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    canvas.style.display = 'block';
    emptyState.style.display = 'none';

    v2UnemploymentChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: series.map(point => point.month_label),
            datasets: [{
                label: 'Unemployment rate',
                data: series.map(point => point.unemployment_rate),
                borderColor: '#2a5298',
                backgroundColor: 'rgba(42, 82, 152, 0.12)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 4,
                spanGaps: false,
                tension: 0.25,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed.y;
                            return Number.isFinite(value) ? `${value.toFixed(1)}%` : 'Data unavailable';
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 6
                    },
                    grid: { display: false }
                },
                y: {
                    ticks: {
                        callback: (value) => `${value}%`
                    },
                    beginAtZero: false
                }
            }
        }
    });
}

function renderV2LaborMarketContext(laborContext, occupationTitle) {
    safeSetText('v2-employment', laborContext ? formatCompactNumber(laborContext.employment_us) : '-');
    safeSetText('v2-openings', laborContext ? formatCompactNumber(laborContext.annual_openings) : '-');
    safeSetText('v2-wage', laborContext ? formatCurrency(laborContext.median_wage_usd) : '-');
    safeSetText('v2-growth', laborContext ? formatSignedPercent(laborContext.projection_growth_pct) : '-');
    safeSetText('v2-unemployment-latest', laborContext && laborContext.latest_unemployment_rate !== null
        ? `${Number(laborContext.latest_unemployment_rate).toFixed(1)}%`
        : '-');
    safeSetText('v2-unemployment-series-label', laborContext?.unemployment_group_label || 'No mapped unemployment series');
    safeSetText(
        'v2-unemployment-note',
        laborContext?.unemployment_group_label
            ? `${occupationTitle} is mapped to the official BLS ${laborContext.unemployment_group_label.toLowerCase()} monthly unemployment series.`
            : 'This occupation does not have an official BLS unemployment series mapped yet.'
    );
    renderV2UnemploymentChart(laborContext);
}

function createClusterListItem(cluster, options = {}) {
    const shareKey = options.shareKey || 'share_of_role';
    const confidence = Number(cluster?.evidence_confidence);
    const share = Math.max(0, Math.min(1, Number(cluster?.[shareKey]) || 0));
    const sharePct = `${Math.round(share * 100)}%`;

    const item = document.createElement('div');
    item.className = 'v2-cluster-item';

    const topline = document.createElement('div');
    topline.className = 'v2-cluster-topline';

    const label = document.createElement('span');
    label.className = 'v2-cluster-label';
    label.textContent = cluster?.label || 'Unknown row';
    label.title = cluster?.full_label || cluster?.label || 'Unknown row';

    const shareEl = document.createElement('span');
    shareEl.className = 'v2-cluster-share';
    shareEl.textContent = sharePct;

    topline.appendChild(label);
    topline.appendChild(shareEl);

    const bar = document.createElement('div');
    bar.className = 'v2-cluster-bar';

    const fill = document.createElement('div');
    fill.className = 'v2-cluster-bar-fill';
    fill.style.width = sharePct;
    bar.appendChild(fill);

    const meta = document.createElement('div');
    meta.className = 'v2-cluster-meta';

    const parts = [];
    if (cluster?.secondary_label) {
        parts.push(cluster.secondary_label);
    }
    if (cluster?.likely_mode) {
        parts.push(formatV2Label(cluster.likely_mode));
    }
    if (Number.isFinite(confidence)) {
        parts.push(`${Math.round(confidence * 100)}% evidence`);
    }
    if (cluster?.evidence_badge) {
        parts.push(cluster.evidence_badge);
    }
    meta.textContent = parts.join(' · ') || 'Role-weighted row';

    item.appendChild(topline);
    item.appendChild(bar);
    item.appendChild(meta);
    return item;
}

function buildTaskDrivenMapRows(taskBreakdown, shareKey) {
    const rows = Array.isArray(taskBreakdown?.tasks) ? taskBreakdown.tasks.slice() : [];
    if (!rows.length) {
        return [];
    }

    const ranked = rows
        .filter((task) => (Number(task?.[shareKey]) || 0) >= 0.012)
        .sort((left, right) => {
            const rightValue = Number(right?.[shareKey]) || 0;
            const leftValue = Number(left?.[shareKey]) || 0;
            if (rightValue !== leftValue) {
                return rightValue - leftValue;
            }
            return (Number(right?.share_of_role) || 0) - (Number(left?.share_of_role) || 0);
        });

    const selected = (ranked.length ? ranked : rows.slice().sort((left, right) => {
        const rightValue = Number(right?.[shareKey]) || 0;
        const leftValue = Number(left?.[shareKey]) || 0;
        return rightValue - leftValue;
    })).slice(0, 5);

    return selected.map((task) => ({
        label: task?.task_statement || 'Unknown task',
        full_label: task?.task_statement || 'Unknown task',
        secondary_label: task?.task_cluster_label || 'Mapped task family',
        likely_mode: task?.likely_mode || null,
        evidence_confidence: Number(task?.evidence_confidence) || 0,
        evidence_badge: task?.has_direct_evidence ? 'Direct evidence' : 'Fallback estimate',
        share_of_role: Number(task?.share_of_role) || 0,
        exposed_share: Number(task?.exposed_share) || 0,
        residual_relevance: Number(task?.retained_share) || 0
    }));
}

function buildTaskDrivenTransformationMap(taskBreakdown) {
    return {
        current_bundle: buildTaskDrivenMapRows(taskBreakdown, 'share_of_role'),
        exposed_clusters: buildTaskDrivenMapRows(taskBreakdown, 'exposed_share'),
        retained_clusters: buildTaskDrivenMapRows(taskBreakdown, 'retained_share')
    };
}

function renderV2EvidenceSummary(summary) {
    const directRows = Number(summary?.source_coverage?.direct_task_evidence_rows) || 0;
    const fallbackRows = Number(summary?.source_coverage?.fallback_task_rows) || 0;
    const totalRows = directRows + fallbackRows;
    const coverageNote = totalRows
        ? `${Math.round((directRows / totalRows) * 100)}% of the mapped task rows use direct Anthropic task evidence; the remaining ${fallbackRows} rows fall back to task-family estimates.`
        : 'Task-row coverage appears once a mapped occupation is loaded.';
    const frictionNote = summary
        ? 'The model now scores task-family friction explicitly through exception burden, accountability load, judgment requirement, document intensity, and tacit/context dependence.'
        : '';

    safeSetText('v2-task-confidence', summary ? formatLabeledMetric(summary.task_evidence_confidence) : '-');
    safeSetText('v2-prior-confidence', summary ? formatLabeledMetric(summary.personalization_confidence) : '-');
    safeSetText(
        'v2-evidence-notes',
        summary
            ? `Evidence strength is the average source strength across the role-specific task families used in this result after sparse task rows are shrunk toward broader priors. ${coverageNote} ${frictionNote} Personalization signal strength combines coupling protection, capability signal, and evidence strength.`
            : 'Choose a mapped occupation to see how evidence strength and personalization signal are scored.'
    );
}

function renderV2ClusterList(containerId, clusters, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const rows = Array.isArray(clusters) ? clusters.slice(0, options.limit || 5) : [];
    if (!rows.length) {
        const empty = document.createElement('div');
        empty.className = 'v2-cluster-item';
        empty.textContent = options.emptyText || 'No cluster evidence available yet.';
        container.appendChild(empty);
        return;
    }

    rows.forEach(cluster => {
        container.appendChild(createClusterListItem(cluster, options));
    });
}

function createV2TaskChip(text, tone = '') {
    const chip = document.createElement('span');
    chip.className = `v2-task-chip${tone ? ` v2-task-chip--${tone}` : ''}`;
    chip.textContent = text;
    return chip;
}

function renderV2OccupationAssignment(assignment) {
    const directCount = Number(assignment?.direct_task_evidence_count) || 0;
    const fallbackCount = Number(assignment?.fallback_task_count) || 0;
    const totalCount = directCount + fallbackCount;
    const directCoveragePct = totalCount ? Math.round((directCount / totalCount) * 100) : 0;

    safeSetText('v2-assignment-category', assignment ? assignment.role_category_label || '-' : '-');
    safeSetText('v2-assignment-anchor', assignment ? assignment.selected_occupation_title || '-' : '-');
    safeSetText(
        'v2-assignment-match',
        assignment
            ? formatLabeledMetric(assignment.anchor_confidence)
            : '-'
    );
    safeSetText(
        'v2-assignment-coverage',
        assignment
            ? formatCoverageMetric(directCount, fallbackCount)
            : '-'
    );

    const parts = [];
    if (assignment?.onet_soc_code) {
        parts.push(`${assignment.selected_occupation_title} is anchored to O*NET/SOC ${assignment.onet_soc_code}.`);
    }
    if (assignment) {
        parts.push(`Occupation anchor strength combines the occupation-prior confidence with the launch selector anchor${assignment.category_candidate_rank ? `; this occupation is candidate ${assignment.category_candidate_rank} of ${assignment.category_candidate_count} inside the selected category` : ''}.`);
    }
    if (assignment && totalCount) {
        parts.push(`Task coverage means ${directCoveragePct}% of the ${totalCount} mapped O*NET tasks have direct Anthropic task evidence; the remaining ${fallbackCount} rows use task-family fallback estimates.`);
    }
    if (assignment?.questionnaire_effect) {
        parts.push(assignment.questionnaire_effect);
    }
    if (assignment?.role_defining_cluster?.label) {
        parts.push(`The role-defining task family is currently ${assignment.role_defining_cluster.label.toLowerCase()}.`);
    }

    safeSetText(
        'v2-assignment-copy',
        parts.length
            ? parts.join(' ')
            : 'Choose a mapped occupation to see how your role is assigned to the underlying O*NET, Anthropic, and BLS occupation data.'
    );
}

function renderV2RecompositionSummary(summary) {
    safeSetText('v2-recomposition-label', summary ? summary.summary_label || '-' : '-');
    safeSetText('v2-recomposition-compression', summary ? formatBandMetric(summary.workflow_compression, summary.workflow_compression_band, [0.25, 0.5], ['Low', 'Moderate', 'High']) : '-');
    safeSetText('v2-recomposition-conversion', summary ? formatBandMetric(summary.organizational_conversion, summary.organizational_conversion_band, [0.25, 0.5], ['Low', 'Moderate', 'High']) : '-');
    safeSetText('v2-recomposition-substitution', summary ? formatBandMetric(summary.substitution_potential, summary.substitution_potential_band, [0.2, 0.4], ['Low', 'Moderate', 'High']) : '-');
    safeSetText('v2-recomposition-gap', summary ? formatBandMetric(summary.substitution_gap, summary.substitution_gap_band, [0.12, 0.25], ['Low', 'Moderate', 'High']) : '-');
    safeSetText(
        'v2-recomposition-note',
        summary?.summary_note
            ? `Workflow compression is the technically compressible share of the role. Organizational conversion is the current read on how much of that compression looks likely to convert into fewer labor hours. Substitution potential is compression multiplied by conversion. Recomposition gap is exposed work that still looks more likely to be reorganized than removed. These readouts now include uncertainty ranges rather than a single point estimate. ${summary.summary_note}`
            : 'This panel separates technically compressible work from the share that currently looks more likely to convert into fewer labor hours.'
    );
}

function createV2TaskBreakdownItem(task) {
    const item = document.createElement('div');
    item.className = `v2-task-item${task?.is_role_critical ? ' v2-task-item--critical' : ''}`;

    const topline = document.createElement('div');
    topline.className = 'v2-task-topline';

    const statement = document.createElement('div');
    statement.className = 'v2-task-statement';
    statement.textContent = task?.task_statement || 'Unknown task';

    const share = document.createElement('div');
    share.className = 'v2-task-share';
    share.textContent = `${Math.round((Number(task?.share_of_role) || 0) * 100)}% of role`;

    topline.appendChild(statement);
    topline.appendChild(share);

    const meter = document.createElement('div');
    meter.className = 'v2-task-meter';

    const shareFill = document.createElement('div');
    shareFill.className = 'v2-task-meter-share';
    shareFill.style.width = `${Math.max(0, Math.min(100, (Number(task?.share_of_role) || 0) * 100))}%`;

    const exposedFill = document.createElement('div');
    exposedFill.className = 'v2-task-meter-exposed';
    exposedFill.style.width = `${Math.max(0, Math.min(100, (Number(task?.exposed_share) || 0) * 100))}%`;

    meter.appendChild(shareFill);
    meter.appendChild(exposedFill);

    const meta = document.createElement('div');
    meta.className = 'v2-task-meta';
    meta.appendChild(createV2TaskChip(task?.task_cluster_label || 'Unknown cluster', 'accent'));
    meta.appendChild(createV2TaskChip(`${formatV2Label(task?.exposure_level)} exposure`, task?.exposure_level === 'high' ? 'warning' : (task?.exposure_level === 'moderate' ? 'accent' : '')));
    meta.appendChild(createV2TaskChip(formatV2Label(task?.likely_mode || 'mixed'), task?.likely_mode === 'automation' ? 'warning' : 'success'));
    meta.appendChild(createV2TaskChip(`${Math.round((Number(task?.evidence_confidence) || 0) * 100)}% confidence`));
    meta.appendChild(createV2TaskChip(task?.has_direct_evidence ? 'Direct task evidence' : 'Cluster fallback'));

    if (task?.is_role_critical) {
        meta.appendChild(createV2TaskChip('Role-defining family', 'accent'));
    }

    const footnote = document.createElement('div');
    footnote.className = 'v2-task-footnote';
    footnote.textContent = `${Math.round((Number(task?.exposed_share) || 0) * 100)}% exposed share, ${Math.round((Number(task?.retained_share) || 0) * 100)}% retained after transformation. ${task?.mapping_method ? `Mapped via ${String(task.mapping_method).replace(/_/g, ' ')}.` : ''}`;

    item.appendChild(topline);
    item.appendChild(meter);
    item.appendChild(meta);
    item.appendChild(footnote);
    return item;
}

function renderV2TaskBreakdown(taskBreakdown, assignment) {
    const container = document.getElementById('v2-task-breakdown');
    const toggle = document.getElementById('v2-task-toggle');
    if (!container) return;

    container.innerHTML = '';

    const allRows = Array.isArray(taskBreakdown?.tasks) ? taskBreakdown.tasks : [];
    const rows = v2TaskBreakdownExpanded ? allRows : allRows.slice(0, 10);
    const directCount = Number(taskBreakdown?.direct_evidence_tasks) || 0;
    const fallbackCount = Number(taskBreakdown?.cluster_fallback_tasks) || 0;

    safeSetText('v2-task-total', allRows.length ? `${rows.length} of ${taskBreakdown.total_tasks_considered}` : '-');
    safeSetText('v2-task-direct', taskBreakdown ? formatCoverageMetric(directCount, fallbackCount) : '-');
    safeSetText('v2-task-fallback', taskBreakdown ? String(taskBreakdown.cluster_fallback_tasks || 0) : '-');
    safeSetText('v2-task-ordering', allRows.length ? (v2TaskBreakdownExpanded ? 'All tasks' : 'Top exposed share') : '-');
    safeSetText(
        'v2-task-summary-copy',
        assignment
            ? `${assignment.selected_occupation_title} currently resolves to ${taskBreakdown.total_tasks_considered || 0} mapped O*NET tasks. This list live-updates as your selected occupation, task-family inputs, and questionnaire answers change task shares and exposure estimates inside that occupation anchor. Use “Show model details” if you want the underlying evidence and fallback notes.`
            : 'Choose a mapped occupation to load its O*NET task list and the blended task-level exposure view.'
    );

    if (toggle) {
        const canExpand = allRows.length > 10;
        toggle.hidden = !canExpand;
        toggle.textContent = v2TaskBreakdownExpanded ? 'Show top 10 tasks' : `Show all ${allRows.length} tasks`;
        toggle.setAttribute('aria-expanded', v2TaskBreakdownExpanded ? 'true' : 'false');
    }

    if (!rows.length) {
        if (toggle) {
            toggle.hidden = true;
        }
        const empty = document.createElement('div');
        empty.className = 'v2-task-item';
        empty.textContent = 'No mapped task-level rows are available for this occupation yet.';
        container.appendChild(empty);
        return;
    }

    rows.forEach((task) => {
        container.appendChild(createV2TaskBreakdownItem(task));
    });
}

// ─── 8. V2 Result functions ─────────────────────────────────────────────────

function getDirectV2Inputs() {
    const primaryCluster = document.getElementById('v2-task-primary')?.value || '';
    const secondaryCluster = document.getElementById('v2-task-secondary')?.value || '';
    const criticalCluster = document.getElementById('v2-task-critical')?.value || '';
    const dominantTaskClusters = [primaryCluster, secondaryCluster].filter(Boolean);
    const dedupedClusters = Array.from(new Set(dominantTaskClusters));
    const roleCriticalClusters = criticalCluster ? [criticalCluster] : [];

    return {
        dominantTaskClusters: dedupedClusters,
        roleCriticalClusters: roleCriticalClusters
    };
}

function resetV2Results(message, detail) {
    v2TaskBreakdownExpanded = false;
    safeSetText('v2-role-state-label', message || 'Select a role to begin');
    safeSetText('v2-role-summary', detail || 'Choose a category, select the closest occupation, and optionally refine the result with task-mix or questionnaire detail.');
    safeSetText('v2-outlook-summary-copy', detail || 'This briefing is built from your selected occupation, your task mix, and empirical task-level evidence.');
    safeSetText('v2-role-state-card', '-');
    safeSetText('v2-score-role-outlook', '-');
    safeSetText('v2-top-cluster', '-');
    safeSetText('v2-balance', '-');
    safeSetText('v2-score-mode', '-');
    safeSetText('v2-viability', '-');
    safeSetText('v2-score-residual', '-');
    safeSetText('v2-adaptation', '-');
    safeSetText('v2-score-fit', '-');
    safeSetText('v2-what-changing', '-');
    safeSetText('v2-what-absorbed', '-');
    safeSetText('v2-what-remains', '-');
    safeSetText('v2-who-benefits', '-');
    safeSetText('v2-task-confidence', '-');
    safeSetText('v2-prior-confidence', '-');
    safeSetText('v2-evidence-notes', 'Choose a mapped occupation to see how evidence strength, personalization signal, occupation anchoring, and task coverage are scored.');
    safeSetText('v2-map-subtitle', "This map is derived from the live task rows below. It ranks the occupation's mapped tasks by automation difficulty, wave assignment, and retained share.");
    safeSetText('v2-task-note', 'This view reorders the selected occupation\'s tasks as your task-family inputs and questionnaire answers change the underlying task shares and exposure estimates.');
    safeSetText('v2-recomposition-conversion', '-');
    ['current', 'next', 'distant'].forEach(function (w) {
        safeSetText('v2-wave-' + w + '-state', '-');
        safeSetText('v2-wave-' + w + '-retained', '-');
        safeSetText('v2-wave-' + w + '-coherence', '-');
    });
    renderV2LaborMarketContext(null, '');
    renderV2OccupationAssignment(null);
    renderV2ClusterList('v2-current-bundle', [], { emptyText: 'Choose a mapped occupation to populate the current bundle.' });
    renderV2ClusterList('v2-exposed-bundle', [], { emptyText: 'Exposure detail appears once the transformation view is active.' });
    renderV2ClusterList('v2-residual-bundle', [], { emptyText: 'Residual role detail appears once the transformation view is active.' });
    renderV2TaskBreakdown(null, null);
    lastV2Result = null;
}

async function updateV2Results(options = {}) {
    const preserveSelection = options.preserveSelection !== false;
    const roleCategory = selectedRole;

    if (!roleCategory) {
        resetV2Results('Select a category to begin', 'Choose a category, select the closest occupation, and optionally refine the result with task-mix or questionnaire detail.');
        return null;
    }

    if (roleCategory === 'custom') {
        const select = document.getElementById('occupation-match-select');
        if (select) {
            select.disabled = true;
            select.innerHTML = '<option value="">Choose the closest mapped category instead</option>';
        }
        selectedOccupationId = null;
        resetV2Results(
            'Choose the closest mapped category',
            'The empirical 2.0 briefing only runs on mapped launch occupations. Choose the closest supported category and occupation before scoring.'
        );
        return null;
    }

    const candidates = await populateOccupationCandidates(roleCategory, preserveSelection);
    if (!candidates.length || !selectedOccupationId) {
        resetV2Results('No occupation match available', 'This category does not yet have a launch occupation mapped into the transformation engine.');
        return null;
    }

    let engine;
    try {
        engine = await getV2Engine();
    } catch (error) {
        console.error('[V2] Engine initialization failed:', error);
        resetV2Results('V2 engine unavailable', 'The transformation model data could not be loaded on this page.');
        return null;
    }

    const answers = {};
    const activeQs = [1,2,3,4,5,6,7,8,9,11,12,13,14,16];
    for (const i of activeQs) {
        answers['Q' + i] = getQuestionValue(i);
    }
    const seniorityLevel = parseFloat(document.getElementById('hierarchy-select')?.value || '1');
    const directInputs = getDirectV2Inputs();

    let result;
    try {
        result = engine.computeResult({
            roleCategory: roleCategory,
            occupationId: selectedOccupationId,
            answers: answers,
            seniorityLevel: seniorityLevel,
            dominantTaskClusters: directInputs.dominantTaskClusters,
            roleCriticalClusters: directInputs.roleCriticalClusters
        });
    } catch (error) {
        console.error('[V2] Failed to compute result:', error);
        resetV2Results('V2 result unavailable', 'The transformation engine could not resolve a result for this role yet.');
        return null;
    }

    lastV2Result = result;

    const topExposedLabel = result.top_exposed_work?.label
        ? `${result.top_exposed_work.label} · ${result.top_exposed_work.wave_assignment} wave`
        : '-';

    const wt = result.wave_trajectory || {};
    const waveHeadline = `Primary displacement: ${result.primary_displacement_wave} wave`;

    safeSetText('v2-role-state-label', `${result.selected_occupation_title} · ${result.role_outlook_label}`);
    safeSetText('v2-role-summary', result.role_summary || 'The wave-based model ranks task clusters by automation difficulty into current, next, and distant waves.');
    safeSetText('v2-outlook-summary-copy', result.role_summary || 'The wave-based model ranks task clusters by automation difficulty.');
    safeSetText('v2-role-state-card', result.role_outlook_label || '-');
    safeSetText('v2-score-role-outlook', result.role_outlook_label || '-');
    safeSetText('v2-top-cluster', topExposedLabel);
    safeSetText('v2-balance', waveHeadline);
    safeSetText('v2-score-mode', waveHeadline);
    safeSetText('v2-viability', formatV2Label(result.residual_role_strength));
    safeSetText('v2-score-residual', formatV2Label(result.residual_role_strength));
    safeSetText('v2-adaptation', formatV2Label(result.personalization_fit));
    safeSetText('v2-score-fit', formatV2Label(result.personalization_fit));

    // Wave trajectory cards
    ['current', 'next', 'distant'].forEach(function (waveName) {
        var ws = wt[waveName];
        if (!ws) return;
        safeSetText('v2-wave-' + waveName + '-state', ws.state_label || formatV2Label(ws.state));
        safeSetText('v2-wave-' + waveName + '-retained', Math.round((ws.retained_share || 0) * 100) + '% retained');
        safeSetText('v2-wave-' + waveName + '-coherence', formatV2Label(ws.coherence_tier) + ' coherence');
    });
    safeSetText('v2-what-changing', result.narrative_summary?.why_this_role_changes || '-');
    safeSetText('v2-what-absorbed', result.narrative_summary?.what_is_under_pressure || '-');
    safeSetText('v2-what-remains', result.narrative_summary?.what_stays_core || '-');
    safeSetText('v2-who-benefits', result.narrative_summary?.personalization_fit_summary || '-');
    renderV2EvidenceSummary(result.evidence_summary);
    safeSetText(
        'v2-map-subtitle',
        `${result.selected_occupation_title}: primary displacement in the ${result.primary_displacement_wave} wave. After the next wave, ${Math.round((wt.next?.retained_share || 0) * 100)}% retained (${wt.next?.coherence_tier || '-'} coherence).`
    );
    safeSetText(
        'v2-task-note',
        `${result.selected_occupation_title} uses its mapped O*NET task list as the baseline. Each task inherits automation difficulty and wave assignment from its cluster, and updates live as your questionnaire changes the scoring.`
    );
    renderV2RecompositionSummary(result.recomposition_summary);
    renderV2OccupationAssignment(result.occupation_assignment);
    renderV2LaborMarketContext(result.labor_market_context, result.selected_occupation_title);
    const taskDrivenMap = buildTaskDrivenTransformationMap(result.task_breakdown);
    renderV2ClusterList('v2-current-bundle', taskDrivenMap.current_bundle, {
        shareKey: 'share_of_role',
        emptyText: 'No current task bundle available.'
    });
    renderV2ClusterList('v2-exposed-bundle', taskDrivenMap.exposed_clusters, {
        shareKey: 'exposed_share',
        emptyText: 'No exposed clusters exceeded the display threshold.'
    });
    renderV2ClusterList('v2-residual-bundle', taskDrivenMap.retained_clusters, {
        shareKey: 'residual_relevance',
        emptyText: 'No residual bundle clusters exceeded the display threshold.'
    });
    renderV2TaskBreakdown(result.task_breakdown, result.occupation_assignment);

    return result;
}

// ─── 9. Simplified analyzeRole ──────────────────────────────────────────────

function analyzeRole() {
    if (!selectedRole) return;
    updateV2Results({ preserveSelection: true }).catch(function(error) {
        console.error('[V2] Failed to update transformation view:', error);
    });
}

// ─── 10. Category toggle ────────────────────────────────────────────────────

function toggleCategory(header) {
    const content = header.nextElementSibling;
    const toggle = header.querySelector('.category-toggle');
    content.classList.toggle('hidden');
    toggle.classList.toggle('open');
}

// ─── 11. Event handlers — radio buttons ─────────────────────────────────────

document.querySelectorAll('input[type="radio"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
        analyzeRole();
    });
});

// ─── 12. Main DOMContentLoaded handler ──────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
    const roleSelect = document.getElementById('role-select');
    const topOccupationSelect = document.getElementById('top-occupation-select');
    const occupationSearchInput = document.getElementById('occupation-search-input');
    const occupationSearchOptions = document.getElementById('occupation-search-options');
    const hierarchySelect = document.getElementById('hierarchy-select');
    const prefillToggle = document.getElementById('prefill-questions');
    const resultsSection = document.getElementById('results-column');
    const explanationSection = document.getElementById('model-explanation-section');
    const legacyWizard = document.querySelector('.legacy-wizard');
    const occupationMatchSelect = document.getElementById('occupation-match-select');
    const v2DirectInputs = document.querySelectorAll('.v2-direct-input');
    const v2TaskToggle = document.getElementById('v2-task-toggle');

    const activate = (el) => el && el.classList.add('active');
    const showBlock = (el) => el && el.classList.remove('hidden-block');
    const occupationSearchLookup = new Map();

    initializeRefinementLayout();

    function tryShowResults() {
        if (roleSelect?.value && hierarchySelect?.value && (selectedOccupationId || roleSelect?.value === 'custom')) {
            showBlock(resultsSection);
            showBlock(explanationSection);
        }
    }

    function setPrefillState() {
        if (!prefillToggle) return;
        const ready = !!(roleSelect?.value && hierarchySelect?.value && (selectedOccupationId || roleSelect?.value === 'custom'));
        if (!ready) {
            prefillToggle.checked = false;
            prefillToggle.disabled = true;
        } else {
            prefillToggle.disabled = false;
        }
    }

    function syncLegacyRoleCategory(roleVal) {
        selectedRole = roleVal || null;
        document.querySelectorAll('.preset-btn').forEach((button) => {
            button.classList.toggle('active', !!roleVal && button.dataset.role === roleVal);
        });
    }

    function syncSearchInputWithOccupation(occupationId) {
        if (!occupationSearchInput) return;
        if (!occupationId) {
            occupationSearchInput.value = '';
            return;
        }

        const matched = occupationSearchLookup.get(String(occupationId).toLowerCase());
        occupationSearchInput.value = matched ? matched.title : '';
    }

    async function initializeOccupationSearch() {
        if (!occupationSearchInput || !occupationSearchOptions) {
            return;
        }

        try {
            const engine = await getV2Engine();
            const occupations = engine.listOccupations() || [];
            occupationSearchLookup.clear();
            occupationSearchOptions.innerHTML = '';

            occupations.forEach((occupation) => {
                occupationSearchLookup.set(String(occupation.occupation_id).toLowerCase(), occupation);
                occupationSearchLookup.set(String(occupation.title || '').trim().toLowerCase(), occupation);

                const option = document.createElement('option');
                option.value = occupation.title;
                occupationSearchOptions.appendChild(option);
            });
        } catch (error) {
            console.error('[V2] Failed to initialize occupation search:', error);
        }
    }

    // v2 task toggle
    v2TaskToggle?.addEventListener('click', () => {
        v2TaskBreakdownExpanded = !v2TaskBreakdownExpanded;
        renderV2TaskBreakdown(lastV2Result?.task_breakdown || null, lastV2Result?.occupation_assignment || null);
    });

    // Sequence items — immediate reveal
    const sequenceItems = Array.from(document.querySelectorAll('.sequence-item'))
        .sort((a, b) => (parseInt(a.dataset.seq || '0') || 0) - (parseInt(b.dataset.seq || '0') || 0));
    sequenceItems.forEach((el) => el.classList.add('is-visible'));

    // Category header click binding
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', function() {
            toggleCategory(this);
        });
    });

    // Occupation match select change handler
    occupationMatchSelect?.addEventListener('change', () => {
        selectedOccupationId = occupationMatchSelect.value || null;
        if (topOccupationSelect && topOccupationSelect.value !== selectedOccupationId) {
            topOccupationSelect.value = selectedOccupationId || '';
            topOccupationSelect.classList.toggle('selected', !!selectedOccupationId);
        }
        syncSearchInputWithOccupation(selectedOccupationId);
        tryShowResults();
        setPrefillState();
        updateV2Results({ preserveSelection: true }).catch(error => {
            console.error('[V2] Failed to rerender after occupation change:', error);
        });
    });

    // Top occupation select change handler
    topOccupationSelect?.addEventListener('change', () => {
        selectedOccupationId = topOccupationSelect.value || null;
        topOccupationSelect.classList.toggle('selected', !!selectedOccupationId);
        if (occupationMatchSelect && occupationMatchSelect.value !== selectedOccupationId) {
            occupationMatchSelect.value = selectedOccupationId || '';
        }
        syncSearchInputWithOccupation(selectedOccupationId);
        tryShowResults();
        setPrefillState();
        updateV2Results({ preserveSelection: true }).catch(error => {
            console.error('[V2] Failed to rerender after top occupation change:', error);
        });
    });

    // Occupation search input change handler
    occupationSearchInput?.addEventListener('change', async () => {
        const query = String(occupationSearchInput.value || '').trim().toLowerCase();
        if (!query) {
            return;
        }

        let matchedOccupation = occupationSearchLookup.get(query) || null;

        if (!matchedOccupation) {
            try {
                const engine = await getV2Engine();
                matchedOccupation = (engine.searchOccupations(query, 1) || [])[0] || null;
            } catch (error) {
                console.error('[V2] Failed to search occupations:', error);
            }
        }

        if (!matchedOccupation) {
            return;
        }

        if (roleSelect) {
            roleSelect.value = matchedOccupation.role_family || '';
            roleSelect.classList.toggle('selected', !!roleSelect.value);
        }

        syncLegacyRoleCategory(matchedOccupation.role_family || '');

        try {
            await populateOccupationCandidates(matchedOccupation.role_family, false);
        } catch (error) {
            console.error('[V2] Failed to populate occupations from search selection:', error);
        }

        selectedOccupationId = matchedOccupation.occupation_id;

        if (topOccupationSelect) {
            topOccupationSelect.value = selectedOccupationId;
            topOccupationSelect.classList.add('selected');
        }
        if (occupationMatchSelect) {
            occupationMatchSelect.value = selectedOccupationId;
        }

        occupationSearchInput.value = matchedOccupation.title;
        tryShowResults();
        setPrefillState();
        analyzeRole();
    });

    // v2 direct inputs change handler
    v2DirectInputs.forEach((input) => {
        input.addEventListener('change', () => {
            if (!selectedRole) return;
            updateV2Results({ preserveSelection: true }).catch(error => {
                console.error('[V2] Failed to rerender after direct 2.0 input change:', error);
            });
        });
    });

    // Role select change handler
    roleSelect?.addEventListener('change', async () => {
        const roleValue = roleSelect.value || '';
        roleSelect.classList.toggle('selected', !!roleValue);
        syncLegacyRoleCategory(roleValue);

        selectedOccupationId = null;

        try {
            await populateOccupationCandidates(roleValue, false);
        } catch (error) {
            console.error('[V2] Failed to populate occupations from category change:', error);
        }

        syncSearchInputWithOccupation(selectedOccupationId);

        if (!roleValue) {
            resetV2Results('Select a category to begin', 'Choose a category, select the closest occupation, and complete the questionnaire to generate the transformation briefing.');
        }

        tryShowResults();
        setPrefillState();
        analyzeRole();

        if (prefillToggle?.checked) {
            applyQuestionPreset();
            analyzeRole();
        }
    });

    // Hierarchy select change handler
    hierarchySelect?.addEventListener('change', () => {
        if (hierarchySelect.value) {
            hierarchySelect.classList.add('selected');
        }
        tryShowResults();
        setPrefillState();
        if (prefillToggle?.checked) {
            applyQuestionPreset();
            analyzeRole();
        }
    });

    // Step open survey click handler
    document.getElementById('step-open-survey')?.addEventListener('click', () => {
        if (legacyWizard) {
            legacyWizard.classList.remove('hidden-block');
            legacyWizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (roleSelect?.value && hierarchySelect?.value && (selectedOccupationId || roleSelect?.value === 'custom')) {
            showBlock(resultsSection);
            showBlock(explanationSection);
        }
    });

    // Questionnaire button click handler
    const questionnaireButton = document.getElementById('questionnaire-button');
    questionnaireButton?.addEventListener('click', () => {
        const setupWizard = document.getElementById('setup-wizard');
        if (setupWizard) {
            setupWizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.getElementById('step-open-survey')?.click();
        }
    });

    // Prefill toggle change handler
    prefillToggle?.addEventListener('change', () => {
        if (prefillToggle.disabled) return;
        if (prefillToggle.checked) {
            if (!selectedRole || (!selectedOccupationId && selectedRole !== 'custom')) {
                alert('Pick a category, occupation, and hierarchy level first.');
                prefillToggle.checked = false;
                return;
            }
            applyQuestionPreset();

            if (explanationSection) {
                setTimeout(() => {
                    explanationSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100);
            }
        } else {
            resetQuestionsToNeutral();
        }
        analyzeRole();
    });

    // Navigation buttons (Guide/Methodology)
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.currentTarget.getAttribute('data-page');
            if (page) {
                window.location.href = page;
            }
        });
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // Initialize occupation search
    initializeOccupationSearch();

    // Step cards navigation
    document.querySelectorAll('.step-card').forEach(card => {
        const page = card.getAttribute('data-page');
        if (!page) return;
        card.addEventListener('click', () => {
            window.location.href = page;
        });
    });

    // Set initial prefill state
    setPrefillState();
});

// ─── 13. Second DOMContentLoaded for init ───────────────────────────────────

window.addEventListener('DOMContentLoaded', function() {
    resetV2Results();
});
