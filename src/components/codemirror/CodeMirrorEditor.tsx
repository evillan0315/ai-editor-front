import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { EditorView } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import { getCodeMirrorLanguage, createCodeMirrorTheme, getFileExtension } from '@/utils/index';
import { Box, useTheme } from '@mui/material';
import { themeStore } from '@/stores/themeStore';
import { LanguageSupport } from '@codemirror/language';
import CodeMirrorStatus from './CodeMirrorStatus';
import { Extension } from '@codemirror/state'; // Import Extension type

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  filePath?: string;
  isDisabled?: boolean;
  classNames?: string;
  height?: string;
  width?: string;
  onEditorViewChange?: (view: EditorView) => void;
  additionalExtensions?: Extension[]; // New prop for additional CodeMirror extensions
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
  additionalExtensions, // Destructure new prop
}) => {
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);
  const [editorViewInstance, setEditorViewInstance] = useState<EditorView | null>(null);

  // State for CodeMirrorStatus
  const [currentLine, setCurrentLine] = useState(1);
  const [currentColumn, setCurrentColumn] = useState(1);
  const [currentLanguageName, setCurrentLanguageName] = useState('Plain Text');
  const lintStatus = 'No issues'; // Placeholder for actual linting status

  const handleChange = React.useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  const handleUpdate = React.useCallback(
    (viewUpdate: { view: EditorView }) => {
      const { view } = viewUpdate;

      // Pass the EditorView to the parent component via callback on every update
      if (onEditorViewChange && view) {
        onEditorViewChange(view);
      }
      // Also store it locally for CodeMirrorStatus if it's a new view instance
      if (view && view !== editorViewInstance) {
        setEditorViewInstance(view);
      }

      // Update line and column for status bar
      if (view) {
        const selection = view.state.selection.main;
        const line = view.state.doc.lineAt(selection.head);
        setCurrentLine(line.number);
        setCurrentColumn(selection.head - line.from + 1);

        // Update language name for status bar
        // Prioritize language detected by CodeMirror extensions
        const languageData = view.state.languageDataAt(selection.head);
        const detectedLangName = languageData.find((data: any) => data.name)?.name;

        if (detectedLangName) {
          setCurrentLanguageName(
            detectedLangName.charAt(0).toUpperCase() + detectedLangName.slice(1),
          );
        } else if (language) {
          // Fallback to explicit language prop
          setCurrentLanguageName(language.charAt(0).toUpperCase() + language.slice(1));
        } else if (filePath) {
          // Fallback to file extension
          const ext = getFileExtension(filePath);
          setCurrentLanguageName(ext ? ext.toUpperCase() : 'Plain Text');
        } else {
          setCurrentLanguageName('Plain Text');
        }
      }
    },
    [onEditorViewChange, editorViewInstance, language, filePath],
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
      langExtensions.push(...getCodeMirrorLanguage(filePath, false));
    }

    return [
      ...langExtensions,
      createCodeMirrorTheme(muiTheme),
      EditorView.lineWrapping,
      ...(additionalExtensions || []), // Include additional extensions passed via props
    ];
  }, [language, filePath, muiTheme, additionalExtensions]); // Add additionalExtensions to dependencies

  return (
    <Box
      className={`flex flex-col ${classNames || ''}`}
      sx={{
        height: height || '100%',
        width: width || '100%',
      }}
    >
      <Box className="flex-grow"> {/* This Box wraps CodeMirror and takes available space */}
        <CodeMirror
          value={value}
          height="100%"
          width="100%"
          theme={mode}
          extensions={extensions}
          onChange={handleChange}
          onUpdate={handleUpdate}
          editable={!isDisabled}
        />
      </Box>
 
    </Box>
  );
};

export default CodeMirrorEditor;
