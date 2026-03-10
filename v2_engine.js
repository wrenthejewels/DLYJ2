(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.DLYJV2 = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    var DATA_FILES = {
        occupations: 'data/normalized/occupations.csv',
        selector: 'data/normalized/occupation_selector_index.csv',
        occupationTaskClusters: 'data/normalized/occupation_task_clusters.csv',
        occupationTasks: 'data/normalized/occupation_tasks.csv',
        taskMembership: 'data/normalized/task_cluster_membership.csv',
        taskEvidence: 'data/normalized/task_exposure_evidence.csv',
        taskPriors: 'data/normalized/task_augmentation_automation_priors.csv',
        occupationPriors: 'data/normalized/occupation_exposure_priors.csv',
        adaptationPriors: 'data/normalized/occupation_adaptation_priors.csv',
        laborContext: 'data/normalized/occupation_labor_market_context.csv',
        unemploymentMonthly: 'data/normalized/occupation_unemployment_monthly.csv',
        uiRoleMap: 'data/metadata/ui_role_category_map.csv'
    };

    var ROLE_STATE_LABELS = {
        mostly_augmented: 'Mostly augmented',
        routine_tasks_absorbed: 'Routine work compressed',
        role_becomes_more_senior: 'Role becomes more senior',
        role_narrows_but_remains_viable: 'Role becomes narrower',
        role_fragments: 'Role fragments',
        high_displacement_risk: 'High displacement risk'
    };

    var ELEVATION_CLUSTERS = {
        cluster_coordination: true,
        cluster_qa_review: true,
        cluster_decision_support: true,
        cluster_oversight_strategy: true,
        cluster_relationship_management: true,
        cluster_client_interaction: true
    };

    var HUMAN_ADVANTAGE_CLUSTERS = {
        cluster_client_interaction: 1.0,
        cluster_relationship_management: 1.0,
        cluster_oversight_strategy: 0.85,
        cluster_coordination: 0.65,
        cluster_decision_support: 0.55,
        cluster_qa_review: 0.45,
        cluster_research_synthesis: 0.35,
        cluster_analysis: 0.30,
        cluster_documentation: 0.20,
        cluster_drafting: 0.15,
        cluster_workflow_admin: 0.12,
        cluster_execution_routine: 0.05
    };

    var CLUSTER_FRICTION_PROFILES = {
        cluster_drafting: { exception_burden: 0.25, accountability_load: 0.35, judgment_requirement: 0.30, document_intensity: 1.00, tacit_context_dependence: 0.20 },
        cluster_analysis: { exception_burden: 0.45, accountability_load: 0.55, judgment_requirement: 0.55, document_intensity: 0.80, tacit_context_dependence: 0.35 },
        cluster_research_synthesis: { exception_burden: 0.60, accountability_load: 0.45, judgment_requirement: 0.55, document_intensity: 0.75, tacit_context_dependence: 0.40 },
        cluster_coordination: { exception_burden: 0.75, accountability_load: 0.55, judgment_requirement: 0.65, document_intensity: 0.35, tacit_context_dependence: 0.80 },
        cluster_client_interaction: { exception_burden: 0.70, accountability_load: 0.65, judgment_requirement: 0.85, document_intensity: 0.25, tacit_context_dependence: 0.85 },
        cluster_qa_review: { exception_burden: 0.40, accountability_load: 0.80, judgment_requirement: 0.55, document_intensity: 0.55, tacit_context_dependence: 0.35 },
        cluster_decision_support: { exception_burden: 0.65, accountability_load: 0.85, judgment_requirement: 0.80, document_intensity: 0.55, tacit_context_dependence: 0.60 },
        cluster_execution_routine: { exception_burden: 0.15, accountability_load: 0.35, judgment_requirement: 0.15, document_intensity: 0.35, tacit_context_dependence: 0.15 },
        cluster_oversight_strategy: { exception_burden: 0.70, accountability_load: 0.85, judgment_requirement: 0.90, document_intensity: 0.45, tacit_context_dependence: 0.80 },
        cluster_relationship_management: { exception_burden: 0.65, accountability_load: 0.55, judgment_requirement: 0.90, document_intensity: 0.20, tacit_context_dependence: 0.90 },
        cluster_documentation: { exception_burden: 0.12, accountability_load: 0.35, judgment_requirement: 0.18, document_intensity: 0.95, tacit_context_dependence: 0.10 },
        cluster_workflow_admin: { exception_burden: 0.20, accountability_load: 0.35, judgment_requirement: 0.18, document_intensity: 0.55, tacit_context_dependence: 0.12 }
    };

    var CLUSTER_DEPENDENCY_MATRIX = {
        cluster_drafting: { cluster_qa_review: 0.18, cluster_decision_support: 0.14, cluster_coordination: 0.10, cluster_client_interaction: 0.08 },
        cluster_analysis: { cluster_qa_review: 0.16, cluster_decision_support: 0.12, cluster_documentation: 0.06 },
        cluster_research_synthesis: { cluster_analysis: 0.12, cluster_decision_support: 0.12, cluster_qa_review: 0.10 },
        cluster_execution_routine: { cluster_workflow_admin: 0.12, cluster_qa_review: 0.08 },
        cluster_documentation: { cluster_qa_review: 0.08, cluster_coordination: 0.06 },
        cluster_workflow_admin: { cluster_coordination: 0.12, cluster_client_interaction: 0.08 },
        cluster_decision_support: { cluster_oversight_strategy: 0.12, cluster_client_interaction: 0.08 },
        cluster_coordination: { cluster_client_interaction: 0.12, cluster_relationship_management: 0.10, cluster_oversight_strategy: 0.12 },
        cluster_client_interaction: { cluster_relationship_management: 0.10, cluster_decision_support: 0.08 },
        cluster_oversight_strategy: { cluster_decision_support: 0.10, cluster_coordination: 0.10 }
    };

    var WAVE_THRESHOLDS = { current_max: 0.35, next_max: 0.65 };

    var FRICTION_WEIGHTS = {
        accountability_load: 0.25,
        judgment_requirement: 0.22,
        tacit_context_dependence: 0.22,
        exception_burden: 0.18,
        inverse_document_intensity: 0.13
    };

    var AUTOMATION_DIFFICULTY_WEIGHTS = {
        intrinsicFriction: 0.40,
        humanAdvantage: 0.25,
        empiricalResistance: 0.25,
        couplingProtection: 0.10
    };

    var COHERENCE_BONUSES = {
        clusterCountThreshold: 3,
        clusterCountBonus: 0.10,
        retainedShareThreshold: 0.45,
        retainedShareBonus: 0.10
    };

    var WAVE_STATE_LABELS = {
        stable: 'Stable',
        narrowed: 'Narrowed',
        transformed: 'Transformed',
        displaced: 'Displaced'
    };

    var SCORING_CONFIG = {
        criticalityBoost: 0.08,
        adoptionRealizationBase: 0.92,
        adoptionRealizationScale: 0.16,
        dependencyPenaltyScale: 1.10,
        recompositionCouplingPenalty: 0.20
    };

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function average(values) {
        var filtered = values.filter(function (value) {
            return typeof value === 'number' && !isNaN(value);
        });

        if (!filtered.length) {
            return 0;
        }

        return filtered.reduce(function (sum, value) {
            return sum + value;
        }, 0) / filtered.length;
    }

    function sum(values) {
        return values.reduce(function (total, value) {
            return total + value;
        }, 0);
    }

    function weightedAverage(rows, valueSelector, weightSelector) {
        var weightedTotal = 0;
        var totalWeight = 0;

        rows.forEach(function (row) {
            var value = typeof valueSelector === 'function' ? valueSelector(row) : row[valueSelector];
            var weight = typeof weightSelector === 'function' ? weightSelector(row) : row[weightSelector];
            var normalizedValue = toNumber(value, null);
            var normalizedWeight = toNumber(weight, 0);

            if (normalizedValue === null || !isFinite(normalizedValue) || !normalizedWeight) {
                return;
            }

            weightedTotal += normalizedValue * normalizedWeight;
            totalWeight += normalizedWeight;
        });

        return totalWeight ? (weightedTotal / totalWeight) : 0;
    }

    function shrinkTowardPrior(observedValue, priorValue, reliability, fallback) {
        var observed = toNumber(observedValue, fallback);
        var prior = toNumber(priorValue, fallback);
        var lambda = clamp(toNumber(reliability, 0), 0, 1);
        return (lambda * observed) + ((1 - lambda) * prior);
    }

    function parseNoteMetric(noteText, metricKey) {
        var notes = String(noteText || '');
        var pattern = new RegExp('(?:^|\\|)' + metricKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^|]+)');
        var match = notes.match(pattern);
        return match ? toNumber(match[1], null) : null;
    }

    function estimatePriorReliability(prior) {
        var confidence = toNumber(prior && prior.evidence_confidence, 0.4);
        var sources = parsePipeList(prior && prior.primary_sources);
        var hasStub = sources.indexOf('src_internal_stub_2026_03') !== -1;
        var hasAnthropic = sources.indexOf('src_anthropic_ei_2026_01_15') !== -1 || sources.indexOf('src_anthropic_ei_2025_03_27') !== -1;
        var sourcePenalty = hasStub ? (hasAnthropic ? 0.78 : 0.55) : 1.0;
        return clamp(confidence * sourcePenalty, 0.05, 0.98);
    }

    function estimateTaskEvidenceReliability(evidence) {
        if (!evidence || !evidence.source_id || String(evidence.source_id).indexOf('src_internal_stub') === 0) {
            return 0;
        }

        var confidence = toNumber(evidence.confidence, 0.55);
        var taskCount = parseNoteMetric(evidence.notes, 'task_count');
        var countWeight = taskCount !== null ? (taskCount / (taskCount + 40)) : 0.35;
        return clamp(confidence * countWeight, 0.05, 0.98);
    }

    function deriveClusterFriction(signals, clusterId) {
        var profile = CLUSTER_FRICTION_PROFILES[clusterId] || {
            exception_burden: 0.40,
            accountability_load: 0.40,
            judgment_requirement: 0.40,
            document_intensity: 0.40,
            tacit_context_dependence: 0.40
        };
        var user = signals.frictionDimensions || {};
        var w = 0.30;

        return {
            exception_burden: clamp(profile.exception_burden + (toNumber(user.exception_burden, 0.5) - 0.5) * w, 0, 1),
            accountability_load: clamp(profile.accountability_load + (toNumber(user.accountability_load, 0.5) - 0.5) * w, 0, 1),
            judgment_requirement: clamp(profile.judgment_requirement + (toNumber(user.judgment_requirement, 0.5) - 0.5) * w, 0, 1),
            document_intensity: clamp(profile.document_intensity + (toNumber(user.document_intensity, 0.5) - 0.5) * w, 0, 1),
            tacit_context_dependence: clamp(profile.tacit_context_dependence + (toNumber(user.tacit_context_dependence, 0.5) - 0.5) * w, 0, 1)
        };
    }

    function summarizeBundleFriction(bundleRows) {
        return {
            exception_burden: weightedAverage(bundleRows, function (row) {
                return row.friction_dimensions && row.friction_dimensions.exception_burden;
            }, 'share_of_role'),
            accountability_load: weightedAverage(bundleRows, function (row) {
                return row.friction_dimensions && row.friction_dimensions.accountability_load;
            }, 'share_of_role'),
            judgment_requirement: weightedAverage(bundleRows, function (row) {
                return row.friction_dimensions && row.friction_dimensions.judgment_requirement;
            }, 'share_of_role'),
            document_intensity: weightedAverage(bundleRows, function (row) {
                return row.friction_dimensions && row.friction_dimensions.document_intensity;
            }, 'share_of_role'),
            tacit_context_dependence: weightedAverage(bundleRows, function (row) {
                return row.friction_dimensions && row.friction_dimensions.tacit_context_dependence;
            }, 'share_of_role')
        };
    }

    function computeDependencyPenalty(bundleRows) {
        var rowsById = {};
        var bindings = [];
        var rawPenalty = 0;

        bundleRows.forEach(function (row) {
            rowsById[row.task_cluster_id] = row;
        });

        Object.keys(CLUSTER_DEPENDENCY_MATRIX).forEach(function (sourceId) {
            var source = rowsById[sourceId];
            if (!source) {
                return;
            }

            Object.keys(CLUSTER_DEPENDENCY_MATRIX[sourceId]).forEach(function (targetId) {
                var target = rowsById[targetId];
                if (!target) {
                    return;
                }

                var dependencyWeight = CLUSTER_DEPENDENCY_MATRIX[sourceId][targetId];
                var sourceResidual = 1 - clamp(toNumber(source.absorption_rate, 0), 0, 1);
                var targetResidual = 1 - clamp(toNumber(target.absorption_rate, 0), 0, 1);
                var pairPenalty = dependencyWeight * Math.min(toNumber(source.share_of_role, 0), toNumber(target.share_of_role, 0)) * sourceResidual * targetResidual;

                rawPenalty += pairPenalty;
                bindings.push({
                    source_cluster_id: sourceId,
                    source_label: source.label,
                    target_cluster_id: targetId,
                    target_label: target.label,
                    penalty: Number(pairPenalty.toFixed(4))
                });
            });
        });

        bindings.sort(function (left, right) {
            return right.penalty - left.penalty;
        });

        return {
            penalty: rawPenalty * SCORING_CONFIG.dependencyPenaltyScale,
            bindings: bindings.slice(0, 3)
        };
    }

    function buildMetricBand(value, halfWidth) {
        var center = clamp(toNumber(value, 0), 0, 1);
        var width = clamp(toNumber(halfWidth, 0.12), 0.04, 0.30);
        return {
            low: Number(clamp(center - width, 0, 1).toFixed(3)),
            high: Number(clamp(center + width, 0, 1).toFixed(3))
        };
    }

    function confidenceLabel(score) {
        if (score >= 0.70) {
            return 'High';
        }
        if (score >= 0.45) {
            return 'Medium';
        }
        return 'Low';
    }

    function buildRecompositionSummary(metrics, context) {
        var workflowCompression = clamp(toNumber(metrics.workflow_compression, 0), 0, 1);
        var organizationalConversion = clamp(toNumber(metrics.organizational_conversion, 0), 0, 1);
        var substitutionPotential = clamp(toNumber(metrics.substitution_potential, 0), 0, 1);
        var substitutionGap = clamp(toNumber(metrics.substitution_gap, 0), 0, 1);
        var summaryLabel = 'Mixed recomposition pressure';
        var summaryNote = 'The current bundle shows meaningful technical compression, but the role still carries enough coordination, augmentation, or retained-value work that not all exposed work cleanly converts into fewer labor hours.';
        var confidenceScore = context ? clamp(toNumber(context.confidence_score, 0.5), 0, 1) : 0.5;
        var confidenceBandWidth = context ? clamp(toNumber(context.band_half_width, 0.12), 0.04, 0.30) : 0.12;
        var dependencies = context && Array.isArray(context.binding_dependencies) ? context.binding_dependencies : [];
        var dependencyNote = dependencies.length
            ? (' The tightest remaining workflow bottlenecks are ' + dependencies.map(function (binding) {
                return binding.source_label + ' -> ' + binding.target_label;
            }).join(', ') + '.')
            : '';
        var confidenceNote = ' Current confidence is ' + confidenceLabel(confidenceScore).toLowerCase() + '; the displayed ranges widen when direct task coverage is thin or the occupation anchor is weak.';

        if (workflowCompression < 0.24) {
            summaryLabel = 'Limited recomposition pressure';
            summaryNote = 'Some tasks are exposed, but the current bundle does not compress enough to imply large workflow savings or immediate organizational substitution.';
        } else if (organizationalConversion >= 0.58 && substitutionPotential >= 0.22) {
            summaryLabel = 'Compression more likely to convert into substitution';
            summaryNote = 'The current adoption and workflow signals make it more plausible that technical compression converts into fewer labor hours instead of remaining inside a redesigned role.';
        } else if (substitutionGap >= 0.12) {
            summaryLabel = 'Exposure more likely to reorganize than remove work';
            summaryNote = 'A meaningful share of exposed work still looks more likely to be absorbed, redistributed, or redesigned inside the role than converted directly into labor reduction.';
        }

        return {
            workflow_compression: Number(workflowCompression.toFixed(3)),
            organizational_conversion: Number(organizationalConversion.toFixed(3)),
            substitution_potential: Number(substitutionPotential.toFixed(3)),
            substitution_gap: Number(substitutionGap.toFixed(3)),
            workflow_compression_band: buildMetricBand(workflowCompression, confidenceBandWidth),
            organizational_conversion_band: buildMetricBand(organizationalConversion, confidenceBandWidth * 0.9),
            substitution_potential_band: buildMetricBand(substitutionPotential, confidenceBandWidth * 0.85),
            substitution_gap_band: buildMetricBand(substitutionGap, confidenceBandWidth * 0.9),
            confidence_score: Number(confidenceScore.toFixed(3)),
            confidence_label: confidenceLabel(confidenceScore),
            dependency_penalty: Number((context ? toNumber(context.dependency_penalty, 0) : 0).toFixed(3)),
            binding_dependencies: dependencies,
            summary_label: summaryLabel,
            summary_note: summaryNote + dependencyNote + confidenceNote
        };
    }

    function normalizeAnswer(rawValue) {
        var value = Number(rawValue);
        if (!isFinite(value)) {
            return 0.5;
        }
        return clamp((value - 1) / 4, 0, 1);
    }

    function toNumber(rawValue, fallback) {
        if (fallback === undefined) {
            fallback = 0;
        }

        if (rawValue === null || rawValue === undefined || rawValue === '') {
            return fallback;
        }

        var normalized = String(rawValue).replace(/[%,$]/g, '').trim();
        if (!normalized.length) {
            return fallback;
        }

        var value = Number(normalized);
        return isFinite(value) ? value : fallback;
    }

    function parsePipeList(rawValue) {
        if (!rawValue) {
            return [];
        }

        return String(rawValue)
            .split('|')
            .map(function (entry) { return entry.trim(); })
            .filter(Boolean);
    }

    function slugToLabel(taskClusterId) {
        return String(taskClusterId || '')
            .replace(/^cluster_/, '')
            .split('_')
            .map(function (part) {
                return part ? part.charAt(0).toUpperCase() + part.slice(1) : part;
            })
            .join(' ');
    }

    function taskKey(occupationId, onetTaskId) {
        return String(occupationId || '') + '|' + String(onetTaskId || '');
    }

    function parseCsv(text) {
        var rows = [];
        var row = [];
        var field = '';
        var inQuotes = false;
        var i;

        text = String(text || '').replace(/^\uFEFF/, '');

        for (i = 0; i < text.length; i += 1) {
            var char = text[i];
            var next = text[i + 1];

            if (char === '"') {
                if (inQuotes && next === '"') {
                    field += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }

            if (char === ',' && !inQuotes) {
                row.push(field);
                field = '';
                continue;
            }

            if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && next === '\n') {
                    i += 1;
                }
                row.push(field);
                field = '';
                if (row.length > 1 || row[0] !== '') {
                    rows.push(row);
                }
                row = [];
                continue;
            }

            field += char;
        }

        if (field.length || row.length) {
            row.push(field);
            rows.push(row);
        }

        if (!rows.length) {
            return [];
        }

        var headers = rows[0];
        return rows.slice(1).map(function (values) {
            var output = {};
            headers.forEach(function (header, index) {
                output[header] = values[index] !== undefined ? values[index] : '';
            });
            return output;
        });
    }

    async function loadText(path) {
        var isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

        if (!isBrowser && typeof require === 'function') {
            var fs = require('fs');
            return fs.promises.readFile(path, 'utf8');
        }

        if (typeof fetch === 'function') {
            var response = await fetch(path);
            if (!response.ok) {
                throw new Error('Failed to load ' + path + ' (' + response.status + ')');
            }
            return response.text();
        }

        throw new Error('No available file-loading mechanism for ' + path);
    }

    async function loadCsv(path) {
        return parseCsv(await loadText(path));
    }

    function normalizePath(basePath, relativePath) {
        if (!basePath) {
            return relativePath;
        }

        return String(basePath).replace(/[\\\/]+$/, '') + '/' + relativePath;
    }

    function indexBy(rows, key) {
        return rows.reduce(function (map, row) {
            map[row[key]] = row;
            return map;
        }, {});
    }

    function groupBy(rows, key) {
        return rows.reduce(function (map, row) {
            if (!map[row[key]]) {
                map[row[key]] = [];
            }
            map[row[key]].push(row);
            return map;
        }, {});
    }

    function groupRoleMap(rows) {
        return rows.reduce(function (map, row) {
            if (!map[row.ui_role_key]) {
                map[row.ui_role_key] = [];
            }
            map[row.ui_role_key].push(row);
            return map;
        }, {});
    }

    function pickOccupationPrior(rows) {
        if (!rows || !rows.length) {
            return null;
        }

        return rows.slice().sort(function (left, right) {
            return toNumber(right.confidence, 0) - toNumber(left.confidence, 0);
        })[0];
    }

    function normalizeTaskWeights(taskClusters, overrides) {
        var totalOverride = 0;
        var weights = {};
        var priorConfidence = average(taskClusters.map(function (cluster) {
            return toNumber(cluster.evidence_confidence, 0.4);
        }));
        var priorConcentration = 0.75 + (priorConfidence * 1.5);

        taskClusters.forEach(function (cluster) {
            var overrideValue = overrides && overrides[cluster.task_cluster_id] !== undefined
                ? toNumber(overrides[cluster.task_cluster_id], 0)
                : 0;
            weights[cluster.task_cluster_id] = Math.max(0, overrideValue);
            totalOverride += weights[cluster.task_cluster_id];
        });

        if (priorConcentration + totalOverride <= 0) {
            return taskClusters.map(function (cluster) {
                return {
                    task_cluster_id: cluster.task_cluster_id,
                    share_prior: 1 / Math.max(taskClusters.length, 1),
                    importance_prior: toNumber(cluster.importance_prior, 0.5),
                    evidence_confidence: toNumber(cluster.evidence_confidence, 0.4),
                    bundle_prior_concentration: priorConcentration,
                    source_mix: cluster.source_mix || '',
                    notes: cluster.notes || ''
                };
            });
        }

        return taskClusters.map(function (cluster) {
            var baseShare = clamp(toNumber(cluster.share_prior, 0), 0, 1);
            var posteriorMass = (priorConcentration * baseShare) + weights[cluster.task_cluster_id];
            return {
                task_cluster_id: cluster.task_cluster_id,
                share_prior: posteriorMass / (priorConcentration + totalOverride),
                importance_prior: toNumber(cluster.importance_prior, 0.5),
                evidence_confidence: toNumber(cluster.evidence_confidence, 0.4),
                bundle_prior_concentration: priorConcentration,
                source_mix: cluster.source_mix || '',
                notes: cluster.notes || ''
            };
        });
    }

    function buildTaskOverrides(options) {
        var overrides = {};
        var explicit = options.taskFamilyWeights || {};

        Object.keys(explicit).forEach(function (clusterId) {
            overrides[clusterId] = toNumber(explicit[clusterId], 0);
        });

        (options.dominantTaskClusters || []).forEach(function (clusterId) {
            overrides[clusterId] = (overrides[clusterId] || 0) + 0.16;
        });

        (options.roleCriticalClusters || []).forEach(function (clusterId) {
            overrides[clusterId] = (overrides[clusterId] || 0) + 0.10;
        });

        return overrides;
    }

    function deriveQuestionnaireSignals(answers, options) {
        var seniority = clamp((toNumber(options.seniorityLevel, 3) - 1) / 4, 0, 1);

        var q1 = normalizeAnswer(answers.Q1);
        var q2 = normalizeAnswer(answers.Q2);
        var q3 = normalizeAnswer(answers.Q3);
        var q4 = normalizeAnswer(answers.Q4);
        var q5 = normalizeAnswer(answers.Q5);
        var q6 = normalizeAnswer(answers.Q6);
        var q7 = normalizeAnswer(answers.Q7);
        var q8 = normalizeAnswer(answers.Q8);
        var q9 = normalizeAnswer(answers.Q9);
        var q11 = normalizeAnswer(answers.Q11);
        var q12 = normalizeAnswer(answers.Q12);
        var q13 = normalizeAnswer(answers.Q13);
        var q14 = normalizeAnswer(answers.Q14);
        var q16 = normalizeAnswer(answers.Q16);

        var capabilitySignal = average([q1, q4, q8]);
        var couplingProtection = average([q7, q9, q11, q12]);
        var adoptionPressure = average([q13, q14, q16]);
        var frictionDimensions = {
            exception_burden: average([1 - q5, 1 - q6, q7, q9]),
            accountability_load: average([q7, q11]),
            judgment_requirement: average([q7, q9, q11]),
            document_intensity: average([q2, q3, q4, q8]),
            tacit_context_dependence: average([q7, q9, q12])
        };

        return {
            seniority: seniority,
            capabilitySignal: capabilitySignal,
            couplingProtection: couplingProtection,
            adoptionPressure: adoptionPressure,
            frictionDimensions: frictionDimensions,
            answers: {
                q1: q1, q2: q2, q3: q3, q4: q4, q5: q5, q6: q6, q7: q7, q8: q8, q9: q9,
                q11: q11, q12: q12, q13: q13, q14: q14, q16: q16
            }
        };
    }

    function toTier(value, thresholds, labels) {
        if (value >= thresholds[1]) {
            return labels[2];
        }
        if (value >= thresholds[0]) {
            return labels[1];
        }
        return labels[0];
    }

    function buildNarrative(result) {
        var wt = result.wave_trajectory;
        var topCluster = result.top_exposed_work && result.top_exposed_work.label
            ? result.top_exposed_work.label
            : 'your routine task bundle';

        var headline = result.primary_displacement_wave === 'current'
            ? 'Displacement pressure is already active in the current wave.'
            : result.primary_displacement_wave === 'next'
                ? 'Primary displacement pressure arrives in the next wave.'
                : 'Major displacement pressure is in the distant wave.';

        var whyThisRoleChanges = headline + ' The easiest-to-automate work\u2014primarily ' + topCluster.toLowerCase() + '\u2014faces pressure first, while coordination, judgment, and relationship tasks hold longer.';

        var criticalCluster = result.role_defining_work && result.role_defining_work.label
            ? result.role_defining_work.label.toLowerCase()
            : null;
        if (criticalCluster && criticalCluster !== topCluster.toLowerCase()) {
            whyThisRoleChanges += ' The role-defining work in ' + criticalCluster + ' is weighted separately.';
        }

        var whatIsUnderPressure;
        if (wt && wt.current && wt.current.automated_clusters && wt.current.automated_clusters.length) {
            var automatedCount = wt.current.automated_clusters.length;
            var currentRetained = Math.round((wt.current.retained_share || 0) * 100);
            whatIsUnderPressure = automatedCount + ' task cluster' + (automatedCount === 1 ? '' : 's') + ' face' + (automatedCount === 1 ? 's' : '') + ' current-wave automation pressure. After this wave, roughly ' + currentRetained + '% of the role is retained.';
        } else {
            whatIsUnderPressure = 'No clusters face immediate current-wave automation. The role retains its full scope for now.';
        }
        if (wt && wt.next) {
            var nextRetained = Math.round((wt.next.retained_share || 0) * 100);
            whatIsUnderPressure += ' After the next wave, about ' + nextRetained + '% remains.';
        }

        var whatStaysCore;
        if (wt && wt.next) {
            if (wt.next.coherence_tier === 'coherent') {
                whatStaysCore = 'The remaining bundle after the next wave still looks coherent, with enough context-heavy, judgment-heavy, or coordinating work to hold the role together.';
            } else if (wt.next.coherence_tier === 'narrowed') {
                whatStaysCore = 'The role narrows after the next wave. The stable core becomes smaller and more dependent on the highest-value work.';
            } else {
                whatStaysCore = 'The remaining bundle after the next wave looks fragmented. The role could split unless the non-routine parts become a clearer standalone function.';
            }
        } else {
            whatStaysCore = 'The role structure will depend on which task clusters face automation pressure and how the remaining work holds together.';
        }
        if (result.role_defining_work && result.role_defining_work.retained_share !== null && result.role_defining_work.retained_share >= 0.18) {
            whatStaysCore += ' The role-defining cluster still retains enough weight to matter in the transformed bundle.';
        }

        var personalizationFitSummary;
        if (result.personalization_fit === 'strong') {
            personalizationFitSummary = 'Your answers suggest strong coupling protection and low adoption pressure, positioning you well in the retained version of the role.';
        } else if (result.personalization_fit === 'moderate') {
            personalizationFitSummary = 'Your answers point to a mixed fit with the retained role: some coupling protection, but adoption pressure is also present.';
        } else {
            personalizationFitSummary = 'Your answers suggest weaker coupling protection or higher adoption pressure, meaning more of your work sits in the part of the bundle under pressure.';
        }

        return {
            why_this_role_changes: whyThisRoleChanges,
            what_is_under_pressure: whatIsUnderPressure,
            what_stays_core: whatStaysCore,
            personalization_fit_summary: personalizationFitSummary
        };
    }

    function createEngine(store) {
        function resolveCandidates(roleCategory, limit) {
            var candidates = (store.uiRoleMapByRole[roleCategory] || [])
                .filter(function (row) { return row.onet_soc_code; })
                .sort(function (left, right) {
                    return toNumber(left.fit_rank, 99) - toNumber(right.fit_rank, 99);
                })
                .map(function (row) {
                    var occupation = store.occupationsBySoc[row.onet_soc_code];
                    return occupation ? occupation : null;
                })
                .filter(Boolean);

            return candidates.slice(0, limit || 3);
        }

        function resolveOccupation(input) {
            if (input.occupationId && store.occupationsById[input.occupationId]) {
                return store.occupationsById[input.occupationId];
            }

            if (input.onetSocCode && store.occupationsBySoc[input.onetSocCode]) {
                return store.occupationsBySoc[input.onetSocCode];
            }

            if (input.roleCategory) {
                return resolveCandidates(input.roleCategory, 1)[0] || null;
            }

            return null;
        }

        function computeResult(input) {
            var occupation = resolveOccupation(input || {});
            if (!occupation) {
                throw new Error('Unable to resolve an occupation for the v2 result.');
            }

            var occupationId = occupation.occupation_id;
            var roleCategory = input.roleCategory || input.selectedRoleCategory || occupation.role_family;
            var taskClusters = normalizeTaskWeights(
                store.occupationTaskClustersByOcc[occupationId] || [],
                buildTaskOverrides(input || {})
            );
            var taskPriorsByCluster = indexBy(store.taskPriorsByOcc[occupationId] || [], 'task_cluster_id');
            var occupationPrior = pickOccupationPrior(store.occupationPriorsByOcc[occupationId] || []);
            var adaptationPrior = store.adaptationByOcc[occupationId] || null;
            var laborContext = store.laborByOcc[occupationId] || null;
            var unemploymentSeries = laborContext && laborContext.unemployment_group_id
                ? (store.unemploymentByGroup[laborContext.unemployment_group_id] || [])
                : [];
            var signals = deriveQuestionnaireSignals(input.answers || {}, input || {});
            var roleCriticalSet = {};
            (input.roleCriticalClusters || []).forEach(function (clusterId) {
                roleCriticalSet[clusterId] = true;
            });
            var occupationAutomation = occupationPrior ? toNumber(occupationPrior.automation_score, 0.25) : 0.25;
            var occupationAdaptive = occupationPrior && occupationPrior.adaptive_capacity_score
                ? toNumber(occupationPrior.adaptive_capacity_score, 0.5)
                : (adaptationPrior ? toNumber(adaptationPrior.adaptive_capacity_score, 0.5) : 0.5);

            var currentBundle = [];
            var clusterResultsById = {};
            var roleDefiningWork = null;
            var clusterPriorReliabilities = [];
            var taskDirectReliabilities = [];
            var bundlePriorConcentration = taskClusters.length ? toNumber(taskClusters[0].bundle_prior_concentration, 1.35) : 1.35;
            var adoptionRealization = SCORING_CONFIG.adoptionRealizationBase + (signals.adoptionPressure * SCORING_CONFIG.adoptionRealizationScale);
            var waveGroups = { current: [], next: [], distant: [] };

            taskClusters.forEach(function (cluster) {
                var prior = taskPriorsByCluster[cluster.task_cluster_id] || {};
                var humanAdvantage = HUMAN_ADVANTAGE_CLUSTERS[cluster.task_cluster_id] || 0.25;
                var priorReliability = estimatePriorReliability(prior);
                var frictionDimensions = deriveClusterFriction(signals, cluster.task_cluster_id);
                var isRoleCritical = !!roleCriticalSet[cluster.task_cluster_id];
                var clusterShare = toNumber(cluster.share_prior, 0);
                clusterPriorReliabilities.push(priorReliability);

                var intrinsicFriction =
                    FRICTION_WEIGHTS.accountability_load * frictionDimensions.accountability_load +
                    FRICTION_WEIGHTS.judgment_requirement * frictionDimensions.judgment_requirement +
                    FRICTION_WEIGHTS.tacit_context_dependence * frictionDimensions.tacit_context_dependence +
                    FRICTION_WEIGHTS.exception_burden * frictionDimensions.exception_burden +
                    FRICTION_WEIGHTS.inverse_document_intensity * (1 - frictionDimensions.document_intensity);

                var humanAdvantageContribution = humanAdvantage * 0.35;

                var empiricalEase = shrinkTowardPrior(
                    average([
                        toNumber(prior.partial_automation_likelihood, 0.25),
                        toNumber(prior.high_automation_likelihood, 0.12)
                    ]),
                    occupationAutomation,
                    priorReliability,
                    0.25
                );
                var empiricalResistance = 1 - empiricalEase;

                var automationDifficulty = clamp(
                    intrinsicFriction * AUTOMATION_DIFFICULTY_WEIGHTS.intrinsicFriction +
                    humanAdvantageContribution * AUTOMATION_DIFFICULTY_WEIGHTS.humanAdvantage +
                    empiricalResistance * AUTOMATION_DIFFICULTY_WEIGHTS.empiricalResistance +
                    signals.couplingProtection * AUTOMATION_DIFFICULTY_WEIGHTS.couplingProtection,
                    0.02, 0.98
                );

                if (isRoleCritical) {
                    automationDifficulty = clamp(automationDifficulty + SCORING_CONFIG.criticalityBoost, 0.02, 0.98);
                }

                var waveAssignment;
                if (automationDifficulty <= WAVE_THRESHOLDS.current_max) {
                    waveAssignment = 'current';
                } else if (automationDifficulty <= WAVE_THRESHOLDS.next_max) {
                    waveAssignment = 'next';
                } else {
                    waveAssignment = 'distant';
                }

                var absorptionRate = clamp(
                    adoptionRealization * (1 - automationDifficulty * 0.3),
                    0.50, 0.95
                );

                var clusterResult = {
                    task_cluster_id: cluster.task_cluster_id,
                    label: slugToLabel(cluster.task_cluster_id),
                    share_of_role: clusterShare,
                    automation_difficulty: automationDifficulty,
                    wave_assignment: waveAssignment,
                    absorption_rate: absorptionRate,
                    absorbed_share: 0,
                    residual_relevance: clusterShare,
                    elevation_boost: 0,
                    evidence_confidence: average([
                        toNumber(cluster.evidence_confidence, 0.4),
                        priorReliability
                    ]),
                    primary_sources: parsePipeList(prior.primary_sources || cluster.source_mix || ''),
                    is_role_critical: isRoleCritical,
                    prior_reliability: priorReliability,
                    friction_dimensions: frictionDimensions,
                    intrinsic_friction: intrinsicFriction,
                    empirical_resistance: empiricalResistance
                };

                currentBundle.push(clusterResult);
                clusterResultsById[cluster.task_cluster_id] = clusterResult;
                waveGroups[waveAssignment].push(clusterResult);

                if (isRoleCritical) {
                    roleDefiningWork = clusterResult;
                }
            });

            // --- Wave processing: compute per-wave snapshots ---
            currentBundle.sort(function (left, right) {
                return right.share_of_role - left.share_of_role;
            });

            var waves = ['current', 'next', 'distant'];
            var waveResults = {};
            var cumulativeAutomated = {};

            waves.forEach(function (waveName) {
                waveGroups[waveName].forEach(function (cluster) {
                    cluster.absorbed_share = cluster.share_of_role * cluster.absorption_rate;
                    cluster.residual_relevance = cluster.share_of_role * (1 - cluster.absorption_rate);
                    cumulativeAutomated[cluster.task_cluster_id] = true;
                });

                var remainingClusters = currentBundle.filter(function (c) {
                    return !cumulativeAutomated[c.task_cluster_id];
                });
                var automatedClusters = currentBundle.filter(function (c) {
                    return !!cumulativeAutomated[c.task_cluster_id];
                });

                var elevationBoosts = {};
                remainingClusters.forEach(function (cluster) {
                    if (!ELEVATION_CLUSTERS[cluster.task_cluster_id]) return;
                    var elevationPull = 0;
                    automatedClusters.forEach(function (automated) {
                        var deps = CLUSTER_DEPENDENCY_MATRIX[automated.task_cluster_id];
                        if (deps && deps[cluster.task_cluster_id]) {
                            elevationPull += deps[cluster.task_cluster_id] * automated.absorbed_share;
                        }
                    });
                    elevationBoosts[cluster.task_cluster_id] = elevationPull * (1 + signals.seniority * 0.25);
                });

                var retainedShare = 0;
                currentBundle.forEach(function (c) {
                    if (cumulativeAutomated[c.task_cluster_id]) {
                        retainedShare += c.residual_relevance;
                    } else {
                        retainedShare += c.share_of_role + (elevationBoosts[c.task_cluster_id] || 0);
                    }
                });
                retainedShare = clamp(retainedShare, 0, 1);

                var connectedWeight = 0;
                var totalWeight = 0;
                Object.keys(CLUSTER_DEPENDENCY_MATRIX).forEach(function (sourceId) {
                    if (!clusterResultsById[sourceId]) return;
                    Object.keys(CLUSTER_DEPENDENCY_MATRIX[sourceId]).forEach(function (targetId) {
                        if (!clusterResultsById[targetId]) return;
                        var depWeight = CLUSTER_DEPENDENCY_MATRIX[sourceId][targetId];
                        totalWeight += depWeight;
                        if (!cumulativeAutomated[sourceId] && !cumulativeAutomated[targetId]) {
                            connectedWeight += depWeight;
                        }
                    });
                });

                var coherence = totalWeight > 0 ? (connectedWeight / totalWeight) : 0.5;
                if (remainingClusters.length >= COHERENCE_BONUSES.clusterCountThreshold) {
                    coherence += COHERENCE_BONUSES.clusterCountBonus;
                }
                if (retainedShare >= COHERENCE_BONUSES.retainedShareThreshold) {
                    coherence += COHERENCE_BONUSES.retainedShareBonus;
                }
                coherence = clamp(coherence, 0, 1);

                var waveState;
                if (retainedShare >= 0.70 && coherence >= 0.50) {
                    waveState = 'stable';
                } else if (retainedShare >= 0.40 && coherence >= 0.35) {
                    waveState = 'narrowed';
                } else if (retainedShare >= 0.20) {
                    waveState = 'transformed';
                } else {
                    waveState = 'displaced';
                }

                waveResults[waveName] = {
                    wave: waveName,
                    state: waveState,
                    state_label: WAVE_STATE_LABELS[waveState],
                    retained_share: Number(retainedShare.toFixed(3)),
                    coherence: Number(coherence.toFixed(3)),
                    coherence_tier: coherence < 0.35 ? 'fragmented' : (coherence < 0.60 ? 'narrowed' : 'coherent'),
                    automated_clusters: automatedClusters.map(function (c) { return c.task_cluster_id; }),
                    remaining_clusters: remainingClusters.map(function (c) { return c.task_cluster_id; }),
                    elevation_boosts: elevationBoosts
                };

                if (waveName === 'next') {
                    currentBundle.forEach(function (c) {
                        c.elevation_boost = elevationBoosts[c.task_cluster_id] || 0;
                        if (cumulativeAutomated[c.task_cluster_id]) {
                            c.residual_relevance = c.share_of_role * (1 - c.absorption_rate);
                        } else {
                            c.residual_relevance = c.share_of_role + c.elevation_boost;
                        }
                    });
                }
            });

            // --- Primary displacement wave ---
            var primaryDisplacementWave = 'distant';
            if (waveResults.current.state === 'displaced' || waveResults.current.state === 'transformed') {
                primaryDisplacementWave = 'current';
            } else if (waveResults.next.state === 'displaced' || waveResults.next.state === 'transformed') {
                primaryDisplacementWave = 'next';
            }

            // --- Residual viability (anchored on next wave) ---
            var adoptionFriction = 1 - signals.adoptionPressure;
            var residualViabilityScore = clamp(
                waveResults.next.retained_share * 0.45 +
                waveResults.next.coherence * 0.35 +
                signals.couplingProtection * 0.10 +
                adoptionFriction * 0.10,
                0, 1
            );

            // --- Legacy role state mapping ---
            var roleState;
            var cwState = waveResults.current.state;
            var nwState = waveResults.next.state;
            if (cwState === 'displaced') {
                roleState = 'high_displacement_risk';
            } else if (cwState === 'transformed') {
                roleState = 'role_fragments';
            } else if (cwState === 'stable' && nwState === 'stable') {
                roleState = 'mostly_augmented';
            } else if (cwState === 'stable' && nwState === 'narrowed') {
                roleState = 'routine_tasks_absorbed';
            } else if (cwState === 'stable' && nwState === 'transformed') {
                roleState = 'role_becomes_more_senior';
            } else if (cwState === 'stable' && nwState === 'displaced') {
                roleState = 'role_narrows_but_remains_viable';
            } else if (cwState === 'narrowed') {
                roleState = 'role_narrows_but_remains_viable';
            } else {
                roleState = 'routine_tasks_absorbed';
            }

            // --- Personalization fit ---
            var personalizationFitScore = clamp(
                average([
                    occupationAdaptive,
                    signals.couplingProtection,
                    signals.seniority * 0.60 + signals.capabilitySignal * 0.40,
                    waveResults.next.retained_share,
                    waveResults.next.coherence
                ]),
                0, 1
            );

            // --- Recomposition summary (derived from wave data) ---
            var selector = store.selectorByOcc[occupationId] || {};
            var bundleFriction = summarizeBundleFriction(currentBundle);
            var currentWaveAbsorbed = 0;
            waveGroups.current.forEach(function (c) {
                currentWaveAbsorbed += c.absorbed_share;
            });
            var workflowCompression = clamp(
                currentWaveAbsorbed * (1 - (signals.couplingProtection * SCORING_CONFIG.recompositionCouplingPenalty)),
                0, 1
            );
            var organizationalConversion = clamp(
                signals.adoptionPressure * 0.30 +
                (1 - signals.couplingProtection) * 0.25 +
                currentWaveAbsorbed * 0.20 +
                (1 - bundleFriction.accountability_load) * 0.10 +
                (1 - bundleFriction.judgment_requirement) * 0.08 +
                bundleFriction.document_intensity * 0.07,
                0, 1
            );
            var substitutionPotential = clamp(workflowCompression * organizationalConversion, 0, 1);
            var substitutionGap = clamp(workflowCompression - substitutionPotential, 0, 1);

            // --- Top exposed cluster (easiest to automate with most share) ---
            var topExposed = currentBundle.slice().sort(function (left, right) {
                var leftScore = left.share_of_role * (1 - left.automation_difficulty) * (left.is_role_critical ? 1.35 : 1);
                var rightScore = right.share_of_role * (1 - right.automation_difficulty) * (right.is_role_critical ? 1.35 : 1);
                return rightScore - leftScore;
            })[0] || null;

            var viabilityTier = toTier(residualViabilityScore, [0.45, 0.68], ['weak', 'moderate', 'strong']);
            var personalizationTier = toTier(personalizationFitScore, [0.45, 0.68], ['weak', 'moderate', 'strong']);
            var exposureLevel = topExposed
                ? toTier(1 - topExposed.automation_difficulty, [0.40, 0.68], ['low', 'moderate', 'high'])
                : 'low';
            var occupationAnchorConfidence = average([
                occupationPrior ? toNumber(occupationPrior.confidence, 0.45) : 0.40,
                selector ? toNumber(selector.selector_weight, 0.50) : 0.50
            ]);
            var personalizationConfidence = average([
                signals.couplingProtection,
                signals.capabilitySignal,
                average(currentBundle.map(function (cluster) {
                    return cluster.evidence_confidence;
                }))
            ]);
            var laborContextConfidence = laborContext
                ? toNumber(laborContext.labor_market_confidence, 0.55)
                : 0;

            // --- Derived lists ---
            var exposedClusters = currentBundle.filter(function (c) {
                return c.wave_assignment === 'current' || c.wave_assignment === 'next';
            }).sort(function (left, right) {
                return left.automation_difficulty - right.automation_difficulty;
            });
            var retainedClusters = currentBundle.filter(function (c) {
                return c.residual_relevance >= 0.055;
            }).sort(function (left, right) {
                return right.residual_relevance - left.residual_relevance;
            });
            var elevatedClusters = currentBundle.filter(function (c) {
                return c.elevation_boost >= 0.015;
            }).sort(function (left, right) {
                return right.elevation_boost - left.elevation_boost;
            });

            var exposedTaskShare = clamp(currentWaveAbsorbed + sum(waveGroups.next.map(function (c) { return c.absorbed_share; })), 0, 1);

            var roleSummary = occupation.title + ': primary displacement pressure arrives in the ' + primaryDisplacementWave + ' wave. After the next wave, ' + Math.round(waveResults.next.retained_share * 100) + '% retained (' + waveResults.next.coherence_tier + ' coherence). Residual role strength looks ' + viabilityTier + '.';
            if (roleDefiningWork) {
                roleSummary += ' The role-defining work in ' + roleDefiningWork.label.toLowerCase() + ' (' + roleDefiningWork.wave_assignment + ' wave) carries extra weight.';
            }

            var taskRowsByCluster = {};
            var taskBreakdownRows = [];
            var directTaskEvidenceCount = 0;
            var fallbackTaskCount = 0;

            (store.occupationTasksByOcc[occupationId] || []).forEach(function (task) {
                var key = taskKey(occupationId, task.onet_task_id);
                var membership = store.taskMembershipByKey[key] || null;
                var evidence = store.taskEvidenceByKey[key] || null;
                var clusterId = membership && membership.task_cluster_id
                    ? membership.task_cluster_id
                    : (evidence && evidence.task_cluster_id ? evidence.task_cluster_id : null);

                if (!clusterId || !clusterResultsById[clusterId]) {
                    return;
                }

                var importanceWeight = clamp(toNumber(task.importance, 0.55), 0, 1);
                var frequencyWeight = clamp(toNumber(task.frequency, importanceWeight), 0, 1);
                var observedUsageWeight = evidence ? clamp(toNumber(evidence.observed_usage_share, 0), 0, 1) : 0;
                var coreBoost = String(task.task_type || '').toLowerCase() === 'core' ? 0.08 : 0;
                var membershipWeight = membership ? clamp(toNumber(membership.membership_weight, 1), 0.15, 1) : 1;
                var rawTaskWeight = Math.max(0.04, (importanceWeight * 0.58) + (frequencyWeight * 0.27) + (observedUsageWeight * 0.15) + coreBoost) * membershipWeight;

                if (!taskRowsByCluster[clusterId]) {
                    taskRowsByCluster[clusterId] = [];
                }

                taskRowsByCluster[clusterId].push({
                    task: task,
                    membership: membership,
                    evidence: evidence,
                    raw_weight: rawTaskWeight
                });
            });

            Object.keys(taskRowsByCluster).forEach(function (clusterId) {
                var clusterResult = clusterResultsById[clusterId];
                var rows = taskRowsByCluster[clusterId] || [];
                var totalRawWeight = sum(rows.map(function (row) {
                    return row.raw_weight;
                })) || rows.length || 1;

                rows.forEach(function (row) {
                    var evidence = row.evidence;
                    var membership = row.membership;
                    var taskShare = clusterResult.share_of_role * (row.raw_weight / totalRawWeight);
                    var taskAbsorbedShare = cumulativeAutomated[clusterId]
                        ? taskShare * clusterResult.absorption_rate
                        : 0;
                    var taskRetainedShare = taskShare - taskAbsorbedShare;
                    var taskElevationBoost = (clusterResult.elevation_boost || 0) * (row.raw_weight / totalRawWeight);
                    var transformedTaskShare = Math.max(0, taskRetainedShare + taskElevationBoost);
                    var hasDirectEvidence = !!(evidence && evidence.source_id && String(evidence.source_id).indexOf('src_internal_stub') !== 0);
                    var taskEvidenceReliability = hasDirectEvidence ? estimateTaskEvidenceReliability(evidence) : 0;

                    if (hasDirectEvidence) {
                        directTaskEvidenceCount += 1;
                        taskDirectReliabilities.push(taskEvidenceReliability);
                    } else {
                        fallbackTaskCount += 1;
                    }

                    taskBreakdownRows.push({
                        onet_task_id: row.task.onet_task_id,
                        task_statement: row.task.task_statement,
                        task_type: row.task.task_type || '',
                        task_cluster_id: clusterId,
                        task_cluster_label: clusterResult.label,
                        share_of_role: Number(taskShare.toFixed(4)),
                        automation_difficulty: Number(clusterResult.automation_difficulty.toFixed(3)),
                        wave_assignment: clusterResult.wave_assignment,
                        exposed_share: Number(taskAbsorbedShare.toFixed(4)),
                        retained_share: Number(transformedTaskShare.toFixed(4)),
                        exposure_score: Number((1 - clusterResult.automation_difficulty).toFixed(3)),
                        exposure_level: toTier(1 - clusterResult.automation_difficulty, [0.40, 0.68], ['low', 'moderate', 'high']),
                        likely_mode: clusterResult.wave_assignment,
                        evidence_confidence: Number(average([
                            clusterResult.evidence_confidence,
                            evidence ? toNumber(evidence.confidence, 0.55) : null,
                            membership ? toNumber(membership.mapping_confidence, 0.45) : 0.45
                        ]).toFixed(3)),
                        direct_evidence_reliability: Number(taskEvidenceReliability.toFixed(3)),
                        mapping_method: membership ? membership.mapping_method : 'cluster_fallback',
                        mapping_confidence: Number((membership ? toNumber(membership.mapping_confidence, 0.45) : 0.45).toFixed(3)),
                        evidence_type: evidence ? evidence.evidence_type : 'cluster_fallback',
                        evidence_source: evidence ? evidence.source_id : null,
                        observed_usage_share: Number((evidence ? toNumber(evidence.observed_usage_share, 0) : 0).toFixed(4)),
                        has_direct_evidence: hasDirectEvidence,
                        is_role_critical: !!clusterResult.is_role_critical,
                        friction_dimensions: clusterResult.friction_dimensions
                    });
                });
            });

            taskBreakdownRows.sort(function (left, right) {
                if (right.exposed_share !== left.exposed_share) {
                    return right.exposed_share - left.exposed_share;
                }
                return right.share_of_role - left.share_of_role;
            });

            var totalTaskRows = directTaskEvidenceCount + fallbackTaskCount;
            var directCoverageRatio = totalTaskRows ? (directTaskEvidenceCount / totalTaskRows) : 0.35;
            var dependencyRead = computeDependencyPenalty(currentBundle);
            var dependencyPenalty = clamp(dependencyRead.penalty, 0, 0.5);
            var bindingDependencies = dependencyRead.bindings;
            var recompositionConfidence = clamp(average([
                average(currentBundle.map(function (cluster) {
                    return cluster.evidence_confidence;
                })),
                occupationAnchorConfidence,
                personalizationConfidence,
                directCoverageRatio
            ]), 0, 1);
            var recompositionBandHalfWidth = clamp(
                0.06 +
                ((1 - recompositionConfidence) * 0.18) +
                ((1 - directCoverageRatio) * 0.05) +
                ((1 - occupationAnchorConfidence) * 0.04),
                0.06,
                0.24
            );
            var recompositionSummary = buildRecompositionSummary({
                workflow_compression: workflowCompression,
                organizational_conversion: organizationalConversion,
                substitution_potential: substitutionPotential,
                substitution_gap: substitutionGap
            }, {
                confidence_score: recompositionConfidence,
                band_half_width: recompositionBandHalfWidth,
                dependency_penalty: dependencyPenalty,
                binding_dependencies: bindingDependencies
            });

            var categoryMappings = (store.uiRoleMapByRole[roleCategory] || [])
                .filter(function (row) { return row.onet_soc_code; })
                .slice()
                .sort(function (left, right) {
                    return toNumber(left.fit_rank, 99) - toNumber(right.fit_rank, 99);
                });
            var categoryCandidateRank = null;
            for (var categoryIndex = 0; categoryIndex < categoryMappings.length; categoryIndex += 1) {
                if (categoryMappings[categoryIndex].onet_soc_code === occupation.onet_soc_code) {
                    categoryCandidateRank = categoryIndex + 1;
                    break;
                }
            }

            var occupationAssignment = {
                role_category: roleCategory,
                role_category_label: slugToLabel(roleCategory),
                selected_occupation_id: occupationId,
                selected_occupation_title: occupation.title,
                onet_soc_code: occupation.onet_soc_code || null,
                selector_weight: Number(toNumber(selector.selector_weight, 0.5).toFixed(3)),
                anchor_confidence: Number(occupationAnchorConfidence.toFixed(3)),
                category_candidate_count: categoryMappings.length,
                category_candidate_rank: categoryCandidateRank,
                occupation_prior_source: occupationPrior ? occupationPrior.source_id : null,
                assignment_method: input.occupationId
                    ? 'Using the occupation you explicitly selected from the mapped launch set.'
                    : 'Using the top mapped occupation for the selected launch category.',
                task_assignment_method: 'The model starts from O*NET tasks for the selected occupation, maps those tasks into task clusters, blends in Anthropic task evidence where available, and then reweights the task bundle using your questionnaire.',
                dominant_task_clusters: (input.dominantTaskClusters || []).map(function (clusterId) {
                    return {
                        task_cluster_id: clusterId,
                        label: slugToLabel(clusterId)
                    };
                }),
                role_defining_cluster: roleDefiningWork ? {
                    task_cluster_id: roleDefiningWork.task_cluster_id,
                    label: roleDefiningWork.label
                } : null,
                direct_task_evidence_count: directTaskEvidenceCount,
                fallback_task_count: fallbackTaskCount,
                questionnaire_effect: 'Your task-family choices change role-share weights. Your questionnaire answers shape automation difficulty per cluster and the wave-based displacement trajectory.'
            };

            var evidenceSummary = {
                task_evidence_confidence: average(currentBundle.map(function (cluster) {
                    return cluster.evidence_confidence;
                })),
                occupation_anchor_confidence: occupationAnchorConfidence,
                personalization_confidence: personalizationConfidence,
                labor_context_confidence: laborContextConfidence,
                friction_dimensions: {
                    exception_burden: Number(bundleFriction.exception_burden.toFixed(3)),
                    accountability_load: Number(bundleFriction.accountability_load.toFixed(3)),
                    judgment_requirement: Number(bundleFriction.judgment_requirement.toFixed(3)),
                    document_intensity: Number(bundleFriction.document_intensity.toFixed(3)),
                    tacit_context_dependence: Number(bundleFriction.tacit_context_dependence.toFixed(3))
                },
                source_coverage: {
                    occupation_prior_source: occupationPrior ? occupationPrior.source_id : null,
                    task_prior_rows: currentBundle.length,
                    exposed_cluster_rows: exposedClusters.length,
                    direct_task_evidence_rows: directTaskEvidenceCount,
                    fallback_task_rows: fallbackTaskCount,
                    labor_context_available: !!laborContext
                },
                notes: [
                    occupationPrior ? ('Occupation prior source: ' + occupationPrior.source_id) : 'Occupation prior source: fallback heuristic',
                    'v2.1 wave-based model: automation difficulty per cluster drives wave assignment (current/next/distant).',
                    'Task-family friction scored across exception burden, accountability load, judgment requirement, document intensity, and tacit/context dependence.',
                    'Cluster priors are shrunk toward occupation-level priors using evidence confidence.',
                    'Wave trajectory: current=' + waveResults.current.state + ', next=' + waveResults.next.state + ', distant=' + waveResults.distant.state + '. Primary displacement wave: ' + primaryDisplacementWave + '.',
                    roleDefiningWork ? ('Role-defining task input: ' + roleDefiningWork.label + ' (wave: ' + roleDefiningWork.wave_assignment + ').') : 'No explicit role-defining task input selected.',
                    'Capability signal=' + Number(signals.capabilitySignal.toFixed(2)) + '; adoption pressure=' + Number(signals.adoptionPressure.toFixed(2)) + '.',
                    'Labor-market data is shown as context and does not drive the main role labels.',
                    laborContext ? ('Labor context includes employment=' + laborContext.employment_us + ', median_wage=' + laborContext.median_wage_usd + ', growth=' + laborContext.projection_growth_pct + '%.') : 'Labor context unavailable for this occupation.',
                    laborContext && laborContext.unemployment_group_label ? ('Latest official BLS unemployment for ' + laborContext.unemployment_group_label + ' is ' + laborContext.latest_unemployment_rate + '% (' + laborContext.latest_unemployment_period + ').') : 'No mapped BLS unemployment series for this occupation yet.'
                ]
            };

            var result = {
                selected_role_category: roleCategory,
                selected_occupation_id: occupationId,
                selected_occupation_title: occupation.title,
                role_outlook: roleState,
                role_outlook_label: ROLE_STATE_LABELS[roleState],
                role_summary: roleSummary,
                occupation_assignment: occupationAssignment,
                primary_displacement_wave: primaryDisplacementWave,
                wave_trajectory: {
                    current: waveResults.current,
                    next: waveResults.next,
                    distant: waveResults.distant
                },
                top_exposed_work: topExposed ? {
                    task_cluster_id: topExposed.task_cluster_id,
                    label: topExposed.label,
                    share_of_role: Number(topExposed.share_of_role.toFixed(3)),
                    automation_difficulty: Number(topExposed.automation_difficulty.toFixed(3)),
                    wave_assignment: topExposed.wave_assignment,
                    exposure_level: exposureLevel
                } : null,
                role_defining_work: roleDefiningWork ? {
                    task_cluster_id: roleDefiningWork.task_cluster_id,
                    label: roleDefiningWork.label,
                    share_of_role: Number(roleDefiningWork.share_of_role.toFixed(3)),
                    retained_share: Number(roleDefiningWork.residual_relevance.toFixed(3)),
                    wave_assignment: roleDefiningWork.wave_assignment,
                    automation_difficulty: Number(roleDefiningWork.automation_difficulty.toFixed(3))
                } : null,
                exposed_task_share: Number(exposedTaskShare.toFixed(3)),
                residual_role_strength: viabilityTier,
                personalization_fit: personalizationTier,
                recomposition_summary: recompositionSummary,
                transformation_map: {
                    current_bundle: currentBundle,
                    exposed_clusters: exposedClusters,
                    retained_clusters: retainedClusters,
                    elevated_clusters: elevatedClusters
                },
                task_breakdown: {
                    total_tasks_considered: taskBreakdownRows.length,
                    direct_evidence_tasks: directTaskEvidenceCount,
                    cluster_fallback_tasks: fallbackTaskCount,
                    tasks: taskBreakdownRows
                },
                narrative_summary: null,
                evidence_summary: evidenceSummary,
                labor_market_context: laborContext ? {
                    employment_us: toNumber(laborContext.employment_us, 0),
                    annual_openings: toNumber(laborContext.annual_openings, 0),
                    median_wage_usd: toNumber(laborContext.median_wage_usd, 0),
                    wage_p25_usd: toNumber(laborContext.wage_p25_usd, 0),
                    wage_p75_usd: toNumber(laborContext.wage_p75_usd, 0),
                    projection_growth_pct: toNumber(laborContext.projection_growth_pct, 0),
                    unemployment_group_id: laborContext.unemployment_group_id || null,
                    unemployment_group_label: laborContext.unemployment_group_label || null,
                    unemployment_series_id: laborContext.unemployment_series_id || null,
                    latest_unemployment_rate: laborContext.latest_unemployment_rate !== undefined && laborContext.latest_unemployment_rate !== '' ? toNumber(laborContext.latest_unemployment_rate, null) : null,
                    latest_unemployment_period: laborContext.latest_unemployment_period || null,
                    monthly_unemployment_series: unemploymentSeries.map(function (row) {
                        return {
                            year: toNumber(row.year, 0),
                            month: toNumber(row.month, 0),
                            month_label: row.month_label,
                            unemployment_rate: row.unemployment_rate !== undefined && row.unemployment_rate !== '' ? toNumber(row.unemployment_rate, null) : null,
                            is_missing: String(row.is_missing || '') === '1'
                        };
                    })
                } : null,
                diagnostics: {
                    occupation_prior_source: occupationPrior ? occupationPrior.source_id : null,
                    occupation_prior_automation: Number(occupationAutomation.toFixed(3)),
                    occupation_prior_adaptive_capacity: Number(occupationAdaptive.toFixed(3)),
                    bundle_prior_concentration: Number(bundlePriorConcentration.toFixed(3)),
                    mean_cluster_prior_reliability: Number(average(clusterPriorReliabilities).toFixed(3)),
                    mean_task_direct_reliability: Number(average(taskDirectReliabilities).toFixed(3)),
                    workflow_compression: Number(workflowCompression.toFixed(3)),
                    organizational_conversion: Number(organizationalConversion.toFixed(3)),
                    substitution_potential: Number(substitutionPotential.toFixed(3)),
                    substitution_gap: Number(substitutionGap.toFixed(3)),
                    recomposition_confidence: Number(recompositionConfidence.toFixed(3)),
                    dependency_penalty: Number(dependencyPenalty.toFixed(3)),
                    adoption_pressure: Number(signals.adoptionPressure.toFixed(3)),
                    capability_signal: Number(signals.capabilitySignal.toFixed(3)),
                    coupling_protection: Number(signals.couplingProtection.toFixed(3)),
                    exception_burden: Number(bundleFriction.exception_burden.toFixed(3)),
                    accountability_load: Number(bundleFriction.accountability_load.toFixed(3)),
                    judgment_requirement: Number(bundleFriction.judgment_requirement.toFixed(3)),
                    document_intensity: Number(bundleFriction.document_intensity.toFixed(3)),
                    tacit_context_dependence: Number(bundleFriction.tacit_context_dependence.toFixed(3)),
                    primary_displacement_wave: primaryDisplacementWave,
                    current_wave_state: waveResults.current.state,
                    next_wave_state: waveResults.next.state,
                    next_wave_retained: waveResults.next.retained_share,
                    next_wave_coherence: waveResults.next.coherence,
                    personalization_fit_score: Number(personalizationFitScore.toFixed(3)),
                    residual_role_strength_score: Number(residualViabilityScore.toFixed(3))
                },
                likely_role_state: roleState,
                likely_role_state_label: ROLE_STATE_LABELS[roleState],
                top_exposed_task_cluster: topExposed ? topExposed.label : 'Unknown',
                residual_role_viability: viabilityTier
            };

            result.narrative_summary = buildNarrative(result);
            return result;
        }

        return {
            getOccupationCandidates: function (roleCategory, limit) {
                return resolveCandidates(roleCategory, limit || 3);
            },
            listOccupations: function (limit) {
                var rows = Object.keys(store.occupationsById)
                    .map(function (occupationId) {
                        var occupation = store.occupationsById[occupationId];
                        var selector = store.selectorByOcc[occupationId] || {};

                        return {
                            occupation_id: occupation.occupation_id,
                            onet_soc_code: occupation.onet_soc_code,
                            title: occupation.title,
                            role_family: occupation.role_family,
                            selector_weight: toNumber(selector.selector_weight, 0.5),
                            search_blob: selector.search_blob || occupation.title.toLowerCase()
                        };
                    })
                    .sort(function (left, right) {
                        return right.selector_weight - left.selector_weight;
                    });

                return typeof limit === 'number' && limit > 0 ? rows.slice(0, limit) : rows;
            },
            searchOccupations: function (query, limit, roleCategory) {
                var normalizedQuery = String(query || '').trim().toLowerCase();
                var rows = this.listOccupations();

                if (roleCategory) {
                    rows = rows.filter(function (row) {
                        return row.role_family === roleCategory;
                    });
                }

                if (!normalizedQuery) {
                    return typeof limit === 'number' && limit > 0 ? rows.slice(0, limit) : rows;
                }

                rows = rows
                    .map(function (row) {
                        var title = String(row.title || '').toLowerCase();
                        var searchBlob = String(row.search_blob || '').toLowerCase();
                        var score = 0;

                        if (title === normalizedQuery) {
                            score += 100;
                        } else if (title.indexOf(normalizedQuery) === 0) {
                            score += 60;
                        } else if (title.indexOf(normalizedQuery) !== -1) {
                            score += 40;
                        }

                        if (searchBlob.indexOf(normalizedQuery) !== -1) {
                            score += 20;
                        }

                        score += row.selector_weight * 10;

                        return {
                            score: score,
                            row: row
                        };
                    })
                    .filter(function (entry) { return entry.score > 0; })
                    .sort(function (left, right) {
                        return right.score - left.score;
                    })
                    .map(function (entry) { return entry.row; });

                return typeof limit === 'number' && limit > 0 ? rows.slice(0, limit) : rows;
            },
            getOccupationById: function (occupationId) {
                return store.occupationsById[occupationId] || null;
            },
            computeResult: computeResult,
            getDataSummary: function () {
                return {
                    occupations: Object.keys(store.occupationsById).length,
                    roleCategories: Object.keys(store.uiRoleMapByRole).length,
                    occupationTaskClusterRows: store.occupationTaskClusters.length,
                    taskPriorRows: store.taskPriors.length
                };
            }
        };
    }

    async function create(options) {
        var opts = options || {};
        var basePath = opts.basePath || '';
        var loaded = {};
        var keys = Object.keys(DATA_FILES);

        for (var i = 0; i < keys.length; i += 1) {
            var key = keys[i];
            loaded[key] = await loadCsv(normalizePath(basePath, DATA_FILES[key]));
        }

        var occupationsById = indexBy(loaded.occupations, 'occupation_id');
        var occupationsBySoc = loaded.occupations.reduce(function (map, row) {
            map[row.onet_soc_code] = row;
            return map;
        }, {});

        return createEngine({
            occupationsById: occupationsById,
            occupationsBySoc: occupationsBySoc,
            selectorByOcc: indexBy(loaded.selector, 'occupation_id'),
            occupationTaskClusters: loaded.occupationTaskClusters,
            occupationTaskClustersByOcc: groupBy(loaded.occupationTaskClusters, 'occupation_id'),
            occupationTasksByOcc: groupBy(loaded.occupationTasks, 'occupation_id'),
            taskMembershipByKey: loaded.taskMembership.reduce(function (map, row) {
                var key = taskKey(row.occupation_id, row.onet_task_id);
                var current = map[key];
                if (!current || toNumber(row.mapping_confidence, 0) >= toNumber(current.mapping_confidence, 0)) {
                    map[key] = row;
                }
                return map;
            }, {}),
            taskEvidenceByKey: loaded.taskEvidence.reduce(function (map, row) {
                var key = taskKey(row.occupation_id, row.onet_task_id);
                var current = map[key];
                if (!current || toNumber(row.confidence, 0) >= toNumber(current.confidence, 0)) {
                    map[key] = row;
                }
                return map;
            }, {}),
            taskPriors: loaded.taskPriors,
            taskPriorsByOcc: groupBy(loaded.taskPriors, 'occupation_id'),
            occupationPriorsByOcc: groupBy(loaded.occupationPriors, 'occupation_id'),
            adaptationByOcc: indexBy(loaded.adaptationPriors, 'occupation_id'),
            laborByOcc: indexBy(loaded.laborContext, 'occupation_id'),
            unemploymentByGroup: groupBy(loaded.unemploymentMonthly, 'unemployment_group_id'),
            uiRoleMapByRole: groupRoleMap(loaded.uiRoleMap)
        });
    }

    return {
        create: create,
        ROLE_STATE_LABELS: ROLE_STATE_LABELS,
        WAVE_STATE_LABELS: WAVE_STATE_LABELS,
        DATA_FILES: DATA_FILES
    };
});
