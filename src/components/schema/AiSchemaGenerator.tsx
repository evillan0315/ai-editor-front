import React, { useState, useCallback, useEffect } from 'react';
import { Box, TextField, Select, MenuItem, FormControl, InputLabel, Switch, FormGroup, FormControlLabel, IconButton, useTheme, Typography, Paper, Button, CircularProgress, Tooltip, Collapse } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { generateSchema } from '@/api/llm';
import { useStore } from '@nanostores/react';
import { schemaStore } from '@/stores/schemaStore';
import { nanoid } from 'nanoid'; // Import nanoid

// Interface for SchemaProperty to support nested structures
interface SchemaProperty {
  id: string; // Unique ID for React keying and manipulation
  name: string; // Property name
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
  required: boolean;
  description?: string;
  format?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  items?: SchemaProperty; // For array type, defines the schema for elements within the array (a single SchemaProperty)
  properties?: SchemaProperty[]; // For object type, defines the properties of the object (an array of SchemaProperty)
  showOptions?: boolean; // Controls visibility of advanced options for THIS property
  showChildren?: boolean; // Controls visibility of nested properties (for array/object types)
}

// =============================
// SchemaPropertyField Component (Nested Helper Component)
// =============================
interface SchemaPropertyFieldProps {
  property: SchemaProperty;
  path: string[]; // Path to this property, e.g., ['id1', 'properties', 'id2']
  onPropertyChange: (path: string[], field: keyof SchemaProperty, value: any) => void;
  onAddNestedProperty: (path: string[], type: 'item' | 'property') => void;
  onDeleteProperty: (path: string[]) => void; // Path to the property to delete
  nestingLevel: number;
}

