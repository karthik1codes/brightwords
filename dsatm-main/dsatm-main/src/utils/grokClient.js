const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'

/**
 * Simple Grok client.
 * Expects the API key in VITE_XAI_API_KEY and optional model in VITE_XAI_MODEL.
 */
export async function callGrok({ messages, temperature = 0.7 }) {
  const apiKey = import.meta.env.VITE_XAI_API_KEY
  const model = import.meta.env.VITE_XAI_MODEL || 'grok-2-latest'

  if (!apiKey) {
    throw new Error('Missing VITE_XAI_API_KEY. Add it to your .env.local file.')
  }

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
    }),
  })

  if (!response.ok) {
    let errorMessage = `Grok API error: ${response.status}`
    try {
      const errorText = await response.text()
      if (errorText) {
        errorMessage = errorText
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()
  const content =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.delta?.content ||
    ''

  return typeof content === 'string' ? content : JSON.stringify(content)
}

