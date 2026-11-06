/* ==========================================================
   bafika | js/chatbot.js
   ویجت چت‌بات بافیکا. یک فایل مستقل است و خودش HTML و CSS لازم را به صفحه اضافه می‌کند.
   برای نمایش در هر صفحه فقط همین یک خط را قبل از </body> بگذار:
   <script src="js/chatbot.js?v=1" defer></script>
   (اگر این فایل را عوض کردی، عدد v=1 را به v=2 و ... تغییر بده تا مرورگرها نسخه جدید را بگیرند)
   ========================================================== */
(function () {
  "use strict";
  if (window.__bafikaChatLoaded) return;
  window.__bafikaChatLoaded = true;

  /* ---------- تنظیمات: فقط همین بخش را عوض کن ---------- */
  var CONFIG = {
    API_BASE: "https://bafika-chatbot.onrender.com", // آدرس بک‌اند روی Render
    SIDE: "left",              // جای دکمه: "left" (چپ) یا "right" (راست)
    MAX_HISTORY: 10,           // چند پیام آخر برای بک‌اند فرستاده شود (حافظه مکالمه)
    ATTEMPT_TIMEOUT_MS: 60000, // سرور رایگان Render بعد از بیکاری تا حدود ۵۰ ثانیه دیر بیدار می‌شود
    GREETING: "سلام! 👋 به بافیکا خوش آمدید. من دستیار هوشمند فروشگاه هستم. درباره محصولات دست‌باف، قیمت‌ها، جنس نخ و نحوه سفارش هر چه می‌خواهید بپرسید.",
    ERROR_TEXT: "متأسفانه الان ارتباط با دستیار برقرار نشد. لطفاً چند لحظه بعد دوباره تلاش کنید، یا در دایرکت اینستاگرام bafika_2026 یا با شماره ۰۹۳۷۱۴۳۹۷۵۰ پیام بدهید.",
    PILLS: [
      { label: "🧶 محصولات و قیمت‌ها", q: "چه محصولاتی دارید و قیمتشان چقدر است؟" },
      { label: "✨ جنس نخ‌ها", q: "جنس نخ‌ها چیست؟" },
      { label: "🛍️ نحوه سفارش", q: "چطور سفارش بدهم و ارسال چگونه است؟" }
    ]
  };
  /* ------------------------------------------------------ */

  var STORE_KEY = "bafika_chat_v1";
  var history = [];      // [{role:"user"|"assistant", content:"..."}]
  var busy = false;
  var warmed = false;
  var els = {};

  /* ---------- ابزارهای کوچک ---------- */
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // پاسخ مدل را امن و خوانا نشان می‌دهیم: HTML خنثی می‌شود، فقط **پررنگ** و فهرست خط‌تیره‌ای را تبدیل می‌کنیم
  function formatBot(text) {
    var out = escapeHtml(String(text).trim());
    out = out.replace(/^#{1,6}[ \t]*/gm, "");
    out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/^[ \t]*[-*•][ \t]+/gm, "• ");
    out = out.replace(/\n{3,}/g, "\n\n").replace(/\n/g, "<br>");
    return out;
  }

  // حافظه مکالمه بین صفحه‌های سایت (فقط تا وقتی تب باز است)
  function loadHistory() {
    try {
      var arr = JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]");
      if (!Array.isArray(arr)) return [];
      return arr.filter(function (m) {
        return m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string";
      }).slice(-30);
    } catch (e) { return []; }
  }
  function saveHistory() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-30))); } catch (e) { /* مهم نیست */ }
  }

  /* ---------- ساخت ظاهر ---------- */
  var CSS = `
  #bf-chat{--bf-ink:var(--ink,#2A2118);--bf-cream:var(--cream,#FFFFF0);--bf-teal:var(--wine,#008080);--bf-teal-dark:var(--wine-dark,#006666);--bf-gold:var(--gold,#CFB53B);--bf-line:var(--line,#E8DFC0);
    position:fixed;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9998;direction:rtl;font-family:inherit;line-height:1.5}
  #bf-chat[data-side="left"]{left:16px}
  #bf-chat[data-side="right"]{right:16px}
  #bf-chat *{box-sizing:border-box}
  #bf-chat button,#bf-chat input{font-family:inherit}

  #bf-overlay{position:fixed;top:0;right:0;bottom:0;left:0;z-index:1;background:rgba(42,33,24,.38);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);
    opacity:0;visibility:hidden;pointer-events:none;transition:opacity .28s ease,visibility .28s}
  #bf-overlay.bf-show{opacity:1;visibility:visible;pointer-events:auto}
  html.bf-lock,html.bf-lock body{overflow:hidden}
  html.bf-lock{scrollbar-gutter:stable}
  #bf-chat.bf-kb #bf-toggle{visibility:hidden}

  #bf-toggle{position:relative;z-index:3;width:58px;height:58px;border-radius:50%;background:var(--bf-ink);color:var(--bf-gold);border:2px solid var(--bf-gold);cursor:pointer;
    display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 6px 18px rgba(0,0,0,.28);transition:transform .2s ease,background .2s}
  #bf-toggle:hover{transform:scale(1.07);background:var(--bf-teal-dark)}
  #bf-toggle:focus-visible,#bf-close:focus-visible,#bf-send:focus-visible,#bf-pills button:focus-visible{outline:3px solid var(--bf-gold);outline-offset:2px}
  #bf-dot{position:absolute;top:2px;right:2px;width:13px;height:13px;border-radius:50%;background:var(--bf-teal);border:2px solid var(--bf-ink)}
  #bf-dot.bf-hidden{display:none}

  #bf-window{position:absolute;z-index:3;bottom:72px;width:372px;max-width:calc(100vw - 32px);height:min(540px,calc(100vh - 110px));
    background:var(--bf-cream);border-radius:20px;box-shadow:0 14px 40px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden;
    transition:opacity .22s ease,transform .22s ease}
  #bf-chat[data-side="left"] #bf-window{left:0;transform-origin:bottom left}
  #bf-chat[data-side="right"] #bf-window{right:0;transform-origin:bottom right}
  #bf-window.bf-closed{opacity:0;transform:scale(.9);pointer-events:none;visibility:hidden}

  .bf-header{background:var(--bf-ink);color:var(--bf-cream);padding:13px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px}
  .bf-brand{display:flex;align-items:center;gap:11px;min-width:0}
  .bf-avatar{width:38px;height:38px;flex:none;border-radius:50%;background:var(--bf-gold);display:flex;align-items:center;justify-content:center;font-size:19px}
  .bf-header h3{margin:0;font-size:15px;font-weight:700;color:var(--bf-cream)}
  .bf-header small{display:block;font-size:11.5px;color:var(--bf-gold)}
  #bf-close{flex:none;width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:var(--bf-cream);font-size:20px;line-height:1;cursor:pointer;padding:0}
  #bf-close:hover{background:rgba(255,255,255,.26)}

  #bf-messages{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:14px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}
  .bf-msg{max-width:86%;padding:9px 14px;border-radius:16px;font-size:14px;line-height:1.8;word-wrap:break-word;overflow-wrap:anywhere}
  .bf-msg.bot{align-self:flex-start;background:#fff;color:var(--bf-ink);border:1px solid var(--bf-line);border-top-right-radius:4px}
  .bf-msg.user{align-self:flex-end;background:var(--bf-teal);color:#fff;border-top-left-radius:4px}
  .bf-msg.err{background:#fdf0ee;border-color:#efc4bd}
  .bf-msg.typing{color:#7a6e5c}
  .bf-msg.typing i{display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;background:#9a8d77;animation:bfBlink 1.1s infinite ease-in-out}
  .bf-msg.typing i:nth-child(2){animation-delay:.18s}.bf-msg.typing i:nth-child(3){animation-delay:.36s}
  @keyframes bfBlink{0%,80%,100%{opacity:.25}40%{opacity:1}}
  @media (prefers-reduced-motion:reduce){.bf-msg.typing i{animation:none}#bf-window,#bf-toggle,#bf-overlay{transition:none}#bf-messages{scroll-behavior:auto}}

  #bf-pills{display:flex;flex-wrap:wrap;gap:6px;padding:4px 14px 10px}
  #bf-pills.bf-hidden{display:none}
  #bf-pills button{background:#fff;border:1.5px solid #b9d8d8;color:var(--bf-teal-dark);border-radius:999px;padding:7px 13px;font-size:12.5px;cursor:pointer;transition:background .15s,color .15s}
  #bf-pills button:hover{background:var(--bf-teal);color:#fff;border-color:var(--bf-teal)}

  #bf-form{margin:0;padding:11px 12px 6px;background:#fff;border-top:1px solid var(--bf-line);display:flex;gap:8px;align-items:center}
  #bf-input{flex:1;min-width:0;padding:10px 16px;border:1.5px solid var(--bf-line);border-radius:999px;outline:0;background:var(--bf-cream);color:var(--bf-ink);font-size:16px}
  #bf-input:focus{border-color:var(--bf-teal)}
  #bf-send{flex:none;width:40px;height:40px;border-radius:50%;border:0;background:var(--bf-teal);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
  #bf-send:hover:not(:disabled){background:var(--bf-teal-dark)}
  #bf-send:disabled,#bf-input:disabled{opacity:.55;cursor:not-allowed}
  .bf-note{margin:0;padding:0 14px 9px;background:#fff;font-size:10.5px;color:#8a7e6b;text-align:center}

  @media (max-width:480px){
    #bf-chat[data-side] #bf-window{position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom,0px));width:auto;max-width:none;height:min(540px,calc(100vh - 110px))}
  }`;

  var HTML = `
  <div id="bf-overlay" aria-hidden="true"></div>
  <button id="bf-toggle" type="button" aria-label="چت با دستیار بافیکا" aria-expanded="false" aria-controls="bf-window">
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    <span id="bf-dot"></span>
  </button>
  <div id="bf-window" class="bf-closed" role="dialog" aria-label="دستیار هوشمند بافیکا">
    <div class="bf-header">
      <div class="bf-brand">
        <div class="bf-avatar" aria-hidden="true">🧶</div>
        <div><h3>دستیار هوشمند بافیکا</h3><small>پاسخ سریع درباره محصولات و سفارش</small></div>
      </div>
      <button id="bf-close" type="button" aria-label="بستن چت">×</button>
    </div>
    <div id="bf-messages" aria-live="polite"></div>
    <div id="bf-pills"></div>
    <form id="bf-form" autocomplete="off">
      <input id="bf-input" type="text" placeholder="سوال خود را بنویسید..." maxlength="500" aria-label="پیام شما">
      <button id="bf-send" type="submit" aria-label="ارسال">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:scaleX(-1)" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </form>
    <p class="bf-note">پاسخ‌ها خودکار (هوش مصنوعی) هستند؛ برای سفارش نهایی در دایرکت اینستاگرام هماهنگ کنید.</p>
  </div>`;

  /* ---------- رفتار ---------- */
  function addMessage(text, cls) {
    var el = document.createElement("div");
    el.className = "bf-msg " + cls;
    if (cls.indexOf("bot") !== -1 && cls.indexOf("typing") === -1) el.innerHTML = formatBot(text);
    else el.textContent = text;           // پیام کاربر همیشه به‌صورت متن ساده (بدون خطر تزریق کد)
    els.messages.appendChild(el);
    els.messages.scrollTop = els.messages.scrollHeight;
    return el;
  }

  function setBusy(v) {
    busy = v;
    els.send.disabled = v;
    els.input.disabled = v;
  }

  // درخواست بیدار کردن سرور رایگان: همان لحظه‌ای که مشتری چت را باز می‌کند، تا موقع تایپ سرور بالا بیاید
  function warmUp() {
    if (warmed) return;
    warmed = true;
    try { fetch(CONFIG.API_BASE + "/", { mode: "no-cors", cache: "no-store" }).catch(function () {}); } catch (e) {}
  }

  function lockPage() { document.documentElement.classList.add("bf-lock"); }
  function unlockPage() { document.documentElement.classList.remove("bf-lock"); }

  // موبایل: وقتی کیبورد باز می‌شود، کادر چت دقیقاً در بخش دیدنی صفحه (بالای کیبورد) جا می‌گیرد
  function resetFit() {
    els.root.classList.remove("bf-kb");
    els.win.style.top = els.win.style.bottom = els.win.style.height = "";
  }
  function fitToKeyboard() {
    var vv = window.visualViewport;
    if (!vv || els.win.classList.contains("bf-closed")) return;
    var mobile = window.matchMedia && matchMedia("(max-width: 480px)").matches;
    var kb = !!mobile && (window.innerHeight - vv.height > 120);
    var was = els.root.classList.contains("bf-kb");
    if (!kb) { if (was) { resetFit(); els.messages.scrollTop = els.messages.scrollHeight; } return; }
    els.root.classList.add("bf-kb");
    els.win.style.top = (vv.offsetTop + 8) + "px";
    els.win.style.bottom = "auto";
    els.win.style.height = Math.max(240, vv.height - 16) + "px";
    if (!was) els.messages.scrollTop = els.messages.scrollHeight;
  }

  function openChat() {
    els.win.classList.remove("bf-closed");
    els.overlay.classList.add("bf-show");
    lockPage();
    els.toggle.setAttribute("aria-expanded", "true");
    els.dot.classList.add("bf-hidden");
    warmUp();
    if (window.matchMedia && matchMedia("(hover: hover)").matches) setTimeout(function () { els.input.focus(); }, 150);
  }
  function closeChat() {
    els.win.classList.add("bf-closed");
    els.overlay.classList.remove("bf-show");
    unlockPage();
    resetFit();
    els.toggle.setAttribute("aria-expanded", "false");
  }

  async function requestReply(messages) {
    for (var attempt = 0; attempt < 2; attempt++) {
      var retriable = false;
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, CONFIG.ATTEMPT_TIMEOUT_MS);
      try {
        var res = await fetch(CONFIG.API_BASE + "/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messages }),
          signal: ctrl.signal
        });
        clearTimeout(timer);
        if (!res.ok) {
          retriable = res.status === 502 || res.status === 503 || res.status === 504; // سرور در حال بیدار شدن
          throw new Error("HTTP " + res.status);
        }
        var data = await res.json();
        if (!data || !data.reply) throw new Error("empty reply");
        return String(data.reply);
      } catch (e) {
        clearTimeout(timer);
        if (e instanceof TypeError) retriable = true;      // قطع شدن ارتباط (مثلاً هنگام بیدار شدن سرور)
        if (retriable && attempt === 0) { await sleep(4000); continue; }
        throw e;
      }
    }
  }

  async function send(text) {
    text = String(text || "").trim();
    if (!text || busy) return;

    setBusy(true);
    els.pills.classList.add("bf-hidden");
    els.input.value = "";
    addMessage(text, "user");
    history.push({ role: "user", content: text });

    var typing = addMessage("", "bot typing");
    typing.innerHTML = "در حال فکر کردن <i></i><i></i><i></i>";
    var slowTimer = setTimeout(function () {
      typing.innerHTML = "سرور در حال بیدار شدن است، تا یک دقیقه صبر کنید <i></i><i></i><i></i>";
    }, 8000);

    try {
      var recent = history.slice(-CONFIG.MAX_HISTORY).map(function (m) {
        return { role: m.role, content: m.content.slice(0, 2000) };
      });
      while (recent.length && recent[0].role !== "user") recent.shift();

      var reply = await requestReply(recent);
      typing.remove();
      addMessage(reply, "bot");
      history.push({ role: "assistant", content: reply });
    } catch (err) {
      typing.remove();
      history.pop();                       // پیامی که جواب نگرفت از حافظه حذف شود تا نوبت پیام‌ها به هم نخورد
      addMessage(CONFIG.ERROR_TEXT, "bot err");
    } finally {
      clearTimeout(slowTimer);
      saveHistory();
      setBusy(false);
      if (window.matchMedia && matchMedia("(hover: hover)").matches) els.input.focus();
    }
  }

  function init() {
    var style = document.createElement("style");
    style.id = "bf-chat-style";
    style.textContent = CSS;
    document.head.appendChild(style);

    var root = document.createElement("div");
    root.id = "bf-chat";
    root.setAttribute("data-side", CONFIG.SIDE === "right" ? "right" : "left");
    root.innerHTML = HTML;
    document.body.appendChild(root);

    els.root = root;
    els.overlay = root.querySelector("#bf-overlay");
    els.toggle = root.querySelector("#bf-toggle");
    els.dot = root.querySelector("#bf-dot");
    els.win = root.querySelector("#bf-window");
    els.close = root.querySelector("#bf-close");
    els.messages = root.querySelector("#bf-messages");
    els.pills = root.querySelector("#bf-pills");
    els.form = root.querySelector("#bf-form");
    els.input = root.querySelector("#bf-input");
    els.send = root.querySelector("#bf-send");

    CONFIG.PILLS.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = p.label;
      b.addEventListener("click", function () { send(p.q); });
      els.pills.appendChild(b);
    });

    els.toggle.addEventListener("click", function () {
      if (els.win.classList.contains("bf-closed")) openChat(); else closeChat();
    });
    els.close.addEventListener("click", function () { closeChat(); els.toggle.focus(); });
    // ضربه، اسکرول (ماوس) یا کشیدن (لمس) روی فضای مات بیرون از چت، آن را می‌بندد
    ["click", "wheel", "touchmove"].forEach(function (ev) {
      els.overlay.addEventListener(ev, closeChat, { passive: true });
    });
    if (window.visualViewport) {
      visualViewport.addEventListener("resize", fitToKeyboard);
      visualViewport.addEventListener("scroll", fitToKeyboard);
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !els.win.classList.contains("bf-closed")) closeChat();
    });
    els.form.addEventListener("submit", function (e) { e.preventDefault(); send(els.input.value); });

    // سلام اول، و بازیابی گفتگوی قبلی اگر مشتری از صفحه دیگری آمده
    addMessage(CONFIG.GREETING, "bot");
    history = loadHistory();
    history.forEach(function (m) { addMessage(m.content, m.role === "user" ? "user" : "bot"); });
    if (history.length) { els.pills.classList.add("bf-hidden"); els.dot.classList.add("bf-hidden"); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
