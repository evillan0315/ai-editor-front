import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Loading from './components/Loading'; // Import the Loading component

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

function App() {
  return (
    <Routes>
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
  );
}

export default App;
