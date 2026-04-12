
import { getNextGroqApiKey } from './groqKeyManager';
import { DEFAULT_MODEL, AVAILABLE_MODELS, getNextModel } from '../src/config/models';
import { getBasePrompt } from '../src/prompts/basePrompt';
import { getTablePrompt } from '../src/prompts/tablePrompt';
import { getMathPrompt } from '../src/prompts/mathPrompt';
import { getStructurePrompt } from '../src/prompts/structurePrompt';
import { getReviewPrompt } from '../src/prompts/reviewPrompt';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getChatApiKey = async (): Promise<string> => {
  try {
    return await getNextGroqApiKey();
  } catch (e) {
    console.warn('Failed to fetch chat key from groqKeyManager, trying fallback');
    const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GROQ_API_KEY : null;
    if (envKey) return envKey;
    throw new Error("No chat API key available");
  }
};

export { DEFAULT_MODEL, AVAILABLE_MODELS };

// Base SYSTEM_PROMPT for compatibility
export const SYSTEM_PROMPT = getBasePrompt() + "\n\n" + getStructurePrompt();

/**
 * Dynamically assembles the system prompt based on user query content
 * This prevents "Instruction Fatigue" by only sending relevant rules.
 */
export const getDynamicSystemPrompt = (query: string = "") => {
  let prompt = getBasePrompt();
  
  // Always include structure rules as they are fundamental
  prompt += "\n\n" + getStructurePrompt();
  
  const lowerQuery = query.toLowerCase();
  
  // Detect if query needs Math rules
  const mathKeywords = ['math', 'physics', 'chemistry', 'calculate', 'equation', 'formula', 'integral', 'derivative', 'solve', 'arithmetic', 'plus', 'minus', 'times', 'divided'];
  const needsMath = mathKeywords.some(word => lowerQuery.includes(word)) || /[0-9+\-*/=^√π]/.test(query);
  
  if (needsMath) {
    prompt += "\n\n" + getMathPrompt();
  }
  
  // Detect if query needs Table rules
  const tableKeywords = ['table', 'list', 'data', 'comparison', 'schedule', 'chart', 'spreadsheet', 'csv', 'rows', 'columns'];
  const needsTable = tableKeywords.some(word => lowerQuery.includes(word));
  
  if (needsTable) {
    prompt += "\n\n" + getTablePrompt();
  }
  
  return prompt;
};

const formatTimeRemaining = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
};

const fetchWithRetry = async (url: string, optionsBuilder: () => Promise<RequestInit>, retries = 3, backoff = 1000): Promise<Response> => {
  try {
    const options = await optionsBuilder();
    const response = await fetch(url, options);
    if (response.ok) return response;
    
    // If rate limited (429) or server error (5xx), retry
    if ((response.status === 429 || response.status >= 500) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, optionsBuilder, retries - 1, backoff * 2);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, optionsBuilder, retries - 1, backoff * 2);
    }
    throw error;
  }
};

