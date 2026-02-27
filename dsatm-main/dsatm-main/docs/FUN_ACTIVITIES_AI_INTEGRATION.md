# AI/ML Integration Guide – Fun Activities Hub

This document describes **what** AI/ML can add to each activity, **how** it helps learners, and **how** it is implemented using the existing **Groq** backend (same API key and `llmChat` as Sign Language).

---

## Implementation status (complete)

All features below are **implemented** and wired end-to-end.

| Layer | Status |
|-------|--------|
| **Backend** | All routes under `/api/fun-activities/` in `backend/server.js` using `llmChat()` and `GROQ_API_KEY`. |
| **Frontend API** | `src/utils/funActivitiesApi.js` – `phonicsExplain`, `spellingWords`, `spellingHint`, `storyGenerate`, `storyPassage`, `storyExplain`, `memoryHint`, `writingFeedback`. |
| **Phonics Fun** | “Explain this sound (AI)” button (uses last-played letter), modal with explanation. |
| **Spelling Wizard** | Words from API on load; “New set” refetches; “AI hint” button opens modal with AI hint; first-letter hint kept. |
| **Story Creator** | When setting/character/goal are chosen, story is generated via API; loading state; “Read my story” TTS unchanged. |
| **Story Explorer** | “Get new story (AI)” adds a story from API; “Explain this story (AI)” and “Ask a question (AI)” modals. |
| **Memory Master** | “Get a hint (AI)” once per game for one unmatched card; hint shown in modal. |
| **Writing Artist** | After “Check”, AI feedback is requested and shown below the correct/incorrect message. |

---

## Previous state (no cloud AI)

| Activity | Current behavior | Limitation |
|----------|------------------|------------|
| **Phonics Fun** | Fixed letter sounds; browser TTS | No personalization, no “why” explanations |
| **Spelling Wizard** | Fixed 12 words; hint = first letter only | Small vocabulary; no adaptive difficulty |
| **Story Creator** | Template sentences picked by hash | Stories feel repetitive, not truly generated |
| **Story Explorer** | Fixed list of 5 short stories | No new content, no comprehension help |
| **Memory Master** | Fixed 8 emoji pairs | No adaptation; no verbal hints |
| **Writing Artist** | Fixed shapes/letters and heuristic check | No real “did I form this well?” feedback |

---

## 1. Phonics Fun – “Explain this sound” (AI)

**What:** Add an “Explain” button per letter. When the user taps it, the app asks the backend for a **short, kid-friendly explanation** of how to make the sound or how to remember it (e.g. “The letter A says ‘ay’ like in ‘apple’; open your mouth and say it.”).

**How it helps:** Supports understanding and retention, especially for struggling or neurodiverse learners who benefit from explicit cues.

**How to implement:**
- **Backend:** New route `POST /api/fun-activities/phonics-explain` with body `{ letter: "A" }`. Use existing `llmChat()` with a system prompt like: “You are a friendly phonics tutor. In 1–2 short sentences, explain how to make or remember the sound for the letter [A]. Use simple language for children.”
- **Frontend:** In `PhonicsFun.jsx`, add an “Explain” control (e.g. per letter or one “Explain” for the last-played letter). On click, `fetch` the new endpoint and show the response in a small modal or collapsible panel.

---

## 2. Spelling Wizard – Dynamic words + smarter hints (AI)

**What:**
- **Word source:** Instead of a fixed `WORDS` array, the backend returns a **short list of words** (e.g. by grade level or topic: “CVC words”, “animals”, “week 3”). Still simple words so spelling is the focus.
- **Smarter hint:** Optional “AI hint” that gives a **meaning clue** or **sentence** without giving the word (e.g. “It’s an animal that says meow”) so the learner can try to spell it.

**How it helps:** More variety and relevance; hints that support vocabulary and reasoning, not just “first letter”.

**How to implement:**
- **Backend:** Two routes (or one with `action`):
  - `POST /api/fun-activities/spelling-words` – body `{ level: "easy" | "medium", topic?: "animals" }` – returns `{ words: ["cat", "dog", ...] }` (Groq generates a small list of suitable words).
  - `POST /api/fun-activities/spelling-hint` – body `{ word: "cat" }` – returns `{ hint: "It's a furry animal that says meow." }` (Groq in one short sentence, no word).
- **Frontend:** On load or “New set”, call the words endpoint and use the returned list. Add “AI hint” button that calls the hint endpoint and shows the text; keep existing “first letter” hint as well.

---

## 3. Story Creator – LLM-generated stories (AI)

**What:** Keep the same UI (user picks setting, character, goal). Instead of `generateStory()` with templates, send those three choices to the backend and have **Groq generate a short, coherent story** (3–5 sentences) that includes that setting, character, and goal.

**How it helps:** Unique stories each time; more engaging and reading practice; feels “made for me”.

**How to implement:**
- **Backend:** `POST /api/fun-activities/story-generate` with body `{ setting, character, goal }`. Prompt: “Write a short children’s story (3–5 sentences) with this setting, character, and goal. Use simple words and a clear beginning, middle, and end.”
- **Frontend:** In `StoryCreator.jsx`, when the user has selected all three, call this API instead of `generateStory()`. Show loading state, then display the returned story and keep “Read story” (browser TTS) as is.

---

## 4. Story Explorer – More stories + comprehension (AI)

