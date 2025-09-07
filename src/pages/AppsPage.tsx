import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  useTheme,
  Grid,
  Card,
  CardContent,
  Button,
  CardActions,
} from '@mui/material';
import AppsIcon from '@mui/icons-material/Apps';
import CodeIcon from '@mui/icons-material/Code';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import BugReportIcon from '@mui/icons-material/BugReport';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // Default/fallback icon
import MusicNoteIcon from '@mui/icons-material/MusicNote'; // New import for the music app icon
import TranslateIcon from '@mui/icons-material/Translate'; // New import for translator app icon
import MicIcon from '@mui/icons-material/Mic'; // New import for Gemini Live Audio app
import VisibilityIcon from '@mui/icons-material/Visibility'; // New import for Preview app
import CorporateFareIcon from '@mui/icons-material/CorporateFare'; // New import for Project Management

import { Link } from 'react-router-dom';
import { RequestType, LlmOutputFormat } from '@/types';
import {
  requestTypeIcons,
  defaultRequestTypeIcon,
} from '@/constants/requestTypeIcons';

interface AppCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
  linkText: string;
  requestType?: RequestType;
  llmOutputFormat?: LlmOutputFormat; // New: Optional output format for AI Editor generators
}

const AppCard: React.FC<AppCardProps> = ({
  title,
  description,
  icon: Icon,
  link,
  linkText,
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[6],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Icon
            sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }}
          />
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
      <CardActions sx={{ mt: 'auto', p: 2 }}>
        <Button size="small" component={Link} to={link} variant="outlined">
          {linkText}
        </Button>
      </CardActions>
    </Card>
  );
};

const AppsPage: React.FC = () => {
  const theme = useTheme();

  const apps: AppCardProps[] = [
    {
      title: 'AI Code Editor',
      description:
        'Generate, modify, and analyze code with advanced AI assistance.',
      icon: CodeIcon,
      link: '/editor',
      linkText: 'Open Editor',
    },
    // New AI Editor Generators based on RequestType
    {
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
      title: 'Text-Only AI Chat',
      description:
        'Engage in text-based conversations with AI, no file context.',
      icon: requestTypeIcons[RequestType.TEXT_ONLY] || defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.TEXT_ONLY}&output=${LlmOutputFormat.TEXT}`,
      linkText: 'Start Chat',
      requestType: RequestType.TEXT_ONLY,
      llmOutputFormat: LlmOutputFormat.TEXT,
    },
    {
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
      title: 'Live API Interaction',
      description: 'Interact with live APIs through AI-generated requests.',
      icon: requestTypeIcons[RequestType.LIVE_API] || defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.LIVE_API}&output=${LlmOutputFormat.JSON}`,
      linkText: 'Use API',
      requestType: RequestType.LIVE_API,
      llmOutputFormat: LlmOutputFormat.JSON,
    },
    {
      title: 'Resume Generation',
      description: 'Generate professional resumes from your profile data.',
      icon:
        requestTypeIcons[RequestType.RESUME_GENERATION] ||
        defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.RESUME_GENERATION}&output=${LlmOutputFormat.MARKDOWN}`,
      linkText: 'Create Resume',
      requestType: RequestType.RESUME_GENERATION,
      llmOutputFormat: LlmOutputFormat.MARKDOWN,
    },
    {
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
      title: 'Video Generation',
      description: 'Generate short videos from text descriptions or images.',
      icon:
        requestTypeIcons[RequestType.VIDEO_GENERATION] ||
        defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.VIDEO_GENERATION}&output=${LlmOutputFormat.JSON}`,
      linkText: 'Generate Video',
      requestType: RequestType.VIDEO_GENERATION,
      llmOutputFormat: LlmOutputFormat.JSON,
    },
    {
      title: 'Image Generation',
      description: 'Create unique images from text prompts or existing images.',
      icon:
        requestTypeIcons[RequestType.IMAGE_GENERATION] ||
        defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.IMAGE_GENERATION}&output=${LlmOutputFormat.JSON}`,
      linkText: 'Generate Image',
      requestType: RequestType.IMAGE_GENERATION,
      llmOutputFormat: LlmOutputFormat.JSON,
    },
    {
      title: 'Error Report (AI Analysis)',
      description:
        'Send build or application errors to the AI for analysis and suggestions.',
      icon:
        requestTypeIcons[RequestType.ERROR_REPORT] || defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.ERROR_REPORT}&output=${LlmOutputFormat.MARKDOWN}`,
      linkText: 'Report Error',
      requestType: RequestType.ERROR_REPORT,
      llmOutputFormat: LlmOutputFormat.MARKDOWN,
    },
    // New entry for the Music Player app
    {
      title: 'Music Player (Spotify-like)',
      description:
        'A music player application with features similar to Spotify.',
      icon: MusicNoteIcon,
      link: '/apps/spotify',
      linkText: 'Open Music Player',
    },
    // New entry for the Translator app
    {
      title: 'AI Translator',
      description:
        'Translate text content or uploaded files into any language with AI.',
      icon: TranslateIcon,
      link: '/apps/translator',
      linkText: 'Open Translator',
    },
    // New entry for Gemini Live Audio
    {
      title: 'Live Audio with Gemini',
      description:
        'Interact with Gemini AI using real-time audio input and output.',
      icon: MicIcon,
      link: '/apps/gemini-live-audio',
      linkText: 'Start Live Chat',
    },
    // New entry for Preview Built App
    {
      title: 'Preview Built App',
      description:
        'View a live preview of your successfully built frontend application.',
      icon: VisibilityIcon,
      link: '/apps/preview',
      linkText: 'Launch Preview',
    },
    // New entry for Project Management
    {
      title: 'Project Management',
      description:
        'Create and manage organizations and their associated projects.',
      icon: CorporateFareIcon,
      link: '/organizations',
      linkText: 'Manage Projects',
    },
    // Existing apps
    {
      title: 'Project Settings',
      description: 'Manage project configurations, AI models, and API keys.',
      icon: SettingsSuggestIcon,
      link: '#',
      linkText: 'Configure (Coming Soon)',
    },
    {
      title: 'Bug Report',
      description: 'Submit bug reports and track issues within your projects.',
      icon: BugReportIcon,
      link: '#',
      linkText: 'Report (Coming Soon)',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <AppsIcon sx={{ fontSize: 60, color: theme.palette.secondary.main }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Applications
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          Discover and launch various AI-powered tools and features to enhance
          your development workflow.
        </Typography>
        <Box sx={{ mt: 3, width: '100%' }}>
          <Grid container spacing={3} justifyContent="center">
            {/* Added component="div" to all Grid items causing TS2769 error */}
            {apps.map((app, index) => (
              <Grid item xs={12} sm={6} md={4} key={index} component="div">
                <AppCard {...app} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default AppsPage;
