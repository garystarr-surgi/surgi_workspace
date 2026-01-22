app_name = "surgi_workspace"
app_title = "Surgi Workspace"
app_publisher = "SurgiShop"
app_description = "Create custom workspaces for users"
app_email = "gary.starr@surgishop.com"
app_license = "MIT"


# Edit surgi_workspace/hooks.py and add/update:
cat >> surgi_workspace/hooks.py << 'EOF'

# CRITICAL: Fixtures for workspaces
fixtures = [
    {
        "dt": "Workspace",
        "filters": [
            [
                "name",
                "in",
                [
                    "Sales Workspace",
                ]
            ]
        ]
    }
]
EOF

app_include_js = "/assets/surgi_workspace/js/desk.js"

