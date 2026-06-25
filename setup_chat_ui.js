import fs from 'fs';
import path from 'path';

const clientDir = path.join(process.cwd(), 'client');
const srcDir = path.join(clientDir, 'src');

fs.mkdirSync(path.join(srcDir, 'components/chat'), { recursive: true });

// 1. chatService.js
fs.writeFileSync(path.join(srcDir, 'services/chatService.js'), `
import api from './api.js';

export const chatService = {
  getConversations: async (page = 1, limit = 20) => {
    const { data } = await api.get('/conversations', { params: { page, limit } });
    return data.data;
  },
  getConversationDetails: async (conversationId) => {
    const { data } = await api.get(\`/conversations/\${conversationId}\`);
    return data.data;
  },
  sendMessage: async (message, conversationId) => {
    const payload = { message };
    if (conversationId) payload.conversationId = conversationId;
    const { data } = await api.post('/agent/chat', payload);
    return data.data;
  }
};
`);

// 2. EmptyState.jsx
fs.writeFileSync(path.join(srcDir, 'components/chat/EmptyState.jsx'), `
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
`);

// 3. ChatInput.jsx
fs.writeFileSync(path.join(srcDir, 'components/chat/ChatInput.jsx'), `
import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal } from 'lucide-react';

export const ChatInput = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = \`\${Math.min(textareaRef.current.scrollHeight, 200)}px\`;
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
`);

// 4. MessageItem.jsx
fs.writeFileSync(path.join(srcDir, 'components/chat/MessageItem.jsx'), `
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
      headerText = \`\${message.tool_name || 'Tool'} Execution\`;
    } else {
      headerIcon = <BrainCircuit className="w-4 h-4 text-purple-500" />;
      headerText = 'Gemini';
    }
  }

  // Formatting for MCP / Tool outputs
  const isTool = message.provider === 'mcp' || message.tool_name || message.route === 'tool';
  
  return (
    <div className={\`py-6 px-4 \${isUser ? '' : 'bg-[var(--color-surface)] border-y border-[var(--color-border)]'}\`}>
      <div className="max-w-4xl mx-auto flex gap-4 md:gap-6">
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
              <User className="w-5 h-5 text-gray-500" />
            </div>
          ) : (
            <div className={\`w-8 h-8 rounded-full flex items-center justify-center text-white \${message.route === 'blocked' || message.route === 'error' ? 'bg-red-500' : 'bg-[var(--color-primary)]'}\`}>
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
`);

// 5. MessageList.jsx
fs.writeFileSync(path.join(srcDir, 'components/chat/MessageList.jsx'), `
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
`);

// 6. Sidebar.jsx
fs.writeFileSync(path.join(srcDir, 'components/chat/Sidebar.jsx'), `
import React from 'react';
import { Plus, MessageSquare, X, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const Sidebar = ({ 
  conversations, 
  activeConversationId, 
  onSelectConversation, 
  onNewChat,
  isOpen,
  onClose
}) => {
  const { user, logout } = useAuth();

  const sidebarClasses = \`
    fixed inset-y-0 left-0 z-50 w-72 bg-gray-50 border-r border-[var(--color-border)] flex flex-col transition-transform duration-300 ease-in-out
    md:translate-x-0 md:static md:w-64
    \${isOpen ? 'translate-x-0' : '-translate-x-full'}
  \`;

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

        <div className="p-3 border-b border-[var(--color-border)]">
          <button 
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-3 bg-white hover:bg-gray-100 border border-[var(--color-border)] rounded-lg text-sm font-medium transition-colors shadow-sm text-[var(--color-text-main)]"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
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
                className={\`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-left transition-colors \${activeConversationId === conv.id ? 'bg-gray-200 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-100'}\`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{conv.title || 'New Conversation'}</span>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[var(--color-border)] bg-white">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};
`);

// 7. Chat.jsx
fs.writeFileSync(path.join(srcDir, 'pages/Chat.jsx'), `
import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '../components/chat/Sidebar.jsx';
import { EmptyState } from '../components/chat/EmptyState.jsx';
import { MessageList } from '../components/chat/MessageList.jsx';
import { ChatInput } from '../components/chat/ChatInput.jsx';
import { chatService } from '../services/chatService.js';

export const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const handleSelectConversation = async (id) => {
    setActiveConversationId(id);
    try {
      const data = await chatService.getConversationDetails(id);
      setMessages(data.messages);
    } catch (err) {
      console.error('Failed to load conversation', err);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleSendMessage = async (text) => {
    const tempUserMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsThinking(true);

    try {
      const result = await chatService.sendMessage(text, activeConversationId);
      
      if (!activeConversationId) {
        setActiveConversationId(result.conversationId);
        loadConversations();
      }
      
      const data = await chatService.getConversationDetails(result.conversationId);
      setMessages(data.messages);
    } catch (err) {
      console.error('Failed to send message', err);
      const errorMsg = { 
        id: Date.now() + 1, 
        role: 'model', 
        route: 'error', 
        content: err.response?.data?.error?.message || err.message || 'An error occurred' 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar 
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center p-4 border-b border-[var(--color-border)] bg-white z-10">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-2 font-semibold text-[var(--color-text-main)]">ArmorIQ Chat</span>
        </header>
        
        <main className="flex-1 flex flex-col overflow-hidden relative bg-[var(--color-background)]">
          {messages.length === 0 ? (
            <EmptyState onExampleClick={handleSendMessage} />
          ) : (
            <MessageList messages={messages} isThinking={isThinking} />
          )}
        </main>
        
        <ChatInput onSendMessage={handleSendMessage} disabled={isThinking} />
      </div>
    </div>
  );
};
`);

// 8. index.css update for typography
let indexCss = fs.readFileSync(path.join(srcDir, 'index.css'), 'utf8');
if (!indexCss.includes('@plugin "@tailwindcss/typography"')) {
  indexCss = indexCss.replace('@import "tailwindcss";', '@import "tailwindcss";\\n@plugin "@tailwindcss/typography";');
  fs.writeFileSync(path.join(srcDir, 'index.css'), indexCss);
}

console.log("Chat UI setup completed successfully.");
