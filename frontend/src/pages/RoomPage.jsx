import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import { Chess } from 'chess.js';
import ChessBoard from '../components/ChessBoard';
import ResultModal from '../components/ResultModal';
import MatchOptions from '../components/MatchOptions';
import MoveHistory from '../components/MoveHistory';
import GameReview from '../components/GameReview';
import MatchSettings from '../components/MatchSettings';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export default function RoomPage() {
  const { roomId: contestId } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);

  const socketRef = useRef(null);
  const matchDataRef = useRef(null);

  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [status, setStatus] = useState('Connecting...');
  const [gameStatus, setGameStatus] = useState('waiting');
  const [whitePlayer, setWhitePlayer] = useState(null);
  const [blackPlayer, setBlackPlayer] = useState(null);
  const [currentPlayerColor, setCurrentPlayerColor] = useState(null);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [moveHistory, setMoveHistory] = useState([]);
  const [timerData, setTimerData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [drawOfferPending, setDrawOfferPending] = useState(false);
  const [drawOfferReceived, setDrawOfferReceived] = useState(false);
  const [floatingEmoji, setFloatingEmoji] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(-1);
  const [lastMove, setLastMove] = useState(null);
  const [showGameReview, setShowGameReview] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [contestType, setContestType] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const chatRef = useRef(null);

  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chess-settings') || '{}'); } catch { return {}; }
  });

  const moveSansRef = useRef([]);

  const getPreviewFen = useCallback(() => {
    if (previewIndex === -1 || moveHistory.length === 0) return null;
    try {
      const game = new Chess();
      for (let i = 0; i <= previewIndex && i < moveHistory.length; i++) game.move(moveHistory[i]);
      return game.fen();
    } catch { return null; }
  }, [previewIndex, moveHistory]);

  const displayFen = previewIndex === -1 ? fen : (getPreviewFen() || fen);

  useEffect(() => {
    if (!contestId) return;
    const userId = user?.id;

    // Helper to setup match state
    const setupMatch = (data) => {
      // Support both new socket format (roomId) and old format (contestId)
      const rId = data.roomId || data.contestId;
      if (rId && rId !== contestId) return;

      matchDataRef.current = data;
      if (data.contestType) setContestType(data.contestType);
      setFen(data.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      setMoveHistory([]);
      moveSansRef.current = [];
      setLastMove(null);
      setPreviewIndex(-1);
      setDrawOfferPending(false);
      setDrawOfferReceived(false);
      setResultData(null);
      setReviewData(null);

      if (userId && data.whitePlayer?.id === userId) {
        setCurrentPlayerColor('white');
        setBoardOrientation('white');
      } else if (userId && data.blackPlayer?.id === userId) {
        setCurrentPlayerColor('black');
        setBoardOrientation('black');
      } else {
        setCurrentPlayerColor(null);
      }

      setWhitePlayer(data.whitePlayer);
      setBlackPlayer(data.blackPlayer);
      setGameStatus('playing');
      setStatus('Match in progress');
    };

    // 1. Initial REST API check
    const checkRoomState = async () => {
      try {
        const res = await fetch(`${API_URL}/api/rooms/${contestId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
        });
        if (res.ok) {
          const roomData = await res.json();
          // If room is ongoing, trigger matchStarted logic manually
          if (roomData.status === 'ongoing' && roomData.players?.length >= 2) {
             const [p1, p2] = roomData.players;
             setupMatch({
               roomId: roomData.roomId || roomData._id,
               fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
               whitePlayer: { id: p1._id || p1, username: p1.username || 'Player1' },
               blackPlayer: { id: p2._id || p2, username: p2.username || 'Player2' },
             });
          }
        }
      } catch (err) { }
    };
    checkRoomState();

    // 2. Socket logic
    if (!socketRef.current) socketRef.current = io(SOCKET_URL);
    const socket = socketRef.current;
    socket.removeAllListeners();

    if (userId) {
      socket.emit('identify', { userId });
      socket.emit('joinRoom', { roomId: contestId, userId });
    }

    socket.on('matchStarted', (data) => {
      if (matchDataRef.current) return; // Use ref check to avoid stale multiple triggers
      setupMatch(data);
    });

    socket.on('gameReady', ({ contestId: cid }) => {
      if (cid === contestId) setStatus('Game started! Make your move.');
    });

    socket.on('timerStart', (data) => {
      if (data.contestId === contestId) setTimerData(data);
    });

    socket.on('moveMade', ({ contestId: cid, fen: newFen, san, from, to }) => {
      if (cid !== contestId) return;
      setFen(newFen);
      if (san) {
        setMoveHistory(prev => [...prev, san]);
        moveSansRef.current.push(san);
      }
      setPreviewIndex(-1);
      if (from && to) setLastMove({ from, to });
    });

    socket.on('matchEnded', (data) => {
      if (data.contestId !== contestId) return;
      setGameStatus('finished');
      setTimerData(null);
      setDrawOfferPending(false);
      setDrawOfferReceived(false);

      setReviewData(data.review || null);
      setResultData({
        isWinner: data.isWinner,
        isDraw: data.isDraw,
        reason: data.reason || 'unknown',
        payout: data.payout || 0,
        eloChange: data.eloChange || null,
        newElo: data.newElo || null,
        newWallet: data.newWallet || null,
        review: data.review || null,
        playerColor: currentPlayerColor === 'white' ? 'w' : 'b',
        contestType: data.contestType,
        prize: data.isWinner ? (data.payout || 0) : 0,
      });

      setStatus(`Match ended — ${data.reason}`);
      refreshUser();
    });

    socket.on('drawOffer', ({ contestId: cid }) => { if (cid === contestId) setDrawOfferReceived(true); });
    socket.on('drawDeclined', ({ contestId: cid }) => { if (cid === contestId) setDrawOfferPending(false); });
    socket.on('emojiReaction', ({ emoji, playerId }) => {
      if (playerId !== userId) { setFloatingEmoji(emoji); setTimeout(() => setFloatingEmoji(null), 2500); }
    });
    socket.on('matchChat', (msgData) => {
      setChatMessages(prev => [...prev, msgData]);
      setTimeout(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 50);
    });
    socket.on('errorMsg', (msg) => console.error('Socket error:', msg));
    socket.on('forceLogout', () => navigate('/login'));

    // On mount, emit playerReady (the ChessBoard also does this, but double-sure)
    // Actually let ChessBoard handle it

    return () => {};
  }, [contestId]);

  useEffect(() => {
    return () => {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    };
  }, []);

  const handleMove = ({ from, to, promotion }) => {
    if (!matchDataRef.current || !currentPlayerColor) return;
    if (previewIndex !== -1) { setPreviewIndex(-1); return; }
    socketRef.current?.emit('makeMove', {
      contestId, from, to, promotion, playerId: user.id,
    });
  };

  const handlePlayerReady = () => {
    socketRef.current?.emit('playerReady', { contestId, userId: user.id });
  };

  const handleResign = () => {
    socketRef.current?.emit('resign', { contestId, playerId: user.id });
  };

  const handleDrawOffer = () => {
    if (drawOfferPending) return;
    setDrawOfferPending(true);
    socketRef.current?.emit('drawOffer', { contestId, playerId: user.id });
  };

  const handleDrawResponse = (accepted) => {
    setDrawOfferReceived(false);
    socketRef.current?.emit('drawResponse', { contestId, playerId: user.id, accepted });
  };

  const handleEmojiReaction = (emoji) => {
    socketRef.current?.emit('emojiReaction', { contestId, emoji, playerId: user.id });
    setFloatingEmoji(emoji);
    setTimeout(() => setFloatingEmoji(null), 2500);
  };

  const handleFlipBoard = () => setBoardOrientation(p => p === 'white' ? 'black' : 'white');

  const isSpectator = currentPlayerColor === null && matchDataRef.current !== null;
  const currentPlayer = currentPlayerColor ? { color: currentPlayerColor, ...(currentPlayerColor === 'white' ? whitePlayer : blackPlayer) } : null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-hero px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-white">{contestType?.name || 'Match'}</h1>
              <span className={`badge ${gameStatus === 'playing' ? 'badge-green' : gameStatus === 'finished' ? 'badge-purple' : 'badge-gold'}`}>
                {gameStatus === 'playing' ? '🔴 Live' : gameStatus === 'finished' ? 'Ended' : 'Waiting'}
              </span>
            </div>
            <p className="text-sm text-slate-400">{status}</p>
            {contestType && (
              <p className="text-xs text-slate-500 mt-1">
                Entry: ₹{contestType.entry} → Prize: <span className="text-chess-green font-bold">₹{contestType.payout}</span>
              </p>
            )}
          </div>
          <button onClick={() => navigate('/')} className="btn-secondary btn-sm">← Lobby</button>
        </div>

        {/* Draw offer modal */}
        {drawOfferReceived && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-navy-800 border border-navy-700/50 rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scale-in">
              <div className="text-center">
                <div className="text-5xl mb-3">🤝</div>
                <h3 className="text-lg font-bold text-white mb-2">Draw Offered</h3>
                <p className="text-sm text-slate-400 mb-5">Your opponent is offering a draw. Entry fee will be refunded.</p>
                <div className="flex gap-3">
                  <button onClick={() => handleDrawResponse(false)} className="btn-secondary flex-1">Decline</button>
                  <button onClick={() => handleDrawResponse(true)} className="btn-primary flex-1">Accept Draw</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: Move History + Options */}
          <div className="lg:col-span-3 hidden lg:block">
            {matchDataRef.current && <MoveHistory moves={moveHistory} currentIndex={previewIndex} onClickMove={setPreviewIndex} />}
            {gameStatus === 'playing' && currentPlayerColor && (
              <div className="mt-4">
                <MatchOptions
                  onResign={handleResign}
                  onDrawOffer={handleDrawOffer}
                  onEmojiReaction={handleEmojiReaction}
                  onToggleSound={() => {
                    const ns = { ...settings, moveSound: !settings.moveSound };
                    setSettings(ns);
                    localStorage.setItem('chess-settings', JSON.stringify(ns));
                  }}
                  onFlipBoard={handleFlipBoard}
                  onOpenSettings={() => setShowSettings(true)}
                  soundEnabled={settings.moveSound !== false}
                  drawOfferPending={drawOfferPending}
                />
              </div>
            )}
          </div>

          {/* Center: Board */}
          <div className="lg:col-span-6">
            <div className="card">
              {matchDataRef.current ? (
                <ChessBoard
                  roomId={contestId}
                  matchId={contestId}
                  fen={displayFen}
                  onMove={handleMove}
                  onPlayerReady={handlePlayerReady}
                  currentPlayer={previewIndex === -1 ? currentPlayer : null}
                  whitePlayer={whitePlayer}
                  blackPlayer={blackPlayer}
                  isSpectator={isSpectator || previewIndex !== -1}
                  gameStatus={previewIndex !== -1 ? 'preview' : gameStatus}
                  boardOrientation={boardOrientation}
                  timerData={timerData}
                  floatingEmoji={floatingEmoji}
                  lastMove={lastMove}
                  settings={settings}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                  <div className="w-16 h-16 rounded-full bg-navy-700/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-chess-green border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-slate-400 text-sm">Waiting for match data...</p>
                </div>
              )}

              {previewIndex !== -1 && (
                <div className="mt-2 p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
                  <p className="text-xs text-sky-400">📖 Previewing move {previewIndex + 1}/{moveHistory.length}</p>
                  <button onClick={() => setPreviewIndex(-1)} className="text-xs text-sky-400 font-bold hover:text-sky-300">← Live</button>
                </div>
              )}
            </div>

            {/* Mobile options */}
            {gameStatus === 'playing' && currentPlayerColor && (
              <div className="lg:hidden mt-4">
                <MoveHistory moves={moveHistory} currentIndex={previewIndex} onClickMove={setPreviewIndex} />
                <div className="mt-3">
                  <MatchOptions
                    onResign={handleResign}
                    onDrawOffer={handleDrawOffer}
                    onEmojiReaction={handleEmojiReaction}
                    onToggleSound={() => {
                      const ns = { ...settings, moveSound: !settings.moveSound };
                      setSettings(ns);
                      localStorage.setItem('chess-settings', JSON.stringify(ns));
                    }}
                    onFlipBoard={handleFlipBoard}
                    onOpenSettings={() => setShowSettings(true)}
                    soundEnabled={settings.moveSound !== false}
                    drawOfferPending={drawOfferPending}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Match Info */}
          <div className="lg:col-span-3 hidden lg:block space-y-4">
            {/* Players */}
            {(whitePlayer || blackPlayer) && (
              <div className="card">
                <h3 className="text-sm font-bold text-slate-300 mb-3">Players</h3>
                {[whitePlayer, blackPlayer].filter(Boolean).map((p, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl mb-2 ${
                    p.id === user?.id ? 'bg-chess-green/5 border border-chess-green/10' : 'bg-navy-900/30'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-white border border-slate-400' : 'bg-slate-800 border border-slate-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.username}</p>
                      <p className="text-[10px] text-slate-500">ELO {p.elo || 1200}</p>
                    </div>
                    {p.id === user?.id && <span className="text-[10px] text-chess-green font-bold">YOU</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Contest Info */}
            {contestType && (
              <div className="card">
                <h3 className="text-sm font-bold text-slate-300 mb-3">Contest Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Entry</span><span className="text-white font-bold">₹{contestType.entry}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Prize</span><span className="text-chess-green font-bold">₹{contestType.payout}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Platform</span><span className="text-slate-400">₹{contestType.platform}</span></div>
                </div>
              </div>
            )}

            {/* Quick Chat */}
            {gameStatus === 'playing' && (
              <div className="card flex flex-col h-64">
                <h3 className="text-sm font-bold text-slate-300 mb-2">Quick Chat</h3>
                <div ref={chatRef} className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Say hi!</p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-bold text-chess-green">{msg.username}: </span>
                        <span className="text-slate-300">{msg.message}</span>
                      </div>
                    ))
                  )}
                </div>
                <select 
                  className="bg-navy-900 border border-navy-700 text-sm rounded-lg px-2 py-1.5 text-white outline-none"
                  onChange={(e) => {
                    if (e.target.value) {
                      socketRef.current?.emit('matchChat', { contestId, message: e.target.value, username: user.username });
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Send message...</option>
                  <option value="Good luck!">Good luck!</option>
                  <option value="Well played!">Well played!</option>
                  <option value="Thanks!">Thanks!</option>
                  <option value="Oops!">Oops!</option>
                  <option value="Nice move!">Nice move!</option>
                  <option value="You got lucky 😄">You got lucky 😄</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {resultData && (
        <ResultModal
          result={resultData}
          onClose={() => setResultData(null)}
          onBackToLobby={() => navigate('/')}
          onPlayAgain={() => navigate('/')}
          onGameReview={reviewData ? () => { setResultData(null); setShowGameReview(true); } : null}
        />
      )}

      {showGameReview && reviewData && (
        <GameReview
          moves={moveSansRef.current}
          review={reviewData}
          playerColor={currentPlayerColor === 'white' ? 'w' : 'b'}
          onClose={() => setShowGameReview(false)}
        />
      )}

      {showSettings && (
        <MatchSettings
          onClose={() => setShowSettings(false)}
          onApply={(s) => setSettings(s)}
        />
      )}
    </div>
  );
}
