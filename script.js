const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

const savedTheme = localStorage.getItem("theme");
root.dataset.theme = savedTheme || "dark";

toggle.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  localStorage.setItem("theme", nextTheme);
});

let width = 0;
let height = 0;
let particles = [];
let animationFrame = 0;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resize() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.max(42, Math.min(95, Math.floor((width * height) / 15000)));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.32,
    vy: (Math.random() - 0.5) * 0.32,
    radius: Math.random() * 1.8 + 0.7,
  }));
}

function draw() {
  const isLight = root.dataset.theme === "light";
  ctx.clearRect(0, 0, width, height);

  for (const particle of particles) {
    if (!reduceMotion) {
      particle.x += particle.vx;
      particle.y += particle.vy;
    }

    if (particle.x < 0 || particle.x > width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > height) particle.vy *= -1;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? "rgba(3, 105, 161, 0.34)" : "rgba(125, 211, 252, 0.55)";
    ctx.fill();
  }

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 130) {
        const opacity = (1 - distance / 130) * (isLight ? 0.18 : 0.24);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isLight ? `rgba(3, 105, 161, ${opacity})` : `rgba(56, 189, 248, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  animationFrame = window.requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);
resize();
draw();

window.addEventListener("pagehide", () => {
  window.cancelAnimationFrame(animationFrame);
});
