// app.js — V2 application logic extracted from index.html
// State, questionnaire, formatting, engine access, rendering, and event wiring.

// ─── 1. State variables ──────────────────────────────────────────────────────

let selectedRole = null;
let selectedOccupationId = null;
let lastV2Result = null;
let v2EnginePromise = null;
let v2TaskBreakdownExpanded = false;

const V2_TASK_INPUT_CONFIG = [
    { id: 'v2-task-primary', placeholder: 'No task override' },
    { id: 'v2-task-secondary', placeholder: 'No secondary task override' },
    { id: 'v2-task-critical', placeholder: 'Infer value-defining task' },
    { id: 'v2-task-supported', placeholder: 'No explicit AI-assisted task' },
    { id: 'v2-task-spillover', placeholder: 'No explicit spillover task' }
];

// ─── 2. Questionnaire schema ────────────────────────────────────────────────

const ACTIVE_REFINEMENT_QUESTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 16];
const CORE_REFINEMENT_QUESTIONS = [1, 5, 7, 11, 13, 16];
const QUESTIONNAIRE_MODULES = [
    {
        title: 'Exposure And Evidence',
        questions: [
            {
                number: 1,
                title: 'AI observability in this work',
                prompt: 'How visible and legible is the work to current AI systems through prompts, artifacts, outputs, or structured traces?',
                options: [
                    { value: 1, label: 'Very Poor' },
                    { value: 2, label: 'Limited' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 4, label: 'Good' },
                    { value: 5, label: 'Near-Human' }
                ]
            },
            {
                number: 2,
                title: 'Evidence and work trail',
                prompt: 'How much role-relevant work trail exists for imitation, benchmarking, training, or structured review?',
                options: [
                    { value: 1, label: 'Very Limited' },
                    { value: 2, label: 'Limited' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 4, label: 'Abundant' },
                    { value: 5, label: 'Very Abundant' }
                ]
            },
            {
                number: 3,
                title: 'Human review and sign-off clarity',
                prompt: 'How clearly can a human reviewer tell whether the work is acceptable, and how formal is the review or approval burden?',
                options: [
                    { value: 1, label: 'Very Hard' },
                    { value: 2, label: 'Difficult' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 4, label: 'Fairly Easy' },
                    { value: 5, label: 'Very Easy' }
                ]
            },
            {
                number: 4,
                title: 'Work digitization and machine readability',
                prompt: 'What share of the work inputs, context, and outputs already live in digital or system-readable form?',
                options: [
                    { value: 1, label: '0-20%' },
                    { value: 2, label: '21-40%' },
                    { value: 3, label: '41-60%', checked: true },
                    { value: 4, label: '61-80%' },
                    { value: 5, label: '81-100%' }
                ]
            }
        ]
    },
    {
        title: 'Role Structure',
        questions: [
            {
                number: 5,
                title: 'Workflow decomposability',
                prompt: 'Can the work be cleanly split into independent units, or does it need to stay bundled in a larger sequence?',
                options: [
                    { value: 1, label: 'Very Complex' },
                    { value: 2, label: 'Complex' },
                    { value: 3, label: 'Mixed', checked: true },
                    { value: 4, label: 'Structured' },
                    { value: 5, label: 'Highly Structured' }
                ]
            },
            {
                number: 6,
                title: 'Procedure standardization',
                prompt: 'How standardized are the procedures, templates, and workflow steps in this role?',
                options: [
                    { value: 1, label: 'Highly Variable' },
                    { value: 2, label: 'Variable' },
                    { value: 3, label: 'Somewhat Standard', checked: true },
                    { value: 4, label: 'Standardized' },
                    { value: 5, label: 'Highly Standardized' }
                ]
            },
            {
                number: 7,
                title: 'Context and exception load',
                prompt: 'How much does good performance depend on local context, exception handling, unwritten norms, or situation-specific judgment?',
                options: [
                    { value: 5, label: 'Critical' },
                    { value: 4, label: 'Very Important' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 2, label: 'Some Needed' },
                    { value: 1, label: 'Minimal' }
                ]
            },
            {
                number: 8,
                title: 'Review loop speed',
                prompt: 'How quickly does the work get reviewed, corrected, or accepted in ways that AI systems could learn from?',
                options: [
                    { value: 1, label: 'Months/Years' },
                    { value: 2, label: 'Weeks' },
                    { value: 3, label: 'Days', checked: true },
                    { value: 4, label: 'Hours' },
                    { value: 5, label: 'Minutes/Instant' }
                ]
            },
            {
                number: 9,
                title: 'Tacit rules and unwritten context',
                prompt: 'How much of the expertise in this role is learned through experience rather than fully documented in explicit procedures?',
                options: [
                    { value: 5, label: 'Mostly Tacit' },
                    { value: 4, label: 'Largely Tacit' },
                    { value: 3, label: 'Mixed', checked: true },
                    { value: 2, label: 'Largely Documented' },
                    { value: 1, label: 'Fully Documented' }
                ]
            }
        ]
    },
    {
        title: 'Function And Authority',
        questions: [
            {
                number: 11,
                title: 'Human sign-off and relationship ownership',
                prompt: 'How much does the role depend on trust, stakeholder ownership, negotiation, approval, or a human being accountable for the final call?',
                options: [
                    { value: 5, label: 'Essential' },
                    { value: 4, label: 'Very Important' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 2, label: 'Some Needed' },
                    { value: 1, label: 'Minimal' }
                ]
            },
            {
                number: 12,
                title: 'External trust or on-site dependence',
                prompt: 'How much does the role depend on physical presence, site-specific work, or trust-bearing interaction that cannot be fully abstracted away?',
                options: [
                    { value: 5, label: 'Essential' },
                    { value: 4, label: 'Very Important' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 2, label: 'Some' },
                    { value: 1, label: 'None' }
                ]
            }
        ]
    },
    {
        title: 'Adoption And Embedding',
        questions: [
            {
                number: 13,
                title: 'Organization AI adoption readiness',
                prompt: 'How prepared is your organization to integrate AI into actual workflows, not just experiment with demos?',
                options: [
                    { value: 1, label: 'Resistant' },
                    { value: 2, label: 'Cautious' },
                    { value: 3, label: 'Exploring', checked: true },
                    { value: 4, label: 'Adopting' },
                    { value: 5, label: 'Leading Edge' }
                ]
            },
            {
                number: 14,
                title: 'Pressure to delegate or compress work',
                prompt: 'How strong is the pressure to reduce labor cost, delegate execution, or increase output without adding headcount?',
                options: [
                    { value: 1, label: 'Not Sensitive' },
                    { value: 2, label: 'Somewhat' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 4, label: 'Very Sensitive' },
                    { value: 5, label: 'Extremely Sensitive' }
                ]
            },
            {
                number: 16,
                title: 'Workflow integration readiness',
                prompt: 'How ready is the organization to plug new AI systems into the tools, data, and review loops this work depends on?',
                options: [
                    { value: 1, label: 'Very Outdated' },
                    { value: 2, label: 'Outdated' },
                    { value: 3, label: 'Current', checked: true },
                    { value: 4, label: 'Modern' },
                    { value: 5, label: 'Cutting Edge' }
                ]
            }
        ]
    }
];
const REFINEMENT_MODULE_DESCRIPTIONS = {
    'Exposure And Evidence': 'Use this module when the role depends heavily on machine-readable inputs, clear review trails, or abundant examples.',
    'Role Structure': 'Use this module to describe whether the work stays bundled in a sequence or breaks into separable pieces.',
    'Function And Authority': 'Use this module when sign-off, trust, liability, or relationship ownership still anchor the human role.',
    'Adoption And Embedding': 'Use this module to describe how quickly the organization can actually convert AI capability into workflow change.'
};

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

