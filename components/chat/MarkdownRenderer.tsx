import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkEmoji from 'remark-emoji';
import remarkFootnotes from 'remark-footnotes';
import remarkDefinitionList from 'remark-definition-list';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'motion/react';
import ProfessionalTable from './ProfessionalTable';
import { formatUnityDevText } from '../../utils/textSanitizer';
import CodeBlock from './CodeBlock';
import GeneralBlock from './GeneralBlock';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
}

// Helper to determine style based on table content (Deterministic & Context-Aware)
const getStyleForTable = (node: any): 'minimal' | 'tech' | 'grid' | 'comparison' | 'corporate' | 'modern' | 'colorful' | 'dark' | 'gradient' | 'striped' => {
  try {
    // Extract text content from the table to use for analysis
    let tableText = "";
    
    const extractText = (n: any) => {
      if (n.value) tableText += n.value;
      if (n.children) n.children.forEach(extractText);
    };
    extractText(node);
    
    const lowerText = tableText.toLowerCase();

    if (lowerText.includes('vs') || lowerText.includes('comparison') || lowerText.includes('pros') || lowerText.includes('cons')) return 'comparison';
    if (lowerText.includes('spec') || lowerText.includes('cpu') || lowerText.includes('ram') || lowerText.includes('version') || lowerText.includes('api') || lowerText.includes('code')) return 'tech';
    if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('$') || lowerText.includes('id') || lowerText.includes('qty')) return 'grid';
    if (lowerText.includes('plan') || lowerText.includes('date') || lowerText.includes('schedule') || lowerText.includes('status') || lowerText.includes('manager')) return 'corporate';
    if (lowerText.includes('modern') || lowerText.includes('clean') || lowerText.includes('minimalist')) return 'modern';
    if (lowerText.includes('color') || lowerText.includes('bright') || lowerText.includes('vibrant')) return 'colorful';
    if (lowerText.includes('dark') || lowerText.includes('night') || lowerText.includes('black')) return 'dark';
    if (lowerText.includes('gradient') || lowerText.includes('fancy') || lowerText.includes('card')) return 'gradient';
    if (lowerText.includes('striped') || lowerText.includes('zebra') || lowerText.includes('alternate')) return 'striped';

    return 'minimal';
  } catch (e) {
    return 'minimal';
  }
};

