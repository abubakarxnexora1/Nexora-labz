/* ============================================================
   NEXORA LABZ — AI Chatbot (chatbot.js)
   ------------------------------------------------------------
   • Works 100% offline: built-in knowledge base with
     keyword / intent matching (no API key needed).
   • Future-proof: plug a real AI API (e.g. Claude / OpenAI)
     into the single clearly-marked hook function below.
   ============================================================ */
'use strict';

(function () {
  /* ----------------------------------------------------------
     CONFIG — ▶▶ EDIT THESE PLACEHOLDERS ◀◀
  ---------------------------------------------------------- */
  const CONFIG = {
    brand: 'Nexora Labz',
    owner: 'Abubakar Khan',
    phone: '+92 370 0018080',
    whatsapp: '923700018080',              // digits only — used to build wa.me links
    waMessage: 'Hi Abubakar, I saw your portfolio and I would like to talk.',
    github: 'https://github.com/abubakarxnexora1',
    linkedin: 'https://www.linkedin.com/in/nexora-abubakar/',
    instagram: 'https://www.instagram.com/abubakarxnexora/',
    facebook: 'https://www.facebook.com/profile.php?id=61595857236922',
    // ▶▶ keep in sync with the "Starting from" prices on services.html ◀▶
    pricingNote: 'Beginner-friendly starter prices — Landing page from $59 · Portfolio website from $79 · Business website from $149 · Design to code from $69 · Website animations from $29 (add-on) · Custom projects by quote. Final quote depends on scope.',
  };
  const WA_LINK = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.waMessage)}`;

  /* ----------------------------------------------------------
     KNOWLEDGE BASE — keyword/intent matching (offline brain)
     Each entry: { keys: [...], answer: '...' }
  ---------------------------------------------------------- */
  const KB = [
    {
      keys: ['hello', 'hi', 'hey', 'salam', 'assalam', 'good morning', 'good evening', 'yo'],
      answer: "Hey there! 👋 Welcome to Nexora Labz. I'm Nexi, the studio assistant.\n\nAsk me about Abubakar's services, projects, pricing, or how to get in touch.",
    },
    {
      keys: ['who are you', 'what is this', 'nexi'],
      answer: "I'm Nexi ⚡ — the friendly assistant of Nexora Labz, the web studio of Abubakar Khan. I can tell you about services, demo projects, skills, and how to hire him.",
    },
    {
      keys: ['who is abubakar', 'about abubakar', 'who is the owner', 'founder', 'developer?', 'about you', 'about him'],
      answer: "Abubakar Khan is a Frontend & Web Developer and the founder of Nexora Labz.\n\nHe's completing his Matriculation while pursuing a 3-year software diploma at Aptech, and he crafts fast, animated, pixel-perfect websites. He's currently expanding into Figma prototyping too.",
    },
    {
      keys: ['service', 'what do you offer', 'what can you do', 'offer'],
      answer: "Nexora Labz offers:\n\n• Landing Page\n• Portfolio Website\n• Business Website\n• Design to Code (Figma / PSD → code)\n• Website Animations (GSAP)\n• Custom Projects\n\nCheck the Services page for full details, or tell me about your project!",
    },
    {
      keys: ['project', 'portfolio', 'demo', 'work', 'show me'],
      answer: "There are 6 live demo projects on the Projects page:\n\n🍴 Restaurant website\n🏋️ Fitness / Gym landing page\n🏠 Real Estate listings\n🛍️ Fashion E-commerce store\n✈️ Travel & Tourism agency\n🚀 Tech Startup / SaaS landing\n\nEach one is a fully working mini-website. Want the link? Head to projects.html and hit “Live Demo”.",
    },
    {
      keys: ['price', 'pricing', 'cost', 'rate', 'how much', 'quote', 'budget'],
      answer: `Every project is quoted individually, but here's the idea:\n\n${CONFIG.pricingNote}\n\nFor an exact quote, drop a message via the Contact page — replies are usually fast. 📩`,
    },
    {
      keys: ['contact', 'email', 'phone', 'reach', 'get in touch'],
      answer: `You can reach Nexora Labz at:\n\n📞 Phone / WhatsApp: ${CONFIG.phone}\n💬 WhatsApp (fastest): open a direct chat from the WhatsApp button on any page.\n📸 Instagram: @abubakarxnexora\n📘 Facebook: Abubakar Khan\n\nOr use the contact form — for a quick reply, WhatsApp is best. 📩`,
    },
    {
      keys: ['hire', 'freelance', 'available', 'commission', 'collaborate'],
      answer: "Yes — Abubakar is open for freelance work and collaborations! 🚀\n\nThe quickest way to start: message him on WhatsApp or Instagram, or send a message through the Contact page with your idea, timeline, and budget range.",
    },
    {
      keys: ['skill', 'tech', 'stack', 'technologies', 'tools', 'language'],
      answer: "Core stack:\n\n• HTML5 & CSS3\n• JavaScript (ES6+)\n• Responsive Design\n• GSAP + ScrollTrigger animations\n• Canvas & SVG animation\n• Git & GitHub\n\nLearning next: Figma Prototyping 🎨 (coming soon).",
    },
    {
      keys: ['education', 'study', 'school', 'matric', 'aptech', 'diploma', 'degree'],
      answer: "Abubakar is completing his Matriculation while pursuing a 3-year software diploma at Aptech — combining strong fundamentals with hands-on client work through Nexora Labz.",
    },
    {
      keys: ['figma', 'prototype', 'design tool', 'ui design'],
      answer: "Figma Prototyping is the next skill arriving at Nexora Labz 🎨\n\nIt's marked “Coming Soon” — visit the Figma page to see the countdown and drop your email to get notified at launch.",
    },
    {
      keys: ['how long', 'delivery', 'timeline', 'deadline', 'fast'],
      answer: "Typical delivery:\n\n• Landing page — a few days\n• Full website — 1–3 weeks depending on scope\n\nEvery quote includes a clear timeline before work starts.",
    },
    {
      keys: ['responsive', 'mobile', 'seo', 'performance', 'speed'],
      answer: "Absolutely. Every Nexora Labz build is:\n\n📱 Fully responsive (mobile → desktop)\n⚡ Performance-optimized\n🔎 SEO-ready (meta tags, semantic HTML)\n♿ Accessible (keyboard + screen-reader friendly)",
    },
    {
      keys: ['thank', 'thanks', 'shukriya', 'great', 'awesome', 'nice', 'cool', 'love'],
      answer: "That's wonderful to hear! 💜 If you have a project in mind, the Contact page is one click away.",
    },
    {
      keys: ['bye', 'goodbye', 'see you', 'later'],
      answer: "Until next time! 👋 Abubakar wishes you an inspired day — come back anytime.",
    },
    {
      keys: ['whatsapp'],
      answer: `Sure! 💬 Tap any “WhatsApp” button on the site (or the Contact page) to open a direct chat with Abubakar at ${CONFIG.phone}.\n\nDirect link: ${WA_LINK}`,
    },
    {
      keys: ['theme', 'dark mode', 'light mode'],
      answer: "This site ships in one signature look — the dark nebula theme 🌙. There's no light mode by design, so the visuals always stay cinematic.",
    },
  ];

  const FALLBACKS = [
    "Interesting question! I'm best at talking about Nexora Labz — services, projects, skills, pricing and contact. Try one of the quick chips below. 🙂",
    "Hmm, that's beyond my brain (I run fully offline 🤖). Ask me about Abubakar's work, or reach him directly from the Contact page.",
  ];

  /* ----------------------------------------------------------
     ▶▶ AI API HOOK ◀◀
     Plug a real AI provider (e.g. Claude API) here later.
     1. Choose a provider and create a server-side proxy
        (NEVER ship a real API key in front-end code).
     2. Point API_URL at your proxy and remove the placeholder.
     3. Return the reply text (or null to use the offline KB).
     Return null by default → the built-in knowledge base answers.
  ---------------------------------------------------------- */
  async function callAIProvider(_message) {
    // const API_URL = '[YOUR_SERVER_PROXY_URL]';   // e.g. /api/claude — server-side only!
    // const API_KEY_PLACEHOLDER = 'sk-....';        // ▶▶ keep real keys on the server ◀◀
    //
    // Example (do not enable until you have a server proxy):
    // const res = await fetch(API_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message: _message }),
    // });
    // const data = await res.json();
    // return data.reply; // plain text
    return null; // ← offline knowledge base handles everything for now
  }

  /* ----------------------------------------------------------
     INTENT MATCHING
  ---------------------------------------------------------- */
  function matchKB(message) {
    const q = message.toLowerCase().trim();

    // exact-ish scoring: longer keyword matches win
    let best = null;
    let bestLen = 0;
    for (const entry of KB) {
      for (const key of entry.keys) {
        if (q.includes(key) && key.length > bestLen) {
          best = entry.answer;
          bestLen = key.length;
        }
      }
    }
    return best || FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }

  async function getReply(message) {
    const ai = await callAIProvider(message).catch(() => null);
    if (ai) return ai;
    return matchKB(message);
  }

  /* ----------------------------------------------------------
     UI — widget build & behaviour
  ---------------------------------------------------------- */
  const QUICK_CHIPS = ['Services', 'Projects', 'Pricing', 'Contact'];
  const GREETING =
    "Hi there! 👋 I'm Nexi, the Nexora Labz assistant.\n\nAsk me anything about Abubakar's services, demo projects, or how to hire him.";

  function init() {
    if (document.querySelector('.chat-panel')) return; // prevent double-init

    // ---- Inject DOM ----
    const panel = document.createElement('aside');
    panel.className = 'chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Nexora Labz chat assistant');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <header class="chat-head">
        <div class="chat-avatar" aria-hidden="true">N</div>
        <div class="chat-head-txt">
          <strong>Nexi — Nexora Labz</strong>
          <span>Online · replies instantly</span>
        </div>
        <button class="icon-btn chat-close" aria-label="Close chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </header>
      <div class="chat-body" aria-live="polite"></div>
      <div class="chat-chips" aria-label="Quick questions"></div>
      <form class="chat-input">
        <input type="text" placeholder="Type your message…" aria-label="Chat message" autocomplete="off">
        <button class="chat-send" type="submit" aria-label="Send message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
          </svg>
        </button>
      </form>`;

    const launcher = document.createElement('button');
    launcher.className = 'chat-launcher';
    launcher.setAttribute('aria-label', 'Open chat assistant');
    launcher.innerHTML = `
      <span class="launcher-ring" aria-hidden="true"></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
        <path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/>
      </svg>
      <span class="launcher-dot" aria-hidden="true"></span>`;

    document.body.appendChild(panel);
    document.body.appendChild(launcher);

    const body = panel.querySelector('.chat-body');
    const input = panel.querySelector('.chat-input input');
    const chipsWrap = panel.querySelector('.chat-chips');

    const addMsg = (text, who = 'bot') => {
      const el = document.createElement('div');
      el.className = `msg ${who}`;
      el.textContent = text;
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
      return el;
    };

    const showTyping = () => {
      const t = document.createElement('div');
      t.className = 'typing';
      t.innerHTML = '<i></i><i></i><i></i>';
      body.appendChild(t);
      body.scrollTop = body.scrollHeight;
      return t;
    };

    const addChips = (list) => {
      chipsWrap.innerHTML = '';
      list.forEach((label) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.addEventListener('click', () => handleUser(label));
        chipsWrap.appendChild(b);
      });
    };

    let busy = false;
    async function handleUser(text) {
      if (busy || !text.trim()) return;
      busy = true;
      addMsg(text, 'user');
      input.value = '';
      const typingEl = showTyping();

      const delay = 550 + Math.min(text.length * 12, 900);
      await new Promise((r) => setTimeout(r, delay));
      const reply = await getReply(text);
      typingEl.remove();
      addMsg(reply, 'bot');
      busy = false;
    }

    // ---- Events ----
    const setOpen = (open) => {
      panel.classList.toggle('open', open);
      panel.setAttribute('aria-hidden', String(!open));
      if (open) {
        setTimeout(() => input.focus(), 350);
        if (!body.childElementCount) {
          addMsg(GREETING, 'bot');
          addChips(QUICK_CHIPS);
        }
      }
    };
    launcher.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
    panel.querySelector('.chat-close').addEventListener('click', () => setOpen(false));
    panel.querySelector('.chat-input').addEventListener('submit', (e) => {
      e.preventDefault();
      handleUser(input.value);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('open')) setOpen(false);
    });

    // Expose for power users / future integrations
    window.NexiChat = { open: () => setOpen(true), close: () => setOpen(false), ask: handleUser };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
