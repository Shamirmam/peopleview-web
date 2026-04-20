export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { system, messages } = req.body

  if (!system || !messages) {
    return res.status(400).json({ error: 'Missing system or messages' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 300,
        system,
        messages,
      }),
    })

    const data = await response.json()

    if (data.error) {
      return res.status(400).json({ error: data.error.message })
    }

    return res.json({ text: data.content[0].text.trim() })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
