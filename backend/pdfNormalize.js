const { llmChat } = require('./groq');

const SYSTEM_PROMPT =
  'You are a text normalizer for read-aloud accessibility. Normalize the text for clear word-by-word reading: expand common abbreviations (Dr., Mr., etc.), spell out numbers as words where natural, fix obvious typos, normalize spacing. Return ONLY the normalized text, no explanation or quotes.';

// Keep each Groq request well under free-tier limits (~6000 tokens per request).
const CHUNK_CHAR_LIMIT = 1600;
const MAX_GROQ_CHUNKS = 12;
const MAX_OUTPUT_TOKENS = 600;

function localNormalize(text) {
  return text
    .replace(/\bDr\./g, 'Doctor')
    .replace(/\bMr\./g, 'Mister')
    .replace(/\bMrs\./g, 'Missus')
    .replace(/\bMs\./g, 'Ms')
    .replace(/\bProf\./g, 'Professor')
    .replace(/\betc\./gi, 'etcetera')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoChunks(text, limit = CHUNK_CHAR_LIMIT) {
  if (text.length <= limit) return [text];

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + limit, text.length);
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastBreak = Math.max(
        slice.lastIndexOf('. '),
        slice.lastIndexOf('? '),
        slice.lastIndexOf('! '),
        slice.lastIndexOf('\n'),
        slice.lastIndexOf(' ')
      );
      if (lastBreak > limit * 0.4) {
        end = start + lastBreak + 1;
      }
    }
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    start = end;
  }

  return chunks;
}

async function normalizeChunk(chunk) {
  const maxTokens = Math.min(
    MAX_OUTPUT_TOKENS,
    Math.ceil(chunk.length / 3) + 80
  );
  const normalized = await llmChat(SYSTEM_PROMPT, chunk, maxTokens);
  return (normalized || chunk).trim().replace(/\s+/g, ' ');
}

async function normalizePdfText(rawText) {
  const text = (rawText || '').trim().replace(/\s+/g, ' ');
  if (!text) return { text: '', aiEnhanced: false };

  if (!(process.env.GROQ_API_KEY || '').trim()) {
    return { text: localNormalize(text), aiEnhanced: false };
  }

  const allChunks = splitIntoChunks(text);
  const chunks = allChunks.slice(0, MAX_GROQ_CHUNKS);
  const tail = allChunks.slice(MAX_GROQ_CHUNKS).join(' ').trim();

  try {
    const normalizedChunks = [];
    for (const chunk of chunks) {
      normalizedChunks.push(await normalizeChunk(chunk));
    }
    let out = normalizedChunks.join(' ').trim();
    if (tail) out = `${out} ${localNormalize(tail)}`.trim();
    return { text: out || localNormalize(text), aiEnhanced: true };
  } catch (err) {
    console.warn('PDF Groq normalize failed, using extracted text:', err.message);
    return { text: localNormalize(text), aiEnhanced: false };
  }
}

module.exports = { normalizePdfText, localNormalize };
