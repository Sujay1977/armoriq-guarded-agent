
import React, { useRef, useEffect } from 'react';
import { MessageItem } from './MessageItem.jsx';

export const MessageList = ({ messages, isThinking }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      {messages.map((msg) => (
        <MessageItem key={msg.id || Math.random()} message={msg} />
      ))}
      
      {isThinking && (
        <div className="py-6 px-4 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
          <div className="max-w-4xl mx-auto flex gap-4 md:gap-6">
            <div className="flex-shrink-0 mt-1">
               <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white opacity-70 animate-pulse">
                 <span className="w-2 h-2 bg-white rounded-full"></span>
               </div>
            </div>
            <div className="flex-1 flex items-center">
              <span className="text-sm font-medium text-[var(--color-text-muted)] animate-pulse">
                Gemini is thinking...
              </span>
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};
