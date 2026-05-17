import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { puzzles } from '../data/puzzles';
import { AuthContext } from '../contexts/AuthContext';

const STAR_EMOJI = '⭐';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const UNLOCK_COST_BY_MOVES = { 1: 2, 2: 5, 3: 10, 4: 20 };

// Filter only puzzles that are actually valid (loadable FEN, side-to-move not already in mate)
function isPuzzleValid(p) {
  try {
    const g = new Chess(p.fen);
    if (g.isCheckmate() || g.isStalemate() || g.isDraw()) return false;
    // First solution move must be legal
    if (p.solution && p.solution[0]) {
      const testG = new Chess(p.fen);
      const m = testG.move(p.solution[0]);
      if (!m) return false;
    }
    return true;
  } catch { return false; }
}

export default function Puzzles() {
  const navigate = useNavigate();
  const { token, user, updateWallet } = useContext(AuthContext);

  // Build validated puzzles once
  const validPuzzles = useMemo(() => puzzles.filter(isPuzzleValid), []);

  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('puzzleProgress');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          completed: parsed.completed || [],
          current: parsed.current || 1,
          lastSolved: parsed.lastSolved || null,
          stars: parsed.stars || {},
          unlocked: parsed.unlocked || [],
        };
      }
    } catch {}
    return { completed: [], current: 1, lastSolved: null, stars: {}, unlocked: [] };
  });

  const [filter, setFilter] = useState('All');
  const [activePuzzle, setActivePuzzle] = useState(null);

  const [game, setGame] = useState(new Chess());
  const [moveCount, setMoveCount] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [showHint, setShowHint] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoveStyles, setLegalMoveStyles] = useState({});
  const [toast, setToast] = useState(null);
  const [walletNotice, setWalletNotice] = useState('');
  const [unlockingPuzzleId, setUnlockingPuzzleId] = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  // Stable board sizing
  const boardWrapRef = useRef(null);
  const [boardSize, setBoardSize] = useState(320);
  useEffect(() => {
    const measure = () => {
      if (!boardWrapRef.current) return;
      const w = boardWrapRef.current.getBoundingClientRect().width;
      if (w > 0) setBoardSize(Math.floor(Math.min(w, 560)));
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
  }, [activePuzzle]);

  const chess = useRef(new Chess());

  useEffect(() => { localStorage.setItem('puzzleProgress', JSON.stringify(progress)); }, [progress]);

  useEffect(() => {
    if (!activePuzzle) return;
    chess.current = new Chess(activePuzzle.fen);
    setGame(new Chess(activePuzzle.fen));
    setMoveCount(0);
    setHintUsed(false);
    setAttempts(0);
    setFeedback({ type: '', text: '' });
    setShowHint(false);
    setSelectedSquare(null);
    setLegalMoveStyles({});
    setToast(null);
    setWaitingForOpponent(false);
  }, [activePuzzle?.id]);

  const showToast = (text, type = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 1800);
  };

  const loadPuzzle = (puzzle) => {
    if (!puzzle) return;
    setActivePuzzle(puzzle);
    setWalletNotice('');
  };

  const getUnlockCost = (puzzle) => UNLOCK_COST_BY_MOVES[puzzle.moves] || 20;

  const handleUnlockPuzzle = async (puzzle) => {
    const amount = getUnlockCost(puzzle);
    if (!token) { setWalletNotice('Please login to unlock puzzles.'); return; }
    if ((user?.wallet || 0) < amount) {
      setWalletNotice(`Insufficient balance. Need ₹${amount} to unlock.`);
      return;
    }
    setUnlockingPuzzleId(puzzle.id);
    try {
      const res = await fetch(`${API_URL}/api/user/deduct-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to unlock puzzle');
      updateWallet(data.wallet);
      setProgress(prev => {
        const unlockedSet = new Set(prev.unlocked || []);
        unlockedSet.add(puzzle.id);
        return { ...prev, unlocked: Array.from(unlockedSet) };
      });
      setWalletNotice(`Puzzle #${puzzle.id} unlocked for ₹${amount}.`);
      loadPuzzle(puzzle);
    } catch (err) {
      setWalletNotice(err.message || 'Could not unlock puzzle.');
    } finally {
      setUnlockingPuzzleId(null);
    }
  };

  const handleFinalPuzzleReward = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/add-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: 100 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add completion reward');
      updateWallet(data.wallet);
      setWalletNotice('Congratulations! You earned ₹100!');
    } catch (err) {
      setWalletNotice(err.message || 'Puzzle solved, but reward could not be credited.');
    }
  };

  const playOpponentMove = (currentGame, currentMoveCount) => {
    if (!activePuzzle) return;
    const solution = activePuzzle.solution;
    const opponentMoveStr = solution[currentMoveCount];
    if (!opponentMoveStr) return;

    setWaitingForOpponent(true);
    setTimeout(() => {
      try {
        const gameCopy = new Chess(currentGame.fen());
        const result = gameCopy.move(opponentMoveStr);
        if (result) {
          setGame(gameCopy);
          setMoveCount(currentMoveCount + 1);
        }
      } catch {}
      setWaitingForOpponent(false);
    }, 500);
  };

  const handleSquareClick = (square) => {
    if (feedback.type === 'complete' || !activePuzzle || waitingForOpponent) return;
    const initialTurn = activePuzzle.fen.split(' ')[1];
    if (game.turn() !== initialTurn) return;

    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      const dots = {};
      moves.forEach(m => {
        dots[m.to] = {
          background: game.get(m.to)
            ? 'radial-gradient(circle, transparent 55%, rgba(0,0,0,0.2) 55%)'
            : 'radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 25%)',
          borderRadius: '0',
        };
      });
      dots[square] = { backgroundColor: 'rgba(246, 246, 105, 0.4)' };
      setLegalMoveStyles(dots);
    } else if (selectedSquare) {
      handlePuzzleMove(selectedSquare, square);
    }
  };

  const handlePuzzleMove = (sourceSquare, targetSquare, piece) => {
    if (feedback.type === 'complete' || !activePuzzle || waitingForOpponent) return false;

    const moveCopy = new Chess(game.fen());
    const promotionPiece = piece ? piece[1].toLowerCase() : 'q';
    let moveStr;
    try {
      moveStr = moveCopy.move({ from: sourceSquare, to: targetSquare, promotion: promotionPiece });
    } catch {
      setSelectedSquare(null);
      setLegalMoveStyles({});
      showToast('Illegal move', 'error');
      return false;
    }

    if (!moveStr) {
      setSelectedSquare(null);
      setLegalMoveStyles({});
      showToast('Illegal move', 'error');
      return false;
    }

    // Compare with expected solution move (by SAN OR from-to-promotion)
    const expectedSan = activePuzzle.solution[moveCount];
    const expectedFromTo = parseSolutionToFromTo(activePuzzle.fen, activePuzzle.solution, moveCount);
    const matchesSan = expectedSan && moveStr.san === expectedSan;
    const matchesFromTo = expectedFromTo && moveStr.from === expectedFromTo.from && moveStr.to === expectedFromTo.to;

    setSelectedSquare(null);
    setLegalMoveStyles({});

    if (!matchesSan && !matchesFromTo) {
      // Wrong move — DO NOT update board state
      setAttempts(prev => prev + 1);
      showToast('Try again', 'error');
      return false;
    }

    setGame(moveCopy);
    const nextMoveCount = moveCount + 1;
    const totalMoves = activePuzzle.solution.length;
    const isFinalMove = nextMoveCount === totalMoves;

    if (isFinalMove) {
      let finalStars = 3;
      if (hintUsed) finalStars = 1;
      else if (attempts > 0) finalStars = 2;

      setFeedback({ type: 'complete', text: 'Puzzle Solved!' });
      showToast('Solved ✓', 'success');

      const hadSolvedPuzzle100 = progress.completed.includes(100);
      setProgress(prev => {
        const completedSet = new Set(prev.completed);
        completedSet.add(activePuzzle.id);
        const nextCurrent = prev.current === activePuzzle.id ? activePuzzle.id + 1 : prev.current;
        const newStars = { ...prev.stars };
        if (!newStars[activePuzzle.id] || newStars[activePuzzle.id] < finalStars) {
          newStars[activePuzzle.id] = finalStars;
        }
        return {
          ...prev,
          completed: Array.from(completedSet),
          current: Math.min(nextCurrent, 100),
          lastSolved: Date.now(),
          stars: newStars,
        };
      });
      if (activePuzzle.id === 100 && !hadSolvedPuzzle100) handleFinalPuzzleReward();
      setMoveCount(nextMoveCount);
      return true;
    }

    setMoveCount(nextMoveCount);
    showToast('Correct ✓', 'success');
    playOpponentMove(moveCopy, nextMoveCount);
    return true;
  };

  // Translate the puzzle's SAN solution into from/to on demand
  const parseSolutionToFromTo = (startFen, solution, idx) => {
    try {
      const g = new Chess(startFen);
      for (let i = 0; i < idx; i++) g.move(solution[i]);
      const trial = new Chess(g.fen());
      const m = trial.move(solution[idx]);
      if (m) return { from: m.from, to: m.to };
    } catch {}
    return null;
  };

  const currentLevelColor = (diff) => {
    const k = (diff || '').toLowerCase();
    switch (k) {
      case 'easy': return 'text-green-400 border-green-400/30 bg-green-400/10';
      case 'medium': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'hard': return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
      case 'advanced': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'master': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      default: return 'text-sky-400 border-sky-400/30 bg-sky-400/10';
    }
  };

  const BOARD_THEMES = {
    classic: { light: '#f0d9b5', dark: '#b58863' },
    dark:    { light: '#334155', dark: '#1e293b' },
    green:   { light: '#eeeed2', dark: '#769656' },
    ocean:   { light: '#b8cce2', dark: '#5b7ea4' },
    bw:      { light: '#ffffff', dark: '#808080' },
  };

  // ── PUZZLE PLAY SCREEN ──
  if (activePuzzle) {
    const isWhiteTurn = game.turn() === 'w';
    const boardOrientation = activePuzzle.fen.split(' ')[1] === 'w' ? 'white' : 'black';

    let boardTheme = 'classic';
    try {
      const s = JSON.parse(localStorage.getItem('chess-settings') || '{}');
      if (s.boardTheme) boardTheme = s.boardTheme;
    } catch {}
    const theme = BOARD_THEMES[boardTheme] || BOARD_THEMES.classic;

    return (
      <div className="bg-hero w-full overflow-x-hidden px-3 py-4 md:px-6 md:py-6">
        <div className="max-w-3xl mx-auto animate-fade-in">

          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setActivePuzzle(null)} className="text-xs text-slate-400 hover:text-white transition-colors font-semibold flex items-center gap-1">
              ← Back
            </button>
            <div className="text-right">
              <h2 className="text-white font-bold text-base md:text-lg">Puzzle #{activePuzzle.id}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${currentLevelColor(activePuzzle.difficulty)}`}>
                {activePuzzle.difficulty} — {activePuzzle.moves} move{activePuzzle.moves > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-4 md:gap-6">
            {/* Board */}
            <div className="md:col-span-8">
              <div
                ref={boardWrapRef}
                className="relative w-full mx-auto"
                style={{ aspectRatio: '1 / 1', maxWidth: '560px', touchAction: 'none', overflow: 'hidden' }}
              >
                <Chessboard
                  customBoardStyle={{ borderRadius: '4px' }}
                  position={game.fen()}
                  boardWidth={boardSize}
                  arePiecesDraggable={!waitingForOpponent && feedback.type !== 'complete'}
                  onPieceDrop={handlePuzzleMove}
                  onSquareClick={handleSquareClick}
                  boardOrientation={boardOrientation}
                  animationDuration={180}
                  customSquareStyles={legalMoveStyles}
                  customLightSquareStyle={{ backgroundColor: theme.light }}
                  customDarkSquareStyle={{ backgroundColor: theme.dark }}
                  snapToCursor={false}
                  showBoardNotation
                />

                {feedback.type === 'complete' && (
                  <div className="absolute inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center animate-fade-in z-20 rounded">
                    <div className="text-center animate-scale-in">
                      <div className="text-5xl mb-3">🎉</div>
                      <h2 className="text-2xl font-black text-white mb-2">Puzzle Solved!</h2>
                      <div className="flex justify-center gap-1 mb-5">
                        {[1, 2, 3].map(s => (
                          <span key={s} className={`text-xl ${s <= (progress.stars[activePuzzle.id] || 3) ? '' : 'grayscale opacity-30'}`}>
                            {STAR_EMOJI}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => setActivePuzzle(null)} className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 text-slate-200 hover:bg-white/15">Grid</button>
                        {activePuzzle.id < 100 && (
                          <button
                            onClick={() => loadPuzzle(validPuzzles.find(p => p.id === activePuzzle.id + 1) || validPuzzles[validPuzzles.indexOf(activePuzzle) + 1])}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white shadow-lg shadow-chess-green/20"
                          >
                            Next Puzzle →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating toast overlay — does NOT move board */}
                {toast && (
                  <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-md text-xs font-bold shadow-md ${
                    toast.type === 'success' ? 'bg-emerald-500/90 text-white' : toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-navy-800/95 text-white'
                  } animate-fade-in`}>
                    {toast.text}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel — Info & Controls */}
            <div className="md:col-span-4 space-y-3">
              <div className="bg-navy-800/40 border border-navy-700/20 rounded-xl p-3 text-center">
                <div className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2 ${
                  isWhiteTurn ? 'bg-white text-black' : 'bg-slate-800 text-white border border-slate-600'
                }`}>
                  {waitingForOpponent ? 'Opponent moving...' : (isWhiteTurn ? 'White to Move' : 'Black to Move')}
                </div>
                <h3 className="text-slate-300 text-xs">Find the best continuation.</h3>
              </div>

              <div className="bg-navy-800/40 border border-navy-700/20 rounded-xl p-3 space-y-2">
                <button
                  onClick={() => {
                    const resetGame = new Chess(activePuzzle.fen);
                    setGame(resetGame);
                    setMoveCount(0);
                    setFeedback({ type: '', text: '' });
                    setWaitingForOpponent(false);
                    setSelectedSquare(null);
                    setLegalMoveStyles({});
                  }}
                  className="w-full py-2 rounded-lg text-xs font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
                >
                  🔄 Retry
                </button>

                <button
                  onClick={() => { setHintUsed(true); setShowHint(true); }}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${hintUsed ? 'opacity-50 cursor-not-allowed bg-white/5 text-slate-500' : 'bg-gold-500/10 text-gold-400 hover:bg-gold-500/20'}`}
                  disabled={hintUsed}
                >
                  💡 {hintUsed ? 'Hint used (-1 ⭐)' : 'Hint (-1 ⭐)'}
                </button>

                {showHint && (
                  <div className="p-2 bg-navy-900/60 rounded-md border border-navy-700/30 text-[11px] text-sky-300 text-center">
                    {activePuzzle.hint || 'Look at threats and forcing moves.'}
                  </div>
                )}

                {walletNotice && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-md text-[10px] text-amber-300 text-center">
                    {walletNotice}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PUZZLE SELECTION SCREEN ──
  const filters = ['All', 'Easy', 'Medium', 'Hard', 'Advanced', 'Master'];
  const filteredPuzzles = validPuzzles.filter(p => filter === 'All' || (p.difficulty || '').toLowerCase() === filter.toLowerCase());

  const completedCount = progress.completed.length;
  const totalCount = validPuzzles.length || 1;
  const completionPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="bg-hero w-full overflow-x-hidden px-4 py-6">
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="bg-navy-800/40 backdrop-blur border border-navy-700/20 rounded-2xl p-5 md:p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1">Chess Puzzles</h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-md">Train tactics. Sharpen your edge.</p>
          </div>
          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-white">{completedCount} / {totalCount}</span>
              <span className="text-chess-green">{completionPercent}%</span>
            </div>
            <div className="w-full h-2 bg-navy-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-chess-green to-emerald-400 transition-all duration-700"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f ? 'bg-white text-navy-900' : 'bg-navy-800/40 text-slate-400 hover:bg-navy-800/70 hover:text-white border border-navy-700/30'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredPuzzles.map(puzzle => {
            const isCompleted = progress.completed.includes(puzzle.id);
            const isUnlocked = puzzle.id <= progress.current || progress.unlocked.includes(puzzle.id);
            const stars = progress.stars[puzzle.id] || 0;
            const unlockCost = getUnlockCost(puzzle);

            let cardStyle = 'bg-navy-800/30 border-navy-700/20 opacity-60';
            if (isCompleted) cardStyle = 'bg-chess-green/8 border-chess-green/30';
            else if (isUnlocked) cardStyle = 'bg-gradient-to-br from-gold-500/15 to-gold-700/5 border-gold-500/30';

            if (!isUnlocked) {
              return (
                <div key={puzzle.id} className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${cardStyle}`}>
                  <div className="absolute top-2 right-2 text-sm">🔒</div>
                  <div className="text-base font-black text-white mb-1">#{puzzle.id}</div>
                  <div className="text-[9px] uppercase font-bold text-slate-500 mb-2 tracking-wider">{puzzle.difficulty}</div>
                  <button
                    onClick={() => handleUnlockPuzzle(puzzle)}
                    disabled={unlockingPuzzleId === puzzle.id}
                    className="w-full py-1.5 rounded-md text-[10px] font-bold bg-white/5 text-slate-300 hover:bg-white/10"
                  >
                    {unlockingPuzzleId === puzzle.id ? 'Unlocking...' : `Unlock ₹${unlockCost}`}
                  </button>
                </div>
              );
            }

            return (
              <button
                key={puzzle.id}
                onClick={() => loadPuzzle(puzzle)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${cardStyle} cursor-pointer hover:-translate-y-0.5`}
              >
                <div className="text-base font-black text-white mb-1">#{puzzle.id}</div>
                <div className="text-[9px] uppercase font-bold text-slate-500 mb-2 tracking-wider">{puzzle.difficulty}</div>

                {isCompleted ? (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(s => (
                      <span key={s} className={`text-xs ${s <= stars ? '' : 'grayscale opacity-20'}`}>{STAR_EMOJI}</span>
                    ))}
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gold-500/15 text-gold-400 flex items-center justify-center text-xs">▶</div>
                )}
              </button>
            );
          })}
        </div>

        {walletNotice && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 text-center">
            {walletNotice}
          </div>
        )}

        {filteredPuzzles.length === 0 && (
          <div className="text-center py-16 text-slate-500 text-sm">No puzzles in this category.</div>
        )}
      </div>
    </div>
  );
}
