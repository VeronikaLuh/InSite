/**
 * ARIA Analyzer — AI-powered accessibility analyzer for browser pages.
 *
 * Core principle: W3C "First Rule of ARIA"
 *   Always prefer native semantic HTML. ARIA is only justified when:
 *   1. A native HTML element with the required semantics does not exist.
 *   2. A native element exists but is used correctly yet lacks an accessible name.
 *   3. Multiple identical landmarks need distinguishing labels.
 *
 * ARIA does NOT change visual appearance or add keyboard behaviour.
 * Incorrect or excessive ARIA harms accessibility more than no ARIA at all.
 */

// ─── Heuristic label dictionary (Ukrainian) ────────────────────────────────
const SEMANTIC_LABELS = {
  close:      'Close',
  dismiss:    'Close',
  delete:     'Delete',
  remove:     'Remove',
  edit:       'Edit',
  modify:     'Edit',
  search:     'Search',
  find:       'Search',
  menu:       'Open menu',
  hamburger:  'Open menu',
  back:       'Go back',
  forward:    'Go forward',
  next:       'Next',
  prev:       'Previous',
  previous:   'Previous',
  submit:     'Submit',
  save:       'Save',
  cancel:     'Cancel',
  print:      'Print',
  download:   'Download',
  upload:     'Upload file',
  share:      'Share',
  like:       'Like',
  favorite:   'Add to favourites',
  bookmark:   'Bookmark',
  add:        'Add',
  create:     'Create',
  settings:   'Settings',
  config:     'Settings',
  home:       'Home page',
  info:       'Information',
  help:       'Help',
  logout:     'Log out',
  login:      'Log in',
  'sign-in':  'Sign in',
  'sign-out': 'Sign out',
  expand:     'Expand',
  collapse:   'Collapse',
  toggle:     'Toggle',
  play:       'Play',
  pause:      'Pause',
  stop:       'Stop',
  mute:       'Mute',
  unmute:     'Unmute',
  fullscreen: 'Full screen',
  zoom:       'Zoom',
  refresh:    'Refresh',
  reload:     'Reload',
  filter:     'Filter',
  sort:       'Sort',
  send:       'Send',
  reply:      'Reply',
  copy:       'Copy',
  cut:        'Cut',
  paste:      'Paste',
  undo:       'Undo',
  redo:       'Redo',
  open:       'Open',
  more:       'More options',
  options:    'Options',
  zoom_in:    'Zoom in',
  zoom_out:   'Zoom out',
  arrow:      'Navigate',
  cart:       'Shopping cart',
  wishlist:   'Wish list',
  profile:    'Profile',
  avatar:     'User avatar',
  notification: 'Notifications',
  alert:      'Alert',
};

// Link text that is ambiguous out of context
const AMBIGUOUS_LINK_TEXTS = new Set([
  'click here', 'here', 'read more', 'more', 'learn more',
  'details', 'link', 'this link', 'continue', 'click', 'go',
  'more info', 'info', 'see more', 'view more', 'show more',
  'дізнатися більше', 'читати далі', 'детальніше', 'далі', 'тут',
  'натисніть тут', 'перейти', 'більше', 'ще', 'подробиці',
]);

// ─── Chrome Built-in AI (Prompt API) helpers ───────────────────────────────

async function checkAIAvailability() {
  try {
    const api = window.ai?.languageModel ?? window.LanguageModel ?? null;
    if (!api) return { available: false, api: null };
    const caps = await api.availability?.() ?? await api.capabilities?.();
    const status = caps?.available ?? caps?.status ?? caps;
    if (status === 'no' || status === 'unavailable') return { available: false, api: null };
    return { available: true, api };
  } catch {
    return { available: false, api: null };
  }
}

async function createAISession(api) {
  try {
    return await api.create({
      systemPrompt:
        'You are an accessibility expert. Generate concise English aria-labels for HTML elements. ' +
        'The label must describe the element\'s PURPOSE (not its appearance). ' +
        'Maximum 6 words. Reply with ONLY the label text, nothing else.',
    });
  } catch {
    return null;
  }
}