export const markdownComponents = {
  // Text styles
  strong: ({node, ...props}: any) => <strong className="font-extrabold text-inherit" {...props} />,
  em: ({node, ...props}: any) => <em className="italic" {...props} />,
  del: ({node, ...props}: any) => <del className="line-through opacity-70" {...props} />,
  ins: ({node, ...props}: any) => <ins className="underline decoration-emerald-500/50 underline-offset-4" {...props} />,
  u: ({node, ...props}: any) => <u className="underline underline-offset-2" {...props} />,
  mark: ({node, ...props}: any) => <mark className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 shadow-[0_0_15px_rgba(16,163,127,0.2)]" {...props} />,
  small: ({node, ...props}: any) => <small className="text-xs opacity-70" {...props} />,
  sub: ({node, ...props}: any) => <sub className="align-sub text-[0.75em]" {...props} />,
  sup: ({node, ...props}: any) => <sup className="align-super text-[0.75em]" {...props} />,
  
  // Headers
  h1: ({node, ...props}: any) => <h1 className="text-4xl font-extrabold mt-8 mb-4 tracking-tight" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-3xl font-extrabold mt-6 mb-3 tracking-tight" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-2xl font-extrabold mt-5 mb-2 tracking-tight" {...props} />,
  h4: ({node, ...props}: any) => <h4 className="text-xl font-extrabold mt-4 mb-2 tracking-tight" {...props} />,
  h5: ({node, ...props}: any) => <h5 className="text-lg font-extrabold mt-3 mb-1 tracking-tight" {...props} />,
  h6: ({node, ...props}: any) => <h6 className="text-base font-extrabold mt-2 mb-1 tracking-tight uppercase" {...props} />,

  // Custom Tags (Colorful Text, Badges, Boxes, Gradient)
  'underline': ({node, ...props}: any) => <u className="underline underline-offset-2" {...props} />,
  'highlight': ({node, ...props}: any) => <mark className="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded" {...props} />,
  'red': ({node, ...props}: any) => <span className="text-red-500 font-medium" {...props} />,
  'green': ({node, ...props}: any) => <span className="text-green-500 font-medium" {...props} />,
  'blue': ({node, ...props}: any) => <span className="text-blue-500 font-medium" {...props} />,
  'yellow': ({node, ...props}: any) => <span className="text-yellow-500 font-medium" {...props} />,
  'purple': ({node, ...props}: any) => <span className="text-purple-500 font-medium" {...props} />,
  
  'badge': ({node, ...props}: any) => <span className="badge" {...props} />,
  'badge-success': ({node, ...props}: any) => <span className="badge badge-success" {...props} />,
  'badge-pending': ({node, ...props}: any) => <span className="badge badge-pending" {...props} />,
  'badge-failed': ({node, ...props}: any) => <span className="badge badge-failed" {...props} />,
  'badge-warning': ({node, ...props}: any) => <span className="badge badge-warning" {...props} />,
  'badge-tip': ({node, ...props}: any) => <span className="badge badge-tip" {...props} />,
  'badge-alert': ({node, ...props}: any) => <span className="badge badge-alert" {...props} />,

  'info': ({node, ...props}: any) => <div className="box box-info" {...props} />,
  'info-box': ({node, ...props}: any) => <div className="box box-info" {...props} />,
  'warning-box': ({node, ...props}: any) => <div className="box box-warning" {...props} />,
  'success-box': ({node, ...props}: any) => <div className="box box-success" {...props} />,
  'error-box': ({node, ...props}: any) => <div className="box box-error" {...props} />,
  'note-box': ({node, ...props}: any) => <div className="box box-note" {...props} />,
  'tip-box': ({node, ...props}: any) => <div className="box box-tip" {...props} />,
  'glass-box': ({node, ...props}: any) => <div className="box box-glass" {...props} />,
  'video-card': (props: any) => {
    const { id, title, thumbnail, channel, duration } = props;
    return (
      <div 
        className="bg-zinc-900/80 border border-white/10 rounded-xl overflow-hidden my-4 cursor-pointer hover:border-emerald-500/50 transition-all group active:scale-[0.98]"
        onClick={() => window.dispatchEvent(new CustomEvent('play-video', { detail: { id, title, thumbnail, channel, duration } }))}
      >
        <div className="relative aspect-video">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
            {duration}
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white ml-1"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        </div>
        <div className="p-3">
          <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">{title}</h4>
          <p className="text-xs text-zinc-400 mt-1">{channel}</p>
        </div>
      </div>
    );
  },
  'bento-box': ({node, ...props}: any) => <div className="box box-bento" {...props} />,
  
  'details': ({node, ...props}: any) => (
    <details className="accordion group my-6 border border-white/10 rounded-xl overflow-hidden bg-zinc-900/40 backdrop-blur-sm transition-all hover:border-emerald-500/30" {...props} />
  ),
  'summary': ({node, ...props}: any) => (
    <summary className="px-4 py-3 font-bold cursor-pointer list-none flex items-center justify-between hover:bg-white/5 transition-colors select-none">
      <span className="flex items-center gap-2">
        <svg className="w-4 h-4 text-emerald-500 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg>
        {props.children}
      </span>
    </summary>
  ),

  'progress-bar': (props: any) => {
    const { percent = 0, label = "" } = props;
    return (
      <div className="my-4">
        {label && <div className="text-xs font-bold text-zinc-400 mb-1 flex justify-between"><span>{label}</span><span>{percent}%</span></div>}
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,163,127,0.4)]"
          />
        </div>
      </div>
    );
  },

  'timeline-item': (props: any) => {
    const { date, content } = props;
    return (
      <div className="relative pl-8 pb-6 border-l border-emerald-500/30 last:border-0 last:pb-0">
        <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,163,127,0.5)]" />
        <div className="text-xs font-bold text-emerald-400 mb-1">{date}</div>
        <div className="text-sm text-zinc-300">{content}</div>
      </div>
    );
  },
  
  'gradient-text': ({node, ...props}: any) => <span className="gradient-text" {...props} />,

  'ascii-art': ({node, ...props}: any) => <div className="ascii-art" {...props} />,

  // Icons with text
  'important': ({node, ...props}: any) => <span className="icon-text"><span className="icon">📌</span> <span className="font-bold">Important:</span> <span {...props} /></span>,
  'pro-tip': ({node, ...props}: any) => <span className="icon-text"><span className="icon">💡</span> <span className="font-bold">Pro tip:</span> <span {...props} /></span>,
  'featured': ({node, ...props}: any) => <span className="icon-text"><span className="icon">⭐</span> <span className="font-bold">Featured:</span> <span {...props} /></span>,
  'popular': ({node, ...props}: any) => <span className="icon-text"><span className="icon">🔥</span> <span className="font-bold">Popular:</span> <span {...props} /></span>,
  'new': ({node, ...props}: any) => <span className="icon-text"><span className="icon">🚀</span> <span className="font-bold">New:</span> <span {...props} /></span>,
  'updated': ({node, ...props}: any) => <span className="icon-text"><span className="icon">✨</span> <span className="font-bold">Updated:</span> <span {...props} /></span>,

  // Lists
  ul: ({node, ...props}: any) => <ul className="list-disc pl-6 my-4 space-y-1" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 my-4 space-y-1" {...props} />,
  li: ({node, ...props}: any) => <li className="leading-relaxed" {...props} />,

  // Task lists
  input: ({node, ...props}: any) => {
    if (props.type === 'checkbox') {
      return <input type="checkbox" checked={props.checked} readOnly className="mr-2 accent-[#10a37f] cursor-default" />;
    }
    return <input {...props} />;
  },

  // Code
  code: ({node, inline, className, children, ...props}: any) => {
    const match = /language-(\w+(?:-\w+)*)/.exec(className || '');
    const language = match ? match[1] : '';
    
    if (language.startsWith('general-block-')) {
      const label = language.replace('general-block-', '');
      return <GeneralBlock label={label} content={String(children).replace(/\n$/, '')} />;
    }
    
    return !inline ? (
      <CodeBlock language={language} code={String(children).replace(/\n$/, '')} />
    ) : (
      <span className="inline-flex items-center gap-1 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md group/inline">
        <code className="font-mono text-[0.9em] text-[#10a37f] dark:text-[#10a37f]" {...props}>
          {children}
        </code>
        <button 
          onClick={() => navigator.clipboard.writeText(String(children))}
          className="opacity-0 group-hover/inline:opacity-100 transition-opacity text-gray-500 hover:text-[#10a37f] cursor-pointer"
          title="Copy"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path></svg>
        </button>
      </span>
    );
  },

  // Blockquotes
  blockquote: ({node, ...props}: any) => (
    <blockquote className="border-l-4 border-emerald-500 pl-4 my-6 italic text-zinc-300 bg-emerald-500/5 py-4 pr-4 rounded-r-lg shadow-inner" {...props} />
  ),

  // Horizontal rule
  hr: ({node, ...props}: any) => <hr className="my-8 border-none h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" {...props} />,

  // Links
  a: ({node, href, children, ...props}: any) => (
    <span className="inline-flex items-center gap-1 group/link">
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#10a37f] hover:underline font-medium transition-colors" {...props}>
        {children}
      </a>
      <button 
        onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(href); }}
        className="opacity-0 group-hover/link:opacity-100 transition-opacity text-gray-500 hover:text-[#10a37f] cursor-pointer"
        title="Copy URL"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path></svg>
      </button>
    </span>
  ),

  // Images
  img: ({node, ...props}: any) => {
    if (!props.src) return null;
    return (
      <span className="image-container block my-6 group">
        <img 
          {...props} 
          className="markdown-image max-w-full h-auto rounded-xl shadow-2xl border border-white/10 transition-transform duration-300 group-hover:scale-[1.01]" 
          loading="lazy" 
        />
        <a 
          href={props.src} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="download-image-btn mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#10a37f] hover:bg-[#0d8a6c] text-white rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-[#10a37f]/20"
        >
          View Full Size
        </a>
      </span>
    );
  },

  // Paragraph (Changed to div to prevent hydration errors with nested blocks)
  p: ({node, ...props}: any) => <div className="my-4 leading-relaxed whitespace-pre-wrap" {...props} />,

  // Tables (Keep advanced logic)
  table: ({ node, ...props }: any) => {
    const tableStyle = getStyleForTable(node);
    return (
      <div className="table-scroll-wrapper my-8 overflow-x-auto rounded-xl border border-white/10 shadow-xl">
        <ProfessionalTable style={tableStyle} {...props} />
      </div>
    );
  },

  // Definition lists
  dl: ({node, ...props}: any) => <dl className="my-6 space-y-4" {...props} />,
  dt: ({node, ...props}: any) => <dt className="font-bold text-lg text-[#10a37f]" {...props} />,
  dd: ({node, ...props}: any) => <dd className="ml-6 text-gray-600 dark:text-gray-400" {...props} />,
};

