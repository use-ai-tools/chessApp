import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { puzzles } from '../data/puzzles';

const STAR_EMOJI = '⭐';

export default function Puzzles() {
  const navigate = useNavigate();
  
  // Progress State
  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('puzzleProgress');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { completed: [], current: 1, lastSolved: null, stars: {} };
  });

  // UI State
  const [filter, setFilter] = useState('All');
  const [activePuzzle, setActivePuzzle] = useState(null); // The puzzle object currently being played
  
  // Game State
  const [game, setGame] = useState(new Chess());
  const [moveIndex, setMoveIndex] = useState(0); // Which step in the solution array we are on
  const [hintUsed, setHintUsed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState({ type: '', text: '' }); // type: 'success', 'error', 'complete'
  const [showHint, setShowHint] = useState(false);

  // Sync progress to localStorage
  useEffect(() => {
    localStorage.setItem('puzzleProgress', JSON.stringify(progress));
  }, [progress]);

  // Load a puzzle into the board
  const loadPuzzle = (puzzle) => {
    if (!puzzle) return;
    const newGame = new Chess(puzzle.fen);
    setGame(newGame);
    setActivePuzzle(puzzle);
    setMoveIndex(0);
    setHintUsed(false);
    setAttempts(0);
    setFeedback({ type: '', text: '' });
    setShowHint(false);
  };

  // Handle move attempting
  const onDrop = (sourceSquare, targetSquare, piece) => {
    if (feedback.type === 'complete' || !activePuzzle) return false;

    const moveCopy = new Chess(game.fen());
    const moveStr = moveCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1].toLowerCase() ?? 'q',
    });

    if (!moveStr) return false;

    // Check if move matches solution at current index
    const expectedSan = activePuzzle.solution[moveIndex];
    
    // Some edge cases with checks (+, #) mapping
    if (moveStr.san === expectedSan || moveStr.san.replace(/[+#]/g, '') === expectedSan.replace(/[+#]/g, '')) {
      // Correct Move!
      setGame(moveCopy);
      
      const isFinalMove = moveIndex === activePuzzle.solution.length - 1;
      
      if (isFinalMove) {
        // Solved
        let finalStars = 3;
        if (hintUsed) finalStars = 1;
        else if (attempts > 0) finalStars = 2;

        setFeedback({ type: 'complete', text: 'Puzzle Solved!' });
        
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
            stars: newStars
          };
        });
      } else {
        // Correct but more moves
        setFeedback({ type: 'success', text: 'Correct! Keep going...' });
        setMoveIndex(prev => prev + 1);
        
        // Opponent's automated response (the next move in solution array)
        setTimeout(() => {
           const opMoveSan = activePuzzle.solution[moveIndex + 1];
           const opCopy = new Chess(moveCopy.fen());
           opCopy.move(opMoveSan);
           setGame(opCopy);
           setMoveIndex(prev => prev + 1);
           setFeedback({ type: '', text: '' });
        }, 600);
      }
      return true;
    } else {
      // Wrong move
      setAttempts(prev => prev + 1);
      setFeedback({ type: 'error', text: 'Not quite, try again' });
      setTimeout(() => {
        // Reset to initial position of the puzzle
        const resetGame = new Chess(activePuzzle.fen);
        setGame(resetGame);
        setMoveIndex(0);
        setFeedback({ type: '', text: '' });
      }, 1000);
      return false; // don't visually drop the piece
    }
  };

  const currentLevelColor = (diff) => {
    switch (diff) {
      case 'easy': return 'text-green-400 border-green-400/30 bg-green-400/10';
      case 'medium': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'hard': return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
      case 'advanced': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'master': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      default: return 'text-sky-400 border-sky-400/30 bg-sky-400/10';
    }
  };

  // 1. RENDER PUZZLE PLAY SCREEN
  if (activePuzzle) {
    const isWhiteTurn = game.turn() === 'w';
    const boardOrientation = activePuzzle.fen.split(' ')[1] === 'w' ? 'white' : 'black';

    return (
      <div className="min-h-[calc(100vh-64px)] bg-hero px-4 py-6">
        <div className="max-w-3xl mx-auto animate-fade-in">
          
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setActivePuzzle(null)} className="btn-secondary btn-sm">
              ← Back to Puzzles
            </button>
            <div className="text-right">
              <h2 className="text-white font-bold text-xl">Puzzle #{activePuzzle.id}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${currentLevelColor(activePuzzle.difficulty)}`}>
                {activePuzzle.difficulty} — {activePuzzle.moves} Move Mate
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-8">
              <div className={`rounded-xl overflow-hidden shadow-2xl relative ${feedback.type === 'error' ? 'board-shake' : ''}`}>
                <Chessboard 
                  position={game.fen()}
                  onPieceDrop={onDrop}
                  boardOrientation={boardOrientation}
                  animationDuration={200}
                  customSquareStyles={
                    feedback.type === 'error' ? { 
                      [game.turn() === 'w' ? 'e1' : 'e8']: { backgroundColor: 'rgba(239,68,68,0.5)' } 
                    } : {}
                  }
                />
                
                {feedback.type === 'success' && (
                  <div className="absolute inset-0 bg-chess-green/20 pointer-events-none animate-pulse-fast" />
                )}
                {feedback.type === 'complete' && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-fade-in z-20 backdrop-blur-sm">
                    <div className="text-center animate-scale-in">
                      <div className="text-6xl mb-4">🎉</div>
                      <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Puzzle Solved!</h2>
                      <div className="flex justify-center gap-1 mb-6">
                        {[1, 2, 3].map(s => (
                          <span key={s} className={`text-2xl ${s <= (progress.stars[activePuzzle.id] || 3) ? '' : 'grayscale opacity-30 shadow-none'}`}>
                            {STAR_EMOJI}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-3 justify-center">
                        <button onClick={() => setActivePuzzle(null)} className="btn-secondary">Grid</button>
                        {activePuzzle.id < 100 && (
                          <button 
                            onClick={() => loadPuzzle(puzzles.find(p => p.id === activePuzzle.id + 1))}
                            className="btn-primary shadow-lg shadow-chess-green/20"
                          >
                            Next Puzzle →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-4 space-y-4">
              <div className="card text-center">
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                  isWhiteTurn 
                    ? 'bg-white text-black' 
                    : 'bg-slate-800 text-white border border-slate-600'
                }`}>
                  {isWhiteTurn ? 'White to Move' : 'Black to Move'}
                </div>
                
                <h3 className="text-slate-300 text-sm mb-4">
                  Find the best continuation.
                </h3>

                {feedback.text && feedback.type !== 'complete' && (
                  <div className={`p-3 rounded-lg text-sm font-bold animate-fade-in ${
                    feedback.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                    'bg-chess-green/10 text-chess-green border border-chess-green/20'
                  }`}>
                    {feedback.text}
                  </div>
                )}
              </div>

              <div className="card space-y-3">
                <button 
                  onClick={() => {
                    const resetGame = new Chess(activePuzzle.fen);
                    setGame(resetGame);
                    setMoveIndex(0);
                    setFeedback({ type: '', text: '' });
                  }}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <span>🔄</span> Retry Position
                </button>
                
                <button 
                  onClick={() => {
                    setHintUsed(true);
                    setShowHint(true);
                  }}
                  className={`btn-secondary w-full flex items-center justify-center gap-2 ${hintUsed ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={hintUsed}
                >
                  <span>💡</span> {hintUsed ? 'Hint Used (-1 ⭐)' : 'Get Hint (-1 ⭐)'}
                </button>
                
                {showHint && (
                  <div className="p-3 bg-navy-800 rounded-lg border border-navy-600/50 text-sm text-sky-300 animate-slide-up text-center font-medium">
                    {activePuzzle.hint || 'Look closely at the king\'s defenses.'}
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  // 2. RENDER PUZZLE SELECTION SCREEN
  const filters = ['All', 'Easy', 'Medium', 'Hard', 'Advanced', 'Master'];
  const filteredPuzzles = puzzles.filter(p => filter === 'All' || p.difficulty.toLowerCase() === filter.toLowerCase());

  const completedCount = progress.completed.length;
  const completionPercent = Math.round((completedCount / 100) * 100);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-hero px-4 py-8">
      <div className="max-w-6xl mx-auto animate-fade-in">
        
        {/* Header & Progress */}
        <div className="bg-navy-800/80 backdrop-blur border border-navy-700/50 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Chess Puzzles</h1>
            <p className="text-slate-400 max-w-md">Master your tactical vision with 100 hand-picked puzzles. Puzzles unlock sequentially. Progress is saved offline.</p>
          </div>
          
          <div className="w-full md:w-64">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-white">{completedCount} / 100 Completed</span>
              <span className="text-chess-green">{completionPercent}%</span>
            </div>
            <div className="w-full h-3 bg-navy-900 rounded-full overflow-hidden border border-navy-700/50">
              <div 
                className="h-full bg-gradient-to-r from-chess-green to-emerald-400 transition-all duration-1000"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === f 
                  ? 'bg-white text-navy-900 shadow-lg' 
                  : 'bg-navy-800 text-slate-400 hover:bg-navy-700 hover:text-white border border-navy-700/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Puzzle Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPuzzles.map(puzzle => {
            const isCompleted = progress.completed.includes(puzzle.id);
            const isUnlocked = puzzle.id <= progress.current;
            const stars = progress.stars[puzzle.id] || 0;

            let cardStyle = "bg-navy-800 border-navy-700 hover:border-navy-500 opacity-60"; // Locked style
            if (isCompleted) cardStyle = "bg-chess-green/10 border-chess-green/30 hover:border-chess-green shadow-[0_0_15px_rgba(118,150,86,0.1)]"; // Completed
            else if (isUnlocked) cardStyle = "bg-gradient-to-br from-gold-500/20 to-gold-700/5 border-gold-500/50 shadow-[0_0_20px_rgba(251,191,36,0.15)] ring-1 ring-gold-500/20"; // Current Unlocked

            return (
              <button
                key={puzzle.id}
                disabled={!isUnlocked}
                onClick={() => loadPuzzle(puzzle)}
                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-300 group ${cardStyle} ${!isUnlocked ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'}`}
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-navy-900/40 rounded-xl backdrop-blur-[1px] z-10">
                    <span className="text-2xl drop-shadow-md">🔒</span>
                  </div>
                )}
                
                <div className="text-lg font-black text-white mb-1 group-hover:text-amber-300 transition-colors">
                  #{puzzle.id}
                </div>
                
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-wider">
                  {puzzle.difficulty}
                </div>

                {isCompleted ? (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(s => (
                      <span key={s} className={`text-sm ${s <= stars ? '' : 'grayscale opacity-20'}`}>
                        {STAR_EMOJI}
                      </span>
                    ))}
                  </div>
                ) : isUnlocked ? (
                  <div className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-500 flex items-center justify-center text-sm ring-1 ring-gold-500/30">
                    ▶
                  </div>
                ) : (
                  <div className="w-8 h-8" /> // spacing
                )}
              </button>
            );
          })}
        </div>
        
        {filteredPuzzles.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            No puzzles found for this category.
          </div>
        )}

      </div>
    </div>
  );
}
