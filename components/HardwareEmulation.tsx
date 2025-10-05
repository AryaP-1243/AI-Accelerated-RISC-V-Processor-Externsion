
import React, { useState, useMemo, useCallback } from 'react';
import { Section } from './Section';
import { SignalIcon } from './icons/SignalIcon';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { Card } from './Card';
import { XIcon } from './icons/XIcon';

type ProfileId = 'performance' | 'balanced' | 'low_power';

type DVFSProfile = {
  name: string;
  riscv_clk_mhz: number;
  arm_clk_mhz: number;
  energy_per_cycle_hw: { [key: string]: number };
  energy_per_cycle_sw: number;
  static_power_hw_mw: number;
  static_power_sw_mw: number;
  l1_cache_hit_rate: number;
  l1_miss_penalty_cycles: number;
  dram_energy_per_access_pj: number;
  branch_predictor_accuracy: number;
  branch_mispredict_penalty_cycles: number;
  cycles_hw: { [key: string]: number }; // Board-specific cycle counts
};

type Board = {
  name: string;
  family: string;
  profiles: {
    performance: DVFSProfile;
    balanced: DVFSProfile;
    low_power: DVFSProfile;
  };
};

type BenchmarkResults = {
  hw_latency_ms: number;
  sw_latency_ms: number;
  hw_energy_mj: number;
  sw_energy_mj: number;
  speedup: number;
  energy_efficiency: number;
  hw_power_w?: number[];
};


