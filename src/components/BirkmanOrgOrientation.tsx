import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const ORG_ENVIRONMENTS = [
  {
    name: '빨강- 운영/기술',
    key: 'red',
    title: '운영/기술',
    items: [
      '주로 수단과 개별적 행동에 초점을 두는 실용적이고 실무적인 접근을 강조하는 근무 환경',
      '실행을 강력히 강조하는 상품, 결과물 중심 문화'
    ],
    bg: 'bg-red-500',
    borderColor: 'border-red-200',
    textColor: 'text-red-700'
  },
  {
    name: '초록- 영업/마케팅',
    key: 'green',
    title: '영업/마케팅',
    items: [
      '판매, 홍보, 타인을 이끌고 동기부여를 강조하는 근무환경',
      '사람들에게 영향을 주도록 설계된 커뮤니케이션 기반 문화'
    ],
    bg: 'bg-emerald-500',
    borderColor: 'border-green-200',
    textColor: 'text-emerald-700'
  },
  {
    name: '노랑- 관리/회계',
    key: 'yellow',
    title: '관리/회계',
    items: [
      '표준, 일관성, 질적 완성도를 강조하는 근무환경',
      '효율적인 절차와 정책에 기초하여 업무 수행'
    ],
    bg: 'bg-amber-500',
    borderColor: 'border-yellow-200',
    textColor: 'text-amber-700'
  },
  {
    name: '파랑- 기획/전략',
    key: 'blue',
    title: '기획/전략',
    items: [
      '기획, 혁신, 창조를 강조하는 근무환경',
      '주로 전략과 계획에 강한 초점을 두는 아이디어 문화'
    ],
    bg: 'bg-blue-500',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700'
  }
];

interface BirkmanOrgOrientationProps {
  name: string;
}

export function BirkmanOrgOrientation({ name }: BirkmanOrgOrientationProps) {
  // Sample similarity scores based on name or random for now
  const similarityScores = {
    red: 75,
    green: 85,
    yellow: 92,
    blue: 78
  };

  const sortedScores = Object.entries(similarityScores).sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-white rounded-[40px] border border-[#E5E3DF] p-10 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-10">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">조직지향점</h2>
          <p className="text-[#9C9590] font-bold text-sm tracking-widest uppercase">{name}</p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 p-1.5 rounded-2xl flex items-center justify-center transform -rotate-6 shadow-lg">
          <div className="w-full h-full bg-white rounded-lg flex items-center justify-center transform rotate-6">
            <div className="w-4 h-4 rounded-full bg-[#1A1714]/10" />
          </div>
        </div>
      </div>

      <p className="text-[#5C5751] font-medium leading-relaxed mb-12 max-w-2xl">
        조직지향점은 자신에게 잠재적 가능성이 높은 최적의 근무 환경과 개인의 업무방식을 보여줍니다. 
        자신이 네 가지 다른 근무환경에서 일하는 사람들과 얼마나 유사성이 있는가를 확인하여 산출됩니다.
      </p>

      {/* Similarity Bars */}
      <section className="mb-16 space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1714] mb-8 border-b border-[#F8F7F5] pb-4">직무분야 종사자와의 유사성</h3>
        {ORG_ENVIRONMENTS.map((env) => (
          <div key={env.key} className="grid grid-cols-[1fr,2fr] items-center gap-6">
            <span className="text-sm font-bold text-[#1A1714]">{env.name}</span>
            <div className="relative h-6 bg-[#F8F7F5] rounded-md overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${similarityScores[env.key as keyof typeof similarityScores]}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={cn("h-full", env.bg)}
              />
            </div>
          </div>
        ))}
      </section>

      {/* Grid of Descriptions */}
      <section>
        <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1714] mb-8 border-b border-[#F8F7F5] pb-4">색상별 조직지향점</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#E5E3DF] rounded-[32px] overflow-hidden border border-[#E5E3DF]">
          {ORG_ENVIRONMENTS.map((env) => (
            <div key={env.key} className="flex bg-white group min-h-[200px]">
              {/* Vertical Color Bar */}
              <div className={cn("w-12 flex items-center justify-center shrink-0", env.bg)}>
                <span className="text-white font-black text-lg transform -rotate-180 [writing-mode:vertical-lr] tracking-widest">
                  {env.key === 'red' ? '빨강' : env.key === 'green' ? '초록' : env.key === 'yellow' ? '노랑' : '파랑'}
                </span>
              </div>
              
              <div className="flex-1 p-8">
                <h4 className={cn("text-xl font-black mb-4", env.textColor)}>
                  {env.name}
                </h4>
                <ul className="space-y-3">
                  {env.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-[#5C5751] font-medium leading-relaxed">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-[#D1CEC8] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 pt-8 border-t border-[#F8F7F5] flex justify-between items-center text-[10px] font-black text-[#D1CEC8] uppercase tracking-widest">
         <span>Birkman Organizational Focus Guide</span>
         <span>Signature Report | {name} | © 2026</span>
      </div>
    </div>
  );
}
