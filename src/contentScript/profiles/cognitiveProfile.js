export const cognitiveProfile = {
    id: 'cognitive',
    name: 'Когнітивні порушення',

    // active=null означає: застосувати все (стан чекбоксів не задано)
    applyCSS: (level, active = null) => {
        const has = (id) => active === null || active.has(id);
        let css = '';

        if (level === 'low') {
            if (has('reduce-motion')) css += `
        /* Уповільнення анімацій: 0.5s замість типових 0.2–0.3s */
            * { animation-duration: 0.5s !important; transition-duration: 0.3s !important; }`;
            if (has('readable-font')) css += `
        /* Arial/Helvetica — більш читабельні для людей із дислексією (BDA) */
            body { font-family: Arial, Helvetica, sans-serif !important; }`;
            if (has('line-height')) css += `
            body { line-height: 1.7 !important; }
            p { max-width: 65ch !important; }
            h1, h2, h3, h4, h5, h6 { line-height: 1.3 !important; }`;
            return css;
        }

        if (level === 'medium') {
            if (has('no-motion')) css += `
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }`;
            if (has('readable-font')) css += `
            body {
              font-family: Arial, Helvetica, sans-serif !important;
              font-size: 1.05rem !important;
              line-height: 1.8 !important;
              background: #FDFBF7 !important;
              color: #1A1A1A !important;
            }
              /* WCAG 1.4.12 Text Spacing */
            p, li, td {
              letter-spacing: 0.05em !important;
              word-spacing: 0.1em !important;
            }
              /* Зелені рядки під заголовками — чіткий розрив між секціями */
            h1, h2, h3 {
              border-bottom: 2px solid #81C784 !important;
              padding-bottom: 4px !important;
            }`;
            if (has('hide-ads')) css += `
              /* Послаблення реклами: opacity замість display:none, щоб не ламати верстку */
            .advertisement, .adsbygoogle, [id^="google_ads"], .ad-container, .promo-banner {
              opacity: 0.3 !important;
              pointer-events: none !important;
            }`;
            // Структурна база (завжди для medium+)
            css += `
            nav ul li { margin-bottom: 8px !important; }
            a {
              color: #1565C0 !important;
              text-decoration: underline !important;
              text-underline-offset: 3px !important;
            }
              /* Жирні block-label — кожне поле починається з чіткого підпису */
            label {
              font-weight: bold !important;
              display: block !important;
              margin-bottom: 4px !important;
            }`;
            return css;
        }

        if (level === 'high') {
            if (has('no-motion')) css += `
        /* Повне вимкнення анімацій */
            * { animation: none !important; transition: none !important; }
              /* Обхід AOS та подібних бібліотек — елементи ніколи не 'відкриваються' */
            [data-aos], [class*="animate"], [class*="fade"] {
              opacity: 1 !important;
              transform: none !important;
              transition: none !important;
            }`;
            if (has('simple-layout') || has('hide-distractions')) css += `
              /* Приховування відволікаючих елементів */
            .sidebar, .widget, .banner, .popup, .modal, .advertisement {
              display: none !important;
            }`;
            if (has('simple-layout')) css += `
            body { font-size: 1.15rem !important; line-height: 2 !important; }
            p, li {
              max-width: 60ch !important;
              letter-spacing: 0.08em !important;
              word-spacing: 0.15em !important;
              margin-bottom: 1.2em !important;
            }`;
            if (has('highlight-headers')) css += `
              /* Зелений блок-підсвічення заголовків — чітка структурна ієрархія */
            h1, h2, h3 {
              background: #E8F5E9 !important;
              padding: 8px 12px !important;
              border-left: 5px solid #2E7D32 !important;
              border-radius: 4px !important;
            }`;
            // Структурна база (завжди для high)
            css += `
            button, [role="button"] {
              font-size: 1.1rem !important;
              font-weight: bold !important;
              padding: 12px 24px !important;
              border-radius: 6px !important;
              border: 2px solid #333 !important;
            }
            label { font-size: 1.05rem !important; margin-bottom: 6px !important; }
            input:invalid, select:invalid {
              border: 3px solid #D32F2F !important;
              background: #FFEBEE !important;
            }`;
            return css;
        }

        return '';
    },

    applyDOM: (level, active = null) => {
        const has = (id) => active === null || active.has(id);

        // Зупинити автовідтворення медіа — stop-autoplay (всі рівні)
        if (has('stop-autoplay')) {
            document.querySelectorAll('video[autoplay], audio[autoplay]').forEach(media => {
                if (!media.dataset.insiteTagged) {
                    media.dataset.insiteTagged = 'true';
                    media.pause();
                    media.removeAttribute('autoplay');
                    const note = document.createElement('small');
                    note.style.cssText = 'display:block!important;color:#555!important;font-style:italic!important;';
                    note.textContent = '[Автовідтворення вимкнено для зручності]';
                    media.parentNode.insertBefore(note, media.nextSibling);
                }
            });
        }

        // Підказки у формах — form-hints (medium, high)
        if (has('form-hints') && (level === 'medium' || level === 'high')) {
            document.querySelectorAll('form').forEach(form => {
                if (!form.dataset.insiteTagged) {
                    form.dataset.insiteTagged = 'true';
                    const required = form.querySelectorAll('[required]').length;
                    if (required > 0) {
                        const indicator = document.createElement('div');
                        indicator.style.cssText = `
                            background: #E3F2FD !important; border: 1px solid #90CAF9 !important;
                            padding: 8px 12px !important; margin-bottom: 12px !important;
                            border-radius: 4px !important; font-size: 0.95em !important; color: #000 !important;
                        `;
                        indicator.textContent = `Ця форма містить ${required} обов'язкових поля (позначені *)`;
                        form.insertBefore(indicator, form.firstChild);
                    }
                }
            });
        }

        // Підсвітити поточний пункт меню — current-nav (high)
        if (level === 'high' && has('current-nav')) {
            document.querySelectorAll('nav a[href]').forEach(a => {
                if (a.href === window.location.href || a.getAttribute('aria-current')) {
                    a.style.cssText += `
                        background: #C8E6C9 !important;
                        font-weight: bold !important;
                        border-left: 4px solid #2E7D32 !important;
                        padding-left: 8px !important;
                    `;
                }
            });
        }
    }
};