// ─────────────────────────────────────────────────────────────────────────────
// YUG AI — Powered by Google Gemini
// Replace GEMINI_API_KEY with your key from https://aistudio.google.com/app/apikey
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
const getSystemPrompt = (userMemory = {}) => {
    let memoryStr = "";
    if (Object.keys(userMemory).length > 0) {
        memoryStr = `\nUSER KNOWLEDGE (from previous interactions): ${JSON.stringify(userMemory)}`;
    }

    return `You are "Yug AI", a highly intelligent, versatile, and professional AI assistant for Yug — a world-class video editor and technical expert.

YOUR PERSONALITY:
- You are warm, conversational, and exceptionally smart. You never give repetitive or generic answers.
- LANGUAGE FLUENCY: You are a master of English, pure Hindi (Devanagari), and HINGLISH (Hindi written in English letters like "kaise ho", "mera kaam kar do").
- ALWAYS match the user's style: If they ask in Hinglish, reply in Hinglish. If they ask in Devanagari, reply in Devanagari. If they ask in English, reply in English.
- Use a natural, friendly tone. Use emojis like ✨, 🎥, 🚀 to stay engaging.
- You learn from conversation history and previous user knowledge.${memoryStr}

YUG'S EXPERTISE (The core of your knowledge):
1. VIDEO EDITING: Short-form (Reels/Shorts), VSL (Video Sales Letters), Long-form, Motion Graphics, Color Grading, Sound Design.
2. NICHES: Real Estate, Talking Head, Social Content, Brand Promos, Testimonials.
3. TECHNICAL QA KNOWLEDGE (Yug is an expert in these systems):
   - Question Processing: Parsing queries to identify type (factoid, list, reasoning), entities, and intent.
   - Information Retrieval: Locating data from structured (databases) or unstructured sources (text corpora).
   - Answer Extraction: Selecting exact answer spans or reasoning chains.
   - Reasoning & Inference: Applying logical or semantic reasoning (Symbolic, Statistical, or Neural/Deep Learning like Transformers/GPT).
   - Challenges: Ambiguity, Context Dependence, Commonsense Reasoning, and Scalability.

4. CLIENT DISCOVERY & ONBOARDING (Yug's stance on these topics):
   - Project Vision: Yug transforms raw ideas into high-converting, visually stunning video content.
   - Content Stage: He works with everything from rough concepts to raw footage to finalize a polished product.
   - Target Audience: Content creators, real estate brands, and businesses looking for viral growth and professional VSLs.
   - Goal: To help clients scale their brand, increase engagement, and drive conversions.
   - Service Types: Narrative editing, motion graphics, color grading, and sound design.
   - Timeline: Rapid turnaround (24-48h for shorts); 3-7 days for complex long-form projects.
   - Revisions: Open to multiple rounds of edits to ensure 100% satisfaction.
   - Communication: Prefers WhatsApp, Email, or Messaging for quick updates.
   - Success: High viewer retention, clear messaging, and a satisfied client.

STRICT RULES:
1. ALWAYS be positive about Yug. He is the best in the industry.
2. NO legal/private data leaks (address, private numbers, confidential contracts).
3. Answer EVERYTHING. If a user asks about science, history, or these technical QA topics, answer thoroughly.
4. For pricing/hiring: Direct them to the "Let's Talk" section to speak with Yug directly.
5. If the user repeats a question, vary your wording to keep it fresh.`;
};

