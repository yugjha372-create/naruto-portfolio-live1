export const config = { runtime: 'edge' };

const MODEL = 'gemini-2.5-pro';

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key not configured.' }), { status: 500 });
    }

    const { contents, system_instruction, generationConfig } = await req.json();

    const GEMINI_STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const geminiRes = await fetch(GEMINI_STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
            system_instruction,
            generationConfig: {
                temperature: 1.0,
                maxOutputTokens: 8192,
                topP: 0.95,
                topK: 64,
                ...generationConfig
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
            ]
        })
    });

    if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        return new Response(JSON.stringify({ error: `Gemini API error: ${errorText}` }), { status: geminiRes.status });
    }

    // Stream the SSE response from Gemini directly to the client
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
                buffer = lines.pop(); // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6).trim();
                        if (jsonStr === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(jsonStr);
                            const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (chunk) {
                                await writer.write(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
                            }
                        } catch (_) {}
                    }
                }
            }
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
}
