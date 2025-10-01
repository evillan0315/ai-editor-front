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
  IconButton, // NEW
  Tooltip, // NEW
} from '@mui/material';
import AppsIcon from '@mui/icons-material/Apps';
import { Link } from 'react-router-dom';
import { AppDefinition } from '@/types'; // Import AppDefinition
import { appDefinitions } from '@/constants/appDefinitions'; // New: Import appDefinitions
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // NEW
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // NEW
import { useStore } from '@nanostores/react'; // NEW
import { addNavbarApp, removeNavbarApp, $navbarApps } from '@/stores/navbarAppsStore'; // NEW

interface AppCardProps {
  app: AppDefinition;
}

const AppCard: React.FC<AppCardProps> = ({ app }) => {
  const theme = useTheme();
  const Icon = app.icon; // Access icon directly from app object

  // Use the nanostore to check if the app is in the navbar
  const { appIds: currentNavbarAppIds } = useStore($navbarApps); // NEW
  const isInNavbar = currentNavbarAppIds.includes(app.id); // NEW

  const handleToggleNavbar = () => { // NEW
    if (isInNavbar) {
      removeNavbarApp(app.id);
    } else {
      addNavbarApp(app.id);
    }
  };

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
            {app.title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {app.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ mt: 'auto', p: 2, display: 'flex', justifyContent: 'space-between' }}> {/* NEW: Added display flex and justify-content */}
        <Button size="small" component={Link} to={app.link} variant="outlined">
          {app.linkText}
        </Button>
        <Tooltip title={isInNavbar ? 'Remove from Navbar Apps' : 'Add to Navbar Apps'}> {/* NEW */}
          <IconButton
            onClick={handleToggleNavbar}
            color={isInNavbar ? 'primary' : 'default'}
            size="small"
          >
            {isInNavbar ? <CheckCircleOutlineIcon /> : <AddCircleOutlineIcon />}
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

const AppsPage: React.FC = () => {
  const theme = useTheme();

  // Group apps by category
  const categorizedApps = appDefinitions.reduce(
    (acc: { [key: string]: AppDefinition[] }, app) => {
      if (!acc[app.category]) {
        acc[app.category] = [];
      }
      acc[app.category].push(app);
      return acc;
    },
    {},
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
      <AppsIcon sx={{ fontSize: 60, color: theme.palette.secondary.main }} />
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
        Applications
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center">
        Discover and launch various AI-powered tools and features to enhance
        your development workflow.
      </Typography>
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
        <Box sx={{ mt: 3, width: '100%' }}>
          {Object.entries(categorizedApps).map(([category, apps]) => (
            <Box key={category} sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                {category}
              </Typography>
              <Grid container spacing={3} justifyContent="center">
                {apps.map((app) => (
                  <Grid item xs={12} sm={6} md={4} key={app.id} component="div">
                    <AppCard app={app} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default AppsPage;
