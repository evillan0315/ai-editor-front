import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  useTheme,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CodeMirror from '@uiw/react-codemirror';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';
import { aiEditorStore } from '@/stores/aiEditorStore'; // Import aiEditorStore
import { getCodeMirrorLanguage, createCodeMirrorTheme } from '@/utils/index';
import { LlmOutputFormat } from '@/types'; // Import LlmOutputFormat

interface InstructionEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (type: 'ai' | 'expected', content: string) => void;
  instructionType: 'ai' | 'expected';
  initialContent: string;
}

const InstructionEditorDialog: React.FC<InstructionEditorDialogProps> = ({
  open,
  onClose,
  onSave,
  instructionType,
  initialContent,
}) => {
  const muiTheme = useTheme(); // Get MUI theme
  const { mode } = useStore(themeStore);
  const { llmOutputFormat } = useStore(aiEditorStore); // Get llmOutputFormat from store
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSave = () => {
    onSave(instructionType, content);
  };

  const title =
    instructionType === 'ai'
      ? 'Edit AI Instruction'
      : 'Edit Expected Output Format';

  // Determine language extensions for CodeMirror dynamically
  const languageExtensions = useMemo(() => {
    if (instructionType === 'ai') {
      return getCodeMirrorLanguage('instruction.yaml'); // Default to markdown for AI instructions
    } else {
      // instructionType === 'expected'
      switch (llmOutputFormat) {
        case LlmOutputFormat.JSON:
          return getCodeMirrorLanguage('output.json');
        case LlmOutputFormat.YAML:
          return getCodeMirrorLanguage('output.yaml');
        case LlmOutputFormat.MARKDOWN:
          return getCodeMirrorLanguage('output.md');
        case LlmOutputFormat.TEXT:
          return []; // No specific language for plain text
        default:
          return getCodeMirrorLanguage('output.json'); // Fallback to JSON
      }
    }
  }, [instructionType, llmOutputFormat]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: muiTheme.palette.background.paper,
          color: muiTheme.palette.text.primary,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${muiTheme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pr: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: muiTheme.palette.text.secondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}
      >
        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
          <CodeMirror
            value={content}
            onChange={setContent}
            extensions={[
              ...languageExtensions,
              createCodeMirrorTheme(muiTheme),
            ]}
            theme={mode}
            minHeight="400px" // Sufficient height for instructions
            maxHeight="70vh" // Max height to prevent overflow on smaller screens
            style={{
              borderRadius: muiTheme.shape.borderRadius + 'px',
              border: `1px solid ${muiTheme.palette.divider}`,
              overflow: 'hidden',
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: `1px solid ${muiTheme.palette.divider}`,
          p: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={onClose}
          sx={{ color: muiTheme.palette.text.secondary }}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InstructionEditorDialog;