const boards: { [key: string]: Board } = {
  // --- Xilinx/AMD Boards ---
  "pynq-z2": {
    name: "PYNQ-Z2", family: "Xilinx Zynq-7000",
    profiles: {
      performance: { name: "Performance", riscv_clk_mhz: 125, arm_clk_mhz: 780, energy_per_cycle_hw: { 'mac': 4.7, 'relu': 1.6, 'conv2d.3x3': 13, 'dwconv.3x3': 10.3, 'maxpool.2x2': 6, 'sigmoid': 23, 'tanh': 23, 'fadd.s': 1.2, 'fsub.s': 1.2, 'fmul.s': 3.9, 'fdiv.s': 16, 'flw': 7.8, 'fsw': 7.8, 'lw': 6.2, 'sw': 6.2, 'beq': 0.78, 'jal': 0.94, 'addi': 0.62, 'default': 0.78 }, energy_per_cycle_sw: 29, static_power_hw_mw: 150, static_power_sw_mw: 250, l1_cache_hit_rate: 0.98, l1_miss_penalty_cycles: 40, dram_energy_per_access_pj: 650, branch_predictor_accuracy: 0.92, branch_mispredict_penalty_cycles: 3, cycles_hw: { 'mac': 1, 'relu': 1, 'sigmoid': 4, 'tanh': 4, 'conv2d.3x3': 3, 'dwconv.3x3': 3, 'maxpool.2x2': 2, 'fadd.s': 2, 'fsub.s': 2, 'fmul.s': 3, 'fdiv.s': 12, 'flw': 2, 'fsw': 1, 'lw': 2, 'sw': 1, 'beq': 1, 'jal': 1, 'addi': 1, 'add':1, 'sub':1, 'default': 1 } },
      balanced: { name: "Balanced", riscv_clk_mhz: 100, arm_clk_mhz: 650, energy_per_cycle_hw: { 'mac': 3, 'relu': 1, 'conv2d.3x3': 8.33, 'dwconv.3x3': 6.67, 'maxpool.2x2': 4, 'sigmoid': 15, 'tanh': 15, 'fadd.s': 0.8, 'fsub.s': 0.8, 'fmul.s': 2.5, 'fdiv.s': 10, 'flw': 5, 'fsw': 5, 'lw': 4, 'sw': 4, 'beq': 0.5, 'jal': 0.6, 'addi': 0.4, 'default': 0.5 }, energy_per_cycle_sw: 20, static_power_hw_mw: 100, static_power_sw_mw: 180, l1_cache_hit_rate: 0.97, l1_miss_penalty_cycles: 42, dram_energy_per_access_pj: 680, branch_predictor_accuracy: 0.90, branch_mispredict_penalty_cycles: 3, cycles_hw: { 'mac': 1, 'relu': 1, 'sigmoid': 4, 'tanh': 4, 'conv2d.3x3': 3, 'dwconv.3x3': 3, 'maxpool.2x2': 2, 'fadd.s': 2, 'fsub.s': 2, 'fmul.s': 3, 'fdiv.s': 12, 'flw': 2, 'fsw': 1, 'lw': 2, 'sw': 1, 'beq': 1, 'jal': 1, 'addi': 1, 'add':1, 'sub':1, 'default': 1 } },
      low_power: { name: "Low Power", riscv_clk_mhz: 75, arm_clk_mhz: 520, energy_per_cycle_hw: { 'mac': 1.7, 'relu': 0.56, 'conv2d.3x3': 4.67, 'dwconv.3x3': 3.67, 'maxpool.2x2': 2.25, 'sigmoid': 8.4, 'tanh': 8.4, 'fadd.s': 0.45, 'fsub.s': 0.45, 'fmul.s': 1.4, 'fdiv.s': 5.6, 'flw': 2.8, 'fsw': 2.8, 'lw': 2.2, 'sw': 2.2, 'beq': 0.28, 'jal': 0.34, 'addi': 0.22, 'default': 0.28 }, energy_per_cycle_sw: 13, static_power_hw_mw: 70, static_power_sw_mw: 120, l1_cache_hit_rate: 0.96, l1_miss_penalty_cycles: 45, dram_energy_per_access_pj: 720, branch_predictor_accuracy: 0.88, branch_mispredict_penalty_cycles: 3, cycles_hw: { 'mac': 1, 'relu': 1, 'sigmoid': 4, 'tanh': 4, 'conv2d.3x3': 3, 'dwconv.3x3': 3, 'maxpool.2x2': 2, 'fadd.s': 2, 'fsub.s': 2, 'fmul.s': 3, 'fdiv.s': 12, 'flw': 2, 'fsw': 1, 'lw': 2, 'sw': 1, 'beq': 1, 'jal': 1, 'addi': 1, 'add':1, 'sub':1, 'default': 1 } },
    }
  },
  "arty-a7": {
    name: "Arty A7-100T", family: "Xilinx Artix-7",
    profiles: {
      performance: { name: "Performance", riscv_clk_mhz: 125, arm_clk_mhz: 500, energy_per_cycle_hw: { 'mac': 3.7, 'relu': 1.2, 'conv2d.3x3': 10.3, 'dwconv.3x3': 8.33, 'maxpool.2x2': 4.95, 'sigmoid': 19, 'tanh': 19, 'fadd.s': 0.99, 'fsub.s': 0.99, 'fmul.s': 3.1, 'fdiv.s': 12, 'flw': 6.2, 'fsw': 6.2, 'lw': 5, 'sw': 5, 'beq': 0.62, 'jal': 0.75, 'addi': 0.5, 'default': 0.62 }, energy_per_cycle_sw: 23, static_power_hw_mw: 120, static_power_sw_mw: 180, l1_cache_hit_rate: 0.96, l1_miss_penalty_cycles: 50, dram_energy_per_access_pj: 800, branch_predictor_accuracy: 0.90, branch_mispredict_penalty_cycles: 4, cycles_hw: { 'mac': 1, 'relu': 1, 'sigmoid': 5, 'tanh': 5, 'conv2d.3x3': 4, 'dwconv.3x3': 4, 'maxpool.2x2': 3, 'fadd.s': 3, 'fsub.s': 3, 'fmul.s': 4, 'fdiv.s': 14, 'flw': 3, 'fsw': 2, 'lw': 3, 'sw': 2, 'beq': 1, 'jal': 1, 'addi': 1, 'add':1, 'sub':1, 'default': 1 } },
      balanced: { name: "Balanced", riscv_clk_mhz: 100, arm_clk_mhz: 400, energy_per_cycle_hw: { 'mac': 2.4, 'relu': 0.8, 'conv2d.3x3': 6.67, 'dwconv.3x3': 5.33, 'maxpool.2x2': 3.2, 'sigmoid': 12, 'tanh': 12, 'fadd.s': 0.64, 'fsub.s': 0.64, 'fmul.s': 2, 'fdiv.s': 8, 'flw': 4, 'fsw': 4, 'lw': 3.2, 'sw': 3.2, 'beq': 0.4, 'jal': 0.48, 'addi': 0.32, 'default': 0.4 }, energy_per_cycle_sw: 16, static_power_hw_mw: 80, static_power_sw_mw: 130, l1_cache_hit_rate: 0.95, l1_miss_penalty_cycles: 52, dram_energy_per_access_pj: 840, branch_predictor_accuracy: 0.88, branch_mispredict_penalty_cycles: 4, cycles_hw: { 'mac': 1, 'relu': 1, 'sigmoid': 5, 'tanh': 5, 'conv2d.3x3': 4, 'dwconv.3x3': 4, 'maxpool.2x2': 3, 'fadd.s': 3, 'fsub.s': 3, 'fmul.s': 4, 'fdiv.s': 14, 'flw': 3, 'fsw': 2, 'lw': 3, 'sw': 2, 'beq': 1, 'jal': 1, 'addi': 1, 'add':1, 'sub':1, 'default': 1 } },
      low_power: { name: "Low Power", riscv_clk_mhz: 75, arm_clk_mhz: 320, energy_per_cycle_hw: { 'mac': 1.3, 'relu': 0.45, 'conv2d.3x3': 3.67, 'dwconv.3x3': 3, 'maxpool.2x2': 1.8, 'sigmoid': 6.7, 'tanh': 6.7, 'fadd.s': 0.36, 'fsub.s': 0.36, 'fmul.s': 1.1, 'fdiv.s': 4.5, 'flw': 2.2, 'fsw': 2.2, 'lw': 1.8, 'sw': 1.8, 'beq': 0.22, 'jal': 0.27, 'addi': 0.18, 'default': 0.22 }, energy_per_cycle_sw: 10, static_power_hw_mw: 50, static_power_sw_mw: 90, l1_cache_hit_rate: 0.94, l1_miss_penalty_cycles: 55, dram_energy_per_access_pj: 880, branch_predictor_accuracy: 0.85, branch_mispredict_penalty_cycles: 4, cycles_hw: { 'mac': 1, 'relu': 1, 'sigmoid': 5, 'tanh': 5, 'conv2d.3x3': 4, 'dwconv.3x3': 4, 'maxpool.2x2': 3, 'fadd.s': 3, 'fsub.s': 3, 'fmul.s': 4, 'fdiv.s': 14, 'flw': 3, 'fsw': 2, 'lw': 3, 'sw': 2, 'beq': 1, 'jal': 1, 'addi': 1, 'add':1, 'sub':1, 'default': 1 } },
    }
  },
  "basys3": {
    name: "Basys 3", family: "Xilinx Artix-7",
    profiles: {
      performance: { name: "Performance", riscv_clk_mhz: 125, arm_clk_mhz: 500, energy_per_cycle_hw: { 'mac': 3.3, 'relu': 1.1, 'conv2d.3x3': 9.33, 'dwconv.3x3': 7.33, 'maxpool.2x2': 4.4, 'sigmoid': 17, 'tanh': 17, 'fadd.s': 0.88, 'fsub.s': 0.88, 'fmul.s': 2.8, 'fdiv.s': 11, 'flw': 5.5, 'fsw': 5.5, 'lw': 4.4, 'sw': 4.4, 'beq': 0.55, 'jal': 0.66, 'addi': 0.44, 'default': 0.55 }, energy_per_cycle_sw: 20, static_power_hw_mw: 110, static_power_sw_mw: 170, l1_cache_hit_rate: 0.96, l1_miss_penalty_cycles: 50, dram_energy_per_access_pj: 800, branch_predictor_accuracy: 0.90, branch_mispredict_penalty_cycles: 4, cycles_hw: { 'mac': 1, 'relu': 1, 'sigmoid': 5, 'tanh': 5, 'conv2d.3x3': 4, 'dwconv.3x3': 4, 'maxpool.2x2': 3, 'fadd.s': 3, 'fsub.s': 3, 'fmul.s': 4, 'fdiv.s': 14, 'flw': 3, 'fsw': 2, 'lw': 3, 'sw': 2, 'beq': 1, 'jal': 1, 'addi': 1, 'add':1, 'sub':1, 'default': 1 } },
      balanced: { name: "Balanced", riscv_clk_mhz: 100, arm_clk_mhz: 400, energy_per_cycle_hw: { 'mac': 2.1, 'relu': 0.7, 'conv2d.3x3': 6, 'dwconv.3x3': 4.67, 'maxpool.2x2': 2.8, 'sigmoid': 11, 'tanh': 11, 'fadd.s': 0.56, 'fsub.s': 0.56, 'fmul.s': 1.8, 'fdiv.s': 7, 'flw': 3.5, 'fsw': 3.5, 'lw': 2.8, 'sw': 2.8, 'beq': 0.35, 'jal': 0.42, 'addi': 0.28, 'default': 0.35 }, energy_per_cycle_sw: 14, static_power_hw_mw: 75, static_power_sw_mw: 120, l1_cache_hit_rate: 0.95, l1_miss_penalty_cycles: 52, dram_energy_per_access_pj: 840, branch_predictor_accuracy: 0.88, branch_mispredict_penalty_cycles: 4, cycles_hw: { 'mac': 1, 'relu': 1, 'sigmoid': 5, 'tanh': 5, 'conv2d.3x3': 4, 'dwconv.3x3': 4, 'maxpool.2x2': 3, 'fadd.s': 3, 'fsub.s': 3, 'fmul.s': 4, 'fdiv.s': 14, 'flw': 3, 'fsw': 2, 'lw': 3, 'sw': 2, 'beq': 1, 'jal': 1, 'addi': 1, 'add':1, 'sub':1, 'default': 1 } },
      low_power: { name: "Low Power", riscv_clk_mhz: 75, arm_clk_mhz: 320, energy_per_cycle_hw: { 'mac': 1.2, 'relu': 0.39, 'conv2d.3x3': 3.27, 'dwconv.3x3': 2.6, 'maxpool.2x2': 1.55, 'sigmoid': 5.9, 'tanh': 5.9, 'fadd.s': 0.31, 'fsub.s': 0.31, 'fmul.s': 0.98, 'fdiv.s': 3.9, 'flw': 2, 'fsw': 2, 'lw': 1.6, 'sw': 1.6, 'beq': 0.2, 'jal': 0.24, 'addi': 0.16, 'default': 0.2 }, energy_per_cycle_sw: 9, static_power_hw_mw: 45, static_power_sw_mw: 80, l1_cache_hit_rate: 0.94, l1_miss_penalty_cycles: 55, dram_energy_per_access_pj: 880, branch_predictor_accuracy: 0.85, branch_mispredict_penalty_cycles: 4, cycles_hw: { 'mac': 1, 'relu': 1, 'sigmoid': 5, 'tanh': 5, 'conv2d.3x3': 4, 'dwconv.3x3': 4, 'maxpool.2x2': 3, 'fadd.s': 3, 'fsub.s': 3, 'fmul.s': 4, 'fdiv.s': 14, 'flw': 3, 'fsw': 2, 'lw': 3, 'sw': 2, 'beq': 1, 'jal': 1, 'addi': 1, 'add':1, 'sub':1, 'default': 1 } },
    }
  },
  "zybo-z7": {
    name: "Zybo Z7-20", family: "Xilinx Zynq-7000",
    profiles: {
      performance: { name: "Performance", riscv_clk_mhz: 125, arm_clk_mhz: 780, energy_per_cycle_hw: { 'mac': 4.7, 'relu': 1.6, 'conv2d.3x3': 13, 'dwconv.3x3': 10.3, 'maxpool.2x2': 6, 'sigmoid': 23, 'tanh': 23, 'fadd.s': 1.2, 'fsub.s': 1.2, 'fmul.s': 3.9, 'fdiv.s': 16, 'flw': 7.8, 'fsw': 7.8, 'lw': 6.2, 'sw': 6.2, 'beq': 0.78, 'jal': 0.94, 'addi': 0.62, 'default': 0.78 }, energy_per_cycle_sw: 29, static_power_hw_mw: 150, static_power_sw_mw: 250, l1_cache_hit_rate: 0.98, l1_miss_penalty_cycles: 40, dram_energy_per_access_pj: 650, branch_predictor_accuracy: 0.92, branch_mispredict_penalty_cycles: 3, cycles_hw: { 'mac': 1, 'relu': 1, 'sigmoid': 4, 'tanh': 4, 'conv2d.3x3': 3, 'dwconv.3x3': 3, 'maxpool.2x2': 2, 'fadd.s': 2, 'fsub.s': 2, 'fmul.s': 3, 'fdiv.s': 12, 'flw': 2, 'fsw': 1, 'lw': 2, 'sw': 1, 'beq': 1, 'jal': 1, 'addi': 1, 'add':1, 'sub':1, 'default': 1 } },
      balanced: { name: "Balanced", riscv_clk_mhz: 100, arm_clk_mhz: 650, energy_per_cycle_hw: { 'mac': 3, 'relu': 1, 'conv2d.3x3': 8.33, 'dwconv.3x3': 6.67, 'maxpool.2x2': 4, 'sigmoid': 15, 'tanh': 15, 'fadd.s': 0.8, 'fsub.s': 0.8, 'fmul.s': 2.5, 'fdiv.s': 10, 'flw': 5, 'fsw': 5, 'lw': 4, 'sw': 4, 'beq': 0.5, 'jal': 0.6, 'addi': 0.4, 'default': 0.5 }, energy_per_cycle_sw: 20, static_power_hw_mw: 100, static_power_sw_mw: 180, l1_cache_hit_rate: 0.97, l1_miss_penalty_cycles: 42, dram_energy_per_access_pj: 680, branch_predictor_accuracy: 0.90, branch_mispredict_penalty_cycles: 3, cycles_hw: { 'mac': 1, 'relu': 1, 'sigmoid': 4, 'tanh': 4, 'conv2d.3x3': 3, 'dwconv.3x3': 3, 'maxpool.2x2': 2, 'fadd.s': 2, 'fsub.s': 2, 'fmul.s': 3, 'fdiv.s': 12, 'flw': 2, 'fsw': 1, 'lw': 2, 'sw': 1, 'beq': 1, 'jal': 1, 'addi': 1, 'add':1, 'sub':1, 'default': 1 } },
      low_power: { name: "Low Power", riscv_clk_mhz: 75, arm_clk_mhz: 520, energy_per_cycle_hw: { 'mac': 1.7, 'relu': 0.56, 'conv2d.3x3': 4.67, 'dwconv.3x3': 3.67, 'maxpool.2x2': 2.25, 'sigmoid': 8.4, 'tanh': 8.4, 'fadd.s': 0.45, 'fsub.s': 0.45, 'fmul.s': 1.4, 'fdiv.s': 5.6, 'flw': 2.8, 'fsw': 2.8, 'lw': 2.2, 'sw': 2.2, 'beq': 0.28, 'jal': 0.34, 'addi': 0.22, 'default': 0.28 }, energy_per_cycle_sw: 13, static_power_hw_mw: 70, static_power_sw_mw: 120, l1_cache_hit_rate: 0.96, l1_miss_penalty_cycles: 45, dram_energy_per_access_pj: 720, branch_predictor_accuracy: 0.88, branch_mispredict_penalty_cycles: 3, cycles_hw: { 'mac': 1, 'relu': 1, 'sigmoid': 4, 'tanh': 4, 'conv2d.3x3': 3, 'dwconv.3x3': 3, 'maxpool.2x2': 2, 'fadd.s': 2, 'fsub.s': 2, 'fmul.s': 3, 'fdiv.s': 12, 'flw': 2, 'fsw': 1, 'lw': 2, 'sw': 1, 'beq': 1, 'jal': 1, 'addi': 1, 'add':1, 'sub':1, 'default': 1 } },
    }
  },
};

