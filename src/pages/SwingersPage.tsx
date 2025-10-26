import React from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import { Box, Typography } from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import LiveTvIcon from '@mui/icons-material/LiveTv'; // Using LiveTvIcon for streamers
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'; // Using PeopleAltIcon for subscribers

import {
  RoomList,
  RoomHeader,
  StreamerList, // Import StreamerList
  StreamerHeader, // Import StreamerHeader
  SubscriberList, // Import SubscriberList
  SubscriberHeader, // Import SubscriberHeader
} from '@/components/swingers';
import { DynamicMuiTabs, TabConfig } from '@/components/ui/tabs'; // Corrected import path for DynamicMuiTabs

/**
 * @interface SwingersPageProps
 * @description Props for the SwingersPage component. Currently empty as no external props are needed.
 */
interface SwingersPageProps {}

const SwingersPage: React.FC<SwingersPageProps> = () => {
  const tabsConfig: TabConfig[] = [
    {
      label: 'Rooms',
      icon: <MeetingRoomIcon />,
      content: (
        <Box className="flex flex-col gap-4 h-full py-4">
          <RoomList />
        </Box>
      ),
    },
    {
      label: 'Streamers',
      icon: <LiveTvIcon />,
      content: (
        <Box className="flex flex-col gap-4 h-full py-4">
          <StreamerList />
        </Box>
      ),
    },
    {
      label: 'Subscribers',
      icon: <PeopleAltIcon />,
      content: (
        <Box className="flex flex-col gap-4 h-full py-4">
          <SubscriberList />
        </Box>
      ),
    },
  ];

  return (
    <PageLayout
      body={
        <Box className="w-full max-w-screen-2xl mx-auto h-full p-0 pb-2">
          <DynamicMuiTabs
            tabs={tabsConfig}
            tabsClassName="bg-background-paper sticky top-0 z-10 shadow-sm  h-10 p-0 "
            tabPanelClassName="flex-grow p-0 overflow-y-auto"
          />
        </Box>
      }
      bodyPosition={'top'}
      centerBodyPostition={false}
      className="flex-grow" // Allow PageLayout to take full height
    />
  );
};

export default SwingersPage;
