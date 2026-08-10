// Client Referral demo: adds submitted referrals to an in-memory table.
// Waits for the referral partial to be injected before wiring up the form.
document.addEventListener('partials:loaded', () => {
    const form = document.getElementById('referralForm');
    if (!form) return;
    const list = document.getElementById('referralList');
    const emptyRow = document.getElementById('noReferralsRow');
    const countBadge = document.getElementById('referralCount');
    let count = 0;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const clientName = document.getElementById('clientName').value.trim();
        const program = document.getElementById('program').value;
        const notes = document.getElementById('notes').value.trim();
        if (!clientName || !program) return;

        emptyRow?.remove();

        const row = document.createElement('tr');
        [clientName, program, notes || '—'].forEach((value) => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });
        list.appendChild(row);

        countBadge.textContent = String(++count);
        form.reset();
    });
});
