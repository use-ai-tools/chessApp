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
  5: { label: 'Easy', depth: 5, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  10: { label: 'Medium', depth: 10, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  15: { label: 'Hard', depth: 15, color: 'text-red-400', bg: 'bg-red-500/10' },
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
  const [showMobileMoves, setShowMobileMoves] = useState(false);

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
  const botPlayer = { username: `Stockfish`, id: 'bot', elo: depth === 5 ? 800 : depth === 10 ? 1500 : 2200 };

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
    <div className="flex-1 w-full bg-hero flex flex-col overflow-visible relative">
      <div className="flex-1 flex flex-col">

        {/* ── Desktop Layout ── */}
        <div className="hidden lg:flex flex-1 max-w-7xl mx-auto w-full px-6 py-4 gap-6 items-start justify-center">

          {/* Left Panel — Bot Info + Controls */}
          <div className="w-[200px] flex-shrink-0 flex flex-col gap-3 sticky top-20">
            <div className="bg-navy-800/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <div>
                  <h3 className="text-sm font-bold text-white">vs Stockfish</h3>
                  <span className={`text-[10px] font-bold ${diffInfo.color}`}>{diffInfo.label} • Depth {depth}</span>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Moves</span>
                  <span className="text-white font-semibold">{moveHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className={`font-semibold ${gameStatus === 'playing' ? 'text-emerald-400' : 'text-purple-400'}`}>
                    {gameStatus === 'playing' ? '● Live' : 'Ended'}
                  </span>
                </div>
                {botThinking && (
                  <div className="flex items-center gap-1.5 text-purple-400 animate-pulse">
                    <span className="w-2.5 h-2.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-semibold">Bot thinking...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            {gameStatus === 'playing' && (
              <div className="flex flex-col gap-2">
                <button onClick={handleResign}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    confirmResign ? 'bg-red-600 text-white animate-pulse' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >🏳️ {confirmResign ? 'Confirm Resign?' : 'Resign'}</button>
                {confirmResign && <button onClick={() => setConfirmResign(false)} className="w-full py-2 rounded-xl text-xs bg-navy-700/50 text-slate-400 font-medium">Cancel</button>}
                <button onClick={handleNewGame} className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all">🔄 New Game</button>
              </div>
            )}
            {gameStatus === 'finished' && (
              <div className="flex flex-col gap-2">
                <button onClick={handleNewGame} className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white hover:shadow-md hover:shadow-chess-green/15 transition-all">🔄 Play Again</button>
                <button onClick={() => setShowGameReview(true)} className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all">📊 Game Review</button>
              </div>
            )}
          </div>

          {/* Center — Board */}
          <div className="flex flex-col items-center flex-shrink-0 w-full max-w-[560px]">
            {/* Top player — Bot */}
            <div className="w-full flex items-center gap-2.5 px-3 py-2 bg-navy-800/30 rounded-t-xl mb-0">
              <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 border border-slate-600 flex items-center justify-center text-[10px] font-bold">🤖</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">Stockfish <span className={`text-[9px] ${diffInfo.color}`}>({diffInfo.label})</span></p>
                <p className="text-[9px] text-slate-500">ELO ~{botPlayer.elo}</p>
              </div>
            </div>

            {/* Board */}
            <div className="w-full">
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
            </div>

            {/* Bottom player — You */}
            <div className="w-full flex items-center gap-2.5 px-3 py-2 bg-navy-800/30 rounded-b-xl mt-0">
              <div className="w-7 h-7 rounded-full bg-white text-slate-800 flex items-center justify-center text-[10px] font-bold">
                {(user?.username || 'Y').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.username || 'You'} <span className="text-[9px] text-chess-green font-bold">YOU</span></p>
                <p className="text-[9px] text-slate-500">ELO {user?.elo?.free || 1200}</p>
              </div>
            </div>

            {/* Preview indicator */}
            {previewIndex !== -1 && (
              <div className="w-full mt-1 px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center justify-between">
                <p className="text-[10px] text-sky-400 font-bold">📖 Reviewing move {previewIndex + 1}/{moveHistory.length}</p>
                <button onClick={() => setPreviewIndex(-1)} className="text-[10px] text-sky-400 font-black hover:text-sky-300 transition-colors">↩ LIVE</button>
              </div>
            )}
          </div>

          {/* Right Panel — Move History */}
          <div className="w-[280px] flex-shrink-0 sticky top-20">
            <div className="bg-navy-800/30 rounded-xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <div className="px-4 py-2.5 border-b border-navy-700/20 flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Moves</h3>
                <span className="text-[10px] text-slate-600">{moveHistory.length} moves</span>
              </div>
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <MoveHistory moves={moveHistory} currentIndex={previewIndex} onClickMove={setPreviewIndex} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile Layout ── */}
        <div className="lg:hidden flex flex-col px-3 py-2 gap-2">

          {/* Header */}
          <div className="flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white">🤖 vs Bot</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${diffInfo.bg} ${diffInfo.color}`}>{diffInfo.label}</span>
              {botThinking && (
                <span className="flex items-center gap-1 text-[10px] text-purple-400 animate-pulse">
                  <span className="w-2 h-2 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                  Thinking...
                </span>
              )}
            </div>
          </div>

          {/* Top player — Bot */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-navy-800/30 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 border border-slate-600 flex items-center justify-center text-[9px] font-bold">🤖</div>
            <p className="text-[11px] font-semibold text-white truncate flex-1">Stockfish <span className={`text-[9px] ${diffInfo.color}`}>({diffInfo.label})</span></p>
          </div>

          {/* Board */}
          <div className="w-full max-w-[100vw]">
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
          </div>

          {/* Bottom player — You */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-navy-800/30 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-white text-slate-800 flex items-center justify-center text-[9px] font-bold">
              {(user?.username || 'Y').charAt(0).toUpperCase()}
            </div>
            <p className="text-[11px] font-semibold text-white truncate flex-1">{user?.username || 'You'} <span className="text-[9px] text-chess-green font-bold">YOU</span></p>
          </div>

          {/* Preview indicator */}
          {previewIndex !== -1 && (
            <div className="px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center justify-between">
              <p className="text-[10px] text-sky-400 font-bold">📖 Move {previewIndex + 1}/{moveHistory.length}</p>
              <button onClick={() => setPreviewIndex(-1)} className="text-[10px] text-sky-400 font-black">↩ LIVE</button>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2 w-full">
            {gameStatus === 'playing' && (
              <>
                <button onClick={handleResign}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    confirmResign ? 'bg-red-600 text-white animate-pulse' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >🏳️ {confirmResign ? 'Confirm?' : 'Resign'}</button>
                {confirmResign && <button onClick={() => setConfirmResign(false)} className="flex-1 py-2 rounded-xl text-xs bg-navy-700/50 text-slate-400">Cancel</button>}
                <button onClick={handleNewGame} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all">🔄 New Game</button>
              </>
            )}
            {gameStatus === 'finished' && (
              <>
                <button onClick={handleNewGame} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white">🔄 Play Again</button>
                <button onClick={() => setShowGameReview(true)} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 hover:bg-white/10">📊 Review</button>
              </>
            )}
          </div>

          {/* Mobile: Collapsible Move History */}
          <button
            onClick={() => setShowMobileMoves(!showMobileMoves)}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            {showMobileMoves ? '▲ Hide Moves' : `▼ Show Moves (${moveHistory.length})`}
          </button>
          {showMobileMoves && (
            <div className="bg-navy-800/30 rounded-xl max-h-[200px] overflow-y-auto animate-slide-down" style={{ scrollbarWidth: 'thin' }}>
              <MoveHistory moves={moveHistory} currentIndex={previewIndex} onClickMove={setPreviewIndex} />
            </div>
          )}
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
