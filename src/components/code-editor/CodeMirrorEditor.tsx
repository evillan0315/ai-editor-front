import React, { useRef, useEffect, useState } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
} from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string; // e.g., 'javascript', 'typescript', 'json'
  editable?: boolean;
  height?: string; // e.g., "100%", "400px" - this sets the 'base' height, potentially overridden by min/max
  minHeight?: string; // New prop for minimum height
  maxHeight?: string; // New prop for maximum height
}

const getLanguageExtension = (lang: string) => {
  switch (lang) {
    case 'javascript':
    case 'typescript':
      return javascript({ jsx: true, typescript: lang === 'typescript' });
    case 'json':
      return json();
    case 'markdown':
      return markdown();
    case 'html':
      return html();
    case 'css':
      return css();
    // For other languages, use basic text mode
    case 'python':
    case 'java':
    case 'go':
    case 'ruby':
    case 'php':
    case 'cpp':
    case 'shell':
    case 'xml':
    case 'yaml':
    case 'text':
    default:
      return [];
  }
};

const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  value,
  onChange,
  language,
  editable = true,
  height = 'auto',
  minHeight, // Destructure new props
  maxHeight, // Destructure new props
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = [
      keymap.of(defaultKeymap),
      getLanguageExtension(language),
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      oneDark, // Apply the dark theme
      //lineWrapping, // Enable line wrapping from @codemirror/view
      EditorView.updateListener.of((update) => {
        if (update.docChanged && editable) {
          onChange(update.state.doc.toString());
        }
      }),
      EditorState.readOnly.of(!editable),
    ];

    const startState = EditorState.create({
      doc: value,
      extensions,
    });

    const currentView = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    setView(currentView);

    return () => {
      currentView.destroy();
      setView(null);
    };
  }, [editable, language, onChange]); // Recreate view on these changes

  useEffect(() => {
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  }, [value, view]);

  // Apply height styles to the container div
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.height = height;
      editorRef.current.style.minHeight = minHeight || ''; // Apply minHeight if provided
      editorRef.current.style.maxHeight = maxHeight || ''; // Apply maxHeight if provided
      editorRef.current.style.overflowY = maxHeight ? 'auto' : 'visible'; // Enable internal scrolling if maxHeight is set
      editorRef.current.style.flexGrow = height === '100%' ? '1' : ''; // Allow flex-grow if height is 100%
      editorRef.current.style.flexShrink = height === '100%' ? '1' : ''; // Allow flex-shrink if height is 100%
    }
  }, [height, minHeight, maxHeight]);

  return (
    <div
      ref={editorRef}
      className="cm-editor-container"
      style={{
        width: '100%',
      }}
    />
  );
};

export default CodeMirrorEditor;