const remarkPluginsList = [
  remarkGfm,
  remarkEmoji,
  remarkFootnotes,
  remarkDefinitionList,
  remarkBreaks,
  remarkMath,
];

const rehypePluginsList: any = [rehypeRaw, rehypeKatex];

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  
  // Helper to process content and replace custom image tags
  const processContent = (text: string) => {
    // 0.5 Apply UnityDev Ultra-Cleaner (Sanitizer Script)
    let processed = formatUnityDevText(text);

    // 0.8 Normalize all math delimiters to standard $$ and $
    // This fixes mixed delimiters like \[ ... $$ and ensures remark-math recognizes them
    processed = processed.replace(/\\\[/g, '$$$$');
    processed = processed.replace(/\\\]/g, '$$$$');
    processed = processed.replace(/\\\(/g, '$');
    processed = processed.replace(/\\\)/g, '$');

    // 0.9 Fix unclosed block math delimiters (crucial for streaming)
    const countDoubleDollars = (processed.match(/\$\$/g) || []).length;
    if (countDoubleDollars % 2 !== 0) {
      processed += '\n$$';
    }

    // 0.95 Fix unclosed code blocks (crucial for streaming)
    const countBackticks = (processed.match(/```/g) || []).length;
    if (countBackticks % 2 !== 0) {
      processed += '\n```';
    }

    // Protect math and code blocks from being mangled by regexes
    const protectedBlocks: string[] = [];
    
    // Protect ``` ... ```
    processed = processed.replace(/```[\s\S]*?```/g, (match) => {
      protectedBlocks.push(match);
      return `__CODE_BLOCK_${protectedBlocks.length - 1}__`;
    });

    // Protect $$ ... $$
    processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
      protectedBlocks.push(match);
      return `__MATH_BLOCK_${protectedBlocks.length - 1}__`;
    });
    
    // Protect $ ... $
    processed = processed.replace(/\$([^\$\n]+?)\$/g, (match) => {
      protectedBlocks.push(match);
      return `__MATH_INLINE_${protectedBlocks.length - 1}__`;
    });

    // 1. Remove <think> tags and their content entirely
    processed = processed.replace(/<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi, '');
    // Also remove unclosed <think> at the end of the text (during streaming)
    processed = processed.replace(/<(think|thinking|reasoning)>[\s\S]*$/i, '');

    // 2. Selective HTML Stripper:
    // We want to strip common HTML tags that the AI might hallucinate (like <strong>, <span>, etc.)
    // but PRESERVE our custom premium tags (like <red>, <badge-success>, etc.)
    // List of tags to preserve (must match markdownComponents keys)
    const preservedTags = [
      'red', 'green', 'blue', 'yellow', 'purple', 
      'badge', 'badge-success', 'badge-pending', 'badge-failed', 'badge-warning', 'badge-tip', 'badge-alert',
      'info', 'info-box', 'warning-box', 'success-box', 'error-box', 'note-box', 'tip-box', 'glass-box',
      'general-block',
      'video-card', 'bento-box', 'gradient-text', 'ascii-art',
      'important', 'pro-tip', 'featured', 'popular', 'new', 'updated',
      'ins', 'del', 'mark', 'small', 'sub', 'sup', 'details', 'summary', 'progress-bar', 'timeline-item'
    ];

    // Regex to match any HTML tag
    processed = processed.replace(/<\/?([a-z0-9-]+)[^>]*>/gi, (match, tagName) => {
      // If it's a preserved tag, keep it
      if (preservedTags.includes(tagName.toLowerCase())) {
        return match;
      }
      // Otherwise, strip it (return empty string)
      return '';
    });

    processed = processed.replace(
      /\[GENERATED_IMAGE:([^\]]+)\]/g, 
      (match, content) => {
        if (content.startsWith('data:image') || (!content.startsWith('http') && content.length > 200)) {
           const src = content.startsWith('data:image') ? content : `data:image/jpeg;base64,${content}`;
           return `\n\n![Generated Image](${src})\n\n`;
        }
        return `\n\n![Generated Image](${content})\n\n`;
      }
    );

    // Fix missing newline after long sequence of dashes or underscores
    processed = processed.replace(/([-]{10,}|[_]{10,})([^\n])/g, '$1\n$2');

    // Fix bold-italic formatting (handles ***, and spaces inside markers, including multiline)
    processed = processed.replace(/\*\*\*\s*([\s\S]*?)\s*\*\*\*/g, '<strong><em>$1</em></strong>');

    // Remove triple asterisks that might be wrapping the table
    processed = processed.replace(/\*\*\*\s*\|/gi, '|');
    processed = processed.replace(/(\|[\s\S]*?\|)\s*\*\*\*/g, '$1');

    // Fix bold formatting (handles **, and spaces inside markers, including multiline)
    processed = processed.replace(/\*\*\s*([\s\S]*?)\s*\*\*/g, '<strong>$1</strong>');

    // 3. Advanced Text Formatting:
    // ==text== -> <mark>text</mark>
    processed = processed.replace(/==([\s\S]*?)==/g, '<mark>$1</mark>');
    // ~text~ -> <sub>text</sub>
    processed = processed.replace(/~([^\s~]+)~/g, '<sub>$1</sub>');
    // ^text^ -> <sup>text</sup>
    processed = processed.replace(/\^([^\s^]+)\^/g, '<sup>$1</sup>');

    // 4. Progress Bars: [████████░░] 80%
    processed = processed.replace(/\[([█░]+)\]\s*(\d+)%\s*(.*)/g, (match, bar, percent, label) => {
      return `<progress-bar percent="${percent}" label="${label.trim()}"></progress-bar>`;
    });

    // 5. Timelines: 2023 ──▶ Started project
    processed = processed.replace(/^(\d{4})\s*[─▶]+\s*(.*)$/gm, (match, date, content) => {
      return `<timeline-item date="${date}" content="${content.trim()}"></timeline-item>`;
    });
    
    // Remove empty bold markers that might be left behind after stripping ACTION tags
    processed = processed.replace(/<strong>\s*<\/strong>/g, '');

    // AUTO-FIX: If AI wraps tables or headings inside custom HTML boxes, strip the box so markdown works
    const customBoxes = ['info-box', 'warning-box', 'success-box', 'error-box', 'note-box', 'tip-box', 'glass-box', 'bento-box', 'info'];
    customBoxes.forEach(box => {
      const regex = new RegExp(`<${box}>([\\s\\S]*?)<\\/${box}>`, 'gi');
      processed = processed.replace(regex, (match, innerContent) => {
        // If the inner content contains a markdown table (|), heading (#), or math ($)
        if (innerContent.includes('|') || innerContent.includes('#') || innerContent.includes('$')) {
          return `\n\n${innerContent}\n\n`; // Strip the box, keep the content
        }
        return match;
      });
    });

    // Add support for [section] tags
    processed = processed.replace(/\[section\]([\s\S]*?)\[\/section\]/g, '<div class="box box-glass my-6 p-6 border-l-4 border-emerald-500">$1</div>');

    // Convert general-block to a custom code block so we can render it with its own ReactMarkdown instance
    // This ensures math, tables, and all markdown works perfectly inside it.
    processed = processed.replace(/<general-block(?:[^>]*label="([^"]*)")?[^>]*>([\s\S]*?)<\/general-block>/gi, (match, label, content) => {
      return `\n\`\`\`general-block-${label || 'GENERAL'}\n${content.trim()}\n\`\`\`\n`;
    });
    
    // Handle unclosed general-block during streaming so it doesn't cut off text
    processed = processed.replace(/<general-block(?:[^>]*label="([^"]*)")?[^>]*>([\s\S]*)$/gi, (match, label, content) => {
      return `\n\`\`\`general-block-${label || 'GENERAL'}\n${content.trim()}\n\`\`\`\n`;
    });

    // Strip <ascii-art> tags to allow markdown tables inside them to render as real tables
    processed = processed.replace(/<\/?ascii-art>/gi, '\n');
    processed = processed.replace(/<ascii-art\s*\|/gi, '\n|');
    processed = processed.replace(/<\/ascii-art>/gi, '\n');

    // Fix malformed markdown tables (e.g. || instead of | in separator rows)
    processed = processed.replace(/\|-+\|\|-+\|/g, (match) => match.replace(/\|\|/g, '|'));

    // Remove ACTION tags (including incomplete ones that might leak at the end of streaming)
    // Make the opening bracket optional to catch cases where the AI forgets it or it gets mangled
    processed = processed.replace(/\[?ACTION:[^\]]*\]?/gi, '');

    // Ensure tables always have a blank line before them
    // Match a line that does NOT start with | (ignoring leading spaces),
    // followed by a newline,
    // followed by a line that DOES start with |
    processed = processed.replace(/^(?!\s*\|)(.+)\n(?=\s*\|)/gm, '$1\n\n');

    // Add support for custom tags like <red>, <badge-success>, etc.
    // We'll let rehypeRaw handle them by defining custom components.

    // Restore math and code blocks
    processed = processed.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
      return protectedBlocks[parseInt(index, 10)];
    });
    processed = processed.replace(/__MATH_BLOCK_(\d+)__/g, (match, index) => {
      return protectedBlocks[parseInt(index, 10)];
    });
    processed = processed.replace(/__MATH_INLINE_(\d+)__/g, (match, index) => {
      return protectedBlocks[parseInt(index, 10)];
    });

    return processed;
  };

  const processedContent = processContent(content);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="markdown-content"
    >
      <ReactMarkdown
        remarkPlugins={remarkPluginsList}
        rehypePlugins={rehypePluginsList}
        components={markdownComponents}
      >
        {processedContent}
      </ReactMarkdown>
    </motion.div>
  );
};

export default MarkdownRenderer;
