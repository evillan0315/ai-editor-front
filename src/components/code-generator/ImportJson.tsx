import React, { useState, useCallback } from 'react';
import {
  Box,
} from '@mui/material';

import { CodeGeneratorData } from './CodeGeneratorMain';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';

export interface ImportJsonProps {
  value: string;
  onChange: (value: string) => void;
}

export const ImportJson: React.FC<ImportJsonProps> = ({
  value,
  onChange,
}) => {
  // CodeMirrorEditor already handles language detection and basic linting based on filePath
  return (
    <Box>
      <CodeMirrorEditor
        value={value}
        onChange={onChange}
        filePath={`temp.json`}
        height="100%"
      />
    </Box>
  );
};
