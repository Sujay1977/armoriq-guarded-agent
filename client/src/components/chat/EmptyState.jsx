
import React from 'react';
import { Shield } from 'lucide-react';

export const EmptyState = ({ onExampleClick }) => {
  const examples = [
    "What is our company policy?",
    "Calculate 1250 * 45",
    "Show my profile"
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full overflow-y-auto">
      <div className="bg-[var(--color-primary)] p-4 rounded-full mb-6 text-white shadow-lg mt-auto">
        <Shield className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">ArmorIQ Guarded Agent</h2>
      <p className="text-[var(--color-text-muted)] max-w-md mb-8">
        I am an AI assistant protected by security guardrails and Model Context Protocol integrations. How can I help you today?
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-auto">
        {examples.map((ex, i) => (
          <button 
            key={i}
            onClick={() => onExampleClick(ex)}
            className="p-4 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-main)] hover:bg-gray-50 hover:shadow-sm transition-all text-left"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
};
