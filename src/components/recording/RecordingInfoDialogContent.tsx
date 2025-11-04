import React, { useEffect, useState, useCallback, Fragment, useRef } from 'react';
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

  // Local state for UI representation of form fields, initialized from editableRecordingStore.
  // Changes to these states update the global store via useEffects.
  const [localDraftName, setLocalDraftName] = useState<string>(editableRecording.name || '');
  const [localDraftType, setLocalDraftType] = useState<RecordingType>(editableRecording.type || 'screenRecord');
  const [localDraftDataFields, setLocalDraftDataFields] = useState<DataField[]>([]);

  // useRef to store a map of keys to DataField objects to maintain stable IDs for data fields.
  // This prevents React from re-mounting inputs unnecessarily when the 'data' object reference changes.
  const dataFieldMapRef = useRef<Map<string, DataField>>(new Map());

  // Effect to initialize local draft states when editableRecording changes from parent
  useEffect(() => {
    if (editableRecording) {
      setLocalDraftName(editableRecording.name || '');
      setLocalDraftType(editableRecording.type || 'screenRecord');

      const newDataFields: DataField[] = [];
      const currentKeysInStore = new Set<string>();

      // Populate newDataFields, reusing existing IDs from dataFieldMapRef if keys match
      Object.entries(editableRecording.data || {}).forEach(([key, value]) => {
        currentKeysInStore.add(key);
        const existingDataField = dataFieldMapRef.current.get(key);
        const dataField = createDataFieldFromEntry(key, value, existingDataField?.id);
        newDataFields.push(dataField);
      });

      // Clean up old IDs that are no longer present in editableRecording.data
      dataFieldMapRef.current.forEach((_dataField, storedKey) => {
        if (!currentKeysInStore.has(storedKey)) {
          dataFieldMapRef.current.delete(storedKey);
        }
      });

      // Update dataFieldMapRef: add/update new fields with current values
      const newMap = new Map<string, DataField>();
      newDataFields.forEach(field => newMap.set(field.key, field));
      dataFieldMapRef.current = newMap; // Replace the ref map with the new one

      setLocalDraftDataFields(newDataFields);
    }
  }, [editableRecording]); // Depend on editableRecording to re-initialize if it changes externally

  // Effect to update the nanostore when localDraftName or localDraftType changes (deferred update)
  useEffect(() => {
    setEditableRecording({
      ...editableRecording,
      name: localDraftName,
      type: localDraftType,
    });
  }, [localDraftName, localDraftType]); // Only update store when name/type changes locally

  // Effect to update the nanostore when localDraftDataFields changes (deferred update)
  useEffect(() => {
    const reconstructedData: { [key: string]: any } = {};
    localDraftDataFields.forEach((field) => {
      // Ensure unique keys when reconstructing. Empty keys are skipped.
      if (field.key) {
        try {
          reconstructedData[field.key] = JSON.parse(field.value);
        } catch (e) {
          reconstructedData[field.key] = field.value;
        }
      }
    });
    setEditableRecording({ ...editableRecording, data: reconstructedData });
  }, [localDraftDataFields]); // Depend on localDraftDataFields to update the store for data

  if (!selectedRecording) return null; // Should not happen if dialog is opened correctly

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocalDraftName(e.target.value);
  }, []); // Updates local state

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalDraftType(e.target.value as RecordingType);
  }, []); // Updates local state

  const handleDataFieldChange = useCallback(
    (idToUpdate: string, field: 'key' | 'value', newValue: string) => {
      setLocalDraftDataFields((prev) => {
        const updated = prev.map((item) => {
          if (item.id === idToUpdate) {
            // If key is changed, we need to handle ref map update carefully
            if (field === 'key') {
              // Remove old key from ref map and add new one
              dataFieldMapRef.current.delete(item.key);
              const newItem = { ...item, [field]: newValue };
              dataFieldMapRef.current.set(newValue, newItem); 
              return newItem;
            } else {
              const newItem = { ...item, [field]: newValue };
              dataFieldMapRef.current.set(item.key, newItem); // Update existing field in ref map
              return newItem;
            }
          }
          return item;
        });
        return updated;
      });
    },
    [],
  );

  const handleAddDataField = useCallback(() => {
    setLocalDraftDataFields((prev) => {
      // Generate a unique key for the new field, ensuring it doesn't conflict with existing keys
      let newKey = `newField`;
      let counter = 1;
      while (dataFieldMapRef.current.has(`${newKey}${counter}`))
      {
        counter++;
      }
      newKey = `${newKey}${counter}`;

      const newField = createDataFieldFromEntry(newKey, '""'); // Default to empty string JSON representation
      dataFieldMapRef.current.set(newKey, newField); // Add to ref map
      return [...prev, newField];
    });
  }, []);

  const handleRemoveDataField = useCallback((idToRemove: string) => {
    setLocalDraftDataFields((prev) => {
      const updated = prev.filter((item) => {
        if (item.id === idToRemove) {
          dataFieldMapRef.current.delete(item.key); // Remove from ref map
          return false;
        }
        return true;
      });
      return updated;
    });
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      <TextField
        label="Name"
        name="name"
        value={localDraftName}
        onChange={handleNameChange}
        fullWidth
        size="small"
      />
      <TextField
        label="Type"
        name="type"
        select
        value={localDraftType}
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
        {localDraftDataFields.map((field) => (
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
