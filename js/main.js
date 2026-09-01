/* ==========================================================
   bafika | js/main.js
   همه‌ی منطق سایت اینجاست: داده محصولات، سبد خرید (localStorage)،
   فیلتر محصولات، فرم تماس، و ثبت سفارش از طریق اینستاگرام.
   ========================================================== */

/* ---------- ۱) داده محصولات ----------
   برای هر محصول می‌تونی یک یا چند عکس بذاری:
   images: ["img/products/table1-1.png", "img/products/table1-2.png"]
   - اگه بیشتر از یک عکس بذاری، خودکار روی کارت محصول اسلایدر (فلش/نقطه) نشون داده می‌شه
   - اگه آرایه رو خالی [] بذاری، همون آیکون کلاف نخ به‌عنوان جایگزین نمایش داده می‌شه

   برای تخفیف روی یک محصول:
   یک فیلد oldPrice (قیمت قبل از تخفیف) اضافه کن. مثال:
   { id: 1, name: "...", price: 1200000, oldPrice: 1500000, ... }
   - price همیشه قیمتِ نهایی و واقعی (تخفیف‌خورده) هست؛ همینه که تو checkout و سبد خرید حساب می‌شه
   - oldPrice فقط برای نمایش خط‌خورده و محاسبه‌ی درصد تخفیفه
   - محصولی که تخفیف نداره، اصلاً فیلد oldPrice رو ننویس (یا حذفش کن)
------------------------------------------------- */
const PRODUCTS = [
  { id: 1, name: "رانر طرح رنگین کمان",   cat: "table",    catLabel: "رومیزی",     price: 1445000, oldPrice: 1700000, color: "#8C3B3B", images: ["img/runner/runner1.png", "img/runner/runner2.png", "img/runner/runner3.png","img/runner/runner4.png"] },
  { id: 2, name: "رومیزی طرح ابریشمی",     cat: "table",    catLabel: "رومیزی",     price: 300000, oldPrice: 365000, color: "#C99A3E", images: ["img/abrisham/ab1.png", "img/abrisham/ab2.png", "img/abrisham/ab3.png"] },
  { id: 3, name: "هدپیس (تل دست بافت)",       cat: "table",    catLabel: "تل مو",     price: 200000, color: "#5B6E4D", images: ["img/hedpis/hp1.png","img/hedpis/hp2.png","img/hedpis/hp3.png"] },
  { id: 4, name: "ست جالیوانی بافت ۶ عددی",       cat: "cupholder", catLabel: "جالیوانی",   price: 210000, color: "#6E2C2C", images: [] },
  { id: 5, name: "جالیوانی بافت طرح تک‌گل",        cat: "cupholder", catLabel: "جالیوانی",   price: 65000,  color: "#8C3B3B", images: [] },
  { id: 6, name: "ست زیرلیوانی بافت ۴ عددی",      cat: "coaster",  catLabel: "زیرلیوانی",  price: 145000, color: "#5C4F3F", images: [] },
  { id: 7, name: "زیرلیوانی بافت رنگارنگ",         cat: "coaster",  catLabel: "زیرلیوانی",  price: 40000,  color: "#C99A3E", images: [] },
  { id: 8, name: "تل مو بافت پهن زمستانی",         cat: "headband", catLabel: "تل مو",      price: 165000, color: "#8C3B3B", images: [] },
  { id: 9, name: "تل مو بافت گره‌دار",              cat: "headband", catLabel: "تل مو",      price: 150000, color: "#5B6E4D", images: [] },
  { id: 10, name: "رومبلی بافت ست سه‌تکه",         cat: "sofa",     catLabel: "رومبلی",     price: 690000, color: "#6E2C2C", images: [] },
  { id: 11, name: "رومبلی بافت طرح لوزی",          cat: "sofa",     catLabel: "رومبلی",     price: 590000, color: "#8C3B3B", images: [] },
  { id: 12, name: "اشارپ بافت سبک پاییزی",         cat: "scarf",    catLabel: "اشارپ",      price: 340000, color: "#C99A3E", images: [] },
  { id: 13, name: "اشارپ بافت دورنگ کرم-زرشکی",    cat: "scarf",    catLabel: "اشارپ",      price: 365000, color: "#8C3B3B", images: [] },
];

