import { getToken } from '@/stores/authStore';
import { BackendFileTreeNode, FlatApiFileEntry } from '@/types'; // Update import
import { FileEntry } from '@/types/fileTree'; // Use FileEntry from fileTree.ts for frontend consumption

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
 * Fetches project file structure from the backend using the /api/file/list endpoint.
 * When `recursive=false`, it retrieves only the immediate children of the specified directory.
 * @param directory The directory for which to fetch immediate children. (was projectRoot)
 * @param _scanPaths The scanPaths are currently not used for file listing, but passed for API compatibility if needed.
 * @returns A promise that resolves to a flat list of FileEntry objects for the immediate children.
 */
export const fetchProjectFiles = async (
  directory: string,
  _scanPaths: string[], // Scan paths are primarily for AI context, not direct file listing for tree
): Promise<FileEntry[]> => {
  try {
    const url = new URL(`${API_BASE_URL}/file/list`, window.location.origin);
    url.searchParams.append('directory', directory);
    url.searchParams.append('recursive', 'false'); // Set recursive to false for lazy loading

    const response = await fetchWithAuth(url.toString(), {
      method: 'GET',
    });

    // When recursive=false, the backend is expected to return a flat array of file entries.
    // We'll treat this as FlatApiFileEntry[] for consistency and then map to frontend FileEntry[].
    const flatApiEntries = await handleResponse<FlatApiFileEntry[]>(response);

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
      children: [], // Initialize children, they will be fetched on demand if folder
      isOpen: false,
      isLoadingChildren: false,
    }));

    return frontendFileEntries; // Return the frontend-compatible FileEntry array
  } catch (error) {
    console.error(`Error fetching files for directory ${directory}:`, error);
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
    const data = await handleResponse<{ content: string }>(response);

    return data.content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
};
