import React, { useState, useCallback, useEffect } from 'react';
import { Box, TextField, Select, MenuItem, FormControl, InputLabel, Switch, FormGroup, FormControlLabel, IconButton, useTheme, Typography, Paper, Button, CircularProgress, Tooltip, Collapse } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { generateSchema } from '@/api/llm';
import { LLM_ENDPOINT, RequestType } from '@/types/llm';
import { useStore } from '@nanostores/react';
import { schemaStore } from '@/stores/schemaStore';

interface SchemaProperty {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
  required: boolean;
  description?: string;
  format?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  items?: SchemaProperty[]; // For array type, allow nested properties
  showOptions?: boolean; // New property to control visibility of other options
}

const AiSchemaGenerator: React.FC = () => {
  const theme = useTheme();
  const [properties, setProperties] = useState<SchemaProperty[]>([{ id: '1', name: 'propertyName', type: 'string', required: true, showOptions: false }]);
  const [useInstruction, setUseInstruction] = useState(false);
  const [instruction, setInstruction] = useState('');
  const $schema = useStore(schemaStore);
  const [loading, setLoading] = useState(false);
  const [applyInstruction, setApplyInstruction] = useState('');

  // Function to parse JSON schema and update properties
  const parseSchema = useCallback((schema: any) => {
    if (typeof schema === 'object' && schema !== null && schema.properties) {
      const newProperties: SchemaProperty[] = Object.entries(schema.properties).map(([name, details]: [string, any], index) => {
        const baseProperty: SchemaProperty = {
          id: String(Date.now() + index), // Generate unique ID
          name: name,
          type: details.type || 'string', // Default to string if type is missing
          required: schema.required ? schema.required.includes(name) : false,
          showOptions: false, // Initialize as hidden
        };

        // Add additional properties if they exist
        if (details.description) baseProperty.description = details.description;
        if (details.format) baseProperty.format = details.format;
        if (details.enum) baseProperty.enum = details.enum;
        if (details.minimum) baseProperty.minimum = details.minimum;
        if (details.maximum) baseProperty.maximum = details.maximum;
        if (details.minLength) baseProperty.minLength = details.minLength;
        if (details.maxLength) baseProperty.maxLength = details.maxLength;

        // Handle nested items (for arrays)
        if (details.type === 'array' && details.items) {
          // Assuming items is an object with properties
          if (details.items.properties) {
            const itemProperties = Object.entries(details.items.properties).map(([itemName, itemDetails]: [string, any], itemIndex) => ({
              id: String(Date.now() + index + itemIndex), // Generate unique ID
              name: itemName,
              type: itemDetails.type || 'string',
              required: details.items.required ? details.items.required.includes(itemName) : false,
              description: itemDetails.description,
              format: itemDetails.format,
              enum: itemDetails.enum,
              minimum: itemDetails.minimum,
              maximum: itemDetails.maximum,
              minLength: itemDetails.minLength,
              maxLength: itemDetails.maxLength,
              showOptions: false, // Initialize as hidden
            }));
            baseProperty.items = itemProperties;
          }
        }
        return baseProperty;
      });
      setProperties(newProperties);
    } else {
      console.error('Invalid schema format: properties field missing or schema is not an object.');
      setProperties([]); // Reset properties on invalid schema
    }
  }, []);

  // Use useEffect to call parseSchema whenever $schema changes
  useEffect(() => {
    if ($schema) {
      parseSchema($schema);
    }
  }, [$schema, parseSchema]);

  const handleAddProperty = () => {
    setProperties([...properties, { id: String(Date.now()), name: '', type: 'string', required: false, showOptions: false }]);
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

      if (property.description) acc[property.name].description = property.description;
      if (property.format) acc[property.name].format = property.format;
      if (property.enum) acc[property.name].enum = property.enum;
      if (property.minimum) acc[property.name].minimum = property.minimum;
      if (property.maximum) acc[property.name].maximum = property.maximum;
      if (property.minLength) acc[property.name].minLength = property.minLength;
      if (property.maxLength) acc[property.name].maxLength = property.maxLength;

      // Handle nested items for arrays
      if (property.type === 'array' && property.items) {
        acc[property.name].items = {
          type: 'object',
          properties: property.items.reduce((itemAcc: any, item) => {
            itemAcc[item.name] = { type: item.type };
            if (item.description) itemAcc[item.name].description = item.description;
            if (item.format) itemAcc[item.name].format = item.format;
            if (item.enum) itemAcc[item.name].enum = item.enum;
            if (item.minimum) itemAcc[item.name].minimum = item.minimum;
            if (item.maximum) itemAcc[item.name].maximum = item.maximum;
            if (item.minLength) itemAcc[item.name].minLength = item.minLength;
            if (item.maxLength) itemAcc[item.name].maxLength = item.maxLength;
            return itemAcc;
          }, {})
        };
      }

      return acc;
    }, {});

    const schema = {
      type: 'object',
      properties: propertiesSchema,
      required: requiredProperties,
    };

    schemaStore.set(schema);
  }, [properties]);

  // Function to generate schema from instruction
  const generateSchemaFromInstruction = useCallback(async () => {
    setLoading(true);
    try {
      const aiResponse = await generateSchema(`Generate a JSON schema based on the following instruction: ${instruction}`);
      console.log(aiResponse, 'aiResponse');

      if (aiResponse) {
        try {
          const parsedSchema = JSON.parse(aiResponse);
          schemaStore.set(parsedSchema);
        } catch (error) {
          console.error('Failed to parse generated schema:', error);
          schemaStore.set('Error: Invalid JSON generated.');
        }
      } else {
        schemaStore.set('Error: No schema content found in the response.');
      }
    } catch (error) {
      console.error('Error generating schema from instruction:', error);
      schemaStore.set('Error: Failed to generate schema.');
    } finally {
      setLoading(false);
    }
  }, [instruction]);

  // Handle direct edits (paste, type) in the generated schema editor
  const handleGeneratedSchemaEditorChange = useCallback((newValue: string) => {
    try {
      const parsed = JSON.parse(newValue);
      schemaStore.set(parsed);
    } catch (error) {
      console.error('Invalid JSON in generated schema editor:', error);
      // Optionally, show a temporary error message to the user
    }
  }, []);

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
                    onChange={e => handlePropertyChange(property.id, 'type', e.target.value as 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null')}
                  >
                    <MenuItem value="string">String</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="boolean">Boolean</MenuItem>
                    <MenuItem value="array">Array</MenuItem>
                    <MenuItem value="object">Object</MenuItem>
                    <MenuItem value="null">Null</MenuItem>
                  </Select>
                </FormControl>
                <FormGroup>
                  <FormControlLabel
                    control={<Switch checked={property.required} onChange={e => handlePropertyChange(property.id, 'required', e.target.checked)} />} 
                    label="Required"
                  />
                </FormGroup>
                 <IconButton 
                   aria-label="toggle other options" 
                   onClick={() => handlePropertyChange(property.id, 'showOptions', !property.showOptions)} // Toggle only for this property
                 >
                    {property.showOptions ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
                <IconButton aria-label="delete" onClick={() => handleDeleteProperty(property.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Collapse in={property.showOptions} timeout="auto" unmountOnExit> {/* Use property.showOptions here */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  <Tooltip title="Description">
                    <TextField
                      label="Description"
                      value={property.description || ''}
                      onChange={e => handlePropertyChange(property.id, 'description', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Tooltip>
                  <Tooltip title="Format">
                    <TextField
                      label="Format"
                      value={property.format || ''}
                      onChange={e => handlePropertyChange(property.id, 'format', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Tooltip>
                  <Tooltip title="Enum">
                    <TextField
                      label="Enum (comma separated)"
                      value={(property.enum || []).join(', ')}
                      onChange={e => {
                        const enumValues = e.target.value.split(',').map(item => item.trim());
                        handlePropertyChange(property.id, 'enum', enumValues);
                      }}
                      size="small"
                      fullWidth
                    />
                  </Tooltip>

                  <Tooltip title="Minimum">
                    <TextField
                      label="Minimum"
                      type="number"
                      value={property.minimum !== undefined ? property.minimum : ''}
                      onChange={e => handlePropertyChange(property.id, 'minimum', Number(e.target.value))}
                      size="small"
                      fullWidth
                    />
                  </Tooltip>
                  <Tooltip title="Maximum">
                    <TextField
                      label="Maximum"
                      type="number"
                      value={property.maximum !== undefined ? property.maximum : ''}
                      onChange={e => handlePropertyChange(property.id, 'maximum', Number(e.target.value))}
                      size="small"
                      fullWidth
                    />
                  </Tooltip>
                  <Tooltip title="Min Length">
                    <TextField
                      label="Min Length"
                      type="number"
                      value={property.minLength !== undefined ? property.minLength : ''}
                      onChange={e => handlePropertyChange(property.id, 'minLength', Number(e.target.value))}
                      size="small"
                      fullWidth
                    />
                  </Tooltip>
                  <Tooltip title="Max Length">
                    <TextField
                      label="Max Length"
                      type="number"
                      value={property.maxLength !== undefined ? property.maxLength : ''}
                      onChange={e => handlePropertyChange(property.id, 'maxLength', Number(e.target.value))}
                      size="small"
                      fullWidth
                    />
                  </Tooltip>
                </Box>
              </Collapse>
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
        <CodeMirrorEditor 
          value={JSON.stringify($schema, null, 2)} 
          language="json" 
          filePath="schema.json" 
          onChange={handleGeneratedSchemaEditorChange} // Added onChange handler
        />
      </Box>
      <Box mt={3}>
        <Typography variant="subtitle1" gutterBottom>
          Apply Schema To Instruction:
        </Typography>
          <TextField
            label="Apply Schema To Instruction"
            fullWidth
            multiline
            rows={4}
            value={applyInstruction}
            onChange={(e) => setApplyInstruction(e.target.value)}
            margin="normal"
          />
        <Button variant="contained" color="primary" onClick={() => setInstruction(applyInstruction +  JSON.stringify($schema, null, 2))}>
          Apply Schema To Instruction
        </Button>
      </Box>
    </Box>
  );
};

export default AiSchemaGenerator;
