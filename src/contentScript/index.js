import { injectStyles, removeStyles, removeOverlay } from './domUtils';
import { visualProfile }   from './profiles/visualProfile';
import { hearingProfile }  from './profiles/hearingProfile';
import { motorProfile }    from './profiles/motorProfiles';
import { cognitiveProfile } from './profiles/cognitiveProfile';
import { analyzeAndFixAria, removeAriaFixes } from './ariaAnalyzer';

const PROFILES = {
  visual:    visualProfile,
  hearing:   hearingProfile,
  motor:     motorProfile,
  cognitive: cognitiveProfile,
};

function applyProfile(profileId, level, checkboxState = {}) {
  // Скинути попередні стилі і DOM-зміни
  removeStyles();
  removeOverlay();
  removeAriaFixes();

  if (!profileId || !level) return;

  const profile = PROFILES[profileId];
  if (!profile) {
    console.warn('[insite] Unknown profile:', profileId);
    return;
  }

  // Витягуємо активні чекбокси для поточного профілю та рівня
  const prefix = `${profileId}_${level}_`;
  const relevantKeys = Object.keys(checkboxState).filter(k => k.startsWith(prefix));
  // Якщо немає збереженого стану — застосовуємо все (null = усе увімкнено)
  const active = relevantKeys.length > 0
    ? new Set(relevantKeys.filter(k => checkboxState[k]).map(k => k.slice(prefix.length)))
    : null;

  injectStyles(profile.applyCSS(level, active));
  profile.applyDOM(level, active);
}

// Відновлення профілю при навігації / перезавантаженні сторінки
chrome.storage.local.get(['activeProfile', 'activeLevel', 'isEnabled', 'checkboxState'], (data) => {
  if (data.isEnabled && data.activeProfile && data.activeLevel) {
    applyProfile(data.activeProfile, data.activeLevel, data.checkboxState || {});
  }
});

// Слухаємо команди від Popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'APPLY_PROFILE') {
    applyProfile(message.profileId, message.level, message.checkboxState || {});
    sendResponse({ success: true });
  } else if (message.type === 'RESET') {
    applyProfile(null, null, {});
    sendResponse({ success: true });
  } else if (message.type === 'ANALYZE_ARIA') {
    analyzeAndFixAria()
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // тримаємо канал відкритим для async відповіді
  } else if (message.type === 'RESET_ARIA') {
    removeAriaFixes();
    sendResponse({ success: true });
  }
  return true; // тримаємо канал відкритим для async відповіді
});
