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
import { Link } from 'react-router-dom';
import { AppDefinition } from '@/types'; // Import AppDefinition
import { appDefinitions } from '@/constants/appDefinitions'; // New: Import appDefinitions

import NewAiTools from '@/components/ai-tools/NewAiTools';

interface AppCardProps {
  app: AppDefinition;
}

const AppCard: React.FC<AppCardProps> = ({ app }) => {
  const theme = useTheme();
  const Icon = app.icon; // Access icon directly from app object

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
      <CardActions sx={{ mt: 'auto', p: 2 }}>
        <Button size="small" component={Link} to={app.link} variant="outlined">
          {app.linkText}
        </Button>
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
           <NewAiTools />
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
