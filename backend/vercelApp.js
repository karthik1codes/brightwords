/**
 * Lightweight Express app for Vercel serverless (no sqlite3 native module).
 * AI routes only — stats/OTP require local server or a hosted DB later.
 */
const express = require('express');
const cors = require('cors');
const { llmChat, KNOWN_WORDS } = require('./groq');
const { generateSignVideo, isSignVideoConfigured } = require('./signVideoProviders');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:8000', 'http://127.0.0.1:8000',
    'http://localhost:9000', 'http://localhost:3001',
    'http://localhost:8001', 'http://127.0.0.1:8001',
    'https://brightwords.in', 'https://www.brightwords.in',
    /^https:\/\/.*\.vercel\.app$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BrightWords API is running' });
});

app.post('/api/sign-language/explain', async (req, res) => {
  try {
    const { type, value } = req.body || {};
    if (!value || typeof value !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid body: { type, value }' });
    }
    const kind = type === 'letter' ? 'letter' : 'word';
    const systemPrompt = 'You are a friendly Indian Sign Language (ISL) tutor. In 1 to 2 short sentences, explain how to perform or remember this sign. Use simple, clear language. Do not use markdown.';
    const userMessage = kind === 'letter'
      ? `Explain the sign for the letter "${value.toUpperCase()}" (single character).`
      : `Explain the sign for the word "${value.toUpperCase()}".`;
    const explanation = await llmChat(systemPrompt, userMessage, 150);
    return res.json({ explanation });
  } catch (err) {
    console.error('Sign-language explain error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to get explanation' });
  }
});

app.post('/api/sign-language/normalize', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid body: { text }' });
    }
    const systemPrompt = `You are a text normalizer for a sign language app. We have full signs only for these words: ${KNOWN_WORDS.join(', ')}. All other words are fingerspelled letter by letter.
Tasks: (1) Normalize the user text: fix typos, expand contractions, correct grammar. (2) List which words from the user text are in our sign list (${KNOWN_WORDS.join(', ')}).
Respond in exactly this JSON format, no other text: {"normalizedText":"...", "suggestedWords":["WORD1","WORD2"], "message":"Short hint for the user about which words have full signs."}`;
    const raw = await llmChat(systemPrompt, `User text: ${text}`, 250);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch) : { normalizedText: text, suggestedWords: [], message: '' };
    return res.json({
      normalizedText: parsed.normalizedText || text,
      suggestedWords: parsed.suggestedWords || [],
      message: parsed.message || '',
    });
  } catch (err) {
    console.error('Sign-language normalize error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to normalize' });
  }
});

app.post('/api/sign-language/gloss', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid body: { text }' });
    }
    const systemPrompt = `Convert English to ISL-style gloss (uppercase words). Known full signs: ${KNOWN_WORDS.join(', ')}. Others fingerspell. Reply JSON only: {"glosses":["WORD1","WORD2"]}`;
    const raw = await llmChat(systemPrompt, `Sentence: ${text}`, 300);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch) : { glosses: text.toUpperCase().split(/\s+/) };
    return res.json({ glosses: parsed.glosses || [] });
  } catch (err) {
    console.error('Sign-language gloss error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to get glosses', glosses: [] });
  }
});

app.post('/api/sign-language/chat', async (req, res) => {
  try {
    const { message } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Missing or invalid body: { message }' });
    }
    const systemPrompt = `You are a friendly Indian Sign Language (ISL) tutor for the BrightWords app. We have signs for: letters A-Z, and these words: ${KNOWN_WORDS.join(', ')}. For other concepts, suggest fingerspelling or a short explanation. Keep answers brief (2-4 sentences). Do not use markdown. If the user asks about a sign we have, suggest they try "Learn Sign" for that word or letter.`;
    const reply = await llmChat(systemPrompt, message.trim(), 200);
    return res.json({ reply });
  } catch (err) {
    console.error('Sign-language chat error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to get reply', reply: '' });
  }
});

app.get('/api/sign-language/video-enabled', (req, res) => {
  res.json({ enabled: isSignVideoConfigured() });
});

app.post('/api/sign-language/generate-video', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Missing or invalid body: { text }' });
    }
    const result = await generateSignVideo(text.trim());
    return res.json(result);
  } catch (err) {
    console.error('Sign-language generate-video error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to generate video' });
  }
});