const CATEGORIES = [
  { key: "all",       label: "همه" },
  { key: "table",     label: "رومیزی" },
  { key: "cupholder", label: "جالیوانی" },
  { key: "coaster",   label: "زیرلیوانی" },
  { key: "headband",  label: "تل مو" },
  { key: "sofa",      label: "رومبلی" },
  { key: "scarf",     label: "اشارپ" },
];

const CART_KEY = "bafika_cart_v1";
const REVIEWS_KEY = "bafika_reviews_v1";

/* ---------- پوستر‌های تبلیغاتی بالای صفحه اصلی ----------
   هر پوستر یعنی یه اسلاید؛ می‌تونی عکس بذاری یا فقط رنگ/گرادیان + متن.
   - image: مسیر عکس (اختیاری). اگه ندی، از bgColor استفاده می‌شه.
   - bgColor: یک رنگ یا گرادیان CSS برای پس‌زمینه (وقتی عکس نیست)
   - eyebrow/title/subtitle: متن‌های روی پوستر
   - ctaText/ctaLink: دکمه‌ی روی پوستر
------------------------------------------------- */
const BANNERS = [
  {
    image: "img/banners/runner-banner.jpg",
    bgColor: "linear-gradient(120deg, #8C3B3B 0%, #6E2C2C 100%)",
    eyebrow: "تخفیف ویژه",
    title: "تا ۲۰٪ تخفیف روی رومیزی‌های بافت",
    subtitle: "فقط تا پایان این هفته",
    ctaText: "مشاهده محصولات",
    ctaLink: "products.html",
  },
  {
    image: "img/banners/hedpis-banner.jpg",
    bgColor: "linear-gradient(120deg, #5B6E4D 0%, #3f4d36 100%)",
    eyebrow: "محصول جدید",
    title: "هدپیس‌های بافت دست، تازه رسید",
    subtitle: "طرح‌های جدید پاییزی",
    ctaText: "ببین چی داریم",
    ctaLink: "products.html#headband",
  },
  {
    image: "img/banners/story-banner.jpg",
    bgColor: "linear-gradient(120deg, #C99A3E 0%, #a87c28 100%)",
    eyebrow: "bafika",
    title: "دستباف، با عشق برای خونه‌ی تو",
    subtitle: "هر قطعه، دست‌ساز و یکتا",
    ctaText: "داستان ما",
    ctaLink: "about.html",
  },
  {
    image: "img/banners/abrisham-banner.jpg",
    bgColor: "linear-gradient(120deg, #B08968 0%, #7f5539 100%)",
    eyebrow: "تخفیف ویژه",
    title: "رومیزی طرح ابریشمی، حالا با تخفیف",
    subtitle: "ظرافت دست‌بافت با درخشش ابریشم",
    ctaText: "مشاهده محصول",
    ctaLink: "products.html#table",
  },
];

/* نظرات پیش‌فرض که همه بازدیدکننده‌ها می‌بینن (چون سایت بک‌اند نداره) */
const SEED_REVIEWS = [
  { name: "نگار", rating: 5, text: "رومیزی که گرفتم عالی بود، دقیقاً مثل عکس‌های پیج. کیفیت بافتش فوق‌العادس.", date: "1404/04/10" },
  { name: "مریم", rating: 5, text: "ست جالیوانی رو برای هدیه گرفتم، همه عاشقش شدن 🌸", date: "1404/03/22" },
  { name: "سارا", rating: 4, text: "کیفیت خوب بود، فقط ارسال یه‌کم طول کشید ولی ارزششو داشت.", date: "1404/02/15" },
];

/* ---------- ۲) توابع کمکی ---------- */
function formatPrice(n) {
  return n.toLocaleString("fa-IR") + " تومان";
}

function discountPercent(p) {
  if (!p.oldPrice || p.oldPrice <= p.price) return 0;
  return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
}

