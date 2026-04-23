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
      await evaluateAndClassify(chess.fen(), move.san);
      setBotThinking(false);
      checkGameEnd(chess);
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
      await evaluateAndClassify(chess.fen(), move.san);
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
    <div className="h-[calc(100vh-64px)] bg-hero flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col px-2 py-2 lg:px-4 lg:py-3 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-1 flex-shrink-0">
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-1">
            <button onClick={handleNewGame} className="btn-secondary btn-sm rounded-none text-[10px]">🔄 New</button>
            <button onClick={() => navigate('/')} className="btn-secondary btn-sm rounded-none text-[10px]">← Home</button>
          </div>
        </div>

        {/* Main layout — no scroll */}
        <div className="flex-1 flex flex-col lg:flex-row gap-2 lg:gap-6 min-h-0 justify-center items-center max-w-7xl mx-auto w-full">
          {/* Board Column */}
          <div className="flex flex-col gap-1 flex-shrink-0 items-center justify-center" style={{ width: '100%', maxWidth: 'min(calc(100vh - 160px), 600px)' }}>
            <div className="w-full aspect-square relative" style={{ borderRadius: 0 }}>
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
              <div className="flex gap-2 w-full">
                <button onClick={handleResign}
                  className={`rounded-none flex-1 text-xs py-2 font-bold transition-all ${confirmResign ? 'bg-red-600 text-white animate-pulse' : 'btn-secondary'}`}
                >🏳️ {confirmResign ? 'Confirm?' : 'Resign'}</button>
                {confirmResign && <button onClick={() => setConfirmResign(false)} className="rounded-none flex-1 text-xs py-2 bg-navy-700 text-slate-300 font-medium">Cancel</button>}
                <button onClick={handleNewGame} className="btn-secondary rounded-none flex-1 text-xs py-2 font-bold">🔄 New Game</button>
              </div>
            )}
            {gameStatus === 'finished' && (
              <div className="flex gap-2 w-full">
                <button onClick={handleNewGame} className="btn-primary rounded-none flex-1 text-xs py-2 font-bold">🔄 Play Again</button>
                <button onClick={() => setShowGameReview(true)} className="btn-secondary rounded-none flex-1 text-xs py-2 font-bold">📊 Review</button>
              </div>
            )}
          </div>

          {/* Sidebar — players + move history only */}
          <div className="flex-1 w-full lg:max-w-xs flex flex-col gap-2 min-h-0 overflow-hidden">
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

            {/* Move history — NO classifications during live play */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <MoveHistory moves={moveHistory} currentIndex={previewIndex} onClickMove={setPreviewIndex} />
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
