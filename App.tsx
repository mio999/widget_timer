import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimerStatus, TimerPreset, MotivationResponse } from './types';
import { DEFAULT_PRESETS, ICON_MAP } from './constants';
import CircularTimer from './components/CircularTimer';
import PiPHandler from './components/PiPHandler';
import { audioService } from './services/audioService';
import { generateMotivation } from './services/geminiService';
import { Play, Pause, RotateCcw, X, ChevronRight, Sparkles, Battery, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<TimerStatus>(TimerStatus.IDLE);
  const [activePreset, setActivePreset] = useState<TimerPreset | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [motivation, setMotivation] = useState<MotivationResponse | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  // Check notification permission and URL params for Shortcuts
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    // Handle Android Shortcuts (Widget-like behavior)
    const params = new URLSearchParams(window.location.search);
    const startId = params.get('start');
    
    if (startId && status === TimerStatus.IDLE) {
      const preset = DEFAULT_PRESETS.find(p => p.id === startId);
      if (preset) {
        startTimer(preset);
        window.history.replaceState({}, document.title, "/");
      }
    }
  }, []);

  // Timer Loop
  useEffect(() => {
    if (status !== TimerStatus.RUNNING || !endTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((endTime - now) / 1000);

      if (diff <= 0) {
        handleComplete();
      } else {
        setTimeLeft(diff);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [status, endTime]);

  const startTimer = (preset: TimerPreset) => {
    audioService.playBeep();
    setActivePreset(preset);
    const durationMs = preset.durationSeconds * 1000;
    setEndTime(Date.now() + durationMs);
    setTimeLeft(preset.durationSeconds);
    setStatus(TimerStatus.RUNNING);
    setMotivation(null);
    setZenMode(false);
  };

  const pauseTimer = () => {
    if (status === TimerStatus.RUNNING) {
      setStatus(TimerStatus.PAUSED);
      setEndTime(null);
    }
  };

  const resumeTimer = () => {
    if (status === TimerStatus.PAUSED && activePreset) {
      setEndTime(Date.now() + timeLeft * 1000);
      setStatus(TimerStatus.RUNNING);
    }
  };

  const resetTimer = () => {
    setStatus(TimerStatus.IDLE);
    setActivePreset(null);
    setEndTime(null);
    setMotivation(null);
    setZenMode(false);
  };

  const handleComplete = useCallback(async () => {
    setStatus(TimerStatus.COMPLETED);
    setTimeLeft(0);
    setEndTime(null);
    setZenMode(false);
    audioService.playAlarm();

    if (Notification.permission === 'granted' && activePreset) {
      new Notification('Čas vypršal!', {
        body: `${activePreset.name} je hotový.`,
        icon: 'https://cdn-icons-png.flaticon.com/512/2921/2921226.png',
        vibrate: [200, 100, 200]
      } as any);
    }

    if (activePreset) {
      setIsLoadingAi(true);
      const result = await generateMotivation(activePreset.name, 'sk');
      setMotivation(result);
      setIsLoadingAi(false);
    }
  }, [activePreset]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    if (!activePreset) return 0;
    const total = activePreset.durationSeconds;
    const current = total - timeLeft;
    return current / total;
  };

  // --- RENDERERS ---

  const renderDashboard = () => (
    <div className="p-6 max-w-md mx-auto w-full animate-fade-in pb-20">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">OneTap Timer</h1>
        <p className="text-slate-400 text-sm mt-1">Vyber si widget a začni makať</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {DEFAULT_PRESETS.map((preset) => {
          const Icon = ICON_MAP[preset.icon] || Sparkles;
          return (
            <button
              key={preset.id}
              onClick={() => startTimer(preset)}
              className="bg-surface hover:bg-slate-700 active:scale-95 transition-all duration-200 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-start text-left group shadow-lg shadow-black/20"
            >
              <div className={`p-3 rounded-xl bg-slate-900 mb-3 ${preset.color} group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
              </div>
              <span className="font-semibold text-slate-200 block w-full truncate">{preset.name}</span>
              <span className="text-xs text-slate-500 font-mono mt-1">
                {Math.floor(preset.durationSeconds / 60)} min
              </span>
            </button>
          );
        })}
      </div>
      
      <div className="mt-12 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
             <Sparkles size={20} />
           </div>
           <div>
             <h3 className="text-sm font-semibold text-slate-200">Plávajúci Widget</h3>
             <p className="text-xs text-slate-400 mt-1">
               Po spustení časovača klikni na ikonu vpravo hore pre plávajúce okno.
             </p>
           </div>
        </div>
      </div>
    </div>
  );

  const renderActiveTimer = () => {
    if (!activePreset) return null;

    // Zen Mode Overlay
    if (zenMode) {
      return (
        <div 
          className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setZenMode(false)}
        >
          <div className="text-dark opacity-20 text-[20vw] font-bold font-mono select-none animate-pulse-slow">
            {formatTime(timeLeft)}
          </div>
          <div className="absolute bottom-10 text-neutral-800 text-sm flex items-center gap-2 animate-pulse">
            <Battery size={16} />
            OLED Šetrič · Ťukni pre návrat
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000" style={{ width: `${calculateProgress() * 100}%` }} />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen bg-dark relative overflow-hidden">
        {/* Top Bar */}
        <div className="p-4 flex justify-between items-center relative z-10">
          <button onClick={resetTimer} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full backdrop-blur-sm">
             <X size={24} />
          </button>
          
          <span className="text-sm font-mono text-slate-500 uppercase tracking-widest bg-slate-900/80 px-3 py-1 rounded-full">
            {status === TimerStatus.PAUSED ? 'PAUZOVANÉ' : 'BEŽÍ'}
          </span>

          <div className="flex gap-2">
            {/* Picture in Picture Button */}
            <PiPHandler 
              isActive={status === TimerStatus.RUNNING || status === TimerStatus.PAUSED}
              timeLeftFormatted={formatTime(timeLeft)}
              progress={calculateProgress()}
              taskName={activePreset.name}
            />
            
            {/* Zen Mode Button */}
            <button 
              onClick={() => setZenMode(true)} 
              className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full backdrop-blur-sm"
              title="Zen Mode (Šetrič)"
            >
               <Moon size={24} />
            </button>
          </div>
        </div>

        {/* Main Visual */}
        <div className="flex-1 flex items-center justify-center relative">
          <div className={`absolute w-64 h-64 rounded-full bg-primary blur-[120px] opacity-10 transition-opacity duration-1000 ${status === TimerStatus.PAUSED ? 'opacity-0' : ''}`} />
          
          <div className="scale-110 sm:scale-125 transition-transform duration-500">
            <CircularTimer 
              progress={calculateProgress()} 
              timeLeftFormatted={formatTime(timeLeft)}
              totalDuration={activePreset.durationSeconds}
              taskName={activePreset.name}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="p-8 pb-16 flex justify-center gap-8 items-center relative z-10">
          {status === TimerStatus.RUNNING ? (
             <button 
               onClick={pauseTimer}
               className="bg-surface text-white w-24 h-24 rounded-3xl flex items-center justify-center hover:bg-slate-700 transition-all border border-slate-600 active:scale-95 shadow-xl"
             >
               <Pause size={40} />
             </button>
          ) : (
             <button 
               onClick={resumeTimer}
               className="bg-primary text-white w-24 h-24 rounded-3xl flex items-center justify-center hover:bg-orange-600 transition-all shadow-2xl shadow-orange-900/40 active:scale-95"
             >
               <Play size={40} fill="currentColor" className="ml-2" />
             </button>
          )}
        </div>
      </div>
    );
  };

  const renderCompleted = () => (
    <div className="flex flex-col h-screen bg-dark items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
        <Sparkles size={48} />
      </div>
      
      <h2 className="text-4xl font-bold text-white mb-2">Hotovo!</h2>
      <p className="text-slate-400 text-lg mb-8">Časovač {activePreset?.name} skončil.</p>

      <div className="bg-surface border border-slate-700 p-6 rounded-2xl w-full max-w-sm mb-8 min-h-[160px] flex flex-col justify-center relative overflow-hidden shadow-xl">
        {isLoadingAi ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-500 animate-pulse">Gemini píše feedback...</span>
          </div>
        ) : (
          <div className="text-left">
             <p className="text-slate-200 text-lg font-medium leading-relaxed">
               "{motivation?.message}"
             </p>
             {motivation?.funFact && (
               <div className="mt-4 pt-4 border-t border-slate-700">
                 <span className="text-xs text-primary uppercase font-bold tracking-wider flex items-center gap-1">
                   <Sparkles size={12} />
                   Fact
                 </span>
                 <p className="text-slate-400 text-sm mt-1">{motivation.funFact}</p>
               </div>
             )}
          </div>
        )}
      </div>

      <div className="flex gap-4 w-full max-w-sm pb-8">
        <button 
          onClick={() => {
            if (activePreset) startTimer(activePreset);
          }}
          className="flex-1 bg-surface hover:bg-slate-700 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700"
        >
          <RotateCcw size={20} />
          Znova
        </button>
        <button 
          onClick={resetTimer}
          className="flex-1 bg-primary hover:bg-orange-600 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20"
        >
          Hotovo
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark text-white font-sans selection:bg-orange-500/30">
      {status === TimerStatus.IDLE && renderDashboard()}
      {(status === TimerStatus.RUNNING || status === TimerStatus.PAUSED) && renderActiveTimer()}
      {status === TimerStatus.COMPLETED && renderCompleted()}
    </div>
  );
};

export default App;
