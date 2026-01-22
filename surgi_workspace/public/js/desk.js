(function () {
  // ==========================
  // CONFIG
  // ==========================
  const SALES_ROLE = "Sales User";
  const ALLOWED_WORKSPACE = "Selling";

  const BLOCKED_MENU_ITEMS = [
    "Workspaces",
    "Desktop",
    "Website",
    "Help",
    "Session Defaults",
  ];

  // ==========================
  // HELPERS
  // ==========================
  function isSalesUser() {
    return (
      window.frappe &&
      frappe.user_roles &&
      frappe.user_roles.includes(SALES_ROLE)
    );
  }

  function currentRoute() {
    return frappe.get_route && frappe.get_route();
  }

  function isInSelling() {
    const route = currentRoute();
    return route && route[0] === "workspace" && route[1] === ALLOWED_WORKSPACE;
  }

  // ==========================
  // FORCE SELLING WORKSPACE
  // ==========================
  function forceSellingWorkspace() {
    if (!isSalesUser()) return;

    if (!isInSelling()) {
      frappe.set_route("workspace", ALLOWED_WORKSPACE);
    }
  }

  // ==========================
  // CLEAN SIDEBAR DROPDOWN
  // ==========================
  function cleanSidebarDropdown() {
    if (!isSalesUser()) return;

    // v16 toolbar dropdown
    const menu = document.querySelector(".navbar .dropdown-menu");
    if (!menu) return;

    const items = menu.querySelectorAll("li");

    items.forEach((li) => {
      const text = li.innerText?.trim();
      if (!text) return;

      if (BLOCKED_MENU_ITEMS.includes(text)) {
        li.remove(); // safest: remove entirely
      }
    });
  }

  // ==========================
  // INIT
  // ==========================
  function initSalesLock() {
    if (!isSalesUser()) return;

    // Initial enforcement
    forceSellingWorkspace();
    cleanSidebarDropdown();

    // Re-apply after route changes
    frappe.router.on("change", () => {
      setTimeout(() => {
        forceSellingWorkspace();
        cleanSidebarDropdown();
      }, 300);
    });
  }

  // ==========================
  // BOOTSTRAP
  // ==========================
  frappe.after_ajax(() => {
    setTimeout(initSalesLock, 500);
  });
})();
