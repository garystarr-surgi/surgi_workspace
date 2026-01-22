(function () {
  // ==========================
  // CONFIGURATION
  // ==========================
  const ROLE_RULES = {
    "Sales User": {
      landing: "selling",
      dropdown_block: [
        "Workspaces",
        "Desktop",
        "Edit Sidebar",
        "Website",
        "Help",
        "Session Defaults"
      ]
    }
  };

  const ADMIN_ROLES = ["System Manager"];

  // ==========================
  // HELPERS
  // ==========================
  function hasRole(role) {
    return frappe?.user_roles?.includes(role) || false;
  }

  function isAdmin() {
    return ADMIN_ROLES.some(hasRole);
  }

  function getActiveRule() {
    for (const role in ROLE_RULES) {
      if (hasRole(role)) return ROLE_RULES[role];
    }
    return null;
  }

  // ==========================
  // FORCE SELLING WORKSPACE
  // ==========================
  function enforceLanding(rule) {
    if (!rule?.landing || !frappe?.set_route) return;

    const target = `/app/${rule.landing}`;
    if (!window.location.pathname.startsWith(target)) {
      frappe.set_route(rule.landing);
    }
  }

  // ==========================
  // DISABLE USER DROPDOWN ITEMS (v16 CORRECT)
  // ==========================
  function disableMenuItems(rule) {
    if (!rule?.dropdown_block) return;

    const block = rule.dropdown_block.map(v => v.toLowerCase());

    document.querySelectorAll('.dropdown-menu-item').forEach(item => {
      const text = item
        .querySelector('.menu-item-title')
        ?.innerText?.trim().toLowerCase();

      if (!text || !block.includes(text)) return;
      if (item.dataset.locked) return;

      item.dataset.locked = "1";
      item.style.opacity = "0.4";
      item.style.pointerEvents = "none";
    });
  }

  // ==========================
  // LOCK LEFT SIDEBAR (SAFE)
  // ==========================
  function lockDeskSidebar() {
    const sidebar = document.querySelector('.desk-sidebar, .sidebar-column');
    if (!sidebar) return;

    sidebar.querySelectorAll('a, button').forEach(el => {
      const text = el.innerText?.toLowerCase() || '';

      // allow logout & avatar
      if (
        text.includes('logout') ||
        el.closest('.user-menu') ||
        el.closest('.avatar')
      ) {
        el.style.pointerEvents = 'auto';
        return;
      }

      el.style.pointerEvents = 'none';
    });
  }

  // ==========================
  // MAIN ENFORCEMENT LOOP
  // ==========================
  function enforce() {
    if (!frappe?.user_roles || isAdmin()) return;

    const rule = getActiveRule();
    if (!rule) return;

    enforceLanding(rule);
    disableMenuItems(rule);
    lockDeskSidebar();
  }

  // ==========================
  // INIT (v16 REQUIRES PERSISTENCE)
  // ==========================
  function init() {
    if (!frappe?.user_roles) {
      setTimeout(init, 200);
      return;
    }

    if (isAdmin()) return;

    // Continuous enforcement (Vue remounts constantly)
    setInterval(enforce, 250);

    // DOM mutation observer
    const observer = new MutationObserver(enforce);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Route changes
    if (frappe.router) {
      frappe.router.on("change", enforce);
    }

    enforce();
  }

  init();
})();
