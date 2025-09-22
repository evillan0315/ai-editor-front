import React, { useState, useCallback } from 'react';
import { Box, Button, TextField, Typography, useTheme, IconButton, CircularProgress } from '@mui/material';
import { CloudUpload, Link as LinkIcon, FolderOpen } from '@mui/icons-material';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { convertYamlToJson } from '@/api/llm';
import { readFileContent } from '@/api/file';
//import { readFileSync } from 'fs';


interface ImportDataProps {
  onDataLoaded: (data: string) => void;
  onClose: () => void;
}

const ImportData: React.FC<ImportDataProps> = ({ onDataLoaded, onClose }) => {
  const theme = useTheme();
  const [sourceType, setSourceType] = useState<'file' | 'url' | 'path'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeMirrorValue, setCodeMirrorValue] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCodeMirrorValue(content);
        onDataLoaded(content);
      };
      reader.onerror = () => setError('Error reading file.');
      reader.readAsText(selectedFile);
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const handleLoadFromUrl = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      setCodeMirrorValue(text);
      onDataLoaded(text);
    } catch (e: any) {
      setError(`Failed to load from URL: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPath(event.target.value);
  };

  const handleLoadFromPath = async () => {
    setLoading(true);
    setError(null);
    try {



      const filePath = path.toString();
      const fileContent = await readFileContent(filePath);


      setCodeMirrorValue(fileContent);
      onDataLoaded(fileContent);
    } catch (e: any) {
      setError(`Failed to load from path: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Import Data
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Button
          variant={sourceType === 'file' ? 'contained' : 'outlined'}
          onClick={() => setSourceType('file')}
          sx={{ mr: 1 }}
        >
          File
        </Button>
        <Button
          variant={sourceType === 'url' ? 'contained' : 'outlined'}
          onClick={() => setSourceType('url')}
          sx={{ mr: 1 }}
        >
          URL
        </Button>
        <Button
          variant={sourceType === 'path' ? 'contained' : 'outlined'}
          onClick={() => setSourceType('path')}
        >
          Path
        </Button>
      </Box>

      {sourceType === 'file' && (
        <Box>
          <input
            accept=".json,.yaml,.yml"
            style={{ display: 'none' }}
            id="raised-button-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="raised-button-file">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUpload />}
              disabled={loading}
            >
              Upload File
            </Button>
          </label>
          {file && (
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Selected: {file.name}
            </Typography>
          )}
        </Box>
      )}

      {sourceType === 'url' && (
        <Box>
          <TextField
            label="URL"
            fullWidth
            margin="normal"
            value={url}
            onChange={handleUrlChange}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleLoadFromUrl}
            startIcon={<LinkIcon />}
            disabled={loading || !url}
            sx={{ mt: 1 }}
          >
            Load from URL
          </Button>
        </Box>
      )}

      {sourceType === 'path' && (
        <Box>
          <TextField
            label="File Path"
            fullWidth
            margin="normal"
            value={path}
            onChange={handlePathChange}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleLoadFromPath}
            startIcon={<FolderOpen />}
            disabled={loading || !path}
            sx={{ mt: 1 }}
          >
            Load from Path
          </Button>
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

     {codeMirrorValue && (
        <Box sx={{ mt: 2 }}>
          <CodeMirrorEditor value={codeMirrorValue} onChange={(value) => {setCodeMirrorValue(value); onDataLoaded(value)}} language="json" />
        </Box>
      )} 
    </Box>
  );
};

export default ImportData;
