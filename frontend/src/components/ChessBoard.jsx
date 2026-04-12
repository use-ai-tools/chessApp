import React, { useRef, useState, useEffect, useCallback } from 'react';
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
      default:
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {}
};

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
  isReview = false, // BUG 4 FIX: Win probability bar only in review mode
  gameStatus,
  timerData,
  spectatorCount = 0,
  floatingEmoji,
  lastMove,
  settings,
  moveTimeoutMs = 30000,
  username, // FEATURE 5: Screenshot prevention watermark
}) {
  const gameRef = useRef(new Chess());
  const containerRef = useRef(null);
  const readyEmitted = useRef(false);
  const [boardWidth, setBoardWidth] = useState(400);
  const [whiteTime, setWhiteTime] = useState(30);
  const [blackTime, setBlackTime] = useState(30);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoveStyles, setLegalMoveStyles] = useState({});
  const [illegalMoveMsg, setIllegalMoveMsg] = useState('');
  const [boardShake, setBoardShake] = useState(false); // FEATURE 6: Illegal move shake
  const [boardTheme, setBoardTheme] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('chess-settings') || '{}');
      return s.boardTheme || 'classic';
    } catch { return 'classic'; }
  });
  const [whiteCaptured, setWhiteCaptured] = useState([]);
  const [blackCaptured, setBlackCaptured] = useState([]);
  const [inCheck, setInCheck] = useState(false);
  const [premoveSquares, setPremoveSquares] = useState(null);
  const [draggedSquare, setDraggedSquare] = useState(null); // FEATURE 7: Legal move dots on drag

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

  // Reset ready flag when match changes
  useEffect(() => {
    readyEmitted.current = false;
  }, [matchId]);

  // ── Play game start sound ──
  useEffect(() => {
    if (gameStatus === 'playing' && soundEnabled) {
      playSound('gameStart');
    }
  }, [gameStatus === 'playing']);

  // ── FEATURE 5: Screenshot prevention ──
  useEffect(() => {
    if (gameStatus === 'playing') {
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.body.style.userSelect = '';
    };
  }, [gameStatus]);

  // ── Responsive board sizing ──
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setBoardWidth(Math.min(w - 16, 560));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // ── Update chess.js when fen changes ──
  useEffect(() => {
    if (fen && fen !== gameRef.current.fen()) {
      try {
        gameRef.current.load(fen);
        setInCheck(gameRef.current.isCheck());
      } catch (e) {
        console.error('Invalid FEN:', e);
      }
    }
    // BUG 3 FIX: Don't clear selection on FEN change if it was from our own move
    // Only clear if it's a new position from opponent
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

  // ── Material advantage ──
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

  // ── Timer countdown ──
  const timerMax = Math.ceil(moveTimeoutMs / 1000);
  useEffect(() => {
    if (!timerData || gameStatus !== 'playing') return;
    const calculateRemaining = () => {
      const expires = timerData.expiresAt || Date.now() + moveTimeoutMs;
      return Math.max(0, Math.floor((expires - Date.now()) / 1000));
    };
    if (timerData.turn === 'w') {
      setWhiteTime(calculateRemaining());
      setBlackTime(timerMax);
    } else {
      setBlackTime(calculateRemaining());
      setWhiteTime(timerMax);
    }
    const interval = setInterval(() => {
      if (timerData.turn === 'w') setWhiteTime((p) => Math.max(0, p - 1));
      else setBlackTime((p) => Math.max(0, p - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerData, gameStatus, moveTimeoutMs]);

  // ── Auto-dismiss illegal move + shake ──
  useEffect(() => {
    if (!illegalMoveMsg) return;
    setBoardShake(true);
    const t1 = setTimeout(() => setBoardShake(false), 500);
    const t2 = setTimeout(() => setIllegalMoveMsg(''), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [illegalMoveMsg]);

  // ── Sync board theme from settings ──
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
  const playerColor = currentPlayer?.color === 'white' ? 'w' : 'b';

  // ── Compute legal move hints ──
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
          borderRadius: '50%',
        };
      } else {
        styles[m.to] = {
          background: 'radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 25%)',
          borderRadius: '50%',
        };
      }
    }
    return styles;
  }, [showLegalMoves]);

  // ── BUG 3 FIX: Click-to-move state machine ──
  const onSquareClick = (square) => {
    const game = gameRef.current;

    // If it's opponent's turn and premoves enabled, handle premove
    if (isOpponentTurn && premovesEnabled) {
      handlePremoveClick(square);
      return;
    }

    if (!isMyTurn) return;

    if (selectedSquare) {
      // STATE 2: Piece already selected
      // BUG 3 FIX: Check if clicking another own piece → switch selection
      const piece = game.get(square);
      if (piece && piece.color === game.turn() && square !== selectedSquare) {
        setSelectedSquare(square);
        setLegalMoveStyles(showLegalMoveHints(square));
        return;
      }

      // Try to make the move
      const promo = autoQueen ? 'q' : 'q';
      const moveCopy = new Chess(game.fen());
      const move = moveCopy.move({ from: selectedSquare, to: square, promotion: promo });

      if (move) {
        // Valid move — emit it
        if (soundEnabled) playSound(move.captured ? 'capture' : moveCopy.isCheck() ? 'check' : 'move');
        onMove({ from: selectedSquare, to: square, promotion: promo, san: move.san });
        setSelectedSquare(null);
        setLegalMoveStyles({});
        return;
      }

      // Illegal move
      setIllegalMoveMsg('Illegal move');
      setSelectedSquare(null);
      setLegalMoveStyles({});
      return;
    }

    // STATE 1: No piece selected → select own piece
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      setLegalMoveStyles(showLegalMoveHints(square));
    }
  };

  // ── Premove click handler ──
  const handlePremoveClick = (square) => {
    if (premoveSquares) {
      // Cancel premove by clicking the from-square again or clicking empty square
      if (square === premoveSquares.from) {
        setPremoveSquares(null);
        if (onCancelPremove) onCancelPremove();
        return;
      }
      // Check if clicking an empty square (no piece, not own piece) — cancel
      const game = gameRef.current;
      const piece = game.get(square);
      const myColor = currentPlayer?.color === 'white' ? 'w' : 'b';
      if (piece && piece.color === myColor) {
        // Switch premove source
        setPremoveSquares({ from: square, to: null });
        return;
      }
      if (!piece && !premoveSquares.to) {
        // If clicking empty square with no destination set, set as destination
        const premove = { from: premoveSquares.from, to: square, promotion: autoQueen ? 'q' : 'q' };
        setPremoveSquares(premove);
        if (onSetPremove) onSetPremove(premove);
        return;
      }
      // Set destination
      const premove = { from: premoveSquares.from, to: square, promotion: autoQueen ? 'q' : 'q' };
      setPremoveSquares(premove);
      if (onSetPremove) onSetPremove(premove);
      return;
    }

    // No premove yet: clicking empty square does nothing
    const game = gameRef.current;
    const piece = game.get(square);
    const myColor = currentPlayer?.color === 'white' ? 'w' : 'b';
    if (piece && piece.color === myColor) {
      setPremoveSquares({ from: square, to: null });
    } else {
      // Clicking empty square with no premove — cancel any existing
      setPremoveSquares(null);
      if (onCancelPremove) onCancelPremove();
    }
  };

  // Execute premove when it becomes our turn
  useEffect(() => {
    if (isMyTurn && premoveSquares && premoveSquares.from && premoveSquares.to) {
      const game = gameRef.current;
      const moveCopy = new Chess(game.fen());
      const move = moveCopy.move({ from: premoveSquares.from, to: premoveSquares.to, promotion: premoveSquares.promotion || 'q' });
      if (move) {
        // Premove is legal — execute instantly
        if (soundEnabled) playSound(move.captured ? 'capture' : moveCopy.isCheck() ? 'check' : 'move');
        onMove({ from: premoveSquares.from, to: premoveSquares.to, promotion: premoveSquares.promotion || 'q', san: move.san });
      }
      setPremoveSquares(null);
    } else if (isMyTurn) {
      // Clear premove selection (partial premove with no destination)
      setPremoveSquares(null);
    }
  }, [isMyTurn]);

  // ── BUG 2/3/7 FIX: Drag-to-move handler ──
  const onDrop = (sourceSquare, targetSquare) => {
    // BUG 3 FIX: Always reset selection state after drop attempt
    setSelectedSquare(null);
    setLegalMoveStyles({});
    setDraggedSquare(null);

    if (!isMyTurn) return false;
    const game = gameRef.current;
    const promo = autoQueen ? 'q' : 'q';
    const moveCopy = new Chess(game.fen());
    const move = moveCopy.move({ from: sourceSquare, to: targetSquare, promotion: promo });
    if (!move) {
      setIllegalMoveMsg('Illegal move');
      return false;
    }
    if (soundEnabled) playSound(move.captured ? 'capture' : moveCopy.isCheck() ? 'check' : 'move');
    onMove({ from: sourceSquare, to: targetSquare, promotion: promo, san: move.san });
    return true;
  };

  // ── FEATURE 7: Show legal move dots when piece is picked up for dragging ──
  const onPieceDragBegin = (piece, sourceSquare) => {
    if (!isMyTurn) return false;
    setDraggedSquare(sourceSquare);
    setLegalMoveStyles(showLegalMoveHints(sourceSquare));
    return true;
  };

  // ── Check highlight with FEATURE 6: king square pulses red ──
  const getCheckStyles = () => {
    if (!inCheck) return {};
    const game = gameRef.current;
    const board = game.board();
    const turn = game.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = board[r][c];
        if (sq && sq.type === 'k' && sq.color === turn) {
          const squareName = `${'abcdefgh'[c]}${8 - r}`;
          return { [squareName]: {
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
            borderRadius: '50%',
            animation: 'checkPulse 1s ease-in-out infinite',
          }};
        }
      }
    }
    return {};
  };

  // ── BUG 5 FIX: Last move highlight — always show including final checkmate ──
  const getLastMoveStyles = () => {
    if (!showLastMove || !lastMove) return {};
    return {
      [lastMove.from]: { backgroundColor: 'rgba(246, 246, 105, 0.5)' },
      [lastMove.to]: { backgroundColor: 'rgba(246, 246, 105, 0.5)' },
    };
  };

  // ── Premove highlight ──
  const getPremoveStyles = () => {
    if (!premoveSquares) return {};
    const styles = {};
    if (premoveSquares.from) styles[premoveSquares.from] = { backgroundColor: 'rgba(100, 180, 255, 0.35)' };
    if (premoveSquares.to) styles[premoveSquares.to] = { backgroundColor: 'rgba(100, 180, 255, 0.35)' };
    return styles;
  };

  // ── Combine all square styles ──
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

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center gap-2">
      {floatingEmoji && (
        <div className="emoji-float" style={{ top: '40%', left: '50%' }}>{floatingEmoji}</div>
      )}

      {/* Top Player */}
      <PlayerTimer player={topPlayer} time={topTime} isActive={isTopTurn && gameStatus === 'playing'} color={topColor} captured={topCaptured} materialAdvantage={topAdv} timerMax={timerMax} gameStatus={gameStatus} />

      {gameStatus === 'playing' && isTopTurn && (
        <div className="w-full progress-bar" style={{ maxWidth: boardWidth }}>
          <div className="progress-fill bg-gradient-to-r from-red-500 to-gold-500 timer-bar" style={{ width: `${(topTime / timerMax) * 100}%` }} />
        </div>
      )}

      {/* Board + Win Probability Bar */}
      <div className="flex items-center gap-2">
        {/* BUG 4 FIX: Only show WinProbabilityBar in review mode */}
        {isReview && <WinProbabilityBar fen={fen} height={boardWidth} />}

        <div className={`rounded-xl overflow-hidden shadow-2xl shadow-black/50 transition-all duration-300 relative ${
          !isMyTurn && !isSpectator && !isReview && gameStatus === 'playing' ? 'opacity-85' : ''
        } ${boardShake ? 'board-shake' : ''}`}>
          
          {/* FEATURE 5: Username watermark during live game */}
          {gameStatus === 'playing' && username && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center" style={{ opacity: 0.04 }}>
              <p className="text-white text-2xl font-black rotate-[-30deg] select-none whitespace-nowrap">
                {username}
              </p>
            </div>
          )}

          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            onPieceDragBegin={onPieceDragBegin}
            boardOrientation={boardOrientation}
            boardWidth={boardWidth - 32}
            customBoardStyle={{ borderRadius: '12px' }}
            customDarkSquareStyle={{ backgroundColor: theme.dark }}
            customLightSquareStyle={{ backgroundColor: theme.light }}
            customSquareStyles={customSquareStyles}
            animationDuration={animDuration}
            arePiecesDraggable={isMyTurn}
            snapToCursor={false}
          />
        </div>
      </div>

      {illegalMoveMsg && <p className="illegal-move-text">{illegalMoveMsg}</p>}
      {premoveSquares?.to && <p className="text-[10px] text-sky-400 font-medium">Premove set</p>}

      {gameStatus === 'playing' && isBottomTurn && (
        <div className="w-full progress-bar" style={{ maxWidth: boardWidth }}>
          <div className="progress-fill bg-gradient-to-r from-chess-green to-emerald-500 timer-bar" style={{ width: `${(bottomTime / timerMax) * 100}%` }} />
        </div>
      )}

      <PlayerTimer player={bottomPlayer} time={bottomTime} isActive={isBottomTurn && gameStatus === 'playing'} color={bottomColor} captured={bottomCaptured} materialAdvantage={bottomAdv} timerMax={timerMax} gameStatus={gameStatus} />

      <div className="w-full max-w-[560px] flex items-center justify-between mt-1">
        {isSpectator && <div className="badge-purple"><span>👁️</span> Spectating</div>}
        {spectatorCount > 0 && <div className="badge-blue"><span>👁</span> {spectatorCount} watching</div>}
        <div className="flex gap-1 ml-auto">
          {Object.entries(BOARD_THEMES).map(([key, t]) => (
            <button key={key} onClick={() => setBoardTheme(key)} title={t.label}
              className={`w-6 h-6 rounded-full border-2 transition-all ${boardTheme === key ? 'border-chess-green scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
              style={{ background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export { playSound };
