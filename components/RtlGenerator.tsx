import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { generateRtlStream, generateRtlExplanation, AiResponseError, RtlGenerationResult } from '../services/geminiService';
import { XIcon } from './icons/XIcon';

declare global {
  interface Window {
    Prism: {
      highlightAll: () => void;
      highlightElement: (element: Element) => void;
    };
  }
}

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => (
  <div className="flex justify-center items-center h-full">
    <div className={`animate-spin rounded-full border-b-2 border-cyan-400 ${size === 'sm' ? 'h-5 w-5' : 'h-8 w-8'}`}></div>
  </div>
);

const CodeBlockWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const textInput = useRef<HTMLDivElement>(null);
    const [isCopied, setIsCopied] = useState(false);

    const onCopy = () => {
        if (textInput.current?.textContent) {
            navigator.clipboard.writeText(textInput.current.textContent);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="relative group h-full" ref={textInput}>
            <button
                onClick={onCopy}
                className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-sans rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
                {isCopied ? 'Copied!' : 'Copy'}
            </button>
            {children}
        </div>
    );
};

type Parameter = {
  name: string;
  label: string;
  type: 'number' | 'text' | 'select';
  defaultValue: string | number;
  options?: string[];
};

type RtlExample = {
  name: string;
  description: string;
  parameters?: Parameter[];
};

type RtlExampleCategory = {
    category: string;
    examples: RtlExample[];
};

type RtlTab = 'rtl' | 'testbench' | 'netlist' | 'sva';

