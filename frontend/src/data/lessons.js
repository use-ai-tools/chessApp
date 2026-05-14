// Chess Learn Mode — Interactive Lesson Data
// Supports: English, Hindi, Hinglish

const LESSONS = [
  {
    id: 'board-basics',
    title: { en: 'The Chessboard', hi: 'शतरंज का बोर्ड', hg: 'Chess ka Board' },
    icon: '♟',
    steps: [
      {
        type: 'info',
        text: {
          en: 'Chess is played on an 8×8 board with 64 squares. White always moves first!',
          hi: 'शतरंज 8×8 बोर्ड पर खेला जाता है जिसमें 64 खाने होते हैं। सफ़ेद हमेशा पहले चलता है!',
          hg: 'Chess 8×8 board pe khela jata hai jisme 64 squares hote hain. White hamesha pehle chalta hai!'
        },
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        highlights: [],
      },
      {
        type: 'info',
        text: {
          en: 'Each square has a coordinate — column (a-h) + row (1-8). For example, e4 is the center!',
          hi: 'हर खाने का एक नाम होता है — कॉलम (a-h) + रो (1-8)। जैसे e4 केंद्र है!',
          hg: 'Har square ka ek coordinate hota hai — column (a-h) + row (1-8). Jaise e4 center hai!'
        },
        fen: '8/8/8/8/4P3/8/8/8 w - - 0 1',
        highlights: ['e4'],
      },
      {
        type: 'info',
        text: {
          en: 'The goal? Checkmate the opponent\'s King — trap it so it can\'t escape!',
          hi: 'लक्ष्य? प्रतिद्वंदी के राजा को शह-मात दो — उसे फँसाओ!',
          hg: 'Goal? Opponent ke King ko checkmate karo — usse fasao taaki woh bach na sake!'
        },
        fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
        highlights: ['g8'],
      },
    ],
    challenge: {
      text: {
        en: 'Move the white pawn to e4 (center control)!',
        hi: 'सफ़ेद प्यादे को e4 पर चलाओ!',
        hg: 'White pawn ko e4 pe chalao!'
      },
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: { from: 'e2', to: 'e4' },
      hints: ['e2'],
    }
  },
  {
    id: 'pawn',
    title: { en: 'The Pawn', hi: 'प्यादा (Pawn)', hg: 'Pawn (Pyaada)' },
    icon: '♙',
    steps: [
      {
        type: 'info',
        text: {
          en: 'Pawns move forward 1 square. From their starting position, they can move 2 squares!',
          hi: 'प्यादा आगे 1 खाना चलता है। शुरुआती स्थिति से 2 खाने चल सकता है!',
          hg: 'Pawn aage 1 square chalta hai. Starting position se 2 squares chal sakta hai!'
        },
        fen: '8/8/8/8/8/8/4P3/8 w - - 0 1',
        highlights: ['e2', 'e3', 'e4'],
      },
      {
        type: 'info',
        text: {
          en: 'Pawns capture diagonally! They can\'t capture straight ahead.',
          hi: 'प्यादा तिरछे मारता है! सीधे आगे नहीं मार सकता।',
          hg: 'Pawn diagonally capture karta hai! Seedha aage capture nahi kar sakta.'
        },
        fen: '8/8/8/3p1p2/4P3/8/8/8 w - - 0 1',
        highlights: ['d5', 'f5'],
      },
      {
        type: 'info',
        text: {
          en: 'When a pawn reaches the last row, it promotes to a Queen, Rook, Bishop, or Knight!',
          hi: 'जब प्यादा आखिरी पंक्ति पर पहुँचता है, तो वह रानी, हाथी, ऊंट या घोड़ा बन सकता है!',
          hg: 'Jab pawn last row pe pahunchta hai, toh woh Queen, Rook, Bishop ya Knight ban sakta hai!'
        },
        fen: '8/4P3/8/8/8/8/8/4K3 w - - 0 1',
        highlights: ['e7'],
      },
    ],
    challenge: {
      text: {
        en: 'Capture the black pawn with your pawn!',
        hi: 'अपने प्यादे से काले प्यादे को मारो!',
        hg: 'Apne pawn se black pawn ko capture karo!'
      },
      fen: '8/8/8/3p4/4P3/8/8/8 w - - 0 1',
      solution: { from: 'e4', to: 'd5' },
      hints: ['e4', 'd5'],
    }
  },
  {
    id: 'rook',
    title: { en: 'The Rook', hi: 'हाथी (Rook)', hg: 'Rook (Haathi)' },
    icon: '♖',
    steps: [
      {
        type: 'info',
        text: {
          en: 'The Rook moves in straight lines — any number of squares horizontally or vertically!',
          hi: 'हाथी सीधी लाइन में चलता है — किसी भी दिशा में कितने भी खाने!',
          hg: 'Rook straight lines mein chalta hai — horizontal ya vertical, kitne bhi squares!'
        },
        fen: '8/8/8/8/3R4/8/8/8 w - - 0 1',
        highlights: ['d1','d2','d3','d5','d6','d7','d8','a4','b4','c4','e4','f4','g4','h4'],
      },
    ],
    challenge: {
      text: { en: 'Move the Rook to capture the black pawn!', hi: 'हाथी से काले प्यादे को मारो!', hg: 'Rook se black pawn ko capture karo!' },
      fen: '8/8/8/8/3R2p1/8/8/8 w - - 0 1',
      solution: { from: 'd4', to: 'g4' },
      hints: ['d4'],
    }
  },
  {
    id: 'bishop',
    title: { en: 'The Bishop', hi: 'ऊंट (Bishop)', hg: 'Bishop (Oont)' },
    icon: '♗',
    steps: [
      {
        type: 'info',
        text: {
          en: 'The Bishop moves diagonally — any number of squares. It stays on its color!',
          hi: 'ऊंट तिरछा चलता है — कितने भी खाने। वह अपने रंग पर ही रहता है!',
          hg: 'Bishop diagonally chalta hai — kitne bhi squares. Woh apne color pe hi rehta hai!'
        },
        fen: '8/8/8/8/3B4/8/8/8 w - - 0 1',
        highlights: ['a1','b2','c3','e5','f6','g7','h8','a7','b6','c5','e3','f2','g1'],
      },
    ],
    challenge: {
      text: { en: 'Capture the black pawn with the Bishop!', hi: 'ऊंट से काले प्यादे को मारो!', hg: 'Bishop se black pawn capture karo!' },
      fen: '8/8/5p2/8/3B4/8/8/8 w - - 0 1',
      solution: { from: 'd4', to: 'f6' },
      hints: ['d4'],
    }
  },
  {
    id: 'knight',
    title: { en: 'The Knight', hi: 'घोड़ा (Knight)', hg: 'Knight (Ghoda)' },
    icon: '♘',
    steps: [
      {
        type: 'info',
        text: {
          en: 'The Knight moves in an "L" shape — 2 squares + 1 square turn. It can jump over pieces!',
          hi: 'घोड़ा "L" आकार में चलता है — 2 खाने + 1 खाना मोड़। यह दूसरों को कूद सकता है!',
          hg: 'Knight "L" shape mein chalta hai — 2 squares + 1 square turn. Yeh pieces ke upar se kood sakta hai!'
        },
        fen: '8/8/8/8/3N4/8/8/8 w - - 0 1',
        highlights: ['b3','b5','c2','c6','e2','e6','f3','f5'],
      },
    ],
    challenge: {
      text: { en: 'Jump the Knight to capture the pawn!', hi: 'घोड़े से प्यादे को मारो!', hg: 'Knight se pawn ko capture karo!' },
      fen: '8/8/4p3/8/3N4/8/8/8 w - - 0 1',
      solution: { from: 'd4', to: 'e6' },
      hints: ['d4'],
    }
  },
  {
    id: 'queen',
    title: { en: 'The Queen', hi: 'रानी (Queen)', hg: 'Queen (Raani)' },
    icon: '♕',
    steps: [
      {
        type: 'info',
        text: {
          en: 'The Queen is the most powerful piece! She moves like a Rook + Bishop combined — straight and diagonal!',
          hi: 'रानी सबसे ताकतवर मोहरा है! वह हाथी + ऊंट दोनों की तरह चलती है!',
          hg: 'Queen sabse powerful piece hai! Woh Rook + Bishop dono ki tarah chalti hai — straight aur diagonal!'
        },
        fen: '8/8/8/8/3Q4/8/8/8 w - - 0 1',
        highlights: [],
      },
    ],
    challenge: {
      text: { en: 'Use the Queen to capture the undefended Rook!', hi: 'रानी से बेसहारा हाथी को मारो!', hg: 'Queen se undefended Rook ko capture karo!' },
      fen: '8/8/8/6r1/3Q4/8/8/8 w - - 0 1',
      solution: { from: 'd4', to: 'g7' },
      hints: ['d4'],
    }
  },
  {
    id: 'king',
    title: { en: 'The King', hi: 'राजा (King)', hg: 'King (Raja)' },
    icon: '♔',
    steps: [
      {
        type: 'info',
        text: {
          en: 'The King moves 1 square in any direction. It can NEVER move into check!',
          hi: 'राजा किसी भी दिशा में 1 खाना चलता है। वह कभी शह में नहीं जा सकता!',
          hg: 'King kisi bhi direction mein 1 square chalta hai. Woh kabhi check mein nahi ja sakta!'
        },
        fen: '8/8/8/8/3K4/8/8/8 w - - 0 1',
        highlights: ['c3','c4','c5','d3','d5','e3','e4','e5'],
      },
      {
        type: 'info',
        text: {
          en: 'Check = King is attacked. Checkmate = King is attacked and can\'t escape. Game over!',
          hi: 'शह = राजा पर हमला। शह-मात = राजा फँस गया, भाग नहीं सकता। खेल खत्म!',
          hg: 'Check = King pe attack. Checkmate = King attack mein hai aur bach nahi sakta. Game over!'
        },
        fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
        highlights: ['g8'],
      },
    ],
    challenge: {
      text: { en: 'Deliver checkmate with the Rook!', hi: 'हाथी से शह-मात दो!', hg: 'Rook se checkmate do!' },
      fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
      solution: { from: 'e1', to: 'e8' },
      hints: ['e1'],
    }
  },
  {
    id: 'castling',
    title: { en: 'Castling', hi: 'कैसलिंग', hg: 'Castling' },
    icon: '🏰',
    steps: [
      {
        type: 'info',
        text: {
          en: 'Castling is a special King+Rook move. Move King 2 squares toward a Rook, and the Rook jumps over! Great for King safety.',
          hi: 'कैसलिंग राजा+हाथी की विशेष चाल है। राजा 2 खाने हाथी की ओर चलता है, हाथी कूदकर दूसरी तरफ आ जाता है!',
          hg: 'Castling King+Rook ki special move hai. King 2 squares Rook ki taraf chalta hai, Rook kood ke dusri side aa jata hai!'
        },
        fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
        highlights: ['e1','g1','c1'],
      },
    ],
    challenge: {
      text: { en: 'Castle kingside! Move the King to g1.', hi: 'किंगसाइड कैसल करो! राजा को g1 पर ले जाओ।', hg: 'Kingside castle karo! King ko g1 pe le jao.' },
      fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
      solution: { from: 'e1', to: 'g1' },
      hints: ['e1','g1'],
    }
  },
  {
    id: 'opening-principles',
    title: { en: 'Opening Basics', hi: 'शुरुआत के नियम', hg: 'Opening ke Basics' },
    icon: '📖',
    steps: [
      {
        type: 'info',
        text: {
          en: '1. Control the center (e4, d4, e5, d5)\n2. Develop your pieces early\n3. Castle to protect your King!',
          hi: '1. केंद्र पर कब्जा करो (e4, d4)\n2. अपने मोहरे जल्दी निकालो\n3. राजा को कैसल करके सुरक्षित करो!',
          hg: '1. Center control karo (e4, d4)\n2. Pieces jaldi develop karo\n3. King ko castle karke safe karo!'
        },
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        highlights: ['e4','d4','e5','d5'],
      },
    ],
    challenge: {
      text: { en: 'Play e4 to control the center!', hi: 'e4 खेलो!', hg: 'e4 khelo center control ke liye!' },
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: { from: 'e2', to: 'e4' },
      hints: ['e2'],
    }
  },
  {
    id: 'tactics',
    title: { en: 'Basic Tactics', hi: 'बुनियादी चालें', hg: 'Basic Tactics' },
    icon: '⚡',
    steps: [
      {
        type: 'info',
        text: {
          en: 'Fork: Attack TWO pieces at once with one piece! Knights are amazing at forks.',
          hi: 'फोर्क: एक मोहरे से दो मोहरों पर एक साथ हमला! घोड़ा फोर्क में माहिर है।',
          hg: 'Fork: Ek piece se TWO pieces pe ek saath attack! Knights forks mein amazing hain.'
        },
        fen: '8/8/2k1r3/8/3N4/8/8/4K3 w - - 0 1',
        highlights: ['d4','c6','e6'],
      },
      {
        type: 'info',
        text: {
          en: 'Pin: A piece can\'t move because it would expose a more valuable piece behind it!',
          hi: 'पिन: एक मोहरा हिल नहीं सकता क्योंकि पीछे कीमती मोहरा खुल जाएगा!',
          hg: 'Pin: Ek piece hil nahi sakta kyunki uske peeche zyada valuable piece expose ho jayega!'
        },
        fen: '4k3/8/4r3/8/4B3/8/8/4K3 w - - 0 1',
        highlights: ['e4','e6','e8'],
      },
    ],
    challenge: {
      text: { en: 'Fork the King and Rook with the Knight!', hi: 'घोड़े से राजा और हाथी पर फोर्क करो!', hg: 'Knight se King aur Rook dono pe fork karo!' },
      fen: '4k3/8/4r3/8/8/5N2/8/4K3 w - - 0 1',
      solution: { from: 'f3', to: 'd4' },
      hints: ['f3'],
    }
  },
  {
    id: 'checkmate-patterns',
    title: { en: 'Simple Checkmates', hi: 'आसान शह-मात', hg: 'Simple Checkmates' },
    icon: '👑',
    steps: [
      {
        type: 'info',
        text: {
          en: 'Back Rank Mate: The Rook or Queen delivers checkmate on the last row when the King is trapped by its own pawns!',
          hi: 'बैक रैंक मेट: जब राजा अपने ही प्यादों से फँसा हो और हाथी/रानी आखिरी पंक्ति पर शह-मात दे!',
          hg: 'Back Rank Mate: Jab King apne hi pawns se fasa ho aur Rook/Queen last row pe checkmate de!'
        },
        fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
        highlights: ['e1','e8','g8'],
      },
    ],
    challenge: {
      text: { en: 'Deliver checkmate! Move the Rook to e8.', hi: 'शह-मात दो! हाथी को e8 पर ले जाओ।', hg: 'Checkmate do! Rook ko e8 pe le jao.' },
      fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
      solution: { from: 'e1', to: 'e8' },
      hints: ['e1'],
    }
  },
];

export default LESSONS;
