/* ============================================================
   MetIQ — form.js
   ------------------------------------------------------------
   Wires every [data-open-form] CTA to a full-viewport intake
   overlay and POSTs the submitted payload to a Google Apps
   Script web app endpoint that appends a row to a Google Sheet.

   To connect to Sheets:
     1. Create a Google Sheet, columns:
        timestamp | name | email | company | project | budget | page
     2. Extensions → Apps Script. Paste the contents of
        apps-script.gs from this repo.
     3. Deploy → New deployment → Web app
          - Execute as: Me
          - Who has access: Anyone
        Copy the deployed URL.
     4. Paste it into SHEETS_ENDPOINT below and reload.

   With SHEETS_ENDPOINT empty, submits resolve as a simulated
   success after 600ms so the UX flow is testable locally.
   ============================================================ */
(() => {
  const SHEETS_ENDPOINT = ""; // ← paste your Apps Script /exec URL here

  const overlay = document.getElementById("intake");
  const form    = document.getElementById("intake-form");
  if (!overlay || !form) return;

  const statusEl  = form.querySelector("[data-status]");
  const submitBtn = form.querySelector("[data-submit]");
  const successEl = overlay.querySelector("[data-success]");
  let lastFocus = null;

  const setStatus = (msg, tone) => {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    if (tone) statusEl.setAttribute("data-tone", tone);
    else statusEl.removeAttribute("data-tone");
  };

  const open = () => {
    lastFocus = document.activeElement;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("intake-open");
    setStatus("");
    form.hidden = false;
    form.classList.remove("is-leaving");
    successEl.hidden = true;
    successEl.classList.remove("is-shown");
    requestAnimationFrame(() => {
      const first = form.querySelector("input, textarea, select");
      first?.focus();
    });
  };

  const close = () => {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("intake-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  // Wire every CTA marked data-open-form
  document.querySelectorAll("[data-open-form]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    });
  });

  // Close interactions
  overlay.addEventListener("click", (e) => {
    if (e.target.matches("[data-close-form]")) close();
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
  });

  // Validation helpers
  const validate = () => {
    let ok = true;
    form.querySelectorAll("input, textarea").forEach((f) => {
      f.removeAttribute("aria-invalid");
    });
    const required = form.querySelectorAll("[required]");
    required.forEach((f) => {
      if (!f.value.trim()) { f.setAttribute("aria-invalid", "true"); ok = false; }
    });
    const email = form.querySelector("[name=email]");
    if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.setAttribute("aria-invalid", "true");
      ok = false;
    }
    return ok;
  };

  // Submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form._gotcha && form._gotcha.value) return; // bot
    if (!validate()) {
      setStatus("Please fix the highlighted fields.", "error");
      return;
    }

    setStatus("Sending…");
    submitBtn.disabled = true;

    const payload = {
      name:    form.name.value.trim(),
      email:   form.email.value.trim(),
      company: form.company.value.trim(),
      project: form.project.value.trim(),
      budget:  form.budget.value,
      page:    location.href,
      ts:      new Date().toISOString(),
    };

    try {
      if (!SHEETS_ENDPOINT) {
        // Local-dev fallback: simulate a successful submit so the
        // UX flow can be verified without a backend.
        console.info("[intake] SHEETS_ENDPOINT not set — simulating success. Payload:", payload);
        await new Promise((r) => setTimeout(r, 600));
      } else {
        const body = new URLSearchParams(payload);
        const res = await fetch(SHEETS_ENDPOINT, { method: "POST", body });
        // Apps Script returns text/json. We try json, fall back to text.
        let data;
        try { data = await res.clone().json(); }
        catch { data = { ok: res.ok }; }
        if (!data.ok) throw new Error(data.error || "Submission failed");
      }

      // Crossfade: fade form out, then fade success in
      form.classList.add("is-leaving");
      await new Promise((r) => setTimeout(r, 320));
      form.hidden = true;
      successEl.hidden = false;
      // Force a reflow so the transition picks up the from-state
      void successEl.offsetWidth;
      successEl.classList.add("is-shown");
      successEl.querySelector("[data-close-form]")?.focus();
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong. Try again or email prithvie@metiqads.com.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
