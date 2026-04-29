/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export interface MapPoint {
  x: number; // 0 to 100
  y: number; // 0 to 100
}

interface BirkmanMapProps {
  interests: MapPoint;
  usual: MapPoint;
  need: MapPoint;
  stress: MapPoint;
  className?: string;
}

export const BirkmanMap: React.FC<BirkmanMapProps> = ({
  interests,
  usual,
  need,
  stress,
  className
}) => {
  // Convert 0-100 coordinates to SVG space (e.g., 0-400)
  const toSVG = (p: MapPoint) => ({
    x: (p.x / 100) * 400,
    y: 400 - (p.y / 100) * 400 // Flip Y for SVG
  });

  const pInterests = toSVG(interests);
  const pUsual = toSVG(usual);
  const pNeed = toSVG(need);
  const pStress = toSVG(stress);

  return (
    <div className={cn("relative w-full aspect-square max-w-[500px] mx-auto", className)}>
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Quadrant Backgrounds */}
        {/* Red (Top Left) */}
        <rect x="0" y="0" width="200" height="200" fill="#FEE2E2" opacity="0.5" />
        {/* Green (Top Right) */}
        <rect x="200" y="0" width="200" height="200" fill="#DCFCE7" opacity="0.5" />
        {/* Yellow (Bottom Left) */}
        <rect x="0" y="200" width="200" height="200" fill="#FEF3C7" opacity="0.5" />
        {/* Blue (Bottom Right) */}
        <rect x="200" y="200" width="200" height="200" fill="#DBEAFE" opacity="0.5" />

        {/* Grid Lines */}
        <line x1="200" y1="0" x2="200" y2="400" stroke="#D1D5DB" strokeWidth="1" />
        <line x1="0" y1="200" x2="400" y2="200" stroke="#D1D5DB" strokeWidth="1" />
        
        {/* Center label */}
        <text x="200" y="205" textAnchor="middle" className="text-[10px] font-bold fill-[#9CA3AF]">Center</text>

        {/* Quadrant Labels */}
        <text x="100" y="100" textAnchor="middle" className="text-sm font-black fill-[#DC2626]">DOER (RED)</text>
        <text x="300" y="100" textAnchor="middle" className="text-sm font-black fill-[#16A34A]">COMMUNICATOR (GREEN)</text>
        <text x="100" y="310" textAnchor="middle" className="text-sm font-black fill-[#D97706]">ANALYZER (YELLOW)</text>
        <text x="300" y="310" textAnchor="middle" className="text-sm font-black fill-[#2563EB]">THINKER (BLUE)</text>

        {/* Axis Labels */}
        <text x="200" y="20" textAnchor="middle" className="text-[10px] font-bold fill-[#9CA3AF]">EXTROVERTED / DIRECT</text>
        <text x="200" y="390" textAnchor="middle" className="text-[10px] font-bold fill-[#9CA3AF]">INTROVERTED / INDIRECT</text>
        <text x="10" y="200" textAnchor="middle" transform="rotate(-90, 10, 200)" className="text-[10px] font-bold fill-[#9CA3AF]">TASK / TECHNICAL</text>
        <text x="390" y="200" textAnchor="middle" transform="rotate(90, 390, 200)" className="text-[10px] font-bold fill-[#9CA3AF]">PEOPLE / SOCIAL</text>

        {/* Markers */}
        {/* Interests: Asterisk */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <text 
            x={pInterests.x} 
            y={pInterests.y} 
            textAnchor="middle" 
            dominantBaseline="middle"
            className="text-2xl font-bold fill-[#1A1714]"
          >*</text>
        </motion.g>

        {/* Usual: Diamond */}
        <motion.path
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          d={`M ${pUsual.x} ${pUsual.y - 8} L ${pUsual.x + 8} ${pUsual.y} L ${pUsual.x} ${pUsual.y + 8} L ${pUsual.x - 8} ${pUsual.y} Z`}
          fill="#1A1714"
        />

        {/* Need: Circle */}
        <motion.circle
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          cx={pNeed.x}
          cy={pNeed.y}
          r="7"
          fill="none"
          stroke="#1A1714"
          strokeWidth="2"
        />

        {/* Stress: Square */}
        <motion.rect
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          x={pStress.x - 7}
          y={pStress.y - 7}
          width="14"
          height="14"
          fill="#1A1714"
        />
      </svg>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-[11px] font-bold p-4 bg-[#F8F7F5] rounded-2xl border border-[#E5E3DF]">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black">*</span>
          <span>Interests (관심사)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#1A1714] rotate-45" />
          <span>Usual Behavior (평소 행동)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-[#1A1714]" />
          <span>Internal Needs (욕구)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#1A1714]" />
          <span>Stress Behavior (스트레스)</span>
        </div>
      </div>
    </div>
  );
};
