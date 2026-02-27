# AI Integration Guide – Sign Language App

**Status: Implemented using Groq as the LLM (free tier).** The backend uses `GROQ_API_KEY` from `dsatm-main/dsatm-main/backend/.env`. Get a key at https://console.groq.com. All four features below are wired: Explain, Normalize, Gloss, and Chat tutor.

---

## Current App Summary

| Feature | What it does | Limitation |
|--------|----------------|------------|
| **Convert** | User types or speaks text → 3D avatar performs sign. Uses **words** (TIME, HOME, PERSON, YOU) and **alphabets** (A–Z). Unknown words are fingerspelled. | Only 4 whole words; everything else is letter-by-letter. No understanding of phrases or context. |
| **Learn Sign** | User picks a letter or word → avatar demonstrates the sign. | Same small vocabulary; no explanation of how/why the sign is formed. |
| **Speech** | Browser Speech Recognition (react-speech-recognition) for voice input. | Raw transcript only; no normalization or intent. |

The app uses a **fixed animation dictionary**: each sign is a sequence of bone rotations for a Three.js GLTF avatar. Adding new signs today means hand-authoring new animation files (e.g. `Words/HELLO.js`).

---

## AI Features: What They Do and How They Help

### 1. **AI “Explain this sign” (Learn Sign)**

**What it does:** On Learn Sign, user taps “Explain” next to a word/letter. AI returns a short, accessible explanation (e.g. “Why is the hand shaped like this?”, “How do I remember this sign?”).

**How it helps:** Supports understanding and memory, especially for learners who need extra context (e.g. neurodiverse or visual learners).

**How to implement:**
- Add an “Explain” (or “?”) button next to each word/letter in [LearnSign.js](signtranslator/learnsign/client/src/Pages/LearnSign.js).
- Sign Language client calls your **BrightWords backend** (e.g. `POST /api/sign-language/explain`) with `{ type: 'word'|'letter', value: 'HOME' }`.
- Backend uses an LLM (OpenAI, Claude, or open-source) with a system prompt like: “You are an Indian Sign Language (ISL) tutor. In 1–2 sentences, explain how to perform or remember the sign for [HOME]. Use simple language.”
- Return `{ explanation: "..." }` to the client; show in a modal or collapsible panel.
- **No change to the animation pipeline**; only adds an explanation API and UI.

---

### 2. **Text/speech normalization and sign suggestions (Convert)**

**What it does:** User speaks or types a phrase. AI (1) normalizes the text (“gonna” → “going to”, fix typos), (2) suggests which words you already have as full signs vs. spell, (3) optionally suggests a simpler rephrase that uses more of your 4 words.

**How it helps:** Better use of the existing word animations; clearer input for the avatar; learners see “we have a sign for TIME” instead of always fingerspelling.

**How to implement:**
- In [Convert.js](signtranslator/learnsign/client/src/Pages/Convert.js), before calling `sign(inputValue)`, optionally send the text to the backend (e.g. `POST /api/sign-language/normalize` with `{ text }`).
- Backend uses an LLM to: normalize the sentence, and return `{ normalizedText, suggestedWords: ['TIME','HOME',...], message?: "We have full signs for: TIME, HOME. Rest will be fingerspelled." }`.
- Client uses `normalizedText` for the animation and can show `message` as a hint. Still use the same `sign()` and existing `words`/`alphabets`; no new animation data.

---

### 3. **Sign recognition (practice / quiz)**

**What it does:** User turns on the camera and performs a sign. The app tells them whether it matches the target sign (e.g. “Show me HOME”) or shows the recognized letter/word.

**How it helps:** Practice and feedback without a human tutor; reinforces learning.

**How to implement:**
- **Option A – Client-side (no backend):** Use **MediaPipe Hands** (or similar) to get hand landmarks from the camera, then run a small classifier (e.g. TensorFlow.js) trained on landmark sequences for your 4 words + letters. You’d need a small dataset of landmark sequences per sign (recorded via MediaPipe).
- **Option B – Backend:** Send video frames or landmark sequences to your backend; run a Python model (e.g. LSTM/Transformer on landmarks) and return `{ recognized: 'HOME', confidence: 0.92 }`. Frontend: new “Practice” or “Quiz” view with camera capture and “Check” button.
- Start with **letters only** (simpler) or one word; then expand.

---

### 4. **Expand vocabulary with “gloss” API (Convert)**

**What it does:** For any sentence, an AI (or rule-based) service returns a **sequence of sign glosses** (e.g. “HELLO” “MY” “NAME” “JOHN”). The client then shows what *would* be signed. Today you don’t have animations for HELLO, MY, NAME, JOHN – so you could (a) show the gloss list as text under the avatar (“We’d sign: HELLO, MY, NAME, J-O-H-N”), or (b) later add animations for the most common glosses and drive the avatar for those.

**How it helps:** Prepares the app for a larger vocabulary; learners see the intended sign sequence even if some signs are still fingerspelled.

