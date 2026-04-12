import React, { useState } from 'react';
import { PollData } from '../../services/roomCommands';
import { X, Plus, Trash2 } from 'lucide-react';
import './PollCreatorModal.css';

interface PollCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pollData: Omit<PollData, 'creatorId'>) => void;
  initialQuestion?: string;
}

const PollCreatorModal: React.FC<PollCreatorModalProps> = ({ isOpen, onClose, onSubmit, initialQuestion = '' }) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [options, setOptions] = useState([{ id: '1', text: '' }, { id: '2', text: '' }]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [allowChange, setAllowChange] = useState(true);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, { id: Math.random().toString(36).substring(7), text: '' }]);
    }
  };

  const handleRemoveOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id));
    }
  };

  const handleOptionChange = (id: string, text: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  const handleStrictOneVote = (checked: boolean) => {
    if (checked) {
      setAllowMultiple(false);
      setAllowChange(false);
    } else {
      setAllowChange(true);
    }
  };

  const handleSubmit = () => {
    if (!question.trim()) {
      alert("Please enter a question.");
      return;
    }
    const validOptions = options.filter(opt => opt.text.trim() !== '');
    if (validOptions.length < 2) {
      alert("Please provide at least 2 options.");
      return;
    }

    onSubmit({
      question: question.trim(),
      options: validOptions.map((opt, i) => ({ id: i.toString(), text: opt.text.trim(), votes: [] })),
      allowMultiple,
      allowChange
    });
    
    // Reset
    setQuestion('');
    setOptions([{ id: '1', text: '' }, { id: '2', text: '' }]);
    setAllowMultiple(false);
    setAllowChange(true);
    onClose();
  };

  return (
    <div className="poll-modal-overlay" onClick={onClose}>
      <div className="poll-modal-content" onClick={e => e.stopPropagation()}>
        <div className="poll-modal-header">
          <h3>Create Poll</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="poll-modal-body">
          <div className="form-group">
            <label>Question</label>
            <input 
              type="text" 
              value={question} 
              onChange={e => setQuestion(e.target.value)} 
              placeholder="Ask a question..."
              autoFocus
            />
          </div>

          <div className="form-group options-group">
            <label>Options ({options.length}/10)</label>
            {options.map((opt, index) => (
              <div key={opt.id} className="option-input-row">
                <input 
                  type="text" 
                  value={opt.text} 
                  onChange={e => handleOptionChange(opt.id, e.target.value)} 
                  placeholder={`Option ${index + 1}`}
                />
                {options.length > 2 && (
                  <button className="icon-btn text-red-500" onClick={() => handleRemoveOption(opt.id)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <button className="add-option-btn" onClick={handleAddOption}>
                <Plus size={16} /> Add Option
              </button>
            )}
          </div>

          <div className="form-group settings-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={allowMultiple} 
                onChange={e => {
                  setAllowMultiple(e.target.checked);
                  if (e.target.checked) setAllowChange(true); // Usually multiple implies you can toggle them
                }} 
              />
              Allow multiple answers
            </label>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={allowChange} 
                onChange={e => setAllowChange(e.target.checked)} 
              />
              Allow changing vote
            </label>
            <label className="checkbox-label" style={{ marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
              <input 
                type="checkbox" 
                checked={!allowMultiple && !allowChange} 
                onChange={e => handleStrictOneVote(e.target.checked)} 
              />
              <strong>Strict: One vote per user (cannot be changed)</strong>
            </label>
          </div>
        </div>

        <div className="poll-modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit}>Send Poll</button>
        </div>
      </div>
    </div>
  );
};

export default PollCreatorModal;
