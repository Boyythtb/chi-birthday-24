/* ============================================================================
   TIỆM BÁNH BÍ MẬT CỦA CHI • 26/11/2002
   GSAP Choreographed Morphic Atelier & Ceremony
   ============================================================================ */
(function () {
  'use strict';

  const state = {
    chapter: 1,
    isNightMode: false,
    musicEnabled: true,
    musicPlaying: false,
    trayOpen: true,
    cake: {
      shape: 'round-1',
      plate: 'white-gold',
      flavorColor: '#fff8f0',
      flavorName: 'Vani Kem Bơ',
      texture: 'smooth',
      drip: 'none',
      dripColor: '#3d2314',
      dripLength: 26,
      pipingTip: 'round',
      pipingColor: '#ffffff',
      pipingSize: 16,
      frameChoice: 'round-gold'
    },
    selectedNode: null,
    pipingHistory: [],
    micStream: null,
    analyser: null,
    micDataArray: null,
    isListeningMic: false,
    candlesLit: true,
    smokeParticles: [],
    flameAngle: 0,
    songListeningFinished: false,
    songTimerInterval: null,
    songElapsed: 0,
    songDuration: 21.0
  };

  let stage = null;
  let plateLayer = null;
  let cakeLayer = null;
  let toppingsLayer = null;
  let uiLayer = null;
  let transformer = null;
  let pipingCanvas = null;
  let pipingCtx = null;

  let nightCakeSnapshot = null;
  let candleFlames = [];
  let nightAnimId = null;

  // --------------------------------------------------------------------------
  // 1. VELVET Layered Starlight & Gold Dust (ParticleField + GoldDust)
  // --------------------------------------------------------------------------
  function initGoldDust() {
    const canvas = document.getElementById('ambient-particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0, height = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    // Layer A: Drifting swayed starlight (mirrors VELVET ParticleField.tsx)
    const driftStars = Array.from({ length: 56 }, (_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.9 + Math.random() * 1.9,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.10,
      phase: Math.random() * Math.PI * 2,
      sway: 0.25 + Math.random() * 0.85,
      hasCross: idx % 5 === 0,
      tone: idx % 6 === 0 ? 1 : 0
    }));

    // Layer B: Rising twinkling dust (mirrors VELVET GoldDust.tsx)
    const risingDust = Array.from({ length: 36 }, (_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.7 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.14 - Math.random() * 0.32,
      a: 0.35 + Math.random() * 0.5,
      tw: Math.random() * Math.PI * 2,
      isGold: idx % 3 === 0
    }));

    function drawStarFlare(cx, cy, r, alpha, color) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.35;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 4.5);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      const outer = r * 2.8, inner = r * 0.35;
      for (let i = 0; i < 8; i++) {
        const ang = (Math.PI / 4) * i;
        const rad = i % 2 === 0 ? outer : inner;
        const px = cx + Math.cos(ang) * rad;
        const py = cy + Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    let last = performance.now();
    function tick(now) {
      const dt = Math.min(48, now - last) / 16.6667;
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      for (const p of driftStars) {
        p.phase += 0.014 * dt;
        p.x += (p.vx + Math.cos(p.phase) * 0.18 * p.sway) * dt;
        p.y += p.vy * dt;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        const alpha = 0.28 + 0.68 * (0.5 + 0.5 * Math.sin(p.phase * 0.85));
        const col = p.tone === 1 ? '#ffeaa7' : '#d8f8ec';

        if (p.hasCross) {
          drawStarFlare(p.x, p.y, p.r, alpha, col);
        } else {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const d of risingDust) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.tw += 0.03 * dt;
        if (d.y < -10) { d.y = height + 10; d.x = Math.random() * width; }
        if (d.x < -10) d.x = width + 10;
        if (d.x > width + 10) d.x = -10;

        const twinkle = 0.5 + 0.5 * Math.sin(d.tw);
        ctx.globalAlpha = d.a * twinkle;
        ctx.fillStyle = d.isGold ? '#ffeaa7' : '#a8f5dd';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const activeBursts = [];
  let burstLoopRunning = false;

  function triggerGoldBurst(originX, originY, count = 70, withRing = true) {
    const canvas = document.getElementById('burst-particles-canvas');
    if (!canvas) return;
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    const ctx = canvas.getContext('2d');

    if (withRing) {
      activeBursts.push({
        isRing: true,
        x: originX, y: originY,
        r: 6, maxR: count > 40 ? 130 : 78,
        alpha: 0.85,
        color: state.isNightMode ? '#ffeaa7' : '#ffffff'
      });
    }

    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (count > 40 ? 2.2 : 1.4) + Math.random() * (count > 40 ? 7.5 : 4.2);
      activeBursts.push({
        isRing: false,
        x: originX, y: originY,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        r: 1.2 + Math.random() * 2.4,
        isStar: i % 4 === 0,
        alpha: 1,
        decay: 0.016 + Math.random() * 0.018,
        color: i % 3 === 0 ? '#ffeaa7' : (state.isNightMode ? '#a8f5dd' : '#ffffff')
      });
    }

    if (burstLoopRunning) return;
    burstLoopRunning = true;

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = activeBursts.length - 1; i >= 0; i--) {
        const b = activeBursts[i];
        if (b.isRing) {
          b.r += (b.maxR - b.r) * 0.12;
          b.alpha -= 0.028;
          if (b.alpha <= 0) { activeBursts.splice(i, 1); continue; }
          ctx.save();
          ctx.globalAlpha = b.alpha;
          ctx.strokeStyle = b.color;
          ctx.lineWidth = 1.6;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          b.x += b.vx; b.y += b.vy;
          b.vx *= 0.95; b.vy *= 0.95;
          b.alpha -= b.decay;
          if (b.alpha <= 0) { activeBursts.splice(i, 1); continue; }
          ctx.save();
          ctx.globalAlpha = b.alpha;
          ctx.fillStyle = b.color;
          if (b.isStar) {
            ctx.beginPath();
            const o = b.r * 2.4, inn = b.r * 0.35;
            for (let k = 0; k < 8; k++) {
              const a = (Math.PI / 4) * k;
              const rad = k % 2 === 0 ? o : inn;
              if (k === 0) ctx.moveTo(b.x + Math.cos(a) * rad, b.y + Math.sin(a) * rad);
              else ctx.lineTo(b.x + Math.cos(a) * rad, b.y + Math.sin(a) * rad);
            }
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
      if (activeBursts.length > 0) requestAnimationFrame(frame);
      else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        burstLoopRunning = false;
      }
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('pointerdown', e => {
    triggerGoldBurst(e.clientX, e.clientY, 20, true);
  });

  // --------------------------------------------------------------------------
  // 2. GSAP Entrance & Exit Choreography (Chapter 1 & Chapter 4)
  // --------------------------------------------------------------------------
  function splitTitleIntoLetters() {
    const titleEl = document.getElementById('inv-hero-title');
    if (!titleEl || titleEl.dataset.splitDone) return;
    const words = titleEl.textContent.trim().split(/\s+/);
    titleEl.innerHTML = '';
    words.forEach((word, wIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'inv-word';
      word.split('').forEach(ch => {
        const span = document.createElement('span');
        span.className = 'inv-letter';
        span.textContent = ch;
        wordSpan.appendChild(span);
      });
      titleEl.appendChild(wordSpan);
      if (wIdx < words.length - 1) {
        titleEl.appendChild(document.createTextNode(' '));
      }
    });
    titleEl.dataset.splitDone = '1';
  }

  function playChapter1Entrance() {
    splitTitleIntoLetters();
    if (typeof gsap === 'undefined') return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo('.inv-card', { scale: 0.92, opacity: 0, y: 24 }, { scale: 1, opacity: 1, y: 0, duration: 1.0 }, 0)
      .fromTo('.inv-halo', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6 }, 0.1)
      .fromTo('.inv-eyebrow', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8 }, 0.25)
      .fromTo('.inv-letter', { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.0, stagger: 0.028 }, 0.3)
      .fromTo('.inv-subtitle', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9 }, 0.85)
      .fromTo('.inv-rule', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.8 }, 0.95)
      .fromTo('.inv-quote', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.0 }, 1.0)
      .fromTo('.inv-cta-wrap', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9 }, 1.15)
      .fromTo('.inv-hint', { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.3);

    const card = document.getElementById('inv-tilt-card');
    if (card && !card.dataset.tiltBound) {
      card.dataset.tiltBound = '1';
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
        gsap.to(card, { rotateX: rx, rotateY: ry, duration: 0.4, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'expo.out' });
      });
    }
  }

  let leavingCh1 = false;
  function leaveChapter1ToStudio() {
    if (leavingCh1) return;
    leavingCh1 = true;

    const btn = document.getElementById('btn-start-baking');
    if (btn) {
      const r = btn.getBoundingClientRect();
      triggerGoldBurst(r.left + r.width / 2, r.top + r.height / 2, 90);
    }

    if (typeof gsap === 'undefined') {
      switchChapter(2);
      leavingCh1 = false;
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        switchChapter(2);
        leavingCh1 = false;
      }
    });

    tl.to('.inv-letter', {
      x: () => gsap.utils.random(-140, 140),
      y: () => gsap.utils.random(-120, 120),
      rotation: () => gsap.utils.random(-60, 60),
      scale: 0.4,
      opacity: 0,
      duration: 0.75,
      stagger: 0.015,
      ease: 'power2.in'
    }, 0)
    .to(['.inv-eyebrow', '.inv-subtitle', '.inv-rule', '.inv-quote', '.inv-cta-wrap', '.inv-hint', '.inv-halo'], {
      opacity: 0, y: -14, duration: 0.5, ease: 'power2.in'
    }, 0.1);
  }

  // --------------------------------------------------------------------------
  // 3. Web Audio API Piano Synthesizer
  // --------------------------------------------------------------------------
  let audioCtx = null;
  let bgmInterval = null;

  function initAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  function playPianoNote(freq, startTime, duration = 0.75, velocity = 0.45) {
    if (!audioCtx || !state.musicEnabled) return;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.006, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 4, startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(140, freq * 1.4), startTime + duration);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.35, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    osc1.start(startTime); osc2.start(startTime);
    osc1.stop(startTime + duration + 0.05); osc2.stop(startTime + duration + 0.05);
  }

  const notesFreq = { G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
  const happyBirthdaySong = [
    { note: 'G4', dur: 0.35, delay: 0.0 }, { note: 'G4', dur: 0.35, delay: 0.4 }, { note: 'A4', dur: 0.70, delay: 0.8 },
    { note: 'G4', dur: 0.70, delay: 1.6 }, { note: 'C5', dur: 0.70, delay: 2.4 }, { note: 'B4', dur: 1.30, delay: 3.2 },
    { note: 'G4', dur: 0.35, delay: 4.8 }, { note: 'G4', dur: 0.35, delay: 5.2 }, { note: 'A4', dur: 0.70, delay: 5.6 },
    { note: 'G4', dur: 0.70, delay: 6.4 }, { note: 'D5', dur: 0.70, delay: 7.2 }, { note: 'C5', dur: 1.30, delay: 8.0 },
    { note: 'G4', dur: 0.35, delay: 9.6 }, { note: 'G4', dur: 0.35, delay: 10.0 }, { note: 'G5', dur: 0.70, delay: 10.4 },
    { note: 'E5', dur: 0.70, delay: 11.2 }, { note: 'C5', dur: 0.70, delay: 12.0 }, { note: 'B4', dur: 0.70, delay: 12.8 },
    { note: 'A4', dur: 1.20, delay: 13.6 },
    { note: 'F5', dur: 0.35, delay: 15.2 }, { note: 'F5', dur: 0.35, delay: 15.6 }, { note: 'E5', dur: 0.70, delay: 16.0 },
    { note: 'C5', dur: 0.70, delay: 16.8 }, { note: 'D5', dur: 0.70, delay: 17.6 }, { note: 'C5', dur: 1.80, delay: 18.4 }
  ];

  function playHappyBirthdayOnce() {
    initAudio();
    if (!audioCtx || !state.musicEnabled) return;
    const now = audioCtx.currentTime + 0.08;
    happyBirthdaySong.forEach(item => {
      if (notesFreq[item.note]) playPianoNote(notesFreq[item.note], now + item.delay, item.dur * 1.15, 0.45);
    });
  }

  let vocalBirthdayAudio = null;

  function playVocalHappyBirthday(onEnded) {
    stopVocalHappyBirthday();
    vocalBirthdayAudio = new Audio('assets/happy_birthday_thuan.m4a');
    vocalBirthdayAudio.volume = state.musicEnabled ? 1.0 : 0.0;
    vocalBirthdayAudio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(vocalBirthdayAudio.duration) && vocalBirthdayAudio.duration > 1) {
        state.songDuration = vocalBirthdayAudio.duration;
      }
    });
    vocalBirthdayAudio.addEventListener('ended', () => {
      if (typeof onEnded === 'function') onEnded();
    });
    vocalBirthdayAudio.play().catch(err => {
      console.warn('Vocal audio fallback to piano:', err);
      playHappyBirthdayOnce();
    });
  }

  function stopVocalHappyBirthday() {
    if (vocalBirthdayAudio) {
      vocalBirthdayAudio.pause();
      vocalBirthdayAudio.currentTime = 0;
      vocalBirthdayAudio = null;
    }
  }

  function startHappyBirthdayLoop() {
    if (bgmInterval) clearInterval(bgmInterval);
    if (!state.musicEnabled) return;
    state.musicPlaying = true;
    playHappyBirthdayOnce();
    bgmInterval = setInterval(() => {
      if (state.musicEnabled && state.chapter !== 3) playHappyBirthdayOnce();
    }, 22000);
  }

  function stopHappyBirthdayLoop() {
    state.musicPlaying = false;
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
    stopVocalHappyBirthday();
  }

  function playSoundFx(type) {
    if (!audioCtx || !state.musicEnabled) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g); g.connect(audioCtx.destination);
    if (type === 'pop') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.07);
      g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.09);
    } else if (type === 'ignite') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.35);
      g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'blow') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);
      g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.start(now); osc.stop(now + 0.4);
    }
  }

  let toastTimeout = null;
  function showToast(msg, icon = '✦') {
    const toast = document.getElementById('toast-notification');
    const msgEl = document.getElementById('toast-msg');
    if (!toast || !msgEl) return;
    msgEl.textContent = msg;
    const iconEl = toast.querySelector('.toast-icon');
    if (iconEl) iconEl.textContent = icon;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // --------------------------------------------------------------------------
  // 4. SVG Assets & Helpers
  // --------------------------------------------------------------------------
  const GraphicAssets = {
    strawberryWhole: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sg" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#ff6b81"/><stop offset="60%" stop-color="#e63946"/><stop offset="100%" stop-color="#9d0208"/></radialGradient></defs><path d="M50,92 C25,75 16,50 20,32 C23,18 42,18 50,25 C58,18 77,18 80,32 C84,50 75,75 50,92 Z" fill="url(#sg)"/><g fill="#ffd166" opacity="0.85"><circle cx="38" cy="40" r="1.6"/><circle cx="52" cy="44" r="1.6"/><circle cx="62" cy="40" r="1.6"/><circle cx="34" cy="54" r="1.6"/><circle cx="50" cy="58" r="1.6"/><circle cx="64" cy="54" r="1.6"/><circle cx="44" cy="72" r="1.4"/><circle cx="56" cy="72" r="1.4"/></g><path d="M50,24 C42,12 28,15 32,21 C36,26 48,25 50,24 Z" fill="#52b788"/><path d="M50,24 C58,12 72,15 68,21 C64,26 52,25 50,24 Z" fill="#40916c"/><path d="M50,24 L47,8 L53,8 Z" fill="#74c69d"/></svg>`,
    strawberrySlice: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,90 C28,75 20,50 24,34 C28,20 44,20 50,26 C56,20 72,20 76,34 C80,50 72,75 50,90 Z" fill="#e63946"/><path d="M50,82 C34,70 28,50 32,38 C35,28 45,28 50,33 C55,28 65,28 68,38 C72,50 66,70 50,82 Z" fill="#ffb3c1"/><ellipse cx="50" cy="56" rx="10" ry="16" fill="#fff5f5"/></svg>`,
    blueberry: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bb" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#748ffc"/><stop offset="65%" stop-color="#364fc7"/><stop offset="100%" stop-color="#18225c"/></radialGradient></defs><circle cx="50" cy="54" r="32" fill="url(#bb)"/><polygon points="50,18 55,24 62,22 58,28 63,34 55,32 50,37 45,32 37,34 42,28 38,22 45,24" fill="#2b3a8c"/><ellipse cx="38" cy="42" rx="7" ry="11" fill="#fff" opacity="0.28" transform="rotate(-25 38 42)"/></svg>`,
    raspberry: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="#c9184a"><circle cx="50" cy="26" r="12"/><circle cx="38" cy="36" r="12"/><circle cx="62" cy="36" r="12"/><circle cx="32" cy="52" r="12"/><circle cx="50" cy="50" r="13"/><circle cx="68" cy="52" r="12"/><circle cx="38" cy="68" r="12"/><circle cx="62" cy="68" r="12"/><circle cx="50" cy="78" r="11"/></g><g fill="#ff758f" opacity="0.5"><circle cx="47" cy="23" r="4"/><circle cx="35" cy="33" r="4"/><circle cx="59" cy="33" r="4"/><circle cx="47" cy="47" r="4"/></g></svg>`,
    cherryPair: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M35,58 Q45,25 60,14 Q62,32 68,58" fill="none" stroke="#52b788" stroke-width="3.5" stroke-linecap="round"/><circle cx="34" cy="68" r="20" fill="#a4133c"/><circle cx="68" cy="68" r="20" fill="#c9184a"/><ellipse cx="27" cy="60" rx="5" ry="8" fill="#fff" opacity="0.35" transform="rotate(-25 27 60)"/><ellipse cx="61" cy="60" rx="5" ry="8" fill="#fff" opacity="0.35" transform="rotate(-25 61 60)"/></svg>`,
    orangeSlice: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="38" fill="#f77f00"/><circle cx="50" cy="50" r="33" fill="#fff8e7"/><g fill="#fcbf49"><path d="M50,50 L50,20 A30,30 0 0,1 75,34 Z"/><path d="M50,50 L78,38 A30,30 0 0,1 78,62 Z"/><path d="M50,50 L75,66 A30,30 0 0,1 50,80 Z"/><path d="M50,50 L46,80 A30,30 0 0,1 22,66 Z"/><path d="M50,50 L20,62 A30,30 0 0,1 20,38 Z"/><path d="M50,50 L22,34 A30,30 0 0,1 46,20 Z"/></g></svg>`,
    macaronPink: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="36" rx="34" ry="18" fill="#ffb3c6"/><rect x="16" y="44" width="68" height="12" rx="6" fill="#fff0f3"/><ellipse cx="50" cy="64" rx="34" ry="16" fill="#ff85a1"/></svg>`,
    oreoCookie: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="36" fill="#2b211f"/><circle cx="50" cy="50" r="30" fill="none" stroke="#4a3b37" stroke-width="2" stroke-dasharray="4 3"/><circle cx="50" cy="50" r="14" fill="none" stroke="#5e4b46" stroke-width="2"/><text x="50" y="53" font-size="8" font-weight="700" fill="#8b736d" text-anchor="middle" font-family="sans-serif">OREO</text></svg>`,
    gummyHeart: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,84 C20,62 12,40 24,25 C34,14 48,22 50,34 C52,22 66,14 76,25 C88,40 80,62 50,84 Z" fill="#ff758f"/><ellipse cx="34" cy="34" rx="6" ry="10" fill="#fff" opacity="0.4" transform="rotate(-30 34 34)"/></svg>`,
    chocoHeart: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,84 C20,62 12,40 24,25 C34,14 48,22 50,34 C52,22 66,14 76,25 C88,40 80,62 50,84 Z" fill="#4a2c1d"/><path d="M24,38 Q50,24 76,38" fill="none" stroke="#d8c39a" stroke-width="2.5"/></svg>`,
    ribbonBow: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,48 C25,22 10,34 18,52 C24,62 42,56 50,50 Z" fill="#f4acb7"/><path d="M50,48 C75,22 90,34 82,52 C76,62 58,56 50,50 Z" fill="#f4acb7"/><path d="M46,52 L30,82 L40,80 L50,54 Z" fill="#e58ca0"/><path d="M54,52 L70,82 L60,80 L50,54 Z" fill="#e58ca0"/><circle cx="50" cy="50" r="8" fill="#ffcad4"/></svg>`,
    daisyFlower: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="#ffffff"><ellipse cx="50" cy="24" rx="9" ry="20"/><ellipse cx="50" cy="76" rx="9" ry="20"/><ellipse cx="24" cy="50" rx="20" ry="9"/><ellipse cx="76" cy="50" rx="20" ry="9"/><ellipse cx="32" cy="32" rx="9" ry="18" transform="rotate(-45 32 32)"/><ellipse cx="68" cy="32" rx="9" ry="18" transform="rotate(45 68 32)"/><ellipse cx="32" cy="68" rx="9" ry="18" transform="rotate(45 32 68)"/><ellipse cx="68" cy="68" rx="9" ry="18" transform="rotate(-45 68 68)"/></g><circle cx="50" cy="50" r="14" fill="#ffd166"/></svg>`,
    pearlSprinkles: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="28" cy="34" r="7" fill="#f2ebdd"/><circle cx="68" cy="28" r="6" fill="#d8c39a"/><circle cx="52" cy="56" r="8" fill="#fff"/><circle cx="32" cy="72" r="6" fill="#d9b7b0"/><circle cx="74" cy="68" r="7" fill="#f2ebdd"/><rect x="44" y="26" width="12" height="4" rx="2" fill="#d8c39a" transform="rotate(25 50 28)"/></svg>`,
    signHbdChi: `<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="8" width="128" height="58" rx="10" fill="#1b1215" stroke="#d8c39a" stroke-width="2.5"/><text x="70" y="34" font-family="Georgia, serif" font-style="italic" font-size="14" fill="#d8c39a" text-anchor="middle">Happy Birthday</text><text x="70" y="54" font-family="Georgia, serif" font-weight="bold" font-size="18" fill="#f2ebdd" text-anchor="middle" letter-spacing="2">CHI</text><rect x="68" y="66" width="4" height="22" fill="#d8c39a"/></svg>`,
    signDate2611: `<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="10" width="112" height="54" rx="27" fill="#641f31" stroke="#d8c39a" stroke-width="2.5"/><text x="70" y="44" font-family="Georgia, serif" font-weight="bold" font-size="22" fill="#f2ebdd" text-anchor="middle" letter-spacing="3">26.11</text><rect x="68" y="64" width="4" height="24" fill="#d8c39a"/></svg>`,
    signAge24: `<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="10" width="100" height="54" rx="8" fill="#1b1215" stroke="#b79a65" stroke-width="2.5"/><text x="70" y="45" font-family="Georgia, serif" font-weight="bold" font-size="21" fill="#d8c39a" text-anchor="middle" letter-spacing="2">AGE 24</text><rect x="68" y="64" width="4" height="24" fill="#b79a65"/></svg>`,
    candleGold24: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gc" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff8db"/><stop offset="45%" stop-color="#ffd166"/><stop offset="80%" stop-color="#d4af37"/><stop offset="100%" stop-color="#8c6a0c"/></linearGradient></defs><line x1="42" y1="28" x2="42" y2="16" stroke="#2b2024" stroke-width="2.5" stroke-linecap="round"/><line x1="78" y1="28" x2="78" y2="16" stroke="#2b2024" stroke-width="2.5" stroke-linecap="round"/><text x="42" y="66" font-family="Georgia, serif" font-size="46" font-weight="900" fill="url(#gc)" text-anchor="middle">2</text><text x="78" y="66" font-family="Georgia, serif" font-size="46" font-weight="900" fill="url(#gc)" text-anchor="middle">4</text><rect x="40" y="70" width="4" height="26" rx="2" fill="#d4af37"/><rect x="76" y="70" width="4" height="26" rx="2" fill="#d4af37"/><ellipse cx="42" cy="98" rx="14" ry="7" fill="#fdf0d5"/><ellipse cx="78" cy="98" rx="14" ry="7" fill="#fdf0d5"/></svg>`,
    candleSpiralPastel: `<svg viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg"><line x1="40" y1="24" x2="40" y2="14" stroke="#2b2024" stroke-width="2" stroke-linecap="round"/><rect x="36" y="24" width="8" height="66" rx="3" fill="#ffb3c6"/><path d="M36,32 Q40,34 44,36 M36,46 Q40,48 44,50 M36,60 Q40,62 44,64 M36,74 Q40,76 44,78" stroke="#ffffff" stroke-width="2.2" fill="none"/><rect x="38" y="90" width="4" height="15" rx="2" fill="#d4af37"/><ellipse cx="40" cy="106" rx="12" ry="6" fill="#fdf0d5"/></svg>`,
    candleHeart: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><line x1="50" y1="20" x2="50" y2="12" stroke="#2b2024" stroke-width="2" stroke-linecap="round"/><path d="M50,68 C28,50 20,36 28,24 C34,14 48,18 50,30 C52,18 66,14 72,24 C80,36 72,50 50,68 Z" fill="#c9184a"/><rect x="48" y="68" width="4" height="28" rx="2" fill="#d4af37"/><ellipse cx="50" cy="100" rx="14" ry="7" fill="#fdf0d5"/></svg>`,
    candleSparkler: `<svg viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg"><line x1="40" y1="12" x2="40" y2="104" stroke="#b79a65" stroke-width="2.5"/><g stroke="#ffd166" stroke-width="1.8"><line x1="40" y1="16" x2="40" y2="4"/><line x1="22" y1="30" x2="10" y2="30"/><line x1="58" y1="30" x2="70" y2="30"/><line x1="27" y1="17" x2="18" y2="8"/><line x1="53" y1="17" x2="62" y2="8"/></g><circle cx="40" cy="30" r="7" fill="#fff8db"/><ellipse cx="40" cy="105" rx="12" ry="6" fill="#fdf0d5"/></svg>`
  };

  function svgToImage(svgStr, cb) {
    const img = new Image();
    img.onload = () => cb(img);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr.trim());
  }

  function adjustColorBrightness(hex, amount) {
    let c = (hex || '#ffffff').replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // --------------------------------------------------------------------------
  // 5. Konva Full-Bleed 2.5D Cake Studio
  // --------------------------------------------------------------------------
  function getStageCenter() {
    const w = stage ? stage.width() : window.innerWidth;
    const h = stage ? stage.height() : window.innerHeight;
    // Slightly above vertical center so bottom morph dock never obscures the cake
    return { cx: w / 2, cy: h * 0.43 };
  }

  function initKonva() {
    const container = document.getElementById('konva-container');
    if (!container || typeof Konva === 'undefined') return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    stage = new Konva.Stage({ container: 'konva-container', width, height });
    plateLayer = new Konva.Layer();
    cakeLayer = new Konva.Layer();
    toppingsLayer = new Konva.Layer();
    uiLayer = new Konva.Layer();
    stage.add(plateLayer, cakeLayer, toppingsLayer, uiLayer);

    transformer = new Konva.Transformer({
      nodes: [],
      borderStroke: '#d8c39a',
      borderStrokeWidth: 1.5,
      borderDash: [4, 4],
      anchorStroke: '#b79a65',
      anchorFill: '#f2ebdd',
      anchorSize: 8,
      anchorCornerRadius: 4,
      rotateAnchorOffset: 20,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    });
    uiLayer.add(transformer);

    stage.on('click tap', e => {
      if (e.target === stage) selectItem(null);
    });

    window.addEventListener('resize', () => {
      if (!stage) return;
      stage.width(window.innerWidth);
      stage.height(window.innerHeight);
      renderPlateAndCake();
      resizePipingCanvas();
    });

    renderPlateAndCake();
    initPipingCanvas();

    setTimeout(() => {
      if (toppingsLayer.find(n => n.getAttr('isCandle')).length === 0) {
        quickPlantRoyalCandle24();
      }
    }, 120);
  }

  function getCakeTopSurfaceCenter() {
    const { cx, cy } = getStageCenter();
    const shape = state.cake.shape;
    if (shape === 'round-1') return { x: cx, y: cy - 42, rx: 175, ry: 88 };
    if (shape === 'round-2') return { x: cx, y: cy - 78, rx: 122, ry: 62 };
    if (shape === 'round-3') return { x: cx, y: cy - 105, rx: 85, ry: 42 };
    if (shape === 'heart') return { x: cx, y: cy - 40, rx: 110, ry: 55 };
    if (shape === 'square') return { x: cx, y: cy - 40, rx: 110, ry: 55 };
    return { x: cx, y: cy - 35, rx: 100, ry: 50 };
  }

  function selectItem(node) {
    state.selectedNode = node;
    const pill = document.getElementById('selected-item-info');
    if (node) {
      transformer.nodes([node]);
      uiLayer.batchDraw();
      if (pill) {
        pill.classList.add('active');
        const tag = pill.querySelector('.selection-tag');
        if (tag) tag.textContent = node.getAttr('itemName') || 'Món trang trí';
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(pill, { opacity: 0, y: 10, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'expo.out' });
        }
      }
    } else {
      transformer.nodes([]);
      uiLayer.batchDraw();
      if (pill) pill.classList.remove('active');
    }
  }

  function renderPlateAndCake() {
    if (!stage || !plateLayer || !cakeLayer) return;
    plateLayer.destroyChildren();
    cakeLayer.destroyChildren();

    const { cx, cy } = getStageCenter();
    const fitScale = Math.min(1, (stage.width() - 24) / 520);
    plateLayer.scale({ x: fitScale, y: fitScale });
    plateLayer.offset({ x: cx * (1 - 1 / fitScale), y: cy * (1 - 1 / fitScale) });
    cakeLayer.scale({ x: fitScale, y: fitScale });
    cakeLayer.offset({ x: cx * (1 - 1 / fitScale), y: cy * (1 - 1 / fitScale) });
    if (toppingsLayer) {
      toppingsLayer.scale({ x: fitScale, y: fitScale });
      toppingsLayer.offset({ x: cx * (1 - 1 / fitScale), y: cy * (1 - 1 / fitScale) });
      toppingsLayer.batchDraw();
    }

    renderPlate(cx, cy);
    renderCakeStructure(cx, cy);

    plateLayer.batchDraw();
    cakeLayer.batchDraw();

    if (typeof gsap !== 'undefined') {
      cakeLayer.scale({ x: fitScale * 0.96, y: fitScale * 0.96 });
      cakeLayer.to({ scaleX: fitScale, scaleY: fitScale, duration: 0.26, easing: Konva.Easings.BackEaseOut });
    }

    const summary = document.getElementById('cake-summary-text');
    if (summary) {
      const names = {
        'round-1': 'Bánh Tròn 1 Tầng', 'round-2': 'Bánh Tròn 2 Tầng', 'round-3': 'Bánh Tròn 3 Tầng',
        'heart': 'Bánh Trái Tim', 'square': 'Bánh Vuông', 'bento': 'Bánh Bento Mini'
      };
      summary.textContent = `${names[state.cake.shape] || 'Bánh Sinh Nhật'} • ${state.cake.flavorName}`;
    }
  }

  function renderPlate(cx, cy) {
    const p = state.cake.plate;
    const g = new Konva.Group();

    g.add(new Konva.Ellipse({ x: cx, y: cy + 40, radiusX: 255, radiusY: 130, fill: 'rgba(0,0,0,0.35)', blur: 24 }));

    if (p === 'white-gold') {
      g.add(new Konva.Ellipse({ x: cx, y: cy + 30, radiusX: 242, radiusY: 122, fill: '#f5f2eb', stroke: '#d4af37', strokeWidth: 4 }));
      g.add(new Konva.Ellipse({ x: cx, y: cy + 28, radiusX: 205, radiusY: 102, stroke: 'rgba(212,175,55,0.45)', strokeWidth: 1.5 }));
    } else if (p === 'wood') {
      g.add(new Konva.Ellipse({ x: cx, y: cy + 36, radiusX: 238, radiusY: 118, fill: '#4e3222', stroke: '#2f1c11', strokeWidth: 3 }));
      g.add(new Konva.Ellipse({ x: cx, y: cy + 28, radiusX: 238, radiusY: 116, fill: '#8a5a3c', stroke: '#b8835e', strokeWidth: 2 }));
    } else if (p === 'glass') {
      g.add(new Konva.Rect({ x: cx - 22, y: cy + 34, width: 44, height: 42, fill: 'rgba(240,245,255,0.35)', cornerRadius: 8 }));
      g.add(new Konva.Ellipse({ x: cx, y: cy + 78, radiusX: 78, radiusY: 30, fill: 'rgba(240,245,255,0.3)', stroke: 'rgba(255,255,255,0.45)', strokeWidth: 1.5 }));
      g.add(new Konva.Ellipse({ x: cx, y: cy + 28, radiusX: 236, radiusY: 116, fill: 'rgba(240,248,255,0.22)', stroke: 'rgba(255,255,255,0.6)', strokeWidth: 2 }));
    } else {
      g.add(new Konva.Ellipse({ x: cx, y: cy + 30, radiusX: 240, radiusY: 120, fill: '#f4c2ce', stroke: '#d4af37', strokeWidth: 3 }));
      g.add(new Konva.Ellipse({ x: cx, y: cy + 28, radiusX: 205, radiusY: 100, stroke: '#ffffff', strokeWidth: 1.5, opacity: 0.6 }));
    }

    // Delicate Scalloped Lace Paper Doily on the plate
    const doilyCount = 32;
    for (let i = 0; i < doilyCount; i++) {
      const ang = (i / doilyCount) * Math.PI * 2;
      g.add(new Konva.Circle({
        x: cx + Math.cos(ang) * 204,
        y: cy + 28 + Math.sin(ang) * 100,
        radius: 9,
        fill: 'rgba(255, 255, 255, 0.42)'
      }));
    }
    plateLayer.add(g);
  }

  function renderCakeStructure(cx, cy) {
    const shape = state.cake.shape;
    const color = state.cake.flavorColor;
    const g = new Konva.Group();

    if (shape === 'round-1') drawRoundTier(g, cx, cy - 42, 185, 96, 68, color);
    else if (shape === 'round-2') {
      drawRoundTier(g, cx, cy - 25, 192, 100, 52, color);
      drawRoundTier(g, cx, cy - 78, 132, 68, 48, color);
    } else if (shape === 'round-3') {
      drawRoundTier(g, cx, cy - 15, 195, 102, 45, color);
      drawRoundTier(g, cx, cy - 62, 140, 72, 42, color);
      drawRoundTier(g, cx, cy - 105, 92, 48, 38, color);
    } else if (shape === 'heart') drawHeartCake(g, cx, cy - 40, color);
    else if (shape === 'square') drawSquareCake(g, cx, cy - 40, color);
    else drawBentoCake(g, cx, cy - 35, color);

    cakeLayer.add(g);
  }

  function drawRoundTier(group, x, y, rx, ry, height, color) {
    const shade = adjustColorBrightness(color, -32);
    const midShade = adjustColorBrightness(color, -14);
    const light = adjustColorBrightness(color, 18);

    // 1. Contact shadow on the plate/tier below
    group.add(new Konva.Ellipse({
      x, y: y + height + 2, radiusX: rx + 6, radiusY: ry * 0.96,
      fill: 'rgba(10, 5, 8, 0.28)', blur: 10
    }));

    // 2. Side cylinder with rich 5-stop ambient occlusion
    const bezierRy = ry * 1.3333;
    group.add(new Konva.Shape({
      sceneFunc: (ctx, shape) => {
        ctx.beginPath();
        ctx.moveTo(x - rx, y);
        ctx.bezierCurveTo(x - rx, y + bezierRy, x + rx, y + bezierRy, x + rx, y);
        ctx.lineTo(x + rx, y + height);
        ctx.bezierCurveTo(x + rx, y + bezierRy + height, x - rx, y + bezierRy + height, x - rx, y + height);
        ctx.closePath();
        ctx.fillStrokeShape(shape);
      },
      fillLinearGradientStartPoint: { x: x - rx, y },
      fillLinearGradientEndPoint: { x: x + rx, y },
      fillLinearGradientColorStops: [0, shade, 0.22, midShade, 0.45, light, 0.72, color, 1, shade],
      stroke: shade, strokeWidth: 0.6
    }));

    // 3. Hand-piped Chantilly Cream Pearls along the bottom rim
    const pearlCount = Math.max(16, Math.round(rx / 7));
    for (let i = 0; i <= pearlCount; i++) {
      const ang = (i / pearlCount) * Math.PI;
      const px = x + Math.cos(ang) * (rx + 1);
      const py = y + height + Math.sin(ang) * (ry * 0.92);
      group.add(new Konva.Ellipse({
        x: px, y: py, radiusX: 6.5, radiusY: 4.5,
        fillRadialGradientStartPoint: { x: -2, y: -1.5 },
        fillRadialGradientStartRadius: 0,
        fillRadialGradientEndPoint: { x: 0, y: 0 },
        fillRadialGradientEndRadius: 7,
        fillRadialGradientColorStops: [0, '#ffffff', 0.65, light, 1, midShade],
        stroke: 'rgba(183,154,101,0.28)', strokeWidth: 0.4
      }));
    }

    // 4. Top surface with radial glaze + specular sheen
    group.add(new Konva.Ellipse({
      x, y, radiusX: rx, radiusY: ry,
      fillRadialGradientStartPoint: { x: x - rx * 0.28, y: y - ry * 0.28 },
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndPoint: { x, y },
      fillRadialGradientEndRadius: rx,
      fillRadialGradientColorStops: [0, light, 0.6, color, 1, midShade],
      stroke: 'rgba(216,195,154,0.5)', strokeWidth: 1.2
    }));

    // Specular highlight crescent
    group.add(new Konva.Ellipse({
      x: x - rx * 0.28, y: y - ry * 0.26, radiusX: rx * 0.36, radiusY: ry * 0.22,
      fill: '#ffffff', opacity: 0.16, rotation: -12
    }));

    applyFrostingTexture(group, x, y, rx, ry, color);
    if (state.cake.drip !== 'none') drawDripAroundTier(group, x, y, rx, ry, state.cake.dripColor, state.cake.dripLength);
  }

  function drawDripAroundTier(group, x, y, rx, ry, dripColor, length) {
    const dripLight = adjustColorBrightness(dripColor, 26);
    const steps = 18;
    group.add(new Konva.Shape({
      sceneFunc: (ctx, shape) => {
        ctx.beginPath();
        // Top glaze collar covering the upper rim cleanly
        ctx.ellipse(x, y, rx + 1, ry + 1, 0, Math.PI, Math.PI * 2, false);
        // Smooth organic drips flowing down the front face
        for (let i = 0; i < steps; i++) {
          const a1 = (i / steps) * Math.PI;
          const a2 = ((i + 1) / steps) * Math.PI;
          const midA = (a1 + a2) / 2;
          const x2 = x + Math.cos(a2) * (rx + 1);
          const y2 = y + Math.sin(a2) * (ry + 1);
          const drop = ((i % 3 === 0) ? 1.1 : (i % 2 === 0 ? 0.65 : 0.35)) * length;
          const mx = x + Math.cos(midA) * (rx + 1);
          const my = y + Math.sin(midA) * (ry + 1) + drop;
          ctx.quadraticCurveTo(mx, my, x2, y2);
        }
        ctx.closePath();
        ctx.fillStrokeShape(shape);
      },
      fill: dripColor,
      opacity: 0.96,
      shadowColor: 'rgba(0,0,0,0.35)',
      shadowBlur: 5,
      shadowOffsetY: 2
    }));

    // Glossy specular dots on the longest drips
    for (let i = 0; i < steps; i += 3) {
      const midA = ((i + 0.5) / steps) * Math.PI;
      const mx = x + Math.cos(midA) * rx;
      const my = y + Math.sin(midA) * ry + length * 0.55;
      group.add(new Konva.Ellipse({ x: mx - 1.5, y: my, radiusX: 2, radiusY: 4, fill: dripLight, opacity: 0.55 }));
    }
  }

  function applyFrostingTexture(group, x, y, rx, ry, baseColor) {
    const tex = state.cake.texture;
    if (tex === 'swirl') {
      for (let i = 1; i <= 5; i++) {
        group.add(new Konva.Ellipse({
          x, y, radiusX: rx * (i / 6), radiusY: ry * (i / 6),
          stroke: adjustColorBrightness(baseColor, -14), strokeWidth: 1.4, opacity: 0.45
        }));
      }
    } else if (tex === 'watercolor') {
      group.add(new Konva.Ellipse({
        x: x + rx * 0.25, y: y - ry * 0.15, radiusX: rx * 0.55, radiusY: ry * 0.5,
        fill: '#d9b7b0', opacity: 0.35
      }));
    } else if (tex === 'glitter') {
      for (let i = 0; i < 28; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.random() * 0.85;
        group.add(new Konva.Circle({
          x: x + Math.cos(ang) * rx * rad, y: y + Math.sin(ang) * ry * rad,
          radius: 1.5 + Math.random() * 1.5, fill: '#ffd166', opacity: 0.78
        }));
      }
    }
  }

  function drawHeartCake(group, cx, cy, color) {
    const shade = adjustColorBrightness(color, -25);
    const h = 66;
    group.add(new Konva.Shape({
      sceneFunc: (ctx, shape) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + 68);
        ctx.bezierCurveTo(cx - 80, cy + 20, cx - 140, cy - 30, cx - 70, cy - 58);
        ctx.bezierCurveTo(cx - 20, cy - 48, cx, cy - 18, cx, cy - 8);
        ctx.bezierCurveTo(cx, cy - 18, cx + 20, cy - 48, cx + 70, cy - 58);
        ctx.bezierCurveTo(cx + 140, cy - 30, cx + 80, cy + 20, cx, cy + 68);
        ctx.lineTo(cx, cy + 68 + h);
        ctx.bezierCurveTo(cx + 80, cy + 20 + h, cx + 140, cy - 30 + h, cx + 70, cy - 58 + h);
        ctx.bezierCurveTo(cx - 140, cy - 30 + h, cx - 80, cy + 20 + h, cx, cy + 68 + h);
        ctx.closePath(); ctx.fillStrokeShape(shape);
      },
      fill: shade
    }));
    group.add(new Konva.Shape({
      sceneFunc: (ctx, shape) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + 68);
        ctx.bezierCurveTo(cx - 80, cy + 20, cx - 140, cy - 30, cx - 70, cy - 58);
        ctx.bezierCurveTo(cx - 20, cy - 48, cx, cy - 18, cx, cy - 8);
        ctx.bezierCurveTo(cx, cy - 18, cx + 20, cy - 48, cx + 70, cy - 58);
        ctx.bezierCurveTo(cx + 140, cy - 30, cx + 80, cy + 20, cx, cy + 68);
        ctx.closePath(); ctx.fillStrokeShape(shape);
      },
      fill: color, stroke: 'rgba(212,175,55,0.45)', strokeWidth: 1.5
    }));
  }

  function drawSquareCake(group, cx, cy, color) {
    const shade = adjustColorBrightness(color, -25);
    const w = 140, h = 70, d = 64;
    group.add(new Konva.Shape({
      sceneFunc: (ctx, shape) => {
        ctx.beginPath();
        ctx.moveTo(cx - w, cy); ctx.lineTo(cx, cy + h); ctx.lineTo(cx + w, cy);
        ctx.lineTo(cx + w, cy + d); ctx.lineTo(cx, cy + h + d); ctx.lineTo(cx - w, cy + d);
        ctx.closePath(); ctx.fillStrokeShape(shape);
      },
      fill: shade
    }));
    group.add(new Konva.Shape({
      sceneFunc: (ctx, shape) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy - h); ctx.lineTo(cx + w, cy); ctx.lineTo(cx, cy + h); ctx.lineTo(cx - w, cy);
        ctx.closePath(); ctx.fillStrokeShape(shape);
      },
      fill: color, stroke: 'rgba(212,175,55,0.45)', strokeWidth: 1.5
    }));
  }

  function drawBentoCake(group, cx, cy, color) {
    group.add(new Konva.Ellipse({ x: cx, y: cy + 28, radiusX: 162, radiusY: 94, fill: '#f3e9dc', stroke: '#d4a373', strokeWidth: 3 }));
    drawRoundTier(group, cx, cy, 122, 64, 42, color);
  }

  // --------------------------------------------------------------------------
  // 6. Piping Canvas
  // --------------------------------------------------------------------------
  function initPipingCanvas() {
    pipingCanvas = document.getElementById('piping-canvas');
    if (!pipingCanvas) return;
    pipingCtx = pipingCanvas.getContext('2d');
    resizePipingCanvas();

    let isDown = false, lx = 0, ly = 0;
    const getPos = e => {
      const r = pipingCanvas.getBoundingClientRect();
      const pt = e.touches ? e.touches[0] : e;
      return { x: pt.clientX - r.left, y: pt.clientY - r.top };
    };
    const startDraw = e => {
      isDown = true;
      const pos = getPos(e);
      lx = pos.x; ly = pos.y;
      drawPipingDab(lx, ly);
    };
    const moveDraw = e => {
      if (!isDown) return;
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);
      const dist = Math.hypot(pos.x - lx, pos.y - ly);
      const count = Math.ceil(dist / Math.max(3, state.cake.pipingSize * 0.35));
      for (let i = 0; i < count; i++) {
        const t = i / count;
        drawPipingDab(lx + (pos.x - lx) * t, ly + (pos.y - ly) * t);
      }
      lx = pos.x; ly = pos.y;
    };
    const endDraw = () => { if (isDown) { isDown = false; savePipingState(); } };

    pipingCanvas.addEventListener('mousedown', startDraw);
    pipingCanvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
    pipingCanvas.addEventListener('touchstart', startDraw, { passive: true });
    pipingCanvas.addEventListener('touchmove', moveDraw, { passive: false });
    window.addEventListener('touchend', endDraw);
  }

  function resizePipingCanvas() {
    if (!pipingCanvas) return;
    pipingCanvas.width = window.innerWidth;
    pipingCanvas.height = window.innerHeight;
    if (state.pipingHistory.length > 0) {
      pipingCtx.putImageData(state.pipingHistory[state.pipingHistory.length - 1], 0, 0);
    }
  }

  function drawPipingDab(x, y) {
    if (!pipingCtx) return;
    const { pipingColor: color, pipingSize: size, pipingTip: tip } = state.cake;
    pipingCtx.fillStyle = color;
    pipingCtx.shadowColor = 'rgba(0,0,0,0.22)';
    pipingCtx.shadowBlur = 4;
    if (tip === 'round') {
      pipingCtx.beginPath(); pipingCtx.arc(x, y, size / 2, 0, Math.PI * 2); pipingCtx.fill();
    } else if (tip === 'star') {
      drawStarRosette(pipingCtx, x, y, size, color);
    } else {
      pipingCtx.beginPath(); pipingCtx.ellipse(x, y, size * 0.7, size * 0.45, 0, 0, Math.PI * 2); pipingCtx.fill();
    }
  }

  function drawStarRosette(ctx, x, y, size, color) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = color; ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const ang = (Math.PI / 6) * i;
      const r = i % 2 === 0 ? size * 0.7 : size * 0.34;
      if (i === 0) ctx.moveTo(r * Math.cos(ang), r * Math.sin(ang));
      else ctx.lineTo(r * Math.cos(ang), r * Math.sin(ang));
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function savePipingState() {
    if (pipingCanvas) state.pipingHistory.push(pipingCtx.getImageData(0, 0, pipingCanvas.width, pipingCanvas.height));
  }

  function clearPiping() {
    if (!pipingCtx || !pipingCanvas) return;
    pipingCtx.clearRect(0, 0, pipingCanvas.width, pipingCanvas.height);
    state.pipingHistory = [];
    showToast('Đã xóa toàn bộ nét vẽ kem!');
  }

  function autoPipeBorder() {
    if (!pipingCtx || !stage) return;
    const top = getCakeTopSurfaceCenter();
    const size = Math.max(16, state.cake.pipingSize);
    for (let i = 0; i < 28; i++) {
      const ang = (Math.PI * 2 / 28) * i;
      drawStarRosette(pipingCtx, top.x + top.rx * Math.cos(ang), top.y + top.ry * Math.sin(ang), size, state.cake.pipingColor);
    }
    savePipingState(); playSoundFx('pop');
    showToast('Đã tự động bắt viền hoa quanh vành bánh!');
  }

  // --------------------------------------------------------------------------
  // 7. Toppings, Candles & Photo Toppers
  // --------------------------------------------------------------------------
  function addToppingToStage(item, targetX, targetY) {
    if (!stage || !toppingsLayer) return;
    svgToImage(item.svg, img => {
      const top = getCakeTopSurfaceCenter();
      const cx = targetX !== undefined ? targetX : (top.x + (Math.random() * top.rx * 0.5 - top.rx * 0.25));
      const cy = targetY !== undefined ? targetY : (top.y + (Math.random() * top.ry * 0.4 - top.ry * 0.2));

      const kImg = new Konva.Image({
        image: img, x: cx, y: cy - 22, opacity: 0,
        width: item.id.includes('sign') ? 85 : (item.isCandle ? 82 : 54),
        height: item.id.includes('sign') ? 56 : (item.isCandle ? 82 : 54),
        offsetX: item.id.includes('sign') ? 42 : (item.isCandle ? 41 : 27),
        offsetY: item.id.includes('sign') ? 28 : (item.candleType === '24' ? 67 : (item.isCandle ? 72 : 27)),
        draggable: true
      });
      kImg.setAttr('itemName', item.name);
      kImg.setAttr('isCandle', !!item.isCandle);
      kImg.setAttr('candleType', item.candleType || '');
      kImg.on('click tap', e => { e.cancelBubble = true; selectItem(kImg); });

      toppingsLayer.add(kImg); toppingsLayer.batchDraw();
      kImg.to({ y: cy, opacity: 1, duration: 0.28, easing: Konva.Easings.BackEaseOut, onFinish: () => selectItem(kImg) });
      playSoundFx('pop');
      showToast(`Đã cắm ${item.name} lên bánh!`);
    });
  }

  function quickPlantRoyalCandle24() {
    if (!stage || !toppingsLayer) return;
    toppingsLayer.find(n => n.getAttr('candleType') === '24').forEach(n => n.destroy());
    const top = getCakeTopSurfaceCenter();
    addToppingToStage({
      id: 'candle-gold-24', name: 'Nến Số 24 Hoàng Gia',
      svg: GraphicAssets.candleGold24, isCandle: true, candleType: '24'
    }, top.x, top.y);
  }

  function quickPlantCandleCircle() {
    if (!stage || !toppingsLayer) return;
    const top = getCakeTopSurfaceCenter();
    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI * 2 / 6) * i;
      setTimeout(() => {
        addToppingToStage({
          id: `candle-spiral-${i}`, name: 'Nến Xoắn Pastel',
          svg: GraphicAssets.candleSpiralPastel, isCandle: true, candleType: 'spiral'
        }, top.x + top.rx * 0.72 * Math.cos(ang), top.y + top.ry * 0.72 * Math.sin(ang));
      }, i * 65);
    }
  }

  function addCustomPhotoTopper(dataUrl) {
    const frame = state.cake.frameChoice;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160; canvas.height = 200;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#d8c39a'; ctx.fillRect(77, 110, 6, 85);
      ctx.save();
      if (frame === 'round-gold') {
        ctx.beginPath(); ctx.arc(80, 70, 52, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 5; ctx.stroke();
        ctx.clip(); ctx.drawImage(img, 28, 18, 104, 104);
      } else if (frame === 'heart-ribbon') {
        ctx.beginPath(); ctx.moveTo(80, 115);
        ctx.bezierCurveTo(35, 75, 25, 45, 45, 25); ctx.bezierCurveTo(60, 12, 75, 22, 80, 40);
        ctx.bezierCurveTo(85, 22, 100, 12, 115, 25); ctx.bezierCurveTo(135, 45, 125, 75, 80, 115);
        ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#c9184a'; ctx.lineWidth = 5; ctx.stroke();
        ctx.clip(); ctx.drawImage(img, 25, 15, 110, 105);
      } else {
        ctx.fillStyle = '#fff'; ctx.fillRect(30, 20, 100, 120);
        ctx.drawImage(img, 38, 28, 84, 76);
        ctx.fillStyle = '#641f31'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Chi • 26.11', 80, 126);
      }
      ctx.restore();

      const framed = new Image();
      framed.onload = () => {
        const top = getCakeTopSurfaceCenter();
        const kImg = new Konva.Image({
          image: framed, x: top.x, y: top.y, width: 90, height: 112,
          offsetX: 45, offsetY: 90, draggable: true
        });
        kImg.setAttr('itemName', 'Topper Ảnh Chi');
        kImg.on('click tap', e => { e.cancelBubble = true; selectItem(kImg); });
        toppingsLayer.add(kImg); toppingsLayer.batchDraw();
        selectItem(kImg); playSoundFx('pop');
        showToast('Đã tạo Cake Topper ảnh riêng của Chi!');
      };
      framed.src = canvas.toDataURL();
    };
    img.src = dataUrl;
  }

  function populateToppingsList(category = 'fruits') {
    const list = document.getElementById('toppings-list');
    if (!list) return;
    list.innerHTML = '';
    const items = {
      fruits: [
        { id: 'strawberry-whole', name: 'Dâu Tây', svg: GraphicAssets.strawberryWhole },
        { id: 'strawberry-slice', name: 'Lát Dâu', svg: GraphicAssets.strawberrySlice },
        { id: 'blueberry', name: 'Việt Quất', svg: GraphicAssets.blueberry },
        { id: 'raspberry', name: 'Mâm Xôi', svg: GraphicAssets.raspberry },
        { id: 'cherry-pair', name: 'Cherry', svg: GraphicAssets.cherryPair },
        { id: 'orange-slice', name: 'Lát Cam', svg: GraphicAssets.orangeSlice }
      ],
      sweets: [
        { id: 'macaron-pink', name: 'Macaron', svg: GraphicAssets.macaronPink },
        { id: 'oreo-cookie', name: 'Oreo', svg: GraphicAssets.oreoCookie },
        { id: 'gummy-heart', name: 'Kẹo Tim', svg: GraphicAssets.gummyHeart },
        { id: 'choco-heart', name: 'Socola Tim', svg: GraphicAssets.chocoHeart },
        { id: 'ribbon-bow', name: 'Nơ Lụa', svg: GraphicAssets.ribbonBow },
        { id: 'daisy-flower', name: 'Cúc Họa Mi', svg: GraphicAssets.daisyFlower },
        { id: 'pearl-sprinkles', name: 'Ngọc Trai', svg: GraphicAssets.pearlSprinkles }
      ],
      signs: [
        { id: 'sign-hbd-chi', name: 'HBD Chi', svg: GraphicAssets.signHbdChi },
        { id: 'sign-date-2611', name: '26.11', svg: GraphicAssets.signDate2611 },
        { id: 'sign-age-24', name: 'Age 24', svg: GraphicAssets.signAge24 }
      ]
    };
    (items[category] || items.fruits).forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'topping-item-btn';
      btn.innerHTML = `${item.svg}<span>${item.name}</span>`;
      btn.addEventListener('click', () => addToppingToStage(item));
      list.appendChild(btn);
    });
  }

  function populateCandlesList() {
    const list = document.getElementById('candles-list');
    if (!list) return;
    list.innerHTML = '';
    [
      { id: 'candle-gold-24', name: 'Nến Số 24', svg: GraphicAssets.candleGold24, isCandle: true, candleType: '24' },
      { id: 'candle-spiral', name: 'Nến Pastel', svg: GraphicAssets.candleSpiralPastel, isCandle: true, candleType: 'spiral' },
      { id: 'candle-heart', name: 'Nến Tim', svg: GraphicAssets.candleHeart, isCandle: true, candleType: 'heart' },
      { id: 'candle-sparkler', name: 'Pháo Sáng', svg: GraphicAssets.candleSparkler, isCandle: true, candleType: 'sparkler' }
    ].forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'candle-item-btn';
      btn.innerHTML = `${c.svg}<span>${c.name}</span>`;
      btn.addEventListener('click', () => addToppingToStage(c));
      list.appendChild(btn);
    });
  }

  // --------------------------------------------------------------------------
  // 8. Chapter 3: Candlelight Ceremony
  // --------------------------------------------------------------------------
  function enterCandleCeremony() {
    selectItem(null);
    setNightMode(true);
    switchChapter(3);
    state.candlesLit = true;
    state.smokeParticles = [];
    playSoundFx('ignite');
    setupNightCakeCanvas();
    startCandleFlamesAnimation();
    startSongListeningPhase();
  }

  function setupNightCakeCanvas() {
    const canvas = document.getElementById('night-cake-canvas');
    if (!canvas || !stage) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!nightCakeSnapshot || nightCakeSnapshot.width !== canvas.width || nightCakeSnapshot.height !== canvas.height) {
      nightCakeSnapshot = document.createElement('canvas');
      nightCakeSnapshot.width = canvas.width;
      nightCakeSnapshot.height = canvas.height;
    }
    const snapCtx = nightCakeSnapshot.getContext('2d');
    snapCtx.clearRect(0, 0, nightCakeSnapshot.width, nightCakeSnapshot.height);

    const temp = document.createElement('canvas');
    temp.width = stage.width(); temp.height = stage.height();
    const tctx = temp.getContext('2d');
    tctx.drawImage(plateLayer.getCanvas()._canvas, 0, 0, temp.width, temp.height);
    tctx.drawImage(cakeLayer.getCanvas()._canvas, 0, 0, temp.width, temp.height);
    if (pipingCanvas) tctx.drawImage(pipingCanvas, 0, 0, temp.width, temp.height);
    tctx.drawImage(toppingsLayer.getCanvas()._canvas, 0, 0, temp.width, temp.height);

    // Crop around the cake center (accounting for multi-tier height & candles)
    const { cx, cy } = getStageCenter();
    const fitScale = Math.min(1, (stage.width() - 24) / 520);
    const cropW = 580, cropH = 500;
    const sx0 = Math.max(0, cx - cropW / 2);
    const sy0 = Math.max(0, cy - cropH / 2 - 42);
    const scale = Math.min(nightCakeSnapshot.width / cropW, nightCakeSnapshot.height / cropH) * 0.94;
    const dw = cropW * scale, dh = cropH * scale;
    const ox = (nightCakeSnapshot.width - dw) / 2;
    const oy = (nightCakeSnapshot.height - dh) / 2;

    snapCtx.drawImage(temp, sx0, sy0, cropW, cropH, ox, oy, dw, dh);
    ctx.drawImage(nightCakeSnapshot, 0, 0);

    candleFlames = [];
    const nodes = toppingsLayer.find(n => n.getAttr('isCandle'));
    if (nodes.length > 0) {
      nodes.forEach(n => {
        const layerX = cx + (n.x() - cx) * fitScale;
        const layerY = cy + (n.y() - cy) * fitScale;
        const nx = ox + (layerX - sx0) * scale;
        const ny = oy + (layerY - sy0) * scale;
        const sx = n.scaleX() * fitScale * scale;
        const sy = n.scaleY() * fitScale * scale;
        const cType = n.getAttr('candleType');
        if (cType === '24') {
          candleFlames.push({ x: nx - 12.3 * sx, y: ny - 54 * sy, size: 15, lit: true });
          candleFlames.push({ x: nx + 12.3 * sx, y: ny - 54 * sy, size: 15, lit: true });
        } else if (cType === 'sparkler') {
          candleFlames.push({ x: nx, y: ny - 52 * sy, size: 14, lit: true });
        } else {
          candleFlames.push({ x: nx, y: ny - 63 * sy, size: 14, lit: true });
        }
      });
    } else {
      candleFlames.push({ x: canvas.width / 2 - 14, y: canvas.height / 2 - 60, size: 15, lit: true });
      candleFlames.push({ x: canvas.width / 2 + 14, y: canvas.height / 2 - 60, size: 15, lit: true });
    }
  }

  function startCandleFlamesAnimation() {
    if (nightAnimId) cancelAnimationFrame(nightAnimId);
    const canvas = document.getElementById('night-cake-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function loop() {
      if (state.chapter !== 3) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (nightCakeSnapshot) ctx.drawImage(nightCakeSnapshot, 0, 0);

      const t = Date.now() * 0.006;
      candleFlames.forEach((f, idx) => {
        if (!f.lit) return;
        const flicker = Math.sin(t + idx * 1.7) * 2.2;
        const glow = ctx.createRadialGradient(f.x, f.y - 6, 2, f.x, f.y - 6, f.size * 2.6);
        glow.addColorStop(0, 'rgba(255, 224, 130, 0.58)');
        glow.addColorStop(1, 'rgba(255, 160, 40, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(f.x, f.y - 6, f.size * 2.6, 0, Math.PI * 2); ctx.fill();

        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(state.flameAngle + flicker * 0.04);
        ctx.beginPath();
        ctx.moveTo(0, -f.size * 1.4);
        ctx.quadraticCurveTo(f.size * 0.55, -f.size * 0.3, 0, 0);
        ctx.quadraticCurveTo(-f.size * 0.55, -f.size * 0.3, 0, -f.size * 1.4);
        ctx.fillStyle = '#ffaa33'; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -f.size * 0.85);
        ctx.quadraticCurveTo(f.size * 0.25, -f.size * 0.2, 0, 0);
        ctx.quadraticCurveTo(-f.size * 0.25, -f.size * 0.2, 0, -f.size * 0.85);
        ctx.fillStyle = '#fff9db'; ctx.fill();
        ctx.restore();
      });

      state.smokeParticles.forEach(p => {
        p.y += p.vy; p.x += Math.sin(t + p.y * 0.05) * 0.4; p.alpha -= 0.012;
        if (p.alpha > 0) {
          ctx.fillStyle = `rgba(235, 230, 225, ${p.alpha})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
      });
      state.smokeParticles = state.smokeParticles.filter(p => p.alpha > 0);
      nightAnimId = requestAnimationFrame(loop);
    }
    nightAnimId = requestAnimationFrame(loop);
  }

  function startSongListeningPhase() {
    state.songListeningFinished = false;
    state.songElapsed = 0;
    state.songDuration = 19.5;
    const blowPhase = document.getElementById('ceremony-blow-phase');
    const blowBtn = document.getElementById('btn-blow-candle-manual');
    const blowText = document.getElementById('btn-blow-text');
    const countdown = document.getElementById('song-countdown-text');
    const progress = document.getElementById('song-progress-fill');
    const vinyl = document.getElementById('vinyl-disc');
    const micStatus = document.getElementById('mic-status-text');
    const songStatus = document.getElementById('song-status-text');

    if (blowPhase) blowPhase.classList.add('locked');
    if (blowBtn) { blowBtn.disabled = true; blowBtn.classList.add('locked'); }
    if (vinyl) vinyl.classList.add('spinning');
    if (songStatus) songStatus.textContent = 'Đang phát lời hát mừng sinh nhật của chồng...';
    if (micStatus) micStatus.textContent = 'Micro sẽ mở khóa ngay sau khi nghe hết lời hát...';
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
    playVocalHappyBirthday(() => {
      if (state.songTimerInterval) { clearInterval(state.songTimerInterval); state.songTimerInterval = null; }
      if (progress) progress.style.width = '100%';
      if (countdown) countdown.textContent = '0s';
      if (!state.songListeningFinished) onSongListeningFinished();
    });

    if (state.songTimerInterval) clearInterval(state.songTimerInterval);
    state.songTimerInterval = setInterval(() => {
      if (vocalBirthdayAudio && !vocalBirthdayAudio.paused && Number.isFinite(vocalBirthdayAudio.currentTime)) {
        state.songElapsed = vocalBirthdayAudio.currentTime;
      } else {
        state.songElapsed += 0.2;
      }
      const pct = Math.min(100, (state.songElapsed / state.songDuration) * 100);
      const rem = Math.max(0, Math.ceil(state.songDuration - state.songElapsed));
      if (progress) progress.style.width = pct + '%';
      if (countdown) countdown.textContent = rem + 's';
      if (blowText) blowText.textContent = `Đang nghe chồng hát... Vui lòng chờ (${rem}s)`;
      if (state.songElapsed >= state.songDuration) {
        clearInterval(state.songTimerInterval); state.songTimerInterval = null;
        if (!state.songListeningFinished) onSongListeningFinished();
      }
    }, 200);
  }

  function onSongListeningFinished() {
    state.songListeningFinished = true;
    const blowPhase = document.getElementById('ceremony-blow-phase');
    const blowBtn = document.getElementById('btn-blow-candle-manual');
    const blowText = document.getElementById('btn-blow-text');
    const vinyl = document.getElementById('vinyl-disc');
    const micStatus = document.getElementById('mic-status-text');

    if (blowPhase) blowPhase.classList.remove('locked');
    if (blowBtn) {
      blowBtn.disabled = false; blowBtn.classList.remove('locked');
      const ico = blowBtn.querySelector('.btn-blow-icon');
      if (ico) ico.textContent = '✦';
    }
    if (blowText) blowText.textContent = 'Thổi tắt nến (hoặc nhấn Space)';
    if (vinyl) vinyl.classList.remove('spinning');
    if (micStatus) micStatus.textContent = 'Micro đã sẵn sàng! Em thổi một hơi thật dài nhé...';
    showToast('Giai điệu đã hoàn tất! Em hãy ước và thổi nến nhé!');
    startMicrophoneDetection();
  }

  function startMicrophoneDetection() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        state.micStream = stream; initAudio();
        const src = audioCtx.createMediaStreamSource(stream);
        state.analyser = audioCtx.createAnalyser(); state.analyser.fftSize = 256;
        src.connect(state.analyser);
        state.micDataArray = new Uint8Array(state.analyser.frequencyBinCount);
        state.isListeningMic = true;

        function checkWind() {
          if (!state.isListeningMic || state.chapter !== 3 || !state.candlesLit) return;
          state.analyser.getByteFrequencyData(state.micDataArray);
          let sum = 0;
          for (let i = 0; i < state.micDataArray.length; i++) sum += state.micDataArray[i];
          const pct = Math.min(100, Math.round((sum / state.micDataArray.length / 80) * 100));
          const fill = document.getElementById('wind-gauge-fill');
          const num = document.getElementById('wind-gauge-percent');
          if (fill) fill.style.width = pct + '%';
          if (num) num.textContent = pct + '%';
          state.flameAngle = (pct / 100) * 0.85;
          if (pct >= 55 && state.songListeningFinished) { triggerCandleExtinguish(); return; }
          requestAnimationFrame(checkWind);
        }
        checkWind();
      })
      .catch(() => {
        const micStatus = document.getElementById('mic-status-text');
        if (micStatus) micStatus.textContent = 'Nhấn nút bên dưới hoặc phím Space để thổi nến!';
      });
  }

  function triggerCandleExtinguish() {
    if (!state.candlesLit || !state.songListeningFinished) return;
    state.candlesLit = false; state.isListeningMic = false;
    if (state.micStream) { state.micStream.getTracks().forEach(t => t.stop()); state.micStream = null; }
    playSoundFx('blow');

    candleFlames.forEach(f => {
      f.lit = false;
      for (let i = 0; i < 14; i++) {
        state.smokeParticles.push({
          x: f.x + (Math.random() * 6 - 3), y: f.y - 4,
          vy: -0.9 - Math.random() * 1.2, r: 3 + Math.random() * 4, alpha: 0.75
        });
      }
    });

    if (typeof confetti === 'function') {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 }, colors: ['#d8c39a', '#b79a65', '#f2ebdd', '#d9b7b0'] });
    }
    setTimeout(() => { setNightMode(false); switchChapter(4); }, 1500);
  }

  // --------------------------------------------------------------------------
  // 9. Export Cake Image & Chapter 4 Multi-Step Finale
  // --------------------------------------------------------------------------
  function renderCakeDataUrl(withSignature = true) {
    if (!stage) return '';
    selectItem(null);
    const out = document.createElement('canvas');
    out.width = 960; out.height = 760;
    const ctx = out.getContext('2d');
    const grad = ctx.createRadialGradient(480, 340, 40, 480, 340, 560);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.55, '#e3f7ef');
    grad.addColorStop(1, '#c3ebdc');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, out.width, out.height);

    const temp = document.createElement('canvas');
    temp.width = stage.width(); temp.height = stage.height();
    const tctx = temp.getContext('2d');
    tctx.drawImage(plateLayer.getCanvas()._canvas, 0, 0, temp.width, temp.height);
    tctx.drawImage(cakeLayer.getCanvas()._canvas, 0, 0, temp.width, temp.height);
    if (pipingCanvas) tctx.drawImage(pipingCanvas, 0, 0, temp.width, temp.height);
    tctx.drawImage(toppingsLayer.getCanvas()._canvas, 0, 0, temp.width, temp.height);

    const { cx, cy } = getStageCenter();
    const cropW = 580, cropH = 460;
    const sx0 = Math.max(0, cx - cropW / 2);
    const sy0 = Math.max(0, cy - cropH / 2 - 20);
    const scale = Math.min(820 / cropW, 590 / cropH);
    const dw = cropW * scale, dh = cropH * scale;
    const dy = withSignature ? (680 - dh) / 2 : (760 - dh) / 2;
    ctx.drawImage(temp, sx0, sy0, cropW, cropH, (960 - dw) / 2, dy, dw, dh);

    if (withSignature) {
      ctx.fillStyle = '#15382e'; ctx.font = '600 20px "Be Vietnam Pro", "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Thiết kế bởi Chi (26/11/2002) • Quà tặng từ chồng Thuận ❤️', 480, 718);
    }
    return out.toDataURL('image/png');
  }

  function exportCakeImage() {
    const dataUrl = renderCakeDataUrl();
    if (!dataUrl) return;
    if (window.pywebview && window.pywebview.api && window.pywebview.api.save_cake_image) {
      window.pywebview.api.save_cake_image(dataUrl, 'Banh_Sinh_Nhat_Chi_24_Tuoi.png')
        .then(res => { if (res && res.success) showToast('Đã lưu ảnh chiếc bánh thành công!'); });
    } else {
      const a = document.createElement('a');
      a.download = 'Banh_Sinh_Nhat_Chi_24_Tuoi.png'; a.href = dataUrl; a.click();
      showToast('Đã tải xuống ảnh chiếc bánh!');
    }
  }

  function showCh4Stage(stageId) {
    document.querySelectorAll('.ch4-stage').forEach(el => {
      el.classList.remove('active');
      el.style.opacity = 0;
    });
    const target = document.getElementById(stageId);
    if (!target) return;
    target.classList.add('active');
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(target, { opacity: 0, y: 24, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: 'expo.out' });
    } else {
      target.style.opacity = 1;
    }
  }

  function showContinuousLetter() {
    showCh4Stage('ch4-step-letter');
    if (typeof gsap !== 'undefined') {
      gsap.fromTo('.letter-body-continuous > *, .letter-nav-footer',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.75, stagger: 0.16, delay: 0.15, ease: 'expo.out' }
      );
    }
  }

  function openEnvelopeSequence() {
    const seal = document.getElementById('btn-open-envelope');
    if (seal) {
      const r = seal.getBoundingClientRect();
      triggerGoldBurst(r.left + r.width / 2, r.top + r.height / 2, 70);
    }
    playSoundFx('ignite');
    if (typeof gsap !== 'undefined') {
      const tl = gsap.timeline({ onComplete: showContinuousLetter });
      tl.to('.wax-seal-btn', { scale: 1.3, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
        .to('.envelope-flap', { rotateX: 180, duration: 0.55, ease: 'power2.inOut' }, 0.1)
        .to('.envelope-letter-peek', { y: -60, opacity: 1, duration: 0.5, ease: 'expo.out' }, 0.35);
    } else {
      showContinuousLetter();
    }
  }

  function resetEnvelopeVisual() {
    if (typeof gsap !== 'undefined') {
      gsap.set('.wax-seal-btn', { scale: 1, opacity: 1 });
      gsap.set('.envelope-flap', { rotateX: 0 });
      gsap.set('.envelope-letter-peek', { y: 0, opacity: 0 });
    }
    showCh4Stage('ch4-step-envelope');
  }

  function buildLayeredFlowerSvg() {
    const svg = document.getElementById('mint-flower-svg');
    if (!svg || svg.dataset.built) return;
    svg.dataset.built = '1';

    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');
    const grads = [
      ['#2a8f73', '#165846', '#0d362b'],
      ['#3eb996', '#217c63', '#124a3b'],
      ['#64d8b6', '#339d7f', '#1c634f'],
      ['#a8f5dd', '#54c8a6', '#2b8a6f']
    ];
    grads.forEach((cols, i) => {
      const rg = document.createElementNS(ns, 'radialGradient');
      rg.setAttribute('id', `mf-grad-${i}`);
      rg.setAttribute('cx', '50%'); rg.setAttribute('cy', '58%'); rg.setAttribute('r', '62%');
      [['0%', cols[0]], ['55%', cols[1]], ['100%', cols[2]]].forEach(([off, c]) => {
        const stop = document.createElementNS(ns, 'stop');
        stop.setAttribute('offset', off); stop.setAttribute('stop-color', c);
        rg.appendChild(stop);
      });
      defs.appendChild(rg);
    });
    const pearl = document.createElementNS(ns, 'radialGradient');
    pearl.setAttribute('id', 'mf-pearl');
    [['0%', '#ffffff'], ['45%', '#ffeaa7'], ['100%', '#c8a464']].forEach(([off, c]) => {
      const stop = document.createElementNS(ns, 'stop');
      stop.setAttribute('offset', off); stop.setAttribute('stop-color', c);
      pearl.appendChild(stop);
    });
    defs.appendChild(pearl);
    svg.appendChild(defs);

    const layers = [
      { petals: 11, scale: 1, offset: 0, grad: 0 },
      { petals: 9, scale: 0.82, offset: 14, grad: 1 },
      { petals: 7, scale: 0.62, offset: 7, grad: 2 },
      { petals: 5, scale: 0.42, offset: 22, grad: 3 }
    ];
    layers.forEach((L, lIdx) => {
      for (let i = 0; i < L.petals; i++) {
        const angle = (360 / L.petals) * i + L.offset;
        const g = document.createElementNS(ns, 'g');
        g.setAttribute('class', 'mf-petal');
        g.setAttribute('transform', `translate(200,200) rotate(${angle}) scale(${L.scale})`);
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', 'M 0 0 C 36 -30 50 -84 0 -162 C -50 -84 -36 -30 0 0 Z');
        p.setAttribute('fill', `url(#mf-grad-${L.grad})`);
        p.setAttribute('stroke', 'rgba(255,255,255,0.22)');
        p.setAttribute('stroke-width', '1');
        g.appendChild(p);
        svg.appendChild(g);
      }
    });
    const center = document.createElementNS(ns, 'circle');
    center.setAttribute('cx', '200'); center.setAttribute('cy', '200'); center.setAttribute('r', '18');
    center.setAttribute('fill', 'url(#mf-pearl)');
    svg.appendChild(center);
  }

  function showFlowerWishStage() {
    buildLayeredFlowerSvg();
    showCh4Stage('ch4-step-flower');
    if (typeof gsap !== 'undefined') {
      gsap.set('.finale-ring', { opacity: 0, scale: 0.45 });
      gsap.set('.finale-flower-btn', { scale: 0.7, opacity: 0 });
      gsap.to('.finale-flower-btn', { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.4)' });
      gsap.fromTo('.mf-petal', { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.7, stagger: 0.015, ease: 'expo.out' });
    }
  }

  let flowerBloomed = false;
  function triggerFlowerToStarRings() {
    if (flowerBloomed) return;
    flowerBloomed = true;
    const btn = document.getElementById('btn-bloom-flower');
    if (btn) {
      const r = btn.getBoundingClientRect();
      triggerGoldBurst(r.left + r.width / 2, r.top + r.height / 2, 130, true);
    }
    playSoundFx('ignite');

    if (typeof gsap !== 'undefined') {
      const tl = gsap.timeline({
        onComplete: () => {
          flowerBloomed = false;
          openKeepsakeShowcase();
        }
      });
      tl.to('.finale-ring', { scale: 1.35, opacity: 0.85, duration: 1.15, stagger: 0.12, ease: 'expo.out' }, 0)
        .to('.finale-halo', { scale: 1.5, opacity: 0.65, duration: 1.2, ease: 'expo.out' }, 0)
        .to('.finale-flower-btn', { scale: 1.22, opacity: 0, rotation: 24, duration: 0.95, ease: 'power2.inOut' }, 0.15)
        .to(['.flower-wish-eyebrow', '.flower-wish-title', '.flower-wish-hint'], { opacity: 0, y: -12, duration: 0.5 }, 0.25);
    } else {
      flowerBloomed = false;
      openKeepsakeShowcase();
    }
  }

  let secretIncludeCake = true;
  const cachedCoupleImg = new Image();
  cachedCoupleImg.src = 'assets/couple_table.jpg?v=3';

  function renderCoupleSecretDataUrl(callback, forExport = false) {
    if (!stage) initKonva();
    if (stage) selectItem(null);

    const drawComposite = (coupleImg) => {
      const W = 1000, H = 750;
      const out = document.createElement('canvas');
      out.width = W; out.height = H;
      const ctx = out.getContext('2d');

      // 1. Draw the seamless couple-at-table portrait full-bleed
      ctx.drawImage(coupleImg, 0, 0, W, H);

      // Subtle dark vignette at top for caption legibility
      const vig = ctx.createLinearGradient(0, 0, 0, H * 0.18);
      vig.addColorStop(0, 'rgba(4, 18, 14, 0.72)');
      vig.addColorStop(1, 'rgba(4, 18, 14, 0)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H * 0.18);

      // 2. Composite live custom cake onto the wooden table in front of them
      if (secretIncludeCake && stage) {
        try {
          const temp = document.createElement('canvas');
          temp.width = stage.width() || window.innerWidth;
          temp.height = stage.height() || window.innerHeight;
          const tctx = temp.getContext('2d');
          const pCanvas = plateLayer?.getCanvas()?._canvas;
          const cCanvas = cakeLayer?.getCanvas()?._canvas;
          const tCanvas = toppingsLayer?.getCanvas()?._canvas;

          if (pCanvas && pCanvas.width > 0) tctx.drawImage(pCanvas, 0, 0, temp.width, temp.height);
          if (cCanvas && cCanvas.width > 0) tctx.drawImage(cCanvas, 0, 0, temp.width, temp.height);
          if (pipingCanvas && pipingCanvas.width > 0) tctx.drawImage(pipingCanvas, 0, 0, temp.width, temp.height);
          if (tCanvas && tCanvas.width > 0) tctx.drawImage(tCanvas, 0, 0, temp.width, temp.height);

          const { cx, cy } = getStageCenter();
          const cropW = 580, cropH = 500;
          const sx0 = Math.max(0, cx - cropW / 2);
          const sy0 = Math.max(0, cy - cropH / 2 - 42);

          // Warm cafe candlelight color-grading on cake-only offscreen canvas
          const cakePatch = document.createElement('canvas');
          cakePatch.width = cropW; cakePatch.height = cropH;
          const pctx = cakePatch.getContext('2d');
          pctx.drawImage(temp, sx0, sy0, cropW, cropH, 0, 0, cropW, cropH);
          pctx.globalCompositeOperation = 'source-atop';
          const warmTint = pctx.createLinearGradient(0, 0, 0, cropH);
          warmTint.addColorStop(0, 'rgba(255, 224, 170, 0.14)');
          warmTint.addColorStop(0.65, 'rgba(255, 198, 130, 0.18)');
          warmTint.addColorStop(1, 'rgba(130, 75, 35, 0.28)');
          pctx.fillStyle = warmTint;
          pctx.fillRect(0, 0, cropW, cropH);
          pctx.globalCompositeOperation = 'source-over';

          const dw = 388, dh = 226;
          const dx = (W - dw) / 2;
          const dy = 512;

          // Feathered contact shadow on the dark wooden table
          ctx.save();
          ctx.fillStyle = 'rgba(4, 2, 1, 0.86)';
          ctx.filter = 'blur(12px)';
          ctx.beginPath();
          ctx.ellipse(dx + dw / 2, dy + dh * 0.72, 166, 30, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Soft ambient candlelight aura on tabletop around cake
          ctx.save();
          const tableGlow = ctx.createRadialGradient(dx + dw / 2, dy + dh * 0.45, 20, dx + dw / 2, dy + dh * 0.55, 210);
          tableGlow.addColorStop(0, 'rgba(255, 210, 140, 0.16)');
          tableGlow.addColorStop(1, 'rgba(255, 180, 90, 0)');
          ctx.fillStyle = tableGlow;
          ctx.beginPath();
          ctx.arc(dx + dw / 2, dy + dh * 0.55, 210, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.drawImage(cakePatch, 0, 0, cropW, cropH, dx, dy, dw, dh);
        } catch (err) {
          console.warn('Cake overlay skipped:', err);
        }
      }

      // Caption at top
      ctx.fillStyle = '#ffeaa7';
      ctx.font = '600 19px "Be Vietnam Pro", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 10;
      ctx.fillText('Chi & Thuận • Sinh nhật tuổi 24 (26/11/2002) ❤️', W / 2, 34);

      callback(forExport ? out.toDataURL('image/png') : out.toDataURL('image/jpeg', 0.92));
    };

    if (cachedCoupleImg.complete) {
      if (cachedCoupleImg.naturalWidth > 0) {
        try {
          drawComposite(cachedCoupleImg);
        } catch (err) {
          console.error('drawComposite error:', err);
          callback('');
        }
        return;
      }
      // Previously failed/aborted: retry with a fresh Image
      const retryImg = new Image();
      retryImg.onload = () => {
        try { drawComposite(retryImg); } catch (err) { console.error(err); callback(''); }
      };
      retryImg.onerror = () => {
        showToast('Không tải được ảnh kỷ niệm!', '✦');
        callback('');
      };
      retryImg.src = 'assets/couple_table.jpg?v=' + Date.now();
      return;
    }

    const onLoaded = () => {
      cachedCoupleImg.removeEventListener('load', onLoaded);
      cachedCoupleImg.removeEventListener('error', onErr);
      try { drawComposite(cachedCoupleImg); } catch (err) { console.error(err); callback(''); }
    };
    const onErr = () => {
      cachedCoupleImg.removeEventListener('load', onLoaded);
      cachedCoupleImg.removeEventListener('error', onErr);
      showToast('Không tải được ảnh kỷ niệm!', '✦');
      callback('');
    };
    cachedCoupleImg.addEventListener('load', onLoaded);
    cachedCoupleImg.addEventListener('error', onErr);
  }

  function openCoupleSecret() {
    playSoundFx('ignite');
    let opened = false;
    const ensureOpen = () => {
      if (opened) return;
      opened = true;
      showCh4Stage('ch4-step-secret');
      triggerGoldBurst(window.innerWidth / 2, window.innerHeight * 0.45, 95, true);
    };
    renderCoupleSecretDataUrl(dataUrl => {
      const preview = document.getElementById('couple-secret-preview');
      if (preview && dataUrl) preview.src = dataUrl;
      ensureOpen();
    });
    // Guarantee the secret screen always opens even if image is still loading
    ensureOpen();
  }

  function exportCoupleSecretImage() {
    renderCoupleSecretDataUrl(dataUrl => {
      if (!dataUrl) return;
      if (window.pywebview && window.pywebview.api && window.pywebview.api.save_cake_image) {
        window.pywebview.api.save_cake_image(dataUrl, 'Ky_Niem_Chi_Thuan_26_11.png')
          .then(res => { if (res && res.success) showToast('Đã lưu ảnh kỷ niệm hai đứa mình!'); });
      } else {
        const a = document.createElement('a');
        a.download = 'Ky_Niem_Chi_Thuan_26_11.png'; a.href = dataUrl; a.click();
        showToast('Đã tải xuống ảnh kỷ niệm hai đứa mình!');
      }
    }, true);
  }

  function openKeepsakeShowcase() {
    const preview = document.getElementById('keepsake-cake-preview');
    if (preview && stage) {
      preview.src = renderCakeDataUrl(false);
    }
    playSoundFx('pop');
    showCh4Stage('ch4-step-voucher');
    if (typeof confetti === 'function') {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.65 }, colors: ['#d8c39a', '#b79a65', '#f2ebdd'] });
    }
  }

  // --------------------------------------------------------------------------
  // 10. Cinematic Scene Transitions & Morph Tray Controls
  // --------------------------------------------------------------------------
  function switchChapter(num) {
    const prevNum = state.chapter;
    state.chapter = num;

    document.querySelectorAll('.step-pill').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-step'), 10) === num);
    });

    const target = document.getElementById(`chapter-${num}`);
    const veil = document.getElementById('scene-transition-veil');

    const activateTarget = () => {
      document.querySelectorAll('.screen-chapter').forEach(el => {
        el.classList.remove('active');
        el.style.opacity = 0;
      });
      if (!target) return;
      target.classList.add('active');

      if (typeof gsap !== 'undefined') {
        gsap.fromTo(target,
          { opacity: 0, scale: 0.96, filter: 'blur(10px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.75, ease: 'expo.out' }
        );
      } else {
        target.style.opacity = 1;
      }

      if (num === 1) {
        playChapter1Entrance();
      } else if (num === 2) {
        setTimeout(() => {
          if (!stage) initKonva();
          else {
            stage.width(window.innerWidth);
            stage.height(window.innerHeight);
            renderPlateAndCake();
            resizePipingCanvas();
          }
          if (typeof gsap !== 'undefined') {
            gsap.fromTo('.morph-dock-wrap', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out' });
            gsap.fromTo(['.atelier-float-tl', '.atelier-float-tr'], { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
          }
        }, 40);
      } else if (num === 4) {
        resetEnvelopeVisual();
      }
    };

    if (typeof gsap !== 'undefined' && veil && prevNum !== num) {
      const prevEl = document.getElementById(`chapter-${prevNum}`);
      const tl = gsap.timeline();
      gsap.set(veil, { clearProps: 'clipPath,xPercent,yPercent,scale,opacity' });

      if (prevEl) {
        tl.to(prevEl, { scale: 0.94, y: -16, opacity: 0.15, duration: 0.32, ease: 'power2.in' }, 0);
      }

      if (num === 2) {
        // Kiểu 1: Iris-Silk Circle Reveal (Duy nhất lần này hiện huy hiệu "Yêu em ❤️")
        gsap.set('.veil-emblem', { display: 'flex' });
        tl.fromTo(veil,
          { opacity: 1, clipPath: 'circle(0% at 50% 50%)' },
          { clipPath: 'circle(150% at 50% 50%)', duration: 0.55, ease: 'expo.inOut', onComplete: activateTarget }, 0.04
        )
        .fromTo('.veil-emblem', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.7)' }, 0.15)
        .to(veil, { clipPath: 'circle(0% at 50% 50%)', duration: 0.58, delay: 0.12, ease: 'expo.inOut' })
        .set(veil, { opacity: 0 });
      } else if (num === 3) {
        // Kiểu 2: Starlight Twilight Dissolve (Ánh sao lấp lánh hòa vào không gian đêm)
        gsap.set('.veil-emblem', { display: 'none' });
        triggerGoldBurst(window.innerWidth / 2, window.innerHeight / 2, 55);
        tl.to(prevEl || {}, { scale: 1.06, filter: 'blur(14px)', opacity: 0, duration: 0.45, ease: 'power2.in', onComplete: activateTarget }, 0)
          .fromTo(target, { scale: 0.92, filter: 'blur(16px)', opacity: 0 }, { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 0.8, ease: 'expo.out' }, 0.45);
      } else if (num === 4) {
        // Kiểu 3: Pearl Sparkle Bloom + 3D Envelope Glide-In (Phong bì bay lên nhẹ nhàng)
        gsap.set('.veil-emblem', { display: 'none' });
        triggerGoldBurst(window.innerWidth / 2, window.innerHeight * 0.45, 75);
        tl.to(prevEl || {}, { y: -35, scale: 0.94, filter: 'blur(10px)', opacity: 0, duration: 0.4, ease: 'power2.in', onComplete: activateTarget }, 0)
          .fromTo('.envelope-wrapper', { y: 70, rotationX: 22, scale: 0.86, opacity: 0 }, { y: 0, rotationX: 0, scale: 1, opacity: 1, duration: 0.85, ease: 'back.out(1.4)' }, 0.4);
      } else {
        // Kiểu 4: Soft Dreamy Cross-Blur Morph (Quay lại Lời Mời)
        gsap.set('.veil-emblem', { display: 'none' });
        tl.to(prevEl || {}, { scale: 0.9, filter: 'blur(12px)', opacity: 0, duration: 0.38, ease: 'power2.in', onComplete: activateTarget }, 0)
          .fromTo(target, { scale: 1.05, filter: 'blur(12px)', opacity: 0 }, { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 0.7, ease: 'expo.out' }, 0.38);
      }
    } else {
      activateTarget();
    }
  }

  function setNightMode(night) {
    state.isNightMode = night;
    document.body.classList.toggle('night-mode', night);
  }

  function setTrayOpen(open) {
    state.trayOpen = open;
    const tray = document.getElementById('morph-tray');
    const toggleBtn = document.getElementById('btn-toggle-tray');
    const selPill = document.getElementById('selected-item-info');
    if (!tray) return;

    if (open) {
      tray.classList.remove('collapsed');
      if (toggleBtn) toggleBtn.classList.remove('collapsed');
      if (selPill) selPill.style.bottom = '266px';
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(tray, { opacity: 0, y: 18, scaleY: 0.92 }, { opacity: 1, y: 0, scaleY: 1, duration: 0.35, ease: 'expo.out' });
      }
    } else {
      tray.classList.add('collapsed');
      if (toggleBtn) toggleBtn.classList.add('collapsed');
      if (selPill) selPill.style.bottom = '82px';
    }
  }

  function bindEvents() {
    document.getElementById('btn-start-baking')?.addEventListener('click', () => {
      initAudio();
      startHappyBirthdayLoop();
      playSoundFx('pop');
      leaveChapter1ToStudio();
    });

    document.querySelectorAll('.step-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.getAttribute('data-step'), 10);
        if (step === 3) enterCandleCeremony();
        else { setNightMode(false); switchChapter(step); }
      });
    });

    document.getElementById('btn-toggle-music')?.addEventListener('click', function () {
      state.musicEnabled = !state.musicEnabled;
      const lbl = this.querySelector('.hud-btn-label');
      if (state.musicEnabled) {
        if (lbl) lbl.textContent = 'Piano: Bật'; startHappyBirthdayLoop(); showToast('Đã bật nhạc nền Piano!');
      } else {
        if (lbl) lbl.textContent = 'Piano: Tắt'; stopHappyBirthdayLoop(); showToast('Đã tắt nhạc nền.');
      }
    });

    document.getElementById('btn-quick-night')?.addEventListener('click', () => {
      setNightMode(!state.isNightMode); playSoundFx('pop');
    });

    // Morph Dock Tabs
    document.getElementById('btn-toggle-tray')?.addEventListener('click', () => setTrayOpen(!state.trayOpen));

    document.querySelectorAll('.morph-dock-bar .nav-tab-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        const wasActive = btn.classList.contains('active');
        if (wasActive && state.trayOpen) {
          setTrayOpen(false);
          return;
        }
        setTrayOpen(true);
        document.querySelectorAll('.morph-dock-bar .nav-tab-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const pane = document.getElementById(tabId);
        if (pane) {
          pane.classList.add('active');
          if (typeof gsap !== 'undefined') {
            gsap.fromTo(pane, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.28, ease: 'expo.out' });
          }
        }
        if (pipingCanvas) pipingCanvas.classList.toggle('drawing-active', tabId === 'tab-piping');
        playSoundFx('pop');
      });
    });

    // Tab 1: Shape, Plate, Flavor
    document.querySelectorAll('.shapes-grid .picker-card').forEach(c => {
      c.addEventListener('click', () => {
        const prevTop = getCakeTopSurfaceCenter();
        document.querySelectorAll('.shapes-grid .picker-card').forEach(x => x.classList.remove('active'));
        c.classList.add('active'); state.cake.shape = c.getAttribute('data-shape');
        const nextTop = getCakeTopSurfaceCenter();
        const dy = nextTop.y - prevTop.y;
        if (toppingsLayer && dy !== 0) {
          toppingsLayer.getChildren().forEach(n => n.y(n.y() + dy));
          toppingsLayer.batchDraw();
        }
        renderPlateAndCake(); playSoundFx('pop');
      });
    });
    document.querySelectorAll('.plates-grid .picker-card').forEach(c => {
      c.addEventListener('click', () => {
        document.querySelectorAll('.plates-grid .picker-card').forEach(x => x.classList.remove('active'));
        c.classList.add('active'); state.cake.plate = c.getAttribute('data-plate');
        renderPlateAndCake(); playSoundFx('pop');
      });
    });
    document.querySelectorAll('.flavor-circle').forEach(s => {
      s.addEventListener('click', () => {
        document.querySelectorAll('.flavor-circle').forEach(x => x.classList.remove('active'));
        s.classList.add('active');
        state.cake.flavorColor = s.getAttribute('data-color');
        state.cake.flavorName = s.getAttribute('data-flavor');
        renderPlateAndCake(); playSoundFx('pop');
      });
    });
    document.getElementById('cake-custom-color')?.addEventListener('input', e => {
      document.querySelectorAll('.flavor-circle').forEach(x => x.classList.remove('active'));
      state.cake.flavorColor = e.target.value; state.cake.flavorName = 'Màu Tự Chọn';
      renderPlateAndCake();
    });

    // Tab 2: Frosting & Drip
    document.querySelectorAll('.frosting-grid .picker-card').forEach(c => {
      c.addEventListener('click', () => {
        document.querySelectorAll('.frosting-grid .picker-card').forEach(x => x.classList.remove('active'));
        c.classList.add('active'); state.cake.texture = c.getAttribute('data-texture');
        renderPlateAndCake(); playSoundFx('pop');
      });
    });
    document.querySelectorAll('.drip-pill').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.drip-pill').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        state.cake.drip = b.getAttribute('data-drip');
        state.cake.dripColor = b.getAttribute('data-drip-color') || '#3d2314';
        renderPlateAndCake(); playSoundFx('pop');
      });
    });
    document.getElementById('drip-slider')?.addEventListener('input', e => {
      state.cake.dripLength = parseInt(e.target.value, 10);
      const v = document.getElementById('drip-length-val');
      if (v) v.textContent = state.cake.dripLength + 'px';
      renderPlateAndCake();
    });

    // Tab 3: Piping
    document.querySelectorAll('.tip-luxury-card').forEach(c => {
      c.addEventListener('click', () => {
        document.querySelectorAll('.tip-luxury-card').forEach(x => x.classList.remove('active'));
        c.classList.add('active'); state.cake.pipingTip = c.getAttribute('data-tip');
        playSoundFx('pop');
      });
    });
    document.querySelectorAll('.piping-dot').forEach(d => {
      d.addEventListener('click', () => {
        document.querySelectorAll('.piping-dot').forEach(x => x.classList.remove('active'));
        d.classList.add('active'); state.cake.pipingColor = d.getAttribute('data-color');
        playSoundFx('pop');
      });
    });
    document.getElementById('piping-custom-color')?.addEventListener('input', e => { state.cake.pipingColor = e.target.value; });
    document.getElementById('piping-size-slider')?.addEventListener('input', e => {
      state.cake.pipingSize = parseInt(e.target.value, 10);
      const v = document.getElementById('piping-size-val');
      if (v) v.textContent = state.cake.pipingSize + 'px';
    });
    document.getElementById('btn-auto-piping-border')?.addEventListener('click', autoPipeBorder);
    document.getElementById('btn-clear-piping')?.addEventListener('click', clearPiping);

    // Tab 4: Toppings & Photo
    document.querySelectorAll('.toppings-sub-categories .cat-pill').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.toppings-sub-categories .cat-pill').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); populateToppingsList(b.getAttribute('data-category'));
        playSoundFx('pop');
      });
    });
    document.querySelectorAll('.frame-choice').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.frame-choice').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); state.cake.frameChoice = b.getAttribute('data-frame');
        playSoundFx('pop');
      });
    });
    const photoInput = document.getElementById('file-photo-input');
    document.getElementById('btn-upload-photo')?.addEventListener('click', () => {
      if (window.pywebview && window.pywebview.api && window.pywebview.api.select_image_file) {
        window.pywebview.api.select_image_file().then(url => { if (url) addCustomPhotoTopper(url); }).catch(() => photoInput?.click());
      } else photoInput?.click();
    });
    photoInput?.addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => { addCustomPhotoTopper(ev.target.result); photoInput.value = ''; };
      reader.readAsDataURL(file);
    });

    // Tab 5: Candles
    document.getElementById('btn-quick-plant-24')?.addEventListener('click', quickPlantRoyalCandle24);
    document.getElementById('btn-quick-plant-circle')?.addEventListener('click', quickPlantCandleCircle);

    // Stage Controls & Contextual Selection Pill
    document.querySelectorAll('.table-pill').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.table-pill').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const wrap = document.getElementById('stage-wrapper');
        if (wrap) wrap.className = `atelier-stage stage-viewport bg-${b.getAttribute('data-bg')}`;
        playSoundFx('pop');
      });
    });
    document.getElementById('chk-guidelines')?.addEventListener('change', e => {
      document.getElementById('alignment-grid')?.classList.toggle('visible', e.target.checked);
    });
    document.getElementById('btn-rotate-left')?.addEventListener('click', () => { if (state.selectedNode) { state.selectedNode.rotate(-15); toppingsLayer.batchDraw(); } });
    document.getElementById('btn-rotate-right')?.addEventListener('click', () => { if (state.selectedNode) { state.selectedNode.rotate(15); toppingsLayer.batchDraw(); } });
    document.getElementById('btn-scale-up')?.addEventListener('click', () => {
      if (state.selectedNode) { state.selectedNode.scaleX(state.selectedNode.scaleX() * 1.15); state.selectedNode.scaleY(state.selectedNode.scaleY() * 1.15); toppingsLayer.batchDraw(); }
    });
    document.getElementById('btn-scale-down')?.addEventListener('click', () => {
      if (state.selectedNode) { state.selectedNode.scaleX(state.selectedNode.scaleX() * 0.85); state.selectedNode.scaleY(state.selectedNode.scaleY() * 0.85); toppingsLayer.batchDraw(); }
    });
    document.getElementById('btn-flip-h')?.addEventListener('click', () => { if (state.selectedNode) { state.selectedNode.scaleX(-state.selectedNode.scaleX()); toppingsLayer.batchDraw(); } });
    document.getElementById('btn-bring-forward')?.addEventListener('click', () => { if (state.selectedNode) { state.selectedNode.moveUp(); toppingsLayer.batchDraw(); } });
    document.getElementById('btn-send-backward')?.addEventListener('click', () => { if (state.selectedNode) { state.selectedNode.moveDown(); toppingsLayer.batchDraw(); } });
    document.getElementById('btn-delete-item')?.addEventListener('click', () => { if (state.selectedNode) { state.selectedNode.destroy(); selectItem(null); toppingsLayer.batchDraw(); } });
    document.getElementById('btn-clear-toppings')?.addEventListener('click', () => {
      if (toppingsLayer) { toppingsLayer.destroyChildren(); selectItem(null); toppingsLayer.batchDraw(); showToast('Đã xóa toàn bộ Topping!'); }
    });
    document.getElementById('btn-reset-cake')?.addEventListener('click', () => {
      if (toppingsLayer) { toppingsLayer.destroyChildren(); selectItem(null); toppingsLayer.batchDraw(); }
      clearPiping();
      state.cake.shape = 'round-1'; state.cake.flavorColor = '#fff8f0'; state.cake.drip = 'none';
      renderPlateAndCake(); quickPlantRoyalCandle24();
      showToast('Đã làm mới chiếc bánh!');
    });

    // Ceremony & Letter
    document.getElementById('btn-finish-and-light')?.addEventListener('click', enterCandleCeremony);
    document.getElementById('btn-blow-candle-manual')?.addEventListener('click', () => {
      if (!state.songListeningFinished) { showToast('Chi hãy cùng Thuận nghe hết khúc nhạc Happy Birthday trước nhé!'); return; }
      triggerCandleExtinguish();
    });
    document.getElementById('btn-open-envelope')?.addEventListener('click', openEnvelopeSequence);
    document.getElementById('btn-open-keepsake')?.addEventListener('click', showFlowerWishStage);
    document.getElementById('btn-bloom-flower')?.addEventListener('click', triggerFlowerToStarRings);
    document.getElementById('btn-open-secret')?.addEventListener('click', openCoupleSecret);
    document.getElementById('btn-toggle-secret-cake')?.addEventListener('click', () => {
      secretIncludeCake = !secretIncludeCake;
      renderCoupleSecretDataUrl(dataUrl => {
        const preview = document.getElementById('couple-secret-preview');
        if (preview && dataUrl) preview.src = dataUrl;
      });
    });
    document.getElementById('btn-save-secret-image')?.addEventListener('click', exportCoupleSecretImage);
    document.getElementById('btn-back-from-secret')?.addEventListener('click', () => showCh4Stage('ch4-step-voucher'));
    document.getElementById('btn-back-to-letter')?.addEventListener('click', showContinuousLetter);
    document.getElementById('btn-save-cake-image')?.addEventListener('click', exportCakeImage);
    document.getElementById('btn-re-edit-cake')?.addEventListener('click', () => { setNightMode(false); switchChapter(2); });
    document.getElementById('btn-re-light-candles')?.addEventListener('click', enterCandleCeremony);

    window.addEventListener('keydown', e => {
      if (state.chapter === 3 && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        if (!state.songListeningFinished) { showToast('Chi hãy cùng Thuận nghe hết khúc nhạc Happy Birthday trước nhé!'); return; }
        triggerCandleExtinguish();
      }
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    initGoldDust();
    populateToppingsList('fruits');
    populateCandlesList();
    bindEvents();
    switchChapter(1);
  });
})();