function priceBlockHtml(p) {
  const pct = discountPercent(p);
  if (pct <= 0) {
    return `<span class="product-price">${formatPrice(p.price)}</span>`;
  }
  return `
    <div class="price-block">
      <div class="price-row">
        <span class="product-price discounted">${formatPrice(p.price)}</span>
        <span class="discount-tag">٪${pct} تخفیف</span>
      </div>
      <span class="old-price">${formatPrice(p.oldPrice)}</span>
    </div>`;
}

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function cartItemCount(cart) {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

function addToCart(productId, qty = 1) {
  const cart = readCart();
  cart[productId] = (cart[productId] || 0) + qty;
  writeCart(cart);
}

function setQty(productId, qty) {
  const cart = readCart();
  if (qty <= 0) {
    delete cart[productId];
  } else {
    cart[productId] = qty;
  }
  writeCart(cart);
}

function removeFromCart(productId) {
  const cart = readCart();
  delete cart[productId];
  writeCart(cart);
}

function updateCartCount() {
  const cart = readCart();
  const count = cartItemCount(cart);
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

/* ---------- ۳) SVG آیکون یک کلاف نخ برای جایگزین تصویر محصول ---------- */
function yarnSvg(color) {
  return `<svg viewBox="0 0 100 100" width="72%" height="72%" aria-hidden="true">
    <circle cx="50" cy="50" r="42" fill="none" stroke="${color}" stroke-width="6" opacity=".25"/>
    <path d="M50 8 C 20 20, 20 80, 50 92 C 80 80, 80 20, 50 8" fill="none" stroke="${color}" stroke-width="5" opacity=".55"/>
    <path d="M12 40 C 45 55, 55 55, 88 40" fill="none" stroke="${color}" stroke-width="5" opacity=".55"/>
    <path d="M12 62 C 45 47, 55 47, 88 62" fill="none" stroke="${color}" stroke-width="5" opacity=".55"/>
    <circle cx="50" cy="50" r="42" fill="none" stroke="${color}" stroke-width="6"/>
  </svg>`;
}

/* ---------- ۴) نمایش/ساخت toast ---------- */
function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ---------- ۵) رندر گرید محصولات (برای صفحه اصلی و صفحه محصولات) ---------- */
function productThumbHtml(p) {
  const hasImages = Array.isArray(p.images) && p.images.length > 0;

  if (!hasImages) {
    return `
      <div class="product-thumb" style="background:${p.color}14;">
        ${yarnSvg(p.color)}
      </div>`;
  }

  if (p.images.length === 1) {
    return `
      <div class="product-thumb">
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
      </div>`;
  }

  const slidesHtml = p.images.map((src, i) => `
    <img src="${src}" alt="${p.name}" loading="lazy" draggable="false" class="slide ${i === 0 ? "active" : ""}" data-slide-index="${i}">
  `).join("");
  const dotsHtml = p.images.map((_, i) => `
    <button class="car-dot ${i === 0 ? "active" : ""}" data-dot-index="${i}" aria-label="عکس ${i + 1}"></button>
  `).join("");

  return `
    <div class="product-thumb carousel" data-carousel data-index="0" data-count="${p.images.length}">
      ${slidesHtml}
      <button type="button" class="car-arrow prev" data-car-prev aria-label="عکس قبلی">‹</button>
      <button type="button" class="car-arrow next" data-car-next aria-label="عکس بعدی">›</button>
      <div class="car-dots">${dotsHtml}</div>
    </div>`;
}

/* ---------- کمکی: پشتیبانی از کشیدن با انگشت/موس روی اسلایدرها ---------- */
function addSwipeSupport(el, onPrev, onNext) {
  let startX = 0;
  let startY = 0;
  let down = false;
  let dragged = false;
  const threshold = 40;

  function onDown(x, y) {
    down = true;
    dragged = false;
    startX = x;
    startY = y;
  }
  function onMove(x, y, e) {
    if (!down) return;
    const dx = x - startX;
    const dy = y - startY;
    if (!dragged && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      dragged = true;
    }
    if (dragged && e && e.cancelable) e.preventDefault();
  }
  function onUp(x, y) {
    if (!down) return;
    down = false;
    const dx = x - startX;
    const dy = y - startY;
    if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) onPrev();
      else onNext();
    }
  }

  el.style.touchAction = "pan-y";
  el.style.webkitUserSelect = "none";
  el.style.userSelect = "none";

  el.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    onDown(e.clientX, e.clientY);
  });
  el.addEventListener("pointermove", (e) => onMove(e.clientX, e.clientY, e), { passive: false });
  el.addEventListener("pointerup", (e) => onUp(e.clientX, e.clientY));
  el.addEventListener("pointercancel", () => { down = false; });
  el.addEventListener("pointerleave", () => { down = false; });

  // جلوگیری از باز شدن لینک/کلیک ناخواسته درست بعد از یه کشیدن (drag)
  el.addEventListener("click", (e) => {
    if (dragged) {
      e.preventDefault();
      e.stopPropagation();
      dragged = false;
    }
  }, true);
}

