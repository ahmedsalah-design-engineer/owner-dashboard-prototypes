// Sidebar collapse: toggles the brand row (69:576) to the logo icon (69:612)
// and the nav to icons only. The choice is remembered per browser.
(function () {
  var sidebar = document.getElementById('sidebar');
  var button = sidebar && sidebar.querySelector('.collapse-button');
  if (!button) return;
  var KEY = 'db-sidebar-collapsed';

  function apply(collapsed) {
    sidebar.classList.toggle('is-collapsed', collapsed);
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    sidebar.querySelectorAll('.nav-item').forEach(function (item) {
      if (collapsed) item.setAttribute('title', item.textContent.trim());
      else item.removeAttribute('title');
    });
  }

  var stored = false;
  try { stored = localStorage.getItem(KEY) === '1'; } catch (e) {}
  apply(stored);

  button.addEventListener('click', function () {
    var collapsed = !sidebar.classList.contains('is-collapsed');
    apply(collapsed);
    try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch (e) {}
  });
})();
