
export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export const AVAILABLE_MODELS: AIModel[] = [
  { id: 'llama-3.3-70b-versatile', name: 'UnityDev Pro', description: 'Best for complex tasks' },
  { id: 'openai/gpt-oss-120b', name: 'UnityDev Ultra', description: 'Advanced reasoning' },
  { id: 'llama-3.1-8b-instant', name: 'UnityDev Lite', description: 'Lightweight' },
  { id: 'groq/compound', name: 'UnityDev Compound', description: 'Powerful hybrid model' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'UnityDev Vision', description: 'Best for visual tasks' },
  { id: 'openai/gpt-oss-20b', name: 'UnityDev OSS 20B', description: 'Open source reasoning' },
  { id: 'moonshotai/kimi-k2-instruct', name: 'UnityDev Kimi K2', description: 'Deep context reasoning' },
  { id: 'qwen/qwen3-32b', name: 'UnityDev Qwen 32B', description: 'Advanced multilingual reasoning' }
];

export const getNextModel = async (): Promise<string> => {
  return DEFAULT_MODEL;
};