export const callGroqAI = async (
  messages: any[], 
  model?: string,
  onChunk?: (chunk: string) => void,
  signal?: AbortSignal,
  temperature: number = 0.5
) => {
  try {
    let useModel = model || await getNextModel();
    
    if (!AVAILABLE_MODELS.some(m => m.id === useModel)) {
      useModel = await getNextModel();
    }

    const apiMessages = messages.map((msg: any) => {
      if (Array.isArray(msg.content)) {
        return { role: msg.role, content: msg.content };
      }
      return { role: msg.role, content: String(msg.content || "") };
    });

    const response = await fetchWithRetry(GROQ_URL, async () => {
      const apiKey = await getChatApiKey();
      
      // Dynamic max_tokens based on model limits
      let maxTokens = 3900;
      
      if (useModel.includes('oss-20b') || useModel.includes('qwen3-32b') || useModel.includes('oss-120b')) {
        maxTokens = 1700; // Increased to 1700 as requested
      } else if (useModel.includes('8b-instant')) {
        maxTokens = 1200; // UnityDev Lite reduced to 1200
      }

      return {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: useModel,
          messages: apiMessages,
          temperature: temperature, // Lower temperature for faster, more deterministic responses
          max_tokens: maxTokens,
          top_p: 0.9,
          stream: !!onChunk
        }),
        signal
      };
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); 
      const errorMsg = errorData.error?.message || response.statusText;
      
      // RATE LIMIT HANDLING
      if (response.status === 429 || errorMsg.includes('Rate limit') || errorMsg.includes('Limit 100000')) {
        let waitTime = 'a few minutes';
        const timeMatch = errorMsg.match(/try again in (?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?/i);
        
        if (timeMatch) {
           const minutes = timeMatch[1] ? parseInt(timeMatch[1]) : 0;
           const seconds = timeMatch[2] ? parseFloat(timeMatch[2]) : 0;
           const totalSeconds = Math.ceil((minutes * 60) + seconds);
           if (totalSeconds > 0) {
             waitTime = formatTimeRemaining(totalSeconds);
           }
        }

        return {
          error: 'rate_limit',
          userMessage: `🔔 UnityDev AI - Performance Peak Reach

You've reached the peak of AI performance for now. Please take a short break and return in ${waitTime}. 

Please note that these limits help us maintain the platform; a paid upgrade version will be coming soon for all members. If you've hit the UnityDev AI model limit, please choose the next available model to continue your journey. 

If you think this is an error, click 'Try Regenerate' to try again or resend your message. If this message repeats, please switch models. 

Thank you for your patience! 💙`
        };
      }
      
      // GENERIC ERROR HANDLING
      return { 
        error: 'api_error',
        userMessage: `🔔 UnityDev AI - Service Interruption

UnityDev AI is temporarily unavailable. Our team has been notified and is working on a resolution.

Please note that these limits help us maintain the platform; a paid upgrade version will be coming soon for all members. If you've hit the UnityDev AI model limit, please choose the next available model to continue your journey.

If you think this is an error, click 'Try Regenerate' to try again or resend your message. If this message repeats, please switch models.

Thank you for your patience! 💙`
      };
    }

    if (!onChunk) {
      const data = await response.json();
      return {
        content: data.choices?.[0]?.message?.content || "",
        tokens: data.usage?.total_tokens || 0
      };
    }

    if (!response.body) return { error: 'No response body' };

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        
        const dataStr = trimmed.replace("data: ", "").trim();
        if (dataStr === "[DONE]") break;

        try {
          const json = JSON.parse(dataStr);
          const content = json.choices?.[0]?.delta?.content || "";
          
          if (content) {
            fullText += content;
            if (onChunk) onChunk(content);
          }
        } catch (e) {
          console.warn("Error parsing stream chunk", e);
        }
      }
    }

    return {
      content: fullText,
      tokens: 0
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('AI call aborted');
      return { error: 'AbortError' };
    }
    console.error('AI call failed:', error);
    return { error: error.message || 'Failed to connect to AI' };
  }
};

