import { nanoid } from 'nanoid';
import { addLog } from '@/stores/logStore';

export const createUniquetId = () => {
  const requestId = nanoid();
  addLog('LLM', `Created request with ID: ${requestId}`, 'debug');
  return requestId;
};
