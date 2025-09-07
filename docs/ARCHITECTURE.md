# 🗺️ High-Level Architecture

This document details the architectural overview of the Project Board Frontend, built using a modern React ecosystem. The application follows a client-server architecture, with the frontend consuming RESTful APIs and WebSocket services provided by the backend.

For a visual representation of the architecture, please refer to the [High-Level Architecture diagram in the README.md](../README.md#%EF%B8%8F-high-level-architecture).

## Frontend Layers

The frontend is structured to promote separation of concerns, maintainability, and scalability.

1.  **React UI Components**: These are the building blocks of the user interface. They are functional components, leveraging React hooks for state and lifecycle management. Components are organized into:
    *   **`pages/`**: Top-level components representing distinct views of the application (e.g., `HomePage`, `AiEditorPage`, `LoginPage`).
    *   **`components/`**: Reusable UI elements. This directory is further subdivided into specialized areas like `dialogs/`, `file-tree/`, and `ui/` to manage complexity.
    *   **`assets/`**: Static files such as images and icons used within the UI.

2.  **State Management (Nanostores)**: Global application state is managed using [Nanostores](https://nanostores.github.io/), a tiny, fast, and unopinionated state manager. Each major domain has its dedicated store (e.g., `authStore`, `aiEditorStore`, `fileTreeStore`, `themeStore`, `spotifyStore`, `translatorStore`, `geminiLiveStore`, `contextMenuStore`), promoting modularity and clear ownership of data. Components consume state via the `@nanostores/react` hook.

3.  **Services / API Clients**: The `services/` and `api/` directories contain the logic for interacting with the backend.
    *   **`services/`**: Encapsulates business logic related to authentication, user sessions, and potentially other domain-specific operations that might involve multiple API calls or complex client-side logic (e.g., `authService.ts`).
    *   **`api/`**: Contains direct API client functions, each corresponding to a specific backend domain (e.g., `api/auth.ts`, `api/file.ts`, `api/llm.ts`, `api/terminal.ts`, `api/translation.ts`, `api/geminiLive.ts`). These functions handle HTTP requests (using `fetch`) and WebSocket communication (`socket.io-client`), abstracting away the network layer from the UI components.

4.  **Routing (React Router DOM)**: Navigation within the Single Page Application (SPA) is handled by `React Router DOM`. Routes are primarily defined in `App.tsx`, mapping URL paths to specific page components.

5.  **Utilities (`utils/`)**: A collection of helper functions, custom hooks, and configurations that are not tied to a specific UI component or data domain. This includes functions for path manipulation, CodeMirror language extensions, and theme integration.

6.  **Constants (`constants/`)**: Stores global constants, default configurations, and AI instruction templates (e.g., `APP_NAME`, `INSTRUCTION`).

7.  **Types (`types/`)**: Centralized TypeScript interface and type definitions for API responses, application state, and domain models, ensuring type safety across the entire frontend.

## Backend Interaction

The frontend communicates with the backend through two primary mechanisms:

1.  **REST API (HTTP/S)**: Most interactions, such as authentication, requesting AI generation, file system operations (listing, reading, applying changes), and running terminal commands, are performed via HTTP/S requests to the NestJS backend's REST API endpoints. The `api/` client functions handle sending authenticated requests (with JWTs stored in HTTP-only cookies managed by the backend) and processing responses.

2.  **WebSocket (Socket.IO)**: For real-time, bidirectional communication, the application uses WebSockets, specifically `socket.io-client`. This is currently leveraged for the `Gemini Live Audio Chat` feature (`/gemini` namespace) to handle streaming audio input and receiving real-time AI audio/text responses. This allows for low-latency, conversational AI experiences.

## Key Architectural Principles

*   **Modular Design**: Code is organized into logical modules (components, services, stores, utils) to enhance readability, maintainability, and reusability.
*   **Type Safety**: Extensive use of TypeScript across the entire codebase to catch errors early and improve developer experience.
*   **Reactive State**: Nanostores provide a reactive programming model, ensuring UI components efficiently update only when relevant parts of the state change.
*   **Separation of Concerns**: Clear boundaries between UI, business logic, and data access layers.
*   **UI/UX Focus**: Built with Material-UI v7 and Tailwind CSS v4 to create a responsive, accessible, and modern user experience.
*   **Performance**: Optimized for fast development and runtime performance using Vite and lazy loading of page components.
