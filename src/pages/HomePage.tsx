import React from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  useTheme,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { Link } from 'react-router-dom';
import TerminalIcon from '@mui/icons-material/Terminal';
import DashboardIcon from '@mui/icons-material/Dashboard'; // Keeping this icon, but text changed
import AppsIcon from '@mui/icons-material/Apps';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // For AI generation
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'; // For diff/changes
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined'; // For file tree
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // For file upload
import EditNoteIcon from '@mui/icons-material/EditNote'; // For instructions
import LightbulbIcon from '@mui/icons-material/Lightbulb'; // Why Choose Us
import GroupWorkIcon from '@mui/icons-material/GroupWork'; // Why Choose Us
import GppGoodIcon from '@mui/icons-material/GppGood'; // Why Choose Us
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest'; // Why Choose Us
import StartIcon from '@mui/icons-material/Start'; // How It Works
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges'; // How It Works
import PlayArrowIcon from '@mui/icons-material/PlayArrow'; // How It Works
import LoopIcon from '@mui/icons-material/Loop'; // How It Works
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'; // How It Works step separator

import { APP_NAME, APP_DESCRIPTION } from '@/constants'; // Import APP_NAME and APP_DESCRIPTION

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  link?: string;
  linkText?: string;
}

interface HowItWorksStepProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

const sectionTitleSx = {
  fontWeight: 700,
  mb: 6,
  className: '!text-3xl sm:!text-4xl md:!text-5xl', // Responsive text size
};

const howItWorksStepCardSx = (theme) => ({
  bgcolor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  border: `1px solid ${theme.palette.divider}`,
  p: 3,
  borderRadius: 2,
  textAlign: 'center',
  flex: '1 1 auto',
});

