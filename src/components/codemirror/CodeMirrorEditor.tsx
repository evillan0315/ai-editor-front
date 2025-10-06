import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { EditorView, Line } from '@codemirror/view'; // Import Line type
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import { getCodeMirrorLanguage, createCodeMirrorTheme, getFileExtension } from '@/utils/index';
import { Box, useTheme } from '@mui/material';
import { themeStore } from '@/stores/themeStore';
import { LanguageSupport, syntaxTree } from '@codemirror/language';
import CodeMirrorStatus from './CodeMirrorStatus';
import { Extension, EditorState } from '@codemirror/state';
import { linter, lintGutter, Diagnostic } from '@codemirror/lint';
import { llmStore } from '@/stores/llmStore';
import { fileStore } from '@/stores/fileStore';

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
  additionalExtensions?: Extension[];
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
  additionalExtensions,
}) => {
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);
  const { buildOutput } = useStore(llmStore); // Get buildOutput from llmStore
  const { saveFileContentError } = useStore(fileStore); // Get saveFileContentError from fileStore

  const [editorViewInstance, setEditorViewInstance] = useState<EditorView | null>(null);

  // State for CodeMirrorStatus
  const [currentLine, setCurrentLine] = useState(1);
  const [currentColumn, setCurrentColumn] = useState(1);
  const [currentLanguageName, setCurrentLanguageName] = useState('Plain Text');
  const [lintIssuesCount, setLintIssuesCount] = useState(0); // State for lint issues count

  const handleChange = React.useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  // Basic linter: can be expanded with more sophisticated checks or integrated with a language server
  const basicLinter = React.useCallback(linter((view: EditorView) => {
    const diagnostics: Diagnostic[] = [];
    const tree = syntaxTree(view.state);

    // Example: Find lines containing "TODO" and mark them as warnings
    view.state.doc.iterLines((lineObj: Line, i: number) => { // 'lineObj' is a Line object, not a string
      const lineText = lineObj.text; // Get the actual string content
      const lineNumber = i + 1; // Line numbers are 1-based

      const todoMatch = lineText.match(/TODO/i);
      if (todoMatch) {
        diagnostics.push({
          from: lineObj.from + (todoMatch.index || 0),
          to: lineObj.from + (todoMatch.index || 0) + todoMatch[0].length,
          severity: 'warning',
          message: 'Todo item found',
          source: 'custom-linter',
        });
      }

      // Example: Basic check for empty lines (can be expanded)
      if (lineText.trim() === '' && lineNumber > 1 && lineNumber < view.state.doc.lines) {
        diagnostics.push({
          from: lineObj.from,
          to: lineObj.from + lineText.length,
          severity: 'info',
          message: 'Empty line',
          source: 'custom-linter',
        });
      }
    });

    // Example: Find basic syntax errors if the language support provides them
    // This part requires specific language package integration to get syntax errors
    // For now, it's mostly reliant on CodeMirror's own syntax parsing to identify "error" nodes
    tree.iterate({
      enter: (node) => {
        if (node.type.name === '⚠') { // CodeMirror's generic error node type
          diagnostics.push({
            from: node.from,
            to: node.to,
            severity: 'error',
            message: `Syntax Error: ${view.state.doc.sliceString(node.from, node.to)}`,
            source: 'codemirror-syntax',
          });
        }
      },
    });

    setLintIssuesCount(diagnostics.length);
    return diagnostics;
  }), []);


  const handleUpdate = React.useCallback(
    (viewUpdate: { view: EditorView; state: EditorState }) => {
      const { view, state } = viewUpdate;

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
        const languageData = view.state.languageDataAt(selection.head);
        const detectedLangName = languageData.find((data: any) => data.name)?.name;

        if (detectedLangName) {
          setCurrentLanguageName(
            detectedLangName.charAt(0).toUpperCase() + detectedLangName.slice(1),
          );
        } else if (language) {
          setCurrentLanguageName(language.charAt(0).toUpperCase() + language.slice(1));
        } else if (filePath) {
          const ext = getFileExtension(filePath);
          setCurrentLanguageName(ext ? ext.toUpperCase() : 'Plain Text');
        } else {
          setCurrentLanguageName('Plain Text');
        }

        // Update lint issues count on every update
        // The linter extension itself (basicLinter) will update setLintIssuesCount
      }
    },
    [onEditorViewChange, editorViewInstance, language, filePath, basicLinter],
  );

  const extensions = React.useMemo(() => {
    const langExtensions: LanguageSupport[] = [];
    if (language) {
      if (language === 'typescript') {
        langExtensions.push(javascript({ jsx: true, typescript: true }));
      } else if (language === 'javascript') {
        langExtensions.push(javascript({ jsx: true }));
      }
    } else if (filePath) {
      langExtensions.push(...getCodeMirrorLanguage(filePath, false));
    }

    return [
      ...langExtensions,
      createCodeMirrorTheme(muiTheme),
      EditorView.lineWrapping,
      lintGutter(), // Add lint gutter
      basicLinter, // Add custom linter
      ...(additionalExtensions || []),
    ];
  }, [language, filePath, muiTheme, additionalExtensions, basicLinter]);

  // Determine the build error message to display
  const buildErrorMessage = buildOutput?.stderr || saveFileContentError || null;

  return (
    <Box
      className={`flex flex-col ${classNames || ''}`}
      sx={{
        height: height || '100%',
        width: width || '100%',
      }}
    >
      <Box className="flex-grow overflow-auto"> {/* This Box wraps CodeMirror and takes available space */}
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
      <CodeMirrorStatus
        languageName={currentLanguageName}
        line={currentLine}
        column={currentColumn}
        lintIssuesCount={lintIssuesCount}
        buildErrorMessage={buildErrorMessage}
        filePath={filePath}
      />
    </Box>
  );
};

export default CodeMirrorEditor;
