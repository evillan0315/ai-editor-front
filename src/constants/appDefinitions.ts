import React from 'react';
import CodeIcon from '@mui/icons-material/Code';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import BugReportIcon from '@mui/icons-material/BugReport';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import TranslateIcon from '@mui/icons-material/Translate';
import MicIcon from '@mui/icons-material/Mic';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // Default/fallback icon
import TranscribeIcon from '@mui/icons-material/Transcribe';

import { Link } from 'react-router-dom';
import { RequestType, LlmOutputFormat, AppDefinition } from '@/types';
import {
  requestTypeIcons,
  defaultRequestTypeIcon,
} from '@/constants/requestTypeIcons';

/**
 * Defines the list of all available applications in the system.
 * This list is used by both the AppsPage and the Navbar's Apps dropdown.
 */
export const appDefinitions: AppDefinition[] = [
  {
    id: 'ai-code-editor',
    title: 'AI Code Editor',
    description:
      'Generate, modify, and analyze code with advanced AI assistance.',
    icon: CodeIcon,
    link: '/editor',
    linkText: 'Open Editor',
  },
  // AI Editor Generators based on RequestType
  {
    id: 'llm-code-generator',
    title: 'LLM Code Generator',
    description: 'Generate or modify code files with pure text instructions.',
    icon:
      requestTypeIcons[RequestType.LLM_GENERATION] || defaultRequestTypeIcon,
    link: `/editor?requestType=${RequestType.LLM_GENERATION}&output=${LlmOutputFormat.JSON}`,
    linkText: 'Generate Code',
    requestType: RequestType.LLM_GENERATION,
    llmOutputFormat: LlmOutputFormat.JSON,
  },
  {
    id: 'text-only-ai-chat',
    title: 'Text-Only AI Chat',
    description: 'Engage in text-based conversations with AI, no file context.',
    icon: requestTypeIcons[RequestType.TEXT_ONLY] || defaultRequestTypeIcon,
    link: `/editor?requestType=${RequestType.TEXT_ONLY}&output=${LlmOutputFormat.TEXT}`,
    linkText: 'Start Chat',
    requestType: RequestType.TEXT_ONLY,
    llmOutputFormat: LlmOutputFormat.TEXT,
  },
  {
    id: 'ai-image-text-input',
    title: 'AI Image & Text Input',
    description: 'Provide an image and text prompt for multi-modal AI tasks.',
    icon:
      requestTypeIcons[RequestType.TEXT_WITH_IMAGE] || defaultRequestTypeIcon,
    link: `/editor?requestType=${RequestType.TEXT_WITH_IMAGE}&output=${LlmOutputFormat.MARKDOWN}`,
    linkText: 'Analyze Image',
    requestType: RequestType.TEXT_WITH_IMAGE,
    llmOutputFormat: LlmOutputFormat.MARKDOWN,
  },
  {
    id: 'ai-file-text-input',
    title: 'AI File & Text Input',
    description: 'Upload a file with text instructions for AI processing.',
    icon:
      requestTypeIcons[RequestType.TEXT_WITH_FILE] || defaultRequestTypeIcon,
    link: `/editor?requestType=${RequestType.TEXT_WITH_FILE}&output=${LlmOutputFormat.MARKDOWN}`,
    linkText: 'Process File',
    requestType: RequestType.TEXT_WITH_FILE,
    llmOutputFormat: LlmOutputFormat.MARKDOWN,
  },
  {
    id: 'live-api-interaction',
    title: 'Live API Interaction',
    description: 'Interact with live APIs through AI-generated requests.',
    icon: requestTypeIcons[RequestType.LIVE_API] || defaultRequestTypeIcon,
    link: `/editor?requestType=${RequestType.LIVE_API}&output=${LlmOutputFormat.JSON}`,
    linkText: 'Use API',
    requestType: RequestType.LIVE_API,
    llmOutputFormat: LlmOutputFormat.JSON,
  },
  {
    id: 'resume-generation',
    title: 'Resume Generation',
    description: 'Generate professional resumes from your profile data.',
    icon:
      requestTypeIcons[RequestType.RESUME_GENERATION] || defaultRequestTypeIcon,
    link: `/editor?requestType=${RequestType.RESUME_GENERATION}&output=${LlmOutputFormat.MARKDOWN}`,
    linkText: 'Create Resume',
    requestType: RequestType.RESUME_GENERATION,
    llmOutputFormat: LlmOutputFormat.MARKDOWN,
  },
  {
    id: 'resume-optimization',
    title: 'Resume Optimization',
    description: 'Optimize your existing resume for job applications.',
    icon:
      requestTypeIcons[RequestType.RESUME_OPTIMIZATION] ||
      defaultRequestTypeIcon,
    link: `/editor?requestType=${RequestType.RESUME_OPTIMIZATION}&output=${LlmOutputFormat.MARKDOWN}`,
    linkText: 'Optimize Resume',
    requestType: RequestType.RESUME_OPTIMIZATION,
    llmOutputFormat: LlmOutputFormat.MARKDOWN,
  },
  {
    id: 'resume-enhancement',
    title: 'Resume Enhancement',
    description:
      'Enhance your resume with AI-powered suggestions and improvements.',
    icon:
      requestTypeIcons[RequestType.RESUME_ENHANCEMENT] ||
      defaultRequestTypeIcon,
    link: `/editor?requestType=${RequestType.RESUME_ENHANCEMENT}&output=${LlmOutputFormat.MARKDOWN}`,
    linkText: 'Enhance Resume',
    requestType: RequestType.RESUME_ENHANCEMENT,
    llmOutputFormat: LlmOutputFormat.MARKDOWN,
  },
  {
    id: 'video-generation',
    title: 'Video Generation',
    description: 'Generate short videos from text descriptions or images.',
    icon:
      requestTypeIcons[RequestType.VIDEO_GENERATION] || defaultRequestTypeIcon,
    link: `/editor?requestType=${RequestType.VIDEO_GENERATION}&output=${LlmOutputFormat.JSON}`,
    linkText: 'Generate Video',
    requestType: RequestType.VIDEO_GENERATION,
    llmOutputFormat: LlmOutputFormat.JSON,
  },
  {
    id: 'image-generation',
    title: 'Image Generation',
    description: 'Create unique images from text prompts or existing images.',
    icon:
      requestTypeIcons[RequestType.IMAGE_GENERATION] || defaultRequestTypeIcon,
    link: `/editor?requestType=${RequestType.IMAGE_GENERATION}&output=${LlmOutputFormat.JSON}`,
    linkText: 'Generate Image',
    requestType: RequestType.IMAGE_GENERATION,
    llmOutputFormat: LlmOutputFormat.JSON,
  },
  // Existing apps
  {
    id: 'music-player',
    title: 'Music Player (Spotify-like)',
    description: 'A music player application with features similar to Spotify.',
    icon: MusicNoteIcon,
    link: '/apps/spotify',
    linkText: 'Open Music Player',
  },
  {
    id: 'ai-translator',
    title: 'AI Translator',
    description:
      'Translate text content or uploaded files into any language with AI.',
    icon: TranslateIcon,
    link: '/apps/translator',
    linkText: 'Open Translator',
  },
  {
    id: 'gemini-live-audio',
    title: 'Live Audio with Gemini',
    description:
      'Interact with Gemini AI using real-time audio input and output.',
    icon: MicIcon,
    link: '/apps/gemini-live-audio',
    linkText: 'Start Live Chat',
  },
  {
    id: 'preview-app',
    title: 'Preview Built App',
    description:
      'View a live preview of your successfully built frontend application.',
    icon: VisibilityIcon,
    link: '/apps/preview',
    linkText: 'Launch Preview',
  },
  {
    id: 'project-management',
    title: 'Project Management',
    description:
      'Create and manage organizations and their associated projects.',
    icon: CorporateFareIcon,
    link: '/organizations',
    linkText: 'Manage Projects',
  },
  {
    id: 'project-settings',
    title: 'Project Settings',
    description: 'Manage project configurations, AI models, and API keys.',
    icon: SettingsSuggestIcon,
    link: '#',
    linkText: 'Configure (Coming Soon)',
  },
  {
    id: 'bug-report',
    title: 'Bug Report',
    description: 'Submit bug reports and track issues within your projects.',
    icon: BugReportIcon,
    link: '#',
    linkText: 'Report (Coming Soon)',
  },
  {
    id: 'audio-transcription',
    title: 'Audio Transcription',
    description: 'Transcribe audio files into text with AI.',
    icon: TranscribeIcon, // Use TranscribeIcon
    link: '/apps/transcription',
    linkText: 'Open Transcriber',
  },
];
