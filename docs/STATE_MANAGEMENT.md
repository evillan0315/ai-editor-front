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
  - `loading: boolean`: True when an authentication check or action is in progress. **Initialized to `true` to indicate that auth status is being determined on app load.**
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
  - `instruction: string`: The user's primary natural language prompt for the AI.
  - `aiInstruction: string`: **The current global AI system instruction (editable by user) which defines the AI's persona and general rules.**
  - `expectedOutputInstruction: string`: **The current expected JSON schema/format for the AI's output (editable by user).**
  - `requestType: RequestType`: **The selected type of AI request (e.g., `TEXT_ONLY`, `TEXT_WITH_IMAGE`), influencing the backend's LLM interaction.**
  - `uploadedFileData: string | null`: **Base64 encoded content of a file or image uploaded by the user to provide additional AI context.**
  - `uploadedFileMimeType: string | null`: **The MIME type of the `uploadedFileData` (e.g., `image/png`, `text/plain`).**
  - `currentProjectPath: string | null`: The absolute path of the project root being worked on, typically set from `VITE_BASE_DIR` or user input.
  - `response: string | null`: The AI's last raw response string (legacy, superseded by `lastLlmResponse`).
  - `loading: boolean`: General loading state for AI generation or other heavy operations specific to the AI Editor.
  - `error: string | null`: General error message for AI Editor operations (e.g., failed AI generation, diff fetching errors).
  - `scanPathsInput: string`: A comma-separated string of relative file/folder paths for the AI to focus its analysis.
  - `lastLlmResponse: ModelResponse | null`: The full structured response from the AI after code generation, including a summary, thought process, and an array of `FileChange` objects.
  - `selectedChanges: Record<string, FileChange>`: A map where keys are `filePath` strings and values are `FileChange` objects, representing the AI-suggested changes that the user has selected to apply.
  - `currentDiff: string | null`: The content of the git diff for the file currently being previewed (e.g., after clicking 'View Git Diff').
  - `diffFilePath: string | null`: The `filePath` of the file whose diff is currently displayed in `currentDiff`.
  - `applyingChanges: boolean`: Indicates if the process of applying selected proposed changes to the file system is currently in progress.
  - `appliedMessages: string[]`: An array of messages received from the backend after attempting to apply changes, providing feedback on success or failure for each change.
  - `openedFile: string | null`: The absolute path of the file currently opened for viewing in the dedicated editor panel.
  - `openedFileContent: string | null`: The actual content (string) of the `openedFile`.
  - `isFetchingFileContent: boolean`: A boolean indicating if the content of the `openedFile` is currently being fetched from the backend.
  - `fetchFileContentError: string | null`: Stores any error message if fetching `openedFileContent` fails.

- **Actions**:
  - `setInstruction(instruction: string)`: Updates the AI prompt string.
  - `setAiInstruction(instruction: string)`: Updates the global AI system instruction.
  - `setExpectedOutputInstruction(instruction: string)`: Updates the expected output JSON schema instruction.
  - `setRequestType(type: RequestType)`: Sets the selected AI request type.
  - `setUploadedFile(data: string | null, mimeType: string | null)`: Stores the Base64 file data and its MIME type.
  - `setScanPathsInput(paths: string)`: Updates the comma-separated scan paths string.
  - `setLastLlmResponse(response: ModelResponse | null)`: Stores the AI's full structured response and automatically selects all proposed changes for convenience.
  - `toggleSelectedChange(change: FileChange)`: Adds or removes a `FileChange` from `selectedChanges`.
  - `selectAllChanges()`: Selects all `FileChange` objects from `lastLlmResponse`.
  - `deselectAllChanges()`: Clears all selected changes.
  - `setCurrentDiff(filePath: string | null, diffContent: string | null)`: Sets the `diffFilePath` and `currentDiff` to display a specific file's diff.
  - `clearDiff()`: Clears the currently displayed diff.
  - `updateProposedChangeContent(filePath: string, newContent: string)`: Modifies the `newContent` for a specific proposed change, allowing users to edit AI suggestions.
  - `setOpenedFile(filePath: string | null)`: Sets the `filePath` of the file to be opened in the editor panel, triggering content fetch and clearing previous file content/errors.
  - `setOpenedFileContent(content: string | null)`: Sets the content for the `openedFile`.
  - `setIsFetchingFileContent(isLoading: boolean)`: Updates the loading state for `openedFile` content fetching.
  - `setFetchFileContentError(message: string | null)`: Sets an error message if fetching `openedFile` content fails.
  - `setLoading(isLoading: boolean)` / `setError(message: string | null)` / `setApplyingChanges(isApplying: boolean)` / `setAppliedMessages(messages: string[])` / `clearState()`: General state management for the editor's various operational states.

