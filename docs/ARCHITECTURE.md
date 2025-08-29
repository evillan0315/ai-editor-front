# 🏗️ Frontend Architecture Overview

This document outlines the architectural choices and patterns used in the AI Editor Frontend application. The goal is to provide a clear understanding of how different parts of the application interact and to guide future development.

## 📋 Table of Contents

- [Technology Stack](#-technology-stack)
- [Application Flow](#-application-flow)
- [Folder Structure](#-folder-structure)
- [Key Architectural Decisions](#-key-architectural-decisions)

---

## 💻 Technology Stack

The frontend is built using the following core technologies:

- **React**: A declarative, component-based JavaScript library for building user interfaces.
- **Vite**: A next-generation frontend tooling that provides an extremely fast development experience with features like instant server start, HMR, and optimized builds.
- **TypeScript**: A strongly typed superset of JavaScript that adds type safety, improving code quality and maintainability.
- **Nanostores**: A tiny, efficient state management library for React and other frameworks, focusing on simplicity and performance.
- **Material-UI (MUI)**: A comprehensive React UI framework that implements Google's Material Design, providing a rich set of pre-built, accessible, and customizable components.
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs without leaving your HTML.
- **React Router DOM**: For declarative routing within the single-page application.
- **Axios / Fetch API**: For making HTTP requests to the backend API.

---

## 🌊 Application Flow

1.  **Entry Point (`main.tsx`)**: The application starts by rendering the `App` component within `React.StrictMode` and `BrowserRouter`.
2.  **Authentication (`AuthContext.tsx`, `authStore.ts`, `services/authService.ts`)**:
    - Authentication status is managed globally using `nanostores` (`authStore`).
    - `AuthContext` (though currently replaced by nanostores in `Layout` and `Navbar` for direct use) previously provided a React Context approach.
    - `authService` handles API calls related to login/logout and checking authentication status.
    - `Layout` component triggers `checkAuthStatus` on mount to verify user session.
3.  **Routing (`App.tsx`, `routes/index.tsx`)**: `React Router DOM` defines the application's routes, mapping URLs to page components. The main routes are `/` (AI Editor), `/login`, and `/auth/callback`.
4.  **Layout (`Layout.tsx`)**: A wrapper component that provides a consistent structure (Navbar, header, footer) around the main content rendered by `Outlet`.
5.  **AI Editor Core (`AiEditorPage.tsx`, `aiEditorStore.ts`, `api/llm.ts`, `api/file.ts`)**:
    - The `AiEditorPage` is the central hub for AI interaction.
    - It uses `aiEditorStore` to manage its local state (user instructions, AI response, loading states, selected changes, diffs).
    - `api/llm.ts` and `api/file.ts` contain functions for communicating with the backend's AI and file system endpoints.
6.  **Component Interaction**: Components consume global state from `nanostores` (via `@nanostores/react`) or local component state and dispatch actions to update state or interact with services.

---

## 📁 Folder Structure

The project adheres to a modular and feature-sliced structure:

- `public/`: Static assets (e.g., `vite.svg`).
- `src/`:
  - `api/`: Defines client functions for interacting with specific backend API endpoints (e.g., `auth.ts`, `llm.ts`, `file.ts`). These abstract the raw `fetch` calls.
  - `assets/`: Images, icons, or other static media used by the frontend.
  - `components/`: Reusable UI components. Organized further into general components (e.g., `Layout`, `Navbar`), feature-specific components (e.g., `code-editor`), and generic UI primitives (`ui/Button.tsx`).
  - `constants/`: Global application constants (e.g., `APP_NAME`, AI prompt instructions).
  - `context/`: React Contexts (e.g., `AuthContext`, though `nanostores` are now preferred for global state).
  - `hooks/`: Custom React hooks for encapsulating reusable logic (e.g., `useAuth`).
  - `pages/`: Top-level components that represent distinct views or routes in the application (e.g., `AiEditorPage`, `LoginPage`).
  - `routes/`: Centralized routing configuration (currently defined in `App.tsx`).
  - `services/`: Encapsulates business logic that might involve multiple API calls or complex state transformations before updating stores (e.g., `authService`).
  - `stores/`: `Nanostores` definitions for global state management (e.g., `authStore`, `aiEditorStore`).
  - `types/`: TypeScript interface and type definitions, organized by domain (e.g., `auth.ts`, `llm.ts`, `index.ts` for general types).
  - `utils/`: General-purpose utility functions that don't belong to a specific feature or component (e.g., `debounce`, path utilities).

---

## ⚙️ Key Architectural Decisions

- **State Management with Nanostores**: Chosen for its simplicity, small bundle size, and performance. It provides a reactive, observable pattern that integrates well with React via `@nanostores/react`.
- **Material-UI for UI Components**: Accelerates UI development with pre-built, customizable, and accessible components adhering to Material Design guidelines.
- **Tailwind CSS for Styling**: Provides a utility-first approach for highly granular styling and rapid prototyping, complementing Material-UI for custom layouts and overrides.
- **Type Safety with TypeScript**: Enforces strict typing across the application, reducing bugs and improving code readability and maintainability, especially in larger codebases.
- **Clear Separation of Concerns**: `api/` for network, `services/` for business logic, `stores/` for state, `components/` for UI, and `pages/` for views. This separation makes the codebase easier to understand, test, and maintain.
- **Vite for Development & Build**: Provides a blazing fast development experience and an optimized production build process.
