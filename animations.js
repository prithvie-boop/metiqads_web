/* ============================================================
   MetIQ — animations.js
   ------------------------------------------------------------
   Scroll-triggered reveals, scroll progress bar, sticky-nav
   active state, hero parallax glow, magnetic CTA buttons.
   All effects are no-ops when prefers-reduced-motion is set.
   ============================================================ */
(() => {
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* ─── 1. Scroll-triggered reveals ──────────────────────────── */
const revealEls = document.querySelectorAll("[data-reveal]");

if (reduceMotion) {
  revealEls.forEach((el) => el.classList.add("is-in"));
} else if ("IntersectionObserver" in window) {
  // Apply --i index to children of [data-stagger] so CSS can stagger them.
  document.querySelectorAll("[data-stagger]").forEach((parent) => {
    parent.querySelectorAll("[data-reveal]").forEach((child, i) => {
      child.style.setProperty("--i", i);
    });
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );

  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-in"));
}


/* ─── 2. Scroll progress bar ───────────────────────────────── */
const progressBar = document.querySelector(".scroll-progress__bar");
if (progressBar && !reduceMotion) {
  const updateProgress = () => {
    const scrolled = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, (scrolled / max) * 100) : 0;
    progressBar.style.width = pct + "%";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
}


/* ─── 3. Sticky nav state + active link ───────────────────── */
const nav = document.querySelector(".nav");
const navLinks = document.querySelectorAll(".nav__links a");
const sections = Array.from(navLinks)
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

const onScroll = () => {
  if (window.scrollY > 8) nav?.classList.add("is-scrolled");
  else nav?.classList.remove("is-scrolled");

  // active link based on which section's top is closest above viewport mid
  const mid = window.scrollY + window.innerHeight * 0.35;
  let active = null;
  for (const sec of sections) {
    if (sec.offsetTop <= mid) active = sec;
  }
  navLinks.forEach((a) => {
    const target = document.querySelector(a.getAttribute("href"));
    a.classList.toggle("is-active", target === active);
  });
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();


/* ─── 4. Hero parallax glow + cursor tracking ─────────────── */
const heroEl = document.querySelector(".hero");
const glow   = heroEl?.querySelector(".hero__glow");
if (glow && !reduceMotion) {
  let scrollY = 0;
  window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

  let mx = 0.5, my = 0.0;          // target normalized coords (0–1)
  let cx = 0.5, cy = 0.0;          // smoothed coords
  if (heroEl) {
    heroEl.addEventListener("mousemove", (e) => {
      const r = heroEl.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width;
      my = (e.clientY - r.top)  / r.height;
    }, { passive: true });
    heroEl.addEventListener("mouseleave", () => { mx = 0.5; my = 0.0; });
  }

  const tickGlow = () => {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    const y = Math.min(300, scrollY * 0.35);
    glow.style.transform = `translate3d(0, ${y}px, 0)`;
    glow.style.setProperty("--gx", (cx * 100).toFixed(2) + "%");
    glow.style.setProperty("--gy", (cy * 100 - 8).toFixed(2) + "%");
    requestAnimationFrame(tickGlow);
  };
  requestAnimationFrame(tickGlow);
}

/* ─── 4b. Hero timecode ticker ─────────────────────────────── */
const tcEl = document.querySelector("[data-timecode]");
if (tcEl) {
  const pad = (n) => String(n).padStart(2, "0");
  const start = performance.now();
  const fps = 24;
  const tickTC = (now) => {
    const t = (now - start) / 1000;
    const ff = Math.floor(t * fps) % fps;
    const ss = Math.floor(t) % 60;
    const mm = Math.floor(t / 60) % 60;
    const hh = Math.floor(t / 3600);
    tcEl.textContent = `${pad(hh)}:${pad(mm)}:${pad(ss)}:${pad(ff)}`;
    requestAnimationFrame(tickTC);
  };
  requestAnimationFrame(tickTC);
}

/* ─── 4c. Hero metric count-ups + sparkline draw-on ────────── */
const heroSection = document.querySelector(".hero");
if (heroSection) {
  const counters = heroSection.querySelectorAll("[data-count]");
  const sparks   = heroSection.querySelectorAll(".metric-chip__spark");

  // Prep stroke-dash on each first polyline
  sparks.forEach((svg) => {
    const line = svg.querySelector("polyline");
    if (!line) return;
    try {
      const len = line.getTotalLength();
      line.style.strokeDasharray  = len;
      line.style.strokeDashoffset = len;
    } catch (_) { /* getTotalLength may throw if not yet laid out */ }
  });

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target   = parseFloat(el.dataset.count) || 0;
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const prefix   = el.dataset.prefix || "";
    const suffix   = el.dataset.suffix || "";
    const duration = 1400;
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const v = target * easeOutCubic(t);
      el.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const drawSpark = (svg, delay) => {
    const line = svg.querySelector("polyline");
    if (!line) return;
    setTimeout(() => {
      try {
        const len = line.getTotalLength();
        line.style.transition  = "stroke-dashoffset 1500ms cubic-bezier(0.22, 1, 0.36, 1)";
        line.style.strokeDashoffset = "0";
        line.style.strokeDasharray  = len;
      } catch (_) { line.style.strokeDashoffset = "0"; }
    }, delay);
  };

  let fired = false;
  const fire = () => {
    if (fired || reduceMotion) return;
    fired = true;
    counters.forEach((el, i) => setTimeout(() => animateCounter(el), 200 + i * 120));
    sparks.forEach((svg, i) => drawSpark(svg, 100 + i * 120));
  };

  if ("IntersectionObserver" in window) {
    const hio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { fire(); hio.disconnect(); } });
    }, { threshold: 0.25 });
    hio.observe(heroSection);
  } else {
    fire();
  }
}


