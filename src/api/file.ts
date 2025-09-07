import { getToken } from '@/stores/authStore';
import { ApiFileScanResult, FileTreeNode, FileContentResponse } from '@/types'; // Import new FileTreeNode

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
 * Fetches project files using the /api/file/scan endpoint, primarily for AI context building.
 * Returns a flat list of scanned files.
 */
export const fetchScannedFilesForAI = async (
  projectRoot: string,
  scanPaths: string[],
): Promise<ApiFileScanResult[]> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/scan`, {
      method: 'POST',
      body: JSON.stringify({
        scanPaths: scanPaths,
        projectRoot: projectRoot,
        verbose: false,
      }),
    });
    return handleResponse<ApiFileScanResult[]>(response);
  } catch (error) {
    console.error('Error fetching project files for AI scan:', error);
    throw error;
  }
};

/**
 * Fetches a list of files and folders in a given directory, non-recursively.
 * Returns an array of FileTreeNode for the direct children.
 */
export const fetchDirectoryContents = async (
  directoryPath: string,
): Promise<FileTreeNode[]> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/file/list?directory=${encodeURIComponent(directoryPath)}&recursive=false`,
      { method: 'GET' },
    );
    return handleResponse<FileTreeNode[]>(response);
  } catch (error) {
    console.error(
      `Error fetching directory contents for ${directoryPath}:`,
      error,
    );
    throw error;
  }
};

export const readFileContent = async (filePath: string): Promise<string> => {
  try {
    // Ensure the filePath is sent in the body for the POST request
    const response = await fetchWithAuth(`${API_BASE_URL}/file/open`, {
      method: 'POST',
      body: JSON.stringify({ filePath: filePath }),
    });
    const data = await handleResponse<{ filePath: string; content: string }>(
      response,
    );

    return data.content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
};

/**
 * Writes (updates) the content of a file at the specified path.
 * @param filePath The absolute or relative path to the file.
 * @param content The new content to write to the file.
 * @returns A promise that resolves to indicate success.
 */
export const writeFileContent = async (
  filePath: string,
  content: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/write`, {
      method: 'POST',
      body: JSON.stringify({ filePath, content }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
};

// Add more file-related API calls as needed, e.g., create, update, delete, apply diffs
