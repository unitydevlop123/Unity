import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

interface ChatInputProps {
  onSend: (text: string, images: string[]) => void;
  disabled: boolean;
  placeholder: string;
  t: any;
  showNotification?: (msg: string, type: 'success' | 'info' | 'error') => void;
  limitReached?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, placeholder, t, showNotification, limitReached = false }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount and when re-enabled
  useEffect(() => {
    if (!disabled && !limitReached) {
      textareaRef.current?.focus();
    }
  }, [disabled, limitReached]);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  useLayoutEffect(() => {
    adjustHeight();
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (limitReached) {
      e.preventDefault();
      if (showNotification) showNotification("Power depleted. Come back tomorrow!", "error");
      return;
    }
    // Enter now creates a new line (paragraph) instead of sending.
    // Sending is only allowed via the Send button.
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > 2000) {
      if (showNotification) showNotification("Character limit reached (2,000 max). Please reduce your message.", "error");
    }
    setInputValue(value);
  };

  const handleSendClick = () => {
    if (limitReached) {
      if (showNotification) showNotification("Power depleted. Come back tomorrow!", "error");
      return;
    }
    if (inputValue.length > 2000) {
      if (showNotification) showNotification("Message too long. Please stay under 2,000 characters.", "error");
      return;
    }
    if ((!inputValue.trim() && selectedImages.length === 0) || disabled) return;
    
    onSend(inputValue, selectedImages);
    
    // Clear local state
    setInputValue('');
    setSelectedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (limitReached) {
      if (showNotification) showNotification("Power depleted. Come back tomorrow!", "error");
      return;
    }
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const remainingSlots = 5 - selectedImages.length;

      if (files.length > remainingSlots) {
        if (showNotification) {
          showNotification(`You can only upload ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''} (Max 5 total)`, 'error');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const validFiles: File[] = [];
      files.forEach(file => {
        if (!file.type.startsWith('image/')) {
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          if (showNotification) {
            showNotification(`Skipped ${file.name}: Image too large (max 5MB)`, 'error');
          }
          return;
        }
        validFiles.push(file);
      });

      if (validFiles.length === 0) {
         if (fileInputRef.current) fileInputRef.current.value = '';
         return;
      }

      const readers = validFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
             if (event.target?.result) resolve(event.target.result as string);
             else resolve("");
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(results => {
        const newImages = results.filter(img => img !== "");
        setSelectedImages(prev => [...prev, ...newImages]);
        if (!limitReached) textareaRef.current?.focus();
      });
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bottom-input-area">
      <div className="input-box-wrapper">
        {selectedImages.length > 0 && (
          <div className="image-preview-container">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="image-preview-wrapper">
                <img src={img} alt={`Upload ${idx + 1}`} className="image-preview" />
                <button onClick={() => removeSelectedImage(idx)} className="remove-image-btn" title="Remove image">×</button>
              </div>
            ))}
          </div>
        )}
        
        <div className="input-inner-container" style={{ position: 'relative', overflow: 'hidden' }}>
          <button 
            className="attachment-btn" 
            onClick={() => fileInputRef.current?.click()}
            title="Attach images"
            disabled={disabled || limitReached}
            style={{ opacity: limitReached ? 0.5 : 1 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <input 
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple 
            hidden
            onChange={handleFileSelect}
          />
          
          {limitReached ? (
            <div className="marquee-container" onClick={() => {
              if (showNotification) showNotification("Power depleted. Come back tomorrow!", "error");
            }}>
              <div className="marquee-text">
                ⚠️ Power depleted. Come back tomorrow! ⚠️ Power depleted. Come back tomorrow! ⚠️
              </div>
            </div>
          ) : (
            <textarea 
              ref={textareaRef} 
              placeholder={placeholder} 
              className="main-chat-input"
              value={inputValue} 
              onChange={handleInputChange}
              onKeyDown={handleKeyDown} 
              disabled={disabled}
              rows={1}
              style={{ 
                resize: 'none', 
                overflowY: 'auto', 
                maxHeight: '200px',
                border: inputValue.length > 2000 ? '1px solid #ff4d4d' : 'none'
              }}
            />
          )}
          
          <div className="input-toolbar" style={{ margin: 0, padding: 0, display: 'flex', gap: '8px' }}>
            <button 
              className={`submit-send-btn ${(inputValue.trim() || selectedImages.length > 0) && inputValue.length <= 2000 ? 'can-send' : ''}`} 
              onClick={handleSendClick} 
              disabled={disabled || limitReached || inputValue.length > 2000}
              style={{ 
                opacity: (limitReached || inputValue.length > 2000) ? 0.5 : 1, 
                cursor: (limitReached || inputValue.length > 2000) ? 'not-allowed' : 'pointer' 
              }}
            >
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