function safeSetText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    } else {
        console.warn(`Element with ID '${elementId}' not found`);
    }
}

function formatProfileBand(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 'moderate';
    if (numeric >= 0.75) return 'high';
    if (numeric >= 0.4) return 'moderate';
    return 'low';
}

// ─── 4. Questionnaire functions ──────────────────────────────────────────────

function getQuestionValue(questionNum) {
    const checked = document.querySelector(`input[name="q${questionNum}"]:checked`);
    return checked ? parseFloat(checked.value) : 3;
}

function getCurrentQuestionnaireAnswers() {
    const answers = {};
    ACTIVE_REFINEMENT_QUESTIONS.forEach((questionNum) => {
        answers[`Q${questionNum}`] = getQuestionValue(questionNum);
    });
    return answers;
}

function buildStructuredQuestionnaireProfile(answers, seniorityLevel) {
    const presets = window.WWILMJ_PRESETS;
    if (!presets || typeof presets.buildQuestionnaireProfileFromLegacyAnswers !== 'function') {
        return null;
    }
    try {
        return presets.buildQuestionnaireProfileFromLegacyAnswers(answers, seniorityLevel);
    } catch (error) {
        console.warn('[buildStructuredQuestionnaireProfile] Failed to build profile from current answers', error);
        return null;
    }
}

