
import React from 'react';

interface CardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, description, children }) => {
  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 transition-all duration-300 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col">
      <div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-400">{description}</p>
      </div>
      {children && <div className="mt-4 flex-grow">{children}</div>}
    </div>
  );
};
