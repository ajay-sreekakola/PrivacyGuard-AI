import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import SafePrompt from './pages/SafePrompt';
import History from './pages/History';
import AuditLog from './pages/AuditLog';
import Policies from './pages/Policies';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import EmbeddingPlayground from './pages/EmbeddingPlayground';
import { Toaster } from 'react-hot-toast';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#0c1628', border: '1px solid rgba(0,200,255,0.2)', color: '#e8f4f8', fontSize: 13 },
          success: { iconTheme: { primary: '#00ff88', secondary: '#040810' } },
          error: { iconTheme: { primary: '#ff3366', secondary: '#040810' } }
        }} />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="safe-prompt" element={<SafePrompt />} />
            <Route path="embedding" element={<EmbeddingPlayground />} />
            <Route path="history" element={<History />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="policies" element={<Policies />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
