import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Loading from './components/Loading'; // Import the Loading component
import CustomSnackbar from '@/components/Snackbar'; // Import global snackbar
import { useStore } from '@nanostores/react';
import { aiEditorStore, hideGlobalSnackbar } from '@/stores/aiEditorStore'; // Import aiEditorStore for snackbar

// Dynamically import page components
const HomePage = lazy(() => import('./pages/HomePage')); // New
const DashboardPage = lazy(() => import('./pages/DashboardPage')); // New
const AppsPage = lazy(() => import('./pages/AppsPage')); // New
const AiEditorPage = lazy(() => import('./pages/AiEditorPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const SpotifyAppPage = lazy(() => import('./pages/SpotifyAppPage')); // New: Spotify-like app page
const TranslatorAppPage = lazy(() => import('./pages/TranslatorAppPage')); // New: Translator app page
const GeminiLiveAudioPage = lazy(() => import('./pages/GeminiLiveAudioPage')); // New: Gemini Live Audio Page
const PreviewAppPage = lazy(() => import('./pages/PreviewAppPage')); // New: Preview Built App Page
const OrganizationPage = lazy(() => import('./pages/OrganizationPage')); // New: Organization Management Page
const ProjectsPage = lazy(() => import('./pages/ProjectsPage')); // New: Project Management Page
const UserProfilePage = lazy(() => import('./pages/UserProfilePage')); // New: User Profile Page
const UserSettingsPage = lazy(() => import('./pages/UserSettingsPage')); // New: User Settings Page
const TranscriptionPage = lazy(() => import('./pages/TranscriptionPage')); // NEW: Transcription Page
const TerminalPage = lazy(() => import('./pages/TerminalPage')); // NEW: Transcription Page
const LlmGenerationPage = lazy(() => import('./pages/LlmGenerationPage')); // NEW: LLM Generation Page
const ResumeBuilderPage = lazy(() => import('./pages/ResumeBuilderPage')); // NEW: Resume Builder Page

import '@xterm/xterm/css/xterm.css';
function App() {
  const { snackbar } = useStore(aiEditorStore);

  const handleSnackbarClose = () => {
    hideGlobalSnackbar();
  };

  return (
    <>
      <Routes>
        {/* Layout component now handles rendering of Navbar and potential right sidebar */}
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={<Loading />}>
                <HomePage />
              </Suspense>
            }
          />
          <Route
            path="/editor"
            element={
              <Suspense
                fallback={
                  <Loading type="gradient" message="Loading playground" />
                }
              >
                <AiEditorPage />
              </Suspense>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<Loading />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/apps"
            element={
              <Suspense fallback={<Loading />}>
                <AppsPage />
              </Suspense>
            }
          />
          {/* New route for the Spotify-like app */}
          <Route
            path="/apps/spotify"
            element={
              <Suspense fallback={<Loading />}>
                <SpotifyAppPage />
              </Suspense>
            }
          />
          {/* New route for the Translator app */}
          <Route
            path="/apps/translator"
            element={
              <Suspense fallback={<Loading />}>
                <TranslatorAppPage />
              </Suspense>
            }
          />
          {/* New route for Gemini Live Audio */}
          <Route
            path="/apps/gemini-live-audio"
            element={
              <Suspense fallback={<Loading />}>
                <GeminiLiveAudioPage />
              </Suspense>
            }
          />
          {/* New route for Preview Built App */}
          <Route
            path="/apps/preview"
            element={
              <Suspense fallback={<Loading />}>
                <PreviewAppPage />
              </Suspense>
            }
          />
          {/* NEW: Route for Audio Transcription */}
          <Route
            path="/apps/transcription"
            element={
              <Suspense fallback={<Loading />}>
                <TranscriptionPage />
              </Suspense>
            }
          />
          {/* NEW: Route for Terminal  */}
          <Route
            path="/apps/terminal"
            element={
              <Suspense fallback={<Loading />}>
                <TerminalPage />
              </Suspense>
            }
          />
          {/* NEW: Route for LLM Generation */}
          <Route
            path="/apps/llm-generation"
            element={
              <Suspense fallback={<Loading />}>
                <LlmGenerationPage />
              </Suspense>
            }
          />
          {/* NEW: Route for Resume Builder */}
          <Route
            path="/apps/resume-builder"
            element={
              <Suspense fallback={<Loading />}>
                <ResumeBuilderPage />
              </Suspense>
            }
          />
          {/* New routes for Project Management */}
          <Route
            path="/organizations"
            element={
              <Suspense fallback={<Loading />}>
                <OrganizationPage />
              </Suspense>
            }
          />
          <Route
            path="/organizations/:organizationId/projects"
            element={
              <Suspense fallback={<Loading />}>
                <ProjectsPage />
              </Suspense>
            }
          />

          {/* New routes for User Profile and Settings */}
          <Route
            path="/profile"
            element={
              <Suspense fallback={<Loading />}>
                <UserProfilePage />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<Loading />}>
                <UserSettingsPage />
              </Suspense>
            }
          />

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
