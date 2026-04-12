import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface MathRendererProps {
  content: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  // Clean LaTeX errors
  const cleanedContent = content
    .replace(/\\text\{dfrac\}/g, '\\frac')
    .replace(/\\dfrac/g, '\\frac')
    .replace(/\\text\{frac\}/g, '\\frac');
    
  return <MarkdownRenderer content={cleanedContent} />;
};

export default MathRenderer;
