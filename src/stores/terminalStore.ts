import { map } from 'nanostores';
import { socketService } from '@/services/socketService';
import { persistentAtom } from '@/utils/persistentAtom';
import { SystemInfo, PromptData } from '@/types/terminal';
import stripAnsi from 'strip-ansi';
import { projectRootDirectoryStore } from './fileTreeStore';
import { getToken } from './authStore';

// Type definitions for handlers provided by the Xterm.js component
type TerminalWriteFunction = (data: string) => void;
type TerminalClearFunction = () => void;
type TerminalFitFunction = () => void;

// Global references for xterm.js instance interactions
// These will be set by the XTerminal component when it mounts/unmounts
let terminalWriteHandler: TerminalWriteFunction | null = null;
let terminalClearHandler: TerminalClearFunction | null = null;
let terminalFitHandler: TerminalFitFunction | null = null;

export interface TerminalState {
  currentPath: string;
  systemInfo: string | null;
  isConnected: boolean;
  commandHistory: string[];
  historyIndex: number;
  output: string[]; // Still keep for compatibility with TerminalDialog.tsx
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
  output: [], // Initialize output array
});

// Actions to allow XTerminal component to register/unregister its xterm.js instance handlers
export const registerTerminalWriteHandler = (handler: TerminalWriteFunction | null) => {
  terminalWriteHandler = handler;
};

export const registerTerminalClearHandler = (handler: TerminalClearFunction | null) => {
  terminalClearHandler = handler;
};

export const registerTerminalFitHandler = (handler: TerminalFitFunction | null) => {
  terminalFitHandler = handler;
};

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
    historyIndex: commandHistory.length, // Set index to end for new command
  });
};

export const browseHistory = (direction: 'up' | 'down') => {
  const current = terminalStore.get();
  let newIndex = current.historyIndex;

  if (direction === 'up') {
    newIndex = Math.max(0, current.historyIndex - 1);
  } else {
    newIndex = Math.min(
      current.commandHistory.length, // Allow index to be `length` to indicate "new command"
      current.historyIndex + 1,
    );
  }

  terminalStore.setKey('historyIndex', newIndex);
};

export const resetHistoryIndex = () => {
  terminalStore.setKey('historyIndex', -1);
};

/**
 * Appends output to both the internal store buffer (stripped ANSI) for compatibility
 * and directly to the xterm.js instance (raw ANSI) if a handler is registered.
 */
export const appendOutput = (text: string) => {
  const current = terminalStore.get();
  const plainText = stripAnsi(text); // Always store stripped text in the nanostore's output array

  // Avoid duplicate lines in the internal buffer if it's identical to the last one
  if (current.output.length === 0 || current.output[current.output.length - 1] !== plainText) {
    terminalStore.set({
      ...current,
      output: [...current.output, plainText],
    });
  }

  // If an xterm instance is registered, write the full (potentially ANSI) text to it
  if (terminalWriteHandler) {
    terminalWriteHandler(text);
  }
};

/**
 * Clears output from both the internal store buffer and the xterm.js instance if a handler is registered.
 */
export const clearOutput = () => {
  if (terminalClearHandler) {
    terminalClearHandler(); // Clear the xterm instance
  }
  terminalStore.setKey('output', []); // Clear the internal buffer
};

// Socket connection management
export const connectTerminal = async () => {
  const token = getToken();
  if (!token) {
    throw 'No authentication token.';
  }

  const projectRoot = projectRootDirectoryStore.get();

  try {
    await socketService.connect(token, projectRoot);
    setConnected(true);
    clearOutput(); // Clear existing output on new connection

    // Register socket listeners once
    socketService.on('output', (data: string) => appendOutput(data));
    socketService.on('outputMessage', (data: string) => appendOutput(data));
    socketService.on('error', (data: string) => appendOutput(`Error: ${data}`));
    socketService.on('outputInfo', (data: SystemInfo) => {
      const infoStr = Object.entries(data)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      setSystemInfo(`${infoStr}\n`);
      appendOutput(`${infoStr}\n`); // Also append to terminal
    });
    socketService.on('prompt', (data: PromptData) => {
      setCurrentPath(data.cwd);
      // Append the prompt to the terminal via write handler
      appendOutput(`\x1b[32m${data.cwd}\x1b[0m $ `); // ANSI colored prompt
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
  // No need to append command here, as the backend echoes it back to the terminal.
  // If the backend does not echo, uncommenting appendOutput(`$ ${command}\n`); would be necessary.
};

/**
 * Sends terminal dimensions to the backend to adjust PTY size.
 * The frontend xterm.js instance's visual resizing is handled by FitAddon
 * in the XTerminal component, often triggered by its own onResize event or
 * parent container changes.
 */
export const resizeTerminal = (cols: number, rows: number) => {
  if (terminalStore.get().isConnected) {
    socketService.resize(cols, rows);
  }
};
