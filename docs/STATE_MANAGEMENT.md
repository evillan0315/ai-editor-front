# 🎯 State Management with Nanostores

This document details the state management strategy employed in the AI Editor Frontend, primarily using `Nanostores`.

## 📋 Table of Contents

- [Introduction to Nanostores](#-introduction-to-nanostores)
- [Core Concepts](#-core-concepts)
- [Global Stores](#-global-stores)
  - [Authentication Store (`authStore`)](#authentication-store-authstore)
  - [AI Editor Store (`aiEditorStore`)](#ai-editor-store-aieditorstore)
- [Usage in React Components](#-usage-in-react-components)
- [Best Practices](#-best-practices)

---

## ✨ Introduction to Nanostores

`Nanostores` is a small, fast, and scalable state manager for JavaScript applications. It focuses on simplicity and reactivity, providing an atomic approach to state. Unlike larger libraries, Nanostores has a minimal API, making it easy to learn and integrate. It's built on the concept of _stores_ (atomic pieces of state) and _actions_ (functions that modify stores).

## 💡 Core Concepts

- **Stores**: Immutable objects that hold a piece of state. They are created using `map` (for objects/records) or `atom` (for primitive values).
- **Actions**: Functions that are responsible for changing the state within a store. They should be pure functions whenever possible, but can also encapsulate side effects like API calls.
- **Listeners**: Components or other parts of the application can subscribe to store changes and react accordingly.
- **`@nanostores/react`**: A utility library that provides the `useStore` hook, allowing React components to easily subscribe to and consume Nanostores.

## 🌐 Global Stores

Two primary global stores are used in this application:

### Authentication Store (`authStore`)

- **File**: `src/stores/authStore.ts`
- **Purpose**: Manages the authentication state of the user, including login status, user profile data, loading indicators for auth operations, and any authentication-related errors.
- **State (`AuthState`)**:
  ```typescript
  export interface AuthState {
    isLoggedIn: boolean; // True if a user is logged in
    user: UserProfile | null; // User details if logged in
    loading: boolean; // Indicates if authentication status is being checked
    error: string | null; // Any authentication error messages
  }
  ```
- **Actions**:
  - `loginSuccess(user: UserProfile, token?: string)`: Sets the user as logged in, stores user data, and optionally persists the token (e.g., in `localStorage`).
  - `logout()`: Clears user data, sets `isLoggedIn` to `false`, and removes the token from `localStorage`.
  - `setLoading(isLoading: boolean)`: Updates the loading state.
  - `setError(message: string | null)`: Sets or clears an error message.
  - `getToken()`: Retrieves the `accessToken` from `localStorage`.

### AI Editor Store (`aiEditorStore`)

- **File**: `src/stores/aiEditorStore.ts`
- **Purpose**: Manages all state related to the AI Code Editor functionality, including user input, AI responses, proposed changes, diff views, and operation status.
- **State (`AiEditorState`)**:
  ```typescript
  export interface AiEditorState {
    instruction: string; // User's prompt to the AI
    currentProjectPath: string | null; // The root path of the project being edited
    response: string | null; // AI's last raw response (deprecated, now uses lastLlmResponse)
    loading: boolean; // Indicates if AI is generating or diffing
    error: string | null; // Any errors from AI generation or file operations
    scanPathsInput: string; // User-defined paths for AI to scan
    lastLlmResponse: LlmResponse | null; // Structured AI response with proposed changes
    selectedChanges: Record<string, ProposedFileChange>; // Map of changes selected by user for application
    currentDiff: string | null; // Content of the currently viewed diff
    diffFilePath: string | null; // File path for the current diff
    applyingChanges: boolean; // Indicates if applying changes operation is in progress
    appliedMessages: string[]; // Messages received after applying changes
  }
  ```
- **Actions**: A comprehensive set of actions for:
  - Setting instruction, loading, and error states.
  - Clearing the entire editor state.
  - Managing `scanPathsInput`.
  - Storing and processing `lastLlmResponse`.
  - Toggling, selecting, and deselecting proposed file changes (`selectedChanges`).
  - Setting and clearing the `currentDiff` and `diffFilePath`.
  - Managing `applyingChanges` status and `appliedMessages`.

## 🔄 Usage in React Components

Components interact with Nanostores using the `useStore` hook from `@nanostores/react`.

**Example (`Navbar.tsx` using `authStore`):**

```typescript
import React from 'react';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';

const Navbar: React.FC = () => {
  const { isLoggedIn, user, loading } = useStore(authStore); // Subscribe to authStore

  // ... component logic ...

  return (
    // ... JSX using isLoggedIn, user, loading ...
  );
};
```

**Example (`AiEditorPage.tsx` using `aiEditorStore` and its actions):**

```typescript
import React from 'react';
import { useStore } from '@nanostores/react';
import { aiEditorStore, setLoading, setInstruction } from '@/stores/aiEditorStore';

const AiEditorPage: React.FC = () => {
  const { instruction, loading } = useStore(aiEditorStore); // Subscribe to editor state

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInstruction(event.target.value); // Dispatch an action to update the store
  };

  const handleSubmit = async () => {
    setLoading(true); // Dispatch a loading action
    // ... async operation ...
    setLoading(false);
  };

  return (
    <input type="text" value={instruction} onChange={handleChange} disabled={loading} />
    <button onClick={handleSubmit} disabled={loading}>Submit</button>
  );
};
```

## ✅ Best Practices

- **Encapsulate State Logic**: All state modifications should occur through functions (actions) defined alongside the store, promoting a centralized and predictable state flow.
- **Atomic Stores**: Keep stores focused on a single domain of state. Avoid creating monolithic stores that handle unrelated data.
- **Derived State**: For computed values based on store data, derive them within the component or define a getter function on the store itself rather than storing redundant data.
- **Immutability**: Nanostores naturally encourages immutability. When updating map stores, always create new objects for nested changes to ensure reactivity.
- **Clear Naming**: Use clear and descriptive names for stores and their actions.
