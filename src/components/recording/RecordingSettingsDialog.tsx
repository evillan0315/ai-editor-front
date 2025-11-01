import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useStore } from '@nanostores/react';
import { IRecorderSettings } from './types/recording';
import {
  recorderSettingsStore,
  availableAudioInputDevicesStore,
  availableVideoInputDevicesStore,
} from './stores/recordingStore';
import { DeviceDto } from '@/types/refactored/media'; // Import DeviceDto
import { hideDialog } from '@/stores/dialogStore'; // Import hideDialog to close the global dialog

interface RecordingSettingsDialogProps {
  // No more 'open' or 'onClose' props, as this component is the content
  // and its visibility is managed by GlobalDialog/dialogStore
}

const RESOLUTION_OPTIONS = ['1920x1080', '1280x720', '800x600'];
const FRAMERATE_OPTIONS = [15, 24, 30, 60];

export const RecordingSettingsDialog: React.FC<RecordingSettingsDialogProps> = () => {
  const currentSettings = useStore(recorderSettingsStore);
  const availableAudioInputDevices = useStore(availableAudioInputDevicesStore);
  const availableVideoInputDevices = useStore(availableVideoInputDevicesStore);

  const [formSettings, setFormSettings] = useState<IRecorderSettings>(currentSettings);

  useEffect(() => {
    // Reset form settings whenever the current settings in the store change
    // This ensures that if settings are loaded dynamically, the form reflects them
    setFormSettings(currentSettings);
  }, [currentSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormSettings((prev) => ({
      ...prev,
      [name]:
        name === 'screenFramerate' || name === 'cameraFramerate'
          ? Number(value)
          : value,
    }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSave = () => {
    recorderSettingsStore.set(formSettings);
    hideDialog(); // Close the global dialog after saving
  };

  const handleClose = () => {
    hideDialog(); // Close the global dialog without saving
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      <TextField
        label="Recording Name Prefix"
        name="namePrefix"
        value={formSettings.namePrefix}
        onChange={handleChange}
        fullWidth
        size="small"
        helperText="Prefix for all new recordings (e.g., 'codejector-recording')"
      />

      <Typography variant="h6" sx={{ mt: 2 }}>
        Screen Recording
      </Typography>
      <TextField
        label="Screen Resolution"
        name="screenResolution"
        select
        value={formSettings.screenResolution}
        onChange={handleChange}
        fullWidth
        size="small"
      >
        {RESOLUTION_OPTIONS.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Screen Framerate (FPS)"
        name="screenFramerate"
        type="number"
        select
        value={formSettings.screenFramerate}
        onChange={handleChange}
        fullWidth
        size="small"
      >
        {FRAMERATE_OPTIONS.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Screen Recording Audio
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={formSettings.enableScreenAudio}
            onChange={handleSwitchChange}
            name="enableScreenAudio"
          />
        }
        label="Enable Audio for Screen Recording"
      />
      {formSettings.enableScreenAudio && (
        <TextField
          label="Screen Audio Device"
          name="screenAudioDevice"
          select
          value={formSettings.screenAudioDevice}
          onChange={handleChange}
          fullWidth
          size="small"
          helperText="Specific audio input device (e.g., 'default', 'pulse', 'alsa_input...', '0' on macOS)"
        >
          {availableAudioInputDevices.map((device: DeviceDto) => (
            <MenuItem key={device.id} value={device.id}>
              {device.name} ({device.id})
            </MenuItem>
          ))}
        </TextField>
      )}

      <Typography variant="h6" sx={{ mt: 2 }}>
        Camera Recording
      </Typography>
      <TextField
        label="Camera Resolution"
        name="cameraResolution"
        select
        value={formSettings.cameraResolution}
        onChange={handleChange}
        fullWidth
        size="small"
      >
        {RESOLUTION_OPTIONS.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Camera Framerate (FPS)"
        name="cameraFramerate"
        type="number"
        select
        value={formSettings.cameraFramerate}
        onChange={handleChange}
        fullWidth
        size="small"
      >
        {FRAMERATE_OPTIONS.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Camera Video Device"
        name="cameraVideoDevice"
        select
        value={formSettings.cameraVideoDevice}
        onChange={handleChange}
        fullWidth
        size="small"
        helperText="Platform-specific video device identifier (e.g., '/dev/video0', '0' on macOS, 'Integrated Camera' on Windows)"
      >
        {availableVideoInputDevices.map((device: DeviceDto) => (
          <MenuItem key={device.id} value={device.id}>
            {device.name} ({device.id})
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Camera Audio Device"
        name="cameraAudioDevice"
        select
        value={formSettings.cameraAudioDevice}
        onChange={handleChange}
        fullWidth
        size="small"
        helperText="Platform-specific audio device identifier (e.g., 'alsa_input...', '0' on macOS, 'Microphone' on Windows)"
      >
        {availableAudioInputDevices.map((device: DeviceDto) => (
          <MenuItem key={device.id} value={device.id}>
            {device.name} ({device.id})
          </MenuItem>
        ))}
      </TextField>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 3 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save Settings
        </Button>
      </Box>
    </Box>
  );
};
