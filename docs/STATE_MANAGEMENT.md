# 💡 State Management with Nanostores

This document describes the state management strategy employed in the AI Editor Frontend, which utilizes [Nanostores](https://nanostores.github.io/). Nanostores is a small, fast, and unopinionated state manager that leverages atomic stores and reactive updates.

## 🌟 Why Nanostores?

- **Simplicity**: Minimal API, easy to learn and use.
- **Performance**: Optimized for reactivity and avoiding unnecessary re-renders.
- **Flexibility**: Works well with React (via `@nanostores/react`) and other frameworks.
- **TypeScript-first**: Excellent TypeScript support for fully type-safe state.
- **Atomic Updates**: Each piece of state can be managed independently, making updates precise and predictable.

## 🏛️ Core Principles

1.  **Centralized Stores**: Global application state is held in distinct Nanostore instances (`map` stores for complex objects, `atom` stores for single values).
2.  **Explicit Actions**: State mutations are performed through dedicated functions (actions) that interact with the stores, ensuring predictable state transitions.
3.  **Reactive UI**: React components subscribe to relevant parts of the state using the `useStore` hook from `@nanostores/react`, re-rendering only when the subscribed state changes.

## 📦 Key Stores

The application's state is organized into several distinct Nanostores, each responsible for a specific domain.

### 🔒 `authStore` (`src/stores/authStore.ts`)

Manages all authentication-related state.

- **State**: `isLoggedIn` (boolean), `user` (UserProfile | null), `loading` (boolean, for auth operations), `error` (string | null).
- **Actions**: `loginSuccess`, `logout`, `setLoading`, `setError`.
- **Usage**: Components like `Navbar`, `LoginPage`, `RegisterPage`, and `AuthCallback` consume and update this store.

### 🤖 `aiEditorStore` (`src/stores/aiEditorStore.ts`)

Handles all state related to the core AI code editing functionality.

- **State**:
  - `instruction` (string): The user's main prompt.
  - `aiInstruction` (string): Customizable system instructions for the AI.
  - `expectedOutputInstruction` (string): Customizable JSON schema for AI output.
  - `requestType` (RequestType): The selected mode for AI interaction (e.g., `TEXT_ONLY`, `LLM_GENERATION`).
  - `uploadedFileData`, `uploadedFileMimeType` (string | null): For multi-modal inputs.
  - `currentProjectPath` (string | null): The root directory of the project being edited.
  - `lastLlmResponse` (ModelResponse | null): The full structured response from the AI.
  - `selectedChanges` (Record<string, FileChange>): A map of selected AI-proposed file changes.
  - `currentDiff`, `diffFilePath` (string | null): For displaying Git diffs.
  - `loading`, `error`, `applyingChanges`, `appliedMessages` (boolean/string[]).
  - `gitInstructions` (string[] | null), `runningGitCommandIndex`, `commandExecutionOutput`, `commandExecutionError`: For Git command execution within the UI.
  - `openedFile`, `openedFileContent`, `isFetchingFileContent`, `fetchFileContentError`: For viewing files from the file tree.
  - `autoApplyChanges` (boolean): Option to automatically apply changes after AI generation.
- **Actions**: `setInstruction`, `setAiInstruction`, `setExpectedOutputInstruction`, `setRequestType`, `setUploadedFile`, `setLoading`, `setError`, `clearState`, `setScanPathsInput`, `setLastLlmResponse`, `toggleSelectedChange`, `selectAllChanges`, `deselectAllChanges`, `setCurrentDiff`, `clearDiff`, `setApplyingChanges`, `setAppliedMessages`, `updateProposedChangeContent`, `updateProposedChangePath`, `setOpenedFile`, `setOpenedFileContent`, `setIsFetchingFileContent`, `setFetchFileContentError`, `setRunningGitCommandIndex`, `setCommandExecutionOutput`, `setCommandExecutionError`, `setAutoApplyChanges`, `applyAllProposedChanges`.
- **Usage**: Primarily used by `AiEditorPage`, `PromptGenerator`, `AiResponseDisplay`, `ProposedChangeCard`, and `OpenedFileViewer`.

### 🌳 `fileTreeStore` (`src/stores/fileTreeStore.ts`)

Manages the interactive file tree state.

- **State**:
  - `files` (FileEntry[]): The hierarchical representation of the project's file structure.
  - `flatFileList` (ApiFileScanResult[]): A flattened list of all scanned files, primarily for AI context.
  - `expandedDirs` (Set<string>): Stores the paths of currently expanded directories.
  - `selectedFile` (string | null): The path of the currently selected file.
  - `isFetchingTree`, `fetchTreeError` (boolean/string | null): For loading status.
  - `lastFetchedProjectRoot`, `lastFetchedScanPaths` (string | null / string[]).
  - `loadingChildren` (Set<string>): Tracks which directories are currently fetching their children.
- **Actions**: `setFiles`, `toggleDirExpansion`, `setSelectedFile`, `loadInitialTree`, `loadChildrenForDirectory`, `clearFileTree`.
- **Usage**: `FileTree`, `FileTreeItem`, and `FilePickerDialog` interact with this store.

### 🎨 `themeStore` (`src/stores/themeStore.ts`)

Manages the application's UI theme (light/dark mode).

- **State**: `mode` ('light' | 'dark').
- **Actions**: `toggleTheme`, `setTheme`.
- **Usage**: `ThemeToggle` component and `main.tsx` (to apply Tailwind dark class) interact with this store.

### 🎵 `spotifyStore` (`src/stores/spotifyStore.ts`)

Manages the state for the Spotify-like music player application.

- **State**: `currentTrack`, `isPlaying`, `progress`, `volume`, `shuffle`, `repeat`, `playlist`, `loading`, `error`.
- **Actions**: `setCurrentTrack`, `togglePlayPause`, `setPlaybackProgress`, `setVolume`, `toggleShuffle`, `toggleRepeat`, `setLoading`, `setError`.
- **Usage**: Components within `src/pages/spotify/` consume and update this store.

### 🌍 `translatorStore` (`src/stores/translatorStore.ts`)

Manages the state for the AI Translator application.

- **State**: `inputText`, `uploadedFileData`, `uploadedFileName`, `uploadedFileMimeType`, `targetLanguage`, `translatedContent`, `loading`, `error`.
- **Actions**: `setInputText`, `setUploadedFile`, `setTargetLanguage`, `setTranslatedContent`, `setLoading`, `setError`, `clearTranslatorState`.
- **Usage**: `TranslatorAppPage` uses this store for its functionality.

## 🤝 Interacting with Stores

- **Reading State in Components**: Use the `useStore` hook from `@nanostores/react`.

  ```typescript
  import { useStore } from '@nanostores/react';
  import { authStore } from '@/stores/authStore';

  const { isLoggedIn, user } = useStore(authStore);
  ```

- **Updating State (Actions)**: Call the exported action functions from the store modules.

  ```typescript
  import { authStore, loginSuccess } from '@/stores/authStore';

  // ... in a function or useEffect
  loginSuccess({ id: '1', email: 'test@example.com' }, 'token123');
  ```

This modular approach to state management keeps the application organized, maintainable, and highly performant.
