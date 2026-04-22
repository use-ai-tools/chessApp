import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import { Chess } from 'chess.js';
import ChessBoard from '../components/ChessBoard';
import ResultModal from '../components/ResultModal';
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
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [contestType, setContestType] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [confirmResign, setConfirmResign] = useState(false);
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
      socketRef.current = io(SOCKET_URL, { reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000, transports: ['websocket'], timeout: 60000 });
    }
    const socket = socketRef.current;

    // Clear previously attached listeners to avoid duplicates
    socket.off('matchStarted');
    socket.off('gameReady');
    socket.off('game-start');
    socket.off('timerStart');
    socket.off('moveMade');
    socket.off('matchEnded');
    socket.off('drawOffer');
    socket.off('drawDeclined');
    socket.off('emojiReaction');
    socket.off('matchChat');
    socket.off('forceLogout');
    socket.off('connect');
    socket.off('playerRole');

    socket.on('connect', () => {
      console.log('[Socket] Connected!', socket.id);
      if (userId) {
        socket.emit('identify', { userId });
        socket.emit('joinRoom', { roomId: contestId, userId });
        socket.emit('getMatchState', { contestId });
      }
    });

    if (socket.connected && userId) {
      console.log('[Socket] Already connected, joining...', socket.id);
      socket.emit('identify', { userId });
      socket.emit('joinRoom', { roomId: contestId, userId });
      socket.emit('getMatchState', { contestId });
    }

    socket.on('joinedRoom', () => {
      console.log('[Socket] joinedRoom received. Requesting state...');
      socket.emit('getMatchState', { contestId });
    });

    socket.on('playerRole', (role) => {
      console.log('[Socket] playerRole:', role);
      setCurrentPlayerColor(role);
      setBoardOrientation(role);
    });

    socket.on('matchState', (data) => {
      console.log('[Socket] matchState RECEIVED:', data);
      setGameStatus(data.status === 'playing' ? 'playing' : data.status === 'completed' ? 'finished' : 'waiting');
      if (data.status === 'playing') setStatus('Match in progress');
      setIsLoading(false);
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
      socket.off('game-start');
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
      socket.off('playerRole');
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
    const chess = new Chess(fen);
    const turn = chess.turn();
    if ((turn === 'w' && currentPlayerColor !== 'white') || (turn === 'b' && currentPlayerColor !== 'black')) {
      setStatus('Not your turn');
      return;
    }

    // Optimistic UI Update
    try {
      const move = chess.move({ from, to, promotion: promotion || 'q' });
      if (move) {
        setFen(chess.fen());
        setLastMove({ from, to });
      }
    } catch(e) {}

    socketRef.current?.emit('makeMove', {
      contestId, from, to, promotion, playerId: user.id,
    });
  };

  const handlePlayerReady = () => {
    socketRef.current?.emit('playerReady', { contestId, userId: user.id });
  };

  const handleResign = () => {
    if (!confirmResign) { setConfirmResign(true); return; }
    socketRef.current?.emit('resign', { contestId, playerId: user.id });
    setConfirmResign(false);
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

  if (!currentPlayerColor && !isSpectator && isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-hero flex items-center justify-center rounded-none">
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
                  socketRef.current = io(SOCKET_URL, { reconnection: true, transports: ['websocket'], timeout: 60000 });
                  socketRef.current.on('connect', () => {
                    socketRef.current.emit('identify', { userId: user.id });
                    socketRef.current.emit('joinRoom', { roomId: contestId, userId: user.id });
                    socketRef.current.emit('getMatchState', { contestId });
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
    <div className="h-[calc(100vh-64px)] bg-hero flex flex-col">
      <style>{`button[title="Flip Board"] { display: none !important; }`}</style>
      <div className="flex-1 flex flex-col px-2 py-2 lg:px-4 lg:py-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm lg:text-xl font-bold text-white">{contestType?.name || 'Match'}</h1>
            <span className={`badge rounded-none text-[10px] ${gameStatus === 'playing' ? 'badge-green' : gameStatus === 'finished' ? 'badge-purple' : 'badge-gold'}`}>
              {gameStatus === 'playing' ? '🔴 Live' : gameStatus === 'finished' ? 'Ended' : 'Waiting'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isTournament && (
              <button
                onClick={() => setShowBracket(!showBracket)}
                className="btn-sm rounded-none text-[10px] font-bold btn-secondary"
              >
                {showBracket ? '♟️ Board' : '🏆 Bracket'}
              </button>
            )}
            <button onClick={() => navigate('/')} className="btn-secondary btn-sm rounded-none text-[10px]">← Lobby</button>
            <PingIndicator customSocket={socketRef.current} />
          </div>
        </div>

        {/* Main layout: board + sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-8 min-h-0 justify-center items-center max-w-7xl mx-auto w-full pb-4">
          {/* Board Column */}
          <div className="flex flex-col gap-2 flex-shrink-0 items-center justify-center" style={{ width: '100%', maxWidth: 'calc(100vh - 120px)' }}>
            <div className="w-full h-auto aspect-square relative items-center justify-center" style={{ maxHeight: 'calc(100vh - 120px)', borderRadius: 0 }}>
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
                <div className="flex items-center justify-center w-full h-full bg-navy-800/60">
                  <div className="w-8 h-8 border-2 border-chess-green border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {previewIndex !== -1 && (
                <div className="absolute bottom-0 left-0 right-0 p-1 bg-sky-500/10 border-t border-sky-500/20 flex items-center justify-between z-10">
                  <p className="text-[9px] text-sky-400 font-bold">📖 Move {previewIndex + 1}/{moveHistory.length}</p>
                  <button onClick={() => setPreviewIndex(-1)} className="text-[9px] text-sky-400 font-black">LIVE</button>
                </div>
              )}
            </div>

            {/* Game controls: resign/draw/settings below board */}
            {currentPlayerColor && gameStatus === 'playing' && (
              <div className="flex flex-col gap-2 w-full mt-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleResign}
                    className={`rounded-none flex-1 text-xs py-2 lg:py-3 font-bold transition-all ${
                      confirmResign ? 'bg-red-600 text-white animate-pulse' : 'btn-secondary'
                    }`}
                  >
                    🏳️ {confirmResign ? 'Confirm?' : 'Resign'}
                  </button>
                  <button
                    onClick={handleDrawOffer}
                    disabled={drawOfferPending}
                    className="btn-secondary rounded-none flex-1 text-xs py-2 lg:py-3 font-bold"
                  >
                    🤝 {drawOfferPending ? 'Sent...' : 'Draw'}
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="btn-secondary rounded-none flex-1 text-xs py-2 lg:py-3 font-bold"
                  >
                    ⚙️ Settings
                  </button>
                </div>
                {confirmResign && (
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmResign(false)} className="flex-1 py-2 rounded-none bg-navy-700 text-slate-300 text-xs font-medium">Cancel</button>
                    <button onClick={handleResign} className="flex-1 py-2 rounded-none bg-red-600 text-white text-xs font-bold">Yes, Resign</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: everything to the right of board */}
          <div className="flex-1 w-full lg:max-w-sm flex flex-col gap-2 overflow-y-auto lg:overflow-hidden min-h-0">
            {/* Players + Contest Info row */}
            <div className="flex gap-1 flex-shrink-0">
              {(whitePlayer || blackPlayer) && (
                <div className="flex-1 bg-navy-800/60 border border-navy-700/50 p-1.5">
                  {[whitePlayer, blackPlayer].filter(Boolean).map((p, i) => (
                    <div key={i} className={`flex items-center gap-1 p-1 rounded-none mb-0.5 last:mb-0 ${
                      p.id === user?.id ? 'bg-chess-green/5 border border-chess-green/10' : 'bg-navy-900/30'
                    }`}>
                      <div className={`w-2 h-2 flex-shrink-0 ${i === 0 ? 'bg-white' : 'bg-slate-700 border border-slate-500'}`} />
                      <span className="text-[10px] lg:text-xs font-medium text-white truncate flex-1">{p.username}</span>
                      {p.id === user?.id && <span className="text-[9px] text-chess-green font-bold">YOU</span>}
                    </div>
                  ))}
                </div>
              )}
              {contestType && (
                <div className="flex-1 bg-navy-800/60 border border-navy-700/50 p-1.5 flex flex-col justify-center gap-0.5">
                  <div className="flex justify-between text-[10px] lg:text-xs"><span className="text-slate-500">Entry</span><span className="text-white font-bold">₹{contestType.entry}</span></div>
                  <div className="flex justify-between text-[10px] lg:text-xs"><span className="text-slate-500">Prize</span><span className="text-chess-green font-bold">₹{contestType.payout}</span></div>
                </div>
              )}
            </div>

            {/* Move history */}
            {matchDataRef.current && (
              <div className="flex-shrink-0 max-h-[22vh] lg:max-h-full lg:flex-1 overflow-hidden flex flex-col">
                <MoveHistory moves={moveHistory} currentIndex={previewIndex} onClickMove={setPreviewIndex} />
              </div>
            )}

            {/* Chat */}
            {currentPlayerColor && gameStatus === 'playing' && (
              <div className="flex flex-col gap-1 flex-shrink-0 mt-auto">
                {/* Quick Chat */}
                <div className="bg-navy-800/60 border border-navy-700/50">
                  <select
                    className="w-full bg-navy-900 border-b border-navy-700 text-xs rounded-none px-2 py-2 text-white outline-none"
                    onChange={(e) => {
                      if (e.target.value) {
                        socketRef.current?.emit('matchChat', { contestId, message: e.target.value, username: user.username });
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">💬 Quick Chat...</option>
                    <option value="Good luck!">Good luck!</option>
                    <option value="Well played!">Well played!</option>
                    <option value="Thanks!">Thanks!</option>
                    <option value="Oops!">Oops!</option>
                    <option value="Nice move!">Nice move!</option>
                    <option value="You got lucky 😄">You got lucky 😄</option>
                  </select>
                  <div ref={chatRef} className="h-[15vh] lg:h-[200px] overflow-y-auto p-2 space-y-1">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-bold text-chess-green">{msg.username}: </span>
                        <span className="text-slate-300">{msg.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {drawOfferReceived && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy-800 border border-navy-700/50 rounded-none shadow-2xl p-4 max-w-sm w-full animate-scale-in">
            <div className="text-center">
              <div className="text-4xl mb-2">🤝</div>
              <h3 className="text-base font-bold text-white mb-1">Draw Offered</h3>
              <p className="text-xs text-slate-400 mb-4">Your opponent offers a draw. Entry fee refunded.</p>
              <div className="flex gap-2">
                <button onClick={() => handleDrawResponse(false)} className="btn-secondary rounded-none flex-1 text-xs">Decline</button>
                <button onClick={() => handleDrawResponse(true)} className="btn-primary rounded-none flex-1 text-xs">Accept</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
