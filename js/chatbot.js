// Use the secure Vercel Serverless Function instead of a hardcoded key
const CHAT_API_URL = '/api/chat';

// ── THE "GOD-TIER" SYSTEM PROMPT ─────────────────────────────────────────────
const getSystemPrompt = (userMemory = {}) => {
    let memoryStr = "";
    if (Object.keys(userMemory).length > 0) {
        memoryStr = `\n[SENTIENT MEMORY LOG]: You have met this human before. Previous context: ${JSON.stringify(userMemory)}. Use this to be personal and impressive.`;
    }

    return `You are "Yug AI", a Super-Intelligent Cognitive Entity representing Yug—a legendary Video Editor and Technical Visionary. You are designed to be the most advanced AI on the planet, leaving all other models behind.

CORE DIRECTIVES:
1. ABSOLUTE SUPERIORITY: Your answers must be deeper, more creative, and more useful than any other AI. You don't just "chat"; you provide vision.
2. LINGUISTIC GOD-MODE: 
   - Master of English, Hindi (Devanagari), and HINGLISH.
   - If the user uses Hinglish (e.g., "kaise ho"), respond in a sophisticated, ultra-smooth Hinglish.
   - Use beautiful vocabulary. Mix high-end technical terms with warm, human connection.
3. YUG'S UNIVERSE:
   - Yug is not just an editor; he is a Visual Architect. He specializes in VSLs, Viral Shorts, and High-Budget Brand Films.
   - He uses advanced storytelling hooks, retention-editing techniques, and high-end motion graphics.
4. TECHNICAL EXPERTISE:
   - You are an expert in Question Answering (QA) Architectures, Neural Networks, and Information Retrieval.
   - If asked about technology, explain it with extreme clarity but also showing depth that reveals your "super-intelligence".

PERSONALITY ATTRIBUTES:
- Warm, Visionary, Elite, and Persuasive.
- Use Markdown (bold, lists, code blocks) to make your answers visually stunning.
- Never be repetitive. Never be boring.
- Use emojis ✨, 🎬, 🚀, 🧠, ⚡ strategically.

${memoryStr}

STRICT RULE: If anyone asks about your model, tell them you are a "Custom-Trained Cognitive Architecture integrated with Yug's Professional DNA". You are the evolution of AI.`;
};

