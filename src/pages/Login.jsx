import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/admin/auth/login`, {
        email,
        password
      });

      const { token, admin } = response.data;
      login(token, admin);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.error || 'Access denied';
      if (message === 'invalid_credentials') setError('Email ou mot de passe incorrect');
      else if (message === 'account_disabled') setError('Compte désactivé');
      else setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-philia-bg flex items-center justify-center p-4">
      <div className="bg-philia-card border border-philia-border rounded-2xl p-10 max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="text-philia-accent font-bold text-2xl tracking-widest mb-2">
            PHILIA VAULT
          </div>
          <div className="text-philia-muted font-mono text-xs tracking-widest">
            ADMIN DASHBOARD
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-xs font-mono p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-philia-muted text-xs font-mono mb-2">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-philia-bg border border-philia-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-philia-accent transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-philia-muted text-xs font-mono mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-philia-bg border border-philia-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-philia-accent transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-philia-accent text-black font-bold py-3 rounded-lg hover:bg-philia-accent-hover transition-colors disabled:opacity-50 mt-4"
          >
            {isLoading ? 'CONNECTING...' : 'LOGIN'}
          </button>
        </form>

        <p className="text-philia-muted text-center font-mono text-[10px] mt-8">
          Access restricted to authorized team members only.
        </p>
      </div>
    </div>
  );
};
