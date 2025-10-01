import { API_BASE_URL, ResponseError, handleResponse, fetchWithAuth } from '@/api';

export const getGitStatus = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/status`, {
      method: 'GET',
    });
    return handleResponse<any>(response);
  } catch (error: unknown) {
    console.error('Error fetching git status:', error);
    throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
  }
};

export const gitCommit = async (message: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/commit`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return handleResponse<any>(response);
  } catch (error: unknown) {
    console.error('Error creating commit', error);
    throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
  }
};

export const gitCreateBranch = async (branchName: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/branch`, {
      method: 'POST',
      body: JSON.stringify({ branchName }),
    });
    return handleResponse<any>(response);
  } catch (error: unknown) {
    console.error('Error creating branch', error);
    throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
  }
};
