
import React, { useEffect, useRef, useState } from 'react';
import { Section } from './Section';
import { Card } from './Card';
import { TerminalIcon } from './icons/TerminalIcon';

const CodeBlock: React.FC<{ children: React.ReactNode, language: string }> = ({ children, language }) => {
  const codeRef = useRef<HTMLElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current && window.Prism) {
      window.Prism.highlightElement(codeRef.current);
    }
  }, [children]);

  const onCopy = () => {
    if (codeRef.current?.textContent) {
        navigator.clipboard.writeText(codeRef.current.textContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="relative group">
       <pre className={`language-${language} !bg-slate-900 !border-slate-700 !my-4 !rounded-lg`}>
          <code ref={codeRef} className={`language-${language}`}>
            {children}
          </code>
        </pre>
        <button
            onClick={onCopy}
            className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-sans rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
            {isCopied ? 'Copied!' : 'Copy'}
        </button>
    </div>
  );
};


export const FpgaDeployment: React.FC = () => {
    return (
        <Section title="FPGA Deployment with an Open-Source Flow" icon={<TerminalIcon />}>
            <div className="text-slate-400 space-y-4 max-w-4xl mb-8">
                <p>
                    Deploying a custom processor to an FPGA typically requires proprietary, platform-specific tools like Xilinx Vivado, which doesn't run on Apple Silicon Macs. This guide outlines a modern, fully open-source workflow that allows you to synthesize, place, route, and generate a bitstream for the PYNQ-Z2 entirely from a macOS machine.
                </p>
                <p className="font-semibold text-slate-300">
                    This approach uses a toolchain composed of Yosys (synthesis), nextpnr (place-and-route), and Project X-Ray (bitstream documentation) to create a hardware configuration that can be deployed and benchmarked.
                </p>
            </div>
            <div className="space-y-8">
                <Card
                    title="Phase 1: Toolchain Setup on macOS"
                    description="First, you'll need to install the open-source FPGA development toolchain and the necessary RISC-V and ARM cross-compilers using Homebrew."
                >
                    <p className="text-slate-400 mb-2">Open your terminal and run the following commands:</p>
                    <CodeBlock language="bash">{
`# Install the synthesis tool
brew install yosys

# Install the place-and-route tool for Xilinx 7-series FPGAs
brew install nextpnr-xilinx

# Install the RISC-V GCC toolchain to compile for your custom core
brew tap riscv/riscv
brew install riscv-gnu-toolchain

# Install the ARM GCC toolchain to cross-compile for the PYNQ's CPU
brew install arm-linux-gnueabihf-gcc

# Project X-Ray tools are usually bundled with nextpnr-xilinx`
                    }</CodeBlock>
                </Card>

                <Card
                    title="Phase 2: System-on-Chip (SoC) Generation"
                    description="This is the main hardware generation flow. It involves taking the Verilog/SystemVerilog source for the processor and building a complete system around it."
                >
                    <div className="text-slate-400 space-y-4">
                        <div>
                            <h4 className="font-semibold text-cyan-400">Step 2.1: Synthesize with Yosys</h4>
                            <p>Yosys reads the SystemVerilog files and converts them into a technology-independent netlist in JSON format.</p>
                            <CodeBlock language="bash">{
`# a.v is your top module, core.v and others are submodules
yosys -p 'synth_xilinx -top my_soc_top -out build/synth.json' a.v core.v ...`
                            }</CodeBlock>
                        </div>
                        <div>
                            <h4 className="font-semibold text-cyan-400">Step 2.2: Place & Route with nextpnr</h4>
                            <p>nextpnr takes the netlist, along with physical constraints (pin locations, clock definitions), and maps it onto the specific FPGA architecture of the PYNQ-Z2 (Zynq 7020).</p>
                             <CodeBlock language="bash">{
`# The XDC file defines pin constraints for the PYNQ-Z2
nextpnr-xilinx --chip xc7z020clg400-1 --xdc pynq.xdc --json build/synth.json --write build/pnr.json`
                            }</CodeBlock>
                        </div>
                         <div>
                            <h4 className="font-semibold text-cyan-400">Step 2.3: Generate Bitstream</h4>
                            <p>The final step is to convert the placed-and-routed design into the binary `.bit` file that the FPGA understands. This is done using Project X-Ray's tools.</p>
                            <CodeBlock language="bash">{
`# This command sequence is simplified; it uses the fasm tool
# from the Symbiflow ecosystem to generate the bitstream.
fasmconv --json build/pnr.json --bit build/top.bit`
                            }</CodeBlock>
                        </div>
                    </div>
                </Card>

                 <Card
                    title="Phase 3: Compiling Benchmark Programs"
                    description="You need two versions of your test program: one to run on your custom RISC-V core (as a binary blob) and another to run on the PYNQ's ARM core for a baseline performance comparison."
                >
                    <div className="text-slate-400 space-y-4">
                        <div>
                            <h4 className="font-semibold text-cyan-400">For the Custom RISC-V Core (FPGA)</h4>
                            <p>This is the program your custom hardware will execute. It needs to be compiled into a flat binary file without any operating system overhead. Here is an example entry point:</p>
                            <CodeBlock language="c">{
`// test_program.c
// Simple entry point. Assume mat_vec_relu is defined elsewhere.
void main() {
    // Setup pointers to data in memory (example addresses)
    float* C = (float*)0x1000;
    float* A = (float*)0x2000;
    float* B = (float*)0x3000;
    
    // Call the accelerated function
    mat_vec_relu(C, A, B, 16, 16);

    // Signal completion by writing to a memory-mapped control register
    volatile unsigned int* complete_reg = (unsigned int*)0x80000004;
    *complete_reg = 1;
}`
                            }</CodeBlock>
                            <p>Use the RISC-V toolchain to compile and convert it to a binary:</p>
                            <CodeBlock language="bash">{
`# 1. Compile C code to an ELF object file
#    -march=rv32imf specifies the base ISA (adjust for your core)
#    -nostdlib means we are running on bare metal
#    -T linker.ld points to a script defining your SoC's memory layout
riscv64-unknown-elf-gcc -march=rv32imf -nostdlib -T linker.ld -o test_program.elf test_program.c

# 2. Convert the ELF file to a flat binary for loading
riscv64-unknown-elf-objcopy -O binary test_program.elf test_program.bin`
                            }</CodeBlock>
                        </div>
                        <div className="pt-4">
                            <h4 className="font-semibold text-cyan-400">For the ARM Cortex-A9 Core (Software Baseline)</h4>
                            <p>This is a standard Linux executable that you will run on the PYNQ's OS to measure the software-only performance. It should perform the exact same computation.</p>
                            <CodeBlock language="bash">{
`# Use the ARM cross-compiler with high optimization
arm-linux-gnueabihf-g++ -O3 -o benchmark_sw benchmark.cpp

# After compiling, transfer benchmark_sw to the PYNQ board,
# make it executable (chmod +x benchmark_sw), and run it from the shell.`
                            }</CodeBlock>
                        </div>
                    </div>
                </Card>

                <Card
                    title="Phase 4: Running the Real-Time Benchmarking Server"
                    description="To enable the 'Live Hardware Benchmarking' dashboard, you need to run a small web server on your PYNQ board. This server will receive commands from the web app, control the FPGA, and send back real-time performance data."
                >
                     <div className="text-slate-400 space-y-4">
                        <div>
                            <h4 className="font-semibold text-cyan-400">Step 4.1: Save the Server Code</h4>
                            <p>Log into your PYNQ board (e.g., via SSH or Jupyter terminal) and save the following Python code as `server.py` in your home directory.</p>
                            <CodeBlock language="python">{
`from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import os
import subprocess
from pynq import Overlay, allocate
from pynq.ps import PowerSupply
import numpy as np

app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing

# --- IMPORTANT ---
# These hexadecimal offsets are EXAMPLES. You MUST update them to match
# the address map of your custom SoC design generated by your tools.
# The base address of your IP will be detected automatically by PYNQ.
CTRL_REG_PROG_ADDR = 0x04 # Example: Offset for program base address
CTRL_REG_A_ADDR = 0x08    # Example: Offset for data buffer A address
CTRL_REG_B_ADDR = 0x0C    # Example: Offset for data buffer B address
CTRL_REG_C_ADDR = 0x10    # Example: Offset for data buffer C address
CTRL_REG_START = 0x00     # Example: Offset for control/status register (start is bit 0)
CTRL_REG_DONE = 0x00      # Example: Offset for control/status register (done is bit 1)

@app.route('/status', methods=['GET'])
def get_status():
    return jsonify({"status": "PYNQ server is running"}), 200

@app.route('/run_benchmark', methods=['POST'])
def run_benchmark():
    if 'bitfile' not in request.files or 'binfile' not in request.files:
        return jsonify({"error": "bitfile or binfile not provided"}), 400
        
    bitfile = request.files['bitfile']
    binfile = request.files['binfile']

    bitfile_path = f"/home/pynq/{bitfile.filename}"
    binfile_path = f"/home/pynq/{binfile.filename}"
    bitfile.save(bitfile_path)
    binfile.save(binfile_path)
    
    overlay = None
    buffers = []
    try:
        overlay = Overlay(bitfile_path)
        ip_name = list(overlay.ip_dict.keys())[0]
        riscv_core = overlay.ip_dict[ip_name]

        program_buffer = allocate(shape=(4096,), dtype=np.uint8); buffers.append(program_buffer)
        data_buffer_A = allocate(shape=(16*16,), dtype=np.float32); buffers.append(data_buffer_A)
        data_buffer_B = allocate(shape=(16,), dtype=np.float32); buffers.append(data_buffer_B)
        data_buffer_C = allocate(shape=(16,), dtype=np.float32); buffers.append(data_buffer_C)

        with open(binfile_path, "rb") as f:
            program_buffer[:] = np.frombuffer(f.read(), dtype=np.uint8)
        program_buffer.sync_to_device()
        
        data_buffer_A[:] = np.random.rand(16*16).astype(np.float32); data_buffer_A.sync_to_device()
        data_buffer_B[:] = np.random.rand(16).astype(np.float32); data_buffer_B.sync_to_device()

        # --- Hardware Benchmark ---
        idle_power_pl = PowerSupply().rails['PL'].power
        power_samples_hw = []
        
        riscv_core.write(CTRL_REG_PROG_ADDR, program_buffer.physical_address)
        riscv_core.write(CTRL_REG_A_ADDR, data_buffer_A.physical_address)
        riscv_core.write(CTRL_REG_B_ADDR, data_buffer_B.physical_address)
        riscv_core.write(CTRL_REG_C_ADDR, data_buffer_C.physical_address)
        
        hw_start_time = time.perf_counter()
        riscv_core.write(CTRL_REG_START, 1) # Assert start (e.g., bit 0)
        
        while (riscv_core.read(CTRL_REG_DONE) & 0x2 == 0): # Poll 'done' bit (e.g., bit 1)
            power_samples_hw.append(PowerSupply().rails['PL'].power)
            pass
            
        hw_end_time = time.perf_counter()
        riscv_core.write(CTRL_REG_START, 0) # De-assert start
        
        hw_latency = (hw_end_time - hw_start_time) * 1000 # in ms
        
        active_power_hw = np.mean(power_samples_hw) if power_samples_hw else PowerSupply().rails['PL'].power
        hw_energy = max(0, (active_power_hw - idle_power_pl) * (hw_latency / 1000) * 1000) # mJ

        # Downsample power data for frontend visualization if too large
        max_power_samples = 100
        if len(power_samples_hw) > max_power_samples:
            step = len(power_samples_hw) // max_power_samples
            power_data_for_frontend = power_samples_hw[::step]
        else:
            power_data_for_frontend = power_samples_hw

        # --- Software Benchmark ---
        idle_power_ps = PowerSupply().rails['PS-CPU'].power
        
        sw_start_time = time.perf_counter()
        subprocess.run(['/home/pynq/benchmark_sw'])
        sw_end_time = time.perf_counter()
        
        active_power_sw = PowerSupply().rails['PS-CPU'].power
        
        sw_latency = (sw_end_time - sw_start_time) * 1000
        sw_energy = max(0, (active_power_sw - idle_power_ps) * (sw_latency / 1000) * 1000) # mJ

        return jsonify({
            "success": True,
            "hw_latency_ms": hw_latency,
            "sw_latency_ms": sw_latency,
            "hw_energy_mj": hw_energy,
            "sw_energy_mj": sw_energy,
            "hw_power_w": power_data_for_frontend,
            "speedup": sw_latency / hw_latency if hw_latency > 0 else 0,
            "energy_efficiency": sw_energy / hw_energy if hw_energy > 0 else float('inf')
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        for buf in buffers:
            if buf: buf.freebuffer()
        if os.path.exists(bitfile_path): os.remove(bitfile_path)
        if os.path.exists(binfile_path): os.remove(binfile_path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
`
                            }</CodeBlock>
                        </div>
                        <div>
                            <h4 className="font-semibold text-cyan-400">Step 4.2: Install Dependencies</h4>
                             <p>In the PYNQ terminal, install the required Python packages.</p>
                            <CodeBlock language="bash">{
`# The 'pynq' library should already be installed.
pip install flask flask-cors`
                            }</CodeBlock>
                        </div>
                        <div>
                            <h4 className="font-semibold text-cyan-400">Step 4.3: Run the Server</h4>
                            <p>Launch the server. It will now listen for requests from the web application.</p>
                            <CodeBlock language="bash">{
`python3 server.py`
                            }</CodeBlock>
                            <p className="mt-4">Now, navigate to the <span className="font-bold text-cyan-400">'Live Hardware Benchmarking'</span> section in the sidebar, enter your PYNQ's IP address, and you can start running tests directly from your browser!</p>
                        </div>
                    </div>
                </Card>

            </div>
        </Section>
    );
};
