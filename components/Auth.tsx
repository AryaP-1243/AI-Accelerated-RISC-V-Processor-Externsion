
import React, { useState } from 'react';

interface AuthProps {
  onLogin: (username: string) => void;
  onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    if (isLogin) {
      // Login logic
      const users = JSON.parse(localStorage.getItem('riscv_users') || '{}');
      if (users[username] && users[username] === password) {
        onLogin(username);
      } else {
        setError('Invalid username or password.');
      }
    } else {
      // Register logic
      const users = JSON.parse(localStorage.getItem('riscv_users') || '{}');
      if (users[username]) {
        setError('Username already exists.');
      } else {
        const newUsers = { ...users, [username]: password };
        localStorage.setItem('riscv_users', JSON.stringify(newUsers));
        setSuccess('Registration successful! Please log in.');
        setIsLogin(true);
        setUsername('');
        setPassword('');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative">
      <div className="absolute top-4 left-4">
        <button
          onClick={onBack}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>
      </div>
      <div className="max-w-md w-full mx-auto p-8 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100">
            {isLogin ? 'Login' : 'Register'}
          </h1>
          <p className="text-slate-400 mt-2">
            Access the AI-Accelerated RISC-V Showcase
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-300"
            >
              Username
            </label>
            <div className="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-slate-900 text-slate-100"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-300"
            >
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-slate-900 text-slate-100"
              />
            </div>
          </div>
          
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          {success && <p className="text-sm text-green-400 text-center">{success}</p>}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
            >
              {isLogin ? 'Sign in' : 'Create Account'}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {isLogin
              ? "Don't have an account? Register"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
