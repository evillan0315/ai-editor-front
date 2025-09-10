# High-Level Architecture

This document outlines the high-level architecture of the `project-board-front` application, detailing its main components and how they interact to provide a rich user experience for AI-powered development.

## Core Principles

-   **Client-Side Rendering (CSR)**: The application is a Single-Page Application (SPA) built with React, rendered entirely on the client-side.
-   **Component-Based**: UI is composed of reusable and isolated React components.
-   **Functional Programming**: Leverages React Hooks and functional components for stateful logic.
-   **Type Safety**: Fully written in TypeScript to ensure type consistency and reduce runtime errors.
-   **Global State Management**: Uses Nanostores for simple, reactive, and efficient global state management.
-   **Styling**: Combines Material UI v7 for robust UI components and Tailwind CSS v4 for utility-first styling and responsive design.
-   **Backend Communication**: Interacts with a NestJS backend via RESTful APIs and WebSockets.

## Main Layers

### 1. Presentation Layer (React UI & Pages)

This layer is responsible for rendering the user interface and handling user interactions. It's built with React, Material UI, and Tailwind CSS.

-   **`src/App.tsx`**: The root component that sets up React Router DOM for client-side navigation.
-   **`src/pages/`**: Contains top-level views of the application, such as `HomePage`, `AiEditorPage`, `AppsPage`, `LoginPage`, `OrganizationPage`, `ProjectsPage`, and various app-specific pages like `SpotifyAppPage`, `TranslatorAppPage`, `GeminiLiveAudioPage`, `PreviewAppPage`.
-   **`src/components/`**: Houses reusable UI components, categorized into:
    -   `ui/`: Basic wrappers for Material UI components (e.g., `Button`, `TextField`).
    -   `dialogs/`: Modal components (e.g., `FileUploaderDialog`, `DirectoryPickerDialog`, `InstructionEditorDialog`).
    -   `file-tree/`: Components specifically for displaying and interacting with the file system tree (`FileTree`, `FileTreeItem`, `FileTreeContextMenuRenderer`).
    -   General components: `Navbar`, `Layout`, `PromptGenerator`, `AiResponseDisplay`, `OpenedFileViewer`, `FileTabs`, `ProposedChangeCard`, `Snackbar`, `ThemeToggle`, `RunScriptMenuItem`.

### 2. State Management Layer (Nanostores)

Nanostores are used for managing the global state of the application. Each store is a lightweight, reactive state container focused on a specific domain.

-   **`src/stores/`**:
    -   `authStore.ts`: Manages user authentication status (`isLoggedIn`, `user`, `loading`, `error`). Actions include `loginSuccess`, `logout`, `setLoading`, `setError`.
    -   `aiEditorStore.ts`: Manages the state for the AI Code Editor, including user prompts, AI's system instructions (`aiInstruction`, `expectedOutputInstruction`), various AI request parameters (`requestType`, `llmOutputFormat`, `uploadedFile`), AI responses (`lastLlmResponse`, `selectedChanges`, `currentDiff`), file application process (`applyingChanges`, `appliedMessages`, `gitInstructions`), and the opened file viewer (`openedFile`, `openedFileContent`, `isOpenedFileDirty`).
    -   `fileTreeStore.ts`: Manages the state of the interactive file tree, including files, expanded directories, and selected files.
    -   `themeStore.ts`: Manages the application's UI theme (light/dark mode).
    -   `spotifyStore.ts`: Manages the state for the Spotify-like music player.
    -   `translatorStore.ts`: Manages the state for the AI Translator application.
    -   `geminiLiveStore.ts`: Manages the state for the Gemini Live Audio interaction, including session ID, recording status, and AI responses.
    -   `contextMenuStore.ts`: Manages the visibility and content of context menus.
    -   `organizationStore.ts`: Manages a list of organizations and the currently selected organization.
    -   `projectStore.ts`: Manages a list of projects for a given organization.

### 3. Service Layer (Frontend Services / API Clients)

This layer contains functions responsible for interacting with the backend API. They encapsulate business logic related to data fetching, submission, and error handling.

-   **`src/api/`**: Contains client functions that make HTTP requests to the NestJS backend.
    -   `auth.ts`: Authentication-related API calls (login, register, logout, check status).
    -   `file.ts`: File system operations (scan, list directory, read, write, apply changes, git diff).
    -   `llm.ts`: LLM interaction (generate code).
    -   `terminal.ts`: Terminal command execution (run command, fetch package scripts).
    -   `translation.ts`: AI translation services.
    -   `geminiLive.ts`: WebSocket client for Gemini Live Audio communication.
    -   `organization.ts`: CRUD operations for organizations.
    -   `project.ts`: CRUD operations for projects.
-   **`src/services/`**: Contains higher-level business logic that might orchestrate multiple API calls or manage local storage (e.g., `authService.ts` wraps API calls and interacts with `authStore`).

### 4. Utility Layer

-   **`src/utils/`**: General-purpose helper functions.
    -   `fileUtils.ts`: Path manipulation, file tree building logic.
    -   `codemirrorTheme.ts`, `diffLanguage.ts`, `index.ts`: CodeMirror extensions for language highlighting and custom theme application.
    -   `debounce.ts`: A utility for debouncing functions.

### 5. Constants and Types

-   **`src/constants/`**: Global application constants, default AI instructions, predefined icons, etc.
-   **`src/types/`**: TypeScript interface and type definitions for data structures used across the application, including API request/response bodies, state shapes, and domain models.

## Interaction Flow Example: AI Code Generation

1.  **User Input**: User types instructions in `PromptGenerator` (Component).
2.  **State Update**: `setInstruction` action updates `aiEditorStore` (Nanostore).
3.  **API Call**: User clicks "Generate", triggering `handleGenerateCode` (Component).
4.  **Service Invocation**: `handleGenerateCode` calls `generateCode` (API Client).
5.  **Backend Request**: `generateCode` makes an HTTP request to `/api/llm/generate-llm` (Backend API).
6.  **AI Interaction**: Backend's LLM Orchestration Service interacts with the AI Provider (e.g., Gemini).
7.  **Backend Response**: AI Provider responds to Backend, which processes it and sends a structured JSON `ModelResponse` to Frontend.
8.  **State Update**: Frontend `generateCode` receives the response and calls `setLastLlmResponse` (Nanostore action).
9.  **UI Render**: `AiResponseDisplay` (Component) reacts to `lastLlmResponse` change and renders the proposed file changes.
10. **User Action**: User reviews changes, optionally edits them in `ProposedChangeCard`, and clicks "Apply Selected Changes" (Component).
11. **Service Invocation**: This triggers `handleApplySelectedChanges` which calls `applyProposedChanges` (API Client).
12. **Backend Execution**: `applyProposedChanges` sends changes to `/api/file/apply-changes` (Backend API), which then modifies files in the Project File System (FS).
13. **Post-Apply Actions**: If auto-apply is enabled or user confirms, `performPostApplyActions` runs `pnpm run build` and AI-suggested Git commands via `/api/terminal/run`.
14. **Feedback**: `Snackbar` (Component) displays success/error messages, reflecting changes applied and any terminal output.
