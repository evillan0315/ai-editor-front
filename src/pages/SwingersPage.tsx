import React from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import PageHeader from '@/components/layouts/PageHeader';
import { SubscriberList, SubscriberHeader } from '@/components/swingers';

/**
 * @interface SwingersPageProps
 * @description Props for the SwingersPage component. Currently empty as no external props are needed.
 */
interface SwingersPageProps {}

/**
 * @component SwingersPage
 * @description A page component that displays a list of subscribers using the SubscriberList component.
 * It is wrapped in a PageLayout for consistent styling and provides a title for the page.
 */
const SwingersPage: React.FC<SwingersPageProps> = () => {
  return (
    <>
      <PageLayout
        header={<SubscriberHeader />}
        body={<SubscriberList />}
        footer={`Footer`}
        bodyPosition={'top'}
        centerBodyPostition={false}
      />
    </>
  );
};

export default SwingersPage;
