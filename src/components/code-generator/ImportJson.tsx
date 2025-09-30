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
import { llmStore, setLastLlmResponse } from '@/stores/llmStore';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
export interface ImportDialogProps {
  value: CodeGeneratorData;
  onChange: () => void;
}

export const ImportJsonDialog: React.FC<ImportDialogProps> = ({
  value,
  onChange,
}) => {
  const theme = useTheme();
  const [jsonContent, setJsonContent] = useState<CodeGeneratorData>('');


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


  const handleChange = React.useCallback(
    (value: string, viewUpdate: any) => {
      onChange(value);
    },
    [onChange],
  );


  const editorExtensions = [
    javascript(),
    oneDark,
    linter(validateJson),
  ];
  return (
    <Box>
        <Box>
          <CodeMirrorEditor
            value={value}
            onChange={onChange}
            filePath={`temp.json`}
            height="100%"
          />
        </Box>
</Box>
  );
};