async function generateLabelWithAI(session, element, context) {
  try {
    const tag = element.tagName.toLowerCase();
    const cls = element.className ? ` class="${String(element.className).substring(0, 60)}"` : '';
    const prompt =
      `Element: <${tag}${cls}>\n` +
      `Context: ${context.substring(0, 200)}\n` +
      `Generate a short English aria-label (max 6 words) for this element's purpose.`;
    const result = await session.prompt(prompt);
    return result?.trim().replace(/^["'«»]|["'«»]$/g, '') || null;
  } catch {
    return null;
  }
}

// ─── Heuristic label from element's own attributes / children ──────────────

function heuristicLabel(element) {
  // 1. SVG <title> inside
  const svgTitle = element.querySelector('svg title');
  if (svgTitle?.textContent.trim()) return svgTitle.textContent.trim();

  // 2. title attribute
  if (element.title?.trim()) return element.title.trim();

  // 3. data-tooltip / data-title / data-label
  const d = element.dataset;
  const dataHint = d.tooltip ?? d.title ?? d.label ?? d.ariaLabel ?? d.hint ?? null;
  if (dataHint?.trim()) return dataHint.trim();

  // 4. alt of contained image
  const iconImg = element.querySelector('img[alt]:not([alt=""])');
  if (iconImg) return iconImg.alt.trim();

  // 5. class + id against semantic dictionary
  const classAndId = `${element.className ?? ''} ${element.id ?? ''}`.toLowerCase();
  for (const [pattern, label] of Object.entries(SEMANTIC_LABELS)) {
    if (classAndId.includes(pattern)) return label;
  }

  return null;
}

// ─── Context string for AI prompt ──────────────────────────────────────────

function getContext(element) {
  const parts = [];

  const section = element.closest('section, article, nav, header, main, aside, form, li, td');
  if (section) {
     // 1. Заголовок найближчої структурної секції (h1-h6)
    const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading?.textContent.trim()) {
      parts.push(`Heading: "${heading.textContent.trim().substring(0, 60)}"`);
    }
  }
  // 2. Текст батьківського елемента (без тексту самого елемента)
  const parentText = element.parentElement?.textContent
    ?.replace(element.textContent ?? '', '').trim().substring(0, 120);
  if (parentText) parts.push(`Near text: "${parentText}"`);

    // 3. id та class елемента
  if (element.id) parts.push(`id="${element.id}"`);
  if (element.className) parts.push(`class="${String(element.className).substring(0, 60)}"`);

  return parts.join('; ') || 'No context';
}

// ─── Utility helpers ────────────────────────────────────────────────────────

function isVisible(el) {
  if (!el.getBoundingClientRect) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const s = window.getComputedStyle(el);
  return (
    s.display !== 'none' &&
    s.visibility !== 'hidden' &&
    s.opacity !== '0' &&
    !el.closest('[hidden]') &&
    el.getAttribute('aria-hidden') !== 'true'
  );
}

function alreadyHasAccessibleName(el) {
  return !!(
    el.getAttribute('aria-labelledby') ||
    el.getAttribute('aria-label')?.trim() ||
    el.getAttribute('title')?.trim() ||
    el.getAttribute('alt')?.trim()
  );
}

/**
 * Set an attribute while saving the original value for later restoration.
 * Tracks changes with data-aw-orig-<attr> backup attributes.
 */
function applyAttr(el, attr, value) {
  const backupKey = `data-aw-orig-${attr}`;
  if (!el.hasAttribute(backupKey)) {
    el.setAttribute(backupKey, el.hasAttribute(attr) ? el.getAttribute(attr) : '\x00none');
  }
  el.setAttribute(attr, value);
  el.setAttribute('data-insite-aria-fixed', 'true');
}

// ─── Cleanup / undo all fixes applied by this module ───────────────────────

export function removeAriaFixes() {
  document.querySelectorAll('[data-insite-aria-fixed]').forEach(el => {
    const toRestore = [];
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('data-aw-orig-')) {
        const originalAttr = attr.name.slice('data-aw-orig-'.length);
        toRestore.push({ originalAttr, saved: attr.value });
      }
    }
    for (const { originalAttr, saved } of toRestore) {
      if (saved === '\x00none') {
        el.removeAttribute(originalAttr);
      } else {
        el.setAttribute(originalAttr, saved);
      }
      el.removeAttribute(`data-aw-orig-${originalAttr}`);
    }
    el.removeAttribute('data-insite-aria-fixed');
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyse the current page and apply ARIA fixes where justified.
 *
 * @returns {{ fixed: Array, warnings: Array, aiUsed: boolean }}
 */
export async function analyzeAndFixAria() {
  const result = {
    fixed: [],     // { type, description, selector }
    warnings: [],  // { type, description, selector } – First Rule violations, manual fix needed
    aiUsed: false,
  };

  // Attempt to boot Chrome AI session (graceful degradation if unavailable)
  const { available, api } = await checkAIAvailability();
  let aiSession = null;
  if (available) {
    aiSession = await createAISession(api);
    if (aiSession) result.aiUsed = true;
  }

  try {
    await checkIconOnlyButtons(result, aiSession);
    await checkEmptyLinks(result, aiSession);
    checkAmbiguousLinks(result);
    checkMultipleLandmarks(result);
    checkUnlabeledInputs(result);
    checkIframes(result);
    checkDecorativeSvgs(result);
    checkCustomInteractiveElements(result);  // warnings only (First Rule)
  } finally {
    try { aiSession?.destroy(); } catch { /* ignore */ }
  }

  return result;
}

// ─── Check 1: Icon-only buttons ─────────────────────────────────────────────
// <button> is the correct native element (First Rule satisfied).
// When it contains only icons with no visible text, it lacks an accessible
// name → aria-label is the right solution.

async function checkIconOnlyButtons(result, aiSession) {
  const buttons = document.querySelectorAll(
    'button:not([aria-label]):not([aria-labelledby]), [role="button"]:not([aria-label]):not([aria-labelledby])',
  );
  for (const btn of buttons) {
    if (!isVisible(btn) || btn.hasAttribute('data-insite-aria-fixed')) continue;

    const visibleText = btn.textContent?.trim();
    if (visibleText) continue; // Has text — accessible name is sufficient

    let label = heuristicLabel(btn);
    if (!label && aiSession) label = await generateLabelWithAI(aiSession, btn, getContext(btn));
    label = label || 'Button';

    applyAttr(btn, 'aria-label', label);
    result.fixed.push({
      type: 'icon-button',
      description: `<button> без видимого тексту → aria-label="${label}"`,
      selector: btn.id ? `#${btn.id}` : `button.${[...btn.classList].join('.')}`,
    });
  }
}

// ─── Check 2: Empty / icon-only links ───────────────────────────────────────
// <a> is correct native element. No visible text + no accessible name
// → aria-label is justified.

async function checkEmptyLinks(result, aiSession) {
  const links = document.querySelectorAll(
    'a[href]:not([aria-label]):not([aria-labelledby])',
  );
  for (const link of links) {
    if (!isVisible(link) || link.hasAttribute('data-insite-aria-fixed')) continue;

    const visibleText = link.textContent?.trim();
    if (visibleText) continue;

    // img with alt inside provides the accessible name
    if (link.querySelector('img[alt]:not([alt=""])')) continue;

    let label = heuristicLabel(link);
    if (!label && aiSession) label = await generateLabelWithAI(aiSession, link, getContext(link));
    label = label || 'Link';

    applyAttr(link, 'aria-label', label);
    result.fixed.push({
      type: 'empty-link',
      description: `<a> без тексту → aria-label="${label}"`,
      selector: link.id ? `#${link.id}` : 'a (без тексту)',
    });
  }
}

// ─── Check 3: Ambiguous link text ────────────────────────────────────────────
// Native <a> is fine, but non-descriptive text like "click here" or "read more"
// is meaningless out of context for screen reader users who navigate by links.
// aria-label with full context is the correct solution.

function checkAmbiguousLinks(result) {
  const links = document.querySelectorAll(
    'a[href]:not([aria-label]):not([aria-labelledby])',
  );
  links.forEach(link => {
    if (!isVisible(link) || link.hasAttribute('data-insite-aria-fixed')) return;

    const text = link.textContent?.trim().toLowerCase();
    if (!text || !AMBIGUOUS_LINK_TEXTS.has(text)) return;

    // Build a descriptive label from the surrounding paragraph / heading
    const container = link.closest('p, li, td, dd, figcaption');
    const contextText = container?.textContent?.replace(link.textContent ?? '', '').trim().substring(0, 80);

    const nearHeading = link.closest('section, article')?.querySelector('h1, h2, h3, h4')?.textContent?.trim().substring(0, 60);

    const label = contextText
      ? `${link.textContent.trim()} — ${contextText}`
      : nearHeading
      ? `${link.textContent.trim()} about: ${nearHeading}`
      : link.textContent.trim();

    applyAttr(link, 'aria-label', label);
    result.fixed.push({
      type: 'ambiguous-link',
      description: `<a> з нечітким текстом "${link.textContent.trim()}" → aria-label з контекстом`,
      selector: 'a[href]',
    });
  });
}

// ─── Check 4: Multiple identical landmarks ───────────────────────────────────
// Native landmark elements (<nav>, <header>, <footer>, <aside>) are correct.
// When several of the same type appear, screen readers cannot distinguish them
// without aria-label / aria-labelledby — WCAG 2.4.6 Headings and Labels.

function checkMultipleLandmarks(result) {
  const LANDMARK_FALLBACKS = {
    nav:    ['Main navigation', 'Secondary navigation', 'Footer navigation'],
    header: ['Page header', 'Section header', 'Header'],
    footer: ['Page footer', 'Section footer', 'Footer'],
    aside:  ['Sidebar', 'Related content', 'Supplementary content'],
  };

  for (const [tag, fallbacks] of Object.entries(LANDMARK_FALLBACKS)) {
    const elements = Array.from(
      document.querySelectorAll(`${tag}:not([aria-label]):not([aria-labelledby])`),
    ).filter(isVisible);

    if (elements.length < 2) continue; // Single instance needs no disambiguation

    elements.forEach((el, index) => {
      if (el.hasAttribute('data-insite-aria-fixed')) return;

      // Prefer referencing an inner heading (more semantic than a static string)
      const innerHeading = el.querySelector('h1, h2, h3, h4, h5, h6');
      if (innerHeading?.textContent.trim()) {
        if (!innerHeading.id) {
          innerHeading.id = `aw-heading-${Date.now()}-${index}`;
        }
        applyAttr(el, 'aria-labelledby', innerHeading.id);
        result.fixed.push({
          type: 'landmark-label',
          description: `<${tag}> #${index + 1} → aria-labelledby на внутрішній заголовок`,
          selector: tag,
        });
        return;
      }

      // No inner heading → use positional fallback label
      const label = fallbacks[Math.min(index, fallbacks.length - 1)];
      applyAttr(el, 'aria-label', label);
      result.fixed.push({
        type: 'landmark-label',
        description: `<${tag}> #${index + 1} серед кількох → aria-label="${label}"`,
        selector: tag,
      });
    });
  }
}

// ─── Check 5: Unlabelled form inputs ─────────────────────────────────────────
// Native <input>, <select>, <textarea> are correct.
// When no <label> is associated (explicit for/id or implicit wrapping),
// and no aria-label / title / placeholder exists, the input has no accessible name.

function checkUnlabeledInputs(result) {
  const EXCLUDED_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image']);
  const TYPE_LABELS = {
    email:    'Email address',
    password: 'Password',
    search:   'Search',
    tel:      'Phone number',
    url:      'Web address',
    number:   'Number',
    date:     'Date',
    time:     'Time',
    month:    'Month',
    week:     'Week',
    range:    'Range',
    color:    'Color',
    text:     'Text field',
    checkbox: 'Checkbox',
    radio:    'Radio button',
    select:   'Select',
    textarea: 'Text area',
  };

  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    if (!isVisible(input) || input.hasAttribute('data-insite-aria-fixed')) return;
    if (input.getAttribute('aria-hidden') === 'true') return;

    const type = (input.getAttribute('type') ?? input.tagName.toLowerCase()).toLowerCase();
    if (EXCLUDED_TYPES.has(type)) return;

    // 1. Explicit label via for/id
    if (input.id && document.querySelector(`label[for="${input.id}"]`)) return;
    // 2. Implicit label (input wrapped in <label>)
    if (input.closest('label')) return;
    // 3. Already labelled via ARIA / title
    if (alreadyHasAccessibleName(input)) return;

    const placeholder = input.getAttribute('placeholder')?.trim();
    const name = input.getAttribute('name')?.replace(/[-_]/g, ' ').trim();
    const label =
      placeholder ||
      name ||
      TYPE_LABELS[type] ||
      'Input field';

    applyAttr(input, 'aria-label', label);
    result.fixed.push({
      type: 'unlabeled-input',
      description: `<${input.tagName.toLowerCase()}> без підпису → aria-label="${label}"`,
      selector: input.id ? `#${input.id}` : `${input.tagName.toLowerCase()}[name="${input.getAttribute('name')}"]`,
    });
  });
}

