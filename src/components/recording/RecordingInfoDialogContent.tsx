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
  setSelectedRecording,
} from './stores/recordingStore';

interface RecordingInfoDialogContentProps {
  onClose: () => void; // To signal parent to close the dialog
  onUpdate: () => void; // To signal parent to save changes (parent will read from store)
}

const RECORDING_TYPES: RecordingType[] = ['screenRecord', 'screenShot', 'cameraRecord'];

interface DataField {
  id: string;
  key: string;
  value: string; // Stringified value for text input
}

export const RecordingInfoDialogContent: React.FC<RecordingInfoDialogContentProps> = ({
  onClose,
  onUpdate,
}) => {
  const selectedRecording = useStore(selectedRecordingStore);
  const editableRecording = useStore(editableRecordingStore);

  // Local state for form fields, especially for dynamic 'data' object
  const [formData, setFormData] = useState<Partial<RecordingItem & { dataFields: DataField[] }>>({
    name: '',
    type: '',
    dataFields: [],
  });

  useEffect(() => {
    if (selectedRecording) {
      const dataFields: DataField[] = Object.entries(selectedRecording.data || {}).map(([key, value]) => ({
        id: nanoid(),
        key,
        value: JSON.stringify(value), // Stringify complex values for display
      }));

      setFormData({
        name: selectedRecording.name,
        type: selectedRecording.type,
        dataFields,
      });
    }
  }, [selectedRecording]);

  if (!selectedRecording) return null; // Should not happen if dialog is opened correctly

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleDataFieldChange = useCallback(
    (id: string, field: 'key' | 'value', value: string) => {
      setFormData((prev) => ({
        ...prev,
        dataFields: prev.dataFields?.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ) || [],
      }));
    },
    [],
  );

  const handleAddDataField = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      dataFields: [...(prev.dataFields || []), { id: nanoid(), key: '', value: '""' }],
    }));
  }, []);

  const handleRemoveDataField = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      dataFields: prev.dataFields?.filter((item) => item.id !== id) || [],
    }));
  }, []);

  const handleSave = () => {
    // Reconstruct data object from dataFields
    const reconstructedData: { [key: string]: any } = {};
    formData.dataFields?.forEach((field) => {
      try {
        // Attempt to parse if it looks like JSON, otherwise keep as string
        reconstructedData[field.key] = JSON.parse(field.value);
      } catch (e) {
        reconstructedData[field.key] = field.value;
      }
    });

    // Update the editableRecordingStore with new name, type, and reconstructed data
    setEditableRecording({
      ...editableRecording,
      name: formData.name,
      type: formData.type as RecordingType,
      data: reconstructedData,
    });
    onUpdate(); // Signal parent to commit the update
  };

  const handleCancel = () => {
    // Reset editable state and close
    setSelectedRecording(null); // Clear selected recording
    setEditableRecording({}); // Clear editable form data
    onClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      <TextField
        label="Name"
        name="name"
        value={formData.name || ''}
        onChange={handleChange}
        fullWidth
        size="small"
      />
      <TextField
        label="Type"
        name="type"
        select
        value={formData.type || ''}
        onChange={handleChange}
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
        {formData.dataFields?.map((field) => (
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
