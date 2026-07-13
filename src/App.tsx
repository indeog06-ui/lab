import React, { useState, useEffect, useRef } from 'react';
import { 
  Droplet, 
  Zap, 
  Gauge, 
  FlaskConical, 
  Play, 
  RotateCcw, 
  History as HistoryIcon, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ArrowLeft, 
  Trash2, 
  TrendingDown, 
  Info,
  Layers,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Scenario, Catalyst, SimulationConfig, SimulationResult, HistoryItem } from './types';
import { SCENARIOS, CATALYSTS, calculatePurification } from './data';

export default function App() {
  // Navigation & Step states
  const [activeTab, setActiveTab] = useState<'lab' | 'data' | 'safety'>('lab');
  const [step, setStep] = useState<number>(1); // 1: Select Scenario, 2: Select Catalyst, 3: Simulating, 4: Results

  // Simulation parameters
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedCatalyst, setSelectedCatalyst] = useState<Catalyst | null>(null);
  const [uvLight, setUvLight] = useState<boolean>(false);
  const [flowRate, setFlowRate] = useState<number>(3); // 1 to 10 L/min

  // Real-time Simulation animation states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [currentTurbidity, setCurrentTurbidity] = useState<number>(0);
  const [currentOrganic, setCurrentOrganic] = useState<number>(0);
  const [currentHeavyMetal, setCurrentHeavyMetal] = useState<number>(0);
  
  // Completed result state
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Experiment Logs History (persisted in localStorage)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryDetail, setActiveHistoryDetail] = useState<HistoryItem | null>(null);

  // Sound/Vibration effect toggles (mental luxury for virtual labs)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  // Audio elements ref for bubble sounds, etc. (synthesized via Web Audio API!)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bubbleTimerRef = useRef<any>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('water_purification_history_v2');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history logs', e);
      }
    }
  }, []);

  // Web Audio Synth for Bubble / Water Sound FX
  const playSynthesizedBubble = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const pitch = 300 + Math.random() * 600;
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      // Sweeping frequency up to mimic a popping bubble
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
      console.warn('Audio Synth not supported or blocked by browser policies', e);
    }
  };

  // Trigger synth during simulation
  useEffect(() => {
    if (isSimulating && soundEnabled) {
      bubbleTimerRef.current = setInterval(() => {
        playSynthesizedBubble();
      }, 180);
    } else {
      if (bubbleTimerRef.current) {
        clearInterval(bubbleTimerRef.current);
      }
    }
    return () => clearInterval(bubbleTimerRef.current);
  }, [isSimulating, soundEnabled]);

  // Handle local storage saving
  const saveToHistory = (config: SimulationConfig, result: SimulationResult) => {
    const newLog: HistoryItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      scenarioName: config.scenario.name,
      catalystName: config.catalyst.name,
      uvLight: config.uvLight,
      flowRate: config.flowRate,
      efficiency: result.efficiency,
      statusGrade: result.statusGrade
    };

    const updated = [newLog, ...history];
    setHistory(updated);
    localStorage.setItem('water_purification_history_v2', JSON.stringify(updated));
  };

  const clearHistory = () => {
    if (window.confirm('모든 실험 결과 기록을 삭제하시겠습니까?')) {
      setHistory([]);
      localStorage.removeItem('water_purification_history_v2');
    }
  };

  // Navigation handlers
  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    // Reset parameters to smart defaults based on scenario
    setUvLight(false);
    setFlowRate(3);
    setStep(2);
  };

  const handleSelectCatalyst = (catalyst: Catalyst) => {
    setSelectedCatalyst(catalyst);
  };

  const handleBackToScenario = () => {
    setSelectedScenario(null);
    setSelectedCatalyst(null);
    setStep(1);
  };

  const handleBackToCatalyst = () => {
    setStep(2);
  };

  // Launch real-time simulation
  const handleStartSimulation = () => {
    if (!selectedScenario || !selectedCatalyst) return;

    setIsSimulating(true);
    setSimulationProgress(0);
    setStep(3);

    const config: SimulationConfig = {
      scenario: selectedScenario,
      catalyst: selectedCatalyst,
      uvLight,
      flowRate
    };

    const result = calculatePurification(config);
    setSimulationResult(result);

    // Initial starting values
    const startTurbidity = selectedScenario.initialTurbidity;
    const startOrganic = selectedScenario.initialOrganic;
    const startHeavyMetal = selectedScenario.initialHeavyMetal;

    setCurrentTurbidity(startTurbidity);
    setCurrentOrganic(startOrganic);
    setCurrentHeavyMetal(startHeavyMetal);

    // Run animation frames
    const duration = 4000; // 4 seconds of gorgeous simulation
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const percent = Math.round(progress * 100);

      setSimulationProgress(percent);

      // Interpolate values in real-time
      const currentT = startTurbidity - (startTurbidity - result.finalTurbidity) * progress;
      const currentO = startOrganic - (startOrganic - result.finalOrganic) * progress;
      const currentH = startHeavyMetal - (startHeavyMetal - result.finalHeavyMetal) * progress;

      setCurrentTurbidity(parseFloat(currentT.toFixed(1)));
      setCurrentOrganic(parseFloat(currentO.toFixed(1)));
      setCurrentHeavyMetal(parseFloat(currentH.toFixed(1)));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation finished
        setIsSimulating(false);
        saveToHistory(config, result);
        setStep(4);
      }
    };

    requestAnimationFrame(animate);
  };

  const resetExperiment = () => {
    setSelectedScenario(null);
    setSelectedCatalyst(null);
    setSimulationResult(null);
    setUvLight(false);
    setFlowRate(3);
    setStep(1);
    setActiveTab('lab');
  };

  // Compute water visual color based on current simulation statistics
  const getWaterColorStyle = () => {
    if (!selectedScenario) return 'rgba(100, 116, 139, 0.4)'; // default slate gray

    // Base color components
    let r = 139, g = 115, b = 85; // Default River Turbid brown
    
    if (selectedScenario.id === 'industrial') {
      r = 184; g = 134; b = 11; // Toxic golden/amber/yellow-green
    }

    // Targets: pure purified blue (rgb 56, 189, 248)
    const targetR = 56, targetG = 189, targetB = 248;

    // Calculate current progress based on current statistics reduction
    const initialSum = selectedScenario.initialTurbidity + selectedScenario.initialOrganic + selectedScenario.initialHeavyMetal;
    const currentSum = currentTurbidity + currentOrganic + currentHeavyMetal;
    
    // Fraction of purification done (0 = dirty, 1 = perfectly clean)
    const cleanRatio = initialSum > 0 ? (initialSum - currentSum) / initialSum : 1;

    // Blend bases
    const blendedR = Math.round(r + (targetR - r) * cleanRatio);
    const blendedG = Math.round(g + (targetG - g) * cleanRatio);
    const blendedB = Math.round(b + (targetB - b) * cleanRatio);

    // Calculate dynamic opacity based on turbidity
    const opacity = 0.35 + (currentTurbidity / 100) * 0.45;

    return `rgba(${blendedR}, ${blendedG}, ${blendedB}, ${opacity})`;
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex flex-col font-sans select-none antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 left-0 w-full z-40 flex items-center justify-between px-6 h-16 bg-white border-b border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 to-blue-700 flex items-center justify-center text-white shadow-md animate-float">
            <FlaskConical className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="font-headline-sm font-bold text-slate-900 tracking-tight">수질 오염 정화 가상 실험실</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider hidden sm:block">ACADEMIC HIGH-FIDELITY SIMULATION ENVIRONMENT</p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          <button 
            onClick={() => { setActiveTab('lab'); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'lab' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <FlaskConical className="w-4 h-4" />
            가상 실험실
          </button>
          <button 
            onClick={() => { setActiveTab('data'); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'data' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <HistoryIcon className="w-4 h-4" />
            데이터 로그 ({history.length})
          </button>
          <button 
            onClick={() => { setActiveTab('safety'); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'safety' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ShieldAlert className="w-4 h-4" />
            안전수칙 가이드
          </button>
        </nav>

        {/* Audio FX Toggle Switch & Lab Badge */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border ${soundEnabled ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
            title="실험 사운드 효과"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>음향 {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100">
            ● ONLINE LAB
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col justify-start">
        
        {/* Render Tab 2: History Data Logs */}
        {activeTab === 'data' && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">가상 정화 실험 역사 로그</h2>
                <p className="text-slate-500 text-sm mt-1">로컬 스토리지에 자동 보존되는 과거 정화 시험 리포트 아카이브입니다.</p>
              </div>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  전체 기록 초기화
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <HistoryIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800">보존된 실험 기록이 없습니다</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">가상 실험실 탭에서 수질 샘플과 정화 필터 파라미터를 조합해 첫 시뮬레이션을 실행하세요.</p>
                <button 
                  onClick={() => setActiveTab('lab')}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
                >
                  실험 시작하러 가기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* History Table */}
                <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-semibold font-mono">
                          <th className="px-6 py-4">시간</th>
                          <th className="px-6 py-4">오염원 샘플</th>
                          <th className="px-6 py-4">필터 및 촉매</th>
                          <th className="px-6 py-4">제어 환경</th>
                          <th className="px-6 py-4 text-center">정화율</th>
                          <th className="px-6 py-4 text-center">종합 등급</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {history.map((item) => (
                          <tr 
                            key={item.id} 
                            onClick={() => setActiveHistoryDetail(item)}
                            className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${activeHistoryDetail?.id === item.id ? 'bg-blue-50/50 font-medium' : ''}`}
                          >
                            <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">{item.timestamp}</td>
                            <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">{item.scenarioName}</td>
                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{item.catalystName}</td>
                            <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                              <span className="flex items-center gap-1.5">
                                {item.uvLight ? (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold text-[10px]">UV 켬</span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">UV 끔</span>
                                )}
                                <span className="font-mono">{item.flowRate} L/min</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-blue-600 whitespace-nowrap">{item.efficiency}%</td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold font-mono ${
                                item.statusGrade === 'A+' ? 'bg-emerald-100 text-emerald-800' :
                                item.statusGrade === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {item.statusGrade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* History Detail Inspector Card */}
                <div className="lg:col-span-4 space-y-4">
                  {activeHistoryDetail ? (
                    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sticky top-24">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                        <span className="text-xs font-mono text-slate-500">{activeHistoryDetail.timestamp}</span>
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold font-mono ${
                          activeHistoryDetail.statusGrade === 'A+' ? 'bg-emerald-100 text-emerald-800' :
                          activeHistoryDetail.statusGrade === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          등급: {activeHistoryDetail.statusGrade}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-slate-900 mb-4">정화 실험 세부 성과</h3>

                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-400">오염 수질 샘플</p>
                          <p className="font-semibold text-slate-800 mt-0.5">{activeHistoryDetail.scenarioName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">적용 정화 매개체</p>
                          <p className="font-semibold text-slate-800 mt-0.5">{activeHistoryDetail.catalystName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-xs">
                          <div>
                            <p className="text-slate-400">자외선 조사</p>
                            <p className="font-bold text-slate-700 mt-0.5">{activeHistoryDetail.uvLight ? '가동 중 (ON)' : '미가동 (OFF)'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">폐수 흐름 유량</p>
                            <p className="font-bold text-slate-700 mt-0.5">{activeHistoryDetail.flowRate} L/min</p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                          <p className="text-xs text-slate-400 mb-1">복합 오염원 종합 정화율</p>
                          <div className="flex items-center gap-3">
                            <span className="text-3xl font-black font-mono text-blue-600">{activeHistoryDetail.efficiency}%</span>
                            <div className="flex-grow bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  activeHistoryDetail.statusGrade === 'A+' ? 'bg-emerald-500' :
                                  activeHistoryDetail.statusGrade === 'B' ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${activeHistoryDetail.efficiency}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <button 
                          onClick={() => {
                            // Restore parameters to re-run
                            const foundScenario = SCENARIOS.find(s => s.name === activeHistoryDetail.scenarioName);
                            const foundCatalyst = CATALYSTS.find(c => c.name === activeHistoryDetail.catalystName);
                            if (foundScenario && foundCatalyst) {
                              setSelectedScenario(foundScenario);
                              setSelectedCatalyst(foundCatalyst);
                              setUvLight(activeHistoryDetail.uvLight);
                              setFlowRate(activeHistoryDetail.flowRate);
                              setStep(2);
                              setActiveTab('lab');
                            }
                          }}
                          className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          해당 조건 그대로 불러와 재실험
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-8 text-center text-slate-400 flex flex-col justify-center items-center h-64 border-dashed">
                      <HelpCircle className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="text-xs">왼쪽 표에서 상세 보고서를 열어볼 실험 행을 클릭하세요.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Render Tab 3: Safety Guidelines */}
        {activeTab === 'safety' && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">수질 가상 정화 안전 수칙 & 교육 매뉴얼</h2>
              <p className="text-slate-500 text-sm mt-1">대학 연구소 기준 환경 및 실험 프로세스의 학술적 유의 사항을 기재한 가이드라인입니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
                <div>
                  <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mb-4">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">유해 화학 폐수 접촉 제한</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    공장 폐수 시료(Scenario B) 등 납, 카드뮴 등 유해 중금속이 고농도로 섞인 오염 물질 분석 시, 반드시 정밀 안전 고무장갑과 밀폐식 고글을 올바르게 착용하십시오. 피부 및 인체 직접 노출을 완벽 차단하는 장벽을 마련해야 합니다.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded mt-4 inline-block w-max">위험 등급: HIGH HAZARD</span>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
                <div>
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">자외선(UV) 장치 전용 차광 안경</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    이산화티타늄(TiO₂) 광촉매 활성화에 사용하는 강력한 자외선 램프 작동 중에는 육안으로 직접 발광부를 쳐다보는 일을 엄금합니다. 심각한 각막 파열 및 눈의 영구적 손상을 초래할 수 있으므로, 시뮬레이션 작동 중엔 보호 차단 안경을 착용하십시오.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded mt-4 inline-block w-max">위험 등급: MEDIUM HAZARD</span>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
                <div>
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                    <Gauge className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">적정 유량(Flow Rate) 유지 관리</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    유량이 지나치게 높으면 오염액이 정화 메커니즘을 거치기 전 튕겨 나가게 되어 최종 방류 농도가 급격히 급증합니다. 반대로 유량이 과도하게 낮을 시, 정체 구간 압력 누적으로 멤브레인 필터가 파손될 위험이 상존합니다. 최적 권장 수치(3 ~ 4 L/min)를 수립하여 압력을 실시간 점검하십시오.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded mt-4 inline-block w-max">환경 제어 지침</span>
              </div>
            </div>

            <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200 flex items-start gap-4">
              <Info className="w-6 h-6 text-slate-600 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-slate-800">정화 촉매별 학술 참고 사항</h4>
                <p className="text-slate-600 text-sm leading-relaxed mt-1">
                  이산화티타늄(TiO₂)과 같은 금속산화물 기반 반도체 촉매는 전자의 여기 상태(Conduction Band) 전이를 유발하기 위해 광원의 밴드갭 매칭 에너지가 필요합니다. 탄소나노튜브(CNT)의 경우 물리적 메시 차단과 이온의 표면 정전기적 척력(Donnan Exclusion Effect) 원리로 초정밀 중금속 이온까지 배제하는 탁월한 메커니즘을 증명하고 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Render Tab 1: Virtual Laboratory Screen Flow */}
        {activeTab === 'lab' && (
          <div className="w-full">

            {/* STEP 1: Select Scenario / Source Water */}
            {step === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                    <FlaskConical className="w-3.5 h-3.5" />
                    시뮬레이션 모드 선택
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">어떤 수질 샘플을 정화해 볼까요?</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    서로 다른 오염 특징을 품고 있는 두 가지 수질 샘플이 연구용으로 보관되어 있습니다. 오염 물질과 중금속 특성을 파악하여 최적의 정화 공정을 설계하십시오.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {SCENARIOS.map((scenario) => (
                    <div 
                      key={scenario.id}
                      onClick={() => handleSelectScenario(scenario)}
                      className="group cursor-pointer bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="h-52 w-full relative overflow-hidden bg-slate-900">
                        {/* Beautiful fallback CSS-based visual representation of dirty beaker liquid if remote image loader blocks */}
                        <div className={`absolute inset-0 bg-gradient-to-t ${scenario.bgColor} opacity-95 transition-transform duration-500 group-hover:scale-105`}></div>
                        
                        {/* Simulated particle swirls and water wave lines inside the preview card */}
                        <div className="absolute inset-0 flex flex-col justify-around opacity-40">
                          <div className="w-full h-1 bg-white/20 blur-[1px] rotate-2"></div>
                          <div className="w-full h-1 bg-white/10 blur-[2px] -rotate-3"></div>
                          <div className="w-full h-1 bg-white/20 blur-[1px] rotate-1"></div>
                        </div>

                        {/* Top corner badging */}
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider text-white uppercase ${
                            scenario.hazardousLevel === 'High' ? 'bg-rose-600 shadow-sm animate-pulse' : 'bg-amber-600'
                          }`}>
                            {scenario.hazardousLevel === 'High' ? '위험 등급: HIGH' : '위험 등급: MEDIUM'}
                          </span>
                        </div>

                        {/* Beaker fluid metadata */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                          <div>
                            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-300 font-bold">{scenario.subtitle}</span>
                            <h3 className="text-2xl font-black mt-1 text-white">{scenario.name}</h3>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                            <Droplet className="w-5 h-5 fill-current" />
                          </div>
                        </div>
                      </div>

                      <div className="p-6 flex-grow flex flex-col justify-between">
                        <div>
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {scenario.tags.map((tag, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-xs font-semibold">
                                {tag}
                              </span>
                            ))}
                          </div>

                          <p className="text-slate-600 text-sm leading-relaxed mb-6">
                            {scenario.description}
                          </p>
                        </div>

                        {/* Metric Gauges Preview */}
                        <div className="border-t border-slate-100 pt-4 mt-auto">
                          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-2">실제 정밀 검출 통계 (초기치)</p>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="block text-[10px] text-slate-400 font-medium">탁도(NTU)</span>
                              <span className="font-mono text-sm font-bold text-slate-700">{scenario.initialTurbidity}%</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="block text-[10px] text-slate-400 font-medium">유기 화학물</span>
                              <span className="font-mono text-sm font-bold text-slate-700">{scenario.initialOrganic}%</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="block text-[10px] text-slate-400 font-medium">중금속(Pb)</span>
                              <span className="font-mono text-sm font-bold text-slate-700">{scenario.initialHeavyMetal}%</span>
                            </div>
                          </div>

                          <div className="mt-5 flex items-center justify-end text-blue-600 font-bold text-xs group-hover:translate-x-1.5 transition-transform duration-300">
                            이 시료 분석 및 정화 개시
                            <span className="material-symbols-outlined text-sm ml-1" style={{ fontSize: '16px' }}>arrow_forward</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Configure Catalyst, UV, Flow Rate */}
            {step === 2 && selectedScenario && (
              <div className="space-y-6 animate-fade-in">
                {/* Back button and title */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <button 
                    onClick={handleBackToScenario}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 shadow-sm transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    수질 시료 다시 고르기
                  </button>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-blue-600 tracking-wider">공정 가상 설계 단계</span>
                    <h3 className="font-bold text-slate-800">정화 촉매 및 유량 세부 설정</h3>
                  </div>
                </div>

                {/* Grid layout for configuration */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Sample Beaker Info */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
                      <div>
                        <div className="inline-block px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-xs mb-3">
                          분석 시료 프로필
                        </div>
                        <h4 className="text-2xl font-black text-slate-800">{selectedScenario.name}</h4>
                        <p className="text-slate-500 text-xs mt-1">{selectedScenario.subtitle}</p>

                        {/* Beaker representation under NTP environment */}
                        <div className="my-6 relative w-44 h-56 mx-auto flex items-end justify-center">
                          {/* Beaker Glass container */}
                          <div className="absolute inset-0 border-r-4 border-l-4 border-b-4 border-slate-300 rounded-b-3xl border-t-0 shadow-inner overflow-hidden bg-slate-50/20">
                            
                            {/* Water inside, with initial dirty fluid visual */}
                            <div 
                              className="w-full absolute bottom-0 transition-all duration-700" 
                              style={{ 
                                height: '75%', 
                                backgroundColor: getWaterColorStyle()
                              }}
                            >
                              {/* Particles inside dirty water */}
                              <div className="absolute inset-0 overflow-hidden opacity-60">
                                <span className="absolute top-1/4 left-1/4 w-1.5 h-1.5 rounded-full bg-amber-900/40 animate-pulse"></span>
                                <span className="absolute top-2/4 left-3/4 w-1 h-1 rounded-full bg-slate-900/60"></span>
                                <span className="absolute top-3/4 left-1/3 w-2 h-1.5 rounded-full bg-amber-800/40"></span>
                              </div>
                            </div>

                            {/* Beaker tick marks */}
                            <div className="absolute left-3 top-6 bottom-4 w-4 flex flex-col justify-between text-[8px] font-mono text-slate-400 border-r border-slate-200/50">
                              <span>400ml</span>
                              <span>300ml</span>
                              <span>200ml</span>
                              <span>100ml</span>
                            </div>
                          </div>
                          
                          {/* Beaker Lip */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-3 border-x-4 border-t-4 border-slate-300 rounded-t-lg"></div>
                        </div>

                        {/* Initial water chemistry stats */}
                        <div className="space-y-2 text-xs">
                          <p className="font-bold text-slate-700 border-b border-slate-100 pb-1 flex items-center justify-between">
                            <span>시료 초기 오염 지표</span>
                            <span className="font-mono">NTP 표준 상태</span>
                          </p>
                          <div className="flex justify-between text-slate-600">
                            <span>탁도 (Turbidity)</span>
                            <span className="font-mono font-bold text-slate-700">{selectedScenario.initialTurbidity}%</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>유기화합물 (Organics)</span>
                            <span className="font-mono font-bold text-slate-700">{selectedScenario.initialOrganic}%</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>이온 중금속 (Heavy Metals)</span>
                            <span className="font-mono font-bold text-slate-700">{selectedScenario.initialHeavyMetal}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Laboratory environment</span>
                        <p className="text-[11px] text-slate-500 mt-1">상온 18°C 및 1기압 표준 기압 하에서 진행하는 가상 유체 분석 모델링입니다.</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Interactive Catalyst Options & Slider Controls */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Catalyst selection */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                          <Layers className="w-5 h-5 text-blue-600" />
                          정화 촉매 및 분리막 선택 (필수)
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">SELECT 1 OF 3 COMPONENTS</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {CATALYSTS.map((catalyst) => (
                          <div 
                            key={catalyst.id}
                            onClick={() => handleSelectCatalyst(catalyst)}
                            className={`group cursor-pointer relative bg-white border rounded-xl p-5 transition-all duration-300 flex flex-col justify-between ${
                              selectedCatalyst?.id === catalyst.id 
                                ? 'border-2 border-blue-600 shadow-md ring-4 ring-blue-50 bg-blue-50/5' 
                                : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            <div>
                              {/* Top row */}
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                                  catalyst.level === 'Advanced' ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {catalyst.level}
                                </span>
                                {selectedCatalyst?.id === catalyst.id && (
                                  <span className="text-blue-600 bg-blue-50 w-5 h-5 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 fill-current text-blue-600" />
                                  </span>
                                )}
                              </div>

                              <h5 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">{catalyst.name}</h5>
                              <p className="text-[11px] text-blue-700/80 font-medium mt-0.5">{catalyst.subType}</p>
                              
                              <p className="text-slate-500 text-xs mt-3 leading-relaxed line-clamp-3">
                                {catalyst.description}
                              </p>
                            </div>

                            <button 
                              className={`w-full py-2 rounded-lg font-semibold text-xs mt-4 border transition-colors ${
                                selectedCatalyst?.id === catalyst.id 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                              }`}
                            >
                              {selectedCatalyst?.id === catalyst.id ? '선택됨' : '선택하기'}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Display Pros/Cons summary of selected catalyst */}
                      {selectedCatalyst && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs space-y-2 animate-fade-in">
                          <p className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-blue-600" />
                            <span>{selectedCatalyst.name}의 학술 피드백 요약</span>
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600 leading-relaxed">
                            <div>
                              <span className="font-bold text-emerald-600 block mb-0.5">장점 (Advantage)</span>
                              <p>{selectedCatalyst.pros}</p>
                            </div>
                            <div>
                              <span className="font-bold text-rose-600 block mb-0.5">한계 (Limitation)</span>
                              <p>{selectedCatalyst.cons}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Environment Controls: UV Switch & Flow rate slider */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                          <Gauge className="w-5 h-5 text-blue-600" />
                          촉매 반응 환경 미세 제어
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">SIMULATION PARAMETERS</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Control 1: UV Light Switch (Required for TiO2) */}
                        <div className="border border-slate-150 p-4 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs text-slate-400 font-mono block">PARAMETER 01</span>
                              <h5 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-purple-600" />
                                자외선(UV) 조사 장치
                              </h5>
                            </div>
                            {/* Switch input */}
                            <button 
                              onClick={() => {
                                setUvLight(!uvLight);
                                if (soundEnabled) playSynthesizedBubble();
                              }}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                uvLight ? 'bg-purple-600' : 'bg-slate-200'
                              }`}
                            >
                              <span 
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  uvLight ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                          
                          <p className="text-slate-500 text-xs leading-relaxed">
                            광분해 화학 처리를 위한 자외선 조사 스위치입니다. <strong className="text-purple-600">이산화티타늄 광촉매</strong> 가동 시 반드시 함께 결합해야 극대화된 산화력을 확보할 수 있습니다.
                          </p>

                          {selectedCatalyst?.id === 'tio2' && !uvLight && (
                            <div className="flex items-center gap-1.5 p-2 bg-amber-50 rounded text-amber-700 text-[11px] font-medium border border-amber-100 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>주의: 이산화티타늄은 UV를 켜지 않으면 분해 작용이 일어나지 않습니다!</span>
                            </div>
                          )}
                        </div>

                        {/* Control 2: Flow Rate Slider */}
                        <div className="border border-slate-150 p-4 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs text-slate-400 font-mono block">PARAMETER 02</span>
                              <h5 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                <Gauge className="w-4 h-4 text-blue-600" />
                                유입 폐수 흐름 속도 (Flow Rate)
                              </h5>
                            </div>
                            <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {flowRate} L/min
                            </span>
                          </div>

                          <div className="pt-2">
                            <input 
                              type="range" 
                              min="1" 
                              max="10" 
                              value={flowRate} 
                              onChange={(e) => setFlowRate(parseInt(e.target.value))}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                              <span>1 (초여과)</span>
                              <span className="text-blue-600 font-bold">3 ~ 4 (최적 구역)</span>
                              <span>10 (급여과)</span>
                            </div>
                          </div>

                          <p className="text-slate-500 text-xs leading-relaxed">
                            흐름 속도가 느릴수록 필터 내 흡착 및 촉매의 분해 처리 시간이 충분히 길어져 효율이 향상되며, 과도하게 빠를 시엔 접촉 시간이 너무 단축되어 정화율이 하락합니다.
                          </p>
                        </div>

                      </div>
                    </div>

                    {/* Simulation start footer action */}
                    <div className="flex justify-end pt-4">
                      <button 
                        onClick={handleStartSimulation}
                        disabled={!selectedCatalyst}
                        className={`px-12 py-4 rounded-xl font-headline-sm flex items-center gap-3 transition-all active:scale-95 shadow-lg ${
                          selectedCatalyst 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-xl' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Play className="w-5 h-5 fill-current" />
                        실시간 수질 정화 실험 시작하기
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* STEP 3: Real-Time Purifying Simulation */}
            {step === 3 && selectedScenario && selectedCatalyst && (
              <div className="space-y-8 py-8 max-w-4xl mx-auto animate-fade-in text-center">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold animate-pulse border border-blue-100">
                    <FlaskConical className="w-3.5 h-3.5" />
                    가상 반응 연산 및 수질 정제 시뮬레이터 구동 중
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">수질 물리/화학 정제 분석을 수행하는 중입니다</h2>
                  <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
                    실제 환경공학 물리 수질 공식을 바탕으로 기공 흡착, 라디칼 반응, 전하 기반 나노 여과 연산이 실시간 수행되고 있습니다. 비커 내부 색 변화를 확인하세요.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm">
                  
                  {/* Left: Dynamic Color-changing Beaker */}
                  <div className="md:col-span-5 flex flex-col items-center">
                    <div className="relative w-56 h-72 flex items-end justify-center">
                      
                      {/* Beaker body layout */}
                      <div className={`absolute inset-0 border-r-4 border-l-4 border-b-4 border-slate-300 rounded-b-3xl border-t-0 overflow-hidden bg-slate-50/20 shadow-inner ${
                        uvLight ? 'uv-glow' : ''
                      }`}>
                        
                        {/* Fluid rising and color-swapping */}
                        <div 
                          className="w-full absolute bottom-0 transition-all duration-300"
                          style={{ 
                            height: '80%', 
                            backgroundColor: getWaterColorStyle()
                          }}
                        >
                          {/* Liquid Surface Ripple effect */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-white/20 animate-pulse"></div>

                          {/* Bubble generator inside beaker representing reaction */}
                          {isSimulating && (
                            <div className="absolute inset-0 overflow-hidden">
                              <span className="bubble absolute bottom-2 left-[20%] w-2.5 h-2.5 rounded-full bg-white/30" style={{ animationDelay: '0.2s', animationDuration: '3s' }}></span>
                              <span className="bubble absolute bottom-4 left-[50%] w-1.5 h-1.5 rounded-full bg-white/40" style={{ animationDelay: '1.1s', animationDuration: '2.5s' }}></span>
                              <span className="bubble absolute bottom-1 left-[75%] w-2 h-2 rounded-full bg-white/25" style={{ animationDelay: '0.6s', animationDuration: '3.5s' }}></span>
                              <span className="bubble absolute bottom-6 left-[35%] w-3 h-3 rounded-full bg-white/20" style={{ animationDelay: '2.2s', animationDuration: '4s' }}></span>
                              <span className="bubble absolute bottom-2 left-[85%] w-1.5 h-1.5 rounded-full bg-white/30" style={{ animationDelay: '1.7s', animationDuration: '2.8s' }}></span>
                            </div>
                          )}
                        </div>

                        {/* Beaker Milliliter Ticks */}
                        <div className="absolute left-4 top-8 bottom-4 w-6 flex flex-col justify-between text-[9px] font-mono text-slate-400 border-r border-slate-200/50">
                          <span>500ml</span>
                          <span>400ml</span>
                          <span>300ml</span>
                          <span>200ml</span>
                          <span>100ml</span>
                        </div>
                      </div>

                      {/* Beaker Lip */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-60 h-4 border-x-4 border-t-4 border-slate-300 rounded-t-lg"></div>

                      {/* Neon UV Light Glow Bars on side */}
                      {uvLight && (
                        <div className="absolute -left-6 top-1/4 bottom-1/4 w-2 bg-purple-500 rounded-full uv-glow shadow-purple-500/50 flex flex-col justify-between items-center text-white text-[8px] font-mono py-2 font-bold">
                          <span>U</span><span>V</span>
                        </div>
                      )}
                      {uvLight && (
                        <div className="absolute -right-6 top-1/4 bottom-1/4 w-2 bg-purple-500 rounded-full uv-glow shadow-purple-500/50 flex flex-col justify-between items-center text-white text-[8px] font-mono py-2 font-bold">
                          <span>U</span><span>V</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-xs font-semibold">시료: {selectedScenario.name}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-xs font-semibold">필터: {selectedCatalyst.name}</span>
                    </div>
                  </div>

                  {/* Right: Real-time Live Counters & Progress Bars */}
                  <div className="md:col-span-7 space-y-6 text-left">
                    <div>
                      <div className="flex justify-between font-mono text-xs font-bold text-slate-400 mb-1">
                        <span>SIMULATION LOGGING PROCESS</span>
                        <span>{simulationProgress}% COMPLETE</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-100" style={{ width: `${simulationProgress}%` }}></div>
                      </div>
                    </div>

                    {/* Live Gauges */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1">
                        <TrendingDown className="w-4 h-4 text-blue-600" />
                        실시간 오염원 이온 검출 통계
                      </h4>

                      {/* Counter 1: Turbidity */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-semibold text-slate-600">액체 탁도 농도 (NTU/Turbidity)</span>
                          <span className="font-mono text-base font-bold text-blue-600">{currentTurbidity}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${currentTurbidity}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                          <span>초기: {selectedScenario.initialTurbidity}%</span>
                          <span>목표치 이하 안전선: &lt; 5%</span>
                        </div>
                      </div>

                      {/* Counter 2: Organic Chemistry */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-semibold text-slate-600">유기화합물 & 박테리아 (Organics)</span>
                          <span className="font-mono text-base font-bold text-blue-600">{currentOrganic}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${currentOrganic}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                          <span>초기: {selectedScenario.initialOrganic}%</span>
                          <span>목표치 이하 안전선: &lt; 5%</span>
                        </div>
                      </div>

                      {/* Counter 3: Heavy Metals */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-semibold text-slate-600">유해 고농도 중금속 이온 (Heavy Metals)</span>
                          <span className="font-mono text-base font-bold text-blue-600">{currentHeavyMetal}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${currentHeavyMetal}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                          <span>초기: {selectedScenario.initialHeavyMetal}%</span>
                          <span>식수 허용 기준선: &lt; 1%</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 4: Detailed Comprehensive Result Report */}
            {step === 4 && selectedScenario && selectedCatalyst && simulationResult && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Header */}
                <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400">SIMULATION EXPERIMENT COMPLETE</span>
                    <h2 className="text-2xl font-black text-slate-900 mt-1">최종 시뮬레이션 결과 리포트</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setStep(2);
                        setSimulationResult(null);
                      }}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors shadow-sm"
                    >
                      조건 수정 및 다시 세팅
                    </button>
                    <button 
                      onClick={resetExperiment}
                      className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      새 수질 실험 설계하기
                    </button>
                  </div>
                </div>

                {/* Score Summary Box (Asymmetrical Banner) */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                      simulationResult.statusGrade === 'A+' ? 'bg-emerald-50 text-emerald-600' :
                      simulationResult.statusGrade === 'B' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {simulationResult.statusGrade === 'A+' ? (
                        <CheckCircle className="w-8 h-8" />
                      ) : simulationResult.statusGrade === 'B' ? (
                        <AlertTriangle className="w-8 h-8" />
                      ) : (
                        <XCircle className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${simulationResult.badgeBg} ${simulationResult.badgeColor}`}>
                          종합 등급 {simulationResult.statusGrade}
                        </span>
                        <span className="text-xs font-mono text-slate-400">정화 효율: {simulationResult.efficiency}%</span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-800 mt-1 leading-tight">
                        {simulationResult.statusMessage}
                      </h3>
                    </div>
                  </div>

                  <div className="text-center bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">정화율 스코어</span>
                    <span className="text-3xl font-black font-mono text-blue-600">{simulationResult.efficiency}%</span>
                  </div>
                </div>

                {/* Grid for Graphs and Details */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Visual Dynamic Purification Chart */}
                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-blue-600" />
                        화학 오염원별 정량 변화 추이 (시작 vs 최종)
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">NTU / PPM COMPARATIVE CHART</span>
                    </div>

                    {/* Highly polished dynamic SVG Bar Graph for actual experiment data */}
                    <div className="space-y-6 py-4">
                      
                      {/* Stat 1: Turbidity comparison bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-500 font-semibold">
                          <span>액체 탁도 (Turbidity)</span>
                          <span className="font-mono text-slate-600">
                            초기: <strong className="text-slate-800">{selectedScenario.initialTurbidity}%</strong> → 최종: <strong className="text-blue-600">{simulationResult.finalTurbidity}%</strong>
                          </span>
                        </div>
                        <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden border border-slate-150">
                          {/* Initial value background bar */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-slate-300 opacity-30" 
                            style={{ width: `${selectedScenario.initialTurbidity}%` }}
                          ></div>
                          {/* Final value overlay bar */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-blue-500 rounded-r-md transition-all duration-700" 
                            style={{ width: `${simulationResult.finalTurbidity}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Stat 2: Organics comparison bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-500 font-semibold">
                          <span>유기화합물 & 세균 (Organics)</span>
                          <span className="font-mono text-slate-600">
                            초기: <strong className="text-slate-800">{selectedScenario.initialOrganic}%</strong> → 최종: <strong className="text-emerald-600">{simulationResult.finalOrganic}%</strong>
                          </span>
                        </div>
                        <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden border border-slate-150">
                          {/* Initial value background bar */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-slate-300 opacity-30" 
                            style={{ width: `${selectedScenario.initialOrganic}%` }}
                          ></div>
                          {/* Final value overlay bar */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-emerald-500 rounded-r-md transition-all duration-700" 
                            style={{ width: `${simulationResult.finalOrganic}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Stat 3: Heavy Metals comparison bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-500 font-semibold">
                          <span>유해 고농도 중금속 (Heavy Metals)</span>
                          <span className="font-mono text-slate-600">
                            초기: <strong className="text-slate-800">{selectedScenario.initialHeavyMetal}%</strong> → 최종: <strong className="text-amber-600">{simulationResult.finalHeavyMetal}%</strong>
                          </span>
                        </div>
                        <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden border border-slate-150">
                          {/* Initial value background bar */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-slate-300 opacity-30" 
                            style={{ width: `${selectedScenario.initialHeavyMetal}%` }}
                          ></div>
                          {/* Final value overlay bar */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-amber-500 rounded-r-md transition-all duration-700" 
                            style={{ width: `${simulationResult.finalHeavyMetal}%` }}
                          ></div>
                        </div>
                      </div>

                    </div>

                    <div className="flex items-center gap-2 p-3.5 bg-slate-50 rounded-xl text-slate-500 text-xs leading-relaxed border border-slate-100">
                      <Info className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        탁도는 정제 후 5% 이하, 유기물은 5% 이하, 중금속은 1% 미만 도달 시 최상의 무독성 용수 등급인 <strong className="text-emerald-600">A+ 등급</strong>을 획득합니다.
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Expert Academic Report Feedback */}
                  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <FileText className="w-4.5 h-4.5 text-blue-600" />
                          실험 공학 소견 보고서
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">LAB FEEDBACK</span>
                      </div>

                      <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                        {simulationResult.detailedNotes.map((note, index) => (
                          <div key={index} className="flex gap-2.5 items-start p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <p>{note}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 text-slate-400 text-[10px] font-mono flex items-center justify-between">
                      <span>NTP LAB MODULE 24.12</span>
                      <span>COMPLETED SUCCESSFULLY</span>
                    </div>
                  </div>

                </div>

                {/* Quick Interactive Beaker Visual Result Card */}
                <div className="bg-[#001e40] text-white p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-blue-900">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-20 flex items-end justify-center shrink-0">
                      <div className="absolute inset-0 border-r-2 border-l-2 border-b-2 border-white/40 rounded-b-xl border-t-0 bg-white/5">
                        <div 
                          className="w-full absolute bottom-0 transition-all duration-700 rounded-b-xl" 
                          style={{ 
                            height: '75%', 
                            backgroundColor: getWaterColorStyle()
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">가상 여과수 최종 육안 검사</h4>
                      <p className="text-xs text-sky-200 mt-1">오염도 통계 변화율에 비례하여 부유물 산란 상태와 색도가 실시간 시각 동기화되었습니다.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={resetExperiment}
                      className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-[#001e40] font-bold text-xs rounded-xl transition-colors shadow-sm"
                    >
                      새로운 세팅으로 재실험
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Bottom Navigation Bar (Mobile View) */}
      <nav className="sticky bottom-0 left-0 w-full z-40 bg-white border-t border-slate-200/80 shadow-[0px_-4px_12px_rgba(0,0,0,0.03)] flex justify-around py-2.5 md:hidden">
        <button 
          onClick={() => { setActiveTab('lab'); }}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${activeTab === 'lab' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <FlaskConical className="w-5 h-5" />
          <span>실험실</span>
        </button>
        <button 
          onClick={() => { setActiveTab('data'); }}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${activeTab === 'data' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <HistoryIcon className="w-5 h-5" />
          <span>기록 데이터</span>
        </button>
        <button 
          onClick={() => { setActiveTab('safety'); }}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${activeTab === 'safety' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <ShieldAlert className="w-5 h-5" />
          <span>안전수칙</span>
        </button>
      </nav>

      {/* Atmospheric lighting and depth particles */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-15%] w-1/3 h-1/3 bg-blue-400/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-15%] right-[-15%] w-1/3 h-1/3 bg-sky-300/25 blur-[120px] rounded-full"></div>
      </div>
    </div>
  );
}
