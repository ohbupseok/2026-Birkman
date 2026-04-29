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
  HelpCircle
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

export default function App() {
  const { 
    results, 
    removeResult, 
    isSurveyActive, 
    startSurvey, 
    surveyor,
    clearAll,
    aiConfig,
    setAIConfig
  } = useBirkmanStore();

  const [rawInput, setRawInput] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'analysis' | 'report'>('members');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [localSurveyorName, setLocalSurveyorName] = useState('');
  const [localSurveyorRole, setLocalSurveyorRole] = useState('');
  
  const [showSettings, setShowSettings] = useState(false);
  const [tempAIKey, setTempAIKey] = useState(aiConfig.apiKey);
  const [tempAIProvider, setTempAIProvider] = useState(aiConfig.provider);
  const [tempAIModel, setTempAIModel] = useState(aiConfig.model);
  const [showHelp, setShowHelp] = useState(false);

  const team: TeamData = useMemo(() => {
    return results.map(r => ({
      id: String(r.timestamp),
      name: r.name,
      role: r.role,
      scores: r.scores as any,
      primaryColor: r.primaryColor
    }));
  }, [results]);

  const handleParseInput = () => {
    try {
      const parsed = JSON.parse(rawInput);
      const processMember = (m: any) => ({
        name: m.name,
        role: m.role || '팀원',
        scores: m.scores,
        primaryColor: (['red', 'green', 'yellow', 'blue'].includes(m.primaryColor) ? m.primaryColor : 'blue') as 'red' | 'green' | 'yellow' | 'blue',
        timestamp: Date.now() + Math.random()
      });

      if (Array.isArray(parsed)) {
        const newResults = parsed.map(processMember);
        useBirkmanStore.setState({ results: [...newResults, ...results] });
      } else {
        const newResult = processMember(parsed);
        useBirkmanStore.setState({ results: [newResult, ...results] });
      }
      setRawInput('');
    } catch (e) {
      setError("데이터 형식이 올바르지 않습니다. JSON 형식을 확인해주세요.");
    }
  };

  const handleLoadExample = () => {
    // Example data loading logic could be moved to store if needed
    // For now, assume it's added to the store's results
    // Mapping EXAMPLE_TEAM_DATA back to BirkmanResult
    const mockResults = EXAMPLE_TEAM_DATA.map(m => ({
      name: m.name,
      role: m.role || '',
      scores: m.scores as any,
      primaryColor: m.primaryColor as any,
      timestamp: Date.now() + Math.random()
    }));
    useBirkmanStore.setState({ results: [...mockResults, ...results] });
  };

  const handleGenerateReport = async () => {
    if (team.length < 2) {
      setError("팀 시너지 분석을 위해 최소 2명의 멤버가 필요합니다.");
      return;
    }
    if (!aiConfig.apiKey) {
      setError("AI API 키가 설정되지 않았습니다. 상단 설정을 확인해주세요.");
      setShowSettings(true);
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await callAIService(
        aiConfig.provider,
        aiConfig.apiKey,
        aiConfig.model,
        team
      );
      setReport(res);
      setActiveTab('report');
    } catch (err: any) {
      setError(`리포트 생성 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
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
                    <p className="text-xs text-[#9C9590] font-bold uppercase tracking-widest">Birkman Synergy Consultant</p>
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
                      <li><strong>Gemini:</strong> Google AI Studio에서 무료 키 발급 가능</li>
                      <li><strong>OpenAI:</strong> GPT-4o 등 최신 모델 사용 가능</li>
                      <li><strong>Anthropic:</strong> Claude 3.5 Sonnet 등 사용 가능</li>
                    </ul>
                    <p className="text-[11px] text-[#9C9590]">※ 입력하신 키는 서버에 저장되지 않고 본인의 브라우저 메모리에만 안전하게 유지됩니다.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#1A1714] text-white flex items-center justify-center font-black text-sm">2</span>
                    <h4 className="font-bold text-lg">팀 멤버 추가</h4>
                  </div>
                  <div className="ml-11 text-[#5C5751] space-y-3">
                    <div className="p-4 bg-[#F8F7F5] rounded-2xl border border-[#E5E3DF]">
                      <p className="font-bold text-sm mb-1">방법 A: 정식 진단 시작</p>
                      <p className="text-sm">참여자 성함을 입력하고 <span className="font-bold">정식 진단 시작하기</span>를 누르세요. 250문항의 설문을 통해 정밀한 데이터를 산출합니다.</p>
                    </div>
                    <div className="p-4 bg-[#F8F7F5] rounded-2xl border border-[#E5E3DF]">
                      <p className="font-bold text-sm mb-1">방법 B: 샘플 데이터 로드</p>
                      <p className="text-sm">즉시 팀 분석 기능을 체험하고 싶다면 <span className="font-bold">샘플 데이터 로드</span> 버튼을 클릭하세요.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#1A1714] text-white flex items-center justify-center font-black text-sm">3</span>
                    <h4 className="font-bold text-lg">시너지 분석 및 리포트</h4>
                  </div>
                  <div className="ml-11 text-[#5C5751] space-y-2 leading-relaxed">
                    <p>멤버가 2명 이상 추가되면 화면 하단에 <span className="font-bold text-[#1A1714]">AI 팀 시너지 리포트 생성</span> 버튼이 나타납니다.</p>
                    <p className="text-sm italic">"AI는 팀원 간의 욕구 충돌 지점, 최고의 협업 조합, 리더를 위한 개인별 코칭 팁을 생성합니다."</p>
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
              <h1 className="text-xl font-bold tracking-tight">Birkman <span className="text-[#E85D26]">Synergy</span></h1>
              <p className="text-xs text-[#9C9590] font-medium">Certified Team Analysis Tool</p>
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
            {(['members', 'analysis', 'report'] as const).map((tab) => (
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
                {tab === 'members' && "팀 멤버"}
                {tab === 'analysis' && "시각 분석"}
                {tab === 'report' && "코칭 리포트"}
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
                    setTempAIModel(p === 'gemini' ? 'gemini-1.5-flash' : p === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20240620');
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
                    <div className="space-y-2">
                       <h2 className="text-4xl font-black leading-tight tracking-tighter">Birkman Team <br />Synergy Diagnostic</h2>
                       <p className="text-[#5C5751] text-lg">데이터 직접 입력 또는 전문가 정식 진단을 통해 <br />팀의 역동성을 분석하고 최적의 솔루션을 도출하십시오.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
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
                    </div>

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
                  </div>
                  
                  <div className="bg-[#F8F7F5] rounded-3xl p-8 border border-dashed border-[#D1CEC8]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold flex items-center gap-2">
                        <Plus size={16} className="text-[#E85D26]" />
                        데이터 직접 입력 (JSON)
                      </span>
                      <div title="이름, 역할, 9개 지표 점수 포함">
                        <Info size={16} className="text-[#9C9590] cursor-help" />
                      </div>
                    </div>
                    <textarea 
                      placeholder='{ "name": "이름", "scores": { "SE": {"usual": 60, "need": 40}, ... } }'
                      className="w-full h-40 bg-white rounded-2xl border border-[#D1CEC8] p-4 text-xs font-mono focus:ring-2 focus:ring-[#E85D26]/20 focus:border-[#E85D26] outline-none resize-none"
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                    />
                    <button 
                      onClick={handleParseInput}
                      disabled={!rawInput}
                      className="w-full mt-4 py-3 bg-white border border-[#D1CEC8] rounded-2xl text-sm font-bold hover:bg-[#FDFCFB] transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                    >
                      JSON 데이터로 추가
                    </button>
                    {error && (
                      <p className="mt-3 text-xs text-red-500 font-bold flex items-center gap-1 bg-red-50 p-2 rounded-lg border border-red-100">
                        <AlertTriangle size={12} /> {error}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Member Grid */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                      <Users size={28} className="text-[#E85D26]" />
                      분석 대상 멤버
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
                            <div>
                              <h4 className="font-bold text-xl tracking-tight">{member.name}</h4>
                              <p className="text-xs font-black text-[#9C9590] uppercase tracking-widest">{member.role || '팀원'}</p>
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
                      <h4 className="text-xl font-bold mb-2">팀이 비어 있습니다.</h4>
                      <p className="text-[#9C9590] max-w-sm mx-auto">상단의 정식 진단을 시작하거나, 샘플 데이터를 로드하여 시너지 분석을 체험해보세요.</p>
                    </div>
                  )}
                </div>
              </section>

              {team.length >= 2 && (
                <div className="sticky bottom-8 left-0 right-0 flex justify-center pt-8 z-40">
                  <button 
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="px-12 py-5 bg-[#1A1714] text-white rounded-[24px] font-black flex items-center gap-4 hover:bg-black transition-all shadow-2xl shadow-black/20 active:scale-95 group"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        AI 리포트 분석 중...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} className="text-orange-400 group-hover:animate-pulse" />
                        AI 팀 시너지 리포트 생성
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
                    <h3 className="text-xl font-bold">팀 행동 성향 (Usual)</h3>
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-[#E85D26]/20 border border-[#E85D26]" />
                       <span className="text-[10px] font-black uppercase text-[#9C9590]">Usual Behavior</span>
                    </div>
                  </div>
                  <TeamRadarChart members={team} mode="usual" />
                </section>

                <section className="bg-white rounded-3xl p-8 border border-[#E5E3DF] shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">팀 내면 욕구 (Needs)</h3>
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
                  <h3 className="text-xl font-bold">9대 지표별 팀 분포 분석</h3>
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

          {activeTab === 'report' && (
            <motion.div
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto space-y-8 pb-20"
            >
              {report ? (
                <div className="bg-white rounded-[40px] p-10 md:p-16 border border-[#E5E3DF] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-[#E85D26]" />
                  <div className="absolute top-12 right-12">
                    <button 
                      onClick={() => window.print()}
                      className="p-3 bg-[#F8F7F5] text-[#9C9590] hover:text-[#1A1714] rounded-2xl transition-all border border-[#E5E3DF]"
                      title="PDF로 저장하기"
                    >
                      <FileText size={24} />
                    </button>
                  </div>
                  
                  <div className="mb-12">
                    <div className="flex items-center gap-2 text-[#E85D26] mb-2">
                       <Sparkles size={20} />
                       <span className="text-xs font-black uppercase tracking-widest">AI Certified Analysis</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter">팀 시너지 코칭 리포트</h2>
                    <p className="text-[#9C9590] font-bold mt-2">Birkman Professional Report • {new Date().toLocaleDateString()}</p>
                  </div>

                  <div className="prose prose-orange max-w-none prose-h1:text-3xl prose-h1:font-black prose-h2:text-xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4 prose-p:text-[#5C5751] prose-p:leading-relaxed prose-li:text-[#5C5751] prose-strong:text-[#1A1714] prose-h2:text-[#E85D26] prose-h2:tracking-tight prose-h2:bg-orange-50 prose-h2:inline-block prose-h2:px-4 prose-h2:py-1 prose-h2:rounded-lg">
                    <ReactMarkdown>{report}</ReactMarkdown>
                  </div>
                  
                  <div className="mt-24 pt-10 border-t border-[#E5E3DF] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1A1714] rounded-xl flex items-center justify-center text-white">
                        <LayoutDashboard size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-[#1A1714]">Strategic Excellence</p>
                        <p className="text-[10px] text-[#9C9590] font-medium leading-none">Powered by Birkman Methodology</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-[#D1CEC8] uppercase tracking-[0.2em]">Confidential Certified Document</p>
                  </div>
                </div>
              ) : (
                <div className="py-32 text-center space-y-8 bg-white border border-[#E5E3DF] rounded-[40px]">
                  <div className="w-24 h-24 bg-[#F8F7F5] rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#E5E3DF]">
                    <Sparkles size={48} className="text-[#D1CEC8]" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-black tracking-tighter">분석 리포트가 준비되지 않았습니다.</h3>
                    <p className="text-[#5C5751] max-w-md mx-auto font-medium leading-relaxed">분석할 팀 멤버를 확보한 후 메인 화면 하단의 [AI 팀 시너지 리포트 생성] 버튼을 클릭하십시오.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('members')}
                    className="px-10 py-4 bg-[#1A1714] text-white rounded-2xl font-black hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-2 mx-auto"
                  >
                    멤버 관리로 돌아가기
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
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
              <span className="text-sm font-black tracking-[0.3em] uppercase text-[#1A1714]">Birkman Synergy Consultant</span>
            </div>
            <p className="text-xs text-[#9C9590] max-w-sm font-medium leading-relaxed">본 도구는 정식 Birkman 자격 인증 코치의 분석 로직을 바탕으로 설계되었습니다. 모든 데이터는 팀의 성장을 위한 자료로만 사용하십시오.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-4 text-xs font-black text-[#9C9590] uppercase tracking-widest">
            <a href="#" className="hover:text-[#E85D26] transition-colors">Birkman Method</a>
            <a href="#" className="hover:text-[#E85D26] transition-colors">Synergy Flow</a>
            <a href="#" className="hover:text-[#E85D26] transition-colors">Action Guide</a>
            <a href="#" className="hover:text-[#E85D26] transition-colors">Team Science</a>
            <a href="#" className="hover:text-[#E85D26] transition-colors">Leadership</a>
            <a href="#" className="hover:text-[#E85D26] transition-colors">Privacy</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-16 flex justify-center border-t border-[#F8F7F5] mt-16">
           <p className="text-[10px] font-black text-[#D1CEC8] uppercase tracking-[0.5em]">© 2026 Birkman Synergy Professional System</p>
        </div>
      </footer>
    </div>
  );
}

