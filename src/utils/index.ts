// Placeholder for general utility functions
import * as path from 'path-browserify';
import { LanguageSupport } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { diffLanguage } from './diffLanguage'; // New import for custom diff highlighting

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number,
) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

export function getCodeMirrorLanguage(
  filePath: string,
  isDiff: boolean = false,
): LanguageSupport[] {
  if (isDiff) {
    return [diffLanguage()]; // Return custom diff language extension if explicitly marked as diff
  }

  const ext = path.extname(filePath).toLowerCase();
  // Handle files without extensions but with known names (e.g., Dockerfile)
  const fileName = path.basename(filePath).toLowerCase();

  switch (ext) {
    case '.js':
    case '.jsx':
      return [javascript({ jsx: true })];
    case '.ts':
    case '.tsx':
      return [javascript({ typescript: true, jsx: true })]; // Use javascript with typescript option
    case '.json':
      return [json()];
    case '.md':
    case '.markdown':
      return [markdown()];
    case '.html':
    case '.htm':
      return [html()];
    case '.css':
    case '.scss':
    case '.less':
      return [css()];
    // Add more extensions as needed for CodeMirror language support
    default:
      // Handle specific filenames that might not have an extension but need language support
      if (fileName === 'dockerfile') {
        // return [dockerfileLanguage()]; // If you have a dockerfile language extension
        return [];
      } else if (fileName === 'makefile') {
        // return [makeLanguage()]; // If you have a makefile language extension
        return [];
      }
      return []; // No specific language support, defaults to plain text
  }
}

export { buildFileTree, joinPaths, getRelativePath } from './fileUtils';
