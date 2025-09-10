import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  CardActionArea,
  Tooltip,
} from '@mui/material';
import AppsIcon from '@mui/icons-material/Apps';
import { AppDefinition } from '@/types';

interface AppsMenuContentProps {
  apps: AppDefinition[];
  onClose: () => void; // Function to close the menu
}

const AppsMenuContent: React.FC<AppsMenuContentProps> = ({ apps, onClose }) => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 1, minWidth: 300, maxWidth: 600 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, px: 1 }}>
        Browse Apps
      </Typography>
      <Grid container spacing={1}>
        {apps.map((app) => (
          <Grid item xs={6} sm={4} key={app.id}>
            <Tooltip title={app.description} placement="right">
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'background-color 0.2s, border-color 0.2s',
                  '&:hover': { bgcolor: theme.palette.action.hover },
                }}
              >
                <CardActionArea
                  component={Link}
                  to={app.link}
                  onClick={onClose}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 1.5,
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: theme.palette.text.primary,
                  }}
                >
                  <app.icon
                    sx={{
                      fontSize: 30,
                      color: theme.palette.primary.main,
                      mb: 0.5,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 'bold',
                      lineHeight: 'tight',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {app.title}
                  </Typography>
                </CardActionArea>
              </Card>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AppsMenuContent;
