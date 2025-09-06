import { getToken } from '@/stores/authStore';
import { FileEntry, FileContentResponse, BackendFileTreeNode, FlatApiFileEntry } from '@/types'; // Update import
import { flattenFileTreeResponse } from '@/utils/fileUtils'; // Import helper

const API_BASE_URL = `/api`;

interface ApiError extends Error {
  statusCode?: number;
  message: string;
}

const handleResponse = async <T,>(response: Response): Promise<T> => {
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
 * Fetches the project file structure from the backend using the /api/file/list endpoint.
 * Retrieves a recursive listing and then flattens it into a frontend-compatible FileEntry list.
 * @param projectRoot The root directory of the project.
 * @param _scanPaths The scanPaths are currently not used for file listing, but passed for API compatibility if needed.
 * @returns A promise that resolves to a flat list of FileEntry objects (from types/fileTree.ts).
 */
export const fetchProjectFiles = async (
  projectRoot: string,
  _scanPaths: string[], // Scan paths are primarily for AI context, not direct file listing for tree
): Promise<FileEntry[]> => {
  // Updated return type to FileEntry from fileTree.ts
  try {
    const url = new URL(`${API_BASE_URL}/file/list`, window.location.origin);
    url.searchParams.append('directory', projectRoot);
    url.searchParams.append('recursive', 'true'); // Always request recursive list for full tree

    const response = await fetchWithAuth(url.toString(), {
      method: 'GET', // Change to GET
    });

    // The API returns BackendFileTreeNode[], which is a recursive structure.
    const recursiveTree = await handleResponse<BackendFileTreeNode[]>(response);

    // Flatten the recursive tree into a flat list of FlatApiFileEntry (from index.ts)
    const flatApiEntries: FlatApiFileEntry[] = flattenFileTreeResponse(recursiveTree);

    // Map FlatApiFileEntry[] to FileEntry[] (from fileTree.ts) for frontend consumption
    const frontendFileEntries: FileEntry[] = flatApiEntries.map((apiEntry) => ({
      name: apiEntry.name,
      filePath: apiEntry.path, // Map backend 'path' to frontend 'filePath'
      isDirectory: apiEntry.isDirectory,
      type: apiEntry.type,
      lang: apiEntry.lang,
      mimeType: apiEntry.mimeType,
      size: apiEntry.size,
      createdAt: apiEntry.createdAt,
      updatedAt: apiEntry.updatedAt,
      // UI specific properties like children, collapsed, depth, relativePath
      // will be added by buildFileTree or other frontend logic.
      // For a flat list, we don't need them initialized here.
    }));

    return frontendFileEntries; // Return the frontend-compatible FileEntry array
  } catch (error) {
    console.error('Error fetching project files:', error);
    throw error;
  }
};

export const readFileContent = async (filePath: string): Promise<string> => {
  try {
    // Ensure the filePath is sent in the body for the POST request
    const response = await fetchWithAuth(`${API_BASE_URL}/file/read`, {
      method: 'POST',
      body: JSON.stringify({ filePath: filePath }),
    });
    const data = await handleResponse<FileContentResponse>(response);

    return data.content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
};
