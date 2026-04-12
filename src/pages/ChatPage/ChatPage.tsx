import React, { useState, useRef, useEffect } from 'react';
import { AttachedFile, Chat, Message, Mode } from '@/types';
import { AI_RESPONSES } from '@/constants';
import { streamChatCompletion } from '@/lib/aiservice';
import { getSystemPrompt } from '@/lib/textprompt';
import { useAgent } from '@/contexts/AgentContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import Header from '@/components/layout/Header/Header';
import EmptyState from '@/components/features/EmptyState/EmptyState';
import ChatMessage from '@/components/features/ChatMessage/ChatMessage';
import ChatInput from '@/components/features/ChatInput/ChatInput';
import ShareMode from '@/components/features/ShareMode/ShareMode';
import ImagePreview from '@/components/features/ImagePreview/ImagePreview';
import GhostSuggestions from '@/components/features/GhostSuggestions/GhostSuggestions';
import SplitBrain from '@/components/features/SplitBrain/SplitBrain';
import RemixModal from '@/components/features/RemixModal/RemixModal';
import SplitPersonality from '@/components/features/SplitPersonality/SplitPersonality';
import SilenceBreaker from '@/components/features/SilenceBreaker/SilenceBreaker';
import Settings from '@/components/features/Settings/Settings';
import MemoryMap from '@/components/features/MemoryMap/MemoryMap';
import { analyzeWritingStyle, buildEchoSystemPrompt } from '@/components/features/EchoReplies/EchoReplies';
import styles from './ChatPage.module.css';

interface ChatPageProps {
  activeChat: Chat | null;
  onMenuClick: () => void;
  onNewChat: () => void;
  onUpdateChat: (chat: Chat) => void;
  onAddChat?: (chat: Chat) => void;
}

// ── Groq models that support <think> reasoning ──────────────────
const THINKING_MODELS = [
  'qwen/qwen3-32b',
  'deepseek-r1-distill-llama-70b',
  'deepseek-r1-distill-qwen-32b',
];

