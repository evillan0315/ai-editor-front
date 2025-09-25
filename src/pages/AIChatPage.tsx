import React from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import AIPromptGenerator from '@/components/ai-tools/AIPromptGenerator';

const AIChatPage: React.FC = () => {
  return (
    <PageLayout
      header={<div />} // Empty header
      body={<div />}   // Empty body
      footer={<AIPromptGenerator />}
    />
  );
};

export default AIChatPage;