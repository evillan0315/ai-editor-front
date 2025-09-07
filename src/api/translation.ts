import { generateCode, LlmGeneratePayload } from './llm';
import { RequestType } from '@/types';

interface TranslateOptions {
  content?: string | null; // Text content to translate
  fileData?: string | null; // Base64 encoded file data
  fileName?: string | null; // Name of the uploaded file
  fileMimeType?: string | null; // Mime type of the uploaded file
  targetLanguage: string;
}

/**
 * Translates content (text or file) using the LLM's general generation capability.
 * The prompt is crafted to instruct the LLM on the translation task.
 */
export const translateContent = async (
  options: TranslateOptions,
): Promise<string> => {
  const { content, fileData, fileName, fileMimeType, targetLanguage } = options;

  if (!content && !fileData) {
    throw new Error(
      'Either text content or file data must be provided for translation.',
    );
  }

  let userPrompt = '';
  let requestType: RequestType = RequestType.LLM_GENERATION;

  if (fileData && fileName) {
    // If a file is uploaded, set the request type to TEXT_WITH_FILE
    requestType = RequestType.TEXT_WITH_FILE;
    userPrompt = `Translate the following file content to ${targetLanguage}. Preserve formatting as much as possible, especially for structured data like JSON or code. The file name is '${fileName}'.`;
    if (content) {
      userPrompt += `\nAdditional text context: ${content}`;
    }
  } else if (content) {
    // If only text content, use LLM_GENERATION (default text input)
    requestType = RequestType.LLM_GENERATION;
    userPrompt = `Translate the following text to ${targetLanguage}:\n\n${content}`;
  } else {
    throw new Error(
      'Invalid translation request: No content or file data provided.',
    );
  }

  const payload: LlmGeneratePayload = {
    userPrompt: userPrompt,
    projectRoot: '.', // Not strictly needed for translation but required by payload, use current working dir or similar.
    projectStructure: '', // Not relevant for this task
    relevantFiles: [], // Not relevant for this task
    additionalInstructions: `You are an expert translator. Provide only the translated content. Do not include any conversational filler, explanations, or JSON wrappers unless the original content was already in JSON format.`,
    expectedOutputFormat: `The translated text in ${targetLanguage}. If the input was a file, maintain its structure.`,
    scanPaths: [], // No project file scanning needed for this task
    requestType: requestType,
    ...(fileData && { fileData: fileData }),
    ...(fileMimeType && { fileMimeType: fileMimeType }),
  };

  try {
    const response = await generateCode(payload);
    // The LLM's response.summary or other fields might contain the translation.
    // Assuming the LLM is instructed to return the translation directly in the summary or thoughtProcess for simpler cases.
    // A more robust implementation might require a specific JSON output schema for translation. For now, we'll take the 'summary'.
    // Or, if the LLM is expected to return a single change with the translated content, we could parse that.
    // For this generalized LLM endpoint, the 'summary' or 'thoughtProcess' might contain the most direct answer.
    // Let's assume the LLM provides the translated text directly in the 'summary' field as per system prompt guidance.
    // Alternatively, if the LLM creates a 'change' of type 'add' for a new file with translated content, that could be parsed.

    // For simplicity, let's assume the LLM puts the translated content in the summary.
    // If a more complex structure is needed, the `expectedOutputFormat` in the payload can be refined.
    return (
      response.summary ||
      response.thoughtProcess ||
      response.changes[0]?.newContent ||
      'No translation provided by AI.'
    );
  } catch (error) {
    console.error('Error during translation:', error);
    throw error;
  }
};
