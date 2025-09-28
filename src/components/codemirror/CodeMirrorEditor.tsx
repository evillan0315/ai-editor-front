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
interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  filePath?: string;
  isDisabled?: boolean;
  classNames?: string;
  height?: string;
  width?: string;
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
}) => {
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);
  const handleChange = React.useCallback(
    (value: string, viewUpdate: any) => {
      onChange(value);
    },
    [onChange],
  );

  const extensions = React.useMemo(() => {
    const lang =
      language === 'typescript' ? javascript({ jsx: true }) : javascript();
    return [
      lang,
      getCodeMirrorLanguage(value),
      createCodeMirrorTheme(muiTheme),
      EditorView.lineWrapping,
    ];
  }, [language]);

  return (
    <Box className="h-full">
      <CodeMirror
        value={value}
        height={height ? height : '100%'}
        width={width ? width : '100%'}
        theme={mode}
        extensions={extensions}
        onChange={handleChange}
        editable={!isDisabled}
      />
    </Box>
  );
};

export default CodeMirrorEditor;
