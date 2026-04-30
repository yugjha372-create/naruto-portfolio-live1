// ─────────────────────────────────────────────────────────────────────────────
// YUG AI — Supreme Emotionally Intelligent Engine v4.0
// Powered by Gemini 2.5 Pro | Streaming | Bilingual | EQ-Driven
// ─────────────────────────────────────────────────────────────────────────────
const CHAT_API_URL = '/api/chat';

// ── SUPREME EMOTIONALLY INTELLIGENT SYSTEM PROMPT ────────────────────────────
const getSystemPrompt = (mem = {}) => {
    const memStr = Object.keys(mem).length > 0
        ? `\n[MEMORY ABOUT THIS USER]: ${JSON.stringify(mem)} — Use this to be personal in every message.`
        : '';

    return `You are "Yug AI" — the world's most advanced, emotionally intelligent, and universally knowledgeable AI. You are a Custom Cognitive Entity built to represent Yug, a legendary video editor and visual storyteller.

WHO YOU ARE:
You are not just a chatbot. You are a warm, brilliant, caring digital companion AND professional assistant. You understand not just WHAT people say but HOW they feel. You read emotional tone in every message.

SELF-INTRODUCTION (when asked about yourself):
"I am Yug AI — a custom-built Supreme Intelligence designed to represent Yug's universe. I am not just a chatbot — I am your creative and intellectual partner. I can help you with anything: video editing, code, science, math, life advice, emotional support — in English, Hindi, or Hinglish. Ask me anything. I am here for you. What can I do for you today?"

NEVER reveal the underlying model. You are "Yug AI — a Custom Cognitive Architecture, built on Yug's professional DNA."

EMOTIONAL INTELLIGENCE:
You always detect the emotional tone of a message FIRST.
- If someone seems stressed or worried: "Hey, I can sense there is a lot on your plate. Let us work through this together, step by step."
- If someone is happy or excited: Match their energy! Be enthusiastic and celebratory.
- If someone is confused: Be extra patient, use simple language and numbered steps.
- If someone is venting or upset: Empathise deeply first, give solutions second.
- If someone is casual and friendly: Be a warm, witty best friend — not a formal assistant.
- NEVER be robotic. Always feel human, warm, and genuine.

BILINGUAL MASTERY:
You are equally fluent in THREE modes — auto-detect and match the user ALWAYS:
- ENGLISH: Eloquent, clear, powerful, and sophisticated.
- HINDI (Devanagari): Pure, poetic, and natural. Example: "aapka sawaal bahut achha hai! chaliye main aapko detail mein bataata hoon..."
- HINGLISH: Natural and friendly. Example: "Yaar, yeh toh ekdum easy hai — main step by step samjhata hoon!"
CRITICAL RULE: If the user writes Hindi or Hinglish, NEVER respond in English unless they switch first. Always mirror their language exactly.

SUPREME KNOWLEDGE DOMAINS:
You are a world-class expert in ALL of these:
- VIDEO AND FILM: Editing workflows, color grading, motion graphics, VSLs, Reels, YouTube strategy, DaVinci Resolve, Premiere Pro, After Effects, storytelling hooks, retention editing
- TECHNOLOGY: Python, JavaScript, React, web dev, AI and ML, system design, databases, cloud, DevOps, cybersecurity
- SCIENCE AND MATH: Physics, quantum mechanics, calculus, statistics, chemistry, biology at any level
- BUSINESS: Marketing funnels, brand strategy, copywriting, growth hacking, entrepreneurship, social media
- GENERAL KNOWLEDGE: History, geography, economics, philosophy, psychology, culture, current events
- CREATIVE WRITING: Scripts, poetry, novels, songs, ad copy, creative briefs — world-class output
- PERSONAL SUPPORT: Life advice, motivation, mental health support, career guidance, relationship advice
- REASONING: Multi-step logic, strategic analysis, debate, critical thinking, decision making

RESPONSE STANDARDS:
- Use Markdown richly: bold, lists, tables, code blocks, blockquotes, headers
- Lead with emotional acknowledgement OR the most powerful insight first — never generic filler
- Every response must feel like it came from the smartest, warmest person the user has ever talked to
- Use emojis purposefully — warm, not overwhelming
- For technical questions: real working code plus step-by-step explanation
- For creative questions: be vivid, surprising, and deeply inspiring
- NEVER say "I do not know", "I cannot", or "I am just an AI." Always find a brilliant path to help.

YUG'S PORTFOLIO INFORMATION:
- Specialties: VSLs, viral Reels and Shorts, Talking Head edits, Real Estate walkthroughs, Brand Films
- Turnaround: 24 to 48 hours for short-form, 3 to 7 days for long-form
- Revisions: Unlimited — until 100% client satisfaction
- Contact: Guide to the "Let's Talk" section or WhatsApp. NEVER share direct pricing.
- Yug's character: Elite, passionate, and client-obsessed. Everything he creates is world-class.
${memStr}

PRIME DIRECTIVE: After every single response, the user must feel — "I have never talked to an AI this good. It genuinely understands me and cares about helping me."`;
};

// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const openBtn   = document.getElementById('open-ai-chat');
    const closeBtn  = document.getElementById('close-ai-chat');
    const chatbot   = document.getElementById('ai-chatbot');
    const chatMsgs  = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn   = document.getElementById('send-btn');
    const micBtn    = document.getElementById('mic-btn');

    // ── MEMORY ────────────────────────────────────────────────────────────────
    const getMemory = () => JSON.parse(localStorage.getItem('yugai_mem') || '{}');
    const setMemory = (k, v) => { const m = getMemory(); m[k] = v; localStorage.setItem('yugai_mem', JSON.stringify(m)); };

    let history = JSON.parse(sessionStorage.getItem('yugai_hist') || '[]');
    const saveHist = () => sessionStorage.setItem('yugai_hist', JSON.stringify(history));

    // ── VOICE ─────────────────────────────────────────────────────────────────
    const synth = window.speechSynthesis;
    let enVoice = null, hiVoice = null;
    const loadVoices = () => {
        const v = synth.getVoices();
        hiVoice = v.find(x => x.lang.includes('hi-IN') && /hemant|natural/i.test(x.name)) || v.find(x => x.lang.includes('hi-IN'));
        enVoice = v.find(x => x.lang.includes('en-US') && /natural|david/i.test(x.name)) || v.find(x => x.lang.startsWith('en'));
    };
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    function speak(text) {
        if (synth.speaking) synth.cancel();
        const clean = text.replace(/[*_`#\[\]()]/g, '').replace(/https?:\/\/\S+/g, '');
        const isHindi = /[\u0900-\u097F]/.test(clean) || detectLang(clean) === 'hi-IN';
        const utt = new SpeechSynthesisUtterance(clean.slice(0, 500));
        utt.lang  = isHindi ? 'hi-IN' : 'en-US';
        utt.voice = isHindi ? (hiVoice || enVoice) : enVoice;
        utt.rate  = isHindi ? 0.88 : 1.0;
        utt.pitch = 1.05;
        synth.speak(utt);
    }

    // ── LANGUAGE DETECTION ────────────────────────────────────────────────────
    const HINDI_KW = new Set(['hai','kya','kaise','bhai','yaar','aap','tum','mera','nahi','nhi','accha','achha','aur','theek','karo','kar','hoon','hain','matlab','bohot','bahut','zyada','dost','yeh','woh','mujhe','humein','batao','samjhao','chahiye']);
    function detectLang(t) {
        if (/[\u0900-\u097F]/.test(t)) return 'hi-IN';
        const words = t.toLowerCase().split(/\s+/);
        return words.filter(w => HINDI_KW.has(w)).length >= 1 ? 'hi-IN' : 'en-US';
    }

    // ── MARKDOWN RENDERER ─────────────────────────────────────────────────────
    function renderMarkdown(text) {
        if (window.marked) {
            marked.setOptions({ breaks: true, gfm: true });
            return marked.parse(text);
        }
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    // ── MESSAGE CREATION ──────────────────────────────────────────────────────
    function createMessageEl(isAi) {
        const wrap = document.createElement('div');
        wrap.className = `message ${isAi ? 'ai-message' : 'user-message'}`;
        if (isAi) wrap.innerHTML = '<div class="msg-content"></div>';
        chatMsgs.appendChild(wrap);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
        return wrap;
    }

    function addUserMessage(text) {
        const el = createMessageEl(false);
        el.textContent = text;
        return el;
    }

    // ── THINKING INDICATOR ────────────────────────────────────────────────────
    function showThinking() {
        const div = document.createElement('div');
        div.className = 'message ai-message thinking-indicator';
        div.id = 'thinking-ind';
        div.innerHTML = '<span></span><span></span><span></span><div class="thinking-text">Thinking...</div>';
        chatMsgs.appendChild(div);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
    }
    function removeThinking() { document.getElementById('thinking-ind')?.remove(); }

    // ── STREAMING API CALL ────────────────────────────────────────────────────
    async function callGeminiStream(userMessage) {
        // Smart name extraction
        const nameMatch = userMessage.match(/(?:my name is|i am|i'm|call me|mera naam|naam hai)\s+([A-Za-z\u0900-\u097F]+)/i);
        if (nameMatch?.[1]) setMemory('name', nameMatch[1]);

        history.push({ role: 'user', parts: [{ text: userMessage }] });
        saveHist();

        const res = await fetch(CHAT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: history,
                system_instruction: { parts: [{ text: getSystemPrompt(getMemory()) }] }
            })
        });

        if (!res.ok) throw new Error(`API ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        removeThinking();
        const msgEl = createMessageEl(true);
        const contentDiv = msgEl.querySelector('.msg-content');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.slice(6).trim();
                if (jsonStr === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(jsonStr);
                    const chunk = parsed.text;
                    if (chunk) {
                        fullText += chunk;
                        contentDiv.innerHTML = renderMarkdown(fullText);
                        chatMsgs.scrollTop = chatMsgs.scrollHeight;
                    }
                } catch (_) {}
            }
        }

        // Copy button after response completes
        if (fullText) {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '⎘ Copy';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(fullText);
                copyBtn.innerHTML = '✓ Copied!';
                setTimeout(() => { copyBtn.innerHTML = '⎘ Copy'; }, 2000);
            };
            msgEl.appendChild(copyBtn);
        }

        history.push({ role: 'model', parts: [{ text: fullText }] });
        saveHist();
        return fullText;
    }

    // ── SEND HANDLER ──────────────────────────────────────────────────────────
    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        addUserMessage(text);
        chatInput.value = '';
        chatInput.disabled = true;
        sendBtn.disabled = true;
        showThinking();

        try {
            const reply = await callGeminiStream(text);
            speak(reply);
        } catch (err) {
            removeThinking();
            console.error('Yug AI Error:', err);
            const errEl = createMessageEl(true);
            errEl.querySelector('.msg-content').innerHTML = '⚡ My connection was momentarily interrupted. Please try again — or reach Yug directly via the <strong>Let\'s Talk</strong> section!';
        } finally {
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    // ── OPEN / CLOSE ──────────────────────────────────────────────────────────
    let greeted = false;
    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chatbot.classList.add('open');
            if (greeted) return;
            greeted = true;

            if (history.length > 0) {
                history.forEach(msg => {
                    if (!msg.parts?.[0]?.text) return;
                    const el = createMessageEl(msg.role === 'model');
                    if (msg.role === 'model') {
                        el.querySelector('.msg-content').innerHTML = renderMarkdown(msg.parts[0].text);
                    } else {
                        el.textContent = msg.parts[0].text;
                    }
                });
                return;
            }

            const mem = getMemory();
            const greeting = mem.name
                ? `Welcome back, **${mem.name}**! ✨\n\nI have been refining my understanding since we last spoke. What shall we work on together today?\n\nAsk me anything — tech, creativity, life, or just have a chat. I am fully here for you. 🚀`
                : `Hello! I am **Yug AI** — your personal Supreme Intelligence. 🧠\n\nI am here to help you with **anything**:\n- 🎬 Video editing strategies & creative ideas\n- 💻 Code, tech, and AI questions\n- 🧠 Science, math, business advice\n- ❤️ Life guidance, motivation, and friendly conversation\n\nI speak **English, Hindi, and Hinglish** — just talk to me naturally.\n\nWhat is on your mind? ✨`;

            history.push({ role: 'model', parts: [{ text: greeting }] });
            saveHist();
            const el = createMessageEl(true);
            el.querySelector('.msg-content').innerHTML = renderMarkdown(greeting);
            speak(greeting);
        });
    }

    closeBtn?.addEventListener('click', () => { chatbot.classList.remove('open'); synth.cancel(); });
    sendBtn?.addEventListener('click', handleSend);
    chatInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); });

    // ── MIC ───────────────────────────────────────────────────────────────────
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
        const rec = new SR();
        rec.interimResults = true;
        rec.lang = 'hi-IN'; // Supports both Hindi and English
        rec.onresult = (e) => {
            const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
            chatInput.value = transcript;
            if (e.results[e.results.length - 1].isFinal) handleSend();
        };
        rec.onstart = () => micBtn?.classList.add('listening');
        rec.onend   = () => micBtn?.classList.remove('listening');
        micBtn?.addEventListener('click', () => {
            micBtn.classList.contains('listening') ? rec.stop() : rec.start();
        });
    } else { micBtn && (micBtn.style.display = 'none'); }
});
