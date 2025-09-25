import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from './fetch';


export const generateText = async (data: GenerateTextDto): Promise<string> => {
  return fetchWithAuth<string>('/gemini/file/generate-text', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const generateTextWithBase64Image = async (
  data: GenerateImageBase64Dto,
): Promise<string> => {
  return fetchWithAuth<string>('/gemini/file/generate-image-base64', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const generateTextWithFile = async (
  file: File,
  prompt: string,
  systemInstruction?: string,
  conversationId?: string,
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('prompt', prompt);
  if (systemInstruction) {
    formData.append('systemInstruction', systemInstruction);
  }
  if (conversationId) {
    formData.append('conversationId', conversationId);
  }

  return fetchWithAuth<string>('/gemini/file/generate-file', {
    method: 'POST',
    body: formData,
    headers: {},
  });
};

export const generateVideo = async (data: GenerateVideoDto): Promise<any> => {
  return fetchWithAuth<any>('/gemini/file/generate-video', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
