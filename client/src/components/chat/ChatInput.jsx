
import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal } from 'lucide-react';

export const ChatInput = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="p-4 bg-white border-t border-[var(--color-border)]">
      <div className="max-w-4xl mx-auto relative flex items-end shadow-sm bg-white rounded-2xl border border-[var(--color-border)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] focus-within:border-[var(--color-primary)] transition-all overflow-hidden">
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ArmorIQ Agent..."
          disabled={disabled}
          className="w-full max-h-[200px] py-4 pl-4 pr-12 bg-transparent border-none focus:ring-0 resize-none outline-none text-[var(--color-text-main)] disabled:opacity-50"
          rows={1}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="absolute right-2 bottom-2 p-2 rounded-xl text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
        >
          <SendHorizontal className="w-5 h-5" />
        </button>
      </div>
      <div className="text-center mt-2 text-xs text-[var(--color-text-muted)]">
        Agent can make mistakes. Consider verifying important information.
      </div>
    </div>
  );
};
