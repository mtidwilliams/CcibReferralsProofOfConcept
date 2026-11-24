// Loads HTML partials referenced via [data-include] and notifies listeners when done.
async function loadIncludes(root) {
    const hosts = root.querySelectorAll('[data-include]');
    await Promise.all(Array.from(hosts).map(async (host) => {
        const url = host.getAttribute('data-include');
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
            host.innerHTML = await response.text();
            // Resolve any partials nested within the one we just loaded.
            await loadIncludes(host);
        } catch (err) {
            console.error(`Failed to load partial: ${url}`, err);
        }
    }));
}

// The sidebar is shared, so highlight whichever item lists the current page.
function markCurrentNavItem() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('[data-nav-pages]').forEach((item) => {
        if (!item.dataset.navPages.split(' ').includes(page)) return;
        item.classList.add('active');
        const hint = document.createElement('span');
        hint.className = 'visually-hidden';
        hint.textContent = 'Current Page';
        item.querySelector('.nav-link')?.appendChild(hint);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadIncludes(document);
    markCurrentNavItem();
    // Bootstrap tooltips are opt-in, so initialize them once partial markup exists.
    if (window.bootstrap) {
        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
            bootstrap.Tooltip.getOrCreateInstance(el);
        });
    }
    document.dispatchEvent(new CustomEvent('partials:loaded'));
});
