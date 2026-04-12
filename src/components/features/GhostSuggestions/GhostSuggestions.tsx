import React, { useState, useEffect, useRef } from 'react';
import { chatCompletion } from '@/lib/aiservice';
import styles from './GhostSuggestions.module.css';

interface GhostSuggestionsProps {
  /** The last AI response content — triggers generation when it changes */
  lastAiResponse: string;
  /** Full conversation context */
  conversationContext: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** Called when user taps a chip */
  onSuggestionTap: (text: string) => void;
  /** Whether to show at all */
  enabled: boolean;
  /** Whether AI is currently responding */
  isStreaming: boolean;
}

const GhostSuggestions: React.FC<GhostSuggestionsProps> = ({
  lastAiResponse,
  conversationContext,
  onSuggestionTap,
  enabled,
  isStreaming,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const lastResponseRef = useRef<string>('');

  useEffect(() => {
    // Only generate when AI finishes responding and we have a new response
    if (
      !enabled ||
      isStreaming ||
      !lastAiResponse ||
      lastAiResponse === lastResponseRef.current ||
      lastAiResponse.length < 20
    ) return;

    lastResponseRef.current = lastAiResponse;
    setSuggestions([]);
    setLoading(true);

    const context = conversationContext
      .slice(-6) // last 3 exchanges
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.slice(0, 200)}`)
      .join('\n');

    chatCompletion({
      modelId: 'llama-3.1-8b-instant', // fast, lightweight model
      messages: [
        {
          role: 'user',
          content: `Based on this conversation, suggest exactly 3 short follow-up questions the user might ask next. Return ONLY a JSON array of strings, nothing else. No markdown, no explanation.\n\nConversation:\n${context}`,
        },
      ],
      temperature: 0.8,
      maxTokens: 200,
    }).then(result => {
      try {
        // Extract JSON array from response
        const match = result.content.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed: string[] = JSON.parse(match[0]);
          if (Array.isArray(parsed)) {
            setSuggestions(parsed.filter(s => typeof s === 'string' && s.trim()).slice(0, 3));
          }
        }
      } catch {
        // Silently fail — suggestions are non-critical
        console.log('Ghost suggestions parse failed');
      }
    }).catch(() => {
      // Silently fail
    }).finally(() => {
      setLoading(false);
    });
  }, [lastAiResponse, enabled, isStreaming]);

  // Hide while streaming or if nothing to show
  if (isStreaming || (!loading && suggestions.length === 0)) return null;

  return (
    <div className={styles.container}>
      {loading ? (
        <div className={styles.loadingRow}>
          <div className={styles.skeletonChip} />
          <div className={styles.skeletonChip} style={{ width: 120 }} />
          <div className={styles.skeletonChip} style={{ width: 90 }} />
        </div>
      ) : (
        <div className={styles.chipsRow}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              className={styles.chip}
              onClick={() => {
                onSuggestionTap(s);
                setSuggestions([]); // clear after tap
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GhostSuggestions;
