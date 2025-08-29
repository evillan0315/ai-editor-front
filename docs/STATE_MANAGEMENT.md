# ♻️ State Management with Nanostores

This document describes how global state is managed in the AI Editor frontend using [Nanostores](https://nanostores.github.io/). Nanostores is a small, fast, and unopinionated state manager that provides reactive, atomic stores for different parts of the application's state.

## Why Nanostores?

- **Simplicity**: Minimal API, easy to understand and use.
- **Reactivity**: Components automatically re-render when the stores they subscribe to change.
- **Performance**: Optimized for speed with direct subscriptions.
- **Scalability**: Easy to organize state into separate, focused stores.
- **TypeScript-friendly**: Excellent TypeScript support for type-safe state.

## Core Concepts

- **`map()`**: Used to create stores that hold objects (maps) of values. This is ideal for complex state objects.
- **`useStore()` (from `@nanostores/react`)**: A React hook to subscribe to a store and get its current value. When the store updates, the component re-renders.
- **`store.set(newValue)`**: Replaces the entire state of the store with `newValue`.
- **`store.setKey(key, value)`**: Updates a specific key within a `map()` store.

## Global Stores

The application uses several global stores, each responsible for a specific domain of the application's state:

### 1. `authStore` (`src/stores/authStore.ts`)

Manages the user's authentication status and profile information.

- **State**:
  - `isLoggedIn: boolean`: Indicates if a user is currently authenticated.
  - `user: UserProfile | null`: Contains user details (id, email, name, etc.) if logged in.
  - `loading: boolean`: True when an authentication check or action is in progress.
  - `error: string | null`: Stores any authentication-related error messages.

- **Actions**:
  - `loginSuccess(user: UserProfile, token?: string)`: Sets the user as logged in, stores user data, and optionally saves the access token to `localStorage`.
  - `logout()`: Clears user data, sets `isLoggedIn` to false, and removes the token from `localStorage`.
  - `setLoading(isLoading: boolean)`: Updates the loading state.
  - `setError(message: string | null)`: Sets an authentication error message.
  - `getToken()`: Retrieves the access token from `localStorage`.

- **Integration**: Used by `Navbar.tsx` to display login/logout options, `LoginPage.tsx` and `AuthCallback.tsx` to manage the login flow, and `Layout.tsx` to show global loading for auth status.

### 2. `aiEditorStore` (`src/stores/aiEditorStore.ts`)

Manages the state related to AI interactions, proposed code changes, and currently opened files.

- **State**:
  - `instruction: string`: The user's prompt for the AI.
  - `currentProjectPath: string | null`: The absolute path of the project root being worked on.
  - `scanPathsInput: string`: Comma-separated paths for the AI to scan.
  - `lastLlmResponse: LlmResponse | null`: The full structured response from the AI, including summary, thought process, and `ProposedFileChange[]`.
  - `selectedChanges: Record<string, ProposedFileChange>`: A map of selected changes to be applied (keyed by `filePath`).
  - `currentDiff: string | null`: The content of the git diff for the currently viewed file.
  - `diffFilePath: string | null`: The path of the file whose diff is currently displayed.
  - `openedFile: string | null`: The absolute path of the file currently opened for viewing in the editor panel.
  - `openedFileContent: string | null`: The content of the `openedFile`.
  - `isFetchingFileContent: boolean`: Loading state for fetching `openedFile` content.
  - `fetchFileContentError: string | null`: Error state for fetching `openedFile` content.
  - `loading: boolean`: General loading state for AI generation or other heavy operations.
  - `error: string | null`: General error message for AI Editor operations.
  - `applyingChanges: boolean`: Indicates if the process of applying changes is in progress.
  - `appliedMessages: string[]`: Messages received from the backend after attempting to apply changes.

- **Actions**:
  - `setInstruction(instruction: string)`: Updates the AI prompt.
  - `setScanPathsInput(paths: string)`: Updates the scan paths.
  - `setLastLlmResponse(response: LlmResponse | null)`: Stores the AI's full response and automatically selects all proposed changes.
  - `toggleSelectedChange(change: ProposedFileChange)`: Toggles the selection status of a proposed file change.
  - `selectAllChanges()` / `deselectAllChanges()`: Manage bulk selection of changes.
  - `setCurrentDiff(filePath: string | null, diffContent: string | null)`: Sets the diff content for a specific file.
  - `updateProposedChangeContent(filePath: string, newContent: string)`: Allows editing the content of a proposed change before applying.
  - `setOpenedFile(filePath: string | null)`: Sets the file to be displayed in the editor panel and clears related content/errors.
  - `setOpenedFileContent(content: string | null)`: Sets the content for the `openedFile`.
  - `setIsFetchingFileContent(isLoading: boolean)`: Updates fetching loading state for `openedFile`.
  - `setFetchFileContentError(message: string | null)`: Sets an error message for fetching `openedFile` content.
  - `setLoading(isLoading: boolean)` / `setError(message: string | null)` / `clearState()`: General state management for the editor.

- **Integration**: Primarily consumed by `AiEditorPage.tsx` to drive the core AI interaction and file editing UI. Also used by `FileTreeStore` to set the `openedFile`.

### 3. `fileTreeStore` (`src/stores/fileTreeStore.ts`)

Manages the state of the project file tree displayed in the sidebar.

- **State**:
  - `files: FileEntry[]`: The hierarchical structure of the project files, ready for rendering.
  - `flatFileList: ApiFileEntry[]`: The raw, flat list of files returned from the API.
  - `expandedDirs: Set<string>`: A set of `filePath` strings for currently expanded directories.
  - `selectedFile: string | null`: The `filePath` of the file currently selected in the tree.
  - `isFetchingTree: boolean`: True when the file tree data is being fetched from the backend.
  - `fetchTreeError: string | null`: Stores any error messages encountered during file tree fetching.

- **Actions**:
  - `fetchFiles(projectRoot: string, scanPaths: string[])`: Initiates an API call to fetch project files and constructs the hierarchical tree.
  - `setFiles(files: FileEntry[])`: Updates the hierarchical file list.
  - `toggleDirExpansion(filePath: string)`: Toggles the expanded/collapsed state of a directory.
  - `setSelectedFile(filePath: string | null)`: Sets the currently selected file and triggers `setOpenedFile` in `aiEditorStore`.
  - `clearFileTree()`: Resets the file tree state.

- **Integration**: Used by `FileTree.tsx` and `FileTreeItem.tsx` to render and interact with the file tree. It also communicates with `aiEditorStore` to open selected files.

### 4. `themeStore` (`src/stores/themeStore.ts`)

Manages the application's current theme mode (light or dark).

- **State**:
  - `mode: 'light' | 'dark'`: The currently active theme mode.

- **Actions**:
  - `toggleTheme()`: Switches between 'light' and 'dark' modes and persists the preference in `localStorage`.
  - `setTheme(mode: 'light' | 'dark')`: Explicitly sets the theme mode.

- **Integration**: Used by `ThemeToggle.tsx` and `main.tsx` to apply the theme to both Material-UI and Tailwind CSS (by toggling a `dark` class on the `body` element). Initialized from `localStorage` or system preference.

## Inter-Store Communication

Stores can interact with each other by calling actions from other stores. For example:

- `fileTreeStore.setSelectedFile()` calls `aiEditorStore.setOpenedFile()` to display the content of the selected file.
- `aiEditorStore.clearState()` also calls `setOpenedFile(null)` to ensure the editor panel is cleared when the main AI editor state is reset.

This approach ensures a clear flow of data and updates across different parts of the application, maintaining consistency and reactivity.
