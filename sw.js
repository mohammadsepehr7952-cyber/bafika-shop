// ---------- سرویس‌ورکر bafika: نمایش صفحه‌ی آفلاین اختصاصی به‌جای خطای پیش‌فرض مرورگر ----------
// این فقط از بار دومی که کاربر با اینترنت سایت رو باز کرده کار می‌کنه،
// چون برای بار اول باید حتماً یک‌بار آنلاین فایل‌ها رو کش کنه.

const CACHE_NAME = "bafika-cache-v1";
const OFFLINE_URL = "offline.html";

const CORE_ASSETS = [
  "index.html",
  "products.html",
  "about.html",
  "contact.html",
  "cart.html",
  "checkout.html",
  "reviews.html",
  "offline.html",
  "css/style.css?v=16",
  "js/main.js",
  "img/logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // فقط درخواست‌های ناوبری صفحه (باز کردن یک آدرس/صفحه) رو مدیریت می‌کنیم
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(OFFLINE_URL).then((res) => res || caches.match("index.html"))
      )
    );
    return;
  }

  // برای بقیه‌ی فایل‌ها (css/js/img): اول کش، بعد شبکه، و اگه هیچ‌کدوم نبود بی‌خیال میشیم
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).catch(() => undefined))
  );
});
