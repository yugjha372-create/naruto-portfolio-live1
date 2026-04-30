export const config = { runtime: 'edge' };

// Using the most stable high-end model
const MODEL = 'gemini-1.5-pro';

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables.");
        return new Response(JSON.stringify({ error: 'API key not configured in Vercel. Please add GEMINI_API_KEY to your project settings.' }), { status: 500 });
    }

    try {
        const { contents, system_instruction, generationConfig } = await req.json();

        const GEMINI_STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

        const geminiRes = await fetch(GEMINI_STREAM_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                system_instruction,
                generationConfig: {
                    temperature: 0.9,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                    ...generationConfig
                }
            })
        });

        if (!geminiRes.ok) {
            const err = await geminiRes.text();
            console.error("Gemini API Error:", err);
            return new Response(JSON.stringify({ error: `Gemini Error: ${err}` }), { status: 500 });
        }

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        (async () => {
            const reader = geminiRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop();

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text) {
                                    await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                                }
                            } catch (e) {}
                        }
                    }
                }
            } catch (e) {
                console.error("Stream error:", e);
            } finally {
                await writer.write(encoder.encode('data: [DONE]\n\n'));
                await writer.close();
            }
        })();

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (err) {
        console.error("Handler error:", err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
