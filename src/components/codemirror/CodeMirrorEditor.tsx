import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { EditorView, keymap } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import { getCodeMirrorLanguage, createCodeMirrorTheme, getLanguageNameFromPath } from '@/utils/index';
import { Box, useTheme } from '@mui/material';
import { themeStore } from '@/stores/themeStore';
import { LanguageSupport } from '@codemirror/language';
import CodeMirrorStatus from './CodeMirrorStatus';

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
  onSave?: () => void; // New prop for save functionality
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
  onSave, // Destructure new prop
}) => {
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);
  const [editorViewInstance, setEditorViewInstance] = useState<EditorView | null>(null);
  const [currentLine, setCurrentLine] = useState(1);
  const [currentColumn, setCurrentColumn] = useState(1);
  const [currentLanguageName, setCurrentLanguageName] = useState('Plain Text');
  const [currentLintStatus, setCurrentLintStatus] = useState('No issues');

  // Effect to update language name when filePath or explicit language prop changes
  React.useEffect(() => {
    const newLanguageName = filePath
      ? getLanguageNameFromPath(filePath)
      : language === 'typescript'
        ? 'TypeScript'
        : language === 'json'
          ? 'Json'
        : language === 'javascript'
          ? 'JavaScript'
          : 'Plain Text'; // Fallback for explicit language prop or no path
    setCurrentLanguageName(newLanguageName);
  }, [language, filePath]);

  const handleChange = React.useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  const handleUpdate = React.useCallback(
    (viewUpdate: { view: EditorView; changes: any; transactions: any }) => {
      const view = viewUpdate.view;

      if (onEditorViewChange && view) {
        onEditorViewChange(view);
      }

      // Only update editorViewInstance if it's a new instance to prevent unnecessary re-renders
      if (view && view !== editorViewInstance) {
        setEditorViewInstance(view);
      }

      // Update line and column based on current selection
      if (view) {
        const head = view.state.selection.main.head;
        const lineObj = view.state.doc.lineAt(head);
        setCurrentLine(lineObj.number);
        setCurrentColumn(head - lineObj.from + 1);
      }

      // Placeholder for lint status update. Real linting would involve CodeMirror lint extensions.
      setCurrentLintStatus('No issues');
    },
    [onEditorViewChange, editorViewInstance], // `editorViewInstance` added to dependencies to correctly detect changes in view instance.
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
    // If no specific language is determined by 'language' prop or 'filePath',
    // CodeMirror will treat it as plain text.

    const baseExtensions = [
      ...langExtensions,
      createCodeMirrorTheme(muiTheme),
      EditorView.lineWrapping,
    ];

    if (onSave) {
      baseExtensions.push(
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              onSave();
              return true;
            },
          },
        ]),
      );
    }

    return baseExtensions;
  }, [language, filePath, muiTheme, onSave]); // Added onSave to dependencies

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
      <CodeMirrorStatus
        languageName={currentLanguageName}
        line={currentLine}
        column={currentColumn}
        lintStatus={currentLintStatus}
      />
    </Box>
  );
};

export default CodeMirrorEditor;