const rtlExamples: RtlExampleCategory[] = [
  {
    category: "Basic Hardware & Interfaces",
    examples: [
      { name: "32-Bit Adder Module", description: "Generate a SystemVerilog module for a 32-bit ripple-carry adder." },
      { name: "N-Bit Adder (Parameterized)", description: "Generate a parameterized SystemVerilog module for an N-bit ripple-carry adder.", parameters: [{ name: 'WIDTH', label: 'Bit Width', type: 'number', defaultValue: 16 }] },
      { name: "8-Bit Left Shift Register", description: "Write a SystemVerilog module for an 8-bit left-shift register." },
      { name: "16-Bit Counter (Async Reset)", description: "Generate a SystemVerilog module for a 16-bit counter with an asynchronous active-high reset." },
      { name: "Synchronous Up/Down Counter", description: "Create a 4-bit synchronous up/down counter with load and enable signals." },
      { name: "4-to-1 Multiplexer", description: "Create a 4-to-1 multiplexer in SystemVerilog using a case statement." },
      { name: "8-to-1 Demultiplexer", description: "Create an 8-to-1 demultiplexer." },
      { name: "2-to-4 Decoder", description: "Write a 2-to-4 binary decoder module in SystemVerilog." },
      { name: "32x32 Register File", description: "Generate a synthesizable SystemVerilog module for a 32x32 register file with two read ports and one write port." },
      { name: "FSM (Sequence 101)", description: "Create a SystemVerilog Moore FSM that detects the sequence '101'." },
      { name: "FSM (Traffic Light)", description: "Design a finite state machine for a simple traffic light controller." },
      { name: "UART Receiver", description: "Generate a basic UART receiver module." },
      { name: "UART Transmitter", description: "Generate a basic UART transmitter module." },
      { name: "SPI Master Controller", description: "Create a simple SPI master controller." },
      { name: "I2C Slave Controller", description: "Design a simple I2C slave controller with a single data register." },
      { name: "Basic Memory Controller", description: "Generate a simple memory controller for an SRAM chip." },
      { name: "Simple AXI4-Lite Slave", description: "Create a basic AXI4-Lite slave with a few read/write registers." },
      { name: "Basic FIFO Buffer", description: "Design a synchronous FIFO buffer with full and empty flags." },
      { name: "Synchronous Dual-Port RAM", description: "Generate a synchronous dual-port RAM (1 Write, 1 Read)." },
      { name: "Asynchronous Dual-Port RAM", description: "Generate an asynchronous dual-port RAM (1 Write, 1 Read)." },
      { name: "Clock Divider (Div by 2)", description: "Create a SystemVerilog module that generates a clock signal at half the input frequency." },
      { name: "Clock Divider (Parameterized)", description: "Generate a parameterized clock divider.", parameters: [{ name: 'DIVISOR', label: 'Divisor', type: 'number', defaultValue: 4 }] },
      { name: "JTAG Controller Module", description: "Design a simplified JTAG Test Access Port (TAP) controller FSM." },
      { name: "Debouncer Circuit", description: "Generate a SystemVerilog module that debounces a single push-button input." },
      { name: "8-Bit Multiplier (Combinational)", description: "Create an 8-bit combinational array multiplier." },
      { name: "8-Bit Multiplier (Pipelined)", description: "Create a pipelined 8-bit multiplier for higher throughput." },
      { name: "CRC32 Generator", description: "Generate a CRC32 calculation module." },
      { name: "LFSR-Based Randomizer", description: "Design a Linear Feedback Shift Register for pseudo-random number generation." },
      { name: "Gray Code Counter", description: "Create a 4-bit Gray code counter." },
      { name: "Priority Encoder (8-to-3)", description: "Generate an 8-to-3 priority encoder." },
      { name: "Round-Robin Bus Arbitrator", description: "Design a 4-way round-robin bus arbitrator." },
      { name: "Priority Arbiter", description: "Design a 4-way fixed-priority arbiter." },
      { name: "Glitch-Free Clock Switch", description: "Create a glitch-free clock switching circuit." },
      { name: "Simple PWM Generator", description: "Generate a simple Pulse Width Modulation (PWM) signal generator." },
      { name: "Quadrature Encoder", description: "Design a module to read from a quadrature encoder." },
      { name: "Data Serializer", description: "Create a parallel-to-serial data serializer." },
      { name: "Data Deserializer", description: "Create a serial-to-parallel data deserializer." },
      { name: "Error Correction Module (Hamming)", description: "Generate a (7,4) Hamming code encoder and decoder." },
      { name: "Parity Generator", description: "Design an 8-bit even parity generator." },
      { name: "Parity Checker", description: "Design an 8-bit even parity checker." },
    ]
  },
  {
    category: "AI Hardware Accelerators",
    examples: [
      { name: "Conv2d 3x3 Hardware", description: "Create a SystemVerilog module for the custom conv2d.3x3 instruction logic." },
      { name: "MAC Array 8x8", description: "Generate the SystemVerilog for an 8x8 array of MAC (multiply-accumulate) units for the custom 'mac' instruction." },
      { name: "ReLU Unit (Int8)", description: "Design a SystemVerilog module for the custom relu instruction, including 8-bit signed integer support." },
      { name: "Max Pool 2x2 Hardware", description: "Create a hardware unit for a 2x2 max pooling operation." },
      { name: "Average Pool 2x2 Hardware", description: "Create a hardware unit for a 2x2 average pooling operation." },
      { name: "Custom Vector Add Unit", description: "Design a 4-element, 16-bit vector addition unit." },
      { name: "Custom Vector Mul Unit", description: "Design a 4-element, 16-bit vector multiplication unit." },
      { name: "Quantizer Hardware (Int16 to Int8)", description: "Create a SystemVerilog module that performs 16-bit to 8-bit integer quantization." },
      { name: "Dequantizer Hardware", description: "Create a hardware module for dequantization from Int8 to Float16." },
      { name: "Small Neural Network Layer", description: "Design a SystemVerilog module for a complete, small neural network layer (e.g., convolution + ReLU)." },
      { name: "DataPath for AI Instruction", description: "Generate the SystemVerilog for the data path of the AI-accelerated RISC-V processor." },
      { name: "Control Logic for Conv2d", description: "Write the SystemVerilog for the control logic to handle the custom conv2d instruction." },
      { name: "Control Logic for MAC", description: "Write the SystemVerilog for the control logic of the MAC unit." },
      { name: "Control Logic for ReLU", description: "Write the SystemVerilog for the control logic of the ReLU unit." },
      { name: "Memory Interface for AI", description: "Generate a SystemVerilog module for a simple memory interface optimized for loading AI model parameters." },
      { name: "Weight Buffer Hardware", description: "Design a double-buffered memory for storing neural network weights." },
      { name: "Activation Buffer Hardware", description: "Design a ping-pong buffer for streaming neural network activations." },
      { name: "Custom AI Instruction Decoder", description: "Create a decoder for a custom set of AI instructions." },
      { name: "AI Instruction Pipeline Stage", description: "Create the SystemVerilog for a new pipeline stage to execute the custom AI instructions." },
      { name: "Simple Image Processor", description: "Design a simple image processing pipeline (e.g., filter -> activation)." },
      { name: "DSP Slice-Based Accelerator", description: "Create a module optimized for FPGA DSP slices." },
      { name: "FPGA-Optimized Conv2d", description: "Generate a Conv2d module optimized for Xilinx FPGA architecture." },
      { name: "Tensor Core-Like Unit", description: "Design a simplified tensor core unit for 4x4 matrix operations." },
      { name: "Integer-Only NN Core", description: "Create a complete integer-only neural network inference core." },
      { name: "Hardware Scheduler for AI", description: "Generate a module that can schedule AI workload tasks onto the custom accelerators." },
      { name: "AI Interrupt Controller", description: "Design an interrupt controller for the AI accelerator." },
      { name: "Power Gating for AI Core", description: "Implement power gating control logic for the AI core." },
      { name: "Fused Conv-ReLU Hardware", description: "Design a module that fuses convolution and ReLU operations." },
      { name: "Fused MM-Bias Hardware", description: "Design a module that fuses matrix multiplication and bias addition." },
      { name: "Small FPGA NN Demo", description: "Create a small end-to-end neural network demo for an FPGA." },
      { name: "Simple Object Detection Core", description: "Design a simplified core for object detection (e.g., part of a YOLO pipeline)." },
      { name: "Memory Bandwidth Optimizer for AI", description: "Design a memory controller that optimizes bandwidth for AI workloads." },
      { name: "On-Chip Memory for AI", description: "Design a specialized on-chip memory system for AI." },
      { name: "Custom Activation Function", description: "Implement a hardware module for a custom activation function (e.g., Leaky ReLU)." },
      { name: "Hardware for Attention Mechanism", description: "Design a simplified hardware block for a Transformer attention mechanism." },
      { name: "Layer Normalization Hardware", description: "Create a hardware module for layer normalization." },
      { name: "RMS Normalization Hardware", description: "Create a hardware module for RMS normalization." },
      { name: "SystemVerilog for Small Transformer", description: "Design a small Transformer block in SystemVerilog." },
      { name: "Mixed-Precision Arithmetic Unit", description: "Design an arithmetic unit that supports mixed-precision operations (e.g., INT8 x INT4)." },
      { name: "Hardware for Sparse Matrix Ops", description: "Create a hardware module for sparse matrix operations." },
      { name: "Vector Gather/Scatter Hardware", description: "Design a hardware unit for vector gather/scatter memory operations." },
      { name: "Vector Masked Ops Hardware", description: "Implement hardware for masked vector operations." },
      { name: "Dynamic-Precision Accelerator", description: "Design an accelerator that supports dynamic precision." },
      { name: "Streaming AI Processor", description: "Create a streaming processor for AI data." },
      { name: "Efficient Data Mover for AI", description: "Design an efficient DMA-like data mover for AI tensors." },
      { name: "Weight Compression/Decompression", description: "Implement hardware for weight compression and decompression." },
      { name: "Systolic Array for MAC", description: "Generate a 4x4 systolic array for matrix multiplication." },
      { name: "Simple Convolutional Engine", description: "Design a simple, self-contained convolutional engine." },
      { name: "Hardware for RNN Cell", description: "Create a hardware implementation of a simple Recurrent Neural Network (RNN) cell." },
      { name: "Hardware for GRU Cell", description: "Design a hardware module for a Gated Recurrent Unit (GRU) cell." },
      { name: "Hardware for LSTM Cell", description: "Design a hardware module for a Long Short-Term Memory (LSTM) cell." },
      { name: "Hardware for Graph Neural Network", description: "Create a simplified hardware accelerator for a Graph Neural Network layer." },
      { name: "Hardware for K-Means Clustering", description: "Design a hardware module to accelerate K-Means clustering." },
      { name: "Hardware for Reinforcement Learning", description: "Create a hardware module for a simple reinforcement learning algorithm." },
      { name: "Hardware for Genetic Algorithm", description: "Design a hardware accelerator for a simple genetic algorithm." },
      { name: "Hardware for Tree-Based Model", description: "Create a hardware module for a simple decision tree model." },
      { name: "Hardware for Support Vector Machine", description: "Design a hardware accelerator for a Support Vector Machine." },
      { name: "Hardware for K-Nearest Neighbor", description: "Create a hardware module for the K-Nearest Neighbor algorithm." },
      { name: "Hardware for Decision Tree", description: "Design a hardware module for executing a decision tree." },
      { name: "Hardware for Naive Bayes", description: "Create a hardware accelerator for the Naive Bayes algorithm." },
    ]
  }
];

