import React from 'react';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FileEntry } from '@/types/fileTree';
import {
  toggleDirExpansion,
  setSelectedFile,
  fileTreeStore,
} from '@/stores/fileTreeStore';
import { useStore } from '@nanostores/react';
import * as path from 'path-browserify';

interface FileTreeItemProps {
  fileEntry: FileEntry;
  projectRoot: string;
}

// Determine icon based on file extension
const getFileIcon = (fileName: string) => {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.js':
    case '.jsx':
    case '.ts':
    case '.tsx':
      return (
        <span className="text-blue-500 font-bold text-xs w-5 text-center">
          JS/TS
        </span>
      );
    case '.json':
      return (
        <span className="text-purple-500 font-bold text-xs w-5 text-center">
          {}
        </span>
      );
    case '.md':
    case '.markdown':
      return (
        <span className="text-gray-500 font-bold text-xs w-5 text-center">
          MD
        </span>
      );
    case '.html':
    case '.htm':
      return (
        <span className="text-orange-500 font-bold text-xs w-5 text-center">
          &lt;/&gt;
        </span>
      );
    case '.css':
      return (
        <span className="text-blue-400 font-bold text-xs w-5 text-center">
          #
        </span>
      );
    case '.xml':
      return (
        <span className="text-green-500 font-bold text-xs w-5 text-center">
          &lt;?
        </span>
      );
    case '.py':
      return (
        <span className="text-yellow-600 font-bold text-xs w-5 text-center">
          PY
        </span>
      );
    case '.java':
      return (
        <span className="text-red-500 font-bold text-xs w-5 text-center">
          JV
        </span>
      );
    case '.go':
      return (
        <span className="text-cyan-500 font-bold text-xs w-5 text-center">
          GO
        </span>
      );
    case '.rb':
      return (
        <span className="text-red-700 font-bold text-xs w-5 text-center">
          RB
        </span>
      );
    case '.php':
      return (
        <span className="text-indigo-500 font-bold text-xs w-5 text-center">
          PHP
        </span>
      );
    case '.c':
    case '.cpp':
    case '.h':
      return (
        <span className="text-gray-600 font-bold text-xs w-5 text-center">
          C++
        </span>
      );
    case '.sh':
      return (
        <span className="text-green-700 font-bold text-xs w-5 text-center">
          SH
        </span>
      );
    case '.yaml':
    case '.yml':
      return (
        <span className="text-pink-500 font-bold text-xs w-5 text-center">
          YML
        </span>
      );
    case '.env':
      return (
        <span className="text-gray-700 font-bold text-xs w-5 text-center">
          .ENV
        </span>
      );
    case '.gitignore':
      return (
        <span className="text-gray-400 font-bold text-xs w-5 text-center">
          .GIT
        </span>
      );
    default:
      return (
        <InsertDriveFileOutlinedIcon
          fontSize="small"
          sx={{ color: 'text.secondary' }}
        />
      );
  }
};

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  fileEntry,
  projectRoot,
}) => {
  const { expandedDirs, selectedFile } = useStore(fileTreeStore);
  const theme = useTheme();
  const isExpanded = expandedDirs.has(fileEntry.filePath);
  const isSelected = selectedFile === fileEntry.filePath;

  const handleToggleIconClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent the parent Box's onClick from firing
    if (fileEntry.type === 'directory') {
      toggleDirExpansion(fileEntry.filePath);
    } else {
      setSelectedFile(fileEntry.filePath);
    }
  };

  const handleItemClick = () => {
    if (fileEntry.type === 'directory') {
      toggleDirExpansion(fileEntry.filePath);
    } else {
      setSelectedFile(fileEntry.filePath);
    }
  };

  const levelPadding = (fileEntry.depth || 0) * 16; // 16px per depth level

  const textColor =
    theme.palette.mode === 'dark'
      ? theme.palette.grey[200]
      : theme.palette.grey[800];
  const selectedBgColor =
    theme.palette.mode === 'dark'
      ? theme.palette.primary.dark
      : theme.palette.primary.light;
  const hoverBgColor =
    theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[200];

  return (
    <Box>
      <Box
        className="flex items-center cursor-pointer select-none rounded-md"
        sx={{
          minHeight: '28px',
          paddingLeft: `${levelPadding}px`,
          bgcolor: isSelected ? selectedBgColor : 'transparent',
          '&:hover': {
            bgcolor: isSelected ? selectedBgColor : hoverBgColor,
          },
          color: isSelected ? theme.palette.primary.contrastText : textColor,
          transition: 'background-color 0.15s ease-in-out',
        }}
        onClick={handleItemClick}
      >
        {/* Fixed-width slot for expand/collapse icon or a spacing placeholder */}
        <Box
          sx={{
            width: 24, // Consistent width for the toggle/placeholder area
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {fileEntry.type === 'directory' ? (
            <IconButton
              size="small"
              onClick={handleToggleIconClick}
              sx={{ color: isSelected ? 'inherit' : textColor, p: 0 }} // Reduce padding for compact size
            >
              {isExpanded ? (
                <ExpandMoreIcon fontSize="inherit" />
              ) : (
                <ChevronRightIcon fontSize="inherit" />
              )}
            </IconButton>
          ) : (
            // Files get a spacer to align their icons/names with directories
            <Box sx={{ width: 24, height: 24 }} />
          )}
        </Box>

        {/* Fixed-width slot for file/folder type icon */}
        <Box
          sx={{
            width: 20, // Consistent width for the file/folder icon
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 0.5,
            flexShrink: 0,
          }}
        >
          {fileEntry.type === 'directory' ? (
            isExpanded ? (
              <FolderOpenIcon
                fontSize="small"
                sx={{
                  color: isSelected ? 'inherit' : theme.palette.text.secondary,
                }}
              />
            ) : (
              <FolderIcon
                fontSize="small"
                sx={{
                  color: isSelected ? 'inherit' : theme.palette.text.secondary,
                }}
              />
            )
          ) : (
            getFileIcon(fileEntry.name)
          )}
        </Box>

        {/* File/Folder Name */}
        <Typography
          variant="body2"
          sx={{
            ml: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flexGrow: 1,
          }}
        >
          {fileEntry.name}
        </Typography>
      </Box>
      {fileEntry.type === 'directory' && isExpanded && fileEntry.children && (
        <Box sx={{ pl: 0 }}>
          {' '}
          {/* Children handle their own paddingLeft */}
          {fileEntry.children.map((child) => (
            <FileTreeItem
              key={child.filePath}
              fileEntry={child}
              projectRoot={projectRoot}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FileTreeItem;
