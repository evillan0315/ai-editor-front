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
  Check as CheckIcon,
  Build as RepairIcon,
  AutoAwesomeOutlined as AutoAwesomeOutlinedIcon,
  DataObjectOutlined as DataObjectOutlinedIcon,
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
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import { CodeRepair } from '@/components/code-generator/utils/CodeRepair';
import { ImportJson } from './drawerContent/ImportJson';
import { CodeGeneratorData } from './CodeGeneratorMain';
import { RequestType } from '@/types/llm';
import { GlobalAction } from '@/types/app';

// New import for the refactored ScanPathsDrawer
import ScanPathsDrawer from '@/components/code-generator/drawerContent/ScanPathsDrawer';
// New import for the refactored DirectoryPickerDrawer
import DirectoryPickerDrawer from '@/components/code-generator/drawerContent/DirectoryPickerDrawer';
// New import for the relocated PromptGeneratorSettings
import PromptGeneratorSettings from '@/components/code-generator/drawerContent/PromptGeneratorSettings';

interface BottomToolbarProps {
  scanPathAutocompleteOptions: string[];
  currentScanPathsArray: string[]; // Current paths from llmStore
  projectInput: string;
  setProjectInput: (value: string) => void;
  handleLoadProject: () => void;

  isImportDialogOpen: boolean;
  setIsImportDialogOpen: (open: boolean) => void;
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

  // New state for the PromptGeneratorSettingsDrawer
  const [isPromptGeneratorSettingsDrawerOpen, setIsPromptGeneratorSettingsDrawerOpen] = useState(false);

  // New state to hold the currently browsed path in DirectoryPickerDrawer
  const [selectedDirectoryPathForDrawer, setSelectedDirectoryPathForDrawer] = useState<string>(projectInput || '/');

  // Sync localScanPaths with currentScanPathsArray when the drawer is opened or parent changes it
  useEffect(() => {
    if (isScanPathsDialogOpen) {
      setLocalScanPaths(currentScanPathsArray);
    }
  }, [isScanPathsDialogOpen, currentScanPathsArray]);

  // Sync selectedDirectoryPathForDrawer with projectInput if projectInput changes externally
  useEffect(() => {
    setSelectedDirectoryPathForDrawer(projectInput || '/');
  }, [projectInput]);

  const toggleCodeRepair = useCallback(() => {
    setIsCodeRepairOpen((open) => !open);
  }, []);

  const handleImport = useCallback(() => {
    try {
      const parsedData: unknown = JSON.parse(importContentString);

      // Attempt to treat it as a full ModelResponse (CodeGeneratorData)
      // Check for key properties of CodeGeneratorData
      if (
        typeof parsedData === 'object' &&
        parsedData !== null &&
        'title' in parsedData && typeof (parsedData as CodeGeneratorData).title === 'string' &&
        'summary' in parsedData && typeof (parsedData as CodeGeneratorData).summary === 'string' &&
        'changes' in parsedData && Array.isArray((parsedData as CodeGeneratorData).changes)
      ) {
        setLastLlmResponse(parsedData as CodeGeneratorData);
        // If it also contains rawResponse, use that for the editor
        if ('rawResponse' in parsedData && typeof (parsedData as { rawResponse: string }).rawResponse === 'string') {
          setLlmResponse((parsedData as { rawResponse: string }).rawResponse);
        } else {
          // If it's a structured response but no rawResponse, use the stringified version
          setLlmResponse(JSON.stringify(parsedData, null, 2));
        }
      } else {
        // If it's not a full ModelResponse, treat it as raw JSON content for the editor
        setLlmResponse(JSON.stringify(parsedData, null, 2));
        setLastLlmResponse(null); // Clear previous structured response if this is raw content
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

  // GlobalAction for PromptGeneratorSettingsDrawer footer
  const PromptGeneratorSettingsDrawerActions: GlobalAction[] = [
    {
      label: 'Close',
      action: () => setIsPromptGeneratorSettingsDrawerOpen(false),
      icon: <ClearIcon />,
      color: 'text',
      variant: 'outlined'
    },
  ];

  const ImportDataAction: GlobalAction[] = [
    {
      label: 'Cancel',
      action: () => setIsImportDialogOpen(false),
      icon: <ClearIcon />,
      color: 'text',
      variant: 'outlined'
    },
    {
      label: 'Import',
      action: handleImport,
      icon: <CloudUploadIcon />,
      color: 'primary',
      variant: 'contained',
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
      disabled: false,
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
        // This action uses the path actively browsed/selected in the drawer
        setCurrentProjectPath(selectedDirectoryPathForDrawer);
        handleLoadProject();
        setIsProjectRootPickerDialogOpen(false);
      },
      icon: <CheckIcon />,
      disabled: !selectedDirectoryPathForDrawer, // Disable if no path is selected
    },
  ];

  // Action buttons for the CodeRepair drawer, including an "Import Data" button
  const CodeRepairActions: GlobalAction[] = [
    { label: 'Cancel', action: toggleCodeRepair, icon: <ClearIcon />, color: 'text', variant: 'outlined' },
    {
      label: 'Import Data',
      action: () => setIsImportDialogOpen(true),
      icon: <CloudUploadIcon />,
      color: 'secondary',
      variant: 'outlined'
    },
    { label: 'Repair', action: handleSave, icon: <RepairIcon />, color: 'primary', variant: 'contained' },
  ];

  return (
    <Box className="flex items-center justify-between gap-2 ">
      <Box className="flex flex-wrap gap-2 ">
        <Tooltip title="Prompt generator settings" aria-label="Prompt generator settings">
          <IconButton
            color="primary"
            onClick={() => setIsPromptGeneratorSettingsDrawerOpen(true)} // Open the new drawer
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
      {/* PromptGeneratorSettings now wrapped in CustomDrawer */}
      <CustomDrawer
        open={isPromptGeneratorSettingsDrawerOpen}
        onClose={() => setIsPromptGeneratorSettingsDrawerOpen(false)}
        position="left"
        size="medium"
        title="Prompt Generator Settings"
        hasBackdrop={true}
        footerActionButton={PromptGeneratorSettingsDrawerActions}
      >
        <PromptGeneratorSettings />
      </CustomDrawer>

      {/* ScanPathsDrawer now wrapped in CustomDrawer */}
      <CustomDrawer
        open={isScanPathsDialogOpen}
        onClose={() => setIsScanPathsDialogOpen(false)}
        position="right"
        size="normal"
        title="Manage Scan Paths"
        hasBackdrop={false}
        footerActionButton={ScanPathsDrawerActions}
      >
        <ScanPathsDrawer
          currentScanPaths={currentScanPathsArray}
          availablePaths={scanPathAutocompleteOptions}
          allowExternalPaths
          onLocalPathsChange={setLocalScanPaths}
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
        footerActionButton={DirectoryPickerDrawerActions}
      >
        <DirectoryPickerDrawer
          onSelect={(path) => {
            // This onSelect is now only for direct selection inside drawer if an internal button called it
            // but for external footer, we rely on onPathUpdate
            setCurrentProjectPath(path);
            handleLoadProject();
            setIsProjectRootPickerDialogOpen(false);
          }}
          onClose={() => setIsProjectRootPickerDialogOpen(false)}
          initialPath={projectInput || '/'}
          allowExternalPaths
          onPathUpdate={setSelectedDirectoryPathForDrawer} // Pass the new callback
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
        open={isCodeRepairOpen}
        onClose={() => setIsCodeRepairOpen(false)}
        position="left"
        size="medium"
        title="Code Repair"
        hasBackdrop={true}
        footerActionButton={CodeRepairActions}
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
