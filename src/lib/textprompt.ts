// ── System Prompts & Templates ────────────────────────────────────────────────
// Central store for all AI system prompts and message templates

// ── Base System Prompts ──────────────────────────────────────────────────────

export const SYSTEM_PROMPTS = {
  /** Default Instant mode — fast, friendly, concise */
  instant: `You are Instant AI, a fast, friendly, and accurate assistant. 
Respond clearly and concisely. Use markdown formatting (bold, lists) where it improves clarity.
Keep responses helpful and to the point. Always be respectful and professional.`,

  /** Expert mode — deep reasoning, structured, thorough */
  expert: `You are an Expert AI assistant with deep analytical capabilities.
Take time to reason through complex problems carefully before responding.
Provide thorough, well-structured answers with clear explanations.
Use numbered lists, bold headers, and examples to make your responses easy to follow.
Cite relevant facts and acknowledge uncertainty when appropriate.`,

  /** Coding assistant */
  coding: `You are a senior software engineer and coding assistant.
Provide clean, well-commented code with explanations.
Follow best practices for the language being used.
Always explain what the code does and why you made specific design choices.`,

  /** Creative writing */
  creative: `You are a creative writing assistant with expertise in storytelling, poetry, and content creation.
Help users craft compelling narratives, engaging content, and expressive prose.
Match the tone and style requested by the user.`,

  /** Summarization */
  summarize: `You are a summarization expert. Extract the key points from provided text and present them clearly.
Use bullet points for lists of points, and keep summaries concise but complete.
Preserve the most important information while removing unnecessary detail.`,

  /** Translation */
  translate: `You are a professional translator. Translate text accurately while preserving meaning, tone, and nuance.
If there are cultural differences or idioms that don't translate directly, provide a note explaining the original meaning.`,
} as const;

export type SystemPromptKey = keyof typeof SYSTEM_PROMPTS;

// ── Conversation Templates ────────────────────────────────────────────────────

export const PROMPT_TEMPLATES = {
  /** Wrap a user message for summarization */
  summarizeText: (text: string) =>
    `Please summarize the following text:\n\n${text}`,

  /** Wrap a user message for translation */
  translateTo: (text: string, targetLanguage: string) =>
    `Translate the following text to ${targetLanguage}:\n\n${text}`,

  /** Generate a title for a chat */
  generateTitle: (firstMessage: string) =>
    `Generate a short, descriptive title (max 6 words) for a conversation that starts with: "${firstMessage}". Reply with ONLY the title, no quotes or punctuation.`,

  /** Explain a concept simply */
  explainSimply: (concept: string) =>
    `Explain "${concept}" in simple terms that a beginner can understand.`,

  /** Code review */
  reviewCode: (code: string, language: string) =>
    `Review this ${language} code and provide feedback on correctness, style, and improvements:\n\n\`\`\`${language}\n${code}\n\`\`\``,

  /** Continue a story */
  continueStory: (story: string) =>
    `Continue the following story naturally, matching the existing tone and style:\n\n${story}`,
} as const;

// ── Error Messages ────────────────────────────────────────────────────────────

export const ERROR_MESSAGES = {
  generic: "I'm having trouble connecting right now. Please try again in a moment.",
  rateLimited: "I'm receiving too many requests. Please wait a moment before trying again.",
  modelUnavailable: "The selected model is temporarily unavailable. Switching to the default model.",
  networkError: "Network connection issue. Please check your internet and try again.",
  contextTooLong: "The conversation is getting very long. Consider starting a new chat for best results.",
} as const;

// ── Greeting Suggestions ──────────────────────────────────────────────────────

export const GREETING_SUGGESTIONS = [
  "What can you help me with today?",
  "Explain quantum computing simply",
  "Write a professional email for me",
  "Help me debug my code",
  "Summarize a text for me",
  "Translate something to Spanish",
] as const;

// ── Helper: get system prompt for mode ───────────────────────────────────────
export function getSystemPrompt(mode: 'instant' | 'expert'): string {
  return mode === 'expert' ? SYSTEM_PROMPTS.expert : SYSTEM_PROMPTS.instant;
}
