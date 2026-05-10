// server/utils/chatResponder.js
// Simple rule-based bilingual responder for small talk and fallbacks.
// Designed for easy extension: add more patterns and replies as needed.

const ARABIC_RE = /[\u0600-\u06FF]/;

const patterns = [
  {
    type: 'greeting',
    english: [/\bhi\b/i, /\bhello\b/i, /\bhey\b/i, /\bgood (morning|afternoon|evening)\b/i],
    arabic: [/هاي/, /مرحبا/, /اهلا/, /هلا/],
    replies: {
      en: ['Hi there! 😊', 'Hello! How can I help you today? 🤖', 'Hey! What can I do for you? 😀'],
      ar: ['أهلًا! 😊', 'مرحبًا! كيف أقدر أساعدك؟ 🤖', 'هاي! شو اللي في بالك؟ 😀']
    }
  },

  {
    type: 'thanks',
    english: [/\bthanks\b/i, /\bthank you\b/i, /\bthx\b/i, /\bthank u\b/i],
    arabic: [/شكرا/, /مشكور/, /ممنون/],
    replies: {
      en: ['You’re welcome! 🙌', 'No problem — happy to help! 😊', 'Anytime! 👍'],
      ar: ['العفو! 🙌', 'على الرحب! 😊', 'دايمًا هنا للمساعدة! 👍']
    }
  },

  {
    type: 'howareyou',
    english: [/\bhow are you\b/i, /\bhow's it going\b/i, /\bhow r u\b/i, /\bhow are u\b/i],
    arabic: [/عامل ?ايه/, /ازيك/, /اي اخبارك/, /كيف حالك/],
    replies: {
      en: ["I'm good, thanks! How about you? 😊", "Doing well — thanks for asking! What about you? 🤖"],
      ar: ['الحمد لله، وانت؟ 😊', 'تمام! ازيك انت؟ 🤖']
    }
  },

  {
    type: 'joke',
    english: [/joke/i, /that's funny/i, /\blol\b/i, /\bhaha\b/i, /\blmao\b/i],
    arabic: [/نكتة/, /هههه+/, /مضحك/],
    replies: {
      en: ['Haha! 😄 Glad you liked it. Want to hear another one?', '😂 You crack me up! Want another?'],
      ar: ['هههه! 😄 حلوة! تحب أقول نكتة تانية؟', '😂 بتضحكني! عايز نكتة تانية؟']
    }
  },

  {
    type: 'goodbye',
    english: [/\bbye\b/i, /\bsee you\b/i, /\bgoodbye\b/i, /\bsee ya\b/i],
    arabic: [/باي/, /مع السلامة/, /أشوفك لاحقًا/, /اشوفك/],
    replies: {
      en: ['Bye! 👋 Take care!', 'See you later! 👋', 'Goodbye — have a great day! 🌟'],
      ar: ['مع السلامة! 👋', 'أشوفك لاحقًا! 👋', 'باي! يومك سعيد! 🌟']
    }
  }
];

// Add debug logging in development to inspect matches
const isDev = process.env.NODE_ENV !== 'production';
const oldGetLocalReply = getLocalReply;
function debugGetLocalReply(message) {
  if (isDev) console.debug('server getLocalReply:', { message });
  return oldGetLocalReply(message);
}

export { debugGetLocalReply as getLocalReply };

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function containsArabic(text) {
  return ARABIC_RE.test(text);
}

// Returns { reply: string | null, type?: string }
export function getLocalReply(message) {
  if (!message || typeof message !== 'string') return { reply: null };
  const t = message.trim();
  const lower = t.toLowerCase();
  const isAr = containsArabic(t);

  for (const p of patterns) {
    const regexes = isAr ? p.arabic : p.english;
    if (!regexes) continue;
    for (const re of regexes) {
      if (re.test(lower) || (isAr && re.test(t))) {
        // choose an appropriate language reply
        const lang = isAr ? 'ar' : 'en';
        const base = p.replies && p.replies[lang];
        if (!base || !base.length) break;
        // add an optional casual follow-up with some probability
        let reply = pick(base);
        if (Math.random() < 0.4) {
          const followUps = {
            en: [' How about you?', "What's up on your side?"],
            ar: [' وانت؟', ' ايه اخبارك؟']
          };
          const fu = pick(followUps[lang]);
          // keep punctuation natural
          reply = `${reply.replace(/\s+$/,'')}${fu}`;
        }
        return { reply, type: p.type };
      }
    }
  }

  // Fallback (polite, bilingual)
  if (containsArabic(t)) {
    return { reply: 'ممكن توضّح أكتر؟ لم أفهم تمامًا 🤔', type: 'fallback' };
  }
  return { reply: "I didn't get that — could you rephrase? 🤔", type: 'fallback' };
}

export default { getLocalReply };
