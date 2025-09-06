import React, { useState, useEffect } from 'react';
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
import { getCodeMirrorLanguage } from '@/utils/index';

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
  const theme = useTheme();
  const { mode } = useStore(themeStore);
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

  // Determine language extensions for CodeMirror
  const languageExtensions =
    instructionType === 'ai'
      ? getCodeMirrorLanguage('instruction.md') // Assuming AI instruction is often markdown
      : getCodeMirrorLanguage('output.json'); // Expected output is JSON

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
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
          sx={{ color: theme.palette.text.secondary }}
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
            extensions={languageExtensions}
            theme={mode}
            minHeight="400px" // Sufficient height for instructions
            maxHeight="70vh" // Max height to prevent overflow on smaller screens
            style={{
              borderRadius: theme.shape.borderRadius + 'px',
              border: `1px solid ${theme.palette.divider}`,
              overflow: 'hidden',
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          p: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
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