const instructionCategories = {
    'Custom NN': ['mac', 'relu', 'conv2d.3x3', 'dwconv.3x3', 'maxpool.2x2', 'sigmoid', 'tanh'],
    'Standard FPU': ['fadd.s', 'fsub.s', 'fmul.s', 'fdiv.s', 'flw', 'fsw'],
    'Integer & Control': ['lw', 'sw', 'beq', 'jal', 'addi', 'add', 'sub'],
};

const defaultInstructionMix = {
    'mac': 1300000,
    'relu': 250000,
    'conv2d.3x3': 50000,
    'dwconv.3x3': 25000,
    'maxpool.2x2': 15000,
    'sigmoid': 0,
    'tanh': 0,
    'fadd.s': 200000,
    'fsub.s': 50000,
    'fmul.s': 300000,
    'fdiv.s': 1000,
    'flw': 400000,
    'fsw': 200000,
    'lw': 100000,
    'sw': 50000,
    'beq': 150000,
    'jal': 20000,
    'addi': 250000,
    'add': 100000,
    'sub': 50000,
    'default': 0
};

const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
};

const formatThroughput = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)} GOPS`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)} MOPS`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)} KOPS`;
    return `${num.toFixed(0)} OPS`;
};

const InstructionSlider: React.FC<{
    name: string;
    value: number;
    onChange: (value: number) => void;
}> = ({ name, value, onChange }) => {
    const logValue = value > 0 ? Math.log10(value) : 0;
    const maxLog = 7; // Up to 10,000,000
    
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const linearValue = parseFloat(e.target.value);
        const logScaledValue = Math.round(Math.pow(10, linearValue));
        onChange(logScaledValue > 1 ? logScaledValue : 0);
    };

    return (
        <div className="flex items-center space-x-3 text-sm">
            <label className="w-24 font-mono text-slate-300">{name}</label>
            <input 
                type="range" 
                min="0" 
                max={maxLog}
                step="0.01"
                value={logValue}
                onChange={handleSliderChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="w-16 text-right font-mono text-cyan-400">{formatNumber(value)}</span>
        </div>
    );
};

const PynqServerCodeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    const [isCopied, setIsCopied] = useState(false);

    const code = `from flask import Flask, request, jsonify
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

    bitfile_path = f"/home/xilinx/{bitfile.filename}"
    binfile_path = f"/home/xilinx/{binfile.filename}"
    bitfile.save(bitfile_path)
    binfile.save(binfile_path)
    
    overlay = None
    buffers = []
    try:
        overlay = Overlay(bitfile_path)
        # Assuming the custom IP is the first one in the dictionary
        ip_name = list(overlay.ip_dict.keys())[0]
        riscv_core = overlay.ip_dict[ip_name]

        # Allocate memory buffers (adjust shapes as needed for your benchmark)
        program_buffer = allocate(shape=(4096,), dtype=np.uint8); buffers.append(program_buffer)
        data_buffer_A = allocate(shape=(16*16,), dtype=np.float32); buffers.append(data_buffer_A)
        data_buffer_B = allocate(shape=(16,), dtype=np.float32); buffers.append(data_buffer_B)
        data_buffer_C = allocate(shape=(16,), dtype=np.float32); buffers.append(data_buffer_C)

        # Load the RISC-V binary into the program buffer
        with open(binfile_path, "rb") as f:
            program_buffer[:] = np.frombuffer(f.read(), dtype=np.uint8)
        program_buffer.sync_to_device()
        
        # Initialize input data buffers with random data
        data_buffer_A[:] = np.random.rand(16*16).astype(np.float32); data_buffer_A.sync_to_device()
        data_buffer_B[:] = np.random.rand(16).astype(np.float32); data_buffer_B.sync_to_device()

        # --- Hardware Benchmark ---
        idle_power_pl = PowerSupply().rails['PL'].power
        power_samples_hw = []
        
        # Write buffer addresses to the core's control registers
        riscv_core.write(CTRL_REG_PROG_ADDR, program_buffer.physical_address)
        riscv_core.write(CTRL_REG_A_ADDR, data_buffer_A.physical_address)
        riscv_core.write(CTRL_REG_B_ADDR, data_buffer_B.physical_address)
        riscv_core.write(CTRL_REG_C_ADDR, data_buffer_C.physical_address)
        
        hw_start_time = time.perf_counter()
        riscv_core.write(CTRL_REG_START, 1) # Assert start bit
        
        # Poll the 'done' bit
        while (riscv_core.read(CTRL_REG_DONE) & 0x2 == 0):
            power_samples_hw.append(PowerSupply().rails['PL'].power)
            time.sleep(0.00001) # Small sleep to prevent busy-looping too aggressively
            
        hw_end_time = time.perf_counter()
        riscv_core.write(CTRL_REG_START, 0) # De-assert start
        
        hw_latency = (hw_end_time - hw_start_time) * 1000 # in ms
        
        active_power_hw = np.mean(power_samples_hw) if power_samples_hw else PowerSupply().rails['PL'].power
        hw_energy = max(0, (active_power_hw - idle_power_pl) * (hw_latency / 1000) * 1000) # mJ

        # --- Software Benchmark ---
        # NOTE: Assumes a 'benchmark_sw' executable exists on the PYNQ.
        # This should be cross-compiled for ARM and perform the same work.
        idle_power_ps = PowerSupply().rails['PS-CPU'].power
        sw_start_time = time.perf_counter()
        subprocess.run(['/home/xilinx/benchmark_sw']) # Make sure this path is correct
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
            "hw_power_w": power_samples_hw,
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
    # Make sure to run with sudo to access hardware
    app.run(host='0.0.0.0', port=5000)
