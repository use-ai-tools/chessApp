import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import PlayerTimer from './PlayerTimer';
import WinProbabilityBar from './WinProbabilityBar';

// ── Board Themes ──
const BOARD_THEMES = {
  classic: { label: 'Classic', light: '#f0d9b5', dark: '#b58863' },
  dark:    { label: 'Dark', light: '#334155', dark: '#1e293b' },
  green:   { label: 'Green', light: '#eeeed2', dark: '#769656' },
  ocean:   { label: 'Ocean', light: '#b8cce2', dark: '#5b7ea4' },
  bw:      { label: 'Classic B&W', light: '#ffffff', dark: '#808080' },
};

const PIECE_UNICODE = {
  wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕',
  bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛',
};
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };

// ── Web Audio API Sounds ──
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'move':
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
        break;
      case 'capture':
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
        break;
      case 'check':
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        break;
      case 'gameStart':
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        break;
      case 'gameEnd':
        osc.frequency.setValueAtTime(784, ctx.currentTime);
        osc.frequency.setValueAtTime(523, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        break;
      case 'lowTime':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
        break;
      default:
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {}
};

// ── Apply premoves visually to a FEN (no validation, just piece movement) ──
function applyPremovesToFen(realFen, premoves) {
  if (!premoves || premoves.length === 0) return realFen;
  let game;
  try { game = new Chess(realFen); } catch { return realFen; }
  const board = game.board();
  for (const pre of premoves) {
    if (!pre?.from || !pre?.to) continue;
    const fromCol = pre.from.charCodeAt(0) - 97;
    const fromRow = 8 - parseInt(pre.from[1], 10);
    const toCol = pre.to.charCodeAt(0) - 97;
    const toRow = 8 - parseInt(pre.to[1], 10);
    if (fromCol < 0 || fromCol > 7 || fromRow < 0 || fromRow > 7) continue;
    if (toCol < 0 || toCol > 7 || toRow < 0 || toRow > 7) continue;
    const piece = board[fromRow][fromCol];
    if (!piece) continue;
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;
  }
  const rows = [];
  for (let r = 0; r < 8; r++) {
    let row = '';
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) empty++;
      else {
        if (empty > 0) { row += empty; empty = 0; }
        row += p.color === 'w' ? p.type.toUpperCase() : p.type.toLowerCase();
      }
    }
    if (empty > 0) row += empty;
    rows.push(row);
  }
  const parts = realFen.split(' ');
  parts[0] = rows.join('/');
  return parts.join(' ');
}

function virtualPieceAt(realFen, premoves, square) {
  let game;
  try { game = new Chess(applyPremovesToFen(realFen, premoves)); } catch { return null; }
  return game.get(square);
}

// ── King-square locator ──
function findKingSquare(fen, color) {
  try {
    const game = new Chess(fen);
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = board[r][c];
        if (sq && sq.type === 'k' && sq.color === color) {
          return `${'abcdefgh'[c]}${8 - r}`;
        }
      }
    }
  } catch {}
  return null;
}

function squarePxPosition(square, boardSize, orientation) {
  if (!square || !boardSize) return null;
  const col = square.charCodeAt(0) - 97;
  const row = 8 - parseInt(square[1], 10);
  const sq = boardSize / 8;
  const x = orientation === 'white' ? col * sq : (7 - col) * sq;
  const y = orientation === 'white' ? row * sq : (7 - row) * sq;
  return { x, y, sq };
}

