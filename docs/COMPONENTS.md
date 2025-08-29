# 🧩 Frontend Components Overview

This document provides an overview of the key components in the AI Editor Frontend, categorized by their purpose and location within the `src/components` and `src/pages` directories.

## 📋 Table of Contents

- [Page Components (`src/pages`)](#-page-components-srcpages)
- [Layout Components (`src/components`)](#-layout-components-srccomponents)
- [Functional Components (`src/components`)](#-functional-components-srccomponents)
- [UI Primitives (`src/components/ui`)](#-ui-primitives-srccomponentsui)
- [Feature-Specific Components](#-feature-specific-components)

---

## 📄 Page Components (`src/pages`)

These components represent the top-level views of the application, typically corresponding to a specific route.

- **`App.tsx`**: The root component that sets up `React Router DOM` and defines the main application routes.
- **`AiEditorPage.tsx`**: The core AI editor interface where users provide instructions, view AI responses, manage proposed changes, and apply them.
  - Interacts heavily with `aiEditorStore`.
  - Integrates `CodeMirrorEditor` for code display.
- **`LoginPage.tsx`**: Provides the user interface for authentication, primarily supporting Google and GitHub OAuth logins.
  - Interacts with `authStore` and `authService`.
- **`AuthCallback.tsx`**: A component designed to handle OAuth redirects from the backend, processing tokens and user data, then redirecting to the main application.
  - Parses URL parameters and calls `loginSuccess` from `authStore`.
- **`LandingPage.tsx`**: (If used as initial entry point) A welcoming page with an overview of the application's features and a call to action.
- **`AuthPage.tsx`**: (If used for a generic auth flow) Handles displaying login options and messages based on authentication status.

## 📏 Layout Components (`src/components`)

These components provide structural elements that wrap around page content, ensuring a consistent application layout.

- **`Layout.tsx`**: The main layout wrapper that includes the `Navbar`, a header, and a footer. It uses `Outlet` from `react-router-dom` to render child routes and displays global loading indicators (e.g., for auth status).
- **`Navbar.tsx`**: The top navigation bar, displaying the application title, user authentication status, and login/logout actions.
  - Uses `authStore` to display user info and handle logout.
  - Leverages Material-UI `AppBar` and `Toolbar`.

## 🚀 Functional Components (`src/components`)

Reusable components that encapsulate specific functionalities.

- **`Loading.tsx`**: A simple loading spinner component to indicate ongoing processes.
- **`WelcomeMessage.tsx`**: A basic component to display a welcoming message (e.g., on initial load or a dashboard).

## 🎨 UI Primitives (`src/components/ui`)

Wrapper components around Material-UI components to provide a consistent interface for common UI elements. This allows for easier customization or replacement of the underlying UI library in the future.

- **`Button.tsx`**: A wrapper around `MuiButton`, ensuring consistent styling and props handling.
- **`TextField.tsx`**: A wrapper around `MuiTextField`, providing common props like `fullWidth` and `margin='normal'` by default.
- **`CircularProgress.tsx`**: A wrapper around `MuiCircularProgress`.

## 🛠️ Feature-Specific Components

Components that are tightly coupled to a specific feature or domain within the application.

- **`code-editor/CodeMirrorEditor.tsx`**: A component that integrates the CodeMirror library to provide a feature-rich code editing experience. This is crucial for viewing and potentially editing code within the `AiEditorPage`.
  - Handles syntax highlighting, line numbers, and potentially diff views.
