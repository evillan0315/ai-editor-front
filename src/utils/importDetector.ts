import { ViewPlugin, EditorView, ViewUpdate } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { IMPORT_SPECIFIER_REGEX, PATH_ALIASES_MAP } from '@/constants';


function simulateAliasResolution(specifier: string): string {
  for (const alias in PATH_ALIASES_MAP) {
    if (specifier.startsWith(alias)) {
      return PATH_ALIASES_MAP[alias] + specifier.substring(alias.length);
    }
  }
  return specifier; 
}


function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}


const detectAndLogImports = debounce(
  (doc: string, filePath: string | undefined) => {
    const detectedImports: {
      specifier: string;
      simulatedResolvedPath?: string;
      type: 'local' | 'external';
    }[] = [];
    let match;

    
    IMPORT_SPECIFIER_REGEX.lastIndex = 0;

    while ((match = IMPORT_SPECIFIER_REGEX.exec(doc)) !== null) {
      const specifier = match[1];
      if (specifier) {
        
        const isLocalCandidate =
          specifier.startsWith('.') ||
          Object.keys(PATH_ALIASES_MAP).some((alias) =>
            specifier.startsWith(alias),
          );

        if (isLocalCandidate) {
          detectedImports.push({
            specifier,
            simulatedResolvedPath: simulateAliasResolution(specifier),
            type: 'local',
          });
        } else {
          detectedImports.push({
            specifier,
            type: 'external',
          });
        }
      }
    }

    console.groupCollapsed(
      `CodeMirror Import Analysis: ${filePath || 'Current File'} (${detectedImports.length} imports)`,
    );
    if (detectedImports.length === 0) {
      console.log('No import/export statements found.');
    } else {
      detectedImports.forEach((imp) => {
        if (imp.type === 'local') {
          console.log(
            `Local Import: "${imp.specifier}" -> Simulated: "${imp.simulatedResolvedPath}"`,
          );
        } else {
          console.log(`External Import: "${imp.specifier}"`);
        }
      });
    }
    console.groupEnd();
  },
  750,
); 


export const importDetectionPlugin = (activeFilePath: string | undefined) =>
  ViewPlugin.define((view) => {
    
    detectAndLogImports(view.state.doc.toString(), activeFilePath);

    return {
      update(update: ViewUpdate) {
        
        if (update.docChanged) {
          detectAndLogImports(update.state.doc.toString(), activeFilePath);
        }
      },
      destroy() {
        
      },
    };
  });
