// src/lib/chatResponder.ts
// Lightweight client-side responder to provide instant local replies for small talk.
// Mirrors server logic in `server/utils/chatResponder.js` to give instant, bilingual replies.

const ARABIC_RE = /[\u0600-\u06FF]/;

type Pattern = {
  type: string;
  english?: RegExp[];
  arabic?: RegExp[];
  replies: { en?: string[]; ar?: string[] };
};

const patterns: Pattern[] = [
  {
    type: 'greeting',
    // allow greetings anywhere in the message, case-insensitive
    english: [/\bhi\b/i, /\bhello\b/i, /\bhey\b/i, /\bgood (morning|afternoon|evening)\b/i],
    // Arabic matching is simpler (no \b) to avoid issues with JS word boundary + Arabic
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

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function containsArabic(text: string) {
  return ARABIC_RE.test(text);
}

// Development-only logging
const isDev = typeof import.meta !== 'undefined' ? !!(import.meta as any).env?.DEV : false;

export function getLocalReply(message: string): { reply: string | null; type?: string } {
  if (!message || typeof message !== 'string') return { reply: null };
  const t = message.trim();
  if (isDev) console.debug('getLocalReply input', { t });
  const lower = t.toLowerCase();
  const isAr = containsArabic(t);

  for (const p of patterns) {
    const regexes = isAr ? p.arabic : p.english;
    if (!regexes) continue;
    for (const re of regexes) {
      if (re.test(lower) || (isAr && re.test(t))) {
        const lang = (isAr ? 'ar' : 'en') as 'ar' | 'en';
        const base = lang === 'ar' ? p.replies.ar : p.replies.en;
        if (!base || !base.length) break;
        let reply = pick<string>(base);
        if (Math.random() < 0.4) {
          const followUps: { en: string[]; ar: string[] } = {
            en: [' How about you?', "What's up on your side?"],
            ar: [' وانت؟', ' ايه اخبارك؟']
          };
          const fu = pick<string>(followUps[lang]);
          reply = `${reply.replace(/\s+$/, '')}${fu}`;
        }
        if (isDev) console.debug('getLocalReply matched', { type: p.type, lang, reply });
        return { reply, type: p.type };
      }
    }
  }

  if (containsArabic(t)) {
    return { reply: 'ممكن توضّح أكتر؟ لم أفهم تمامًا 🤔', type: 'fallback' };
  }
  return { reply: "I didn't get that — could you rephrase? 🤔", type: 'fallback' };
}

export default { getLocalReply };
