// Dynamic referral recipient dropdowns for the create-referral form.
// The "Add Recipient" dropdown lets the user add either a Program recipient or a
// Judicial District recipient; each recipient's select is filled with the matching list.
document.addEventListener('partials:loaded', () => {
    const container = document.getElementById('jdContainer');
    const addBtn = document.getElementById('addRecipientBtn');
    const emptyRow = document.getElementById('noRecipientRow');
    if (!container || !addBtn) return;

    const ordinals = [
        'First', 'Second', 'Third', 'Fourth', 'Fifth',
        'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'
    ];
    const counties = [
        'Denver', 'El Paso', 'Arapahoe', 'Jefferson', 'Adams',
        'Larimer', 'Douglas', 'Boulder', 'Weld', 'Pueblo'
    ];

    const recipientTypes = {
        program: {
            label: 'Program',
            placeholder: 'Select a program…',
            values: () => counties
        },
        jd: {
            label: 'Judicial District',
            placeholder: 'Select a judicial district…',
            values: () => Array.from({ length: 23 }, (_, i) => String(i + 1))
        }
    };

    const ordinalLabel = (index) => ordinals[index] || `${index + 1}`;

    function populateSelect(select, type) {
        const config = recipientTypes[type];
        select.innerHTML = '';
        const placeholder = new Option(config.placeholder, '', true, true);
        placeholder.disabled = true;
        select.add(placeholder);
        config.values().forEach((value) => select.add(new Option(value, value)));
    }

    function createColumn(type) {
        const col = document.createElement('div');
        col.className = 'col-4 jd-col';
        col.dataset.recipientType = type;

        const label = document.createElement('label');
        label.className = 'form-label';

        const group = document.createElement('div');
        group.className = 'd-flex';

        const select = document.createElement('select');
        select.className = 'form-select jd-input';
        select.required = true;

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
        populateSelect(select, type);
        return col;
    }

    // Re-labels and re-ids every column to match its current position and recipient type.
    function renumber() {
        const columns = container.querySelectorAll('.jd-col');
        if (emptyRow) emptyRow.classList.toggle('d-none', columns.length > 0);
        columns.forEach((col, i) => {
            const id = `recipient${i + 1}`;
            const type = col.dataset.recipientType;
            const label = col.querySelector('.form-label');
            const select = col.querySelector('.jd-input');
            label.textContent = `${ordinalLabel(i)} Recipient (${recipientTypes[type].label})`;
            label.setAttribute('for', id);
            select.id = id;
        });
    }

    addBtn.closest('.dropdown').querySelectorAll('[data-recipient-type]').forEach((item) => {
        item.addEventListener('click', () => {
            container.appendChild(createColumn(item.dataset.recipientType));
            renumber();
        });
    });
});
