import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  ListItemButton,
  CircularProgress,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Specific file type icons
import CodeIcon from '@mui/icons-material/Code'; // For generic code files, JS, TS, Python, Java, Go, etc.
import DataObjectIcon from '@mui/icons-material/DataObject'; // For JSON/YAML
import ArticleIcon from '@mui/icons-material/Article'; // For Markdown/Text
import HtmlIcon from '@mui/icons-material/Html'; // For HTML
import CssIcon from '@mui/icons-material/Css'; // For CSS/SCSS/LESS
import ImageIcon from '@mui/icons-material/Image'; // For images (jpg, png, svg)
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'; // For PDF
import ArchiveIcon from '@mui/icons-material/Archive'; // For zip/rar/tar
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet'; // For config/env/xml
import StorageIcon from '@mui/icons-material/Storage'; // For SQL/DB
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'; // For video/audio

import { FileEntry } from '@/types/fileTree';
import { toggleDirExpansion, setSelectedFile } from '@/stores/fileTreeStore';
import { useStore } from '@nanostores/react';
import * as path from 'path-browserify';

interface FileTreeItemProps {
  fileEntry: FileEntry;
  projectRoot: string;
  onFileClick?: (filePath: string) => void; // Optional callback for file clicks, used by dialog
}

/**
 * Determines the appropriate Material Icon component and color based on file extension.
 * Fallbacks to a generic file icon if no specific match is found.
 * @param fileName The name of the file.
 * @param defaultColor The default color to use if no specific iconColor is defined for the extension.
 * @returns A React element representing the file icon.
 */
const getFileIconComponent = (fileName: string, defaultColor: string) => {
  const ext = path.extname(fileName).toLowerCase();
  let IconComponent: React.ElementType = InsertDriveFileOutlinedIcon; // Default icon
  let iconColor = defaultColor; // Default to the passed-in color

  switch (ext) {
    case '.js':
    case '.jsx':
    case '.ts':
    case '.tsx':
    case '.mjs':
    case '.cjs':
      IconComponent = CodeIcon;
      iconColor = '#61DAFB'; // React/JS blue
      break;
    case '.json':
    case '.yml':
    case '.yaml':
      IconComponent = DataObjectIcon;
      iconColor = '#E0B420'; // Yellowish for data objects
      break;
    case '.md':
    case '.markdown':
    case '.txt':
      IconComponent = ArticleIcon;
      iconColor = '#9E9E9E'; // Grey for text/docs
      break;
    case '.html':
    case '.htm':
      IconComponent = HtmlIcon;
      iconColor = '#E34C26'; // HTML orange
      break;
    case '.css':
    case '.scss':
    case '.less':
      IconComponent = CssIcon;
      iconColor = '#264DE4'; // CSS blue
      break;
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
    case '.svg':
    case '.webp':
      IconComponent = ImageIcon;
      iconColor = '#4CAF50'; // Green for images
      break;
    case '.pdf':
      IconComponent = PictureAsPdfIcon;
      iconColor = '#B71C1C'; // Red for PDF
      break;
    case '.zip':
    case '.rar':
    case '.7z':
    case '.tar':
    case '.gz':
      IconComponent = ArchiveIcon;
      iconColor = '#607D8B'; // Blue-grey for archives
      break;
    case '.env':
    case '.ini':
    case '.config':
    case '.xml':
      IconComponent = SettingsEthernetIcon;
      iconColor = '#795548'; // Brown for config
      break;
    case '.sql':
    case '.db':
      IconComponent = StorageIcon;
      iconColor = '#03A9F4'; // Light blue for databases
      break;
    case '.mp4':
    case '.mov':
    case '.webm':
    case '.mp3':
    case '.wav':
      IconComponent = PlayCircleOutlineIcon;
      iconColor = '#F44336'; // Red for media
      break;
    case '.py':
      IconComponent = CodeIcon;
      iconColor = '#FFD43B'; // Python yellow
      break;
    case '.java':
      IconComponent = CodeIcon;
      iconColor = '#E60000'; // Java red
      break;
    case '.go':
      IconComponent = CodeIcon;
      iconColor = '#00ADD8'; // Go blue
      break;
    case '.rb':
      IconComponent = CodeIcon;
      iconColor = '#CC342D'; // Ruby red
      break;
    case '.php':
      IconComponent = CodeIcon;
      iconColor = '#8892BF'; // PHP purple
      break;
    case '.c':
    case '.cpp':
    case '.h':
      IconComponent = CodeIcon;
      iconColor = '#00599C'; // C/C++ blue
      break;
    case '.sh':
    case '.bash':
      IconComponent = CodeIcon;
      iconColor = '#4CAF50'; // Shell green
      break;
    default:
      // For unknown extensions, use the default icon and the passed-in color
      IconComponent = InsertDriveFileOutlinedIcon;
      iconColor = defaultColor;
      break;
  }
  return <IconComponent fontSize="small" sx={{ color: iconColor }} />;
};

