import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
  Grid,
} from '@mui/material';
import { JsonSchema } from '@/types/schema';

interface DynamicFormBuilderProps {
  schema: JsonSchema;
  initialData?: Record<string, any>;
  onFormChange?: (data: Record<string, any>) => void;
  // For recursive calls for nested objects to manage indentation/styling
  level?: number;
}

const DynamicFormBuilder: React.FC<DynamicFormBuilderProps> = ({
  schema,
  initialData = {},
  onFormChange,
  level = 0,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  useEffect(() => {
    // Initialize formData with defaults from schema and provided initialData
    const initial: Record<string, any> = {};
    if (schema.properties) {
      Object.keys(schema.properties).forEach((key) => {
        const prop = schema.properties![key];
        initial[key] = initialData[key] !== undefined ? initialData[key] : prop.default;
      });
    }
    setFormData(initial);
  }, [schema, initialData]);

  const handleChange = useCallback((key: string, value: any) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [key]: value };
      onFormChange?.(newFormData);
      return newFormData;
    });
  }, [onFormChange]);

  if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
    return (
      <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', ml: level * 2 }}>
        {level === 0 ? 'No schema properties to display a form.' : 'No properties for this object.'}
      </Typography>
    );
  }

  const renderField = (key: string, prop: JsonSchema) => {
    const value = formData[key] ?? '';
    const label = prop.title || key;
    const description = prop.description;
    const isRequired = schema.required?.includes(key);

    // Base styles for form elements for consistent spacing and width within the grid
    const baseFieldProps = {
      fullWidth: true,
      margin: "normal" as "normal", // Ensure correct type
      helperText: description,
      required: isRequired,
      className: "col-span-12", // Tailwind class for full width in a 12-column grid
    };

    switch (prop.type) {
      case 'string':
        if (prop.format === 'date') {
          return (
            <TextField
              key={key}
              label={label}
              type="date"
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              InputLabelProps={{ shrink: true }}
              {...baseFieldProps}
            />
          );
        }
        if (prop.enum) {
          return (
            <FormControl key={key} {...baseFieldProps} className="col-span-12">
              <InputLabel id={`${key}-select-label`} required={isRequired}>
                {label}
              </InputLabel>
              <Select
                labelId={`${key}-select-label`}
                id={`${key}-select`}
                value={value}
                label={label}
                onChange={(e) => handleChange(key, e.target.value)}
                required={isRequired}
              >
                {prop.enum.map((option: string) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              {description && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                  {description}
                </Typography>
              )}
            </FormControl>
          );
        }
        return (
          <TextField
            key={key}
            label={label}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            {...baseFieldProps}
          />
        );
      case 'number':
      case 'integer':
        return (
          <TextField
            key={key}
            label={label}
            type="number"
            value={value}
            onChange={(e) => handleChange(key, Number(e.target.value))}
            {...baseFieldProps}
          />
        );
      case 'boolean':
        return (
          <FormControlLabel
            key={key}
            control={
              <Checkbox
                checked={!!value} // Ensure boolean value
                onChange={(e) => handleChange(key, e.target.checked)}
                name={key}
              />
            }
            label={label}
            sx={{ mt: 2, mb: 1, ml: level * 2 }}
            className="col-span-12"
          />
        );
      case 'array':
        // For simplicity, treat arrays of strings as comma-separated values in a TextField.
        // A more advanced implementation would involve dynamically adding/removing items.
        // If prop.items defines a complex schema, this would need a more sophisticated sub-form.
        return (
          <TextField
            key={key}
            label={`${label} (comma-separated)`}
            value={Array.isArray(value) ? value.join(', ') : value}
            onChange={(e) =>
              handleChange(
                key,
                e.target.value
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter((s: string) => s !== '')
              )
            }
            {...baseFieldProps}
          />
        );
      case 'object':
        return (
          <Box
            key={key}
            sx={{
              mt: 2,
              mb: 2,
              pl: 2,
              borderLeft: 1,
              borderColor: 'divider',
            }}
            className="col-span-12"
          >
            <Typography variant="subtitle2" gutterBottom className="mb-2">
              {label}
            </Typography>
            <DynamicFormBuilder
              schema={prop}
              initialData={formData[key] || {}}
              onFormChange={(nestedData) => handleChange(key, nestedData)}
              level={level + 1}
            />
          </Box>
        );
      default:
        return (
          <Typography key={key} variant="body2" color="error" className="col-span-12">
            Unsupported type for {label}: {prop.type}
          </Typography>
        );
    }
  };

  return (
    <Box className="grid grid-cols-12 gap-4">
      {level === 0 && schema.title && (
        <Typography variant="h6" gutterBottom className="col-span-12">
          {schema.title}
        </Typography>
      )}
      {schema.description && level === 0 && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }} className="col-span-12">
          {schema.description}
        </Typography>
      )}

      {Object.keys(schema.properties).map((key) => (
        <React.Fragment key={key}>
          {renderField(key, schema.properties![key])}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default DynamicFormBuilder;
