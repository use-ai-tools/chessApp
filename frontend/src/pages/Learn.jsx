import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import LESSONS from '../data/lessons';

const LANGS = { en: 'EN', hi: 'हिं', hg: 'Hi' };
const BOARD_THEME = { light: '#eeeed2', dark: '#769656' };
const STORAGE_KEY = 'chess-learn-progress';
const ONBOARD_KEY = 'chess-onboarding-done';

function getProgress() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
function saveProgress(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

export default function Learn() {
  const navigate = useNavigate();
  const boardWrapRef = useRef(null);
  const [lang, setLang] = useState(() => localStorage.getItem('chess-learn-lang') || 'en');
  const [activeLessonIdx, setActiveLessonIdx] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState('steps'); // steps | challenge
  const [boardSize, setBoardSize] = useState(320);
  const [progress, setProgress] = useState(getProgress);
  const [toast, setToast] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [selectedSq, setSelectedSq] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARD_KEY));

  useEffect(() => { localStorage.setItem('chess-learn-lang', lang); }, [lang]);

  // Stable board size — measure on resize/orientation only
  useEffect(() => {
    const measure = () => {
      if (!boardWrapRef.current) return;
      const w = boardWrapRef.current.getBoundingClientRect().width;
      if (w > 0) setBoardSize(Math.floor(Math.min(w, 460)));
    };
    measure();
    let t;
    const debounced = () => { clearTimeout(t); t = setTimeout(measure, 100); };
    window.addEventListener('resize', debounced);
    window.addEventListener('orientationchange', debounced);
    return () => {
      window.removeEventListener('resize', debounced);
      window.removeEventListener('orientationchange', debounced);
      clearTimeout(t);
    };
  }, [activeLessonIdx]);

  const t = useCallback((obj) => obj?.[lang] || obj?.en || '', [lang]);
  const lesson = activeLessonIdx !== null ? LESSONS[activeLessonIdx] : null;
  const step = lesson && phase === 'steps' ? lesson.steps[stepIdx] : null;
  const challenge = lesson?.challenge;
  const totalSteps = lesson ? lesson.steps.length : 0;
  const completedCount = LESSONS.filter(l => progress[l.id]).length;

  const showSmallToast = (msg, ok = false) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 1500);
  };

  const displayFen = useMemo(() => {
    if (phase === 'steps' && step) return step.fen;
    if (phase === 'challenge' && challenge) return challenge.fen;
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }, [phase, step, challenge]);

  const squareStyles = useMemo(() => {
    const s = {};
    if (phase === 'steps' && step?.highlights) {
      step.highlights.forEach(sq => { s[sq] = { backgroundColor: 'rgba(129,182,76,0.4)' }; });
    }
    if (phase === 'challenge' && showHint && challenge?.hints) {
      challenge.hints.forEach(sq => { s[sq] = { background: 'radial-gradient(circle, rgba(245,180,60,0.6) 28%, transparent 28%)' }; });
    }
    if (phase === 'challenge' && selectedSq) {
      s[selectedSq] = { backgroundColor: 'rgba(255,255,100,0.5)' };
      if (challenge?.solution && selectedSq === challenge.solution.from) {
        s[challenge.solution.to] = { background: 'radial-gradient(circle, rgba(129,182,76,0.6) 28%, transparent 28%)' };
      }
    }
    return s;
  }, [phase, step, challenge, showHint, selectedSq]);

  const markLessonComplete = useCallback(() => {
    if (!lesson) return;
    const np = { ...progress, [lesson.id]: true };
    setProgress(np); saveProgress(np);
  }, [lesson, progress]);

  const onSquareClick = useCallback((sq) => {
    if (phase !== 'challenge' || !challenge) return;
    const sol = challenge.solution;
    if (!selectedSq) {
      if (sq === sol.from) setSelectedSq(sq);
      return;
    }
    if (selectedSq === sol.from && sq === sol.to) {
      setSelectedSq(null);
      markLessonComplete();
      showSmallToast('Correct ✓', true);
      setTimeout(() => nextLesson(), 1100);
      return;
    }
    if (sq === sol.from) { setSelectedSq(sq); return; }
    showSmallToast('Try again');
    setSelectedSq(null);
  }, [phase, challenge, selectedSq, markLessonComplete]);

  const onDrop = useCallback((src, tgt) => {
    if (phase !== 'challenge' || !challenge) return false;
    const sol = challenge.solution;
    if (src === sol.from && tgt === sol.to) {
      setSelectedSq(null);
      markLessonComplete();
      showSmallToast('Correct ✓', true);
      setTimeout(() => nextLesson(), 1100);
      return true;
    }
    showSmallToast('Try again');
    return false;
  }, [phase, challenge, markLessonComplete]);

  const nextStep = () => {
    if (stepIdx < totalSteps - 1) setStepIdx(stepIdx + 1);
    else { setPhase('challenge'); setShowHint(false); setSelectedSq(null); }
  };
  const prevStep = () => { if (stepIdx > 0) setStepIdx(stepIdx - 1); };

  const openLesson = (idx) => {
    setActiveLessonIdx(idx); setStepIdx(0); setPhase('steps');
    setToast(null); setShowHint(false); setSelectedSq(null);
  };
  const closeLesson = () => { setActiveLessonIdx(null); };
  const nextLesson = () => {
    if (activeLessonIdx !== null && activeLessonIdx < LESSONS.length - 1) openLesson(activeLessonIdx + 1);
    else closeLesson();
  };
  const skipLesson = () => { nextLesson(); };

  // ── Onboarding ──
  if (showOnboarding) {
    const completeOnboarding = (action) => {
      localStorage.setItem(ONBOARD_KEY, '1');
      setShowOnboarding(false);
      if (action === 'new') { openLesson(0); }
      else if (action === 'skip') { navigate('/'); }
      // 'basics' stays on Learn list
    };
    return (
      <div className="w-full bg-hero flex-1 flex items-center justify-center px-4 py-8 overflow-x-hidden">
        <div className="bg-navy-800/60 border border-navy-700/30 rounded-2xl p-6 max-w-sm w-full animate-scale-in text-center">
          <div className="text-4xl mb-3">♟️</div>
          <h2 className="text-lg font-black text-white mb-1">Welcome to Chess!</h2>
          <p className="text-xs text-slate-400 mb-5">Do you already know how to play chess?</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => completeOnboarding('new')}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white">
              🎓 I am new — Teach me
            </button>
            <button onClick={() => completeOnboarding('basics')}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10">
              ✅ I know the basics
            </button>
            <button onClick={() => completeOnboarding('skip')}
              className="w-full py-2 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-slate-300">
              Skip for now
            </button>
          </div>
          <div className="flex justify-center gap-1.5 mt-4">
            {Object.entries(LANGS).map(([c, l]) => (
              <button key={c} onClick={() => setLang(c)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold ${lang === c ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-600'}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Lesson View ──
  if (lesson) {
    const progressPct = phase === 'steps' ? ((stepIdx + 1) / (totalSteps + 1)) * 100 : 100;

    return (
      <div className="w-full bg-hero flex-1 flex flex-col overflow-x-hidden">
        <div className="max-w-lg mx-auto w-full flex flex-col flex-1 px-3 py-3 md:px-4">

          {/* Fixed-height top area — never pushes board */}
          <div className="flex-shrink-0" style={{ minHeight: '92px' }}>
            <div className="flex items-center justify-between mb-2">
              <button onClick={closeLesson} className="text-[11px] text-slate-400 hover:text-white transition-colors font-semibold">← Lessons</button>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{lesson.icon}</span>
                <span className="text-xs font-bold text-white truncate max-w-[140px]">{t(lesson.title)}</span>
              </div>
              <div className="flex gap-0.5">
                {Object.entries(LANGS).map(([c, l]) => (
                  <button key={c} onClick={() => setLang(c)}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${lang === c ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-600'}`}>{l}</button>
                ))}
              </div>
            </div>

            <div className="h-1 rounded-full bg-navy-700/40 overflow-hidden mb-2">
              <div className="h-full rounded-full bg-chess-green/60 transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="min-h-[52px] flex items-start bg-navy-800/30 border border-navy-700/20 rounded-lg px-3 py-2">
              {phase === 'steps' && step && (
                <p className="text-xs text-slate-200 leading-relaxed">{t(step.text)}</p>
              )}
              {phase === 'challenge' && (
                <div className="flex items-start gap-1.5 w-full">
                  <span className="text-xs mt-0.5">🎯</span>
                  <p className="text-xs text-gold-400 font-medium">{t(challenge.text)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Board — fixed aspect, never moves */}
          <div
            ref={boardWrapRef}
            className="w-full mx-auto mt-3 relative"
            style={{ aspectRatio: '1 / 1', maxWidth: '460px', touchAction: 'none', overflow: 'hidden' }}
          >
            <Chessboard
              position={displayFen}
              boardWidth={boardSize}
              boardOrientation="white"
              arePiecesDraggable={phase === 'challenge'}
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              customBoardStyle={{ borderRadius: '4px' }}
              customDarkSquareStyle={{ backgroundColor: BOARD_THEME.dark }}
              customLightSquareStyle={{ backgroundColor: BOARD_THEME.light }}
              customSquareStyles={squareStyles}
              animationDuration={200}
            />

            {/* Toast overlay on board — does not shift layout */}
            {toast && (
              <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-md text-[11px] font-bold shadow-lg ${
                toast.ok ? 'bg-emerald-500/90 text-white' : 'bg-red-500/85 text-white'
              } animate-fade-in`}>
                {toast.msg}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 mt-3 space-y-2">
            {phase === 'steps' && (
              <div className="flex items-center gap-2">
                <button onClick={prevStep} disabled={stepIdx === 0}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    stepIdx === 0 ? 'bg-white/[0.02] text-slate-700 cursor-not-allowed' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}>← Prev</button>
                <button onClick={nextStep}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-chess-green/15 text-chess-green hover:bg-chess-green/25 transition-all">
                  {stepIdx < totalSteps - 1 ? 'Next →' : '🎯 Try it'}
                </button>
              </div>
            )}
            {phase === 'challenge' && (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowHint(!showHint)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-all">
                  {showHint ? '🙈 Hide' : '💡 Hint'}
                </button>
                <button onClick={() => { setPhase('steps'); setStepIdx(0); setSelectedSq(null); }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-white/5 text-slate-400 hover:bg-white/10 transition-all">
                  ↩ Review
                </button>
                <button onClick={skipLesson}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-white/5 text-slate-400 hover:bg-white/10 transition-all">
                  Skip →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Lesson List ──
  return (
    <div className="w-full bg-hero flex-1 px-4 py-5 overflow-x-hidden">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-black text-white">Learn Chess</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Interactive lessons for all levels</p>
          </div>
          <div className="flex gap-1">
            {Object.entries(LANGS).map(([c, l]) => (
              <button key={c} onClick={() => setLang(c)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${lang === c ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500'}`}>{l}</button>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-navy-800/40 border border-navy-700/20 rounded-xl p-3 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-chess-green/15 flex items-center justify-center text-sm font-black text-chess-green flex-shrink-0">
            {completedCount}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-400">{completedCount}/{LESSONS.length} completed</p>
            <div className="mt-1 h-1 rounded-full bg-navy-700/50 overflow-hidden">
              <div className="h-full rounded-full bg-chess-green/60 transition-all" style={{ width: `${(completedCount / LESSONS.length) * 100}%` }} />
            </div>
          </div>
          <span className="text-sm font-black text-gold-400 flex-shrink-0">{completedCount * 50} XP</span>
        </div>

        {/* Lessons */}
        <div className="space-y-1.5">
          {LESSONS.map((les, idx) => {
            const done = progress[les.id];
            const isNext = !done && idx === LESSONS.findIndex(l => !progress[l.id]);
            return (
              <button key={les.id} onClick={() => openLesson(idx)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                  done ? 'bg-chess-green/5 hover:bg-chess-green/10' :
                  isNext ? 'bg-navy-800/50 hover:bg-navy-800/70 ring-1 ring-chess-green/20' :
                  'bg-navy-800/25 hover:bg-navy-800/40'
                }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                  done ? 'bg-chess-green/15' : isNext ? 'bg-gold-500/15' : 'bg-navy-700/30'
                }`}>{done ? '✅' : les.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${done ? 'text-chess-green' : 'text-white'}`}>{idx + 1}. {t(les.title)}</p>
                  <p className="text-[10px] text-slate-500">{les.steps.length} step{les.steps.length > 1 ? 's' : ''} + challenge</p>
                </div>
                {isNext && <span className="text-[10px] text-gold-400 font-bold flex-shrink-0">START →</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-5 text-center">
          <button onClick={() => navigate('/bot?difficulty=5')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white hover:shadow-md hover:shadow-chess-green/15 transition-all">
            🤖 Practice vs Beginner Bot
          </button>
        </div>
      </div>
    </div>
  );
}
