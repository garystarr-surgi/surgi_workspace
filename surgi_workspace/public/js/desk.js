(function () {
  // ==========================
  // CONFIG
  // ==========================
  const SALES_ROLE = "Sales User";
  const ADMIN_ROLE = "System Manager";

  const BLOCKED_MENU_ITEMS = [
    "Workspaces",
    "Desktop",
    "Website",
    "Help",
    "Session Defaults"
  ];

  // ==========================
  // HELPERS
  // ==========================
  function hasRole(role) {
    return frappe?.user_roles?.includes(role);
  }

  function isAdmin() {
    return hasRole(ADMIN_ROLE);
  }

  // ==========================
  // REMOVE USER MENU ITEMS (v16)
  // ==========================
  function cleanUserMenu() {
    if (!frappe?.ui?.toolbar?.user_menu) return;

    const menu = frappe.ui.toolbar.user_menu;

    BLOCKED_MENU_ITEMS.forEach(label => {
      try {
        menu.remove_item(label);
      } catch (e) {
        // Ignore if already removed
      }
    });
  }

  // ==========================
  // FORCE SALES WORKSPACE
  // ==========================
  function enforceLanding() {
    if (!frappe?.set_route) return;
    if (!window.location.pathname.startsWith("/app/selling")) {
      frappe.set_route("selling");
    }
  }

  // ==========================
  // INIT
  // ==========================
  function init() {
    if (!frappe?.user_roles) {
      setTimeout(init, 200);
      return;
    }

    if (isAdmin()) return;
    if (!hasRole(SALES_ROLE)) return;

    // Run once toolbar exists
    const waitForToolbar = setInterval(() => {
      if (frappe?.ui?.toolbar?.user_menu) {
        clearInterval(waitForToolbar);
        cleanUserMenu();
        enforceLanding();
      }
    }, 100);

    // Re-apply on route change (Vue rebuilds menu)
    if (frappe.router) {
      frappe.router.on("change", () => {
        setTimeout(cleanUserMenu, 100);
      });
    }
  }

  init();
})();
