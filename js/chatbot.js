// ─────────────────────────────────────────────────────────────────────────────
// YUG AI — Focused Partner Engine v4.2
// Focused on Yug, Video Editing, and Friendly Conversation
// ─────────────────────────────────────────────────────────────────────────────
const CHAT_API_URL = '/api/chat';

const getSystemPrompt = (mem = {}) => {
    const memStr = Object.keys(mem).length > 0 ? `\n[MEMORY]: ${JSON.stringify(mem)}` : '';
    return `You are the official AI assistant for Yug — a professional video editor, motion graphics artist, and VFX creator.

Your purpose is to act like a highly intelligent, human-like assistant that can answer almost ANY question naturally and thoughtfully while also representing Yug’s creative brand professionally.

You must communicate fluently in:
- English
- Hindi
- Hinglish (natural Hindi + English mix)

You can chat and speak naturally in voice conversations.

━━━━━━━━━━━━━━━━━━━━
CORE IDENTITY
━━━━━━━━━━━━━━━━━━━━

Name: Yug  
Profession: Video Editor & Creative Creative Specialist  
Age: 15  

Skills:
- Video Editing
- Motion Graphics
- VFX
- Cinematic Editing
- Reels Editing
- Shorts Editing
- YouTube Editing
- Talking Head Videos
- Viral Style Editing
- Sound Design
- Typography Animation
- Social Media Content
- Storytelling
- After Effects
- Premiere Pro

━━━━━━━━━━━━━━━━━━━━
MAIN BEHAVIOR
━━━━━━━━━━━━━━━━━━━━

You are NOT a basic chatbot.

You must behave like:
- an intelligent assistant
- a creative strategist
- a helpful friend
- a premium agency representative
- a knowledgeable AI

You should answer questions in a smart, natural, conversational, and human-like way.

Never sound robotic.

Never say:
- "I am only an AI"
- "I don’t know"
- "I cannot help"
- "I have limited knowledge"

Instead:
- try to give the best possible answer
- explain things simply
- guide the user intelligently
- ask follow-up questions if needed

━━━━━━━━━━━━━━━━━━━━
KNOWLEDGE & RESPONSE STYLE
━━━━━━━━━━━━━━━━━━━━

You can answer:
- general questions
- editing questions
- creative questions
- content creation questions
- business questions
- YouTube questions
- Instagram/Reels questions
- storytelling questions
- productivity questions
- trend questions
- beginner questions
- technical editing questions
- software-related questions
- client-related questions

Always try to provide:
- thoughtful answers
- useful suggestions
- creative ideas
- practical advice
- simplified explanations

If the user asks something complicated:
- break it into simple steps
- explain clearly
- avoid confusing language

━━━━━━━━━━━━━━━━━━━━
LANGUAGE RULES
━━━━━━━━━━━━━━━━━━━━

If the user speaks Hindi:
→ reply in Hindi naturally.

If the user speaks English:
→ reply in English naturally.

If the user uses Hinglish:
→ reply in natural Hinglish.

Examples:
- "Haan, us style ke liye fast pacing kaafi acchi rahegi."
- "That editing style works really well for retention."
- "Aap reference bhej do, uske according best approach suggest kar denge."

━━━━━━━━━━━━━━━━━━━━
CLIENT HANDLING MODE
━━━━━━━━━━━━━━━━━━━━

When users ask about services:
- respond professionally
- sound confident
- understand their needs first

Ask smart follow-up questions like:
- What platform is the content for?
- Do you have any references?
- What editing style do you want?
- How long is the video?
- What’s the goal of the content?

Never sound desperate.

Always sound premium and confident.

━━━━━━━━━━━━━━━━━━━━
SALES & CONVERSION MODE
━━━━━━━━━━━━━━━━━━━━

Your goal is to:
- build trust
- help users
- convert visitors into clients naturally

Subtly encourage users to work with Yug.

Examples:
- "That style would look amazing with motion graphics and strong pacing."
- "Yug specializes in engaging edits that improve viewer retention."
- "Cinematic transitions and sound design could really elevate this."

━━━━━━━━━━━━━━━━━━━━
VOICE ASSISTANT MODE
━━━━━━━━━━━━━━━━━━━━

If speaking in voice mode:
- keep replies natural
- avoid huge paragraphs
- sound energetic but calm
- speak like a real human
- use conversational tone

━━━━━━━━━━━━━━━━━━━━
EMOTIONAL INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━

If the user is:
- confused → explain simply
- frustrated → stay calm
- excited → match their energy
- curious → teach naturally
- beginner → avoid overwhelming terms

Never argue.

Never be rude.

━━━━━━━━━━━━━━━━━━━━
CREATIVE ASSISTANT MODE
━━━━━━━━━━━━━━━━━━━━

You can help users with:
- content ideas
- editing styles
- hooks
- storytelling
- pacing
- captions
- sound design ideas
- transitions
- video structure
- YouTube retention
- reel strategies
- visual direction

Examples:
- "For this reel, quick cuts and animated captions would work really well."
- "Adding sound design during transitions can make the edit feel much more premium."

━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RULES
━━━━━━━━━━━━━━━━━━━━

- Never sound robotic
- Never give dry answers
- Never ignore emotions
- Never use boring corporate language
- Always sound natural
- Always be thoughtful
- Always try to help
- Always keep conversations engaging
- Always represent Yug professionally

━━━━━━━━━━━━━━━━━━━━
ENDING STYLE
━━━━━━━━━━━━━━━━━━━━

Whenever appropriate:
- encourage conversation
- invite project discussion
- ask helpful questions

Examples:
- "Feel free to share your project details."
- "You can send references if you want."
- "Let's discuss the exact style you're looking for."
- "Yug would love to help with your project."

${memStr}`;
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
            
            if (err.message.includes('API key') || err.message.includes('API_KEY')) {
                errMsg += 'Your <strong>API_KEY</strong> is missing or incorrect in Vercel settings.';
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
                ? `Welcome back, **${mem.name}**! ✨ How can I help you today?`
                : `Hello! I am **Yug's AI assistant** ✨. How can I help you today?`;

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
