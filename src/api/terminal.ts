import { getToken } from '@/stores/authStore';
import {
  TerminalCommandResponse,
  PackageScript,
  PackageManager,
  ProjectScriptsResponse,
} from '@/types';

const API_BASE_URL = `/api`;

interface ApiError extends Error {
  statusCode?: number;
  message: string;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};

const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  return fetch(url, { ...options, headers });
};

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
  } catch (error) {
    console.error(`Error running terminal command '${command}':`, error);
    throw error;
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
  } catch (error) {
    console.error(`Error fetching package scripts for ${projectRoot}:`, error);
    throw error;
  }
};
