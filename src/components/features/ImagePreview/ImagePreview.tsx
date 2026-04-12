import React, { useRef, useState } from 'react';
import { Message, ImagePreviewProps } from '@/types';
import UnityDevLogo from '@/components/features/Logo/UnityDevLogo';
import styles from './ImagePreview.module.css';

function renderContent(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={j}>{part}</React.Fragment>;
    });
    if (line.trim() === '') return <div key={i} style={{ height: '8px' }} />;
    return <p key={i} style={{ margin: '0 0 4px 0', lineHeight: 1.6 }}>{parts}</p>;
  });
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  messages, selectedIds, allMessages, onClose
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const pairs: { user: Message | null; assistant: Message }[] = [];
  selectedIds.forEach(id => {
    const assistantMsg = messages.find(m => m.id === id);
    if (!assistantMsg) return;
    const idx = allMessages.findIndex(m => m.id === id);
    const userMsg = idx > 0 && allMessages[idx - 1].role === 'user' ? allMessages[idx - 1] : null;
    pairs.push({ user: userMsg, assistant: assistantMsg });
  });

  const handleSave = async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);

    try {
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        removeContainer: true,
      });

      // Convert canvas to blob for fastest download
      canvas.toBlob((blob) => {
        if (!blob) {
          setSaving(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat-${Date.now()}.png`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        // Cleanup after a tick
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(link);
          setSaving(false);
        }, 100);
      }, 'image/png');

    } catch (err) {
      console.error('Save failed:', err);
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'chat-export.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'Chat export' });
            return;
          } catch {
            // user cancelled or share not supported
          }
        }

        // Fallback: copy text to clipboard
        const text = pairs.map(p =>
          `${p.user ? 'You: ' + p.user.content + '\n\n' : ''}AI: ${p.assistant.content}`
        ).join('\n\n---\n\n');
        navigator.clipboard?.writeText(text);
      }, 'image/png');
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.handle} />
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable card preview */}
        <div className={styles.scrollArea}>
          {/* The card that gets captured as PNG */}
          <div className={styles.card} ref={cardRef}>
            <div className={styles.brandRow}>
              <UnityDevLogo size={28} />
              <span className={styles.brandName}>UnityDeV AI</span>
            </div>

            {pairs.map(({ user, assistant }, i) => (
              <div key={assistant.id} className={styles.turnBlock}>
                {user && (
                  <div className={styles.userBubbleWrap}>
                    <div className={styles.userBubble}>{user.content}</div>
                  </div>
                )}
                <div className={styles.assistantText}>
                  {renderContent(assistant.content)}
                </div>
                {i < pairs.length - 1 && <hr className={styles.separator} />}
              </div>
            ))}

            <hr className={styles.separator} />
            <p className={styles.disclaimer}>This response is AI-generated, for reference only.</p>
          </div>
        </div>

        {/* Bottom actions */}
        <div className={styles.bottomBar}>
          <button className={styles.shareBtn} onClick={handleShare}>Share</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className={styles.savingSpinner} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            )}
            {saving ? 'Saving...' : 'Save Image'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
