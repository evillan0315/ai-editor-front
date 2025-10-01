import React from 'react';
import { Icon } from '@iconify-icon/react';
import { Box, useTheme } from '@mui/material';

interface NamePrefixSvgIconProps {
  name: string;
  prefix: string; // Changed from IconifyIconPrefix to string
  color?: string;
  size?: number | string;
}

const NamePrefixSvgIcon: React.FC<NamePrefixSvgIconProps> = ({
  name,
  prefix,
  color,
  size = 24,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        color: color || theme.palette.text.primary,
      }}
    >
      <Icon icon={`${prefix}:${name}`} width={size} height={size} />
    </Box>
  );
};

export default NamePrefixSvgIcon;
