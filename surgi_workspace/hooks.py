app_name = "surgi_workspace"
app_title = "Surgi Workspace"
app_publisher = "SurgiShop"
app_description = "Create custom workspaces for users"
app_email = "gary.starr@surgishop.com"
app_license = "MIT"

# Client-side redirect / lock logic
app_include_js = "/assets/surgi_workspace/js/desk.js"

# Enforce sidebar AFTER install & migrate (v16-correct)
after_install = "surgi_workspace.workspace_sidebar.ensure_sales_sidebar"
after_migrate = "surgi_workspace.workspace_sidebar.ensure_sales_sidebar"
