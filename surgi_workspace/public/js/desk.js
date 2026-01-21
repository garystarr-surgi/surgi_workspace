frappe.after_login = () => {
  if (frappe.user_roles.includes("Sales User")) {
    frappe.set_route("workspace", "Sales Workspace");
  }
};

