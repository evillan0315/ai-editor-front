# 🧩 Components Guide

This document provides an overview of the key React components within the AI Editor frontend, their responsibilities, and how they contribute to the overall user interface.

## 📂 Project Structure Relevance

Components are primarily organized under the `src/components` and `src/pages` directories. `src/components` holds reusable UI elements, while `src/pages` contains top-level components that represent distinct views or routes in the application.

```
src/
├── components/
│   ├── dialogs/            # Modal dialog components (e.g., FileUploaderDialog, InstructionEditorDialog)
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
- **Key Features**: Manages global layout, displays a loading indicator for authentication status, and renders child routes via `Outlet`. Handles basic theme application to the background.

### `Navbar.tsx` (`src/components/Navbar.tsx`)

- **Responsibility**: Displays the application's top navigation bar, including the app title, user authentication status, and a theme toggle.
- **Key Features**: Integrates with `authStore` to show login/logout buttons and user info, and `ThemeToggle` for theme switching. Uses Material-UI `AppBar` and `Toolbar` for consistent styling.

### `ThemeToggle.tsx` (`src/components/ThemeToggle.tsx`)

- **Responsibility**: A simple button to switch between light and dark themes.
- **Key Features**: Uses `themeStore` to manage and persist the current theme mode in `localStorage`.

### `Loading.tsx` (`src/components/Loading.tsx`)

- **Responsibility**: A generic loading spinner component used across the application to indicate ongoing processes, especially during page lazy loading.

## Page Components (`src/pages/`)

### `AiEditorPage.tsx`

- **Responsibility**: The central interface for interacting with the AI. It coordinates user prompts via `PromptGenerator`, displays AI-generated proposed changes, allows diff viewing, manages the application of selected changes, and provides a file tree for project navigation and viewing file content.
- **Key Features**:
  - Integrates `PromptGenerator` for handling project root input, scan paths, AI instructions, **file/image uploads, and AI request type selection**.
  - Displays AI's `summary` and `thoughtProcess` from `lastLlmResponse` via `AiResponseDisplay`.
  - `AiResponseDisplay` is rendered **above** `PromptGenerator` and lists `ProposedFileChange` objects with checkboxes for selective application.
  - Allows editing the `newContent` of `ADD`, `MODIFY`, or **`REPAIR`** changes directly in `CodeMirror` components within `ProposedChangeCard` before applying.
  - Provides a 'View Git Diff' button for `MODIFY`, `DELETE`, and **`REPAIR`** changes, displaying the diff using `getGitDiff` API.
  - Manages the application of selected changes using `applyProposedChanges` API, showing progress and messages.
  - Embeds `FileTree` component for hierarchical project file navigation.
  - Displays the content of a `selectedFile` from the `FileTree` in a dedicated `OpenedFileViewer` panel (currently read-only) **only when no `lastLlmResponse` is active, to prioritize AI proposed changes**.
  - Handles general loading and error states for AI generation and change application.

### `LoginPage.tsx`

- **Responsibility**: Provides options for user authentication, specifically via Google and GitHub OAuth **and local email/password login**.
- **Key Features**: Initiates OAuth flows by redirecting to backend endpoints, **handles local form submission**, displays authentication errors. Redirects authenticated users to the main editor.

### `RegisterPage.tsx`

- **Responsibility**: Provides a form for new users to register with an email and password.
- **Key Features**: Handles form submission for local registration, displays validation and API errors, and redirects to the main editor upon successful registration.

### `AuthCallback.tsx`

- **Responsibility**: A silent page that processes the OAuth callback from the backend, extracting user data and access tokens from URL parameters.
- **Key Features**: Updates `authStore` upon successful login and redirects the user to the main application or an error page if authentication fails.

## Specialized Component Directories

### `@uiw/react-codemirror` Usage

Instead of a custom `CodeMirrorEditor` component, the application directly utilizes the `@uiw/react-codemirror` library. This component is used in three primary contexts:

- **`ProposedChangeCard.tsx`**: For displaying and allowing live editing of the `newContent` for AI-proposed `ADD`, `MODIFY`, and `REPAIR` file changes.
- **`OpenedFileViewer.tsx`**: For displaying the content of files selected from the file tree in a read-only mode.
- **`InstructionEditorDialog.tsx`**: For editing AI system instructions and expected output formats.

It leverages `getCodeMirrorLanguage` utility to provide syntax highlighting based on file extension and `themeStore` for dark/light mode integration.

### `src/components/file-tree/`

- **`FileTree.tsx`**:
  - **Responsibility**: The main component for displaying the hierarchical project file structure in the sidebar.
  - **Key Features**: Fetches file data from the backend using `fileTreeStore` (with **caching logic to prevent redundant fetches based on `projectRoot` and `scanPaths`**), constructs the tree, and renders `FileTreeItem` components. Manages file data, expansion states, and communicates selected files to `aiEditorStore` for content display. Includes a refresh button.
- **`FileTreeItem.tsx`**:
  - **Responsibility**: Represents a single file or directory within the file tree.
  - **Key Features**: Renders the name, appropriate icon (custom for common file types, Material Icon for others), and expansion toggle for a file or directory. Handles expanding/collapsing directories, and upon file selection, it calls `setSelectedFile` in `fileTreeStore` (which in turn updates `aiEditorStore` to show file content). Provides visual cues for selected and expanded states. Incorporates padding for hierarchical visualization.

### `src/components/PromptGenerator.tsx`

- **Responsibility**: Provides the primary input interface for the AI Editor, allowing users to define the project context, customize AI behavior, provide additional context, and generate code.
- **Key Features**:
  - Input for `projectRoot` path and a 'Load Project' button to initialize the file tree and AI context. Also includes a 'Clear All State' button.
  - Input for `scanPathsInput` (comma-separated relative paths), with an autocomplete feature populated from the file tree, an 'Add' button for manual entry, and a button to open `FilePickerDialog` for interactive selection.
  - Textarea for the main `instruction` (the user's prompt to the AI).
  - **'Upload File or Paste Base64' button**: Opens the `FileUploaderDialog` to provide image or file data as additional context to the AI.
  - **'Request Type' dropdown**: Allows selection of the AI interaction model, such as `TEXT_ONLY`, `TEXT_WITH_IMAGE`, `TEXT_WITH_FILE`, `LLM_GENERATION`, etc., influencing how the backend processes the request.
  - **'Edit AI Instructions & Expected Output' menu**: Opens `InstructionEditorDialog` to allow users to modify the global AI system instruction (`aiInstruction`) and the JSON schema for the expected AI output (`expectedOutputInstruction`).
  - 'Generate/Modify Code' button to trigger the AI generation process via the `generateCode` API.
  - Displays loading indicators and error messages specific to the generation process.
  - Integrates with `aiEditorStore` to manage all its input states and triggers AI actions.

### `src/components/FilePickerDialog.tsx`

- **Responsibility**: A modal dialog for interactively selecting multiple files and folders to be included in the AI's `scanPaths`.
- **Key Features**:
  - Displays a searchable, flattened list of all files and directories in the `currentProjectPath`.
  - Allows users to checkbox-select multiple paths, with 'Select All' and 'Deselect All' actions.
  - Filters the list based on a search term.
  - Returns the selected relative paths to the `PromptGenerator` upon confirmation.
  - Integrates with `fileTreeStore` to get the list of available files.

### `src/components/AiResponseDisplay.tsx`

- **Responsibility**: Displays the structured response from the AI, including a summary, thought process, interactive proposed file changes, and optional Git instructions.
- **Key Features**:
  - Shows AI's summary and an expandable section for its detailed thought process.
  - Provides 'Select All', 'Deselect All', and 'Apply Selected Changes' buttons for managing proposed changes.
  - Renders a list of `ProposedChangeCard` components for each individual AI-suggested change.
  - Displays messages from the backend after attempting to apply changes, with specific loading indicators.
  - **Renders AI-generated `gitInstructions` with options to copy or execute commands directly, showing terminal output and errors.**

### `src/components/ProposedChangeCard.tsx`

- **Responsibility**: Renders an individual AI-proposed file change, allowing users to review, selectively apply, edit content, and view diffs.
- **Key Features**:
  - Displays file path, action type (`ADD`, `MODIFY`, `DELETE`, `REPAIR`, `ANALYZE`), and AI-generated reason.
  - Includes a checkbox to select/deselect the change for application.
  - For `ADD`, `MODIFY`, and **`REPAIR`** actions, it displays the `newContent` in an editable `@uiw/react-codemirror` instance, allowing users to modify the AI's suggestion before applying.
  - For `MODIFY`, `DELETE`, and **`REPAIR`** actions, it provides a 'View Git Diff' button to fetch and display the raw `git diff` for transparency. `ADD` actions simulate a diff for review.

### `src/components/OpenedFileViewer.tsx`

- **Responsibility**: Displays the content of a file selected from the `FileTree` in a read-only CodeMirror instance.
- **Key Features**:
  - Fetches and displays the content of the `openedFile` from the backend.
  - Utilizes `@uiw/react-codemirror` with `getCodeMirrorLanguage` for syntax highlighting and `themeStore` for theming.
  - Includes a 'Close File' button.
  - **Only renders when a file is selected from the file tree and no active `lastLlmResponse` is displayed**.
  - Displays specific loading and error states for content fetching.

## `src/components/dialogs/`

This directory contains modal dialog components used across the application for specific, focused user interactions.

### `FileUploaderDialog.tsx`

- **Responsibility**: A modal dialog that allows users to upload files via drag-and-drop or browsing, or to paste Base64 encoded data (e.g., for images or other binary files), which can then be sent to the AI as additional context.
- **Key Features**:
  - Provides a drag-and-drop area for file uploads.
  - Includes a text field for pasting Base64 data URLs, with basic validation for format.
  - Supports uploading a single file and extracts its Base64 content and MIME type.
  - Displays the currently uploaded file's MIME type and size.
  - Allows clearing the uploaded content.
  - Communicates with `aiEditorStore` via the `onUpload` prop to store the Base64 data and MIME type.

### `InstructionEditorDialog.tsx`

- **Responsibility**: A modal dialog for viewing and editing the AI's default system instructions (`aiInstruction`) or the expected output JSON schema (`expectedOutputInstruction`).
- **Key Features**:
  - Opens in two modes: for editing `aiInstruction` (which is typically Markdown) or `expectedOutputInstruction` (which is JSON).
  - Integrates `@uiw/react-codemirror` with appropriate syntax highlighting (`markdown` or `json`) and theme support.
  - Allows users to save their modified instructions, which are then stored in `aiEditorStore` and used in subsequent AI requests.

## Styling Conventions

- **Material-UI v7 Components**: Used for structured, accessible UI elements. Customization often involves `sx` prop for inline styles or `createTheme` in `main.tsx` for global overrides.
- **Tailwind CSS v4**: Applied using utility classes directly in JSX for layout, spacing, typography, and responsive adjustments. The `@tailwindcss/vite` plugin ensures proper processing.
- **Theme Integration**: Both Material-UI and Tailwind CSS are configured to respect the `themeStore`'s dark/light mode, providing a cohesive visual experience by toggling a `dark` class on the `body` element.
