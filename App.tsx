
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { Section } from './components/Section';
import { Card } from './components/Card';
import { CodeGenerator } from './components/CodeGenerator';
import { ZapIcon } from './components/icons/ZapIcon';
import { ChipIcon } from './components/icons/ChipIcon';
import { CodeIcon } from './components/icons/CodeIcon';
import { Auth } from './components/Auth';
import { Sidebar } from './components/Sidebar';
import { CpuIcon } from './components/icons/CpuIcon';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { MemoryMapVisualizer } from './components/MemoryMapVisualizer';

type View = 'landing' | 'auth' | 'dashboard';
export type DashboardView = 'features' | 'implementation' | 'memory_map' | 'compiler_optimizations' | 'pipeline_visualization' | 'demo' | 'conclusion';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [view, setView] = useState<View>('landing');
  const [dashboardView, setDashboardView] = useState<DashboardView>('features');

  useEffect(() => {
    const loggedInUser = localStorage.getItem('riscv_currentUser');
    if (loggedInUser) {
      setCurrentUser(loggedInUser);
      setView('dashboard');
    } else {
      setView('landing');
    }
  }, []);

  const handleLogin = (username: string) => {
    localStorage.setItem('riscv_currentUser', username);
    setCurrentUser(username);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('riscv_currentUser');
    setCurrentUser(null);
    setView('landing');
  };
  
  const renderDashboardContent = () => {
    switch (dashboardView) {
      case 'features':
        return (
          <Section title="Key Features" icon={<ZapIcon />}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card
                title="Expanded Custom ISA"
                description="Includes a rich set of instructions for MAC, convolutions, pooling, and multiple activation functions (ReLU, Sigmoid, Tanh), targeting a wide range of NN layers."
              />
              <Card
                title="Hardware-Software Co-Design"
                description="A holistic approach with SystemVerilog RTL design and a custom C++ compiler backend to map high-level NN operators to the new instructions."
              />
              <Card
                title="Multi-Core Architecture"
                description="Features a dual-core configuration with a shared L2 cache and a dedicated bus to the NN accelerator, enabling parallel execution of control code and accelerated kernels."
              />
              <Card
                title="Advanced Power Management"
                description="Implements Dynamic Voltage and Frequency Scaling (DVFS), allowing the core to adapt its power consumption to the workload, drastically reducing energy usage."
              />
               <Card
                title="Target Workloads"
                description="Optimized for Convolutional Neural Networks (CNNs), Multi-Layer Perceptrons (MLPs), and various TinyML models for edge computing."
              />
               <Card
                title="FPGA-Validated Performance"
                description="The complete multi-core system has been prototyped and benchmarked on a Xilinx PYNQ-Z2, validating the performance and efficiency gains in real hardware."
              />
            </div>
          </Section>
        );
      case 'implementation':
        return (
          <Section title="Implementation Details" icon={<ChipIcon />}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-slate-400">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Dual-Core Pipeline</h3>
                <p>A dual-core implementation of the classic 5-stage RISC-V pipeline, featuring robust hazard detection, data forwarding, and a shared branch prediction unit for efficient instruction flow across both cores.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Instruction Encoding</h3>
                <p>Custom opcodes for all new instructions were seamlessly integrated into the standard RISC-V decoding logic, ensuring compatibility and extensibility.</p>
              </div>
               <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Instruction Latency & Throughput</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>mac/relu/sigmoid/tanh:</strong> Single-cycle latency, fully pipelined for a throughput of 1 instruction/cycle.</li>
                  <li><strong>conv2d.3x3/dwconv.3x3:</strong> 3-cycle latency. This multi-cycle operation replaces dozens of standard instructions.</li>
                   <li><strong>maxpool.2x2:</strong> 2-cycle latency, replacing a loop of comparisons and branches for a significant net gain.</li>
                </ul>
              </div>
               <div className="lg:col-span-3">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Advanced ISA Extensions</h3>
                <p>Beyond basic MAC and ReLU, the ISA now includes first-class instructions for other critical NN primitives:</p>
                 <ul className="list-disc list-inside space-y-1 mt-2">
                  <li><strong>`dwconv.3x3`:</strong> A dedicated instruction to accelerate depthwise separable convolutions, a key component of efficient models like MobileNet.</li>
                  <li><strong>`maxpool.2x2`:</strong> A hardware-level instruction to perform 2x2 max pooling, eliminating loop overhead for this common downsampling operation.</li>
                  <li><strong>`sigmoid`/`tanh`:</strong> Hardware support for additional non-linear activation functions, increasing the range of compatible neural network architectures.</li>
                </ul>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                 <h3 className="text-lg font-semibold text-cyan-400 mb-2">Simulation & Verification</h3>
                <p>Rigorous RTL simulation and verification were conducted in ModelSim and Vivado. Performance was benchmarked using standard ML kernels written in C++ and compiled for the custom ISA.</p>
              </div>
            </div>
          </Section>
        );
      case 'memory_map':
        return <MemoryMapVisualizer />;
      case 'compiler_optimizations':
        return (
          <Section title="Compiler Optimizations" icon={<CpuIcon />}>
            <div className="text-slate-400 space-y-4 max-w-4xl mb-8">
                <p>
                  The true power of a custom ISA is only unlocked by an intelligent compiler. Our C++ to Assembly generator acts as a sophisticated compiler backend, employing several optimization strategies to ensure the generated code leverages the custom hardware extensions for maximum performance and efficiency. It goes beyond simple translation, restructuring the code to best fit the processor's architecture.
                </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                <Card
                  title="Pattern Matching for Custom Instructions"
                  description="The compiler's primary role is to recognize specific C++ code patterns—such as a 3x3 convolution loop or a ReLU activation function—and replace dozens of standard RISC-V instructions (loads, stores, multiplies, adds, branches) with a single, highly-optimized custom instruction like `conv2d.3x3` or `relu`. This is the single most impactful optimization."
                />
                <Card
                  title="Loop Unrolling"
                  description="For loops that cannot be replaced by a single instruction (e.g., a 5x5 convolution), the compiler unrolls the loop. By replicating the loop body, it reduces branch overhead and increases the number of independent instructions, allowing the 5-stage pipeline to be saturated with useful work (`mac` instructions) and minimizing stalls."
                />
                <Card
                  title="Instruction Scheduling"
                  description="The compiler reorders instructions to prevent pipeline hazards. For example, it schedules data-loading instructions far ahead of when the data is needed by a compute instruction. This is critical for hiding the latency of memory access and ensuring the custom execution units are never left waiting for data to arrive from memory."
                />
                <Card
                  title="Intelligent Register Allocation"
                  description="Using graph-coloring algorithms, the compiler prioritizes keeping frequently accessed variables in the 32 fast RISC-V general-purpose registers. This drastically reduces the number of slow load/store operations to main memory, ensuring that operands for custom instructions are readily available and the pipeline remains fed."
                />
            </div>
          </Section>
        );
      case 'pipeline_visualization':
        return <PipelineVisualizer />;
      case 'demo':
        return (
          <Section title="Interactive AI Generators" icon={<CodeIcon />}>
            <CodeGenerator />
          </Section>
        );
      case 'conclusion':
        return (
           <Section title="Conclusion" icon={<ZapIcon />}>
            <div className="text-slate-400 space-y-6 max-w-4xl">
              <div>
                <p>
                  This project has successfully delivered on its goal of creating a complete, high-performance, and energy-efficient solution for edge AI. By thoughtfully extending the RISC-V ISA with domain-specific instructions and developing a tightly-integrated, AI-powered compiler, we have demonstrated order-of-magnitude improvements in performance and efficiency for critical neural network workloads. The resulting architecture, validated on FPGA, stands as a powerful testament to the potential of hardware-software co-design in the modern computing landscape. The interactive tools developed as part of this showcase provide a clear and accessible platform for understanding the deep interplay between software, compilers, and hardware architecture.
                </p>
              </div>
            </div>
          </Section>
        );
      default:
        return null;
    }
  };

  const MainDashboard = () => (
    <div className="flex h-screen bg-slate-900 text-slate-300">
      <Sidebar currentView={dashboardView} setView={setDashboardView} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header username={currentUser} onLogout={handleLogout} />
        <main className="flex-1 p-6 sm:p-8 lg:p-12 overflow-y-auto">
          <div key={dashboardView} className="animate-fade-in">
            {renderDashboardContent()}
          </div>
        </main>
      </div>
    </div>
  );

  if (view === 'landing') {
    return <LandingPage onGetStarted={() => setView('auth')} />;
  }
  
  if (view === 'auth') {
    return <Auth onLogin={handleLogin} onBack={() => setView('landing')} />;
  }

  return <MainDashboard />;
};

export default App;
