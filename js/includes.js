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

document.addEventListener('DOMContentLoaded', async () => {
    await loadIncludes(document);
    document.dispatchEvent(new CustomEvent('partials:loaded'));
});
