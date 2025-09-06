import React from 'react';
import MuiTextField, { TextFieldProps } from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';

const TextField: React.FC<TextFieldProps> = (props) => {
  const theme = useTheme();

  return (
    <MuiTextField
      {...props}
      fullWidth
      margin={props.margin || 'normal'} // Allow overriding default margin
      InputLabelProps={{
        style: { color: theme.palette.text.secondary },
        ...props.InputLabelProps?.style,
      }}
      InputProps={{ style: { color: theme.palette.text.primary }, ...props.InputProps?.style }}
      sx={{
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: theme.palette.divider,
          },
          '&:hover fieldset': {
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
          },
        },
        ...props.sx,
      }}
    />
  );
};

export default TextField;