function renderQuestionnaireProfileSummary(profile) {
    const activeProfile = profile || {};
    const functionBand = formatProfileBand(activeProfile.function_centrality);
    const signoffBand = formatProfileBand(activeProfile.human_signoff_requirement);
    const workflowBand = formatProfileBand(activeProfile.workflow_decomposability);
    const adoptionBand = formatProfileBand(activeProfile.organizational_adoption_readiness);
    const pressureBand = formatProfileBand(activeProfile.substitution_risk_modifier);

    let summary = 'Answer the core questions to see how this version of the role is likely to retain function, sign-off, and substitution resistance.';
    if (profile) {
        const functionLead = functionBand === 'high'
            ? 'This answer pattern points to a strong human-retained core.'
            : functionBand === 'moderate'
                ? 'This answer pattern points to a mixed human-plus-AI role shape.'
                : 'This answer pattern points to a more execution-heavy role shape.';
        summary = `${functionLead} Sign-off looks ${signoffBand}, workflow split potential looks ${workflowBand}, adoption readiness looks ${adoptionBand}, and substitution pressure looks ${pressureBand}.`;
    }

    safeSetText('v2-refinement-summary', summary);
    safeSetText('v2-refinement-function', formatV2Label(functionBand));
    safeSetText('v2-refinement-signoff', formatV2Label(signoffBand));
    safeSetText('v2-refinement-workflow', `${formatV2Label(workflowBand)} split`);
    safeSetText('v2-refinement-adoption', formatV2Label(adoptionBand));
    safeSetText('v2-refinement-pressure', formatV2Label(pressureBand));
}

function refreshQuestionnaireProfileSummary() {
    const seniorityLevel = parseFloat(document.getElementById('hierarchy-select')?.value || '1');
    const answers = getCurrentQuestionnaireAnswers();
    const profile = buildStructuredQuestionnaireProfile(answers, seniorityLevel);
    renderQuestionnaireProfileSummary(profile);
    return profile;
}

function buildQuestionOption(questionNumber, option, optionIndex) {
    const radioOption = document.createElement('div');
    radioOption.className = 'radio-option';

    const input = document.createElement('input');
    input.type = 'radio';
    input.id = `q${questionNumber}-${optionIndex + 1}`;
    input.name = `q${questionNumber}`;
    input.value = String(option.value);
    if (option.checked) {
        input.checked = true;
    }

    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = option.label;

    radioOption.appendChild(input);
    radioOption.appendChild(label);
    return radioOption;
}

function buildQuestionNode(question) {
    const questionNode = document.createElement('div');
    questionNode.className = 'question';

    const heading = document.createElement('h5');
    heading.textContent = question.title;

    const prompt = document.createElement('p');
    prompt.textContent = question.prompt;

    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';
    question.options.forEach((option, index) => {
        radioGroup.appendChild(buildQuestionOption(question.number, option, index));
    });

    questionNode.appendChild(heading);
    questionNode.appendChild(prompt);
    questionNode.appendChild(radioGroup);
    return questionNode;
}

function buildAdvancedModuleNode(module) {
    const category = document.createElement('div');
    category.className = 'category';

    const header = document.createElement('div');
    header.className = 'category-header';

    const title = document.createElement('div');
    title.className = 'category-title';
    title.append(document.createTextNode(module.title));

    const count = document.createElement('span');
    count.className = 'category-count';
    count.textContent = `${module.questions.length} question${module.questions.length === 1 ? '' : 's'}`;
    title.appendChild(count);

    const toggle = document.createElement('div');
    toggle.className = 'category-toggle';
    toggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    header.appendChild(title);
    header.appendChild(toggle);

    const content = document.createElement('div');
    content.className = 'category-content';

    const moduleDescription = document.createElement('p');
    moduleDescription.className = 'card-description';
    moduleDescription.style.marginBottom = '14px';
    moduleDescription.textContent = REFINEMENT_MODULE_DESCRIPTIONS[module.title] || '';
    if (moduleDescription.textContent) {
        content.appendChild(moduleDescription);
    }

    const grid = document.createElement('div');
    grid.className = 'question-grid';
    module.questions.forEach((question) => {
        grid.appendChild(buildQuestionNode(question));
    });
    content.appendChild(grid);

    category.appendChild(header);
    category.appendChild(content);
    return category;
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
    refreshQuestionnaireProfileSummary();
}

