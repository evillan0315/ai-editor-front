import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { aiEditorStore, showGlobalSnackbar } from '@/stores/aiEditorStore'; // Import showGlobalSnackbar
import { isRightSidebarVisible } from '@/stores/uiStore';
import { handleLogout } from '@/services/authService';
import { runTerminalCommand, fetchProjectScripts } from '@/api/terminal';
import ThemeToggle from './ThemeToggle';
import RunScriptMenuItem from './RunScriptMenuItem'; // Changed from ScriptButton
import AppsMenuContent from './AppsMenuContent'; // New: Import AppsMenuContent
import ProfileMenuContent from './ProfileMenuContent'; // New: Import ProfileMenuContent
import { appDefinitions } from '@/constants/appDefinitions'; // New: Import app definitions
import { profileMenuDefinitions } from '@/constants/profileMenuDefinitions'; // New: Import profile menu definitions
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
import MenuItem from '@mui/material/MenuItem'; // New: Import MenuItem for general menu
import TerminalIcon from '@mui/icons-material/Terminal';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LinearProgress from '@mui/material/LinearProgress'; // New: Import LinearProgress
import AppsIcon from '@mui/icons-material/Apps'; // New: Import AppsIcon
import IconButton from '@mui/material/IconButton'; // Explicitly import IconButton
import MenuIcon from '@mui/material/Menu';
import ViewSidebar from '@mui/icons-material/ViewSidebar';
import ViewSidebarOff from '@mui/icons-material/ViewSidebar';

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
  const $isRightSidebarVisible = useStore(isRightSidebarVisible);

  const [packageScripts, setPackageScripts] = useState<PackageScript[]>([]);
  const [packageManager, setPackageManager] = useState<PackageManager>(null);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [scriptExecutionStatus, setScriptExecutionStatus] = useState<
    Record<string, ScriptExecutionState>
  >({});

  const [scriptMenuAnchorEl, setScriptMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [appsMenuAnchorEl, setAppsMenuAnchorEl] = useState<null | HTMLElement>(
    null,
  ); // New state for apps menu anchor
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] =
    useState<null | HTMLElement>(null); // State for profile menu anchor

  const isScriptMenuOpen = Boolean(scriptMenuAnchorEl);
  const isAppsMenuOpen = Boolean(appsMenuAnchorEl);
  const isProfileMenuOpen = Boolean(profileMenuAnchorEl); // State for profile menu

  useEffect(() => {
    if (currentProjectPath) {
      setScriptsLoading(true);
      const loadScripts = async () => {
        try {
          const { scripts, packageManager: detectedPackageManager } =
            await fetchProjectScripts(currentProjectPath);
          setPackageScripts(scripts);
          setPackageManager(detectedPackageManager);
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
    handleProfileMenuClose(); // Close menu after logout
  };

  const handleRunScript = async (
    scriptName: string,
    rawScriptContent: string,
  ) => {
    if (!currentProjectPath) {
      showGlobalSnackbar('Error: Project root not set.', 'error');
      return;
    }

    // Check if any script is already running to prevent concurrent executions
    const isAnyScriptRunning = Object.values(scriptExecutionStatus).some(
      (state) => state.status === ScriptStatus.RUNNING,
    );
    if (isAnyScriptRunning) {
      showGlobalSnackbar(
        'Another script is already running. Please wait.',
        'info',
      );
      return;
    }

    const packageManagerPrefix = packageManager || 'npm'; // Default to npm if not detected
    // For `npm run <script-name>` or `pnpm run <script-name>`
    const commandToExecute = `${packageManagerPrefix} run ${scriptName}`;

    setScriptExecutionStatus((prev) => ({
      ...prev,
      [scriptName]: {
        status: ScriptStatus.RUNNING,
        message: 'Running...', // Keep message concise
        output: null,
      },
    }));
    showGlobalSnackbar(
      `Running '${scriptName}' with ${packageManagerPrefix}...`,
      'info',
    );

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
        showGlobalSnackbar(`'${scriptName}' executed successfully!`, 'success');
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
        showGlobalSnackbar(
          `Error running '${scriptName}': ${errorMessage}`,
          'error',
        );
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
      showGlobalSnackbar(
        `Failed to run '${scriptName}': ${errorMessage}`,
        'error',
      );
      console.error(`Failed to run script '${scriptName}':`, err);
    } finally {
      // Snackbar is shown via state updates above
    }
  };

  const handleScriptMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setScriptMenuAnchorEl(event.currentTarget);
  };

  const handleScriptMenuClose = () => {
    setScriptMenuAnchorEl(null);
  };

  const handleAppsMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAppsMenuAnchorEl(event.currentTarget);
  };

  const handleAppsMenuClose = () => {
    setAppsMenuAnchorEl(null);
  };

  const handleProfileMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setProfileMenuAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchorEl(null);
  };

  const isAnyScriptRunning = Object.values(scriptExecutionStatus).some(
    (state) => state.status === ScriptStatus.RUNNING,
  );

  // Curate a subset of apps for the Navbar dropdown, e.g., the first few AI-related and main apps.
  const navbarApps = appDefinitions.filter((app) =>
    [
      'ai-code-editor',
      'llm-code-generator',
      'ai-translator',
      'gemini-live-audio',
      'music-player',
      'project-management',
      'recording',
    ].includes(app.id),
  );

  return (
    <AppBar
      position="sticky" // Changed from "static" to "sticky"
      sx={{
        top: 0,
        zIndex: 1100,
        bgcolor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* New: Linear loader for script execution */}
      {isAnyScriptRunning && (
        <Box sx={{ width: '100%', position: 'absolute', top: 0, left: 0 }}>
          <LinearProgress />
        </Box>
      )}
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mx: 'auto',
          width: '100%',
          py: 0,
          px: { xs: 1, sm: 2, lg: 2 },
        }}
      >
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
            {/* Apps Button with Dropdown Menu */}
            <Button
              id="apps-menu-button"
              aria-controls={isAppsMenuOpen ? 'apps-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={isAppsMenuOpen ? 'true' : undefined}
              onClick={handleAppsMenuClick}
              startIcon={<AppsIcon />}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
            >
              Apps
            </Button>
            <Menu
              id="apps-menu"
              anchorEl={appsMenuAnchorEl}
              open={isAppsMenuOpen}
              onClose={handleAppsMenuClose}
              MenuListProps={{
                'aria-labelledby': 'apps-menu-button',
              }}
              PaperProps={{
                sx: { bgcolor: theme.palette.background.paper, p: 0 },
              }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <AppsMenuContent
                apps={navbarApps}
                onClose={handleAppsMenuClose}
              />
              <MenuItem
                component={Link}
                to="/apps"
                onClick={handleAppsMenuClose}
                sx={{
                  borderTop: `1px solid ${theme.palette.divider}`,
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: theme.palette.primary.main,
                  py: 1,
                  '&:hover': { bgcolor: theme.palette.action.hover },
                }}
              >
                View All Apps
              </MenuItem>
            </Menu>

            {/* Organizations Link */}
            <Button
              color="inherit"
              component={Link}
              to="/organizations"
              sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
            >
              Organizations
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {scriptsLoading ? (
              <CircularProgress
                size={20}
                sx={{ color: theme.palette.text.secondary }}
              />
            ) : (
              <Button
                id="run-scripts-button"
                aria-controls={
                  isScriptMenuOpen ? 'run-scripts-menu' : undefined
                }
                aria-haspopup="true"
                aria-expanded={isScriptMenuOpen ? 'true' : undefined}
                onClick={handleScriptMenuClick}
                variant="text"
                color="inherit"
                size="small"
                disabled={
                  !currentProjectPath ||
                  packageScripts.length === 0 ||
                  isAnyScriptRunning
                }
                sx={{
                  color: theme.palette.text.primary,
                  '&:hover': { bgcolor: theme.palette.action.hover },
                  minWidth: 'auto',
                  px: 1,
                  py: 0.5,
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
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
              anchorEl={scriptMenuAnchorEl}
              open={isScriptMenuOpen}
              onClose={handleScriptMenuClose}
              MenuListProps={{
                'aria-labelledby': 'run-scripts-button',
              }}
              PaperProps={{
                sx: { bgcolor: theme.palette.background.paper },
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
                      handleScriptMenuClose();
                    }}
                    status={
                      scriptExecutionStatus[script.name]?.status ||
                      ScriptStatus.IDLE
                    }
                    disabled={isAnyScriptRunning} // Disable all other scripts if one is running
                  />
                ))
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ p: 2 }}
                >
                  No scripts found.
                </Typography>
              )}
            </Menu>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ThemeToggle />
          {/* Toggle button for right sidebar */}
          <IconButton
            color="inherit"
            onClick={() => isRightSidebarVisible.set(!$isRightSidebarVisible)}
            aria-label="toggle sidebar"
            sx={{ color: theme.palette.text.primary }}
          >
            {$isRightSidebarVisible ? <ViewSidebar /> : <ViewSidebarOff />}
          </IconButton>
          {authLoading ? (
            <CircularProgress
              size={24}
              sx={{ color: theme.palette.text.primary }}
            />
          ) : isLoggedIn ? (
            <>
              <IconButton
                id="profile-menu-button"
                aria-controls={isProfileMenuOpen ? 'profile-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={isProfileMenuOpen ? 'true' : undefined}
                onClick={handleProfileMenuClick}
                color="inherit"
                sx={{ p: 0, color: theme.palette.text.primary }}
              >
                <AccountCircle sx={{ fontSize: 32 }} />
                {/* Removed Typography for user name/email */}
                <KeyboardArrowDownIcon />
              </IconButton>
              <Menu
                id="profile-menu"
                anchorEl={profileMenuAnchorEl}
                open={isProfileMenuOpen}
                onClose={handleProfileMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'profile-menu-button',
                }}
                PaperProps={{
                  sx: { bgcolor: theme.palette.background.paper, p: 0 },
                }}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <ProfileMenuContent
                  profileItems={profileMenuDefinitions}
                  onClose={handleProfileMenuClose}
                  onLogout={onLogout}
                  user={user}
                />
              </Menu>
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
    </AppBar>
  );
};

export default Navbar;
