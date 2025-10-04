import React from 'react';

export const ArchitectureDiagram: React.FC = () => {
  return (
    <svg width="100%" height="300" viewBox="0 0 700 300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="accelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#67e8f9', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
        </linearGradient>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
        <style>
          {`.label-text { font-family: Inter, sans-serif; font-size: 11px; fill: #94a3b8; text-anchor: middle; }`}
          {`.stage-text { font-family: Inter, sans-serif; font-size: 13px; fill: #cbd5e1; text-anchor: middle; font-weight: 500; dominant-baseline: middle; }`}
          {`.title-text { font-family: Inter, sans-serif; font-size: 18px; fill: #f1f5f9; text-anchor: middle; font-weight: bold; }`}
        </style>
      </defs>

      {/* Main Titles */}
      <text x="150" y="25" className="title-text">Standard RISC-V Core</text>
      <text x="550" y="25" className="title-text">Custom NN Accelerator</text>
      
      {/* Core Box */}
      <rect x="25" y="40" width="250" height="240" rx="8" fill="#1e293b" stroke="url(#coreGrad)" strokeWidth="2" />
      
      {/* Core Pipeline Stages */}
      <g id="riscv-pipeline">
        <rect x="80" y="55" width="140" height="30" rx="4" fill="#0f172a" />
        <text x="150" y="70" className="stage-text">Instruction Fetch</text>
        <path d="M 150 85 L 150 95" stroke="#334155" strokeWidth="2" markerEnd="url(#arrowhead)" />
        
        <rect x="80" y="95" width="140" height="30" rx="4" fill="#0f172a" />
        <text x="150" y="110" className="stage-text">Decode</text>
        <path d="M 150 125 L 150 135" stroke="#334155" strokeWidth="2" markerEnd="url(#arrowhead)" />
        
        <rect x="80" y="135" width="140" height="30" rx="4" fill="#0f172a" />
        <text x="150" y="150" className="stage-text">Execute</text>
        <path d="M 150 165 L 150 175" stroke="#334155" strokeWidth="2" markerEnd="url(#arrowhead)" />
        
        <rect x="80" y="175" width="140" height="30" rx="4" fill="#0f172a" />
        <text x="150" y="190" className="stage-text">Memory</text>
        <path d="M 150 205 L 150 215" stroke="#334155" strokeWidth="2" markerEnd="url(#arrowhead)" />
        
        <rect x="80" y="215" width="140" height="30" rx="4" fill="#0f172a" />
        <text x="150" y="230" className="stage-text">Writeback</text>
      </g>

      {/* Accelerator Box */}
      <rect x="425" y="40" width="250" height="240" rx="8" fill="#1e293b" stroke="url(#accelGrad)" strokeWidth="2" />
      
      {/* Accelerator Components */}
      <g id="nn-accelerator">
        <rect x="440" y="55" width="220" height="40" rx="4" fill="#0f172a" />
        <text x="550" y="75" className="stage-text">Custom Instruction Decode</text>
        <path d="M 550 95 L 550 110" stroke="#334155" strokeWidth="2" markerEnd="url(#arrowhead)" />


        <rect x="440" y="110" width="220" height="70" rx="4" fill="#0f172a" />
        <text x="550" y="135" className="stage-text">Execution Units</text>
        <text x="550" y="155" className="label-text" fill="#64748b">(MAC, ReLU, CONV2D)</text>
        <path d="M 550 180 L 550 195" stroke="#334155" strokeWidth="2" markerEnd="url(#arrowhead)" />
        
        <rect x="440" y="195" width="220" height="40" rx="4" fill="#0f172a" />
        <text x="550" y="215" className="stage-text">Data Buffers</text>
      </g>

      {/* Connecting Lines */}
      {/* Decode -> Custom Decode */}
      <path d="M 220 110 C 330 110, 330 75, 440 75" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="5 3"/>
      <text x="330" y="70" className="label-text">Offload Custom Instruction</text>
      <text x="330" y="83" className="label-text">(Control & Operands)</text>

      {/* Accelerator -> Writeback */}
      <path d="M 440 145 C 330 145, 330 230, 220 230" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
      <text x="330" y="245" className="label-text">Writeback Result / Status</text>

      {/* Accelerator <-> Memory */}
      <path d="M 220 190 C 330 190, 330 215, 440 215" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
      <text x="330" y="195" className="label-text">Memory Access Req/Resp</text>
      
    </svg>
  );
};
