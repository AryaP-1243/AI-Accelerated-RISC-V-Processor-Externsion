import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Section } from './Section';
import { PlayIcon } from './icons/PlayIcon';

const sampleCode = `# Example with multiple hazard types
# Initial state: x1=256, Mem[256]=42
lw x2, 0(x1)    # LOAD WORD from Mem[256]
addi x3, x2, 4  # LOAD-USE HAZARD: addi needs x2, requires STALL
sw x3, 4(x1)    # STORE WORD to Mem[260]
add x5, x4, x1  # Result for x5 available in EX stage
sub x6, x5, x2  # EX->ID FORWARDING: sub needs x5 from add
beq x4, x0, end # CONTROL HAZARD: Branch
nop             # This instruction will be FLUSHED
end:
add x8, x8, x9
`;

type Instruction = {
    raw: string;
    op: string;
    rd?: number;
    rs1?: number;
    rs2?: number;
    imm?: number;
    pc: number;
    color?: string;
};

type PipelineStage = {
    instr: Instruction | null;
    pc: number | null;
    isStall?: boolean;
    isFlush?: boolean;
    result?: number;
    address?: number; // For memory instructions
};

// Define a specific type for pipeline stage names to fix multiple 'property does not exist on type unknown' errors.
type PipelineStageName = 'if' | 'id' | 'ex' | 'mem' | 'wb';

const initialPipeline: Record<PipelineStageName, PipelineStage> = {
    if: { instr: null, pc: null },
    id: { instr: null, pc: null },
    ex: { instr: null, pc: null },
    mem: { instr: null, pc: null },
    wb: { instr: null, pc: null },
};

const STAGE_NAMES: Record<PipelineStageName, string> = {
    if: "Instruction Fetch (IF)",
    id: "Instruction Decode (ID)",
    ex: "Execute (EX)",
    mem: "Memory Access (MEM)",
    wb: "Writeback (WB)",
};

const COLORS = [
    '#38bdf8', // sky-400
    '#34d399', // emerald-400
    '#facc15', // amber-400
    '#fb923c', // orange-400
    '#f87171', // red-400
    '#a78bfa', // violet-400
];

const parseReg = (regStr?: string): number | undefined => {
    if (!regStr) return undefined;
    const match = regStr.match(/x(\d+)/i);
    return match ? parseInt(match[1], 10) : undefined;
};

const parseAssembly = (code: string): { instructions: Instruction[], labels: Record<string, number> } => {
    const labels: Record<string, number> = {};
    const instructions: Omit<Instruction, 'pc'>[] = [];
    const rawLines = code.split('\n');
    let instructionIndex = 0;

    rawLines.forEach(line => {
        const trimmedLine = line.split('#')[0].trim();
        if (trimmedLine.length > 0) {
            const labelMatch = trimmedLine.match(/^(\w+):/);
            if (labelMatch) {
                labels[labelMatch[1]] = instructionIndex;
            } else {
                const parts = trimmedLine.replace(/,/g, '').split(/\s+/);
                const op = parts[0].toLowerCase();
                const instr: Omit<Instruction, 'pc' | 'color' | 'raw'> & { raw: string, label?: string } = { raw: trimmedLine, op };
                
                if (['add', 'sub'].includes(op)) {
                    instr.rd = parseReg(parts[1]);
                    instr.rs1 = parseReg(parts[2]);
                    instr.rs2 = parseReg(parts[3]);
                } else if (['addi'].includes(op)) {
                    instr.rd = parseReg(parts[1]);
                    instr.rs1 = parseReg(parts[2]);
                    instr.imm = parseInt(parts[3], 10);
                } else if (['lw', 'sw'].includes(op)) {
                    instr.rd = parseReg(parts[1]); // Destination for lw, source for sw
                    const memParts = parts[2]?.match(/(-?\d+)\((x\d+)\)/i);
                    if (memParts) {
                        instr.imm = parseInt(memParts[1], 10);
                        instr.rs1 = parseReg(memParts[2]);
                    }
                     if (op === 'sw') {
                        instr.rs2 = parseReg(parts[1]); // sw rs2 is same as rd field
                        instr.rd = undefined; // sw doesn't write to rd
                     }
                } else if (['beq'].includes(op)) {
                    instr.rs1 = parseReg(parts[1]);
                    instr.rs2 = parseReg(parts[2]);
                    instr.label = parts[3];
                } else if (['jal'].includes(op)) {
                    instr.rd = parseReg(parts[1]);
                    instr.label = parts[2];
                }
                instructions.push(instr);
                instructionIndex++;
            }
        }
    });
    
    const finalInstructions = instructions.map((instr, index) => ({ ...instr, pc: index }));
    return { instructions: finalInstructions, labels };
};