const callToActionBoxSx = (theme) => ({
  bgcolor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  py: 8,
  px: 3,
  borderRadius: 2,
  mt: 8,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

const FeatureCard: React.FC<FeatureCardProps> = ({
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
      {link && linkText && (
        <CardActions sx={{ mt: 'auto', p: 2 }}>
          <Button size="small" component={Link} to={link} variant="outlined">
            {linkText}
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

const HowItWorksStep: React.FC<HowItWorksStepProps> = ({
  title,
  description,
  icon: Icon,
}) => {
  const theme = useTheme();
  return (
    <Box sx={howItWorksStepCardSx(theme)} className="flex-1 flex flex-col justify-center items-center">
      <Icon
        sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
      />
      <Typography variant="h6" component="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
};

const HomePage: React.FC = () => {
  const theme = useTheme();

  const features = [
    {
      title: 'AI-Powered Code Generation',
      description:
        'Generate new files, modify existing ones, and repair code with intelligent AI assistance.',
      icon: AutoAwesomeIcon,
      link: '/editor',
      linkText: 'Start Building',
    },
    {
      title: 'Interactive Proposed Changes',
      description:
        'Review AI-generated file changes, view detailed git diffs, and edit content before applying.',
      icon: CompareArrowsIcon,
      link: '/editor',
      linkText: 'Explore Editor',
    },
    {
      title: 'Project File Navigation',
      description:
        'Browse your project structure with an interactive file tree and view file content.',
      icon: FolderOpenIcon,
      link: '/editor',
      linkText: 'Browse Files',
    },
    {
      title: 'Multi-Modal AI Input',
      description:
        'Upload files or paste Base64 image data to provide rich context to the AI.',
      icon: CloudUploadIcon,
      link: '/editor',
      linkText: 'Provide Context',
    },
    {
      title: 'Customizable AI Instructions',
      description:
        'Fine-tune AI behavior by modifying system instructions and expected output formats.',
      icon: EditNoteIcon,
      link: '/editor',
      linkText: 'Configure AI',
    },
    {
      title: 'Direct Terminal Execution',
      description:
        'Execute AI-generated Git commands and other terminal scripts directly from the UI.',
      icon: TerminalIcon,
      link: '/editor',
      linkText: 'Run Commands',
    },
  ];

  const whyChooseUs = [
    {
      title: 'Robust AI Capabilities',
      description: 'Leverage cutting-edge AI for code generation, modification, and analysis across your projects.',
      icon: LightbulbIcon,
      link: '/editor',
      linkText: 'Learn More',
    },
    {
      title: 'Seamless Collaboration',
      description: 'Manage organizations and projects, fostering teamwork and productivity with intuitive tools.',
      icon: GroupWorkIcon,
      link: '/organizations',
      linkText: 'Start a Team',
    },
    {
      title: 'Secure & Reliable',
      description: 'Built with security in mind, ensuring your projects and data are safe and sound.',
      icon: GppGoodIcon,
      link: '/auth/register',
      linkText: 'Join Now',
    },
    {
      title: 'Extensible & Adaptable',
      description: 'Customize AI instructions, integrate with various tools, and adapt to your workflow.',
      icon: SettingsSuggestIcon,
      link: '/editor',
      linkText: 'Customize',
    },
  ];

  const howItWorksSteps = [
    {
      title: 'Define Your Goal',
      description: 'Clearly articulate your coding or project requirement to the AI in natural language.',
      icon: StartIcon,
    },
    {
      title: 'Review & Refine',
      description: 'Examine AI-generated changes and git diffs, making adjustments before applying.',
      icon: PublishedWithChangesIcon,
    },
    {
      title: 'Apply & Execute',
      description: 'Apply changes to your codebase and execute relevant commands directly from the UI.',
      icon: PlayArrowIcon,
    },
    {
      title: 'Iterate & Innovate',
      description: 'Continuously build and improve your projects with iterative AI-driven development.',
      icon: LoopIcon,
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 'calc(100vh - 120px)', // Adjust based on Navbar/Footer height
        textAlign: 'center',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        py: 8,
        flexGrow: 1, // Allow this box to grow and fill available space
      }}
    >
      <Container maxWidth="md">
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 700, mb: 3 }}
          className="!text-4xl sm:!text-5xl md:!text-6xl"
        >
          {APP_NAME}
        </Typography>
        <Typography
          variant="h5"
          component="p"
          sx={{ mb: 5, color: theme.palette.text.secondary }}
          className="!text-lg sm:!text-xl md:!text-2xl"
        >
          {APP_DESCRIPTION}
        </Typography>
        <Box
          sx={{
            mt: 4,
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={Link}
            to="/editor"
            startIcon={<TerminalIcon />}
            sx={{ py: 1.5, px: 3, fontSize: '1.1rem' }}
          >
            Start Coding
          </Button>
          {/* Changed Dashboard to Organizations, matching Navbar changes */}
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            component={Link}
            to="/organizations"
            startIcon={<DashboardIcon />}
            sx={{ py: 1.5, px: 3, fontSize: '1.1rem' }}
          >
            Manage Organizations
          </Button>
          <Button
            variant="outlined"
            color="info"
            size="large"
            component={Link}
            to="/apps"
            startIcon={<AppsIcon />}
            sx={{ py: 1.5, px: 3, fontSize: '1.1rem' }}
          >
            Explore Apps
          </Button>
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" sx={sectionTitleSx}>
          Key Features
        </Typography>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div key={index}>
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </Container>

      <Container maxWidth="lg" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" sx={sectionTitleSx}>
          Why Choose {APP_NAME}?
        </Typography>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {whyChooseUs.map((item, index) => (
            <div key={index}>
              <FeatureCard {...item} />
            </div>
          ))}
        </div>
      </Container>

      <Container maxWidth="lg" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" sx={sectionTitleSx}>
          How It Works
        </Typography>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-2 lg:gap-8 flex-wrap">
          {howItWorksSteps.map((step, index) => (
            <React.Fragment key={index}>
              <HowItWorksStep {...step} />
              {index < howItWorksSteps.length - 1 && (
                <ArrowForwardIosIcon
                  sx={{ fontSize: 30, color: theme.palette.text.secondary, display: { xs: 'none', sm: 'block' } }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </Container>

      <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
        <Box sx={callToActionBoxSx(theme)}>
          <Typography
            variant="h4"
            component="h2"
            sx={{ fontWeight: 700, mb: 2, className: '!text-3xl sm:!text-4xl' }}
          >
            Ready to Revolutionize Your Workflow?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, className: '!text-md sm:!text-lg', color: theme.palette.primary.contrastText + 'dd' }}>
            Experience the power of AI-assisted development and project management.
          </Typography>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/editor"
            startIcon={<AutoAwesomeIcon />}
            sx={{ py: 1.5, px: 4, fontSize: '1.2rem', bgcolor: theme.palette.secondary.main, '&:hover': { bgcolor: theme.palette.secondary.dark } }}
          >
            Start Building Today!
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
