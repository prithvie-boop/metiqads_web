/* ============================================================
   MetIQ — script.js
   Core interactions: mobile nav toggle + FAQ accordion.
   Animation logic lives in animations.js.
   ============================================================ */
(() => {
  // Mobile nav toggle
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav__toggle");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  // Close mobile nav when an in-page link is clicked
  document.querySelectorAll(".nav__links a").forEach((link) => {
    link.addEventListener("click", () => {
      nav?.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
    });
  });

  // FAQ accordion — exclusive open
  const items = document.querySelectorAll(".faq__item");
  items.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) {
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      }
    });
  });
})();
