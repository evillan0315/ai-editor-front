import React, { useCallback, useState, useEffect } from 'react';
import {
  Box,
  Tooltip,
  IconButton,
  FormControlLabel,
  Switch,
  useTheme,
} from '@mui/material';
import {
  DriveFolderUpload as DriveFolderUploadIcon,
  FolderOpen as FolderOpenIcon,
  AddRoad as AddRoadIcon,
  CloudUpload as CloudUploadIcon,
  Settings as SettingsIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  BugReport as BugReportIcon,
  Check as CheckIcon // New import for the Confirm button
} from '@mui/icons-material';
import {
  setLastLlmResponse,
  setCurrentDiff,
  setIsBuilding,
  llmStore,
  setLlmResponse,
  clearLlmStore,
} from '@/stores/llmStore';
import {
  loadInitialTree,
  projectRootDirectoryStore,
  setCurrentProjectPath,
} from '@/stores/fileTreeStore';
import { addLog } from '@/stores/logStore';
import { setErrorRaw } from '@/stores/errorStore';
import {
  autoApplyChanges,
  setAutoApplyChanges,
  showGlobalSnackbar,
} from '@/stores/aiEditorStore';
import { useStore } from '@nanostores/react';
import PromptGeneratorSettings from '@/components/Drawer/PromptGeneratorSettings';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import { CodeRepair } from '@/components/code-generator/utils/CodeRepair';
import { ImportJson } from '../ImportJson';
import { CodeGeneratorData } from './CodeGeneratorMain';
import { RequestType } from '@/types/llm'; 
import { GlobalAction } from '@/types/app'; // Import GlobalAction

// New import for the refactored ScanPathsDrawer
import ScanPathsDrawer from '@/components/code-generator/drawerContent/ScanPathsDrawer';
// New import for the refactored DirectoryPickerDrawer
import DirectoryPickerDrawer from '@/components/code-generator/drawerContent/DirectoryPickerDrawer';

interface BottomToolbarProps {
  scanPathAutocompleteOptions: string[];
  currentScanPathsArray: string[]; // Current paths from llmStore
  projectInput: string;
  setProjectInput: (value: string) => void;
  handleLoadProject: () => void;

  isImportDialogOpen: boolean;
  setIsImportDialogOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isProjectRootPickerDialogOpen: boolean;
  setIsProjectRootPickerDialogOpen: (open: boolean) => void;
  isScanPathsDialogOpen: boolean;
  setIsScanPathsDialogOpen: (open: boolean) => void;

