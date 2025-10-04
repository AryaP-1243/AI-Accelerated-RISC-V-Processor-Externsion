
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

type RtlTab = 'rtl' | 'testbench' | 'netlist' | 'sva';

const rtlExamples: RtlExample[] = [
  { 
    name: 'N-bit Counter', 
    description: 'A {WIDTH}-bit synchronous counter with enable and active-high {RESET_TYPE} reset.',
    parameters: [
        { name: 'WIDTH', label: 'Bit Width', type: 'number', defaultValue: 4 },
        { name: 'RESET_TYPE', label: 'Reset Type', type: 'select', defaultValue: 'asynchronous', options: ['asynchronous', 'synchronous'] }
    ]
  },
  { 
    name: 'N-bit ALU', 
    description: 'A simple {WIDTH}-bit ALU that can perform AND, OR, ADD, and SUB operations based on a 2-bit opcode.',
    parameters: [
        { name: 'WIDTH', label: 'Bit Width', type: 'number', defaultValue: 8 }
    ]
  },
  { 
    name: 'N-bit Shift Register', 
    description: 'A {WIDTH}-bit serial-in, parallel-out (SIPO) shift register with a left shift operation.',
    parameters: [
        { name: 'WIDTH', label: 'Bit Width', type: 'number', defaultValue: 8 }
    ]
  },
  { name: 'D Flip-Flop', description: 'A simple D flip-flop with an active-high asynchronous reset.' },
  { name: '4-to-1 MUX', description: 'A 4-to-1 multiplexer using a case statement.' },
  { name: 'Full Adder', description: 'A 1-bit full adder using combinational logic.' },
  { 
    name: 'FIFO Buffer', 
    description: 'A {DEPTH}-deep, {WIDTH}-bit wide synchronous FIFO buffer with empty and full flags, using pointers for read and write operations.',
    parameters: [
        { name: 'DEPTH', label: 'Depth', type: 'number', defaultValue: 16 },
        { name: 'WIDTH', label: 'Data Width', type: 'number', defaultValue: 8 }
    ]
  },
  { name: 'SPI Master', description: 'A basic SPI master interface controller with CPOL=0, CPHA=0.' },
  { name: 'UART Transmitter', description: 'A simplified UART transmitter module.' },
  { name: 'I2C Controller', description: 'A basic I2C master controller for single byte read/write operations.' },
  { name: 'Traffic Light FSM (Moore)', description: 'A Moore finite state machine for a simple North-South/East-West traffic light controller.' },
  { name: 'Traffic Light FSM (Mealy)', description: 'A Mealy finite state machine for a simple North-South/East-West traffic light controller with a pedestrian crosswalk request input.' },
  { name: 'Debouncer', description: 'A debouncing circuit for a push-button input using a counter.' },
  { name: 'Gray Code Converter', description: 'A 4-bit binary to Gray code converter.' },
  { name: 'Priority Encoder', description: 'An 8-to-3 priority encoder.' },
  { name: 'Barrel Shifter', description: 'An 8-bit combinational barrel shifter (logical left shift).' },
  { name: 'Hamming Code (7,4) Encoder', description: 'A Hamming code encoder for a 4-bit data input, generating 3 parity bits.' },
  { name: 'Sequence Detector (1011)', description: 'An FSM to detect the overlapping sequence "1011" in a serial bitstream.' },
  { name: 'N-bit Register', description: 'A simple {WIDTH}-bit register with a write enable signal.', parameters: [{ name: 'WIDTH', label: 'Bit Width', type: 'number', defaultValue: 8 }] },
  { name: 'AXI4-Lite Slave', description: 'A basic AXI4-Lite slave interface with one read/write register.' },
  { name: 'Clock Divider', description: 'A clock divider that divides the input clock frequency by {DIVISOR}.', parameters: [{ name: 'DIVISOR', label: 'Divisor', type: 'number', defaultValue: 2 }] },
  { name: 'Dual-Port RAM', description: 'A simple dual-port RAM with {DEPTH} words of {WIDTH} bits each.', parameters: [{ name: 'DEPTH', label: 'Depth', type: 'number', defaultValue: 64 }, { name: 'WIDTH', label: 'Width', type: 'number', defaultValue: 8 }] },
  { name: 'Carry-Lookahead Adder', description: 'A 4-bit carry-lookahead adder.' },
  { name: 'Sequential Multiplier', description: 'An 8-bit sequential multiplier using a shift-and-add algorithm.' },
  { name: 'Round-Robin Arbiter', description: 'A 4-request round-robin arbiter.' },
  { name: 'LFSR', description: 'An 8-bit Linear Feedback Shift Register with a maximal-length polynomial.' },
  { name: 'BRAM Interface', description: 'A simple block RAM interface controller.' },
  { name: 'PWM Generator', description: 'A Pulse Width Modulation (PWM) generator with a configurable duty cycle.' },
];

export const RtlGenerator: React.FC = () => {
    const [activeExampleName, setActiveExampleName] = useState(rtlExamples[0].name);
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

    const rtlCodeRef = useRef<HTMLElement>(null);
    const tbCodeRef = useRef<HTMLElement>(null);
    const netlistCodeRef = useRef<HTMLElement>(null);
    const svaCodeRef = useRef<HTMLElement>(null);
    
    const activeExample = useMemo(() => rtlExamples.find(ex => ex.name === activeExampleName)!, [activeExampleName]);

    const tabConfig = useMemo(() => ({
      rtl: { label: 'SystemVerilog', ref: rtlCodeRef, code: generatedCode?.rtlCode, lang: 'verilog' },
      testbench: { label: 'Testbench', ref: tbCodeRef, code: generatedCode?.testbenchCode, lang: 'verilog' },
      netlist: { label: 'Netlist View', ref: netlistCodeRef, code: generatedCode?.netlistDescription, lang: 'text' },
      sva: { label: 'Assertions (SVA)', ref: svaCodeRef, code: generatedCode?.svaCode, lang: 'verilog' },
    }), [generatedCode]);

    useEffect(() => {
        const initialParams: Record<string, string | number> = {};
        if (activeExample.parameters) {
            activeExample.parameters.forEach(p => { initialParams[p.name] = p.defaultValue; });
        }
        setParameters(initialParams);
        setGeneratedCode(null);
        setStreamingOutput('');
        setError(null);
        setActiveTab('rtl');
    }, [activeExample]);
    
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

        let finalDescription = activeExample.description;
        Object.entries(parameters).forEach(([key, value]) => {
            finalDescription = finalDescription.replace(`{${key}}`, String(value));
        });

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
            if (activeExample.name === 'FIFO Buffer') {
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
    }, [activeExample, parameters]);
    
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
        if (!activeExample.parameters) return null;
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

    return (
        <div className="animate-fade-in" style={{animationDuration: '0.3s'}}>
            <p className="text-slate-400 mb-4">
                Select a hardware module, customize its parameters, and let the AI generate the SystemVerilog RTL, a testbench, a conceptual netlist, and formal verification assertions.
            </p>
            <div className="grid lg:grid-cols-2 gap-8">
                <div>
                    <div className="mb-4">
                        <label htmlFor="rtl-example-select" className="block text-sm font-medium text-slate-300 mb-2">Select a Hardware Module</label>
                        <select id="rtl-example-select" value={activeExampleName} onChange={handleExampleChange} className="w-full p-3 font-mono text-sm bg-slate-900 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                            {rtlExamples.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
                        </select>
                    </div>
                    {renderParameterInputs()}
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