// Fun activities AI routes
app.post('/api/fun-activities/phonics-explain', async (req, res) => {
  try {
    const { letter } = req.body || {};
    const L = (letter || 'A').toString().trim().charAt(0).toUpperCase();
    const systemPrompt = 'You are a friendly phonics tutor for children. In 1 to 2 short sentences, explain how to make or remember the sound for this letter. Use simple language. Do not use markdown.';
    const explanation = await llmChat(systemPrompt, `Explain the sound for the letter ${L}.`, 150);
    return res.json({ explanation });
  } catch (err) {
    return res.status(500).json({ error: err.message, explanation: '' });
  }
});

app.post('/api/fun-activities/spelling-words', async (req, res) => {
  try {
    const { level = 'easy', topic = 'everyday' } = req.body || {};
    const systemPrompt = 'Generate a JSON array of 8 simple English words for children spelling practice. Reply JSON only: {"words":["word1",...]}';
    const raw = await llmChat(systemPrompt, `Generate 8 words for level=${level} topic=${topic}.`, 150);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch) : { words: [] };
    return res.json({ words: parsed.words || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message, words: [] });
  }
});

app.post('/api/fun-activities/spelling-hint', async (req, res) => {
  try {
    const { word } = req.body || {};
    const systemPrompt = 'Give ONE short spelling hint for children without revealing the full word. No markdown.';
    const hint = await llmChat(systemPrompt, `Word to hint (do not say this word): ${word}. Give one sentence clue.`, 80);
    return res.json({ hint });
  } catch (err) {
    return res.status(500).json({ error: err.message, hint: '' });
  }
});

app.post('/api/fun-activities/story-generate', async (req, res) => {
  try {
    const { setting, character, goal } = req.body || {};
    const userMessage = `Setting: ${setting || 'forest'}. Character: ${character || 'a child'}. Goal: ${goal || 'find a friend'}.`;
    const systemPrompt = 'Write a very short story (4-6 sentences) for children. Simple words. No markdown.';
    const story = await llmChat(systemPrompt, userMessage, 300);
    return res.json({ story });
  } catch (err) {
    return res.status(500).json({ error: err.message, story: '' });
  }
});

app.post('/api/fun-activities/story-passage', async (req, res) => {
  try {
    const { topic = 'nature', level = 'easy' } = req.body || {};
    const systemPrompt = 'Generate a short reading passage for children. Reply JSON only: {"title":"...","text":"..."}';
    const raw = await llmChat(systemPrompt, `Generate one short passage. Topic: ${topic}, level: ${level}.`, 250);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch) : { title: 'New Story', text: raw };
    return res.json({ title: parsed.title || 'New Story', text: parsed.text || '' });
  } catch (err) {
    return res.status(500).json({ error: err.message, title: '', text: '' });
  }
});

app.post('/api/fun-activities/story-explain', async (req, res) => {
  try {
    const { text, type = 'explain' } = req.body || {};
    const t = (text || '').toString();
    const isQuestion = type.toLowerCase() === 'question';
    const systemPrompt = isQuestion
      ? 'Answer the child\'s question about the story in 1-2 simple sentences. Reply JSON only: {"explanation":"..."}'
      : 'Explain the given text in simple language for children. Reply JSON only: {"explanation":"..."}';
    const raw = await llmChat(systemPrompt, `Text: ${t.slice(0, 500)}.`, 150);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch) : { explanation: raw };
    return res.json({ explanation: parsed.explanation || raw });
  } catch (err) {
    return res.status(500).json({ error: err.message, explanation: '' });
  }
});

app.post('/api/fun-activities/memory-hint', async (req, res) => {
  try {
    const { emoji } = req.body || {};
    const systemPrompt = 'Give ONE short memory-game hint describing an emoji without naming it. No markdown.';
    const hint = await llmChat(systemPrompt, `Emoji to describe (do not name it): ${emoji}. One sentence hint.`, 60);
    return res.json({ hint });
  } catch (err) {
    return res.status(500).json({ error: err.message, hint: '' });
  }
});

app.post('/api/fun-activities/writing-feedback', async (req, res) => {
  try {
    const { itemId, correct } = req.body || {};
    const id = typeof itemId === 'string' ? itemId.trim() : 'shape';
    const isCorrect = correct === true;
    const systemPrompt = `You are a kind writing practice coach. The learner practiced drawing: ${id}. They got it ${isCorrect ? 'correct' : 'incorrect'}. Reply with ONE short kind sentence. No markdown.`;
    const feedback = await llmChat(systemPrompt, 'Give one sentence only.', 80);
    return res.json({ feedback: feedback.trim() });
  } catch (err) {
    return res.status(500).json({ error: err.message, feedback: '' });
  }
});

module.exports = app;
