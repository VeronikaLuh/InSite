export const motorProfile = {
    id: 'motor',
    name: 'Моторні порушення',

    // active=null означає: застосувати все (стан чекбоксів не задано)
    applyCSS: (level, active = null) => {
        const has = (id) => active === null || active.has(id);
        let css = '';

        if (level === 'low') {
            // Рівень 1: Легкий
            if (has('min-target')) css += `
            button, [role="button"], a, input, select, textarea {
              min-height: 44px !important;
              min-width: 44px !important;
            }`;
            if (has('focus-visible')) css += `
            *:focus {
              outline: 3px solid #1565C0 !important;
              outline-offset: 3px !important;
            }`;
            return css;
        }

        if (level === 'medium') {
            // Рівень 2: Помірний
            if (has('large-target')) css += `
            button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"] {
              min-height: 48px !important;
              padding: 12px 20px !important;
              margin: 4px !important;
              font-size: 1.05rem !important;
              cursor: pointer !important;
            }
            a {
              padding: 6px 4px !important;
              display: inline-block !important;
              line-height: 1.4 !important;
            }
            input, select, textarea {
              min-height: 48px !important;
              padding: 8px 12px !important;
              font-size: 1rem !important;
            }
            /* Розширення зони кліку (щоб легше було попасти мишкою при треморі) */
            button, [role="button"] { position: relative !important; }
            button::after, [role="button"]::after {
              content: "" !important;
              position: absolute !important;
              inset: -8px !important;
            }`;
            if (has('focus-visible')) css += `
            *:focus {
              outline: 4px solid #0D47A1 !important;
              outline-offset: 4px !important;
              box-shadow: 0 0 0 6px rgba(13, 71, 161, 0.25) !important;
            }`;
            return css;
        }

        if (level === 'high') {
            // Рівень 3: Тяжкий
            if (has('xl-target')) css += `
            button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"] {
              min-height: 56px !important;
              padding: 16px 24px !important;
              margin: 8px !important;
              font-size: 1.2rem !important;
              font-weight: bold !important;
              border-radius: 8px !important;
              border: 2px solid currentColor !important;
            }
            a {
              padding: 10px 8px !important;
              line-height: 1.6 !important;
              margin: 2px !important;
            }
            input, select, textarea {
              min-height: 56px !important;
              padding: 12px 16px !important;
              font-size: 1.1rem !important;
              margin: 6px 0 !important;
            }`;
            if (has('focus-visible')) css += `
            *:focus {
              outline: 5px solid #E65100 !important; /* Робимо фокус дуже яскравим (помаранчевим) */
              outline-offset: 5px !important;
              box-shadow: 0 0 0 8px rgba(230, 81, 0, 0.35) !important;
            }`;
            if (has('drag-alt')) css += `
            [draggable="true"] {
              border: 3px dashed #E65100 !important;
              background: #FFF3E0 !important;
            }`;
            if (has('big-checkbox')) css += `
            input[type="checkbox"], input[type="radio"] {
              width: 28px !important;
              height: 28px !important;
              margin: 8px !important;
              cursor: pointer !important;
            }`;
            return css;
        }

        return '';
    },

    applyDOM: (level, active = null) => {
        const has = (id) => active === null || active.has(id);

        // Skip link — керується чекбоксом skip-link на будь-якому рівні
        if (has('skip-link') && !document.querySelector('.insite-skip-link')) {
            const skip = document.createElement('a');
            skip.href = '#main, [role="main"], main';
            skip.className = 'insite-skip-link';
            skip.textContent = 'Перейти до основного контенту (клавіша Enter)';
            skip.style.cssText = `
              position: fixed !important; top: -100px !important; left: 10px !important;
              background: #0D47A1 !important; color: #fff !important; padding: 12px 20px !important;
              font-size: 1.1rem !important; font-weight: bold !important;
              z-index: 999999 !important; border-radius: 4px !important;
              text-decoration: none !important; transition: top 0.2s !important;
            `;
            skip.addEventListener('focus', () => { skip.style.top = '10px'; });
            skip.addEventListener('blur', () => { skip.style.top = '-100px'; });
            document.body.insertBefore(skip, document.body.firstChild);
        }

        // Клавіатурні альтернативи для hover — mouse-focus (medium, high)
        if (has('mouse-focus') && (level === 'medium' || level === 'high')) {
            document.querySelectorAll('[onmouseover], [onmouseenter]').forEach(el => {
                if (!el.hasAttribute('onfocus') && !el.dataset.insiteTagged) {
                    el.dataset.insiteTagged = 'true';
                    el.setAttribute('onfocus', el.getAttribute('onmouseover') || el.getAttribute('onmouseenter'));
                    el.setAttribute('tabindex', el.getAttribute('tabindex') || '0');
                }
            });
        }

        // Позначення drag-and-drop елементів — drag-alt (high)
        if (level === 'high' && has('drag-alt')) {
            document.querySelectorAll('[draggable="true"]').forEach(el => {
                if (!el.dataset.insiteTagged) {
                    el.dataset.insiteTagged = 'true';
                    const hint = document.createElement('small');
                    hint.style.cssText = 'display:block!important; color:#E65100!important; font-size:0.85em!important; font-weight:bold!important; margin-top:4px!important;';
                    hint.textContent = '👆 [Елемент перетягування]';
                    if (el.parentNode) {
                        el.parentNode.insertBefore(hint, el.nextSibling);
                    }
                }
            });
        }
    }
};