function resetQuestionsToNeutral() {
    const presets = window.WWILMJ_PRESETS;
    const neutral = presets && presets.NEUTRAL_ANSWERS ? presets.NEUTRAL_ANSWERS : {};
    for (const i of ACTIVE_REFINEMENT_QUESTIONS) {
        const target = neutral[`Q${i}`] ?? 3;
        const radio = document.querySelector(`input[name="q${i}"][value="${target}"]`);
        if (radio) {
            radio.checked = true;
        }
    }
    refreshQuestionnaireProfileSummary();
}

function initializeRefinementLayout() {
    const coreGrid = document.getElementById('v2-core-refinement-grid');
    const advancedDetails = document.getElementById('v2-advanced-refinement');
    const advancedBody = document.getElementById('v2-advanced-refinement-body');
    const advancedHelper = document.getElementById('v2-advanced-helper');

    if (!coreGrid || !advancedDetails || !advancedBody) {
        return;
    }

    coreGrid.innerHTML = '';
    advancedBody.innerHTML = '';

    QUESTIONNAIRE_MODULES.forEach((module) => {
        const coreQuestions = module.questions.filter((question) => CORE_REFINEMENT_QUESTIONS.includes(question.number));
        const advancedQuestions = module.questions.filter((question) => !CORE_REFINEMENT_QUESTIONS.includes(question.number));

        coreQuestions.forEach((question) => {
            coreGrid.appendChild(buildQuestionNode(question));
        });

        if (advancedQuestions.length) {
            advancedBody.appendChild(buildAdvancedModuleNode({
                title: module.title,
                questions: advancedQuestions
            }));
        }
    });

    const advancedQuestionCount = advancedBody.querySelectorAll('.question').length;
    const advancedModuleCount = advancedBody.querySelectorAll('.category').length;
    if (advancedHelper) {
        advancedHelper.textContent = `${advancedQuestionCount} more question${advancedQuestionCount === 1 ? '' : 's'} across ${advancedModuleCount} module${advancedModuleCount === 1 ? '' : 's'}`;
    }
    if (!advancedQuestionCount) {
        advancedDetails.hidden = true;
    }

    refreshQuestionnaireProfileSummary();
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

function truncateV2TaskLabel(label, maxLength = 88) {
    const value = String(label || '').trim();
    if (!value) return 'Unknown task';
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

async function populateV2TaskInputs(occupationId, preserveSelection = true) {
    const selects = V2_TASK_INPUT_CONFIG
        .map((config) => document.getElementById(config.id))
        .filter(Boolean);

    const setEmptyState = (placeholder) => {
        V2_TASK_INPUT_CONFIG.forEach((config) => {
            const select = document.getElementById(config.id);
            if (!select) return;
            select.disabled = true;
            select.innerHTML = `<option value="">${placeholder || 'Select occupation first'}</option>`;
        });
    };

    if (!occupationId) {
        setEmptyState('Select occupation first');
        return [];
    }

    let engine;
    try {
        engine = await getV2Engine();
    } catch (error) {
        console.error('[V2] Failed to load task inventory for direct inputs:', error);
        setEmptyState('Task inventory unavailable');
        return [];
    }

    const tasks = engine.getTaskInventory(occupationId) || [];
    if (!tasks.length) {
        setEmptyState('No task inventory for this role yet');
        return [];
    }

    V2_TASK_INPUT_CONFIG.forEach((config) => {
        const select = document.getElementById(config.id);
        if (!select) return;

        const previousValue = preserveSelection ? (select.value || '') : '';
        select.disabled = false;
        select.innerHTML = '';

        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = config.placeholder;
        select.appendChild(placeholderOption);

        tasks.forEach((task) => {
            const option = document.createElement('option');
            option.value = task.task_id;
            option.textContent = `${truncateV2TaskLabel(task.task_statement)} · ${Math.round((Number(task.time_share_prior) || 0) * 100)}% baseline`;
            option.title = task.task_statement || '';
            option.dataset.family = task.task_family_id || '';
            option.dataset.statement = task.task_statement || '';
            option.dataset.roleCriticality = task.role_criticality || '';
            select.appendChild(option);
        });

        select.value = previousValue && tasks.some((task) => task.task_id === previousValue)
            ? previousValue
            : '';
    });

    syncV2TaskSelectionState();

    return tasks;
}

function syncV2TaskSelectionState() {
    const selects = V2_TASK_INPUT_CONFIG
        .map((config) => document.getElementById(config.id))
        .filter(Boolean);

    const selectedValues = new Map();
    selects.forEach((select) => {
        if (select.value) {
            selectedValues.set(select.id, select.value);
        }
    });

    selects.forEach((select) => {
        const takenElsewhere = new Set(
            Array.from(selectedValues.entries())
                .filter(([id]) => id !== select.id)
                .map(([, value]) => value)
        );

        Array.from(select.options).forEach((option) => {
            option.disabled = !!(option.value && takenElsewhere.has(option.value));
        });
    });
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

function buildRoleFateSignalRows(taskBreakdown, signal) {
    const rows = Array.isArray(taskBreakdown?.tasks) ? taskBreakdown.tasks.slice() : [];
    if (!rows.length) {
        return [];
    }

    const scoredRows = rows.map((task) => {
        let signalShare = 0;
        let secondaryLabel = task?.task_cluster_label || 'Mapped task family';
        let likelyMode = task?.likely_mode || null;

        if (signal === 'current') {
            signalShare = Number(task?.share_of_role) || 0;
            secondaryLabel = `${secondaryLabel} · current role share`;
        } else if (signal === 'bargaining') {
            signalShare = (Number(task?.share_of_role) || 0) * Math.max(
                Number(task?.bargaining_power_weight) || 0,
                Number(task?.value_centrality) || 0
            );
            secondaryLabel = `${secondaryLabel} · bargaining leverage`;
        } else if (signal === 'direct') {
            signalShare = (Number(task?.share_of_role) || 0) * (Number(task?.direct_exposure_pressure) || 0);
            secondaryLabel = `${secondaryLabel} · direct AI pressure`;
            likelyMode = 'pressure';
        } else if (signal === 'indirect') {
            signalShare = (Number(task?.share_of_role) || 0) * (Number(task?.indirect_dependency_pressure) || 0);
            secondaryLabel = `${secondaryLabel} · spillover risk`;
            likelyMode = 'spillover';
        } else if (signal === 'retained') {
            signalShare = (Number(task?.retained_share) || 0) * (Number(task?.retained_leverage) || 0);
            secondaryLabel = `${secondaryLabel} · retained leverage`;
            likelyMode = 'retained';
        }

        if (task?.is_user_selected_critical) {
            secondaryLabel += ' · user-tagged core task';
        } else if (task?.is_user_selected_support_task) {
            secondaryLabel += ' · user-tagged support task';
        } else if (task?.is_user_selected_ai_support) {
            secondaryLabel += ' · user-tagged AI assist';
        }

        return {
            label: task?.task_statement || 'Unknown task',
            full_label: task?.task_statement || 'Unknown task',
            secondary_label: secondaryLabel,
            likely_mode: likelyMode,
            evidence_confidence: Number(task?.evidence_confidence) || 0,
            evidence_badge: task?.has_direct_evidence ? 'Direct evidence' : 'Fallback estimate',
            signal_share: Number(signalShare.toFixed(4)),
            share_of_role: Number(task?.share_of_role) || 0
        };
    });

    return scoredRows
        .filter((task) => task.signal_share >= 0.01)
        .sort((left, right) => {
            if (right.signal_share !== left.signal_share) {
                return right.signal_share - left.signal_share;
            }
            return right.share_of_role - left.share_of_role;
        })
        .slice(0, 5);
}

function buildRoleFateMap(taskBreakdown) {
    return {
        current_role: buildRoleFateSignalRows(taskBreakdown, 'current'),
        bargaining_power: buildRoleFateSignalRows(taskBreakdown, 'bargaining'),
        direct_pressure: buildRoleFateSignalRows(taskBreakdown, 'direct'),
        indirect_spillover: buildRoleFateSignalRows(taskBreakdown, 'indirect'),
        retained_leverage: buildRoleFateSignalRows(taskBreakdown, 'retained')
    };
}

function renderV2EvidenceSummary(summary) {
    const directRows = Number(summary?.source_coverage?.direct_task_evidence_rows) || 0;
    const fallbackRows = Number(summary?.source_coverage?.fallback_task_rows) || 0;
    const totalRows = directRows + fallbackRows;
    const coverageNote = totalRows
        ? `${Math.round((directRows / totalRows) * 100)}% of the mapped task rows use direct Anthropic task evidence; the remaining ${fallbackRows} rows fall back to task-family estimates.`
        : 'Task-row coverage appears once a mapped occupation is loaded.';
    const questionnaireProfile = summary?.questionnaire_profile;
    const profileSource = summary?.questionnaire_profile_source === 'structured_profile'
        ? 'Structured role-refinement profile'
        : 'Role-refinement answers';
    const profileNote = questionnaireProfile
        ? `${profileSource}: function retention ${formatProfileBand(questionnaireProfile.function_centrality)}, sign-off ${formatProfileBand(questionnaireProfile.human_signoff_requirement)}, adoption readiness ${formatProfileBand(questionnaireProfile.organizational_adoption_readiness)}, augmentation fit ${formatProfileBand(questionnaireProfile.augmentation_fit)}, and substitution pressure ${formatProfileBand(questionnaireProfile.substitution_risk_modifier)}.`
        : '';
    const frictionNote = summary
        ? 'The model now scores task-family friction explicitly through exception burden, accountability load, judgment requirement, document intensity, and tacit/context dependence.'
        : '';

    safeSetText('v2-task-confidence', summary ? formatLabeledMetric(summary.task_evidence_confidence) : '-');
    safeSetText('v2-prior-confidence', summary ? formatLabeledMetric(summary.personalization_confidence) : '-');
    safeSetText(
        'v2-evidence-notes',
        summary
            ? `Evidence strength is the average source strength across the role-specific task families used in this result after sparse task rows are shrunk toward broader priors. ${coverageNote} ${frictionNote} ${profileNote} Personalization signal strength combines retained-function protection, substitution pressure, and evidence strength.`
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
        parts.push(`Task coverage means ${directCoveragePct}% of the ${totalCount} mapped role tasks have direct Anthropic task evidence; the remaining ${fallbackCount} rows use task-family fallback estimates.`);
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
    meta.appendChild(createV2TaskChip(`${Math.round((Number(task?.direct_exposure_pressure) || 0) * 100)}% direct pressure`, 'warning'));
    meta.appendChild(createV2TaskChip(`${Math.round((Number(task?.indirect_dependency_pressure) || 0) * 100)}% spillover`, 'accent'));
    meta.appendChild(createV2TaskChip(`${Math.round((Number(task?.retained_leverage) || 0) * 100)}% retained leverage`, 'success'));
    meta.appendChild(createV2TaskChip(`${Math.round((Number(task?.evidence_confidence) || 0) * 100)}% confidence`));
    meta.appendChild(createV2TaskChip(task?.has_direct_evidence ? 'Direct task evidence' : 'Cluster fallback'));

    if (task?.is_role_critical) {
        meta.appendChild(createV2TaskChip('Role-defining task', 'accent'));
    }
    if (task?.is_user_selected_dominant) {
        meta.appendChild(createV2TaskChip('Selected current task'));
    }
    if (task?.is_user_selected_critical) {
        meta.appendChild(createV2TaskChip('Selected bargaining-power task', 'accent'));
    }
    if (task?.is_user_selected_ai_support) {
        meta.appendChild(createV2TaskChip('Selected AI-assisted task', 'success'));
    }
    if (task?.is_user_selected_support_task) {
        meta.appendChild(createV2TaskChip('Selected spillover task', 'warning'));
    }

    const footnote = document.createElement('div');
    footnote.className = 'v2-task-footnote';
    footnote.textContent = `${Math.round((Number(task?.exposed_share) || 0) * 100)}% exposed share, ${Math.round((Number(task?.retained_share) || 0) * 100)}% retained after transformation, and ${Math.round((Number(task?.indirect_dependency_pressure) || 0) * 100)}% spillover pressure from linked work. ${task?.mapping_method ? `Mapped via ${String(task.mapping_method).replace(/_/g, ' ')}.` : ''}`;

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
            ? `${assignment.selected_occupation_title} currently resolves to ${taskBreakdown.total_tasks_considered || 0} mapped role tasks. This list live-updates as your selected occupation, task picks, and role-refinement answers change role share, direct pressure, spillover pressure, and retained leverage inside that occupation anchor. Use “Show model details” if you want the evidence and fallback notes.`
            : 'Choose a mapped occupation to load its task inventory and the blended role-fate view.'
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
    const getSelectState = (id) => {
        const select = document.getElementById(id);
        const option = select?.selectedOptions?.[0];
        return {
            taskId: select?.value || '',
            familyId: option?.dataset?.family || ''
        };
    };

    const primary = getSelectState('v2-task-primary');
    const secondary = getSelectState('v2-task-secondary');
    const critical = getSelectState('v2-task-critical');
    const supported = getSelectState('v2-task-supported');
    const spillover = getSelectState('v2-task-spillover');

    const dominantTaskIds = Array.from(new Set([primary.taskId, secondary.taskId].filter(Boolean)));
    const roleCriticalTaskIds = critical.taskId ? [critical.taskId] : [];
    const aiSupportTaskIds = supported.taskId ? [supported.taskId] : [];
    const supportTaskIds = spillover.taskId ? [spillover.taskId] : [];
    const dominantTaskClusters = Array.from(new Set([primary.familyId, secondary.familyId, spillover.familyId].filter(Boolean)));
    const roleCriticalClusters = Array.from(new Set([critical.familyId].filter(Boolean)));

    return {
        dominantTaskIds: dominantTaskIds,
        roleCriticalTaskIds: roleCriticalTaskIds,
        aiSupportTaskIds: aiSupportTaskIds,
        supportTaskIds: supportTaskIds,
        dominantTaskClusters: dominantTaskClusters,
        roleCriticalClusters: roleCriticalClusters
    };
}

function resetV2Results(message, detail) {
    v2TaskBreakdownExpanded = false;
    safeSetText('v2-role-state-label', message || 'Select a role to begin');
    safeSetText('v2-role-summary', detail || 'Choose a category, select the closest occupation, and optionally refine the result with task-mix or role-structure detail.');
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
    safeSetText('v2-map-subtitle', "This map starts from the current task mix, then shows which tasks hold bargaining power, face direct AI pressure, lose value through spillover, or remain central to the retained role.");
    safeSetText('v2-task-note', 'This view reorders the selected occupation\'s task inventory as your task picks and role-refinement answers change role share, pressure, spillover, and retained leverage.');
    safeSetText('v2-recomposition-conversion', '-');
    ['current', 'next', 'distant'].forEach(function (w) {
        safeSetText('v2-wave-' + w + '-state', '-');
        safeSetText('v2-wave-' + w + '-retained', '-');
        safeSetText('v2-wave-' + w + '-coherence', '-');
    });
    renderV2LaborMarketContext(null, '');
    renderV2OccupationAssignment(null);
    renderV2ClusterList('v2-current-bundle', [], { emptyText: 'Choose a mapped occupation to populate the current bundle.' });
    renderV2ClusterList('v2-bargaining-bundle', [], { emptyText: 'Bargaining-power tasks appear once the role view is active.' });
    renderV2ClusterList('v2-direct-bundle', [], { emptyText: 'Direct pressure appears once the role view is active.' });
    renderV2ClusterList('v2-indirect-bundle', [], { emptyText: 'Spillover tasks appear once the role view is active.' });
    renderV2ClusterList('v2-residual-bundle', [], { emptyText: 'Retained-leverage tasks appear once the role view is active.' });
    renderV2TaskBreakdown(null, null);
    lastV2Result = null;
}

async function updateV2Results(options = {}) {
    const preserveSelection = options.preserveSelection !== false;
    const roleCategory = selectedRole;

    if (!roleCategory) {
        resetV2Results('Select a category to begin', 'Choose a category, select the closest occupation, and optionally refine the result with task-mix or role-structure detail.');
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

    const answers = getCurrentQuestionnaireAnswers();
    const seniorityLevel = parseFloat(document.getElementById('hierarchy-select')?.value || '1');
    const questionnaireProfile = buildStructuredQuestionnaireProfile(answers, seniorityLevel);
    const directInputs = getDirectV2Inputs();

    let result;
    try {
        const computeOptions = {
            roleCategory: roleCategory,
            occupationId: selectedOccupationId,
            answers: answers,
            seniorityLevel: seniorityLevel,
            dominantTaskIds: directInputs.dominantTaskIds,
            criticalTaskIds: directInputs.roleCriticalTaskIds,
            aiSupportTaskIds: directInputs.aiSupportTaskIds,
            supportTaskIds: directInputs.supportTaskIds,
            dominantTaskClusters: directInputs.dominantTaskClusters,
            roleCriticalClusters: directInputs.roleCriticalClusters
        };
        if (questionnaireProfile) {
            computeOptions.questionnaireProfile = questionnaireProfile;
        }
        result = engine.computeResult(computeOptions);
    } catch (error) {
        console.error('[V2] Failed to compute result:', error);
        resetV2Results('V2 result unavailable', 'The transformation engine could not resolve a result for this role yet.');
        return null;
    }

    lastV2Result = result;

    const roleFateMap = buildRoleFateMap(result.task_breakdown);
    const topDirectTask = roleFateMap.direct_pressure[0] || null;
    const topExposedLabel = topDirectTask?.label
        ? topDirectTask.label
        : (result.top_exposed_work?.label ? `${result.top_exposed_work.label} · ${result.top_exposed_work.wave_assignment} wave` : '-');

    const wt = result.wave_trajectory || {};
    const waveHeadline = `Primary displacement: ${result.primary_displacement_wave} wave`;

    safeSetText('v2-role-state-label', `${result.selected_occupation_title} · ${result.role_fate_label || result.role_outlook_label}`);
    const roleSummaryCopy = result.role_summary
        ? `${result.role_summary} Confidence: ${Math.round((Number(result.role_fate_confidence) || 0) * 100)}%.`
        : 'The role-fate model ranks current work, pressure, spillover, and retained leverage across current, next, and distant waves.';
    safeSetText('v2-role-summary', roleSummaryCopy);
    safeSetText('v2-outlook-summary-copy', roleSummaryCopy);
    safeSetText('v2-role-state-card', result.role_fate_label || result.role_outlook_label || '-');
    safeSetText('v2-score-role-outlook', result.role_fate_label || result.role_outlook_label || '-');
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
        safeSetText('v2-wave-' + waveName + '-coherence', formatV2Label(ws.coherence_tier) + ' retained integrity');
    });
    safeSetText('v2-what-changing', result.narrative_summary?.why_this_role_changes || '-');
    safeSetText('v2-what-absorbed', result.narrative_summary?.what_is_under_pressure || '-');
    safeSetText('v2-what-remains', result.narrative_summary?.what_stays_core || '-');
    safeSetText('v2-who-benefits', result.narrative_summary?.personalization_fit_summary || '-');
    renderV2EvidenceSummary(result.evidence_summary);
    safeSetText(
        'v2-map-subtitle',
        `${result.selected_occupation_title}: current work comes first, then bargaining-power tasks, direct pressure, spillover, and retained leverage. After the next wave, ${Math.round((wt.next?.retained_share || 0) * 100)}% is retained with ${wt.next?.coherence_tier || '-'} retained integrity.`
    );
    safeSetText(
        'v2-task-note',
        `${result.selected_occupation_title} uses its mapped task inventory as the baseline. Each task updates live as your task picks and role-refinement answers change role share, direct pressure, spillover risk, and retained leverage.`
    );
    renderV2RecompositionSummary(result.recomposition_summary);
    renderV2OccupationAssignment(result.occupation_assignment);
    renderV2LaborMarketContext(result.labor_market_context, result.selected_occupation_title);
    renderV2ClusterList('v2-current-bundle', roleFateMap.current_role, {
        shareKey: 'signal_share',
        emptyText: 'No current task bundle available.'
    });
    renderV2ClusterList('v2-bargaining-bundle', roleFateMap.bargaining_power, {
        shareKey: 'signal_share',
        emptyText: 'No bargaining-power tasks exceeded the display threshold.'
    });
    renderV2ClusterList('v2-direct-bundle', roleFateMap.direct_pressure, {
        shareKey: 'signal_share',
        emptyText: 'No direct-pressure tasks exceeded the display threshold.'
    });
    renderV2ClusterList('v2-indirect-bundle', roleFateMap.indirect_spillover, {
        shareKey: 'signal_share',
        emptyText: 'No spillover tasks exceeded the display threshold.'
    });
    renderV2ClusterList('v2-residual-bundle', roleFateMap.retained_leverage, {
        shareKey: 'signal_share',
        emptyText: 'No retained-leverage tasks exceeded the display threshold.'
    });
    renderV2TaskBreakdown(result.task_breakdown, result.occupation_assignment);

    return result;
}

// ─── 9. Simplified analyzeRole ──────────────────────────────────────────────

function analyzeRole() {
    refreshQuestionnaireProfileSummary();
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

document.addEventListener('change', function(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
        return;
    }
    if (target.type !== 'radio') {
        return;
    }
    if (!/^q\d+$/.test(target.name || '')) {
        return;
    }
    analyzeRole();
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
        populateV2TaskInputs(selectedOccupationId, true)
            .then(() => updateV2Results({ preserveSelection: true }))
            .catch(error => {
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
        populateV2TaskInputs(selectedOccupationId, true)
            .then(() => updateV2Results({ preserveSelection: true }))
            .catch(error => {
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
        populateV2TaskInputs(selectedOccupationId, false)
            .then(() => analyzeRole())
            .catch((error) => {
                console.error('[V2] Failed to update task inputs from search selection:', error);
            });
    });

    // v2 direct inputs change handler
    v2DirectInputs.forEach((input) => {
        input.addEventListener('change', () => {
            if (!selectedRole) return;
            syncV2TaskSelectionState();
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

        try {
            await populateV2TaskInputs(selectedOccupationId, false);
        } catch (error) {
            console.error('[V2] Failed to populate task inputs from category change:', error);
        }

        syncSearchInputWithOccupation(selectedOccupationId);

        if (!roleValue) {
            resetV2Results('Select a category to begin', 'Choose a category, select the closest occupation, and complete the role refinement to generate the transformation briefing.');
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
    populateV2TaskInputs(selectedOccupationId, false).catch((error) => {
        console.error('[V2] Failed to initialize task inputs:', error);
    });

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
