
import React from 'react';
import { DashboardView } from '../App';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ZapIcon } from './icons/ZapIcon';
import { ChipIcon } from './icons/ChipIcon';
import { CodeIcon } from './icons/CodeIcon';
import { CpuIcon } from './icons/CpuIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { PlayIcon } from './icons/PlayIcon';
import { MicrochipIcon } from './icons/MicrochipIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';

interface SidebarProps {
  currentView: DashboardView;
  setView: (view: DashboardView) => void;
}

const navItems = [
    { id: 'abstract', label: 'Project Abstract', icon: <BookOpenIcon /> },
    { id: 'features', label: 'Key Features', icon: <ZapIcon /> },
    { id: 'implementation', label: 'Implementation', icon: <ChipIcon /> },
    { id: 'memory_map', label: 'Memory Map', icon: <MicrochipIcon /> },
    { id: 'compiler_optimizations', label: 'Compiler Optimizations', icon: <CpuIcon /> },
    { id: 'pipeline_visualization', label: 'Pipeline Visualizer', icon: <PlayIcon /> },
    { id: 'hardware_emulation', label: 'Hardware Emulation', icon: <ChartBarIcon /> },
    { id: 'demo', label: 'Interactive Demos', icon: <CodeIcon /> },
    { id: 'research_paper', label: 'Research Paper', icon: <DocumentTextIcon /> },
    { id: 'conclusion', label: 'Conclusion', icon: <ZapIcon /> },
];


export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  return (
    <aside className="w-72 bg-slate-800 flex-shrink-0 flex flex-col border-r border-slate-700">
       <div className="h-16 flex items-center px-6 border-b border-slate-700 flex-shrink-0">
         <div className="flex items-center space-x-3">
            <CpuIcon className="h-8 w-8 text-cyan-400" />
            <h1 className="text-lg font-bold text-slate-100 whitespace-nowrap">
              AI-Accelerated RISC-V
            </h1>
          </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as DashboardView)}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 ${
              currentView === item.id
                ? 'bg-cyan-500/10 text-cyan-300'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
            }`}
          >
            <span className="w-6 h-6 mr-3">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
