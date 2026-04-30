/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  BarChart3, 
  FileText, 
  Trash2, 
  AlertTriangle, 
  Sparkles,
  ChevronRight,
  Info,
  LayoutDashboard,
  ClipboardCheck,
  ArrowLeft,
  X,
  HelpCircle,
  Award,
  Moon,
  Sun,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { BIRKMAN_COMPONENTS, BIRKMAN_COLORS, EXAMPLE_TEAM_DATA } from './constants';
import { TeamRadarChart } from './components/TeamRadarChart';
import { MemberData, TeamData } from './types';
import { callAIService } from './services/aiService';
import { BIRKMAN_QUESTIONS } from './data/questions';

import { useBirkmanStore } from './store/useBirkmanStore';
import { SurveyEngine } from './components/SurveyEngine';
import { BirkmanMap } from './components/BirkmanMap';
import { InDepthReport } from './components/InDepthReport';
import { BirkmanColorGuide } from './components/BirkmanColorGuide';
import { BirkmanOrgOrientation } from './components/BirkmanOrgOrientation';
import { OH_BEOM_SEOK_DATA } from './data/sampleReport';
import { ApiKeyModal } from './components/ApiKeyModal';

export default function App() {
  const { 
    results, 
    removeResult, 
    isSurveyActive, 
    startSurvey, 
    surveyor,
    clearAll,
    aiConfig,
    setAIConfig,
    loadSampleData,
    resumeSurvey,
    resetSurvey,
    answers,
    individualReports,
    setIndividualReport,
    darkMode,
    setDarkMode,
    showApiKeyModal,
    setShowApiKeyModal
  } = useBirkmanStore();

  const [activeTab, setActiveTab] = useState<'members' | 'signature'>('members');
  const [signatureSubTab, setSignatureSubTab] = useState<'report' | 'guide' | 'org'>('report');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [localSurveyorName, setLocalSurveyorName] = useState('');
  const [localSurveyorRole, setLocalSurveyorRole] = useState('');
  
  const [showSettings, setShowSettings] = useState(false);
  const [tempAIKey, setTempAIKey] = useState(aiConfig.apiKey);
  const [tempAIProvider, setTempAIProvider] = useState(aiConfig.provider);
  const [tempAIModel, setTempAIModel] = useState(aiConfig.model);
  const [showHelp, setShowHelp] = useState(false);

  const [selectedDetailedMember, setSelectedDetailedMember] = useState<any>(OH_BEOM_SEOK_DATA);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const team: TeamData = useMemo(() => {
    return results.map(r => ({
      id: String(r.timestamp),
      name: r.name,
      role: r.role,
      scores: r.scores as any,
      primaryColor: r.primaryColor,
      reliabilityScore: r.reliabilityScore
    }));
  }, [results]);

  const handleLoadExample = () => {
    loadSampleData();
    setError(null);
  };

  const handleGenerateMemberReport = async (member: MemberData) => {
    if (!aiConfig.apiKey) {
      setError("AI API 키가 설정되지 않았습니다. 상단 설정을 확인해주세요.");
      setShowSettings(true);
      return;
    }

    if (member.name.includes('오범석')) {
      setSelectedDetailedMember(OH_BEOM_SEOK_DATA);
    } else {
      setSelectedDetailedMember({
        ...member,
        mapCoordinates: {
          interests: { x: 50, y: 50 },
          usual: { x: 50, y: 50 },
          need: { x: 50, y: 50 },
          stress: { x: 50, y: 50 },
        },
        interestScores: OH_BEOM_SEOK_DATA.interestScores
      });
    }
    setActiveTab('signature');

    setIsGenerating(true);
    setError(null);
    try {
      const res = await callAIService(
        aiConfig.provider,
        aiConfig.apiKey,
        aiConfig.model,
        member
      );
      
      if (!res || res.length < 10) {
        throw new Error("AI로부터 충분한 응답을 받지 못했습니다. 다시 시도해 주세요.");
      }
      
      setIndividualReport(member.id, res);
    } catch (err: any) {
      console.error("Report Generation Failed:", err);
      let msg = err.message;
      if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('apikey') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('401')) {
        msg = "API 키가 올바르지 않거나 권한이 없습니다. 설정을 다시 확인해 주세요.";
        setShowApiKeyModal(true);
      }
      setError(`${member.name} 멤버의 리포트 생성 중 오류가 발생했습니다: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReport = async () => {
    if (team.length === 0) {
      setError("분석할 멤버가 없습니다.");
      return;
    }
    handleGenerateMemberReport(team[0]);
  };

  const getGapIssues = (member: MemberData) => {
    return Object.entries(member.scores)
      .filter(([_, score]) => Math.abs(score.usual - score.need) >= 25)
      .map(([id]) => BIRKMAN_COMPONENTS.find(c => c.id === id)?.name);
  };

  if (isSurveyActive) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#0F0E0D] flex flex-col items-center py-12 px-6">
        <SurveyEngine />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#0F0E0D] text-[#1A1714] dark:text-[#E5E3DF] font-sans transition-colors duration-300">
      <ApiKeyModal />
      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="absolute inset-0 bg-[#1A1714]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#1A1714] rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-[#E5E3DF] dark:border-[#2A2724]"
            >
              <div className="p-8 border-b border-[#E5E3DF] dark:border-[#2A2724] flex items-center justify-between bg-[#F8F7F5] dark:bg-[#201D1A]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E85D26] rounded-2xl flex items-center justify-center text-white">
                    <HelpCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight dark:text-white">사용 가이드</h3>
                    <p className="text-xs text-[#9C9590] font-bold uppercase tracking-widest">Birkman Personal Insight Consultant</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="p-2 hover:bg-[#E5E3DF] dark:hover:bg-[#3A3734] rounded-xl transition-all dark:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-10">
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#1A1714] dark:bg-[#E85D26] text-white flex items-center justify-center font-black text-sm">1</span>
                    <h4 className="font-bold text-lg dark:text-white">AI API 설정</h4>
                  </div>
                  <div className="ml-11 text-[#5C5751] dark:text-[#9C9590] space-y-2 leading-relaxed">
                    <p>우측 상단의 <span className="font-bold text-[#E85D26]">API Key Required</span> 버튼을 클릭하여 본인의 API 키를 등록하세요.</p>
                    <ul className="list-disc ml-5 text-sm space-y-1">
                      <li><strong>Gemini:</strong> gemini-2.0-flash 최신 모델 사용</li>
                      <li><strong>OpenAI:</strong> gpt-4o 등 고성능 모델 사용 가능</li>
                      <li><strong>Anthropic:</strong> Claude 3.5 Sonnet 사용 가능</li>
                    </ul>
                    <p className="text-[11px] text-[#9C9590]">※ 입력하신 키는 서버에 저장되지 않고 본인의 브라우저 메모리에만 안전하게 유지됩니다.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#1A1714] dark:bg-[#E85D26] text-white flex items-center justify-center font-black text-sm">2</span>
                    <h4 className="font-bold text-lg dark:text-white">성향 데이터 등록</h4>
                  </div>
                  <div className="ml-11 text-[#5C5751] dark:text-[#9C9590] space-y-3">
                    <div className="p-4 bg-[#F8F7F5] dark:bg-[#2A2724] rounded-2xl border border-[#E5E3DF] dark:border-[#3A3734]">
                      <p className="font-bold text-sm mb-1 dark:text-white">본론: 나의 데이터 입력</p>
                      <p className="text-sm">성함과 역할을 입력하고 <span className="font-bold">정식 진단 시작하기</span>를 통해 자신의 성향을 파악하세요.</p>
                    </div>
                    <div className="p-4 bg-[#F8F7F5] dark:bg-[#2A2724] rounded-2xl border border-[#E5E3DF] dark:border-[#3A3734]">
                      <p className="font-bold text-sm mb-1 dark:text-white">팁: 샘플 데이터 활용</p>
                      <p className="text-sm">즉시 분석 기능을 체험하고 싶다면 <span className="font-bold">샘플 데이터 로드</span> 버튼을 통해 미리 준비된 데이터를 불러올 수 있습니다.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#1A1714] dark:bg-[#E85D26] text-white flex items-center justify-center font-black text-sm">3</span>
                    <h4 className="font-bold text-lg dark:text-white">코칭 분석 리포트</h4>
                  </div>
                  <div className="ml-11 text-[#5C5751] dark:text-[#9C9590] space-y-2 leading-relaxed">
                    <p>등록된 프로필 카드의 <span className="font-bold text-[#1A1714] dark:text-white">AI 성향 분석</span> 버튼을 클릭하세요.</p>
                    <p className="text-sm italic">"AI는 당신의 핵심 강점, 내면의 욕구(Needs), 스트레스 트리거 및 타인과의 효과적인 소통을 위한 개인별 맞춤 팁을 생성합니다."</p>
                  </div>
                </section>
              </div>

              <div className="p-8 bg-[#F8F7F5] dark:bg-[#201D1A] border-t border-[#E5E3DF] dark:border-[#2A2724]">
                <button 
                  onClick={() => setShowHelp(false)}
                  className="w-full py-4 bg-[#1A1714] dark:bg-[#E85D26] text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all"
                >
                  확인했습니다
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1A1714]/80 backdrop-blur-md border-b border-[#E5E3DF] dark:border-[#2A2724] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E85D26] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight tracking-tighter dark:text-white">버크만 분석 (Birkman)</h1>
              <p className="text-[10px] text-[#9C9590] font-black uppercase">Professional Behavioral Insight</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setShowHelp(true)}
              className="p-2 text-[#9C9590] hover:text-[#1A1714] dark:hover:text-white hover:bg-[#F8F7F5] dark:hover:bg-[#1A1714] rounded-xl transition-all"
              title="도움말 보기"
            >
              <HelpCircle size={24} />
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-[#9C9590] hover:text-[#1A1714] dark:hover:text-white hover:bg-[#F8F7F5] dark:hover:bg-[#1A1714] rounded-xl transition-all"
              title={darkMode ? "라이트 모드" : "다크 모드"}
            >
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            <button 
              onClick={() => setShowApiKeyModal(true)}
              className={cn(
                "p-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold",
                aiConfig.apiKey 
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400" 
                  : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 shadow-lg shadow-red-500/10 animate-pulse"
              )}
              title="AI API 설정"
            >
              <Settings size={16} />
              {aiConfig.apiKey ? `${aiConfig.provider.toUpperCase()} Active` : "API Key Required"}
            </button>
            <nav className="hidden md:flex items-center gap-1 bg-[#F8F7F5] dark:bg-[#1A1714] p-1 rounded-xl border border-[#E5E3DF] dark:border-[#2A2724]">
            {(['members', 'signature'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                  activeTab === tab 
                    ? "bg-white dark:bg-[#2A2724] text-[#E85D26] shadow-sm" 
                    : "text-[#9C9590] hover:text-[#5C5751] dark:hover:text-[#E5E3DF]"
                )}
              >
                {tab === 'members' && "나의 성향 (Styles)"}
                {tab === 'signature' && "개인 리포트 (Personal)"}
              </button>
            ))}
            </nav>
          </div>
        </div>
      </header>

      {/* AI Settings Drawer */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-[#1A1714] border-b border-[#E5E3DF] dark:border-[#2A2724] overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#9C9590] uppercase tracking-widest pl-1">AI Provider</label>
                <select 
                  value={tempAIProvider}
                  onChange={(e) => {
                    const p = e.target.value as any;
                    setTempAIProvider(p);
                    setTempAIModel(p === 'gemini' ? 'gemini-2.0-flash' : p === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20240620');
                  }}
                  className="w-full bg-[#F8F7F5] dark:bg-[#2A2724] border border-[#E5E3DF] dark:border-[#3A3734] p-2.5 rounded-xl text-sm font-bold outline-none dark:text-white"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#9C9590] uppercase tracking-widest pl-1">AI Model</label>
                <input 
                  type="text"
                  value={tempAIModel}
                  onChange={(e) => setTempAIModel(e.target.value)}
                  className="w-full bg-[#F8F7F5] dark:bg-[#2A2724] border border-[#E5E3DF] dark:border-[#3A3734] p-2.5 rounded-xl text-sm font-bold outline-none dark:text-white"
                  placeholder="e.g. gpt-4o"
                />
              </div>
              <div className="md:col-span-1 space-y-2">
                <label className="text-[10px] font-black text-[#9C9590] uppercase tracking-widest pl-1">API Key</label>
                <input 
                  type="password"
                  value={tempAIKey}
                  onChange={(e) => setTempAIKey(e.target.value)}
                  className="w-full bg-[#F8F7F5] dark:bg-[#2A2724] border border-[#E5E3DF] dark:border-[#3A3734] p-2.5 rounded-xl text-sm font-bold outline-none dark:text-white"
                  placeholder="Paste your key here"
                />
              </div>
              <button 
                onClick={() => {
                  setAIConfig({ provider: tempAIProvider, apiKey: tempAIKey, model: tempAIModel });
                  setShowSettings(false);
                }}
                className="bg-[#E85D26] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Welcome/Empty State */}
              <section className="bg-white dark:bg-[#1A1714] rounded-3xl p-8 border border-[#E5E3DF] dark:border-[#2A2724] shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E85D26]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50 dark:opacity-20" />
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div className="space-y-4">
                       <h2 className="text-5xl font-black font-sans leading-[1.1] tracking-tight dark:text-white">당신의 행동 성향으로 <br /><span className="text-[#E85D26]">최상의 퍼포먼스</span>를 설계하세요.</h2>
                       <p className="text-[#5C5751] dark:text-[#9C9590] text-lg font-medium leading-relaxed">데이터 기반의 버크만 진단으로 당신만의 고유한 강점을 찾고, <br />압도적인 성과를 위한 인사이트를 도출하세요.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      {surveyor.name && Object.keys(answers).length > 0 ? (
                        <div className="w-full flex flex-col sm:flex-row items-center gap-10 p-10 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-[40px] shadow-xl shadow-orange-500/5 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-200/20 dark:bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] group-hover:bg-orange-200/40 transition-all" />
                          <div className="flex-1 space-y-5 relative z-10">
                            <div>
                              <div className="flex items-center gap-2 text-[#E85D26]">
                                <Sparkles size={18} className="animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Diagnostic Found</span>
                              </div>
                              <div className="mt-4">
                                <h3 className="text-3xl font-black leading-tight text-[#1A1714] dark:text-white tracking-tighter">
                                  <span className="text-[#E85D26]">{surveyor.name}</span>님, <br />
                                  중단된 진단이 있습니다.
                                </h3>
                              </div>
                            </div>
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#2A2724] rounded-full border border-orange-100 dark:border-orange-900/50 shadow-sm">
                                  <FileText size={12} className="text-[#E85D26]" />
                                  <span className="text-[10px] font-black text-[#5C5751] dark:text-[#9C9590] uppercase tracking-tighter">{Object.keys(answers).length} / 250 Complete</span>
                                </div>
                                <span className="text-[10px] font-bold text-[#9C9590]">{Math.round((Object.keys(answers).length / 250) * 100)}% 진행됨</span>
                              </div>
                              <div className="h-1.5 w-full max-w-[200px] bg-orange-200/50 dark:bg-orange-900/30 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(Object.keys(answers).length / 250) * 100}%` }}
                                  className="h-full bg-[#E85D26]" 
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 w-full sm:w-auto relative z-10 shrink-0">
                            <button 
                               onClick={resumeSurvey}
                               className="px-12 py-5 bg-[#E85D26] text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-[#D44D1D] hover:-translate-y-1 transition-all shadow-xl shadow-orange-500/20 active:scale-95"
                            >
                              진단 이어서 하기
                            </button>
                            <button 
                               onClick={() => {
                                 if (confirm("정말 처음부터 다시 시작할까요? 지금까지의 응답 데이터가 삭제됩니다.")) {
                                   resetSurvey();
                                 }
                               }}
                               className="px-6 py-3 text-[#9C9590] rounded-2xl font-bold text-xs hover:text-red-500 transition-all active:scale-95 text-center"
                            >
                              기존 기록 삭제 후 새로 시작
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button 
                             onClick={() => {
                               if (!localSurveyorName) {
                                 setError("진단을 시작하려면 참여자 이름을 먼저 입력해주세요.");
                                 document.getElementById('name-input')?.focus();
                                 return;
                               }
                               startSurvey(localSurveyorName, localSurveyorRole);
                             }}
                             className="px-8 py-4 bg-[#E85D26] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#D44D1D] transition-all shadow-xl shadow-orange-500/20 active:scale-95"
                          >
                            <ClipboardCheck size={20} />
                            정식 진단 시작하기
                          </button>
                          <button 
                            onClick={handleLoadExample}
                            className="px-8 py-4 bg-[#1A1714] dark:bg-[#E85D26] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-black/5"
                          >
                            <Sparkles size={18} />
                            샘플 데이터 로드
                          </button>
                        </>
                      )}
                    </div>

                    {!surveyor.name && (
                      <div className="pt-4 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1">
                            <label className="text-[10px] font-black text-[#9C9590] uppercase tracking-widest mb-1 block">참여자 이름</label>
                            <input 
                              id="name-input"
                              type="text" 
                              placeholder="성함"
                              value={localSurveyorName}
                              onChange={(e) => setLocalSurveyorName(e.target.value)}
                              className="w-full bg-[#F8F7F5] dark:bg-[#2A2724] border border-[#E5E3DF] dark:border-[#3A3734] p-3 rounded-xl outline-none focus:border-[#E85D26] dark:text-white"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-black text-[#9C9590] uppercase tracking-widest mb-1 block">역할</label>
                            <input 
                              type="text" 
                              placeholder="직무/직함"
                              value={localSurveyorRole}
                              onChange={(e) => setLocalSurveyorRole(e.target.value)}
                              className="w-full bg-[#F8F7F5] dark:bg-[#2A2724] border border-[#E5E3DF] dark:border-[#3A3734] p-3 rounded-xl outline-none focus:border-[#E85D26] dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-[#F8F7F5] dark:bg-[#1A1714] rounded-3xl p-10 border border-[#E5E3DF] dark:border-[#2A2724] flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-white dark:bg-[#2A2724] rounded-2xl flex items-center justify-center shadow-sm border border-[#E5E3DF] dark:border-[#3A3734]">
                      <ClipboardCheck size={32} className="text-[#E85D26]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg dark:text-white">아직 진단 전이신가요? (Ready to start?)</h4>
                      <p className="text-sm text-[#9C9590]">성함과 역할을 입력하고 버튼을 눌러 본인의 성향을 즉시 파악해보세요.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Member Grid */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-black flex items-center gap-3 dark:text-white">
                      <LayoutDashboard size={28} className="text-[#E85D26]" />
                      개인 프로필 데이터 (My Profiles)
                    </h3>
                    <span className="bg-[#E85D26]/10 text-[#E85D26] px-3 py-1 rounded-full text-sm font-black border border-orange-200 dark:border-orange-900/50">{team.length}</span>
                  </div>
                  {team.length > 0 && (
                    <button 
                      onClick={() => clearAll()}
                      className="text-sm text-red-500 font-black hover:bg-red-50 dark:hover:bg-red-950/20 px-4 py-2 rounded-xl transition-all"
                    >
                      전체 삭제
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {team.map((member) => {
                    const issues = getGapIssues(member);
                    return (
                      <motion.div 
                        layout
                        key={member.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-[#1A1714] border border-[#E5E3DF] dark:border-[#2A2724] rounded-3xl p-6 shadow-sm group hover:border-[#E85D26]/30 transition-all relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between mb-6 relative z-10">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg",
                              member.primaryColor === 'red' ? "bg-red-500 shadow-red-500/20" :
                              member.primaryColor === 'green' ? "bg-emerald-500 shadow-emerald-500/20" :
                              member.primaryColor === 'yellow' ? "bg-amber-500 shadow-amber-500/20" :
                              member.primaryColor === 'blue' ? "bg-blue-500 shadow-blue-500/20" : "bg-gray-400"
                            )}>
                              {member.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xl tracking-tight truncate dark:text-white">{member.name}</h4>
                              <p className="text-xs font-black text-[#9C9590] uppercase tracking-widest truncate">{member.role || '팀원'}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeResult(Number(member.id))}
                            className="p-2 text-[#D1CEC8] hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>

                        <div className="space-y-3 mb-6 relative z-10">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-[#5C5751] dark:text-[#9C9590] uppercase tracking-widest">평균 평소 행동</span>
                            <span className="text-lg font-black text-[#E85D26]">{(Object.values(member.scores).reduce((a, b) => a + b.usual, 0) / 9).toFixed(0)}</span>
                          </div>
                          <div className="h-2 bg-[#F8F7F5] dark:bg-[#2A2724] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#E85D26] rounded-full" 
                              style={{ width: `${Object.values(member.scores).reduce((a, b) => a + b.usual, 0) / 9}%` }} 
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center mb-6 text-[10px] font-black text-[#9C9590] uppercase tracking-widest">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#E85D26]" />
                            행동 지표: {Object.keys(member.scores).length}
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            욕구 지표: {Object.keys(member.scores).length}
                          </div>
                        </div>

                        {issues.length > 0 && (
                          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 relative z-10">
                            <p className="text-[10px] text-red-500 dark:text-red-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                              <AlertTriangle size={10} /> Stress Warning (Gap ≥ 25)
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {issues.map((issue, idx) => (
                                <span key={issue || idx} className="text-[10px] font-bold bg-white dark:bg-[#1A1714] text-red-600 dark:text-red-400 px-3 py-1 rounded-full border border-red-100 dark:border-red-900/50 shadow-sm">
                                  {issue}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-[#F8F7F5] dark:border-[#2A2724] relative z-10 grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => {
                              if (member.name.includes('오범석')) {
                                setSelectedDetailedMember(OH_BEOM_SEOK_DATA);
                              } else {
                                setSelectedDetailedMember({
                                  ...member,
                                  mapCoordinates: {
                                    interests: { x: 50, y: 50 },
                                    usual: { x: 50, y: 50 },
                                    need: { x: 50, y: 50 },
                                    stress: { x: 50, y: 50 },
                                  },
                                  interestScores: OH_BEOM_SEOK_DATA.interestScores
                                });
                              }
                              setActiveTab('signature');
                            }}
                            className="py-3 bg-[#F8F7F5] dark:bg-[#2A2724] text-[#1A1714] dark:text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-[#E5E3DF] dark:hover:bg-[#3A3734] transition-all active:scale-95 border border-[#E5E3DF] dark:border-[#3A3734]"
                          >
                            <Award size={14} className="text-[#E85D26]" />
                            리포트 (Report)
                          </button>
                          <button 
                            onClick={() => handleGenerateMemberReport(member)}
                            disabled={isGenerating}
                            className="py-3 bg-[#1A1714] dark:bg-[#E85D26] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Sparkles size={14} className="text-orange-400" />
                            AI 분석 (AI)
                          </button>
                        </div>
                        
                        <div className={cn(
                          "absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-10",
                          member.primaryColor === 'red' ? "bg-red-500" :
                          member.primaryColor === 'green' ? "bg-emerald-500" :
                          member.primaryColor === 'yellow' ? "bg-amber-500" :
                          member.primaryColor === 'blue' ? "bg-blue-500" : "bg-gray-400"
                        )} />
                      </motion.div>
                    );
                  })}
                  {team.length === 0 && (
                    <div className="col-span-full py-24 text-center border-4 border-dashed border-[#E5E3DF] dark:border-[#2A2724] rounded-[40px] bg-[#F8F7F5]/50 dark:bg-[#1A1714]/30">
                      <div className="w-20 h-20 bg-white dark:bg-[#2A2724] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#E5E3DF] dark:border-[#3A3734]">
                        <Users size={32} className="text-[#D1CEC8]" />
                      </div>
                      <h4 className="text-xl font-bold mb-2 dark:text-white">분석 데이터가 없습니다.</h4>
                      <p className="text-[#9C9590] max-w-sm mx-auto">상단의 정식 진단을 시작하거나, 샘플 데이터를 로드하여 성향 분석을 체험해보세요.</p>
                    </div>
                  )}
                </div>
              </section>

              {team.length >= 1 && (
                <div className="sticky bottom-8 left-0 right-0 flex justify-center pt-8 z-40">
                  <button 
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="px-12 py-5 bg-[#1A1714] dark:bg-[#E85D26] text-white rounded-[24px] font-black flex items-center gap-4 hover:opacity-90 transition-all shadow-2xl shadow-black/20 active:scale-95 group"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        AI 성향 분석 중...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} className="text-orange-400 group-hover:animate-pulse" />
                        AI 개인 성향 리포트 생성
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'signature' && (
            <motion.div
              key="signature"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black tracking-tight dark:text-white">개인 심층 분석</h3>
                  <p className="text-[#9C9590] font-bold">Personal Detailed Analysis & Reference</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex p-1 bg-[#F8F7F5] dark:bg-[#1A1714] border border-[#E5E3DF] dark:border-[#2A2724] rounded-xl">
                    <button 
                      onClick={() => setSignatureSubTab('report')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                        signatureSubTab === 'report' ? "bg-white dark:bg-[#2A2724] text-[#E85D26] shadow-sm" : "text-[#9C9590]"
                      )}
                    >
                      상세 리포트
                    </button>
                    <button 
                      onClick={() => setSignatureSubTab('org')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                        signatureSubTab === 'org' ? "bg-white dark:bg-[#2A2724] text-[#E85D26] shadow-sm" : "text-[#9C9590]"
                      )}
                    >
                      조직지향점
                    </button>
                    <button 
                      onClick={() => setSignatureSubTab('guide')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                        signatureSubTab === 'guide' ? "bg-white dark:bg-[#2A2724] text-[#E85D26] shadow-sm" : "text-[#9C9590]"
                      )}
                    >
                      컬러 키워드
                    </button>
                  </div>

                  <select 
                    className="bg-white dark:bg-[#1A1714] border border-[#E5E3DF] dark:border-[#2A2724] px-4 py-2 rounded-xl text-sm font-bold outline-none shadow-sm dark:text-white"
                    value={selectedDetailedMember?.id}
                    onChange={(e) => {
                      const member = team.find(m => m.id === e.target.value);
                      if (member) {
                        if (member.name.includes('오범석')) {
                          setSelectedDetailedMember(OH_BEOM_SEOK_DATA);
                        } else {
                          setSelectedDetailedMember({
                            ...member,
                            mapCoordinates: {
                              interests: { x: 50, y: 50 },
                              usual: { x: 50, y: 50 },
                              need: { x: 50, y: 50 },
                              stress: { x: 50, y: 50 },
                            },
                            interestScores: OH_BEOM_SEOK_DATA.interestScores
                          });
                        }
                      }
                    }}
                  >
                    {team.some(m => m.name.includes('오범석')) ? (
                      <option value={team.find(m => m.name.includes('오범석'))?.id}>오범석 (시그니처 샘플)</option>
                    ) : (
                      <option value="">멤버를 선택하세요</option>
                    )}
                    {team.filter(m => !m.name.includes('오범석')).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {signatureSubTab === 'report' ? (
                <InDepthReport 
                  data={selectedDetailedMember} 
                  aiReport={individualReports[selectedDetailedMember.id]}
                  isGenerating={isGenerating}
                  onGenerateAIReport={() => handleGenerateMemberReport(selectedDetailedMember)}
                />
              ) : signatureSubTab === 'org' ? (
                <BirkmanOrgOrientation name={selectedDetailedMember.name} />
              ) : (
                <BirkmanColorGuide />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="fixed bottom-8 right-8 z-[110]">
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-white dark:bg-[#1A1714] border-l-4 border-red-500 p-6 rounded-2xl shadow-2xl flex items-start gap-4 max-w-md border border-[#E5E3DF] dark:border-[#2A2724]"
             >
               <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded-xl text-red-500">
                 <AlertTriangle size={24} />
               </div>
               <div className="flex-1">
                 <h4 className="font-bold text-red-500 mb-1">알림</h4>
                 <p className="text-sm text-[#5C5751] dark:text-[#9C9590] leading-relaxed">{error}</p>
                 <button 
                  onClick={() => setError(null)}
                  className="mt-4 text-xs font-bold text-[#9C9590] hover:text-[#1A1714] dark:hover:text-white transition-colors underline underline-offset-4"
                >
                  닫기
                </button>
               </div>
             </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