**What:**
- **New passages:** Backend can return **new short passages** (e.g. by topic or level) so the app isn’t limited to the hardcoded `STORIES` array.
- **Comprehension help:** “Ask a question” or “Explain this sentence” – user taps a sentence or the whole story and gets a **short explanation or a simple comprehension question** (e.g. “What did the bird do?”).

**How it helps:** More reading material; supports comprehension and reflection without a human tutor.

**How to implement:**
- **Backend:**
  - `POST /api/fun-activities/story-passage` – body `{ topic?: "nature", level?: "easy" }` – returns `{ title, text }`.
  - `POST /api/fun-activities/story-explain` – body `{ text: "sentence or full story", type: "explain" | "question" }` – returns `{ explanation }` or `{ question, suggestedAnswer }`.
- **Frontend:** Add “Get new story” that calls the passage endpoint and appends or replaces a story. Add “Explain” / “Ask a question” that sends the current passage (or selected sentence) to the explain endpoint and shows the result in a modal.

---

## 5. Memory Master – Verbal hints (AI)

**What:** Add an “AI hint” that describes **one of the face-down cards** in words (e.g. “One of the cards is an animal that barks”) without saying which position. The learner uses that to plan their next move.

**How it helps:** Adds a language-reasoning layer and supports learners who benefit from verbal cues.

**How to implement:**
- **Backend:** `POST /api/fun-activities/memory-hint` with body `{ emoji: "🐶" }`. Prompt: “In one short sentence, describe this emoji for a memory game hint. Do not say the word dog or the emoji. Example: ‘An animal that barks.’”
- **Frontend:** After the user has seen a card (or at random for one unseen card), offer “Get a hint” that calls this API with that emoji and shows the sentence. Optionally limit to one hint per game to keep it fair.

---

## 6. Writing Artist – Encouragement and tips (AI)

**What:** Keep existing stroke/structure logic. Add **AI feedback** after “Check”: a short **encouraging message** or **one concrete tip** (e.g. “Try making the circle rounder” or “Good job closing the shape!”) based on the current item (shape/letter) and optionally the simple validation result (correct/incorrect).

**How it helps:** Motivates and gives a next step without needing real handwriting ML.

**How to implement:**
- **Backend:** `POST /api/fun-activities/writing-feedback` with body `{ itemId: "circle", correct: boolean }`. Prompt: “The learner is practicing [circle]. They got it [correct/incorrect]. Reply with one short, kind sentence: either one specific tip to improve or praise. No markdown.”
- **Frontend:** After the existing `validateDrawing()` and showing correct/incorrect, call this API and show the AI message below the result.

---

## Suggested order of implementation

1. **Phonics “Explain this sound”** – One route, one button; reuses same pattern as Sign Language Explain.
2. **Story Creator generate** – One route; big perceived upgrade (real AI stories).
3. **Spelling Wizard words + AI hint** – Two routes; more variety and better hints.
4. **Story Explorer new passage + explain** – Two routes; more content and comprehension.
5. **Memory Master verbal hint** – One route; nice extra.
6. **Writing Artist feedback** – One route; encouragement layer.

---

## Shared backend setup

- Use the **existing** Groq backend and `llmChat()` in `backend/server.js`.
- Add all new routes under `/api/fun-activities/...` (e.g. `phonics-explain`, `spelling-words`, `spelling-hint`, `story-generate`, `story-passage`, `story-explain`, `memory-hint`, `writing-feedback`).
- Frontend: from the main app (Vite), call `/api/...` (proxied to the same backend). No new API keys; reuse `GROQ_API_KEY`.

---

## Summary table

| Activity | AI feature | Learner benefit | Backend route (new) |
|----------|------------|-----------------|----------------------|
| Phonics Fun | Explain this sound | Understand and remember sounds | `POST /api/fun-activities/phonics-explain` |
| Spelling Wizard | Word lists + AI hint | More words; meaning-based hints | `spelling-words`, `spelling-hint` |
| Story Creator | Generate story | Unique, engaging stories | `story-generate` |
| Story Explorer | New passage + explain/question | More texts; comprehension | `story-passage`, `story-explain` |
| Memory Master | Verbal hint for a card | Language-reasoning support | `memory-hint` |
| Writing Artist | Encouragement/tip after check | Motivation and one clear tip | `writing-feedback` |

---

## Backend routes (reference)

All use `POST`, JSON body, and return JSON. Base URL is the same as the main app (proxy to backend).

| Route | Body | Response |
|-------|------|----------|
| `/api/fun-activities/phonics-explain` | `{ letter }` | `{ explanation }` |
| `/api/fun-activities/spelling-words` | `{ level?, topic? }` | `{ words: [] }` |
| `/api/fun-activities/spelling-hint` | `{ word }` | `{ hint }` |
| `/api/fun-activities/story-generate` | `{ setting, character, goal }` | `{ story }` |
| `/api/fun-activities/story-passage` | `{ topic?, level? }` | `{ title, text }` |
| `/api/fun-activities/story-explain` | `{ text, type: "explain"\|"question" }` | `{ explanation }` or `{ question, suggestedAnswer }` |
| `/api/fun-activities/memory-hint` | `{ emoji }` | `{ hint }` |
| `/api/fun-activities/writing-feedback` | `{ itemId, correct }` | `{ feedback }` |
