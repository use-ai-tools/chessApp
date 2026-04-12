// Smart Chess Arena Support Bot — works with Gemini API + built-in fallback

const SYSTEM_PROMPT = "You are Chess Arena support bot. Help with contests, wallet, prizes, chess rules. Be helpful and concise. Answer in the same language the user asks in.";

// ─── Built-in FAQ fallback (works without any API key) ───
const FAQ = [
  { keywords: ['join', 'contest', 'enter', 'play', 'kaise khele', 'join kaise', 'khelna'],
    answer: '🎮 Contest join karna bahut easy hai!\n\n1. Lobby page pe jao\n2. Apna contest choose karo (₹7, ₹20, ₹50, ₹100)\n3. "Join" button click karo\n4. Entry fee wallet se deduct hogi\n5. Jaise hi 2nd player join karega, match start!' },

  { keywords: ['wallet', 'money', 'balance', 'paisa', 'paise', 'add money', 'deposit'],
    answer: '💰 Wallet Guide:\n\n• Navbar pe ₹ icon click karo to see balance\n• "Add Money" se Razorpay ke through paisa add karo\n• Contest jeetne pe prize automatically wallet me aata hai\n• Minimum withdrawal: ₹50' },

  { keywords: ['withdraw', 'cashout', 'nikalna', 'withdrawal', 'bank'],
    answer: '🏦 Withdrawal Process:\n\n1. Profile > Withdraw section\n2. Amount enter karo (min ₹50)\n3. Bank details add karo\n4. Request submit karo\n5. 24-48 hours me process hoga' },

  { keywords: ['prize', 'reward', 'jeetna', 'win', 'kitna milega', 'payout', 'winnings'],
    answer: '🏆 Prize Structure:\n\n• ₹7 entry → Winner gets ₹12\n• ₹20 entry → Winner gets ₹35\n• ₹50 entry → Winner gets ₹90\n• ₹100 entry → Winner gets ₹180\n\nPrize seedha wallet me aata hai after match!' },

  { keywords: ['rules', 'niyam', 'rule', 'how to play', 'chess rules'],
    answer: '♟️ Chess Arena Rules:\n\n• Standard chess rules apply\n• Each move ke liye 30 second timer\n• Timer khatam = auto-lose\n• Checkmate, resign, ya timeout se match end\n• Draw offer bhi available hai\n• Disconnect pe 15 sec reconnect window milti hai' },

  { keywords: ['elo', 'rating', 'rank', 'ranking', 'leaderboard'],
    answer: '📊 ELO Rating System:\n\n• Starting ELO: 1200\n• Win = +15 points\n• Loss = -10 points\n• Free contests me ELO change hota hai\n• Leaderboard page pe rankings dekho' },

  { keywords: ['refer', 'referral', 'invite', 'friend', 'bonus'],
    answer: '🤝 Referral Program:\n\n• Profile page se referral code lo\n• Friend ko share karo\n• Jab friend join kare → dono ko bonus!\n• Refer & Earn page pe track karo' },

  { keywords: ['stuck', 'loading', 'error', 'bug', 'problem', 'not working', 'kaam nahi'],
    answer: '🔧 Troubleshooting:\n\n• Page refresh karo (Ctrl+R)\n• Internet connection check karo\n• Browser cache clear karo\n• Logout karke wapas login karo\n• Agar phir bhi problem ho → support team se contact karo' },

  { keywords: ['hi', 'hello', 'hey', 'namaste', 'hii', 'hlo', 'help'],
    answer: '👋 Hello! Chess Arena support me aapka swagat hai!\n\nMain in topics me help kar sakta hoon:\n• 🎮 Contest kaise join kare\n• 💰 Wallet & money\n• 🏆 Prizes & payouts\n• ♟️ Chess rules\n• 📊 ELO & rankings\n• 🤝 Referrals\n\nPuchiye kuch bhi!' },
];

function getBuiltInReply(message) {
  const msg = message.toLowerCase();
  for (const faq of FAQ) {
    if (faq.keywords.some(kw => msg.includes(kw))) {
      return faq.answer;
    }
  }
  return '🤔 Mujhe yeh samajh nahi aaya. Aap puch sakte ho:\n\n• Contest kaise join kare?\n• Wallet me paisa kaise add kare?\n• Prize kitna milega?\n• Chess rules kya hain?\n• Referral program kya hai?';
}

// ─── Main Handler ───
exports.processChat = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Try Gemini API first (if key exists)
  if (apiKey && !apiKey.startsWith('your_')) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: message }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return res.json({ reply });
        }
      }
      // If API fails (expired key, quota, etc.) → fall through to built-in
      console.log('[chat] Gemini API failed, using built-in fallback');
    } catch (err) {
      console.log('[chat] Gemini API error, using built-in fallback:', err.message);
    }
  }

  // Built-in FAQ fallback — always works, no API needed
  const reply = getBuiltInReply(message);
  res.json({ reply });
};
