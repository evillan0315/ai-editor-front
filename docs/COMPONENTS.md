# Component Documentation

This document provides an overview of the React components used in the `project-board-front` application. Components are organized by their primary function and location within the project.

## Principles

-   **Reusability**: Components are designed to be reusable across different parts of the application.
-   **Single Responsibility**: Each component ideally handles a single piece of functionality or renders a specific part of the UI.
-   **Presentation vs. Container**: A distinction is often made between presentational components (focused on UI, receives props) and container components (focused on logic, state, and data fetching).
-   **Material UI & Tailwind CSS**: Styling is a combination of Material UI components and Tailwind CSS utilities for flexibility and consistency.
-   **Type Safety**: All components are written in TypeScript with clearly defined props interfaces.

## Component Categories

### 1. Layout Components (`src/components/`)

These components define the overall structure and navigation of the application.

-   **`Layout.tsx`**: The main layout wrapper, including `Navbar` and a footer, defining the structural commonalities across pages.
-   **`Navbar.tsx`**: The top navigation bar, featuring app links, user authentication status, theme toggle, and the project script runner.
-   **`Loading.tsx`**: A versatile loading indicator component with various types (circular, linear, dots, etc.) to provide user feedback during asynchronous operations.
-   **`WelcomeMessage.tsx`**: A simple message displayed on the home page.

### 2. AI Editor Specific Components (`src/components/`)

Components exclusively used within the AI Code Editor page (`AiEditorPage.tsx`).

-   **`PromptGenerator.tsx`**: The main input area for user prompts, project root selection, scan paths, and AI configuration (request type, output format, instructions).
-   **`AiResponseDisplay.tsx`**: Displays the AI's generated response, including summary, thought process, and proposed file changes.
-   **`ProposedChangeCard.tsx`**: Renders an individual file change proposed by the AI, showing action type, file path, reason, and an editable code mirror for content. It also allows viewing git diffs.
-   **`OpenedFileViewer.tsx`**: The editor panel for displaying and editing the content of files opened from the file tree. Supports syntax highlighting and dirty state tracking.
-   **`FileTabs.tsx`**: Manages and displays tabs for multiple opened files in the editor, allowing users to switch between them.
-   **`FilePickerDialog.tsx`**: A dialog to browse and select specific files or folders from the project directory to include in AI scan paths.

### 3. File Tree Components (`src/components/file-tree/`)

Components responsible for rendering and interacting with the hierarchical file system.

-   **`FileTree.tsx`**: The main component that renders the entire file tree for a given `projectRoot`.
-   **`FileTreeItem.tsx`**: A recursive component that renders a single file or folder entry in the tree, handling expansion, selection, and context menus.
-   **`FileTreeContextMenuRenderer.tsx`**: A component that renders the dynamic context menu when a file tree item is right-clicked.

### 4. Dialogs (`src/components/dialogs/`)

Reusable modal dialog components for various interactions.

-   **`DirectoryPickerDialog.tsx`**: A dialog for browsing and selecting a directory (e.g., for setting the project root).
-   **`FileUploaderDialog.tsx`**: A dialog for uploading files via drag-and-drop or pasting Base64 data, providing context to the AI.
-   **`InstructionEditorDialog.tsx`**: A dialog for editing the AI system instructions or expected output format using a CodeMirror instance.

### 5. UI Primitives / Wrappers (`src/components/ui/`)

Simple wrapper components around Material UI elements, primarily used to enforce consistent styling or add common props.

-   **`Button.tsx`**: A wrapper around `MuiButton` to apply custom default styles.
-   **`TextField.tsx`**: A wrapper around `MuiTextField` for consistent input field styling.
-   **`CircularProgress.tsx`**: A wrapper around `MuiCircularProgress`.

### 6. Utility & Theming Components (`src/components/`)

-   **`Snackbar.tsx`**: A custom notification component for displaying ephemeral messages (success, error, info).
-   **`ThemeToggle.tsx`**: A button to switch between light and dark UI themes.
-   **`RunScriptMenuItem.tsx`**: A menu item component used in the Navbar to run specific project scripts defined in `package.json`.

### 7. Recording Components (`src/components/recording/`)

Components used for screen recording and capture functionality.

-   **`RecordingComponent.tsx`**: This component provides screen recording and screenshot capture capabilities. It handles user interactions to start, stop, and manage recordings. It presents saved recordings and screenshots in a table with options to play, convert to GIF, download, edit, and delete each item.  It uses the `recordingApi` to interact with the backend.
    -   **Key Features:**
        -   **Controls Section:** Provides buttons to start, stop, and capture screenshots.  The UI visually indicates the current recording state.
        -   **Recordings List:** Displays saved recordings and screenshots in a table, providing actions for each item.
        -   **Video Modal:**  A modal dialog powered by `VideoModal.tsx` that enables playing recorded videos and viewing screenshots.

