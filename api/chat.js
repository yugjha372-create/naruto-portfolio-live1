export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key not configured in Vercel.' }), { status: 500 });
    }

    try {
        const { contents, system_instruction } = await req.json();

        // Convert Gemini 'contents' format to OpenAI/DeepSeek 'messages' format
        const messages = [];
        
        // Add system prompt if exists
        if (system_instruction?.parts?.[0]?.text) {
            messages.push({ role: 'system', content: system_instruction.parts[0].text });
        }
        
        // Add conversation history
        if (Array.isArray(contents)) {
            for (const item of contents) {
                const role = item.role === 'model' ? 'assistant' : 'user';
                const content = item.parts?.[0]?.text || '';
                if (content) {
                    messages.push({ role, content });
                }
            }
        }

        const deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                stream: true,
                temperature: 0.9,
                max_tokens: 2048
            })
        });

        if (!deepseekRes.ok) {
            const err = await deepseekRes.text();
            console.error("API Error:", err);
            return new Response(JSON.stringify({ error: `API Error: ${err}` }), { status: 500 });
        }

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        (async () => {
            const reader = deepseekRes.body.getReader();
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
                        const trimmed = line.trim();
                        if (trimmed.startsWith('data: ')) {
                            const dataStr = trimmed.slice(6);
                            if (dataStr === '[DONE]') continue;
                            
                            try {
                                const data = JSON.parse(dataStr);
                                const text = data.choices?.[0]?.delta?.content;
                                if (text) {
                                    // Send it back in the format the frontend expects
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
