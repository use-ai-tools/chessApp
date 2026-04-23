import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import ChessBoard from '../components/ChessBoard';
import MoveHistory from '../components/MoveHistory';
import WinProbabilityBar from '../components/WinProbabilityBar';
import ResultModal from '../components/ResultModal';
import GameReview from '../components/GameReview';
import useStockfish, { classifyMove } from '../hooks/useStockfish';
import { AuthContext } from '../contexts/AuthContext';

const DIFFICULTY = {
  5: { label: 'Easy', depth: 5, color: 'text-emerald-400' },
  10: { label: 'Medium', depth: 10, color: 'text-amber-400' },
  15: { label: 'Hard', depth: 15, color: 'text-red-400' },
};

export default function BotGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const depth = parseInt(searchParams.get('difficulty')) || 10;
  const diffInfo = DIFFICULTY[depth] || DIFFICULTY[10];

  const chessRef = useRef(new Chess());
  const { getEvalAndBestMove, terminate } = useStockfish();

  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [gameStatus, setGameStatus] = useState('playing'); // playing | finished
  const [resultData, setResultData] = useState(null);
  const [botThinking, setBotThinking] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(-1);
  const [showGameReview, setShowGameReview] = useState(false);

  // Eval tracking
  const [currentEval, setCurrentEval] = useState({ type: 'cp', value: 0 });
  const prevEvalRef = useRef({ type: 'cp', value: 0 });
  const [classifications, setClassifications] = useState([]); // { classification, reason }
  const [moveAnalysis, setMoveAnalysis] = useState([]); // { move, eval, classification }

  const [settings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chess-settings') || '{}'); } catch { return {}; }
  });

  // Player is always white
  const playerColor = 'white';
  const boardOrientation = 'white';
  const currentPlayer = { color: 'white', username: user?.username || 'You', id: user?.id };
  const botPlayer = { username: `Bot (${diffInfo.label})`, id: 'bot', elo: depth === 5 ? 800 : depth === 10 ? 1500 : 2200 };

  // Get initial eval
  useEffect(() => {
    getEvalAndBestMove(fen, Math.min(depth, 8)).then(result => {
      setCurrentEval(result.eval);
      prevEvalRef.current = result.eval;
    }).catch(() => {});
  }, []);

  // Check game end
  const checkGameEnd = useCallback((chess) => {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'b' ? 'white' : 'black';
      setGameStatus('finished');
      setResultData({
        isWinner: winner === playerColor,
        isDraw: false,
        reason: 'checkmate',
        playerColor: 'w',
      });
      return true;
    }
    if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
      setGameStatus('finished');
      setResultData({
        isWinner: false,
        isDraw: true,
        reason: chess.isStalemate() ? 'stalemate' : 'draw',
        playerColor: 'w',
      });
      return true;
    }
    return false;
  }, [playerColor]);

  // Evaluate position and classify the move
  const evaluateAndClassify = useCallback(async (newFen, moveSan, movingColor) => {
    try {
      const result = await getEvalAndBestMove(newFen, Math.min(depth, 12));
      // Eval is from the perspective of the side to move.
      // We need to flip it to get the perspective of the side that just moved.
      let evalForMover = {
        type: result.eval.type,
        value: -result.eval.value, // flip perspective
      };

      const prev = prevEvalRef.current;
      // Previous eval was also from the perspective of the side that was to move (same as the mover)
      // So prev.value is already from the mover's perspective (it was their turn)
      const classification = classifyMove(prev.value, evalForMover.value, prev.type, evalForMover.type);

      setClassifications(c => [...c, { classification, reason: `Eval: ${evalForMover.value > 0 ? '+' : ''}${evalForMover.value}cp` }]);
      setMoveAnalysis(a => [...a, { move: moveSan, eval: evalForMover, classification }]);

      // Update current eval (from current side-to-move perspective)
      setCurrentEval(result.eval);
      // Store for next comparison — flip to be from the NEXT mover's perspective
      prevEvalRef.current = { type: result.eval.type, value: result.eval.value };

      return result;
    } catch (e) {
      console.error('[BotGame] Eval error:', e);
      return null;
    }
  }, [depth, getEvalAndBestMove]);

  // Bot makes a move
  const botMove = useCallback(async (currentFen) => {
    if (gameStatus !== 'playing') return;
    setBotThinking(true);

    try {
      // Add small delay to feel natural
      await new Promise(r => setTimeout(r, 300 + Math.random() * 500));

      const result = await getEvalAndBestMove(currentFen, depth);
      const bestMove = result.bestMove;

      if (!bestMove || bestMove === '(none)') {
        setBotThinking(false);
        return;
      }

      const chess = new Chess(currentFen);
      const from = bestMove.substring(0, 2);
      const to = bestMove.substring(2, 4);
      const promotion = bestMove.length > 4 ? bestMove[4] : undefined;

      const move = chess.move({ from, to, promotion });
      if (!move) {
        setBotThinking(false);
        return;
      }

      const newFen = chess.fen();
      chessRef.current = chess;
      setFen(newFen);
      setLastMove({ from, to });
      setMoveHistory(prev => [...prev, move.san]);
      setPreviewIndex(-1);

      // Evaluate bot's move
      await evaluateAndClassify(newFen, move.san, 'b');

      setBotThinking(false);
      checkGameEnd(chess);
    } catch (e) {
      console.error('[BotGame] Bot move error:', e);
      setBotThinking(false);
    }
  }, [depth, gameStatus, getEvalAndBestMove, evaluateAndClassify, checkGameEnd]);

  // Handle player move
  const handleMove = useCallback(async ({ from, to, promotion }) => {
    if (gameStatus !== 'playing' || botThinking) return;
    if (previewIndex !== -1) { setPreviewIndex(-1); return; }

    const chess = new Chess(fen);
    if (chess.turn() !== 'w') return; // Not player's turn

    try {
      const move = chess.move({ from, to, promotion: promotion || 'q' });
      if (!move) return;

      const newFen = chess.fen();
      chessRef.current = chess;
      setFen(newFen);
      setLastMove({ from, to });
      setMoveHistory(prev => [...prev, move.san]);
      setPreviewIndex(-1);

      // Evaluate player's move
      await evaluateAndClassify(newFen, move.san, 'w');

      if (!checkGameEnd(chess)) {
        // Bot's turn
        await botMove(newFen);
      }
    } catch (e) {
      console.error('[BotGame] Move error:', e);
    }
  }, [fen, gameStatus, botThinking, previewIndex, evaluateAndClassify, checkGameEnd, botMove]);

  // Handle resign
  const [confirmResign, setConfirmResign] = useState(false);
  const handleResign = () => {
    if (!confirmResign) { setConfirmResign(true); return; }
    setGameStatus('finished');
    setResultData({ isWinner: false, isDraw: false, reason: 'resigned', playerColor: 'w' });
    setConfirmResign(false);
  };

  // New game
  const handleNewGame = () => {
    const chess = new Chess();
    chessRef.current = chess;
    setFen(chess.fen());
    setMoveHistory([]);
    setLastMove(null);
    setGameStatus('playing');
    setResultData(null);
    setBotThinking(false);
    setPreviewIndex(-1);
    setClassifications([]);
    setMoveAnalysis([]);
    setCurrentEval({ type: 'cp', value: 0 });
    prevEvalRef.current = { type: 'cp', value: 0 };
    setConfirmResign(false);
    setShowGameReview(false);
  };

  // Preview FEN
  const getPreviewFen = useCallback(() => {
    if (previewIndex === -1 || moveHistory.length === 0) return null;
    try {
      const game = new Chess();
      for (let i = 0; i <= previewIndex && i < moveHistory.length; i++) game.move(moveHistory[i]);
      return game.fen();
    } catch { return null; }
  }, [previewIndex, moveHistory]);

  const displayFen = previewIndex === -1 ? fen : (getPreviewFen() || fen);

  // Build review data for GameReview component
  const reviewData = {
    classifications: classifications,
    white: {},
    black: {},
  };
  // Count classifications per side
  classifications.forEach((c, i) => {
    const side = i % 2 === 0 ? 'white' : 'black';
    reviewData[side][c.classification] = (reviewData[side][c.classification] || 0) + 1;
  });

  // Cleanup
  useEffect(() => {
    return () => terminate();
  }, [terminate]);

  return (
    <div className="h-[calc(100vh-64px)] bg-hero flex flex-col">
      <div className="flex-1 flex flex-col px-2 py-2 lg:px-4 lg:py-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm lg:text-xl font-bold text-white">🤖 vs Bot</h1>
            <span className={`badge rounded-none text-[10px] font-bold ${
              depth === 5 ? 'badge-green' : depth === 10 ? 'badge-gold' : 'bg-red-500/15 text-red-400 border border-red-500/30'
            }`}>
              {diffInfo.label} (Depth {depth})
            </span>
            {botThinking && (
              <span className="flex items-center gap-1 text-[10px] text-purple-400 animate-pulse">
                <span className="w-2 h-2 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                Thinking...
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleNewGame} className="btn-secondary btn-sm rounded-none text-[10px]">🔄 New</button>
            <button onClick={() => navigate('/')} className="btn-secondary btn-sm rounded-none text-[10px]">← Home</button>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-8 min-h-0 justify-center items-center max-w-7xl mx-auto w-full pb-4">
          {/* Board Column */}
          <div className="flex flex-col gap-2 flex-shrink-0 items-center justify-center" style={{ width: '100%', maxWidth: 'calc(100vh - 120px)' }}>
            <div className="w-full h-auto aspect-square relative items-center justify-center" style={{ maxHeight: 'calc(100vh - 120px)', borderRadius: 0 }}>
              <div className="flex items-stretch w-full h-full">
                {/* Eval bar */}
                <WinProbabilityBar
                  evalScore={currentEval.value}
                  evalType={currentEval.type}
                  fen={displayFen}
                  height="100%"
                />
                {/* Board */}
                <div className="flex-1">
                  <ChessBoard
                    roomId="bot-game"
                    matchId="bot-game"
                    fen={displayFen}
                    onMove={handleMove}
                    currentPlayer={previewIndex === -1 && gameStatus === 'playing' && !botThinking ? currentPlayer : null}
                    whitePlayer={{ ...currentPlayer, elo: user?.elo?.free || 1200 }}
                    blackPlayer={botPlayer}
                    isSpectator={previewIndex !== -1 || gameStatus === 'finished' || botThinking}
                    isReview={false}
                    gameStatus={gameStatus === 'finished' ? 'finished' : 'playing'}
                    boardOrientation={boardOrientation}
                    lastMove={lastMove}
                    settings={settings}
                    username={user?.username}
                  />
                </div>
              </div>

              {previewIndex !== -1 && (
                <div className="absolute bottom-0 left-0 right-0 p-1 bg-sky-500/10 border-t border-sky-500/20 flex items-center justify-between z-10">
                  <p className="text-[9px] text-sky-400 font-bold">📖 Move {previewIndex + 1}/{moveHistory.length}</p>
                  <button onClick={() => setPreviewIndex(-1)} className="text-[9px] text-sky-400 font-black">LIVE</button>
                </div>
              )}
            </div>

            {/* Controls */}
            {gameStatus === 'playing' && (
              <div className="flex gap-2 w-full mt-2">
                <button
                  onClick={handleResign}
                  className={`rounded-none flex-1 text-xs py-2 lg:py-3 font-bold transition-all ${
                    confirmResign ? 'bg-red-600 text-white animate-pulse' : 'btn-secondary'
                  }`}
                >
                  🏳️ {confirmResign ? 'Confirm?' : 'Resign'}
                </button>
                {confirmResign && (
                  <button onClick={() => setConfirmResign(false)} className="rounded-none flex-1 text-xs py-2 bg-navy-700 text-slate-300 font-medium">Cancel</button>
                )}
                <button onClick={handleNewGame} className="btn-secondary rounded-none flex-1 text-xs py-2 lg:py-3 font-bold">
                  🔄 New Game
                </button>
              </div>
            )}

            {gameStatus === 'finished' && (
              <div className="flex gap-2 w-full mt-2">
                <button onClick={handleNewGame} className="btn-primary rounded-none flex-1 text-xs py-2 lg:py-3 font-bold">
                  🔄 Play Again
                </button>
                <button
                  onClick={() => setShowGameReview(true)}
                  className="btn-secondary rounded-none flex-1 text-xs py-2 lg:py-3 font-bold"
                >
                  📊 Review
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex-1 w-full lg:max-w-sm flex flex-col gap-2 overflow-y-auto lg:overflow-hidden min-h-0">
            {/* Players info */}
            <div className="flex gap-1 flex-shrink-0">
              <div className="flex-1 bg-navy-800/60 border border-navy-700/50 p-1.5">
                {[{ ...currentPlayer, elo: user?.elo?.free || 1200 }, botPlayer].map((p, i) => (
                  <div key={i} className={`flex items-center gap-1 p-1 rounded-none mb-0.5 last:mb-0 ${
                    p.id === user?.id ? 'bg-chess-green/5 border border-chess-green/10' : 'bg-navy-900/30'
                  }`}>
                    <div className={`w-2 h-2 flex-shrink-0 ${i === 0 ? 'bg-white' : 'bg-slate-700 border border-slate-500'}`} />
                    <span className="text-[10px] lg:text-xs font-medium text-white truncate flex-1">
                      {i === 1 ? '🤖 ' : ''}{p.username}
                    </span>
                    {p.id === user?.id && <span className="text-[9px] text-chess-green font-bold">YOU</span>}
                    {p.id === 'bot' && <span className={`text-[9px] font-bold ${diffInfo.color}`}>{diffInfo.label}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Last move classification */}
            {classifications.length > 0 && (() => {
              const last = classifications[classifications.length - 1];
              const CLASS_COLORS = {
                brilliant: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
                best: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
                excellent: 'text-green-400 bg-green-500/15 border-green-500/30',
                good: 'text-slate-400 bg-slate-500/15 border-slate-500/30',
                inaccuracy: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
                mistake: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
                blunder: 'text-red-400 bg-red-500/15 border-red-500/30',
              };
              const CLASS_ICONS = { brilliant: '‼', best: '★', excellent: '★', good: '●', inaccuracy: '?!', mistake: '?', blunder: '??' };
              const colors = CLASS_COLORS[last.classification] || CLASS_COLORS.good;
              return (
                <div className={`p-2 rounded-none border ${colors} flex items-center gap-2 flex-shrink-0`}>
                  <span className="font-black text-lg">{CLASS_ICONS[last.classification]}</span>
                  <span className="text-sm font-bold capitalize">{last.classification}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{last.reason}</span>
                </div>
              );
            })()}

            {/* Move history */}
            <div className="flex-shrink-0 max-h-[22vh] lg:max-h-full lg:flex-1 overflow-hidden flex flex-col">
              <MoveHistory
                moves={moveHistory}
                currentIndex={previewIndex}
                onClickMove={setPreviewIndex}
                classifications={classifications}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {resultData && (
        <ResultModal
          result={resultData}
          onClose={() => setResultData(null)}
          onBackToLobby={() => navigate('/')}
          onPlayAgain={handleNewGame}
          onGameReview={() => { setResultData(null); setShowGameReview(true); }}
          isBotGame
        />
      )}

      {/* Game Review */}
      {showGameReview && classifications.length > 0 && (
        <GameReview
          moves={moveHistory}
          review={reviewData}
          playerColor="w"
          onClose={() => setShowGameReview(false)}
        />
      )}
    </div>
  );
}