export default function ChessBoard({
  roomId,
  matchId,
  fen,
  onMove,
  onPlayerReady,
  onSetPremove,
  onCancelPremove,
  currentPlayer,
  whitePlayer,
  blackPlayer,
  boardOrientation = 'white',
  isSpectator = false,
  isReview = false,
  gameStatus,
  timerData,
  spectatorCount = 0,
  floatingEmoji,
  lastMove,
  settings,
  moveTimeoutMs = 30000,
  username,
  hideTimer = false,
  gameResult = null,           // { winner: 'white'|'black'|null, isDraw }
  maxBoardSize = 640,
}) {
  const gameRef = useRef(new Chess());
  const boardWrapRef = useRef(null);
  const readyEmitted = useRef(false);
  const [boardSize, setBoardSize] = useState(320);
  const [whiteTime, setWhiteTime] = useState(30);
  const [blackTime, setBlackTime] = useState(30);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoveStyles, setLegalMoveStyles] = useState({});
  const [boardTheme, setBoardTheme] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('chess-settings') || '{}');
      return s.boardTheme || 'classic';
    } catch { return 'classic'; }
  });
  const [whiteCaptured, setWhiteCaptured] = useState([]);
  const [blackCaptured, setBlackCaptured] = useState([]);
  const [inCheck, setInCheck] = useState(false);

  const [prequeue, setPrequeue] = useState([]);
  const [activePremoveStart, setActivePremoveStart] = useState(null);
  const prevFenRef = useRef(fen);
  const premoveJustExecutedRef = useRef(false);

  // Read settings
  const soundEnabled = settings?.moveSound !== false;
  const showLegalMoves = settings?.showLegalMoves !== false;
  const showLastMove = settings?.showLastMove !== false;
  const premovesEnabled = settings?.premoves !== false;
  const autoQueen = settings?.autoQueen !== false;
  const animDuration = settings?.animationSpeed === 'none' ? 0 : settings?.animationSpeed === 'fast' ? 80 : 150;

  // ── Emit playerReady when board mounts ──
  useEffect(() => {
    if (gameStatus === 'playing' && onPlayerReady && !readyEmitted.current && currentPlayer) {
      readyEmitted.current = true;
      onPlayerReady();
    }
  }, [gameStatus, currentPlayer]);

  useEffect(() => {
    readyEmitted.current = false;
  }, [matchId]);

  useEffect(() => {
    if (gameStatus === 'playing' && soundEnabled) playSound('gameStart');
  }, [gameStatus === 'playing']);

  // ── STABLE board sizing — only on mount, window resize, orientation change.
  // Critical: never recalculate after a move. This prevents zoom/shift loops.
  useEffect(() => {
    const measure = () => {
      if (!boardWrapRef.current) return;
      const rect = boardWrapRef.current.getBoundingClientRect();
      const w = rect.width;
      if (w > 0) {
        // Clamp by viewport height too — keeps board inside 100dvh on laptops
        const isDesktop = window.innerWidth >= 1024;
        const verticalReserved = isDesktop ? 180 : 220;
        const heightCap = Math.max(260, window.innerHeight - verticalReserved);
        const next = Math.floor(Math.min(w, heightCap, maxBoardSize));
        setBoardSize(prev => (Math.abs(prev - next) < 2 ? prev : next));
      }
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
  }, [maxBoardSize]);

  // ── Update chess.js when fen changes ──
  useEffect(() => {
    if (fen && fen !== gameRef.current.fen()) {
      try {
        gameRef.current.load(fen);
        setInCheck(gameRef.current.isCheck());
      } catch (e) {}
    }
    setSelectedSquare(null);
    setLegalMoveStyles({});
  }, [fen]);

  // ── Track captured pieces from FEN ──
  useEffect(() => {
    if (!fen) return;
    const startingPieces = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const current = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
    const boardPart = fen.split(' ')[0];
    for (const char of boardPart) {
      if ('pnbrq'.includes(char)) current.b[char]++;
      else if ('PNBRQ'.includes(char)) current.w[char.toLowerCase()]++;
    }
    const wCaptured = [], bCaptured = [];
    for (const piece of ['q', 'r', 'b', 'n', 'p']) {
      for (let i = 0; i < startingPieces[piece] - current.b[piece]; i++) wCaptured.push(PIECE_UNICODE[`b${piece}`]);
      for (let i = 0; i < startingPieces[piece] - current.w[piece]; i++) bCaptured.push(PIECE_UNICODE[`w${piece}`]);
    }
    setWhiteCaptured(wCaptured);
    setBlackCaptured(bCaptured);
  }, [fen]);

  const calcAdv = (captured) => {
    let val = 0;
    const reverseMap = {};
    Object.entries(PIECE_UNICODE).forEach(([k, v]) => { reverseMap[v] = k; });
    for (const p of captured) { const key = reverseMap[p]; if (key) val += PIECE_VALUES[key[1]] || 0; }
    return val;
  };
  const whiteAdvRaw = calcAdv(whiteCaptured) - calcAdv(blackCaptured);
  const whiteAdv = Math.max(0, whiteAdvRaw);
  const blackAdv = Math.max(0, -whiteAdvRaw);

  // ── Chess Clock countdown ──
  useEffect(() => {
    if (!timerData || gameStatus !== 'playing') return;
    setWhiteTime(timerData.whiteTime || 600);
    setBlackTime(timerData.blackTime || 600);
    if (!timerData.startedAt) return;

    const serverStart = timerData.startedAt;
    const activeTurn = timerData.turn;
    let rafId;
    const tick = () => {
      const elapsed = (Date.now() - serverStart) / 1000;
      if (activeTurn === 'w') {
        setWhiteTime(Math.max(0, (timerData.whiteTime || 600) - elapsed));
      } else {
        setBlackTime(Math.max(0, (timerData.blackTime || 600) - elapsed));
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [timerData, gameStatus]);

  useEffect(() => {
    if (settings?.boardTheme) setBoardTheme(settings.boardTheme);
  }, [settings?.boardTheme]);

  const canMakeMove = () => {
    if (isSpectator || isReview) return false;
    if (gameStatus !== 'playing') return false;
    if (!currentPlayer) return false;
    const turn = gameRef.current.turn();
    return (turn === 'w' && currentPlayer.color === 'white') || (turn === 'b' && currentPlayer.color === 'black');
  };

  const isMyTurn = canMakeMove();
  const isOpponentTurn = !isSpectator && !isReview && gameStatus === 'playing' && currentPlayer && !isMyTurn;
  const myColor = currentPlayer?.color === 'white' ? 'w' : 'b';

  // ── Preview FEN with all queued premoves applied (visual only) ──
  const previewFen = useMemo(() => {
    if (prequeue.length === 0) return fen;
    return applyPremovesToFen(fen, prequeue);
  }, [fen, prequeue]);

  // FEN to display: real FEN when it's my turn (no preview), preview FEN otherwise
  const displayFen = (isOpponentTurn && prequeue.length > 0) ? previewFen : fen;

  const showLegalMoveHints = useCallback((square) => {
    if (!showLegalMoves) return {};
    const game = gameRef.current;
    const moves = game.moves({ square, verbose: true });
    if (moves.length === 0) return {};
    const styles = {};
    styles[square] = { backgroundColor: 'rgba(246, 246, 105, 0.4)' };
    for (const m of moves) {
      if (m.captured) {
        styles[m.to] = {
          background: 'radial-gradient(circle, transparent 55%, rgba(0,0,0,0.2) 55%)',
          borderRadius: '0',
        };
      } else {
        styles[m.to] = {
          background: 'radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 25%)',
          borderRadius: '0',
        };
      }
    }
    return styles;
  }, [showLegalMoves]);

  const onSquareClick = (square) => {
    const game = gameRef.current;

    if (isOpponentTurn && premovesEnabled) {
      handlePremoveClick(square);
      return;
    }

    if (!isMyTurn) return;

    if (selectedSquare) {
      const piece = game.get(square);
      if (square === selectedSquare) {
        setSelectedSquare(null);
        setLegalMoveStyles({});
        return;
      }
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setLegalMoveStyles(showLegalMoveHints(square));
        return;
      }

      const promo = 'q';
      const moveCopy = new Chess(game.fen());
      try {
        const move = moveCopy.move({ from: selectedSquare, to: square, promotion: promo });
        if (move && selectedSquare !== square) {
          if (soundEnabled) playSound(move.captured ? 'capture' : moveCopy.isCheck() ? 'check' : 'move');
          onMove({ from: selectedSquare, to: square, promotion: promo, san: move.san });
        }
      } catch(e) {}
      setSelectedSquare(null);
      setLegalMoveStyles({});
      return;
    }

    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      setLegalMoveStyles(showLegalMoveHints(square));
    }
  };

  // ── Premove click handler — supports chained premoves on preview state ──
  const handlePremoveClick = (square) => {
    // Check piece from the PREVIEW state so chained premoves can use already-moved pieces
    const previewPiece = virtualPieceAt(fen, prequeue, square);

    if (!activePremoveStart) {
      if (previewPiece && previewPiece.color === myColor) {
        setActivePremoveStart(square);
      } else {
        // Tapping empty/opponent square clears all premoves
        if (prequeue.length > 0) {
          setPrequeue([]);
          setActivePremoveStart(null);
        }
      }
      return;
    }

    if (square === activePremoveStart) {
      setActivePremoveStart(null);
      return;
    }

    // Switch selection to another own piece (from preview)
    if (previewPiece && previewPiece.color === myColor) {
      setActivePremoveStart(square);
      return;
    }

    if (prequeue.length < 6) {
      const promo = autoQueen ? 'q' : undefined;
      setPrequeue(prev => [...prev, { from: activePremoveStart, to: square, promotion: promo }]);
      setActivePremoveStart(null);
    }
  };

  // Cancel premoves on right-click or Escape
  useEffect(() => {
    const handleContextMenu = (e) => {
      if (prequeue.length > 0 || activePremoveStart) {
        e.preventDefault();
        setPrequeue([]);
        setActivePremoveStart(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && (prequeue.length > 0 || activePremoveStart)) {
        setPrequeue([]);
        setActivePremoveStart(null);
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [prequeue.length, activePremoveStart]);

  // Execute the first queued premove when it becomes our turn
  useEffect(() => {
    const fenChanged = fen !== prevFenRef.current;
    if (fenChanged) {
      prevFenRef.current = fen;
      if (premoveJustExecutedRef.current) {
        premoveJustExecutedRef.current = false;
        return;
      }
    }

    if (!isMyTurn || prequeue.length === 0) {
      if (isMyTurn) setActivePremoveStart(null);
      return;
    }

    const game = gameRef.current;
    const nextPre = prequeue[0];
    const promo = nextPre.promotion || 'q';

    try {
      const moveCopy = new Chess(game.fen());
      const move = moveCopy.move({ from: nextPre.from, to: nextPre.to, promotion: promo });
      if (move) {
        if (soundEnabled) playSound(move.captured ? 'capture' : moveCopy.isCheck() ? 'check' : 'move');
        onMove({ from: nextPre.from, to: nextPre.to, promotion: promo, san: move.san });
        premoveJustExecutedRef.current = true;
        setPrequeue(q => q.slice(1));
      } else {
        // Premove became illegal — clear ALL remaining premoves (chained logic depended on this move)
        setPrequeue([]);
        setActivePremoveStart(null);
      }
    } catch {
      setPrequeue([]);
      setActivePremoveStart(null);
    }
  }, [isMyTurn, fen]);

  useEffect(() => {
    if (gameStatus !== 'playing') {
      setPrequeue([]);
      setActivePremoveStart(null);
    }
  }, [gameStatus]);

  const onDrop = (sourceSquare, targetSquare) => {
    setSelectedSquare(null);
    setLegalMoveStyles({});

    const promo = autoQueen ? 'q' : undefined;

    if (!isMyTurn) {
      if (premovesEnabled && isOpponentTurn && prequeue.length < 6) {
        // Verify source has a virtual own piece (so drag of opponent piece is rejected)
        const piece = virtualPieceAt(fen, prequeue, sourceSquare);
        if (piece && piece.color === myColor) {
          setPrequeue(prev => [...prev, { from: sourceSquare, to: targetSquare, promotion: promo }]);
        }
      }
      return false;
    }

    const game = gameRef.current;
    const moveCopy = new Chess(game.fen());
    try {
      if (sourceSquare !== targetSquare) {
        const move = moveCopy.move({ from: sourceSquare, to: targetSquare, promotion: promo || 'q' });
        if (move) {
          if (soundEnabled) playSound(move.captured ? 'capture' : moveCopy.isCheck() ? 'check' : 'move');
          onMove({ from: sourceSquare, to: targetSquare, promotion: promo || 'q', san: move.san });
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  const onPieceDragBegin = (piece, sourceSquare) => {
    if (isOpponentTurn && premovesEnabled) {
      const p = virtualPieceAt(fen, prequeue, sourceSquare);
      if (p && p.color === myColor) return true;
      return false;
    }
    if (!isMyTurn) return false;
    setLegalMoveStyles(showLegalMoveHints(sourceSquare));
    return true;
  };

  // ── Square style helpers ──
  const getCheckStyles = () => {
    if (!inCheck) return {};
    const sq = findKingSquare(fen, gameRef.current.turn());
    if (!sq) return {};
    return { [sq]: {
      backgroundColor: 'rgba(239, 68, 68, 0.6)',
      borderRadius: '0',
      animation: 'checkPulse 1s ease-in-out infinite',
    }};
  };

  const getLastMoveStyles = () => {
    if (!showLastMove || !lastMove) return {};
    return {
      [lastMove.from]: { backgroundColor: 'rgba(246, 246, 105, 0.5)' },
      [lastMove.to]: { backgroundColor: 'rgba(246, 246, 105, 0.5)' },
    };
  };

  const getPremoveStyles = () => {
    const styles = {};
    if (activePremoveStart) {
      styles[activePremoveStart] = { backgroundColor: 'rgba(245, 180, 60, 0.45)', boxShadow: 'inset 0 0 6px rgba(245, 180, 60, 0.3)' };
    }
    prequeue.forEach((p) => {
      styles[p.from] = { backgroundColor: 'rgba(245, 180, 60, 0.25)' };
      styles[p.to] = { backgroundColor: 'rgba(245, 180, 60, 0.35)' };
    });
    return styles;
  };

  const customSquareStyles = {
    ...getLastMoveStyles(),
    ...getPremoveStyles(),
    ...legalMoveStyles,
    ...getCheckStyles(),
  };

  const theme = BOARD_THEMES[boardTheme] || BOARD_THEMES.classic;
  const turn = gameRef.current.turn();
  const topPlayer = boardOrientation === 'white' ? blackPlayer : whitePlayer;
  const bottomPlayer = boardOrientation === 'white' ? whitePlayer : blackPlayer;
  const topTime = boardOrientation === 'white' ? blackTime : whiteTime;
  const bottomTime = boardOrientation === 'white' ? whiteTime : blackTime;
  const isTopTurn = boardOrientation === 'white' ? turn === 'b' : turn === 'w';
  const isBottomTurn = boardOrientation === 'white' ? turn === 'w' : turn === 'b';
  const topColor = boardOrientation === 'white' ? 'black' : 'white';
  const bottomColor = boardOrientation === 'white' ? 'white' : 'black';
  const topCaptured = boardOrientation === 'white' ? blackCaptured : whiteCaptured;
  const bottomCaptured = boardOrientation === 'white' ? whiteCaptured : blackCaptured;
  const topAdv = boardOrientation === 'white' ? blackAdv : whiteAdv;
  const bottomAdv = boardOrientation === 'white' ? whiteAdv : blackAdv;

  // ── Game-end indicators on board (crown/fallen king) ──
  const endIndicators = useMemo(() => {
    if (gameStatus !== 'finished' || !gameResult) return null;
    if (gameResult.isDraw) return null;
    const winnerColor = gameResult.winner === 'white' ? 'w' : gameResult.winner === 'black' ? 'b' : null;
    if (!winnerColor) return null;
    const loserColor = winnerColor === 'w' ? 'b' : 'w';
    const winSq = findKingSquare(fen, winnerColor);
    const loseSq = findKingSquare(fen, loserColor);
    const winPos = squarePxPosition(winSq, boardSize, boardOrientation);
    const losePos = squarePxPosition(loseSq, boardSize, boardOrientation);
    return { winPos, losePos };
  }, [gameStatus, gameResult, fen, boardSize, boardOrientation]);

  return (
    <div className="w-full flex flex-col items-stretch gap-1" style={{ margin: '0 auto' }}>
      {floatingEmoji && (
        <div className="emoji-float" style={{ top: '40%', left: '50%' }}>{floatingEmoji}</div>
      )}

      {/* Top Player */}
      <PlayerTimer player={topPlayer} time={topTime} isActive={isTopTurn && gameStatus === 'playing'} color={topColor} captured={topCaptured} materialAdvantage={topAdv} gameStatus={gameStatus} hideTimer={hideTimer} compact />

      {/* Board + Win Probability Bar */}
      <div className="flex items-center justify-center gap-2 w-full">
        {isReview && <WinProbabilityBar fen={fen} height={boardSize} />}

        <div
          ref={boardWrapRef}
          className="shadow-2xl shadow-black/50 relative"
          style={{
            touchAction: 'none',
            overflow: 'hidden',
            aspectRatio: '1 / 1',
            width: `min(${maxBoardSize}px, calc(100dvh - 200px), 100%)`,
            margin: '0 auto',
          }}
        >
          {gameStatus === 'playing' && username && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center" style={{ opacity: 0.04 }}>
              <p className="text-white text-2xl font-black rotate-[-30deg] select-none whitespace-nowrap">{username}</p>
            </div>
          )}

          <Chessboard
            position={displayFen}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            onPieceDragBegin={onPieceDragBegin}
            boardOrientation={boardOrientation}
            boardWidth={boardSize}
            customBoardStyle={{ borderRadius: '0px' }}
            customDarkSquareStyle={{ backgroundColor: theme.dark }}
            customLightSquareStyle={{ backgroundColor: theme.light }}
            customSquareStyles={customSquareStyles}
            customArrows={[]}
            animationDuration={animDuration}
            arePiecesDraggable={isMyTurn || (isOpponentTurn && premovesEnabled)}
            snapToCursor={false}
          />

          {/* Game-end indicators */}
          {endIndicators?.winPos && (
            <div
              className="absolute pointer-events-none z-20 flex items-center justify-center"
              style={{
                left: endIndicators.winPos.x,
                top: endIndicators.winPos.y - 18,
                width: endIndicators.winPos.sq,
                height: 22,
              }}
            >
              <span className="text-lg leading-none drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">👑</span>
            </div>
          )}
          {endIndicators?.losePos && (
            <div
              className="absolute pointer-events-none z-20 flex items-center justify-center"
              style={{
                left: endIndicators.losePos.x,
                top: endIndicators.losePos.y - 18,
                width: endIndicators.losePos.sq,
                height: 22,
              }}
            >
              <span className="text-base leading-none drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">✖</span>
            </div>
          )}
        </div>
      </div>

      {/* Premove status — absolutely positioned overlay (does not push board) */}
      {(prequeue.length > 0 || activePremoveStart) && (
        <div className="relative">
          <div className="absolute right-0 -top-7 pointer-events-none">
            <span className="text-[9px] text-gold-400 font-bold bg-navy-900/70 px-2 py-0.5 rounded-md">
              {prequeue.length > 0 ? `${prequeue.length} premove${prequeue.length > 1 ? 's' : ''}` : 'Select target...'}
            </span>
          </div>
        </div>
      )}

      {/* Bottom Player */}
      <PlayerTimer player={bottomPlayer} time={bottomTime} isActive={isBottomTurn && gameStatus === 'playing'} color={bottomColor} captured={bottomCaptured} materialAdvantage={bottomAdv} gameStatus={gameStatus} hideTimer={hideTimer} compact />

      {isSpectator && (
        <div className="w-full flex items-center justify-between mt-1">
          <div className="badge-purple rounded-none"><span>👁️</span> Spectating</div>
          {spectatorCount > 0 && <div className="badge-blue rounded-none"><span>👁</span> {spectatorCount} watching</div>}
        </div>
      )}
    </div>
  );
}

export { playSound };
