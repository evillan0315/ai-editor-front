import React, { Suspense, lazy, type JSX } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Navigate,
  createRoutesFromElements,
} from 'react-router-dom';
import Layout from './components/Layout';
import Loading from './components/Loading';
import CustomSnackbar from '@/components/Snackbar';
import { useStore } from '@nanostores/react';
import { snackbarState, hideGlobalSnackbar } from '@/stores/snackbarStore';
import { authStore } from '@/stores/authStore';
import { GlobalDialog } from '@/components/dialogs'; 

import '@xterm/xterm/css/xterm.css';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorPage from './components/ErrorPage';

// ✅ Route guard component
function RequireAuth({ children }: { children: JSX.Element }) {
  const { isLoggedIn, loading } = useStore(authStore);

  // Show nothing or a loading spinner while checking auth state
  if (loading) return <Loading message="Checking authentication..." />;

  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AppsPage = lazy(() => import('./pages/AppsPage'));
const AiEditorPage = lazy(() => import('./pages/AiEditorPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const SpotifyAppPage = lazy(() => import('./pages/SpotifyAppPage'));
const PreviewAppPage = lazy(() => import('./pages/PreviewAppPage'));
const OrganizationPage = lazy(() => import('./pages/OrganizationPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const UserSettingsPage = lazy(() => import('./pages/UserSettingsPage'));
const TranscriptionPage = lazy(() => import('./pages/TranscriptionPage'));
const TerminalPage = lazy(() => import('./pages/TerminalPage'));
const LlmGenerationPage = lazy(() => import('./pages/LlmGenerationPage'));
const ResumeBuilderPage = lazy(() => import('./pages/ResumeBuilderPage'));
const RecordingPage = lazy(() => import('./pages/RecordingPage'));
const KanbanBoardPage = lazy(() => import('./pages/KanbanBoardPage'));
const GitPage = lazy(() =>  import('@/components/git/GitPage'));
const AIChatPage = lazy(() => import('./pages/AIChatPage'));
const SchemeGeneratorPage = lazy(() => import('./pages/SchemeGeneratorPage')); // New: Lazy load SchemeGeneratorPage
const ChatAppComponent = lazy(() => import('./components/chat/ChatApp')); // NEW: Lazy load ChatApp
const PlaywrightPage = lazy(() => import('./pages/PlaywrightPage')); // NEW: Lazy load PlaywrightPage
const SwingersPage = lazy(() => import('./pages/SwingersPage')); // NEW: Lazy load SwingersPage

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      element={<Layout footer={`Developed by Eddie Villanueva`} />}
      errorElement={<ErrorPage />}
    >
      <Route
        index
        element={
          <Suspense fallback={<Loading />}>
            <ErrorBoundary>
              <HomePage />
            </ErrorBoundary>
          </Suspense>
        }
      />

      {/* ✅ Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <DashboardPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/ai-editor"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <AiEditorPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/apps"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <AppsPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/apps/ai-chat"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <AIChatPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      {/* NEW: Route for direct ChatApp component */}
      <Route
        path="/apps/chat-component"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <ChatAppComponent />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/apps/spotify"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <SpotifyAppPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />

    
      <Route
        path="/apps/preview"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <PreviewAppPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/apps/transcription"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <TranscriptionPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/apps/terminal"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <TerminalPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/apps/llm-generation"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <LlmGenerationPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/apps/resume-builder"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <ResumeBuilderPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/apps/recording"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <RecordingPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/apps/kanban-board"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <KanbanBoardPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/apps/simple-git"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <GitPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      {/* New: Route for Schema Generator Page */}
      <Route
        path="/apps/schema-generator"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <SchemeGeneratorPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      {/* NEW: Route for LLM Playwright Page */}
      <Route
        path="/apps/llm-playwright"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <PlaywrightPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      {/* NEW: Route for Swingers Page */}
      <Route
        path="/apps/swingers"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <SwingersPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />

      <Route
        path="/organizations"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <OrganizationPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/organizations/:organizationId/projects"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <ProjectsPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />

      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <UserProfilePage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <UserSettingsPage />
              </ErrorBoundary>
            </Suspense>
          </RequireAuth>
        }
      />

      {/* Public routes */}
      <Route
        path="/login"
        element={
          <Suspense fallback={<Loading />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/register"
        element={
          <Suspense fallback={<Loading />}>
            <RegisterPage />
          </Suspense>
        }
      />
      <Route
        path="/auth/callback"
        element={
          <Suspense fallback={<Loading />}>
            <AuthCallback />
          </Suspense>
        }
      />
    </Route>,
  ),
);

function App() {
  const snackbar = useStore(snackbarState);

  const handleSnackbarClose = () => {
    hideGlobalSnackbar();
  };

  return (
    <>
      <RouterProvider router={router} />

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
        autoHideDuration={3000}
      />
      <GlobalDialog /> 
    </>
  );
}

export default App;
