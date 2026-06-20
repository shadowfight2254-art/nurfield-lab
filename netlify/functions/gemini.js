exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GEMINI_API_KEY not set in Netlify environment variables' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const messages = body.messages || [];
    const systemPrompt = body.system || '';

    // Convert messages to Gemini format
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof m.content === 'string' ? m.content : (m.content?.[0]?.text || '') }]
    }));

    const geminiBody = {
      system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      contents,
      generationConfig: { maxOutputTokens: 2000, temperature: 0.9 }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody)
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
