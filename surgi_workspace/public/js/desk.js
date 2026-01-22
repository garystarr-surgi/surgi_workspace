(function () {

  // ==========================
  // CONFIG
  // ==========================
  const SALES_ROLE = "Sales User";
  const ADMIN_ROLE = "System Manager";
  const SALES_WORKSPACE = "selling";

  const BLOCKED_ROUTES = [
    "/app/workspace",
    "/app/workspaces",
    "/app/desktop",
    "/app/website"
  ];

  const BLOCKED_MENU_TEXT = [
    "workspace",
    "desktop",
    "website",
    "help",
    "session defaults"
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

  function isSalesUser() {
    return hasRole(SALES_ROLE) && !isAdmin();
  }

  // ==========================
  // FORCE SALES WORKSPACE
  // ==========================
  function enforceSalesWorkspace() {
    if (!frappe?.set_route) return;

    if (!window.location.pathname.startsWith(`/app/${SALES_WORKSPACE}`)) {
      frappe.set_route(SALES_WORKSPACE);
    }
  }

  // ==========================
  // BLOCK FORBIDDEN LINKS
  // ==========================
  function blockNavigation() {
    document.addEventListener("click", (e) => {
      if (!isSalesUser()) return;

      const link = e.target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href") || "";
      const text = (link.innerText || "").toLowerCase();

      // Allow safe actions
      if (
        text.includes("reload") ||
        text.includes("toggle") ||
        text.includes("theme") ||
        text.includes("logout")
      ) {
        return;
      }

      if (
        BLOCKED_ROUTES.some(r => href.startsWith(r)) ||
        BLOCKED_MENU_TEXT.some(t => text.includes(t))
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();

        frappe.show_alert({
          message: __("Access restricted"),
          indicator: "red"
        });

        enforceSalesWorkspace();
        return false;
      }
    }, true);
  }

  // ==========================
  // LOCK ROUTER (CRITICAL)
  // ==========================
  function lockRouter() {
    if (!frappe?.router) return;

    frappe.router.on("change", (route) => {
      if (!isSalesUser()) return;

      const path = route.join("/");

      if (
        path.startsWith("workspace") ||
        path.startsWith("desktop") ||
        path.startsWith("website")
      ) {
        enforceSalesWorkspace();
      }
    });
  }

  // ==========================
  // AUTO-CLOSE WORKSPACE DROPDOWN
  // ==========================
  function autoCloseDropdown() {
    document.addEventListener("click", () => {
      if (!isSalesUser()) return;

      document.querySelectorAll(".dropdown-menu.show").forEach(menu => {
        const text = menu.innerText.toLowerCase();

        if (
          text.includes("workspace") ||
          text.includes("desktop") ||
          text.includes("website")
        ) {
          menu.classList.remove("show");
        }
      });
    }, true);
  }

  // ==========================
  // CLEAN USER MENU (TOOLBAR)
  // ==========================
  function cleanUserMenu() {
    if (!frappe?.ui?.toolbar?.user_menu) return;

    const menu = frappe.ui.toolbar.user_menu;

    [
      "Workspaces",
      "Desktop",
      "Website",
      "Help",
      "Session Defaults"
    ].forEach(label => {
      try {
        menu.remove_item(label);
      } catch (e) {}
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

    // Wait for toolbar
    const waitForToolbar = setInterval(() => {
      if (frappe?.ui?.toolbar?.user_menu) {
        clearInterval(waitForToolbar);
        cleanUserMenu();
      }
    }, 100);

    blockNavigation();
    lockRouter();
    autoCloseDropdown();

    // Enforce on load + Vue rebuilds
    setInterval(enforceSalesWorkspace, 500);
  }

  init();

})();
