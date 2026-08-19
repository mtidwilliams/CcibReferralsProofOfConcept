// Dynamic "JD" inputs for the create-referral form.
// Starts with a single "First JD" input and lets the user add more on demand.
document.addEventListener('partials:loaded', () => {
    const container = document.getElementById('jdContainer');
    const addBtn = document.getElementById('addJdBtn');
    if (!container || !addBtn) return;

    const ordinals = [
        'First', 'Second', 'Third', 'Fourth', 'Fifth',
        'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'
    ];

    const ordinalLabel = (index) => ordinals[index] || `JD ${index + 1}`;

    function addJdInput() {
        const index = container.querySelectorAll('.jd-row').length;
        const label = `${ordinalLabel(index)} JD`;
        const id = `jd${index + 1}`;

        const row = document.createElement('div');
        row.className = 'row mb-3 jd-row';

        const col = document.createElement('div');
        col.className = 'col-4';

        const labelEl = document.createElement('label');
        labelEl.className = 'form-label';
        labelEl.setAttribute('for', id);
        labelEl.textContent = label;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control jd-input';
        input.id = id;
        input.placeholder = label;
        if (index === 0) input.required = true;

        col.appendChild(labelEl);
        col.appendChild(input);
        row.appendChild(col);
        container.appendChild(row);
    }

    addBtn.addEventListener('click', addJdInput);
});