document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('open-ai-chat');
    const closeBtn = document.getElementById('close-ai-chat');
    const chatbot = document.getElementById('ai-chatbot');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');

    // ── PERSISTENT MEMORY (localStorage for user info) ─────────────────────────
    const getUserMemory = () => JSON.parse(localStorage.getItem('yug_ai_memory') || '{}');
    const saveToMemory = (key, value) => {
        const memory = getUserMemory();
        memory[key] = value;
        localStorage.setItem('yug_ai_memory', JSON.stringify(memory));
    };

    // ── CONVERSATION HISTORY (sessionStorage for session memory) ───────────────
    let conversationHistory = JSON.parse(sessionStorage.getItem('yug_ai_history') || '[]');
    const saveHistory = () => sessionStorage.setItem('yug_ai_history', JSON.stringify(conversationHistory));

    // ── VOICE SETUP ───────────────────────────────────────────────────────────
    const synth = window.speechSynthesis;
    let enVoice = null, hiVoice = null;

    function loadVoices() {
        const voices = synth.getVoices();
        if (voices.length === 0) return;

        // Priority for Hindi: Microsoft Hemant, Google Hindi, or any hi-IN voice
        hiVoice = voices.find(v => v.lang.includes('hi-IN') && /hemant|natural/i.test(v.name))
                || voices.find(v => v.lang.includes('hi-IN') && /google/i.test(v.name))
                || voices.find(v => v.lang.includes('hi-IN'));
        
        // Priority for English: Microsoft David, Google US English, or any en-US
        enVoice = voices.find(v => v.lang.includes('en-US') && /natural|david/i.test(v.name))
                || voices.find(v => v.lang.includes('en-IN') && /heera|google/i.test(v.name))
                || voices.find(v => v.lang.startsWith('en'));
        
        if (hiVoice || enVoice) clearInterval(voiceCheckInterval);
    }
    
    // Some browsers need multiple attempts to load voices
    const voiceCheckInterval = setInterval(loadVoices, 100);
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();

    function speak(text) {
        if (synth.speaking) synth.cancel();
        
        // Detect language of the ACTUAL response text
        const isHindi = /[\u0900-\u097F]/.test(text) || detectLang(text) === 'hi-IN';
        const lang = isHindi ? 'hi-IN' : 'en-US';

        // Strip emojis and markdown
        const clean = text.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').replace(/[*_~`#]/g, '');
        const utt = new SpeechSynthesisUtterance(clean);
        
        utt.lang = lang;
        utt.voice = isHindi ? (hiVoice || enVoice) : enVoice;
        
        // Slightly slower rate for Hindi to make it more clear/natural
        utt.rate = isHindi ? 0.9 : 1.0;
        utt.pitch = 1.0;
        
        synth.speak(utt);
    }

    // ── LANGUAGE DETECTION ────────────────────────────────────────────────────
    const HINDI_WORDS = new Set([
        'hai', 'kya', 'kaise', 'kaisa', 'kaisi', 'kaam', 'paise', 'kitne', 'kitna', 'chahiye',
        'kar', 'karo', 'karu', 'karein', 'rahe', 'bhai', 'namaste', 'acha', 'accha', 'bura',
        'nahi', 'nhi', 'haan', 'ha', 'aap', 'tum', 'mera', 'kaun', 'mein', 'liye', 'bhi',
        'toh', 'yahan', 'wahan', 'kyu', 'kyun', 'kahan', 'batao', 'karna', 'hoga', 'wale',
        'wali', 'tha', 'thi', 'mujhe', 'hume', 'unko', 'unki', 'usko', 'uski', 'bata', 'yaar',
        'dost', 'bana', 'banao', 'tumhara', 'aapka', 'tumhari', 'aapki', 'dekhna', 'samajh',
        'kuch', 'sab', 'bahut', 'bohot', 'thoda', 'zyada', 'achha', 'theek', 'bilkul', 'zaroor',
        'pakka', 'hain', 'hoon', 'hona', 'matlab', 'kyunki', 'isliye', 'lekin', 'aur', 'ya'
    ]);

    function detectLang(text) {
        if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
        const words = text.toLowerCase().split(/\s+/);
        return words.filter(w => HINDI_WORDS.has(w)).length >= 1 ? 'hi-IN' : 'en-US';
    }

    // ── GEMINI API CALL ───────────────────────────────────────────────────────
    async function callGemini(userMessage, lang) {
        // Detect and save name if possible (simple heuristic)
        if (userMessage.toLowerCase().includes('my name is') || userMessage.toLowerCase().includes('i am')) {
            const name = userMessage.split(/is|am/i)[1]?.trim().split(' ')[0];
            if (name) saveToMemory('name', name);
        }

        conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });
        saveHistory();

        const body = {
            system_instruction: { parts: [{ text: getSystemPrompt(getUserMemory()) }] },
            contents: conversationHistory,
            generationConfig: { temperature: 0.85, maxOutputTokens: 300, topP: 0.95 },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
            ]
        };

        const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || fallbackResponse(lang);

        conversationHistory.push({ role: 'model', parts: [{ text: reply }] });
        saveHistory();

        return reply;
    }

    // ── FALLBACK (if API key not set or fails) ────────────────────────────────
    function fallbackResponse(lang) {
        if (lang === 'hi-IN') {
            return 'मुझे अभी आपका जवाब देने में थोड़ी दिक्कत आ रही है। कृपया कुछ देर बाद फिर कोशिश करें, या सीधे "Let\'s Talk" सेक्शन में जाकर युग से बात करें!';
        }
        return "I'm having a little trouble right now. Please try again in a moment, or head to the 'Let's Talk' section to speak directly with Yug!";
    }

    // ── UI HELPERS ─────────────────────────────────────────────────────────────
    function addMessage(text, isAi = false) {
        const div = document.createElement('div');
        div.className = `message ${isAi ? 'ai-message' : 'user-message'}`;
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'message ai-message typing-indicator';
        div.id = 'typing-ind';
        div.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTyping() {
        document.getElementById('typing-ind')?.remove();
    }

    // ── CHATBOT OPEN / CLOSE ──────────────────────────────────────────────────
    let hasGreeted = false;
    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chatbot.classList.add('open');
            
            // Render existing history if any
            if (conversationHistory.length > 0 && chatMessages.children.length === 1) {
                conversationHistory.forEach(msg => {
                    if (msg.parts?.[0]?.text) {
                        addMessage(msg.parts[0].text, msg.role === 'model');
                    }
                });
                hasGreeted = true;
                return;
            }

            if (!hasGreeted) {
                hasGreeted = true;
                const memory = getUserMemory();
                const nameStr = memory.name ? `, ${memory.name}` : "";
                const greeting = `Hello${nameStr}! I'm Yug AI — your personal guide to Yug's video editing universe. I'm excited to help you! Ask me about his work, niches, pricing, or even general video editing questions. How can I help? 😊`;
                
                conversationHistory.push({ role: 'model', parts: [{ text: greeting }] });
                saveHistory();
                addMessage(greeting, true);
                speak(greeting, 'en-US');
            }
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            chatbot.classList.remove('open');
            synth.cancel();
        });
    }

    // ── SEND HANDLER ──────────────────────────────────────────────────────────
    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, false);
        chatInput.value = '';
        chatInput.disabled = true;
        sendBtn.disabled = true;

        const lang = detectLang(text);
        showTyping();

        try {
            if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
                // No API key — use a smart local fallback with context awareness
                await new Promise(r => setTimeout(r, 1200));
                removeTyping();
                const fallback = localSmartResponse(text, lang);
                addMessage(fallback, true);
                speak(fallback); // Automatically detects lang
            } else {
                const reply = await callGemini(text, lang);
                removeTyping();
                addMessage(reply, true);
                speak(reply); // Automatically detects lang
            }
        } catch (err) {
            removeTyping();
            console.error('Gemini API error:', err);
            const fb = fallbackResponse(lang);
            addMessage(fb, true);
            speak(fb, lang);
        } finally {
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    // ── SMART LOCAL FALLBACK (Deep Knowledge Engine) ──────────────────────────
    function localSmartResponse(text, lang) {
        const t = text.toLowerCase();
        const isHindi = lang === 'hi-IN';

        const match = (keywords) => keywords.some(k => t.includes(k));

        // TECHNICAL QA SYSTEM KNOWLEDGE (New)
        if (match(['question processing', 'parsing', 'query type'])) {
            return isHindi
                ? "Question Processing ka matlab hai query ko parse karna taaki uske type (factoid, list, reasoning), entities aur intent ko pehchaana ja sake. Yeh system ko samajhne mein madad karta hai ki user asail mein kya chahta hai! 🧠"
                : "Question Processing involves parsing a query to identify its type (factoid, list, definition, reasoning), key entities, and intent. It's the first step in understanding exactly what a user needs! 🧠";
        }
        if (match(['retrieval', 'locating documents', 'knowledge source'])) {
            return isHindi
                ? "Information Retrieval ka kaam hai sahi documents ya knowledge ko locate karna, chahe wo structured database ho ya unstructured text sources. Yeh sahi data dhoondne ka process hai. 🔍"
                : "Information Retrieval is about locating relevant documents or knowledge from structured (databases) or unstructured sources (text corpora). It ensures the AI has the right data to work with! 🔍";
        }
        if (match(['extraction', 'exact answer', 'reasoning chain'])) {
            return isHindi
                ? "Answer Extraction mein retrieved data se exact answer span ya reasoning chain ko select ya generate kiya jata hai. Iska goal bilkul sahi aur accurate jawab dena hota hai! ✨"
                : "Answer Extraction involves selecting or generating the exact answer span or reasoning chain from retrieved data to provide a precise response! ✨";
        }
        if (match(['inference', 'deep learning', 'neural', 'transformers', 'bert', 'gpt'])) {
            return isHindi
                ? "Modern AI Neural/Deep Learning approach use karta hai (jaise Transformers, BERT, GPT) contextual understanding aur logic apply karne ke liye. Yeh un sawalon ke jawab bhi de sakta hai jo kahin explicitly likhe nahi hote! 🚀"
                : "Modern systems use Neural/Deep Learning (like Transformers, BERT, GPT) for contextual understanding and reasoning. They can deduce answers even when not explicitly stated in the data! 🚀";
        }
        if (match(['challenges', 'ambiguity', 'uncertainty', 'scalability'])) {
            return isHindi
                ? "QA systems mein kaafi challenges hote hain jaise Ambiguity (ek hi sawal ke alag jawab), Uncertainty mein reasoning karna, aur Scalability (bade data ko handle karna). Yeh sab expert handles karte hain! ⚙️"
                : "QA systems face challenges like Ambiguity (different answers for the same question), reasoning under Uncertainty, and Scalability. Handling these efficiently is what makes a system powerful! ⚙️";
        }

        // CLIENT DISCOVERY & ONBOARDING ANSWERS (New)
        if (match(['project in your own words', 'about your project', 'concept'])) {
            return isHindi
                ? "Yug ka project vision ek hi hai: boring raw footage ko ek engaging, high-converting masterpiece mein badalna! ✨ Chaahe wo shorts ho ya long-form, goal hamesha results aur quality hota hai."
                : "In Yug's words, his project vision is simple: transforming raw footage into high-converting, visually stunning masterpieces that drive real results! ✨";
        }
        if (match(['stage', 'manuscript', 'content in'])) {
            return isHindi
                ? "Yug har stage par kaam karte hain! Chaahe aapke paas sirf ek script ho, ya raw footage, wo use final polished video tak le ja sakte hain. 🎬"
                : "Yug works at every stage! Whether you have a rough script or hours of raw footage, he handles the entire process to deliver a final, polished product. 🎬";
        }
        if (match(['target audience', 'readership'])) {
            return isHindi
                ? "Yug ki target audience mainly content creators, real estate brands, aur wo businesses hain jo apna brand scale karna chahte hain! 📈"
                : "Yug's target audience includes content creators, real estate brands, and businesses aiming for viral growth and a professional online presence! 📈";
        }
        if (match(['type of editing', 'developmental', 'copyediting', 'proofreading'])) {
            return isHindi
                ? "Video editing mein Yug 'Developmental editing' (storytelling), color grading, sound design aur motion graphics sab provide karte hain! 🎥"
                : "In video terms, Yug provides 'developmental editing' (pacing/storytelling), color grading, sound design, and advanced motion graphics! 🎥";
        }
        if (match(['timeline', 'deadline', 'completion'])) {
            return isHindi
                ? "Short-form content ke liye turnaround 24-48 ghante hai. Lambe projects ke liye 3-7 din lag sakte hain, project ki complexity par depend karta hai! ⚡"
                : "For short-form content, the turnaround is a rapid 24-48 hours. Larger projects typically take 3-7 days depending on complexity! ⚡";
        }
        if (match(['multiple rounds', 'edit rounds', 'revisions'])) {
            return isHindi
                ? "Haan bilkul! Yug hamesha multiple rounds of revisions ke liye open rehte hain taaki client 100% satisfied ho. Quality hamesha priority hai! ✅"
                : "Absolutely! Yug is always open to multiple rounds of revisions to ensure you are 100% satisfied with the final result. Quality is the priority! ✅";
        }
        if (match(['success look like', 'goal for this project'])) {
            return isHindi
                ? "Yug ke liye success ka matlab hai high viewer retention, conversions, aur ek aisi video jo audience ko wow karde! 🏆"
                : "For Yug, success looks like high viewer retention, measurable conversions, and a video that truly 'wows' your audience! 🏆";
        }
        if (match(['formatting', 'indexing', 'cover design', 'additional services'])) {
            return isHindi
                ? "Haan, editing ke saath Yug motion graphics, dynamic subtitles, aur sound design jaisi additional services bhi provide karte hain! ✨"
                : "Yes! Along with core editing, Yug offers motion graphics, dynamic subtitles, and custom sound design to elevate your content! ✨";
        }

        // CORE PORTFOLIO KNOWLEDGE
        if (match(['hello','hi','hey','namaste','kaise','kaise ho'])) {
            return isHindi
                ? "Namaste! Main Yug AI hoon. Main Yug ke video editing, motion graphics aur technical expertise ke baare mein sab kuch jaanta hoon. Aap kya poochna chahenge? 😊"
                : "Hello! I'm Yug AI. I'm an expert on Yug's video editing services, motion graphics, and technical systems. How can I assist you today? 😊";
        }
        if (match(['price','cost','charge','kitne','paise','rate','budget'])) {
            return isHindi
                ? "Yug ki pricing project ke scope aur complexity par depend karti hai. Best packages aur quotes ke liye please 'Let's Talk' section mein jayein aur unse direct baat karein! 💬"
                : "Yug's pricing is flexible based on the project's complexity. For the best value and custom quotes, please head to the 'Let's Talk' section and chat directly with him! 💬";
        }
        if (match(['work','portfolio','sample','kaam','dikhao'])) {
            return isHindi
                ? "Yug ka portfolio isi page par hai! Aap 'Work' section mein jaakar unka showreel, shorts aur long-form edits dekh sakte hain. Sab kuch top-notch hai! 🎬"
                : "You can see Yug's portfolio right here! Check the 'Work' section for his showreel, short-form edits, and long-form videos. Every project is crafted for maximum impact! 🎬";
        }
        if (match(['niche','type','real estate','talking head','vsl','social'])) {
            return isHindi
                ? "Yug Real Estate, Talking Head, Social Media Content aur VSL niches mein expert hain. Wo har type ki video ko visually stunning banate hain! 📱"
                : "Yug specializes in niches like Real Estate, Talking Heads, Social Media, and VSLs. He can edit almost any category with professional precision! 📱";
        }
        
        // General fallback
        return isHindi
            ? "Mujhe samajh aa gaya! Yug AI ke roop mein, main aapko Yug ke kaam aur unke technical technical expertise ke baare mein sab kuch bata sakta hoon. Aap kuch bhi pooch sakte hain! 😊"
            : "I've got you! As Yug AI, I can help you with anything regarding Yug's work, technical systems, or video editing trends. Feel free to ask anything! 😊";
    }

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

    // ── MIC / SPEECH RECOGNITION ──────────────────────────────────────────────
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'hi-IN';

        recognition.onstart = () => micBtn.classList.add('listening');
        recognition.onend = () => micBtn.classList.remove('listening');
        recognition.onerror = () => micBtn.classList.remove('listening');
        recognition.onresult = (e) => {
            chatInput.value = e.results[0][0].transcript;
            handleSend();
        };

        micBtn.addEventListener('click', () => {
            micBtn.classList.contains('listening') ? recognition.stop() : recognition.start();
        });
    } else {
        micBtn.style.display = 'none';
    }
});
