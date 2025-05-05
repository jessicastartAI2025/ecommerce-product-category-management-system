# Project Overview
This is an e-commerce product category management system that allows users to organize their product categories in a hierarchical structure. The system provides functionality to create, edit, and delete categories.

# Feature Requirements
- We will use Next.js, Shadcn, Lucid, Mermaid AI, Supbase, Clerk
1. Display a hierarchical tree view of product categories
2. Allow adding new root categories
3. Support editing category names
4. Enable deleting categories with confirmation dialog
5. Include "Save Changes" functionality to persist updates
6. Provide "Reset to Default" option to revert changes
7. Support nested subcategories (parent-child relationships)

# Relevant Docs
- [Shadcn UI Components](https://ui.shadcn.com/) - For UI components like buttons, dialogs, and inputs
- [Tree View Implementation](https://ui.shadcn.com/docs/components/tree) - For hierarchical category display
- [React State Management](https://react.dev/learn/managing-state) - For handling category state

# Current File Structure
ecommerce-product-category-management-system/
├── .git/
├── .gitignore
├── .next/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── button.tsx
│       ├── checkbox.tsx
│       ├── command.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       └── menubar.tsx
├── components.json
├── eslint.config.mjs
├── lib/
│   └── utils.ts
├── next-env.d.ts
├── next.config.ts
├── node_modules/
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── README.md
├── requirements/
│   └── frontend_instructions.md
└── tsconfig.json

# Delete Category Workflow
When a user attempts to delete a category, the system should:

1. Display a confirmation dialog with the following elements:
   - Title: "Are you absolutely sure?"
   - Warning message: "This will permanently delete this category and all its subcategories. This action cannot be undone."
   - Two buttons: "Cancel" (to abort deletion) and "Delete" (to confirm deletion)
   
2. If the user clicks "Cancel":
   - Close the dialog
   - Return to the category management interface without making changes
   
3. If the user clicks "Delete":
   - Remove the selected category and all its subcategories from the hierarchy
   - Update the UI to reflect the deletion
   - Keep changes in temporary state until "Save Changes" is clicked
   
4. The dialog should be centered on screen with a semi-transparent overlay behind it
   
5. The "Delete" button should be highlighted in a warning color (red) to indicate destructive action


# Rules
- All new components should go in /components and be named like example-component.tsx unless otherwise specified 
- All new pages should go in /app 