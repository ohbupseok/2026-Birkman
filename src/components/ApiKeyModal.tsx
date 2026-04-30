/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Sparkles, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { useBirkmanStore } from '../store/useBirkmanStore';
import { cn } from '../lib/utils';

export function ApiKeyModal() {
  const { aiConfig, setAIConfig, showApiKeyModal, setShowApiKeyModal } = useBirkmanStore();
  const [key, setKey] = useState(aiConfig.apiKey || '');
  const [error, setError] = useState(false);

  // Auto-show if no key exists
  const isVisible = showApiKeyModal || !aiConfig.apiKey;

  const handleSave = () => {
    if (!key || key.length < 20) {
      setError(true);
      return;
    }
    
    setAIConfig({
      ...aiConfig,
      apiKey: key,
      provider: 'gemini',
      model: 'gemini-2.0-flash'
    });
    setShowApiKeyModal(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-[#0F0E0D]/80 backdrop-blur-md"
        onClick={() => aiConfig.apiKey && setShowApiKeyModal(false)}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#1A1714] rounded-[32px] overflow-hidden shadow-2xl border border-[#E5E3DF] dark:border-[#2A2724]"
      >
        {aiConfig.apiKey && (
          <button 
            onClick={() => setShowApiKeyModal(false)}
            className="absolute right-6 top-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#9C9590] transition-colors"
          >
            <ChevronRight className="rotate-90" size={20} />
          </button>
        )}
        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#E85D26]/10 rounded-2xl flex items-center justify-center text-[#E85D26]">
                <Key size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight dark:text-white">API Key Required</h2>
                <p className="text-xs font-black text-[#9C9590] uppercase tracking-widest">Setup your analysis engine</p>
              </div>
            </div>
            
            <div className="p-4 bg-[#F8F7F5] dark:bg-[#201D1A] rounded-2xl border border-[#E5E3DF] dark:border-[#2A2724] space-y-3">
              <div className="flex gap-3">
                <Info size={16} className="text-[#E85D26] shrink-0 mt-0.5" />
                <p className="text-sm text-[#5C5751] dark:text-[#9C9590] leading-relaxed">
                  이 앱은 개인 <span className="font-bold text-[#1A1714] dark:text-white">Gemini API 키</span>가 필요합니다. 
                  모든 데이터는 당신의 브라우저에만 안전하게 보관됩니다.
                </p>
              </div>
              <div className="flex gap-3">
                <Sparkles size={16} className="text-[#E85D26] shrink-0 mt-0.5" />
                <p className="text-sm text-[#5C5751] dark:text-[#9C9590] leading-relaxed">
                  키를 설정하면 AI가 당신의 버크만 데이터를 분석하여 전문적인 코칭 리포트를 생성할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#9C9590] uppercase tracking-[0.2em] ml-1">Gemini API Key</label>
              <div className="relative">
                <input 
                  type="password"
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value);
                    setError(false);
                  }}
                  placeholder="AI Studio에서 키를 복사해 붙여넣으세요"
                  className={cn(
                    "w-full bg-[#F8F7F5] dark:bg-[#2A2724] border p-4 rounded-2xl text-sm font-bold outline-none transition-all dark:text-white",
                    error ? "border-red-500 ring-4 ring-red-500/10" : "border-[#E5E3DF] dark:border-[#3A3734] focus:border-[#E85D26]"
                  )}
                />
                {error && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                    <AlertCircle size={20} />
                  </div>
                )}
              </div>
              {error && (
                <p className="text-[10px] font-bold text-red-500 ml-1">
                  API 키를 확인해 주세요. 최소 20자 이상의 유효한 키여야 합니다.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button 
                onClick={handleSave}
                className="w-full py-4 bg-[#1A1714] dark:bg-[#E85D26] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-xl shadow-orange-500/10 active:scale-95"
              >
                저장하고 시작하기
                <ChevronRight size={16} />
              </button>
              <p className="text-center text-[10px] font-bold text-[#9C9590] uppercase tracking-tighter">
                ※ 설정에서 언제든 변경 가능합니다
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F8F7F5] dark:border-[#2A2724] flex items-center justify-center gap-4">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-black text-[#E85D26] uppercase tracking-widest hover:underline"
            >
              Get Gemini API Key Here
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
