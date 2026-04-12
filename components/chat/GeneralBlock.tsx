import React, { useState, useRef } from 'react';
import { Copy, Maximize2, Minimize2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import './GeneralBlock.css';

interface GeneralBlockProps {
  label?: string;      // "GENERAL", "EXAMPLE", etc.
  content: string;
  copyable?: boolean;
  expandable?: boolean;
}

const GeneralBlock: React.FC<GeneralBlockProps> = ({ 
  label = "GENERAL", 
  content, 
  copyable = true,
  expandable = true 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {expanded && (
        <div 
          className="fixed inset-0 bg-black/80 z-[999] backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        />
      )}
      <div className={`content-block ${expanded ? 'expanded' : ''}`}>
        {/* HEADER */}
        <div className="content-block-header">
          <div className="header-left">
            <span className="block-label">{label}</span>
          </div>
          <div className="header-actions">
            {copyable && (
              <button onClick={handleCopy} className="action-btn" title="Copy">
                {copied ? <Check size={14} className="text-[#10a37f]" /> : <Copy size={14} />}
              </button>
            )}
            {expandable && (
              <button onClick={() => setExpanded(!expanded)} className="action-btn" title={expanded ? "Minimize" : "Maximize"}>
                {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="content-block-body prose prose-invert max-w-none" ref={contentRef}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
            rehypePlugins={[rehypeKatex]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </>
  );
};

export default GeneralBlock;
