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

- **Responsibility**: The central interface for interacting with the AI. It handles user prompts, displays AI-generated changes, allows diff viewing, and manages the application of proposed changes.
- **Key Features**:
  - Input fields for project root and scan paths.
  - Text area for AI instructions.
  - Displays AI's summary and thought process.
  - Lists proposed file changes with checkboxes for selection.
  - Integrates `CodeMirrorEditor` for viewing/editing proposed content.
  - Displays git diffs.
  - Handles applying selected changes via `applyProposedChanges` API.
  - Integrates `FileTree` for browsing project files and `CodeMirrorEditor` for viewing file content.

### `LoginPage.tsx`

- **Responsibility**: Provides options for user authentication, specifically via Google and GitHub OAuth.
- **Key Features**: Initiates OAuth flows by redirecting to backend endpoints. Displays authentication errors.

### `AuthCallback.tsx`

- **Responsibility**: A silent page that processes the OAuth callback from the backend, extracting user data and access tokens from URL parameters.
- **Key Features**: Updates `authStore` upon successful login and redirects the user to the main application.

## Specialized Component Directories

### `src/components/code-editor/CodeMirrorEditor.tsx`

- **Responsibility**: A wrapper around the CodeMirror 6 library, providing a functional code editor component.
- **Key Features**: Supports syntax highlighting for various languages, handles value changes, and can be set to read-only or editable modes. Used for displaying proposed AI changes and viewing existing file content.

### `src/components/file-tree/`

- **`FileTree.tsx`**: The main component for displaying the hierarchical project file structure.
  - **Responsibility**: Fetches file data from the backend, builds the tree, and renders `FileTreeItem` components.
  - **Key Features**: Integrates with `fileTreeStore` and `aiEditorStore` to manage file data, expansion, and selected files. Includes refresh functionality.
- **`FileTreeItem.tsx`**: Represents a single file or directory within the file tree.
  - **Responsibility**: Renders the name, icon, and expansion toggle for a file or directory. Recursively renders children for directories.
  - **Key Features**: Handles expanding/collapsing directories, selecting files (which updates the `aiEditorStore` to show file content), and provides visual cues for selected/expanded states.

### `src/components/ui/`

- **Responsibility**: Contains simple wrapper components for common Material-UI elements like `Button`, `TextField`, and `CircularProgress`.
- **Purpose**: Provides a consistent interface, allows for easier custom styling (e.g., `!normal-case` for buttons), and simplifies imports within the application, ensuring that any global MUI overrides or custom behaviors are consistently applied.

## Styling Conventions

- **Material-UI Components**: Used for structured, accessible UI elements. Customization often involves `sx` prop for inline styles or `createTheme` in `main.tsx` for global overrides.
- **Tailwind CSS**: Applied using utility classes directly in JSX for layout, spacing, typography, and responsive adjustments. The `@tailwindcss/vite` plugin ensures proper processing.
- **Theme Integration**: Both Material-UI and Tailwind CSS are configured to respect the `themeStore`'s dark/light mode, providing a cohesive visual experience.