/* ---------- پوستر تبلیغاتی بالای صفحه اصلی ---------- */
function initPromoSlider() {
  const wrap = document.querySelector("[data-promo-slider]");
  if (!wrap || BANNERS.length === 0) return;

  const slidesHtml = BANNERS.map((b, i) => `
    <a class="promo-slide ${i === 0 ? "active" : ""}" data-promo-index="${i}"
       href="${b.ctaLink || "#"}"
       style="${b.image ? `background-image:url('${b.image}')` : `background-image:${b.bgColor}`}">
      <div class="promo-overlay">
        ${b.eyebrow ? `<span class="promo-eyebrow">${b.eyebrow}</span>` : ""}
        <h2 class="promo-title">${b.title || ""}</h2>
        ${b.subtitle ? `<p class="promo-subtitle">${b.subtitle}</p>` : ""}
        ${b.ctaText ? `<span class="btn btn-gold promo-cta">${b.ctaText}</span>` : ""}
      </div>
    </a>
  `).join("");

  const dotsHtml = BANNERS.map((_, i) => `
    <button class="car-dot ${i === 0 ? "active" : ""}" data-promo-dot="${i}" aria-label="پوستر ${i + 1}"></button>
  `).join("");

  wrap.innerHTML = `
    ${slidesHtml}
    ${BANNERS.length > 1 ? `
      <button type="button" class="car-arrow prev promo-arrow" data-promo-prev aria-label="پوستر قبلی">‹</button>
      <button type="button" class="car-arrow next promo-arrow" data-promo-next aria-label="پوستر بعدی">›</button>
      <div class="car-dots promo-dots">${dotsHtml}</div>
    ` : ""}
  `;

  if (BANNERS.length <= 1) return;

  const slides = wrap.querySelectorAll(".promo-slide");
  const dots = wrap.querySelectorAll("[data-promo-dot]");
  let index = 0;
  let timer = null;

  function goTo(i) {
    index = (i + BANNERS.length) % BANNERS.length;
    slides.forEach((s) => s.classList.toggle("active", Number(s.dataset.promoIndex) === index));
    dots.forEach((d) => d.classList.toggle("active", Number(d.dataset.promoDot) === index));
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  wrap.querySelector("[data-promo-prev]").addEventListener("click", (e) => {
    e.preventDefault();
    prev();
    resetAutoplay();
  });
  wrap.querySelector("[data-promo-next]").addEventListener("click", (e) => {
    e.preventDefault();
    next();
    resetAutoplay();
  });
  dots.forEach((d) => {
    d.addEventListener("click", (e) => {
      e.preventDefault();
      goTo(Number(d.dataset.promoDot));
      resetAutoplay();
    });
  });

  // جلوگیری از رفتن به لینک وقتی کاربر داشته کشیدن (drag) رو انجام می‌داده
  // (خود addSwipeSupport این کار رو مدیریت می‌کنه)

  addSwipeSupport(
    wrap,
    () => { prev(); resetAutoplay(); },
    () => { next(); resetAutoplay(); }
  );

  function resetAutoplay() {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }
  resetAutoplay();
  wrap.addEventListener("mouseenter", () => clearInterval(timer));
  wrap.addEventListener("mouseleave", resetAutoplay);
}

function initCarousels(container) {
  container.querySelectorAll("[data-carousel]").forEach((car) => {
    const count = Number(car.dataset.count);
    const slides = car.querySelectorAll(".slide");
    const dots = car.querySelectorAll(".car-dot");

    function goTo(index) {
      const next = (index + count) % count;
      car.dataset.index = next;
      slides.forEach((s) => s.classList.toggle("active", Number(s.dataset.slideIndex) === next));
      dots.forEach((d) => d.classList.toggle("active", Number(d.dataset.dotIndex) === next));
    }

    car.querySelector("[data-car-prev]").addEventListener("click", (e) => {
      e.preventDefault();
      goTo(Number(car.dataset.index) - 1);
    });
    car.querySelector("[data-car-next]").addEventListener("click", (e) => {
      e.preventDefault();
      goTo(Number(car.dataset.index) + 1);
    });
    dots.forEach((d) => {
      d.addEventListener("click", (e) => {
        e.preventDefault();
        goTo(Number(d.dataset.dotIndex));
      });
    });

    addSwipeSupport(
      car,
      () => goTo(Number(car.dataset.index) - 1),
      () => goTo(Number(car.dataset.index) + 1)
    );
  });
}

function renderProductGrid(container, list) {
  if (!container) return;
  if (list.length === 0) {
    container.innerHTML = `<p style="grid-column:1/-1;text-align:center;">محصولی در این دسته پیدا نشد.</p>`;
    return;
  }
  container.innerHTML = list.map((p) => `
    <article class="product-card">
      <div class="thumb-wrap">
        ${productThumbHtml(p)}
        ${discountPercent(p) > 0 ? `<span class="thumb-discount-badge">٪${discountPercent(p)}-</span>` : ""}
      </div>
      <div class="product-body">
        <span class="product-cat">${p.catLabel}</span>
        <h3 class="product-name">${p.name}</h3>
        <span class="badge-natural">۱۰۰٪ نخ طبیعی</span>
        <div class="product-foot">
          ${priceBlockHtml(p)}
          <button class="add-btn" data-add="${p.id}">افزودن به سبد</button>
        </div>
      </div>
    </article>
  `).join("");

  initCarousels(container);

  container.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.add);
      addToCart(id, 1);
      btn.textContent = "افزوده شد ✓";
      btn.classList.add("added");
      showToast("به سبد خرید اضافه شد");
      setTimeout(() => {
        btn.textContent = "افزودن به سبد";
        btn.classList.remove("added");
      }, 1400);
    });
  });
}

