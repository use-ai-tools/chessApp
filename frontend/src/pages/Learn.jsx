import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import LESSONS from '../data/lessons';

const LANGS = { hg: 'Hi-En', en: 'EN', hi: 'हिं' };
const BOARD_THEME = { light: '#eeeed2', dark: '#769656' };
const STORAGE_KEY = 'chess-learn-progress';
const ONBOARD_KEY = 'chess-onboarding-done';
const LANG_KEY = 'chess-learn-lang';

function getProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveProgress(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

// Lessons grouped by category
const PIECE_LESSONS = LESSONS.filter(l => l.category === 'piece');
const CONCEPT_LESSONS = LESSONS.filter(l => l.category === 'concept');

export default function Learn() {
  const navigate = useNavigate();
  const boardWrapRef = useRef(null);
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'hg');
  const [view, setView] = useState('dashboard'); // dashboard | piece-list | concept-list | lesson
  const [activeLessonIdx, setActiveLessonIdx] = useState(null);

  // Lesson player state
  const [phase, setPhase] = useState('intro'); // intro | summary | practice | puzzle | done
  const [introStep, setIntroStep] = useState(0);
  const [practiceStep, setPracticeStep] = useState(0);
  const [boardSize, setBoardSize] = useState(320);
  const [toast, setToast] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [selectedSq, setSelectedSq] = useState(null);
  const [legalDots, setLegalDots] = useState({});
  // moveFen: when a correct move is made, hold the post-move FEN briefly
  // so the user SEES the piece move before the next step advances.
  const [moveFen, setMoveFen] = useState(null);

  const [progress, setProgress] = useState(getProgress);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARD_KEY));

  useEffect(() => { localStorage.setItem(LANG_KEY, lang); }, [lang]);

  // ── Stable board sizing (window resize only) ──
  useEffect(() => {
    const measure = () => {
      if (!boardWrapRef.current) return;
      const w = boardWrapRef.current.getBoundingClientRect().width;
      if (w > 0) setBoardSize(prev => {
        const next = Math.floor(Math.min(w, 460));
        return Math.abs(prev - next) < 2 ? prev : next;
      });
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
  }, [view]);

  // ── Translate helper ──
  const t = useCallback((obj) => {
    if (!obj) return '';
    return obj[lang] || obj.hg || obj.en || obj.hi || '';
  }, [lang]);

  const lesson = activeLessonIdx !== null ? LESSONS[activeLessonIdx] : null;
  const introCount = lesson?.intro?.length || 0;
  const practiceCount = lesson?.practice?.length || 0;
  const hasSummary = !!lesson?.summary;
  const hasPuzzle = !!lesson?.puzzle;
  const completedCount = LESSONS.filter(l => progress[l.id]?.done).length;

  const showSmallToast = (msg, ok = false) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 1500);
  };

  // ── Compute display FEN + highlights for current phase ──
  const phaseData = useMemo(() => {
    if (!lesson) return { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', highlights: [] };
    if (phase === 'intro') {
      const s = lesson.intro[introStep];
      return { fen: s?.fen, highlights: s?.highlights || [] };
    }
    if (phase === 'summary') {
      const lastIntro = lesson.intro[lesson.intro.length - 1];
      return { fen: lastIntro?.fen, highlights: [] };
    }
    if (phase === 'practice') {
      const p = lesson.practice?.[practiceStep];
      return { fen: p?.fen, highlights: showHint && p ? [p.solutions[0].from, p.solutions[0].to] : [] };
    }
    if (phase === 'puzzle') {
      const p = lesson.puzzle;
      return { fen: p?.fen, highlights: showHint && p ? [p.solutions[0].from, p.solutions[0].to] : [] };
    }
    return { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', highlights: [] };
  }, [lesson, phase, introStep, practiceStep, showHint]);

  // Current interactive task (practice or puzzle)
  const currentTask = useMemo(() => {
    if (!lesson) return null;
    if (phase === 'practice') return lesson.practice?.[practiceStep] || null;
    if (phase === 'puzzle') return lesson.puzzle || null;
    return null;
  }, [lesson, phase, practiceStep]);

  // ── Board styles ──
  const squareStyles = useMemo(() => {
    const s = {};
    // Phase highlights (intro demo)
    phaseData.highlights?.forEach(sq => {
      s[sq] = { backgroundColor: 'rgba(129,182,76,0.35)' };
    });
    // Selected square + legal dots (for interactive phases)
    if (selectedSq && (phase === 'practice' || phase === 'puzzle')) {
      s[selectedSq] = { backgroundColor: 'rgba(246, 246, 105, 0.5)' };
      Object.entries(legalDots).forEach(([sq, style]) => { s[sq] = style; });
    }
    // Hint highlight (over phase highlights for visibility)
    if (showHint && currentTask) {
      const from = currentTask.solutions[0].from;
      const to = currentTask.solutions[0].to;
      s[from] = { backgroundColor: 'rgba(245,180,60,0.45)' };
      s[to] = { background: 'radial-gradient(circle, rgba(245,180,60,0.7) 30%, transparent 30%)' };
    }
    return s;
  }, [phaseData, selectedSq, legalDots, showHint, currentTask, phase]);

  // ── Move validation (used by practice + puzzle) ──
  const tryMove = useCallback((from, to) => {
    if (!currentTask) return false;
    const matched = currentTask.solutions.find(s => s.from === from && s.to === to);
    if (matched) {
      // Apply the move via chess.js so the board actually animates the piece.
      // Use the matched solution's promotion if specified, else default to queen.
      let newFen = null;
      try {
        const chess = new Chess(currentTask.fen);
        const promotion = matched.promotion || 'q';
        const m = chess.move({ from, to, promotion });
        if (m) newFen = chess.fen();
      } catch {}
      if (newFen) setMoveFen(newFen);

      showSmallToast(lang === 'hi' ? 'सही ✓' : lang === 'en' ? 'Correct ✓' : 'Sahi ✓', true);
      setSelectedSq(null);
      setLegalDots({});

      // Advance after delay — long enough to see the piece on its new square
      setTimeout(() => {
        setMoveFen(null);
        if (phase === 'practice') {
          if (practiceStep + 1 < practiceCount) {
            setPracticeStep(practiceStep + 1);
            setShowHint(false);
          } else if (hasPuzzle) {
            setPhase('puzzle');
            setShowHint(false);
          } else {
            finishLesson();
          }
        } else if (phase === 'puzzle') {
          finishLesson();
        }
      }, 1100);
      return true;
    } else {
      showSmallToast(lang === 'hi' ? 'फिर कोशिश' : lang === 'en' ? 'Try again' : 'Try again');
      setSelectedSq(null);
      setLegalDots({});
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTask, phase, practiceStep, practiceCount, hasPuzzle, lang]);

  // ── Click-to-move ──
  const onSquareClick = useCallback((sq) => {
    if (phase !== 'practice' && phase !== 'puzzle') return;
    if (!currentTask) return;
    if (moveFen) return; // lock during post-move animation
    // Try via chess.js to validate legality + capture preview
    let chess;
    try { chess = new Chess(currentTask.fen); } catch { return; }

    if (!selectedSq) {
      const piece = chess.get(sq);
      if (!piece || piece.color !== chess.turn()) return;
      setSelectedSq(sq);
      // Compute legal targets for visual dots
      const moves = chess.moves({ square: sq, verbose: true });
      const dots = {};
      moves.forEach(m => {
        dots[m.to] = m.captured
          ? { background: 'radial-gradient(circle, transparent 55%, rgba(0,0,0,0.25) 55%)' }
          : { background: 'radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 25%)' };
      });
      setLegalDots(dots);
      return;
    }

    // Already have selected source. If user clicks the same → deselect.
    if (sq === selectedSq) {
      setSelectedSq(null);
      setLegalDots({});
      return;
    }
    // If user clicks another own piece → switch selection
    const piece = chess.get(sq);
    if (piece && piece.color === chess.turn()) {
      setSelectedSq(sq);
      const moves = chess.moves({ square: sq, verbose: true });
      const dots = {};
      moves.forEach(m => {
        dots[m.to] = m.captured
          ? { background: 'radial-gradient(circle, transparent 55%, rgba(0,0,0,0.25) 55%)' }
          : { background: 'radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 25%)' };
      });
      setLegalDots(dots);
      return;
    }

    // Attempt the move
    tryMove(selectedSq, sq);
  }, [phase, currentTask, selectedSq, tryMove, moveFen]);

  const onDrop = useCallback((src, tgt) => {
    if (phase !== 'practice' && phase !== 'puzzle') return false;
    if (moveFen) return false; // lock during post-move animation
    if (!currentTask) return false;
    return tryMove(src, tgt);
  }, [phase, currentTask, tryMove, moveFen]);

  // ── Navigation ──
  const finishLesson = () => {
    if (!lesson) return;
    const np = { ...progress, [lesson.id]: { done: true, ts: Date.now() } };
    setProgress(np);
    saveProgress(np);
    setPhase('done');
  };

  const openLesson = (idx) => {
    setActiveLessonIdx(idx);
    setView('lesson');
    setPhase('intro');
    setIntroStep(0);
    setPracticeStep(0);
    setShowHint(false);
    setSelectedSq(null);
    setLegalDots({});
    setToast(null);
    setMoveFen(null);
    // Record current lesson for "Continue Learning"
    const np = { ...progress, _current: idx };
    setProgress(np);
    saveProgress(np);
  };

  const closeLesson = () => {
    setView('dashboard');
    setActiveLessonIdx(null);
    setPhase('intro');
    setIntroStep(0);
    setPracticeStep(0);
    setShowHint(false);
    setSelectedSq(null);
    setLegalDots({});
  };

  const nextLesson = () => {
    if (activeLessonIdx !== null && activeLessonIdx < LESSONS.length - 1) {
      openLesson(activeLessonIdx + 1);
    } else {
      closeLesson();
    }
  };

  const handleNextPhase = () => {
    setShowHint(false);
    setSelectedSq(null);
    setLegalDots({});
    setMoveFen(null);
    if (phase === 'intro') {
      if (introStep + 1 < introCount) { setIntroStep(introStep + 1); return; }
      // End of intro → summary if exists, else practice
      if (hasSummary) { setPhase('summary'); return; }
      if (practiceCount > 0) { setPhase('practice'); setPracticeStep(0); return; }
      if (hasPuzzle) { setPhase('puzzle'); return; }
      finishLesson();
    } else if (phase === 'summary') {
      if (practiceCount > 0) { setPhase('practice'); setPracticeStep(0); return; }
      if (hasPuzzle) { setPhase('puzzle'); return; }
      finishLesson();
    } else if (phase === 'practice') {
      if (practiceStep + 1 < practiceCount) { setPracticeStep(practiceStep + 1); return; }
      if (hasPuzzle) { setPhase('puzzle'); return; }
      finishLesson();
    } else if (phase === 'puzzle') {
      finishLesson();
    }
  };

  const handlePrevPhase = () => {
    setShowHint(false);
    setSelectedSq(null);
    setLegalDots({});
    setMoveFen(null);
    if (phase === 'intro') {
      if (introStep > 0) setIntroStep(introStep - 1);
      return;
    }
    if (phase === 'summary') { setPhase('intro'); setIntroStep(introCount - 1); return; }
    if (phase === 'practice') {
      if (practiceStep > 0) { setPracticeStep(practiceStep - 1); return; }
      if (hasSummary) { setPhase('summary'); return; }
      setPhase('intro'); setIntroStep(introCount - 1);
      return;
    }
    if (phase === 'puzzle') {
      if (practiceCount > 0) { setPhase('practice'); setPracticeStep(practiceCount - 1); return; }
      if (hasSummary) { setPhase('summary'); return; }
      setPhase('intro'); setIntroStep(introCount - 1);
    }
  };

  // Skip = treat as completed and move on
  const skipLesson = () => { finishLesson(); };

  // ── Onboarding ──
  if (showOnboarding) {
    const completeOnboarding = (action) => {
      localStorage.setItem(ONBOARD_KEY, '1');
      setShowOnboarding(false);
      if (action === 'new') openLesson(0);
      else if (action === 'skip') navigate('/');
    };
    return (
      <div className="w-full bg-hero flex-1 flex items-center justify-center px-4 py-8 overflow-x-hidden">
        <div className="bg-navy-800/60 border border-navy-700/30 rounded-2xl p-6 max-w-sm w-full animate-scale-in text-center">
          <div className="text-4xl mb-3">♟️</div>
          <h2 className="text-lg font-black text-white mb-1">
            {lang === 'hi' ? 'चेस आर्ज़ीना में आपका स्वागत है!' : lang === 'en' ? 'Welcome to Chess!' : 'Welcome to ChessArena!'}
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            {lang === 'hi' ? 'क्या आप शतरंज जानते हैं?' : lang === 'en' ? 'Do you already know how to play?' : 'Chess khelna aata hai?'}
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={() => completeOnboarding('new')}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white">
              🎓 {lang === 'hi' ? 'मुझे सिखाओ' : lang === 'en' ? 'I am new — teach me' : 'Mujhe sikhao'}
            </button>
            <button onClick={() => completeOnboarding('basics')}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10">
              ✅ {lang === 'hi' ? 'मुझे आता है' : lang === 'en' ? 'I know the basics' : 'Basics aate hain'}
            </button>
            <button onClick={() => completeOnboarding('skip')}
              className="w-full py-2 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-slate-300">
              {lang === 'hi' ? 'अभी छोड़ो' : lang === 'en' ? 'Skip for now' : 'Skip for now'}
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
  if (view === 'lesson' && lesson) {
    const totalPhases = 1 + (hasSummary ? 1 : 0) + (practiceCount > 0 ? 1 : 0) + (hasPuzzle ? 1 : 0);
    let phaseIdx = 0;
    if (phase === 'summary') phaseIdx = 1;
    else if (phase === 'practice') phaseIdx = 1 + (hasSummary ? 1 : 0);
    else if (phase === 'puzzle') phaseIdx = totalPhases - 1;
    else if (phase === 'done') phaseIdx = totalPhases;
    const phaseSubProgress = phase === 'intro' ? (introStep + 1) / introCount :
      phase === 'practice' ? (practiceStep + 1) / Math.max(practiceCount, 1) : 1;
    const overallPct = Math.min(100, ((phaseIdx + phaseSubProgress) / totalPhases) * 100);

    const phaseLabel = phase === 'intro'
        ? (lang === 'hi' ? 'सीखो' : lang === 'en' ? 'Learn' : 'Seekho')
      : phase === 'summary'
        ? (lang === 'hi' ? 'सारांश' : lang === 'en' ? 'Summary' : 'Summary')
      : phase === 'practice'
        ? (lang === 'hi' ? 'अभ्यास' : lang === 'en' ? 'Practice' : 'Practice')
      : phase === 'puzzle'
        ? (lang === 'hi' ? 'मिनी पहेली' : lang === 'en' ? 'Mini Puzzle' : 'Mini Puzzle')
        : (lang === 'hi' ? 'पूरा' : 'Done');

    return (
      <div className="w-full bg-hero flex-1 flex flex-col overflow-x-hidden">
        <div className="max-w-lg mx-auto w-full flex flex-col flex-1 px-3 py-3 md:px-4">

          {/* Fixed-height top: header + progress + text card */}
          <div className="flex-shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={closeLesson} className="text-[11px] text-slate-400 hover:text-white font-semibold">← {lang === 'hi' ? 'पाठ' : 'Lessons'}</button>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{lesson.icon}</span>
                <span className="text-xs font-bold text-white truncate max-w-[160px]">{t(lesson.title)}</span>
              </div>
              <div className="flex gap-0.5">
                {Object.entries(LANGS).map(([c, l]) => (
                  <button key={c} onClick={() => setLang(c)}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${lang === c ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-600'}`}>{l}</button>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 rounded-full bg-navy-700/40 overflow-hidden mb-1">
              <div className="h-full rounded-full bg-chess-green/60 transition-all duration-300" style={{ width: `${overallPct}%` }} />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{phaseLabel}</span>
              {phase === 'intro' && <span className="text-[9px] text-slate-600">{introStep + 1} / {introCount}</span>}
              {phase === 'practice' && <span className="text-[9px] text-slate-600">{practiceStep + 1} / {practiceCount}</span>}
            </div>

            {/* Fixed-height text card — does NOT push board */}
            <div className="min-h-[68px] flex items-start bg-navy-800/40 border border-navy-700/20 rounded-lg px-3 py-2">
              {phase === 'intro' && (
                <p className="text-xs text-slate-200 leading-relaxed">{t(lesson.intro[introStep]?.text)}</p>
              )}
              {phase === 'summary' && lesson.summary && (
                <div className="w-full grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                  <SummaryRow icon="↗" label={lang === 'hi' ? 'चाल' : 'Move'} text={t(lesson.summary.movement)} />
                  <SummaryRow icon="⚔️" label={lang === 'hi' ? 'मार' : 'Capture'} text={t(lesson.summary.capture)} />
                  <SummaryRow icon="💪" label={lang === 'hi' ? 'ताकत' : 'Strong'} text={t(lesson.summary.strong)} />
                  <SummaryRow icon="⚠️" label={lang === 'hi' ? 'कमज़ोरी' : 'Weak'} text={t(lesson.summary.weak)} />
                  <SummaryRow icon="💡" label="Tip" text={t(lesson.summary.tip)} />
                  <SummaryRow icon="❌" label={lang === 'hi' ? 'गलती' : 'Mistake'} text={t(lesson.summary.mistake)} />
                </div>
              )}
              {phase === 'practice' && currentTask && (
                <div className="flex items-start gap-1.5 w-full">
                  <span className="text-xs mt-0.5">🎯</span>
                  <p className="text-xs text-chess-green font-medium">{t(currentTask.task)}</p>
                </div>
              )}
              {phase === 'puzzle' && currentTask && (
                <div className="flex items-start gap-1.5 w-full">
                  <span className="text-xs mt-0.5">🧩</span>
                  <p className="text-xs text-gold-400 font-medium">{t(currentTask.task)}</p>
                </div>
              )}
              {phase === 'done' && (
                <div className="w-full text-center">
                  <p className="text-xs text-chess-green font-bold">
                    {lang === 'hi' ? '✅ पाठ पूरा हुआ!' : lang === 'en' ? '✅ Lesson complete!' : '✅ Lesson complete!'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Board — fixed aspect, never shifts */}
          <div
            ref={boardWrapRef}
            className="w-full mx-auto mt-3 relative"
            style={{ aspectRatio: '1 / 1', maxWidth: '460px', touchAction: 'none', overflow: 'hidden' }}
          >
            <Chessboard
              position={moveFen || phaseData.fen}
              boardWidth={boardSize}
              boardOrientation="white"
              arePiecesDraggable={(phase === 'practice' || phase === 'puzzle') && !moveFen}
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              customBoardStyle={{ borderRadius: '4px' }}
              customDarkSquareStyle={{ backgroundColor: BOARD_THEME.dark }}
              customLightSquareStyle={{ backgroundColor: BOARD_THEME.light }}
              customSquareStyles={squareStyles}
              animationDuration={180}
            />

            {/* Toast overlay on board */}
            {toast && (
              <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-md text-[11px] font-bold shadow-lg ${
                toast.ok ? 'bg-emerald-500/90 text-white' : 'bg-red-500/85 text-white'
              } animate-fade-in`}>
                {toast.msg}
              </div>
            )}

            {/* Done overlay */}
            {phase === 'done' && (
              <div className="absolute inset-0 bg-black/55 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-fade-in">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-white font-black text-base mb-3">{lang === 'hi' ? 'बहुत बढ़िया!' : 'Great work!'}</p>
                <div className="flex gap-2">
                  <button onClick={closeLesson} className="px-4 py-2 rounded-lg text-xs font-bold bg-white/10 text-slate-200 hover:bg-white/15">
                    {lang === 'hi' ? 'सभी पाठ' : 'Lessons'}
                  </button>
                  <button onClick={nextLesson} className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white">
                    {lang === 'hi' ? 'अगला पाठ' : 'Next lesson'} →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 mt-3 space-y-2">
            {phase !== 'done' && (
              <div className="flex items-center gap-2">
                <button onClick={handlePrevPhase}
                  disabled={phase === 'intro' && introStep === 0}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    (phase === 'intro' && introStep === 0) ? 'bg-white/[0.02] text-slate-700 cursor-not-allowed' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}>← {lang === 'hi' ? 'पीछे' : 'Prev'}</button>

                {(phase === 'practice' || phase === 'puzzle') && (
                  <button onClick={() => setShowHint(h => !h)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-all">
                    {showHint ? '🙈' : '💡'} {lang === 'hi' ? 'हिंट' : 'Hint'}
                  </button>
                )}

                {(phase === 'intro' || phase === 'summary') && (
                  <button onClick={handleNextPhase}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-chess-green/15 text-chess-green hover:bg-chess-green/25 transition-all">
                    {phase === 'intro' && introStep < introCount - 1
                      ? (lang === 'hi' ? 'आगे' : 'Next') + ' →'
                      : practiceCount > 0
                        ? '🎯 ' + (lang === 'hi' ? 'अभ्यास' : 'Practice')
                        : hasPuzzle
                          ? '🧩 ' + (lang === 'hi' ? 'पहेली' : 'Puzzle')
                          : '✓'}
                  </button>
                )}

                {(phase === 'practice' || phase === 'puzzle') && (
                  <button onClick={skipLesson}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-white/5 text-slate-400 hover:bg-white/10 transition-all">
                    {lang === 'hi' ? 'छोड़ो' : 'Skip'} →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Piece List View ──
  if (view === 'piece-list') {
    return (
      <LessonList
        title={lang === 'hi' ? 'मोहरे' : 'Piece Lessons'}
        subtitle={lang === 'hi' ? 'हर मोहरा सीखो' : 'Learn each piece'}
        lessons={PIECE_LESSONS}
        progress={progress}
        lang={lang}
        setLang={setLang}
        t={t}
        onOpen={(les) => openLesson(LESSONS.indexOf(les))}
        onBack={() => setView('dashboard')}
      />
    );
  }

  // ── Concept List View ──
  if (view === 'concept-list') {
    return (
      <LessonList
        title={lang === 'hi' ? 'कान्सेप्ट' : 'Concepts'}
        subtitle={lang === 'hi' ? 'शतरंज के नियम और चालें' : 'Rules and tactics'}
        lessons={CONCEPT_LESSONS}
        progress={progress}
        lang={lang}
        setLang={setLang}
        t={t}
        onOpen={(les) => openLesson(LESSONS.indexOf(les))}
        onBack={() => setView('dashboard')}
      />
    );
  }

  // ── Dashboard (default view) ──
  const currentIdx = typeof progress._current === 'number' ? progress._current : null;
  const nextUnfinished = LESSONS.findIndex(l => !progress[l.id]?.done);
  const startIdx = nextUnfinished >= 0 ? nextUnfinished : 0;

  return (
    <div className="w-full bg-hero flex-1 px-4 py-5 overflow-x-hidden">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-black text-white">{lang === 'hi' ? 'शतरंज सीखो' : 'Learn Chess'}</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'hi' ? 'मोहरा-दर-मोहरा सीखो' : lang === 'en' ? 'Master chess piece by piece' : 'Piece by piece sikho — interactive lessons.'}
            </p>
          </div>
          <div className="flex gap-1">
            {Object.entries(LANGS).map(([c, l]) => (
              <button key={c} onClick={() => setLang(c)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${lang === c ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500'}`}>{l}</button>
            ))}
          </div>
        </div>

        {/* Progress card */}
        <div className="bg-navy-800/40 border border-navy-700/20 rounded-xl p-3 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-chess-green/15 flex items-center justify-center text-sm font-black text-chess-green flex-shrink-0">
            {completedCount}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-400">{completedCount}/{LESSONS.length} {lang === 'hi' ? 'पूरे' : 'completed'}</p>
            <div className="mt-1 h-1 rounded-full bg-navy-700/50 overflow-hidden">
              <div className="h-full rounded-full bg-chess-green/60 transition-all" style={{ width: `${(completedCount / LESSONS.length) * 100}%` }} />
            </div>
          </div>
          <span className="text-sm font-black text-gold-400 flex-shrink-0">{completedCount * 50} XP</span>
        </div>

        {/* Big primary actions */}
        <div className="space-y-2 mb-4">
          {/* Start Beginner Course */}
          <button onClick={() => openLesson(startIdx)}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-chess-green/15 to-emerald-600/10 border border-chess-green/20 text-left hover:from-chess-green/20 hover:to-emerald-600/15 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-chess-green/20 flex items-center justify-center text-lg flex-shrink-0">🚀</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white">{lang === 'hi' ? 'शुरू से शुरू करो' : lang === 'en' ? 'Start Beginner Course' : 'Beginner Course Shuru karo'}</p>
                <p className="text-[10px] text-slate-400 truncate">{nextUnfinished >= 0 ? t(LESSONS[startIdx].title) : (lang === 'hi' ? 'सब पूरे' : 'All done!')}</p>
              </div>
              <span className="text-chess-green group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </button>

          {/* Continue Learning */}
          {currentIdx !== null && currentIdx < LESSONS.length && !progress[LESSONS[currentIdx]?.id]?.done && (
            <button onClick={() => openLesson(currentIdx)}
              className="w-full p-3 rounded-xl bg-navy-800/50 border border-gold-500/20 text-left hover:bg-navy-800/70 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gold-500/15 flex items-center justify-center text-base flex-shrink-0">⏯</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gold-400">{lang === 'hi' ? 'जारी रखो' : 'Continue Learning'}</p>
                  <p className="text-[10px] text-slate-500 truncate">{t(LESSONS[currentIdx].title)}</p>
                </div>
                <span className="text-gold-400 text-xs">→</span>
              </div>
            </button>
          )}
        </div>

        {/* Section cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <DashCard
            icon="♟"
            title={lang === 'hi' ? 'मोहरे' : 'Pieces'}
            subtitle={`${PIECE_LESSONS.filter(l => progress[l.id]?.done).length}/${PIECE_LESSONS.length}`}
            onClick={() => setView('piece-list')}
            accent="emerald"
          />
          <DashCard
            icon="📜"
            title={lang === 'hi' ? 'नियम' : 'Concepts'}
            subtitle={`${CONCEPT_LESSONS.filter(l => progress[l.id]?.done).length}/${CONCEPT_LESSONS.length}`}
            onClick={() => setView('concept-list')}
            accent="purple"
          />
          <DashCard
            icon="🤖"
            title={lang === 'hi' ? 'अभ्यास' : 'Practice'}
            subtitle={lang === 'hi' ? 'बॉट के साथ' : 'Play vs bot'}
            onClick={() => navigate('/bot?difficulty=5')}
            accent="sky"
          />
          <DashCard
            icon="🧩"
            title={lang === 'hi' ? 'पहेलियाँ' : 'Quizzes'}
            subtitle={lang === 'hi' ? 'मिनी पहेलियाँ' : 'Mini puzzles'}
            onClick={() => navigate('/puzzles')}
            accent="gold"
          />
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6">
          {lang === 'hi' ? '✨ अपनी गति से सीखो' : lang === 'en' ? '✨ Learn at your own pace' : '✨ Apni speed pe sikho'}
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ──
function SummaryRow({ icon, label, text }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-[10px] mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{label}</p>
        <p className="text-[10px] text-slate-200 leading-snug">{text}</p>
      </div>
    </div>
  );
}

function DashCard({ icon, title, subtitle, onClick, accent }) {
  const accents = {
    emerald: 'border-emerald-500/20 bg-emerald-500/[0.06]',
    purple:  'border-purple-500/20 bg-purple-500/[0.06]',
    sky:     'border-sky-500/20 bg-sky-500/[0.06]',
    gold:    'border-gold-500/20 bg-gold-500/[0.06]',
  };
  return (
    <button onClick={onClick}
      className={`p-3 rounded-xl border text-left transition-all hover:-translate-y-0.5 ${accents[accent] || accents.emerald}`}>
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-xs font-bold text-white truncate">{title}</p>
      <p className="text-[10px] text-slate-500 truncate">{subtitle}</p>
    </button>
  );
}

function LessonList({ title, subtitle, lessons, progress, lang, setLang, t, onOpen, onBack }) {
  return (
    <div className="w-full bg-hero flex-1 px-4 py-5 overflow-x-hidden">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="text-[11px] text-slate-400 hover:text-white font-semibold">← {lang === 'hi' ? 'वापस' : 'Back'}</button>
          <div className="flex gap-1">
            {Object.entries(LANGS).map(([c, l]) => (
              <button key={c} onClick={() => setLang(c)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${lang === c ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500'}`}>{l}</button>
            ))}
          </div>
        </div>
        <h1 className="text-xl font-black text-white mb-1">{title}</h1>
        <p className="text-[11px] text-slate-500 mb-4">{subtitle}</p>

        <div className="space-y-1.5">
          {lessons.map((les) => {
            const done = !!progress[les.id]?.done;
            return (
              <button key={les.id} onClick={() => onOpen(les)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                  done ? 'bg-chess-green/5 hover:bg-chess-green/10' : 'bg-navy-800/30 hover:bg-navy-800/50'
                }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${
                  done ? 'bg-chess-green/15' : 'bg-navy-700/30'
                }`}>{done ? '✅' : les.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${done ? 'text-chess-green' : 'text-white'}`}>{t(les.title)}</p>
                  <p className="text-[10px] text-slate-500">
                    {les.intro?.length || 0} {lang === 'hi' ? 'क़दम' : 'steps'}
                    {les.practice?.length ? ` · ${les.practice.length} ${lang === 'hi' ? 'अभ्यास' : 'practice'}` : ''}
                    {les.puzzle ? ` · 1 ${lang === 'hi' ? 'पहेली' : 'puzzle'}` : ''}
                  </p>
                </div>
                <span className="text-slate-500 text-xs">→</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
