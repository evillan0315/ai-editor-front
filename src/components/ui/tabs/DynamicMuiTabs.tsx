import React, { useState, SyntheticEvent, ReactNode } from 'react';
import { Tabs, Tab, Box, Paper, useTheme } from '@mui/material';
import { TabPanel, a11yProps } from './TabPanel';

// --- Interfaces ---
/**
 * @interface TabConfig
 * @description Configuration for a single tab, including its label, icon, and content.
 * @property {string} label - The text label displayed on the tab.
 * @property {ReactNode} content - The content to be rendered when this tab is active.
 * @property {ReactNode} [icon] - Optional icon to display alongside the label.
 */
export interface TabConfig {
  label: string;
  content: ReactNode;
  icon?: ReactNode;
}

/**
 * @interface DynamicMuiTabsProps
 * @description Props for the DynamicMuiTabs component.
 * @property {TabConfig[]} tabs - An array of tab configurations to render.
 * @property {number} [initialTabIndex=0] - The index of the tab to be active initially.
 * @property {object} [tabsSx] - Custom Material UI sx prop for the Tabs component.
 * @property {object} [tabPanelSx] - Custom Material UI sx prop for the active TabPanel content wrapper.
 * @property {string} [tabsClassName] - Custom Tailwind CSS classes for the Tabs component.
 * @property {string} [tabPanelClassName] - Custom Tailwind CSS classes for the active TabPanel content wrapper.
 */
export interface DynamicMuiTabsProps {
  tabs: TabConfig[];
  initialTabIndex?: number;
  tabsSx?: object;
  tabPanelSx?: object;
  tabsClassName?: string;
  tabPanelClassName?: string;
}

// --- Styles ---
const dynamicTabsRootSx = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const tabsContainerSx = {
  borderBottom: 1,
  borderColor: 'divider'
};

export const DynamicMuiTabs: React.FC<DynamicMuiTabsProps> = ({
  tabs,
  initialTabIndex = 0,
  tabsSx,
  tabPanelSx,
  tabsClassName,
  tabPanelClassName,
}) => {
  const [value, setValue] = useState(initialTabIndex);
  const theme = useTheme();
  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={dynamicTabsRootSx} className="w-full h-full flex flex-col">
      <Paper sx={{ ...tabsContainerSx, ...tabsSx }} className={tabsClassName}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'start',
            gap: 0,
            mr: 1,
            pl: 1,
          }}
        >
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="dynamic tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              {...a11yProps(index)}
              sx={{
          flexGrow: 1, // Allow tabs to grow
          maxWidth: 'calc(100% - 160px)', // Reserve space for buttons
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.main,
          },
          '& .MuiTab-root': {
            color: theme.palette.text.secondary,
            minHeight: '48px',
            padding: '6px 12px',
            textTransform: 'none', // Keep text as is
            fontSize: '0.875rem',
            '&.Mui-selected': {
              color: theme.palette.text.primary,
              fontWeight: 'bold',
              backgroundColor: theme.palette.background.paper, // Differentiate active tab background
            },
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          },
        }}
            />
          ))}
        </Tabs>
        </Box>
      </Paper>
      {tabs.map((tab, index) => (
        <TabPanel
          key={index}
          value={value}
          index={index}
          sx={tabPanelSx}
          className={tabPanelClassName}
        >
          {tab.content}
        </TabPanel>
      ))}
    </Box>
  );
};
