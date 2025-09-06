import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Loading from './components/Loading'; // Import the Loading component

// Dynamically import page components
const AiEditorPage = lazy(() => import('./pages/AiEditorPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const RegisterPage = lazy(() => import('./pages/RegisterPage')); // Lazy load RegisterPage

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={
            <Suspense fallback={<Loading />}>
              <AiEditorPage />
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
        {/* Add more routes here as needed */}
      </Route>
    </Routes>
  );
}

export default App;
