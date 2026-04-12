import React, { useState, useRef, useEffect } from 'react';
import { AttachedFile } from '@/types';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  onSend: (text: string, attachments?: AttachedFile[], useThink?: boolean) => void;
  disabled?: boolean;
  externalValue?: string;           // controlled by parent (SilenceBreaker)
  onValueChange?: (v: string) => void; // notify parent of value changes
}

type VoiceState = 'idle' | 'holdToSpeak' | 'recording' | 'noContent';

// Blocked archive/zip mime types and extensions
const BLOCKED_EXTENSIONS = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.tgz', '.tar.gz'];
const BLOCKED_MIME = ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  'application/x-tar', 'application/gzip', 'application/x-bzip2'];

function isBlockedFile(file: File): boolean {
  if (BLOCKED_MIME.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return BLOCKED_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
}

const WaveformBars: React.FC<{ color: 'blue' | 'red' }> = ({ color }) => (
  <div className={`${styles.waveform} ${color === 'red' ? styles.waveformRed : styles.waveformBlue}`}>
    {Array.from({ length: 36 }).map((_, i) => (
      <div key={i} className={styles.waveBar} style={{ animationDelay: `${(i * 0.06).toFixed(2)}s` }} />
    ))}
  </div>
);

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, externalValue, onValueChange }) => {
  const [value, setValue] = useState(externalValue ?? '');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [showAttach, setShowAttach] = useState(false);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [thinkActive, setThinkActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noContentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync externalValue (from SilenceBreaker) into the textarea
  useEffect(() => {
    if (externalValue !== undefined && externalValue !== value) {
      setValue(externalValue);
      // Re-calculate height
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
        el.focus();
      }
    }
  }, [externalValue]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (noContentTimerRef.current) clearTimeout(noContentTimerRef.current);
    };
  }, []);

  const handleSend = () => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || disabled) return;
    onSend(trimmed, attachments.length > 0 ? attachments : undefined, thinkActive);
    setValue('');
    onValueChange?.('');
    setAttachments([]);
    setThinkActive(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 4 - attachments.length;
    if (remaining <= 0) return;

    const newFiles: AttachedFile[] = [];
    Array.from(files).slice(0, remaining).forEach(file => {
      if (isBlockedFile(file)) return;
      const id = Math.random().toString(36).slice(2);
      const isImage = file.type.startsWith('image/');
      if (isImage) {
        const reader = new FileReader();
        reader.onload = e => {
          setAttachments(prev => prev.map(a => a.id === id ? { ...a, dataUrl: e.target?.result as string } : a));
        };
        reader.readAsDataURL(file);
      }
      newFiles.push({ id, name: file.name, size: file.size, type: file.type });
    });
    setAttachments(prev => [...prev, ...newFiles]);
    setShowAttach(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleVoiceBtnClick = () => {
    if (voiceState === 'idle') { setShowAttach(false); setVoiceState('holdToSpeak'); }
    else setVoiceState('idle');
  };

  const handleKeyboardBtnClick = () => {
    setVoiceState('idle');
    if (noContentTimerRef.current) clearTimeout(noContentTimerRef.current);
  };

  const handleHoldStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (voiceState !== 'holdToSpeak') return;
    setVoiceState('recording');
  };

  const handleHoldEnd = () => {
    if (voiceState === 'recording') {
      const recognized = Math.random() > 0.5;
      if (recognized) {
        onSend('(Voice message)');
        setVoiceState('holdToSpeak');
      } else {
        setVoiceState('noContent');
        noContentTimerRef.current = setTimeout(() => setVoiceState('holdToSpeak'), 2000);
      }
    }
  };

  const handleAttachClick = () => { setShowAttach(v => !v); setVoiceState('idle'); };

  const isRecording = voiceState === 'recording';
  const isNoContent = voiceState === 'noContent';

  if (isRecording || isNoContent) {
    return (
      <div className={`${styles.voiceOverlay} ${isNoContent ? styles.voiceOverlayRed : ''}`}>
        {isNoContent && <div className={styles.noContentBubble}>No content recognized.</div>}
        <p className={styles.voiceHint}>{isNoContent ? 'Release to cancel' : 'Release to send, slide up to cancel'}</p>
        <div className={styles.voiceHoldArea} onMouseUp={handleHoldEnd} onTouchEnd={handleHoldEnd}>
          <WaveformBars color={isNoContent ? 'red' : 'blue'} />
        </div>
      </div>
    );
  }

  if (voiceState === 'holdToSpeak') {
    return (
      <div className={styles.container}>
        <div className={styles.holdToSpeakBox}>
          <div className={styles.holdArea} onMouseDown={handleHoldStart} onTouchStart={handleHoldStart}>
            <span className={styles.holdToSpeakText}>Hold to speak</span>
          </div>
          <div className={styles.holdDivider} />
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <button
                className={`${styles.toolBtn} ${thinkActive ? styles.toolBtnActive : ''}`}
                onClick={() => setThinkActive(v => !v)}
                aria-label="Toggle deep thinking"
              >
                <ThinkIcon active={thinkActive} /><span>Think</span>
              </button>
              <button className={styles.toolBtn}><SearchIcon /><span>Search</span></button>
            </div>
            <div className={styles.toolbarRight}>
              <button className={styles.iconBtn} onClick={handleKeyboardBtnClick} aria-label="Keyboard"><KeyboardIcon /></button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal mode
  const hasContent = value.trim() || attachments.length > 0;

  return (
    <>
      {showAttach && (
        <div className={styles.attachMenu}>
          {/* Hidden file inputs */}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => processFiles(e.target.files)} />
          <input ref={photoInputRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={e => processFiles(e.target.files)} />
          <input ref={fileInputRef} type="file" multiple accept="*/*" style={{ display: 'none' }} onChange={e => processFiles(e.target.files)} />

          <div className={styles.attachGrid}>
            <button className={styles.attachItem} onClick={() => cameraInputRef.current?.click()}>
              <div className={styles.attachIcon}><CameraIcon /></div>
              <span className={styles.attachLabel}>Camera</span>
            </button>
            <button className={styles.attachItem} onClick={() => photoInputRef.current?.click()}>
              <div className={styles.attachIcon}><PhotoIcon /></div>
              <span className={styles.attachLabel}>Photo</span>
            </button>
            <button className={styles.attachItem} onClick={() => fileInputRef.current?.click()}>
              <div className={styles.attachIcon}><DocumentIcon /></div>
              <span className={styles.attachLabel}>Document</span>
            </button>
          </div>
          <p className={styles.attachNote}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Text extraction only
          </p>
        </div>
      )}

      <div className={styles.container}>
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className={styles.attachPreviews}>
            {attachments.map(att => (
              <div key={att.id} className={styles.attachCard}>
                <button className={styles.attachRemove} onClick={() => removeAttachment(att.id)} aria-label="Remove">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
                <div className={styles.attachCardIcon}>
                  {att.dataUrl ? (
                    <img src={att.dataUrl} alt={att.name} className={styles.attachThumb} />
                  ) : (
                    <FileDocIcon />
                  )}
                </div>
                <div className={styles.attachCardInfo}>
                  <span className={styles.attachCardName}>{att.name.length > 20 ? att.name.slice(0, 18) + '…' : att.name}</span>
                  <span className={styles.attachCardStatus}>Parsing...</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.inputBox}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder={attachments.length > 0 ? 'Type a message' : 'Type a message or hold to speak'}
            value={value}
            onChange={e => { setValue(e.target.value); onValueChange?.(e.target.value); }}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={disabled}
          />
          {hasContent && (
            <button className={styles.sendBtn} onClick={handleSend} aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"/>
                <polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          )}
        </div>

        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <button
              className={`${styles.toolBtn} ${thinkActive ? styles.toolBtnActive : ''}`}
              onClick={() => setThinkActive(v => !v)}
              aria-label="Toggle deep thinking"
            >
              <ThinkIcon active={thinkActive} /><span>Think</span>
            </button>
            <button className={styles.toolBtn}><SearchIcon /><span>Search</span></button>
          </div>
          <div className={styles.toolbarRight}>
            {showAttach ? (
              <button className={styles.iconBtn} onClick={handleAttachClick} aria-label="Close attach"><XCircleIcon /></button>
            ) : (
              <button className={styles.iconBtn} onClick={handleAttachClick} aria-label="Attach" disabled={attachments.length >= 4}>
                <PlusCircleIcon />
              </button>
            )}
            <button className={styles.iconBtn} onClick={handleVoiceBtnClick} aria-label="Voice"><VoiceIcon /></button>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Icons ─────────────────────────────────────────────────────────────────────

const ThinkIcon = ({ active }: { active?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#4d9ef7' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>
);
const VoiceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </svg>
);
const KeyboardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="13" rx="2"/>
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8M6 10v.01M10 10v.01M14 10v.01M18 10v.01"/>
  </svg>
);
const PlusCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const XCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const CameraIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const PhotoIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);
const DocumentIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const FileDocIcon = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="4" width="36" height="40" rx="4" fill="#2563eb" opacity="0.9"/>
    <path d="M28 4v10h10" fill="none" stroke="white" strokeWidth="2"/>
    <path d="M14 22h20M14 28h20M14 34h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <rect x="8" y="18" width="12" height="12" rx="2" fill="white" opacity="0.15"/>
    <path d="M10 24l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default ChatInput;
