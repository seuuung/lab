'use strict';
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const buttons = [...document.querySelectorAll('.tab-btn')];
  const items = [...document.querySelectorAll('.project-item')];
  const grid = document.querySelector('.project-grid');
  const motionButton = document.getElementById('motion-toggle');
  const soundButton = document.getElementById('sfx-toggle-btn');
  const counts = items.reduce((result, item) => {
    result.all++;
    result[item.dataset.category]++;
    return result;
  }, { all: 0, game: 0, app: 0, lab: 0 });
  let motionPaused = reduced.matches;
  let soundEnabled = false;
  let audioContext;
  const animations = new WeakMap();

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  }

  function pulse(frequency = 500) {
    if (!soundEnabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audioContext ||= new Audio();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * .65, audioContext.currentTime + .09);
      gain.gain.setValueAtTime(.025, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .12);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + .12);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch (_) { /* Optional sound must never interrupt navigation. */ }
  }

  soundButton.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.setAttribute('aria-label', soundEnabled ? '소리 끄기' : '소리 켜기');
    document.getElementById('sfx-label').textContent = soundEnabled ? '소리 켬' : '소리 끔';
    pulse(650);
  });

  function updateMotion() {
    root.classList.toggle('motion-paused', motionPaused);
    root.dataset.motion = motionPaused ? 'paused' : 'running';
    motionButton.setAttribute('aria-pressed', String(motionPaused));
    motionButton.setAttribute('aria-label', motionPaused ? '모션 재생하기' : '모션 멈추기');
    motionButton.innerHTML = motionPaused ? '모션 재생하기 <span aria-hidden="true">▷</span>' : '모션 멈추기 <span aria-hidden="true">Ⅱ</span>';
    if (motionPaused) items.forEach(item => animations.get(item)?.cancel());
    window.dispatchEvent(new Event('lab:motion'));
  }
  motionButton.addEventListener('click', () => { motionPaused = !motionPaused; updateMotion(); });
  reduced.addEventListener('change', () => { motionPaused = reduced.matches; updateMotion(); });
  updateMotion();

  function animateItem(item, delay = 0) {
    if (motionPaused || reduced.matches || !item.animate) return;
    animations.get(item)?.cancel();
    const animation = item.animate([
      { opacity: .35, transform: 'translateY(24px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 650, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    animations.set(item, animation);
  }

  function filterProjects(category, animate = false) {
    if (!Object.hasOwn(counts, category)) return;
    grid.classList.toggle('is-filtered', category !== 'all');
    let visible = 0;
    items.forEach(item => {
      animations.get(item)?.cancel();
      item.hidden = category !== 'all' && item.dataset.category !== category;
      if (!item.hidden) {
        if (animate) animateItem(item, Math.min(visible, 5) * 45);
        visible++;
      }
    });
    buttons.forEach(button => {
      const active = button.dataset.filter === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('result-count').textContent = `총 ${visible}개의 실험`;
    document.getElementById('empty-state').hidden = visible !== 0;
  }

  for (const [category, count] of Object.entries(counts)) {
    document.getElementById(`count-${category}`).textContent = String(count).padStart(2, '0');
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filterProjects(category, true);
    pulse();
    track('category_filter', { category });
    history.replaceState(null, '', `#${category}`);
  }));
  function readHash() {
    const category = location.hash.slice(1);
    if (!category) filterProjects('all');
    else if (Object.hasOwn(counts, category)) filterProjects(category);
  }
  readHash();
  window.addEventListener('hashchange', readHash);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateItem(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    items.forEach(item => observer.observe(item));
  }

  document.querySelectorAll('.project-card').forEach(card => {
    const scene = card.querySelector('.art-scene');
    card.addEventListener('click', () => {
      pulse();
      track('game_enter', {
        game_name: card.dataset.name,
        category: card.closest('.project-item').dataset.category,
        target_url: card.getAttribute('href')
      });
    });
    card.addEventListener('pointerenter', () => pulse(800));
    card.addEventListener('pointermove', event => {
      if (motionPaused || reduced.matches || event.pointerType !== 'mouse') return;
      const rect = card.getBoundingClientRect();
      scene.style.setProperty('--card-x', `${((event.clientX - rect.left) / rect.width - .5) * 9}px`);
      scene.style.setProperty('--card-y', `${((event.clientY - rect.top) / rect.height - .5) * 9}px`);
    });
    card.addEventListener('pointerleave', () => {
      scene.style.removeProperty('--card-x');
      scene.style.removeProperty('--card-y');
    });
  });
  document.querySelectorAll('a[href*="github.com"]').forEach(link => {
    link.addEventListener('click', () => track('profile_click', { target: 'github' }));
  });
  document.querySelector('.hero-bottom a').addEventListener('click', () => {
    track('game_enter', { game_name: '그림자 퍼즐', category: 'game', target_url: 'game/shadow_puzzle/index.html' });
  });

  let scrollFrame = 0;
  function updateProgress() {
    scrollFrame = 0;
    const distance = root.scrollHeight - innerHeight;
    root.style.setProperty('--progress', distance > 0 ? Math.max(0, Math.min(1, scrollY / distance)) : 0);
  }
  const scheduleProgress = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateProgress); };
  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('resize', scheduleProgress, { passive: true });
  updateProgress();
  document.addEventListener('visibilitychange', () => {
    root.classList.toggle('page-hidden', document.hidden);
    if (document.hidden && audioContext?.state === 'running') audioContext.suspend().catch(() => {});
  });
  document.getElementById('year').textContent = new Date().getFullYear();
})();