const SchemaPropertyField: React.FC<SchemaPropertyFieldProps> = ({
  property,
  path,
  onPropertyChange,
  onAddNestedProperty,
  onDeleteProperty,
  nestingLevel,
}) => {
  const theme = useTheme();
  const indent = nestingLevel * 20; // Indent based on nesting level

  const handleFieldChange = (field: keyof SchemaProperty, value: any) => {
    onPropertyChange(path, field, value);
  };

  const handleEnumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enumValues = e.target.value.split(',').map(item => item.trim()).filter(Boolean);
    handleFieldChange('enum', enumValues);
  };

  const handleToggleOptions = () => {
    handleFieldChange('showOptions', !property.showOptions);
  };

  const handleToggleChildren = () => {
    handleFieldChange('showChildren', !property.showChildren);
  };

  const handleDelete = () => {
    onDeleteProperty(path);
  };

  const handleAddNested = (type: 'item' | 'property') => {
    onAddNestedProperty(path, type);
  };

  // sx styling for consistent visual appearance
  const sxContainer = {
    padding: 2,
    marginBottom: 2,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 1,
    ml: `${indent}px`, // Apply indentation
    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', // Subtle background for nesting
  };

  const sxNestedSection = {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    mt: 2,
    borderLeft: `2px solid ${theme.palette.divider}`,
    pl: 2,
  };

  const sxAddButton = {
    ml: `${indent + 2}px`, // Adjusted indentation for buttons
    mt: 1,
    textTransform: 'none' as const,
  };

  return (
    <Paper sx={sxContainer}>
      <Box display="flex" alignItems="center" gap={2} mb={1}>
        <TextField
          label="Property Name"
          value={property.name}
          onChange={e => handleFieldChange('name', e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id={`type-label-${property.id}`}>Type</InputLabel>
          <Select
            labelId={`type-label-${property.id}`}
            value={property.type}
            label="Type"
            onChange={e => handleFieldChange('type', e.target.value as SchemaProperty['type'])}
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
            control={<Switch checked={property.required} onChange={e => handleFieldChange('required', e.target.checked)} size="small" />}
            label="Required"
          />
        </FormGroup>

        {/* Toggle Advanced Options */}
        <Tooltip title={property.showOptions ? "Hide Advanced Options" : "Show Advanced Options"}>
          <IconButton onClick={handleToggleOptions} size="small">
            {property.showOptions ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        </Tooltip>

        {/* Toggle Children (for object/array) */}
        {(property.type === 'array' || property.type === 'object') && (
          <Tooltip title={property.showChildren ? "Hide Nested Fields" : "Show Nested Fields"}>
            <IconButton onClick={handleToggleChildren} size="small">
              {property.showChildren ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete Property */}
        <Tooltip title="Delete Property">
          <IconButton aria-label="delete" onClick={handleDelete} size="small">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Advanced Options */}
      <Collapse in={property.showOptions} timeout="auto" unmountOnExit>
        <Box sx={sxNestedSection}>
          <TextField label="Description" value={property.description || ''} onChange={e => handleFieldChange('description', e.target.value)} size="small" fullWidth />
          <TextField label="Format" value={property.format || ''} onChange={e => handleFieldChange('format', e.target.value)} size="small" fullWidth />
          <TextField label="Enum (comma separated)" value={(property.enum || []).join(', ')} onChange={handleEnumChange} size="small" fullWidth />
          <TextField label="Minimum" type="number" value={property.minimum !== undefined ? property.minimum : ''} onChange={e => handleFieldChange('minimum', e.target.value === '' ? undefined : Number(e.target.value))} size="small" fullWidth />
          <TextField label="Maximum" type="number" value={property.maximum !== undefined ? property.maximum : ''} onChange={e => handleFieldChange('maximum', e.target.value === '' ? undefined : Number(e.target.value))} size="small" fullWidth />
          <TextField label="Min Length" type="number" value={property.minLength !== undefined ? property.minLength : ''} onChange={e => handleFieldChange('minLength', e.target.value === '' ? undefined : Number(e.target.value))} size="small" fullWidth />
          <TextField label="Max Length" type="number" value={property.maxLength !== undefined ? property.maxLength : ''} onChange={e => handleFieldChange('maxLength', e.target.value === '' ? undefined : Number(e.target.value))} size="small" fullWidth />
        </Box>
      </Collapse>

      {/* Nested Properties (for Object and Array types) */}
      <Collapse in={property.showChildren} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2 }}>
          {property.type === 'object' && (
            <>
              <Typography variant="body2" sx={{ ml: `${indent + 2}px`, mb: 1, fontWeight: 'bold' }}>Object Properties:</Typography>
              {property.properties?.map(nestedProperty => (
                <SchemaPropertyField
                  key={nestedProperty.id}
                  property={nestedProperty}
                  path={path.concat(['properties', nestedProperty.id])}
                  onPropertyChange={onPropertyChange}
                  onAddNestedProperty={onAddNestedProperty}
                  onDeleteProperty={onDeleteProperty}
                  nestingLevel={nestingLevel + 1}
                />
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleAddNested('property')}
                sx={sxAddButton}
                variant="outlined"
                size="small"
              >
                Add Object Property
              </Button>
            </>
          )}

          {property.type === 'array' && (
            <>
              <Typography variant="body2" sx={{ ml: `${indent + 2}px`, mb: 1, fontWeight: 'bold' }}>Array Items Schema:</Typography>
              {property.items ? (
                <SchemaPropertyField
                  key={property.items.id}
                  property={property.items}
                  path={path.concat(['items'])}
                  onPropertyChange={onPropertyChange}
                  onAddNestedProperty={onAddNestedProperty}
                  onDeleteProperty={onDeleteProperty}
                  nestingLevel={nestingLevel + 1}
                />
              ) : (
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleAddNested('item')}
                  sx={sxAddButton}
                  variant="outlined"
                  size="small"
                >
                  Define Array Item Schema
                </Button>
              )}
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};


// =============================
// AiSchemaGenerator Component
// =============================
const AiSchemaGenerator: React.FC = () => {
  const theme = useTheme();
  const [properties, setProperties] = useState<SchemaProperty[]>([
    { id: nanoid(), name: 'newProperty', type: 'string', required: true, showOptions: false, showChildren: false }
  ]);
  const [useInstruction, setUseInstruction] = useState(false);
  const [instruction, setInstruction] = useState('');
  const $schema = useStore(schemaStore);
  const [loading, setLoading] = useState(false);
  const [applyInstruction, setApplyInstruction] = useState('');

  // Helper function to convert JSON schema to SchemaProperty structure recursively
  const convertJsonSchemaToSchemaPropertyRecursive = (
    name: string,
    details: any,
    requiredFields: string[] = [] // Default to empty array if not provided
  ): SchemaProperty => {
    const propertyId = nanoid();
    const baseProperty: SchemaProperty = {
      id: propertyId,
      name: name,
      type: details.type || 'string',
      required: requiredFields.includes(name),
      description: details.description,
      format: details.format,
      enum: details.enum,
      minimum: details.minimum,
      maximum: details.maximum,
      minLength: details.minLength,
      maxLength: details.maxLength,
      showOptions: false, // Start collapsed
      showChildren: false, // Start collapsed
    };

    // Handle array items
    if (baseProperty.type === 'array' && details.items) {
      const itemRequiredFields = details.items.required || [];
      baseProperty.items = convertJsonSchemaToSchemaPropertyRecursive(
        'items-schema', // A generic name for the item's schema itself
        details.items,
        itemRequiredFields
      );
    }

    // Handle object properties
    if (baseProperty.type === 'object' && details.properties) {
      const objectRequiredFields = details.required || [];
      baseProperty.properties = Object.entries(details.properties).map(
        ([propName, propDetails]: [string, any]) =>
          convertJsonSchemaToSchemaPropertyRecursive(
            propName,
            propDetails,
            objectRequiredFields
          )
      );
    }

    return baseProperty;
  };


  // Function to parse JSON schema and update properties
  const parseSchema = useCallback((schema: any) => {
    if (typeof schema === 'object' && schema !== null && schema.properties) {
      const newProperties: SchemaProperty[] = Object.entries(schema.properties).map(([name, details]: [string, any]) =>
        convertJsonSchemaToSchemaPropertyRecursive(
          name,
          details,
          schema.required || []
        )
      );
      setProperties(newProperties);
    } else {
      console.error('Invalid schema format: properties field missing or schema is not an object.');
      setProperties([]); // Reset properties on invalid schema
    }
  }, []);

  // Use useEffect to call parseSchema whenever $schema changes
  useEffect(() => {
    if ($schema && Object.keys($schema).length > 0) { // Check if $schema is not empty
      parseSchema($schema);
    }
  }, [$schema, parseSchema]);


  // Helper function to update a property deeply nested in the state
  const updatePropertyByPath = useCallback((
    currentProps: SchemaProperty[],
    path: string[], // e.g., ['id1', 'properties', 'id2', 'items', 'id3']
    field: keyof SchemaProperty,
    value: any
  ): SchemaProperty[] => {
    if (path.length === 0) return currentProps;

    const [segment, ...restPath] = path;

    return currentProps.map(prop => {
      if (prop.id === segment) { // Match current property by ID
        if (restPath.length === 0) {
          // This is the target property
          return { ...prop, [field]: value };
        } else {
          // Traverse deeper. The next segment should be a keyword ('items' or 'properties')
          const keyword = restPath[0];
          if (keyword === 'items' && prop.items) {
            const updatedItems = updatePropertyByPath([prop.items], restPath.slice(1), field, value)[0];
            return { ...prop, items: updatedItems };
          } else if (keyword === 'properties' && prop.properties) {
            const updatedProperties = updatePropertyByPath(prop.properties, restPath.slice(1), field, value);
            return { ...prop, properties: updatedProperties };
          }
        }
      }
      return prop;
    });
  }, []);


  // Helper to add a nested property or array item schema
  const addNestedPropertyByPath = useCallback((
    currentProps: SchemaProperty[],
    path: string[], // e.g., ['id1', 'properties', 'id2']
    type: 'item' | 'property'
  ): SchemaProperty[] => {
    if (path.length === 0) return currentProps;

    const [segment, ...restPath] = path;

    return currentProps.map(prop => {
      if (prop.id === segment) {
        if (restPath.length === 0) {
          // This is the parent property where we add
          const newId = nanoid();
          const newProp: SchemaProperty = {
            id: newId,
            name: type === 'item' ? 'newItemSchema' : 'newProperty', // Consistent naming
            type: 'string', // Default type
            required: false,
            showOptions: false,
            showChildren: false,
          };

          if (type === 'item' && prop.type === 'array') {
            return { ...prop, items: newProp, showChildren: true };
          } else if (type === 'property' && prop.type === 'object') {
            return { ...prop, properties: [...(prop.properties || []), newProp], showChildren: true };
          }
          return prop;
        } else {
          // Traverse deeper
          const keyword = restPath[0];
          if (keyword === 'items' && prop.items) {
            const updatedItems = addNestedPropertyByPath([prop.items], restPath.slice(1), type);
            return { ...prop, items: updatedItems[0] };
          } else if (keyword === 'properties' && prop.properties) {
            const updatedProperties = addNestedPropertyByPath(prop.properties, restPath.slice(1), type);
            return { ...prop, properties: updatedProperties };
          }
        }
      }
      return prop;
    });
  }, []);

  // Helper to delete a property deeply nested in the state
  const deletePropertyByPath = useCallback((
    currentProps: SchemaProperty[],
    path: string[] // e.g., ['id1', 'properties', 'id2'] or ['id1', 'items']
  ): SchemaProperty[] => {
    if (path.length === 0) return currentProps;

    const [segment, ...restPath] = path;

    return currentProps.reduce((acc, prop) => {
      if (prop.id === segment) {
        if (restPath.length === 0) {
          // This is the target property to delete, so skip it
          return acc;
        } else {
          // Traverse deeper. The next segment should be a keyword
          const keyword = restPath[0];
          if (keyword === 'items' && prop.items) {
            if (restPath.length === 1) { // Path is ['propId', 'items'], delete the items schema
              acc.push({ ...prop, items: undefined });
            } else {
              // Path is ['propId', 'items', 'properties', 'nestedItemId']
              const updatedItemsProperties = deletePropertyByPath(
                prop.items.properties || [],
                restPath.slice(1) // Pass from 'properties' segment onward
              );
              const updatedItems = { ...prop.items, properties: updatedItemsProperties };
              acc.push({ ...prop, items: updatedItems });
            }
          } else if (keyword === 'properties' && prop.properties) {
            const updatedProperties = deletePropertyByPath(
              prop.properties,
              restPath.slice(1) // Pass from nested property ID onward
            );
            acc.push({ ...prop, properties: updatedProperties });
          } else {
            acc.push(prop); // Unhandled path segment, keep property as is
          }
        }
      } else {
        acc.push(prop);
      }
      return acc;
    }, [] as SchemaProperty[]);
  }, []);

  // Main handlers for the SchemaPropertyField callbacks
  const handlePropertyChange = useCallback((path: string[], field: keyof SchemaProperty, value: any) => {
    setProperties(prev => updatePropertyByPath(prev, path, field, value));
  }, [updatePropertyByPath]);

  const handleAddProperty = useCallback(() => {
    setProperties(prev => [
      ...prev,
      { id: nanoid(), name: 'newProperty', type: 'string', required: false, showOptions: false, showChildren: false }
    ]);
  }, []);

  const handleAddNestedProperty = useCallback((path: string[], type: 'item' | 'property') => {
    setProperties(prev => addNestedPropertyByPath(prev, path, type));
  }, [addNestedPropertyByPath]);

  const handleDeleteProperty = useCallback((path: string[]) => {
    setProperties(prev => deletePropertyByPath(prev, path));
  }, [deletePropertyByPath]);


  // Helper function to convert SchemaProperty structure to JSON schema recursively
  const convertSchemaPropertyToJsonSchemaRecursive = (property: SchemaProperty): any => {
    const jsonSchema: any = { type: property.type };

    if (property.description) jsonSchema.description = property.description;
    if (property.format) jsonSchema.format = property.format;
    if (property.enum && property.enum.length > 0) jsonSchema.enum = property.enum;
    if (property.minimum !== undefined) jsonSchema.minimum = property.minimum;
    if (property.maximum !== undefined) jsonSchema.maximum = property.maximum;
    if (property.minLength !== undefined) jsonSchema.minLength = property.minLength;
    if (property.maxLength !== undefined) jsonSchema.maxLength = property.maxLength;

    if (property.type === 'array' && property.items) {
      // For arrays, the 'items' field directly holds the schema for a single array element
      const itemSchema = convertSchemaPropertyToJsonSchemaRecursive(property.items);

      // If the array items are objects, their properties and required fields are part of 'items'
      if (property.items.type === 'object' && property.items.properties) {
        const nestedObjectProps: { [key: string]: any } = {};
        const nestedObjectRequired: string[] = [];
        property.items.properties.forEach(nestedProp => {
          nestedObjectProps[nestedProp.name] = convertSchemaPropertyToJsonSchemaRecursive(nestedProp);
          if (nestedProp.required) nestedObjectRequired.push(nestedProp.name);
        });
        itemSchema.properties = nestedObjectProps;
        if (nestedObjectRequired.length > 0) {
          itemSchema.required = nestedObjectRequired;
        }
      }
      jsonSchema.items = itemSchema;
    }

    if (property.type === 'object' && property.properties) {
      const nestedProps: { [key: string]: any } = {};
      const nestedRequired: string[] = [];
      property.properties.forEach(nestedProp => {
        nestedProps[nestedProp.name] = convertSchemaPropertyToJsonSchemaRecursive(nestedProp);
        if (nestedProp.required) nestedRequired.push(nestedProp.name);
      });
      jsonSchema.properties = nestedProps;
      if (nestedRequired.length > 0) {
        jsonSchema.required = nestedRequired;
      }
    }

    return jsonSchema;
  };


  // Function to generate schema from properties
  const generateSchemaFromProperties = useCallback(() => {
    const rootProperties: { [key: string]: any } = {};
    const rootRequired: string[] = [];

    properties.forEach(prop => {
      rootProperties[prop.name] = convertSchemaPropertyToJsonSchemaRecursive(prop);
      if (prop.required) rootRequired.push(prop.name);
    });

    const schema = {
      type: 'object',
      properties: rootProperties,
      required: rootRequired,
    };
    schemaStore.set(schema);
  }, [properties]);


  // Function to generate schema from instruction
  const generateSchemaFromInstruction = useCallback(async () => {
    setLoading(true);
    try {
      const aiResponse = await generateSchema(`Generate a JSON schema based on the following instruction: ${instruction}`);

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
            <SchemaPropertyField
              key={property.id}
              property={property}
              path={[property.id]} // Root properties have a path of just their ID
              onPropertyChange={handlePropertyChange}
              onAddNestedProperty={handleAddNestedProperty}
              onDeleteProperty={handleDeleteProperty}
              nestingLevel={0} // Top level
            />
          ))}
          <Button startIcon={<AddIcon />} onClick={handleAddProperty} sx={{ mt: 2, textTransform: 'none' }} variant="contained" color="secondary">
            Add Top-Level Property
          </Button>

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