/* ---------- ۶) منوی موبایل ---------- */
function initMobileNav() {
  const toggle = document.querySelector(".menu-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

/* ---------- ۷) صفحه محصولات: فیلتر دسته ---------- */
function initProductsPage() {
  const grid = document.querySelector("[data-product-grid]");
  const toolbar = document.querySelector("[data-toolbar]");
  if (!grid || !toolbar) return;

  toolbar.innerHTML = CATEGORIES.map((c, i) => `
    <button class="chip" data-cat="${c.key}" aria-pressed="${i === 0 ? "true" : "false"}">${c.label}</button>
  `).join("");

  renderProductGrid(grid, PRODUCTS);

  toolbar.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      toolbar.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");
      const cat = chip.dataset.cat;
      const filtered = cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === cat);
      renderProductGrid(grid, filtered);
    });
  });
}

/* ---------- ۸) صفحه اصلی: چند محصول منتخب ---------- */
function initHomeFeatured() {
  const grid = document.querySelector("[data-featured-grid]");
  if (!grid) return;
  renderProductGrid(grid, PRODUCTS.slice(0, 6));
}

/* ---------- ۹) صفحه سبد خرید ---------- */
function initCartPage() {
  const wrap = document.querySelector("[data-cart-wrap]");
  if (!wrap) return;

  function render() {
    const cart = readCart();
    const ids = Object.keys(cart);

    if (ids.length === 0) {
      wrap.innerHTML = `
        <div class="empty-cart" style="grid-column:1/-1;">
          <h2>سبد خرید شما خالیه</h2>
          <p>هنوز محصولی به سبدتون اضافه نکردید.</p>
          <a class="btn btn-primary" href="products.html">مشاهده محصولات</a>
        </div>`;
      return;
    }

    let subtotal = 0;
    const itemsHtml = ids.map((id) => {
      const p = PRODUCTS.find((x) => x.id === Number(id));
      if (!p) return "";
      const qty = cart[id];
      subtotal += p.price * qty;
      return `
        <div class="cart-item" data-item="${p.id}">
          <div class="thumb" style="background:${p.color}14;">${yarnSvg(p.color)}</div>
          <div>
            <div class="name">${p.name}</div>
            <div class="cat">${p.catLabel} · ${formatPrice(p.price)}</div>
          </div>
          <div class="qty-control">
            <button data-dec aria-label="کم کردن تعداد">−</button>
            <span>${qty}</span>
            <button data-inc aria-label="زیاد کردن تعداد">+</button>
          </div>
          <button class="remove-btn" data-remove>حذف</button>
        </div>`;
    }).join("");

    const subtotalDisplay = subtotal;

    wrap.innerHTML = `
      <div>
        <h2 style="margin-bottom:6px;">سبد خرید</h2>
        <div class="stitch-line" style="margin-bottom:18px;"></div>
        ${itemsHtml}
      </div>
      <aside class="summary-card">
        <h3>خلاصه سفارش</h3>
        <div class="summary-row total"><span>جمع کالاها</span><span>${formatPrice(subtotalDisplay)}</span></div>
        <p class="form-note" style="margin:4px 0 0;">هزینه ارسال جدا محاسبه و توی دایرکت اینستاگرام اعلام می‌شه.</p>
        <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:16px;">📷 ثبت سفارش در اینستاگرام</a>
        <a href="products.html" class="btn btn-outline btn-block" style="margin-top:10px;">ادامه خرید</a>
      </aside>
    `;

    wrap.querySelectorAll("[data-item]").forEach((row) => {
      const id = Number(row.dataset.item);
      row.querySelector("[data-inc]").addEventListener("click", () => {
        const c = readCart();
        setQty(id, (c[id] || 0) + 1);
        render();
      });
      row.querySelector("[data-dec]").addEventListener("click", () => {
        const c = readCart();
        setQty(id, (c[id] || 0) - 1);
        render();
      });
      row.querySelector("[data-remove]").addEventListener("click", () => {
        removeFromCart(id);
        render();
      });
    });
  }

  render();
}

