import React, { useState, useEffect, useMemo } from 'react';
import { EditorView } from '@codemirror/view';
import { Box, Typography, useTheme } from '@mui/material';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';
import { getLanguageNameFromPath } from '@/utils';

interface CodeMirrorStatusProps {
  editorView: EditorView | null;
  filePath?: string;
}

const CodeMirrorStatus: React.FC<CodeMirrorStatusProps> = ({
  editorView,
  filePath,
}) => {
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);

  const [line, setLine] = useState(1);
  const [column, setColumn] = useState(1);
  const [lintStatus, setLintStatus] = useState('No issues'); // Placeholder for linting

  const languageName = useMemo(() => {
    return filePath ? getLanguageNameFromPath(filePath) : 'Plain Text';
  }, [filePath]);

  useEffect(() => {
    if (!editorView) {
      setLine(1);
      setColumn(1);
      setLintStatus('No issues');
      return;
    }

    const updateStatus = () => {
      const { state } = editorView;
      const head = state.selection.main.head;
      const lineObj = state.doc.lineAt(head);
      setLine(lineObj.number);
      setColumn(head - lineObj.from + 1);

      // Placeholder for linting. Proper linting integration would require
      // adding linting extensions to CodeMirrorEditor and accessing their diagnostics.
      setLintStatus('No issues');
    };

    // Initial update
    updateStatus();

    // Subscribe to view updates
    //const unsubscribe = editorView.updateListener.subscribe(updateStatus);

    return () => {
      // Unsubscribe on cleanup
      //unsubscribe();
    };
  }, [editorView]);

  const sxStatusText = {
    color: muiTheme.palette.text.secondary,
    fontSize: '0.75rem',
    mx: 1,
    display: 'flex',
    alignItems: 'center',
    '&:not(:last-of-type)': {
      borderRight: `1px solid ${muiTheme.palette.divider}`,
      pr: 1,
    },
  };

  return (
    <Box
      className="flex items-center justify-end px-2 py-1 h-8"
      sx={{
        backgroundColor: muiTheme.palette.background.default,
        borderTop: `1px solid ${muiTheme.palette.divider}`,
      }}
    >
      <Typography sx={sxStatusText}>
        Language: {languageName}
      </Typography>
      <Typography sx={sxStatusText}>
        Ln {line}, Col {column}
      </Typography>
      <Typography sx={sxStatusText}>
        {lintStatus}
      </Typography>
    </Box>
  );
};

export default CodeMirrorStatus;
