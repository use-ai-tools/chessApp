import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import ChessBoard from '../components/ChessBoard';
import MoveHistory from '../components/MoveHistory';
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
  const [gameStatus, setGameStatus] = useState('playing');
  const [resultData, setResultData] = useState(null);
  const [botThinking, setBotThinking] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(-1);
  const [showGameReview, setShowGameReview] = useState(false);

  // Eval tracking (computed silently, shown ONLY in review)
  const prevEvalRef = useRef({ type: 'cp', value: 0 });
  const [classifications, setClassifications] = useState([]);
  const [moveAnalysis, setMoveAnalysis] = useState([]);

  const [settings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chess-settings') || '{}'); } catch { return {}; }
  });

  // Player is always white
  const boardOrientation = 'white';
  const currentPlayer = { color: 'white', username: user?.username || 'You', id: user?.id };
  const botPlayer = { username: `Bot (${diffInfo.label})`, id: 'bot', elo: depth === 5 ? 800 : depth === 10 ? 1500 : 2200 };

  // Check game end
  const checkGameEnd = useCallback((chess) => {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'b' ? 'white' : 'black';
      setGameStatus('finished');
      setResultData({ isWinner: winner === 'white', isDraw: false, reason: 'checkmate', playerColor: 'w' });
      return true;
    }
    if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
      setGameStatus('finished');
      setResultData({ isWinner: false, isDraw: true, reason: chess.isStalemate() ? 'stalemate' : 'draw', playerColor: 'w' });
      return true;
    }
    return false;
  }, []);

  // Evaluate position and classify move (silent — no UI during play)
  const evaluateAndClassify = useCallback(async (newFen, moveSan) => {
    try {
      const result = await getEvalAndBestMove(newFen, Math.min(depth, 12));
      let evalForMover = { type: result.eval.type, value: -result.eval.value };
      const prev = prevEvalRef.current;
      const classification = classifyMove(prev.value, evalForMover.value, prev.type, evalForMover.type);
      setClassifications(c => [...c, { classification, reason: `Eval: ${evalForMover.value > 0 ? '+' : ''}${evalForMover.value}cp` }]);
      setMoveAnalysis(a => [...a, { move: moveSan, eval: evalForMover, classification }]);
      prevEvalRef.current = { type: result.eval.type, value: result.eval.value };
      return result;
    } catch (e) {
      return null;
    }
  }, [depth, getEvalAndBestMove]);

  // Bot makes a move
  const botMove = useCallback(async (currentFen) => {
    if (gameStatus !== 'playing') return;
    setBotThinking(true);
    try {
      await new Promise(r => setTimeout(r, 200 + Math.random() * 400));
      const result = await getEvalAndBestMove(currentFen, depth);
      const bestMove = result.bestMove;
      if (!bestMove || bestMove === '(none)') { setBotThinking(false); return; }

      const chess = new Chess(currentFen);
      const from = bestMove.substring(0, 2);
      const to = bestMove.substring(2, 4);
      const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
      const move = chess.move({ from, to, promotion });
      if (!move) { setBotThinking(false); return; }

      chessRef.current = chess;
      setFen(chess.fen());
      setLastMove({ from, to });
      setMoveHistory(prev => [...prev, move.san]);
      setPreviewIndex(-1);
      setBotThinking(false);
      if (checkGameEnd(chess)) return;
      evaluateAndClassify(chess.fen(), move.san);
    } catch (e) {
      setBotThinking(false);
    }
  }, [depth, gameStatus, getEvalAndBestMove, evaluateAndClassify, checkGameEnd]);

  // Handle player move
  const handleMove = useCallback(async ({ from, to, promotion }) => {
    if (gameStatus !== 'playing' || botThinking) return;
    if (previewIndex !== -1) { setPreviewIndex(-1); return; }
    const chess = new Chess(fen);
    if (chess.turn() !== 'w') return;
    try {
      const move = chess.move({ from, to, promotion: promotion || 'q' });
      if (!move) return;
      chessRef.current = chess;
      setFen(chess.fen());
      setLastMove({ from, to });
      setMoveHistory(prev => [...prev, move.san]);
      setPreviewIndex(-1);
      evaluateAndClassify(chess.fen(), move.san);
      if (!checkGameEnd(chess)) await botMove(chess.fen());
    } catch (e) {}
  }, [fen, gameStatus, botThinking, previewIndex, evaluateAndClassify, checkGameEnd, botMove]);

  const [confirmResign, setConfirmResign] = useState(false);
  const handleResign = () => {
    if (!confirmResign) { setConfirmResign(true); return; }
    setGameStatus('finished');
    setResultData({ isWinner: false, isDraw: false, reason: 'resigned', playerColor: 'w' });
    setConfirmResign(false);
  };

  const handleNewGame = () => {
    const chess = new Chess();
    chessRef.current = chess;
    setFen(chess.fen());
    setMoveHistory([]); setLastMove(null); setGameStatus('playing');
    setResultData(null); setBotThinking(false); setPreviewIndex(-1);
    setClassifications([]); setMoveAnalysis([]);
    prevEvalRef.current = { type: 'cp', value: 0 };
    setConfirmResign(false); setShowGameReview(false);
  };

  const getPreviewFen = useCallback(() => {
    if (previewIndex === -1 || moveHistory.length === 0) return null;
    try {
      const game = new Chess();
      for (let i = 0; i <= previewIndex && i < moveHistory.length; i++) game.move(moveHistory[i]);
      return game.fen();
    } catch { return null; }
  }, [previewIndex, moveHistory]);

  const displayFen = previewIndex === -1 ? fen : (getPreviewFen() || fen);

  const reviewData = { classifications, white: {}, black: {} };
  classifications.forEach((c, i) => {
    const side = i % 2 === 0 ? 'white' : 'black';
    reviewData[side][c.classification] = (reviewData[side][c.classification] || 0) + 1;
  });

  useEffect(() => { return () => terminate(); }, [terminate]);

  return (
    <div className="flex-1 w-full bg-hero flex flex-col overflow-y-auto relative pb-28 lg:pb-0">
      <div className="flex-1 flex flex-col px-2 py-2 lg:px-4 lg:py-3 lg:overflow-hidden">
        {/* Header */}
        <div className="flex lg:hidden items-center justify-between gap-2 mb-1 flex-shrink-0 absolute top-0 left-0 right-0 p-2 z-10 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <h1 className="text-sm lg:text-xl font-bold text-white">🤖 vs Bot</h1>
            <span className={`badge rounded-none text-[10px] font-bold ${
              depth === 5 ? 'badge-green' : depth === 10 ? 'badge-gold' : 'bg-red-500/15 text-red-400 border border-red-500/30'
            }`}>
              {diffInfo.label}
            </span>
            {botThinking && (
              <span className="flex items-center gap-1 text-[10px] text-purple-400 animate-pulse">
                <span className="w-2 h-2 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                Thinking...
              </span>
            )}
          </div>
        </div>

        {/* Main layout: left panel | board (centered) | right sidebar */}
        <div className="flex-1 w-full lg:h-full lg:overflow-hidden pt-10 lg:pt-0">
          <div className="w-full max-w-7xl mx-auto flex flex-col xl:grid xl:grid-cols-[180px_1fr_280px] xl:gap-6 items-center xl:justify-center px-1 lg:px-2">

            {/* LEFT PANEL — desktop only: bot info */}
            <div className="hidden xl:flex flex-col gap-2 h-full justify-center w-full">
              <div className="w-full max-w-[200px] bg-navy-800/60 border border-navy-700/50 p-3 rounded-none">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Bot Settings</h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Difficulty</span>
                    <span className={`font-bold ${diffInfo.color}`}>{diffInfo.label}</span>
                  </div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Depth</span><span className="text-white font-bold">{depth}</span></div>
                </div>
              </div>
              <div className="w-full max-w-[200px] bg-navy-800/60 border border-navy-700/50 p-3 rounded-none">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Game Stats</h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Moves</span><span className="text-white font-bold">{moveHistory.length}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Status</span>
                    <span className={`font-bold ${gameStatus === 'playing' ? 'text-emerald-400' : gameStatus === 'finished' ? 'text-purple-400' : 'text-gold-400'}`}>
                      {gameStatus === 'playing' ? 'Live' : gameStatus === 'finished' ? 'Ended' : 'Waiting'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER — Board */}
            <div className="flex flex-col gap-1 w-full xl:w-auto xl:h-full xl:justify-center items-center flex-1 min-h-0">
              <div className="relative w-full max-w-[100vw] lg:max-h-[80vh] lg:max-w-[500px] xl:max-w-[600px] flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
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
                  moveTimeoutMs={999999}
                  hideTimer={true}
                />
                {previewIndex !== -1 && (
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-sky-500/10 border-t border-sky-500/20 flex items-center justify-between z-10">
                    <p className="text-[9px] text-sky-400 font-bold">📖 Move {previewIndex + 1}/{moveHistory.length}</p>
                    <button onClick={() => setPreviewIndex(-1)} className="text-[9px] text-sky-400 font-black">LIVE</button>
                  </div>
                )}
              </div>

              {/* Controls below board */}
              {gameStatus === 'playing' && (
                <div className="flex gap-2 w-full max-w-[500px] xl:max-w-[600px] mt-2">
                  <button onClick={handleResign}
                    className={`rounded-none flex-1 text-xs py-2 font-bold transition-all ${confirmResign ? 'bg-red-600 text-white animate-pulse' : 'btn-secondary'}`}
                  >🏳️ {confirmResign ? 'Confirm?' : 'Resign'}</button>
                  {confirmResign && <button onClick={() => setConfirmResign(false)} className="rounded-none flex-1 text-xs py-2 bg-navy-700 text-slate-300 font-medium">Cancel</button>}
                  <button onClick={handleNewGame} className="btn-secondary rounded-none flex-1 text-xs py-2 font-bold">🔄 New Game</button>
                </div>
              )}
              {gameStatus === 'finished' && (
                <div className="flex gap-2 w-full mt-2">
                  <button onClick={handleNewGame} className="btn-primary rounded-none flex-1 text-xs py-2 font-bold">🔄 Play Again</button>
                  <button onClick={() => setShowGameReview(true)} className="btn-secondary rounded-none flex-1 text-xs py-2 font-bold">📊 Review</button>
                </div>
              )}
            </div>

            {/* PLAYER INFO — shows below board on mobile, sidebar on desktop */}
            <div className="flex flex-col gap-2 xl:h-full xl:justify-center w-full xl:w-[280px]">
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

              {/* Move history */}
              <div className="overflow-hidden flex flex-col min-h-0 max-h-[25vh] lg:max-h-full lg:flex-1">
                <MoveHistory moves={moveHistory} currentIndex={previewIndex} onClickMove={setPreviewIndex} />
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {showGameReview && classifications.length > 0 && (
        <GameReview moves={moveHistory} review={reviewData} playerColor="w" onClose={() => setShowGameReview(false)} />
      )}
    </div>
  );
}