/* ---------- ۱۰) صفحه تسویه‌حساب: آماده‌سازی سفارش برای اینستاگرام ---------- */
function initCheckoutPage() {
  const miniSummary = document.querySelector("[data-mini-summary]");
  const form = document.querySelector("[data-checkout-form]");
  if (!miniSummary || !form) return;

  const cart = readCart();
  const ids = Object.keys(cart);

  if (ids.length === 0) {
    document.querySelector("[data-checkout-page]").innerHTML = `
      <div class="empty-cart">
        <h2>سبد خرید شما خالیه</h2>
        <p>برای ثبت سفارش اول باید محصولی به سبد اضافه کنید.</p>
        <a class="btn btn-primary" href="products.html">مشاهده محصولات</a>
      </div>`;
    return;
  }

  let subtotal = 0;
  const orderLines = [];
  miniSummary.innerHTML = ids.map((id) => {
    const p = PRODUCTS.find((x) => x.id === Number(id));
    const qty = cart[id];
    subtotal += p.price * qty;
    orderLines.push(`• ${p.name} × ${qty} — ${formatPrice(p.price * qty)}`);
    return `<div class="summary-mini-item"><span>${p.name} × ${qty}</span><span>${formatPrice(p.price * qty)}</span></div>`;
  }).join("");

  document.querySelector("[data-total]").textContent = formatPrice(subtotal);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll("[required]").forEach((input) => {
      const field = input.closest(".form-field");
      if (!input.value.trim()) {
        valid = false;
        field && field.classList.add("invalid");
      } else {
        field && field.classList.remove("invalid");
      }
    });
    if (!valid) {
      showToast("لطفاً فیلدهای ضروری را تکمیل کنید");
      return;
    }

    const name = form.querySelector("#f-name").value.trim();
    const phone = form.querySelector("#f-phone").value.trim();
    const address = form.querySelector("#f-address").value.trim();
    const city = form.querySelector("#f-city").value.trim();
    const postal = form.querySelector("#f-postal").value.trim();

    const orderText =
      `سفارش جدید از سایت bafika\n\n` +
      orderLines.join("\n") +
      `\n\nجمع تقریبی: ${formatPrice(subtotal)}\n(هزینه ارسال جداگانه محاسبه می‌شه)\n\n` +
      `نام: ${name}\nموبایل: ${phone}\nشهر: ${city}\nآدرس: ${address}` +
      (postal ? `\nکد پستی: ${postal}` : "");

    const resultBox = document.querySelector("[data-order-result]");
    const textarea = document.querySelector("[data-order-text]");
    textarea.value = orderText;
    resultBox.style.display = "block";
    resultBox.scrollIntoView({ behavior: "smooth", block: "start" });

    localStorage.removeItem(CART_KEY);
    updateCartCount();
    form.querySelectorAll("button[type=submit]").forEach(b => b.disabled = true);

    // تلاش برای کپی خودکار
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(orderText)
        .then(() => showToast("متن سفارش کپی شد ✓"))
        .catch(() => showToast("متن سفارش رو آماده کردیم، دکمه کپی رو بزن"));
    } else {
      showToast("متن سفارش رو آماده کردیم، دکمه کپی رو بزن");
    }
  });

  const copyBtn = document.querySelector("[data-copy-order]");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const textarea = document.querySelector("[data-order-text]");
      textarea.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textarea.value).then(() => showToast("کپی شد ✓"));
      } else {
        document.execCommand("copy");
        showToast("کپی شد ✓");
      }
    });
  }
}

