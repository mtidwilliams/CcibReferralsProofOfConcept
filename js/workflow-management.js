// Workflow Management demo: lets an admin customize a referral workflow with
// branching decision steps, and simulates scheduling a new version for a future date.
// Everything lives in memory only — there is no backend behind this page.
document.addEventListener('partials:loaded', () => {
    const activeWorkflowCard = document.getElementById('activeWorkflowCard');
    if (!activeWorkflowCard) return;

    const STEP_TYPES = {
        approval: { label: 'Approval', decision: true, positiveResponse: 'Approved', negativeResponse: 'Denied' },
        yesno: { label: 'Yes / No', decision: true, positiveResponse: 'Yes', negativeResponse: 'No' },
        notify: { label: 'Notify', decision: false },
        waitlist: { label: 'Waitlist', decision: false },
        archive: { label: 'Archive', decision: false, terminal: true }
    };

    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' });

    // ---- Seed data -------------------------------------------------------

    function genId() {
        return `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }

    function todayISO() {
        return new Date().toISOString().slice(0, 10);
    }

    function addDaysISO(iso, days) {
        const d = new Date(`${iso}T00:00:00`);
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
    }

    function formatDate(iso) {
        if (!iso) return '—';
        return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function cloneWorkflow(workflow) {
        return JSON.parse(JSON.stringify(workflow));
    }

    function buildDefaultWorkflow() {
        const steps = [
            { id: 'D', type: 'approval', description: "Referring JD's board approve funding?", responsibleParty: 'Referring JD Board', outcomes: { positive: 'n2', negative: 'n1' } },
            { id: 'n1', type: 'notify', description: 'Notify probation of funding rejection.', notifyEmail: 'probation@example.org', next: 'n13' },
            { id: 'n2', type: 'notify', description: 'Notify probation of funding approval', notifyEmail: 'probation@example.org', next: 'n3' },
            { id: 'n3', type: 'notify', description: "Notify receiving JD's board", notifyEmail: 'board@receiving-jd.example.org', next: 'n4' },
            { id: 'n4', type: 'approval', description: 'Placement accepted by board?', responsibleParty: 'Receiving JD Board', outcomes: { positive: 'n5', negative: 'n6' } },
            { id: 'n5', type: 'notify', description: 'Notify probation of acceptance', notifyEmail: 'probation@example.org', next: 'n7' },
            { id: 'n6', type: 'notify', description: 'Notify probation of rejection', notifyEmail: 'probation@example.org', next: 'n15' },
            { id: 'n7', type: 'yesno', description: 'Offender sentenced to community corrections?', responsibleParty: 'Probation Officer', outcomes: { positive: 'n17', negative: 'n18' } },
            { id: 'n13', type: 'archive', description: 'Archive referral workflow' },
            { id: 'n15', type: 'archive', description: 'Archive referral workflow' },
            { id: 'n17', type: 'waitlist', description: 'Client waitlisted for stay creation', responsibleParty: 'Program Intake Coordinator', next: null },
            { id: 'n18', type: 'archive', description: 'Archive referral workflow' }
        ];

        return {
            description: 'Default Workflow',
            effectiveDate: addDaysISO(todayISO(), -30),
            firstStepId: 'D',
            steps: Object.fromEntries(steps.map((s) => [s.id, { helpText: '', ...s }]))
        };
    }

    let activeWorkflow = buildDefaultWorkflow();
    let scheduledWorkflow = null;
    let draftWorkflow = null;

    // ---- Rendering ---------------------------------------------------------

    function nextIds(step) {
        if (STEP_TYPES[step.type].decision) return [step.outcomes.positive, step.outcomes.negative];
        return [step.next];
    }

    function reachableIds(workflow) {
        const seen = new Set();
        const stack = [workflow.firstStepId];
        while (stack.length) {
            const id = stack.pop();
            if (!id || seen.has(id) || !workflow.steps[id]) continue;
            seen.add(id);
            stack.push(...nextIds(workflow.steps[id]));
        }
        return seen;
    }

    // Encodes characters that would break Mermaid label syntax or be read as markup.
    function mermaidText(text) {
        return String(text).replace(/[#"<>&]/g, (c) => `#${c.charCodeAt(0)};`);
    }

    // Step ids are mapped to s0, s1, ... so user data never becomes Mermaid syntax.
    function buildMermaidDefinition(workflow) {
        const ids = Object.keys(workflow.steps);
        const nodeIdFor = new Map(ids.map((id, i) => [id, `s${i}`]));
        const stepByNode = new Map(ids.map((id, i) => [`s${i}`, workflow.steps[id]]));
        const reachable = reachableIds(workflow);
        const nodes = ['    startNode(["Referral created in CCIB"])'];
        const edges = [];
        let needsEnd = false;

        ids.forEach((id) => {
            const step = workflow.steps[id];
            const meta = STEP_TYPES[step.type];
            const node = nodeIdFor.get(id);
            const label = mermaidText(step.description || '(untitled step)');
            nodes.push(meta.decision ? `    ${node}{"${label}"}` : `    ${node}["${label}"]`);
            if (step.type === 'waitlist' || step.type === 'archive') nodes.push(`    class ${node} ${step.type}`);
            if (!reachable.has(id)) nodes.push(`    class ${node} unattached`);

            if (meta.decision) {
                [[meta.positiveResponse, step.outcomes.positive], [meta.negativeResponse, step.outcomes.negative]]
                    .forEach(([response, target]) => {
                        const targetNode = target && nodeIdFor.get(target);
                        if (!targetNode) needsEnd = true;
                        edges.push(`    ${node} -- ${response} --> ${targetNode || 'endNode'}`);
                    });
            } else if (!meta.terminal && step.next && nodeIdFor.has(step.next)) {
                edges.push(`    ${node} --> ${nodeIdFor.get(step.next)}`);
            }
        });

        if (workflow.firstStepId && nodeIdFor.has(workflow.firstStepId)) {
            edges.unshift(`    startNode --> ${nodeIdFor.get(workflow.firstStepId)}`);
        }
        if (needsEnd) nodes.push('    endNode(("End"))');

        const definition = [
            'flowchart TB',
            ...nodes,
            ...edges,
            '    classDef waitlist fill:#FFF9C4',
            '    classDef archive fill:#ec040470',
            '    classDef unattached stroke-dasharray:6 4,stroke:#dc3545'
        ].join('\n');

        return { definition, stepByNode, unattachedCount: ids.length - reachable.size };
    }

    function stepTooltip(step) {
        const lines = [`${STEP_TYPES[step.type].label}: ${step.description}`];
        if (step.helpText) lines.push(step.helpText);
        if (step.responsibleParty) lines.push(`Responsible: ${step.responsibleParty}`);
        if (step.notifyEmail) lines.push(`Notify: ${step.notifyEmail}`);
        return lines.join('\n');
    }

    let renderCount = 0;

    async function renderWorkflowDiagram(container, workflow, onStepClick) {
        const { definition, stepByNode, unattachedCount } = buildMermaidDefinition(workflow);
        try {
            const { svg } = await mermaid.render(`workflowDiagram${++renderCount}`, definition);
            container.innerHTML = svg;
        } catch (err) {
            console.error(err);
            container.textContent = 'Unable to render workflow diagram.';
            return unattachedCount;
        }

        container.querySelectorAll('g.node').forEach((g) => {
            const match = /flowchart-(.+)-\d+$/.exec(g.id);
            const step = stepByNode.get(g.dataset.id || (match && match[1]));
            if (!step) return;

            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = stepTooltip(step);
            g.prepend(title);

            if (onStepClick) {
                g.style.cursor = 'pointer';
                g.addEventListener('click', () => onStepClick(step.id));
            }
        });
        return unattachedCount;
    }

    // ---- Active workflow / scheduled banner --------------------------------

    const activeDescriptionEl = document.getElementById('activeWorkflowDescription');
    const activeEffectiveBadge = document.getElementById('activeWorkflowEffectiveBadge');
    const activeFlowEl = document.getElementById('activeWorkflowFlow');
    const modifyBtn = document.getElementById('modifyWorkflowBtn');

    const scheduledBanner = document.getElementById('scheduledBanner');
    const scheduledBannerText = document.getElementById('scheduledBannerText');
    const editScheduledBtn = document.getElementById('editScheduledBtn');
    const activateScheduledBtn = document.getElementById('activateScheduledBtn');
    const cancelScheduledBtn = document.getElementById('cancelScheduledBtn');

    function renderActiveWorkflow() {
        activeDescriptionEl.textContent = activeWorkflow.description;
        activeEffectiveBadge.textContent = `In effect since ${formatDate(activeWorkflow.effectiveDate)}`;
        renderWorkflowDiagram(activeFlowEl, activeWorkflow, null);
    }

    function renderScheduledBanner() {
        if (!scheduledWorkflow) {
            scheduledBanner.classList.add('d-none');
        } else {
            scheduledBanner.classList.remove('d-none');
            scheduledBannerText.textContent =
                `"${scheduledWorkflow.description}" is scheduled to take effect on ${formatDate(scheduledWorkflow.effectiveDate)}.`;
        }
        modifyBtn.disabled = !!scheduledWorkflow;
        modifyBtn.title = scheduledWorkflow ? 'A version is already scheduled — edit or cancel it above.' : '';
    }

    editScheduledBtn.addEventListener('click', () => {
        if (!scheduledWorkflow) return;
        draftWorkflow = cloneWorkflow(scheduledWorkflow);
        showDraftCard();
    });

    activateScheduledBtn.addEventListener('click', () => {
        if (!scheduledWorkflow) return;
        if (!window.confirm('Simulate this scheduled version taking effect now?')) return;
        activeWorkflow = scheduledWorkflow;
        scheduledWorkflow = null;
        renderActiveWorkflow();
        renderScheduledBanner();
    });

    cancelScheduledBtn.addEventListener('click', () => {
        if (!window.confirm('Cancel the scheduled workflow version?')) return;
        scheduledWorkflow = null;
        renderScheduledBanner();
    });

    // ---- Draft editing ------------------------------------------------------

    const draftWorkflowCard = document.getElementById('draftWorkflowCard');
    const draftDescriptionInput = document.getElementById('draftDescription');
    const draftEffectiveDateInput = document.getElementById('draftEffectiveDate');
    const draftFlowEl = document.getElementById('draftWorkflowFlow');
    const draftUnattachedWarning = document.getElementById('draftUnattachedWarning');
    const draftUnattachedCount = document.getElementById('draftUnattachedCount');
    const addStepBtn = document.getElementById('addStepBtn');
    const cancelDraftBtn = document.getElementById('cancelDraftBtn');
    const scheduleDraftBtn = document.getElementById('scheduleDraftBtn');

    async function refreshDraftFlow() {
        const workflow = draftWorkflow;
        const unattached = await renderWorkflowDiagram(draftFlowEl, workflow, (stepId) => openStepModal(workflow, stepId));
        draftUnattachedCount.textContent = String(unattached);
        draftUnattachedWarning.classList.toggle('d-none', unattached === 0);
    }

    function showDraftCard() {
        draftDescriptionInput.value = draftWorkflow.description;
        draftEffectiveDateInput.value = draftWorkflow.effectiveDate;
        draftEffectiveDateInput.min = addDaysISO(todayISO(), 1);
        refreshDraftFlow();
        activeWorkflowCard.classList.add('d-none');
        scheduledBanner.classList.add('d-none');
        draftWorkflowCard.classList.remove('d-none');
    }

    function hideDraftCard() {
        draftWorkflow = null;
        draftWorkflowCard.classList.add('d-none');
        activeWorkflowCard.classList.remove('d-none');
        renderScheduledBanner();
    }

    modifyBtn.addEventListener('click', () => {
        draftWorkflow = cloneWorkflow(activeWorkflow);
        draftWorkflow.effectiveDate = addDaysISO(todayISO(), 7);
        showDraftCard();
    });

    addStepBtn.addEventListener('click', () => openStepModal(draftWorkflow, null));

    cancelDraftBtn.addEventListener('click', () => {
        if (!window.confirm('Discard changes to this draft workflow?')) return;
        hideDraftCard();
    });

    scheduleDraftBtn.addEventListener('click', () => {
        const description = draftDescriptionInput.value.trim();
        const effectiveDate = draftEffectiveDateInput.value;
        if (!description) {
            window.alert('Please provide a workflow description.');
            return;
        }
        if (!effectiveDate || effectiveDate <= todayISO()) {
            window.alert('Please choose a future effective date.');
            return;
        }
        if (!draftWorkflow.firstStepId) {
            window.alert('Please add at least one step and set a first step before scheduling.');
            return;
        }
        draftWorkflow.description = description;
        draftWorkflow.effectiveDate = effectiveDate;
        scheduledWorkflow = draftWorkflow;
        draftWorkflow = null;
        draftWorkflowCard.classList.add('d-none');
        activeWorkflowCard.classList.remove('d-none');
        renderScheduledBanner();
    });

    // ---- Step editor modal ----------------------------------------------

    const stepModalEl = document.getElementById('stepModal');
    const stepModal = new bootstrap.Modal(stepModalEl);
    const stepModalLabel = document.getElementById('stepModalLabel');
    const stepEditIdInput = document.getElementById('stepEditId');
    const stepTypeSelect = document.getElementById('stepType');
    const stepDescriptionInput = document.getElementById('stepDescription');
    const stepHelpTextInput = document.getElementById('stepHelpText');
    const responsiblePartyGroup = document.getElementById('responsiblePartyGroup');
    const stepResponsiblePartyInput = document.getElementById('stepResponsibleParty');
    const notifyEmailGroup = document.getElementById('notifyEmailGroup');
    const stepNotifyEmailInput = document.getElementById('stepNotifyEmail');
    const singleNextGroup = document.getElementById('singleNextGroup');
    const stepNextSingleSelect = document.getElementById('stepNextSingle');
    const branchNextGroup = document.getElementById('branchNextGroup');
    const branchLabelPositive = document.getElementById('branchLabelPositive');
    const branchLabelNegative = document.getElementById('branchLabelNegative');
    const stepNextPositiveSelect = document.getElementById('stepNextPositive');
    const stepNextNegativeSelect = document.getElementById('stepNextNegative');
    const stepIsFirstCheckbox = document.getElementById('stepIsFirst');
    const saveStepBtn = document.getElementById('saveStepBtn');
    const deleteStepBtn = document.getElementById('deleteStepBtn');

    let modalWorkflow = null;

    function populateNextStepSelect(select, workflow, excludeId, selectedValue) {
        select.innerHTML = '';
        select.add(new Option('End of Workflow', ''));
        const seen = {};
        Object.values(workflow.steps).forEach((step) => {
            const base = step.description || '(untitled step)';
            seen[base] = (seen[base] || 0) + 1;
            if (step.id === excludeId) return;
            select.add(new Option(seen[base] > 1 ? `${base} (${seen[base]})` : base, step.id));
        });
        select.value = selectedValue || '';
    }

    function updateModalFieldsForType(type) {
        const meta = STEP_TYPES[type];
        responsiblePartyGroup.classList.toggle('d-none', type === 'notify' || !!meta.terminal);
        notifyEmailGroup.classList.toggle('d-none', type !== 'notify');
        singleNextGroup.classList.toggle('d-none', meta.decision || !!meta.terminal);
        branchNextGroup.classList.toggle('d-none', !meta.decision);
        if (meta.decision) {
            branchLabelPositive.textContent = `If ${meta.positiveResponse}`;
            branchLabelNegative.textContent = `If ${meta.negativeResponse}`;
        }
    }

    stepTypeSelect.addEventListener('change', () => updateModalFieldsForType(stepTypeSelect.value));

    function openStepModal(workflow, stepId) {
        modalWorkflow = workflow;
        const step = stepId ? workflow.steps[stepId] : null;

        stepModalLabel.textContent = step ? 'Edit Workflow Step' : 'Add Workflow Step';
        stepEditIdInput.value = stepId || '';
        stepTypeSelect.value = step ? step.type : 'approval';
        stepDescriptionInput.value = step ? step.description : '';
        stepHelpTextInput.value = step ? step.helpText || '' : '';
        stepResponsiblePartyInput.value = step ? step.responsibleParty || '' : '';
        stepNotifyEmailInput.value = step ? step.notifyEmail || '' : '';

        updateModalFieldsForType(stepTypeSelect.value);

        populateNextStepSelect(stepNextSingleSelect, workflow, stepId, step ? step.next : '');
        populateNextStepSelect(stepNextPositiveSelect, workflow, stepId, step && step.outcomes ? step.outcomes.positive : '');
        populateNextStepSelect(stepNextNegativeSelect, workflow, stepId, step && step.outcomes ? step.outcomes.negative : '');

        // Changing the first step is done by marking another step as first, never by unchecking.
        const isFirst = !workflow.firstStepId || (stepId && workflow.firstStepId === stepId);
        stepIsFirstCheckbox.checked = !!isFirst;
        stepIsFirstCheckbox.disabled = !!(stepId && workflow.firstStepId === stepId);
        deleteStepBtn.classList.toggle('d-none', !step);

        stepModal.show();
    }

    saveStepBtn.addEventListener('click', () => {
        const description = stepDescriptionInput.value.trim();
        if (!description) {
            window.alert('Please provide a step description.');
            return;
        }
        const type = stepTypeSelect.value;
        const meta = STEP_TYPES[type];
        if (type === 'notify' && !stepNotifyEmailInput.value.trim()) {
            window.alert('Please provide an email address to notify.');
            return;
        }

        const existingId = stepEditIdInput.value || null;
        const id = existingId || genId();

        const step = {
            id, type, description,
            helpText: stepHelpTextInput.value.trim()
        };
        if (meta.decision) {
            step.responsibleParty = stepResponsiblePartyInput.value.trim();
            step.outcomes = {
                positive: stepNextPositiveSelect.value || null,
                negative: stepNextNegativeSelect.value || null
            };
        } else if (type === 'notify') {
            step.notifyEmail = stepNotifyEmailInput.value.trim();
            step.next = stepNextSingleSelect.value || null;
        } else if (meta.terminal) {
            step.next = null;
        } else {
            step.responsibleParty = stepResponsiblePartyInput.value.trim();
            step.next = stepNextSingleSelect.value || null;
        }

        modalWorkflow.steps[id] = step;
        if (stepIsFirstCheckbox.checked) modalWorkflow.firstStepId = id;

        stepModal.hide();
        refreshDraftFlow();
    });

    deleteStepBtn.addEventListener('click', () => {
        const stepId = stepEditIdInput.value;
        if (!stepId) return;
        stepModal.hide();
        deleteStep(modalWorkflow, stepId);
    });

    function deleteStep(workflow, stepId) {
        if (!window.confirm('Delete this workflow step? Any steps pointing to it will be set to "End of Workflow".')) return;

        delete workflow.steps[stepId];
        if (workflow.firstStepId === stepId) workflow.firstStepId = null;

        Object.values(workflow.steps).forEach((step) => {
            if (step.next === stepId) step.next = null;
            if (step.outcomes) {
                if (step.outcomes.positive === stepId) step.outcomes.positive = null;
                if (step.outcomes.negative === stepId) step.outcomes.negative = null;
            }
        });

        refreshDraftFlow();
    }

    // ---- Init ---------------------------------------------------------------

    renderActiveWorkflow();
    renderScheduledBanner();
});
