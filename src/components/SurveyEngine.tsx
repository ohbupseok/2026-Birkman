/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardCheck, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { BIRKMAN_QUESTIONS } from '../data/questions';
import { useBirkmanStore } from '../store/useBirkmanStore';
import { analyzeBirkman } from '../lib/analyzer';

export const SurveyEngine: React.FC = () => {
  const { 
    currentStep, 
    answers, 
    setAnswer, 
    nextStep, 
    prevStep, 
    surveyor, 
    finishSurvey,
    pauseSurvey,
    responseTimes
  } = useBirkmanStore();

  const [questionStartTime, setQuestionStartTime] = React.useState<number>(Date.now());

  React.useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentStep]);

  const currentQ = BIRKMAN_QUESTIONS[currentStep];
  const progress = Math.round(((currentStep + 1) / 250) * 100);
  const isNeeds = currentStep >= 125;
  const isLast = currentStep === 249;

  const handleFinish = () => {
    const result = analyzeBirkman(surveyor.name, surveyor.role, answers, responseTimes);
    finishSurvey(result);
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-[40px] border border-[#E5E3DF] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#1A1714] text-white p-8 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={20} className="text-[#E85D26]" />
            <span className="font-black text-sm uppercase tracking-widest">Birkman Engine V4.0</span>
          </div>
          <p className="text-[10px] text-[#9C9590] font-bold">참여자: {surveyor.name || '미지정'} ({surveyor.role || '팀원'})</p>
        </div>
        <button 
          onClick={() => {
            if (confirm("진단을 잠시 중단하시겠습니까? 지금까지의 답변은 안전하게 저장되며, 나중에 언제든지 이어서 진행할 수 있습니다.")) {
              pauseSurvey();
            }
          }}
          className="text-[10px] font-black uppercase text-orange-400 hover:text-white border border-orange-500/50 px-5 py-2 rounded-2xl transition-all bg-orange-500/10 backdrop-blur-sm"
        >
          진단 일시중지 (자동 저장)
        </button>
      </div>

      <div className="p-8 md:p-12 space-y-10">
        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-[#9C9590] uppercase tracking-[0.2em]">Question {currentStep + 1} of 250</span>
            <span className="text-sm font-black text-[#E85D26]">{progress}%</span>
          </div>
          <div className="h-2 bg-[#F8F7F5] rounded-full overflow-hidden border border-[#E5E3DF]/30">
            <motion.div 
              className="h-full bg-[#E85D26]" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        {/* Question Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[160px] flex flex-col justify-center text-center space-y-6"
          >
            <div className="flex justify-center">
              <span className={cn(
                "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
                isNeeds ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-orange-50 text-[#E85D26] border border-orange-100"
              )}>
                {isNeeds ? "Internal Needs (내면의 욕구)" : "Usual Behavior (평소 행동)"}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1A1714] leading-[1.3] tracking-tighter">
              {currentQ[2]}
            </h2>
          </motion.div>
        </AnimatePresence>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3, 4, 5].map((val) => {
            const labels = ["전혀 아니다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"];
            const isSelected = answers[currentStep] === val;
            
            return (
              <button
                key={val}
                onClick={() => {
                  const now = Date.now();
                  const elapsed = now - questionStartTime;
                  setAnswer(currentStep, val, elapsed);
                  if (!isLast) setTimeout(nextStep, 150);
                }}
                className={cn(
                  "w-full group p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between",
                  isSelected 
                    ? "border-[#E85D26] bg-[#FFF8F5] shadow-lg shadow-orange-500/5 translate-x-2" 
                    : "border-[#F0EFED] hover:border-[#E85D26]/30 hover:bg-[#FDFCFB]"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all",
                    isSelected ? "bg-[#E85D26] text-white" : "bg-[#F8F7F5] text-[#9C9590] group-hover:bg-[#E85D26]/10 group-hover:text-[#E85D26]"
                  )}>
                    {val}
                  </div>
                  <span className={cn(
                    "font-bold transition-all",
                    isSelected ? "text-[#E85D26] italic" : "text-[#5C5751] group-hover:text-[#1A1714]"
                  )}>
                    {labels[val-1]}
                  </span>
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  isSelected ? "bg-[#E85D26] scale-150" : "bg-transparent"
                )} />
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-[#F0EFED]">
          <button 
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#9C9590] hover:text-[#1A1714] disabled:opacity-30 transition-all"
          >
            <ArrowLeft size={16} /> 이전 문항
          </button>

          {isLast && answers[currentStep] ? (
            <button 
              onClick={handleFinish}
              className="px-8 py-3 bg-[#E85D26] text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Save size={16} /> 진단 완료 및 결과 저장
            </button>
          ) : (
            <div className="text-[10px] font-black text-[#D1CEC8] uppercase tracking-[0.3em]">
              {249 - currentStep} remaining
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
