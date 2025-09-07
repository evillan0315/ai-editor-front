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
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MusicNoteIcon from '@mui/icons-material/MusicNote'; // New import for the music app icon
import TranslateIcon from '@mui/icons-material/Translate'; // New import for translator app icon
import { Link } from 'react-router-dom';
import { RequestType } from '@/types';
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
  requestType?: RequestType; // Optional prop for AI Editor generators
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
      link: `/editor?requestType=${RequestType.LLM_GENERATION}`,
      linkText: 'Generate Code',
      requestType: RequestType.LLM_GENERATION,
    },
    {
      title: 'Text-Only AI Chat',
      description:
        'Engage in text-based conversations with AI, no file context.',
      icon: requestTypeIcons[RequestType.TEXT_ONLY] || defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.TEXT_ONLY}`,
      linkText: 'Start Chat',
      requestType: RequestType.TEXT_ONLY,
    },
    {
      title: 'AI Image & Text Input',
      description: 'Provide an image and text prompt for multi-modal AI tasks.',
      icon:
        requestTypeIcons[RequestType.TEXT_WITH_IMAGE] || defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.TEXT_WITH_IMAGE}`,
      linkText: 'Analyze Image',
      requestType: RequestType.TEXT_WITH_IMAGE,
    },
    {
      title: 'AI File & Text Input',
      description: 'Upload a file with text instructions for AI processing.',
      icon:
        requestTypeIcons[RequestType.TEXT_WITH_FILE] || defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.TEXT_WITH_FILE}`,
      linkText: 'Process File',
      requestType: RequestType.TEXT_WITH_FILE,
    },
    {
      title: 'Live API Interaction',
      description: 'Interact with live APIs through AI-generated requests.',
      icon: requestTypeIcons[RequestType.LIVE_API] || defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.LIVE_API}`,
      linkText: 'Use API',
      requestType: RequestType.LIVE_API,
    },
    {
      title: 'Resume Generation',
      description: 'Generate professional resumes from your profile data.',
      icon:
        requestTypeIcons[RequestType.RESUME_GENERATION] ||
        defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.RESUME_GENERATION}`,
      linkText: 'Create Resume',
      requestType: RequestType.RESUME_GENERATION,
    },
    {
      title: 'Resume Optimization',
      description: 'Optimize your existing resume for job applications.',
      icon:
        requestTypeIcons[RequestType.RESUME_OPTIMIZATION] ||
        defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.RESUME_OPTIMIZATION}`,
      linkText: 'Optimize Resume',
      requestType: RequestType.RESUME_OPTIMIZATION,
    },
    {
      title: 'Resume Enhancement',
      description:
        'Enhance your resume with AI-powered suggestions and improvements.',
      icon:
        requestTypeIcons[RequestType.RESUME_ENHANCEMENT] ||
        defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.RESUME_ENHANCEMENT}`,
      linkText: 'Enhance Resume',
      requestType: RequestType.RESUME_ENHANCEMENT,
    },
    {
      title: 'Video Generation',
      description: 'Generate short videos from text descriptions or images.',
      icon:
        requestTypeIcons[RequestType.VIDEO_GENERATION] ||
        defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.VIDEO_GENERATION}`,
      linkText: 'Generate Video',
      requestType: RequestType.VIDEO_GENERATION,
    },
    {
      title: 'Image Generation',
      description: 'Create unique images from text prompts or existing images.',
      icon:
        requestTypeIcons[RequestType.IMAGE_GENERATION] ||
        defaultRequestTypeIcon,
      link: `/editor?requestType=${RequestType.IMAGE_GENERATION}`,
      linkText: 'Generate Image',
      requestType: RequestType.IMAGE_GENERATION,
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
            {apps.map((app, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
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