  updateScanPaths: (paths: string[]) => void; // Function to update the llmStore.scanPathsInput
  requestType: RequestType;
  handleSave: () => void;
  commonDisabled?: boolean;
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({
  scanPathAutocompleteOptions,
  currentScanPathsArray,
  projectInput,
  setProjectInput,
  handleLoadProject,

  isImportDialogOpen,
  setIsImportDialogOpen,
  isSettingsOpen,
  setIsSettingsOpen,
  isProjectRootPickerDialogOpen,
  setIsProjectRootPickerDialogOpen,
  isScanPathsDialogOpen,
  setIsScanPathsDialogOpen,

  updateScanPaths, // This now updates the llmStore
  requestType,
  handleSave,
  commonDisabled,
}) => {
  const theme = useTheme();
  const $autoApplyChanges = useStore(autoApplyChanges);
  const [importContentString, setImportContentString] = useState<string>('');
  const [isCodeRepairOpen, setIsCodeRepairOpen] = useState(false);
  const { response } = useStore(llmStore);

  // New local state to hold changes made within the ScanPathsDrawer before confirming
  const [localScanPaths, setLocalScanPaths] = useState<string[]>(currentScanPathsArray);

  // Sync localScanPaths with currentScanPathsArray when the drawer is opened or parent changes it
  useEffect(() => {
    if (isScanPathsDialogOpen) {
      setLocalScanPaths(currentScanPathsArray);
    }
  }, [isScanPathsDialogOpen, currentScanPathsArray]);


  const toggleCodeRepair = useCallback(() => {
    setIsCodeRepairOpen((open) => !open);
  }, []);

  const handleImport = useCallback(() => {
    try {
      const parsedData: CodeGeneratorData = JSON.parse(importContentString);
      setLastLlmResponse(parsedData as any); // Type assertion needed due to partial match with ModelResponse
      // If the parsed data includes a rawResponse, also update the main LLM response editor
      if (parsedData.rawResponse) {
        setLlmResponse(parsedData.rawResponse);
      }
      showGlobalSnackbar('Data imported successfully!', 'success');
      setIsImportDialogOpen(false);
    } catch (err) {
      console.error(err, 'err');
      setLastLlmResponse(null);
      const msg = `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`;
      showGlobalSnackbar(msg, 'error');
    }
  }, [importContentString, setIsImportDialogOpen]);

  const GlobalActionButtons: GlobalAction[] = [
    { label: 'Cancel', action: () => setIsSettingsOpen(false), icon: <ClearIcon /> },
    { label: 'Save', action: handleSave, icon: <SaveIcon /> },
  ];
  const ImportDataAction: GlobalAction[] = [
    { label: 'Cancel', action: () => setIsImportDialogOpen(false), icon: <ClearIcon /> },
    { 
      label: 'Import',
      action: handleImport,
      icon: <CloudUploadIcon />,
      disabled: !importContentString, // Disable if no content to import
    },
  ];

  // Action buttons for the ScanPathsDrawer
  const ScanPathsDrawerActions: GlobalAction[] = [
    { 
    label: 'Cancel', 
    color: 'text',
    variant: 'outlined',
    action: () => setIsScanPathsDialogOpen(false), 
    icon: <ClearIcon /> 
    },    
    {
      label: 'Confirm',
            color: 'primary',
      variant: 'contained',
      action: () => {
        updateScanPaths(localScanPaths); // Commit changes from local state to store
        setIsScanPathsDialogOpen(false);
        showGlobalSnackbar('Scan paths updated successfully!', 'success');
      },
      icon: <CheckIcon />,
      disabled: false, // Potentially disable if no paths are selected, or if localScanPaths is empty. Depends on desired UX.
    },
  ];

  // Action buttons for the DirectoryPickerDrawer
  const DirectoryPickerDrawerActions: GlobalAction[] = [
    { 
      label: 'Cancel', 
      color: 'text',
      variant: 'outlined',
      action: () => setIsProjectRootPickerDialogOpen(false), 
      icon: <ClearIcon /> 
    },
    {
      label: 'Select', 
      color: 'primary',
      variant: 'contained',
      action: () => {
        // This action will be passed to DirectoryPickerDrawer and triggered by its internal 'Select' logic
        // The actual `onSelect` callback for `DirectoryPickerDrawer` will handle setting project path and closing.
        // No direct state update here, the drawer's internal `onSelect` will do that.
      },
      icon: <CheckIcon />,
      // The disabled state should be managed by the DirectoryPickerDrawer content itself if it has internal validation
      disabled: false, 
    },
  ];

  // Callback for CodeRepair to 'export' its content to the ImportJson drawer
  // Removed onOpenImportDrawerWithContent prop from CodeRepair

  return (
    <Box className="flex items-center justify-between gap-2 ">
      <Box className="flex flex-wrap gap-2 ">
        <Tooltip title="Prompt generator settings" aria-label="Prompt generator settings">
          <IconButton
            color="primary"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="open prompt generator settings"
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Load the selected project" aria-label="Load the selected project">
          <IconButton
            color="primary"
            disabled={commonDisabled}
            onClick={handleLoadProject}
            aria-label="load selected project"
          >
            <DriveFolderUploadIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Pick project root directory" aria-label="Pick project root directory">
          <IconButton
            color="primary"
            onClick={() => setIsProjectRootPickerDialogOpen(true)}
            aria-label="pick project root directory"
          >
            <FolderOpenIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Manage scan paths for the AI search" aria-label="Manage scan paths for the AI search">
          <IconButton
            color="primary"
            onClick={() => setIsScanPathsDialogOpen(true)}
            aria-label="manage scan paths"
          >
            <AddRoadIcon />
          </IconButton>
        </Tooltip>

        {requestType === RequestType.LLM_GENERATION && (
          <Tooltip
            title="Import prompt data from JSON file"
            aria-label="Import prompt data from JSON file"
          >
            <IconButton
              color="primary"
              onClick={() => setIsImportDialogOpen(true)}
              aria-label="import json data"
            >
              <CloudUploadIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {requestType === RequestType.LLM_GENERATION && (
        <Box className="flex flex-wrap gap-0 ">
          <Tooltip title="Toggle Code Repair Drawer" aria-label="Toggle Code Repair Drawer">
            <IconButton
              color="primary"
              onClick={toggleCodeRepair}
              disabled={commonDisabled || !response}
              aria-label="toggle code repair drawer"
            >
              <BugReportIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear editor and AI response" aria-label="Clear editor and AI response">
            <IconButton
              color="error"
              onClick={clearLlmStore}
              disabled={commonDisabled}
              aria-label="clear editor and ai response"
            >
              <ClearIcon />
            </IconButton>
          </Tooltip>

          <FormControlLabel
            control={
              <Switch
                className="ml-2"
                checked={$autoApplyChanges}
                onChange={(e) => setAutoApplyChanges(e.target.checked)}
                name="autoApply"
              />
            }
            label="Auto Apply"
          />
        </Box>
      )}
      {/* Dialogs */}
      {/* ScanPathsDrawer now wrapped in CustomDrawer */}
      <CustomDrawer
        open={isScanPathsDialogOpen}
        onClose={() => setIsScanPathsDialogOpen(false)}
        position="right"
        size="normal"
        title="Manage Scan Paths"
        hasBackdrop={false}
        footerActionButton={ScanPathsDrawerActions} // Pass the new actions
      >
        <ScanPathsDrawer
          currentScanPaths={currentScanPathsArray} // Initial paths from store
          availablePaths={scanPathAutocompleteOptions}
          allowExternalPaths
          onLocalPathsChange={setLocalScanPaths} // Update local state here
        />
      </CustomDrawer>

      {/* DirectoryPickerDrawer now wrapped in CustomDrawer */}
      <CustomDrawer
        open={isProjectRootPickerDialogOpen}
        onClose={() => setIsProjectRootPickerDialogOpen(false)}
        position="right"
        size="normal"
        title="Select Project Root Folder"
        hasBackdrop={false}
        footerActionButton={DirectoryPickerDrawerActions} // Pass the new actions
      >
        <DirectoryPickerDrawer
          onSelect={(path) => {
            setCurrentProjectPath(path);
            handleLoadProject();
            setIsProjectRootPickerDialogOpen(false); // Close drawer after selection
          }}
          onClose={() => setIsProjectRootPickerDialogOpen(false)}
          initialPath={projectInput || '/'}
          allowExternalPaths
        />
      </CustomDrawer>

      <CustomDrawer
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        position="left"
        size="medium"
        title="Import Data"
        hasBackdrop={true}
        footerActionButton={ImportDataAction}
      >
        <ImportJson value={importContentString} onChange={setImportContentString} />
      </CustomDrawer>
      <CustomDrawer
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        position="left"
        size="medium"
        title="Prompt Generator Settings"
        hasBackdrop={true}
        footerActionButton={GlobalActionButtons}
      >
        <PromptGeneratorSettings open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </CustomDrawer>
      <CustomDrawer
        open={isCodeRepairOpen}
        onClose={() => setIsCodeRepairOpen(false)}
        position="left"
        size="large"
        title="Code Repair"
        hasBackdrop={false}
      >
        <CodeRepair
          value={response || ''}
          onChange={setLlmResponse}
          filePath="temp.json"
          height="100%"
        />
      </CustomDrawer>
    </Box>
  );
};

export default BottomToolbar;
