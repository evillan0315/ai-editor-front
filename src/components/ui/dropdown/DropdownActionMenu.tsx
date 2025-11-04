import React, { useState, MouseEvent } from 'react';
import { Menu, MenuItem, IconButton, Typography, Box } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { GlobalAction } from './types/app';
interface DropdownActionMenuProps {
  /**
   * An array of GlobalAction objects to be displayed as menu items.
   * Each action defines a label, an optional icon, and the function to execute.
   */
  actions: GlobalAction[];
  /**
   * Optional custom trigger element for the menu.
   * If not provided, a default IconButton with MoreVertIcon will be used.
   * If provided, it must be a valid React element that accepts an `onClick` prop.
   */
  menuTrigger?: React.ReactElement; // Explicitly ReactElement to ensure onClick is supported
  /**
   * Optional props to pass to the default IconButton trigger.
   * Only applicable if `menuTrigger` is not provided.
   */
  iconButtonProps?: React.ComponentProps<typeof IconButton>;
  /**
   * Optional props to pass to the Material-UI Menu component.
   */
  menuProps?: React.ComponentProps<typeof Menu>;
  /**
   * Optional ID for the Menu component for accessibility/testing.
   */
  id?: string;
}
/**
 * `DropdownActionMenu` is a reusable UI component that displays a Material-UI dropdown menu
 * with a list of actions. It can be triggered by a default `MoreVertIcon` button or a custom element.
 * Each menu item corresponds to a `GlobalAction`, executing its `action` callback upon click.
 *
 * @param {DropdownActionMenuProps} props - The props for the component.
 */
const DropdownActionMenu: React.FC<DropdownActionMenuProps> = ({
  actions,
  menuTrigger,
  iconButtonProps,
  menuProps,
  id = 'dropdown-action-menu',
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  const handleMenuItemClick = (actionFn: () => void) => {
    actionFn(); // Execute the action provided by the GlobalAction
    handleCloseMenu(); // Close the menu after action
  };
  return (
    <Box className="flex items-center">
      {menuTrigger ? (
        // Render custom trigger if provided
        React.cloneElement(menuTrigger as React.ReactElement, { onClick: handleOpenMenu, ...iconButtonProps })
      ) : (
        // Default IconButton trigger
        <IconButton
          aria-label="more"
          aria-controls={open ? id : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
          onClick={handleOpenMenu}
          size="small"
          {...iconButtonProps}
        >
          <MoreVertIcon />
        </IconButton>
      )}
      <Menu
        id={id}
        MenuListProps={{
          'aria-labelledby': `${id}-button`,
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        PaperProps={{
          style: {
            maxHeight: 48 * 4.5, // Approx 4.5 items to show before scroll
            minWidth: '150px',
          },
        }}
        {...menuProps}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={action.id || `action-${index}`}
            onClick={() => handleMenuItemClick(action.action)}
            disabled={action.disabled}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            title={action.tooltip || action.label}
          >
            {action.icon && <Box sx={{ display: 'flex', alignItems: 'center' }}>{action.icon}</Box>}
            <Typography variant="body2">{action.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
export default DropdownActionMenu;
