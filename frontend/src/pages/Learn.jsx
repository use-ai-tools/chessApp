import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { AuthContext } from '../contexts/AuthContext';
import LESSONS from '../data/lessons';

const LANGS = { en: 'EN', hi: 'हिं', hg: 'Hi' };
const BOARD_THEME = { light: '#eeeed2', dark: '#769656' };
const STORAGE_KEY = 'chess-learn-progress';

function getProgress() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
function saveProgress(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

export default function Learn() {
  const { user } = useContext(AuthContext);
  const containerRef = useRef(null);
  const [lang, setLang] = useState(() => localStorage.getItem('chess-learn-lang') || 'en');
  const [activeLessonIdx, setActiveLessonIdx] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState('steps'); // steps | challenge
  const [boardSize, setBoardSize] = useState(360);
  const [progress, setProgress] = useState(getProgress);
  const [toast, setToast] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [selectedSq, setSelectedSq] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('chess-onboarding-done'));

  useEffect(() => { localStorage.setItem('chess-learn-lang', lang); }, [lang]);

  // Board sizing
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      if (w > 0) setBoardSize(Math.min(Math.floor(w), 480));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [activeLessonIdx]);

  const t = useCallback((obj) => obj?.[lang] || obj?.en || '', [lang]);
  const lesson = activeLessonIdx !== null ? LESSONS[activeLessonIdx] : null;
  const step = lesson && phase === 'steps' ? lesson.steps[stepIdx] : null;
  const challenge = lesson?.challenge;
  const totalSteps = lesson ? lesson.steps.length : 0;
  const completedCount = LESSONS.filter(l => progress[l.id]).length;

  const showSmallToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 1800); };

  // Current FEN
  const displayFen = useMemo(() => {
    if (phase === 'steps' && step) return step.fen;
    if (phase === 'challenge' && challenge) return challenge.fen;
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }, [phase, step, challenge]);

  // Square styles
  const squareStyles = useMemo(() => {
    const s = {};
    // Step highlights
    if (phase === 'steps' && step?.highlights) {
      step.highlights.forEach(sq => { s[sq] = { backgroundColor: 'rgba(129,182,76,0.4)' }; });
    }
    // Challenge hints
    if (phase === 'challenge' && showHint && challenge?.hints) {
      challenge.hints.forEach(sq => { s[sq] = { background: 'radial-gradient(circle, rgba(245,180,60,0.6) 28%, transparent 28%)' }; });
    }
    // Selected square + legal moves
    if (phase === 'challenge' && selectedSq) {
      s[selectedSq] = { backgroundColor: 'rgba(255,255,100,0.5)' };
      // Show legal target
      if (challenge?.solution && selectedSq === challenge.solution.from) {
        s[challenge.solution.to] = { background: 'radial-gradient(circle, rgba(129,182,76,0.6) 28%, transparent 28%)' };
      }
    }
    return s;
  }, [phase, step, challenge, showHint, selectedSq]);

  // Tap-to-move handler
  const onSquareClick = useCallback((sq) => {
    if (phase !== 'challenge' || !challenge) return;
    const sol = challenge.solution;

    if (!selectedSq) {
      // Select piece
      if (sq === sol.from) setSelectedSq(sq);
      return;
    }

    // Second tap — attempt move
    if (selectedSq === sol.from && sq === sol.to) {
      // Correct!
      setSelectedSq(null);
      const np = { ...progress, [lesson.id]: true };
      setProgress(np); saveProgress(np);
      showSmallToast('Correct ✓');
      setTimeout(() => nextLesson(), 1200);
      return;
    }

    // Wrong tap
    if (sq === sol.from) { setSelectedSq(sq); return; }
    showSmallToast('Try again');
    setSelectedSq(null);
  }, [phase, challenge, selectedSq, lesson, progress]);

  // Drag-drop handler
  const onDrop = useCallback((src, tgt) => {
    if (phase !== 'challenge' || !challenge) return false;
    const sol = challenge.solution;
    if (src === sol.from && tgt === sol.to) {
      setSelectedSq(null);
      const np = { ...progress, [lesson.id]: true };
      setProgress(np); saveProgress(np);
      showSmallToast('Correct ✓');
      setTimeout(() => nextLesson(), 1200);
      return true;
    }
    showSmallToast('Try again');
    return false;
  }, [phase, challenge, lesson, progress]);

  const nextStep = () => {
    if (stepIdx < totalSteps - 1) { setStepIdx(stepIdx + 1); }
    else { setPhase('challenge'); setShowHint(false); setSelectedSq(null); }
  };
  const prevStep = () => { if (stepIdx > 0) setStepIdx(stepIdx - 1); };

  const openLesson = (idx) => {
    setActiveLessonIdx(idx); setStepIdx(0); setPhase('steps');
    setToast(null); setShowHint(false); setSelectedSq(null);
  };
  const closeLesson = () => { setActiveLessonIdx(null); };
  const nextLesson = () => {
    if (activeLessonIdx < LESSONS.length - 1) openLesson(activeLessonIdx + 1);
    else closeLesson();
  };

  // ── Onboarding ──
  if (showOnboarding) {
    return (
      <div className="w-full bg-hero flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-navy-800/60 border border-navy-700/30 rounded-2xl p-6 max-w-sm w-full animate-scale-in text-center">
          <div className="text-4xl mb-3">♟️</div>
          <h2 className="text-lg font-black text-white mb-1">Welcome to Chess!</h2>
          <p className="text-xs text-slate-400 mb-5">Do you know how to play?</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => { localStorage.setItem('chess-onboarding-done', '1'); setShowOnboarding(false); }}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white transition-all">
              🎓 Teach me
            </button>
            <button onClick={() => { localStorage.setItem('chess-onboarding-done', '1'); setShowOnboarding(false); }}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all">
              ✅ I know chess
            </button>
          </div>
          <div className="flex justify-center gap-1.5 mt-4">
            {Object.entries(LANGS).map(([c, l]) => (
              <button key={c} onClick={() => setLang(c)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${lang === c ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-600'}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Lesson View ──
  if (lesson) {
    const progressPct = phase === 'steps'
      ? ((stepIdx + 1) / (totalSteps + 1)) * 100
      : 100;

    return (
      <div className="w-full bg-hero flex-1 flex flex-col overflow-hidden">
        <div className="max-w-lg mx-auto w-full flex flex-col flex-1 px-3 py-3 md:px-4">

          {/* ── Fixed-height top section ── */}
          <div className="flex-shrink-0" style={{ minHeight: '90px' }}>
            {/* Header row */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={closeLesson} className="text-[10px] text-slate-500 hover:text-white transition-colors font-semibold">← Back</button>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{lesson.icon}</span>
                <span className="text-xs font-bold text-white">{t(lesson.title)}</span>
              </div>
              <div className="flex gap-0.5">
                {Object.entries(LANGS).map(([c, l]) => (
                  <button key={c} onClick={() => setLang(c)}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${lang === c ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-600'}`}>{l}</button>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 rounded-full bg-navy-700/40 overflow-hidden mb-2">
              <div className="h-full rounded-full bg-chess-green/60 transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>

            {/* Lesson text — fixed height container to prevent board shift */}
            <div className="min-h-[48px] flex items-start">
              {phase === 'steps' && step && (
                <p className="text-xs text-slate-300 leading-relaxed">{t(step.text)}</p>
              )}
              {phase === 'challenge' && (
                <div className="flex items-start gap-1.5">
                  <span className="text-xs">🎯</span>
                  <p className="text-xs text-gold-400 font-medium">{t(challenge.text)}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Board — NEVER MOVES ── */}
          <div ref={containerRef} className="w-full max-w-[480px] mx-auto aspect-square flex-shrink-0">
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
              animationDuration={250}
            />
          </div>

          {/* ── Fixed controls below board ── */}
          <div className="flex-shrink-0 mt-3 space-y-2">
            {phase === 'steps' && (
              <div className="flex items-center gap-2">
                <button onClick={prevStep} disabled={stepIdx === 0}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    stepIdx === 0 ? 'bg-white/[0.02] text-slate-700 cursor-not-allowed' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}>← Prev</button>
                <button onClick={nextStep}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-chess-green/15 text-chess-green hover:bg-chess-green/25 transition-all">
                  {stepIdx < totalSteps - 1 ? 'Next →' : '🎯 Challenge'}
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
                <button onClick={nextLesson}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-white/5 text-slate-400 hover:bg-white/10 transition-all">
                  Skip →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Small floating toast ── */}
        {toast && (
          <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-lg shadow-lg text-xs font-bold animate-slide-down ${
            toast.includes('✓') ? 'bg-emerald-500/90 text-white' : 'bg-red-500/80 text-white'
          }`}>
            {toast}
          </div>
        )}
      </div>
    );
  }

  // ── Lesson List ──
  return (
    <div className="w-full bg-hero flex-1 px-4 py-5">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-black text-white">Learn Chess</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Interactive lessons for beginners</p>
          </div>
          <div className="flex gap-1">
            {Object.entries(LANGS).map(([c, l]) => (
              <button key={c} onClick={() => setLang(c)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${lang === c ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500'}`}>{l}</button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-navy-800/30 rounded-xl p-3 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-chess-green/15 flex items-center justify-center text-sm font-black text-chess-green flex-shrink-0">
            {completedCount}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-500">{completedCount}/{LESSONS.length} completed</p>
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
                  done ? 'bg-chess-green/5 hover:bg-chess-green/10' : isNext ? 'bg-navy-800/40 hover:bg-navy-800/60 ring-1 ring-chess-green/20' : 'bg-navy-800/20 hover:bg-navy-800/30'
                }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                  done ? 'bg-chess-green/15' : isNext ? 'bg-gold-500/15' : 'bg-navy-700/30'
                }`}>{done ? '✅' : les.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${done ? 'text-chess-green' : 'text-white'}`}>{idx + 1}. {t(les.title)}</p>
                  <p className="text-[9px] text-slate-600">{les.steps.length} steps + challenge</p>
                </div>
                {isNext && <span className="text-[9px] text-gold-400 font-bold flex-shrink-0">START →</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
