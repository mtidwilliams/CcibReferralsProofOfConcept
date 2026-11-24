// Fills each JD dropdown on the create-transfer form, and shows that JD's programs once one is picked.
document.addEventListener('partials:loaded', () => {
    document.querySelectorAll('select[data-program-target]').forEach((jdSelect) => {
        const programSelect = document.getElementById(jdSelect.dataset.programTarget);
        if (!programSelect) return;

        Object.keys(jdProgramMap).sort((a, b) => Number(a) - Number(b)).forEach((jd) => {
            jdSelect.appendChild(new Option(jdProgramMap[jd].name, jd));
        });

        jdSelect.addEventListener('change', () => {
            const programs = jdProgramMap[jdSelect.value]?.programs ?? [];
            programSelect.innerHTML = '';

            const placeholder = new Option('Select a program…', '');
            placeholder.disabled = true;
            placeholder.selected = true;
            programSelect.appendChild(placeholder);

            programs.forEach((program) => programSelect.appendChild(new Option(program, program)));
            programSelect.disabled = programs.length === 0;
        });
    });
});
