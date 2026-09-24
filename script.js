(() => {
  const root = document.documentElement;

  // localStorage can throw (privacy modes, blocked site data); never let that break the page.
  const storage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Preference just won't persist.
      }
    },
  };

  const particles = initParticles(document.querySelector("[data-particles]"));
  initTheme();
  initMenu();
  initScrollSpy();
  initCopyEmail();

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  function initTheme() {
    const toggle = document.querySelector("[data-theme-toggle]");
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const systemLight = window.matchMedia("(prefers-color-scheme: light)");

    function apply(theme) {
      root.dataset.theme = theme;
      if (themeColor) themeColor.setAttribute("content", theme === "light" ? "#f5f9fc" : "#07111f");
      if (toggle) toggle.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
      if (particles) particles.refreshColor();
    }

    // The inline script in <head> already chose the initial theme; sync the dependent UI.
    apply(root.dataset.theme === "light" ? "light" : "dark");

    if (toggle) {
      toggle.addEventListener("click", () => {
        const next = root.dataset.theme === "light" ? "dark" : "light";
        storage.set("theme", next);
        apply(next);
      });
    }

    // Follow OS changes until the visitor picks a theme explicitly.
    systemLight.addEventListener("change", (event) => {
      const saved = storage.get("theme");
      if (saved !== "light" && saved !== "dark") apply(event.matches ? "light" : "dark");
    });
  }

  function initMenu() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      root.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && root.classList.contains("menu-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.matchMedia("(min-width: 861px)").addEventListener("change", (event) => {
      if (event.matches) setOpen(false);
    });
  }

  function initScrollSpy() {
    const targets = [...document.querySelectorAll('.site-nav a[href^="#"]')]
      .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
      .filter((target) => target.section);
    if (!targets.length) return;

    let scheduled = false;

    // The current section is the last one whose top has passed 35% of the viewport; the final
    // section wins at the bottom of the page because it may be too short to reach that line.
    function update() {
      scheduled = false;
      const line = window.innerHeight * 0.35;
      const atBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 2;
      let current = null;
      for (const target of targets) {
        if (target.section.getBoundingClientRect().top <= line) current = target;
      }
      if (atBottom) current = targets[targets.length - 1];
      for (const target of targets) target.link.classList.toggle("is-active", target === current);
    }

    function schedule() {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
  }

  function initCopyEmail() {
    const button = document.querySelector("[data-copy]");
    const label = document.querySelector("[data-copy-label]");
    const status = document.querySelector("[data-copy-status]");
    if (!button || !label) return;

    // Clipboard API needs a secure context; hide the button rather than offer one that can't work.
    if (!navigator.clipboard || !window.isSecureContext) {
      button.hidden = true;
      return;
    }

    let resetTimer = 0;
    button.addEventListener("click", async () => {
      let message;
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        message = "Copied!";
      } catch {
        message = "Copy failed";
      }
      label.textContent = message;
      if (status) status.textContent = message === "Copied!" ? "Email address copied to clipboard" : "Could not copy email address";
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        label.textContent = "Copy email";
      }, 2000);
    });
  }

  function initParticles(canvas) {
    const context = canvas && canvas.getContext("2d");
    if (!context) return null;

    const LINK_DISTANCE = 130;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let points = [];
    let frame = 0;
    let inView = true;
    let color = "125, 211, 252";

    function createPoint() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        radius: Math.random() * 1.8 + 0.7,
      };
    }

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      // Keep existing points on resize (mobile toolbars resize often) and only adjust the count.
      const count = Math.max(36, Math.min(90, Math.floor((width * height) / 15000)));
      points = points.slice(0, count);
      for (const point of points) {
        point.x = Math.min(point.x, width);
        point.y = Math.min(point.y, height);
      }
      while (points.length < count) points.push(createPoint());

      draw();
    }

    function step() {
      for (const point of points) {
        point.x += point.vx;
        point.y += point.vy;
        if (point.x < 0 || point.x > width) point.vx *= -1;
        if (point.y < 0 || point.y > height) point.vy *= -1;
      }
    }

    function draw() {
      context.clearRect(0, 0, width, height);
      const isLight = root.dataset.theme === "light";
      const dotAlpha = isLight ? 0.3 : 0.5;
      const lineAlpha = isLight ? 0.16 : 0.22;

      context.fillStyle = `rgba(${color}, ${dotAlpha})`;
      for (const point of points) {
        context.beginPath();
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        context.fill();
      }

      context.lineWidth = 1;
      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance >= LINK_DISTANCE) continue;

          context.strokeStyle = `rgba(${color}, ${(1 - distance / LINK_DISTANCE) * lineAlpha})`;
          context.beginPath();
          context.moveTo(points[i].x, points[i].y);
          context.lineTo(points[j].x, points[j].y);
          context.stroke();
        }
      }
    }

    function loop() {
      step();
      draw();
      frame = window.requestAnimationFrame(loop);
    }

    function start() {
      if (frame || !inView || document.hidden || reduceMotion.matches) return;
      frame = window.requestAnimationFrame(loop);
    }

    function stop() {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }

    function refreshColor() {
      color = getComputedStyle(root).getPropertyValue("--particle").trim() || color;
      draw();
    }

    let resizeFrame = 0;
    new ResizeObserver(() => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(resize);
    }).observe(canvas);

    // Only animate while the hero is on screen and the tab is visible.
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start();
      else stop();
    }).observe(canvas);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });

    reduceMotion.addEventListener("change", () => {
      if (reduceMotion.matches) stop();
      else start();
    });

    resize();
    refreshColor();
    start();

    return { refreshColor };
  }
})();
