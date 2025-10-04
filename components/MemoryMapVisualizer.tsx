
import React from 'react';
import { Section } from './Section';
import { MicrochipIcon } from './icons/MicrochipIcon';

const memoryRegions = [
    { name: 'Instruction Memory (.text)', start: 0x00000000, end: 0x0000FFFF, size: '64 KB', color: 'sky', description: 'Stores the compiled RISC-V program binary. This region is typically non-volatile (ROM or Flash) and read-only during execution.' },
    { name: 'Reserved', start: 0x00010000, end: 0x0FFFFFFF, size: '255.9 MB', color: 'slate', description: 'This large address space is reserved for future expansion, such as more instruction memory or specialized co-processors.' },
    { name: 'Data Memory (.data, .bss, stack)', start: 0x10000000, end: 0x10007FFF, size: '32 KB', color: 'emerald', description: 'Primary RAM for storing global variables, static data, and the call stack. Implemented as high-speed SRAM.' },
    { name: 'Reserved', start: 0x10008000, end: 0x7FFFFFFF, size: '~1.7 GB', color: 'slate', description: 'Reserved address space.' },
    { name: 'Memory-Mapped I/O (MMIO)', start: 0x80000000, end: 0x800000FF, size: '256 Bytes', color: 'amber', description: 'Registers for controlling hardware. Includes start/done signals for the accelerator, data buffer pointers, and UART/GPIO controls.' },
    { name: 'Reserved', start: 0x80000100, end: 0xFFFFFFFF, size: '~2 GB', color: 'slate', description: 'Reserved for future peripherals.' },
];

const AddressBar: React.FC<{ region: typeof memoryRegions[0] }> = ({ region }) => (
    <div className={`group relative flex items-center p-4 my-2 rounded-lg border-l-8 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-slate-800/50 border-${region.color}-500`}>
        <div className="flex-1">
            <h4 className="font-bold text-slate-100">{region.name}</h4>
            <p className="font-mono text-sm text-slate-400">
                {`0x${region.start.toString(16).toUpperCase().padStart(8, '0')} - 0x${region.end.toString(16).toUpperCase().padStart(8, '0')}`}
            </p>
            <div className="absolute top-4 right-4 bg-slate-700 text-slate-300 text-xs font-bold px-2 py-1 rounded-full">{region.size}</div>
        </div>
        <div className="absolute left-full ml-4 w-72 p-4 bg-slate-700 text-slate-300 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
            <p className="text-sm">{region.description}</p>
        </div>
    </div>
);

const ReservedBar: React.FC<{ region: typeof memoryRegions[0] }> = ({ region }) => (
    <div className="text-center py-2">
        <p className="text-slate-600 text-xs font-mono tracking-widest">... {region.size} Reserved ...</p>
    </div>
);

export const MemoryMapVisualizer: React.FC = () => {
    return (
        <Section title="Processor Memory Map" icon={<MicrochipIcon />}>
            <div className="max-w-4xl">
                <p className="text-slate-400 mb-8">
                    The processor uses a 32-bit address space, but not all addresses are mapped to physical hardware. The diagram below shows the key regions of memory. This memory map is crucial for the compiler (to place code and data correctly) and for developers writing low-level drivers to interact with the hardware's control registers.
                </p>
                <div className="space-y-1">
                    {memoryRegions.map((region, index) =>
                        region.name === 'Reserved'
                            ? <ReservedBar key={index} region={region} />
                            : <AddressBar key={index} region={region} />
                    )}
                </div>
            </div>
        </Section>
    );
};