// ─── Check 6: Iframes without title ──────────────────────────────────────────
// <iframe title="..."> is the HTML-native solution — not ARIA.
// Screen readers announce the title when users encounter an iframe.

function checkIframes(result) {
  const iframes = document.querySelectorAll(
    'iframe:not([title]):not([aria-label]):not([aria-labelledby])',
  );
  iframes.forEach((iframe, index) => {
    if (!isVisible(iframe) || iframe.hasAttribute('data-insite-aria-fixed')) return;

    const src = iframe.src ?? '';
    let label = 'Embedded frame';
    try {
      const host = src ? new URL(src).hostname : '';
      if (host.includes('youtube') || host.includes('youtu.be')) label = 'YouTube video';
      else if (host.includes('vimeo'))           label = 'Vimeo video';
      else if (host.includes('google.com/maps')) label = 'Google Maps';
      else if (host.includes('maps.google'))     label = 'Google Maps';
      else if (host.includes('facebook'))        label = 'Facebook';
      else if (host.includes('twitter') || host.includes('x.com')) label = 'Twitter / X';
      else if (host.includes('instagram'))       label = 'Instagram';
      else if (host.includes('tiktok'))          label = 'TikTok';
      else if (host.includes('spotify'))         label = 'Spotify';
    } catch { /* invalid src */ }

    applyAttr(iframe, 'title', label);
    result.fixed.push({
      type: 'iframe-title',
      description: `<iframe> без title → title="${label}"`,
      selector: `iframe (${index + 1})`,
    });
  });
}

