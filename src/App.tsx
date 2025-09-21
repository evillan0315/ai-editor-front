import React, { Suspense, lazy, type JSX } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Loading from './components/Loading';
import CustomSnackbar from '@/components/Snackbar';
import { useStore } from '@nanostores/react';
import { snackbarState, hideGlobalSnackbar } from '@/stores/snackbarStore';
import { authStore } from '@/stores/authStore'; // ✅ import auth state

import '@xterm/xterm/css/xterm.css';

// ✅ Route guard component
function RequireAuth({ children }: { children: JSX.Element }) {
  const { isLoggedIn, loading } = useStore(authStore);

  // Show nothing or a loading spinner while checking auth state
  if (loading) return <Loading message="Checking authentication..." />;

  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

// Dynamically import page components
const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AppsPage = lazy(() => import('./pages/AppsPage'));
const AiEditorPage = lazy(() => import('./pages/AiEditorPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const SpotifyAppPage = lazy(() => import('./pages/SpotifyAppPage'));
const TranslatorAppPage = lazy(() => import('./pages/TranslatorAppPage'));
const GeminiLiveAudioPage = lazy(() => import('./pages/GeminiLiveAudioPage'));
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

function App() {
  const snackbar = useStore(snackbarState);

  const handleSnackbarClose = () => {
    hideGlobalSnackbar();
  };

  return (
    <>
      <Routes>
        {/* Routes that require authentication */}
        <Route path="/editor" element={<Layout />}>
          <Route
            path="/editor"
            element={
              <RequireAuth>
                <Suspense
                  fallback={
                    <Loading type="gradient" message="Loading playground" />
                  }
                >
                  <AiEditorPage />
                </Suspense>
              </RequireAuth>
            }
          />
        </Route>

        <Route path="/" element={<Layout />}>
          {/* Public route */}
          <Route
            index
            element={
              <Suspense fallback={<Loading />}>
                <HomePage />
              </Suspense>
            }
          />

          {/* ✅ Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <DashboardPage />
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/apps"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <AppsPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/apps/spotify"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <SpotifyAppPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/apps/translator"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <TranslatorAppPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/apps/gemini-live-audio"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <GeminiLiveAudioPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/apps/preview"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <PreviewAppPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/apps/transcription"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <TranscriptionPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/apps/terminal"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <TerminalPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/apps/llm-generation"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <LlmGenerationPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/apps/resume-builder"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <ResumeBuilderPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/apps/recording"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <RecordingPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/apps/kanban-board"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <KanbanBoardPage />
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/organizations"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <OrganizationPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/organizations/:organizationId/projects"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <ProjectsPage />
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <UserProfilePage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Suspense fallback={<Loading />}>
                  <UserSettingsPage />
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
        </Route>
      </Routes>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
        autoHideDuration={3000}
      />
    </>
  );
}

export default App;
