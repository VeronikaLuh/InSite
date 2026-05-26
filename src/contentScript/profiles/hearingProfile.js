import { showVisualNotification } from '../domUtils';

// ── Вмикаємо стандартні HTML5 субтитри ───────────────────────────────────────
function enableCaptionsOnVideo(video) {
    const tryEnable = () => {
        const tracks = Array.from(video.textTracks);
        if (!tracks.length) return;
        const best = tracks.find(t => t.kind === 'captions') ?? tracks.find(t => t.kind === 'subtitles') ?? tracks[0];
        tracks.forEach(t => { t.mode = 'hidden'; });
        best.mode = 'showing';
    };

    tryEnable();
    video.addEventListener('loadedmetadata', tryEnable, { once: true });
    setTimeout(tryEnable, 600);
    setTimeout(tryEnable, 1800);
}

// ── Сучасний плаваючий банер (Glassmorphism) ──────────────────────────────────
// Не обгортаємо відео, а просто додаємо плаваючий бейдж поверх нього
function addModernWarningBadge(video) {
    const parent = video.parentElement;
    if (!parent) return;

    const badge = document.createElement('div');
    badge.dataset.insiteTagged = 'true';
    
    // ДОДАНО: Клас для того, щоб domUtils.js міг знайти і видалити цей бейдж при вимкненні
    badge.className = 'insite-warning-badge'; 
    
    // Сучасний дизайн: напівпрозорий темний фон, заокруглені кути, іконка
    badge.style.cssText = `
        position: absolute !important;
        top: 12px !important;
        left: 12px !important;
        background: rgba(20, 20, 25, 0.85) !important;
        color: #FFA726 !important;
        border: 1px solid rgba(255, 167, 38, 0.3) !important;
        padding: 6px 12px !important;
        border-radius: 20px !important;
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        backdrop-filter: blur(4px) !important;
    `;
    
    badge.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <span>Немає HTML5 субтитрів</span>
    `;

    // Щоб absolute працював правильно, батьківський елемент має бути relative
    if (window.getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
    }
    
    parent.appendChild(badge);
}

// ── Overlay для сповіщень ─────────────────────────────────────────────────────
function ensureOverlay() {
    let el = document.getElementById('insite-hearing-overlay');
    if (!el) {
        el = document.createElement('div');
        el.id = 'insite-hearing-overlay';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'false');
        el.style.cssText =
            'position:fixed!important;bottom:20px!important;right:20px!important;' +
            'max-width:340px!important;z-index:2147483647!important;' +
            'display:flex!important;flex-direction:column!important;gap:8px!important;' +
            'pointer-events:none!important;';
        document.body.appendChild(el);
    }
    return el;
}

// ── MutationObserver за ARIA live regions ─────────────────────────────────────
function setupLiveRegionObserver() {
    if (window._insiteHearingObserver) return;

    let lastText = '';
    let lastTime = 0;

    function notify(text, type) {
        const now = Date.now();
        if (text === lastText && now - lastTime < 1500) return;
        lastText = text;
        lastTime = now;
        showVisualNotification(` ${text}`, type);
    }

    window._insiteHearingObserver = new MutationObserver((mutations) => {
        for (const mut of mutations) {
            // 1. Перевірка доданих нових вузлів
            for (const node of mut.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;

                // Ігноруємо наші власні елементи розширення
                if (node.id === 'insite-hearing-overlay' || (node.classList && node.classList.contains('insite-ignore-mutation'))) continue;
                if (node.closest && node.closest('#insite-hearing-overlay')) continue;

                const role = node.getAttribute?.('role');
                const live = node.getAttribute?.('aria-live');
                if (role === 'alert' || role === 'status' || live === 'assertive' || live === 'polite') {
                    const text = (node.innerText || node.textContent || '').trim();
                    if (text) notify(text, role === 'alert' ? 'error' : 'info');
                }
            }
            
            // 2. Перевірка зміни тексту (САМЕ ТУТ БУЛА ДІРА ДЛЯ КРАШІВ)
            if (mut.type === 'childList' || mut.type === 'characterData') {
                const target = mut.target.nodeType === Node.TEXT_NODE ? mut.target.parentElement : mut.target;
                
                // ГОЛОВНИЙ ЗАПОБІЖНИК: Ігноруємо зміни тексту всередині нашого ж оверлею!
                if (target && target.closest && target.closest('#insite-hearing-overlay')) continue;
                if (target && target.classList && target.classList.contains('insite-ignore-mutation')) continue;

                const liveEl = target?.closest?.('[aria-live],[role="alert"],[role="status"]');
                if (liveEl) {
                    const text = (liveEl.innerText || liveEl.textContent || '').trim();
                    if (text) notify(text, 'info');
                }
            }
        }
    });

    window._insiteHearingObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
    });
}

// ─────────────────────────────────────────────────────────────────────────────

export const hearingProfile = {
    id: 'hearing',
    name: 'Слухові порушення',

    // active=null означає: застосувати все (стан чекбоксів не задано)
    applyCSS: (level, active = null) => {
        const has = (id) => active === null || active.has(id);
        let css = '';

        // Виділення відео/аудіо та алертів — керується visual-alerts
        if (has('visual-alerts')) css += `
            video:not([muted]), audio {
                outline: 3px solid #FF6B00 !important;
                outline-offset: 3px !important;
            }
            [role="alert"], [aria-live="assertive"] {
                border: 3px solid #C62828 !important;
                background: #FFEBEE !important;
                color: #000 !important;
                padding: 10px !important;
            }
        `;

        // Підсвітка ARIA live regions — керується aria-live
        if ((level === 'medium' || level === 'high') && has('aria-live')) css += `
            [aria-live], [role="status"], [role="alert"] {
                border-left: 5px solid #1565C0 !important;
                background: #E3F2FD !important;
                padding: 12px 16px !important;
                color: #000 !important;
            }
        `;

        // Посилений стиль + показ прихованого SR-тексту — рівень high, aria-live
        if (level === 'high' && has('aria-live')) css += `
            [aria-live], [role="status"], [role="alert"] {
                border: 4px solid #1565C0 !important;
                background: #BBDEFB !important;
                padding: 16px !important;
                font-weight: bold !important;
                font-size: 1.15em !important;
                color: #000 !important;
            }
            .visually-hidden, .sr-only, [class*="sr-only"], [class*="visually-hidden"] {
                position: static !important;
                clip: auto !important;
                clip-path: none !important;
                width: auto !important;
                height: auto !important;
                font-weight: 700 !important;
                display: block !important;
                padding: 4px 8px !important;
                background: #E3F2FD !important;
                color: #0D47A1 !important;
                border: 1px dashed #1565C0 !important;
            }
        `;

        return css;
    },

    applyDOM: (level, active = null) => {
        const has = (id) => active === null || active.has(id);

        // Оверлей для візуальних сповіщень
        if ((level === 'medium' || level === 'high') && has('visual-alerts')) {
            ensureOverlay();
        }

        const isYouTube = window.location.hostname.includes('youtube.com');

        // Спеціальний алгоритм для YouTube
        if (isYouTube && (level === 'medium' || level === 'high') && has('mark-video')) {
            const tryClickYT = () => {
                const ccBtn = document.querySelector('.ytp-subtitles-button');
                if (ccBtn && ccBtn.getAttribute('aria-pressed') === 'false') {
                    ccBtn.click();
                }
            };
            tryClickYT();
            setTimeout(tryClickYT, 1500);
            setTimeout(tryClickYT, 3000);
        }

        // Обробка всіх відео на сторінці
        document.querySelectorAll('video').forEach((video) => {
            if (video.dataset.insiteTagged) return;
            video.dataset.insiteTagged = 'true';

            if (!isYouTube) {
                const domTracks = video.querySelectorAll('track').length;
                const apiTracks = video.textTracks?.length ?? 0;
                const hasTracks = domTracks > 0 || apiTracks > 0;

                if (!hasTracks && has('mark-video')) {
                    addModernWarningBadge(video);
                } else if (hasTracks) {
                    // medium: mark-video включає і ввімкнення наявних субтитрів
                    // high: окремий чекбокс show-captions
                    const shouldEnable = (level === 'medium' && has('mark-video')) ||
                                         (level === 'high' && has('show-captions'));
                    if (shouldEnable) enableCaptionsOnVideo(video);
                }
            }

            // Вимкнути звук відео — stop-audio (high)
            if (level === 'high' && has('stop-audio')) {
                video.muted = true;
            }
        });

        // Зупинити автовідтворення аудіо (medium)
        if (level === 'medium' && has('stop-audio')) {
            document.querySelectorAll('audio[autoplay], video[autoplay]').forEach(media => {
                media.pause();
                media.removeAttribute('autoplay');
            });
        }

        // Вимкнути всі звуки (high)
        if (level === 'high' && has('stop-audio')) {
            document.querySelectorAll('audio').forEach(a => { a.muted = true; });
        }

        // Слідкувати за ARIA live regions
        if ((level === 'medium' || level === 'high') && has('aria-live')) {
            setupLiveRegionObserver();
        }
    },
};