
import React from 'react';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, icon, children }) => {
  return (
    <section>
      <div className="flex items-center mb-8">
        <span className="text-cyan-400">{icon}</span>
        <h2 className="ml-3 text-3xl font-bold tracking-tight text-slate-100">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
};