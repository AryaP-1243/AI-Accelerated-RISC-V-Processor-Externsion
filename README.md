# AI-Accelerated RISC-V Processor Extension Showcase

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-blue?logo=tailwindcss)
![Gemini API](https://img.shields.io/badge/Google_Gemini-API-blue?logo=google)
![SystemVerilog](https://img.shields.io/badge/SystemVerilog-IEEE_1800-green?logo=ieee)
![FPGA](https://img.shields.io/badge/FPGA-Xilinx_PYNQ--Z2-orange)

---

This project is an interactive web application that showcases a complete hardware-software co-design for a custom RISC-V processor. The processor's Instruction Set Architecture (ISA) has been extended with specialized instructions to accelerate neural network (NN) inference on edge devices, achieving a ~12x speedup and significant energy savings over a baseline core.

The showcase features a suite of powerful, AI-driven tools, including a C++ to custom assembly compiler and an RTL generator, all powered by the Google Gemini API.

## 🚀 Live Demo
https://ai-accelerated-risc-v-processor-extension-showcas-166398002776.us-west1.run.app

---

## ✨ Key Features

*   **Custom RISC-V ISA Extension**: A 5-stage pipelined RISC-V core augmented with powerful custom instructions for NN operations: `mac`, `relu`, `conv2d.3x3`, `dwconv.3x3`, `maxpool.2x2`, `sigmoid`, and `tanh`.
*   **AI-Powered C++ Compiler**: An intelligent C++ to Assembly generator that uses the Gemini API as an expert compiler backend. It automatically recognizes C++ patterns and maps them to the optimized custom hardware instructions.
*   **AI-Powered RTL Generator**: A tool to generate synthesizable SystemVerilog RTL, a self-checking testbench, a conceptual netlist, and formal SystemVerilog Assertions (SVA) from a high-level English description.
*   **Cycle-Accurate Hardware Emulator**: A sophisticated simulator that projects the performance and energy consumption of the custom processor on various FPGA boards (PYNQ-Z2, Arty, etc.). The model accounts for DVFS profiles, instruction latencies, L1 cache misses, and branch misprediction penalties.
*   **Live Hardware Validation**: A dashboard to connect directly to a physical PYNQ-Z2 board. Users can upload a compiled bitstream and program binary to run benchmarks on real silicon and compare the results against the simulation.
*   **Interactive Pipeline Visualizer**: A cycle-by-cycle animation of the 5-stage pipeline that visually demonstrates complex concepts like data forwarding, load-use hazards (stalls), and control hazards (flushes).
*   **FPGA-Validated Design**: The complete processor design is not just theoretical; it has been prototyped, validated, and benchmarked on a real Xilinx PYNQ-Z2 FPGA.

## 🏛️ Architectural Overview

The project's core is a hardware-software co-design approach. The system is built around a standard 5-stage RISC-V pipeline that is tightly coupled with a custom **Neural Network Acceleration Unit (NNAU)**. When a custom instruction is decoded, it is offloaded to the NNAU, which executes the complex computation in a few clock cycles, while the main core handles control flow and standard operations.

This architecture provides a powerful balance between the flexibility of a general-purpose processor and the high performance of a dedicated hardware accelerator.



## 🛠️ Technology Stack

*   **Frontend**: React 19, TypeScript, Tailwind CSS, Recharts (for charting).
*   **AI Backend**: Google Gemini API (`gemini-2.5-flash`).
*   **Hardware Design**: SystemVerilog (IEEE 1800).
*   **FPGA Platform**: Xilinx PYNQ-Z2 (Zynq-7000 SoC).
*   **Live Benchmarking Server**: Python with Flask and PYNQ libraries.

---

## 🔧 Getting Started & Local Development

To run this project on your local machine, follow these steps.

### Prerequisites

*   Node.js (v18 or later)
*   npm or yarn package manager

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ai-riscv-showcase.git
    cd ai-riscv-showcase
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up your Gemini API Key:**
    *   Create a file named `.env` in the root of the project.
    *   Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Add your API key to the `.env` file:
        ```
        API_KEY=YOUR_GEMINI_API_KEY
        ```
    *The application is configured to load this environment variable automatically.*

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application should now be running at `http://localhost:5173`.

---

## 🔬 FPGA Deployment & Validation

While the web app simulates hardware performance, the project is designed for real-world deployment on a PYNQ-Z2 board.

### Open-Source Synthesis Flow

The project supports a fully open-source toolchain (Yosys, nextpnr, Project X-Ray) for synthesizing the SystemVerilog RTL and generating a bitstream, allowing development on platforms like macOS where proprietary tools like Vivado are unavailable.

### PYNQ Server for Live Validation

The "Live Hardware Benchmarking" feature requires a small Python server running on the PYNQ board.

1.  **Dependencies**: Install Flask and CORS on your PYNQ board:
    ```bash
    pip install flask flask-cors numpy
    ```
    *(The `pynq` library is pre-installed on the PYNQ image).*

2.  **Server Script**: The required `server.py` script is provided within the **Hardware Emulation -> From Simulation to Silicon** section of the application. Save this script to your PYNQ's home directory.

3.  **Run the Server**: Execute the server with root privileges to access the FPGA hardware:
    ```bash
    sudo python3 server.py
    ```

4.  **Connect**: Enter your PYNQ board's IP address in the web application's hardware validation panel to connect and run live benchmarks.

## 📜 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
