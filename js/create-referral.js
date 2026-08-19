// Dynamic referral destination dropdowns for the create-referral form.
// The "Send to program" checkbox switches every dropdown between JD numbers and program (county) names.
document.addEventListener('partials:loaded', () => {
    const container = document.getElementById('jdContainer');
    const addBtn = document.getElementById('addDestinationBtn');
    const addLabel = addBtn?.querySelector('[data-add-label]');
    const programToggle = document.getElementById('sendToProgramToggle');
    if (!container || !addBtn || !programToggle) return;

    const ordinals = [
        'First', 'Second', 'Third', 'Fourth', 'Fifth',
        'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'
    ];
    const counties = [
        'Denver', 'El Paso', 'Arapahoe', 'Jefferson', 'Adams',
        'Larimer', 'Douglas', 'Boulder', 'Weld', 'Pueblo'
    ];

    const isProgram = () => programToggle.checked;
    const modeWord = () => (isProgram() ? 'Program' : 'JD');
    const ordinalLabel = (index) => ordinals[index] || `${index + 1}`;

    const optionValues = () =>
        isProgram() ? counties : Array.from({ length: 23 }, (_, i) => String(i + 1));

    function populateSelect(select) {
        select.innerHTML = '';
        const placeholder = new Option(`Select a ${modeWord()}…`, '', true, true);
        placeholder.disabled = true;
        select.add(placeholder);
        optionValues().forEach((value) => select.add(new Option(value, value)));
    }

    function createColumn() {
        const col = document.createElement('div');
        col.className = 'col-4 jd-col';

        const label = document.createElement('label');
        label.className = 'form-label';

        const group = document.createElement('div');
        group.className = 'd-flex';

        const select = document.createElement('select');
        select.className = 'form-select jd-input';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-outline-danger ms-2';
        removeBtn.title = 'Remove';
        removeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
        removeBtn.addEventListener('click', () => {
            col.remove();
            renumber();
        });

        group.append(select, removeBtn);
        col.append(label, group);
        populateSelect(select);
        return col;
    }

    // Re-labels and re-ids every column to match its current position and mode.
    function renumber() {
        container.querySelectorAll('.jd-col').forEach((col, i) => {
            const id = `destination${i + 1}`;
            const label = col.querySelector('.form-label');
            const select = col.querySelector('.jd-input');
            label.textContent = `${ordinalLabel(i)} ${modeWord()}`;
            label.setAttribute('for', id);
            select.id = id;
        });
    }

    addBtn.addEventListener('click', () => {
        container.appendChild(createColumn());
        renumber();
    });

    programToggle.addEventListener('change', () => {
        if (addLabel) addLabel.textContent = `Add ${modeWord()}`;
        container.querySelectorAll('.jd-input').forEach(populateSelect);
        renumber();
    });
});
