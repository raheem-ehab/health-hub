import Email from '../models/Email.js';

// States
const STATES = {
  START: 'START',
  WAITING_FOR_EMAIL: 'WAITING_FOR_EMAIL',
  WAITING_FOR_FORGOT_EMAIL: 'WAITING_FOR_FORGOT_EMAIL',
};

// Simple RFC-like email regex — strict enough for validation but not overly strict
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

// Admin contact — production-safe fallback
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@health-hub.example';

// Helper: build welcome message
const getWelcome = () =>
  'Welcome 👋\nPlease choose an option:\n1- Contact Admin\n2- Forgot Password';

export const handleChat = async (req, res) => {
  try {
    const { message = '', state = STATES.START } = req.body || {};

    // Basic validation: ensure types
    if (typeof message !== 'string' || typeof state !== 'string') {
      return res.status(400).json({ reply: 'Invalid request format.', nextState: STATES.START });
    }

    // Trim and limit length to prevent abuse
    const text = message.trim().slice(0, 1000);

    // If empty message and state is START => return welcome
    if (!text && state === STATES.START) {
      return res.json({ reply: getWelcome(), nextState: STATES.START });
    }

    // Normalize option selection when in START
    if (state === STATES.START) {
      // If user sent a number
      const normalized = text.toLowerCase();

      // Contact admin: option 1 or keywords
      if (/^1$/.test(normalized) || /\b(admin|contact|support|help)\b/.test(normalized)) {
        const contacts = [
          'RaheemEhab@gmail.com',
          'Atefmohamed@gmail.com',
          'Abdallah@gmail.com',
          'shahd@gmail.com'
        ];
        const reply = `You can contact the admins using the following emails:\n- ${contacts.join('\n- ')}`;
        return res.json({ reply, nextState: STATES.START });
      }

      // Forgot password: option 2 or keywords
      if (/^2$/.test(normalized) || /\b(forgot|password|reset)\b/.test(normalized)) {
        return res.json({ reply: 'Please enter your registered email.', nextState: STATES.WAITING_FOR_FORGOT_EMAIL });
      }

      // Try keyword matches first; fallback message
      return res.json({ reply: `Sorry, I didn't understand that.\nPlease choose:\n1- Contact Admin\n2- Forgot Password`, nextState: STATES.START });
    }

    // WAITING_FOR_EMAIL: attempt to register
    if (state === STATES.WAITING_FOR_EMAIL) {
      const email = text.toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        return res.json({ reply: 'Please enter a valid email address.', nextState: STATES.WAITING_FOR_EMAIL });
      }

      try {
        // Upsert style: try create, if duplicate return message
        const doc = new Email({ email });
        await doc.save();
        return res.json({ reply: 'Email registered successfully.', nextState: STATES.START });
      } catch (err) {
        // Duplicate key
        if (err.code === 11000) {
          return res.json({ reply: 'This email is already registered.', nextState: STATES.START });
        }
        console.error('Error saving email', err);
        return res.status(500).json({ reply: 'Internal server error while saving email.', nextState: STATES.START });
      }
    }

    // WAITING_FOR_FORGOT_EMAIL: validate and respond without revealing existence
    if (state === STATES.WAITING_FOR_FORGOT_EMAIL) {
      const email = text.toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        return res.json({ reply: 'Please enter a valid email address.', nextState: STATES.WAITING_FOR_FORGOT_EMAIL });
      }

      // Deterministic user-friendly response without revealing user existence
      return res.json({ reply: 'If this email exists in our system, a password reset link has been sent.', nextState: STATES.START });
    }

    // Unknown state: reset to START and send welcome
    return res.json({ reply: `State was unrecognized.\n\n${getWelcome()}`, nextState: STATES.START });
  } catch (err) {
    console.error('Unhandled error in chat handler', err);
    return res.status(500).json({ reply: 'Internal server error', nextState: 'START' });
  }
};

export default {
  handleChat,
};
