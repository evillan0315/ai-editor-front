import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  useTheme,
} from '@mui/material';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';

import { Diagnostic, linter } from '@codemirror/lint';

import { CodeGeneratorData } from './CodeGeneratorMain';
import { useStore } from '@nanostores/react';
import { aiEditorStore, setLastLlmResponse } from '@/stores/aiEditorStore';
import CodeMirrorComponent from '@/components/codemirror/CodeMirror';
export interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: CodeGeneratorData) => void;
}

export const ImportJsonDialog: React.FC<ImportDialogProps> = ({
  open,
  onClose,
  onImport,
}) => {
  const theme = useTheme();
  const [jsonContent, setJsonContent] = useState<string>('');
  const { lastLlmResponse } = useStore(aiEditorStore);

  const validateJson = useCallback((text: string): readonly Diagnostic[] => {
    const diagnostics: Diagnostic[] = [];
    try {
      JSON.parse(text);
    } catch (e: any) {
      diagnostics.push({
        from: 0,
        to: text.length,
        severity: 'error',
        message: e.message,
      });
    }
    return diagnostics;
  }, []);

  const handleImport = () => {
    try {
      console.log(jsonContent, 'jsonContent');
      const data: CodeGeneratorData = JSON.parse(jsonContent);

      setLastLlmResponse(data);
      onImport(data);
    } catch (e: any) {
      alert(`Invalid JSON: ${e.message}`);
    }
  };

  const onChange = useCallback((value: string, viewUpdate: any) => {
    setJsonContent(value);
  }, []);

  const editorExtensions = [
    javascript(),
    oneDark,
    keymap.of([
      {
        key: 'Ctrl-Enter',
        preventDefault: true,
        run: () => {
          handleImport();
          return true;
        },
      },
    ]),
    linter(validateJson),
  ];
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        Import JSON Data
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Box>
          <CodeMirrorComponent
            value={jsonContent}
            onChange={onChange}
            filePath={`temp.json`}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ backgroundColor: theme.palette.background.paper }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleImport} color="primary" variant="contained">
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
};
