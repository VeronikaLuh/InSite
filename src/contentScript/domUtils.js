const STYLE_ID = 'insite-styles';

export function injectStyles(css) {
  removeStyles();
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

export function removeStyles() {
  const existing = document.getElementById(STYLE_ID);
  if (existing) existing.remove();
}

export function removeOverlay() {
  // 1. Агресивне видалення всіх створених нами HTML-елементів
  const elementsToRemove = document.querySelectorAll(`
    #insite-overlay,
    #insite-hearing-overlay,
    .insite-skip-link,
    .insite-warning-badge
  `);
  elementsToRemove.forEach(el => el.remove());

  // 2. ЖОРСТКА ЗУПИНКА: Вимикаємо всі варіанти слухачів подій, щоб вони не працювали у фоні
  if (window.insiteHearingObserver) {
    window.insiteHearingObserver.disconnect();
    window.insiteHearingObserver = null;
  }
  if (window._insiteHearingObserver) {
    window._insiteHearingObserver.disconnect();
    window._insiteHearingObserver = null;
  }

  // 3. Відновлюємо стан елементів та видаляємо наші "мітки"
  document.querySelectorAll('[data-insite-tagged]').forEach(el => {
    delete el.dataset.insiteTagged;
    
    // Якщо ми примусово вимикали звук на Тяжкому рівні, повертаємо його
    if (el.tagName === 'VIDEO' || el.tagName === 'AUDIO') {
        el.muted = false;
    }
  });
}

export function showVisualNotification(message, type = 'info') {
  let overlay = document.getElementById('insite-hearing-overlay');
  
  // Якщо оверлею немає, функція створює його самостійно (захист від збоїв)
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'insite-hearing-overlay';
    overlay.className = 'insite-ignore-mutation';
    overlay.style.cssText = `
      position: fixed !important; bottom: 20px !important; right: 20px !important;
      max-width: 340px !important; z-index: 2147483647 !important;
      display: flex !important; flex-direction: column !important; gap: 8px !important;
      pointer-events: none !important;
    `;
    document.body.appendChild(overlay);
  }
  
  const colors = { info: '#1565C0', warning: '#E65100', error: '#C62828', success: '#2E7D32' };
  const notification = document.createElement('div');
  
  // Клас-запобіжник
  notification.className = 'insite-ignore-mutation'; 
  
  notification.style.cssText = `
    background: ${colors[type] || colors.info} !important;
    color: #fff !important; padding: 12px 16px !important;
    border-radius: 8px !important; margin-top: 8px !important;
    font-size: 1rem !important; font-weight: bold !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    pointer-events: auto !important;
  `;
  notification.textContent = message;
  
  overlay.appendChild(notification);
  
  // Видаляємо сповіщення через 5 секунд
  setTimeout(() => notification.remove(), 5000);
}