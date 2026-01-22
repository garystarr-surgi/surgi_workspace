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
  // HIDE/DISABLE WORKSPACE SIDEBAR DROPDOWN (v16 - NUCLEAR OPTION)
  // ==========================
  function hideWorkspaceDropdown() {
    // Find sidebar - try all possible selectors
    const sidebar = document.querySelector('aside, [class*="sidebar"], .desk-sidebar, .sidebar-column, nav[class*="sidebar"]');
    if (!sidebar) return;

    // Walk through all children of sidebar and hide dropdowns/selectors in the top area
    const walkAndHide = (element, depth = 0, maxDepth = 5) => {
      if (depth > maxDepth) return;
      if (!element || !element.children) return;

      Array.from(element.children).forEach(child => {
        // Skip user menu area completely
        if (child.closest && (
          child.closest('.user-menu') || 
          child.closest('[class*="user-menu"]') ||
          child.closest('[class*="avatar"]') ||
          child.classList.contains('user-menu') ||
          child.classList.contains('avatar')
        )) {
          return;
        }

        const tagName = child.tagName?.toLowerCase();
        const className = child.className?.toLowerCase() || '';
        const id = child.id?.toLowerCase() || '';
        const text = (child.textContent || child.innerText || '').toLowerCase();
        const ariaLabel = (child.getAttribute('aria-label') || '').toLowerCase();
        const role = (child.getAttribute('role') || '').toLowerCase();

        // Check if this looks like a workspace selector
        const isWorkspaceSelector = 
          className.includes('workspace') ||
          className.includes('switcher') ||
          className.includes('selector') ||
          id.includes('workspace') ||
          text.includes('workspace') ||
          ariaLabel.includes('workspace') ||
          ariaLabel.includes('switch') ||
          role === 'combobox' ||
          child.hasAttribute('data-workspace') ||
          child.hasAttribute('data-workspace-selector') ||
          (tagName === 'button' && !text.includes('logout') && !text.includes('user')) ||
          (tagName === 'select') ||
          (className.includes('dropdown') && !className.includes('user'));

        // Get position to check if it's in the top area
        const rect = child.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();
        const isInTopArea = rect.top < sidebarRect.top + (sidebarRect.height * 0.3); // Top 30%

        if (isWorkspaceSelector && isInTopArea && !child.dataset.surgiHidden) {
          // Remove from DOM completely or hide aggressively
          child.dataset.surgiHidden = "1";
          child.style.cssText = "display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; height: 0 !important; width: 0 !important; overflow: hidden !important;";
          child.setAttribute('aria-hidden', 'true');
          child.setAttribute('tabindex', '-1');
          
          // Also prevent any events
          ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(eventType => {
            child.addEventListener(eventType, (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              return false;
            }, true);
          });
        }

        // Recursively check children
        walkAndHide(child, depth + 1, maxDepth);
      });
    };

    // Start walking from sidebar
    walkAndHide(sidebar);

    // Also use querySelector as backup for common patterns
    const commonSelectors = [
      'button[class*="workspace"]',
      '[class*="workspace-selector"]',
      '[class*="workspace-switcher"]',
      '[data-workspace]',
      '[data-workspace-selector]',
      'select',
      '[role="combobox"]',
      '.dropdown:not([class*="user"])',
      '.dropdown-toggle:not([class*="user"])'
    ];

    commonSelectors.forEach(selector => {
      try {
        const elements = sidebar.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.closest('.user-menu') || el.closest('[class*="user-menu"]') || el.closest('[class*="avatar"]')) {
            return;
          }

          const rect = el.getBoundingClientRect();
          const sidebarRect = sidebar.getBoundingClientRect();
          if (rect.top < sidebarRect.top + (sidebarRect.height * 0.3) && !el.dataset.surgiHidden) {
            el.dataset.surgiHidden = "1";
            el.style.cssText = "display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; height: 0 !important; width: 0 !important; overflow: hidden !important;";
            el.setAttribute('aria-hidden', 'true');
            el.setAttribute('tabindex', '-1');
            
            // Prevent events
            ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(eventType => {
              el.addEventListener(eventType, (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
              }, true);
            });
          }
        });
      } catch (e) {
        // Ignore
      }
    });
  }

  // ==========================
  // PREVENT CLICKS ON WORKSPACE SELECTOR (v16)
  // ==========================
  function preventWorkspaceSelectorClicks() {
    // Use event delegation to catch all clicks in sidebar
    document.addEventListener('click', (e) => {
      const target = e.target;
      const sidebar = target.closest('aside, [class*="sidebar"], .desk-sidebar, .sidebar-column');
      
      if (!sidebar) return;
      
      // Skip user menu
      if (target.closest('.user-menu') || target.closest('[class*="user-menu"]') || target.closest('[class*="avatar"]')) {
        return;
      }

      // Check if click is in top area of sidebar
      const sidebarRect = sidebar.getBoundingClientRect();
      if (e.clientY < sidebarRect.top + (sidebarRect.height * 0.3)) {
        // Check if target looks like workspace selector
        const text = (target.textContent || target.innerText || '').toLowerCase();
        const className = (target.className || '').toLowerCase();
        const ariaLabel = (target.getAttribute('aria-label') || '').toLowerCase();
        
        if (text.includes('workspace') || 
            className.includes('workspace') || 
            className.includes('switcher') || 
            className.includes('selector') ||
            ariaLabel.includes('workspace') ||
            ariaLabel.includes('switch') ||
            target.tagName === 'SELECT' ||
            target.getAttribute('role') === 'combobox') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
    }, true); // Use capture phase
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
      /* Hide workspace selector in sidebar - Sales Users only - NUCLEAR OPTION */
      aside button:not([class*="user"]):not([class*="avatar"]):not([class*="logout"]):first-of-type,
      aside > *:first-child button:not([class*="user"]):not([class*="avatar"]):not([class*="logout"]),
      aside > *:first-child > button:not([class*="user"]):not([class*="avatar"]):not([class*="logout"]),
      aside .dropdown:not([class*="user"]):not([class*="avatar"]):first-of-type,
      aside > *:first-child .dropdown:not([class*="user"]):not([class*="avatar"]),
      aside [role="combobox"]:not([class*="user"]):not([class*="avatar"]):first-of-type,
      aside select:not([class*="user"]):not([class*="avatar"]):first-of-type,
      .workspace-selector,
      [class*="workspace-selector"],
      [class*="workspace-switcher"],
      [class*="workspace-dropdown"],
      [data-workspace-selector],
      [data-workspace-switcher],
      [data-workspace],
      [aria-label*="workspace" i]:not([aria-label*="user" i]):not([aria-label*="logout" i]),
      [aria-label*="switch" i]:not([aria-label*="user" i]):not([aria-label*="logout" i]) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
        position: absolute !important;
        left: -9999px !important;
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

    // Prevent clicks on workspace selector
    preventWorkspaceSelectorClicks();

    // Continuous enforcement (Vue remounts constantly)
    setInterval(enforce, 100); // More frequent checking

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