// ─── Check 7: Decorative inline SVGs ────────────────────────────────────────
// Inline <svg> used as decorative icons must have aria-hidden="true" and
// focusable="false" so screen readers skip them silently.
// Informative SVGs must have role="img" and aria-label or an inner <title>.

function checkDecorativeSvgs(result) {
  const svgs = document.querySelectorAll(
    'svg:not([aria-label]):not([aria-labelledby]):not([aria-hidden]):not([role="img"])',
  );
  svgs.forEach(svg => {
    if (svg.hasAttribute('data-insite-aria-fixed')) return;

    const hasTitle = !!svg.querySelector('title')?.textContent.trim();
    if (hasTitle) return; // Informative SVG — has its own title, do not touch

    // If inside an already-labelled interactive element → mark as decorative
    const labelledParent = svg.closest('[aria-label], [aria-labelledby], button, a');
    if (labelledParent) {
      // The parent provides the accessible name; SVG is purely decorative
      applyAttr(svg, 'aria-hidden', 'true');
      applyAttr(svg, 'focusable', 'false');
      result.fixed.push({
        type: 'decorative-svg',
        description: 'Декоративна <svg> всередині підписаного батька → aria-hidden="true" focusable="false"',
        selector: 'svg',
      });
      return;
    }

    // Standalone SVG with no accessible name — treat as decorative
    applyAttr(svg, 'aria-hidden', 'true');
    applyAttr(svg, 'focusable', 'false');
    result.fixed.push({
      type: 'decorative-svg',
      description: 'Самостійна декоративна <svg> → aria-hidden="true" focusable="false"',
      selector: 'svg',
    });
  });
}