const validateLaTeX = (text: string): boolean => {
  // 1. Check for unclosed block math
  const blockMathCount = (text.match(/\$\$/g) || []).length;
  if (blockMathCount % 2 !== 0) return false;

  // 2. Check for unclosed inline math
  // We use a regex that ignores escaped dollars \$
  const inlineMathCount = (text.match(/(?<!\\)\$(?!\$)/g) || []).length;
  if (inlineMathCount % 2 !== 0) return false;

  // 3. Check for malformed LaTeX environments
  if (/\\begin(?![{])/g.test(text) || /\\end(?![{])/g.test(text)) return false;

  const beginMatches = text.match(/\\begin\{([^}]+)\}/g) || [];
  const endMatches = text.match(/\\end\{([^}]+)\}/g) || [];
  if (beginMatches.length !== endMatches.length) return false;

  // 4. Check for unclosed braces in common LaTeX commands
  const commandsWithBraces = ['frac', 'sqrt', 'text', 'mathbf', 'mathrm', 'mathcal'];
  for (const cmd of commandsWithBraces) {
    const regex = new RegExp(`\\\\${cmd}\\{`, 'g');
    const matches = text.match(regex) || [];
    for (const match of matches) {
      // This is a simple check, but effective for common AI mistakes
      if (!text.includes('}', text.indexOf(match))) return false;
    }
  }

  // 5. Check for "naked" math patterns that should be in LaTeX
  // e.g., "x = 5" or "3 * 4 = 12" or "x^2" outside of $
  // We only check this if the text isn't already heavily using math
  const hasNakedMath = /[a-z]\s*=\s*\d+/i.test(text) || /\d+\s*[\*\/\+\-]\s*\d+\s*=/.test(text);
  const hasDelimiters = text.includes('$');
  if (hasNakedMath && !hasDelimiters) {
    // If it looks like math but has no delimiters, it's likely a failure
    return false;
  }

  // 6. Check for "text{" without a backslash (common AI mistake)
  if (/(?<!\\)text\{/g.test(text)) return false;

  return true;
};

const validateTables = (text: string): boolean => {
  const lines = text.split('\n');
  let inTable = false;
  let expectedPipes = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Count pipes, ignoring escaped pipes \|
    const pipes = (line.match(/(?<!\\)\|/g) || []).length;
    
    // A standard markdown table row usually has at least 2 pipes
    if (pipes >= 2) {
      if (!inTable) {
        inTable = true;
        expectedPipes = pipes;
        
        // Check for separator row (the row immediately following the header)
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const nextPipes = (nextLine.match(/(?<!\\)\|/g) || []).length;
          // If the next line is also a table row but lacks dashes, it's a malformed table
          if (nextPipes >= 2 && !nextLine.includes('-')) {
            return false;
          }
        }
      } else {
        // We are inside a table, check for pipe consistency
        if (pipes !== expectedPipes) {
          return false;
        }
      }
    } else {
      inTable = false;
    }
  }
  return true;
};

export const reviewAndFixResponse = async (text: string, model: string, maxRetries = 3): Promise<string> => {
  // FAST PATH: If the text is already valid, DO NOT review it.
  // This prevents the reviewer models from accidentally truncating or altering
  // perfectly good, complete sentences.
  const isMathValid = validateLaTeX(text);
  const isTableValid = validateTables(text);

  if (isMathValid && isTableValid) {
    return text;
  }

  let currentText = text;
  const reviewerModels = [
    'openai/gpt-oss-120b',      // UnityDev Ultra (120B) - Tier 1
    'llama-3.3-70b-versatile',  // UnityDev Pro (70B) - Tier 2
    'qwen/qwen3-32b'            // UnityDev Qwen (32B) - Tier 3
  ];
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const reviewPrompt = getReviewPrompt(currentText);
      const messages = [{ role: 'user', content: reviewPrompt }];
      
      let response: any = null;
      let success = false;

      // Try each reviewer model in order until one succeeds
      for (const reviewerModel of reviewerModels) {
        try {
          const res = await callGroqAI(messages, reviewerModel, undefined, undefined, 0.1);
          if (!(res as any).error) {
            response = res;
            success = true;
            break;
          }
          console.warn(`Reviewer model ${reviewerModel} failed, trying next tier...`);
        } catch (e) {
          console.warn(`Error with reviewer model ${reviewerModel}, trying next tier...`);
        }
      }

      if (!success || !response) {
        console.error("All reviewer models failed or hit limits.");
        break;
      }

      const reviewedText = response.content || currentText;
      
      if (validateLaTeX(reviewedText) && validateTables(reviewedText)) {
        return reviewedText;
      }
      
      // If validation fails, use the reviewed text for the next iteration
      currentText = reviewedText;
    } catch (error) {
      console.error("Review failed:", error);
      break;
    }
  }
  
  return currentText;
};
