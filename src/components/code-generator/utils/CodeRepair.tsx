import React from 'react';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { Box, IconButton, Tooltip } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface CodeRepairProps {
  value: string;
  onChange: (value: string) => void;
  filePath: string;
  height?: string;
  width?: string;
  /** Optional: Callback to open the import drawer with the current content of CodeRepair */
  onOpenImportDrawerWithContent?: (content: string) => void;
}

export const CodeRepair: React.FC<CodeRepairProps> = ({
  value,
  onChange,
  filePath,
  height,
  width,
  onOpenImportDrawerWithContent,
}) => {
  const handleExport = () => {
    if (onOpenImportDrawerWithContent) {
      onOpenImportDrawerWithContent(value);
    }
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
      {onOpenImportDrawerWithContent && ( // Only render button if prop is provided
        <Tooltip title="Export current content to Import Data drawer">
          <IconButton
            onClick={handleExport}
            disabled={!value} // Disable if no content to export
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10, // Ensure it's above CodeMirror
            }}
          >
            <UploadFileIcon />
          </IconButton>
        </Tooltip>
      )}
      <CodeMirrorEditor
        value={value}
        onChange={onChange}
        filePath={filePath}
        height={height ? height : '100%'}
        width={width ? width : '100%'}
      />
    </Box>
  );
};
