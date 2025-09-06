import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { aiEditorStore } from '@/stores/aiEditorStore';
import { handleLogout } from '@/services/authService';
import { runTerminalCommand, fetchProjectScripts } from '@/api/terminal';
import ThemeToggle from './ThemeToggle';
import ScriptButton from './ScriptButton';
import Snackbar from './Snackbar';
import {
  type PackageScript,
  type TerminalCommandResponse,
  ScriptStatus,
  type PackageManager,
} from '@/types';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';

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
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info'
  >('info');

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
    }
  }, [currentProjectPath]);

  const onLogout = async () => {
    await handleLogout();
    navigate('/login');
  };

  const handleRunScript = async (
    scriptName: string,
    rawScriptContent: string,
  ) => {
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
    setSnackbarMessage(
      `Running '${scriptName}' with ${packageManagerPrefix}...`,
    );
    setSnackbarSeverity('info');
    setSnackbarOpen(true);

    try {
      const result = await runTerminalCommand(
        commandToExecute,
        currentProjectPath,
      );
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
        const errorMessage =
          result.stderr || `Command exited with code ${result.exitCode}.`;
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
            AI Editor
          </Typography>
          <Box className="flex gap-1">
            {scriptsLoading ? (
              <CircularProgress
                size={20}
                sx={{ color: theme.palette.text.secondary }}
              />
            ) : packageScripts.length > 0 ? (
              packageScripts.map((script) => (
                <ScriptButton
                  key={script.name}
                  name={script.name}
                  command={script.script} // Raw script content for tooltip
                  onClick={handleRunScript}
                  status={
                    scriptExecutionStatus[script.name]?.status ||
                    ScriptStatus.IDLE
                  }
                  disabled={
                    isAnyScriptRunning &&
                    scriptExecutionStatus[script.name]?.status !==
                      ScriptStatus.RUNNING
                  }
                />
              ))
            ) : (
              currentProjectPath && (
                <Typography variant="body2" color="text.secondary">
                  No scripts found.
                </Typography>
              )
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ThemeToggle />
          {authLoading ? (
            <CircularProgress
              size={24}
              sx={{ color: theme.palette.text.primary }}
            />
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
