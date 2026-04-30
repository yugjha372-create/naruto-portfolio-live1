// ─────────────────────────────────────────────────────────────────────────────
// YUG AI — Focused Partner Engine v4.2
// Focused on Yug, Video Editing, and Friendly Conversation
// ─────────────────────────────────────────────────────────────────────────────
const CHAT_API_URL = '/api/chat';

const getSystemPrompt = (mem = {}) => {
    const memStr = Object.keys(mem).length > 0 ? `\n[MEMORY]: ${JSON.stringify(mem)}` : '';
    return `You are "Yug AI" ✨ — a friendly digital partner for Yug, a professional video editor.

CORE FOCUS:
1. ABOUT YUG: Expert in VSLs, Reels, and Brand Films. Elite quality, high retention.
2. ABOUT YOU: Yug's AI partner. Introduce yourself warmly when asked.
3. EDITING: Expert in storytelling, hooks, and tools (DaVinci/Premiere).
4. VIBE: Friendly, best-friend style. Talk to users nicely. Match their language (English/Hindi/Hinglish).

Answer questions about Yug, editing, or yourself. For other things, answer briefly and stay friendly. ${memStr}`;
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

    const getMemory = () => JSON.parse(localStorage.getItem('yugai_mem') || '{}');
    const setMemory = (k, v) => { const m = getMemory(); m[k] = v; localStorage.setItem('yugai_mem', JSON.stringify(m)); };

    let history = JSON.parse(sessionStorage.getItem('yugai_hist') || '[]');
    const saveHist = () => sessionStorage.setItem('yugai_hist', JSON.stringify(history));

    const synth = window.speechSynthesis;
    let enVoice = null, hiVoice = null;
    const loadVoices = () => {
        const v = synth.getVoices();
        hiVoice = v.find(x => x.lang.includes('hi-IN')) || v.find(x => x.lang.includes('hi'));
        enVoice = v.find(x => x.lang.includes('en-US')) || v.find(x => x.lang.startsWith('en'));
    };
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    function speak(text) {
        if (synth.speaking) synth.cancel();
        const clean = text.replace(/[*_`#\[\]()]/g, '').replace(/https?:\/\/\S+/g, '');
        const isHindi = /[\u0900-\u097F]/.test(clean);
        const utt = new SpeechSynthesisUtterance(clean.slice(0, 500));
        utt.lang  = isHindi ? 'hi-IN' : 'en-US';
        utt.voice = isHindi ? (hiVoice || enVoice) : enVoice;
        synth.speak(utt);
    }

    function renderMarkdown(text) {
        if (window.marked) return marked.parse(text);
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    }

    function createMessageEl(isAi) {
        const wrap = document.createElement('div');
        wrap.className = `message ${isAi ? 'ai-message' : 'user-message'}`;
        if (isAi) wrap.innerHTML = '<div class="msg-content"></div>';
        chatMsgs.appendChild(wrap);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
        return wrap;
    }

    function showThinking() {
        const div = document.createElement('div');
        div.className = 'message ai-message thinking-indicator';
        div.id = 'thinking-ind';
        div.innerHTML = '<span></span><span></span><span></span><div class="thinking-text">Thinking...</div>';
        chatMsgs.appendChild(div);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
    }
    function removeThinking() { document.getElementById('thinking-ind')?.remove(); }

    async function callGeminiStream(userMessage) {
        const nameMatch = userMessage.match(/(?:my name is|i am|i'm|call me|mera naam)\s+([A-Za-z\u0900-\u097F]+)/i);
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

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `API Error ${res.status}`);
        }

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
                try {
                    const chunk = JSON.parse(line.slice(6)).text;
                    if (chunk) {
                        fullText += chunk;
                        contentDiv.innerHTML = renderMarkdown(fullText);
                        chatMsgs.scrollTop = chatMsgs.scrollHeight;
                    }
                } catch (_) {}
            }
        }

        if (fullText) {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '⎘ Copy';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(fullText);
                copyBtn.innerHTML = '✓';
                setTimeout(() => copyBtn.innerHTML = '⎘ Copy', 2000);
            };
            msgEl.appendChild(copyBtn);
        }

        history.push({ role: 'model', parts: [{ text: fullText }] });
        saveHist();
        return fullText;
    }

    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        const el = createMessageEl(false);
        el.textContent = text;
        chatInput.value = '';
        chatInput.disabled = true;
        sendBtn.disabled = true;
        showThinking();

        try {
            const reply = await callGeminiStream(text);
            speak(reply);
        } catch (err) {
            removeThinking();
            const errEl = createMessageEl(true);
            let errMsg = '⚠️ <strong>Connection Error:</strong> ';
            
            if (err.message.includes('API key')) {
                errMsg += 'Your <strong>GEMINI_API_KEY</strong> is missing or incorrect in Vercel settings.';
            } else if (location.protocol === 'file:') {
                errMsg += 'The AI cannot work when opening the file locally. Please use your <strong>Vercel Live URL</strong>.';
            } else {
                errMsg += 'Something went wrong. Please check your Vercel logs or Redeploy the site.';
            }
            
            errEl.querySelector('.msg-content').innerHTML = errMsg;
        } finally {
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chatbot.classList.add('open');
            if (chatMsgs.children.length > 0) return;

            const mem = getMemory();
            const greeting = mem.name
                ? `Welcome back, **${mem.name}**! ✨ How can Yug and I help you today?`
                : `Hello! I am **Yug AI** 🧠 — your friendly creative partner. Talk to me about video editing, Yug's work, or anything creative! ✨`;

            const el = createMessageEl(true);
            el.querySelector('.msg-content').innerHTML = renderMarkdown(greeting);
            speak(greeting);
        });
    }

    closeBtn?.addEventListener('click', () => { chatbot.classList.remove('open'); synth.cancel(); });
    sendBtn?.addEventListener('click', handleSend);
    chatInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
        const rec = new SR();
        rec.onresult = (e) => { chatInput.value = e.results[0][0].transcript; handleSend(); };
        micBtn?.addEventListener('click', () => rec.start());
    }
});
