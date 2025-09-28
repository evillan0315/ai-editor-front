/**
 * @module SchemaPropertiesEditor
 * @description Manages and renders a list of `SchemaPropertyField` components for manual schema definition.
 * Provides functionality to add, update, and delete schema properties, including nested ones.
 */

import React, { useCallback } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { nanoid } from 'nanoid';
import { SchemaProperty } from './SchemaPropertyTypes';
import SchemaPropertyField from './SchemaPropertyField';

/**
 * Props for the SchemaPropertiesEditor component.
 */
interface SchemaPropertiesEditorProps {
  properties: SchemaProperty[];
  onPropertiesChange: (newProperties: SchemaProperty[]) => void;
  onGenerateSchema: () => void;
  schemaId: string;
  onSchemaIdChange: (id: string) => void;
  metaSchemaUrl: string;
  onMetaSchemaUrlChange: (url: string) => void;
  schemaTitle: string;
  onSchemaTitleChange: (title: string) => void;
  schemaDescription: string;
  onSchemaDescriptionChange: (description: string) => void;
}

const SchemaPropertiesEditor: React.FC<SchemaPropertiesEditorProps> = ({
  properties,
  onPropertiesChange,
  onGenerateSchema,
  schemaId,
  onSchemaIdChange,
  metaSchemaUrl,
  onMetaSchemaUrlChange,
  schemaTitle,
  onSchemaTitleChange,
  schemaDescription,
  onSchemaDescriptionChange,
}) => {

  // Helper function to update a property deeply nested in the state
  const updatePropertyByPath = useCallback((
    currentProps: SchemaProperty[], // This array could be root properties, or properties of an object, or a single-element array containing an item's schema
    path: string[], // Sequence of IDs from the root down to the target property
    field: keyof SchemaProperty,
    value: any
  ): SchemaProperty[] => {
    if (!currentProps || path.length === 0) return currentProps;

    const [targetId, ...restPath] = path;

    return currentProps.map(prop => {
      if (prop.id === targetId) {
        if (restPath.length === 0) {
          // This is the direct target property to update
          return { ...prop, [field]: value };
        } else {
          // This prop is an ancestor, continue traversing down
          if (prop.type === 'object' && prop.properties) {
            const updatedProperties = updatePropertyByPath(prop.properties, restPath, field, value);
            return { ...prop, properties: updatedProperties };
          } else if (prop.type === 'array' && prop.items) {
            // The next ID in restPath must be the ID of `prop.items` if we're going into it
            const updatedItems = updatePropertyByPath([prop.items], restPath, field, value)[0];
            return { ...prop, items: updatedItems };
          }
        }
      }
      return prop;
    });
  }, []);

  // Helper to add a nested property or array item schema
  const addNestedPropertyByPath = useCallback((
    currentProps: SchemaProperty[],
    path: string[], // e.g., ['id1'], ['id1', 'id2'] - path to the PARENT property
    type: 'item' | 'property'
  ): SchemaProperty[] => {
    if (!currentProps || path.length === 0) return currentProps;

    const [targetId, ...restPath] = path;

    return currentProps.map(prop => {
      if (prop.id === targetId) {
        if (restPath.length === 0) {
          // This is the parent property where we add
          const newId = nanoid();
          const newProp: SchemaProperty = {
            id: newId,
            name: type === 'item' ? 'newItemSchema' : 'newProperty',
            type: 'string',
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
          // Traverse deeper to find the actual parent for the add operation
          if (prop.type === 'object' && prop.properties) {
            const updatedProperties = addNestedPropertyByPath(prop.properties, restPath, type);
            return { ...prop, properties: updatedProperties };
          } else if (prop.type === 'array' && prop.items) {
            const updatedItems = addNestedPropertyByPath([prop.items], restPath, type)[0];
            return { ...prop, items: updatedItems };
          }
        }
      }
      return prop;
    });
  }, []);

  // Helper to delete a property deeply nested in the state
  const deletePropertyByPath = useCallback((
    currentProps: SchemaProperty[],
    path: string[] // Path to the property to be deleted, e.g., ['top_level_id'], ['parent_id', 'target_id']
  ): SchemaProperty[] => {
    if (!currentProps || path.length === 0) return currentProps;

    const [segmentId, ...restPath] = path;

    if (restPath.length === 0) {
      // This is the direct target to delete from currentProps
      return currentProps.filter(prop => prop.id !== segmentId);
    } else {
      // Find the parent and recurse to delete the child
      return currentProps.map(prop => {
        if (prop.id === segmentId) { // Found the parent
          if (prop.type === 'object' && prop.properties) {
            const updatedProperties = deletePropertyByPath(prop.properties, restPath);
            return { ...prop, properties: updatedProperties };
          } else if (prop.type === 'array' && prop.items) {
            // The next segment should be the ID of the item schema to delete or an item within it.
            if (restPath.length === 1 && prop.items.id === restPath[0]) {
              return { ...prop, items: undefined }; // Delete the whole items schema
            } else {
              // If there's more path, it's a property within the item's object schema
              const updatedItems = deletePropertyByPath([prop.items], restPath)[0]; // Recurse into array item
              return { ...prop, items: updatedItems };
            }
          }
        }
        return prop; // Not the parent, keep as is
      });
    }
  }, []);

  // Main handlers for the SchemaPropertyField callbacks
  const handlePropertyChange = useCallback((path: string[], field: keyof SchemaProperty, value: any) => {
    onPropertiesChange(prev => updatePropertyByPath(prev as SchemaProperty[], path, field, value));
  }, [onPropertiesChange, updatePropertyByPath]);

  const handleAddProperty = useCallback(() => {
    onPropertiesChange(prev => [
      ...prev,
      { id: nanoid(), name: 'newProperty', type: 'string', required: false, showOptions: false, showChildren: false }
    ]);
  }, [onPropertiesChange]);

  const handleAddNestedProperty = useCallback((path: string[], type: 'item' | 'property') => {
    onPropertiesChange(prev => addNestedPropertyByPath(prev as SchemaProperty[], path, type));
  }, [onPropertiesChange, addNestedPropertyByPath]);

  const handleDeleteProperty = useCallback((path: string[]) => {
    onPropertiesChange(prev => deletePropertyByPath(prev as SchemaProperty[], path));
  }, [onPropertiesChange, deletePropertyByPath]);

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Manual Schema Definition:</Typography>

      {/* Top-level Schema Metadata Fields */}
      <TextField
        label="Schema ID ($id)" // Changed label for clarity
        value={schemaId}
        onChange={(e) => onSchemaIdChange(e.target.value)}
        fullWidth
        margin="normal"
        size="small"
      />
      <TextField
        label="Meta-Schema URL ($schema)" // New field for $schema
        value={metaSchemaUrl}
        onChange={(e) => onMetaSchemaUrlChange(e.target.value)}
        fullWidth
        margin="normal"
        size="small"
      />
      <TextField
        label="Schema Title"
        value={schemaTitle}
        onChange={(e) => onSchemaTitleChange(e.target.value)}
        fullWidth
        margin="normal"
        size="small"
      />
      <TextField
        label="Schema Description"
        value={schemaDescription}
        onChange={(e) => onSchemaDescriptionChange(e.target.value)}
        fullWidth
        multiline
        rows={2}
        margin="normal"
        size="small"
      />

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
        <Button variant="contained" color="primary" onClick={onGenerateSchema}>
          Generate Schema from Manual Input
        </Button>
      </Box>
    </Box>
  );
};

export default SchemaPropertiesEditor;