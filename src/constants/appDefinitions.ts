import { AppDefinition } from '@/types';
import AppsIcon from '@mui/icons-material/Apps';
import TerminalIcon from '@mui/icons-material/Terminal';
import TranslateIcon from '@mui/icons-material/Translate';
import MicIcon from '@mui/icons-material/Mic';
import BuildIcon from '@mui/icons-material/Build';
import CodeIcon from '@mui/icons-material/Code';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';

export const appDefinitions: AppDefinition[] = [
  {
    id: 'ai-editor',
    title: 'AI Editor',
    description: 'Generate code, fix bugs, and refactor your codebase with AI.',
    link: '/editor',
    linkText: 'Open AI Editor',
    icon: CodeIcon,
  },
  {
    id: 'spotify',
    title: 'Spotify-like Music Player',
    description: 'Explore and enjoy a simulated music streaming experience.',
    link: '/apps/spotify',
    linkText: 'Open Music Player',
    icon: LibraryMusicIcon,
  },
  {
    id: 'translator',
    title: 'AI Translator',
    description: 'Translate text content or uploaded files into any language using AI.',
    link: '/apps/translator',
    linkText: 'Open Translator',
    icon: TranslateIcon,
  },
  {
    id: 'gemini-live-audio',
    title: 'Gemini Live Audio Chat',
    description: 'Interact with Gemini AI using real-time audio input and output.',
    link: '/apps/gemini-live-audio',
    linkText: 'Open Audio Chat',
    icon: MicIcon,
  },
  {
    id: 'terminal',
    title: 'Terminal',
    description: 'Access to Terminal for project automation.',
    link: '/apps/terminal',
    linkText: 'Open Terminal',
    icon: TerminalIcon,
  },
  {
    id: 'preview',
    title: 'Preview App',
    description: 'Preview a successfully built frontend application in an iframe.',
    link: '/apps/preview',
    linkText: 'Open Preview',
    icon: BuildIcon,
  },
  {
    id: 'llm-generation',
    title: 'LLM Code Generator',
    description: 'Generate any code using LLM.',
    link: '/apps/llm-generation',
    linkText: 'Open Code Generator',
    icon: AppsIcon,
  },
];
