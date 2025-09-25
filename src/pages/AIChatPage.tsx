import React from 'react';
import PageLayout from '@/components/PageLayout';
import AIPromptGenerator from '@/components/ai-tools/AIPromptGenerator';

const AIChatPage: React.FC = () => {
  return (
    <PageLayout body={<AIPromptGenerator />} />
  );
};

export default AIChatPage;