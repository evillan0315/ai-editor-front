import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import AppsPage from '@/pages/AppsPage';
import AiEditorPage from '@/pages/AiEditorPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import AuthCallback from '@/pages/AuthCallback';
import LlmGenerationPage from '@/pages/LlmGenerationPage';
import SpotifyAppPage from '@/pages/SpotifyAppPage';
import TranslatorAppPage from '@/pages/TranslatorAppPage';
import GeminiLiveAudioPage from '@/pages/GeminiLiveAudioPage';
import PreviewAppPage from '@/pages/PreviewAppPage';
import UserSettingsPage from '@/pages/UserSettingsPage';
import UserProfilePage from '@/pages/UserProfilePage';
import OrganizationPage from '@/pages/OrganizationPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ResumeBuilderPage from '@/pages/ResumeBuilderPage';
import RecordingPage from '@/pages/RecordingPage';
import TerminalPage from '@/pages/TerminalPage';
import KanbanBoardPage from '@/pages/KanbanBoardPage';
import SimpleGitPage from '@/pages/SimpleGitPage';

const router = createBrowserRouter(
  createRoutesFromElements(
    <React.Fragment>
      <Route path='/' element={<HomePage />} />
      <Route path='/apps' element={<AppsPage />} />
      <Route path='/ai-editor' element={<AiEditorPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/auth/callback' element={<AuthCallback />} />
      <Route path='/llm-generation' element={<LlmGenerationPage />} />
      <Route path='/spotify-app' element={<SpotifyAppPage />} />
      <Route path='/translator-app' element={<TranslatorAppPage />} />
      <Route path='/gemini-live-audio' element={<GeminiLiveAudioPage />} />
      <Route path='/preview-app' element={<PreviewAppPage />} />
      <Route path='/user-settings' element={<UserSettingsPage />} />
      <Route path='/user-profile' element={<UserProfilePage />} />
      <Route path='/organizations' element={<OrganizationPage />} />
      <Route path='/projects' element={<ProjectsPage />} />
      <Route path='/resume-builder' element={<ResumeBuilderPage />} />
      <Route path='/recordings' element={<RecordingPage />} />
      <Route path='/terminal' element={<TerminalPage />} />
      <Route path='/kanban-board' element={<KanbanBoardPage />} />
      <Route path='/simple-git' element={<SimpleGitPage />} />
    </React.Fragment>
  )
);

export default router;
