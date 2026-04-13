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
import TournamentBracket from '../components/TournamentBracket';
import PingIndicator from '../components/PingIndicator';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export default function RoomPage() {
  const { roomId: contestId } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);

  const socketRef = useRef(null);
  const matchDataRef = useRef(null);

  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  // UseRef for chess instance
  const chessRef = useRef(new Chess());
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

  const [bracket, setBracket] = useState(null);
  const [showBracket, setShowBracket] = useState(false);
  const isTournament = contestId?.startsWith('tournament-');

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

    // Always keep chessRef in sync with FEN
    chessRef.current.load(fen);

    const setupMatch = (data) => {
      const rId = data.roomId || data.contestId || data._id;
      if (rId && rId !== contestId) return;

      matchDataRef.current = data;
      if (data.contestType) setContestType(data.contestType);
      setFen(data.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      chessRef.current.load(data.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      if (data.moves && data.moves.length > 0) {
        setMoveHistory(data.moves);
        moveSansRef.current = [...data.moves];
        try {
          const game = new Chess();
          let lastMoveData = null;
          for (const san of data.moves) {
            const m = game.move(san);
            if (m) lastMoveData = { from: m.from, to: m.to };
          }
          if (lastMoveData) setLastMove(lastMoveData);
        } catch { }
      } else {
        setMoveHistory([]);
        moveSansRef.current = [];
        setLastMove(null);
      }

      setPreviewIndex(-1);
      setDrawOfferPending(false);
      setDrawOfferReceived(false);
      setResultData(null);
      setReviewData(null);

      let wId = typeof data.whitePlayer === 'object' ? data.whitePlayer?.id || data.whitePlayer?._id : data.whitePlayer;
      let bId = typeof data.blackPlayer === 'object' ? data.blackPlayer?.id || data.blackPlayer?._id : data.blackPlayer;

      if (userId && wId === userId) {
        setCurrentPlayerColor('white');
        setBoardOrientation('white');
      } else if (userId && bId === userId) {
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

    const checkRoomState = async () => {
      if (matchDataRef.current) return;
      try {
        const res = await fetch(`${API_URL}/api/rooms/${contestId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
        });
        if (res.ok) {
          const roomData = await res.json();
          if ((roomData.status === 'ongoing' || roomData.status === 'completed') && roomData.players?.length >= 2) {
            const wId = roomData.whitePlayer?._id || roomData.whitePlayer;
            const bId = roomData.blackPlayer?._id || roomData.blackPlayer;

            let wp = roomData.players.find(p => p._id === wId) || roomData.players[0];
            let bp = roomData.players.find(p => p._id === bId) || roomData.players[1];

            setupMatch({
              contestId: roomData._id,
              fen: roomData.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              whitePlayer: { id: wp._id, username: wp.username, elo: wp.elo?.free || 1200 },
              blackPlayer: { id: bp._id, username: bp.username, elo: bp.elo?.free || 1200 },
              contestType: roomData.contestType,
              moves: (roomData.moves || []).map(m => m.san).filter(Boolean)
            });

            if (roomData.status === 'completed') {
              setGameStatus('finished');
              setResultData({
                isWinner: roomData.winner === userId,
                isDraw: roomData.result === 'draw',
                reason: roomData.reason,
                playerColor: wId === userId ? 'w' : 'b',
                review: roomData.review
              });
            }
          }
        }
      } catch (err) { }
    };
    checkRoomState();

    const fetchBracket = async () => {
      if (!isTournament) return;
      try {
        const res = await fetch(`${API_URL}/api/rooms/${contestId}/bracket`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
        });
        if (res.ok) setBracket(await res.json());
      } catch (err) { }
    };
    if (isTournament) fetchBracket();

    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io(SOCKET_URL, { reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000 });
    }
    const socket = socketRef.current;

    // Clear previously attached listeners to avoid duplicates
    socket.off('matchStarted');
    socket.off('gameReady');
    socket.off('timerStart');
    socket.off('moveMade');
    socket.off('matchEnded');
    socket.off('drawOffer');
    socket.off('drawDeclined');
    socket.off('emojiReaction');
    socket.off('matchChat');
    socket.off('forceLogout');
    socket.off('connect');

    socket.on('connect', () => {
      if (userId) {
        socket.emit('identify', { userId });
        socket.emit('joinRoom', { roomId: contestId, userId });
      }
    });

    if (socket.connected && userId) {
      socket.emit('identify', { userId });
      socket.emit('joinRoom', { roomId: contestId, userId });
    }

    socket.on('matchStarted', (data) => {
      console.log('[RoomPage] matchStarted received:', data);
      console.log('[RoomPage] player color:', data.whitePlayer?.id === user?.id ? 'white' : 'black');
      setupMatch(data);
    });

    socket.on('gameReady', ({ contestId: cid }) => {
      if (cid === contestId) setStatus('Game started! Make your move.');
    });

    socket.on('timerStart', (data) => {
      if (data.contestId === contestId) setTimerData(data);
    });

    socket.on('moveMade', ({ contestId: cid, fen: newFen, san, from, to, isCheckmate }) => {
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
    socket.on('disconnect', () => { setTimeout(() => socket.connect(), 2000); });

    return () => {
      socket.off('matchStarted');
      socket.off('gameReady');
      socket.off('timerStart');
      socket.off('moveMade');
      socket.off('matchEnded');
      socket.off('drawOffer');
      socket.off('drawDeclined');
      socket.off('emojiReaction');
      socket.off('matchChat');
      socket.off('forceLogout');
      socket.off('disconnect');
      socket.off('connect');
      socket.off('errorMsg');
    };
  }, [contestId, user?.id]);

  useEffect(() => {
    return () => {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    };
  }, []);

  // Only allow move if player color matches chess.turn()
  const handleMove = ({ from, to, promotion }) => {
    if (!matchDataRef.current || !currentPlayerColor) return;
    if (previewIndex !== -1) { setPreviewIndex(-1); return; }
    const chess = chessRef.current;
    const turn = chess.turn();
    if ((turn === 'w' && currentPlayerColor !== 'white') || (turn === 'b' && currentPlayerColor !== 'black')) {
      setStatus('Not your turn');
      return;
    }
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

  const handleOpenGameReview = () => {
    if (gameStatus === 'playing') return;
    if (!reviewData) {
      socketRef.current?.emit('getReview', { contestId });
      socketRef.current?.once('reviewData', (data) => {
        if (data.contestId === contestId) {
          setReviewData(data.review);
          setResultData(null);
          setShowGameReview(true);
        }
      });
    } else {
      setResultData(null);
      setShowGameReview(true);
    }
  };

  const isSpectator = currentPlayerColor === null && matchDataRef.current !== null;
  const currentPlayer = currentPlayerColor ? { color: currentPlayerColor, ...(currentPlayerColor === 'white' ? whitePlayer : blackPlayer) } : null;

  // Auto-retry: if still not connected after 3s, re-emit joinRoom
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    if (currentPlayerColor || isSpectator || !contestId || !user?.id) return;
    const retryTimer = setTimeout(() => {
      console.log(`[RoomPage] Retry #${retryCount + 1}: re-emitting joinRoom for ${contestId}`);
      if (socketRef.current?.connected) {
        socketRef.current.emit('joinRoom', { roomId: contestId, userId: user.id });
      }
      setRetryCount(prev => prev + 1);
    }, 3000);
    return () => clearTimeout(retryTimer);
  }, [currentPlayerColor, isSpectator, contestId, user?.id, retryCount]);

  if (!currentPlayerColor && !isSpectator) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-chess-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connecting...</h2>
          <p className="text-slate-400">Loading match data and color assignment</p>
          {retryCount >= 2 && (
            <button
              onClick={() => {
                if (socketRef.current?.connected) {
                  socketRef.current.emit('joinRoom', { roomId: contestId, userId: user.id });
                } else {
                  socketRef.current = io(SOCKET_URL, { reconnection: true });
                  socketRef.current.on('connect', () => {
                    socketRef.current.emit('identify', { userId: user.id });
                    socketRef.current.emit('joinRoom', { roomId: contestId, userId: user.id });
                  });
                }
                setRetryCount(0);
              }}
              className="mt-4 btn-primary btn-sm"
            >
              🔄 Retry Connection
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-hero px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-white">{contestType?.name || 'Match'}</h1>
              <span className={`badge ${gameStatus === 'playing' ? 'badge-green' : gameStatus === 'finished' ? 'badge-purple' : 'badge-gold'}`}>
                {gameStatus === 'playing' ? '🔴 Live' : gameStatus === 'finished' ? 'Ended' : 'Waiting'}
              </span>
            </div>
            <p className="text-sm text-slate-400">{status}</p>
          </div>
          <div className="flex items-center gap-2">
            {isTournament && (
              <button
                onClick={() => setShowBracket(!showBracket)}
                className={`btn-sm flex items-center gap-2 font-bold ${showBracket ? 'btn-primary' : 'btn-secondary'}`}
              >
                <span>{showBracket ? '♟️ View Board' : '🏆 View Bracket'}</span>
              </button>
            )}
            <button onClick={() => navigate('/')} className="btn-secondary btn-sm">← Lobby</button>
          </div>
        </div>

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

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Board Column */}
          <div className="w-full lg:w-auto flex-shrink-0 mx-auto lg:mx-0">
            <div className="card relative aspect-square overflow-hidden" style={{ maxHeight: '70vh', maxWidth: '70vh', width: '100%', padding: '0px' }}>
              <div className="absolute top-2 right-2 z-10 hidden sm:block">
                <PingIndicator customSocket={socketRef.current} />
              </div>
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
                  isReview={false}
                  gameStatus={previewIndex !== -1 ? 'preview' : gameStatus}
                  boardOrientation={boardOrientation}
                  timerData={timerData}
                  floatingEmoji={floatingEmoji}
                  lastMove={lastMove}
                  settings={settings}
                  username={user?.username}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                  <div className="w-16 h-16 rounded-full bg-navy-700/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-chess-green border-t-transparent rounded-full animate-spin" />
                    {invalidMsg && (
                      <p className="text-red-400 text-sm font-bold text-center mt-3 animate-fade-in">{invalidMsg}</p>
                    )}
                  </div>
                </div>
              )}

              {previewIndex !== -1 && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-sky-500/10 border-t border-sky-500/20 flex items-center justify-between z-10 backdrop-blur-md">
                  <p className="text-[10px] text-sky-400 font-bold">📖 Previewing move {previewIndex + 1}/{moveHistory.length}</p>
                  <button onClick={() => setPreviewIndex(-1)} className="text-[10px] text-sky-400 font-black hover:text-sky-300">LIVE</button>
                </div>
              )}
            </div>
          </div>

          {/* Controls & Sidebar Column */}
          <div className="flex-1 w-full space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {matchDataRef.current && (
                <div className="lg:max-h-[300px] overflow-hidden">
                   <MoveHistory moves={moveHistory} currentIndex={previewIndex} onClickMove={setPreviewIndex} />
                </div>
              )}
              
              {currentPlayerColor && (
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
                  gameStatus={gameStatus}
                  onGameReview={(gameStatus === 'finished' || gameStatus === 'ended') ? handleOpenGameReview : null}
                />
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-6">
              {(whitePlayer || blackPlayer) && (
                <div className="card">
                  <h3 className="text-sm font-bold text-slate-300 mb-3">Players</h3>
                  {[whitePlayer, blackPlayer].filter(Boolean).map((p, i) => (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl mb-2 ${p.id === user?.id ? 'bg-chess-green/5 border border-chess-green/10' : 'bg-navy-900/30'
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
            </div>

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

      {resultData && (
        <ResultModal
          result={resultData}
          onClose={() => setResultData(null)}
          onBackToLobby={() => navigate('/')}
          onPlayAgain={() => navigate('/')}
          onGameReview={handleOpenGameReview}
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
