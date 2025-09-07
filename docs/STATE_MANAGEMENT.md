# 🧠 State Management with Nanostores

The Project Board Frontend utilizes [Nanostores](https://nanostores.github.io/) for centralized, reactive global state management. Nanostores are lightweight, framework-agnostic stores that provide a simple yet powerful way to manage application state.

Each major domain or feature in the application has its own dedicated Nanostore, promoting modularity, clear ownership of data, and separation of concerns.

## Core Principles

*   **Atomic Stores**: Each store manages a specific slice of the application state.
*   **Read-Only State**: Stores expose their state as read-only, ensuring that state changes only occur through defined actions.
*   **Explicit Actions**: State mutations are handled by explicit functions (actions) associated with each store, making state changes predictable and traceable.
*   **React Integration**: The `@nanostores/react` library is used to integrate Nanostores with React components, allowing components to efficiently subscribe to and re-render only when the relevant parts of the state change.

## Key Nanostores

Here's an overview of the main Nanostores used in the application:

### 1. `authStore` (`stores/authStore.ts`)

Manages user authentication state.

*   **State**:
    *   `isLoggedIn: boolean`: Indicates if a user is currently logged in.
    *   `user: UserProfile | null`: Contains user details (id, email, name, role, provider).
    *   `loading: boolean`: Tracks if authentication status is being loaded (e.g., on app start or during login/logout).
    *   `error: string | null`: Stores any authentication-related error messages.
*   **Actions**: `loginSuccess`, `logout`, `setLoading`, `setError`, `getToken`.
*   **Purpose**: Provides global access to the current user's authentication status and profile.

### 2. `aiEditorStore` (`stores/aiEditorStore.ts`)

Manages the state for the AI Code Editor page. This is one of the most comprehensive stores.

*   **State**:
    *   `instruction: string`: The user's primary prompt for the AI.
    *   `aiInstruction: string`: The editable system instruction provided to the AI.
    *   `expectedOutputInstruction: string`: The editable instruction for the AI's expected output format.
    *   `requestType: RequestType`: The type of AI request being made (e.g., `LLM_GENERATION`, `TEXT_WITH_IMAGE`).
    *   `llmOutputFormat: LlmOutputFormat`: The desired output format from the LLM (e.g., `JSON`, `YAML`, `MARKDOWN`, `TEXT`).
    *   `uploadedFileData: string | null`: Base64 content of an uploaded file/image for AI context.
    *   `uploadedFileName: string | null`: Name of the uploaded file/image.
    *   `uploadedFileMimeType: string | null`: MIME type of the uploaded file/image.
    *   `currentProjectPath: string | null`: The root path of the project currently loaded in the editor.
    *   `loading: boolean`: Indicates if the AI is processing a request.
    *   `error: string | null`: Stores any AI-related error messages.
    *   `scanPathsInput: string`: Comma-separated string of paths for AI to scan for context.
    *   `lastLlmResponse: ModelResponse | null`: Stores the full structured response from the last AI generation.
    *   `selectedChanges: Record<string, FileChange>`: A map of selected proposed file changes by their `filePath`.
    *   `currentDiff: string | null`: The content of the git diff for the currently viewed file.
    *   `diffFilePath: string | null`: The `filePath` of the file whose diff is currently displayed.
    *   `applyingChanges: boolean`: Tracks if changes are being applied to the file system.
    *   `appliedMessages: string[]`: Messages from the backend after applying changes.
    *   `gitInstructions: string[] | null`: Optional git commands suggested by the LLM.
    *   `runningGitCommandIndex: number | null`: Index of the git command currently being executed from `gitInstructions`.
    *   `commandExecutionOutput: TerminalCommandResponse | null`: Output of the last executed git command.
    *   `commandExecutionError: string | null`: Error from the last executed git command.
    *   `openedFile: string | null`: Path of the file currently opened in the right editor panel.
    *   `openedFileContent: string | null`: Content of the file currently opened.
    *   `isFetchingFileContent: boolean`: Loading state for fetching `openedFileContent`.
    *   `fetchFileContentError: string | null`: Error state for fetching `openedFileContent`.
    *   `autoApplyChanges: boolean`: Flag to automatically apply changes after generation.
*   **Actions**: `setInstruction`, `setAiInstruction`, `setExpectedOutputInstruction`, `setRequestType`, `setLlmOutputFormat`, `setUploadedFile`, `setResponse`, `setLoading`, `setError`, `clearState`, `setScanPathsInput`, `setLastLlmResponse`, `toggleSelectedChange`, `selectAllChanges`, `deselectAllChanges`, `setCurrentDiff`, `clearDiff`, `setApplyingChanges`, `setAppliedMessages`, `updateProposedChangeContent`, `updateProposedChangePath`, `setOpenedFile`, `setOpenedFileContent`, `setIsFetchingFileContent`, `setFetchFileContentError`, `setRunningGitCommandIndex`, `setCommandExecutionOutput`, `setCommandExecutionError`, `setAutoApplyChanges`, `applyAllProposedChanges`.
*   **Purpose**: Manages all dynamic state related to the AI interaction, file tree, file viewing, and change application within the editor.

### 3. `fileTreeStore` (`stores/fileTreeStore.ts`)

Manages the state of the interactive file tree.

*   **State**:
    *   `files: FileEntry[]`: The hierarchical file tree structure.
    *   `flatFileList: ApiFileScanResult[]`: A flat list of all relevant files for AI context.
    *   `expandedDirs: Set<string>`: A set of paths for currently expanded directories.
    *   `selectedFile: string | null`: The path of the currently selected file in the tree.
    *   `isFetchingTree: boolean`: Indicates if the initial file tree is being fetched.
    *   `fetchTreeError: string | null`: Stores any errors during file tree fetching.
    *   `lastFetchedProjectRoot: string | null`: The project root path for which the tree was last fetched.
    *   `lastFetchedScanPaths: string[]`: The scan paths used for the last AI context fetch.
    *   `loadingChildren: Set<string>`: A set of paths for directories whose children are currently being loaded.
*   **Actions**: `setFiles`, `toggleDirExpansion`, `setSelectedFile`, `loadInitialTree`, `loadChildrenForDirectory`, `clearFileTree`.
*   **Purpose**: Provides the data and logic for rendering and interacting with the project's file and folder structure.

### 4. `themeStore` (`stores/themeStore.ts`)

Manages the application's theme mode.

*   **State**:
    *   `mode: 'light' | 'dark'`: The current theme mode.
*   **Actions**: `toggleTheme`, `setTheme`.
*   **Purpose**: Allows users to switch between light and dark themes, persisting the preference in local storage.

### 5. `spotifyStore` (`stores/spotifyStore.ts`)

Manages the state for the Spotify-like music player application.

*   **State**:
    *   `currentTrack: object | null`: Details of the currently playing track.
    *   `isPlaying: boolean`: Playback status.
    *   `progress: number`: Current playback progress in seconds.
    *   `volume: number`: Volume level (0-100).
    *   `shuffle: boolean`: Shuffle mode status.
    *   `repeat: 'off' | 'track' | 'context'`: Repeat mode status.
    *   `playlist: any[]`: Current playlist or queue.
    *   `loading: boolean`: Loading state for music operations.
    *   `error: string | null`: Error messages.
*   **Actions**: `setCurrentTrack`, `togglePlayPause`, `setPlaybackProgress`, `setVolume`, `toggleShuffle`, `toggleRepeat`, `setLoading`, `setError`.
*   **Purpose**: Simulates a music player's playback and queue state.

### 6. `translatorStore` (`stores/translatorStore.ts`)

Manages the state for the AI Translator application.

*   **State**:
    *   `inputText: string`: The text entered by the user for translation.
    *   `uploadedFileData: string | null`: Base64 content of an uploaded file for translation.
    *   `uploadedFileName: string | null`: Name of the uploaded file.
    *   `uploadedFileMimeType: string | null`: MIME type of the uploaded file.
    *   `targetLanguage: string`: The language to translate into.
    *   `translatedContent: string | null`: The result of the AI translation.
    *   `loading: boolean`: Indicates if translation is in progress.
    *   `error: string | null`: Stores any translation-related error messages.
*   **Actions**: `setInputText`, `setUploadedFile`, `setTargetLanguage`, `setTranslatedContent`, `setLoading`, `setError`, `clearTranslatorState`.
*   **Purpose**: Handles the input, target language, and output for the AI translation service.

### 7. `geminiLiveStore` (`stores/geminiLiveStore.ts`)

Manages the state for the Gemini Live Audio chat application.

*   **State**:
    *   `sessionId: string | null`: The active session ID for Gemini Live.
    *   `isSessionActive: boolean`: Indicates if a live session is active.
    *   `isRecording: boolean`: Indicates if microphone audio is currently being recorded and sent.
    *   `microphonePermissionGranted: boolean`: Status of microphone permission.
    *   `userTranscript: string`: Accumulated user transcription (if implemented client-side or received from backend).
    *   `aiResponseText: string`: Accumulated text responses from Gemini AI.
    *   `aiResponseAudioQueue: string[]`: A queue of Base64 audio data URLs for sequential playback of AI responses.
    *   `currentInputText: string`: For sending initial text prompts or direct text input to Gemini.
    *   `loading: boolean`: General loading state for session actions or AI turns.
    *   `error: string | null`: Stores any Gemini Live-related error messages.
*   **Actions**: `setSessionId`, `setIsSessionActive`, `setIsRecording`, `setMicrophonePermissionGranted`, `appendUserTranscript`, `setInitialUserText`, `appendAiResponseText`, `enqueueAiResponseAudio`, `dequeueAiResponseAudio`, `clearAiResponseAudioQueue`, `setLoading`, `setError`, `clearGeminiLiveState`.
*   **Purpose**: Manages the real-time audio interaction state, including session control, recording status, and AI's audio/text responses.

### 8. `contextMenuStore` (`stores/contextMenuStore.ts`)

Manages the visibility and content of dynamic context menus, primarily for the file tree.

*   **State**:
    *   `visible: boolean`: Whether the context menu is currently open.
    *   `x: number`: X-coordinate for positioning the menu.
    *   `y: number`: Y-coordinate for positioning the menu.
    *   `items: ContextMenuItem[]`: An array of menu items to display.
    *   `targetFile: FileEntry | null`: The `FileEntry` that the context menu was opened for.
*   **Actions**: `showFileTreeContextMenu`, `hideFileTreeContextMenu`.
*   **Purpose**: Provides a centralized way to trigger and manage context menus, allowing dynamic definition of menu items based on the context (e.g., specific file type or location).
