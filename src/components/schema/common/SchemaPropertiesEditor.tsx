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
  schemaUrl: string;
  onSchemaUrlChange: (url: string) => void;
  schemaTitle: string;
  onSchemaTitleChange: (title: string) => void;
  schemaDescription: string;
  onSchemaDescriptionChange: (description: string) => void;
}

const SchemaPropertiesEditor: React.FC<SchemaPropertiesEditorProps> = ({
  properties,
  onPropertiesChange,
  onGenerateSchema,
  schemaUrl,
  onSchemaUrlChange,
  schemaTitle,
  onSchemaTitleChange,
  schemaDescription,
  onSchemaDescriptionChange,
}) => {

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
              // This handles deleting a property within an object that is an array item
              const updatedItemsProperties = deletePropertyByPath(
                prop.items.properties || [],
                restPath.slice(2) // Path from here should be just the ID of the property to delete
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
        label="Schema URL ($id)"
        value={schemaUrl}
        onChange={(e) => onSchemaUrlChange(e.target.value)}
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
