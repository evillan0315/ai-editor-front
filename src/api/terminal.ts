import { API_BASE_URL, ResponseError, handleResponse, fetchWithAuth } from '@/api';
import { TerminalCommandResponse, ProjectScriptsResponse } from '@/types';

/**
 * Executes a terminal command on the backend.
 * @param command The shell command string to execute.
 * @param cwd The current working directory for the command execution.
 * @returns A promise that resolves to the command's stdout, stderr, and exit code.
 */
export const runTerminalCommand = async (
  command: string,
  cwd: string,
): Promise<TerminalCommandResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/terminal/run`, {
      method: 'POST',
      body: JSON.stringify({ command, cwd }),
    });
    return handleResponse<TerminalCommandResponse>(response);
  } catch (error: unknown) {
    console.error(`Error running terminal command '${command}':`, error);
    throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
  }
};

/**
 * Fetches package.json scripts and detects the package manager from the project root.
 * This conceptually calls a backend endpoint that reads package.json and lock files.
 * @param projectRoot The root directory of the project.
 * @returns A promise that resolves to an object containing package scripts and the detected package manager.
 */
export const fetchProjectScripts = async (
  projectRoot: string,
): Promise<ProjectScriptsResponse> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/terminal/package-scripts`,
      {
        method: 'POST',
        body: JSON.stringify({ projectRoot }),
      },
    );
    return handleResponse<ProjectScriptsResponse>(response);
  } catch (error: unknown) {
    console.error(`Error fetching package scripts for ${projectRoot}:`, error);
    throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
  }
};
