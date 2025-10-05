
import React from 'react';
import { CpuIcon } from './icons/CpuIcon';
import { ZapIcon } from './icons/ZapIcon';
import { CodeIcon } from './icons/CodeIcon';
import { ChipIcon } from './icons/ChipIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { ArchitectureDiagram } from './ArchitectureDiagram';

interface LandingPageProps {
  onGetStarted: () => void;
}

const HighlightCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({icon, title, description}) => {
    return (
        <div className="bg-slate-800/30 p-6 rounded-lg h-full">
            <div className="flex items-center text-cyan-400 mb-3">
                {icon}
                <h4 className="ml-3 text-lg font-bold text-slate-100">{title}</h4>
            </div>
            <p className="text-slate-400">{description}</p>
        </div>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      <div className="container mx-auto max-w-5xl px-4 py-16 sm:py-24 text-center">
        
        <header className="mb-16">
          <div className="flex justify-center items-center space-x-4 mb-6">
            <CpuIcon className="h-12 w-12 text-cyan-400" />
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 sm:text-5xl">
              AI-Accelerated RISC-V Processor
            </h1>
          </div>
          <h2 className="text-2xl font-semibold text-cyan-400 tracking-tight mb-6">
            A Hardware-Software Co-Design for Edge AI
          </h2>
          <p className="max-w-3xl mx-auto text-lg text-slate-400">
            The proliferation of AI at the edge demands high-performance, low-power computing solutions. This project presents a complete hardware-software co-design of a RISC-V processor with a custom Instruction Set Architecture (ISA) extension, specifically engineered to accelerate neural network inference. Explore the design, see the performance gains, and interact with our custom compiler.
          </p>
        </header>

        <section className="mb-16">
            <h3 className="text-3xl font-bold text-slate-100 mb-10 tracking-tight">Project Highlights</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                <HighlightCard
                    icon={<ZapIcon />}
                    title="Custom ISA Extensions"
                    description="Specialized instructions (MAC, ReLU, CONV2D, etc.) implemented in hardware to drastically reduce instruction count."
                />
                <HighlightCard
                    icon={<ChartBarIcon />}
                    title="~12x Performance Speedup"
                    description="Achieved significant speedup for key ML kernels compared to a standard RISC-V baseline in simulation."
                />
                 <HighlightCard
                    icon={<ZapIcon />}
                    title="High Energy Efficiency"
                    description="By reducing clock cycles per operation, the design significantly lowers energy consumption per inference."
                />
                <HighlightCard
                    icon={<CodeIcon />}
                    title="Optimizing Compiler"
                    description="An intelligent C++ to Assembly generator that automatically maps NN functions to the custom instructions."
                />
                <HighlightCard
                    icon={<ChipIcon />}
                    title="FPGA-Validated Design"
                    description="The processor core has been prototyped and validated on a Xilinx PYNQ-Z2 FPGA, proving its real-world viability."
                />
            </div>
        </section>
        
        <section className="mb-16">
            <h3 className="text-3xl font-bold text-slate-100 mb-10 tracking-tight">Architectural Overview</h3>
             <div className="max-w-3xl mx-auto bg-slate-800/50 p-8 rounded-lg border border-slate-700">
                <p className="text-lg text-slate-400 mb-6">The core concept is to augment a standard 5-stage RISC-V pipeline with a tightly-coupled Neural Network Acceleration Unit. This unit executes the new custom instructions, handling the heavy computational lifting while the main core manages control flow and standard operations.</p>
                <div className="mt-4">
                  <ArchitectureDiagram />
                </div>
             </div>
        </section>

        <footer className="mt-12">
           <p className="text-lg text-slate-400 mb-6">Log in to view the full project dashboard, including detailed metrics, simulation results, and the interactive compiler demo.</p>
           <button
            onClick={onGetStarted}
            className="bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-cyan-600 transition-transform duration-300 hover:scale-105"
          >
            Get Started
          </button>
        </footer>
      </div>
    </div>
  );
};
