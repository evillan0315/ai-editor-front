import { atom } from 'nanostores';
import { addLog } from './logStore';

/** Allowed snackbar severities for clarity and type-safety. */
export type SnackbarSeverity = 'success' | 'info' | 'warning' | 'error';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}

/**
 * Global snackbar state atom.
 */
export const snackbarState = atom<SnackbarState>({
  open: false,
  message: '',
  severity: 'info',
});

/**
 * Partially update the snackbar state.
 */
export function setSnackbarState(newState: Partial<SnackbarState>): void {
  snackbarState.set({
    ...snackbarState.get(),
    ...newState,
  });
}

/**
 * Log snackbar events based on severity.
 * This function will only attempt to call `addLog` if it exists in scope.
 */
function logSnackbarEvent(message: string, severity: SnackbarSeverity): void {
  switch (severity) {
    case 'error':
      addLog('UI Notification', `Snackbar Error: ${message}`, 'error', message);
      break;
    case 'info':
      addLog('UI Notification', `Snackbar Info: ${message}`, 'info', message);
      break;
    case 'success':
      addLog(
        'UI Notification',
        `Snackbar Success: ${message}`,
        'success',
        message,
      );
      break;
    case 'warning':
      addLog(
        'UI Notification',
        `Snackbar Warning: ${message}`,
        'warning',
        message,
      );
      break;
  }
}

/**
 * Show a global snackbar with the given message and severity.
 */
export function showGlobalSnackbar(
  message: string,
  severity: SnackbarSeverity,
): void {
  snackbarState.set({
    open: true,
    message,
    severity,
  });

  // SnackBar messages are transient; log only if needed.
  logSnackbarEvent(message, severity);
}

/**
 * Hide the global snackbar and reset its message and severity.
 */
export function hideGlobalSnackbar(): void {
  snackbarState.set({
    open: false,
    message: '',
    severity: 'info',
  });
}
