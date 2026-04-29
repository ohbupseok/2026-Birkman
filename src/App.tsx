/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  Award
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
import { OH_BEOM_SEOK_DATA } from './data/sampleReport';

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
    addResult,
    individualReports,
    setIndividualReport
  } = useBirkmanStore();

  const [activeTab, setActiveTab] = useState<'members' | 'analysis' | 'report' | 'signature'>('members');
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

  const team: TeamData = useMemo(() => {
    return results.map(r => ({
      id: String(r.timestamp),
      name: r.name,
      role: r.role,
      scores: r.scores as any,
      primaryColor: r.primaryColor
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

    // Set as active detailed member first
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
      setIndividualReport(member.id, res);
    } catch (err: any) {
      setError(`${member.name} 멤버의 리포트 생성 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReport = async () => {
    if (team.length === 0) {
      setError("분석할 멤버가 없습니다.");
      return;
    }
    // 팀 전체 분석 대신 첫 번째 멤버를 기본으로 분석하도록 조정 (토큰 다이어트)
    handleGenerateMemberReport(team[0]);
  };

  const getGapIssues = (member: MemberData) => {
    return Object.entries(member.scores)
      .filter(([_, score]) => Math.abs(score.usual - score.need) >= 25)
      .map(([id]) => BIRKMAN_COMPONENTS.find(c => c.id === id)?.name);
  };

  if (isSurveyActive) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center py-12 px-6">
        <SurveyEngine />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1714] font-sans">
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
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-[#E5E3DF] flex items-center justify-between bg-[#F8F7F5]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E85D26] rounded-2xl flex items-center justify-center text-white">
                    <HelpCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">사용 가이드</h3>
                    <p className="text-xs text-[#9C9590] font-bold uppercase tracking-widest">Birkman Personal Insight Consultant</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="p-2 hover:bg-[#E5E3DF] rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-10">
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#1A1714] text-white flex items-center justify-center font-black text-sm">1</span>
                    <h4 className="font-bold text-lg">AI API 설정</h4>
                  </div>
                  <div className="ml-11 text-[#5C5751] space-y-2 leading-relaxed">
                    <p>우측 상단의 <span className="font-bold text-[#E85D26]">API Key Required</span> 버튼을 클릭하여 본인의 API 키를 등록하세요.</p>
                    <ul className="list-disc ml-5 text-sm space-y-1">
                      <li><strong>Gemini:</strong> gemini-2.5-flash 최신 모델 사용</li>
                      <li><strong>OpenAI:</strong> gpt-4o 등 고성능 모델 사용 가능</li>
                      <li><strong>Anthropic:</strong> Claude 3.5 Sonnet 사용 가능</li>
                    </ul>
                    <p className="text-[11px] text-[#9C9590]">※ 입력하신 키는 서버에 저장되지 않고 본인의 브라우저 메모리에만 안전하게 유지됩니다.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#1A1714] text-white flex items-center justify-center font-black text-sm">2</span>
                    <h4 className="font-bold text-lg">성향 데이터 등록</h4>
                  </div>
                  <div className="ml-11 text-[#5C5751] space-y-3">
                    <div className="p-4 bg-[#F8F7F5] rounded-2xl border border-[#E5E3DF]">
                      <p className="font-bold text-sm mb-1">본론: 나의 데이터 입력</p>
                      <p className="text-sm">성함과 역할을 입력하고 <span className="font-bold">정식 진단 시작하기</span>를 통해 자신의 성향을 파악하세요.</p>
                    </div>
                    <div className="p-4 bg-[#F8F7F5] rounded-2xl border border-[#E5E3DF]">
                      <p className="font-bold text-sm mb-1">팁: 샘플 데이터 활용</p>
                      <p className="text-sm">즉시 분석 기능을 체험하고 싶다면 <span className="font-bold">샘플 데이터 로드</span> 버튼을 통해 미리 준비된 데이터를 불러올 수 있습니다.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#1A1714] text-white flex items-center justify-center font-black text-sm">3</span>
                    <h4 className="font-bold text-lg">코칭 분석 리포트</h4>
                  </div>
                  <div className="ml-11 text-[#5C5751] space-y-2 leading-relaxed">
                    <p>등록된 프로필 카드의 <span className="font-bold text-[#1A1714]">개별 코칭 리포트 생성</span> 버튼을 클릭하세요.</p>
                    <p className="text-sm italic">"AI는 당신의 핵심 강점, 내면의 욕구(Needs), 스트레스 트리거 및 타인과의 효과적인 소통을 위한 개인별 맞춤 팁을 생성합니다."</p>
                  </div>
                </section>
              </div>

              <div className="p-8 bg-[#F8F7F5] border-t border-[#E5E3DF]">
                <button 
                  onClick={() => setShowHelp(false)}
                  className="w-full py-4 bg-[#1A1714] text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all"
                >
                  확인했습니다
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E3DF] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E85D26] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Birkman <span className="text-[#E85D26]">Personal</span></h1>
              <p className="text-xs text-[#9C9590] font-medium">Individual Behavioral Insight Tool</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setShowHelp(true)}
              className="p-2 text-[#9C9590] hover:text-[#1A1714] hover:bg-[#F8F7F5] rounded-xl transition-all"
              title="도움말 보기"
            >
              <HelpCircle size={24} />
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold",
                aiConfig.apiKey ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
              )}
            >
              <Info size={16} />
              {aiConfig.apiKey ? `${aiConfig.provider.toUpperCase()} Active` : "API Key Required"}
            </button>
            <nav className="hidden md:flex items-center gap-1 bg-[#F8F7F5] p-1 rounded-xl border border-[#E5E3DF]">
            {(['members', 'analysis', 'signature'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                  activeTab === tab 
                    ? "bg-white text-[#E85D26] shadow-sm" 
                    : "text-[#9C9590] hover:text-[#5C5751]"
                )}
              >
                {tab === 'members' && "행동 성향"}
                {tab === 'analysis' && "그룹 분석"}
                {tab === 'signature' && "심층 리포트"}
              </button>
            ))}
            </nav>
          </div>
        </div>
      </header>

      {/* AI Settings Drawer/Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b border-[#E5E3DF] overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#9C9590] uppercase tracking-widest">AI Provider</label>
                <select 
                  value={tempAIProvider}
                  onChange={(e) => {
                    const p = e.target.value as any;
                    setTempAIProvider(p);
                    setTempAIModel(p === 'gemini' ? 'gemini-2.5-flash' : p === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20240620');
                  }}
                  className="w-full bg-[#F8F7F5] border border-[#E5E3DF] p-2.5 rounded-xl text-sm font-bold outline-none"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#9C9590] uppercase tracking-widest">Model</label>
                <input 
                  type="text"
                  value={tempAIModel}
                  onChange={(e) => setTempAIModel(e.target.value)}
                  className="w-full bg-[#F8F7F5] border border-[#E5E3DF] p-2.5 rounded-xl text-sm font-bold outline-none"
                  placeholder="e.g. gpt-4o"
                />
              </div>
              <div className="md:col-span-1 space-y-2">
                <label className="text-[10px] font-black text-[#9C9590] uppercase tracking-widest">API Key</label>
                <input 
                  type="password"
                  value={tempAIKey}
                  onChange={(e) => setTempAIKey(e.target.value)}
                  className="w-full bg-[#F8F7F5] border border-[#E5E3DF] p-2.5 rounded-xl text-sm font-bold outline-none"
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
              <section className="bg-white rounded-3xl p-8 border border-[#E5E3DF] shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E85D26]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div className="space-y-4">
                       <h2 className="text-5xl font-black font-sans leading-[1.1] tracking-tight">당신의 행동 성향으로 <br /><span className="text-[#E85D26]">최상의 퍼포먼스</span>를 설계하세요.</h2>
                       <p className="text-[#5C5751] text-lg font-medium leading-relaxed">데이터 기반의 버크만 진단으로 당신만의 고유한 강점을 찾고, <br />압도적인 성과를 위한 인사이트를 도출하세요.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      {surveyor.name && Object.keys(answers).length > 0 ? (
                        <div className="w-full flex flex-col sm:flex-row items-center gap-10 p-10 bg-orange-50 border border-orange-200 rounded-[40px] shadow-xl shadow-orange-500/5 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] group-hover:bg-orange-200/40 transition-all" />
                          <div className="flex-1 space-y-5 relative z-10">
                            <div>
                              <div className="flex items-center gap-2 text-[#E85D26]">
                                <Sparkles size={18} className="animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Diagnostic Found</span>
                              </div>
                              <div className="mt-4">
                                <h3 className="text-3xl font-black leading-tight text-[#1A1714] tracking-tighter">
                                  <span className="text-[#E85D26]">{surveyor.name}</span>님, <br />
                                  중단된 진단이 있습니다.
                                </h3>
                              </div>
                            </div>
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-orange-100 shadow-sm">
                                  <FileText size={12} className="text-[#E85D26]" />
                                  <span className="text-[10px] font-black text-[#5C5751] uppercase tracking-tighter">{Object.keys(answers).length} / 250 Complete</span>
                                </div>
                                <span className="text-[10px] font-bold text-[#9C9590]">{Math.round((Object.keys(answers).length / 250) * 100)}% 진행됨</span>
                              </div>
                              <div className="h-1.5 w-full max-w-[200px] bg-orange-200/50 rounded-full overflow-hidden">
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
                            className="px-8 py-4 bg-[#1A1714] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#33302C] transition-all shadow-lg shadow-black/5"
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
                              className="w-full bg-[#F8F7F5] border border-[#E5E3DF] p-3 rounded-xl outline-none focus:border-[#E85D26]"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-black text-[#9C9590] uppercase tracking-widest mb-1 block">역할</label>
                            <input 
                              type="text" 
                              placeholder="직무/직함"
                              value={localSurveyorRole}
                              onChange={(e) => setLocalSurveyorRole(e.target.value)}
                              className="w-full bg-[#F8F7F5] border border-[#E5E3DF] p-3 rounded-xl outline-none focus:border-[#E85D26]"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-[#F8F7F5] rounded-3xl p-10 border border-[#E5E3DF] flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#E5E3DF]">
                      <ClipboardCheck size={32} className="text-[#E85D26]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">아직 진단 전이신가요?</h4>
                      <p className="text-sm text-[#9C9590]">성함과 역할을 입력하고 버튼을 눌러 본인의 성향을 즉시 파악해보세요.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Member Grid */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2lx font-black flex items-center gap-3">
                      <Users size={28} className="text-[#E85D26]" />
                      나의 프로필 데이터
                    </h3>
                    <span className="bg-[#E85D26] text-white px-3 py-1 rounded-full text-sm font-black">{team.length}</span>
                  </div>
                  {team.length > 0 && (
                    <button 
                      onClick={() => clearAll()}
                      className="text-sm text-red-500 font-black hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
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
                        className="bg-white border border-[#E5E3DF] rounded-3xl p-6 shadow-sm group hover:border-[#E85D26]/30 transition-all relative overflow-hidden"
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
                              <h4 className="font-bold text-xl tracking-tight truncate">{member.name}</h4>
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
                            <span className="text-xs font-black text-[#5C5751] uppercase tracking-widest">평균 평소 행동</span>
                            <span className="text-lg font-black text-[#E85D26]">{(Object.values(member.scores).reduce((a, b) => a + b.usual, 0) / 9).toFixed(0)}</span>
                          </div>
                          <div className="h-2 bg-[#F8F7F5] rounded-full overflow-hidden">
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
                          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 relative z-10">
                            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                              <AlertTriangle size={10} /> Stress Warning (Gap ≥ 25)
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {issues.map((issue, idx) => (
                                <span key={idx} className="text-[10px] font-bold bg-white text-red-600 px-3 py-1 rounded-full border border-red-100 shadow-sm">
                                  {issue}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-[#F8F7F5] relative z-10 grid grid-cols-2 gap-3">
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
                            className="py-3 bg-[#F8F7F5] text-[#1A1714] rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-[#E5E3DF] transition-all active:scale-95 border border-[#E5E3DF]"
                          >
                            <Award size={14} className="text-[#E85D26]" />
                            심층 분석 리포트
                          </button>
                          <button 
                            onClick={() => handleGenerateMemberReport(member)}
                            disabled={isGenerating}
                            className="py-3 bg-[#1A1714] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Sparkles size={14} className="text-orange-400" />
                            AI 코칭 리포트
                          </button>
                        </div>
                        
                        {/* Background subtle color hint */}
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
                    <div className="col-span-full py-24 text-center border-4 border-dashed border-[#E5E3DF] rounded-[40px] bg-[#F8F7F5]/50">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#E5E3DF]">
                        <Users size={32} className="text-[#D1CEC8]" />
                      </div>
                      <h4 className="text-xl font-bold mb-2">분석 데이터가 없습니다.</h4>
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
                    className="px-12 py-5 bg-[#1A1714] text-white rounded-[24px] font-black flex items-center gap-4 hover:bg-black transition-all shadow-2xl shadow-black/20 active:scale-95 group"
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

          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white rounded-3xl p-8 border border-[#E5E3DF] shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">개인 행동 성향 (Usual)</h3>
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-[#E85D26]/20 border border-[#E85D26]" />
                       <span className="text-[10px] font-black uppercase text-[#9C9590]">Usual Behavior</span>
                    </div>
                  </div>
                  <TeamRadarChart members={team} mode="usual" />
                </section>

                <section className="bg-white rounded-3xl p-8 border border-[#E5E3DF] shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">개인 내면 욕구 (Needs)</h3>
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500" />
                       <span className="text-[10px] font-black uppercase text-[#9C9590]">Internal Needs</span>
                    </div>
                  </div>
                  <TeamRadarChart members={team} mode="need" />
                </section>
              </div>

              <section className="bg-white rounded-3xl p-8 border border-[#E5E3DF] shadow-sm">
                <div className="flex items-center gap-2 mb-8">
                  <BarChart3 className="text-[#E85D26]" size={24} />
                  <h3 className="text-xl font-bold">9대 지표별 성향 분포 분석</h3>
                </div>
                <div className="space-y-10">
                  {BIRKMAN_COMPONENTS.map(comp => (
                    <div key={comp.id} className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <span className="text-sm font-bold text-[#1A1714]">{comp.name}</span>
                          <p className="text-[10px] text-[#9C9590] max-w-sm leading-tight">{comp.description}</p>
                        </div>
                        <div className="flex gap-1.5 flex-wrap justify-end">
                          {team.map(m => (
                            <div 
                              key={m.id} 
                              className="text-[9px] font-black px-2 py-1 rounded-lg bg-[#F8F7F5] border border-[#E5E3DF] transition-all hover:border-[#E85D26]/40"
                              title={`${m.name}: ${m.scores[comp.id].usual}`}
                            >
                              <span className="opacity-50">{m.name.slice(0, 2)}</span> {m.scores[comp.id].usual}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="relative h-6 bg-[#F8F7F5] rounded-xl overflow-hidden">
                        {team.map((m, i) => (
                          <motion.div 
                            key={m.id}
                            initial={{ left: 0 }}
                            animate={{ left: `${m.scores[comp.id].usual}%` }}
                            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-lg border-2 border-white shadow-md z-10 hover:z-20 transition-all flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
                            style={{ 
                              backgroundColor: Object.values(BIRKMAN_COLORS)[i % 4].hex,
                              marginLeft: '-10px'
                            }}
                          >
                            {m.name.charAt(0)}
                          </motion.div>
                        ))}
                        <div className="absolute inset-0 flex justify-between px-4 text-[8px] font-black text-[#D1CEC8] leading-6 pointer-events-none uppercase tracking-widest">
                          <span>Low (0)</span>
                          <span className="border-l border-dashed border-[#D1CEC8] h-full" />
                          <span>Average (50)</span>
                          <span className="border-l border-dashed border-[#D1CEC8] h-full" />
                          <span>High (100)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
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
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black tracking-tight">버크만 시그니처 리포트</h3>
                  <p className="text-[#9C9590] font-bold">Birkman Signature Deep Analysis</p>
                </div>
                <div className="flex gap-2">
                  <select 
                    className="bg-white border border-[#E5E3DF] px-4 py-2 rounded-xl text-sm font-bold outline-none shadow-sm"
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

              <InDepthReport 
                data={selectedDetailedMember} 
                aiReport={individualReports[selectedDetailedMember.id]}
                isGenerating={isGenerating}
                onGenerateAIReport={() => handleGenerateMemberReport(selectedDetailedMember)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="py-16 px-6 border-t border-[#E5E3DF] bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 opacity-80 grayscale hover:grayscale-0 transition-all cursor-default">
              <LayoutDashboard size={24} className="text-[#E85D26]" />
              <span className="text-sm font-black tracking-[0.3em] uppercase text-[#1A1714]">Birkman Personal Insight Distributor</span>
            </div>
            <p className="text-xs text-[#9C9590] max-w-sm font-medium leading-relaxed">본 도구는 정식 Birkman 자격 인증 코치의 분석 로직을 바탕으로 설계되었습니다. 모든 데이터는 개인의 성찰과 성장을 위한 자료로만 사용하십시오.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-4 text-xs font-black text-[#9C9590] uppercase tracking-widest">
            <a href="#" className="hover:text-[#E85D26] transition-colors">Birkman Method</a>
            <a href="#" className="hover:text-[#E85D26] transition-colors">Personal Flow</a>
            <a href="#" className="hover:text-[#E85D26] transition-colors">Action Guide</a>
            <a href="#" className="hover:text-[#E85D26] transition-colors">Behavioral Science</a>
            <a href="#" className="hover:text-[#E85D26] transition-colors">Leadership</a>
            <a href="#" className="hover:text-[#E85D26] transition-colors">Privacy</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-16 flex justify-center border-t border-[#F8F7F5] mt-16">
           <p className="text-[10px] font-black text-[#D1CEC8] uppercase tracking-[0.5em]">© 2026 Birkman Personal Professional System</p>
        </div>
      </footer>
    </div>
  );
}

