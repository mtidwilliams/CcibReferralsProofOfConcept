// Dynamic referral recipient dropdowns for the create-referral form.
// The "Add Recipient" button adds a Judicial District dropdown.
// Once a JD is selected, a Program multi-select appears with programs specific to that JD.
document.addEventListener('partials:loaded', () => {
    const container = document.getElementById('jdContainer');
    const addBtn = document.getElementById('addRecipientBtn');
    const emptyRow = document.getElementById('noRecipientRow');
    if (!container || !addBtn) return;

    // Real JD and Program data from current referrals
    const jdProgramMap = {
        '01': { name: '01', programs: ['Intervention Community Corrections Services - Jefferson', 'Intervention Community Corrections Services - West'] },
        '02': { name: '02', programs: ['IMPACT Center', 'Independence House - North Non-Res', 'Independence House - Pecos', 'Moore Center', 'Project Elevate'] },
        '04': { name: '04', programs: ['ComCor, Inc.', 'GEO - Community Alternatives of El Paso County'] },
        '06': { name: '06', programs: ['Advantage Treatment Center - Durango'] },
        '07': { name: '07', programs: ['Advantage Treatment Center - Montrose'] },
        '08': { name: '08', programs: ['Larimer County Community Corrections'] },
        '09': { name: '09', programs: ['Garfield County Community Corrections'] },
        '10': { name: '10', programs: ['Intervention Community Corrections Services - Pueblo'] },
        '12': { name: '12', programs: ['Advantage Treatment Center - Alamosa'] },
        '13': { name: '13', programs: ['Advantage Treatment Center - Sterling'] },
        '15': { name: '15', programs: ['Advantage Treatment Center - Lamar'] },
        '17': { name: '17', programs: ['CoreCivic - Adams Transitional Center', 'CoreCivic - Commerce Transitional Center', 'Intervention Community Corrections Services - Adams'] },
        '18': { name: '18', programs: ['CoreCivic - Arapahoe Community Treatment Center', 'CoreCivic - Centennial Community Transition Center', 'GEO - Arapahoe County Residential Center'] },
        '19': { name: '19', programs: ['Intervention Community Corrections Services - Weld'] },
        '20': { name: '20', programs: ['Joe Pelle Center'] },
        '21': { name: '21', programs: ['Mesa County Community Corrections'] }
    };

    // Only used to give each recipient's dropdowns unique ids.
    let recipientCount = 0;

    // Checkbox dropdown that shows selected programs as removable chips.
    // Selections are mirrored into a hidden <select multiple> so they post with the form.
    function createProgramMultiSelect(id, labelId) {
        const wrapper = document.createElement('div');
        wrapper.className = 'dropdown program-multiselect';

        const toggle = document.createElement('div');
        toggle.id = `${id}-toggle`;
        toggle.className = 'form-select program-multiselect-toggle';
        toggle.tabIndex = 0;
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('aria-labelledby', labelId);
        toggle.setAttribute('aria-expanded', 'false');
        toggle.dataset.bsToggle = 'dropdown';
        toggle.dataset.bsAutoClose = 'outside';

        const menu = document.createElement('div');
        menu.className = 'dropdown-menu w-100 p-2';

        const hiddenSelect = document.createElement('select');
        hiddenSelect.id = id;
        hiddenSelect.name = id;
        hiddenSelect.multiple = true;
        hiddenSelect.className = 'd-none program-select';

        let selectAll = null;

        function checkboxes() {
            return [...menu.querySelectorAll('input[data-program]')];
        }

        function setSelected(program, isSelected) {
            const option = [...hiddenSelect.options].find(o => o.value === program);
            if (option) option.selected = isSelected;
            render();
        }

        function render() {
            const selected = [...hiddenSelect.selectedOptions].map(o => o.value);

            toggle.innerHTML = '';
            if (selected.length === 0) {
                const placeholder = document.createElement('span');
                placeholder.className = 'text-muted';
                placeholder.textContent = 'Select programs…';
                toggle.appendChild(placeholder);
            } else {
                selected.forEach(program => {
                    const chip = document.createElement('span');
                    chip.className = 'badge text-bg-primary program-chip';
                    chip.textContent = program;

                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'btn-close btn-close-white';
                    removeBtn.setAttribute('aria-label', `Remove ${program}`);
                    removeBtn.addEventListener('click', (e) => {
                        // Keep the click from also opening/closing the dropdown
                        e.stopPropagation();
                        setSelected(program, false);
                    });

                    chip.appendChild(removeBtn);
                    toggle.appendChild(chip);
                });
            }

            checkboxes().forEach(cb => {
                cb.checked = selected.includes(cb.dataset.program);
            });
            if (selectAll) {
                selectAll.checked = selected.length === hiddenSelect.options.length;
                selectAll.indeterminate = selected.length > 0 && !selectAll.checked;
            }
        }

        function addCheckbox(inputId, text, onChange, extraClass = '') {
            const item = document.createElement('div');
            item.className = `form-check dropdown-item-text ${extraClass}`.trim();

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'form-check-input';
            input.id = inputId;
            input.addEventListener('change', onChange);

            const label = document.createElement('label');
            label.className = 'form-check-label w-100';
            label.htmlFor = inputId;
            label.textContent = text;

            item.append(input, label);
            menu.appendChild(item);
            return input;
        }

        function setOptions(programs) {
            hiddenSelect.innerHTML = '';
            menu.innerHTML = '';
            selectAll = null;

            if (programs.length > 1) {
                selectAll = addCheckbox(`${id}-all`, 'Select all', (e) => {
                    [...hiddenSelect.options].forEach(o => { o.selected = e.target.checked; });
                    render();
                }, 'fw-semibold');
                const divider = document.createElement('hr');
                divider.className = 'dropdown-divider';
                menu.appendChild(divider);
            }

            programs.forEach((program, i) => {
                hiddenSelect.appendChild(new Option(program, program));
                const input = addCheckbox(`${id}-opt-${i}`, program, (e) => setSelected(program, e.target.checked));
                input.dataset.program = program;
            });

            render();
        }

        // A div toggle doesn't open on Enter/Space by default like a button would
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                bootstrap.Dropdown.getOrCreateInstance(toggle).toggle();
            }
        });

        // Toggle and menu must be adjacent siblings for Bootstrap's dropdown
        wrapper.append(toggle, menu, hiddenSelect);
        render();

        return { element: wrapper, setOptions };
    }

    function createRecipientCard() {
        recipientCount++;
        const cardId = `recipient-card-${recipientCount}`;
        const jdSelectId = `recipient-jd-${recipientCount}`;
        const programSelectId = `recipient-program-${recipientCount}`;

        const col = document.createElement('div');
        col.className = 'col-md-6';
        col.dataset.recipientId = cardId;

        const card = document.createElement('div');
        card.className = 'card border p-3';

        const header = document.createElement('div');
        header.className = 'd-flex justify-content-end align-items-end mb-0';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-sm btn-outline-danger';
        removeBtn.title = 'Remove Recipient';
        removeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            col.remove();
            updateEmptyState();
        });

        header.append(removeBtn);

        // JD dropdown
        const jdLabelDiv = document.createElement('div');
        jdLabelDiv.className = 'mb-3';

        const jdLabel = document.createElement('label');
        jdLabel.htmlFor = jdSelectId;
        jdLabel.className = 'form-label';
        jdLabel.textContent = 'Judicial District (JD)';

        const jdSelect = document.createElement('select');
        jdSelect.id = jdSelectId;
        jdSelect.className = 'form-select jd-select';
        jdSelect.required = true;

        const jdPlaceholder = document.createElement('option');
        jdPlaceholder.value = '';
        jdPlaceholder.disabled = true;
        jdPlaceholder.selected = true;
        jdPlaceholder.textContent = 'Select a JD…';
        jdSelect.appendChild(jdPlaceholder);

        Object.keys(jdProgramMap).sort((a, b) => Number(a) - Number(b)).forEach(jd => {
            const option = document.createElement('option');
            option.value = jd;
            option.textContent = jdProgramMap[jd].name;
            jdSelect.appendChild(option);
        });

        jdLabelDiv.append(jdLabel, jdSelect);

        // Program multi-select (initially hidden)
        const programLabelDiv = document.createElement('div');
        programLabelDiv.className = 'mb-3 program-container';
        programLabelDiv.style.display = 'none';

        const programLabel = document.createElement('label');
        programLabel.id = `${programSelectId}-label`;
        programLabel.className = 'form-label';
        programLabel.textContent = 'Programs';

        const programMulti = createProgramMultiSelect(programSelectId, programLabel.id);
        programLabelDiv.append(programLabel, programMulti.element);

        jdSelect.addEventListener('change', (e) => {
            const selectedJd = e.target.value;
            if (selectedJd && jdProgramMap[selectedJd]) {
                programMulti.setOptions(jdProgramMap[selectedJd].programs);
                programLabelDiv.style.display = 'block';
            } else {
                programLabelDiv.style.display = 'none';
            }
        });

        card.append(header, jdLabelDiv, programLabelDiv);
        col.appendChild(card);
        return col;
    }

    function updateEmptyState() {
        const cards = container.querySelectorAll('[data-recipient-id]');
        if (emptyRow) emptyRow.classList.toggle('d-none', cards.length > 0);
    }

    addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        container.appendChild(createRecipientCard());
        updateEmptyState();
    });
});

