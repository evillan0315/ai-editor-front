import React from 'react';
import PageLayout from '@/components/PageLayout';
import LlmGenerationContent from '@/components/LlmGenerationContent';

const LlmGenerationPage: React.FC = () => {
  return <PageLayout body={<LlmGenerationContent />} />;
};

export default LlmGenerationPage;
