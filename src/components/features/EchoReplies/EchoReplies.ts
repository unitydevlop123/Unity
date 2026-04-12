
// ── Echo Replies — Writing Style Analyzer ─────────────────────────────────────
// Analyzes the last N user messages and produces a style fingerprint
// that gets injected into the AI's system prompt.

export interface StyleFingerprint {
  avgLength: number;       // average words per message
  usesEmoji: boolean;
  usesLowercase: boolean;  // mostly lowercase
  usesPunctuation: boolean;
  avgSentences: number;
  casualWords: string[];   // slang/casual markers found
  formalScore: number;     // 0 = very casual, 1 = very formal
}

const CASUAL_MARKERS = [
  'hey', 'yo', 'lol', 'lmao', 'haha', 'gonna', 'wanna', 'gotta',
  'yeah', 'yep', 'nope', 'kinda', 'sorta', 'tbh', 'imo', 'omg',
  'btw', 'idk', 'ngl', 'fr', 'thx', 'ty', 'np', 'brb', 'smh',
  'rn', 'asap', 'fyi', 'boss', 'bro', 'dude', 'mate',
];

const EMOJI_REGEX = /\p{Emoji}/u;

export function analyzeWritingStyle(messages: string[]): StyleFingerprint {
  if (messages.length === 0) {
    return {
      avgLength: 10,
      usesEmoji: false,
      usesLowercase: false,
      usesPunctuation: true,
      avgSentences: 1,
      casualWords: [],
      formalScore: 0.5,
    };
  }

  const last10 = messages.slice(-10);

  const wordCounts = last10.map(m => m.split(/\s+/).filter(Boolean).length);
  const avgLength = wordCounts.reduce((a, b) => a + b, 0) / last10.length;

  const usesEmoji = last10.some(m => EMOJI_REGEX.test(m));

  const lowercaseCount = last10.filter(m => {
    const letters = m.replace(/[^a-zA-Z]/g, '');
    if (!letters) return false;
    const lowers = (m.match(/[a-z]/g) || []).length;
    return lowers / letters.length > 0.85;
  }).length;
  const usesLowercase = lowercaseCount / last10.length > 0.5;

  const punctCount = last10.filter(m => /[.!?]$/.test(m.trim())).length;
  const usesPunctuation = punctCount / last10.length > 0.4;

  const sentenceCounts = last10.map(m => {
    const s = (m.match(/[.!?]+/g) || []).length;
    return Math.max(1, s);
  });
  const avgSentences = sentenceCounts.reduce((a, b) => a + b, 0) / last10.length;

  const allWords = last10.join(' ').toLowerCase().split(/\s+/);
  const casualWords = CASUAL_MARKERS.filter(w => allWords.includes(w));

  // Formal score: higher = more formal
  let formalScore = 0.5;
  if (avgLength > 15) formalScore += 0.15;
  if (avgLength < 6) formalScore -= 0.15;
  if (usesEmoji) formalScore -= 0.15;
  if (!usesLowercase) formalScore += 0.1;
  if (usesPunctuation) formalScore += 0.1;
  if (casualWords.length >= 3) formalScore -= 0.2;
  if (casualWords.length === 0) formalScore += 0.1;
  formalScore = Math.max(0, Math.min(1, formalScore));

  return {
    avgLength,
    usesEmoji,
    usesLowercase,
    usesPunctuation,
    avgSentences,
    casualWords,
    formalScore,
  };
}

export function buildEchoSystemPrompt(fingerprint: StyleFingerprint, basePrompt: string): string {
  const styleLines: string[] = [
    '',
    '── ECHO REPLY INSTRUCTIONS (mirror the user\'s writing style) ──',
  ];

  if (fingerprint.formalScore < 0.35) {
    styleLines.push('• Write in a VERY casual, relaxed, conversational tone.');
    styleLines.push('• Keep responses SHORT and punchy — match the user\'s brevity.');
  } else if (fingerprint.formalScore > 0.65) {
    styleLines.push('• Write in a FORMAL, professional, well-structured tone.');
    styleLines.push('• Use complete sentences and precise vocabulary.');
  } else {
    styleLines.push('• Use a balanced, friendly-yet-clear tone.');
  }

  if (fingerprint.usesLowercase) {
    styleLines.push('• Prefer lowercase text to match the user\'s casual style.');
  }

  if (fingerprint.usesEmoji) {
    styleLines.push('• Include 1–2 relevant emoji at the end of your reply where natural.');
  } else {
    styleLines.push('• Do NOT use emoji — the user doesn\'t use them.');
  }

  if (!fingerprint.usesPunctuation) {
    styleLines.push('• Avoid heavy punctuation. Keep it flowing and natural.');
  }

  if (fingerprint.avgLength < 5) {
    styleLines.push('• Keep your response VERY brief — ideally 1–2 short sentences.');
  } else if (fingerprint.avgLength < 10) {
    styleLines.push('• Keep responses concise — 2–3 sentences max.');
  } else if (fingerprint.avgLength > 20) {
    styleLines.push('• Provide thorough, detailed responses since the user writes a lot.');
  }

  if (fingerprint.casualWords.length >= 2) {
    styleLines.push(`• The user uses casual words like "${fingerprint.casualWords.slice(0, 3).join('", "')}". Match that energy.`);
  }

  return basePrompt + '\n' + styleLines.join('\n');
}
