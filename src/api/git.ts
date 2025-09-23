import axios from 'axios';

export const getGitStatus = async () => {
  try {
    const response = await axios.get('/api/git/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching git status:', error);
    throw error;
  }
};

export const gitCommit = async (message: string) => {
    try {
        const response = await axios.post('/api/git/commit', { message });
        return response.data;
    } catch (error) {
        console.error('Error creating commit', error);
        throw error;
    }
}

export const gitCreateBranch = async (branchName: string) => {
    try {
        const response = await axios.post('/api/git/branch', { branchName });
        return response.data;
    } catch (error) {
        console.error('Error creating branch', error);
        throw error;
    }
}