import React from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import PageHeader from '@/components/layouts/PageHeader'; // Keep for header content
import {
  SubscriberList,
  SubscriberHeader,
  RoomList,
  RoomHeader,
  OpenViduSessionConnector,
} from '@/components/swingers';
import { Box, Typography } from '@mui/material';

/**
 * @interface SwingersPageProps
 * @description Props for the SwingersPage component. Currently empty as no external props are needed.
 */
interface SwingersPageProps {}

/**
 * @component SwingersPage
 * @description A page component that displays OpenVidu session connector, a list of rooms, and a list of subscribers.
 * It uses a flexible layout to arrange these components responsively.
 */
const SwingersPage: React.FC<SwingersPageProps> = () => {
  return (
    <PageLayout
      //header={<PageHeader title="Swingers Platform" subtitle="Connect, Explore, Engage" />}
      body={
        <Box className="flex flex-col lg:flex-row gap-6 p-6 w-full max-w-screen-2xl mx-auto h-full">
          <Box className="flex-1 min-w-0 flex flex-col gap-6">
            <OpenViduSessionConnector />
            <RoomList />
          </Box>

        </Box>
      }

      bodyPosition={'top'}
      centerBodyPostition={false}
    />
  );
};

export default SwingersPage;
