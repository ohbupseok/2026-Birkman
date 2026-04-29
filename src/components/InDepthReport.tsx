/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { BirkmanDetailedData } from '../data/sampleReport';
import { BirkmanMap } from './BirkmanMap';
import { BIRKMAN_COMPONENTS } from '../constants';
import { cn } from '../lib/utils';
import { Info, AlertCircle, TrendingUp, Heart } from 'lucide-react';

interface InDepthReportProps {
  data: BirkmanDetailedData;
}

export const InDepthReport: React.FC<InDepthReportProps> = ({ data }) => {
  return (
    <div className="space-y-12">
      {/* Header Profile */}
      <section className="bg-white rounded-[40px] p-8 border border-[#E5E3DF] shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className={cn(
          "w-32 h-32 rounded-[40px] flex items-center justify-center text-5xl font-black text-white shadow-2xl",
          data.primaryColor === 'red' ? "bg-red-500 shadow-red-500/20" :
          data.primaryColor === 'green' ? "bg-emerald-500 shadow-emerald-500/20" :
          data.primaryColor === 'yellow' ? "bg-amber-500 shadow-amber-500/20" :
          "bg-blue-500 shadow-blue-500/20"
        )}>
          {data.name.charAt(0)}
        </div>
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-4xl font-black tracking-tighter">{data.name}</h2>
          <p className="text-xl text-[#9C9590] font-bold">{data.role}</p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
            <span className="px-4 py-1 bg-[#F8F7F5] border border-[#E5E3DF] rounded-full text-xs font-black text-[#5C5751] uppercase tracking-widest">
              Signature Report
            </span>
            <span className={cn(
              "px-4 py-1 rounded-full text-xs font-black text-white uppercase tracking-widest",
              data.primaryColor === 'red' ? "bg-red-500" :
              data.primaryColor === 'green' ? "bg-emerald-500" :
              data.primaryColor === 'yellow' ? "bg-amber-500" :
              "bg-blue-500"
            )}>
              {data.primaryColor} Lifestyle
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Birkman Map Section */}
        <section className="bg-white rounded-[40px] p-8 border border-[#E5E3DF] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#E85D26] text-white flex items-center justify-center">
                <TrendingUp size={18} />
              </span>
              Birkman Map
            </h3>
            <div className="p-2 hover:bg-[#F8F7F5] rounded-xl cursor-help" title="The Birkman Map shows how you relate to tasks and people.">
              <Info size={20} className="text-[#9C9590]" />
            </div>
          </div>
          <p className="text-sm text-[#5C5751] leading-relaxed">
            맵의 위치는 귀하의 업무 추진 방식과 대인 관계 선호도를 나타냅니다.
          </p>
          <BirkmanMap 
            interests={data.mapCoordinates.interests}
            usual={data.mapCoordinates.usual}
            need={data.mapCoordinates.need}
            stress={data.mapCoordinates.stress}
          />
        </section>

        {/* Interests Section */}
        <section className="bg-white rounded-[40px] p-8 border border-[#E5E3DF] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center">
                <Heart size={18} />
              </span>
              Interests Scores
            </h3>
          </div>
          <p className="text-sm text-[#5C5751] leading-relaxed">
            귀하가 열정을 느끼고 동기가 부여되는 활동 분야입니다. (높을수록 선호)
          </p>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.interestScores}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E3DF" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 11, fontWeight: 'bold', fill: '#5C5751' }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#F8F7F5' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#1A1714] text-white p-3 rounded-xl shadow-xl border border-white/10">
                          <p className="text-xs font-black mb-1">{payload[0].payload.name}</p>
                          <p className="text-lg font-black text-orange-400">{payload[0].value}%</p>
                          <p className="text-[10px] opacity-60 mt-1">{payload[0].payload.description}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={20}>
                  {data.interestScores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#7C3AED' : entry.score > 50 ? '#A78BFA' : '#E5E3DF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 9 Behavioral Components */}
      <section className="bg-white rounded-[40px] p-10 border border-[#E5E3DF] shadow-sm space-y-12">
        <div className="space-y-2">
          <h3 className="text-3xl font-black tracking-tight">9대 행동 성향 지표 상세 분석</h3>
          <p className="text-lg text-[#9C9590] font-medium">평소 행동(Usual)과 내면의 욕구(Needs), 그리고 스트레스(Stress)를 비교합니다.</p>
        </div>

        <div className="space-y-16">
          {BIRKMAN_COMPONENTS.map(comp => {
            const score = data.scores[comp.id];
            if (!score) return null;
            const gap = Math.abs(score.usual - score.need);
            const isHighGap = gap >= 25;

            return (
              <div key={comp.id} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-xl font-bold text-[#1A1714]">{comp.name}</h4>
                      {isHighGap && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                          <AlertCircle size={10} /> Needs Gap Notice
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#9C9590] max-w-2xl">{comp.description}</p>
                  </div>
                  <div className="flex gap-8 items-center bg-[#F8F7F5] p-4 rounded-2xl border border-[#E5E3DF]">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-[#9C9590] uppercase tracking-widest mb-1">Usual</p>
                      <p className="text-2xl font-black text-[#1A1714]">{score.usual}</p>
                    </div>
                    <div className="w-px h-10 bg-[#E5E3DF]" />
                    <div className="text-center">
                      <p className="text-[10px] font-black text-[#9C9590] uppercase tracking-widest mb-1">Needs</p>
                      <p className="text-2xl font-black text-[#E85D26]">{score.need}</p>
                    </div>
                    <div className="w-px h-10 bg-[#E5E3DF]" />
                    <div className="text-center">
                      <p className="text-[10px] font-black text-[#9C9590] uppercase tracking-widest mb-1">Stress</p>
                      <p className="text-2xl font-black text-red-500">{score.stress}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Usual Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black text-[#5C5751] uppercase tracking-widest px-1">
                      <span>Usual Behavior (겉으로 드러나는 모습)</span>
                    </div>
                    <div className="relative h-4 bg-[#F8F7F5] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${score.usual}%` }}
                        className="h-full bg-[#1A1714] rounded-full"
                      />
                    </div>
                  </div>

                  {/* Needs Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black text-[#E85D26] uppercase tracking-widest px-1">
                      <span>Internal Needs (내가 바라는 환경)</span>
                    </div>
                    <div className="relative h-4 bg-orange-50 rounded-full overflow-hidden border border-orange-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${score.need}%` }}
                        className="h-full bg-[#E85D26] rounded-full"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-[#5C5751] bg-[#F8F7F5] p-4 rounded-xl border border-[#E5E3DF] italic">
                      {score.usual > 50 ? "적극적이고 선도적이며 사회적인 관여도가 높은 행동 양식을 보입니다." : "신중하고 독립적이며 개인적인 성찰을 중요하게 여기는 행동 양식을 보입니다."} 
                      {" "}
                      {score.need > 50 ? "타인으로부터의 명확한 피드백과 활발한 소통이 있는 환경에서 최고의 성과를 냅니다." : "차분하고 체계적이며 불필요한 간섭이 없는 주체적인 환경을 선호합니다."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Summary Action */}
      <section className="bg-[#1A1714] rounded-[40px] p-12 text-center text-white space-y-6">
        <h3 className="text-3xl font-black">나를 위한 맞춤 전략이 필요하신가요?</h3>
        <p className="text-white/60 max-w-lg mx-auto leading-relaxed">
          이 데이터들을 종합하여 AI가 당신의 핵심 강점과 스트레스 관리법, 
          그리고 최고의 성과를 위한 최적의 소통 방식을 제안해드립니다.
        </p>
        <button className="px-10 py-4 bg-[#E85D26] text-white rounded-2xl font-black hover:bg-[#D44D1D] transition-all shadow-xl shadow-orange-500/20 active:scale-95">
          AI 코칭 리포트 자동 생성
        </button>
      </section>
    </div>
  );
};
