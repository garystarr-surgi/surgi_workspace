(function () {

  // ==========================
  // CONFIG
  // ==========================
  const SALES_ROLE = "Sales User";
  const ADMIN_ROLE = "System Manager";
  const SALES_WORKSPACE = "selling";

  const REMOVE_ITEMS = [
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

  function isSalesUser() {
    return hasRole(SALES_ROLE) && !hasRole(ADMIN_ROLE);
  }

  // ==========================
  // FORCE SALES WORKSPACE
  // ==========================
  function enforceWorkspace() {
    if (!frappe?.set_route) return;

    if (!window.location.pathname.startsWith(`/app/${SALES_WORKSPACE}`)) {
      frappe.set_route(SALES_WORKSPACE);
    }
  }

  // ==========================
  // CLEAN DROPDOWN MENUS
  // ==========================
  function cleanMenus() {
    if (!frappe?.ui?.toolbar?.user_menu) return;

    const menu = frappe.ui.toolbar.user_menu;

    REMOVE_ITEMS.forEach(label => {
      try {
        menu.remove_item(label);
      } catch (e) {
        // already removed
      }
    });
  }

  // ==========================
  // INIT
  // ==========================
  function init() {
    if (!frappe?.user_roles) {
      setTimeout(init, 200);
      return;
    }

    if (!isSalesUser()) return;

    // Wait for toolbar to mount
    const wait = setInterval(() => {
      if (frappe?.ui?.toolbar?.user_menu) {
        clearInterval(wait);
        cleanMenus();
        enforceWorkspace();
      }
    }, 100);

    // Re-apply once on route change (Vue remount)
    if (frappe.router) {
      frappe.router.on("change", () => {
        setTimeout(cleanMenus, 100);
      });
    }
  }

  init();

})();
