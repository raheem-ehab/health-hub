import AIChatMessage from '../models/AIChatMessage.js';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

import { getLocalReply } from '../utils/chatResponder.js';

const SYSTEM_PROMPT = `You are a helpful assistant for a hospital management system demo. You must NOT provide medical diagnoses or prescriptions. Provide general, non-actionable information and suggest contacting a healthcare professional when appropriate. Keep responses concise and professional. Do not ask for or store sensitive personal health information.`;

export const chatAIHandler = async (req, res) => {
  try {
    const { message, userId } = req.body || {};

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Invalid request: message is required' });
    }

    const userMessage = String(message).trim().slice(0, 2000);

    // Check for simple local responses (greetings, thanks, how-are-you, jokes, goodbyes, fallback)
    try {
      const local = getLocalReply(userMessage);
      if (local && local.reply) {
        // Save the local response for analytics (non-sensitive)
        try {
          await AIChatMessage.create({ userId: userId || null, message: userMessage, reply: local.reply, source: 'local', type: local.type });
        } catch (err) {
          console.error('Failed to save local AI chat message', err);
        }
        return res.json({ reply: local.reply, source: 'local', type: local.type });
      }
    } catch (err) {
      // If local responder fails for any reason, continue to OpenAI gracefully
      console.error('Local responder error', err);
    }

    // If we reach here, no local reply matched. Ensure OpenAI key exists before calling external API.
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key is not configured and no local reply was available');
      return res.status(503).json({ error: 'OpenAI API key not configured (OPENAI_API_KEY) and no local reply available' });
    }

    const payload = {
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 400,
      temperature: 0.3,
      n: 1,
    };

    const resp = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => 'OpenAI error');
      console.error('OpenAI API error', resp.status, txt);
      return res.status(502).json({ error: 'Error from OpenAI API' });
    }

    const data = await resp.json();
    const reply = (data?.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ? String(data.choices[0].message.content).trim() : '';

    // Save conversation for demo analytics (non-sensitive). Wrap in try/catch to avoid failing the response.
    try {
      await AIChatMessage.create({ userId: userId || null, message: userMessage, reply });
    } catch (err) {
      console.error('Failed to save AI chat message', err);
    }

    return res.json({ reply });
  } catch (err) {
    console.error('Unhandled error in chatAIHandler', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default { chatAIHandler };