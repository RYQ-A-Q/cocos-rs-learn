'use strict';

function startPreview(canvas, sources) {
  if (!sources.length) return () => {};
  const ctx = canvas.getContext('2d');
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.max(400, Math.round(bounds.width * pixelRatio));
  canvas.height = Math.max(250, Math.round(bounds.height * pixelRatio));
  const images = sources.map(source => {
    const image = new Image();
    if (source.texture) image.src = source.texture;
    return image;
  });
  const particles = [];
  const lastEmissions = sources.map(() => 0);
  const duration = Math.max(...sources.map(source => Math.max(0.2, source.duration)));
  let start = performance.now();
  let lastTime = 0;
  let frameId = null;
  let stopped = false;

  function spawn(source, index, time) {
    if (particles.length >= 600) return;
    const angle = Math.random() * Math.PI * 2;
    const radius = source.shape < 0 ? 0 : Math.sqrt(Math.random()) * Math.min(canvas.width, canvas.height) * 0.06;
    particles.push({
      index, birth: time,
      x: canvas.width / 2 + Math.cos(angle) * radius,
      y: canvas.height / 2 + Math.sin(angle) * radius,
      vx: (Math.random() - 0.5) * source.speed * 15 * pixelRatio,
      vy: (Math.random() - 0.5) * source.speed * 15 * pixelRatio,
      rotation: Math.random() * Math.PI * 2,
    });
  }

  function frame(now) {
    if (stopped) return;
    let time = (now - start) / 1000;
    if (time < lastTime || (time > duration && sources.some(source => source.loop))) {
      start = now;
      time = 0;
      lastTime = 0;
      lastEmissions.fill(0);
      particles.length = 0;
    }
    sources.forEach((source, index) => {
      if (lastTime === 0) {
        const count = Math.min(200, Math.max(0, Math.round(source.count)));
        for (let i = 0; i < count; i++) spawn(source, index, time);
      }
      if (source.rate > 0 && time <= source.duration) {
        const interval = 1 / source.rate;
        for (let emitted = 0; time - lastEmissions[index] >= interval && emitted < 50; emitted++) {
          lastEmissions[index] += interval;
          spawn(source, index, lastEmissions[index]);
        }
      }
    });
    lastTime = time;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      const source = sources[particle.index];
      const image = images[particle.index];
      const life = Math.max(0.05, source.life);
      const age = time - particle.birth;
      if (age > life) { particles.splice(i, 1); continue; }
      const fade = Math.max(0, 1 - age / life);
      const size = Math.max(2, Math.min(canvas.width * 0.65, source.size * 35 * pixelRatio * (0.55 + 0.45 * fade)));
      ctx.save();
      ctx.translate(particle.x + particle.vx * age, particle.y + particle.vy * age);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = fade * (source.color?.a ?? 255) / 255;
      if (image.complete && image.naturalWidth) ctx.drawImage(image, -size / 2, -size / 2, size, size);
      else {
        ctx.fillStyle = `rgb(${source.color?.r ?? 255} ${source.color?.g ?? 255} ${source.color?.b ?? 255})`;
        ctx.beginPath();
        ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);
  return () => { stopped = true; if (frameId !== null) cancelAnimationFrame(frameId); };
}

module.exports = { startPreview };
