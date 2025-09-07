# ⚛️ Frontend Components Overview

This document provides an overview of the key React components within the AI Editor frontend, categorized by their primary function. This helps in understanding the project structure and component responsibilities.

## 📂 Project Structure

```bash
ai-editor-front/
├── src/
│   ├── components/
│   │   ├── dialogs/        # Modal dialog components
│   │   ├── file-tree/      # Components for displaying and interacting with the file tree
│   │   ├── ui/             # Wrapper components for Material-UI primitives
│   │   └── ...             # General purpose components
│   ├── pages/              # Top-level page components
│   │   ├── spotify/        # Components specific to the Spotify-like app
│   │   └── ...             # Other main pages
│   └── ...
```

## 🗺️ Component Categories

### 🌐 Layout & Navigation Components

These components define the overall structure and navigation of the application.

- **`Layout.tsx`**: The main layout component that wraps all pages, including the `Navbar` and a common footer. It handles global concerns like initial authentication status checks.
- **`Navbar.tsx`**: Displays the application's header, navigation links (Editor, Dashboard, Apps), user authentication status, theme toggle, and project script execution menu.
- **`ThemeToggle.tsx`**: A simple button to switch between light and dark themes.

### 🤖 AI Editor Core Components

These are central to the AI code generation and modification functionality.

- **`AiEditorPage.tsx`** (Page): The primary page where users interact with the AI editor. It orchestrates `PromptGenerator`, `FileTree`, `AiResponseDisplay`, and `OpenedFileViewer`.
- **`PromptGenerator.tsx`**: The main input area for AI instructions. It includes fields for the user prompt, project root, scan paths, request type selection, file/image upload, and the 'Generate Code' button.
- **`AiResponseDisplay.tsx`**: Displays the AI's structured response, including summary, thought process, proposed file changes, and Git instructions. It allows for selective application of changes.
- **`ProposedChangeCard.tsx`**: Renders an individual AI-proposed file change, allowing users to select/deselect it, view a Git diff, and edit the proposed content or file path.
- **`OpenedFileViewer.tsx`**: Displays the content of a file selected from the `FileTree` in a read-only CodeMirror instance when no AI response is active.

### 📂 File System Interaction Components

Components for browsing and interacting with the project's file structure.

- **`FileTree.tsx`**: Displays the hierarchical structure of the user's project files. It is responsible for loading the initial tree and delegating rendering to `FileTreeItem`.
- **`FileTreeItem.tsx`**: Renders an individual file or folder within the `FileTree`, handling expansion/collapse of directories and selection of files.
- **`FilePickerDialog.tsx`**: A modal dialog used for selecting multiple files and folders to be included as 'scan paths' for AI context.

### 💬 Dialog Components

Reusable modal dialogs for various interactions.

- **`FileUploaderDialog.tsx`**: A dialog for uploading files or pasting Base64 encoded data to be sent as additional context to the AI.
- **`InstructionEditorDialog.tsx`**: A dialog for editing the AI's system instructions and the expected output JSON schema, providing fine-grained control over AI behavior.

### 🛠️ UI Primitives & Utilities

Wrapper components for Material-UI elements and general utility components.

- **`ui/Button.tsx`**: A wrapper around Material-UI's `Button` to apply consistent styling (e.g., `!normal-case`).
- **`ui/TextField.tsx`**: A wrapper around Material-UI's `TextField` to apply consistent styling for input fields, especially regarding dark/light mode and border colors.
- **`ui/CircularProgress.tsx`**: A simple wrapper for Material-UI's `CircularProgress`.
- **`Loading.tsx`**: A versatile loading indicator component with different animation types and customizable messages.
- **`Snackbar.tsx`**: A global notification component for displaying success, error, or info messages.
- **`WelcomeMessage.tsx`**: A simple card displaying a welcome message on the homepage or editor if no project is loaded.
- **`RunScriptMenuItem.tsx`**: A `MenuItem` component specifically designed for displaying and running `package.json` scripts from the `Navbar`.

### 📱 Application-Specific Pages

Components that define distinct applications or views beyond the core AI Editor.

- **`HomePage.tsx`** (Page): The landing page of the application, introducing its features and guiding users to main sections.
- **`DashboardPage.tsx`** (Page): A placeholder for a future dashboard where users can view project overviews and activities.
- **`AppsPage.tsx`** (Page): Lists all available AI-powered applications and tools within the platform, including different AI Editor generators, the Spotify-like app, and the Translator app.
- **`LoginPage.tsx`** (Page): Provides user login functionality, supporting both local email/password and OAuth providers.
- **`RegisterPage.tsx`** (Page): Provides user registration for local accounts.
- **`AuthCallback.tsx`** (Page): Handles redirects from OAuth providers to process authentication tokens.
- **`SpotifyAppPage.tsx`** (Page): The main container for the Spotify-like music player application.
  - **`spotify/SpotifySidebar.tsx`**: The navigation sidebar for the Spotify app.
  - **`spotify/SpotifyMainContent.tsx`**: Displays the main content area of the Spotify app based on the selected view (Home, Search, Library).
  - **`spotify/SpotifyHomePage.tsx`**: The main 'Home' view of the Spotify app with featured playlists and artists.
  - **`spotify/SpotifySearchPage.tsx`**: The 'Search' view of the Spotify app with a search bar and browseable genres.
  - **`spotify/SpotifyLibraryPage.tsx`**: The 'Your Library' view of the Spotify app with playlists, artists, and albums.
  - **`spotify/SpotifyPlayerBar.tsx`**: The fixed player bar at the bottom of the Spotify app.
- **`TranslatorAppPage.tsx`** (Page): Provides an interface for translating text or files using AI.

This breakdown helps in quickly locating and understanding the purpose of each component within the larger application context.
