import React from 'react';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { Box, IconButton, Tooltip } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useStore } from '@nanostores/react';
import { llmStore, setLastLlmResponse, setLlmError } from '@/stores/llmStore';
import { extractCodeFromMarkdown } from '@/api/llm';
import { ModelResponse } from '@/types/llm';
import { showGlobalSnackbar } from '@/stores/snackbarStore';


interface CodeRepairProps {
  value: string;
  onChange: (value: string) => void;
  filePath: string;
  height?: string;
  width?: string;
  /** Optional: Callback to open the import drawer with the current content of CodeRepair */
  onOpenImportDrawerWithContent?: (content: string) => void;
}

export const CodeRepair: React.FC<CodeRepairProps> = ({
  value,
  onChange,
  filePath,
  height,
  width,
  onOpenImportDrawerWithContent,
}) => {
  // Get current request and output format from store for fallback in case of parsing error
  const { requestType, llmOutputFormat } = useStore(llmStore);

  const handleExport = () => {
    let parsedResponse: ModelResponse | null = null;
    let successMessage: string = '';

    try {
      const extractedCode = extractCodeFromMarkdown(value);
      const parsedJson = JSON.parse(extractedCode);
      parsedResponse = parsedJson as ModelResponse; // Type assertion

      // Ensure mandatory fields for ModelResponse are present, or provide sensible defaults
      if (!parsedResponse.summary) parsedResponse.summary = 'Imported from Code Repair';
      if (!parsedResponse.changes) parsedResponse.changes = [];
      if (!parsedResponse.gitInstructions) parsedResponse.gitInstructions = [];
      // Use current store values as fallback if not present in parsed JSON
      if (!parsedResponse.requestType) parsedResponse.requestType = requestType;
      if (!parsedResponse.outputFormat) parsedResponse.outputFormat = llmOutputFormat;
      
      parsedResponse.rawResponse = value; // Always store the raw edited content
      parsedResponse.error = null; // Clear any existing error if successfully parsed
      
      setLastLlmResponse(parsedResponse);
      successMessage = 'Edited content successfully parsed and loaded as AI response.';
      showGlobalSnackbar(successMessage, 'success');
    } catch (err) {
      const errorMsg = `Failed to parse edited content as valid JSON: ${err instanceof Error ? err.message : String(err)}`;
      
      // Create a ModelResponse indicating an error, using fallback values for mandatory fields
      parsedResponse = {
        summary: 'Error during parsing in Code Repair',
        changes: [],
        rawResponse: value,
        error: errorMsg,
        gitInstructions: [],
        documentation: '',
        requestType: requestType, // Use current requestType from store
        outputFormat: llmOutputFormat, // Use current outputFormat from store
      };
      setLastLlmResponse(parsedResponse); // Set an error-containing response
      setLlmError(errorMsg); // Also set the general LLM error state
      showGlobalSnackbar(errorMsg, 'error');
    }

    // Always call the original callback to update the ImportJson drawer if available
    if (onOpenImportDrawerWithContent) {
      onOpenImportDrawerWithContent(value);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        position: 'relative',
      }}
    >
      {onOpenImportDrawerWithContent && (
        <Tooltip title="Parse current content and load as AI response (also populate Import Data drawer)">
          <IconButton
            onClick={handleExport}
            disabled={!value}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
            }}
          >
            <UploadFileIcon />
          </IconButton>
        </Tooltip>
      )}
      <CodeMirrorEditor
        value={value}
        onChange={onChange}
        filePath={filePath}
        height={height ? height : '100%'}
        width={width ? width : '100%'}
      />
    </Box>
  );
};
