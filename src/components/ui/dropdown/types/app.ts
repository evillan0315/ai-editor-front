import { SvgIconProps, ButtonProps } from '@mui/material';
import { ReactNode } from 'react';

/**
 * @interface GlobalAction
 * @description Defines a standardized structure for actions used across the application,
 *              especially for components like `GlobalActionButton` and `DropdownActionMenu`.
 * @property {string} id - A unique identifier for the action.
 * @property {string} label - The text label displayed for the action.
 * @property {() => void} action - The function to execute when the action is triggered.
 * @property {React.ReactElement<SvgIconProps>} [icon] - Optional Material Icon component to display with the action.
 * @property {ButtonProps['color']} [color] - Optional color variant for the action (e.g., 'primary', 'error').
 * @property {ButtonProps['variant']} [variant] - Optional visual variant for the action (e.g., 'contained', 'outlined').
 * @property {boolean} [disabled] - Optional flag to disable the action.
 * @property {string} [tooltip] - Optional tooltip text to display on hover.
 */
export interface GlobalAction {
  id: string; // Unique identifier for the action
  label: string; // Text label for the action
  action: () => void; // Function to execute when the action is triggered
  icon?: React.ReactElement<SvgIconProps>; // Optional icon for the action
  color?: ButtonProps['color']; // Color variant for MUI Button (e.g., 'primary', 'error')
  variant?: ButtonProps['variant']; // Variant for MUI Button (e.g., 'contained', 'outlined', 'text')
  disabled?: boolean; // Whether the action is disabled
  tooltip?: string; // Tooltip text for the action
}

// Add other app-wide types here as needed
