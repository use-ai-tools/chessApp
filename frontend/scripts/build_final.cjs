// build_final.cjs — Single-shot regeneration of frontend/src/data/puzzles.js.
//
// Pipeline (all in-memory):
//   1. Load existing puzzles.js, eval the array.
//   2. Validate each: legal FEN, every solution move legal, ends in checkmate.
//   3. For each valid puzzle, find the SHORTEST forced mate (selective solver
//      with check-priority + limited quiet moves). Replace the recorded
//      solution with this shortest PV.
//   4. Generate horizontal-mirror variants to expand the unique pool.
//   5. Dedupe by FEN, take 10 mate-in-1 + 90 mate-in-2 = 100 puzzles.
//   6. Re-validate, write puzzles.js with the new schema:
//        id, title, difficulty, theme, fen, sideToMove, objective,
//        solution (interleaved SAN), moves, hints[], explanation
//      and an exported validatePuzzles() for runtime verification.
//
// Usage:
//   node frontend/scripts/build_final.cjs

const path = require('path');
const fs = require('fs');
const { Chess } = require(path.join(__dirname, '..', 'node_modules', 'chess.js'));

const PUZZLES_PATH = path.join(__dirname, '..', 'src', 'data', 'puzzles.js');

// ── Load existing puzzles by extracting the array literal ──────────────────
function loadExistingPuzzles() {
  const src = fs.readFileSync(PUZZLES_PATH, 'utf8');
  const arrStart = src.indexOf('[', src.indexOf('puzzles = '));
  let depth = 0, end = -1;
  for (let i = arrStart; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') { depth--; if (!depth) { end = i; break; } }
  }
  // eslint-disable-next-line no-eval
  return eval(src.slice(arrStart, end + 1));
}

// ── Selective mate solver ──────────────────────────────────────────────────
function mateAttacker(game, N) {
  if (N <= 0) return null;
  const moves = game.moves({ verbose: true });
  const checks = moves.filter(m => m.san.includes('+') || m.san.includes('#'));
  const tried = N === 1 ? checks : checks.concat(moves.filter(m => !checks.includes(m)).slice(0, 12));
  for (const m of tried) {
    game.move(m);
    if (game.isCheckmate()) { game.undo(); return [m.san]; }
    if (N === 1) { game.undo(); continue; }
    const replies = game.moves({ verbose: true });
    if (!replies.length) { game.undo(); continue; }
    let allMate = true;
    let longest = null;
    for (const r of replies) {
      game.move(r);
      const sub = mateAttacker(game, N - 1);
      game.undo();
      if (!sub) { allMate = false; break; }
      if (!longest || sub.length > longest.line.length) longest = { reply: r.san, line: sub };
    }
    game.undo();
    if (allMate && longest) return [m.san, longest.reply, ...longest.line];
  }
  return null;
}

function shortestMate(fen, maxN = 4) {
  for (let n = 1; n <= maxN; n++) {
    const g = new Chess(fen);
    const pv = mateAttacker(g, n);
    if (pv) return { N: n, pv };
  }
  return null;
}

// ── Mirror helpers (horizontal flip files a↔h) ────────────────────────────
function mirrorFiles(fen) {
  const [board, turn, ...rest] = fen.split(' ');
  const flipped = board.split('/').map(rank => {
    let exp = '';
    for (const c of rank) exp += /[1-8]/.test(c) ? '.'.repeat(+c) : c;
    return exp.split('').reverse().join('').replace(/\.+/g, m => m.length);
  }).join('/');
  return flipped + ' ' + turn + ' ' + rest.join(' ');
}
function mirrorSan(san) {
  return san.replace(/[a-h]/g, c => 'abcdefgh'.charAt(7 - 'abcdefgh'.indexOf(c)));
}

