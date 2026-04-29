import React from 'react';
import { cn } from '../lib/utils';

const COLORS = [
  {
    name: '빨강',
    key: 'red',
    title: '행동하는 사람',
    description: '버크만의 빨강은 빠른 결정을 내리고, 결과를 얻는 것을 선호하는 사람들을 위한 컬러입니다. 빨강은 직접적이고, 행동 지향적이며, 당면한 과제에 집중합니다. 무엇인가 만들고, 손으로 일하고, 사람과 프로젝트를 조직하고, 실질적인 문제 해결과 가시적인 완성품을 생산하는 것을 즐깁니다. 빨강은 객관적이고, 활력이 넘치며, 앞장 서서 진두지휘하고, 팀 경쟁을 즐깁니다. 빨강은 행동을 통해 결과를 만들어냅니다.',
    bg: 'bg-red-500',
    lightBg: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700'
  },
  {
    name: '초록',
    key: 'green',
    title: '소통하는 사람',
    description: '버크만의 초록은 사람들과 의사소통하고 함께 일하기를 간절히 바라는 사람들을 위한 컬러입니다. 초록은 결과를 얻기 위해 판매하고, 설득하고, 홍보하고, 동기부여하고, 상담하고, 가르치거나 사람들과 함께 작업합니다. 제품, 서비스 또는 아이디어에 대해 쉽고 자연스럽게 소통할 수 있습니다. 친구를 사귀고 사람들에게 영향을 줄 수 있는 누군가를 원한다면, 초록이 가장 적합할 것입니다.',
    bg: 'bg-emerald-500',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-green-200',
    textColor: 'text-emerald-700'
  },
  {
    name: '노랑',
    key: 'yellow',
    title: '분석하는 사람',
    description: '버크만의 노랑은 프로세스, 세부사항, 정의 및 규칙으로 일하기를 좋아하는 사람들을 위한 컬러입니다. 노랑은 신중하고 세밀한 계산, 일정 관리, 기록 관리 및 체계적인 절차 수립을 즐깁니다. 보통 숫자에 익숙하고, 공정함에 우선순위를 두고, 신중하고 철저하게 분석합니다. 노랑은 과제지향적이며, 형식, 규칙 및 규정을 포함한 간접적인 의사소통 방식을 선호합니다. 만약 구조화해야 할 것이 있다면 노랑이 적임자일 것입니다.',
    bg: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-amber-700'
  },
  {
    name: '파랑',
    key: 'blue',
    title: '생각형 사람',
    description: '버크만의 파랑은 개념과 아이디어를 가진 사람들을 위한 컬러입니다. 파랑은 창조적이며, 장기적인 기획을 통한 혁신을 좋아합니다. 추상적인 사고와 새로운 방법으로 문제를 해결하는 것을 즐깁니다. 파랑은 새로운 아이디어를 내고, 당면한 과제에 대해 가장 성공할 가능성이 높은 솔루션을 제시합니다. 파랑은 내성적이지만, 독창성과 혁신을 좋아해서 도화선이 될 다른 창의적인 인물 주위에 있고 싶어 합니다.',
    bg: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700'
  }
];

export function BirkmanColorGuide() {
  return (
    <div className="bg-white rounded-[40px] border border-[#E5E3DF] p-10 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-10">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">버크만 컬러 키워드</h2>
          <p className="text-[#9C9590] font-bold text-sm tracking-widest uppercase">Birkman Color Keywords</p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 p-1.5 rounded-2xl flex items-center justify-center transform rotate-12 shadow-lg">
          <div className="w-full h-full bg-white rounded-lg flex items-center justify-center transform -rotate-12">
            <div className="w-4 h-4 rounded-full bg-[#1A1714]/10" />
          </div>
        </div>
      </div>

      <p className="text-[#5C5751] font-medium leading-relaxed mb-12 max-w-2xl">
        버크만은 사람들 간의 근본적인 차이를 쉽게 이해할 수 있도록 네 가지 컬러를 사용합니다. 
        다음은 각 버크만 컬러의 특징에 대한 설명입니다.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {COLORS.map((color) => (
          <div key={color.key} className="flex h-full min-h-[220px] rounded-[32px] overflow-hidden border border-[#E5E3DF] shadow-sm group hover:border-black/5 transition-all">
            {/* Sidebar with vertical text */}
            <div className={cn("w-16 flex items-center justify-center shrink-0", color.bg)}>
              <span className="text-white font-black text-2xl transform -rotate-180 [writing-mode:vertical-lr] tracking-widest">
                {color.name}
              </span>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 p-8 bg-white flex flex-col">
              <h3 className={cn("text-2xl font-black mb-4", color.textColor)}>
                {color.title}
              </h3>
              <p className="text-[13px] text-[#5C5751] leading-relaxed font-medium">
                {color.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 pt-8 border-t border-[#F8F7F5] flex justify-between items-center text-[10px] font-black text-[#D1CEC8] uppercase tracking-widest">
         <span>Birkman Lifestyle Core Color</span>
         <span>Visual Reference Guide v1.0</span>
      </div>
    </div>
  );
}
