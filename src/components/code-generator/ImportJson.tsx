import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  getPaginatedGeminiRequests,
  getPaginatedGeminiResponses,
} from '@/api/gemini';

import { GeminiRequest, GeminiResponse } from '@/types/gemini';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { loadingStore } from '@/stores/loadingStore';
import { showGlobalSnackbar } from '@/stores/snackbarStore';
import { useStore } from '@nanostores/react';

export interface ImportJsonProps {
  value: string;
  onChange: (value: string) => void;
}

// Styles for Material-UI components
const formControlSx = {
  minWidth: 200,
  width: '100%',
};

const selectContainerSx = {
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  gap: 2,
  mb: 2,
};

export const ImportJson: React.FC<ImportJsonProps> = ({
  value,
  onChange,
}) => {
  const [geminiRequests, setGeminiRequests] = useState<GeminiRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [geminiResponses, setGeminiResponses] = useState<GeminiResponse[]>([]
  );
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(
    null,
  );
  const isLoading = useStore(loadingStore);

  // Fetch Gemini Requests of type 'LLM_GENERATION' on component mount
  useEffect(() => {
    const fetchRequests = async () => {
      //loadingStore.setLoading(true);
      try {
        const result = await getPaginatedGeminiRequests({
          requestType: 'LLM_GENERATION',
          limit: 100, // Fetch a reasonable number of recent requests
        });
        setGeminiRequests(result.items);
      } catch (error) {
        console.error('Failed to fetch Gemini requests:', error);
        showGlobalSnackbar('Failed to load Gemini requests.', 'error');
      } finally {
        //loadingStore.setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // Fetch Gemini Responses when a request is selected
  useEffect(() => {
    if (selectedRequestId) {
      const fetchResponses = async () => {
        //loadingStore.setLoading(true);
        try {
          const result = await getPaginatedGeminiResponses({
            requestId: selectedRequestId,
            limit: 100, // Fetch a reasonable number of responses
          });
          setGeminiResponses(result.items);
        } catch (error) {
          console.error('Failed to fetch Gemini responses:', error);
          showGlobalSnackbar('Failed to load Gemini requests.', 'error');
        } finally {
          //loadingStore.setLoading(false);
        }
      };
      fetchResponses();
    } else {
      setGeminiResponses([]);
    }
  }, [selectedRequestId]);

  const handleRequestChange = useCallback(
    (event: any) => {
      const newRequestId = event.target.value as string;
      setSelectedRequestId(newRequestId);
      setSelectedResponseId(null); // Clear selected response when request changes
      onChange(''); // Clear editor content
    },
    [onChange],
  );

  const handleResponseChange = useCallback(
    (event: any) => {
      const newResponseId = event.target.value as string;
      setSelectedResponseId(newResponseId);
      const selected = geminiResponses.find((r) => r.id === newResponseId);
      if (selected && selected.responseJson) {
        try {
          // Attempt to pretty print the JSON if it's a string
          const parsedJson = JSON.parse(selected.responseJson);
          onChange(JSON.stringify(parsedJson, null, 2));
        } catch (e) {
          // If parsing fails, just use the raw string
          onChange(selected.responseJson);

          showGlobalSnackbar('Selected response is not valid JSON. Displaying raw content.', 'warning');
        }
      } else {
        onChange('');
      }
    },
    [geminiResponses, onChange],
  );

  return (
    <Box className="flex flex-col h-full">
      <Box sx={selectContainerSx}>
        <FormControl fullWidth sx={formControlSx}>
          <InputLabel id="gemini-request-select-label">Gemini Request</InputLabel>
          <Select
            labelId="gemini-request-select-label"
            id="gemini-request-select"
            value={selectedRequestId || ''}
            label="Gemini Request"
            onChange={handleRequestChange}
            disabled={isLoading.isLoading}
          >
            <MenuItem value="">-- Select a Request --</MenuItem>
            {geminiRequests.map((request) => (
              <MenuItem key={request.id} value={request.id}>
                <Typography noWrap>{request.id} ({new Date(request.createdAt).toLocaleString()})</Typography>
              </MenuItem>
            ))}
          </Select>
          {isLoading.isLoading && (
            <CircularProgress size={20} className="absolute right-4 top-1/2 -translate-y-1/2" />
          )}
        </FormControl>

        <FormControl fullWidth sx={formControlSx}>
          <InputLabel id="gemini-response-select-label">Gemini Response</InputLabel>
          <Select
            labelId="gemini-response-select-label"
            id="gemini-response-select"
            value={selectedResponseId || ''}
            label="Gemini Response"
            onChange={handleResponseChange}
            disabled={isLoading.isLoading || !selectedRequestId}
          >
            <MenuItem value="">-- Select a Response --</MenuItem>
            {geminiResponses.map((response) => (
              <MenuItem key={response.id} value={response.id}>
                 <Typography noWrap>{response.id} ({new Date(response.createdAt).toLocaleString()})</Typography>
              </MenuItem>
            ))}
          </Select>
          {isLoading.isLoading && (
            <CircularProgress size={20} className="absolute right-4 top-1/2 -translate-y-1/2" />
          )}
        </FormControl>
      </Box>

      <Box className="flex-grow min-h-0">
        <CodeMirrorEditor
          value={value}
          onChange={onChange}
          filePath={`temp.json`}
          height="100%"
        />
      </Box>
    </Box>
  );
};
