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
  hideTimer = false,
}) {
  const gameRef = useRef(new Chess());
  const containerRef = useRef(null);
  const readyEmitted = useRef(false);
  const [boardSize, setBoardSize] = useState(360);
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
  
  const [prequeue, setPrequeue] = useState([]); // array: {from, to, promotion} — max 2
  const [activePremoveStart, setActivePremoveStart] = useState(null);
  const prevFenRef = useRef(fen); // track FEN changes for premove execution
  
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

  // ── Responsive board sizing via ResizeObserver ──
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setBoardSize(Math.floor(w));
      }
    });
    ro.observe(containerRef.current);
    // Initial measurement
    setBoardSize(Math.floor(containerRef.current.offsetWidth) || 360);
    return () => ro.disconnect();
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

  // ── Auto-dismiss removed ──

  // ── Sync board theme from settings ──
  useEffect(() => {
    if (settings?.boardTheme) setBoardTheme(settings.boardTheme);
  }, [settings?.boardTheme]);

  // Only allow move if player color matches chess.turn()
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

  // ── Click-to-move state machine ──
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
      const piece = game.get(square);
      if (square === selectedSquare) {
        // Unselect if same square clicked
        setSelectedSquare(null);
        setLegalMoveStyles({});
        return;
      }
      
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setLegalMoveStyles(showLegalMoveHints(square));
        return;
      }

      // Try to make the move
      const promo = autoQueen ? 'q' : 'q';
      const moveCopy = new Chess(game.fen());
      try {
        const move = moveCopy.move({ from: selectedSquare, to: square, promotion: promo });
        if (move && selectedSquare !== square) {
          if (soundEnabled) playSound(move.captured ? 'capture' : moveCopy.isCheck() ? 'check' : 'move');
          onMove({ from: selectedSquare, to: square, promotion: promo, san: move.san });
        }
      } catch(e) {}

      // Silently fail if illegal
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

  // ── Premove click handler (Chess.com-like) ──
  // No legality validation when setting premove — only check that source square has your piece
  const handlePremoveClick = (square) => {
    const myColor = currentPlayer?.color === 'white' ? 'w' : 'b';
    const game = gameRef.current;

    if (!activePremoveStart) {
      // Selecting a piece for premove — check if square has your piece
      const piece = game.get(square);
      if (piece && piece.color === myColor) {
        setActivePremoveStart(square);
      } else {
        // Clicked empty or opponent piece — cancel all premoves
        if (prequeue.length > 0) {
          setPrequeue([]);
          setActivePremoveStart(null);
        }
      }
      return;
    }

    // Clicking the same square again → deselect
    if (square === activePremoveStart) {
      setActivePremoveStart(null);
      return;
    }

    // Clicking another own piece → switch selection
    const piece = game.get(square);
    if (piece && piece.color === myColor) {
      setActivePremoveStart(square);
      return;
    }

    // Setting the premove destination — allow any target square (even if currently occupied)
    // Legality will be checked on execution
    if (prequeue.length < 2) {
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

  // Execute premove INSTANTLY when it becomes our turn (FEN changed = opponent moved)
  useEffect(() => {
    if (fen !== prevFenRef.current) {
      prevFenRef.current = fen;
    }

    if (!isMyTurn || prequeue.length === 0) {
      if (isMyTurn) setActivePremoveStart(null);
      return;
    }

    // Execute the first premove in queue immediately (0ms)
    const game = gameRef.current;
    const nextPre = prequeue[0];
    const promo = nextPre.promotion || 'q';

    try {
      const moveCopy = new Chess(game.fen());
      const move = moveCopy.move({ from: nextPre.from, to: nextPre.to, promotion: promo });
      if (move) {
        // Premove is legal — execute instantly!
        if (soundEnabled) playSound(move.captured ? 'capture' : moveCopy.isCheck() ? 'check' : 'move');
        onMove({ from: nextPre.from, to: nextPre.to, promotion: promo, san: move.san });
        setPrequeue(q => q.slice(1));
      } else {
        // Premove became illegal — cancel all
        setPrequeue([]);
      }
    } catch {
      // Invalid premove — cancel all
      setPrequeue([]);
    }
  }, [isMyTurn, fen]);

  // Clear premoves when game ends
  useEffect(() => {
    if (gameStatus !== 'playing') {
      setPrequeue([]);
      setActivePremoveStart(null);
    }
  }, [gameStatus]);

  // ── Drag-to-move handler (supports premove via drag) ──
  const onDrop = (sourceSquare, targetSquare) => {
    setSelectedSquare(null);
    setLegalMoveStyles({});
    setDraggedSquare(null);
    
    const promo = autoQueen ? 'q' : undefined;

    // Premove via drag — opponent's turn
    if (!isMyTurn) {
      if (premovesEnabled && isOpponentTurn && prequeue.length < 2) {
        setPrequeue(prev => [...prev, { from: sourceSquare, to: targetSquare, promotion: promo }]);
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

  // ── Show legal move dots when piece is picked up for dragging ──
  const onPieceDragBegin = (piece, sourceSquare) => {
    // Allow drag for premove during opponent's turn
    if (isOpponentTurn && premovesEnabled) {
      const myColor = currentPlayer?.color === 'white' ? 'w' : 'b';
      const p = gameRef.current.get(sourceSquare);
      if (p && p.color === myColor) {
        setDraggedSquare(sourceSquare);
        return true;
      }
      return false;
    }
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
            borderRadius: '0',
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

  // ── Premove highlight (Chess.com red style) ──
  const getPremoveStyles = () => {
    const styles = {};
    // Active premove start selection — dark red
    if (activePremoveStart) {
      styles[activePremoveStart] = { backgroundColor: 'rgba(170, 0, 0, 0.65)', boxShadow: 'inset 0 0 8px rgba(255,0,0,0.3)' };
    }
    // Queued premoves — from = dark red, to = lighter red
    prequeue.forEach((p) => {
      styles[p.from] = { backgroundColor: 'rgba(170, 0, 0, 0.55)' };
      styles[p.to] = { backgroundColor: 'rgba(220, 60, 60, 0.55)' };
    });
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
    <div ref={containerRef} className="w-full max-w-[100vw] flex flex-col items-center gap-2">
      {floatingEmoji && (
        <div className="emoji-float" style={{ top: '40%', left: '50%' }}>{floatingEmoji}</div>
      )}

      {/* Top Player */}
      <PlayerTimer player={topPlayer} time={topTime} isActive={isTopTurn && gameStatus === 'playing'} color={topColor} captured={topCaptured} materialAdvantage={topAdv} timerMax={timerMax} gameStatus={gameStatus} hideTimer={hideTimer} />

      {/* Board + Win Probability Bar */}
      <div className="flex items-center justify-center gap-2 w-full">
        {/* Only show WinProbabilityBar in review mode */}
        {isReview && <WinProbabilityBar fen={fen} height={boardSize} />}

        <div className={`w-full max-w-[500px] lg:max-w-none lg:w-[min(90vh,600px)] aspect-square shadow-2xl shadow-black/50 transition-all duration-300 relative ${
          !isMyTurn && !isSpectator && !isReview && gameStatus === 'playing' ? 'opacity-85' : ''
        }`}
          style={{ flexShrink: 0, maxWidth: '100vw' }}
        >
          {/* Username watermark during live game */}
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
            boardWidth={boardSize}
            customBoardStyle={{ borderRadius: '0px' }}
            customDarkSquareStyle={{ backgroundColor: theme.dark }}
            customLightSquareStyle={{ backgroundColor: theme.light }}
            customSquareStyles={customSquareStyles}
            customArrows={prequeue.map((p) => [p.from, p.to, 'rgba(200, 40, 40, 0.7)'])}
            animationDuration={animDuration}
            arePiecesDraggable={isMyTurn || (isOpponentTurn && premovesEnabled)}
            snapToCursor={false}
          />
        </div>
      </div>

      {prequeue.length > 0 && <p className="text-[10px] text-red-400 font-bold">{prequeue.length} premove{prequeue.length > 1 ? 's' : ''} queued</p>}
      {activePremoveStart && prequeue.length === 0 && <p className="text-[10px] text-red-400/70 font-medium">Select target square...</p>}

      <PlayerTimer player={bottomPlayer} time={bottomTime} isActive={isBottomTurn && gameStatus === 'playing'} color={bottomColor} captured={bottomCaptured} materialAdvantage={bottomAdv} timerMax={timerMax} gameStatus={gameStatus} hideTimer={hideTimer} />

      <div className="w-full max-w-[560px] flex items-center justify-between mt-1">
        {isSpectator && <div className="badge-purple rounded-none"><span>👁️</span> Spectating</div>}
        {spectatorCount > 0 && <div className="badge-blue rounded-none"><span>👁</span> {spectatorCount} watching</div>}
        <div className="flex gap-1 ml-auto">
        </div>
      </div>
    </div>
  );
}

export { playSound };
