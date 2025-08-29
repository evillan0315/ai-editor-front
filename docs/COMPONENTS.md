# 🧩 Components Guide

This document provides an overview of the key React components within the AI Editor frontend, their responsibilities, and how they contribute to the overall user interface.

## 📂 Project Structure Relevance

Components are primarily organized under the `src/components` and `src/pages` directories. `src/components` holds reusable UI elements, while `src/pages` contains top-level components that represent distinct views or routes in the application.

```
src/
├── components/
│   ├── code-editor/        # CodeMirror editor component
│   ├── file-tree/          # Components for the file tree view
│   ├── ui/                 # Wrapper components for Material-UI elements
│   └── ...                 # General purpose UI components
├── pages/
│   ├── AiEditorPage.tsx    # Main AI editor interface
│   ├── AuthCallback.tsx    # OAuth callback handling
│   ├── LoginPage.tsx       # User login page
│   └── ...
└── App.tsx                 # Main application component and router setup
```

## Core Components

### `App.tsx`

- **Responsibility**: The entry point for the React application's routing. It defines the main routes using `react-router-dom` and renders the `Layout` component.
- **Key Features**: Uses `Suspense` and `lazy` for dynamic imports to enable code splitting for pages, improving initial load performance.

### `Layout.tsx` (`src/components/Layout.tsx`)

- **Responsibility**: Provides the overarching structure for most application pages, including the `Navbar` and a common footer.
- **Key Features**: Manages global layout, displays a loading indicator for authentication status, and renders child routes via `Outlet`.

### `Navbar.tsx` (`src/components/Navbar.tsx`)

- **Responsibility**: Displays the application's top navigation bar, including the app title, user authentication status, and a theme toggle.
- **Key Features**: Integrates with `authStore` to show login/logout buttons and user info, and `ThemeToggle` for theme switching.

### `ThemeToggle.tsx` (`src/components/ThemeToggle.tsx`)

- **Responsibility**: A simple button to switch between light and dark themes.
- **Key Features**: Uses `themeStore` to manage and persist the current theme mode.

### `Loading.tsx` (`src/components/Loading.tsx`)

- **Responsibility**: A generic loading spinner component used across the application to indicate ongoing processes.

## Page Components (`src/pages/`)

### `AiEditorPage.tsx`

- **Responsibility**: The central interface for interacting with the AI. It coordinates user prompts via `PromptGenerator`, displays AI-generated proposed changes, allows diff viewing, manages the application of selected changes, and provides a file tree for project navigation and viewing file content.
- **Key Features**:
  - Integrates `PromptGenerator` for handling project root input, scan paths, and AI instructions.
  - Displays AI's `summary` and `thoughtProcess` from `lastLlmResponse`.
  - Lists `ProposedFileChange` objects with checkboxes for selective application.
  - Allows editing the `newContent` of `ADD` or `MODIFY` changes using `CodeMirrorEditor` before applying.
  - Provides a 'View Git Diff' button for `MODIFY` and `DELETE` changes, displaying the diff using `getGitDiff` API.
  - Manages the application of selected changes using `applyProposedChanges` API, showing progress and messages.
  - Embeds `FileTree` component for hierarchical project file navigation.
  - Displays the content of a `selectedFile` from the `FileTree` in a dedicated `CodeMirrorEditor` panel (read-only).
  - Handles general loading and error states for AI generation and change application.

### `LoginPage.tsx`

- **Responsibility**: Provides options for user authentication, specifically via Google and GitHub OAuth.
- **Key Features**: Initiates OAuth flows by redirecting to backend endpoints. Displays authentication errors.

### `AuthCallback.tsx`

- **Responsibility**: A silent page that processes the OAuth callback from the backend, extracting user data and access tokens from URL parameters.
- **Key Features**: Updates `authStore` upon successful login and redirects the user to the main application.

## Specialized Component Directories

### `src/components/code-editor/CodeMirrorEditor.tsx`

- **Responsibility**: A versatile wrapper around the CodeMirror 6 library, providing a functional code editor component.
- **Key Features**: Supports syntax highlighting for various languages, handles value changes, and can be set to read-only or editable modes. It is used for displaying proposed AI changes (editable) and for viewing existing file content from the file tree (read-only).

### `src/components/file-tree/`

- **`FileTree.tsx`**:
  - **Responsibility**: The main component for displaying the hierarchical project file structure in the sidebar.
  - **Key Features**: Fetches file data from the backend using `fileTreeStore`, constructs the tree, and renders `FileTreeItem` components. Manages file data, expansion states, and communicates selected files to `aiEditorStore` for content display. Includes a refresh button.
- **`FileTreeItem.tsx`**:
  - **Responsibility**: Represents a single file or directory within the file tree.
  - **Key Features**: Renders the name, appropriate icon, and expansion toggle for a file or directory. Handles expanding/collapsing directories, and upon file selection, it calls `setSelectedFile` in `fileTreeStore` (which in turn updates `aiEditorStore` to show file content). Provides visual cues for selected and expanded states.

### `src/components/PromptGenerator.tsx`

- **Responsibility**: Provides the primary input interface for the AI Editor, allowing users to define the project context and generate code.
- **Key Features**:
  - Input for `projectRoot` path and a 'Load Project' button to initialize the file tree and AI context.
  - Input for `scanPathsInput` (comma-separated relative paths), with an autocomplete feature populated from the file tree and an 'Add' button to open `FilePickerDialog`.
  - Textarea for `instruction` (the user's prompt to the AI).
  - 'Generate/Modify Code' button to trigger the AI generation process via the `generateCode` API.
  - Displays loading indicators and error messages specific to the generation process.
  - Integrates with `aiEditorStore` to manage all its input states and triggers AI actions.

### `src/components/FilePickerDialog.tsx`

- **Responsibility**: A modal dialog for interactively selecting multiple files and folders to be included in the AI's `scanPaths`.
- **Key Features**:
  - Displays a searchable, flattened list of all files and directories in the `currentProjectPath`.
  - Allows users to checkbox-select multiple paths.
  - Provides 'Select All' and 'Deselect All' actions.
  - Filters the list based on a search term.
  - Returns the selected relative paths to the `PromptGenerator` upon confirmation.
  - Integrates with `fileTreeStore` to get the list of available files.

## Styling Conventions

- **Material-UI Components**: Used for structured, accessible UI elements. Customization often involves `sx` prop for inline styles or `createTheme` in `main.tsx` for global overrides.
- **Tailwind CSS**: Applied using utility classes directly in JSX for layout, spacing, typography, and responsive adjustments. The `@tailwindcss/vite` plugin ensures proper processing.
- **Theme Integration**: Both Material-UI and Tailwind CSS are configured to respect the `themeStore`'s dark/light mode, providing a cohesive visual experience.
