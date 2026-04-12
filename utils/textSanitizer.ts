/**
 * UnityDev Ultra-Cleaner (Sanitizer Script)
 * 
 * This utility cleans AI-generated Markdown to ensure a perfect UI
 * even when the AI makes formatting mistakes.
 */

export const formatUnityDevText = (text: string): string => {
  if (!text) return '';

  // 1. Protect code blocks and math blocks
  const blocks: string[] = [];
  let cleaned = text;

  // Protect markdown code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
    blocks.push(match);
    return `__PROTECTED_BLOCK_${blocks.length - 1}__`;
  });

  // Protect block math
  cleaned = cleaned.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
    blocks.push(match);
    return `__PROTECTED_BLOCK_${blocks.length - 1}__`;
  });

  // Protect inline math
  cleaned = cleaned.replace(/\$(?!\$)[\s\S]*?\$(?!\$)/g, (match) => {
    blocks.push(match);
    return `__PROTECTED_BLOCK_${blocks.length - 1}__`;
  });

  // 2. Strip conversational filler (PRO LEVEL CONTROL)
  // We replace with \n\n to ensure the table/math that follows has a blank line before it.
  cleaned = cleaned.replace(/Here is.*table.*:\n?/gi, '\n\n');
  cleaned = cleaned.replace(/Here's.*table.*:\n?/gi, '\n\n');
  cleaned = cleaned.replace(/Below is.*:\n?/gi, '\n\n');
  cleaned = cleaned.replace(/Example:\n?/gi, '\n\n');
  cleaned = cleaned.replace(/Solution:\n?/gi, '\n\n');
  
  // 2.1 Math-specific filler
  cleaned = cleaned.replace(/Here is the LaTeX code for.*\n?/gi, '\n\n');
  cleaned = cleaned.replace(/I hope this helps!.*\n?/gi, '\n\n');
  cleaned = cleaned.replace(/Let me know if you have any questions.*\n?/gi, '\n\n');

  // 3. Strip raw header examples if they somehow slip through
  cleaned = cleaned.replace(/Header 1\s*\|\s*Header 2.*?\n/gi, '\n\n');

  // 4. Ensure tables always have a blank line before them
  cleaned = cleaned.replace(/^(?!\s*\|)(.+)\n(?=\s*\|)/gm, '$1\n\n');

  // 5. AGGRESSIVE TEXT STRUCTURE ENFORCEMENT
  // 5.1 Enforce blank lines before and after headers (###)
  cleaned = cleaned.replace(/([^\n])\n(#{1,6}\s+.*)/g, '$1\n\n$2'); // Blank line before header
  cleaned = cleaned.replace(/(#{1,6}\s+.*)\n([^\n])/g, '$1\n\n$2'); // Blank line after header

  // 5.2 Enforce blank lines before bullet points (if the previous line is not a bullet point or empty)
  cleaned = cleaned.replace(/([^\n\-\*•\s])\n(\s*[\-\*•]\s+.*)/g, '$1\n\n$2');

  // 5.3 Fix mashed paragraphs (ensure double newlines between blocks of text)
  cleaned = cleaned.replace(/([.!?])\n([A-Z])/g, '$1\n\n$2');

  // 5.4 Clean up excessive newlines (more than 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 6. Restore protected blocks
  blocks.forEach((block, index) => {
    cleaned = cleaned.replace(`__PROTECTED_BLOCK_${index}__`, block);
  });

  return cleaned.trim();
};
