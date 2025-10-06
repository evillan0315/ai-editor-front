import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { EditorView } from '@codemirror/view'; // Removed keymap as it's not directly used here for state
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import { getCodeMirrorLanguage, createCodeMirrorTheme } from '@/utils/index';
import { Box, useTheme } from '@mui/material';
import { themeStore } from '@/stores/themeStore';
import { LanguageSupport } from '@codemirror/language'; // Import LanguageSupport
import CodeMirrorStatus from './CodeMirrorStatus'; // New import

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  filePath?: string;
  isDisabled?: boolean;
  classNames?: string;
  height?: string; // This height now applies to the *entire* editor component, including status bar.
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
  onEditorViewChange,
}) => {
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);
  const [editorViewInstance, setEditorViewInstance] = useState<EditorView | null>(null); // State to hold EditorView

  const handleChange = React.useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  const handleUpdate = React.useCallback(
    (viewUpdate: { view: EditorView }) => {
      // Pass the EditorView to the parent component via callback on every update
      if (onEditorViewChange && viewUpdate.view) {
        onEditorViewChange(viewUpdate.view);
      }
      // Also store it locally for CodeMirrorStatus if it's a new view instance
      if (viewUpdate.view && viewUpdate.view !== editorViewInstance) {
        setEditorViewInstance(viewUpdate.view);
      }
    },
    [onEditorViewChange, editorViewInstance], // Add editorViewInstance to dependencies
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
    <Box
      className={`flex flex-col ${classNames || ''}`}
      sx={{
        height: height || '100%', // Total height for the editor + status bar
        width: width || '100%',
      }}
    >
      <Box className="flex-grow"> {/* This Box wraps CodeMirror and takes available space */}
        <CodeMirror
          value={value}
          height="100%" // CodeMirror itself fills its parent flex-grow Box
          width="100%" // CodeMirror itself fills its parent flex-grow Box
          theme={mode}
          extensions={extensions}
          onChange={handleChange}
          onUpdate={handleUpdate}
          editable={!isDisabled}
        />
      </Box>
      {/* CodeMirrorStatus component at the bottom, automatically sticky due to flex-col and flex-grow on editor */}
      <CodeMirrorStatus editorView={editorViewInstance} filePath={filePath} />
    </Box>
  );
};

export default CodeMirrorEditor;
