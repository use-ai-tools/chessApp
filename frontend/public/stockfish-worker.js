// Stockfish Web Worker — loads stockfish.js v10 (asm.js, no WASM dependency) from CDN
// importScripts is allowed cross-origin in Web Workers
try {
  importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
} catch (e) {
  postMessage('info string Failed to load Stockfish engine');
}
