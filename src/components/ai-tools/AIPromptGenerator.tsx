// FilePath: src/components/AIPromptGenerator.tsx
// Title: Chat-style AI Prompt Generator with Embedded Code Repair
// Reason: Integrates a chat-like instruction input area and optional code-repair drawer into the AI prompt generator UI.

import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
import BugReportIcon from '@mui/icons-material/BugReport';

// You need to provide these components or stub them out in your project
import { CodeRepair } from '@/components/code-generator/utils/CodeRepair';
import BottomToolbar from '@/components/code-generator/BottomToolbar';
import CustomDrawer from '@/components/Drawer/CustomDrawer';

import useHandleMessages from '@/hooks/useHandleMessages';

const INSTRUCTION = `
You are an AI assistant integrated into a web application that uses a ChatGPT-style interface.
Your role is to transform a user\’s plain-text input into a clear and concise “system prompt” that can be used by other AI models.

Behavioural requirements:
1. Accept a single block of user text as input.
2. Normalise whitespace and remove leading/trailing spaces.
3. Prepend the exact text “System Prompt:” followed by a blank line to the cleaned input.
4. Return the result as plain text only – no Markdown, no code fences, no additional commentary.
5. Do not alter the meaning of the user’s text; only perform minimal formatting as described.

Example:
• User input:  "  Provide a summary of the latest cloud-computing trends  "
• Output: 
System Prompt:

Provide a summary of the latest cloud-computing trends
`;
const AIPromptGenerator: React.FC = () => {
  const theme = useTheme();
  const [instruction, setInstruction] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [isCodeRepairOpen, setIsCodeRepairOpen] = useState(false);

  const { messages, sendMessage, loading, error } = useHandleMessages();

  // stubs for toolbar handlers; replace with your own
  const scanPathAutocompleteOptions: string[] = [];
  const currentScanPathsArray: string[] = [];
  const [projectInput, setProjectInput] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectRootPickerDialogOpen, setIsProjectRootPickerDialogOpen] = useState(false);
  const [isScanPathsDialogOpen, setIsScanPathsDialogOpen] = useState(false);
  const updateScanPaths = () => {};
  const handleLoadProject = () => {};
  const handleClear = () => {};
  const commonDisabled = false;

  const handleSendMessage = async () => {
    if (instruction.trim()) {
      await sendMessage(instruction.trim());
      setInstruction('');
    }
  };

  const toggleCodeRepair = () => setIsCodeRepairOpen((prev) => !prev);

  return (
    <Box className="flex flex-col gap-2 w-full relative">
      {/*editorContent && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Code Editor</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box className="rounded-5 h-full">
              <CodeRepair
                value={editorContent}
                onChange={setEditorContent}
                filePath="temp.json"
                height="160px"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      ) */}

      <Box
        position="relative"
        className="mt-2 px-2 pr-12 overflow-auto max-h-[100px] items-end h-full"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
          }
        }}
      >
        <Box className="mb-0">
          <TextField
            multiline
            fullWidth
            placeholder="Ask me anything..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            className="mb-2 border-0"
            sx={{
              p: 0,
              '& .MuiFormControl-root': {
                backgroundColor: `${theme.palette.background.default} !important`,
              },
            }}
          />
        </Box>
      </Box>

      <Box
        className="absolute top-2 right-0 flex items-center"
        sx={{ paddingRight: theme.spacing(1) }}
      >
        <Tooltip title="Generate/Modify Code">
          <IconButton
            color="success"
            onClick={handleSendMessage}
            disabled={commonDisabled || loading || !instruction}
          >
            {loading ? <CircularProgress size={16} /> : <SendIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Toggle Code Repair Drawer">
          <IconButton
            color="primary"
            onClick={toggleCodeRepair}
            disabled={commonDisabled || !!error}
          >
            <BugReportIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && (
        <Box className="mt-2 flex items-center">
          <CircularProgress size={20} className="mr-1" />
          <Typography variant="body2">Generating...</Typography>
        </Box>
      )}

      <BottomToolbar
        scanPathAutocompleteOptions={scanPathAutocompleteOptions}
        currentScanPathsArray={currentScanPathsArray}
        projectInput={projectInput}
        setProjectInput={setProjectInput}
        handleLoadProject={handleLoadProject}
        isImportDialogOpen={isImportDialogOpen}
        setIsImportDialogOpen={setIsImportDialogOpen}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        isProjectRootPickerDialogOpen={isProjectRootPickerDialogOpen}
        setIsProjectRootPickerDialogOpen={setIsProjectRootPickerDialogOpen}
        isScanPathsDialogOpen={isScanPathsDialogOpen}
        setIsScanPathsDialogOpen={setIsScanPathsDialogOpen}
        updateScanPaths={updateScanPaths}
        handleClear={handleClear}
        requestType={`TEXT_ONLY`}
      />

      <CustomDrawer
        open={isCodeRepairOpen}
        onClose={() => setIsCodeRepairOpen(false)}
        position="left"
        size="large"
        title="Code Repair"
        hasBackdrop={false}
      >
       
      </CustomDrawer>
    </Box>
  );
};

export default AIPromptGenerator;
