import React from 'react';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Undo as UndoIcon, Redo as RedoIcon } from '@mui/icons-material';
import AutoFixIcon from '@mui/icons-material/DeveloperMode';
interface CodeRepairProps {
  value: string;
  onChange: (value: string) => void;
  filePath: string;
  height?: string;
  width?: string;
}

export const CodeRepair: React.FC<CodeRepairProps> = ({
  value,
  onChange,
  filePath,
  height,
  width,
}) => {
  const handleFix = () => {
    console.log('Fixing code...');
    // Implement your fix logic here
  };

  const handleUndo = () => {
    console.log('Undoing change...');
    // Implement undo logic here
  };

  const handleRedo = () => {
    console.log('Redoing change...');
    // Implement redo logic here
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        position: 'relative',
      }}
    >
      <CodeMirrorEditor
        value={value}
        onChange={onChange}
        filePath={filePath}
        height={height ? height : '100%'}
        width={width ? width : '100%'}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: -4,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: (theme) => theme.spacing(1),
          gap: (theme) => theme.spacing(1),
        }}
      >
        <Tooltip title="Fix">
          <IconButton color="primary" onClick={handleFix}>
            <AutoFixIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Undo">
          <IconButton color="primary" onClick={handleUndo}>
            <UndoIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo">
          <IconButton color="primary" onClick={handleRedo}>
            <RedoIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
