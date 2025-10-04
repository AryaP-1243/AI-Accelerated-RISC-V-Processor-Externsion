
import React from 'react';

interface HeaderProps {
  username: string | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ username, onLogout }) => {
  return (
    <header className="bg-slate-900/70 backdrop-blur-md border-b border-slate-700 flex-shrink-0">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            {/* Title is now in the sidebar, this is a context header */}
             <h1 className="text-xl font-bold text-slate-100">
              Project Dashboard
            </h1>
          </div>
          {username && (
            <div className="flex items-center space-x-4">
              <span className="text-slate-300">Welcome, {username}</span>
              <button
                onClick={onLogout}
                className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};