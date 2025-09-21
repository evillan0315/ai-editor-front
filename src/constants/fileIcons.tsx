import React from 'react';
import JavascriptIcon from '@mui/icons-material/Javascript';
import CssIcon from '@mui/icons-material/Css';
import HtmlIcon from '@mui/icons-material/Html';
import JsonIcon from '@mui/icons-material/DataObject'; // DataObject is a good fit for JSON
import MarkdownIcon from '@mui/icons-material/Article'; // Article for documents
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description'; // Generic text file
import CodeIcon from '@mui/icons-material/Code'; // Generic code file
import TerminalIcon from '@mui/icons-material/Terminal'; // For shell scripts, .env, .gitignore
// For web-related files
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';

type IconComponent =
  | React.ElementType
  | React.FC<{ fontSize: 'small' | 'inherit'; sx?: object }>;

// Map of file extensions (or full filenames for dotfiles) to Material UI Icons or custom JSX.
// Keys should be lowercase.
const fileExtensionIcons: { [key: string]: IconComponent } = {
  // Code / Programming Languages
  '.js': JavascriptIcon,
  '.jsx': JavascriptIcon,
  '.ts': JavascriptIcon,
  '.tsx': JavascriptIcon,
  '.mjs': JavascriptIcon,
  '.cjs': JavascriptIcon,
  '.json': JsonIcon,
  '.css': CssIcon,
  '.scss': CssIcon,
  '.less': CssIcon,
  '.html': HtmlIcon,
  '.htm': HtmlIcon,
  '.xml': CodeIcon,
  '.py': CodeIcon, // No specific Python icon in MUI by default, use generic code
  '.java': CodeIcon, // Generic code
  '.go': CodeIcon, // Generic code
  '.rb': CodeIcon, // Generic code
  '.php': CodeIcon, // Generic code
  '.c': CodeIcon,
  '.cpp': CodeIcon,
  '.h': CodeIcon,
  '.sh': TerminalIcon,
  '.bash': TerminalIcon,
  '.zsh': TerminalIcon,
  '.ps1': TerminalIcon,
  '.md': MarkdownIcon,
  '.markdown': MarkdownIcon,
  '.yml': DescriptionIcon, // YAML
  '.yaml': DescriptionIcon, // YAML
  '.toml': DescriptionIcon,
  '.env': TerminalIcon,

  // Web / Config / Build
  '.lock': DescriptionIcon, // package-lock.json, yarn.lock, pnpm-lock.yaml
  'package.json': JsonIcon, // Specific file name
  'tsconfig.json': JsonIcon,
  'vite.config.ts': JavascriptIcon,
  'eslint.config.ts': JavascriptIcon,
  'tailwind.config.ts': JavascriptIcon,
  'next.config.js': JavascriptIcon,
  'webpack.config.js': JavascriptIcon,
  '.gitignore': TerminalIcon,
  'readme.md': MarkdownIcon,
  license: DescriptionIcon,

  // Media
  '.png': ImageIcon,
  '.jpg': ImageIcon,
  '.jpeg': ImageIcon,
  '.gif': ImageIcon,
  '.svg': ImageIcon,
  '.webp': ImageIcon,
  '.ico': ImageIcon,
  '.pdf': PictureAsPdfIcon,
  '.txt': DescriptionIcon,
};

/**
 * Returns a Material UI icon component or a custom JSX element based on file type and extension.
 * @param fileName The full name of the file (e.g., 'index.ts', 'package.json').
 * @param fileType 'file' or 'folder'.
 * @param isExpanded For folders, indicates if it's currently expanded.
 * @returns A React component for the icon.
 */
export const getFileTypeIcon = (
  fileName: string,
  fileType: 'file' | 'folder',
  isExpanded: boolean = false,
): React.ReactElement => {
  if (fileType === 'folder') {
    return isExpanded ? (
      <FolderOpenIcon fontSize="small" />
    ) : (
      <FolderIcon fontSize="small" />
    );
  }

  // Check for specific full filenames first (e.g., 'package.json')
  const exactMatchIcon = fileExtensionIcons[fileName.toLowerCase()];
  if (exactMatchIcon) {
    const Icon = exactMatchIcon as React.ElementType;
    return <Icon fontSize="small" />;
  }

  // Check for file extensions
  const ext = fileName.toLowerCase().includes('.')
    ? `.${fileName.toLowerCase().split('.').pop()}`
    : '';
  const extMatchIcon = fileExtensionIcons[ext];
  if (extMatchIcon) {
    const Icon = extMatchIcon as React.ElementType;
    return <Icon fontSize="small" />;
  }

  // Default to a generic file icon if no specific match
  return <DescriptionIcon fontSize="small" />;
};
