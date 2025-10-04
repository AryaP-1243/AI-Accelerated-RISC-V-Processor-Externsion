import React, { useState } from 'react';
import { CppGenerator } from './CppGenerator';
import { RtlGenerator } from './RtlGenerator';

type GeneratorMode = 'cpp' | 'rtl';

export const CodeGenerator: React.FC = () => {
  const [mode, setMode] = useState<GeneratorMode>('cpp');

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <div className="border-b border-slate-600 mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button onClick={() => setMode('cpp')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base transition-colors ${mode === 'cpp' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:border-slate-400 hover:text-slate-200'}`}>
                C++ to Assembly
              </button>
              <button onClick={() => setMode('rtl')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base transition-colors ${mode === 'rtl' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:border-slate-400 hover:text-slate-200'}`}>
                RTL Generator
              </button>
          </nav>
      </div>
      
      <div className="animate-fade-in" style={{ animationDuration: '0.3s' }}>
        {mode === 'cpp' ? <CppGenerator /> : <RtlGenerator />}
      </div>
    </div>
  );
};
