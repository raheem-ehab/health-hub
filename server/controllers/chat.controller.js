import ChatEmail from '../models/ChatEmail.js';

// In-memory session state map (transient, demo use only)
const sessions = new Map(); // key -> { state?: 'WAITING_FOR_FORGOT_EMAIL', lang?: 'ar' | 'en' }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const ADMIN_CONTACTS = [
  'RaheemEhab@gmail.com',
  'Atefmohamed@gmail.com',
  'Abdallah@gmail.com',
  'shahd@gmail.com'
];

const SYSTEM_PROMPT = `You are a helpful assistant for a hospital management system demo. You must NOT provide medical diagnoses or prescriptions. Provide general, non-actionable information and suggest contacting a healthcare professional when appropriate. Keep responses concise and professional.`;

// Medication simulation data (lowercase)
// Keep lists concise; this rule-based checker is deterministic and educational for demo purposes.
const UNSAFE_PAIRS = [
  ['aspirin','warfarin'],
  ['ibuprofen','lisinopril'],
  ['metformin','contrast dye'],
  ['amoxicillin','methotrexate'],
  ['simvastatin','grapefruit']
];
const SAFE_PAIRS = [
  ['paracetamol','vitamin d'],
  ['omeprazole','lisinopril'],
  ['ibuprofen','vitamin d'],
  ['simvastatin','vitamin d']
];
// Known meds set for detection (normalized lowercase names)
const KNOWN_MEDS = Array.from(new Set([...UNSAFE_PAIRS.flat(), ...SAFE_PAIRS.flat()]));

// Menu texts (localized) — more conversational and helpful (avoid emoji glyphs to prevent missing-glyph boxes)
const MENU_EN = `I can help you with:\n1. Reset Password\n2. Contact Admin\n3. Check Medication Compatibility`;
const MENU_AR = `ممكن أساعدك في:\n1. إعادة تعيين كلمة المرور\n2. التواصل مع الإدارة\n3. التحقق من توافق الأدوية`;

function normalizeText(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ');
}

// Simple substring-based keyword matcher that works for Arabic and English
function containsAny(text, keywords) {
  const t = String(text || '').toLowerCase();
  for (const k of keywords) {
    if (!k) continue;
    if (t.includes(k.toLowerCase())) return true;
  }
  return false;
}

function isArabicText(text) {
  return /[\u0600-\u06FF]/.test(String(text || ''));
}

function detectMedNames(message) {
  const text = normalizeText(message);
  const found = [];
  for (const med of KNOWN_MEDS) {
    const rx = new RegExp(`\\b${med.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')}\\b`, 'i');
    if (rx.test(text)) found.push(med);
  }
  // dedupe
  return Array.from(new Set(found));
} 

function checkMedPairs(meds) {
  // meds: array of med names (lowercase)
  if (!meds || meds.length < 2) return null;
  // check unsafe first
  for (let i=0;i<meds.length;i++){
    for (let j=i+1;j<meds.length;j++){
      const a = meds[i]; const b = meds[j];
      // check unsafe
      for (const pair of UNSAFE_PAIRS) {
        if ((pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a)) {
          return 'unsafe';
        }
      }
    }
  }
  // check safe pairs
  for (let i=0;i<meds.length;i++){
    for (let j=i+1;j<meds.length;j++){
      const a = meds[i]; const b = meds[j];
      for (const pair of SAFE_PAIRS) {
        if ((pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a)) {
          return 'safe';
        }
      }
    }
  }
  return 'unknown';
}

function getWelcome(lang='en'){
  if (lang==='ar') return 'مرحبًا 👋\nيرجى اختيار خيار:\n1- الاتصال بالإدارة\n2- نسيت كلمة المرور';
  return 'Welcome 👋\nPlease choose an option:\n1- Contact Admin\n2- Forgot Password';
}