/* ─── 5. Magnetic CTA buttons ──────────────────────────────── */
const magnets = document.querySelectorAll(".btn--primary");
if (!reduceMotion) {
  magnets.forEach((btn) => {
    const strength = 0.25;
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}


/* ─── 6a. Coverflow reel carousel ─────────────────────────── */
const flow = document.querySelector(".reel-flow");
const flowSection = document.querySelector(".reel-stage-section");
if (flow && flowSection) {
  const track     = flow.querySelector("[data-track]");
  const cards     = Array.from(flow.querySelectorAll(".reel-card"));
  const prevBtn   = flow.querySelector("[data-prev]");
  const nextBtn   = flow.querySelector("[data-next]");
  const counterEl = flowSection.querySelector("[data-counter]");
  const timeEl    = flowSection.querySelector("[data-time]");
  const progressEl= flowSection.querySelector("[data-progress]");
  const muteBtn   = flowSection.querySelector("[data-mute]");
  const fsBtn     = flowSection.querySelector("[data-fullscreen]");
  const total     = cards.length;
  let active      = 0;
  let muted       = true;

  const fmt = (s) => {
    if (!isFinite(s)) return "00:00";
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`;
  };

  const LOAD_RANGE = 2; // load videos within ±2 of active; unload further-out

  const layout = () => {
    if (!cards.length) return;
    const card = cards[active];
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const viewportW  = flow.clientWidth;
    const tx = viewportW / 2 - cardCenter;
    track.style.transform = `translate3d(${tx}px, 0, 0)`;

    cards.forEach((c, i) => {
      const d = i - active;
      const ad = Math.abs(d);
      const angle = d === 0 ? 0 : -d * 28;       // tilt away from center
      const tz    = -ad * 80;                     // push back
      const scale = Math.max(0.74, 1 - ad * 0.08);
      const opacity = ad >= 3 ? 0 : Math.max(0.45, 1 - ad * 0.18);
      c.style.transform = `translateZ(${tz}px) rotateY(${angle}deg) scale(${scale})`;
      c.style.opacity   = opacity;
      c.style.zIndex    = String(100 - ad);
      c.style.pointerEvents = ad >= 3 ? "none" : "";
      c.classList.toggle("is-active", d === 0);
      c.setAttribute("aria-current", d === 0 ? "true" : "false");

      const v = c.querySelector("video");
      if (!v) return;
      v.muted = muted;

      // Lazy src management — keep only nearby cards loaded so the
      // browser's per-origin connection limit doesn't starve them.
      const want = ad <= LOAD_RANGE;
      const has  = !!v.getAttribute("src");
      if (want && !has && v.dataset.src) {
        v.preload = ad === 0 ? "auto" : "metadata";
        v.src = v.dataset.src;
        v.load();
      } else if (!want && has) {
        v.pause();
        v.removeAttribute("src");
        v.load();
      }

      if (d === 0) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });

    if (counterEl) counterEl.textContent = `${String(active+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`;
    track.classList.add("is-ready");
  };

  const goTo = (i) => {
    active = ((i % total) + total) % total;
    layout();
  };

  prevBtn?.addEventListener("click", () => goTo(active - 1));
  nextBtn?.addEventListener("click", () => goTo(active + 1));

  cards.forEach((c, i) => {
    c.addEventListener("click", () => {
      if (i === active) {
        // toggle play/pause when clicking the active card
        const v = c.querySelector("video");
        if (v.paused) v.play().catch(() => {}); else v.pause();
      } else {
        goTo(i);
      }
    });
  });

  // Time + progress + auto-advance
  cards.forEach((c, i) => {
    const v = c.querySelector("video");
    v.addEventListener("timeupdate", () => {
      if (i !== active) return;
      const cur = v.currentTime, dur = v.duration || 0;
      if (timeEl) timeEl.textContent = `${fmt(cur)} / ${fmt(dur)}`;
      const pct = dur ? (cur / dur) * 100 : 0;
      if (progressEl) progressEl.style.width = pct + "%";
    });
    v.addEventListener("ended", () => {
      if (i !== active) return;
      goTo(active + 1);
    });
  });

  // Mute toggle
  muteBtn?.addEventListener("click", () => {
    muted = !muted;
    cards.forEach((c) => { const v = c.querySelector("video"); if (v) v.muted = muted; });
    muteBtn.setAttribute("aria-pressed", muted ? "false" : "true");
  });

  // Fullscreen toggle (active card)
  fsBtn?.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else cards[active]?.requestFullscreen?.();
  });

  // Keyboard arrows when in viewport
  document.addEventListener("keydown", (e) => {
    const r = flowSection.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    if (e.key === "ArrowRight") goTo(active + 1);
    if (e.key === "ArrowLeft")  goTo(active - 1);
  });

  // Touch swipe
  let touchStartX = null;
  flow.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  flow.addEventListener("touchend",   (e) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) goTo(active + (dx < 0 ? 1 : -1));
    touchStartX = null;
  });

  window.addEventListener("resize", layout);
  // Initial layout (after a tick so fonts/layout settle)
  requestAnimationFrame(layout);
  setTimeout(layout, 200);
}


/* ─── 6b. Lazy videos — set src + autoplay only when visible ─ */
const lazyVideos = document.querySelectorAll("video[data-lazyvideo]");
if ("IntersectionObserver" in window && lazyVideos.length) {
  const vio = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const vid = entry.target;
        const isStill = vid.hasAttribute("data-still");
        if (entry.isIntersecting) {
          if (!vid.src) {
            vid.src = vid.dataset.lazyvideo;
            if (vid.preload === "none") {
              vid.preload = isStill ? "auto" : "auto";
              vid.load();
            }
          }
          if (isStill) {
            // Force a first-frame paint by briefly playing, then pause.
            // preload alone is unreliable across browsers/CDNs.
            const freeze = () => {
              try { vid.pause(); } catch (_) {}
            };
            const tryFreeze = () => {
              vid.play().then(() => {
                // Pause on the next tick so a frame is composited first.
                requestAnimationFrame(() => requestAnimationFrame(freeze));
              }).catch(() => {});
            };
            if (vid.readyState >= 2) tryFreeze();
            else vid.addEventListener("loadeddata", tryFreeze, { once: true });
          } else {
            const playPromise = vid.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          }
        } else if (!isStill) {
          vid.pause();
        }
      });
    },
    { rootMargin: "200px 0px", threshold: 0.1 }
  );
  lazyVideos.forEach((v) => vio.observe(v));
}


/* ─── 6d. Custom cursor (desktop only, hover-capable) ──────── */
const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
if (supportsHover && !reduceMotion) {
  document.body.classList.add("has-custom-cursor");

  const dot  = document.createElement("div");
  const ring = document.createElement("div");
  dot.className  = "cursor-dot";
  ring.className = "cursor-ring";
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let isDown = false;

  // Seed transforms so the cursor is visible at viewport center before any
  // mouse activity (e.g., when the page loads with the pointer already over it).
  dot.style.transform  = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
  ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;

  document.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    // Dot follows the pointer instantly, centered on its own size.
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
  }, { passive: true });

  // Smooth-follow ring via lerp (no CSS transform transition — it would lag).
  const tick = () => {
    rx += (mx - rx) * 0.20;
    ry += (my - ry) * 0.20;
    const scale = isDown ? 0.7 : 1;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`;
    requestAnimationFrame(tick);
  };
  tick();

  // Grow on hoverable elements
  const hoverSel = "a, button, .reel-card, .work-item, .bts-tile, .showreel-tile, .card, .lens-card, .industry, .deliverable, .outcome, .member, .faq__q, summary";
  document.querySelectorAll(hoverSel).forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
  });

  window.addEventListener("mousedown", () => { isDown = true;  });
  window.addEventListener("mouseup",   () => { isDown = false; });
  document.addEventListener("mouseleave", () => { dot.style.opacity = "0"; ring.style.opacity = "0"; });
  document.addEventListener("mouseenter", () => { dot.style.opacity = "1"; ring.style.opacity = "1"; });
}


/* ─── 6e. Card shimmer angle follows cursor ────────────────── */
const shimmerCards = document.querySelectorAll(".card, .lens-card, .outcome");
shimmerCards.forEach((el) => {
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI) + 90;
    el.style.setProperty("--shimmer-angle", angle + "deg");
  });
});


/* ─── 6c. Reel cards 3D tilt ───────────────────────────────── */
const reelCards = document.querySelectorAll(".reel-card");
if (!reduceMotion) {
  reelCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}
})();
