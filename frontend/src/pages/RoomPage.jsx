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
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [tabWarning, setTabWarning] = useState(null);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const tabSwitchRef = useRef(0);
  const chatRef = useRef(null);

  const [bracket, setBracket] = useState(null);
  const [showBracket, setShowBracket] = useState(false);
  const [pendingResult, setPendingResult] = useState(null);
  const resultTimerRef = useRef(null);
  const isTournament = contestId?.startsWith('tournament-');

  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chess-settings') || '{}'); } catch { return {}; }
  });

  const moveSansRef = useRef([]);
  const lastOptimisticMoveRef = useRef(null);

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
      if (userId) {
        socket.emit('identify', { userId });
        socket.emit('joinRoom', { roomId: contestId, userId });
        socket.emit('getMatchState', { contestId });
      }
    });

    if (socket.connected && userId) {
      socket.emit('identify', { userId });
      socket.emit('joinRoom', { roomId: contestId, userId });
      socket.emit('getMatchState', { contestId });
    }

    socket.on('joinedRoom', () => {
      socket.emit('getMatchState', { contestId });
    });

    socket.on('playerRole', (role) => {
      setCurrentPlayerColor(role);
      setBoardOrientation(role);
    });

    socket.on('matchState', (data) => {
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
      // Skip if this is the echo of our own optimistic move (already applied locally)
      const opt = lastOptimisticMoveRef.current;
      if (opt && opt.from === from && opt.to === to) {
        lastOptimisticMoveRef.current = null;
        return;
      }
      lastOptimisticMoveRef.current = null;
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

      const myColor = currentPlayerColor === 'white' ? 'w' : 'b';
      let winner = null;
      if (!data.isDraw) {
        winner = data.isWinner ? (myColor === 'w' ? 'white' : 'black') : (myColor === 'w' ? 'black' : 'white');
      }

      const finalResult = {
        isWinner: data.isWinner,
        isDraw: data.isDraw,
        reason: data.reason || 'unknown',
        payout: data.payout || 0,
        eloChange: data.eloChange || null,
        newElo: data.newElo || null,
        newWallet: data.newWallet || null,
        review: data.review || null,
        playerColor: myColor,
        contestType: data.contestType,
        prize: data.isWinner ? (data.payout || 0) : 0,
        winner,
      };

      // Show board indicators immediately; defer modal by 1.2s
      setPendingResult(finalResult);
      clearTimeout(resultTimerRef.current);
      resultTimerRef.current = setTimeout(() => setResultData(finalResult), 1200);

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

  // Emit leaveRoom when navigating away (before match starts)
  const handleLeaveRoom = useCallback(() => {
    if (gameStatus === 'waiting' || (!matchDataRef.current)) {
      socketRef.current?.emit('leaveRoom', { contestId, userId: user?.id });
      refreshUser();
    }
    navigate('/');
  }, [contestId, user?.id, gameStatus, navigate, refreshUser]);

  // beforeunload — emit leaveRoom when browser tab closes/refreshes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (gameStatus === 'waiting' || (!matchDataRef.current)) {
        socketRef.current?.emit('leaveRoom', { contestId, userId: user?.id });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [contestId, user?.id, gameStatus]);

  // ── ITEM 4: Anti-cheat tab-switch detection ──
  useEffect(() => {
    if (gameStatus !== 'playing' || !currentPlayerColor) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setIsTabHidden(true);
        tabSwitchRef.current += 1;
        const count = tabSwitchRef.current;
        if (count >= 3) {
          // Auto-resign after 3 tab switches
          socketRef.current?.emit('resign', { contestId, playerId: user?.id });
          setTabWarning('Auto-resigned due to repeated tab switching.');
        } else {
          setTabWarning(`⚠️ Warning ${count}/3 — Leaving match may result in auto resign.`);
        }
      } else {
        setIsTabHidden(false);
        // Clear warning after 3 seconds on return
        setTimeout(() => setTabWarning(null), 3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [gameStatus, currentPlayerColor, contestId, user?.id]);

  // Reset tab switch count on new match
  useEffect(() => {
    if (gameStatus === 'playing') tabSwitchRef.current = 0;
  }, [contestId]);

  // ── ITEM 5: Exit confirmation — block browser back/refresh during match ──
  useEffect(() => {
    if (gameStatus !== 'playing' || !currentPlayerColor) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Leaving will count as resignation. Are you sure?';
      return e.returnValue;
    };

    const handlePopState = (e) => {
      // Push state back to prevent navigation, show modal instead
      window.history.pushState(null, '', window.location.href);
      setShowLeaveModal(true);
    };

    // Push an extra history entry so we can intercept back
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [gameStatus, currentPlayerColor]);

  const handleResignAndExit = () => {
    socketRef.current?.emit('resign', { contestId, playerId: user?.id });
    setShowLeaveModal(false);
    navigate('/');
  };

  useEffect(() => {
    return () => {
      clearTimeout(resultTimerRef.current);
      // Emit leaveRoom on component unmount if match hasn't started
      if (socketRef.current && (!matchDataRef.current || gameStatus === 'waiting')) {
        socketRef.current.emit('leaveRoom', { contestId, userId: user?.id });
      }
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

    // Optimistic UI Update — apply move instantly before server confirms
    try {
      const move = chess.move({ from, to, promotion: promotion || 'q' });
      if (move) {
        setFen(chess.fen());
        setLastMove({ from, to });
        setMoveHistory(prev => [...prev, move.san]);
        moveSansRef.current.push(move.san);
        setPreviewIndex(-1);
        // Mark this move as optimistic so we skip the server echo
        lastOptimisticMoveRef.current = { from, to };
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
    <div className="match-page bg-hero relative">
      <style>{`button[title="Flip Board"] { display: none !important; }`}</style>

      {/* Anti-cheat blur overlay when tab is hidden */}
      {isTabHidden && gameStatus === 'playing' && (
        <div className="fixed inset-0 z-[60] bg-navy-950/90 backdrop-blur-xl flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-white font-bold text-lg">Match Paused</p>
            <p className="text-slate-400 text-sm mt-1">Return to continue playing</p>
          </div>
        </div>
      )}

      {/* Tab switch warning toast */}
      {tabWarning && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[55] bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold px-4 py-2 rounded-xl animate-slide-down max-w-sm text-center backdrop-blur-sm">
          {tabWarning}
        </div>
      )}
      {/* Match Header Bar */}
      <div className="match-header-bar z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-white">{contestType?.name || 'Match'}</h1>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${gameStatus === 'playing' ? 'bg-emerald-500/10 text-emerald-400' : gameStatus === 'finished' ? 'bg-purple-500/10 text-purple-400' : 'bg-gold-500/10 text-gold-400'}`}>
            {gameStatus === 'playing' ? '● Live' : gameStatus === 'finished' ? 'Ended' : 'Waiting'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isTournament && (
            <button onClick={() => setShowBracket(!showBracket)} className="btn-sm text-[10px] font-semibold btn-secondary rounded-lg">
              {showBracket ? '♟️ Board' : '🏆 Bracket'}
            </button>
          )}
          <PingIndicator customSocket={socketRef.current} />
        </div>
      </div>

      {/* Desktop Wrapper / Mobile Stack */}
      <div className="flex-1 w-full lg:match-desktop-layout flex flex-col p-2 lg:p-0">

        {/* Center Panel: Board & Controls */}
        <div className="flex-1 lg:match-center flex flex-col gap-2 w-full max-w-[640px] lg:max-w-none mx-auto">
          
          {/* Mobile Info Row (Hidden on Desktop) */}
          <div className="lg:hidden flex gap-1 w-full shrink-0">
            {contestType && (
              <div className="flex-1 bg-navy-800/30 rounded-lg p-1.5 flex justify-around text-[10px]">
                <div><span className="text-slate-600 mr-1">Entry:</span><span className="text-white font-semibold">₹{contestType.entry}</span></div>
                <div><span className="text-slate-600 mr-1">Prize:</span><span className="text-chess-green font-semibold">₹{contestType.payout}</span></div>
              </div>
            )}
          </div>

          <div className="match-board-section lg:match-board-desktop relative w-full">
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
                gameResult={pendingResult ? { winner: pendingResult.winner, isDraw: pendingResult.isDraw } : null}
              />
            ) : (
              <div className="flex items-center justify-center w-full aspect-square bg-navy-800/60">
                <div className="w-8 h-8 border-2 border-chess-green border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {previewIndex !== -1 && (
              <div className="absolute bottom-0 left-0 right-0 p-1 bg-sky-500/10 border-t border-sky-500/20 flex items-center justify-between z-10">
                <p className="text-[9px] text-sky-400 font-bold">📖 Move {previewIndex + 1}/{moveHistory.length}</p>
                <button onClick={() => setPreviewIndex(-1)} className="text-[9px] text-sky-400 font-black px-2 py-0.5 hover:bg-sky-500/20 rounded">LIVE</button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {currentPlayerColor && gameStatus === 'playing' && (
            <div className="flex flex-col gap-1 w-full shrink-0 max-w-[640px] lg:max-w-none mx-auto">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={handleResign}
                  className={`rounded-lg flex-1 text-xs py-2 font-semibold transition-all ${
                    confirmResign ? 'bg-red-600 text-white animate-pulse' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  🏳️ {confirmResign ? 'Confirm?' : 'Resign'}
                </button>
                <button
                  onClick={handleDrawOffer}
                  disabled={drawOfferPending}
                  className="bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white rounded-lg flex-1 text-xs py-2 font-semibold disabled:opacity-50"
                >
                  🤝 {drawOfferPending ? 'Sent...' : 'Draw'}
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white rounded-lg flex-1 text-xs py-2 font-semibold"
                >
                  ⚙️ Settings
                </button>
              </div>
              {confirmResign && (
                <div className="flex gap-1 w-full">
                  <button onClick={() => setConfirmResign(false)} className="flex-1 py-1.5 bg-navy-700 text-slate-300 text-xs font-medium">Cancel</button>
                  <button onClick={handleResign} className="flex-1 py-1.5 bg-red-600 text-white text-xs font-bold">Yes, Resign</button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Move History */}
          {matchDataRef.current && (
            <div className="w-full shrink-0 mt-1 lg:hidden">
              <MoveHistory moves={moveHistory} currentIndex={previewIndex} onClickMove={setPreviewIndex} mode="horizontal" />
            </div>
          )}

          {/* Mobile Chat */}
          {currentPlayerColor && gameStatus === 'playing' && (
            <div className="w-full shrink-0 lg:hidden mb-2">
              <div className="bg-navy-800/30 rounded-lg overflow-hidden">
                <select
                  className="w-full bg-navy-900/60 text-xs rounded-none px-2 py-1.5 text-white outline-none"
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
                </select>
                <div ref={chatRef} className="max-h-[100px] overflow-y-auto p-1.5 space-y-0.5">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className="text-[10px]">
                      <span className="font-semibold text-chess-green">{msg.username}: </span>
                      <span className="text-slate-400">{msg.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel (Desktop Only) */}
        <div className="hidden lg:flex match-right-panel w-full">

          {/* Match Info — compact */}
          <div className="bg-navy-800/40 border border-navy-700/20 rounded-xl p-3 flex-shrink-0">
            <div className="flex gap-4 flex-wrap text-[11px] mb-2">
              {contestType && (
                <>
                  <div><span className="text-slate-600">Type </span><span className="text-white font-semibold">{contestType.name}</span></div>
                  <div><span className="text-slate-600">Entry </span><span className="text-white font-semibold">₹{contestType.entry}</span></div>
                  <div><span className="text-slate-600">Prize </span><span className="text-chess-green font-semibold">₹{contestType.payout}</span></div>
                </>
              )}
              <div><span className="text-slate-600">Moves </span><span className="text-white font-semibold">{moveHistory.length}</span></div>
            </div>
          </div>

          {/* Moves — scrolls internally */}
          {matchDataRef.current && (
            <div className="match-move-list bg-navy-800/40 border border-navy-700/20 rounded-xl overflow-hidden">
              <MoveHistory moves={moveHistory} currentIndex={previewIndex} onClickMove={setPreviewIndex} mode="vertical" />
            </div>
          )}

          {/* Chat */}
          {currentPlayerColor && gameStatus === 'playing' && (
            <div className="bg-navy-800/30 rounded-xl flex flex-col shrink-0 overflow-hidden">
              <select
                className="w-full bg-navy-900/40 text-xs px-3 py-2 text-white outline-none"
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
              </select>
              <div className="flex-1 max-h-[250px] overflow-y-auto p-2.5 space-y-1" style={{ scrollbarWidth: 'thin' }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-semibold text-chess-green">{msg.username}: </span>
                    <span className="text-slate-400">{msg.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modals & Overlays */}
      {drawOfferReceived && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy-800 border border-navy-700/30 rounded-2xl shadow-2xl p-5 max-w-sm w-full animate-scale-in">
            <div className="text-center">
              <div className="text-4xl mb-2">🤝</div>
              <h3 className="text-base font-bold text-white mb-1">Draw Offered</h3>
              <p className="text-xs text-slate-500 mb-4">Your opponent offers a draw. Entry fee refunded.</p>
              <div className="flex gap-2">
                <button onClick={() => handleDrawResponse(false)} className="btn-secondary flex-1 text-xs">Decline</button>
                <button onClick={() => handleDrawResponse(true)} className="btn-primary flex-1 text-xs">Accept</button>
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

      {/* Item 5: Leave Match Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy-800 border border-navy-700/30 rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scale-in">
            <div className="text-center">
              <div className="text-4xl mb-3">🚪</div>
              <h3 className="text-lg font-bold text-white mb-1">Leave Match?</h3>
              <p className="text-sm text-slate-500 mb-5">Leaving may count as resignation.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
                >
                  Stay
                </button>
                <button
                  onClick={handleResignAndExit}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition-all"
                >
                  Resign & Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