interface PipelineVisualizerProps {
    initialCode?: string;
    isEmbedded?: boolean;
}

const RegisterFileDisplay: React.FC<{ registers: number[], status: string[] }> = ({ registers, status }) => {
    const getStatusStyles = (regStatus: string) => {
        switch (regStatus) {
            case 'just-written': return 'animate-flash-green';
            case 'forwarding-source': return 'border-cyan-400';
            case 'writing': return 'border-yellow-400';
            case 'reading': return 'border-green-400';
            case 'load-use-hazard': return 'animate-flash-yellow';
            default: return 'border-slate-700';
        }
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Register File</h3>
            <div className="grid grid-cols-4 gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700 max-h-64 overflow-y-auto">
                {registers.map((value, i) => (
                    <div key={i} className={`p-1.5 rounded-md border-2 bg-slate-800 transition-all text-xs ${getStatusStyles(status[i])}`}>
                        <div className="flex justify-between items-center">
                             <span className="font-bold text-slate-300">x{i}</span>
                             <span className="font-mono text-slate-400">{value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DataMemoryDisplay: React.FC<{ memory: Record<number, number>, access: { address: number; type: 'read' | 'write' } | null }> = ({ memory, access }) => {
    const sortedAddresses = useMemo(() => Object.keys(memory).map(Number).sort((a, b) => a - b), [memory]);
    
    const getStatusStyles = (address: number) => {
        if (access?.address === address) {
            return access.type === 'read' ? 'animate-flash-green' : 'animate-flash-yellow';
        }
        return 'border-slate-700';
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2 mt-4">Data Memory</h3>
            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700 max-h-64 overflow-y-auto">
                {sortedAddresses.map(addr => (
                    <div key={addr} className={`p-1.5 mb-1.5 rounded-md border-2 bg-slate-800 transition-all text-xs ${getStatusStyles(addr)}`}>
                        <div className="flex justify-between items-center">
                             <span className="font-bold text-slate-300 font-mono">0x{addr.toString(16)}</span>
                             <span className="font-mono text-slate-400">{memory[addr]}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ initialCode = sampleCode, isEmbedded = false }) => {
    const [assemblyCode, setAssemblyCode] = useState(initialCode);
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [labels, setLabels] = useState<Record<string, number>>({});
    const [pc, setPc] = useState(0);
    const [cycle, setCycle] = useState(0);
    const [pipeline, setPipeline] = useState<Record<PipelineStageName, PipelineStage>>(initialPipeline);
    const [registerFile, setRegisterFile] = useState<number[]>([]);
    const [dataMemory, setDataMemory] = useState<Record<number, number>>({});
    const [lastWrittenReg, setLastWrittenReg] = useState<number | null>(null);
    const [highlightedPcs, setHighlightedPcs] = useState<Record<number, string>>({});
    const [memoryAccessStatus, setMemoryAccessStatus] = useState<{ address: number; type: 'read' | 'write' } | null>(null);

    const resetSimulationState = useCallback(() => {
        setCycle(0);
        setPc(0);
        setPipeline(initialPipeline);
        const regs = Array(32).fill(0);
        regs[1] = 256; // x1 = base address for lw/sw
        setRegisterFile(regs);
        setDataMemory({ 256: 42 });
        setLastWrittenReg(null);
        setMemoryAccessStatus(null);
    }, []);

    useEffect(() => {
        setAssemblyCode(initialCode);
    }, [initialCode]);

    useEffect(() => {
        const { instructions: parsed, labels: parsedLabels } = parseAssembly(assemblyCode);
        setInstructions(parsed);
        setLabels(parsedLabels);
        resetSimulationState();
    }, [assemblyCode, resetSimulationState]);

    const isFinished = useMemo(() => {
        return pc >= instructions.length && Object.values(pipeline).every((stage: PipelineStage) => stage.instr === null);
    }, [pc, instructions.length, pipeline]);
    
    const { hazardMessage, forwardingPath } = useMemo(() => {
        const id_instr = pipeline.id.instr;
        const ex_instr = pipeline.ex.instr;
        const mem_instr = pipeline.mem.instr;

        const idReadsReg = (reg?: number) => reg !== undefined && reg !== 0 && (id_instr?.rs1 === reg || id_instr?.rs2 === reg);

        // Data Hazard Priority 1: Load-Use Hazard (requires stall)
        if (ex_instr?.op === 'lw' && idReadsReg(ex_instr.rd)) {
            return {
                hazardMessage: `DATA HAZARD: Load-Use dependency on x${ex_instr.rd}. Stall required.`,
                forwardingPath: null,
            };
        }

        // Data Hazard Priority 2: EX -> ID Forwarding
        if (ex_instr?.rd !== undefined && idReadsReg(ex_instr.rd)) {
            return {
                hazardMessage: `FORWARDING: x${ex_instr.rd} forwarded from EX to ID.`,
                forwardingPath: { from: 'ex', to: 'id', reg: ex_instr.rd },
            };
        }

        // Data Hazard Priority 3: MEM -> ID Forwarding
        if (mem_instr?.rd !== undefined && idReadsReg(mem_instr.rd)) {
            return {
                hazardMessage: `FORWARDING: x${mem_instr.rd} forwarded from MEM to ID.`,
                forwardingPath: { from: 'mem', to: 'id', reg: mem_instr.rd },
            };
        }

        // Control Hazard: Branch/Jump in EX stage
        const ex_op = pipeline.ex.instr?.op;
        if ((ex_op === 'beq' || ex_op === 'jal') && pipeline.ex.instr) {
             return {
                hazardMessage: `CONTROL HAZARD: Branch ('${pipeline.ex.instr.raw}') in EX. Flush imminent if taken.`,
                forwardingPath: null,
            };
        }

        // No hazard detected
        return { hazardMessage: 'Status: No hazards detected.', forwardingPath: null };
    }, [pipeline]);

    useEffect(() => {
        const newHighlights: Record<number, string> = {};
        if (pc < instructions.length) {
            newHighlights[pc] = 'pc';
        }

        const { ex, id, if: if_stage } = pipeline;
        const isLoadUse = ex.instr?.op === 'lw' && id.instr && id.instr.rd !== 0 && (id.instr.rs1 === ex.instr.rd || id.instr.rs2 === ex.instr.rd);
        const isControlHazard = ex.instr && ['beq', 'jal'].includes(ex.instr.op);

        if (isLoadUse && ex.pc !== null) {
            newHighlights[ex.pc] = 'hazard-source';
            if (id.pc !== null) newHighlights[id.pc] = 'hazard-victim-stall';
        } else if (isControlHazard && ex.pc !== null) {
            newHighlights[ex.pc] = 'hazard-source-flush';
            if (id.isFlush && id.pc !== null) newHighlights[id.pc] = 'hazard-victim-flush';
            if (if_stage.isFlush && if_stage.pc !== null) newHighlights[if_stage.pc] = 'hazard-victim-flush';
        } else if (forwardingPath && forwardingPath.from && forwardingPath.to) {
            const fromPc = pipeline[forwardingPath.from as keyof typeof pipeline].pc;
            const toPc = pipeline[forwardingPath.to as keyof typeof pipeline].pc;
            if (fromPc !== null) newHighlights[fromPc] = 'forward-source';
            if (toPc !== null) newHighlights[toPc] = 'forward-dest';
        }
        
        setHighlightedPcs(newHighlights);
    }, [pipeline, pc, instructions, forwardingPath]);

    const registerStatus = useMemo(() => {
        const status = Array(32).fill('idle');
        const { id, ex } = pipeline;

        // Check for load-use hazard
        const isLoadUse = ex.instr?.op === 'lw' && id.instr && ex.instr.rd !== 0 && (id.instr.rs1 === ex.instr.rd || id.instr.rs2 === ex.instr.rd);
    
        // Set statuses with priority
        if (id.instr?.rs1 !== undefined) status[id.instr.rs1] = 'reading';
        if (id.instr?.rs2 !== undefined) status[id.instr.rs2] = 'reading';
    
        if (ex.instr?.rd !== undefined && ex.instr.rd !== 0) status[ex.instr.rd] = 'writing';
        if (pipeline.mem.instr?.rd !== undefined && pipeline.mem.instr.rd !== 0) status[pipeline.mem.instr.rd] = 'writing';
        
        if (forwardingPath) {
             status[forwardingPath.reg] = 'forwarding-source';
        }
    
        // HIGHEST PRIORITY OVERRIDES
        if (isLoadUse && ex.instr.rd !== undefined) {
            // The destination of the LW is the source of the hazard
            status[ex.instr.rd] = 'load-use-hazard'; 
        }

        if (lastWrittenReg !== null) {
            status[lastWrittenReg] = 'just-written';
        }
    
        return status;
    }, [pipeline, lastWrittenReg, forwardingPath]);

    const clockTick = useCallback(() => {
        if (isFinished) return;

        let newPc = pc;
        let stallId = false;
        let flushIf = false;
        let flushId = false;
        let regWrittenThisCycle: number | null = null;
        let branchTaken = false;
        let newMemoryAccessStatus: { address: number, type: 'read' | 'write' } | null = null;
        
        const newPipeline: Record<PipelineStageName, PipelineStage> = {
            if: { instr: null, pc: null },
            id: { instr: null, pc: null },
            ex: { instr: null, pc: null },
            mem: { instr: null, pc: null },
            wb: { instr: null, pc: null },
        };
        const newRegisterFile = [...registerFile];
        const newMemory = { ...dataMemory };
        
        setLastWrittenReg(null);

        // --- WB Stage ---
        const wb_instr = pipeline.mem.instr;
        const wb_result = pipeline.mem.result;
        if (wb_instr?.rd !== undefined && wb_instr.rd !== 0 && wb_result !== undefined) {
            newRegisterFile[wb_instr.rd] = wb_result;
            regWrittenThisCycle = wb_instr.rd;
        }
        newPipeline.wb = { instr: wb_instr, pc: pipeline.mem.pc, result: wb_result };

        // --- MEM Stage ---
        const mem_instr = pipeline.ex.instr;
        const mem_addr = pipeline.ex.address;
        let mem_result = pipeline.ex.result;

        if (mem_instr?.op === 'lw' && mem_addr !== undefined) {
            mem_result = dataMemory[mem_addr] || 0;
            newMemoryAccessStatus = { address: mem_addr, type: 'read' };
        } else if (mem_instr?.op === 'sw' && mem_addr !== undefined) {
            const valueToStore = pipeline.ex.result ?? 0;
            newMemory[mem_addr] = valueToStore;
            newMemoryAccessStatus = { address: mem_addr, type: 'write' };
        }
        newPipeline.mem = { instr: mem_instr, pc: pipeline.ex.pc, result: mem_result, address: mem_addr };

        // --- EX Stage ---
        const id_instr_for_ex = pipeline.id.instr;
        if (pipeline.ex.instr?.op === 'lw' && id_instr_for_ex && pipeline.ex.instr.rd !== 0 && pipeline.ex.instr.rd !== undefined && (id_instr_for_ex.rs1 === pipeline.ex.instr.rd || id_instr_for_ex.rs2 === pipeline.ex.instr.rd)) {
             stallId = true;
        }
        
        let ex_result: number | undefined = undefined;
        let ex_address: number | undefined = undefined;
        
        if (!stallId && id_instr_for_ex) {
            const getValue = (regNum?: number): number => {
                if (regNum === undefined || regNum === 0) return 0;
                if (pipeline.mem.instr?.rd === regNum && pipeline.mem.result !== undefined) return pipeline.mem.result;
                if (pipeline.ex.instr?.rd === regNum && pipeline.ex.result !== undefined) return pipeline.ex.result;
                if (wb_instr?.rd === regNum && wb_result !== undefined) return wb_result;
                return registerFile[regNum];
            };

            const val1 = getValue(id_instr_for_ex.rs1);
            const val2 = getValue(id_instr_for_ex.rs2);
            
            switch(id_instr_for_ex.op) {
                case 'add': ex_result = val1 + val2; break;
                case 'sub': ex_result = val1 - val2; break;
                case 'addi': ex_result = val1 + (id_instr_for_ex.imm ?? 0); break;
                case 'lw':
                case 'sw':
                    ex_address = val1 + (id_instr_for_ex.imm ?? 0);
                    if (id_instr_for_ex.op === 'sw') {
                        ex_result = val2; // Value to be stored
                    }
                    break;
                case 'beq':
                    if (val1 === val2) {
                        const label = id_instr_for_ex.raw.split(/\s+/).pop() || '';
                        newPc = labels[label] ?? pc;
                        branchTaken = true;
                    }
                    break;
                case 'jal':
                    ex_result = (id_instr_for_ex.pc + 1); // Return address is PC of next instruction
                    const label = id_instr_for_ex.raw.split(/\s+/).pop() || '';
                    newPc = labels[label] ?? pc;
                    branchTaken = true;
                    break;
            }
        }
        
        if(branchTaken) {
            flushIf = true;
            flushId = true;
        }

        newPipeline.ex = stallId ? { instr: null, pc: null, isStall: true } : { instr: id_instr_for_ex, pc: pipeline.id.pc, result: ex_result, address: ex_address };

        // --- ID Stage ---
        if (stallId) {
            newPipeline.id = { ...pipeline.id, isStall: true };
        } else if (flushId) {
            newPipeline.id = { instr: pipeline.if.instr, pc: pipeline.if.pc, isFlush: true };
        } else {
            newPipeline.id = { instr: pipeline.if.instr, pc: pipeline.if.pc };
        }
        
        // --- IF Stage ---
        if (flushIf) {
            newPipeline.if = { instr: null, pc: null, isFlush: true };
        } else if (stallId) {
            newPipeline.if = pipeline.if;
        } else if (newPc < instructions.length) {
            const nextInstr = instructions[newPc];
            if (nextInstr) {
                 const coloredInstr = { ...nextInstr, color: COLORS[nextInstr.pc % COLORS.length] };
                 newPipeline.if = { instr: coloredInstr, pc: newPc };
            }
        }
        
        setPipeline(newPipeline);
        setRegisterFile(newRegisterFile);
        setDataMemory(newMemory);
        setLastWrittenReg(regWrittenThisCycle);
        setMemoryAccessStatus(newMemoryAccessStatus);

        if (branchTaken) {
            setPc(newPc);
        } else if (!stallId) {
            setPc(pc + 1);
        }
        setCycle(c => c + 1);

    }, [pipeline, pc, instructions, isFinished, registerFile, dataMemory, labels]);
    
    const getHighlightClass = (pc: number): string => {
        const type = highlightedPcs[pc];
        switch (type) {
            case 'pc': return 'bg-slate-700/50';
            case 'hazard-source': return 'bg-yellow-900/70 border-l-2 border-yellow-500';
            case 'hazard-source-flush': return 'bg-red-900/70 border-l-2 border-red-500';
            case 'hazard-victim-stall': return 'bg-yellow-900/40';
            case 'hazard-victim-flush': return 'bg-red-900/40';
            case 'forward-source': return 'bg-cyan-900/70 border-l-2 border-cyan-500';
            case 'forward-dest': return 'bg-cyan-900/40';
            default: return '';
        }
    };

    const visualizerUi = (
        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Code Execution</h3>
                 {isEmbedded ? (
                    <div className="w-full h-96 font-mono text-sm bg-slate-900 text-slate-100 rounded-md border border-slate-600 overflow-y-auto">
                        {instructions.map((instr) => (
                            <div key={instr.pc} className={`px-3 py-0.5 transition-colors duration-300 relative ${getHighlightClass(instr.pc)}`}>
                                {highlightedPcs[instr.pc] === 'pc' && <span className="absolute left-1 top-0.5 text-cyan-400">&gt;</span>}
                                <span className="ml-2">{instr.raw || ' '}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <textarea
                        value={assemblyCode}
                        onChange={(e) => setAssemblyCode(e.target.value)}
                        className="w-full h-96 font-mono text-sm bg-slate-900 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        spellCheck="false"
                        aria-label="Assembly code editor"
                    />
                )}
                 <div className="flex items-center space-x-4 mt-4">
                    <button onClick={clockTick} disabled={isFinished} className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 disabled:bg-slate-600">
                        Step Forward
                    </button>
                    <button onClick={() => {
                        // Reset with current code in textarea if not embedded
                        const codeToReset = isEmbedded ? initialCode : assemblyCode;
                        const { instructions: parsed, labels: parsedLabels } = parseAssembly(codeToReset);
                        setInstructions(parsed);
                        setLabels(parsedLabels);
                        resetSimulationState();
                    }} className="bg-slate-700 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-600">
                        Reset
                    </button>
                </div>
            </div>
            <div className="lg:col-span-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-cyan-400">Pipeline Stages</h3>
                    <div className="text-right">
                       <p className="text-slate-100 font-bold text-xl">Cycle: {cycle}</p>
                       <p className="text-slate-400 text-sm">PC: {pc < instructions.length ? pc : 'done'}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {Object.entries(pipeline).map(([stageKey, stageData]: [string, PipelineStage]) => {
                        const isForwardingSource = forwardingPath?.from === stageKey;
                        const isForwardingDest = forwardingPath?.to === stageKey;
                        const isForwarding = isForwardingSource || isForwardingDest;

                        return (
                            <div key={stageKey} className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                                stageData.isFlush ? 'animate-flash-red' : 
                                stageData.isStall ? 'animate-flash-yellow' : 
                                isForwarding ? 'animate-flash-cyan' : 
                                'border-slate-700 bg-slate-800/50'
                            }`}>
                                <h4 className="font-bold text-slate-300">{STAGE_NAMES[stageKey as PipelineStageName]}</h4>
                                <div 
                                  className="font-mono text-lg p-3 mt-2 bg-slate-900/50 rounded h-16 flex items-center justify-center transition-all duration-300"
                                  style={{ borderLeft: stageData.instr?.color ? `4px solid ${stageData.instr.color}` : '4px solid transparent'}}
                                >
                                    {stageData.isStall && !stageData.instr ? <span className="text-yellow-400 font-bold">-- BUBBLE --</span> :
                                     stageData.isFlush ? <span className="text-red-400 font-bold">-- FLUSH --</span> :
                                     stageData.instr ? <span style={{ color: stageData.instr.color || '#afeeee' }} className="font-semibold">{stageData.instr.raw}</span> :
                                     <span className="text-slate-600">-- empty --</span>
                                    }
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 h-12 p-3 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
                    <p className={`font-semibold text-sm text-center ${forwardingPath ? 'text-cyan-300' : hazardMessage.includes('HAZARD') ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {hazardMessage}
                    </p>
                </div>
            </div>
             <div className="lg:col-span-3">
                <RegisterFileDisplay registers={registerFile} status={registerStatus} />
                <DataMemoryDisplay memory={dataMemory} access={memoryAccessStatus} />
            </div>
        </div>
    );

    if (isEmbedded) {
        return visualizerUi;
    }

    return (
        <Section title="Interactive Pipeline Visualizer" icon={<PlayIcon />}>
            <p className="text-slate-400 mb-8 max-w-4xl">
                This tool simulates a 5-stage RISC-V pipeline with data forwarding and a visible register file. You can write your own custom assembly code in the text area below or use one of the examples from the "Interactive Demos" page. Any changes to the code will automatically reset the simulation.
            </p>
            {visualizerUi}
        </Section>
    );
};