// ── Theme detection ───────────────────────────────────────────────────────
function detectTheme(pv) {
  const last = pv[pv.length - 1];
  const onBackRank = /[18][+#]?$/.test(last);
  if (last.startsWith('Q')) return onBackRank ? 'queen-mate-back-rank' : 'queen-mate';
  if (last.startsWith('R')) return onBackRank ? 'back-rank-mate' : 'rook-mate';
  if (last.startsWith('N')) return 'knight-mate';
  if (last.startsWith('B')) return 'bishop-mate';
  if (last.startsWith('K')) return 'king-mate';
  if (/^[a-h]/.test(last)) return 'pawn-mate';
  return 'mate';
}
function pieceFromTheme(theme) {
  if (theme.includes('queen')) return 'queen';
  if (theme.includes('rook') || theme.includes('back-rank')) return 'rook';
  if (theme.includes('knight')) return 'knight';
  if (theme.includes('bishop')) return 'bishop';
  if (theme.includes('pawn')) return 'pawn';
  if (theme.includes('king')) return 'king';
  return 'piece';
}
function difficultyForN(N) {
  return N === 1 ? 'easy' : N === 2 ? 'medium' : N === 3 ? 'hard' : 'expert';
}

// ── Main pipeline ─────────────────────────────────────────────────────────
console.log('Loading existing puzzles...');
const existing = loadExistingPuzzles();
console.log('Loaded ' + existing.length + ' puzzles');

console.log('Validating + finding shortest mates...');
const validPool = [];
let invalid = 0;
for (const p of existing) {
  let g;
  try { g = new Chess(p.fen); } catch { invalid++; continue; }
  if (g.isGameOver()) { invalid++; continue; }
  if (!Array.isArray(p.solution) || p.solution.length === 0) { invalid++; continue; }
  // Check labeled solution works and ends in mate
  const labeledOk = (() => {
    const gg = new Chess(p.fen);
    for (const mv of p.solution) if (!gg.move(mv)) return false;
    return gg.isCheckmate();
  })();
  if (!labeledOk) { invalid++; continue; }
  // Find shortest mate (typically shorter than the labeled one)
  const r = shortestMate(p.fen, Math.ceil(p.solution.length / 2));
  if (!r) { invalid++; continue; }
  validPool.push({ fen: p.fen, pv: r.pv, N: r.N, sideToMove: g.turn() });
}
console.log('  valid=' + validPool.length + ' invalid=' + invalid);

// Dedupe originals
const seenFens = new Set();
const originals = [];
for (const p of validPool) {
  if (seenFens.has(p.fen)) continue;
  seenFens.add(p.fen);
  originals.push(p);
}
console.log('Unique originals: ' + originals.length);

// Generate mirrors
console.log('Generating mirrors...');
const mirrors = [];
for (const p of originals) {
  const mFen = mirrorFiles(p.fen);
  if (seenFens.has(mFen)) continue;
  const mPv = p.pv.map(mirrorSan);
  // verify
  const g = new Chess(mFen);
  let ok = true;
  for (const mv of mPv) if (!g.move(mv)) { ok = false; break; }
  if (!ok || !g.isCheckmate()) continue;
  seenFens.add(mFen);
  mirrors.push({ fen: mFen, pv: mPv, N: p.N, sideToMove: g.turn() === 'w' ? 'w' : 'b' });
}
// Note: sideToMove of mirror = initial turn of original (mirror doesn't flip color)
for (const m of mirrors) {
  m.sideToMove = (new Chess(m.fen)).turn();
}
console.log('Mirrors created: ' + mirrors.length);

// Pool of all unique puzzles
const all = [...originals, ...mirrors];
const mate1 = all.filter(p => p.N === 1);
const mate2 = all.filter(p => p.N === 2);
const mate3 = all.filter(p => p.N === 3);
const mate4 = all.filter(p => p.N === 4);
console.log('Available by N: 1=' + mate1.length + ', 2=' + mate2.length + ', 3=' + mate3.length + ', 4=' + mate4.length);

// Take 10 mate-in-1, fill rest with mate-in-2 (preserving harder ones if any)
const want1 = 10;
const want2 = 90;
const chosen = [
  ...mate1.slice(0, want1),
  ...mate2.slice(0, want2),
];
if (chosen.length !== 100) {
  console.error('FATAL: only got ' + chosen.length + ' puzzles (need 100)');
  process.exit(1);
}

// Build final puzzle objects
const puzzles = chosen.map((p, idx) => {
  const id = idx + 1;
  const N = p.N;
  const theme = detectTheme(p.pv);
  const piece = pieceFromTheme(theme);
  return {
    id,
    title: 'Mate in ' + N,
    difficulty: difficultyForN(N),
    theme,
    fen: p.fen,
    sideToMove: p.sideToMove,
    objective: 'Find the forced mate in ' + N + '.',
    solution: p.pv,
    moves: N,
    hints: [
      'Look for a forcing ' + piece + ' move.',
      N === 1 ? 'The mating move must check the king with no escape.' : 'Reduce the king\'s escape squares, then deliver mate.',
    ],
    explanation: 'Forced mate in ' + N + '. Every defender reply has been calculated and leads to checkmate.',
  };
});

// ── Final validation ──────────────────────────────────────────────────────
function validate(puzzles) {
  const errors = []; const dupes = []; const seen = new Set();
  if (puzzles.length !== 100) errors.push('Total ' + puzzles.length + ' (expected 100)');
  for (const p of puzzles) {
    if (seen.has(p.fen)) dupes.push(p.id);
    seen.add(p.fen);
    let g;
    try { g = new Chess(p.fen); } catch { errors.push('#' + p.id + ': invalid FEN'); continue; }
    if (g.turn() !== p.sideToMove) errors.push('#' + p.id + ': sideToMove mismatch');
    let ok = true;
    for (let i = 0; i < p.solution.length; i++) {
      const m = g.move(p.solution[i]);
      if (!m) { errors.push('#' + p.id + ': move ' + (i + 1) + ' (' + p.solution[i] + ') illegal'); ok = false; break; }
    }
    if (ok) {
      const last = p.solution[p.solution.length - 1];
      if (last.includes('#') && !g.isCheckmate()) errors.push('#' + p.id + ': marked # but not mate');
      const expected = p.moves * 2 - 1;
      if (p.solution.length !== expected) errors.push('#' + p.id + ': solution length ' + p.solution.length + ' expected ' + expected);
    }
  }
  return { errors, dupes };
}

const { errors, dupes } = validate(puzzles);
const dist = puzzles.reduce((m, p) => { m[p.moves] = (m[p.moves] || 0) + 1; return m; }, {});
console.log('\nFinal distribution by N: ' + JSON.stringify(dist));
console.log('Errors: ' + errors.length + ', Duplicates: ' + dupes.length);
if (errors.length) { errors.slice(0, 20).forEach(e => console.error('  ' + e)); process.exit(1); }

// ── Write file ────────────────────────────────────────────────────────────
const banner = `// AUTO-GENERATED by frontend/scripts/build_final.cjs — do not edit by hand.
// To regenerate run:  node frontend/scripts/build_final.cjs
//
// Every puzzle has a chess.js-verified forced-mate solution.
// Distribution by mate length: ${JSON.stringify(dist)}
//
// Schema per puzzle:
//   id (1..100), title, difficulty (easy|medium|hard|expert), theme,
//   fen (string), sideToMove ('w'|'b'), objective (string),
//   solution: interleaved SAN array [user1, opp1, user2, opp2, ...],
//   moves: number of USER moves, hints: string[2], explanation: string
`;
const body = `export const puzzles = ${JSON.stringify(puzzles, null, 2)};

export default puzzles;

// Developer-only runtime validator.
// In browser console: validatePuzzles((await import('chess.js')).Chess)
export function validatePuzzles(ChessCtor) {
  if (!ChessCtor) { console.error('Pass Chess constructor as argument'); return null; }
  const errors = []; const duplicates = []; const seen = new Set();
  console.log('Validating ' + puzzles.length + ' puzzles...');
  if (puzzles.length !== 100) errors.push('Count is ' + puzzles.length + ' (expected 100)');
  for (const p of puzzles) {
    if (seen.has(p.fen)) duplicates.push(p.id);
    seen.add(p.fen);
    let g;
    try { g = new ChessCtor(p.fen); } catch { errors.push('#' + p.id + ': invalid FEN'); continue; }
    if (g.turn() !== p.sideToMove) errors.push('#' + p.id + ': sideToMove mismatch');
    let ok = true;
    for (let i = 0; i < p.solution.length; i++) {
      const m = g.move(p.solution[i]);
      if (!m) { errors.push('#' + p.id + ': move ' + (i+1) + ' (' + p.solution[i] + ') illegal'); ok = false; break; }
    }
    if (ok) {
      const last = p.solution[p.solution.length - 1];
      if (last.includes('#') && !g.isCheckmate()) errors.push('#' + p.id + ': marked # but not mate');
    }
  }
  const result = { total: puzzles.length, invalid: errors.length, errors, duplicates };
  console.log(result);
  return result;
}
`;
fs.writeFileSync(PUZZLES_PATH, banner + '\n' + body);
console.log('\n✓ Wrote ' + puzzles.length + ' puzzles → ' + PUZZLES_PATH);
