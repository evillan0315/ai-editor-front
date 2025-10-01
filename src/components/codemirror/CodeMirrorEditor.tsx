import React from 'react';
import CodeMirror, { BasicSetupOptions } from '@uiw/react-codemirror';
import { createTheme } from '@uiw/codemirror-theme-one-dark'; // Use one-dark as a fallback
import { tags as t } from '@lezer/highlight';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { createCodeMirrorTheme, getCodeMirrorLanguage } from '@/utils'; // Import custom theme creator
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';

interface CodeMirrorEditorProps {
  value: string;
  onChange?: (value: string) => void;
  filePath: string;
  height?: string;
  width?: string;
  minHeight?: string;
  maxHeight?: string;
  extensions?: any[];
  basicSetup?: BasicSetupOptions | boolean;
  /** If true, the editor content cannot be changed. Defaults to false. */
  isDisabled?: boolean;
  /** If true, the editor content can be changed. Defaults to true. */
  editable?: boolean;
  /** Optional callback for saving the file, typically on Cmd/Ctrl+S. */
  onSave?: (value: string) => void;
  /** If true, enables diff view specific styling. */
  isDiffView?: boolean;
}

const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  value,
  onChange,
  filePath,
  height = '100%',
  width = '100%',
  minHeight,
  maxHeight,
  extensions = [],
  basicSetup = {
    lineNumbers: true,
    highlightActiveLineGutter: true,
    highlightSpecialChars: true,
    history: true,
    foldGutter: true,
    dropCursor: true,
    allowMultipleSelections: true,
    indentOnInput: true,
    syntaxHighlighting: true,
    bracketMatching: true,
    closeBrackets: true,
    autocompletion: true,
    rectangularSelection: true,
    crosshairCursor: true,
    highlightActiveLine: true,
    highlightSelectionMatches: true,
    closeBracketsKeymap: true,
    completionKeymap: true,
    // Not including lintKeymap as it might interfere or be redundant if linting is setup via extensions
    // searchKeymap: true, // Search is often useful, but can be added via extensions explicitly too.
    // We'll manage search via default keymap and other extensions
  },
  isDisabled = false,
  editable = true,
  onSave,
  isDiffView = false,
}) => {
  const { mode } = useStore(themeStore);
  const muiTheme = useMuiTheme();

  const languageExtensions = getCodeMirrorLanguage(filePath, isDiffView);

  const cmTheme = createCodeMirrorTheme(muiTheme, isDiffView);

  const combinedExtensions = [
    ...languageExtensions,
    ...extensions,
    cmTheme,
    EditorView.lineWrapping, // Enable line wrapping
    EditorState.readOnly.of(!editable || isDisabled), // Use editable prop here
  ];

  // Add save keymap if onSave is provided
  if (onSave) {
    combinedExtensions.push(
      keymap.of([
        {
          key: 'Mod-s',
          run: () => {
            onSave(value);
            return true;
          },
          preventDefault: true,
        },
      ]),
    );
  }

  return (
    <CodeMirror
      value={value}
      height={height}
      width={width}
      minHeight={minHeight}
      maxHeight={maxHeight}
      theme={cmTheme} // Apply the custom MUI theme
      extensions={combinedExtensions}
      onChange={onChange}
      basicSetup={basicSetup}
      readOnly={!editable || isDisabled} // Control editability based on prop
      className="w-full"
    />
  );
};

export default CodeMirrorEditor;
