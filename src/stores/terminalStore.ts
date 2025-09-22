import { map } from 'nanostores';
import { socketService } from '@/services/socketService';
import { persistentAtom } from '@/utils/persistentAtom';
import { SystemInfo, PromptData } from '@/types/terminal';
import stripAnsi from 'strip-ansi';
import { projectRootDirectoryStore } from './fileTreeStore';
import { getToken } from './authStore';
export interface TerminalState {
  currentPath: string;
  systemInfo: string | null;
  isConnected: boolean;
  commandHistory: string[];
  historyIndex: number;
  output: string[]; // Stores terminal output
}
export const isTerminalVisible = persistentAtom<boolean>('showTerminal', false);
export const setShowTerminal = (show: boolean) => {
  isTerminalVisible.set(show);
};
// Initialize with default values
export const terminalStore = map<TerminalState>({
  currentPath: '~',
  systemInfo: null,
  isConnected: false,
  commandHistory: [],
  historyIndex: -1,
  output: [],
});

// Actions
export const setCurrentPath = (path: string) => {
  projectRootDirectoryStore.set(path);
};

export const setSystemInfo = (info: string) => {
  terminalStore.setKey('systemInfo', info);
};

export const setConnected = (isConnected: boolean) => {
  terminalStore.setKey('isConnected', isConnected);
};

export const addCommandToHistory = (command: string) => {
  const current = terminalStore.get();
  const commandHistory = [...current.commandHistory, command];
  terminalStore.set({
    ...current,
    commandHistory,
    historyIndex: commandHistory.length,
  });
};

export const browseHistory = (direction: 'up' | 'down') => {
  const current = terminalStore.get();
  let newIndex = current.historyIndex;

  if (direction === 'up') {
    newIndex = Math.max(0, current.historyIndex - 1);
  } else {
    newIndex = Math.min(
      current.commandHistory.length - 1,
      current.historyIndex + 1,
    );
  }

  terminalStore.setKey('historyIndex', newIndex);
};

export const resetHistoryIndex = () => {
  terminalStore.setKey('historyIndex', -1);
};

export const appendOutput = (text: string) => {
  const plainText = stripAnsi(text);
  const current = terminalStore.get();
  if (current.output[current.output.length - 1] === plainText) return; // skip duplicate
  terminalStore.set({
    ...current,
    output: [...current.output, plainText],
  });
};

// Clear output
export const clearOutput = () => {
  terminalStore.setKey('output', []);
};

// Socket connection management
export const connectTerminal = async () => {
  const token = getToken();
  if (!token) {
    throw 'No authentication token.';
  }

  // Retrieve project root directory from store
  const projectRoot = projectRootDirectoryStore.get();

  try {
    await socketService.connect(token, projectRoot);
    setConnected(true);
    clearOutput();

    // Listeners
    socketService.on('output', (data: string) => appendOutput(data));
    socketService.on('outputMessage', (data: string) => appendOutput(data));
    socketService.on('error', (data: string) => appendOutput(`Error: ${data}`));
    /*socketService.on('outputPath', (data: string) =>
      setCurrentPath(`\x1b[31m${data}\x1b[0m`)
    );*/
    socketService.on('outputInfo', (data: SystemInfo) => {
      const infoStr = Object.entries(data)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      setSystemInfo(`${infoStr}\n`);
    });
    socketService.on('prompt', (data: PromptData) => {
      setCurrentPath(data.cwd);
      //appendOutput(`\x1b[32m${data.cwd}\x1b[0m $ `);
    });

    appendOutput('Connected to terminal server.\n');
  } catch (error) {
    appendOutput(`Connection error: ${error}\n`);
    throw error;
  }
};

export const disconnectTerminal = () => {
  socketService.disconnect();
  setConnected(false);
  appendOutput('Disconnected from terminal server.\n');
};

export const executeCommand = (command: string) => {
  if (!command.trim()) return;

  addCommandToHistory(command);
  socketService.execCommand(command);
  //appendOutput(`$ ${command}\n`);
};

export const resizeTerminal = (cols: number, rows: number) => {
  if (terminalStore.get().isConnected) {
    socketService.resize(cols, rows);
  }
};