- **Integration**: Primarily consumed by `AiEditorPage.tsx` to drive the core AI interaction and file editing UI. Its actions are also called by `PromptGenerator.tsx` for initiating AI requests and by `fileTreeStore` via `setSelectedFile` to display file contents.

### 3. `fileTreeStore` (`src/stores/fileTreeStore.ts`)

Manages the state of the project file tree displayed in the sidebar.

- **State**:
  - `files: FileEntry[]`: The hierarchical structure of the project files, ready for rendering in a tree view.
  - `flatFileList: ApiFileEntry[]`: The raw, flat list of files returned directly from the API before being transformed into a tree.
  - `expandedDirs: Set<string>`: A set of `filePath` strings for currently expanded directories in the tree.
  - `selectedFile: string | null`: The `filePath` of the file currently selected in the file tree.
  - `isFetchingTree: boolean`: True when the file tree data is currently being fetched from the backend.
  - `fetchTreeError: string | null`: Stores any error messages encountered during file tree fetching.
  - `lastFetchedProjectRoot?: string | null`: Tracks the `projectRoot` of the last _successful_ file tree fetch, used for caching and preventing unnecessary re-fetches.
  - `lastFetchedScanPaths?: string[]`: Tracks the `scanPaths` (parsed array) of the last _successful_ file tree fetch.

- **Actions**:
  - `fetchFiles(projectRoot: string, scanPaths: string[])`: Initiates an API call to fetch project files (`fetchProjectFiles`), constructs the hierarchical tree (`buildFileTree`), and updates the store. It includes logic to prevent redundant fetches if the data is already fresh.
  - `setFiles(files: FileEntry[])`: Updates the hierarchical `files` list.
  - `toggleDirExpansion(filePath: string)`: Toggles the expanded/collapsed state of a directory in `expandedDirs`.
  - `setSelectedFile(filePath: string | null)`: Sets the `selectedFile` in this store and also calls `aiEditorStore.setOpenedFile()` to display the content of the selected file in the main editor panel.
  - `clearFileTree()`: Resets the entire file tree state, including expanded directories and fetched data.

- **Integration**: Used by `FileTree.tsx` and `FileTreeItem.tsx` to render and interact with the file tree. It also actively communicates with `aiEditorStore` to open selected files for content viewing.

### 4. `themeStore` (`src/stores/themeStore.ts`)

Manages the application's current theme mode (light or dark).

- **State**:
  - `mode: 'light' | 'dark'`: The currently active theme mode.

- **Actions**:
  - `toggleTheme()`: Switches between 'light' and 'dark' modes and persists the preference in `localStorage`.
  - `setTheme(mode: 'light' | 'dark')`: Explicitly sets the theme mode.

- **Integration**: Used by `ThemeToggle.tsx` and `main.tsx` to apply the theme to both Material-UI and Tailwind CSS (by toggling a `dark` class on the `body` element). Initialized from `localStorage` or system preference.

## Inter-Store Communication

Stores can interact with each other by calling actions from other stores. This ensures a clear flow of data and updates across different parts of the application, maintaining consistency and reactivity. Key examples include:

- `fileTreeStore.setSelectedFile()` calls `aiEditorStore.setOpenedFile()` to trigger the display of the selected file's content in the main editor area.
- `aiEditorStore.clearState()` also calls `setOpenedFile(null)` to ensure the editor panel is cleared when the main AI editor state is reset.
- `PromptGenerator` updates `aiEditorStore` for all user inputs and triggers actions within `aiEditorStore`, including `setLastLlmResponse`, `setAiInstruction`, `setExpectedOutputInstruction`, `setRequestType`, `setUploadedFile`.
- `aiEditorStore` actions (like `setLastLlmResponse`) automatically update other parts of its own state (like `selectedChanges`).
- `fileTreeStore.fetchFiles` includes logic to prevent redundant fetches based on `lastFetchedProjectRoot` and `lastFetchedScanPaths` stored in its state.
