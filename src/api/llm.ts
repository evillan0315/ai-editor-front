import { getToken } from '@/stores/authStore';
import {
  ModelResponse,
  FileChange,
  RequestType,
  LlmOutputFormat,
  LlmGeneratePayload,
  TerminalCommandResponse,
} from '@/types'; // Import new LLM types and FileChange, RequestType, LlmOutputFormat, LlmGeneratePayload

const API_BASE_URL = `/api`; // Changed to relative path for Vite proxy consistency

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
export function extractCodeFromMarkdown(text: string): string {
  // Match a fenced code block: ```lang\n ... \n```
  const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)\n```/;
  const match = text.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  return text.trim();
}

export const convertYamlToJson = async (data: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/utils/json-yaml/to-json?save=false`,
      {
        method: 'POST',
        body: JSON.stringify({ yaml: data }),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Error converting YAML to JSON:', error);
    throw error;
  }
};

export const generateCode = async (
  data: LlmGeneratePayload,
): Promise<ModelResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/llm/generate-llm`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // get raw string response
    const rawText = await response.text();

    // try extracting fenced code block
    const text = extractCodeFromMarkdown(rawText);

    if (data.output === 'yaml') {
      const json = await convertYamlToJson(text);
      return json.json;
    }

    // otherwise treat as JSON response
    return JSON.parse(text) as ModelResponse;
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
};

/**
 * Applies selected proposed changes to the file system.
 * @param changes An array of FileChange objects to apply.
 * @param projectRoot The root directory of the project.
 * @returns A promise indicating success or failure of the diff application.
 */
export const applyProposedChanges = async (
  changes: FileChange[],
  projectRoot: string,
): Promise<{ success: boolean; messages: string[] }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/apply-changes`, {
      method: 'POST',
      body: JSON.stringify({ changes, projectRoot }),
    });
    return handleResponse<{ success: boolean; messages: string[] }>(response);
  } catch (error) {
    console.error('Error applying changes:', error);
    throw error;
  }
};

/**
 * Fetches the git diff for a specific file.
 * @param filePath The path to the file for which to get the diff, relative to projectRoot.
 * @param projectRoot The root directory of the project (git repository).
 * @returns A promise that resolves to the git diff string.
 */
export const getGitDiff = async (
  filePath: string,
  projectRoot: string,
): Promise<string> => {
  try {
    // filePath should already be relative to projectRoot from the frontend's getRelativePath call.
    // Do NOT prepend projectRoot here, as it would create an incorrect absolute path for the backend.
    const response = await fetchWithAuth(`${API_BASE_URL}/file/git-diff`, {
      method: 'POST',
      body: JSON.stringify({
        filePath: `${projectRoot}/${filePath}`,
        projectRoot,
      }),
    });
    const data = await handleResponse<{ diff: string }>(response);

    return data.diff;
  } catch (error) {
    console.error(`Error fetching git diff for ${filePath}:`, error);
    throw error;
  }
};

export type { LlmGeneratePayload }; // Export LlmGeneratePayload for use in other files
