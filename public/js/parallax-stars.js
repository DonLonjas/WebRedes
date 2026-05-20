// parallax-stars.js — generador de estrellas estilo "Pure CSS Parallax Pixel Stars"
(function () {
  function mulberry32(seed) {
    return function () {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function buildShadows(count, max, rand) {
    const shadows = [];
    for (let i = 0; i < count; i += 1) {
      const x = Math.floor(rand() * max);
      const y = Math.floor(rand() * max);
      shadows.push(`${x}px ${y}px #FFF`);
    }
    return shadows.join(', ');
  }

  function ensureLayers(container) {
    ['stars', 'stars2', 'stars3'].forEach((id) => {
      if (!container.querySelector(`#${id}`)) {
        const el = document.createElement('div');
        el.id = id;
        container.appendChild(el);
      }
    });
  }

  function getFieldSize() {
    const longestSide = Math.max(window.innerWidth || 0, window.innerHeight || 0, 2000);
    return Math.ceil(longestSide * 1.2);
  }

  function getStarCounts(fieldSize) {
    const factor = fieldSize / 2000;
    return {
      small: Math.round(700 * factor),
      medium: Math.round(200 * factor),
      big: Math.round(100 * factor)
    };
  }

  function renderStars(container) {
    const fieldSize = getFieldSize();
    const counts = getStarCounts(fieldSize);
    const rand = mulberry32(1337);

    const small = buildShadows(counts.small, fieldSize, rand);
    const medium = buildShadows(counts.medium, fieldSize, rand);
    const big = buildShadows(counts.big, fieldSize, rand);

    const stars = container.querySelector('#stars');
    const stars2 = container.querySelector('#stars2');
    const stars3 = container.querySelector('#stars3');

    if (stars) {
      stars.style.boxShadow = small;
    }
    if (stars2) {
      stars2.style.boxShadow = medium;
    }
    if (stars3) {
      stars3.style.boxShadow = big;
    }

    // Variables globales para pseudo-elementos ::after y keyframes
    container.style.setProperty('--stars-shadow-small', small);
    container.style.setProperty('--stars-shadow-medium', medium);
    container.style.setProperty('--stars-shadow-big', big);
    container.style.setProperty('--star-field-size', `${fieldSize}px`);
  }

  function initParallaxStars() {
    const container = document.querySelector('.parallax-stars');
    if (!container) return;

    ensureLayers(container);

    renderStars(container);

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(() => {
        renderStars(container);
      }, 180);
    });
  }

  document.addEventListener('DOMContentLoaded', initParallaxStars);
})();
