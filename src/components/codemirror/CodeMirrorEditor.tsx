import React from 'react';
import { useStore } from '@nanostores/react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import { getCodeMirrorLanguage, createCodeMirrorTheme } from '@/utils/index';
import { oneDark } from '@codemirror/theme-one-dark';
import { Box, useTheme } from '@mui/material';
import { themeStore } from '@/stores/themeStore';
import { LanguageSupport } from '@codemirror/language'; // Import LanguageSupport

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  filePath?: string;
  isDisabled?: boolean;
  classNames?: string;
  height?: string;
  width?: string;
  onEditorViewChange?: (view: EditorView) => void; // New prop to pass EditorView
}

const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  value,
  onChange,
  language,
  filePath,
  isDisabled,
  classNames,
  height,
  width,
  onEditorViewChange, // Destructure new prop
}) => {
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);

  const handleChange = React.useCallback(
    (val: string, viewUpdate: any) => {
      onChange(val);
    },
    [onChange],
  );

  const handleUpdate = React.useCallback(
    (viewUpdate: any) => {
      // Pass the EditorView to the parent component via callback on every update
      if (onEditorViewChange && viewUpdate.view) {
        onEditorViewChange(viewUpdate.view);
      }
    },
    [onEditorViewChange],
  );

  const extensions = React.useMemo(() => {
    // Determine language support based on filePath or explicit language prop
    const langExtensions: LanguageSupport[] = [];
    if (language) {
      // Explicit language prop takes precedence
      if (language === 'typescript') {
        langExtensions.push(javascript({ jsx: true, typescript: true }));
      } else if (language === 'javascript') {
        langExtensions.push(javascript({ jsx: true }));
      }
      // Add more explicit language string mappings here if needed (e.g., 'json', 'markdown', 'html', 'css')
    } else if (filePath) {
      // Fallback to utility function if no explicit language and filePath is available
      langExtensions.push(...getCodeMirrorLanguage(filePath, false)); // Pass filePath correctly
    }
    // If no specific language is determined by 'language' prop or 'filePath',
    // CodeMirror will treat it as plain text.

    return [
      ...langExtensions,
      createCodeMirrorTheme(muiTheme),
      EditorView.lineWrapping,
    ];
  }, [language, filePath, muiTheme]); // Added filePath to dependencies for language detection

  return (
    <Box className="h-full">
      <CodeMirror
        value={value}
        height={height ? height : '100%'}
        width={width ? width : '100%'}
        theme={mode} // Retain original theme prop behavior
        extensions={extensions}
        onChange={handleChange}
        onUpdate={handleUpdate} // Use onUpdate to pass EditorView changes
        editable={!isDisabled}
      />
    </Box>
  );
};

export default CodeMirrorEditor;