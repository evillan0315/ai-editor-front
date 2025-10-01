import React from 'react';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { Box } from '@mui/material';

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
  return (
    <Box className="flex flex-col h-full">
    <Box
      sx={{

      }}
      className='flex-grow min-h-0'
    >
      <CodeMirrorEditor
        value={value}
        onChange={onChange}
        filePath={filePath}
        height={'100%'}
        width={width ? width : '100%'}
      />
    </Box>
    </Box>
  );
};
