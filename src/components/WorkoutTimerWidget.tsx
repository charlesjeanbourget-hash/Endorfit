import React, { useState, useEffect, useRef } from 'react';
import { Clock, X, Play, Square, RotateCcw, Plus, Minus, Settings, Volume2, VolumeX } from 'lucide-react';

type TimerMode = 'stopwatch' | 'timer' | 'interval' | 'emom';

export const WorkoutTimerWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // Timer settings
  const [inputTime, setInputTime] = useState(60);
  
  // Interval settings (Tabata/HIIT)
  const [intervalWork, setIntervalWork] = useState(20);
  const [intervalRest, setIntervalRest] = useState(10);
  const [intervalRounds, setIntervalRounds] = useState(8);
  const [currentRound, setCurrentRound] = useState(1);
  const [intervalPhase, setIntervalPhase] = useState<'work' | 'rest' | 'prepare'>('prepare');
  
  // EMOM settings
  const [emomTotalMinutes, setEmomTotalMinutes] = useState(10);
  const [emomCurrentMinute, setEmomCurrentMinute] = useState(1);

  const playBeep = (type: 'short' | 'long' | 'end') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'short') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'long') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'end') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.4); // G5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setTime(prev => {
          if (mode === 'stopwatch') return prev + 1;
          if (mode === 'timer' || mode === 'interval' || mode === 'emom') {
            if (prev > 0) {
              if (prev <= 4 && prev > 1) playBeep('short');
              if (prev === 1) playBeep('long');
              return prev - 1;
            }
            return 0;
          }
          return prev;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, mode, soundEnabled]);

  useEffect(() => {
    if (!isActive) return;

    if (mode === 'timer' && time === 0) {
      setIsActive(false);
      playBeep('end');
    } else if (mode === 'interval' && time === 0) {
      if (intervalPhase === 'prepare') {
        setIntervalPhase('work');
        setTime(intervalWork);
      } else if (intervalPhase === 'work') {
        if (currentRound < intervalRounds) {
          setIntervalPhase('rest');
          setTime(intervalRest);
        } else {
          setIsActive(false);
          setIntervalPhase('prepare');
          setCurrentRound(1);
          setTime(10);
          playBeep('end');
        }
      } else if (intervalPhase === 'rest') {
        setCurrentRound(r => r + 1);
        setIntervalPhase('work');
        setTime(intervalWork);
      }
    } else if (mode === 'emom' && time === 0) {
      if (emomCurrentMinute < emomTotalMinutes) {
        setEmomCurrentMinute(m => m + 1);
        setTime(60);
      } else {
        setIsActive(false);
        setEmomCurrentMinute(1);
        setTime(60);
        playBeep('end');
      }
    }
  }, [time, isActive, mode, intervalPhase, currentRound, intervalRounds, intervalWork, intervalRest, emomCurrentMinute, emomTotalMinutes]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'timer') setTime(inputTime);
    else if (mode === 'interval') {
      setTime(10); // 10s prep time
      setIntervalPhase('prepare');
      setCurrentRound(1);
    }
    else if (mode === 'emom') {
      setTime(60);
      setEmomCurrentMinute(1);
    }
    else setTime(0);
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setShowSettings(false);
    if (newMode === 'stopwatch') setTime(0);
    else if (newMode === 'timer') setTime(inputTime);
    else if (newMode === 'interval') {
      setTime(10);
      setIntervalPhase('prepare');
      setCurrentRound(1);
    }
    else if (newMode === 'emom') {
      setTime(60);
      setEmomCurrentMinute(1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const adjustTime = (amount: number) => {
    if (isActive) return;
    const newTime = Math.max(10, inputTime + amount);
    setInputTime(newTime);
    setTime(newTime);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-4 sm:right-6 z-[150] bg-brand-teal text-slate-950 p-4 rounded-full shadow-[0_0_20px_rgba(124,6,32,0.4)] hover:bg-brand-teal/80 transition-all flex items-center gap-2"
      >
        <Clock size={24} />
        {isActive && <span className="font-bold tabular-nums">{formatTime(time)}</span>}
      </button>
    );
  }

  return (
    <div className="fixed bottom-28 right-4 sm:right-6 z-[150] bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl w-80 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1 bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar w-full mr-2">
          <button 
            onClick={() => changeMode('stopwatch')}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex-1 ${mode === 'stopwatch' ? 'bg-brand-teal text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            Chrono
          </button>
          <button 
            onClick={() => changeMode('timer')}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex-1 ${mode === 'timer' ? 'bg-brand-teal text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            Minuteur
          </button>
          <button 
            onClick={() => changeMode('interval')}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex-1 ${mode === 'interval' ? 'bg-brand-teal text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            Interval
          </button>
          <button 
            onClick={() => changeMode('emom')}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex-1 ${mode === 'emom' ? 'bg-brand-teal text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            EMOM
          </button>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white shrink-0">
          <X size={20} />
        </button>
      </div>

      <div className="flex justify-between items-center mb-2 px-2">
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-slate-400 hover:text-white transition-colors">
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        {(mode === 'timer' || mode === 'interval' || mode === 'emom') && !isActive && (
          <button onClick={() => setShowSettings(!showSettings)} className={`transition-colors ${showSettings ? 'text-brand-teal' : 'text-slate-400 hover:text-white'}`}>
            <Settings size={18} />
          </button>
        )}
      </div>

      {showSettings && !isActive ? (
        <div className="bg-slate-800/50 rounded-2xl p-4 mb-4 border border-white/5 space-y-4">
          {mode === 'timer' && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Durée (secondes)</label>
              <div className="flex items-center gap-3 justify-center">
                <button onClick={() => adjustTime(-10)} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 text-white"><Minus size={16} /></button>
                <span className="text-xl font-bold w-16 text-center">{inputTime}s</span>
                <button onClick={() => adjustTime(10)} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 text-white"><Plus size={16} /></button>
              </div>
              <div className="flex gap-2 justify-center mt-3 flex-wrap">
                {[30, 60, 90, 120, 300].map(secs => (
                  <button 
                    key={secs}
                    onClick={() => { setInputTime(secs); setTime(secs); }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${inputTime === secs ? 'bg-brand-teal/20 border-brand-teal text-brand-teal' : 'bg-slate-700 border-white/5 text-slate-300 hover:bg-slate-600'}`}
                  >
                    {secs >= 60 ? `${secs/60}m` : `${secs}s`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'interval' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400">Travail (s)</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIntervalWork(Math.max(5, intervalWork - 5))} className="p-1 bg-slate-700 rounded hover:bg-slate-600"><Minus size={14} /></button>
                  <span className="w-8 text-center font-bold text-sm">{intervalWork}</span>
                  <button onClick={() => setIntervalWork(intervalWork + 5)} className="p-1 bg-slate-700 rounded hover:bg-slate-600"><Plus size={14} /></button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400">Repos (s)</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIntervalRest(Math.max(5, intervalRest - 5))} className="p-1 bg-slate-700 rounded hover:bg-slate-600"><Minus size={14} /></button>
                  <span className="w-8 text-center font-bold text-sm">{intervalRest}</span>
                  <button onClick={() => setIntervalRest(intervalRest + 5)} className="p-1 bg-slate-700 rounded hover:bg-slate-600"><Plus size={14} /></button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400">Séries</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIntervalRounds(Math.max(1, intervalRounds - 1))} className="p-1 bg-slate-700 rounded hover:bg-slate-600"><Minus size={14} /></button>
                  <span className="w-8 text-center font-bold text-sm">{intervalRounds}</span>
                  <button onClick={() => setIntervalRounds(intervalRounds + 1)} className="p-1 bg-slate-700 rounded hover:bg-slate-600"><Plus size={14} /></button>
                </div>
              </div>
            </div>
          )}

          {mode === 'emom' && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Durée Totale (minutes)</label>
              <div className="flex items-center gap-3 justify-center">
                <button onClick={() => setEmomTotalMinutes(Math.max(1, emomTotalMinutes - 1))} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 text-white"><Minus size={16} /></button>
                <span className="text-xl font-bold w-16 text-center">{emomTotalMinutes}m</span>
                <button onClick={() => setEmomTotalMinutes(emomTotalMinutes + 1)} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 text-white"><Plus size={16} /></button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center mb-6 py-4">
          {mode === 'interval' && (
            <div className="mb-2">
              <span className={`text-sm font-bold uppercase tracking-widest ${intervalPhase === 'work' ? 'text-brand-teal' : intervalPhase === 'rest' ? 'text-brand-green' : 'text-yellow-500'}`}>
                {intervalPhase === 'work' ? 'Travail' : intervalPhase === 'rest' ? 'Repos' : 'Préparez-vous'}
              </span>
              <div className="text-xs text-slate-400 font-bold mt-1">
                Série {currentRound} / {intervalRounds}
              </div>
            </div>
          )}
          
          {mode === 'emom' && (
            <div className="mb-2">
              <span className="text-sm font-bold uppercase tracking-widest text-brand-teal">
                Minute {emomCurrentMinute} / {emomTotalMinutes}
              </span>
            </div>
          )}

          <div className={`text-6xl font-black tabular-nums tracking-tight ${
            mode === 'interval' ? 
              (intervalPhase === 'work' ? 'text-brand-teal' : intervalPhase === 'rest' ? 'text-brand-green' : 'text-yellow-500') 
            : 'text-white'
          }`}>
            {formatTime(time)}
          </div>
          
          {mode === 'stopwatch' && (
            <div className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-widest">Chronomètre</div>
          )}
          {mode === 'timer' && (
            <div className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-widest">Minuteur</div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button 
          onClick={toggleTimer}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
            isActive 
              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
              : 'bg-brand-teal text-slate-950 hover:bg-brand-teal/80'
          }`}
        >
          {isActive ? (
            <><Square size={18} fill="currentColor" /> Pause</>
          ) : (
            <><Play size={18} fill="currentColor" /> Démarrer</>
          )}
        </button>
        <button 
          onClick={resetTimer}
          className="px-4 py-3 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Réinitialiser"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
};
