# 🏗️ Components Overview

This document outlines the main components and their organization within the Project Board Frontend. Components are grouped into logical categories to reflect their purpose and location in the `src/components` directory.

## General UI Components

These are core UI elements or structural components used across the application.

*   **`Layout.tsx`**: The main layout component that wraps all pages, providing a consistent header (Navbar) and footer.
*   **`Navbar.tsx`**: Displays global navigation links, user authentication status, theme toggle, and project-specific script execution menu.
*   **`Loading.tsx`**: A versatile loading indicator component with various types (circular, linear, gradient, skeleton) and messages.
*   **`Snackbar.tsx`**: A custom Material-UI Snackbar wrapper for displaying transient messages (success, error, info) to the user.
*   **`ThemeToggle.tsx`**: Allows users to switch between light and dark themes.
*   **`WelcomeMessage.tsx`**: A simple component displaying a welcome message on the home page.

## AI Editor Specific Components

These components are primarily used within the `AiEditorPage` to facilitate AI interaction and code management.

*   **`PromptGenerator.tsx`**: The main input component where users enter AI instructions, select project paths, add scan paths, manage file uploads, and trigger AI code generation.
*   **`AiResponseDisplay.tsx`**: Renders the AI's structured response, including summary, thought process, and proposed file changes. It also handles applying changes and displaying git instructions.
*   **`ProposedChangeCard.tsx`**: Displays an individual file change proposed by the AI, including file path, action, reason, and an editable code mirror for `newContent`. It also allows viewing git diffs for existing files.
*   **`FilePickerDialog.tsx`**: A dialog for selecting files and folders from the project's file tree to be included as AI scan paths.
*   **`OpenedFileViewer.tsx`**: Displays the content of a file selected from the file tree in a read-only CodeMirror instance. It is hidden when an AI response is active to prioritize proposed changes.

## File Tree Components (`components/file-tree/`)

These components work together to render and manage the interactive project file tree.

*   **`FileTree.tsx`**: The main component for displaying the hierarchical file and folder structure of the loaded project. It handles loading the initial tree and refreshing it.
*   **`FileTreeItem.tsx`**: Represents a single file or folder entry in the tree, handling its expansion/collapse, selection, and displaying relevant icons. It also manages context menu events.
*   **`FileTreeContextMenuRenderer.tsx`**: Renders a context menu (right-click menu) for file tree items, offering actions like 'Open File', 'Copy Path', 'Rename', 'Delete', etc.

## Dialog Components (`components/dialogs/`)

A centralized location for all modal dialogs used throughout the application.

*   **`DirectoryPickerDialog.tsx`**: A dialog for browsing and selecting a directory to be set as the project root path.
*   **`FileUploaderDialog.tsx`**: A versatile dialog for uploading files via drag-and-drop or browsing, or pasting Base64 data (e.g., images, text files) to be used as AI context.
*   **`InstructionEditorDialog.tsx`**: A CodeMirror-based dialog for editing the AI's system instructions and the expected output format schema.

## Application-Specific Pages/Components (`pages/`)

These are the top-level page components and their direct children that implement specific applications.

*   **`HomePage.tsx`**: The landing page of the application, introducing its capabilities.
*   **`DashboardPage.tsx`**: A placeholder for a user dashboard.
*   **`AppsPage.tsx`**: Lists all available AI-powered applications and generators.
*   **`AiEditorPage.tsx`**: The core AI code editing environment.
*   **`LoginPage.tsx`**: Handles user login via local credentials or OAuth.
*   **`RegisterPage.tsx`**: Handles user registration.
*   **`AuthCallback.tsx`**: Processes OAuth callback responses from the backend.
*   **`SpotifyAppPage.tsx`**: The container page for the Spotify-like music player application.
    *   **`SpotifyMainContent.tsx`**: Renders the dynamic content area of the Spotify app (home, search, library).
    *   **`SpotifyPlayerBar.tsx`**: The bottom player bar for music playback controls.
    *   **`SpotifySidebar.tsx`**: The left-hand navigation sidebar for the Spotify app.
    *   **`SpotifyHomePage.tsx`**: Displays curated music content (e.g., playlists, artists).
    *   **`SpotifySearchPage.tsx`**: Provides search functionality and genre browsing.
    *   **`SpotifyLibraryPage.tsx`**: Displays user's saved playlists, artists, albums, etc.
*   **`TranslatorAppPage.tsx`**: The page for the AI-powered translation application, allowing text or file translation.
*   **`GeminiLiveAudioPage.tsx`**: The page for real-time audio interaction with Gemini AI.

## UI Primitives (`components/ui/`)

Simple wrapper components around Material-UI elements to ensure consistent styling or add minor common functionalities.

*   **`Button.tsx`**: A wrapper for `MuiButton`.
*   **`TextField.tsx`**: A wrapper for `MuiTextField` with consistent theming.
*   **`CircularProgress.tsx`**: A wrapper for `MuiCircularProgress`.
