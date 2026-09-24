/* =============================================
   منصة الأستاذ محمد - لغة عربية
   ملف التفاعلات (JavaScript)
   شامل: التفاعلات + تحسينات الأداء + الحروف العائمة
   ============================================= */

// ============ إعدادات عامة ============
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// ============ قائمة الجوال ============
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

// إغلاق القائمة عند الضغط على أي رابط
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});

// ============ تحسين الأداء: معالج تمرير واحد مبني على rAF ============
const sections = document.querySelectorAll("section[id]");
const navAnchors = document.querySelectorAll(".nav-links a");
const backToTop = document.querySelector(".back-to-top");
const pageNav = document.querySelector(".navbar");

// شريط تقدم القراءة
const scrollProgress = document.createElement("div");
scrollProgress.className = "scroll-progress";
scrollProgress.setAttribute("aria-hidden", "true");
document.body.appendChild(scrollProgress);

let scrollTicking = false;
let cachedMax = 0;
let cachedOffsets = [];

function refreshLayoutMetrics() {
  cachedMax = document.documentElement.scrollHeight - window.innerHeight;
  cachedOffsets = Array.from(sections).map((s) => ({ id: s.id, top: s.offsetTop }));
}

function onScrollUpdate() {
  const y = window.scrollY;

  // إبراز الرابط النشط أثناء التمرير
  if (cachedOffsets.length > 0) {
    let current = "home";
    for (const s of cachedOffsets) {
      if (y + 140 >= s.top) current = s.id;
    }
    navAnchors.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });
  }

  // شريط التقدم + حالات الظهور
  if (cachedMax > 0) {
    scrollProgress.style.setProperty("--progress", Math.min((y / cachedMax) * 100, 100) + "%");
  }
  if (backToTop) backToTop.classList.toggle("show", y > 500);
  if (pageNav) pageNav.classList.toggle("scrolled", y > 8);

  scrollTicking = false;
}

refreshLayoutMetrics();
window.addEventListener("scroll", () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(onScrollUpdate);
}, { passive: true });
window.addEventListener("resize", refreshLayoutMetrics, { passive: true });
onScrollUpdate();

// ============ زر العودة للأعلى ============
if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ============ تأخير الروابط الداخلية ============
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// ============ إظهار العناصر عند التمرير ============
const revealElements = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.12 }
);

