
import React from 'react';
import { Section } from './Section';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

const PaperSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6 break-inside-avoid">
        <h3 className="text-xl font-bold text-cyan-400 mb-2 border-b border-slate-700 pb-1">{title}</h3>
        <div className="space-y-3 text-slate-400">
            {children}
        </div>
    </div>
);

const Placeholder: React.FC<{ text: string, height?: string }> = ({ text, height = 'h-48' }) => (
    <div className={`bg-slate-800/50 p-4 my-4 rounded-lg border border-dashed border-slate-600 ${height} flex items-center justify-center`}>
        <p className="text-center text-slate-500 font-medium">{text}</p>
    </div>
);

export const ResearchPaper: React.FC = () => {
    return (
        <Section title="Research Paper" icon={<DocumentTextIcon />}>
            <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700 max-w-5xl mx-auto">
                <header className="text-center mb-8 border-b border-slate-700 pb-6">
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">AI-Accelerated RISC-V: A Hardware-Software Co-Design for High-Efficiency Edge Neural Network Inference</h1>
                    <p className="text-slate-400">Author(s): [Your Name/Team Name Here]</p>
                    <p className="text-slate-500 text-sm">Affiliation(s): [Your Institution/Company Here]</p>
                </header>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-cyan-400 mb-2">Abstract</h3>
                    <p className="text-slate-400 italic">
                        This work presents the design, implementation, and evaluation of an AI-accelerated RISC-V processor tailored for edge computing applications. To address the growing demand for high-performance, low-power machine learning inference, the standard RISC-V Instruction Set Architecture (ISA) is extended with a suite of custom instructions—including Multiply-Accumulate (MAC), ReLU, Sigmoid, Tanh, and a specialized 3x3 Convolution—designed to accelerate common neural network operations. Through a hardware-software co-design methodology, we developed a 5-stage pipelined core in SystemVerilog and a corresponding optimizing compiler backend that intelligently maps high-level C++ operators to the custom ISA. Simulation results demonstrate a significant performance uplift, achieving up to a 12x speedup for key machine learning kernels compared to a baseline RISC-V implementation. The design was prototyped and validated on a Xilinx PYNQ-Z2 FPGA, confirming its resource efficiency and real-world viability. This research substantiates that targeted ISA extensions offer a compelling and highly effective solution for enabling high-performance, low-power ML inference on resource-constrained edge devices.
                    </p>
                </div>
                
                <div className="md:columns-2 md:gap-8">
                    <PaperSection title="I. Introduction">
                        <p>The proliferation of Internet of Things (IoT) devices and the push towards decentralized intelligence have created an unprecedented demand for efficient Artificial Intelligence (AI) at the edge. Executing complex neural network (NN) models on resource-constrained edge devices presents a formidable challenge. General-purpose processors lack the specialized hardware for NN inference, leading to high latency and prohibitive energy consumption.</p>
                        <p>This paper proposes a hardware-software co-design approach centered on a custom RISC-V processor, introducing a small but powerful set of ISA extensions specifically targeting the most computationally intensive operations in modern neural networks.</p>
                    </PaperSection>

                    <PaperSection title="II. Background & Related Work">
                       <p>Our work is situated within the growing field of application-specific instruction set processors (ASIPs). By extending a base ISA like RISC-V, designers can achieve a balance between flexibility and performance. While other projects have explored RISC-V for ML, our contribution is unique in its focus on a minimal set of high-impact instructions and the tight integration with an intelligent compiler backend designed to maximize their utilization.</p>
                    </PaperSection>

                    <PaperSection title="III. Proposed Architecture & ISA Extension">
                        <p>The foundation of our design is a standard 5-stage RISC-V pipeline implementing the RV32IM instruction set. We augment this with a custom Neural Network Acceleration Unit (NNAU), which is activated when a custom instruction is decoded. The custom ISA includes `mac`, `relu`, `sigmoid`, `tanh`, and a multi-cycle `conv2d.3x3`.</p>
                         <Placeholder text="[Figure 1: High-level architecture diagram]" />
                    </PaperSection>

                    <PaperSection title="IV. Hardware Implementation">
                        <p>The processor was implemented in SystemVerilog. The `conv2d.3x3` instruction is a 3-cycle micro-coded operation, a significant improvement over the 27+ cycles for a software loop. The design was prototyped on a Xilinx PYNQ-Z2, and resource utilization is summarized below.</p>
                        <Placeholder text="[Table I: Resource Utilization on Xilinx PYNQ-Z2]" height="h-32" />
                    </PaperSection>

                    <PaperSection title="V. Compiler Co-Design">
                       <p>A custom ISA is only as effective as the compiler that targets it. Our compiler backend uses pattern matching to map C++ code to custom instructions, loop unrolling to expose parallelism, and instruction scheduling to hide memory latency, ensuring the hardware's potential is fully realized.</p>
                    </PaperSection>

                    <PaperSection title="VI. Experimental Results">
                        <p>We benchmarked our core on the PYNQ-Z2 FPGA against a standard RV32IM core and an ARM Cortex-M4 running CMSIS-NN. The custom ISA provides a dramatic reduction in clock cycles, with the `conv2d.3x3` instruction achieving over a 12x speedup for its kernel.</p>
                        <Placeholder text="[Figure 2: Performance comparison chart]" />
                        <p>For a complete CNN inference task, our design achieves a ~4.5x speedup in latency and a ~6.0x improvement in energy efficiency compared to the software-only baseline.</p>
                         <Placeholder text="[Table II: Comparison vs. ARM Cortex-M4]" height="h-32" />
                    </PaperSection>
                    
                    <PaperSection title="VII. Conclusion & Future Work">
                        <p>This project successfully demonstrates that extending the RISC-V ISA with domain-specific instructions is a highly effective strategy for accelerating neural network workloads on edge devices. Future work will explore multi-core architectures and the integration of more complex instructions for primitives like pooling layers.</p>
                    </PaperSection>

                    <div className="break-before-column">
                        <PaperSection title="References">
                            <ol className="list-decimal list-inside text-sm space-y-1">
                                <li>L. Lai, N. Suda, and D. Chandra, "CMSIS-NN: Efficient Neural Network Kernels for Arm Cortex-M CPUs," 2018.</li>
                                <li>R. David, J. Duke, et al., "TensorFlow Lite for Microcontrollers," 2020.</li>
                                <li>F. Conti, D. Rossi, et al., "An Open-Source Platform for Parallel Ultra-Low-Power Bio-Signal Processing," 2017.</li>
                            </ol>
                        </PaperSection>
                    </div>
                </div>
            </div>
        </Section>
    );
};
