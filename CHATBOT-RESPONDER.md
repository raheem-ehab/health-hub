Chatbot Responder (Local)

Overview
- This project includes a small rule-based responder for bilingual (English/Arabic) small-talk.
- Purpose: provide fast, friendly, deterministic replies for greetings, thanks, "how are you", jokes, goodbyes and polite fallbacks — reducing unnecessary calls to external AI for trivial messages.

Files
- `server/utils/chatResponder.js` — server-side responder used to pre-check and return local replies before calling the OpenAI API. Saves local replies to DB for analytics.
- `src/lib/chatResponder.ts` — client-side copy for instant UI replies without round trips.

How it works
- Each pattern has:
  - a `type` (e.g., `greeting`, `thanks`, `howareyou`)
  - language-specific regexes for English and Arabic
  - language-specific arrays of possible replies
- `getLocalReply(message)` returns `{ reply: string, type: string }` if any pattern matches, else returns a polite fallback in the detected language.
- Replies are randomly chosen and sometimes joined with casual follow-ups to make conversation feel natural.

Extending
- To add a new message type: add an entry to the `patterns` array in `server/utils/chatResponder.js` and mirror it in `src/lib/chatResponder.ts`.
- Include both English and Arabic regexes and replies. Use emojis and short follow-ups for a more "alive" feel.

Notes
- The server will respond with `{ reply, source: 'local', type }` for local responses.
- For unknown messages, the server falls back to calling OpenAI if configured.

Security
- Local replies never request or store sensitive personal health information. The server saves non-sensitive analytics records of message and reply but does not log any sensitive fields.

Example
- Message: "hi" → Reply: "Hi there! 😊"
- Message: "شكرا" → Reply: "العفو! 🙌"

This setup keeps the chat fast, friendly, and easier to extend for your graduation project.