revealElements.forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 0.1}s`;
  revealObserver.observe(el);
});

// ============ عدّادات الأرقام المتحركة ============
if (!prefersReducedMotion) {
  const counterStats = document.querySelectorAll(".stat strong[data-count]");
  counterStats.forEach((el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const prefix = el.dataset.prefix || "";
    const duration = 1300;
    const start = performance.now();

    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// ============ النشرة البريدية ============
const newsletterForm = document.querySelector(".newsletter-box");

if (newsletterForm) {
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = newsletterForm.querySelector("input");
    if (input.value.trim() && input.value.includes("@")) {
      showToast("✅ تم اشتراكك بنجاح في النشرة البريدية");
      input.value = "";
    } else {
      showToast("⚠️ يرجى إدخال بريد إلكتروني صحيح");
    }
  });
}

// ============ نموذج التواصل ============
const contactForm = document.querySelector(".contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = contactForm.querySelector("#name").value.trim();
    const email = contactForm.querySelector("#email").value.trim();
    const message = contactForm.querySelector("#message").value.trim();

    if (!name || !email || !message) {
      showToast("⚠️ يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    if (!email.includes("@")) {
      showToast("⚠️ يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    showToast("✅ تم إرسال رسالتك بنجاح، سنرد عليك قريبًا");
    contactForm.reset();
  });
}

// ============ توسيع أقسام المنهج (فتح قسم واحد فقط) ============
document.querySelectorAll(".curriculum-head").forEach((head) => {
  head.addEventListener("click", () => {
    const item = head.parentElement;
    const wasOpen = item.classList.contains("open");
    item.parentElement.querySelectorAll(".curriculum-item.open").forEach((open) => {
      open.classList.remove("open");
    });
    if (!wasOpen) item.classList.add("open");
  });
});

// ============ دالة التنبيه (Toast) ============
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
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ============ فلترة الكورسات ============
const filterBtns = document.querySelectorAll(".filter-btn");
const courseCards = document.querySelectorAll(".course-card");
const searchInput = document.querySelector(".search-input");
const emptyState = document.querySelector(".empty-state");
const resultsCount = document.querySelector(".results-count");

let currentFilter = "all";
let lastFilterSig = "";

function applyFilters() {
  const keyword = searchInput ? searchInput.value.trim() : "";
  let visible = 0;
  const visibleEls = [];

  courseCards.forEach((card) => {
    const level = card.dataset.level || "all";
    const title = card.dataset.title || "";
    const desc = card.dataset.desc || "";

    const matchesFilter = currentFilter === "all" || level === currentFilter;
    const matchesSearch =
      keyword === "" ||
      title.includes(keyword) ||
      desc.includes(keyword);

    const show = matchesFilter && matchesSearch;
    card.style.display = show ? "" : "none";
    if (show) {
      visible++;
      visibleEls.push(card);
    }
  });

  if (emptyState) {
    emptyState.classList.toggle("show", visible === 0);
  }
  if (resultsCount) {
    resultsCount.textContent = `عدد الكورسات المعروضة: ${visible}`;
  }

  // نبضة ظهور للكروسات عند تغيّر الفلتر أو البحث فقط
  const sig = `${currentFilter}|${keyword}|${visible}`;
  if (sig !== lastFilterSig && !prefersReducedMotion) {
    visibleEls.forEach((card) => {
      card.classList.remove("pop");
      void card.offsetWidth; // إعادة تشغيل الأنيميشن
      card.classList.add("pop");
    });
    lastFilterSig = sig;
  }
}

if (filterBtns.length > 0) {
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter || "all";
      applyFilters();
    });
  });
}

if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

// ============ نبضة اضغط زر (Ripple) ============
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("click", function (e) {
    if (prefersReducedMotion) return;
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.width = span.style.height = size + "px";
    span.style.left = e.clientX - rect.left - size / 2 + "px";
    span.style.top = e.clientY - rect.top - size / 2 + "px";
    this.appendChild(span);
    span.addEventListener("animationend", () => span.remove());
  });
});

// ============ اللمعان التفاعلي خلف البطاقات ============
const CARD_SELECTOR = ".feature-card, .course-card, .price-card, .testimonial-card, .card-panel, .hero-card, .teacher-photo, .course-visual";
const TILT_SELECTOR = ".feature-card, .course-card, .price-card, .testimonial-card, .teacher-photo, .course-visual";

document.querySelectorAll(CARD_SELECTOR).forEach((card) => {
  if (!prefersReducedMotion) card.classList.add("shine-card");
});
document.querySelectorAll(".teacher-photo, .course-visual").forEach((card) => {
  card.classList.add("shine-card--light");
});

if (finePointer) {
  // لمعان يتبع الماوس
  document.querySelectorAll(".shine-card").forEach((card) => {
    card.addEventListener("mousemove", function (e) {
      const r = this.getBoundingClientRect();
      this.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      this.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  // ميل ثلاثي الأبعاد خفيف للبطاقات
  document.querySelectorAll(TILT_SELECTOR).forEach((card) => {
    card.addEventListener("mousemove", function (e) {
      const r = this.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      this.style.transform = `perspective(900px) translateY(-6px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
      this.style.transition = "transform 0.15s ease-out";
    });
    card.addEventListener("mouseleave", function () {
      this.style.transform = "";
      this.style.transition = "";
    });
  });
}

// ============ الحروف العربية العائمة في الخلفية ============
(function buildFloatingLetters() {
  if (prefersReducedMotion) return;

  const LETTERS = ["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي"];
  const TINTS = [
    "rgba(21, 84, 196, 0.08)",
    "rgba(13, 58, 138, 0.07)",
    "rgba(255, 255, 255, 0.10)",
    "rgba(21, 84, 196, 0.13)",
    "rgba(255, 255, 255, 0.15)",
    "rgba(245, 166, 35, 0.09)"
  ];

  const container = document.createElement("div");
  container.className = "floating-letters";
  container.setAttribute("aria-hidden", "true");

  const count = window.innerWidth < 768 ? 14 : 26;
  for (let i = 0; i < count; i++) {
    const span = document.createElement("span");
    span.className = "f-letter";
    span.textContent = LETTERS[Math.floor(Math.random() * LETTERS.length)];

    const duration = 14 + Math.random() * 16;
    span.style.setProperty("--size", (18 + Math.random() * 44).toFixed(1) + "px");
    span.style.setProperty("--x", (Math.random() * 94).toFixed(1) + "%");
    span.style.setProperty("--duration", duration.toFixed(1) + "s");
    span.style.setProperty("--delay", (-Math.random() * duration).toFixed(1) + "s");
    span.style.setProperty("--drift", (Math.random() * 220 - 110).toFixed(0) + "px");
    span.style.setProperty("--spin", (Math.random() * 120 - 60).toFixed(0) + "deg");
    span.style.setProperty("--tint", TINTS[i % TINTS.length]);
    span.style.setProperty("--peak-opacity", (0.55 + Math.random() * 0.45).toFixed(2));
    container.appendChild(span);
  }

  document.body.appendChild(container);

  // إيقاف الحركة مؤقتًا عندما يكون التبويب مخفيًا (توفير للأداء)
  document.addEventListener("visibilitychange", () => {
    container.classList.toggle("paused", document.hidden);
  });
})();