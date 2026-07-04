const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
const GROQ_BASE = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

async function llmChat(systemPrompt, userMessage, maxTokens = 300) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in environment. Get a free key at https://console.groq.com');
  }
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty response from Groq');
  return content;
}

const KNOWN_WORDS = ['TIME', 'HOME', 'PERSON', 'YOU'];

module.exports = { llmChat, KNOWN_WORDS };
