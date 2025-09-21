import React from 'react';
import { useStore } from '@nanostores/react';
import CodeMirror from '@uiw/react-codemirror';
import { getCodeMirrorLanguage, createCodeMirrorTheme } from '@/utils'; // Import createCodeMirrorTheme
import { keymap, EditorView } from '@codemirror/view'; // Import keymap
import { themeStore } from '@/stores/themeStore';
import { Box, useTheme } from '@mui/material';

interface CodeMirrorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  filePath?: string;
  isDisabled?;
  boolean;
}

const CodeMirrorComponent: React.FC<CodeMirrorProps> = ({
  value,
  onChange,
  language,
  filePath,
  isDisabled,
}) => {
  const muiTheme = useTheme(); // Get MUI theme
  const { mode } = useStore(themeStore);
  return (
    <Box className="h-[50vh]" sx={{ flexGrow: 1, overflowY: 'auto' }}>
      <CodeMirror
        value={value || ''}
        onChange={onChange}
        extensions={[
          getCodeMirrorLanguage(filePath || '.js'),
          createCodeMirrorTheme(muiTheme), // Add custom theme here
          keymap.of([]),
          EditorView.lineWrapping,
        ]}
        theme={mode}
        editable={!isDisabled} // Allow editing unless loading or saving
        minHeight="100%" // Take all available height in this container
        maxHeight="100%"
      />
    </Box>
  );
};

export default CodeMirrorComponent;