const ChatPage: React.FC<ChatPageProps> = ({
  activeChat, onMenuClick, onNewChat, onUpdateChat, onAddChat
}) => {
  const [mode, setMode] = useState<Mode>('instant');
  const [thinking, setThinking] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Share mode state
  const [shareMode, setShareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [remixModalOpen, setRemixModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memoryMapOpen, setMemoryMapOpen] = useState(false);

  // Split-Personality Debate state
  const [splitPersonalityOpen, setSplitPersonalityOpen] = useState(false);
  const [pendingPersonalityMsg, setPendingPersonalityMsg] = useState<{
    text: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  } | null>(null);

  // SilenceBreaker — current input value
  const [currentInputValue, setCurrentInputValue] = useState('');

  // Split-brain state
  const [splitBrainOpen, setSplitBrainOpen] = useState(false);
  const [pendingSplitMessage, setPendingSplitMessage] = useState<{
    text: string;
    attachments?: AttachedFile[];
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  } | null>(null);

  const { selectedModelId } = useAgent();
  const { settings } = useAppSettings();

  // Echo Replies — build style fingerprint from user messages
  const userMessages = (activeChat?.messages || []).filter(m => m.role === 'user').map(m => m.content);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(activeChat);

  const messages = activeChat?.messages || [];

  // Last AI response for ghost suggestions
  const lastAiMessage = [...messages].reverse().find(m => m.role === 'assistant' && !m.isStreaming);
  const lastAiContent = lastAiMessage?.content ?? '';

  useEffect(() => {
    chatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, thinking]);

  useEffect(() => {
    setShareMode(false);
    setSelectedIds([]);
    setShowImagePreview(false);
  }, [activeChat?.id]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollDown(!nearBottom && messages.length > 0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getEffectiveSystemPrompt = (basePrompt: string): string => {
    // Echo Replies: mirror user's writing style
    if (settings.echoRepliesEnabled && userMessages.length >= 3) {
      const fingerprint = analyzeWritingStyle(userMessages);
      return buildEchoSystemPrompt(fingerprint, basePrompt);
    }
    return basePrompt;
  };

  const executeStream = async (
    text: string,
    chatToUse: Chat,
    userMsg: Message,
    modelId: string,
    useThink?: boolean
  ) => {
    const aiMsgId = (Date.now() + 1).toString();
    const placeholderMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      streamingThought: undefined,
      timestamp: new Date(),
    };

    const chatWithPlaceholder: Chat = {
      ...chatToUse,
      messages: [...chatToUse.messages, placeholderMsg],
    };
    onUpdateChat(chatWithPlaceholder);
    chatRef.current = chatWithPlaceholder;

    const startTime = Date.now();
    let thoughtText = '';
    let answerText = '';
    let inThinkTag = false;
    let thinkBuffer = '';

    const historyMessages = chatToUse.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const updateMessage = (patch: Partial<Message>) => {
      const chat = chatRef.current;
      if (!chat) return;
      const updated: Chat = {
        ...chat,
        messages: chat.messages.map(m => m.id === aiMsgId ? { ...m, ...patch } : m),
      };
      chatRef.current = updated;
      onUpdateChat(updated);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleChunk = (delta: string) => {
      thinkBuffer += delta;
      while (thinkBuffer.length > 0) {
        if (inThinkTag) {
          const closeIdx = thinkBuffer.indexOf('</think>');
          if (closeIdx !== -1) {
            thoughtText += thinkBuffer.slice(0, closeIdx);
            thinkBuffer = thinkBuffer.slice(closeIdx + 8);
            inThinkTag = false;
            updateMessage({ streamingThought: thoughtText });
          } else {
            thoughtText += thinkBuffer;
            thinkBuffer = '';
            updateMessage({ streamingThought: thoughtText });
          }
        } else {
          const openIdx = thinkBuffer.indexOf('<think>');
          if (openIdx !== -1) {
            const before = thinkBuffer.slice(0, openIdx);
            if (before) { answerText += before; updateMessage({ content: answerText }); }
            thinkBuffer = thinkBuffer.slice(openIdx + 7);
            inThinkTag = true;
            updateMessage({ streamingThought: '' });
          } else {
            const partialMatch = thinkBuffer.match(/<(?:t(?:h(?:i(?:n(?:k)?)?)?)?)?$/);
            if (partialMatch) {
              const safe = thinkBuffer.slice(0, partialMatch.index);
              if (safe) { answerText += safe; updateMessage({ content: answerText }); }
              thinkBuffer = thinkBuffer.slice(partialMatch.index ?? thinkBuffer.length);
              break;
            } else {
              answerText += thinkBuffer;
              thinkBuffer = '';
              updateMessage({ content: answerText });
            }
          }
        }
      }
    };

    const handleDone = (_fullText: string) => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const finalMsg: Message = {
        id: aiMsgId,
        role: 'assistant',
        content: answerText.trim() || _fullText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim(),
        thoughtContent: thoughtText.trim() ? thoughtText.trim() : undefined,
        thoughtSeconds: thoughtText.trim() ? Math.max(1, elapsed) : undefined,
        isStreaming: false,
        streamingThought: undefined,
        timestamp: new Date(),
      };
      const chat = chatRef.current;
      if (!chat) return;
      const finalChat: Chat = {
        ...chat,
        messages: chat.messages.map(m => m.id === aiMsgId ? finalMsg : m),
      };
      chatRef.current = finalChat;
      onUpdateChat(finalChat);
      setThinking(false);
    };

    const handleError = (err: Error) => {
      console.error('Stream error, using fallback:', err);
      setAiError('AI connection issue — showing fallback response.');
      const aiResponse = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
      const chat = chatRef.current;
      if (!chat) return;
      const fallbackMsg: Message = {
        id: aiMsgId,
        role: 'assistant',
        content: aiResponse,
        isStreaming: false,
        timestamp: new Date(),
      };
      const fallbackChat: Chat = {
        ...chat,
        messages: chat.messages.map(m => m.id === aiMsgId ? fallbackMsg : m),
      };
      chatRef.current = fallbackChat;
      onUpdateChat(fallbackChat);
      setThinking(false);
    };

    await streamChatCompletion(
      {
        modelId,
        messages: historyMessages,
        systemPrompt: getEffectiveSystemPrompt(getSystemPrompt(mode)),
        temperature: (useThink || mode === 'expert') ? 0.5 : 0.7,
        maxTokens: (useThink || mode === 'expert') ? 4000 : 1500,
      },
      handleChunk,
      handleDone,
      handleError
    );
  };

  const handleSend = async (text: string, attachments?: AttachedFile[], useThink?: boolean) => {
    setAiError(null);
    setCurrentInputValue(''); // clear silence breaker state

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      attachments,
    };

    const currentMessages = activeChat?.messages || [];
    const title = text.length > 40 ? text.slice(0, 38) + '...' : text;

    const newChat: Chat = activeChat
      ? { ...activeChat, messages: [...currentMessages, userMsg] }
      : {
          id: Date.now().toString(),
          title,
          mode,
          createdAt: new Date(),
          messages: [userMsg],
        };

    onUpdateChat(newChat);
    chatRef.current = newChat;

    // ── Split-Personality Debate intercept ──
    if (settings.splitPersonalityEnabled) {
      const history = newChat.messages.slice(0, -1).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
      setPendingPersonalityMsg({ text, history });
      setSplitPersonalityOpen(true);
      return;
    }

    // ── Split-Brain Mode intercept ──
    if (settings.splitBrainMode) {
      const history = newChat.messages.slice(0, -1).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
      setPendingSplitMessage({ text, attachments, history });
      setSplitBrainOpen(true);
      return; // Don't stream normally — split brain handles it
    }

    setThinking(true);

    let modelId = selectedModelId;
    if (useThink && !THINKING_MODELS.includes(modelId)) {
      modelId = 'deepseek-r1-distill-llama-70b';
    }

    await executeStream(text, newChat, userMsg, modelId, useThink);
  };

  // Ghost suggestion tap → send as message
  const handleGhostTap = (text: string) => {
    handleSend(text);
  };

  // Split-Personality debate complete → add result to chat
  const handlePersonalityComplete = (fullDebate: string) => {
    const currentChat = chatRef.current;
    if (!currentChat) return;
    const debateMsg: Message = {
      id: (Date.now() + 3).toString(),
      role: 'assistant',
      content: fullDebate,
      isStreaming: false,
      timestamp: new Date(),
    };
    const updatedChat: Chat = {
      ...currentChat,
      messages: [...currentChat.messages, debateMsg],
    };
    chatRef.current = updatedChat;
    onUpdateChat(updatedChat);
    setSplitPersonalityOpen(false);
    setPendingPersonalityMsg(null);
  };

  // Split-brain winner chosen → add winning response to chat
  const handleSplitWinner = (content: string, _modelId: string) => {
    if (!pendingSplitMessage) return;
    const currentChat = chatRef.current;
    if (!currentChat) return;

    const winnerMsg: Message = {
      id: (Date.now() + 2).toString(),
      role: 'assistant',
      content,
      isStreaming: false,
      timestamp: new Date(),
    };

    const updatedChat: Chat = {
      ...currentChat,
      messages: [...currentChat.messages, winnerMsg],
    };
    chatRef.current = updatedChat;
    onUpdateChat(updatedChat);
    setSplitBrainOpen(false);
    setPendingSplitMessage(null);
  };

  // ── Share handlers ──────────────────────────────────────
  const handleShareMessage = (messageId: string) => {
    setShareMode(true);
    setSelectedIds([messageId]);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCloseShareMode = () => {
    setShareMode(false);
    setSelectedIds([]);
    setShowImagePreview(false);
    setRemixModalOpen(false);
  };

  const handleCreateImage = () => {
    if (selectedIds.length === 0) return;
    setShowImagePreview(true);
  };

  const chatTitle = activeChat
    ? activeChat.title.length > 22 ? activeChat.title.slice(0, 20) + '...' : activeChat.title
    : undefined;
  const chatMode = activeChat?.mode;

  // Build conversation context for ghost suggestions
  const conversationContext = messages
    .filter(m => m.content)
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  if (shareMode) {
    return (
      <div className={styles.page}>
        <ShareMode
          messages={messages}
          chat={activeChat!}
          selectedIds={selectedIds}
          onToggle={handleToggleSelect}
          onClose={handleCloseShareMode}
          onCreateImage={handleCreateImage}
          onRemix={() => setRemixModalOpen(true)}
        />
        {showImagePreview && (
          <ImagePreview
            messages={messages}
            selectedIds={selectedIds}
            allMessages={messages}
            onClose={() => setShowImagePreview(false)}
          />
        )}
        {remixModalOpen && activeChat && (
          <RemixModal
            chat={activeChat}
            onClose={() => setRemixModalOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header
        title={chatTitle}
        subtitle={chatTitle ? (chatMode === 'expert' ? 'UnityDev Pro' : 'UnityDeV AI') : undefined}
        onMenuClick={onMenuClick}
        onNewChat={onNewChat}
        onSettingsClick={() => setSettingsOpen(true)}
        onMemoryMapClick={() => setMemoryMapOpen(true)}
        onRemixClick={() => setRemixModalOpen(true)}
      />

      <div
        className={styles.messagesArea}
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 && !thinking ? (
          <EmptyState mode={mode} onModeChange={setMode} />
        ) : (
          <div className={styles.messagesList}>
            {messages.map(msg => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onShare={handleShareMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {aiError && (
        <div className={styles.errorBanner}>{aiError}</div>
      )}

      {showScrollDown && (
        <button className={styles.scrollDownBtn} onClick={scrollToBottom}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {/* Silence Breaker */}
      <SilenceBreaker
        inputValue={currentInputValue}
        isDisabled={thinking}
        enabled={settings.silenceBreakerEnabled}
        onSuggest={(text) => setCurrentInputValue(text)}
        onSend={(text) => handleSend(text)}
      />

      {/* Ghost suggestions — above chat input */}
      <GhostSuggestions
        lastAiResponse={lastAiContent}
        conversationContext={conversationContext}
        onSuggestionTap={handleGhostTap}
        enabled={settings.ghostSuggestionsEnabled}
        isStreaming={thinking}
      />

      <ChatInput
        onSend={handleSend}
        disabled={thinking}
        externalValue={currentInputValue}
        onValueChange={setCurrentInputValue}
      />

      {/* Split-Personality Debate overlay */}
      {splitPersonalityOpen && pendingPersonalityMsg && (
        <SplitPersonality
          userMessage={pendingPersonalityMsg.text}
          conversationHistory={pendingPersonalityMsg.history}
          modelId={selectedModelId}
          onComplete={handlePersonalityComplete}
          onClose={() => {
            setSplitPersonalityOpen(false);
            setPendingPersonalityMsg(null);
          }}
        />
      )}

      {/* Split-Brain overlay */}
      {splitBrainOpen && pendingSplitMessage && (
        <SplitBrain
          userMessage={pendingSplitMessage.text}
          conversationHistory={pendingSplitMessage.history}
          systemPrompt={getSystemPrompt(mode)}
          primaryModelId={selectedModelId}
          onPickWinner={handleSplitWinner}
          onClose={() => {
            setSplitBrainOpen(false);
            setPendingSplitMessage(null);
          }}
        />
      )}

      {/* Settings Modal */}
      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenMemoryMap={() => {
          setSettingsOpen(false);
          setMemoryMapOpen(true);
        }}
        onImportRemix={(chat) => {
          onAddChat?.(chat);
          setSettingsOpen(false);
        }}
        existingChats={[]}
      />

      {/* Memory Map Overlay */}
      {memoryMapOpen && (
        <MemoryMap
          onClose={() => setMemoryMapOpen(false)}
          chats={activeChat ? [activeChat] : []}
          activeChatId={activeChat?.id || null}
          onSelectChat={() => {}}
        />
      )}
    </div>
  );
};

export default ChatPage;
