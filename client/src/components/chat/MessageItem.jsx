
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Shield, Wrench, BrainCircuit, AlertTriangle } from 'lucide-react';

export const MessageItem = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Resolve indicators
  let headerIcon = null;
  let headerText = '';

  if (!isUser) {
    if (message.route === 'blocked' || message.route === 'error') {
      headerIcon = <AlertTriangle className="w-4 h-4 text-red-500" />;
      headerText = 'Guard Intervention';
    } else if (message.provider === 'mcp' || message.tool_name || message.route === 'tool') {
      headerIcon = <Wrench className="w-4 h-4 text-orange-500" />;
      headerText = `${message.tool_name || 'Tool'} Execution`;
    } else {
      headerIcon = <BrainCircuit className="w-4 h-4 text-purple-500" />;
      headerText = 'Gemini';
    }
  }

  // Formatting for MCP / Tool outputs
  const isTool = message.provider === 'mcp' || message.tool_name || message.route === 'tool';
  
  return (
    <div className={`py-6 px-4 ${isUser ? '' : 'bg-[var(--color-surface)] border-y border-[var(--color-border)]'}`}>
      <div className="max-w-4xl mx-auto flex gap-4 md:gap-6">
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
              <User className="w-5 h-5 text-gray-500" />
            </div>
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${message.route === 'blocked' || message.route === 'error' ? 'bg-red-500' : 'bg-[var(--color-primary)]'}`}>
              <Shield className="w-5 h-5" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 space-y-2">
          {!isUser && (
            <div className="flex items-center gap-2 font-semibold text-sm text-[var(--color-text-main)] mb-1">
              {headerIcon}
              <span>{headerText}</span>
            </div>
          )}

          {isUser ? (
            <div className="whitespace-pre-wrap text-[var(--color-text-main)] text-[15px] leading-relaxed">
              {message.content}
            </div>
          ) : message.route === 'blocked' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm space-y-4">
              <div className="text-red-800 font-medium">Your request was blocked.</div>
              {message.tool_output ? (
                <>
                  <div>
                    <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Reason:</div>
                    <div className="text-red-900 text-sm">{message.tool_output.reason || message.content}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Severity:</div>
                    <div className="text-red-900 text-sm font-medium capitalize">{message.tool_output.severity || 'High'}</div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Reason:</div>
                  <div className="text-red-900 text-sm">{message.content}</div>
                </div>
              )}
            </div>
          ) : isTool ? (
            <div className="bg-white border border-[var(--color-border)] rounded-lg p-4 font-mono text-sm overflow-x-auto shadow-sm">
              <pre className="text-gray-800 whitespace-pre-wrap">{message.content}</pre>
            </div>
          ) : (
            <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-[var(--color-text-main)] text-[15px] leading-relaxed">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
