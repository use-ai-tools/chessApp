// Learn Mode — rich beginner course.
// Each lesson has: intro (multi-step explanation + board demo), summary (key facts),
// practice tasks (guided moves), and a mini puzzle.
//
// Default language: Hinglish (hg). Also supports en (English) and hi (Hindi).
// Each solution accepts multiple alternates via solutions: [{ from, to }, ...].

const PIECE = 'piece';
const CONCEPT = 'concept';

const L = (en, hi, hg) => ({ en, hi, hg });

const LESSONS = [
  // ────────────────────────────────────────────────────────────────
  {
    id: 'board-basics',
    category: CONCEPT,
    icon: '♟',
    title: L('The Chessboard', 'शतरंज का बोर्ड', 'Chess Board'),
    intro: [
      {
        text: L(
          'Chess is played on an 8×8 board (64 squares). Columns are called files (a–h), rows are called ranks (1–8).',
          '8×8 बोर्ड पर 64 खाने। कॉलम = file (a-h), पंक्ति = rank (1-8)।',
          '8x8 board pe 64 squares. Columns = files (a-h), rows = ranks (1-8).'
        ),
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        highlights: [],
      },
      {
        text: L(
          'Each player has 16 pieces. White always moves first.',
          'हर खिलाड़ी के 16 मोहरे। सफ़ेद पहले चलता है।',
          'Har player ke 16 pieces hote hain. White always pehle chalta hai.'
        ),
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        highlights: [],
      },
      {
        text: L(
          'The goal is to checkmate the opponent\'s King — trap it so it can\'t escape.',
          'लक्ष्य: विरोधी राजा को मात देना।',
          'Goal: opponent ke King ko checkmate karna — koi escape na bache.'
        ),
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        highlights: ['e1', 'e8'],
      },
    ],
    practice: [
      {
        task: L(
          'Play e2 → e4 to control the centre.',
          'e2 के प्यादे को e4 ले जाओ।',
          'e2 wala pawn e4 pe le jao — centre control.'
        ),
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        solutions: [{ from: 'e2', to: 'e4' }],
        hint: L('Pawn jumps two from start.', 'पहले चाल में प्यादा 2 खाने जा सकता है।', 'Pehli chaal mein pawn 2 squares jump kar sakta hai.'),
      },
      {
        task: L(
          'Develop your knight: g1 → f3.',
          'घोड़े को g1 से f3 पर ले जाओ।',
          'Knight g1 se f3 pe develop karo.'
        ),
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        solutions: [{ from: 'g1', to: 'f3' }],
        hint: L('Knight makes an L-shape.', 'घोड़ा L-शेप में चलता है।', 'Knight L-shape mein chalta hai.'),
      },
    ],
    puzzle: {
      task: L(
        'Open the centre — push the d-pawn two squares.',
        'd2 के प्यादे को d4 पर ले जाओ।',
        'd2 pawn ko d4 pe push karo — centre kholo.'
      ),
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solutions: [{ from: 'd2', to: 'd4' }],
      hint: L('Use the d-file.', 'd फ़ाइल का प्यादा चलाओ।', 'd-file ka pawn chalao.'),
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'king',
    category: PIECE,
    icon: '♔',
    title: L('The King', 'राजा', 'King'),
    intro: [
      {
        text: L(
          'The King moves exactly ONE square in any direction — up, down, left, right, or diagonal.',
          'राजा किसी भी दिशा में 1 खाना चलता है।',
          'King 1 square any direction chalta hai — straight ya diagonal.'
        ),
        fen: '8/8/8/8/3K4/8/8/8 w - - 0 1',
        highlights: ['c3','c4','c5','d3','d5','e3','e4','e5'],
      },
      {
        text: L(
          'The King CANNOT move onto a square attacked by an enemy piece.',
          'राजा कभी ख़तरे में नहीं जा सकता।',
          'King kabhi danger square pe nahi ja sakta — check mein nahi ja sakta.'
        ),
        fen: '3r4/8/8/8/3K4/8/8/8 w - - 0 1',
        highlights: ['c3','c4','c5','e3','e4','e5'],
      },
      {
        text: L(
          'Losing your King = losing the game. Always keep him safe!',
          'राजा हारा = खेल हारा। उसे सुरक्षित रखो।',
          'King hara toh game khatam. Use safe rakhna sabse zaroori.'
        ),
        fen: '8/8/8/8/3K4/8/8/8 w - - 0 1',
        highlights: ['d4'],
      },
    ],
    summary: {
      movement: L('One square in any direction.', '1 खाना किसी भी दिशा में।', '1 square any direction.'),
      capture:  L('Captures any adjacent enemy piece.', 'सटा हुआ शत्रु मार सकता है।', 'Adjacent enemy capture kar sakta hai.'),
      strong:   L('Strong in the endgame — joins the fight.', 'अंत में ताकतवर।', 'Endgame mein active king strong hota hai.'),
      weak:     L('Slow and vulnerable in the opening.', 'शुरुआत में कमज़ोर।', 'Opening mein king slow aur risky hota hai.'),
      tip:      L('Castle early to keep him safe.', 'जल्दी कैसलिंग करो।', 'Jaldi castling karke king ko safe karo.'),
      mistake:  L('Walking into a check — always look at attacked squares.', 'शह में चलना — हमलावर खानों पर ध्यान दो।', 'Check mein chalna — attacked squares pe nazar rakho.'),
    },
    practice: [
      {
        task: L('Move your King to e5.', 'राजा को e5 पर ले जाओ।', 'King ko e5 pe le jao.'),
        fen: '8/8/8/8/3K4/8/8/8 w - - 0 1',
        solutions: [{ from: 'd4', to: 'e5' }],
        hint: L('One step diagonally forward.', 'एक तिरछी चाल।', 'Ek tirchi chaal aage.'),
      },
      {
        task: L('Capture the black pawn with your King.', 'काले प्यादे को राजा से मारो।', 'Black pawn ko King se capture karo.'),
        fen: '8/8/8/8/3K4/4p3/8/8 w - - 0 1',
        solutions: [{ from: 'd4', to: 'e3' }],
        hint: L('Kings can capture too.', 'राजा भी मार सकता है।', 'King bhi capture kar sakta hai.'),
      },
    ],
    puzzle: {
      task: L(
        'King is in check! Walk him to safety.',
        'राजा शह में है — सुरक्षित खाने पर जाओ।',
        'King check mein hai — safe square pe le jao.'
      ),
      fen: '4k3/8/8/8/8/8/8/r3K3 w - - 0 1',
      solutions: [
        { from: 'e1', to: 'e2' },
        { from: 'e1', to: 'd2' },
        { from: 'e1', to: 'f2' },
      ],
      hint: L('Step off the first rank.', 'पहली पंक्ति छोड़ दो।', 'Pehli rank chhod do — upar chalo.'),
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'rook',
    category: PIECE,
    icon: '♖',
    title: L('The Rook', 'हाथी', 'Rook'),
    intro: [
      {
        text: L(
          'The Rook moves in straight lines — up, down, left or right — any number of squares.',
          'हाथी सीधी लाइन में चलता है — कितने भी खाने।',
          'Rook straight lines mein chalta hai — kitne bhi squares.'
        ),
        fen: '8/8/8/8/3R4/8/8/8 w - - 0 1',
        highlights: ['d1','d2','d3','d5','d6','d7','d8','a4','b4','c4','e4','f4','g4','h4'],
      },
      {
        text: L(
          'The Rook captures any enemy piece in its straight line.',
          'सीधी लाइन में आने वाला कोई भी मोहरा मार सकता है।',
          'Apni straight line mein koi bhi enemy ko capture kar sakta hai.'
        ),
        fen: '8/8/8/8/3R2p1/8/8/8 w - - 0 1',
        highlights: ['g4'],
      },
      {
        text: L(
          'Two rooks plus the king deliver an easy checkmate.',
          'दो हाथी + राजा से आसान मात।',
          'Do rooks + king se easy checkmate hota hai.'
        ),
        fen: '4k3/8/8/8/8/8/R7/R3K3 w - - 0 1',
        highlights: ['a2', 'a1'],
      },
    ],
    summary: {
      movement: L('Straight lines, any distance.', 'सीधी रेखा, कितने भी खाने।', 'Straight lines, any number of squares.'),
      capture:  L('Captures along its line.', 'अपनी रेखा का शत्रु मारता है।', 'Apni line ka enemy capture karta hai.'),
      strong:   L('Powerful on open files and ranks.', 'खुली file/rank पर ताकतवर।', 'Open file/rank pe rook bahut strong hota hai.'),
      weak:     L('Slow to develop early in the game.', 'शुरू में निकालना मुश्किल।', 'Opening mein develop karna mushkil.'),
      tip:      L('Connect rooks and seize open files.', 'दोनों हाथी मिलाओ।', 'Dono rooks ko connect karo, open files pe rakho.'),
      mistake:  L('Bringing the rook out too early.', 'जल्दी बाहर निकालना।', 'Rook ko bahut jaldi bahar nikalna.'),
    },
    practice: [
      {
        task: L('Capture the pawn with your Rook.', 'हाथी से प्यादे को मारो।', 'Rook se pawn capture karo.'),
        fen: '8/8/8/8/3R2p1/8/8/8 w - - 0 1',
        solutions: [{ from: 'd4', to: 'g4' }],
        hint: L('Slide along the 4th rank.', '4वीं पंक्ति में चलो।', '4th rank pe slide karo.'),
      },
      {
        task: L('Take control of the open d-file: Rd1 → d8.', 'हाथी को d1 से d8 पर ले जाओ।', 'Rook ko d1 se d8 pe le jao — d-file claim.'),
        fen: '8/8/8/8/8/8/8/3R4 w - - 0 1',
        solutions: [{ from: 'd1', to: 'd8' }],
        hint: L('All the way to rank 8.', '8वीं रैंक तक।', 'd-file pe end tak slide.'),
      },
    ],
    puzzle: {
      task: L(
        'Win the hanging pawn! One move.',
        'हाथी से प्यादा मार लो।',
        'Hanging pawn ko capture karo — ek hi chaal.'
      ),
      fen: '4k3/8/8/3p4/8/8/8/3RK3 w - - 0 1',
      solutions: [{ from: 'd1', to: 'd5' }],
      hint: L('Same file, push up.', 'एक ही file, ऊपर बढ़ो।', 'Same file, upar push.'),
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'bishop',
    category: PIECE,
    icon: '♗',
    title: L('The Bishop', 'ऊंट', 'Bishop'),
    intro: [
      {
        text: L(
          'The Bishop moves diagonally — any number of squares.',
          'ऊंट तिरछा चलता है — कितने भी खाने।',
          'Bishop diagonally chalta hai — kitne bhi squares.'
        ),
        fen: '8/8/8/8/3B4/8/8/8 w - - 0 1',
        highlights: ['a1','b2','c3','e5','f6','g7','h8','a7','b6','c5','e3','f2','g1'],
      },
      {
        text: L(
          'A Bishop stays on its starting color forever — light or dark.',
          'अपने रंग पर हमेशा रहता है।',
          'Apne starting color pe hi rehta hai — light ya dark.'
        ),
        fen: '8/8/8/8/3B4/8/8/8 w - - 0 1',
        highlights: ['d4'],
      },
      {
        text: L(
          'A Bishop pair on open diagonals is very strong.',
          'दो ऊंट खुली तिरछी पर ताकतवर।',
          'Do bishops open diagonals pe bahut powerful hote hain.'
        ),
        fen: '8/8/8/8/2B5/3B4/8/8 w - - 0 1',
        highlights: ['c4', 'd3'],
      },
    ],
    summary: {
      movement: L('Diagonal lines, any distance.', 'तिरछी रेखा।', 'Diagonal lines, any distance.'),
      capture:  L('Captures along a diagonal.', 'तिरछी रेखा पर मारता है।', 'Diagonal pe capture karta hai.'),
      strong:   L('Strong on long open diagonals.', 'लंबी खुली तिरछी पर ताकतवर।', 'Long open diagonals pe strong.'),
      weak:     L('Only covers one color — half the board.', 'सिर्फ़ एक रंग के खाने।', 'Sirf ek color cover karta hai — half board.'),
      tip:      L('Develop both bishops early.', 'दोनों ऊंट जल्दी निकालो।', 'Dono bishops jaldi develop karo.'),
      mistake:  L('Trapping your bishop behind pawns.', 'अपने प्यादों के पीछे फँसा देना।', 'Apne pawns ke peeche bishop ko block karna.'),
    },
    practice: [
      {
        task: L('Capture the pawn with your Bishop.', 'ऊंट से प्यादे को मारो।', 'Bishop se pawn capture karo.'),
        fen: '8/8/5p2/8/3B4/8/8/8 w - - 0 1',
        solutions: [{ from: 'd4', to: 'f6' }],
        hint: L('Up-right diagonal.', 'ऊपर-दाएँ तिरछा।', 'Upper-right diagonal.'),
      },
      {
        task: L('Sweep to h8 — long diagonal.', 'ऊंट को h8 पर ले जाओ।', 'Bishop ko h8 pe le jao — long diagonal.'),
        fen: '8/8/8/8/3B4/8/8/8 w - - 0 1',
        solutions: [{ from: 'd4', to: 'h8' }],
        hint: L('All the way up-right.', 'अंत तक ऊपर-दाएँ।', 'End tak upar-right.'),
      },
    ],
    puzzle: {
      task: L(
        'Capture the undefended rook with your Bishop.',
        'खुली हाथी को ऊंट से मार लो।',
        'Hanging rook ko bishop se capture karo.'
      ),
      fen: '4k3/6r1/8/8/3B4/8/8/4K3 w - - 0 1',
      solutions: [{ from: 'd4', to: 'g7' }],
      hint: L('Aim for the open diagonal.', 'खुली तिरछी ढूँढो।', 'Open diagonal use karo.'),
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'queen',
    category: PIECE,
    icon: '♕',
    title: L('The Queen', 'रानी', 'Queen'),
    intro: [
      {
        text: L(
          'The Queen moves like a Rook AND a Bishop combined — any direction, any distance.',
          'रानी हाथी + ऊंट दोनों की तरह चलती है।',
          'Queen Rook + Bishop dono ki tarah chalti hai — any direction.'
        ),
        fen: '8/8/8/8/3Q4/8/8/8 w - - 0 1',
        highlights: ['a4','b4','c4','e4','f4','g4','h4','d1','d2','d3','d5','d6','d7','d8','a1','b2','c3','e5','f6','g7','h8','a7','b6','c5','e3','f2','g1'],
      },
      {
        text: L(
          'She is the most powerful piece — worth 9 points.',
          'सबसे ताकतवर मोहरा — 9 अंक।',
          'Sabse powerful piece — value 9.'
        ),
        fen: '8/8/8/8/3Q4/8/8/8 w - - 0 1',
        highlights: ['d4'],
      },
      {
        text: L(
          'Don\'t bring the Queen out too early — opponents will chase her.',
          'रानी को बहुत जल्दी मत निकालो — पीछे पड़ जाएँगे।',
          'Queen ko bahut jaldi mat nikalo — log peeche pad jate hain.'
        ),
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        highlights: ['d1'],
      },
    ],
    summary: {
      movement: L('Any direction, any distance.', 'किसी भी दिशा, कितने भी खाने।', 'Any direction, any distance.'),
      capture:  L('Captures like Rook + Bishop.', 'हाथी + ऊंट जैसी capture।', 'Rook + Bishop dono ki tarah capture.'),
      strong:   L('Powerful in attack and defense.', 'हमले और बचाव दोनों में।', 'Attack aur defense dono mein.'),
      weak:     L('Easily harassed if exposed early.', 'जल्दी निकले तो परेशान।', 'Jaldi nikli toh asani se hara ki ja sakti hai.'),
      tip:      L('Develop pieces first, queen later.', 'पहले छोटे मोहरे, फिर रानी।', 'Pehle minor pieces, fir queen.'),
      mistake:  L('Bringing the Queen out on move 2 or 3.', 'दूसरी-तीसरी चाल में रानी निकालना।', 'Move 2-3 mein queen nikalna.'),
    },
    practice: [
      {
        task: L('Capture the rook with your Queen.', 'रानी से हाथी को मारो।', 'Queen se rook capture karo.'),
        fen: '8/8/8/6r1/3Q4/8/8/8 w - - 0 1',
        solutions: [{ from: 'd4', to: 'g7' }],
        hint: L('Use the bishop-style diagonal.', 'तिरछा चलो।', 'Diagonal use karo — bishop ki tarah.'),
      },
      {
        task: L('Slide to d8 — like a rook.', 'रानी को d8 पर ले जाओ।', 'Queen ko d8 pe le jao — rook style.'),
        fen: '8/8/8/8/3Q4/8/8/8 w - - 0 1',
        solutions: [{ from: 'd4', to: 'd8' }],
        hint: L('Straight up the d-file.', 'सीधे d फ़ाइल पर।', 'd-file pe straight up.'),
      },
    ],
    puzzle: {
      task: L(
        'Find checkmate in 1 with your Queen!',
        '1 चाल में मात दो।',
        'Queen se 1 move mein checkmate do!'
      ),
      fen: '6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1',
      solutions: [{ from: 'd1', to: 'd8' }],
      hint: L('Back rank!', 'अंतिम पंक्ति!', 'Back rank pe lao queen ko.'),
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'knight',
    category: PIECE,
    icon: '♘',
    title: L('The Knight', 'घोड़ा', 'Knight'),
    intro: [
      {
        text: L(
          'The Knight moves in an L-shape: 2 squares one way, then 1 sideways.',
          'घोड़ा L-शेप में चलता है: 2 + 1।',
          'Knight L-shape mein chalta hai: 2 squares ek direction, fir 1 sideways.'
        ),
        fen: '8/8/8/8/3N4/8/8/8 w - - 0 1',
        highlights: ['b3','b5','c2','c6','e2','e6','f3','f5'],
      },
      {
        text: L(
          'Knights are the only piece that can JUMP over other pieces.',
          'घोड़ा एकमात्र मोहरा है जो कूद सकता है।',
          'Knight hi ek aisa piece hai jo doosre pieces ke upar se jump kar sakta hai.'
        ),
        fen: '8/8/8/2pNp3/2p1p3/8/8/8 w - - 0 1',
        highlights: ['b4','b6','c3','c7','e3','e7','f4','f6'],
      },
      {
        text: L(
          'Knights are deadly fork-makers — they attack two pieces at once.',
          'घोड़ा फोर्क का बादशाह।',
          'Knight forks ka king hota hai — ek saath 2 pieces pe attack.'
        ),
        fen: '4k3/8/8/3N4/8/4r3/8/4K3 w - - 0 1',
        highlights: ['d5'],
      },
    ],
    summary: {
      movement: L('L-shape: 2 + 1.', 'L-शेप: 2 + 1।', 'L-shape: 2 + 1.'),
      capture:  L('Lands on enemy square = capture.', 'जहाँ कूदा वहाँ शत्रु मारता है।', 'Jis square pe land kare wahan capture.'),
      strong:   L('Strong in closed positions and forks.', 'बंद positions और फोर्क में बढ़िया।', 'Closed positions aur forks mein strong.'),
      weak:     L('Slow over long distances.', 'दूर तक धीमा।', 'Long distance pe slow hota hai.'),
      tip:      L('Outposts: knights on advanced squares are deadly.', 'Outpost पर बहुत ख़तरनाक।', 'Outpost squares pe knight bahut dangerous hota hai.'),
      mistake:  L('Putting a knight on the edge — "knight on the rim is dim".', 'किनारे पर रखना।', 'Knight ko rim pe rakhna — "knight on the rim is dim".'),
    },
    practice: [
      {
        task: L('Jump the Knight to capture the pawn.', 'घोड़े से प्यादा मारो।', 'Knight se pawn capture karo.'),
        fen: '8/8/4p3/8/3N4/8/8/8 w - - 0 1',
        solutions: [{ from: 'd4', to: 'e6' }],
        hint: L('L-shape up.', 'ऊपर की L-शेप चाल।', 'Upar L-shape.'),
      },
      {
        task: L('Knight to f3 — classic development.', 'घोड़े को f3 पर लाओ।', 'Knight ko f3 pe lao — classic development.'),
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        solutions: [{ from: 'g1', to: 'f3' }],
        hint: L('Develop the kingside knight.', 'राजा की तरफ़ का घोड़ा।', 'Kingside knight develop karo.'),
      },
    ],
    puzzle: {
      task: L(
        'Find the knight fork — attack King and Rook!',
        'घोड़े से फोर्क करो — राजा + हाथी!',
        'Knight fork dhundo — King aur Rook ek saath attack!'
      ),
      fen: 'r1k5/8/8/3N4/8/8/8/4K3 w - - 0 1',
      solutions: [{ from: 'd5', to: 'b6' }],
      hint: L('Land between them.', 'दोनों के बीच कूदो।', 'Dono ke beech land karo.'),
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'pawn',
    category: PIECE,
    icon: '♙',
    title: L('The Pawn', 'प्यादा', 'Pawn'),
    intro: [
      {
        text: L(
          'Pawns move FORWARD only — 1 square. From the starting rank, they may move 2.',
          'प्यादा सिर्फ़ आगे चलता है — 1 खाना। पहली बार 2।',
          'Pawn sirf aage chalta hai — 1 square. Starting rank se 2 squares allowed.'
        ),
        fen: '8/8/8/8/8/8/4P3/8 w - - 0 1',
        highlights: ['e3', 'e4'],
      },
      {
        text: L(
          'Pawns CAPTURE diagonally — one square forward-left or forward-right.',
          'प्यादा तिरछे मारता है।',
          'Pawn diagonally capture karta hai — agle row ka left ya right.'
        ),
        fen: '8/8/8/3p1p2/4P3/8/8/8 w - - 0 1',
        highlights: ['d5', 'f5'],
      },
      {
        text: L(
          'When a pawn reaches the last rank, it PROMOTES — usually to a Queen.',
          'अंतिम पंक्ति पर प्यादा रानी बन सकता है।',
          'Last rank pe pawn promote ho jata hai — usually Queen banta hai.'
        ),
        fen: '4P3/8/8/8/8/8/8/8 w - - 0 1',
        highlights: ['e8'],
      },
    ],
    summary: {
      movement: L('Forward 1 (or 2 from start). Never backward.', 'सिर्फ़ आगे। पीछे नहीं।', 'Sirf aage — peeche kabhi nahi.'),
      capture:  L('Diagonally forward, 1 square.', 'तिरछा आगे।', 'Diagonal forward 1 square.'),
      strong:   L('Pawn chains protect each other.', 'चेन बनाकर बढ़िया।', 'Pawn chains ek doosre ko protect karte hain.'),
      weak:     L('Cannot retreat — every push is permanent.', 'पीछे नहीं जा सकता।', 'Pawn peeche nahi ja sakta — soch ke chalna.'),
      tip:      L('Promote a pawn to win the game.', 'प्रमोशन से जीतो।', 'Pawn promote karke game jeet sakte ho.'),
      mistake:  L('Pushing too many pawns in the opening.', 'शुरू में बहुत प्यादे चलाना।', 'Opening mein bahut saare pawn push karna.'),
    },
    practice: [
      {
        task: L('Capture diagonally: e4 takes d5.', 'e4 का प्यादा d5 पर ले जाओ।', 'e4 pawn d5 pe diagonal capture karo.'),
        fen: '8/8/8/3p4/4P3/8/8/8 w - - 0 1',
        solutions: [{ from: 'e4', to: 'd5' }],
        hint: L('Diagonal forward.', 'तिरछा।', 'Diagonal.'),
      },
      {
        task: L('Push e2 → e4 (two squares from start).', 'e2 से e4 — दो खाने।', 'e2 se e4 — 2 squares jump.'),
        fen: '8/8/8/8/8/8/4P3/8 w - - 0 1',
        solutions: [{ from: 'e2', to: 'e4' }],
        hint: L('First move can be 2.', 'पहली चाल में 2।', 'Pehli chaal mein 2 squares allowed.'),
      },
    ],
    puzzle: {
      task: L(
        'Promote the pawn — march to the last rank!',
        'प्यादा प्रमोट करो — आख़िरी रैंक तक।',
        'Pawn ko promote karo — last rank tak le jao.'
      ),
      fen: '4k3/4P3/8/8/8/8/8/4K3 w - - 0 1',
      solutions: [{ from: 'e7', to: 'e8' }],
      hint: L('One square forward = Queen!', 'एक चाल आगे = रानी!', 'Ek square aage = Queen!'),
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'check',
    category: CONCEPT,
    icon: '⚡',
    title: L('Check', 'शह', 'Check'),
    intro: [
      {
        text: L(
          'Check = the King is under attack.',
          'शह = राजा पर हमला।',
          'Check = King pe direct attack ho raha hai.'
        ),
        fen: '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1',
        highlights: ['e8'],
      },
      {
        text: L(
          'You MUST escape check on your next move — three ways: move the king, block the attack, or capture the attacker.',
          'शह से बचना ज़रूरी है: चलो, ब्लॉक करो, या मारो।',
          'Check se nikalna zaroori hai — 3 tarike: king move, block karo, ya attacker ko capture karo.'
        ),
        fen: '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1',
        highlights: [],
      },
    ],
    practice: [
      {
        task: L('Put the black King in check with your Rook.', 'हाथी से शह दो।', 'Rook se Black King ko check do.'),
        fen: '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1',
        solutions: [{ from: 'e2', to: 'e7' }],
        hint: L('Same file as the king.', 'राजा वाली file।', 'Same file as king.'),
      },
    ],
    puzzle: {
      task: L(
        'Deliver check with the Bishop.',
        'ऊंट से शह दो।',
        'Bishop se check do!'
      ),
      fen: '6k1/8/8/8/2B5/8/8/4K3 w - - 0 1',
      solutions: [
        { from: 'c4', to: 'd5' },
        { from: 'c4', to: 'e6' },
        { from: 'c4', to: 'f7' },
      ],
      hint: L('Diagonal to the king.', 'राजा तक तिरछा।', 'King tak diagonal banao.'),
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'checkmate',
    category: CONCEPT,
    icon: '👑',
    title: L('Checkmate', 'शह-मात', 'Checkmate'),
    intro: [
      {
        text: L(
          'Checkmate = check + no legal escape. Game over!',
          'मात = शह + कोई बचाव नहीं।',
          'Checkmate = check + koi legal escape nahi. Game khatam!'
        ),
        fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
        highlights: ['g8'],
      },
      {
        text: L(
          'Look for "back-rank" mates — a king trapped by his own pawns.',
          'Back-rank मात — राजा अपने प्यादों के पीछे फँसा।',
          'Back-rank mate — king apne pawns ke peeche phasa hota hai.'
        ),
        fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
        highlights: ['e1', 'g8'],
      },
    ],
    practice: [
      {
        task: L('Deliver back-rank mate — Re8#.', 'हाथी से e8 पर मात।', 'Rook ko e8 pe le jao — back-rank mate!'),
        fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
        solutions: [{ from: 'e1', to: 'e8' }],
        hint: L('Slide up the e-file.', 'e file पर ऊपर।', 'e-file pe up.'),
      },
    ],
    puzzle: {
      task: L(
        'Mate in 1 with the Queen!',
        '1 चाल में मात।',
        'Queen se 1-move checkmate!'
      ),
      fen: '6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1',
      solutions: [{ from: 'd1', to: 'd8' }],
      hint: L('Back rank again.', 'अंतिम पंक्ति।', 'Back rank again — d8!'),
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'castling',
    category: CONCEPT,
    icon: '🏰',
    title: L('Castling', 'कैसलिंग', 'Castling'),
    intro: [
      {
        text: L(
          'Castling moves the King 2 squares toward a Rook, and the Rook hops to the other side.',
          'राजा 2 खाने हाथी की तरफ़, हाथी कूदता है।',
          'King 2 squares Rook ki taraf jata hai, Rook doosri taraf jump karta hai.'
        ),
        fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
        highlights: ['e1', 'g1', 'h1'],
      },
      {
        text: L(
          'Castling keeps your King SAFE and brings the Rook into play. Do it early!',
          'राजा सुरक्षित + हाथी सक्रिय। जल्दी करो।',
          'King safe + Rook active. Jaldi castle karo.'
        ),
        fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
        highlights: [],
      },
    ],
    practice: [
      {
        task: L('Castle kingside — King e1 → g1.', 'किंगसाइड कैसल करो।', 'Kingside castle karo: King ko g1 pe le jao.'),
        fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
        solutions: [{ from: 'e1', to: 'g1' }],
        hint: L('Two squares right.', 'दो खाने दाएँ।', 'King ko 2 squares right — Rook khud aa jayega.'),
      },
      {
        task: L('Castle queenside — King e1 → c1.', 'क्वीनसाइड कैसल करो।', 'Queenside castle: King ko c1 pe lao.'),
        fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
        solutions: [{ from: 'e1', to: 'c1' }],
        hint: L('Two squares left.', 'दो खाने बाएँ।', 'King ko 2 squares left.'),
      },
    ],
    puzzle: {
      task: L(
        'Get the king to safety — castle short!',
        'जल्दी कैसल करो।',
        'Jaldi short castle karo — king ko safe karo!'
      ),
      fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5',
      solutions: [{ from: 'e1', to: 'g1' }],
      hint: L('Short castle = O-O.', 'O-O।', 'Short castle = O-O.'),
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'en-passant',
    category: CONCEPT,
    icon: '✨',
    title: L('En Passant', 'एन-पासां', 'En Passant'),
    intro: [
      {
        text: L(
          'En passant is a special pawn capture. If an enemy pawn moves 2 squares and lands next to yours, you can capture it as if it moved only 1.',
          'विशेष pawn कैप्चर — विरोधी प्यादा 2 चलकर बग़ल आया तो उसे ऐसे मारो जैसे 1 चला।',
          'Special pawn capture: enemy pawn 2 squares chalke aapke pawn ke baju mein aaya, toh aap aise capture karoge jaise 1 hi chala ho.'
        ),
        fen: '8/8/8/3pP3/8/8/8/8 w - d6 0 1',
        highlights: ['d5', 'd6', 'e5'],
      },
      {
        text: L(
          'You must do it IMMEDIATELY on the next move — otherwise the chance is lost.',
          'अगली ही चाल में करना ज़रूरी।',
          'Turant agli chaal mein karna hota hai — warna chance gaya.'
        ),
        fen: '8/8/8/3pP3/8/8/8/8 w - d6 0 1',
        highlights: ['d6'],
      },
    ],
    practice: [
      {
        task: L('Capture en passant: e5 takes d6.', 'e5 का प्यादा d6 पर मारो।', 'e5 pawn se d6 pe en passant karo.'),
        fen: '8/8/8/3pP3/8/8/8/8 w - d6 0 1',
        solutions: [{ from: 'e5', to: 'd6' }],
        hint: L('Diagonal capture on d6.', 'd6 पर तिरछा।', 'd6 pe diagonal capture.'),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'promotion',
    category: CONCEPT,
    icon: '👸',
    title: L('Promotion', 'प्रमोशन', 'Promotion'),
    intro: [
      {
        text: L(
          'When a pawn reaches the opposite end of the board, it promotes — usually to a Queen.',
          'अंतिम पंक्ति पर प्यादा रानी बन सकता है।',
          'Pawn jab opposite end pe pahuche, woh promote ho jata hai — usually Queen.'
        ),
        fen: '4P3/8/8/8/8/8/8/8 w - - 0 1',
        highlights: ['e8'],
      },
      {
        text: L(
          'You may also promote to a Rook, Bishop, or Knight (under-promotion).',
          'चाहे तो हाथी/ऊंट/घोड़ा भी बना सकते हो।',
          'Aap Rook, Bishop ya Knight bhi bana sakte ho — under-promotion.'
        ),
        fen: '4P3/8/8/8/8/8/8/8 w - - 0 1',
        highlights: [],
      },
    ],
    practice: [
      {
        task: L('Promote your pawn — push to e8.', 'प्यादा e8 पर ले जाओ।', 'Pawn ko e8 pe push karo.'),
        fen: '4k3/4P3/8/8/8/8/8/4K3 w - - 0 1',
        solutions: [{ from: 'e7', to: 'e8' }],
        hint: L('One step forward.', 'एक चाल आगे।', 'Ek square aage.'),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'piece-values',
    category: CONCEPT,
    icon: '💎',
    title: L('Piece Values', 'मोहरों की कीमत', 'Piece Values'),
    intro: [
      {
        text: L(
          'Pawn = 1, Knight = 3, Bishop = 3, Rook = 5, Queen = 9. The King is priceless.',
          'प्यादा=1, घोड़ा/ऊंट=3, हाथी=5, रानी=9। राजा अनमोल।',
          'Pawn=1, Knight=3, Bishop=3, Rook=5, Queen=9. King priceless.'
        ),
        fen: '8/8/8/8/8/8/8/8 w - - 0 1',
        highlights: [],
      },
      {
        text: L(
          'Trade smart — give a 3 to take a 5, never the other way around.',
          'समझदारी से व्यापार — 3 दो, 5 लो।',
          'Smart trade karo — 3 do, 5 lo. Ulta mat karo.'
        ),
        fen: '8/8/8/3r4/8/3Q4/8/8 w - - 0 1',
        highlights: ['d3', 'd5'],
      },
    ],
    practice: [
      {
        task: L('Capture the rook with your Queen — winning material!', 'रानी से हाथी मारो — फ़ायदा!', 'Queen se rook capture karo — material win!'),
        fen: '8/8/8/3r4/8/3Q4/8/8 w - - 0 1',
        solutions: [{ from: 'd3', to: 'd5' }],
        hint: L('Same file.', 'एक ही file।', 'Same file pe.'),
      },
    ],
    puzzle: {
      task: L(
        'Win the queen for free!',
        'मुफ़्त में रानी जीतो।',
        'Queen ko free mein jeeto!'
      ),
      fen: '4k3/8/4q3/8/8/8/4R3/4K3 w - - 0 1',
      solutions: [{ from: 'e2', to: 'e6' }],
      hint: L('Rook captures down the file.', 'हाथी file से मारो।', 'Rook file pe slide karke capture.'),
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'basic-tactics',
    category: CONCEPT,
    icon: '🧠',
    title: L('Basic Tactics', 'बुनियादी चाल', 'Basic Tactics'),
    intro: [
      {
        text: L(
          'FORK — one piece attacks TWO at once. Knights are masters of this.',
          'फोर्क — एक से दो पर हमला। घोड़ा सबसे अच्छा।',
          'Fork — ek piece se 2 enemy pe attack. Knight master hota hai.'
        ),
        fen: '4k3/8/8/3N4/8/4r3/8/4K3 w - - 0 1',
        highlights: ['d5'],
      },
      {
        text: L(
          'PIN — freezing a piece because moving it exposes the King or a bigger piece.',
          'पिन — मोहरा हट नहीं सकता, पीछे राजा है।',
          'Pin — piece hat nahi sakti kyunki peeche King ya bada piece hai.'
        ),
        fen: '6k1/8/4r3/8/8/1B6/8/4K3 w - - 0 1',
        highlights: ['b3', 'e6', 'g8'],
      },
      {
        text: L(
          'SKEWER — like a pin, but the bigger piece is in front.',
          'स्क्यूअर — पिन का उल्टा।',
          'Skewer — pin ka ulta. Bada piece aage hota hai.'
        ),
        fen: '8/8/8/8/8/B7/8/k6Q w - - 0 1',
        highlights: [],
      },
    ],
    practice: [
      {
        task: L('Fork the King and Rook with the Knight!', 'घोड़े से फोर्क करो।', 'Knight se King + Rook fork karo!'),
        fen: 'r1k5/8/8/3N4/8/8/8/4K3 w - - 0 1',
        solutions: [{ from: 'd5', to: 'b6' }],
        hint: L('Land between them.', 'दोनों के बीच।', 'Dono pieces ke beech land karo.'),
      },
      {
        task: L('Pin the rook with your Bishop.', 'ऊंट से हाथी को पिन करो।', 'Bishop se rook ko pin karo.'),
        fen: '6k1/8/4r3/8/8/1B6/8/4K3 w - - 0 1',
        solutions: [{ from: 'b3', to: 'c4' }],
        hint: L('Aim through rook to king.', 'हाथी और राजा एक रेखा पर।', 'Diagonal: rook + king ek line pe.'),
      },
    ],
    puzzle: {
      task: L(
        'Find the deadly knight fork!',
        'घोड़े का फोर्क ढूँढो।',
        'Knight ka killer fork dhundo!'
      ),
      fen: '4k3/8/8/3N4/6r1/8/8/4K3 w - - 0 1',
      solutions: [{ from: 'd5', to: 'f6' }],
      hint: L('f6 attacks both King and Rook.', 'f6 पर कूदो।', 'f6 pe jump — King aur Rook dono attack.'),
    },
  },
];

export default LESSONS;
