import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { EditorView, Line } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import { getCodeMirrorLanguage, createCodeMirrorTheme, getFileExtension } from '@/utils/index';
import { Box, useTheme } from '@mui/material';
import { themeStore } from '@/stores/themeStore';
import { LanguageSupport, syntaxTree } from '@codemirror/language';
import { Extension, EditorState, ChangeSpec } from '@codemirror/state';
import { linter, lintGutter, Diagnostic } from '@codemirror/lint';
import { llmStore } from '@/stores/llmStore';
import { fileStore } from '@/stores/fileStore';
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
  additionalExtensions?: Extension[];
}
// Function to generate basic diagnostics for production-level checks
const generateBasicDiagnostics = (view: EditorView): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];
  const doc = view.state.doc;
  try {
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const lineText = line.text;
      // 1. Detect empty lines
      if (lineText.trim().length === 0) {
        diagnostics.push({
          from: line.from,
          to: line.to,
          severity: 'info',
          message: 'Empty line',
          source: 'editor-linter',
        });
      }
      // 2. Detect console statements
      const consoleRegex = /console\.(log|warn|error|info|debug)\(.+\);?/g;
      let match;
      while ((match = consoleRegex.exec(lineText)) !== null) {
        diagnostics.push({
          from: line.from + match.index,
          to: line.from + match.index + match[0].length,
          severity: 'warning',
          message: 'Avoid console statements in production code',
          source: 'editor-linter',
        });
      }
      // 3. Detect  statements
      const Regex = /?/g;
      while ((match = Regex.exec(lineText)) !== null) {
        diagnostics.push({
          from: line.from + match.index,
          to: line.from + match.index + match[0].length,
          severity: 'warning',
          message: 'Debugger statement found',
          source: 'editor-linter',
        });
      }
    }
    // 4. Detect generic syntax errors from CodeMirror's language parser
    syntaxTree(view.state).iterate({
      enter: (node) => {
        if (!node?.type?.name) return;
        if (node.type.name === '⚠') {
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
  } catch (e) {
// //     console.error('Error in generateBasicDiagnostics:', e);
    diagnostics.push({
      from: 0,
      to: doc.length,
      severity: 'error',
      message: `Linter internal error: ${e instanceof Error ? e.message : String(e)}`,
      source: 'custom-linter-error',
    });
  }
  return diagnostics;
};
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
  const { buildOutput } = useStore(llmStore);
  const { saveFileContentError } = useStore(fileStore);
  const [editorViewInstance, setEditorViewInstance] = useState<EditorView | null>(null);
  const [currentLine, setCurrentLine] = useState(1);
  const [currentColumn, setCurrentColumn] = useState(1);
  const [currentLanguageName, setCurrentLanguageName] = useState('Plain Text');
  const [lintIssuesCount, setLintIssuesCount] = useState(0);
  const [allDiagnostics, setAllDiagnostics] = useState<Diagnostic[]>([]); // State to store all diagnostics
  const handleChange = React.useCallback(
    (val: string) => onChange(val),
    [onChange],
  );
  // Custom linter with direct count tracking
  const basicLinterExtension = React.useMemo(() => {
    return linter((view) => {
      const diagnostics = generateBasicDiagnostics(view);
      setLintIssuesCount(diagnostics.length);
      setAllDiagnostics(diagnostics); // Store all diagnostics
      return diagnostics;
    });
  }, []);
  const handleUpdate = React.useCallback(
    (viewUpdate: { view: EditorView; state: EditorState }) => {
      const { view } = viewUpdate;
      if (!view) return;
      if (onEditorViewChange) onEditorViewChange(view);
      if (view !== editorViewInstance) setEditorViewInstance(view);
      const selection = view.state.selection.main;
      const line = view.state.doc.lineAt(selection.head);
      setCurrentLine(line.number);
      setCurrentColumn(selection.head - line.from + 1);
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
    },
    [onEditorViewChange, editorViewInstance, language, filePath],
  );
  // Function to scroll to a specific line in the editor
  const handleGoToLine = React.useCallback(
    (lineNumber: number) => {
      if (!editorViewInstance) return;
      const line = editorViewInstance.state.doc.line(lineNumber);
      editorViewInstance.dispatch({
        selection: { anchor: line.from }, // Place cursor at the start of the line
        effects: EditorView.scrollIntoView(line.from, {
          y: 'center', // Scroll to center the line
        }),
      });
    },
    [editorViewInstance],
  );
  // Function to automatically fix issues
  const handleAutoFix = React.useCallback(
    (fixableDiagnostics: Diagnostic[]) => {
      if (!editorViewInstance) return;
      const changes: ChangeSpec[] = [];
      // Sort diagnostics in reverse order of their 'from' position to apply changes safely
      const sortedDiagnostics = [...fixableDiagnostics].sort((a, b) => b.from - a.from);
      for (const diag of sortedDiagnostics) {
        const line = editorViewInstance.state.doc.lineAt(diag.from);
        let change: ChangeSpec | null = null;
        if (diag.message.includes('Avoid console statements')) {
          // Comment out the entire line containing the console statement
          const lineContent = editorViewInstance.state.doc.sliceString(line.from, line.to);
          change = { from: line.from, to: line.to, insert: `// ${lineContent}` };
        } else if (diag.message.includes('Debugger statement found')) {
          // Remove the  statement
          change = { from: diag.from, to: diag.to, insert: '' };
        } else if (diag.message.includes('Empty line')) {
          // Remove the entire empty line, including the newline character if not the last line
          const isLastLine = line.number === editorViewInstance.state.doc.lines;
          change = { from: line.from, to: isLastLine ? line.to : line.to + 1, insert: '' };
        }
        if (change) {
          changes.push(change);
        }
      }
      if (changes.length > 0) {
        editorViewInstance.dispatch({ changes });
        // The editor's onUpdate and onChange handlers will be triggered automatically.
      }
    },
    [editorViewInstance],
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
      lintGutter(),
      basicLinterExtension,
      ...(additionalExtensions || []),
    ];
  }, [language, filePath, muiTheme, additionalExtensions, basicLinterExtension]);
  const buildErrorMessage = buildOutput?.stderr || saveFileContentError || null;
  return (
    <Box
      className={`flex flex-col ${classNames || ''}`}
      sx={{ height: height || '100%', width: width || '100%' }}
    >
      <Box className="flex-grow overflow-auto">
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
        diagnostics={allDiagnostics}
        editorViewInstance={editorViewInstance}
        onGoToLine={handleGoToLine}
        onAutoFix={handleAutoFix}
      />
    </Box>
  );
};
export default CodeMirrorEditor;