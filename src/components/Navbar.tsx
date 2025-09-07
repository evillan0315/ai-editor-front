import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { aiEditorStore } from '@/stores/aiEditorStore';
import { handleLogout } from '@/services/authService';
import { runTerminalCommand, fetchProjectScripts } from '@/api/terminal';
import ThemeToggle from './ThemeToggle';
import RunScriptMenuItem from './RunScriptMenuItem'; // Changed from ScriptButton
import Snackbar from './Snackbar';
import {
  type PackageScript,
  type TerminalCommandResponse,
  ScriptStatus,
  type PackageManager,
} from '@/types';
import { APP_NAME } from '@/constants'; // Import APP_NAME

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import Menu from '@mui/material/Menu';
import TerminalIcon from '@mui/icons-material/Terminal';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface ScriptExecutionState {
  status: ScriptStatus;
  message: string | null;
  output: TerminalCommandResponse | null;
}

const Navbar: React.FC = () => {
  const { isLoggedIn, user, loading: authLoading } = useStore(authStore);
  const { currentProjectPath } = useStore(aiEditorStore);
  const navigate = useNavigate();
  const theme = useTheme();

  const [packageScripts, setPackageScripts] = useState<PackageScript[]>([]);
  const [packageManager, setPackageManager] = useState<PackageManager>(null);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [scriptExecutionStatus, setScriptExecutionStatus] = useState<
    Record<string, ScriptExecutionState>
  >({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    if (currentProjectPath) {
      setScriptsLoading(true);
      const loadScripts = async () => {
        try {
          const { scripts, packageManager: detectedPackageManager } =
            await fetchProjectScripts(currentProjectPath);
          setPackageScripts(scripts);
          setPackageManager(detectedPackageManager);
        } catch (err) {
          console.error('Failed to load package scripts:', err);
          setSnackbarMessage(
            `Failed to load package scripts: ${err instanceof Error ? err.message : String(err)}`,
          );
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          setPackageScripts([]);
          setPackageManager(null);
        } finally {
          setScriptsLoading(false);
        }
      };
      loadScripts();
    } else {
      setPackageScripts([]);
      setPackageManager(null);
      // Clear script execution status when project path is cleared
      setScriptExecutionStatus({});
    }
  }, [currentProjectPath]);

  const onLogout = async () => {
    await handleLogout();
    navigate('/login');
  };

  const handleRunScript = async (scriptName: string, rawScriptContent: string) => {
    if (!currentProjectPath) {
      setSnackbarMessage('Error: Project root not set.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Check if any script is already running to prevent concurrent executions
    const isAnyScriptRunning = Object.values(scriptExecutionStatus).some(
      (state) => state.status === ScriptStatus.RUNNING,
    );
    if (isAnyScriptRunning) {
      setSnackbarMessage('Another script is already running. Please wait.');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      return;
    }

    const packageManagerPrefix = packageManager || 'npm'; // Default to npm if not detected
    // For `npm run <script-name>` or `pnpm run <script-name>`
    const commandToExecute = `${packageManagerPrefix} run ${scriptName}`;

    setScriptExecutionStatus((prev) => ({
      ...prev,
      [scriptName]: {
        status: ScriptStatus.RUNNING,
        message: 'Running...',
        output: null,
      },
    }));
    setSnackbarMessage(`Running '${scriptName}' with ${packageManagerPrefix}...`);
    setSnackbarSeverity('info');
    setSnackbarOpen(true);

    try {
      const result = await runTerminalCommand(commandToExecute, currentProjectPath);
      if (result.exitCode === 0) {
        setScriptExecutionStatus((prev) => ({
          ...prev,
          [scriptName]: {
            status: ScriptStatus.SUCCESS,
            message: 'Successfully ran.',
            output: result,
          },
        }));
        setSnackbarMessage(`'${scriptName}' executed successfully!`);
        setSnackbarSeverity('success');
      } else {
        const errorMessage = result.stderr || `Command exited with code ${result.exitCode}.`;
        setScriptExecutionStatus((prev) => ({
          ...prev,
          [scriptName]: {
            status: ScriptStatus.ERROR,
            message: errorMessage,
            output: result,
          },
        }));
        setSnackbarMessage(`Error running '${scriptName}': ${errorMessage}`);
        setSnackbarSeverity('error');
      }
      console.log(`Script '${scriptName}' output:`, result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setScriptExecutionStatus((prev) => ({
        ...prev,
        [scriptName]: {
          status: ScriptStatus.ERROR,
          message: errorMessage,
          output: null,
        },
      }));
      setSnackbarMessage(`Failed to run '${scriptName}': ${errorMessage}`);
      setSnackbarSeverity('error');
      console.error(`Failed to run script '${scriptName}':`, err);
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isAnyScriptRunning = Object.values(scriptExecutionStatus).some(
    (state) => state.status === ScriptStatus.RUNNING,
  );

  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar className="flex justify-between items-center mx-auto w-full px-4 sm:px-6 lg:px-8">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: theme.palette.text.primary,
              fontWeight: 'bold',
            }}
          >
            {APP_NAME}
          </Typography>

          {/* New Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button
              color="inherit"
              component={Link}
              to="/editor"
              sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
            >
              Editor
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/dashboard"
              sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
            >
              Dashboard
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/apps"
              sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
            >
              Apps
            </Button>
          </Box>

          <Box className="flex gap-1">
            {scriptsLoading ? (
              <CircularProgress size={20} sx={{ color: theme.palette.text.secondary }} />
            ) : (
              <Button
                id="run-scripts-button"
                aria-controls={menuOpen ? 'run-scripts-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={menuOpen ? 'true' : undefined}
                onClick={handleMenuClick}
                variant="text"
                color="inherit"
                size="small"
                disabled={!currentProjectPath || packageScripts.length === 0 || isAnyScriptRunning}
                sx={{
                  color: theme.palette.text.primary,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                  minWidth: 'auto',
                  px: 1,
                  py: 0.5,
                  fontSize: '0.75rem',
                  whiteWhiteSpace: 'nowrap',
                  fontWeight: 'bold',
                }}
                startIcon={<TerminalIcon fontSize="small" />}
                endIcon={<KeyboardArrowDownIcon fontSize="small" />}
              >
                Run Scripts
              </Button>
            )}
            <Menu
              id="run-scripts-menu"
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              MenuListProps={{
                'aria-labelledby': 'run-scripts-button',
                sx: { bgcolor: theme.palette.background.paper }, // Apply theme to menu list
              }}
            >
              {packageScripts.length > 0 ? (
                packageScripts.map((script) => (
                  <RunScriptMenuItem
                    key={script.name}
                    name={script.name}
                    command={script.script}
                    onClick={(scriptName, rawScriptContent) => {
                      handleRunScript(scriptName, rawScriptContent);
                      handleMenuClose();
                    }}
                    status={scriptExecutionStatus[script.name]?.status || ScriptStatus.IDLE}
                    disabled={isAnyScriptRunning} // Disable all other scripts if one is running
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No scripts found.
                </Typography>
              )}
            </Menu>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ThemeToggle />
          {authLoading ? (
            <CircularProgress size={24} sx={{ color: theme.palette.text.primary }} />
          ) : isLoggedIn ? (
            <>
              <AccountCircle sx={{ color: theme.palette.text.primary }} />
              <Typography
                variant="body1"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  color: theme.palette.text.primary,
                }}
              >
                {user?.name || user?.email || 'User'}
              </Typography>
              <Button
                color="inherit"
                onClick={onLogout}
                sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                component={Link}
                to="/login"
                sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
              >
                Login
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/register"
                sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleSnackbarClose}
      />
    </AppBar>
  );
};

export default Navbar;
