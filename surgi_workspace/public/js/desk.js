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
  // HIDE/DISABLE WORKSPACE SIDEBAR DROPDOWN (v16 - AGGRESSIVE)
  // ==========================
  function hideWorkspaceDropdown() {
    // Find the sidebar element - try multiple common selectors
    const sidebarSelectors = [
      'aside[class*="sidebar"]',
      '.desk-sidebar',
      '.sidebar-column',
      '[class*="sidebar"]',
      'nav[class*="sidebar"]',
      '.standard-sidebar',
      '.workspace-sidebar'
    ];

    let sidebar = null;
    for (const selector of sidebarSelectors) {
      sidebar = document.querySelector(selector);
      if (sidebar) break;
    }

    if (!sidebar) return;

    // Hide any dropdown/button in the first section of sidebar (typically the header/selector area)
    // This targets the workspace selector which is usually the first interactive element
    const firstSection = sidebar.querySelector(':scope > *:first-child, :scope > header, :scope > .header, :scope > [class*="header"]');
    
    if (firstSection) {
      // Find all interactive elements in the first section
      const interactiveElements = firstSection.querySelectorAll(
        'button, a, [role="button"], [role="combobox"], .dropdown, .dropdown-toggle, [class*="dropdown"], [class*="select"], select'
      );

      interactiveElements.forEach(el => {
        // Skip user menu, avatar, logout
        if (el.closest('.user-menu') || 
            el.closest('.avatar') || 
            el.closest('.user-avatar') ||
            el.closest('[class*="user"]') ||
            el.textContent?.toLowerCase().includes('logout') ||
            el.getAttribute('aria-label')?.toLowerCase().includes('user') ||
            el.getAttribute('aria-label')?.toLowerCase().includes('logout')) {
          return;
        }

        // Hide it - this is likely the workspace selector
        if (!el.dataset.hidden) {
          el.dataset.hidden = "1";
          el.style.cssText = "display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;";
          el.setAttribute('aria-hidden', 'true');
          el.setAttribute('tabindex', '-1');
        }
      });
    }

    // Also target common workspace selector patterns
    const workspaceSelectors = [
      // Class-based selectors
      '.workspace-selector',
      '.sidebar-workspace-selector',
      '.workspace-switcher',
      '.workspace-dropdown',
      '.workspace-selector-dropdown',
      '[class*="workspace-selector"]',
      '[class*="workspace-switcher"]',
      '[class*="workspace-dropdown"]',
      // Data attribute selectors
      '[data-workspace]',
      '[data-workspace-selector]',
      '[data-workspace-switcher]',
      '[data-label*="Workspace" i]',
      '[data-label*="Switch" i]',
      '[aria-label*="workspace" i]',
      '[aria-label*="switch" i]',
      // Position-based: first button/dropdown in sidebar (excluding user menu)
      'aside button:first-of-type:not([class*="user"]):not([class*="avatar"])',
      'aside .dropdown:first-of-type:not([class*="user"])',
      'aside [role="combobox"]:first-of-type',
      // Frappe UI specific patterns
      '[data-testid*="workspace"]',
      '[data-testid*="selector"]',
      '.frappe-control[class*="workspace"]',
      // Vue component patterns
      '[data-v-] [class*="workspace-selector"]',
      '[data-v-] [class*="workspace-switcher"]'
    ];

    workspaceSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Skip user menu area
          if (el.closest('.user-menu') || el.closest('[class*="user-menu"]')) {
            return;
          }

          if (!el.dataset.hidden) {
            el.dataset.hidden = "1";
            el.style.cssText = "display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;";
            el.setAttribute('aria-hidden', 'true');
            el.setAttribute('tabindex', '-1');
          }
        });
      } catch (e) {
        // Ignore invalid selectors
      }
    });

    // Hide any open dropdown menus that might be workspace selectors
    const openDropdowns = document.querySelectorAll(
      '.dropdown-menu.show, .dropdown-menu[style*="display"], [class*="dropdown-menu"][class*="show"]'
    );
    openDropdowns.forEach(menu => {
      const menuText = (menu.innerText || menu.textContent || '').toLowerCase();
      const menuParent = menu.closest('aside, .sidebar, [class*="sidebar"]');
      
      // If dropdown is in sidebar and contains workspace-related text, hide it
      if (menuParent && (menuText.includes('workspace') || menuText.includes('switch'))) {
        menu.style.cssText = "display: none !important; visibility: hidden !important;";
      }
    });

    // Nuclear option: Hide the first non-user interactive element in sidebar
    if (sidebar) {
      const allInteractive = sidebar.querySelectorAll(
        'button, a, [role="button"], [role="combobox"], .dropdown, .dropdown-toggle'
      );
      
      for (const el of allInteractive) {
        // Skip user menu, avatar, logout
        if (el.closest('.user-menu') || 
            el.closest('.avatar') || 
            el.closest('[class*="user-menu"]') ||
            el.closest('[class*="avatar"]') ||
            el.textContent?.toLowerCase().includes('logout')) {
          continue;
        }

        // If this is the first interactive element (likely workspace selector), hide it
        const rect = el.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();
        
        // Check if element is in the top 20% of sidebar (where workspace selector usually is)
        if (rect.top < sidebarRect.top + (sidebarRect.height * 0.2)) {
          if (!el.dataset.hidden) {
            el.dataset.hidden = "1";
            el.style.cssText = "display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;";
            el.setAttribute('aria-hidden', 'true');
            el.setAttribute('tabindex', '-1');
          }
        }
      }
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
    hideWorkspaceDropdown();
    disableMenuItems(rule);
    lockDeskSidebar();
  }

  // ==========================
  // INJECT CSS TO HIDE WORKSPACE SELECTOR (v16)
  // ==========================
  function injectHidingCSS() {
    const styleId = 'surgi-workspace-hide-selector';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Hide workspace selector in sidebar - Sales Users only */
      aside[class*="sidebar"] > *:first-child button:not([class*="user"]):not([class*="avatar"]):not([class*="logout"]),
      aside[class*="sidebar"] > *:first-child .dropdown:not([class*="user"]),
      aside[class*="sidebar"] > *:first-child [role="combobox"]:not([class*="user"]),
      .workspace-selector,
      [class*="workspace-selector"],
      [class*="workspace-switcher"],
      [data-workspace-selector],
      [data-workspace-switcher],
      [aria-label*="workspace" i]:not([aria-label*="user" i]):not([aria-label*="logout" i]) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
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

    // Inject CSS for additional hiding support
    injectHidingCSS();

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
