
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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    loadConversations();
    const savedId = localStorage.getItem('activeConversationId');
    if (savedId) {
      handleSelectConversation(savedId);
    }
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
    localStorage.setItem('activeConversationId', id);
    setIsLoadingHistory(true);
    setHistoryError('');
    try {
      const data = await chatService.getConversationDetails(id);
      setMessages(data.messages);
    } catch (err) {
      console.error('Failed to load conversation', err);
      setHistoryError('Failed to load conversation history.');
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleNewChat = () => {
    const newId = crypto.randomUUID();
    setActiveConversationId(newId);
    localStorage.setItem('activeConversationId', newId);
    setMessages([]);
    setHistoryError('');
    setConversations(prev => [{ id: newId, title: 'New Conversation', created_at: new Date().toISOString() }, ...prev]);
    setTimeout(() => {
      document.getElementById('chat-input')?.focus();
    }, 0);
  };

  const handleSendMessage = async (text) => {
    const tempUserMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsThinking(true);

    try {
      const result = await chatService.sendMessage(text, activeConversationId);
      
      if (!activeConversationId && result.conversationId) {
        setActiveConversationId(result.conversationId);
        loadConversations();
      }
      
      const newMsg = {
        id: Date.now() + 2,
        role: 'model',
        content: result.response,
        route: result.route,
        provider: result.provider
      };
      setMessages(prev => [...prev, newMsg]);
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
          {isLoadingHistory ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            </div>
          ) : historyError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-red-500">
              <p>{historyError}</p>
              <button 
                onClick={() => handleSelectConversation(activeConversationId)} 
                className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : messages.length === 0 ? (
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
