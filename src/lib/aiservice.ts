// ── Groq AI Service ──────────────────────────────────────────────────────────
// Base URL: https://api.groq.com/openai/v1
// Supports OpenAI-compatible chat completions API

const GROQ_API_KEY = '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';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// ── Available Models ─────────────────────────────────────────────────────────
export interface AIModel {
  id: string;
  label: string;
  description: string;
  badge?: string;
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'llama-3.1-8b-instant',
    label: 'Llama 3.1 8B Instant',
    description: 'Fast & efficient for quick responses',
    badge: 'Fast',
  },
  {
    id: 'llama-3.3-70b-versatile',
    label: 'Llama 3.3 70B Versatile',
    description: 'Balanced power and speed',
    badge: 'Balanced',
  },
  {
    id: 'compound-beta-mini',
    label: 'Compound Mini',
    description: 'Lightweight compound reasoning model',
    badge: 'Compact',
  },
  {
    id: 'openai/gpt-oss-20b',
    label: 'GPT OSS 20B',
    description: 'Open-source GPT-class 20B model',
    badge: 'OpenAI',
  },
  {
    id: 'openai/gpt-oss-120b',
    label: 'GPT OSS 120B',
    description: 'Flagship open-source GPT 120B model',
    badge: 'Powerful',
  },
  {
    id: 'moonshotai/kimi-k2-instruct',
    label: 'Kimi K2 Instruct',
    description: 'MoonshotAI instruction-tuned model',
    badge: 'MoonshotAI',
  },
  {
    id: 'qwen/qwen3-32b',
    label: 'Qwen3 32B',
    description: 'Alibaba Qwen3 high-capability model',
    badge: 'Qwen',
  },
];

export const DEFAULT_MODEL_ID = 'llama-3.3-70b-versatile';

// ── Message Types ────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  modelId: string;
  messages: ChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ── Core Chat Completion ─────────────────────────────────────────────────────
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const {
    modelId,
    messages,
    systemPrompt,
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const fullMessages: ChatMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: fullMessages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Groq API error:', response.status, errorBody);
    throw new Error(`Groq API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';

  return {
    content,
    model: data.model ?? modelId,
    usage: data.usage,
  };
}

// ── Stream Chat Completion ───────────────────────────────────────────────────
export async function streamChatCompletion(
  options: ChatCompletionOptions,
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: Error) => void
): Promise<void> {
  const {
    modelId,
    messages,
    systemPrompt,
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const fullMessages: ChatMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  let response: Response;
  try {
    response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: fullMessages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });
  } catch (err) {
    onError(err as Error);
    return;
  }

  if (!response.ok || !response.body) {
    const errorBody = await response.text();
    onError(new Error(`Groq API error ${response.status}: ${errorBody}`));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

      for (const line of lines) {
        const jsonStr = line.replace('data: ', '').trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
    onDone(fullText);
  } catch (err) {
    onError(err as Error);
  }
}

// ── Helper: Get model by ID ──────────────────────────────────────────────────
export function getModelById(id: string): AIModel {
  return AI_MODELS.find(m => m.id === id) ?? AI_MODELS[1];
}
