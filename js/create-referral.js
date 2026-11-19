// Dynamic referral recipient dropdowns for the create-referral form.
// The "Add Recipient" button adds a Judicial District dropdown.
// Once a JD is selected, a Program dropdown appears with programs specific to that JD.
document.addEventListener('partials:loaded', () => {
    const container = document.getElementById('jdContainer');
    const addBtn = document.getElementById('addRecipientBtn');
    const emptyRow = document.getElementById('noRecipientRow');
    if (!container || !addBtn) return;

    // Real JD and Program data from current referrals
    const jdProgramMap = {
        '02': { name: '02', programs: ['Independence House - Pecos'] },
        '04': { name: '04', programs: ['ComCor, Inc.'] },
        '06': { name: '06', programs: ['Advantage Treatment Center - Durango'] },
        '12': { name: '12', programs: ['Advantage Treatment Center - Alamosa'] },
        '19': { name: '19', programs: ['ICCS - Weld'] }
    };

    // Only used to give each recipient's dropdowns unique ids.
    let recipientCount = 0;

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

        // Program dropdown (initially hidden)
        const programLabelDiv = document.createElement('div');
        programLabelDiv.className = 'mb-3 program-container';
        programLabelDiv.style.display = 'none';

        const programLabel = document.createElement('label');
        programLabel.htmlFor = programSelectId;
        programLabel.className = 'form-label';
        programLabel.textContent = 'Program';

        const programSelect = document.createElement('select');
        programSelect.id = programSelectId;
        programSelect.className = 'form-select program-select';

        const programPlaceholder = document.createElement('option');
        programPlaceholder.value = '';
        programPlaceholder.disabled = true;
        programPlaceholder.selected = true;
        programPlaceholder.textContent = 'Select a program…';
        programSelect.appendChild(programPlaceholder);

        programLabelDiv.append(programLabel, programSelect);

        // Event listener for JD selection
        jdSelect.addEventListener('change', (e) => {
            const selectedJd = e.target.value;
            if (selectedJd && jdProgramMap[selectedJd]) {
                const programs = jdProgramMap[selectedJd].programs;
                programSelect.innerHTML = '';
                const placeholder = document.createElement('option');
                placeholder.value = '';
                placeholder.disabled = true;
                placeholder.selected = true;
                placeholder.textContent = 'Select a program…';
                programSelect.appendChild(placeholder);

                programs.forEach(prog => {
                    const option = document.createElement('option');
                    option.value = prog;
                    option.textContent = prog;
                    programSelect.appendChild(option);
                });

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

