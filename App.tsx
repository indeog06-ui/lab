import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Waves,
  Factory,
  Filter,
  Sun,
  Zap,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle2,
  Droplet,
  BookOpen,
  Award,
  Trash2,
  Flame,
  Activity,
  Database,
  ShieldAlert,
  Gauge,
  Timer,
  Check,
  X
} from 'lucide-react';
import { SCENARIOS, FILTERS, SAFETY_RULES, getSimulationResult } from './data';
import { Scenario, FilterOption, SimulationResult, ExperimentLog, TabState, SimulationState, ScenarioId, FilterId } from './types';

export default function App() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<TabState>('lab');

  // Lab Navigation State
  const [step, setStep] = useState<SimulationState>('select_scenario');

  // Interactive Variables
  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioId>('A');
  const [selectedFilterId, setSelectedFilterId] = useState<FilterId>('activated_carbon');
  const [uvEnabled, setUvEnabled] = useState<boolean>(true);

  // Simulation Running State
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 2x speed modifiers

  // Experiment Logging
  const [logs, setLogs] = useState<ExperimentLog[]>(() => {
    const saved = localStorage.getItem('water_lab_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Current Active Result Cache (loaded for rendering or viewing past runs)
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null);

  // Active scenario and filter convenience pointers
  const activeScenario = SCENARIOS.find(s => s.id === selectedScenarioId) || SCENARIOS[0];
  const activeFilter = FILTERS.find(f => f.id === selectedFilterId) || FILTERS[0];

  // Ref for simulation interval
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync logs to localStorage
  useEffect(() => {
    localStorage.setItem('water_lab_logs', JSON.stringify(logs));
  }, [logs]);

  // Handle Simulation Core
  useEffect(() => {
    if (step === 'simulating' && !isPaused) {
      simIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const next = prev + 2 * simSpeed;
          if (next >= 100) {
            // Simulation successfully completed
            if (simIntervalRef.current) clearInterval(simIntervalRef.current);
            completeSimulation();
            return 100;
          }
          return next;
        });
      }, 50);
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [step, isPaused, simSpeed, selectedScenarioId, selectedFilterId, uvEnabled]);

  // Complete Simulation & generate results
  const completeSimulation = () => {
    const result = getSimulationResult(selectedScenarioId, selectedFilterId, uvEnabled);
    setCurrentResult(result);
    setStep('result_report');

    // Add to history logs
    const newLog: ExperimentLog = {
      id: `exp-${Date.now()}`,
      timestamp: new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      scenarioId: selectedScenarioId,
      scenarioTitle: activeScenario.title,
      filterId: selectedFilterId,
      filterTitle: activeFilter.title,
      efficiency: result.efficiency,
      pollutionRemaining: result.pollutionRemaining,
      heavyMetalRemoval: result.heavyMetalRemoval,
      organicBreakdown: result.organicBreakdown,
      statusBadge: result.statusBadge,
      statusText: result.statusText
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Trigger starting the simulation
  const startSimulation = () => {
    setProgress(0);
    setIsPaused(false);
    setStep('simulating');
  };

  // Reset/Restart Lab
  const restartLab = () => {
    setStep('select_scenario');
    setProgress(0);
    setIsPaused(false);
    setCurrentResult(null);
  };

  // Load a past simulation report to view details in lab
  const viewPastLog = (log: ExperimentLog) => {
    setSelectedScenarioId(log.scenarioId);
    setSelectedFilterId(log.filterId);
    // Best effort uv state recover
    if (log.filterId === 'tio2_photocatalyst') {
      // If efficiency is high, UV was enabled
      setUvEnabled(log.efficiency > 30);
    }
    
    const result = getSimulationResult(log.scenarioId, log.filterId, log.efficiency > 30);
    setCurrentResult(result);
    setStep('result_report');
    setActiveTab('lab');
  };

  // Delete single log entry
  const deleteLog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLogs(prev => prev.filter(log => log.id !== id));
  };

  // Clear all logs
  const clearAllLogs = () => {
    if (window.confirm('모든 실험 기록 데이터를 삭제하시겠습니까?')) {
      setLogs([]);
    }
  };

  // Dynamic pollution level during active simulation
  const currentPollution = Math.max(
    currentResult ? currentResult.pollutionRemaining : 0,
    Math.round(100 - (progress / 100) * (currentResult ? currentResult.efficiency : getSimulationResult(selectedScenarioId, selectedFilterId, uvEnabled).efficiency))
  );

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#191c1e] flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* HEADERBAR */}
      <header className="fixed top-0 left-0 w-full z-50 h-16 bg-white border-b border-[#e2e8f0] px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {step !== 'select_scenario' && activeTab === 'lab' ? (
            <button
              onClick={() => {
                if (step === 'result_report') setStep('select_filter');
                else if (step === 'simulating') {
                  if (window.confirm('실험 시뮬레이션을 중단하고 이전 단계로 돌아가시겠습니까?')) {
                    setStep('select_filter');
                  }
                } else if (step === 'select_filter') setStep('select_scenario');
              }}
              className="p-2 hover:bg-slate-100 rounded-full transition-transform active:scale-95 duration-100 cursor-pointer"
              title="이전 단계로"
            >
              <ArrowLeft className="w-5 h-5 text-[#001e40]" />
            </button>
          ) : null}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#005cba] rounded-full animate-pulse hidden md:block"></span>
            <h1 className="font-sans text-lg md:text-xl font-bold tracking-tight text-[#001e40]">
              수질 오염 정화 가상 실험실
            </h1>
          </div>
        </div>

        {/* NAVIGATION TABS FOR DESKTOP */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-lg font-sans text-sm font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === 'lab'
                ? 'bg-[#e5effa] text-[#005cba]'
                : 'text-[#43474f] hover:bg-slate-100'
            }`}
          >
            실험실 (Lab)
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 py-2 rounded-lg font-sans text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
              activeTab === 'data'
                ? 'bg-[#e5effa] text-[#005cba]'
                : 'text-[#43474f] hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            실험 데이터 ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-4 py-2 rounded-lg font-sans text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
              activeTab === 'safety'
                ? 'bg-[#e5effa] text-[#005cba]'
                : 'text-[#43474f] hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            실험실 안전수칙
          </button>
        </nav>

        {/* STEP / STATUS BADGE (Desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          {activeTab === 'lab' && (
            <div className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200">
              {step === 'select_scenario' && 'STEP 01: 오염 시료 선택'}
              {step === 'select_filter' && 'STEP 02: 정화 기술 커스텀'}
              {step === 'simulating' && 'STEP 03: 가상 가압 정화 중...'}
              {step === 'result_report' && 'STEP 04: 연산 결과 분석 리포트'}
            </div>
          )}
        </div>
      </header>

      {/* MAIN CANVAS */}
      <main className="flex-grow pt-24 pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col justify-start">
        
        {/* TAB 1: ACTIVE LAB SIMULATION */}
        {activeTab === 'lab' && (
          <div className="w-full flex-grow flex flex-col">
            
            {/* STEP 1: SCENARIO SELECTION */}
            {step === 'select_scenario' && (
              <div className="flex-grow flex flex-col justify-center max-w-5xl mx-auto w-full py-4">
                
                {/* Greeting Hero */}
                <div className="text-center mb-10">
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#5095fe]/10 text-[#005cba] mb-4 text-xs font-mono font-medium border border-[#5095fe]/20">
                    <Activity className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                    시뮬레이션 모드 선택
                  </div>
                  <h2 className="text-3xl md:text-4xl font-sans font-bold text-[#001e40] tracking-tight mb-3">
                    어떤 오염원을 정화해 볼까요?
                  </h2>
                  <p className="text-base text-[#43474f] max-w-2xl mx-auto leading-relaxed">
                    두 가지 서로 다른 물리화학적 특성을 가진 수질 시나리오를 설계하였습니다. 시료의 성분에 따라 가장 알맞은 정화 필터와 공정을 선택하여 수질 복원 실험을 진행해 보십시오.
                  </p>
                </div>

                {/* Scenario Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  {SCENARIOS.map((scenario) => {
                    const isA = scenario.id === 'A';
                    return (
                      <div
                        key={scenario.id}
                        className="group bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden flex flex-col text-left transition-all duration-300 hover:border-[#005cba] hover:shadow-[0_12px_24px_rgba(0,0,0,0.03)] hover:-translate-y-1"
                      >
                        {/* Visual Card Cover with styling representing contamination */}
                        <div className="h-52 w-full relative overflow-hidden bg-slate-900 flex items-center justify-center">
                          {/* Rich fallback canvas illustration to prevent any broken links */}
                          <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-gradient-to-tr from-black to-slate-800"></div>
                          
                          {/* Contaminated Liquid fluid effect */}
                          <div className="absolute inset-x-0 bottom-0 h-4/5 w-full opacity-60 overflow-hidden">
                            <div 
                              className="absolute inset-0 w-[200%] h-[200%] rounded-[40%] wave-animation"
                              style={{
                                backgroundColor: scenario.beakerColor,
                                top: '30%',
                                left: '-50%'
                              }}
                            ></div>
                          </div>

                          {/* Cover icon representing source */}
                          <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                            {isA ? (
                              <Waves className="w-16 h-16 text-[#a7c8ff] mb-2 drop-shadow-md" />
                            ) : (
                              <Factory className="w-16 h-16 text-[#ffb690] mb-2 drop-shadow-md" />
                            )}
                            <span className="text-xs font-mono uppercase tracking-widest text-slate-300 bg-slate-900/50 px-2.5 py-1 rounded-full border border-slate-700/50">
                              Scenario {scenario.id}
                            </span>
                          </div>
                        </div>

                        {/* Card Contents */}
                        <div className="p-6 flex-grow flex flex-col">
                          <h3 className="text-2xl font-bold text-[#001e40] mb-3 flex items-center justify-between">
                            {scenario.title}
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                              scenario.hazardLevel === 'High' 
                                ? 'bg-[#ffdad6] text-[#ba1a1a]' 
                                : 'bg-[#ffdbca] text-[#723610]'
                            }`}>
                              위험 등급: {scenario.hazardLevel}
                            </span>
                          </h3>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {scenario.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className={`text-xs font-medium px-2 py-1 rounded border ${
                                  isA 
                                    ? 'bg-blue-50 text-[#005cba] border-blue-100' 
                                    : 'bg-red-50 text-[#ba1a1a] border-red-100'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <p className="text-sm text-[#43474f] leading-relaxed mb-6 flex-grow">
                            {scenario.description}
                          </p>

                          <button
                            onClick={() => {
                              setSelectedScenarioId(scenario.id);
                              setStep('select_filter');
                            }}
                            className={`w-full py-3 rounded-xl font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                              isA 
                                ? 'bg-[#001e40] text-white hover:bg-[#003366]' 
                                : 'bg-[#ba1a1a] text-white hover:bg-[#93000a]'
                            }`}
                          >
                            실험 시작하기
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom stats block matching raw design */}
                <div className="border-t border-[#e2e8f0] pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-[#eceef1]/60 rounded-xl border border-slate-200/50">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#005cba]">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#43474f] uppercase tracking-wider">실시간 연산 성능</div>
                      <div className="text-sm font-semibold text-[#001e40] font-mono">High Fidelity (99.8%)</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-[#eceef1]/60 rounded-xl border border-slate-200/50">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-[#118d3b]">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#43474f] uppercase tracking-wider">데이터 신뢰도</div>
                      <div className="text-sm font-semibold text-[#001e40] font-mono">Academic Certified</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-[#eceef1]/60 rounded-xl border border-slate-200/50">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-[#e67e22]">
                      <Timer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#43474f] uppercase tracking-wider">최근 실험</div>
                      <div className="text-sm font-semibold text-[#001e40] font-mono">
                        {logs.length > 0 ? `${logs[0].filterTitle} (${logs[0].timestamp.split(' ')[1] || '최근'})` : '데이터 기록 없음 (신규)'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: FILTER & CATALYST SELECTION */}
            {step === 'select_filter' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl mx-auto py-4">
                
                {/* Left Beaker/Scenario info panel */}
                <section className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                    
                    {/* Beaker Illustration Card */}
                    <div className="relative w-full h-72 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-100 overflow-hidden p-4">
                      
                      {/* Beaker structure */}
                      <div className="relative w-40 h-56 border-x-4 border-b-4 border-slate-300 rounded-b-3xl flex flex-col justify-end p-2 overflow-hidden shadow-inner bg-white">
                        
                        {/* Dirty Fluid Level */}
                        <div 
                          className="w-full absolute bottom-0 left-0 transition-all duration-500 ease-in-out wave-animation rounded-b-2xl"
                          style={{
                            height: '75%',
                            backgroundColor: activeScenario.beakerColor,
                            opacity: 0.75,
                          }}
                        >
                          {/* Inner toxic organic particles */}
                          <div className="absolute inset-0 flex flex-wrap justify-around items-center p-4 gap-2 opacity-50">
                            <span className="w-2.5 h-2.5 bg-black/40 rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-yellow-950/50 rounded-full"></span>
                            <span className="w-2 h-2 bg-black/30 rounded-full"></span>
                            <span className="w-3 h-3 bg-yellow-950/30 rounded-full"></span>
                          </div>
                        </div>

                        {/* Beaker measurements ticks */}
                        <div className="absolute left-2 inset-y-8 flex flex-col justify-between text-[10px] font-mono text-slate-400 font-semibold select-none">
                          <div>— 250ml</div>
                          <div>— 200ml</div>
                          <div>— 150ml</div>
                          <div>— 100ml</div>
                          <div>— 50ml</div>
                        </div>

                        {/* Warning Sign */}
                        <div className="relative z-10 m-auto flex flex-col items-center pointer-events-none">
                          <AlertTriangle className="w-10 h-10 text-white drop-shadow-md animate-pulse" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white drop-shadow-sm mt-1">
                            {activeScenario.beakerTitle}
                          </span>
                        </div>
                      </div>

                      {/* Beaker collar */}
                      <div className="absolute top-[52px] left-1/2 -translate-x-1/2 w-[172px] h-3 border-x-4 border-t-4 border-slate-300 rounded-t-lg"></div>
                    </div>

                    <div className="mt-4 w-full">
                      <h3 className="text-xl font-bold text-[#001e40]">{activeScenario.title}</h3>
                      <p className="text-xs text-[#43474f] font-mono mt-1">{activeScenario.location}</p>
                      <p className="text-xs text-[#43474f] mt-2 bg-slate-50 p-2.5 rounded border border-slate-100 text-left leading-relaxed">
                        <strong>상세 스펙:</strong> {activeScenario.details}
                      </p>
                    </div>

                    {/* Meta stats chips */}
                    <div className="mt-4 flex gap-2 w-full justify-center">
                      <span className="px-3 py-1 bg-red-100 text-[#ba1a1a] text-xs rounded-full font-bold">
                        오염도: {activeScenario.pollutionLevel}% (극도)
                      </span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-bold">
                        온도: {activeScenario.temperature}°C
                      </span>
                    </div>
                  </div>

                  {/* Scientific guidance card */}
                  <div className="bg-[#001e40] text-white rounded-2xl p-6 shadow-sm">
                    <h4 className="text-base font-bold flex items-center gap-2 mb-3">
                      <Info className="w-5 h-5 text-blue-300" />
                      정화 지침 가이드
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeScenario.id === 'A' 
                        ? '부영양화 유발 인자(질소, 인)와 미생물 포집이 주요 목적입니다. 활성탄이나 광촉매 화학 반응을 활용하면 하천 생태 환경 지표를 크게 개선할 수 있습니다.'
                        : '유독성 무기 중금속 이온(납, 카드뮴)은 일반 탄소흡착이나 단순 광화학적 결합만으로는 제거가 불가능합니다. 특화 필터나 최첨단 나노 기술 도입이 요구됩니다.'}
                    </p>
                  </div>
                </section>

                {/* Right Selection panel */}
                <section className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#001e40] tracking-tight">적합한 정화 기술 선택</h3>
                    <p className="text-sm text-[#43474f] mt-1">시료의 성분을 분석한 후 가장 최선의 효율을 낼 수 있는 필터 기술을 장착하십시오.</p>
                  </div>

                  {/* Filter List */}
                  <div className="flex flex-col gap-4">
                    {FILTERS.map((filter) => {
                      const isSelected = selectedFilterId === filter.id;
                      const IconComponent = filter.id === 'activated_carbon' ? Filter : filter.id === 'tio2_photocatalyst' ? Sun : Zap;

                      return (
                        <div
                          key={filter.id}
                          onClick={() => setSelectedFilterId(filter.id)}
                          className={`w-full text-left p-5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col md:flex-row items-start gap-5 relative overflow-hidden ${
                            isSelected
                              ? 'bg-white border-[#005cba] ring-1 ring-[#005cba] shadow-md'
                              : 'bg-white border-[#e2e8f0] hover:border-[#005cba]/60 hover:shadow-sm'
                          }`}
                        >
                          {/* Selected marker border highlight */}
                          {isSelected && (
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#005cba]"></div>
                          )}

                          {/* Icon box */}
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-blue-50 text-[#005cba]' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <IconComponent className="w-8 h-8" />
                          </div>

                          {/* Information Column */}
                          <div className="flex-grow">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg font-bold text-[#001e40]">{filter.title}</h4>
                                <span className="text-xs text-slate-400 font-mono">{filter.subtitle}</span>
                              </div>
                              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                filter.level === 'Advanced'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {filter.level}
                              </span>
                            </div>

                            <p className="text-xs text-blue-800 font-semibold mb-2">{filter.techTitle}</p>
                            <p className="text-xs text-[#43474f] leading-relaxed mb-3">{filter.description}</p>

                            {/* Pros & Cons list to make it fully educational */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] mt-3 pt-3 border-t border-slate-100">
                              <div>
                                <span className="font-bold text-[#118d3b]">✓ 장점:</span>
                                <ul className="list-inside list-disc text-slate-600 mt-1 space-y-0.5">
                                  {filter.pros.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                              </div>
                              <div>
                                <span className="font-bold text-[#ba1a1a]">✗ 단점/한계:</span>
                                <ul className="list-inside list-disc text-slate-600 mt-1 space-y-0.5">
                                  {filter.cons.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* SPECIAL UV TOGGLE OPTION FOR TiO2 CATALYST */}
                  {selectedFilterId === 'tio2_photocatalyst' && (
                    <div className="bg-[#e5effa] border border-[#a7c8ff] rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
                      <div className="flex items-start gap-3">
                        <Sun className={`w-10 h-10 shrink-0 ${uvEnabled ? 'text-[#005cba] animate-spin-slow' : 'text-slate-400'}`} style={{ animationDuration: '8s' }} />
                        <div>
                          <h4 className="text-sm font-bold text-[#001e40]">자외선(UV) 광조사기 활성화 장치</h4>
                          <p className="text-xs text-[#43474f] leading-relaxed mt-1">
                            TiO₂ 촉매는 자외선 조사 에너지를 받아야만 강력한 산화 수산기(OH) 반응을 발산합니다. 이 옵션을 끄면 촉매의 정화 분해력이 거의 작동하지 않습니다.
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <button
                          onClick={() => setUvEnabled(!uvEnabled)}
                          className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                            uvEnabled ? 'bg-[#005cba]' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${
                              uvEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-xs font-mono font-bold text-[#001e40] ml-2 w-8">
                          {uvEnabled ? 'ACTIVE' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Run Simulation Action Button */}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={startSimulation}
                      className="px-10 py-4 bg-[#005cba] text-white font-bold rounded-xl hover:bg-[#00458e] active:scale-95 transition-all shadow-md flex items-center gap-3 text-lg cursor-pointer"
                    >
                      실험 시뮬레이션 시작하기
                      <Activity className="w-5 h-5 animate-pulse" />
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* STEP 3: RUNNING SIMULATION ANIMATION */}
            {step === 'simulating' && (
              <div className="w-full max-w-5xl mx-auto py-8">
                
                {/* Simulated alert bar */}
                <div className="bg-[#001e40] text-white rounded-xl p-4 mb-8 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-blue-200">
                      SYS_SIMULATION_ACTIVE (가압 정량 정화 시뮬레이션 가동 중)
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-blue-300 hidden sm:inline">PUMP PRESSURE: 1.2 MPa</span>
                    <span className="text-blue-300">FLOW: 120 L/min</span>
                  </div>
                </div>

                {/* Dashboard layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
                  
                  {/* Left animated beaker column */}
                  <div className="md:col-span-5 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">시료 정화 튜브 상태</h4>
                      <h3 className="text-xl font-bold text-[#001e40]">실시간 정제 비커 모니터링</h3>
                      <p className="text-xs text-[#43474f] mt-1">정화 기술이 가해짐에 따라 오염물질 입자가 화학 분해/포집되어 투명해집니다.</p>
                    </div>

                    {/* Animated beaker canvas replacement */}
                    <div className="relative w-full h-80 flex flex-col items-center justify-center bg-slate-50 rounded-xl my-6 overflow-hidden p-4">
                      
                      {/* Simulation light overlay for UV or General filtration */}
                      {selectedFilterId === 'tio2_photocatalyst' && uvEnabled && (
                        <div className="absolute inset-0 bg-blue-500/10 pointer-events-none animate-pulse z-0"></div>
                      )}

                      {/* Beaker frame */}
                      <div className="relative w-40 h-56 border-x-4 border-b-4 border-slate-300 rounded-b-3xl flex flex-col justify-end p-2 overflow-hidden bg-white/40 z-10">
                        
                        {/* Interactive dynamic color-changing liquid representing progress */}
                        <div
                          className="w-full absolute bottom-0 left-0 transition-colors duration-300 rounded-b-2xl"
                          style={{
                            height: '75%',
                            // Interpolate color from dirty to clear sky-blue based on progress and outcome
                            backgroundColor: `rgba(
                              ${Math.round(139 - (progress / 100) * (139 - 80))}, 
                              ${Math.round(115 - (progress / 100) * (115 - 180))}, 
                              ${Math.round(85 + (progress / 100) * (230 - 85))}, 
                              ${0.75 - (progress / 100) * 0.45}
                            )`,
                          }}
                        >
                          {/* Animated bubbling radicals or filter elements inside beaker */}
                          <div className="absolute inset-0 overflow-hidden">
                            {progress < 95 && (
                              <div className="absolute inset-0 flex flex-wrap justify-around items-center p-4">
                                {/* Random bubbles floating up */}
                                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-1.5 h-1.5 bg-black/20 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                                <div className="w-2 h-2 bg-black/10 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-1.5 h-1.5 bg-blue-300/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Graduation metrics */}
                        <div className="absolute left-2 inset-y-8 flex flex-col justify-between text-[9px] font-mono text-slate-400 select-none">
                          <div>— 250ml</div>
                          <div>— 200ml</div>
                          <div>— 150ml</div>
                          <div>— 100ml</div>
                          <div>— 50ml</div>
                        </div>

                        {/* Fluid status readout inside beaker */}
                        <div className="relative z-20 m-auto text-center pointer-events-none bg-slate-900/40 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-xs">
                          <div className="text-[10px] font-mono font-bold text-slate-300">POLLUTION</div>
                          <div className="text-lg font-mono font-bold text-white tracking-tight">{currentPollution}%</div>
                        </div>
                      </div>

                      {/* Beaker collar */}
                      <div className="absolute top-[100px] left-1/2 -translate-x-1/2 w-[172px] h-3 border-x-4 border-t-4 border-slate-300 rounded-t-lg z-10"></div>
                    </div>

                    {/* Progress details */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#43474f]">시뮬레이션 전송률</span>
                        <span className="text-[#005cba] font-mono">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="bg-[#005cba] h-full transition-all duration-100 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Right live graph column */}
                  <div className="md:col-span-7 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">실시간 피드백 그래프</span>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#005cba]"></span>
                          <span className="text-xs font-mono font-bold text-[#001e40]">오염 농도 수치</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-[#001e40]">오염 제거 추이 연산 곡선</h3>
                      <p className="text-xs text-[#43474f] mt-1">가상의 정화 기공 흡착 반응속도에 따른 시간에 따른 오염 지수 강하율 그래프입니다.</p>
                    </div>

                    {/* SVG Live Render Curve representing progress */}
                    <div className="relative h-64 bg-slate-50 border border-slate-100 rounded-xl my-6 flex items-center justify-center p-4 overflow-hidden">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                        {/* Horizontal Grid lines */}
                        <line x1="0" y1="20" x2="500" y2="20" stroke="#eceef1" strokeDasharray="4" />
                        <line x1="0" y1="80" x2="500" y2="80" stroke="#eceef1" strokeDasharray="4" />
                        <line x1="0" y1="140" x2="500" y2="140" stroke="#eceef1" strokeDasharray="4" />
                        <line x1="0" y1="180" x2="500" y2="180" stroke="#eceef1" strokeDasharray="4" />

                        {/* Static baseline */}
                        <line x1="0" y1="180" x2="500" y2="180" stroke="#001e40" strokeWidth="2" />

                        {/* Interactive dynamic path drawing live as progress increases */}
                        {progress > 0 && (
                          <path
                            d={`M 0 20 Q 120 20, ${Math.round((progress / 100) * 450 + 20)} ${Math.round(20 + (progress / 100) * (180 - 20 - (currentPollution/100) * 160))}`}
                            fill="none"
                            stroke="#005cba"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                        )}

                        {/* Interactive dynamic gradient cover area under curve */}
                        {progress > 0 && (
                          <path
                            d={`M 0 180 L 0 20 Q 120 20, ${Math.round((progress / 100) * 450 + 20)} ${Math.round(20 + (progress / 100) * (180 - 20 - (currentPollution/100) * 160))} L ${Math.round((progress / 100) * 450 + 20)} 180 Z`}
                            fill="rgba(80, 149, 254, 0.08)"
                          />
                        )}

                        {/* Live pulsating point marker */}
                        {progress > 0 && (
                          <circle
                            cx={Math.round((progress / 100) * 450 + 20)}
                            cy={Math.round(20 + (progress / 100) * (180 - 20 - (currentPollution/100) * 160))}
                            r="5"
                            fill="#001e40"
                            stroke="#ffffff"
                            strokeWidth="2.5"
                          />
                        )}

                        {/* Labels inside chart */}
                        <text x="10" y="15" fill="#ba1a1a" className="text-[10px] font-mono font-bold">100% (유입)</text>
                        <text x="440" y="170" fill="#005cba" className="text-[10px] font-mono font-bold">목표 수치</text>
                      </svg>
                      
                      {/* Left vertical axes labels */}
                      <div className="absolute left-2 inset-y-4 flex flex-col justify-between text-[8px] font-mono text-slate-400 select-none">
                        <span>100%</span>
                        <span>50%</span>
                        <span>0%</span>
                      </div>
                    </div>

                    {/* Operational control toolbar matching high class guidelines */}
                    <div className="bg-[#eceef1] rounded-xl p-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsPaused(!isPaused)}
                          className="w-10 h-10 bg-white border border-slate-200 hover:bg-slate-50 text-[#001e40] rounded-lg flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer"
                          title={isPaused ? '실험 재생' : '실험 일시중지'}
                        >
                          {isPaused ? (
                            <span className="text-xs font-sans">RUN</span>
                          ) : (
                            <span className="text-xs font-sans">HOLD</span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('시뮬레이션을 초기화하시겠습니까?')) {
                              setProgress(0);
                            }
                          }}
                          className="w-10 h-10 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                          title="재시작"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Speed modifiers */}
                      <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
                        <button
                          onClick={() => setSimSpeed(1)}
                          className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                            simSpeed === 1 ? 'bg-[#001e40] text-white' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          1X
                        </button>
                        <button
                          onClick={() => setSimSpeed(3)}
                          className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                            simSpeed === 3 ? 'bg-[#001e40] text-white' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          3X (FAST)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: RESULT REPORT */}
            {step === 'result_report' && currentResult && (
              <div className="w-full max-w-5xl mx-auto py-4">
                
                {/* Result header summary banner */}
                <div className={`border rounded-2xl p-6 mb-8 shadow-sm flex flex-col md:flex-row items-center gap-6 ${
                  currentResult.statusBadge === 'safe'
                    ? 'bg-[#eefcf2] border-[#b4ebd0] text-[#118d3b]'
                    : currentResult.statusBadge === 'warning'
                    ? 'bg-[#fffbeb] border-[#fde68a] text-[#723610]'
                    : 'bg-[#fff5f5] border-[#feb2b2] text-[#ba1a1a]'
                }`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                    currentResult.statusBadge === 'safe'
                      ? 'bg-[#d1fae5]'
                      : currentResult.statusBadge === 'warning'
                      ? 'bg-[#fef3c7]'
                      : 'bg-[#fed7d7]'
                  }`}>
                    {currentResult.statusBadge === 'safe' ? (
                      <CheckCircle2 className="w-9 h-9" />
                    ) : (
                      <AlertTriangle className="w-9 h-9" />
                    )}
                  </div>
                  <div className="flex-grow text-center md:text-left">
                    <span className={`inline-block px-3 py-1 rounded-full font-mono text-xs font-bold uppercase tracking-wider mb-2 ${
                      currentResult.statusBadge === 'safe'
                        ? 'bg-[#b4ebd0]'
                        : currentResult.statusBadge === 'warning'
                        ? 'bg-[#fde68a]'
                        : 'bg-[#feb2b2]'
                    }`}>
                      실험 연산 분석 보고서 완료
                    </span>
                    <h3 className="text-2xl font-bold tracking-tight text-[#001e40] mb-1.5">
                      최종 수질 성적: {currentResult.statusText}
                    </h3>
                    <p className="text-sm text-slate-600 font-sans font-medium">
                      {activeScenario.title} + {activeFilter.title} {selectedFilterId === 'tio2_photocatalyst' && (uvEnabled ? '(UV ON)' : '(UV OFF)')} 결합 시뮬레이션
                    </p>
                  </div>
                  
                  {/* Big Efficiency percentage display */}
                  <div className="shrink-0 bg-white border border-slate-200/60 p-4 rounded-xl flex flex-col items-center justify-center w-36 shadow-xs">
                    <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">정화 효율</span>
                    <span className="text-3xl font-mono font-extrabold text-[#005cba] mt-1">{currentResult.efficiency}%</span>
                  </div>
                </div>

                {/* Grid dashboard details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch mb-8">
                  
                  {/* Left finalized curve chart */}
                  <div className="md:col-span-7 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">최종 오염 지각화 차트</h4>
                      <h3 className="text-lg font-bold text-[#001e40]">오염도 감소 추이 최종 곡선</h3>
                      <p className="text-xs text-[#43474f] mt-1">촉매 여과 시간의 경과에 따른 기공 화학 흡착 평형 곡선 검증 결과입니다.</p>
                    </div>

                    <div className="relative h-64 bg-slate-50 border border-slate-100 rounded-xl my-6 flex items-center justify-center p-4">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                        <line x1="0" y1="20" x2="500" y2="20" stroke="#eceef1" strokeDasharray="4" />
                        <line x1="0" y1="80" x2="500" y2="80" stroke="#eceef1" strokeDasharray="4" />
                        <line x1="0" y1="140" x2="500" y2="140" stroke="#eceef1" strokeDasharray="4" />
                        <line x1="0" y1="180" x2="500" y2="180" stroke="#eceef1" strokeDasharray="4" />
                        <line x1="0" y1="180" x2="500" y2="180" stroke="#001e40" strokeWidth="2" />

                        {/* Final static drop curve based on efficiency */}
                        <path
                          d={`M 0 20 Q 120 20, 500 ${Math.round(20 + 160 * (currentResult.pollutionRemaining / 100))}`}
                          fill="none"
                          stroke={currentResult.statusBadge === 'safe' ? '#118d3b' : currentResult.statusBadge === 'warning' ? '#e67e22' : '#ba1a1a'}
                          strokeWidth="4"
                          strokeLinecap="round"
                        />

                        <path
                          d={`M 0 180 L 0 20 Q 120 20, 500 ${Math.round(20 + 160 * (currentResult.pollutionRemaining / 100))} L 500 180 Z`}
                          fill={currentResult.statusBadge === 'safe' ? 'rgba(17, 141, 59, 0.05)' : currentResult.statusBadge === 'warning' ? 'rgba(230, 126, 34, 0.05)' : 'rgba(186, 26, 26, 0.05)'}
                        />

                        <circle cx="0" cy="20" r="5" fill="#001e40" />
                        <circle cx="500" cy={Math.round(20 + 160 * (currentResult.pollutionRemaining / 100))} r="6" fill="#005cba" stroke="#ffffff" strokeWidth="2" />
                      </svg>
                      
                      {/* Left horizontal axes labels */}
                      <div className="absolute left-2 inset-y-4 flex flex-col justify-between text-[8px] font-mono text-slate-400 select-none">
                        <span>100% (유입)</span>
                        <span>50%</span>
                        <span>{currentResult.pollutionRemaining}% (최종)</span>
                      </div>
                    </div>

                    <div className="text-center font-mono text-xs text-slate-400 italic">
                      정제 완료 분석 곡선 ({activeScenario.title} + {activeFilter.title})
                    </div>
                  </div>

                  {/* Right scoreboards & chemical analytics */}
                  <div className="md:col-span-5 flex flex-col gap-6">
                    
                    {/* Chemistry target indicators */}
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col gap-5 justify-between flex-grow">
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">상세 분석 과학 지표</h4>
                        
                        {/* Metric 1 */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center text-xs font-semibold mb-1">
                            <span className="text-[#001e40]">중금속(납, 카드뮴 등) 제거율</span>
                            <span className={`font-mono font-bold ${currentResult.heavyMetalRemoval > 75 ? 'text-[#118d3b]' : 'text-[#ba1a1a]'}`}>
                              {currentResult.heavyMetalRemoval}% {currentResult.heavyMetalRemoval > 75 ? '(높음)' : '(낮음)'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                currentResult.heavyMetalRemoval > 75 ? 'bg-[#118d3b]' : 'bg-[#ba1a1a]'
                              }`}
                              style={{ width: `${currentResult.heavyMetalRemoval}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Metric 2 */}
                        <div>
                          <div className="flex justify-between items-center text-xs font-semibold mb-1">
                            <span className="text-[#001e40]">
                              {activeScenario.id === 'A' ? '부영양 유기물 탁도 감소율' : '화학적 독성 성분 분해율'}
                            </span>
                            <span className={`font-mono font-bold ${currentResult.organicBreakdown > 75 ? 'text-[#005cba]' : 'text-amber-600'}`}>
                              {currentResult.organicBreakdown}% {currentResult.organicBreakdown > 75 ? '(우수)' : '(보통)'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                currentResult.organicBreakdown > 75 ? 'bg-[#005cba]' : 'bg-amber-500'
                              }`}
                              style={{ width: `${currentResult.organicBreakdown}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Micro explanation paragraph */}
                      <div className="bg-[#eceef1]/60 p-4 rounded-xl border border-slate-200/50 flex items-start gap-2 text-xs text-[#43474f] leading-relaxed">
                        <Info className="w-4.5 h-4.5 text-[#005cba] shrink-0 mt-0.5" />
                        <span>
                          {currentResult.advice}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Laboratory Special Findings (텍스트 기반 분석 레포트) */}
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm mb-8">
                  <h4 className="text-lg font-bold text-[#001e40] flex items-center gap-2 mb-4">
                    <Droplet className="w-5 h-5 text-[#005cba]" />
                    실험 특이사항 및 연산 소견
                  </h4>
                  <p className="text-sm text-[#43474f] leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {currentResult.summary}
                  </p>
                </div>

                {/* Action buttons area */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={restartLab}
                    className="px-10 py-4 bg-[#001e40] text-white font-bold rounded-xl hover:bg-[#003366] active:scale-95 transition-all shadow-md flex items-center gap-2 text-base cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    새로운 조합으로 다시 실험하기
                  </button>
                </div>

                {/* Bottom decorative beaker container image context */}
                <div className="mt-12 rounded-2xl overflow-hidden h-48 relative border border-[#e2e8f0] shadow-inner bg-slate-800 flex items-center justify-center">
                  <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAU33U_JeyBtoberbluOiPB2tYtjB2enXJ7o7z3A6PbDCRr8hGW-2Nhx0UFIKVgXCHqgw7wFnmNoYX9lG-g781DmK-s7JX9CyTeYs9J1u0oNurP9u4a8Q73IBydTN-7_8R0yDFWhxer10BzeOT_myu8ZIChZSrsB6SZUaQJEf9apWok5dX3lXN9lv5m58UFbOo6OAfqvWVUUWahHX0IvujilGQbg2YFSHyOZgejH5LN0gKyBlHc3lvaRMCfi50cW7PnUORpWMdrRD3e')" }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#001e40]/90 to-transparent"></div>
                  <div className="relative z-10 text-center px-6">
                    <h4 className="text-white text-lg font-bold">수질 검사 결과 데이터 로깅 완료</h4>
                    <p className="text-blue-200 text-xs mt-1">상기 가상 수처리 모의 연산 데이터가 서버 및 로컬 캐시에 즉시 보존되어 누적 분석을 지원합니다.</p>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 2: DETAILED DATA RECORDS (HISTORY LOGS) */}
        {activeTab === 'data' && (
          <div className="max-w-4xl mx-auto w-full py-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-[#001e40] flex items-center gap-2">
                  <Database className="w-6 h-6 text-[#005cba]" />
                  가상 수질 실험 데이터 보존소
                </h2>
                <p className="text-sm text-[#43474f] mt-1">
                  이번 실험 세션에서 가압 분석이 완료된 시나리오별 누적 결과 리스트입니다. 정화 효율을 상호 비교할 수 있습니다.
                </p>
              </div>

              {logs.length > 0 && (
                <button
                  onClick={clearAllLogs}
                  className="px-4 py-2 bg-red-50 text-[#ba1a1a] hover:bg-red-100 border border-red-200 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  전체 실험 로그 초기화
                </button>
              )}
            </div>

            {/* Logs List Container */}
            {logs.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-16 text-center text-slate-500 flex flex-col items-center justify-center">
                <Database className="w-16 h-16 text-slate-300 mb-4 stroke-1" />
                <h3 className="text-lg font-bold text-[#001e40] mb-1">보존된 데이터가 없습니다</h3>
                <p className="text-sm text-[#43474f] max-w-sm mb-6">
                  실험실 탭에서 시나리오와 필터를 장착해 가상 삼투가압 정화를 가동하면 실시간 보고서 데이터가 이곳에 보존됩니다.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('lab');
                    setStep('select_scenario');
                  }}
                  className="px-6 py-2.5 bg-[#005cba] text-white font-bold rounded-lg hover:bg-[#00458e] transition-all cursor-pointer text-sm shadow-xs"
                >
                  첫 실험 시작하기
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => viewPastLog(log)}
                    className="group bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-xs hover:border-[#005cba] transition-all cursor-pointer flex flex-col md:flex-row items-stretch gap-4 relative overflow-hidden"
                  >
                    {/* Tiny Status Badge Edge */}
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                      log.statusBadge === 'safe'
                        ? 'bg-[#118d3b]'
                        : log.statusBadge === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-[#ba1a1a]'
                    }`}></div>

                    {/* Left details info */}
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{log.timestamp}</span>
                          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            log.statusBadge === 'safe'
                              ? 'bg-green-50 text-[#118d3b] border border-green-100'
                              : log.statusBadge === 'warning'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-red-50 text-[#ba1a1a] border border-red-100'
                          }`}>
                            {log.statusText}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#001e40] group-hover:text-[#005cba] transition-colors flex items-center gap-2">
                          {log.scenarioTitle}
                          <span className="text-slate-300 font-normal">|</span>
                          <span className="text-slate-600 text-sm font-semibold">{log.filterTitle}</span>
                        </h3>
                      </div>

                      {/* Small inline stats scorecard */}
                      <div className="flex items-center gap-6 mt-4 text-xs font-mono font-medium text-slate-500">
                        <div>
                          <span>중금속 제거율: </span>
                          <strong className={log.heavyMetalRemoval > 75 ? 'text-[#118d3b]' : 'text-slate-700'}>
                            {log.heavyMetalRemoval}%
                          </strong>
                        </div>
                        <div>
                          <span>화학/유기 분해율: </span>
                          <strong className={log.organicBreakdown > 75 ? 'text-[#005cba]' : 'text-slate-700'}>
                            {log.organicBreakdown}%
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Right numeric block */}
                    <div className="shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 gap-2 text-right">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">정화 효율</span>
                        <span className="text-2xl font-mono font-extrabold text-[#005cba]">{log.efficiency}%</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewPastLog(log);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[#001e40] text-[10px] font-bold rounded cursor-pointer"
                        >
                          레포트 로드
                        </button>
                        <button
                          onClick={(e) => deleteLog(log.id, e)}
                          className="p-1 text-slate-400 hover:text-[#ba1a1a] rounded hover:bg-red-50 transition-colors cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAFETY RULES */}
        {activeTab === 'safety' && (
          <div className="max-w-4xl mx-auto w-full py-4 animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#001e40] flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-[#ba1a1a]" />
                가상 화학 및 수처리 실험실 필수 안전 규정
              </h2>
              <p className="text-sm text-[#43474f] mt-1">
                수처리 실험실에서 다루는 화학물질과 고농도 공장 폐수, 고전력 기기는 취급 부주의 시 큰 신체 위해를 가할 수 있으므로, 아래 안전 수칙을 완벽히 지키십시오.
              </p>
            </div>

            {/* Classified safety grids */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* General Rules */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">CATEGORY 01</span>
                <h3 className="text-lg font-bold text-[#001e40] flex items-center gap-1.5 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  일반 연구소 기본 행동 규정
                </h3>
                <div className="space-y-4">
                  {SAFETY_RULES.filter(r => r.category === 'general').map(rule => (
                    <div key={rule.id} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                      <h4 className="text-sm font-bold text-[#001e40] mb-1">{rule.title}</h4>
                      <p className="text-xs text-[#43474f] leading-relaxed">{rule.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chemical Rules */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">CATEGORY 02</span>
                <h3 className="text-lg font-bold text-[#001e40] flex items-center gap-1.5 mb-3">
                  <Flame className="w-5 h-5 text-[#ba1a1a]" />
                  유해 중금속 및 수질 취급 규정
                </h3>
                <div className="space-y-4">
                  {SAFETY_RULES.filter(r => r.category === 'chemical').map(rule => (
                    <div key={rule.id} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                      <h4 className="text-sm font-bold text-[#001e40] mb-1">{rule.title}</h4>
                      <p className="text-xs text-[#43474f] leading-relaxed">{rule.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipment Rules */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">CATEGORY 03</span>
                <h3 className="text-lg font-bold text-[#001e40] flex items-center gap-1.5 mb-3">
                  <Zap className="w-5 h-5 text-amber-500" />
                  물리 여과 및 조사 장비 조작 수칙
                </h3>
                <div className="space-y-4">
                  {SAFETY_RULES.filter(r => r.category === 'equipment').map(rule => (
                    <div key={rule.id} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                      <h4 className="text-sm font-bold text-[#001e40] mb-1">{rule.title}</h4>
                      <p className="text-xs text-[#43474f] leading-relaxed">{rule.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Warning Alert Panel */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 text-[#ba1a1a]">
              <ShieldAlert className="w-8 h-8 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base font-bold">비상 긴급 연락 대책 (Emergency Protocol)</h4>
                <p className="text-xs text-[#ba1a1a]/80 leading-relaxed mt-1">
                  강산 유출 및 촉매 폭주 압력 파열 위기 시 조작부 EMS 비상 전원 정지 벨브를 당긴 뒤, 즉시 수질정화 안전 본부센터(내선 119)에 안전 보고하십시오. 안전은 가상 모의가 아닌 실제 생명 구조 조건입니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 w-full z-50 h-16 bg-white border-t border-slate-200 shadow-lg flex justify-around items-center md:hidden px-4">
        <button
          onClick={() => setActiveTab('lab')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 ${
            activeTab === 'lab'
              ? 'bg-[#e5effa] text-[#005cba]'
              : 'text-[#43474f]'
          }`}
        >
          <Waves className="w-5 h-5" />
          <span className="text-[10px] font-sans font-bold mt-1">실험실</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 relative ${
            activeTab === 'data'
              ? 'bg-[#e5effa] text-[#005cba]'
              : 'text-[#43474f]'
          }`}
        >
          <Database className="w-5 h-5" />
          {logs.length > 0 && (
            <span className="absolute top-1.5 right-3 bg-[#005cba] text-white text-[9px] font-mono font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white">
              {logs.length}
            </span>
          )}
          <span className="text-[10px] font-sans font-bold mt-1">데이터</span>
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 ${
            activeTab === 'safety'
              ? 'bg-[#e5effa] text-[#005cba]'
              : 'text-[#43474f]'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-sans font-bold mt-1">안전수칙</span>
        </button>
      </nav>

    </div>
  );
}