const FileTreeItem: React.FC<FileTreeItemProps> = ({ fileEntry, projectRoot, onFileClick }) => {
  const { selectedFile } = useStore(fileTreeStore); // Only need selectedFile here
  const theme = useTheme();

  // Using fileEntry.isOpen and fileEntry.isLoadingChildren directly from the entry
  // as they are now managed within the hierarchical `files` array in fileTreeStore.
  const isExpanded = fileEntry.isOpen; // `isOpen` in FileEntry is now the source of truth for expansion
  const isLoadingChildren = fileEntry.isLoadingChildren; // `isLoadingChildren` in FileEntry

  const isSelected = selectedFile === fileEntry.filePath;

  const handleToggleExpansion = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent ListItemButton click from firing
    if (fileEntry.type === 'folder') {
      toggleDirExpansion(fileEntry.filePath); // Call the store action to toggle/fetch
    }
  };

  const handleSelectionClick = () => {
    // If onFileClick is provided (e.g., from FileBrowserDialog), use it.
    // Otherwise, for the main tree, set selectedFile and openedFile in the editor.
    if (onFileClick) {
      onFileClick(fileEntry.filePath);
    } else {
      setSelectedFile(fileEntry.filePath);
    }
  };

  // Adjust padding for indentation
  // The ListItemButton itself has some padding, so we might need to reduce it
  // or apply the depth padding to the outer container.
  const levelPadding = (fileEntry.depth || 0) * 16; // 16px per depth level

  const textColor = isSelected ? theme.palette.primary.contrastText : theme.palette.text.primary;
  const selectedBgColor =
    theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light;
  const hoverBgColor =
    theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200];

  return (
    <Box sx={{ pl: `${levelPadding}px` }}>
      {' '}
      {/* Apply depth padding here */}
      <Box className="flex items-center">
        {fileEntry.type === 'folder' ? (
          <IconButton
            size="small"
            onClick={handleToggleExpansion}
            sx={{
              width: 24, // Fixed width for alignment
              height: 24,
              flexShrink: 0,
              mr: 0.5,
              color: textColor, // Use text color for expand/collapse icon
            }}
          >
            {isExpanded ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )}
          </IconButton>
        ) : (
          <Box sx={{ width: 24, height: 24, flexShrink: 0, mr: 0.5 }} /> 
        )}

        <ListItemButton
          onClick={handleSelectionClick}
          selected={isSelected}
          sx={{
            flexGrow: 1,
            py: 0.5, // Reduced vertical padding
            pr: 1, // Reduced right padding
            borderRadius: 1,
            '&.Mui-selected': {
              bgcolor: selectedBgColor,
              color: textColor,
              '&:hover': { bgcolor: selectedBgColor },
            },
            '&:hover': { bgcolor: hoverBgColor },
            display: 'flex',
            alignItems: 'center',
            // Override default ListItemButton padding to make it flow from the expand/collapse icon
            paddingLeft: '0', // No default padding, handled by parent Box
          }}
        >
          {/* File/Folder Type Icon */}
          <Box
            sx={{
              width: 20, // Consistent width for the file/folder icon
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 0.5, // Margin after the icon
              flexShrink: 0,
            }}
          >
            {fileEntry.type === 'folder' ? (
              isExpanded ? (
                <FolderOpenIcon
                  fontSize="small"
                  sx={{ color: isSelected ? 'inherit' : theme.palette.text.secondary }}
                />
              ) : (
                <FolderIcon
                  fontSize="small"
                  sx={{ color: isSelected ? 'inherit' : theme.palette.text.secondary }}
                />
              )
            ) : (
              getFileIconComponent(fileEntry.name, textColor)
            )}
          </Box>

          {/* File/Folder Name */}
          <Typography
            variant="body2"
            sx={{
              ml: 0.5, // Margin after the icon
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexGrow: 1,
              color: textColor, // Ensure text color is consistent with selection
            }}
          >
            {fileEntry.name}
          </Typography>
        </ListItemButton>
      </Box>
      {fileEntry.type === 'folder' && isExpanded && (
        <Box sx={{ pl: 0 }}>
          {' '}
          {/* Children handle their own paddingLeft */}
          {isLoadingChildren ? (
            <Box
              sx={{
                ml: `${levelPadding + 24 + 16}px`, // Indent loading text beyond parent's padding + icon + spacer
                py: 0.5,
                display: 'flex',
                alignItems: 'center',
                color: theme.palette.text.secondary,
              }}
            >
              <CircularProgress size={16} sx={{ mr: 1 }} />
              <Typography variant="body2">Loading...</Typography>
            </Box>
          ) : fileEntry.children && fileEntry.children.length > 0 ? (
            fileEntry.children.map((child) => (
              <FileTreeItem
                key={child.filePath}
                fileEntry={child}
                projectRoot={projectRoot}
                onFileClick={onFileClick}
              />
            ))
          ) : (
            <Typography
              variant="body2"
              sx={{
                ml: `${levelPadding + 24 + 16}px`, // Indent empty text beyond parent's padding + icon + spacer
                py: 0.5,
                color: theme.palette.text.secondary,
                fontStyle: 'italic',
              }}
            >
              (empty)
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default FileTreeItem;
