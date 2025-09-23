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

interface ErrorLocation {
  line: number;
  column: number;
}

interface FixRequest {
  code: string;
  error: any;
  errorLocation?: ErrorLocation;
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
    try {
      // Simulate JSON parsing to detect errors and their location
      const parsedData = JSON.parse(value);
      console.log('JSON is valid:', parsedData);
      // If JSON is valid, proceed with other fix logic
    } catch (e: any) {
      // Capture error details and location
      const error = e.message;
      const errorLocation = {
        line: e.lineNumber,
        column: e.columnNumber,
      };

      const fixRequest: FixRequest = {
        code: value,
        error: error,
        errorLocation: errorLocation,
      };

      // Send the data to the backend (replace with actual API call)
      fetch('/api/fix-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fixRequest),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('Fix response:', data);
          // Handle the response from the backend, e.g., update the code
          onChange(data.fixedCode);
        })
        .catch((error) => {
          console.error('Error sending fix request:', error);
        });
    }
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
        <Tooltip title='Fix'>
          <IconButton color='primary' onClick={handleFix}>
            <AutoFixIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='Undo'>
          <IconButton color='primary' onClick={handleUndo}>
            <UndoIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='Redo'>
          <IconButton color='primary' onClick={handleRedo}>
            <RedoIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
