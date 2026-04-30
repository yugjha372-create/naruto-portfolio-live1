
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contents, system_instruction } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on Vercel' });
  }

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        system_instruction,
        generationConfig: { temperature: 0.85, maxOutputTokens: 300, topP: 0.95 }
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Gemini Proxy Error:', error);
    res.status(500).json({ error: 'Failed to communicate with Gemini' });
  }
}
