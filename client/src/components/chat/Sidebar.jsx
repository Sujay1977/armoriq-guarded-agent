
import React from 'react';
import { Plus, MessageSquare, X, Shield } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const Sidebar = ({ 
  conversations, 
  activeConversationId, 
  onSelectConversation, 
  onNewChat,
  isOpen,
  onClose
}) => {

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-72 bg-gray-50 border-r border-[var(--color-border)] flex flex-col transition-transform duration-300 ease-in-out
    md:translate-x-0 md:static md:w-64
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={onClose} />
      )}
      
      <aside className={sidebarClasses}>
        <div className="p-3 flex justify-between items-center md:hidden border-b border-[var(--color-border)]">
          <span className="font-semibold text-[var(--color-text-main)]">ArmorIQ</span>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-3 border-b border-[var(--color-border)] space-y-1">
          <button 
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-gray-100 border border-[var(--color-border)] rounded-lg text-sm font-medium transition-colors shadow-sm text-[var(--color-text-main)]"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[var(--color-primary)] text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
            onClick={() => { if (window.innerWidth < 768) onClose(); }}
          >
            <Shield className="w-4 h-4" />
            Guardrails
          </NavLink>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs font-semibold text-gray-400 mb-2 px-2 uppercase tracking-wider">History</div>
          {conversations.length === 0 ? (
            <div className="text-sm text-gray-400 px-2 italic">No history</div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${activeConversationId === conv.id ? 'bg-gray-200 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <div className="truncate">{conv.title || 'New Conversation'}</div>
                  {conv.created_at && (
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(conv.created_at))}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[var(--color-border)] bg-white">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">Admin Dashboard</div>
              <div className="text-xs text-gray-500 truncate">Local Agent Instance</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

