import React, {useCallback, useState} from 'react';
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
  Close as CloseIcon,
  Save as SaveIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';
import {
  setScanPathsInput,
  setLastLlmResponse,
  setCurrentDiff,
  setIsBuilding,
  llmStore,
  setLlmResponse,
  setLlmError,
  clearLlmStore
} from '@/stores/llmStore';
import {
  loadInitialTree,
  projectRootDirectoryStore,
  setCurrentProjectPath,
} from '@/stores/fileTreeStore';
import { addLog } from '@/stores/logStore';
import { errorStore, setErrorRaw } from '@/stores/errorStore';
import { autoApplyChanges, setAutoApplyChanges, showGlobalSnackbar } from '@/stores/aiEditorStore';
import { useStore } from '@nanostores/react';
import FilePickerDialog from '@/components/dialogs/FilePickerDialog';
import DirectoryPickerDialog from '@/components/dialogs/DirectoryPickerDialog';
import ScanPathsDialog from '@/components/dialogs/ScanPathsDialog';
import PromptGeneratorSettings, {
  type GlobalAction,
} from '@/components/Drawer/PromptGeneratorSettings';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import { CodeRepair } from '@/components/code-generator/utils/CodeRepair';
import ImportData from './ImportData';
import { ImportJsonDialog } from './ImportJson';
import { CodeGeneratorData } from './CodeGeneratorMain';
import { setOpenedFileContent } from '@/stores/fileStore';
import { RequestType } from '@/types/llm';
import { SvgIconComponent } from '@mui/material';

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
  handleSave: () => void; // Add handleSave prop
  editorContent?: string;
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

  updateScanPaths,
  requestType,
  handleSave, // Receive handleSave
  editorContent,
  commonDisabled
}) => {
  const theme = useTheme();
  const $autoApplyChanges = useStore(autoApplyChanges);
  const [importContent, setImportContent] = useState<CodeGeneratorData>(null);
  const [isCodeRepairOpen, setIsCodeRepairOpen] = useState(false);
  const { lastLlmResponse, errorLlm, response } = useStore(llmStore);
  const { raw, message } = useStore(errorStore);

  const toggleCodeRepair = useCallback(() => {
    setIsCodeRepairOpen((open) => !open);
  }, []);
  const handleImport = () => {
    try {
      console.log(importContent, 'importContent');
      const iData = JSON.parse(importContent);
      setLastLlmResponse(iData);
    } catch (err) {
    console.log(err, 'err');
      setLastLlmResponse(null);
      const msg = `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`;
      showGlobalSnackbar(msg, 'error');
    }
  };
  const handleImportJson = React.useCallback(
    (value: CodeGeneratorData) => {
      setImportContent(value);
    },
    [],
  );

 
  const GlobalActionButtons: GlobalAction[] = [
    {
      label: 'Cancel',
      action: () => setIsSettingsOpen(false),
      icon: CloseIcon,
    },
    { label: 'Save', action: handleSave, icon: SaveIcon },
  ]; // Pass handleSave to the action
  const ImportDataAction: GlobalAction[] = [
    {
      label: 'Cancel',
      action: () => setIsImportDialogOpen(false),
      icon: CloseIcon,
    },
    { label: 'Import', action: handleImport, icon: CloudUploadIcon },
  ]; 
  
  return (
    <Box className="flex items-center justify-between gap-2 ">
      <Box className="flex flex-wrap gap-2 ">
        <Tooltip title="Prompt generator settings">
          <IconButton color="primary" onClick={() => setIsSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
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
            <IconButton
              color="primary"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <CloudUploadIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {requestType === RequestType.LLM_GENERATION && (
        <Box className="flex flex-wrap gap-0 ">
          <Tooltip title="Toggle Code Repair Drawer">
          <IconButton
            color="primary"
            onClick={toggleCodeRepair}
            disabled={commonDisabled }
          >
            <BugReportIcon />
          </IconButton>
        </Tooltip>
          <Tooltip title="Clear editor and AI response">
            <IconButton color="error" onClick={clearLlmStore} disabled={commonDisabled}>
              <ClearIcon />
            </IconButton>
          </Tooltip>

          <FormControlLabel
            control={
              <Switch
                className='ml-2'
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
        position="left"
        size="medium"
        title="Import Data"
        hasBackdrop={true}
        footerActionButton={ImportDataAction}
      >
      <ImportJsonDialog
        value={importContent || ''}
        onChange={handleImportJson}
      />
      </CustomDrawer>
      {/*<CustomDrawer
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
      </CustomDrawer>*/}
      <CustomDrawer
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        position="left"
        size="medium"
        title="Prompt Generator Settings"
        hasBackdrop={true}
        footerActionButton={GlobalActionButtons}
      >
        <PromptGeneratorSettings
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </CustomDrawer>
      <CustomDrawer
        open={isCodeRepairOpen}
        onClose={() => setIsCodeRepairOpen(false)}
        position="left"
        size="large"
        title="Code Repair"
        hasBackdrop={false}
      >
        {/*error && <CodeRepair value={editorContent} onChange={setEditorContent} filePath='temp.json' height='400px' />*/}
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
