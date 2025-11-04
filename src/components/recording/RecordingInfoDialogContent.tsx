import React, { useCallback, Fragment, useRef, useMemo } from 'react';
import { Box, TextField, Button, MenuItem, Typography, Divider, IconButton, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { RecordingItem, RecordingType } from './types/recording';
import { useStore } from '@nanostores/react';
import { nanoid } from 'nanoid';
import {
  editableRecordingStore,
  selectedRecordingStore,
  setEditableRecording,
} from './stores/recordingStore';

interface RecordingInfoDialogContentProps {
  // onClose and onUpdate props removed as parent handles dialog closure and save action
}

const RECORDING_TYPES: RecordingType[] = ['screenRecord', 'screenShot', 'cameraRecord'];

interface DataField {
  id: string; // Unique ID for React key prop, generated locally for stability
  key: string;
  value: string; // Stringified value for text input
}

// Helper to create DataField, reusing existing ID if available for stability
const createDataFieldFromEntry = (key: string, value: any, existingId?: string): DataField => ({
  id: existingId || nanoid(),
  key,
  value: typeof value === 'string' ? value : JSON.stringify(value),
});

export const RecordingInfoDialogContent: React.FC<RecordingInfoDialogContentProps> = () => {
  const selectedRecording = useStore(selectedRecordingStore);
  const editableRecording = useStore(editableRecordingStore);

  // useRef to store a map of DataField.id to DataField for maintaining stable IDs across re-renders.
  const dataFieldMapRef = useRef<Map<string, DataField>>(new Map());

  // Derive data fields from editableRecording.data for rendering.
  // This useMemo ensures that `dataFieldsForRender` is only re-calculated when `editableRecording.data` changes,
  // and it reuses stable IDs from `dataFieldMapRef` to prevent unnecessary re-mounts of input fields.
  const dataFieldsForRender: DataField[] = useMemo(() => {
    const newDataFields: DataField[] = [];
    const currentData = editableRecording.data || {};
    const usedIds = new Set<string>();

    Object.entries(currentData).forEach(([key, value]) => {
      // Try to find an existing DataField by its key from the ref map to reuse its stable ID
      const existingFieldWithKey = Array.from(dataFieldMapRef.current.values()).find(f => f.key === key);
      const dataField = createDataFieldFromEntry(key, value, existingFieldWithKey?.id);
      newDataFields.push(dataField);
      usedIds.add(dataField.id);
    });

    // Clean up old IDs in ref map that are no longer present in editableRecording.data
    Array.from(dataFieldMapRef.current.keys()).forEach((storedId) => {
      if (!usedIds.has(storedId)) {
        dataFieldMapRef.current.delete(storedId);
      }
    });

    // Update dataFieldMapRef: add/update new fields with current values (map DataField.id to DataField object)
    newDataFields.forEach(field => dataFieldMapRef.current.set(field.id, field));
    return newDataFields;
  }, [editableRecording.data]);

  if (!selectedRecording) return null; // Should not happen if dialog is opened correctly

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditableRecording({ ...editableRecordingStore.get(), name: e.target.value });
  }, []); // Directly update the nanostore

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditableRecording({ ...editableRecordingStore.get(), type: e.target.value as RecordingType });
  }, []); // Directly update the nanostore

  const handleDataFieldChange = useCallback(
    (fieldId: string, fieldType: 'key' | 'value', newValue: string) => {
      const currentEditable = editableRecordingStore.get();
      const currentData = { ...currentEditable.data }; // Clone for mutation

      const fieldToModify = dataFieldMapRef.current.get(fieldId); // Find by its stable ID
      if (!fieldToModify) return;

      if (fieldType === 'key') {
        if (fieldToModify.key !== newValue) { // Only update if key actually changed
          // Remove old key, add new key with existing value
          delete currentData[fieldToModify.key];
          currentData[newValue] = JSON.parse(fieldToModify.value); // Use the original parsed value for the new key

          // Update ref map entry with new key, keeping the same ID
          const updatedField = { ...fieldToModify, key: newValue };
          // No need to delete/re-add, just update the existing entry in the map based on stable ID
          dataFieldMapRef.current.set(fieldId, updatedField);
        }
      } else { // fieldType === 'value'
        try {
          currentData[fieldToModify.key] = JSON.parse(newValue);
        } catch (e) {
          currentData[fieldToModify.key] = newValue;
        }
        // Update ref map entry with new value
        const updatedField = { ...fieldToModify, value: newValue };
        dataFieldMapRef.current.set(fieldId, updatedField);
      }
      setEditableRecording({ ...currentEditable, data: currentData });
    },
    [], // No dependencies needed for useCallback because it reads from editableRecordingStore.get() and dataFieldMapRef.current
  );

  const handleAddDataField = useCallback(() => {
    const currentEditable = editableRecordingStore.get();
    const currentData = { ...currentEditable.data }; // Clone for mutation

    let newKey = `newField`;
    let counter = 1;
    // Ensure the new key doesn't conflict with existing keys in the actual data object
    while (Object.prototype.hasOwnProperty.call(currentData, `${newKey}${counter}`)) {
      counter++;
    }
    newKey = `${newKey}${counter}`; 

    currentData[newKey] = ''; // Add an empty string value for the new field
    setEditableRecording({ ...currentEditable, data: currentData });
  }, []); // No dependencies needed

  const handleRemoveDataField = useCallback((fieldId: string) => {
    const currentEditable = editableRecordingStore.get();
    const currentData = { ...currentEditable.data }; // Clone for mutation

    const fieldToRemove = dataFieldMapRef.current.get(fieldId); // Find by its stable ID
    if (!fieldToRemove) return;

    delete currentData[fieldToRemove.key]; // Remove by the actual key from the data object

    dataFieldMapRef.current.delete(fieldId); // Remove from the ref map

    setEditableRecording({ ...currentEditable, data: currentData });
  }, []); // No dependencies needed

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      <TextField
        label="Name"
        name="name"
        value={editableRecording.name || ''}
        onChange={handleNameChange}
        fullWidth
        size="small"
      />
      <TextField
        label="Type"
        name="type"
        select
        value={editableRecording.type || 'screenRecord'}
        onChange={handleTypeChange}
        fullWidth
        size="small"
      >
        {RECORDING_TYPES.map((t) => (
          <MenuItem key={t} value={t}>
            {t}
          </MenuItem>
        ))}
      </TextField>

      <Divider />

      <Box>
        <Typography variant="body2" fontWeight="bold">
          Status:
        </Typography>
        <Typography variant="body2">{selectedRecording.status}</Typography>
      </Box>

      <Box>
        <Typography variant="body2" fontWeight="bold">
          Path:
        </Typography>
        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
          {selectedRecording.path}
        </Typography>
      </Box>

      <Box>
        <Typography variant="body2" fontWeight="bold">
          Created By:
        </Typography>
        <Typography variant="body2">{selectedRecording.createdById}</Typography>
      </Box>

      <Box>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          Data Fields:
        </Typography>
        {dataFieldsForRender.map((field) => (
          <Fragment key={field.id}> {/* Use stable field.id for key */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <TextField
                label="Key"
                value={field.key}
                onChange={(e) => handleDataFieldChange(field.id, 'key', e.target.value)}
                size="small"
                sx={{ flexGrow: 0.4 }}
              />
              <TextField
                label="Value"
                value={field.value}
                onChange={(e) => handleDataFieldChange(field.id, 'value', e.target.value)}
                size="small"
                sx={{ flexGrow: 0.6 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => handleRemoveDataField(field.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Fragment>
        ))}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddDataField}
          sx={{ mt: 2 }}
        >
          Add Data Field
        </Button>
      </Box>
    </Box>
  );
};
