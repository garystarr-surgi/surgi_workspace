import frappe

def ensure_sales_sidebar():
    sidebar_name = "Selling"

    allowed_items = [
        {
            "type": "Link",
            "label": "Selling",
            "link_to": "Selling",
            "link_type": "Workspace",
            "icon": "sell",
        },
        {
            "type": "Link",
            "label": "Quotation",
            "link_to": "Quotation",
            "link_type": "DocType",
            "icon": "sell",
        },
        {
            "type": "Link",
            "label": "Sales Orders",
            "link_to": "Sales Order",
            "link_type": "DocType",
            "icon": "clipboard",
        },
        {
            "type": "Link",
            "label": "Customers",
            "link_to": "Customer",
            "link_type": "DocType",
            "icon": "users",
        },
    ]

    if frappe.db.exists("Workspace Sidebar", sidebar_name):
        sidebar = frappe.get_doc("Workspace Sidebar", sidebar_name)
        sidebar.items = []
    else:
        sidebar = frappe.get_doc({
            "doctype": "Workspace Sidebar",
            "name": sidebar_name,
            "title": "Selling",
            "module": "Selling",
        })

    for item in allowed_items:
        sidebar.append("items", item)

    sidebar.flags.ignore_permissions = True
    sidebar.save()
    frappe.db.commit()