**How to implement:**
- Backend endpoint e.g. `POST /api/sign-language/gloss` with `{ text: "Hello, my name is John" }`.
- Backend uses an LLM with a prompt: “Given this English sentence, output a sequence of Indian Sign Language glosses (capitalized words), one per sign. Use standard ISL glosses where possible; otherwise use single letters for fingerspelling.”
- Response: `{ glosses: ["HELLO", "MY", "NAME", "J", "O", "H", "N"] }`.
- In Convert, call this API instead of (or in addition to) the current client-side `sign()`. For glosses that exist in `words` or `alphabets`, play the animation; for others, show the gloss label and/or fingerspell. Requires mapping glosses to existing `words`/`alphabets` keys where possible.

---

### 5. **Conversation tutor (optional)**

**What it does:** A chat panel: “How do I say ‘thank you’ in sign?” or “What’s the sign for HOME?” – AI answers with text and points to “Try it in Learn Sign” or “See it in Convert” with a deep link.

**How it helps:** Combines explanation and navigation in one place.

**How to implement:** Add a small chat UI; send messages to `POST /api/sign-language/chat`. Backend uses an LLM with context (e.g. “You are an ISL tutor. We have signs for: TIME, HOME, PERSON, YOU. For other signs suggest fingerspelling or explain.”). Return markdown or plain text; optionally include `suggestedRoute: '/sign-kit/learn-sign'` and `suggestedWord: 'HOME'` for deep links.

---

## Recommended order of implementation

1. **Explain this sign (Learn Sign)** – One new API, one new button; immediate value, no change to animation.
2. **Normalize / suggest (Convert)** – Improves existing flow with one optional API call before `sign()`.
3. **Gloss API (Convert)** – Prepares for future vocabulary growth; you can start by showing glosses as text, then add animations over time.
4. **Sign recognition (practice)** – Highest effort (data or model work); do after the above.
5. **Conversation tutor** – Nice add-on once 1–2 are in place.

---

## Where to put the backend

- Use the **existing BrightWords backend** ([dsatm-main/dsatm-main/backend/server.js](../../backend/server.js)): add routes under e.g. `/api/sign-language/explain`, `/api/sign-language/normalize`, `/api/sign-language/gloss`.
- The Sign Language app currently calls an external API ([config.js](signtranslator/learnsign/client/src/Config/config.js) `baseURL` for videos). For AI, either:
  - **Option A:** Point the Sign Language client to your own backend (e.g. same origin when embedded: `/api/...` and let the main app’s Vite proxy forward to Express), or
  - **Option B:** Keep the client on its current host and call your backend with full URL (e.g. `https://your-api.com/api/sign-language/explain`). If the backend is on another origin, enable CORS for that client’s origin.

---

## Minimal “Explain this sign” implementation checklist

1. **Backend (Express)**  
   - Add `POST /api/sign-language/explain`.  
   - Body: `{ type: 'word' | 'letter', value: string }`.  
   - Call OpenAI/Claude (or similar) with a short system prompt for ISL explanation.  
   - Return `{ explanation: string }`.

2. **Sign Language client**  
   - In LearnSign, add an “Explain” button per word/letter (or one “Explain” that uses the currently selected or last-played sign).  
   - On click, `fetch(yourApiUrl, { method: 'POST', body: JSON.stringify({ type, value }) })`.  
   - Show `explanation` in a modal or inline panel.

3. **Config**  
   - Add an env or config value for the AI API base URL (e.g. main app origin when embedded, or your backend URL). Use that for all Sign Language AI calls.

4. **Secrets**  
   - Store LLM API keys only on the backend (env vars); never expose them in the client. **Groq:** set `GROQ_API_KEY` in `backend/.env` (free key at https://console.groq.com). Optional: `GROQ_MODEL` (default `llama-3.1-8b-instant`; or `llama-3.3-70b-versatile`, `qwen2-72b-instant`). The backend calls `https://api.groq.com/openai/v1/chat/completions`.

---

## Summary

| AI feature | Helps with | Main implementation |
|------------|------------|---------------------|
| Explain this sign | Understanding, memory | Backend LLM + button in LearnSign |
| Normalize / suggest | Better Convert input, use of 4 words | Backend LLM before `sign()` |
| Gloss API | Future vocabulary, clarity | Backend LLM → gloss list; map to existing animations where possible |
| Sign recognition | Practice, feedback | MediaPipe + classifier (client or server) |
| Conversation tutor | Q&A, navigation | Backend LLM + chat UI |

Starting with **“Explain this sign”** gives you a clear, small scope: one new endpoint, one new UI surface, and no changes to the existing animation pipeline.

---

## Implemented integration (Groq)

- **Backend** ([dsatm-main/dsatm-main/backend/server.js](../../backend/server.js)): `llmChat()` helper calling Groq `https://api.groq.com/openai/v1/chat/completions` (free tier: Llama 3.1 8B, etc.); routes `POST /api/sign-language/explain`, `normalize`, `gloss`, `chat`. CORS allows the Sign Language client origin.
- **Client config** ([signtranslator/learnsign/client/src/Config/config.js](signtranslator/learnsign/client/src/Config/config.js)): `aiApiBase` (empty = same-origin `/api` when embedded; or set `REACT_APP_AI_API_BASE` for standalone).
- **Learn Sign:** "Explain" button per letter and word; modal shows Grok explanation.
- **Convert:** "Normalize with AI" and "Show glosses" buttons; message and gloss list displayed.
- **Navbar:** "Ask AI" opens chat modal; sends to `/api/sign-language/chat`, shows reply.
