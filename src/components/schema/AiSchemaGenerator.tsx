import React, { useState, useCallback } from 'react';
import { Box, TextField, Select, MenuItem, FormControl, InputLabel, Switch, FormGroup, FormControlLabel, IconButton, useTheme, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { generateSchema } from '@/api/llm';
import { LLM_ENDPOINT, RequestType } from '@/types/llm';

interface SchemaProperty {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
}

const AiSchemaGenerator: React.FC = () => {
  const theme = useTheme();
  const [properties, setProperties] = useState<SchemaProperty[]>([{ id: '1', name: 'propertyName', type: 'string', required: true }]);
  const [useInstruction, setUseInstruction] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState('{}');
  const [loading, setLoading] = useState(false);

  const handleAddProperty = () => {
    setProperties([...properties, { id: String(Date.now()), name: '', type: 'string', required: false }]);
  };

  const handleDeleteProperty = (id: string) => {
    setProperties(properties.filter(property => property.id !== id));
  };

  const handlePropertyChange = (id: string, field: string, value: any) => {
    setProperties(properties.map(property => property.id === id ? { ...property, [field]: value } : property));
  };

  // Function to generate schema from properties
  const generateSchemaFromProperties = useCallback(() => {
    const requiredProperties = properties.filter(property => property.required).map(property => property.name);

    const propertiesSchema = properties.reduce((acc: any, property) => {
      acc[property.name] = { type: property.type };
      return acc;
    }, {});

    const schema = {
      type: 'object',
      properties: propertiesSchema,
      required: requiredProperties,
    };

    setGeneratedSchema(JSON.stringify(schema, null, 2));
  }, [properties]);

  // Function to generate schema from instruction
  const generateSchemaFromInstruction = useCallback(async () => {
    setLoading(true);
    try {
      const aiResponse = await generateSchema(`Generate a JSON schema based on the following instruction: ${instruction}`);
      console.log(aiResponse, 'aiResponse');

        if (aiResponse) {
          try {
            JSON.parse(aiResponse);
            setGeneratedSchema(aiResponse);
          } catch (error) {
            console.error('Failed to parse generated schema:', error);
            setGeneratedSchema('Error: Invalid JSON generated.');
          }
        } else {
          setGeneratedSchema('Error: No schema content found in the response.');
        }
    } catch (error) {
      console.error('Error generating schema from instruction:', error);
      setGeneratedSchema('Error: Failed to generate schema.');
    } finally {
      setLoading(false);
    }
  }, [instruction]);

  // General generate schema function
  const handleGenerateSchema = () => {
    if (useInstruction) {
      generateSchemaFromInstruction();
    } else {
      generateSchemaFromProperties();
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h6" gutterBottom>
        AI Schema Generator
      </Typography>

      <FormGroup>
        <FormControlLabel
          control={<Switch checked={useInstruction} onChange={(e) => setUseInstruction(e.target.checked)} />}
          label="Generate Schema from Instruction"
        />
      </FormGroup>

      {useInstruction ? (
        <>
          <TextField
            label="Instruction"
            fullWidth
            multiline
            rows={4}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            margin="normal"
          />
          <Button variant="contained" color="primary" onClick={handleGenerateSchema} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Generate Schema'}
          </Button>
        </>
      ) : (
        <>
          {properties.map(property => (
            <Paper
              key={property.id}
              sx={{ padding: 2, marginBottom: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <TextField
                  label="Property Name"
                  value={property.name}
                  onChange={e => handlePropertyChange(property.id, 'name', e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="type-label">Type</InputLabel>
                  <Select
                    labelId="type-label"
                    value={property.type}
                    label="Type"
                    onChange={e => handlePropertyChange(property.id, 'type', e.target.value as 'string' | 'number' | 'boolean')}
                  >
                    <MenuItem value="string">String</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="boolean">Boolean</MenuItem>
                  </Select>
                </FormControl>
                <FormGroup>
                  <FormControlLabel
                    control={<Switch checked={property.required} />}
                    label="Required"
                    onChange={e => handlePropertyChange(property.id, 'required', e.target.checked)}
                  />
                </FormGroup>
                <IconButton aria-label="delete" onClick={() => handleDeleteProperty(property.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}
          <IconButton aria-label="add" onClick={handleAddProperty}>
            <AddIcon />
          </IconButton>
          <Typography variant="body1">Add Property</Typography>

          <Box mt={3}>
            <Button variant="contained" color="primary" onClick={handleGenerateSchema}>
              Generate Schema
            </Button>
          </Box>
        </>
      )}


      <Box mt={3}>
        <Typography variant="subtitle1" gutterBottom>
          Generated Schema:
        </Typography>
        <CodeMirrorEditor value={generatedSchema} language="json" readOnly filePath="schema.json" />
      </Box>
    </Box>
  );
};

export default AiSchemaGenerator;