// ─── Check 8: Custom interactive elements (First Rule warnings) ──────────────
// <div onclick> and <span onclick> violate the First Rule of ARIA.
// They should be replaced with native <button> or <a>.
// We warn the developer instead of auto-patching the underlying structure.
// As a minimum safety patch we add tabindex="0" to role="button" elements
// that have no keyboard access at all (otherwise they are keyboard traps).

function checkCustomInteractiveElements(result) {
  const suspects = document.querySelectorAll(
    'div[onclick], span[onclick], li[onclick], div[role="button"], span[role="button"]',
  );
  suspects.forEach(el => {
    if (!isVisible(el) || el.hasAttribute('data-insite-aria-fixed')) return;

    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role') ?? '';

    result.warnings.push({
      type: 'first-rule-violation',
      description:
        `<${tag}${role ? ` role="${role}"` : ''}> використовується як інтерактивний елемент. ` +
        `Замініть на нативний <button> або <a> — це автоматично дасть клавіатурну поведінку ` +
        `та screen-reader оголошення без жодного ARIA.`,
      selector: el.id ? `#${el.id}` : `${tag}${role ? `[role="${role}"]` : '[onclick]'}`,
    });

    // Minimum safety patch: role="button" without tabindex is unreachable by keyboard
    if (role === 'button' && !el.hasAttribute('tabindex')) {
      applyAttr(el, 'tabindex', '0');
      if (!alreadyHasAccessibleName(el) && !el.textContent?.trim()) {
        const label = heuristicLabel(el) ?? 'Interactive element';
        applyAttr(el, 'aria-label', label);
      }
      result.fixed.push({
        type: 'custom-interactive-patch',
        description:
          `<${tag} role="button"> — додано tabindex="0" для доступу з клавіатури ` +
          `(мінімальне виправлення; замініть на <button> для повної відповідності).`,
        selector: el.id ? `#${el.id}` : tag,
      });
    }
  });
}
