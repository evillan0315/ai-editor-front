import React from 'react';
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
} from '@mui/icons-material';
import {
  setScanPathsInput,
  setLastLlmResponse,
  setCurrentDiff,
  setIsBuilding,
} from '@/stores/llmStore';
import {
  loadInitialTree,
  projectRootDirectoryStore,
  setCurrentProjectPath,
} from '@/stores/fileTreeStore';
import { addLog } from '@/stores/logStore';
import { autoApplyChanges, setAutoApplyChanges } from '@/stores/aiEditorStore';
import { useStore } from '@nanostores/react';
import FilePickerDialog from '@/components/dialogs/FilePickerDialog';
import DirectoryPickerDialog from '@/components/dialogs/DirectoryPickerDialog';
import ScanPathsDialog from '@/components/dialogs/ScanPathsDialog';
import PromptGeneratorSettings from '@/components/Drawer/PromptGeneratorSettings';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import ImportData from './ImportData';
import { setOpenedFileContent } from '@/stores/fileStore';
import { RequestType } from '@/types/llm';

interface BottomToolbarProps {
  scanPathAutocompleteOptions: string[];
  currentScanPathsArray: string[];
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

  updateScanPaths: (paths: string[]) => void;
  requestType: RequestType;
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

  updateScanPaths,
  requestType,
}) => {
  const theme = useTheme();
  const $autoApplyChanges = useStore(autoApplyChanges);

  const commonDisabled = false;

  return (
  <Box className="flex items-center justify-between gap-2 ">
    <Box className="flex flex-wrap gap-2 ">
      <Tooltip title="Load the selected project">
        <IconButton
          color="primary"
          disabled={commonDisabled}
          onClick={handleLoadProject}
        >
          <DriveFolderUploadIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Pick project root directory">
        <IconButton
          color="primary"
          onClick={() => setIsProjectRootPickerDialogOpen(true)}
        >
          <FolderOpenIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Manage scan paths for the AI search">
        <IconButton
          color="primary"
          onClick={() => setIsScanPathsDialogOpen(true)}
        >
          <AddRoadIcon />
        </IconButton>
      </Tooltip>

      {requestType === RequestType.LLM_GENERATION && (
        <Tooltip title="Import prompt data from JSON file">
          <IconButton color="primary" onClick={() => setIsImportDialogOpen(true)}>
            <CloudUploadIcon />
          </IconButton>
        </Tooltip>
      )}

   
        <Tooltip title="Prompt generator settings">
          <IconButton color="primary" onClick={() => setIsSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      
    </Box>
    {requestType === RequestType.LLM_GENERATION && (
      <Box className="flex flex-wrap gap-2 ">
      
        <Tooltip title="Clear editor and AI response">
        <IconButton color="error" disabled={commonDisabled}>
          <ClearIcon />
        </IconButton>
      </Tooltip>

      <FormControlLabel
        control={
          <Switch
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
      <ScanPathsDialog
        open={isScanPathsDialogOpen}
        onClose={() => setIsScanPathsDialogOpen(false)}
        currentScanPaths={currentScanPathsArray}
        availablePaths={scanPathAutocompleteOptions}
        allowExternalPaths
        onUpdatePaths={updateScanPaths}
      />
      <DirectoryPickerDialog
        open={isProjectRootPickerDialogOpen}
        onClose={() => setIsProjectRootPickerDialogOpen(false)}
        onSelect={(path) => {
          setCurrentProjectPath(path);
          handleLoadProject();
        }}
        initialPath={projectInput || '/'}
        allowExternalPaths
      />
      

      <CustomDrawer
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        position="bottom"
        size="medium"
        title="Import JSON Data"
        hasBackdrop={false}
      >
        <ImportData
          onDataLoaded={setOpenedFileContent}
          onClose={() => setIsImportDialogOpen(false)}
        />
      </CustomDrawer>
       <CustomDrawer
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        position="right"
        size="medium"
        title="Prompt Generator Settings"
        hasBackdrop={false}
      >
          <PromptGeneratorSettings
            open={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
      </CustomDrawer>
    </Box>
  );
};

export default BottomToolbar;
