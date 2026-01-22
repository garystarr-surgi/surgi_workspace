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
  // HIDE/DISABLE WORKSPACE SIDEBAR DROPDOWN (v16)
  // ==========================
  function hideWorkspaceDropdown() {
    // Hide the workspace selector dropdown at the top of the sidebar
    const selectors = [
      '.workspace-selector',
      '.sidebar-workspace-selector',
      '.workspace-switcher',
      '.sidebar-header .dropdown',
      '.desk-sidebar .dropdown-toggle',
      '.sidebar-column .dropdown-toggle',
      '[data-label="Switch Workspace"]',
      '.workspace-dropdown',
      '.workspace-selector-dropdown',
      '.sidebar-workspace-switcher',
      // ERPNext v16 specific selectors
      '.desk-sidebar .workspace-selector',
      '.sidebar-column .workspace-selector',
      '.workspace-header .dropdown',
      '.workspace-header .dropdown-toggle'
    ];

    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (!el.dataset.hidden) {
            el.dataset.hidden = "1";
            el.style.display = "none";
            el.style.visibility = "hidden";
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            el.setAttribute('aria-hidden', 'true');
          }
        });
      } catch (e) {
        // Ignore invalid selectors
      }
    });

    // Hide workspace switcher buttons/icons in sidebar header
    const headerSelectors = [
      '.sidebar-header',
      '.desk-sidebar-header',
      '.workspace-header',
      '.sidebar-column > .header',
      '.desk-sidebar > .header'
    ];

    headerSelectors.forEach(headerSelector => {
      try {
        const headers = document.querySelectorAll(headerSelector);
        headers.forEach(header => {
          // Find all buttons, links, and dropdowns in the header
          const interactiveElements = header.querySelectorAll('button, a, .dropdown, .dropdown-toggle, [role="button"]');
          interactiveElements.forEach(el => {
            // Skip if it's user menu or avatar
            if (el.closest('.user-menu') || el.closest('.avatar') || el.closest('.user-avatar')) {
              return;
            }

            const text = (el.innerText || el.textContent || '').toLowerCase();
            const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
            const title = (el.getAttribute('title') || '').toLowerCase();
            const className = (el.className || '').toLowerCase();

            // Check if it's related to workspace switching
            if (text.includes('workspace') || ariaLabel.includes('workspace') || title.includes('workspace') ||
                text.includes('switch') || ariaLabel.includes('switch') || title.includes('switch') ||
                className.includes('workspace') || className.includes('switcher') ||
                el.hasAttribute('data-workspace') || el.hasAttribute('data-workspace-selector')) {
              if (!el.dataset.hidden) {
                el.dataset.hidden = "1";
                el.style.display = "none";
                el.style.visibility = "hidden";
                el.style.opacity = "0";
                el.style.pointerEvents = "none";
                el.setAttribute('aria-hidden', 'true');
              }
            }
          });
        });
      } catch (e) {
        // Ignore errors
      }
    });

    // Hide any dropdown menus that are open and related to workspace selection
    const openDropdowns = document.querySelectorAll('.dropdown-menu.show, .dropdown-menu[style*="display"]');
    openDropdowns.forEach(menu => {
      const menuText = (menu.innerText || '').toLowerCase();
      if (menuText.includes('workspace') && !menu.dataset.hidden) {
        menu.style.display = "none";
        menu.style.visibility = "hidden";
      }
    });
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
    hideWorkspaceDropdown();
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