const findExample = (name: string): RtlExample | undefined => {
    for (const category of rtlExamples) {
        const example = category.examples.find(ex => ex.name === name);
        if (example) return example;
    }
    return undefined;
};

export const RtlGenerator: React.FC = () => {
    const [activeExampleName, setActiveExampleName] = useState(rtlExamples[0].examples[0].name);
    const [parameters, setParameters] = useState<Record<string, string | number>>({});
    const [generatedCode, setGeneratedCode] = useState<RtlGenerationResult | null>(null);
    const [streamingOutput, setStreamingOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<RtlTab>('rtl');
    const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
    const [explanationText, setExplanationText] = useState('');
    const [isExplaining, setIsExplaining] = useState(false);
    const [explanationError, setExplanationError] = useState<string | null>(null);
    const [explanationTarget, setExplanationTarget] = useState('');
    const [customDescription, setCustomDescription] = useState('');

    const rtlCodeRef = useRef<HTMLElement>(null);
    const tbCodeRef = useRef<HTMLElement>(null);
    const netlistCodeRef = useRef<HTMLElement>(null);
    const svaCodeRef = useRef<HTMLElement>(null);
    
    const activeExample = useMemo(() => findExample(activeExampleName) || null, [activeExampleName]);

    const tabConfig = useMemo(() => ({
      rtl: { label: 'SystemVerilog', ref: rtlCodeRef, code: generatedCode?.rtlCode, lang: 'verilog' },
      testbench: { label: 'Testbench', ref: tbCodeRef, code: generatedCode?.testbenchCode, lang: 'verilog' },
      netlist: { label: 'Netlist View', ref: netlistCodeRef, code: generatedCode?.netlistDescription, lang: 'text' },
      sva: { label: 'Assertions (SVA)', ref: svaCodeRef, code: generatedCode?.svaCode, lang: 'verilog' },
    }), [generatedCode]);

    useEffect(() => {
        if (activeExampleName === 'Custom Code') {
            setParameters({});
            setGeneratedCode(null);
            setStreamingOutput('');
            setError(null);
            setActiveTab('rtl');
            return;
        }

        const example = findExample(activeExampleName);
        if (example) {
            const initialParams: Record<string, string | number> = {};
            if (example.parameters) {
                example.parameters.forEach(p => { initialParams[p.name] = p.defaultValue; });
            }
            setParameters(initialParams);
            setCustomDescription('');
            setGeneratedCode(null);
            setStreamingOutput('');
            setError(null);
            setActiveTab('rtl');
        }
    }, [activeExampleName]);
    
    useEffect(() => {
        if (isLoading || !generatedCode || !window.Prism) return;
        const elementToHighlight = tabConfig[activeTab]?.ref.current;
        if (elementToHighlight) window.Prism.highlightElement(elementToHighlight);
    }, [activeTab, generatedCode, isLoading, tabConfig]);

    const handleParameterChange = (name: string, value: string | number) => {
        setParameters(prev => ({ ...prev, [name]: value }));
    };

    const handleExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setActiveExampleName(e.target.value);
    };

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedCode(null);
        setStreamingOutput('');

        let finalDescription = customDescription || activeExample?.description || '';
        if (activeExample && !customDescription) {
            Object.entries(parameters).forEach(([key, value]) => {
                finalDescription = finalDescription.replace(`{${key}}`, String(value));
            });
        }
        
        if (!finalDescription.trim()) {
            setError("Please select an example or provide a custom description.");
            setIsLoading(false);
            return;
        }

        let fullResponseText = '';
        try {
            const stream = generateRtlStream(finalDescription);
            for await (const chunk of stream) {
                fullResponseText += chunk;
                setStreamingOutput(fullResponseText);
            }
            
            const result = JSON.parse(fullResponseText);
            if (!result || typeof result.rtlCode !== 'string' || typeof result.testbenchCode !== 'string' || typeof result.netlistDescription !== 'string' || typeof result.svaCode !== 'string' || typeof result.validation !== 'object' || result.validation === null || typeof result.validation.hasErrors !== 'boolean' || !Array.isArray(result.validation.errors)) {
                throw new AiResponseError("The AI service returned a response with an unexpected structure.");
            }
            if (activeExample?.name === 'FIFO Buffer') {
                result.svaCode = `// --- AUTO-INJECTED SYSTEMVERILOG ASSERTION FOR FIFO BUFFER ---
// This assertion is critical for verifying the fundamental correctness of the FIFO.
// It has been automatically added by the generator for this specific example.

// Property: \`p_not_full_and_empty\`
// Description: This property formally specifies that the 'full' and 'empty'
//              output flags of the FIFO must never be asserted high in the
//              same clock cycle. This condition represents an impossible state
//              for a valid FIFO and indicates a major flaw in the control logic
//              if it ever occurs.
property p_not_full_and_empty;
    @(posedge clk) disable iff (rst) // Assertion is not checked during reset
        !(full && empty);
endproperty

// Assertion: \`a_mutual_exclusion_check\`
// Description: This concurrent assertion instantiates and continuously monitors
//              the \`p_not_full_and_empty\` property throughout the simulation.
//              If the property is ever violated, the simulation will halt with
//              a descriptive error message, pinpointing the design bug.
a_mutual_exclusion_check: assert property (p_not_full_and_empty)
    else $error("SVA VIOLATION: The FIFO's 'full' and 'empty' flags were asserted simultaneously, which is a critical design error.");
`;
            }
            setGeneratedCode(result);
        } catch (e) {
            if (e instanceof AiResponseError) {
                setError(`The AI service returned an invalid response. This can happen with ambiguous descriptions.`);
            } else {
                setError(`Failed to generate RTL. The AI model could not be reached or failed to process the request.`);
            }
            console.error(e);
            setGeneratedCode(null);
        } finally {
            setIsLoading(false);
            setStreamingOutput('');
        }
    }, [activeExample, parameters, customDescription]);
    
    const handleExplainCode = useCallback(async () => {
        if (!generatedCode || isExplaining) return;
        
        const activeTabData = tabConfig[activeTab];
        const codeToExplain = activeTabData.code;
        const codeLanguage = activeTabData.lang === 'verilog' ? 'SystemVerilog' : 'Text Netlist';
        if (!codeToExplain?.trim()) return;

        setIsExplaining(true);
        setExplanationText('');
        setExplanationError(null);
        setExplanationTarget(activeTabData.label);
        setIsExplainModalOpen(true);

        try {
            const explanation = await generateRtlExplanation(codeToExplain, codeLanguage);
            setExplanationText(explanation);
        } catch (e: any) {
            setExplanationError(e.message || 'Failed to generate explanation.');
            console.error(e);
        } finally {
            setIsExplaining(false);
        }
    }, [activeTab, generatedCode, isExplaining, tabConfig]);


    const renderParameterInputs = () => {
        if (!activeExample || !activeExample.parameters || activeExampleName === 'Custom Code') return null;
        return (
            <div className="grid grid-cols-2 gap-4 mb-4">
                {activeExample.parameters.map(param => (
                    <div key={param.name}>
                        <label htmlFor={param.name} className="block text-sm font-medium text-slate-300 mb-1">{param.label}</label>
                        {param.type === 'select' ? (
                            <select id={param.name} value={parameters[param.name]} onChange={(e) => handleParameterChange(param.name, e.target.value)} className="w-full p-2 font-mono text-sm bg-slate-900 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                {param.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        ) : (
                            <input id={param.name} type={param.type} value={parameters[param.name]} onChange={(e) => handleParameterChange(param.name, param.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)} className="w-full p-2 font-mono text-sm bg-slate-900 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        )}
                    </div>
                ))}
            </div>
        );
    };
    
    const renderCustomInput = () => (
        <div className="mb-4">
            <label htmlFor="custom-description" className="block text-sm font-medium text-slate-300 mb-2">Custom Hardware Description</label>
            <textarea
                id="custom-description"
                value={customDescription}
                onChange={(e) => {
                    setCustomDescription(e.target.value);
                    if (e.target.value.trim()) {
                        setActiveExampleName('Custom Code');
                    }
                }}
                className="w-full h-24 p-3 font-sans text-sm bg-slate-900 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g., 'A 4-bit synchronous counter with an active-low reset and a clock enable signal.'"
            />
        </div>
    );

    return (
        <div className="animate-fade-in" style={{animationDuration: '0.3s'}}>
            <p className="text-slate-400 mb-4">
                This generator uses an AI model to translate high-level hardware descriptions into synthesizable SystemVerilog. Select a pre-built example, customize its parameters, or write your own description from scratch to generate the RTL, a testbench, a conceptual netlist, and formal verification assertions.
            </p>
            <div className="grid lg:grid-cols-2 gap-8">
                <div>
                    <div className="mb-4">
                        <label htmlFor="rtl-example-select" className="block text-sm font-medium text-slate-300 mb-2">Select a Hardware Module</label>
                        <select id="rtl-example-select" value={activeExampleName} onChange={handleExampleChange} className="w-full p-3 font-mono text-sm bg-slate-900 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                           {rtlExamples.map(category => (
                                <optgroup key={category.category} label={category.category}>
                                    {category.examples.map(ex => (
                                        <option key={ex.name} value={ex.name}>{ex.name}</option>
                                    ))}
                                </optgroup>
                           ))}
                           <option value="Custom Code">Custom Code...</option>
                        </select>
                    </div>
                    
                    {activeExampleName === 'Custom Code' ? renderCustomInput() : renderParameterInputs()}
                    
                    <div className="mt-6 text-center lg:text-left">
                        <button onClick={handleGenerate} disabled={isLoading} className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:scale-100">
                            {isLoading ? 'Generating...' : 'Generate RTL'}
                        </button>
                    </div>
                </div>
                <div>
                    <div className="border-b border-slate-600 mb-2 flex justify-between items-center">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            {(Object.keys(tabConfig) as RtlTab[]).map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:border-slate-400 hover:text-slate-200'}`}>
                                    {tabConfig[tab].label}
                                </button>
                            ))}
                        </nav>
                        <button onClick={handleExplainCode} disabled={!generatedCode || isExplaining} className="text-sm bg-slate-700 text-cyan-300 px-3 py-1 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
                           {isExplaining && <LoadingSpinner size="sm" />}
                           <span>Explain Code</span>
                        </button>
                    </div>
                    <div className="w-full h-[400px] bg-slate-900 text-slate-100 rounded-md border border-slate-600 overflow-y-auto">
                        {isLoading ? (
                            <pre className="language-json !bg-transparent !p-0 h-full"><code className="language-json h-full block p-3 whitespace-pre-wrap">{streamingOutput || <LoadingSpinner />}</code></pre>
                        ) : error ? (
                            <div className="text-red-400 p-4 whitespace-pre-wrap">{error}</div>
                        ) : generatedCode ? (
                            (Object.keys(tabConfig) as RtlTab[]).map(tab => (
                                <div key={tab} style={{ display: activeTab === tab ? 'block' : 'none' }} className="h-full">
                                    <CodeBlockWrapper>
                                        <pre className={`language-${tabConfig[tab].lang} !bg-transparent !p-0 h-full !m-0`}><code ref={tabConfig[tab].ref} className={`language-${tabConfig[tab].lang} h-full block p-3 whitespace-pre-wrap`}>{tabConfig[tab].code || `// No ${tabConfig[tab].label} generated for this module.`}</code></pre>
                                    </CodeBlockWrapper>
                                </div>
                            ))
                        ) : (
                            <div className="text-slate-500 p-4">Generated output will appear here.</div>
                        )}
                    </div>
                </div>
            </div>
            {isExplainModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" style={{animationDuration: '0.2s'}}>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <h2 className="text-2xl font-bold text-slate-100">AI Explanation of <span className="text-cyan-400">{explanationTarget}</span></h2>
                            <button onClick={() => setIsExplainModalOpen(false)} className="text-slate-400 hover:text-slate-100"><XIcon /></button>
                        </div>
                        <div className="overflow-y-auto pr-4 -mr-4">
                            {isExplaining ? <LoadingSpinner /> : 
                             explanationError ? <p className="text-red-400">{explanationError}</p> :
                             <pre className="text-slate-300 whitespace-pre-wrap font-sans bg-slate-900/50 p-4 rounded-md">{explanationText}</pre>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};