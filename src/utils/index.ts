import * as path from 'path-browserify';
import { LanguageSupport } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { diffLanguage } from './diffLanguage'; // New import for custom diff highlighting
import { createCodeMirrorTheme } from './codemirrorTheme'; // Import new theme creator

/**
 * Debounces a function, returning a new function that will only be called after
 * a specified delay from its last invocation. It also provides a `cancel` method
 * to immediately cancel any pending debounced calls.
 * @param func The function to debounce.
 * @param delay The delay in milliseconds.
 * @returns A debounced function with a `cancel` method.
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number,
) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };

  // Add a cancel method to the debounced function
  (debounced as T & { cancel: () => void }).cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced as T & { cancel: () => void };
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

/**
 * Returns a human-readable language name based on the file path's extension.
 * @param filePath The path of the file.
 * @returns A string representing the language name (e.g., "TypeScript", "JavaScript", "JSON", "Markdown", "HTML", "CSS", "Plain Text").
 */
export function getLanguageNameFromPath(filePath: string): string {
  if (!filePath) {
    return 'Plain Text';
  }

  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath).toLowerCase();

  switch (ext) {
    case '.js':
    case '.jsx':
      return 'JavaScript';
    case '.ts':
    case '.tsx':
      return 'TypeScript';
    case '.json':
      return 'JSON';
    case '.md':
    case '.markdown':
      return 'Markdown';
    case '.html':
    case '.htm':
      return 'HTML';
    case '.css':
    case '.scss':
    case '.less':
      return 'CSS';
    case '.yml':
    case '.yaml':
      return 'YAML';
    case '.xml':
      return 'XML';
    case '.py':
      return 'Python';
    case '.java':
      return 'Java';
    case '.c':
    case '.cpp':
    case '.h':
      return 'C/C++';
    case '.go':
      return 'Go';
    case '.rs':
      return 'Rust';
    case '.php':
      return 'PHP';
    case '.rb':
      return 'Ruby';
    case '.sh':
    case '.bash':
      return 'Shell Script';
    case '.sql':
      return 'SQL';
    case '.vue':
      return 'Vue';
    case '.svelte':
      return 'Svelte';
    case '.toml':
      return 'TOML';
    case '.ini':
      return 'INI';
    case '.log':
      return 'Log';
    // Add more common extensions here

    default:
      // Handle specific filenames without extensions
      if (fileName === 'dockerfile') return 'Dockerfile';
      if (fileName === 'makefile') return 'Makefile';
      if (fileName === 'licence' || fileName === 'license') return 'License';
      if (fileName === 'readme' || fileName.startsWith('readme.'))
        return 'Markdown';
      if (fileName === '.env' || fileName.startsWith('.env.'))
        return 'Environment Variables';
      if (fileName === 'package.json') return 'JSON (Package)';
      if (fileName === 'tsconfig.json') return 'JSON (TS Config)';
      if (fileName === 'vite.config.ts') return 'TypeScript (Vite Config)';
      if (fileName === 'eslint.config.ts') return 'TypeScript (ESLint Config)';
      if (
        fileName === 'yarn.lock' ||
        fileName === 'pnpm-lock.yaml' ||
        fileName === 'package-lock.json'
      )
        return 'Lockfile';

      return 'Plain Text'; // Default for unknown extensions
  }
}

export * from './fileUtils';
export * from './persistentAtom';
export { createCodeMirrorTheme } from './codemirrorTheme';
