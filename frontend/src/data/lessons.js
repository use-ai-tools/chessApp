// Learn Mode Lessons — Rebuilt for beginners
// Order: Board → Pawn → Rook → Bishop → Queen → Knight → King → Capture → Check → Checkmate → Castling

const LESSONS = [
  {
    id: 'board-basics',
    title: { en: 'The Chessboard', hi: 'शतरंज का बोर्ड', hg: 'Chess Board' },
    icon: '♟',
    steps: [
      {
        text: { en: 'Chess is played on an 8×8 board with 64 squares.', hi: '8×8 बोर्ड पर 64 खानों में खेला जाता है।', hg: '8×8 board pe 64 squares hote hain.' },
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', highlights: [],
      },
      {
        text: { en: 'Each player gets 16 pieces. White always moves first.', hi: 'हर खिलाड़ी को 16 मोहरे मिलते हैं। सफ़ेद पहले चलता है।', hg: 'Har player ko 16 pieces milte hain. White pehle chalta hai.' },
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', highlights: [],
      },
      {
        text: { en: 'The goal is to checkmate the opponent\'s King — trap it so it can\'t escape!', hi: 'लक्ष्य है प्रतिद्वंदी के राजा को शह-मात देना!', hg: 'Goal hai opponent ke King ko checkmate karna!' },
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', highlights: ['e1', 'e8'],
      },
    ],
    challenge: {
      text: { en: 'Move the pawn to e4 to control the center.', hi: 'प्यादे को e4 पर चलाओ।', hg: 'Pawn ko e4 pe chalao.' },
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: { from: 'e2', to: 'e4' }, hints: ['e2', 'e4'],
    }
  },
  {
    id: 'pawn',
    title: { en: 'The Pawn', hi: 'प्यादा', hg: 'Pawn' },
    icon: '♙',
    steps: [
      {
        text: { en: 'Pawns move forward 1 square. From the start, they can move 2 squares.', hi: 'प्यादा 1 खाना आगे चलता है। शुरू से 2 खाने चल सकता है।', hg: 'Pawn 1 square aage chalta hai. Start se 2 squares chal sakta hai.' },
        fen: '8/8/8/8/8/8/4P3/8 w - - 0 1', highlights: ['e3', 'e4'],
      },
      {
        text: { en: 'Pawns capture diagonally — one square forward-left or forward-right.', hi: 'प्यादा तिरछे मारता है।', hg: 'Pawn diagonally capture karta hai.' },
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
    id: 'rook',
    title: { en: 'The Rook', hi: 'हाथी', hg: 'Rook' },
    icon: '♖',
    steps: [
      {
        text: { en: 'The Rook moves in straight lines — any number of squares up, down, left, or right.', hi: 'हाथी सीधी लाइन में चलता है।', hg: 'Rook straight lines mein chalta hai — up, down, left, right.' },
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
        text: { en: 'The Bishop moves diagonally — any number of squares. It always stays on its starting color.', hi: 'ऊंट तिरछा चलता है। वह हमेशा अपने रंग पर रहता है।', hg: 'Bishop diagonal chalta hai. Apne color pe hi rehta hai.' },
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
        text: { en: 'The Queen is the most powerful piece. She moves straight AND diagonal — like a Rook + Bishop combined.', hi: 'रानी सबसे ताकतवर है। हाथी + ऊंट दोनों की तरह चलती है।', hg: 'Queen sabse powerful hai. Rook + Bishop dono ki tarah chalti hai.' },
        fen: '8/8/8/8/3Q4/8/8/8 w - - 0 1', highlights: [],
      },
    ],
    challenge: {
      text: { en: 'The Queen moves straight and diagonal. Capture the rook.', hi: 'रानी से हाथी को मारो।', hg: 'Queen se rook capture karo.' },
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
        text: { en: 'The Knight moves in an L-shape: 2 squares one way, then 1 square sideways. It can jump over other pieces!', hi: 'घोड़ा L-शेप में चलता है: 2 खाने + 1 खाना। यह कूद सकता है!', hg: 'Knight L-shape mein chalta hai: 2+1. Pieces ke upar se kood sakta hai!' },
        fen: '8/8/8/8/3N4/8/8/8 w - - 0 1', highlights: ['b3','b5','c2','c6','e2','e6','f3','f5'],
      },
    ],
    challenge: {
      text: { en: 'Jump the Knight to capture the pawn.', hi: 'घोड़े को कूदा कर प्यादे को मारो।', hg: 'Knight se kood ke pawn capture karo.' },
      fen: '8/8/4p3/8/3N4/8/8/8 w - - 0 1',
      solution: { from: 'd4', to: 'e6' }, hints: ['d4', 'e6'],
    }
  },
  {
    id: 'king',
    title: { en: 'The King', hi: 'राजा', hg: 'King' },
    icon: '♔',
    steps: [
      {
        text: { en: 'The King moves 1 square in any direction. He can never move into danger (check).', hi: 'राजा किसी भी दिशा में 1 खाना चलता है। खतरे में नहीं जा सकता।', hg: 'King 1 square any direction. Danger mein nahi ja sakta.' },
        fen: '8/8/8/8/3K4/8/8/8 w - - 0 1', highlights: ['c3','c4','c5','d3','d5','e3','e4','e5'],
      },
    ],
    challenge: {
      text: { en: 'Move the King to capture the pawn.', hi: 'राजा से प्यादे को मारो।', hg: 'King se pawn capture karo.' },
      fen: '8/8/8/8/3K4/4p3/8/8 w - - 0 1',
      solution: { from: 'd4', to: 'e3' }, hints: ['d4', 'e3'],
    }
  },
  {
    id: 'check',
    title: { en: 'Check & Checkmate', hi: 'शह और मात', hg: 'Check & Checkmate' },
    icon: '⚡',
    steps: [
      {
        text: { en: 'Check = the King is under attack. You MUST get out of check.', hi: 'शह = राजा पर हमला। शह से बचना ज़रूरी है।', hg: 'Check = King pe attack. Check se bachna zaroori hai.' },
        fen: '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1', highlights: ['e8'],
      },
      {
        text: { en: 'Checkmate = the King is in check and cannot escape. Game over!', hi: 'शह-मात = राजा फँसा, भाग नहीं सकता। खेल खत्म!', hg: 'Checkmate = King check mein hai aur bach nahi sakta. Game over!' },
        fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1', highlights: ['g8', 'e1'],
      },
    ],
    challenge: {
      text: { en: 'Deliver checkmate! Move the Rook to e8.', hi: 'शह-मात दो! हाथी को e8 पर ले जाओ।', hg: 'Checkmate do! Rook ko e8 pe le jao.' },
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
        text: { en: 'Castling moves the King 2 squares toward a Rook, and the Rook jumps over. Keeps your King safe!', hi: 'कैसलिंग में राजा 2 खाने हाथी की ओर चलता है, हाथी कूदता है।', hg: 'Castling mein King 2 squares Rook ki taraf, Rook kood ke aata hai.' },
        fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', highlights: ['e1','g1'],
      },
    ],
    challenge: {
      text: { en: 'Castle kingside — move King to g1.', hi: 'किंगसाइड कैसल करो — राजा को g1 पर।', hg: 'Kingside castle karo — King ko g1 pe.' },
      fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
      solution: { from: 'e1', to: 'g1' }, hints: ['e1', 'g1'],
    }
  },
  {
    id: 'tactics',
    title: { en: 'Basic Tactics', hi: 'बुनियादी चालें', hg: 'Basic Tactics' },
    icon: '🧠',
    steps: [
      {
        text: { en: 'Fork = one piece attacks TWO enemy pieces at once. Knights are great at this!', hi: 'फोर्क = एक मोहरा दो दुश्मन मोहरों पर हमला करता है।', hg: 'Fork = ek piece do enemies pe ek saath attack karta hai.' },
        fen: '4k3/8/4r3/8/3N4/8/8/4K3 w - - 0 1', highlights: ['d4','c6','e6'],
      },
    ],
    challenge: {
      text: { en: 'Fork the King and Rook with the Knight!', hi: 'घोड़े से राजा और हाथी पर फोर्क करो!', hg: 'Knight se King aur Rook pe fork karo!' },
      fen: '4k3/8/4r3/8/8/5N2/8/4K3 w - - 0 1',
      solution: { from: 'f3', to: 'd4' }, hints: ['f3', 'd4'],
    }
  },
];

export default LESSONS;
