import { EditorView } from '@codemirror/view';
import { type Theme } from '@mui/material';

/**
 * Creates a CodeMirror theme extension that applies Material UI theme colors
 * for the background, text, and other core editor elements.
 * This theme prioritizes matching the parent component's background.
 *
 * @param muiTheme The Material UI theme object.
 * @param isDiffView Optional. If true, applies specific styles for diff views.
 * @returns A CodeMirror `EditorView.theme` extension.
 */
export const createCodeMirrorTheme = (
  muiTheme: Theme,
  isDiffView: boolean = false,
) => {
  const backgroundColor = muiTheme.palette.background.paper;
  const textColor = muiTheme.palette.text.primary;
  const gutterBackground = muiTheme.palette.background.paper;
  const gutterColor = muiTheme.palette.text.secondary;
  const lineNumberColor = muiTheme.palette.text.disabled;
  const cursorColor = muiTheme.palette.primary.main;
  const selectionBackground = muiTheme.palette.action.selected;
  const activeLineBackground = muiTheme.palette.action.hover;

  const diffInserted = muiTheme.palette.success.light;
  const diffDeleted = muiTheme.palette.error.light;

  return EditorView.theme(
    {
      // Core editor styles
      '&': {
        backgroundColor: backgroundColor,
        color: textColor,
        // Ensure font family is consistent
        fontFamily:
          (muiTheme.typography.fontFamily as string | undefined) || 'monospace',
      },
      '.cm-scroller': {
        backgroundColor: backgroundColor,
      },
      '.cm-editor': {
        border: 'none',
        outline: 'none',
      },
      // Selection
      '.cm-selectionBackground, .cm-selectionBackground::selection': {
        backgroundColor: selectionBackground + ' !important',
      },
      '.cm-focused .cm-selectionBackground, .cm-focused .cm-selectionBackground::selection':
        {
          backgroundColor: selectionBackground + ' !important',
        },

      // Active Line
      '.cm-activeLine': {
        backgroundColor: activeLineBackground,
      },

      // Gutters
      '.cm-gutters': {
        backgroundColor: gutterBackground,
        color: gutterColor,
        borderRight: `1px solid ${muiTheme.palette.divider}`,
      },
      '.cm-lineNumbers .cm-gutterElement': {
        color: lineNumberColor,
        padding: '0 8px',
      },
      '.cm-activeLineGutter': {
        backgroundColor: activeLineBackground,
        color: muiTheme.palette.text.primary,
      },

      // Cursor
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: cursorColor,
      },

      // Diff-specific styles if enabled
      ...(isDiffView && {
        '.cm-inserted': {
          backgroundColor: diffInserted + '40',
          color: textColor,
        },
        '.cm-deleted': {
          backgroundColor: diffDeleted + '40',
          color: textColor,
        },
        '.cm-inserted.cm-activeLine': {
          backgroundColor: diffInserted + '60',
        },
        '.cm-deleted.cm-activeLine': {
          backgroundColor: diffDeleted + '60',
        },
        '.cm-meta': { color: muiTheme.palette.info.main }, // Hunk headers
        '.cm-keyword': { color: muiTheme.palette.warning.main }, // Git diff headers like `diff --git`
      }),
    },
    { dark: muiTheme.palette.mode === 'dark' }, // Essential for CodeMirror's dark mode internal state
  );
};
