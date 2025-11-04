import React, { useEffect, useState, useCallback, Fragment } from 'react';
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
  id: string;
  key: string;
  value: string; // Stringified value for text input
}

export const RecordingInfoDialogContent: React.FC<RecordingInfoDialogContentProps> = () => {
  const selectedRecording = useStore(selectedRecordingStore);
  const editableRecording = useStore(editableRecordingStore);

  // Local state for UI representation of data fields, kept in sync with editableRecordingStore.data
  const [localDataFields, setLocalDataFields] = useState<DataField[]>([]);

  // Effect to initialize local state from editableRecordingStore
  useEffect(() => {
    if (editableRecording) {
      const dataFields: DataField[] = Object.entries(editableRecording.data || {}).map(([key, value]) => ({
        id: nanoid(),
        key,
        // If it's a string, use it directly. Otherwise, stringify for display.
        // The parsing logic in updateDataInStore will handle conversion back.
        value: typeof value === 'string' ? value : JSON.stringify(value),
      }));
      setLocalDataFields(dataFields);
    }
  }, [editableRecording]); // Depend on editableRecording to re-initialize if it changes externally

  if (!selectedRecording) return null; // Should not happen if dialog is opened correctly

  // Function to reconstruct the data object from localDataFields and update the editableRecordingStore
  const updateDataInStore = useCallback((updatedDataFields: DataField[]) => {
    const reconstructedData: { [key: string]: any } = {};
    updatedDataFields.forEach((field) => {
      try {
        // Attempt to parse if it looks like JSON, otherwise keep as string
        reconstructedData[field.key] = JSON.parse(field.value);
      } catch (e) {
        reconstructedData[field.key] = field.value;
      }
    });
    setEditableRecording({ ...editableRecording, data: reconstructedData });
  }, [editableRecording]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newName = e.target.value;
    setEditableRecording({ ...editableRecording, name: newName });
  }, [editableRecording]);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as RecordingType;
    setEditableRecording({ ...editableRecording, type: newType });
  }, [editableRecording]);

  const handleDataFieldChange = useCallback(
    (id: string, field: 'key' | 'value', value: string) => {
      setLocalDataFields((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        );
        updateDataInStore(updated); // Update store immediately after local state change
        return updated;
      });
    },
    [updateDataInStore],
  );

  const handleAddDataField = useCallback(() => {
    setLocalDataFields((prev) => {
      const updated = [...prev, { id: nanoid(), key: '', value: '""' }];
      updateDataInStore(updated); // Update store immediately after local state change
      return updated;
    });
  }, [updateDataInStore]);

  const handleRemoveDataField = useCallback((id: string) => {
    setLocalDataFields((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      updateDataInStore(updated); // Update store immediately after local state change
      return updated;
    });
  }, [updateDataInStore]);

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
        value={editableRecording.type || ''}
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
        {localDataFields.map((field) => (
          <Fragment key={field.id}>
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
