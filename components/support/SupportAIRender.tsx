import React, { memo } from 'react';
import SupportMarkdownRenderer from './SupportMarkdownRenderer';

interface MarkdownRendererProps {
  content: string;
}

const SupportAIRender: React.FC<MarkdownRendererProps> = memo(({ content }) => {
  // Clean up any action tags and empty bold markers that AI might leave
  const cleanContent = content
    .replace(/\[ACTION:[^\]]+\]/g, '')
    .replace(/\*\*\s*\*\*/g, '')
    .replace(/\*{3,}/g, '**')
    .trim();
    
  return <SupportMarkdownRenderer content={cleanContent} />;
});

export default SupportAIRender;
