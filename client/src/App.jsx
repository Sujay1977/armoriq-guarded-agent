
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Chat } from './pages/Chat.jsx';
import { Dashboard } from './pages/Dashboard.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Chat />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
