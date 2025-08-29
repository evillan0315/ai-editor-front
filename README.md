# 🚀 AI Editor Frontend

[![License](https://img.shields.io/github/license/evillan0315/ai-editor-front)](LICENSE)
[![Issues](https://img.shields.io/github/issues/evillan0315/ai-editor-front)](https://github.com/evillan0315/ai-editor-front/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/evillan0315/ai-editor-front)](https://github.com/evillan0315/ai-editor-front/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/evillan0315/ai-editor-front)](https://github.com/evillan0315/ai-editor-front/commits)

> A React frontend for the AI Editor backend, built with Vite, React, Nanostores, Tailwind CSS, and Material-UI, focusing on intelligent code assistance and file system interaction.

---

## 📖 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)
- [Contact](#-contact)

---

## ✨ Features

- 🤖 **AI-Powered Code Generation & Modification**: Interact with a powerful AI to generate new files, modify existing ones, or delete files based on natural language instructions.
- 💡 **Interactive Proposed Changes**: View AI's proposed changes with detailed file paths, action types (ADD, MODIFY, DELETE), and AI-generated reasons. Selectively apply or discard individual changes, and even edit the proposed content before application.
- 📊 **Git Diff Visualization**: Inspect detailed git diffs for proposed modifications and deletions directly within the editor before applying changes, ensuring transparency and control.
- 🔒 **Secure Authentication**: Seamlessly log in using Google or GitHub OAuth2 for secure access to the editor, with user session management handled by the backend.
- 📂 **Project Context & Scanning**: Specify a project root path and relevant scan paths for the AI to analyze, providing crucial context for intelligent code suggestions and understanding project structure.
- 🚀 **File Tree Navigation**: Browse your project's file structure with an interactive file tree, allowing for easy exploration and selection of files, and viewing their content.
- 🌍 **Modern UI/UX**: Built with React, Material-UI, and Tailwind CSS for a responsive, accessible, and intuitive user experience.
- ⚡ **Vite Development**: Fast development and build times powered by Vite, providing a modern and efficient development workflow.

---

## 📂 Project Structure

```bash
ai-editor-front/
├── public/             # Static assets (e.g., vite.svg)
├── src/                # Source code for the React application
│   ├── api/            # API client functions for interacting with the backend (e.g., auth, file, LLM operations)
│   ├── assets/         # Static assets like images/icons (e.g., react.svg)
│   ├── components/     # Reusable React components
│   │   ├── code-editor/ # CodeMirror editor component for displaying and editing code
│   │   ├── file-tree/  # Components for rendering and interacting with the project's file tree
│   │   ├── ui/         # Wrapper components for Material-UI elements (e.g., Button, TextField, CircularProgress)
│   │   └── ...         # Other general UI components (e.g., Layout, Navbar, Loading, WelcomeMessage)
│   ├── constants/      # Global constants, AI instruction templates, and configuration values
│   ├── context/        # React Contexts (e.g., AuthContext, though Nanostores is the primary state management solution)
│   ├── hooks/          # Custom React hooks (e.g., useAuth for simplified authentication access)
│   ├── pages/          # Top-level page components, defining the main views of the application (e.g., AiEditorPage, LoginPage, AuthCallback, LandingPage)
│   ├── routes/         # Application routing setup (currently defined in App.tsx using React Router DOM)
│   ├── services/       # Business logic for API calls, authentication state management, and other non-UI related operations (e.g., authService)
│   ├── stores/         # Nanostores for centralized, reactive global state management (e.g., authStore, aiEditorStore, fileTreeStore)
│   ├── types/          # TypeScript type definitions for API responses, application state, and domain models
│   └── utils/          # General utility functions (e.g., path manipulation, debounce, file tree building)
├── .env                # Environment variables (local overrides for development, not committed)
├── .env.local          # Local environment variables (sensitive data, not committed to VCS)
├── eslint.config.ts    # ESLint configuration for code quality and style
├── index.html          # Main HTML entry point for the single-page application
├── package.json        # Project dependencies, scripts, and metadata
├── README.md           # Project documentation (this file)
├── tsconfig.json       # TypeScript configuration for the project
└── vite.config.ts      # Vite build configuration, including proxy setup for API calls
```

---

## 📋 Requirements

- Node.js >= 18
- AI Editor Backend (running and accessible via `VITE_API_URL`)

---

## 🛠️ Installation

```bash
# Navigate to the project root (ai-editor-front)
cd ai-editor-front

# Install dependencies
pnpm install # or npm install / yarn install
```

---

## ⚙️ Usage

```bash
# Development server (runs on port 3001 by default)
pnpm run dev

# Build for production
pnpm run build

# Start production build (requires a build first)
pnpm run preview
```

---

## 📖 API Reference

This frontend interacts with the `ai-editor` backend. Please refer to the backend documentation for detailed API endpoints for authentication, AI code generation, and file operations.

---

## 🔑 Environment Variables

Create a `.env` file in the root directory of `ai-editor-front`. **Do not commit `.env.local` to version control.**

```ini
VITE_API_URL=http://localhost:3000          # The URL of your AI Editor backend API
VITE_FRONTEND_URL=http://localhost:3001     # The URL where your frontend is hosted (e.g., for OAuth redirects)
VITE_BASE_DIR=/path/to/your/project/root    # **Optional**: Default project root to pre-fill in the editor. Can be overridden in the UI.
# The following are used by the backend for constructing OAuth redirect URLs, but are included here for completeness.
# The actual values for these environment variables should be configured in your backend service.
GITHUB_CALLBACK_URL=/auth/github/callback   # Relative path for GitHub OAuth callback (handled by backend)
GOOGLE_CALLBACK_URL=/auth/google/callback   # Relative path for Google OAuth callback (handled by backend)
```

---

## 🧪 Testing

```bash
# Run all tests (currently placeholder, update as testing framework is integrated)
npm test

# With coverage
npm run test:coverage
```

---

## 📦 Deployment

- **Vercel**
  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/evillan0315/ai-editor-front)

---

## 📊 Roadmap

- [ ] **Real-time File Content Editing**: Enable editing the content of _any_ selected file from the file tree in a dedicated editor panel, beyond just AI-proposed changes, with options to save changes.
- [ ] **WebSocket Integration**: Implement real-time updates from the backend, such as file system changes, AI generation progress, and new notifications.
- [ ] **Enhanced Error Handling & Feedback**: Improve user-facing error messages, loading indicators, and success notifications across the application.
- [ ] **Dedicated Settings Page**: Develop a page for user preferences, AI model selection, API key configurations, and other configurable options.
- [ ] **Local Authentication**: Implement standard email/password login and registration forms for users who prefer not to use OAuth providers.
- [ ] **UI/UX Refinements**: Continuous improvements to the user interface for a smoother and more intuitive experience.

---

## 🤝 Contributing

Contributions are welcome!
Please read [CONTRIBUTING.md](https://github.com/evillan0315/ai-editor-front/blob/main/CONTRIBUTING.md) for details.

---

## 📜 License

Distributed under the MIT License. See [LICENSE](https://github.com/evillan0315/ai-editor-front/blob/main/LICENSE) for more information.

---

## 🙌 Acknowledgements

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Nanostores](https://nanostores.github.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Material-UI](https://mui.com/)
- [CodeMirror](https://codemirror.net/)
- [path-browserify](https://www.npmjs.com/package/path-browserify)
- [socket.io-client](https://socket.io/docs/v4/client-api/)
- [React Router DOM](https://reactrouter.com/en/main)

---

## 📬 Contact

Created by [@evillan0315](https://github.com/evillan0315) – feel free to reach out!