// Helper: attempt Hugging Face Inference API (requires HUGGINGFACE_API_TOKEN env var)
async function callHuggingFace(message) {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  const model = process.env.HUGGINGFACE_MODEL || 'google/flan-t5-small';
  if (!token) throw new Error('Hugging Face token not configured');
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const prompt = `${SYSTEM_PROMPT}\nUser: ${message}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => 'HF error');
    throw new Error(`HF error: ${resp.status} ${txt}`);
  }
  const data = await resp.json();
  // HF returns various shapes; try to extract text
  if (typeof data === 'string') return data;
  if (Array.isArray(data) && data.length > 0 && typeof data[0].generated_text === 'string') return data[0].generated_text.trim();
  if (data.generated_text) return String(data.generated_text).trim();
  if (data[0] && data[0].generated_text) return String(data[0].generated_text).trim();
  if (data?.error) throw new Error(data.error);
  return '';
}

// Helper: attempt OpenAI Chat Completions (requires OPENAI_API_KEY env var)
async function callOpenAI(message) {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  if (!key) throw new Error('OpenAI key not configured');
  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message }
    ],
    max_tokens: 400,
    temperature: 0.2
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => 'OpenAI error');
    throw new Error(`OpenAI error: ${resp.status} ${txt}`);
  }
  const data = await resp.json();
  const reply = data?.choices?.[0]?.message?.content;
  return typeof reply === 'string' ? reply.trim() : '';
}

// Deterministic fallback rule-based logic
async function fallbackResponse(message, sessionKey) {
  const text = message.toLowerCase();
  const session = sessions.get(sessionKey) || {};
  const lang = session.lang || 'en';

  // Admin/contact (English & Arabic keywords)
  if (containsAny(text, ['ادمن','أدمن','admin','contact','support','help','اتصل','الاتصال','الدعم','مساعدة','email','emails','ايميل','الايميل','ايميلات','الايميلات','ما هي الايميلات','ما هي الإيميلات'])) {
    const containsArabic = isArabicText(text);
    const langToUse = containsArabic ? 'ar' : (session.lang || 'en');
    sessions.set(sessionKey, { ...(session || {}), lang: langToUse });
    return (langToUse === 'ar') ? `يمكنك التواصل مع المدراء عبر البريد الإلكتروني:\n- ${ADMIN_CONTACTS.join('\n- ')}` : `You can contact the admins using the following emails:\n- ${ADMIN_CONTACTS.join('\n- ')}`;
  }

  // Forgot password (English & Arabic keywords) — start non-revealing reset flow
  if (containsAny(text, ['تعيين كلمة المرور','كلمة المرور','reset password','reset','forgot','password','نسيت','إعادة','نسيت كلمة المرور','مش فاكر كلمة المرور','i forgot my password','dont remember password'])) {
    const containsArabic = isArabicText(text);
    const langToUse = containsArabic ? 'ar' : (session.lang || 'en');
    // Do NOT set a reveal flag — always use non-revealing flow
    sessions.set(sessionKey, { ...(session || {}), state: 'WAITING_FOR_FORGOT_EMAIL', lang: langToUse });
    return (langToUse === 'ar') ? 'الرجاء إدخال بريدك الإلكتروني.' : 'Please enter your email address.';
  }

  // Medication interaction simulation
  const meds = detectMedNames(message);
  if (meds.length >= 2) {
    const resType = checkMedPairs(meds);
    if (resType === 'unsafe') return (lang === 'ar') ? '⚠️ لا يُنصح باستخدام هذين الدواءين معًا. قد تتسبب في تفاعلات ضارة.' : '⚠️ These medications should not be taken together. They may interact and cause harm.';
    if (resType === 'safe') return (lang === 'ar') ? '✅ يمكن استخدام هذين الدواءين معًا. لا توجد تفاعلات معروفة.' : '✅ These medications can be taken together. No known interactions.';
    return (lang === 'ar') ? 'عذرًا، لا أستطيع تحديد تفاعل هذه الأدوية. يُرجى استشارة أخصائي طبي.' : 'Sorry, I cannot determine the interaction for these medications; please consult a healthcare professional.';
  }

  // If we reach here, present a friendly interactive numbered menu (localized) and set session to menu selection
  const menu = (lang === 'ar') ? MENU_AR : MENU_EN;
  const preface = (lang === 'ar') ? 'عذرًا، لم أفهم ذلك. إليك بعض الأشياء التي أستطيع مساعدتك بها:' : "Sorry, I didn't get that. Here are some things I can help with:";
  sessions.set(sessionKey, { ...(session || {}), state: 'WAITING_FOR_MENU_SELECTION', lang });
  return `${preface}\n\n${menu}`;
}

export const chatHandler = async (req, res) => {
  try {
    const { message } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Invalid request: message is required' });
    const text = message.trim().slice(0, 2000);

    // Determine session key (prefer userId header/body, else IP)
    const sessionKey = (req.body && req.body.userId) || req.headers['x-session-id'] || req.ip || 'anon';

    // Session and language
    const session = sessions.get(sessionKey) || {};
      // Auto-detect Arabic in the incoming message and persist to session (allow mid-session language switch)
    const containsArabicGlobal = isArabicText(text);
    if (containsArabicGlobal) {
      sessions.set(sessionKey, { ...(session || {}), lang: 'ar' });
      session.lang = 'ar';
    }

    // Explicit language switch commands (text like 'English', 'عربي') should toggle session language
    const trimmedLower = text.trim().toLowerCase();
    if (/^\s*(english|en|switch to english|speak english)\s*$/.test(trimmedLower)) {
      sessions.set(sessionKey, { ...(session || {}), lang: 'en' });
      return res.json({ reply: 'Okay, I will speak English. How can I help?', nextState: 'START' });
    }
    if (/^\s*(عربي|arabic|اتكلم عربي|تحدث بالعربية)\s*$/.test(text)) {
      sessions.set(sessionKey, { ...(session || {}), lang: 'ar' });
      return res.json({ reply: 'حسنًا، سأتحدث معك بالعربية. كيف يمكنني مساعدتك؟', nextState: 'START' });
    }

    const lang = session.lang || (containsArabicGlobal ? 'ar' : 'en');

    // Friendly greetings and small-talk (non-exact matching)
    const GREET_EN = ['hi','hello','hey','how are you','howdy','good morning','good afternoon','what\'s up','sup'];
    const GREET_AR = ['مرحبا','أزيك','هاي','إزيك','السلام عليكم','اهلا','أهلا','مرحبًا'];
    const SMALL_EN = ['what\'s up','how\'s your day','nice to meet you','how are you','what\'s new'];
    const SMALL_AR = ['إزي يومك','عامل إيه','تشرفت','تشرفت بمعرفتك','اي أخبار'];
    const choose = (arr) => arr[Math.floor(Math.random()*arr.length)];

    // Check for greetings / small talk first (keeps convo natural)
    if (containsAny(text, GREET_EN) || containsAny(text, GREET_AR)) {
      const useAr = isArabicText(text) || session.lang === 'ar';
      sessions.set(sessionKey, { ...(session || {}), state: undefined, lang: useAr ? 'ar' : 'en' });
      if (useAr) {
        const replies = ['مرحبا! كيف أقدر أساعدك؟', 'أنا بخير، إزيك؟', 'أهلاً! كيف يمكنني مساعدتك اليوم؟'];
        return res.json({ reply: choose(replies), nextState: 'START' });
      }
      const repliesEn = ["Hi! How can I help you?", "I'm fine, thanks! How about you?", 'Hello! How can I assist you today?'];
      return res.json({ reply: choose(repliesEn), nextState: 'START' });
    }

    // Small talk phrases
    if (containsAny(text, SMALL_EN) || containsAny(text, SMALL_AR)) {
      const useAr = isArabicText(text) || session.lang === 'ar';
      sessions.set(sessionKey, { ...(session || {}), state: undefined, lang: useAr ? 'ar' : 'en' });
      if (useAr) {
        const replies = ['إزي يومك؟', 'عامل إيه؟', 'تشرفت بمعرفتك!'];
        return res.json({ reply: choose(replies), nextState: 'START' });
      }
      const repliesEn = ["What's up?", "How's your day?", 'Nice to meet you!'];
      return res.json({ reply: choose(repliesEn), nextState: 'START' });
    }

    // Handle waiting states: MENU_SELECTION, FORGOT_EMAIL, MED_NAMES
    if (session && session.state) {
      // MENU selection: user should choose 1/2/3 or send a keyword
      if (session.state === 'WAITING_FOR_MENU_SELECTION') {
        // interpret selection
        const sel = text.trim();
        // if the user directly entered medication names while in the menu, handle them immediately
        const medsDirect = detectMedNames(text);
        if (medsDirect && medsDirect.length >= 2) {
          const resType = checkMedPairs(medsDirect);
          // clear menu state
          sessions.set(sessionKey, { ...(session || {}), state: undefined });
          if (resType === 'unsafe') return res.json({ reply: (lang === 'ar') ? '⚠️ لا يُنصح باستخدام هذين الدواءين معًا. قد تؤدي إلى تفاعلات ضارة.' : '⚠️ These medications should not be taken together. They may interact and cause harm.', nextState: 'START' });
          if (resType === 'safe') return res.json({ reply: (lang === 'ar') ? '✅ يمكن استخدام هذين الدواءين معًا. لا توجد تفاعلات معروفة.' : '✅ These medications can be taken together. No known interactions.', nextState: 'START' });
          return res.json({ reply: (lang === 'ar') ? 'عذرًا، لا أستطيع تحديد تفاعل هذه الأدوية. يُرجى استشارة أخصائي طبي.' : 'Sorry, I cannot determine the interaction for these medications; please consult a healthcare professional.', nextState: 'START' });
        }
        // numeric choices first
        if (/^1\b/.test(sel) || containsAny(text, ['reset','password','تعيين كلمة المرور','نسيت','كلمة المرور'])) {
          // set forgot email state without revealing existence
          sessions.set(sessionKey, { ...(session || {}), state: 'WAITING_FOR_FORGOT_EMAIL', lang: session.lang || (isArabicText(text) ? 'ar' : 'en') });
          const reply = (session.lang === 'ar' || isArabicText(text)) ? 'أدخل بريدك الإلكتروني:' : 'Please enter your email address.';
          return res.json({ reply, nextState: 'WAITING_FOR_FORGOT_EMAIL' });
        }
        if (/^2\b/.test(sel) || containsAny(text, ['admin','contact','contact admin','التواصل','مدراء','الايميل','الايميلات','ايميلات','أين الايميلات'])) {
          const langToUse = session.lang || (isArabicText(text) ? 'ar' : 'en');
          sessions.set(sessionKey, { ...(session || {}), state: undefined, lang: langToUse });
          const reply = (langToUse === 'ar') ? `قائمة البريد الإلكتروني للمسؤولين:\n- ${ADMIN_CONTACTS.join('\n- ')}` : `Admin emails:\n- ${ADMIN_CONTACTS.join('\n- ')}`;
          return res.json({ reply, nextState: 'START' });
        }
        if (/^3\b/.test(sel) || containsAny(text, ['med','medications','medicines','دواء','أدوية','التحقق من الأدوية','تحقق من الأدوية'])) {
          const langToUse = session.lang || (isArabicText(text) ? 'ar' : 'en');
          sessions.set(sessionKey, { ...(session || {}), state: 'WAITING_FOR_MED_NAMES', lang: langToUse });
          const reply = (langToUse === 'ar') ? 'الرجاء إدخال اسم أو أكثر من اسمين للأدوية (على سبيل المثال: Aspirin و Warfarin).' : 'Please enter two or more medication names (e.g., Aspirin and Warfarin).';
          return res.json({ reply, nextState: 'WAITING_FOR_MED_NAMES' });
        }
        // If we couldn't interpret selection, re-send menu
        const langToUse = session.lang || (isArabicText(text) ? 'ar' : 'en');
        const menu = (langToUse === 'ar') ? MENU_AR : MENU_EN;
        sessions.set(sessionKey, { ...(session || {}), state: 'WAITING_FOR_MENU_SELECTION', lang: langToUse });
        return res.json({ reply: menu, nextState: 'WAITING_FOR_MENU_SELECTION' });
      }

      // Forgot-email waiting (previous behavior)
      if (session.state === 'WAITING_FOR_FORGOT_EMAIL') {
        const email = text.toLowerCase();
        if (!EMAIL_REGEX.test(email)) {
          const badEmailReply = (lang === 'ar') ? 'الرجاء إدخال عنوان بريد إلكتروني صالح.' : 'Please enter a valid email address.';
          return res.json({ reply: badEmailReply, nextState: 'WAITING_FOR_FORGOT_EMAIL' });
        }

        // Clear state and respond with non-revealing language-specific message
        sessions.set(sessionKey, { ...(session || {}), state: undefined });
        const successAR = 'إذا كان لديك حساب مسجل لدينا، سيتم إرسال رسالة إلى بريدك الإلكتروني تحتوي على رابط إعادة تعيين كلمة المرور.';
        const successEN = 'If you have a registered account, a password reset link will be sent to your email.';
        return res.json({ reply: (lang === 'ar') ? successAR : successEN, nextState: 'START' });
      }

      // Medication names waiting
      if (session.state === 'WAITING_FOR_MED_NAMES') {
        const meds = detectMedNames(text);
        if (!meds || meds.length < 2) {
          const prompt = (lang === 'ar') ? 'الرجاء إدخال اسم أو أكثر من اسمين للأدوية حتى أتمكن من التحقق.' : 'Please enter two or more medication names so I can check interactions.';
          return res.json({ reply: prompt, nextState: 'WAITING_FOR_MED_NAMES' });
        }
        const resType = checkMedPairs(meds);
        // clear med waiting state
        sessions.set(sessionKey, { ...(session || {}), state: undefined });
        if (resType === 'unsafe') return res.json({ reply: (lang === 'ar') ? '⚠️ لا يُنصح باستخدام هذين الدواءين معًا. قد تتسبب في تفاعلات ضارة.' : '⚠️ These medications should not be taken together. They may interact and cause harm.', nextState: 'START' });
        if (resType === 'safe') return res.json({ reply: (lang === 'ar') ? '✅ يمكن استخدام هذين الدواءين معًا. لا توجد تفاعلات معروفة.' : '✅ These medications can be taken together. No known interactions.', nextState: 'START' });
        return res.json({ reply: (lang === 'ar') ? 'عذرًا، لا أستطيع تحديد تفاعل هذه الأدوية. يُرجى استشارة أخصائي طبي.' : 'Sorry, I cannot determine the interaction for these medications; please consult a healthcare professional.', nextState: 'START' });
      }
    }

    // START-state like checks (language switch, meds, admin, forgot) before calling external AI
    // Arabic switch command
    // If the user uses Arabic switch phrases, handle earlier; keep this as fallback for variants
    if (text.toLowerCase().includes('اتكلم عربي') || text.toLowerCase().includes('عربي')) {
      sessions.set(sessionKey, { ...(session || {}), lang: 'ar' });
      return res.json({ reply: 'حسنًا، سأتحدث معك بالعربية. كيف يمكنني مساعدتك؟', nextState: 'START' });
    }

    // Admin keywords (Arabic/English): respond with admin emails
    if (containsAny(text, ['ادمن','أدمن','admin','email','emails','الايميلات','الإيميلات','الايميل','الإيميل','ايميلات','ما هي الايميلات','ما هي الإيميلات'])) {
      // if the message contains Arabic script, prefer Arabic
      const containsArabic = isArabicText(text);
      const langToUse = containsArabic ? 'ar' : lang;
      sessions.set(sessionKey, { ...(session || {}), lang: langToUse });
      const reply = (langToUse === 'ar')
        ? `قائمة البريد الإلكتروني للمسؤولين:\n- ${ADMIN_CONTACTS.join('\n- ')}`
        : `Admin emails:\n- ${ADMIN_CONTACTS.join('\n- ')}`;
      return res.json({ reply, nextState: 'START' });
    }

    // Password reset keywords (Arabic/English): start non-revealing reset flow
    if (/\b(تعيين كلمة المرور|كلمة المرور|reset password|reset|forgot|password|نسيت|إعادة)\b/i.test(text)) {
      const containsArabic = /[\u0600-\u06FF]/.test(text);
      const langToUse = containsArabic ? 'ar' : lang;
      // No reveal — always use non-revealing reset flow
      sessions.set(sessionKey, { ...(session || {}), state: 'WAITING_FOR_FORGOT_EMAIL', lang: langToUse });
      const reply = (langToUse === 'ar') ? 'أدخل بريدك الإلكتروني:' : 'Please enter your email address.';
      return res.json({ reply, nextState: 'WAITING_FOR_FORGOT_EMAIL' });
    }

    // Medication detection and rule-based check
    const medsFound = detectMedNames(text);
    if (medsFound.length >= 2) {
      const resType = checkMedPairs(medsFound);
      if (resType === 'unsafe') {
        const reply = (lang === 'ar') ? '⚠️ لا يُنصح باستخدام هذين الدواءين معًا. قد تتسبب في تفاعلات ضارة.' : '⚠️ These medications should not be taken together. They may interact and cause harm.';
        return res.json({ reply, nextState: 'START' });
      }
      if (resType === 'safe') {
        const reply = (lang === 'ar') ? '✅ يمكن استخدام هذين الدواءين معًا. لا توجد تفاعلات معروفة.' : '✅ These medications can be taken together. No known interactions.';
        return res.json({ reply, nextState: 'START' });
      }
      const unknownReply = (lang === 'ar') ? 'عذرًا، لا أستطيع تحديد تفاعل هذه الأدوية. يُرجى استشارة أخصائي طبي.' : 'Sorry, I cannot determine the interaction for these medications; please consult a healthcare professional.';
      return res.json({ reply: unknownReply, nextState: 'START' });
    }

    // Contact admin keywords (English/Arabic)
    if (/^1$/.test(text.toLowerCase()) || /\b(admin|contact|support|help|اتصل|الاتصال|الدعم|مساعدة)\b/.test(text)) {
      const contacts = ADMIN_CONTACTS;
      const reply = (lang === 'ar') ? `يمكنك التواصل مع المدراء عبر البريد الإلكتروني:\n- ${contacts.join('\n- ')}` : `You can contact the admins using the following emails:\n- ${contacts.join('\n- ')}`;
      return res.json({ reply, nextState: 'START' });
    }

    // Forgot password keywords (English/Arabic)
    if (/^2$/.test(text.toLowerCase()) || /\b(forgot|password|reset|نسيت|كلمة المرور|إعادة)\b/.test(text)) {
      const reply = (lang === 'ar') ? 'الرجاء إدخال بريدك الإلكتروني.' : 'Please enter your email address.';
      // set session to waiting state and preserve language
      sessions.set(sessionKey, { ...(session || {}), state: 'WAITING_FOR_FORGOT_EMAIL', lang });
      return res.json({ reply, nextState: 'WAITING_FOR_FORGOT_EMAIL' });
    }

    // Try AI providers in order: Hugging Face -> OpenAI
    try {
      if (process.env.HUGGINGFACE_API_TOKEN) {
        const hfReply = await callHuggingFace(text);
        if (hfReply) return res.json({ reply: hfReply, nextState: 'START' });
      }
    } catch (err) {
      console.warn('Hugging Face call failed, falling back', err.message || err);
    }

    try {
      if (process.env.OPENAI_API_KEY) {
        const oaReply = await callOpenAI(text);
        if (oaReply) return res.json({ reply: oaReply, nextState: 'START' });
      }
    } catch (err) {
      console.warn('OpenAI call failed, falling back', err.message || err);
    }

    // If no AI available or failed, use rule-based fallback
    const fb = await fallbackResponse(text, sessionKey);
    // reflect actual session state (e.g., WAITING_FOR_MENU_SELECTION) to the client
    const postSession = sessions.get(sessionKey) || {};
    const nextState = postSession.state || 'START';
    return res.json({ reply: fb, nextState });
  } catch (err) {
    console.error('Unhandled error in chat handler', err);
    // Return a friendly reply so frontend can always display a message instead of an error state
    return res.json({ reply: 'Sorry, I am having trouble reaching the AI service. Please try again later.', nextState: 'START' });
  }
};

export default { chatHandler };
