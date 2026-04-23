import { useRef, useCallback, useEffect } from 'react';

// ── Move Classification Config ──
const CLASSIFICATION_THRESHOLDS = [
  { min: 0, label: 'best' },
  { min: -20, label: 'excellent' },
  { min: -50, label: 'good' },
  { min: -100, label: 'inaccuracy' },
  { min: -300, label: 'mistake' },
  { min: -Infinity, label: 'blunder' },
];

/**
 * Classify a move based on eval delta (from the moving player's perspective).
 * delta = newEval - prevEval (positive = improvement, negative = worsening)
 * If a mate was found, classify as brilliant.
 */
export function classifyMove(prevEval, newEval, prevType, newType) {
  // If mate is found by this move → brilliant
  if (newType === 'mate' && prevType !== 'mate') return 'brilliant';
  // If we had mate and lost it → blunder
  if (prevType === 'mate' && newType !== 'mate') return 'blunder';
  // Both mate → depends on direction
  if (prevType === 'mate' && newType === 'mate') {
    if (Math.abs(newEval) <= Math.abs(prevEval)) return 'best';
    return 'mistake';
  }

  const delta = newEval - prevEval;
  for (const t of CLASSIFICATION_THRESHOLDS) {
    if (delta >= t.min) return t.label;
  }
  return 'good';
}

/**
 * useStockfish — React hook for Stockfish Web Worker integration.
 *
 * Provides:
 *  - getEval(fen, depth) → Promise<{ type: 'cp'|'mate', value: number }>
 *  - getBestMove(fen, depth) → Promise<string> (UCI move like 'e2e4')
 *  - getEvalAndBestMove(fen, depth) → Promise<{ eval, bestMove }>
 *  - terminate() — kill the worker
 */
export default function useStockfish() {
  const workerRef = useRef(null);
  const readyRef = useRef(false);
  const pendingRef = useRef([]); // queue of { resolve, reject, type }

  // Initialize worker
  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker('/stockfish-worker.js');
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data : '';

      if (line === 'uciok') {
        readyRef.current = true;
        // Process any pending requests
        return;
      }

      // Parse eval info lines
      if (line.startsWith('info') && line.includes('score')) {
        const pending = pendingRef.current[0];
        if (!pending) return;

        // Only care about the deepest info line with seldepth
        if (!line.includes(' pv ')) return;

        let evalType = 'cp';
        let evalValue = 0;

        const cpMatch = line.match(/score cp (-?\d+)/);
        const mateMatch = line.match(/score mate (-?\d+)/);

        if (mateMatch) {
          evalType = 'mate';
          evalValue = parseInt(mateMatch[1]);
        } else if (cpMatch) {
          evalType = 'cp';
          evalValue = parseInt(cpMatch[1]);
        }

        // Store latest eval for this search
        pending._latestEval = { type: evalType, value: evalValue };
      }

      // Parse bestmove
      if (line.startsWith('bestmove')) {
        const pending = pendingRef.current.shift();
        if (!pending) return;

        const bestMove = line.split(' ')[1] || '';
        const evalResult = pending._latestEval || { type: 'cp', value: 0 };

        if (pending.type === 'eval') {
          pending.resolve(evalResult);
        } else if (pending.type === 'bestmove') {
          pending.resolve(bestMove);
        } else if (pending.type === 'both') {
          pending.resolve({ eval: evalResult, bestMove });
        }
      }
    };

    worker.onerror = (e) => {
      console.error('[Stockfish] Worker error:', e);
    };

    // Initialize UCI
    worker.postMessage('uci');
    worker.postMessage('isready');

    return worker;
  }, []);

  // Get evaluation for a position
  const getEval = useCallback((fen, depth = 12) => {
    return new Promise((resolve, reject) => {
      const worker = ensureWorker();
      pendingRef.current.push({ resolve, reject, type: 'eval', _latestEval: null });
      worker.postMessage('position fen ' + fen);
      worker.postMessage('go depth ' + depth);
    });
  }, [ensureWorker]);

  // Get best move for a position
  const getBestMove = useCallback((fen, depth = 12) => {
    return new Promise((resolve, reject) => {
      const worker = ensureWorker();
      pendingRef.current.push({ resolve, reject, type: 'bestmove', _latestEval: null });
      worker.postMessage('position fen ' + fen);
      worker.postMessage('go depth ' + depth);
    });
  }, [ensureWorker]);

  // Get both eval and best move in one call
  const getEvalAndBestMove = useCallback((fen, depth = 12) => {
    return new Promise((resolve, reject) => {
      const worker = ensureWorker();
      pendingRef.current.push({ resolve, reject, type: 'both', _latestEval: null });
      worker.postMessage('position fen ' + fen);
      worker.postMessage('go depth ' + depth);
    });
  }, [ensureWorker]);

  // Stop current search
  const stop = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage('stop');
    }
  }, []);

  // Terminate worker
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      readyRef.current = false;
      pendingRef.current = [];
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => terminate();
  }, [terminate]);

  return { getEval, getBestMove, getEvalAndBestMove, stop, terminate, classifyMove };
}
