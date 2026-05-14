import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { AuthContext } from '../contexts/AuthContext';
import LESSONS from '../data/lessons';

const LANGS = { en: '🇬🇧 English', hi: '🇮🇳 हिंदी', hg: '🇮🇳 Hinglish' };
const BOARD_THEME = { light: '#eeeed2', dark: '#769656' };
const STORAGE_KEY = 'chess-learn-progress';

function getProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveProgress(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

export default function Learn() {
  const { user } = useContext(AuthContext);
  const containerRef = useRef(null);
  const [lang, setLang] = useState(() => localStorage.getItem('chess-learn-lang') || 'en');
  const [activeLessonIdx, setActiveLessonIdx] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState('steps'); // 'steps' | 'challenge' | 'success'
  const [boardSize, setBoardSize] = useState(360);
  const [progress, setProgress] = useState(getProgress);
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('chess-onboarding-done'));

  useEffect(() => { localStorage.setItem('chess-learn-lang', lang); }, [lang]);

  // Board sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) { const w = e.contentRect.width; if (w > 0) setBoardSize(Math.min(Math.floor(w), 480)); }
    });
    ro.observe(containerRef.current);
    setBoardSize(Math.min(Math.floor(containerRef.current.offsetWidth), 480) || 360);
    return () => ro.disconnect();
  }, [activeLessonIdx]);

  const t = useCallback((obj) => obj?.[lang] || obj?.en || '', [lang]);

  const lesson = activeLessonIdx !== null ? LESSONS[activeLessonIdx] : null;
  const step = lesson && phase === 'steps' ? lesson.steps[stepIdx] : null;
  const challenge = lesson ? lesson.challenge : null;
  const totalSteps = lesson ? lesson.steps.length : 0;
  const completedCount = LESSONS.filter(l => progress[l.id]).length;
  const totalXP = completedCount * 50;

  // Current display FEN
  const displayFen = useMemo(() => {
    if (phase === 'steps' && step) return step.fen;
    if ((phase === 'challenge' || phase === 'success') && challenge) return challenge.fen;
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }, [phase, step, challenge]);

  // Highlight squares
  const highlightStyles = useMemo(() => {
    const styles = {};
    if (phase === 'steps' && step?.highlights) {
      step.highlights.forEach(sq => {
        styles[sq] = { backgroundColor: 'rgba(129, 182, 76, 0.45)', borderRadius: '0' };
      });
    }
    if ((phase === 'challenge') && showHint && challenge?.hints) {
      challenge.hints.forEach(sq => {
        styles[sq] = { background: 'radial-gradient(circle, rgba(245, 180, 60, 0.6) 25%, transparent 25%)', borderRadius: '0' };
      });
    }
    if (phase === 'success' && challenge?.solution) {
      styles[challenge.solution.from] = { backgroundColor: 'rgba(129, 182, 76, 0.5)' };
      styles[challenge.solution.to] = { backgroundColor: 'rgba(129, 182, 76, 0.5)' };
    }
    return styles;
  }, [phase, step, challenge, showHint]);

  // Challenge move handler
  const onDrop = useCallback((src, tgt) => {
    if (phase !== 'challenge' || !challenge) return false;
    const sol = challenge.solution;
    if (src === sol.from && tgt === sol.to) {
      setPhase('success');
      setFeedback('correct');
      // Mark completed
      const newProgress = { ...progress, [lesson.id]: true };
      setProgress(newProgress);
      saveProgress(newProgress);
      setTimeout(() => setFeedback(null), 2000);
      return true;
    }
    setFeedback('wrong');
    setTimeout(() => setFeedback(null), 1500);
    return false;
  }, [phase, challenge, lesson, progress]);

  const nextStep = () => {
    if (stepIdx < totalSteps - 1) setStepIdx(stepIdx + 1);
    else { setPhase('challenge'); setShowHint(false); }
  };
  const prevStep = () => { if (stepIdx > 0) setStepIdx(stepIdx - 1); };

  const openLesson = (idx) => {
    setActiveLessonIdx(idx); setStepIdx(0); setPhase('steps');
    setFeedback(null); setShowHint(false);
  };
  const closeLesson = () => { setActiveLessonIdx(null); setPhase('steps'); setStepIdx(0); };

  const nextLesson = () => {
    if (activeLessonIdx < LESSONS.length - 1) openLesson(activeLessonIdx + 1);
    else closeLesson();
  };

  // Onboarding
  if (showOnboarding) {
    return (
      <div className="w-full bg-hero flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-navy-800/60 border border-navy-700/30 rounded-2xl p-8 max-w-md w-full animate-scale-in text-center">
          <div className="text-5xl mb-4">♟️</div>
          <h2 className="text-xl font-black text-white mb-2">Welcome to Chess!</h2>
          <p className="text-sm text-slate-400 mb-6">Do you know how to play chess?</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => { localStorage.setItem('chess-onboarding-done', '1'); setShowOnboarding(false); }}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white hover:shadow-md hover:shadow-chess-green/15 transition-all">
              🎓 No, teach me!
            </button>
            <button onClick={() => { localStorage.setItem('chess-onboarding-done', '1'); setShowOnboarding(false); }}
              className="w-full py-3 rounded-xl text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all">
              ✅ Yes, I know chess
            </button>
          </div>
          {/* Language picker */}
          <div className="flex justify-center gap-2 mt-5">
            {Object.entries(LANGS).map(([code, label]) => (
              <button key={code} onClick={() => setLang(code)}
                className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${lang === code ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Lesson View
  if (lesson) {
    return (
      <div className="w-full bg-hero flex-1 px-3 py-4 md:px-6 md:py-6">
        <div className="max-w-3xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <button onClick={closeLesson} className="text-xs text-slate-400 hover:text-white transition-colors font-semibold">← Back</button>
            <div className="flex items-center gap-2">
              <span className="text-lg">{lesson.icon}</span>
              <h2 className="text-sm font-bold text-white">{t(lesson.title)}</h2>
            </div>
            <div className="flex gap-1">
              {Object.entries(LANGS).map(([code, label]) => (
                <button key={code} onClick={() => setLang(code)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${lang === code ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-600'}`}>
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-1.5 rounded-full bg-navy-700/50 overflow-hidden">
              <div className="h-full rounded-full bg-chess-green/60 transition-all duration-300"
                style={{ width: `${phase === 'steps' ? ((stepIdx + 1) / (totalSteps + 1)) * 100 : phase === 'challenge' ? (totalSteps / (totalSteps + 1)) * 100 : 100}%` }} />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {phase === 'steps' ? `${stepIdx + 1}/${totalSteps + 1}` : phase === 'challenge' ? 'Challenge' : '✓ Done'}
            </span>
          </div>

          {/* Info Steps */}
          {phase === 'steps' && step && (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <div className="bg-navy-800/30 rounded-xl p-4 w-full">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{t(step.text)}</p>
              </div>
              <div ref={containerRef} className="w-full max-w-[480px] aspect-square">
                <Chessboard position={step.fen} boardWidth={boardSize} boardOrientation="white"
                  arePiecesDraggable={false} customBoardStyle={{ borderRadius: '4px' }}
                  customDarkSquareStyle={{ backgroundColor: BOARD_THEME.dark }}
                  customLightSquareStyle={{ backgroundColor: BOARD_THEME.light }}
                  customSquareStyles={highlightStyles} animationDuration={300} />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={prevStep} disabled={stepIdx === 0}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${stepIdx === 0 ? 'bg-white/[0.02] text-slate-700 cursor-not-allowed' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                  ← Previous
                </button>
                <button onClick={nextStep}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-chess-green/15 text-chess-green hover:bg-chess-green/25 transition-all">
                  {stepIdx < totalSteps - 1 ? 'Next →' : '🎯 Try Challenge'}
                </button>
              </div>
            </div>
          )}

          {/* Challenge */}
          {phase === 'challenge' && challenge && (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-4 w-full">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🎯</span>
                  <h3 className="text-sm font-bold text-gold-400">Challenge</h3>
                </div>
                <p className="text-sm text-slate-200">{t(challenge.text)}</p>
              </div>
              <div ref={containerRef} className="w-full max-w-[480px] aspect-square relative">
                <Chessboard position={challenge.fen} boardWidth={boardSize} boardOrientation="white"
                  arePiecesDraggable={true} onPieceDrop={onDrop} customBoardStyle={{ borderRadius: '4px' }}
                  customDarkSquareStyle={{ backgroundColor: BOARD_THEME.dark }}
                  customLightSquareStyle={{ backgroundColor: BOARD_THEME.light }}
                  customSquareStyles={highlightStyles} animationDuration={200} />
              </div>
              {/* Feedback */}
              {feedback === 'wrong' && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold px-4 py-2 rounded-xl animate-slide-down">
                  ✗ Try again!
                </div>
              )}
              <div className="flex items-center gap-3">
                <button onClick={() => setShowHint(!showHint)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-all">
                  {showHint ? '🙈 Hide Hint' : '💡 Show Hint'}
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {phase === 'success' && (
            <div className="flex flex-col items-center gap-4 animate-scale-in text-center">
              <div className="text-5xl mb-1">🎉</div>
              <h3 className="text-xl font-black text-white">Correct!</h3>
              <p className="text-sm text-chess-green font-semibold">+50 XP</p>
              <div ref={containerRef} className="w-full max-w-[480px] aspect-square">
                <Chessboard position={(() => { try { const c = new Chess(challenge.fen); c.move({ from: challenge.solution.from, to: challenge.solution.to, promotion: 'q' }); return c.fen(); } catch { return challenge.fen; } })()}
                  boardWidth={boardSize} boardOrientation="white" arePiecesDraggable={false}
                  customBoardStyle={{ borderRadius: '4px' }}
                  customDarkSquareStyle={{ backgroundColor: BOARD_THEME.dark }}
                  customLightSquareStyle={{ backgroundColor: BOARD_THEME.light }}
                  customSquareStyles={highlightStyles} animationDuration={300} />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={closeLesson} className="px-5 py-2 rounded-xl text-xs font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all">
                  ← All Lessons
                </button>
                <button onClick={nextLesson} className="px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white hover:shadow-md hover:shadow-chess-green/15 transition-all">
                  {activeLessonIdx < LESSONS.length - 1 ? 'Next Lesson →' : '🏆 All Done!'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lesson List (Home)
  return (
    <div className="w-full bg-hero flex-1 px-4 py-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-white mb-1">Learn Chess</h1>
            <p className="text-xs text-slate-500">Master the basics in interactive lessons</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {Object.entries(LANGS).map(([code, label]) => (
                <button key={code} onClick={() => setLang(code)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${lang === code ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-navy-800/30 rounded-xl p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-chess-green/15 flex items-center justify-center text-xl font-black text-chess-green">
            {completedCount}
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400">Progress</p>
            <p className="text-sm font-bold text-white">{completedCount}/{LESSONS.length} lessons completed</p>
            <div className="mt-1.5 h-1.5 rounded-full bg-navy-700/50 overflow-hidden">
              <div className="h-full rounded-full bg-chess-green/60 transition-all duration-500"
                style={{ width: `${(completedCount / LESSONS.length) * 100}%` }} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-gold-400">{totalXP}</p>
            <p className="text-[9px] text-slate-500 font-semibold">XP</p>
          </div>
        </div>

        {/* Lesson Cards */}
        <div className="space-y-2.5">
          {LESSONS.map((lesson, idx) => {
            const done = progress[lesson.id];
            const isNext = !done && idx === LESSONS.findIndex(l => !progress[l.id]);
            return (
              <button key={lesson.id} onClick={() => openLesson(idx)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-left ${
                  done ? 'bg-chess-green/5 hover:bg-chess-green/10' : isNext ? 'bg-navy-800/40 hover:bg-navy-800/60 ring-1 ring-chess-green/30' : 'bg-navy-800/20 hover:bg-navy-800/40'
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                  done ? 'bg-chess-green/15' : isNext ? 'bg-gold-500/15' : 'bg-navy-700/30'
                }`}>
                  {done ? '✅' : lesson.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${done ? 'text-chess-green' : 'text-white'}`}>
                    {idx + 1}. {t(lesson.title)}
                  </p>
                  <p className="text-[10px] text-slate-500">{lesson.steps.length} steps + challenge</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {done && <span className="text-[9px] text-chess-green font-bold bg-chess-green/10 px-2 py-0.5 rounded-full">+50 XP</span>}
                  {isNext && <span className="text-[9px] text-gold-400 font-bold">START →</span>}
                  {!done && !isNext && <span className="text-[9px] text-slate-600">●</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
