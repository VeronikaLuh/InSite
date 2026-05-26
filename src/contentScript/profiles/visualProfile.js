export const visualProfile = {
  id: 'visual',
  name: 'Зорові порушення',

  // active=null означає: застосувати все (стан чекбоксів не задано)
  applyCSS: (level, active = null) => {
    const has = (id) => active === null || active.has(id);

    if (level === 'low') {
      /* Рівень 1: Слабкий зір */
      let css = `body { background: #FAFAFA !important; color: #111111 !important; }
        a { color: #0000CC !important; text-decoration: underline !important; }`;
      if (has('font-size')) css += `
        /* Використання rem запобігає нескінченному збільшенню вкладених тегів */
        p, li, td, th, label, input, textarea, div { font-size: 1.1rem !important; }
        h1 { font-size: 2rem !important; }
        h2 { font-size: 1.7rem !important; }
        h3, h4, h5, h6 { font-size: 1.4rem !important; }`;
      if (has('line-height')) css += `
        p, li, td, th, label, input, textarea, div { line-height: 1.6 !important; }`;
      if (has('alt-tag')) css += `
        img:not([alt]) { outline: 3px solid red !important; }
        img[alt=""] { outline: 3px solid orange !important; }`;
      return css;
    }

    if (level === 'medium') {
      /* Рівень 2: Помірний зоровий бар'єр */
      let css = `body { background: #FFFDE7 !important; color: #000000 !important; font-family: Arial, sans-serif !important; }
        img { max-width: 100% !important; }`;
      if (has('high-contrast')) css += `
        p, li, td, th, label, div { font-size: 1.25rem !important; line-height: 1.8 !important; letter-spacing: 0.05em !important; }
        a { color: #0000AA !important; text-decoration: underline !important; font-weight: bold !important; }
        p, li, td { max-width: 70ch !important; }`;
      if (has('larger-buttons')) css += `
        button, [role="button"] { min-height: 44px !important; min-width: 44px !important; font-size: 1rem !important; border: 2px solid #000 !important; }
        input, select, textarea { border: 2px solid #333 !important; font-size: 1.1rem !important; }`;
      if (has('focus-ring')) css += `
        *:focus { outline: 3px solid #FF6B00 !important; outline-offset: 2px !important; }`;
      return css;
    }

    if (level === 'high') {
      /* Рівень 3: Сліпота / Дуже слабкий зір — High Contrast */
      let css = '';
      if (has('dark-bg')) css += `
        body, html { background: #000000 !important; color: #FFFFFF !important; }
        /* Прибираємо фони у всіх блокових елементів, щоб чорний body просвічувався */
        div, section, article, main, header, footer, nav, aside, ul, ol, li, p, span, h1, h2, h3, h4, h5, h6 {
          background-color: transparent !important;
          background-image: none !important;
          color: #FFFFFF !important;
          border-color: #555555 !important;
          font-family: Arial, Helvetica, sans-serif !important;
          letter-spacing: 0.1em !important;
          word-spacing: 0.2em !important;
          line-height: 2 !important;
        }
        p, li, label, td, div { font-size: 1.3rem !important; }
        h1 { font-size: 2.2rem !important; }
        h2 { font-size: 1.8rem !important; }
        h3, h4 { font-size: 1.5rem !important; }
        button, [role="button"], input[type="submit"], input[type="button"] {
          background: #1A1A1A !important;
          color: #FFFFFF !important;
          border: 3px solid #FFFFFF !important;
          min-height: 48px !important;
          min-width: 48px !important;
          font-weight: bold !important;
        }
        input, select, textarea {
          background: #111111 !important;
          color: #FFFFFF !important;
          border: 2px solid #FFFFFF !important;
        }
        img { filter: contrast(1.2) brightness(0.8) !important; }
        ::selection { background: #FFFF00 !important; color: #000000 !important; }`;
      if (has('yellow-links')) css += `
        a, a *, a span { color: #FFFF00 !important; text-decoration: underline !important; font-weight: bold !important; }
        a:hover, a:focus { color: #00FF00 !important; }`;
      if (has('large-focus')) css += `
        *:focus {
          outline: 4px solid #FFD700 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 6px rgba(255, 215, 0, 0.4) !important;
        }`;
      return css;
    }

    return '';
  },

  applyDOM: (level, active = null) => {
    const has = (id) => active === null || active.has(id);

    // Skip link для будь-якого рівня
    if (has('skip-link') && !document.querySelector('.insite-skip-link')) {
      const skip = document.createElement('a');
      skip.href = '#main, [role="main"], main';
      skip.className = 'insite-skip-link';
      skip.textContent = 'Перейти до основного контенту';
      skip.style.cssText = `
        position: fixed !important; top: -100px !important; left: 10px !important;
        background: #FFD700 !important; color: #000 !important; padding: 8px 16px !important;
        font-weight: bold !important; z-index: 999999 !important; border-radius: 4px !important;
        text-decoration: none !important; transition: top 0.2s !important;
      `;
      skip.addEventListener('focus', () => { skip.style.top = '10px'; });
      skip.addEventListener('blur', () => { skip.style.top = '-100px'; });
      document.body.insertBefore(skip, document.body.firstChild);
    }

    // Позначити зображення без alt (рівень low: alt-tag; рівень high: fix-alt)
    if ((level === 'low' && has('alt-tag')) || (level === 'high' && has('fix-alt'))) {
      document.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('alt') && !img.dataset.insiteTagged) {
          img.dataset.insiteTagged = 'true';
          img.setAttribute('alt', '[Зображення без опису]');
        }
      });
    }

    // Позначити порожні посилання (базова доступність — завжди)
    document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])').forEach(a => {
      if (!a.textContent.trim() && !a.dataset.insiteTagged) {
        a.dataset.insiteTagged = 'true';
        a.setAttribute('aria-label', '[Посилання без тексту]');
      }
    });
  },
};