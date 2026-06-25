import fs from 'fs';
import path from 'path';

const clientDir = path.join(process.cwd(), 'client');
const srcDir = path.join(clientDir, 'src');

const dirs = [
  'components/auth',
  'context',
  'layouts',
  'pages',
  'services'
];

dirs.forEach(d => fs.mkdirSync(path.join(srcDir, d), { recursive: true }));

// 1. Vite config proxy
const viteConfigPath = path.join(clientDir, 'vite.config.js');
fs.writeFileSync(viteConfigPath, `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
`);

// 2. index.css (styling)
const indexCssPath = path.join(srcDir, 'index.css');
fs.writeFileSync(indexCssPath, `
@import "tailwindcss";

@theme {
  --color-primary: #10a37f;
  --color-primary-dark: #0e8c6d;
  --color-background: #ffffff;
  --color-surface: #f7f7f8;
  --color-border: #e5e5e5;
  --color-text-main: #353740;
  --color-text-muted: #6e6e80;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--color-text-main);
  background-color: var(--color-background);
}

.input-field {
  @apply w-full px-4 py-3 rounded-md border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all;
}

.btn-primary {
  @apply w-full py-3 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
`);

// 3. API Service
fs.writeFileSync(path.join(srcDir, 'services/api.js'), `
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
`);

// 4. Auth Service
fs.writeFileSync(path.join(srcDir, 'services/authService.js'), `
import api from './api.js';

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data.data;
  },
  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data.data;
  },
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data.data;
  }
};
`);

// 5. AuthContext
fs.writeFileSync(path.join(srcDir, 'context/AuthContext.jsx'), `
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService.js';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('accessToken');
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      navigate('/login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);
      navigate('/chat');
    }
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);
      navigate('/chat');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
`);

// 6. Protected Route
fs.writeFileSync(path.join(srcDir, 'components/auth/ProtectedRoute.jsx'), `
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
`);

// 7. Auth Layout
fs.writeFileSync(path.join(srcDir, 'layouts/AuthLayout.jsx'), `
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield } from 'lucide-react';

export const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/chat" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-[var(--color-border)]">
        <div className="text-center flex flex-col items-center">
          <div className="bg-[var(--color-primary)] p-3 rounded-full inline-flex mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            ArmorIQ Agent
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Secure, Guarded AI Workflows
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
`);

// 8. Login Page
fs.writeFileSync(path.join(srcDir, 'pages/Login.jsx'), `
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
      <div className="text-center text-sm">
        <span className="text-[var(--color-text-muted)]">Don't have an account? </span>
        <Link to="/register" className="font-medium text-[var(--color-primary)] hover:underline">
          Sign up
        </Link>
      </div>
    </form>
  );
};
`);

// 9. Register Page
fs.writeFileSync(path.join(srcDir, 'pages/Register.jsx'), `
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            required
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </div>
      <div className="text-center text-sm">
        <span className="text-[var(--color-text-muted)]">Already have an account? </span>
        <Link to="/login" className="font-medium text-[var(--color-primary)] hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
};
`);

// 10. Chat Page (Placeholder)
fs.writeFileSync(path.join(srcDir, 'pages/Chat.jsx'), `
import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut } from 'lucide-react';

export const Chat = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <header className="border-b border-[var(--color-border)] p-4 flex justify-between items-center">
        <h1 className="font-bold text-lg text-[var(--color-text-main)]">ArmorIQ Chat</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--color-text-muted)]">{user?.email}</span>
          <button 
            onClick={logout}
            className="p-2 text-[var(--color-text-muted)] hover:text-black rounded-md transition-colors border border-[var(--color-border)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center text-[var(--color-text-muted)]">
        Chat Interface Coming Soon...
      </main>
    </div>
  );
};
`);

// 11. App.jsx
fs.writeFileSync(path.join(srcDir, 'App.jsx'), `
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Chat } from './pages/Chat.jsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      
      <Route element={<ProtectedRoute />}>
        <Route path="/chat" element={<Chat />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}

export default App;
`);

// 12. main.jsx
fs.writeFileSync(path.join(srcDir, 'main.jsx'), `
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
`);

console.log("Client setup completed successfully.");
