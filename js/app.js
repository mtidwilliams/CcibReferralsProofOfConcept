// Reproduces the sidebar collapse toggle that CCIB ships in its webpack bundle.
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('sidebarCollapse');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');

    toggle?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        content.classList.toggle('active');
    });
});
