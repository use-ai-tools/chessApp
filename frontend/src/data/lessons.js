// Learn Mode Lessons — proper beginner course order.
// Order: Board basics → King → Rook → Bishop → Queen → Knight → Pawn → Check → Checkmate → Castling → Tactics

const LESSONS = [
  {
    id: 'board-basics',
    title: { en: 'The Chessboard', hi: 'शतरंज का बोर्ड', hg: 'Chess Board' },
    icon: '♟',
    steps: [
      {
        text: { en: 'Chess is played on an 8×8 board (64 squares). Files = columns (a-h). Ranks = rows (1-8).', hi: '8×8 बोर्ड पर 64 खाने। File = column, Rank = row।', hg: '8x8 board pe 64 squares. Files = columns, Ranks = rows.' },
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', highlights: [],
      },
      {
        text: { en: 'Each player has 16 pieces. White always moves first.', hi: 'हर खिलाड़ी के 16 मोहरे। सफ़ेद पहले चलता है।', hg: 'Har player ke 16 pieces. White pehle chalta hai.' },
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', highlights: [],
      },
      {
        text: { en: 'The goal: checkmate the opponent\'s King — trap it so it can\'t escape.', hi: 'लक्ष्य: विरोधी राजा को शह-मात देना।', hg: 'Goal: opponent King ko checkmate karna.' },
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', highlights: ['e1', 'e8'],
      },
    ],
    challenge: {
      text: { en: 'Move the e-pawn two squares to e4 to control the center.', hi: 'e2 के प्यादे को e4 पर ले जाओ।', hg: 'e2 pawn ko e4 pe chalao.' },
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: { from: 'e2', to: 'e4' }, hints: ['e2', 'e4'],
    }
  },
  {
    id: 'king',
    title: { en: 'The King', hi: 'राजा', hg: 'King' },
    icon: '♔',
    steps: [
      {
        text: { en: 'The King moves 1 square in any direction. He can never move into attack.', hi: 'राजा किसी भी दिशा में 1 खाना चलता है। खतरे में नहीं जा सकता।', hg: 'King 1 square any direction. Danger mein nahi ja sakta.' },
        fen: '8/8/8/8/3K4/8/8/8 w - - 0 1', highlights: ['c3','c4','c5','d3','d5','e3','e4','e5'],
      },
    ],
    challenge: {
      text: { en: 'Move the King to capture the pawn diagonally.', hi: 'राजा से प्यादे को मारो।', hg: 'King se pawn capture karo.' },
      fen: '8/8/8/8/3K4/4p3/8/8 w - - 0 1',
      solution: { from: 'd4', to: 'e3' }, hints: ['d4', 'e3'],
    }
  },
  {
    id: 'rook',
    title: { en: 'The Rook', hi: 'हाथी', hg: 'Rook' },
    icon: '♖',
    steps: [
      {
        text: { en: 'The Rook moves in straight lines — up, down, left or right — any number of squares.', hi: 'हाथी सीधी लाइन में चलता है।', hg: 'Rook straight lines mein chalta hai.' },
        fen: '8/8/8/8/3R4/8/8/8 w - - 0 1', highlights: ['d1','d2','d3','d5','d6','d7','d8','a4','b4','c4','e4','f4','g4','h4'],
      },
    ],
    challenge: {
      text: { en: 'Move the Rook to capture the pawn.', hi: 'हाथी से प्यादे को मारो।', hg: 'Rook se pawn capture karo.' },
      fen: '8/8/8/8/3R2p1/8/8/8 w - - 0 1',
      solution: { from: 'd4', to: 'g4' }, hints: ['d4', 'g4'],
    }
  },
  {
    id: 'bishop',
    title: { en: 'The Bishop', hi: 'ऊंट', hg: 'Bishop' },
    icon: '♗',
    steps: [
      {
        text: { en: 'The Bishop moves diagonally any number of squares. It always stays on its starting color.', hi: 'ऊंट तिरछा चलता है, हमेशा अपने रंग पर।', hg: 'Bishop diagonal chalta hai, apne color pe rehta hai.' },
        fen: '8/8/8/8/3B4/8/8/8 w - - 0 1', highlights: ['a1','b2','c3','e5','f6','g7','h8','a7','b6','c5','e3','f2','g1'],
      },
    ],
    challenge: {
      text: { en: 'Capture the pawn with your Bishop.', hi: 'ऊंट से प्यादे को मारो।', hg: 'Bishop se pawn capture karo.' },
      fen: '8/8/5p2/8/3B4/8/8/8 w - - 0 1',
      solution: { from: 'd4', to: 'f6' }, hints: ['d4', 'f6'],
    }
  },
  {
    id: 'queen',
    title: { en: 'The Queen', hi: 'रानी', hg: 'Queen' },
    icon: '♕',
    steps: [
      {
        text: { en: 'The Queen is the most powerful piece — she moves like Rook + Bishop combined.', hi: 'रानी सबसे ताकतवर — हाथी + ऊंट दोनों की तरह चलती है।', hg: 'Queen sabse powerful — Rook + Bishop dono ki tarah.' },
        fen: '8/8/8/8/3Q4/8/8/8 w - - 0 1', highlights: [],
      },
    ],
    challenge: {
      text: { en: 'Capture the rook with your Queen.', hi: 'रानी से हाथी को मारो।', hg: 'Queen se rook capture karo.' },
      fen: '8/8/8/6r1/3Q4/8/8/8 w - - 0 1',
      solution: { from: 'd4', to: 'g7' }, hints: ['d4', 'g7'],
    }
  },
  {
    id: 'knight',
    title: { en: 'The Knight', hi: 'घोड़ा', hg: 'Knight' },
    icon: '♘',
    steps: [
      {
        text: { en: 'The Knight moves in an L-shape: 2 squares one way, then 1 sideways. It can jump over pieces!', hi: 'घोड़ा L-शेप में चलता है — मोहरों पर कूद सकता है।', hg: 'Knight L-shape mein chalta hai aur kood sakta hai.' },
        fen: '8/8/8/8/3N4/8/8/8 w - - 0 1', highlights: ['b3','b5','c2','c6','e2','e6','f3','f5'],
      },
    ],
    challenge: {
      text: { en: 'Jump the Knight to capture the pawn.', hi: 'घोड़े से प्यादे को मारो।', hg: 'Knight se pawn capture karo.' },
      fen: '8/8/4p3/8/3N4/8/8/8 w - - 0 1',
      solution: { from: 'd4', to: 'e6' }, hints: ['d4', 'e6'],
    }
  },
  {
    id: 'pawn',
    title: { en: 'The Pawn', hi: 'प्यादा', hg: 'Pawn' },
    icon: '♙',
    steps: [
      {
        text: { en: 'Pawns move forward 1 square. From their starting square they may move 2.', hi: 'प्यादा 1 आगे चलता है। शुरू से 2 चल सकता है।', hg: 'Pawn 1 aage chalta hai. Start se 2 chal sakta hai.' },
        fen: '8/8/8/8/8/8/4P3/8 w - - 0 1', highlights: ['e3', 'e4'],
      },
      {
        text: { en: 'Pawns capture diagonally — one square forward-left or forward-right.', hi: 'प्यादा तिरछे मारता है।', hg: 'Pawn diagonal capture karta hai.' },
        fen: '8/8/8/3p1p2/4P3/8/8/8 w - - 0 1', highlights: ['d5', 'f5'],
      },
    ],
    challenge: {
      text: { en: 'Capture the black pawn diagonally.', hi: 'काले प्यादे को तिरछे मारो।', hg: 'Black pawn ko diagonally capture karo.' },
      fen: '8/8/8/3p4/4P3/8/8/8 w - - 0 1',
      solution: { from: 'e4', to: 'd5' }, hints: ['e4', 'd5'],
    }
  },
  {
    id: 'check',
    title: { en: 'Check', hi: 'शह', hg: 'Check' },
    icon: '⚡',
    steps: [
      {
        text: { en: 'Check = the King is under attack. You MUST get out of check on your next move.', hi: 'शह = राजा पर हमला। तुरंत बचना होगा।', hg: 'Check = King pe attack. Turant bachna padega.' },
        fen: '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1', highlights: ['e8'],
      },
    ],
    challenge: {
      text: { en: 'Put the King in check with your Rook.', hi: 'हाथी से राजा को शह दो।', hg: 'Rook se King ko check do.' },
      fen: '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1',
      solution: { from: 'e2', to: 'e7' }, hints: ['e2', 'e7'],
    }
  },
  {
    id: 'checkmate',
    title: { en: 'Checkmate', hi: 'शह-मात', hg: 'Checkmate' },
    icon: '👑',
    steps: [
      {
        text: { en: 'Checkmate = the King is in check and has NO legal way out. Game over!', hi: 'शह-मात = राजा फँसा, कोई रास्ता नहीं।', hg: 'Checkmate = King phasa, koi rasta nahi.' },
        fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1', highlights: ['g8', 'e1'],
      },
    ],
    challenge: {
      text: { en: 'Deliver back-rank mate — move the Rook to e8.', hi: 'हाथी को e8 पर ले जाकर मात दो।', hg: 'Rook ko e8 pe le jao — back-rank mate.' },
      fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
      solution: { from: 'e1', to: 'e8' }, hints: ['e1', 'e8'],
    }
  },
  {
    id: 'castling',
    title: { en: 'Castling', hi: 'कैसलिंग', hg: 'Castling' },
    icon: '🏰',
    steps: [
      {
        text: { en: 'Castling moves the King 2 squares toward a Rook, and the Rook jumps to the other side. Keeps your King safe.', hi: 'कैसलिंग = राजा 2 खाने हाथी की ओर, हाथी कूदता है।', hg: 'Castling = King 2 squares Rook ki taraf, Rook kood ke aata hai.' },
        fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', highlights: ['e1', 'g1'],
      },
    ],
    challenge: {
      text: { en: 'Castle kingside — move the King to g1.', hi: 'किंगसाइड कैसल करो।', hg: 'Kingside castle karo.' },
      fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
      solution: { from: 'e1', to: 'g1' }, hints: ['e1', 'g1'],
    }
  },
  {
    id: 'piece-value',
    title: { en: 'Piece Values', hi: 'मोहरों की कीमत', hg: 'Piece Values' },
    icon: '💎',
    steps: [
      {
        text: { en: 'Pawn=1, Knight=3, Bishop=3, Rook=5, Queen=9. The King is priceless. Trade smart!', hi: 'प्यादा=1, घोड़ा/ऊंट=3, हाथी=5, रानी=9। राजा अनमोल।', hg: 'Pawn=1, Knight/Bishop=3, Rook=5, Queen=9. King priceless.' },
        fen: '8/8/2qrbn2/8/8/2QRBN2/8/8 w - - 0 1', highlights: [],
      },
    ],
    challenge: {
      text: { en: 'Use the Queen to capture the rook — winning material.', hi: 'रानी से हाथी को मारो — सामग्री जीतो।', hg: 'Queen se rook capture karo — material win.' },
      fen: '8/8/8/3r4/8/3Q4/8/8 w - - 0 1',
      solution: { from: 'd3', to: 'd5' }, hints: ['d3', 'd5'],
    }
  },
  {
    id: 'fork',
    title: { en: 'Fork Tactic', hi: 'फोर्क', hg: 'Fork' },
    icon: '🍴',
    steps: [
      {
        text: { en: 'A Fork attacks TWO pieces at once. Knights make brilliant forks.', hi: 'फोर्क = एक मोहरा दो पर हमला। घोड़ा सबसे अच्छा।', hg: 'Fork = ek piece do pe attack. Knight best fork karta hai.' },
        fen: '4k3/8/4r3/8/3N4/8/8/4K3 w - - 0 1', highlights: ['d4', 'c6', 'e6'],
      },
    ],
    challenge: {
      text: { en: 'Fork the King and Rook with your Knight!', hi: 'घोड़े से राजा और हाथी पर फोर्क करो!', hg: 'Knight se King aur Rook pe fork karo!' },
      fen: 'r1k5/8/8/3N4/8/8/8/4K3 w - - 0 1',
      solution: { from: 'd5', to: 'b6' }, hints: ['d5', 'b6'],
    }
  },
  {
    id: 'pin',
    title: { en: 'Pin Tactic', hi: 'पिन', hg: 'Pin' },
    icon: '📌',
    steps: [
      {
        text: { en: 'A Pin freezes a piece because moving it would expose the King or a more valuable piece.', hi: 'पिन = मोहरा हट नहीं सकता क्योंकि पीछे राजा/बड़ा मोहरा है।', hg: 'Pin = piece hat nahi sakti kyunki peeche King ya bada piece hai.' },
        fen: '4k3/8/4r3/8/8/8/4R3/4K3 w - - 0 1', highlights: ['e2', 'e6', 'e8'],
      },
    ],
    challenge: {
      text: { en: 'Pin the rook against the King with your Bishop.', hi: 'ऊंट से हाथी को राजा के सामने पिन करो।', hg: 'Bishop se rook ko King ke against pin karo.' },
      fen: '6k1/8/4r3/8/8/1B6/8/4K3 w - - 0 1',
      solution: { from: 'b3', to: 'c4' }, hints: ['b3', 'c4'],
    }
  },
  {
    id: 'back-rank',
    title: { en: 'Back-Rank Mate', hi: 'अंतिम पंक्ति मात', hg: 'Back-Rank Mate' },
    icon: '🎯',
    steps: [
      {
        text: { en: 'A King trapped behind its own pawns can be mated on the back rank by a Rook or Queen.', hi: 'राजा अपने प्यादों के पीछे फँसा है — पीछे की पंक्ति से मात।', hg: 'King apne pawns ke peeche phasa hai — back-rank mate.' },
        fen: '6k1/5ppp/8/8/8/8/8/R6K w - - 0 1', highlights: ['a1', 'g8'],
      },
    ],
    challenge: {
      text: { en: 'Deliver back-rank mate — Rook to a8!', hi: 'हाथी a8 पर — मात!', hg: 'Rook ko a8 pe le jao — mate!' },
      fen: '6k1/5ppp/8/8/8/8/8/R6K w - - 0 1',
      solution: { from: 'a1', to: 'a8' }, hints: ['a1', 'a8'],
    }
  },
];

export default LESSONS;