/* ---------- ۱۱) صفحه نظرات ---------- */
function readReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function starsHtml(rating) {
  let out = "";
  for (let i = 1; i <= 5; i++) out += i <= rating ? "★" : "☆";
  return out;
}

function initReviewsPage() {
  const list = document.querySelector("[data-reviews-list]");
  const form = document.querySelector("[data-review-form]");
  if (!list || !form) return;

  function render() {
    const all = [...SEED_REVIEWS, ...readReviews()];
    list.innerHTML = all.slice().reverse().map((r) => `
      <div class="review-card">
        <div class="review-head">
          <strong>${r.name}</strong>
          <span class="review-stars">${starsHtml(r.rating)}</span>
        </div>
        <p style="margin:6px 0 4px;">${r.text}</p>
        <span class="review-date">${r.date}</span>
      </div>
    `).join("");
  }

  let selectedRating = 5;
  const starButtons = form.querySelectorAll("[data-star]");
  function paintStars() {
    starButtons.forEach((b) => {
      b.textContent = Number(b.dataset.star) <= selectedRating ? "★" : "☆";
    });
  }
  starButtons.forEach((b) => {
    b.addEventListener("click", () => {
      selectedRating = Number(b.dataset.star);
      paintStars();
    });
  });
  paintStars();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = form.querySelector("#r-name");
    const textInput = form.querySelector("#r-text");
    let valid = true;

    [nameInput, textInput].forEach((input) => {
      const field = input.closest(".form-field");
      if (!input.value.trim()) {
        valid = false;
        field.classList.add("invalid");
      } else {
        field.classList.remove("invalid");
      }
    });

    if (!valid) {
      showToast("لطفاً نام و متن نظر رو بنویس");
      return;
    }

    const reviews = readReviews();
    reviews.push({
      name: nameInput.value.trim(),
      rating: selectedRating,
      text: textInput.value.trim(),
      date: new Date().toLocaleDateString("fa-IR"),
    });
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));

    form.reset();
    selectedRating = 5;
    paintStars();
    render();
    showToast("ممنون از نظرت! ✓");
  });

  render();
}

/* ---------- ۱۲) فرم تماس با ما ---------- */
function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;
  const success = document.querySelector("[data-contact-success]");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    const name = form.querySelector("#c-name");
    const email = form.querySelector("#c-email");
    const message = form.querySelector("#c-message");

    [name, message].forEach((input) => {
      const field = input.closest(".form-field");
      if (!input.value.trim()) {
        valid = false;
        field.classList.add("invalid");
      } else {
        field.classList.remove("invalid");
      }
    });

    const emailField = email.closest(".form-field");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value.trim())) {
      valid = false;
      emailField.classList.add("invalid");
    } else {
      emailField.classList.remove("invalid");
    }

    if (!valid) {
      showToast("لطفاً اطلاعات فرم را بررسی کنید");
      return;
    }

    form.reset();
    form.style.display = "none";
    success.classList.add("show");
  });
}

/* ---------- ۶.۵) هدر شناور روی هیرو: بعد از اسکرول به حالت تمام‌رنگ برگردد ---------- */
function initOverlayHeader() {
  const header = document.querySelector(".site-header.header-overlay");
  if (!header) return;
  const onScroll = () => {
    if (window.scrollY > 60) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- ۱۳) اجرای اولیه در همه صفحات ---------- */
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  initMobileNav();
  initOverlayHeader();
  initPromoSlider();
  initHomeFeatured();
  initProductsPage();
  initCartPage();
  initCheckoutPage();
  initReviewsPage();
  initContactForm();

  // سال جاری در فوتر
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
});