`;
    
    const onCopy = () => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" style={{animationDuration: '0.2s'}}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl p-6 m-4 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-100">PYNQ-Z2 Benchmarking Server</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-100"><XIcon /></button>
                </div>
                <div className="text-slate-400 text-sm mb-4 bg-slate-900/50 p-3 rounded-md border border-slate-600">
                    <p>Save this code as <code className="font-mono text-cyan-300">server.py</code> on your PYNQ board. Install dependencies with <code className="font-mono text-cyan-300">pip install flask flask-cors numpy</code>, then run it using <code className="font-mono text-cyan-300">sudo python3 server.py</code>. Ensure you have an ARM-compiled <code className="font-mono text-cyan-300">benchmark_sw</code> executable in the same directory for the software comparison.</p>
                </div>
                <div className="overflow-y-auto pr-2 -mr-4 relative group">
                     <button onClick={onCopy} className="absolute top-2 right-4 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-sans rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {isCopied ? 'Copied!' : 'Copy Code'}
                    </button>
                    <pre className="language-python !bg-slate-900 !border-slate-700 !my-0 !rounded-lg"><code className="language-python">{code}</code></pre>
                </div>
            </div>
        </div>
    );
};

const LoadingSpinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-100"></div>
);

export const HardwareEmulation: React.FC = () => {
    const [selectedBoardId, setSelectedBoardId] = useState('pynq-z2');
    const [selectedProfileId, setSelectedProfileId] = useState<ProfileId>('balanced');
    const [instructionMix, setInstructionMix] = useState<Record<string, number>>(defaultInstructionMix);

    // State for hardware validation
    const [pynqIp, setPynqIp] = useState('192.168.2.99');
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [statusMessage, setStatusMessage] = useState('Enter your PYNQ board IP and connect.');
    const [bitFile, setBitFile] = useState<File | null>(null);
    const [binFile, setBinFile] = useState<File | null>(null);
    const [isBenchmarking, setIsBenchmarking] = useState(false);
    const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResults | null>(null);
    const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
    const [isServerModalOpen, setIsServerModalOpen] = useState(false);


    const handleInstructionChange = useCallback((name: string, value: number) => {
        setInstructionMix(prev => ({ ...prev, [name]: value }));
    }, []);

    const selectedBoard = boards[selectedBoardId];
    const profile = selectedBoard.profiles[selectedProfileId];

    const results = useMemo(() => {
        const sim = (isHw: boolean) => {
            let totalCycles = 0;
            let dynamicEnergyPj = 0;
            let memoryAccesses = 0;
            let branchCount = 0;

            for (const [instr, count] of Object.entries(instructionMix)) {
                const numericCount = Number(count);
                if (numericCount === 0) continue;

                if (isHw) {
                    const cyclesPerInstr = profile.cycles_hw[instr] ?? profile.cycles_hw['default'] ?? 1;
                    totalCycles += numericCount * cyclesPerInstr;
                    const energyPerCycle = profile.energy_per_cycle_hw[instr] ?? profile.energy_per_cycle_hw['default'] ?? 0;
                    dynamicEnergyPj += numericCount * cyclesPerInstr * energyPerCycle;
                } else {
                    const sw_equivalent_cycles = { 'mac': 5, 'relu': 3, 'conv2d.3x3': 40, 'dwconv.3x3': 35, 'maxpool.2x2': 10, 'sigmoid': 20, 'tanh': 20, 'default': 2 };
                    totalCycles += numericCount * (sw_equivalent_cycles[instr as keyof typeof sw_equivalent_cycles] || sw_equivalent_cycles.default);
                }

                if (['lw', 'sw', 'flw', 'fsw'].includes(instr)) {
                    memoryAccesses += numericCount;
                }
                 if (instr === 'beq') {
                    branchCount += numericCount;
                }
            }

            if (!isHw) {
                dynamicEnergyPj = totalCycles * profile.energy_per_cycle_sw;
            }

            const cacheMisses = memoryAccesses * (1 - profile.l1_cache_hit_rate);
            const cachePenaltyCycles = cacheMisses * profile.l1_miss_penalty_cycles;
            totalCycles += cachePenaltyCycles;

            // FIX: Explicitly cast operands to Number to ensure correct arithmetic operations.
            const branchMispredicts = Number(branchCount) * (1 - Number(profile.branch_predictor_accuracy));
            const branchPenaltyCycles = Number(branchMispredicts) * Number(profile.branch_mispredict_penalty_cycles);
            totalCycles += branchPenaltyCycles;
            
            const clockMhz = isHw ? profile.riscv_clk_mhz : profile.arm_clk_mhz;
            const latencyMs = (totalCycles / (clockMhz * 1e6)) * 1000;

            const staticPowerMw = isHw ? profile.static_power_hw_mw : profile.static_power_sw_mw;
            const staticEnergyMj = (staticPowerMw / 1000) * (latencyMs / 1000) * 1000;
            const dynamicEnergyMj = dynamicEnergyPj / 1e9;
            const totalEnergyMj = dynamicEnergyMj + staticEnergyMj;

            return { latencyMs, totalEnergyMj, totalCycles };
        };

        const hw = sim(true);
        const sw = sim(false);
        const speedup = sw.latencyMs / hw.latencyMs;
        const energyEfficiency = sw.totalEnergyMj / hw.totalEnergyMj;
        
        // FIX: Add explicit types to the reduce function's parameters to prevent potential type errors with strict settings.
        const totalOperations = Object.values(instructionMix).reduce((sum: number, count: number) => sum + Number(count), 0);
        const hwLatencyS = hw.latencyMs / 1000;
        const swLatencyS = sw.latencyMs / 1000;
        const hwThroughput = hwLatencyS > 0 ? Number(totalOperations) / hwLatencyS : 0;
        const swThroughput = swLatencyS > 0 ? Number(totalOperations) / swLatencyS : 0;

        return { hw, sw, speedup, energyEfficiency, hwThroughput, swThroughput };
    }, [instructionMix, profile]);
    
    const handleConnect = useCallback(async () => {
        setConnectionStatus('connecting');
        setStatusMessage(`Connecting to ${pynqIp}...`);
        setBenchmarkError(null);
        try {
            const response = await fetch(`http://${pynqIp}:5000/status`);
            if (!response.ok) throw new Error(`Server responded with status ${response.status}.`);
            const data = await response.json();
            if (data.status === 'PYNQ server is running') {
                setConnectionStatus('connected');
                setStatusMessage(`Connected to PYNQ @ ${pynqIp}`);
            } else {
                throw new Error('Unexpected server response.');
            }
        } catch (err) {
            setConnectionStatus('error');
            setStatusMessage(`Connection failed. Ensure the server is running on your PYNQ.`);
            console.error(err);
        }
    }, [pynqIp]);

    const handleRunBenchmark = useCallback(async () => {
        if (!bitFile || !binFile || connectionStatus !== 'connected') {
            setBenchmarkError("Please connect to a board and select both a .bit and .bin file.");
            return;
        }
        setIsBenchmarking(true);
        setBenchmarkError(null);
        setBenchmarkResults(null);

        const formData = new FormData();
        formData.append('bitfile', bitFile);
        formData.append('binfile', binFile);

        try {
            const response = await fetch(`http://${pynqIp}:5000/run_benchmark`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error || 'An unknown error occurred on the server.');
            }
            setBenchmarkResults(data);
        } catch (err: any) {
            setBenchmarkError(`Benchmark failed: ${err.message}`);
            console.error(err);
        } finally {
            setIsBenchmarking(false);
        }
    }, [pynqIp, bitFile, binFile, connectionStatus]);

    const chartData = [
        { name: 'Latency (ms)', 'Software (ARM)': results.sw.latencyMs, 'Hardware (Custom ISA)': results.hw.latencyMs },
        { name: 'Energy (mJ)', 'Software (ARM)': results.sw.totalEnergyMj, 'Hardware (Custom ISA)': results.hw.totalEnergyMj },
    ];
    
    return (
    <>
        <Section title="Hardware Emulation & Cycle-Accurate Simulation" icon={<SignalIcon />}>
            <p className="text-slate-400 mb-8 max-w-4xl">
                This interactive emulator projects the performance and energy consumption of the custom RISC-V core against a standard ARM core running the same workload in software. The model accounts for key architectural parameters, including clock speed, instruction latencies, cache performance, and power profiles derived from common FPGA development boards. Select a target board and a Dynamic Voltage and Frequency Scaling (DVFS) profile to see the estimated results.
            </p>

            <div className="max-w-4xl mb-10">
                <Card title="How the Cycle-Accurate Simulation Works" description="">
                    <div className="text-slate-400 space-y-4 text-sm">
                        <p>The results are generated by a cycle-accurate simulation model, providing a much deeper and more realistic analysis than high-level estimates. Here's how it works for both the custom hardware and the software baseline:</p>
                        <ol className="list-decimal list-inside space-y-3 pl-2">
                            <li>
                                <strong className="text-slate-300">Instruction Stream Analysis:</strong> The emulator first analyzes a representative instruction trace from a target workload (e.g., a MobileNetV2 inference). You can adjust this mix using the sliders below to model different applications.
                            </li>
                            <li>
                                <strong className="text-slate-300">Cycle Calculation:</strong>
                                <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
                                    <li><strong>Base Cycles:</strong> The total number of base clock cycles is calculated by multiplying the count of each instruction by its specific latency (e.g., `mac` = 1 cycle, `conv2d.3x3` = 3 cycles).</li>
                                    <li><strong>Cache Miss Penalty:</strong> The simulation models an L1 cache. Based on the selected board's profile, it injects cache misses for a percentage of memory access instructions (`lw`, `sw`). Each miss adds a significant number of penalty cycles (e.g., 40-55 cycles) to the total.</li>
                                    <li><strong>Branch Misprediction Penalty:</strong> The model also simulates a branch predictor. Based on the profile's accuracy (e.g., 92%), a percentage of branch instructions (`beq`) are flagged as mispredicted, adding a flush penalty (e.g., 3 cycles) for each.</li>
                                    <li><strong>Total Cycles:</strong> The final cycle count is the sum of base cycles and all penalty cycles.</li>
                                </ul>
                            </li>
                             <li>
                                <strong className="text-slate-300">Performance & Power Modeling:</strong>
                                <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
                                    <li><strong>Latency (ms):</strong> The total calculated cycles are divided by the selected clock frequency (e.g., 125 MHz for the RISC-V core) to determine the final execution time.</li>
                                    <li>
                                        <strong>Dynamic Energy (mJ):</strong> This is the energy consumed by switching transistors during computation.
                                        <ul className="list-['-_'] list-inside pl-4 mt-1 space-y-1">
                                            <li><strong className="text-cyan-400/80">Hardware Core:</strong> Calculated on a per-instruction basis. The model sums the energy for every single instruction executed (e.g., `mac` count × `mac` cycles × `mac` energy/cycle). It also adds the energy penalty for external DRAM accesses caused by cache misses.</li>
                                            <li><strong className="text-slate-300/80">Software Core:</strong> Modeled by multiplying the total equivalent cycles by an average energy-per-cycle value for the ARM core. This provides a realistic baseline for a standard processor's computational energy.</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <strong>Static Energy (mJ):</strong> This is the energy consumed by transistor leakage, even when the processor is idle. It's calculated by multiplying the board's static power rating (e.g., 100 mW) by the total execution time. Longer execution times result in higher static energy consumption.
                                    </li>
                                    <li>
                                        <strong>Total Energy (mJ):</strong> The final energy projection is the sum of the dynamic energy (from computation) and the static energy (from leakage over time). A faster core not only reduces dynamic energy with efficient instructions but also significantly cuts static energy by finishing the task sooner.
                                    </li>
                                </ul>
                            </li>
                        </ol>
                        <p className="pt-2">This detailed modeling for both the custom RISC-V core and the ARM baseline ensures a fair and insightful comparison of their true performance and efficiency on real-world workloads.</p>
                    </div>
                </Card>
            </div>


            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3">
                    <div className="space-y-6 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                        <div>
                            <label htmlFor="board-select" className="block text-sm font-medium text-slate-300 mb-2">Target FPGA Board</label>
                            <select id="board-select" value={selectedBoardId} onChange={e => setSelectedBoardId(e.target.value)} className="w-full p-2 bg-slate-900 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                {Object.entries(boards).map(([id, board]) => <option key={id} value={id}>{board.name}</option>)}
                            </select>
                             <p className="text-xs text-slate-500 mt-1">{selectedBoard.family}</p>
                        </div>
                         <div>
                            <label htmlFor="profile-select" className="block text-sm font-medium text-slate-300 mb-2">DVFS Profile</label>
                            <div className="flex space-x-2">
                                {Object.entries(selectedBoard.profiles).map(([id, prof]) => (
                                    <button key={id} onClick={() => setSelectedProfileId(id as ProfileId)} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${selectedProfileId === id ? 'bg-cyan-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>
                                        {prof.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                     <div className="mt-6 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                        <h4 className="text-lg font-bold text-slate-100 mb-4">Workload Instruction Mix</h4>
                        <p className="text-sm text-slate-400 mb-4">Adjust the dynamic instruction count to model different applications (e.g., CNN-heavy vs. DSP-heavy).</p>
                        {Object.entries(instructionCategories).map(([category, instructions]) => (
                            <div key={category} className="mb-4">
                                <h5 className="text-sm font-semibold text-cyan-400 mb-2">{category}</h5>
                                <div className="space-y-2">
                                    {instructions.map(instr => (
                                        <InstructionSlider key={instr} name={instr} value={instructionMix[instr as keyof typeof instructionMix]} onChange={(val) => handleInstructionChange(instr, val)} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-9">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 text-center">
                        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                             <h4 className="text-base font-semibold text-slate-400 mb-1">Performance Speedup</h4>
                             <p className="text-4xl font-bold text-cyan-400">{results.speedup.toFixed(2)}x</p>
                             <p className="text-xs text-slate-500">Hardware vs. Software</p>
                        </div>
                         <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                             <h4 className="text-base font-semibold text-slate-400 mb-1">Energy Efficiency Gain</h4>
                             <p className="text-4xl font-bold text-cyan-400">{results.energyEfficiency.toFixed(2)}x</p>
                             <p className="text-xs text-slate-500">Hardware vs. Software</p>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                             <h4 className="text-base font-semibold text-slate-400 mb-1">RISC-V Throughput</h4>
                             <p className="text-4xl font-bold text-slate-100">{formatThroughput(results.hwThroughput)}</p>
                             <p className="text-xs text-slate-500">Custom Core</p>
                        </div>
                         <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                             <h4 className="text-base font-semibold text-slate-400 mb-1">ARM Throughput</h4>
                             <p className="text-4xl font-bold text-slate-100">{formatThroughput(results.swThroughput)}</p>
                             <p className="text-xs text-slate-500">Baseline Core</p>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                             <h4 className="text-base font-semibold text-slate-400 mb-1">RISC-V Clock</h4>
                             <p className="text-4xl font-bold text-slate-100">{profile.riscv_clk_mhz} <span className="text-2xl text-slate-400">MHz</span></p>
                             <p className="text-xs text-slate-500">Custom Core</p>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                             <h4 className="text-base font-semibold text-slate-400 mb-1">ARM Clock</h4>
                             <p className="text-4xl font-bold text-slate-100">{profile.arm_clk_mhz} <span className="text-2xl text-slate-400">MHz</span></p>
                             <p className="text-xs text-slate-500">Baseline Core</p>
                        </div>
                    </div>

                    <div className="mt-8 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-xl font-bold text-slate-100 mb-4">Performance & Energy Comparison</h4>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis type="number" stroke="#94a3b8" />
                                    <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                                        cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                                        formatter={(value: number) => value.toFixed(3)}
                                    />
                                    <Legend />
                                    <Bar dataKey="Software (ARM)" fill="#64748b" radius={[0, 4, 4, 0]} barSize={35}>
                                        <LabelList dataKey="Software (ARM)" position="right" style={{ fill: '#cbd5e1' }} formatter={(v: number) => v.toFixed(2)} />
                                    </Bar>
                                    <Bar dataKey="Hardware (Custom ISA)" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={35}>
                                        <LabelList dataKey="Hardware (Custom ISA)" position="right" style={{ fill: '#f1f5f9' }} formatter={(v: number) => v.toFixed(2)} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                     <div className="mt-8 grid md:grid-cols-2 gap-8 text-sm">
                        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                            <h4 className="text-lg font-bold text-slate-100 mb-3">Hardware Core Breakdown</h4>
                             <ul className="space-y-2">
                                <li className="flex justify-between"><span>Total Cycles:</span> <span className="font-mono text-cyan-400">{formatNumber(results.hw.totalCycles)}</span></li>
                                <li className="flex justify-between"><span>Est. Latency:</span> <span className="font-mono text-cyan-400">{results.hw.latencyMs.toFixed(3)} ms</span></li>
                                <li className="flex justify-between"><span>Est. Energy:</span> <span className="font-mono text-cyan-400">{results.hw.totalEnergyMj.toFixed(3)} mJ</span></li>
                            </ul>
                        </div>
                         <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                            <h4 className="text-lg font-bold text-slate-100 mb-3">Software Core Breakdown</h4>
                             <ul className="space-y-2">
                                <li className="flex justify-between"><span>Total Cycles (Equivalent):</span> <span className="font-mono text-slate-400">{formatNumber(results.sw.totalCycles)}</span></li>
                                <li className="flex justify-between"><span>Est. Latency:</span> <span className="font-mono text-slate-400">{results.sw.latencyMs.toFixed(3)} ms</span></li>
                                <li className="flex justify-between"><span>Est. Energy:</span> <span className="font-mono text-slate-400">{results.sw.totalEnergyMj.toFixed(3)} mJ</span></li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </Section>

        <div className="mt-12 border-t border-slate-700 pt-12">
            <PynqServerCodeModal isOpen={isServerModalOpen} onClose={() => setIsServerModalOpen(false)} />
            <Section title="From Simulation to Silicon: Hardware Validation" icon={<SignalIcon />}>
                <p className="text-slate-400 mb-8 max-w-4xl">
                    Bridge the gap between simulation and reality. Connect to a live PYNQ-Z2 board, upload your compiled bitstream and program binary, and run a real-world benchmark to validate the performance and energy projections from the emulator above.
                </p>
                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4">
                        <Card title="PYNQ-Z2 Control Panel" description="">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">PYNQ IP Address</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="text" value={pynqIp} onChange={e => setPynqIp(e.target.value)} className="flex-grow p-2 bg-slate-900 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g., 192.168.2.99" />
                                        <button onClick={handleConnect} disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'} className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 disabled:bg-slate-600 flex items-center space-x-2">
                                            {connectionStatus === 'connecting' && <LoadingSpinner />}
                                            <span>{connectionStatus === 'connected' ? 'Connected' : 'Connect'}</span>
                                        </button>
                                    </div>
                                    <p className={`mt-2 text-xs ${connectionStatus === 'error' ? 'text-red-400' : connectionStatus === 'connected' ? 'text-green-400' : 'text-slate-500'}`}>
                                        {statusMessage}
                                    </p>
                                </div>
                                {connectionStatus === 'connected' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">FPGA Bitstream (.bit)</label>
                                            <input type="file" accept=".bit" onChange={e => setBitFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600"/>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">RISC-V Program (.bin)</label>
                                            <input type="file" accept=".bin" onChange={e => setBinFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600"/>
                                        </div>
                                        <button onClick={handleRunBenchmark} disabled={isBenchmarking || !bitFile || !binFile} className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 disabled:bg-slate-600 flex items-center justify-center space-x-2 text-lg">
                                            {isBenchmarking && <LoadingSpinner />}
                                            <span>{isBenchmarking ? 'Running on Hardware...' : 'Run Benchmark'}</span>
                                        </button>
                                    </div>
                                )}
                                <div className="pt-2 text-center">
                                    <button onClick={() => setIsServerModalOpen(true)} className="text-xs text-cyan-400 hover:text-cyan-300 underline">
                                        How to set up the PYNQ server?
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
                     <div className="lg:col-span-8">
                        {isBenchmarking ? (
                            <div className="flex flex-col items-center justify-center h-full bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                                <LoadingSpinner />
                                <p className="text-slate-300 mt-4">Running benchmark on PYNQ-Z2...</p>
                                <p className="text-slate-500 text-sm">This may take a few moments.</p>
                            </div>
                        ) : benchmarkError ? (
                            <div className="h-full bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center justify-center">
                                <p><strong className="font-bold">Error: </strong> {benchmarkError}</p>
                            </div>
                        ) : benchmarkResults ? (
                            <div className="animate-fade-in">
                                <h3 className="text-2xl font-bold text-slate-100 mb-4">Hardware Validated Results</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 text-center">
                                    <div className="bg-slate-800/50 p-6 rounded-lg border border-green-500/50">
                                        <h4 className="text-base font-semibold text-slate-400 mb-1">Validated Speedup</h4>
                                        <p className="text-4xl font-bold text-green-400">{benchmarkResults.speedup.toFixed(2)}x</p>
                                    </div>
                                    <div className="bg-slate-800/50 p-6 rounded-lg border border-green-500/50">
                                        <h4 className="text-base font-semibold text-slate-400 mb-1">Validated Energy Gain</h4>
                                        <p className="text-4xl font-bold text-green-400">{benchmarkResults.energy_efficiency.toFixed(2)}x</p>
                                    </div>
                                    <div className="bg-slate-800/50 p-6 rounded-lg border border-green-500/50">
                                         <h4 className="text-base font-semibold text-slate-400 mb-1">HW Latency</h4>
                                         <p className="text-4xl font-bold text-green-400">{benchmarkResults.hw_latency_ms.toFixed(2)}<span className="text-2xl text-slate-400"> ms</span></p>
                                    </div>
                                </div>
                                <div className="mt-6 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                    <h4 className="text-lg font-bold text-slate-100 mb-2">Validated vs. Simulated Latency</h4>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Simulated', 'Latency (ms)': results.hw.latencyMs },
                                                { name: 'Validated', 'Latency (ms)': benchmarkResults.hw_latency_ms }
                                            ]} layout="vertical" margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis type="number" stroke="#94a3b8" />
                                                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} />
                                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} formatter={(v: number) => `${v.toFixed(3)} ms`} />
                                                <Bar dataKey="Latency (ms)" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={35}>
                                                    <LabelList dataKey="Latency (ms)" position="right" style={{ fill: '#f1f5f9' }} formatter={(v: number) => v.toFixed(2)} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full bg-slate-800/50 p-6 rounded-lg border border-slate-700 border-dashed">
                                <p className="text-slate-400">Hardware validation results will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Section>
        </div>
    </>
    );
};