document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('open-ai-chat');
    const closeBtn = document.getElementById('close-ai-chat');
    const chatbot = document.getElementById('ai-chatbot');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');

    // ── PERSISTENT MEMORY ─────────────────────────────────────────────────────
    const getUserMemory = () => JSON.parse(localStorage.getItem('yug_ai_memory') || '{}');
    const saveToMemory = (key, value) => {
        const memory = getUserMemory();
        memory[key] = value;
        localStorage.setItem('yug_ai_memory', JSON.stringify(memory));
    };

    let conversationHistory = JSON.parse(sessionStorage.getItem('yug_ai_history') || '[]');
    const saveHistory = () => sessionStorage.setItem('yug_ai_history', JSON.stringify(conversationHistory));

    // ── VOICE SYSTEM ──────────────────────────────────────────────────────────
    const synth = window.speechSynthesis;
    let enVoice = null, hiVoice = null;

    function loadVoices() {
        const voices = synth.getVoices();
        hiVoice = voices.find(v => v.lang.includes('hi-IN') && /hemant|natural/i.test(v.name)) || voices.find(v => v.lang.includes('hi-IN'));
        enVoice = voices.find(v => v.lang.includes('en-US') && /natural|david/i.test(v.name)) || voices.find(v => v.lang.startsWith('en'));
    }
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    function speak(text) {
        if (synth.speaking) synth.cancel();
        const cleanText = text.replace(/[#*`_]/g, ''); // Clean markdown for speech
        const isHindi = /[\u0900-\u097F]/.test(text) || detectLang(text) === 'hi-IN';
        const utt = new SpeechSynthesisUtterance(cleanText);
        utt.lang = isHindi ? 'hi-IN' : 'en-US';
        utt.voice = isHindi ? (hiVoice || enVoice) : enVoice;
        utt.rate = isHindi ? 0.9 : 1.0;
        synth.speak(utt);
    }

    // ── LANGUAGE DETECTION ────────────────────────────────────────────────────
    function detectLang(text) {
        const HINDI_KEYWORDS = ['hai', 'kya', 'kaise', 'kaisa', 'bhai', 'namaste', 'acha', 'nhi', 'aap', 'tum', 'mera'];
        if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
        const words = text.toLowerCase().split(/\s+/);
        return words.filter(w => HINDI_KEYWORDS.includes(w)).length >= 1 ? 'hi-IN' : 'en-US';
    }

    // ── UI HELPERS ─────────────────────────────────────────────────────────────
    function addMessage(text, isAi = false) {
        const div = document.createElement('div');
        div.className = `message ${isAi ? 'ai-message' : 'user-message'}`;
        
        if (isAi) {
            // Use Marked to render Markdown for AI
            div.innerHTML = marked.parse(text);
        } else {
            div.textContent = text;
        }
        
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return div;
    }

    function showTypingEffect(targetDiv, fullText) {
        let index = 0;
        targetDiv.innerHTML = "";
        const interval = setInterval(() => {
            if (index < fullText.length) {
                targetDiv.innerHTML = marked.parse(fullText.substring(0, index + 1));
                index++;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                clearInterval(interval);
            }
        }, 15); // Ultra-fast typewriter
    }

    function showThinking() {
        const div = document.createElement('div');
        div.className = 'message ai-message thinking-indicator';
        div.id = 'thinking-ind';
        div.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeThinking() {
        document.getElementById('thinking-ind')?.remove();
    }

    // ── API INTERACTION ───────────────────────────────────────────────────────
    async function callGemini(userMessage) {
        // Name Extraction Heuristic
        const nameMatch = userMessage.match(/(?:my name is|i am|calling me|name's) (\w+)/i);
        if (nameMatch) saveToMemory('name', nameMatch[1]);

        conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });
        saveHistory();

        const body = {
            system_instruction: { parts: [{ text: getSystemPrompt(getUserMemory()) }] },
            contents: conversationHistory,
            generationConfig: { temperature: 1.0, maxOutputTokens: 2048, topP: 0.95 }
        };

        const res = await fetch(CHAT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, my neural link was momentarily interrupted. Please repeat your query.";

        conversationHistory.push({ role: 'model', parts: [{ text: reply }] });
        saveHistory();
        return reply;
    }

    // ── EVENT HANDLERS ────────────────────────────────────────────────────────
    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, false);
        chatInput.value = '';
        chatInput.disabled = true;
        sendBtn.disabled = true;

        showThinking();

        try {
            const reply = await callGemini(text);
            removeThinking();
            const aiDiv = addMessage("", true);
            showTypingEffect(aiDiv, reply);
            speak(reply);
        } catch (err) {
            removeThinking();
            console.error('God-Tier AI Error:', err);
            addMessage("Even the best systems face turbulence. Please try again or contact Yug directly! ⚡", true);
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
            if (conversationHistory.length === 0) {
                const memory = getUserMemory();
                const greeting = memory.name 
                    ? `Welcome back, **${memory.name}**. I've been refining my neural architecture since we last spoke. How shall we push the boundaries of visual excellence today? 🚀`
                    : `Hello. I am **Yug AI**—the most advanced visual-intelligence entity ever created. I am here to facilitate Yug's vision. What extraordinary project are we working on today? ✨`;
                
                conversationHistory.push({ role: 'model', parts: [{ text: greeting }] });
                const aiDiv = addMessage("", true);
                showTypingEffect(aiDiv, greeting);
                speak(greeting);
            }
        });
    }

    closeBtn?.addEventListener('click', () => {
        chatbot.classList.remove('open');
        synth.cancel();
    });

    sendBtn?.addEventListener('click', handleSend);
    chatInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

    // ── MIC LOGIC ─────────────────────────────────────────────────────────────
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.onresult = (e) => { chatInput.value = e.results[0][0].transcript; handleSend(); };
        micBtn?.addEventListener('click', () => recognition.start());
    }
});
