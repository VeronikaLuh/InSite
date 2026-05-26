import { useState, useEffect, useCallback } from 'react'
import { PROFILES } from '../config/profilesData';
import './Popup.css'

export const Popup = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [checkboxState, setCheckboxState] = useState({});
  const [isApplied, setIsApplied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Стан AI ARIA-аналізатора
  const [ariaOpen, setAriaOpen] = useState(false);
  const [isAriaAnalyzing, setIsAriaAnalyzing] = useState(false);
  const [ariaResult, setAriaResult] = useState(null);
  const [ariaError, setAriaError] = useState(null);

   // Завантаження збереженого стану
  useEffect(() => {
    chrome.storage.local.get(['activeProfile', 'activeLevel', 'isEnabled', 'checkboxState'], (data) => {
      if (data.isEnabled !== undefined) setIsEnabled(data.isEnabled);
      if (data.activeProfile) {
        setSelectedProfile(data.activeProfile);
        setIsApplied(true);
      }
      if (data.activeLevel) setSelectedLevel(data.activeLevel);
      if (data.checkboxState) setCheckboxState(data.checkboxState);
    });
  }, []);

  // Ініціалізація чекбоксів при зміні профілю або рівня
  useEffect(() => {
    if (selectedProfile && selectedLevel) {
      const profile = PROFILES[selectedProfile];
      const level = profile?.levels.find(l => l.id === selectedLevel);
      if (level) {
        const newState = {};
        level.checkboxes.forEach(cb => {
          const key = `${selectedProfile}_${selectedLevel}_${cb.id}`;
          newState[key] = checkboxState[key] !== undefined ? checkboxState[key] : cb.default;
        });
        setCheckboxState(prev => ({ ...prev, ...newState }));
      }
    }
  }, [selectedProfile, selectedLevel]);

  const currentProfile = PROFILES[selectedProfile];
  const currentLevel = currentProfile?.levels.find(l => l.id === selectedLevel);

  const handleProfileChange = (e) => {
    const val = e.target.value;
    setSelectedProfile(val);
    setSelectedLevel('');
    setIsApplied(false);
  };

  const handleLevelChange = (levelId) => {
    setSelectedLevel(levelId);
    setIsApplied(false);
  };

  const toggleCheckbox = (key) => {
    setCheckboxState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sendToPage = useCallback((profileId, level, cbs = {}) => {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) { resolve(false); return; }
        chrome.tabs.sendMessage(tabs[0].id, {
          type: profileId ? 'APPLY_PROFILE' : 'RESET',
          profileId,
          level,
          checkboxState: cbs,
        }, (response) => {
          resolve(response?.success || false);
        });
      });
    });
  }, []);

  const handleApply = async () => {
    if (!selectedProfile || !selectedLevel) return;
    setIsSending(true);
    const success = await sendToPage(selectedProfile, selectedLevel, checkboxState);
    setIsSending(false);
    setIsApplied(true);
    chrome.storage.local.set({
      activeProfile: selectedProfile,
      activeLevel: selectedLevel,
      isEnabled: true,
      checkboxState,
    });
  };

  const handleReset = async () => {
    setIsSending(true);
    await sendToPage(null, null);
    setIsSending(false);
    setIsApplied(false);
    setSelectedProfile('');
    setSelectedLevel('');
    chrome.storage.local.set({
      activeProfile: '',
      activeLevel: '',
      isEnabled: false,
    });
  };

  const handleToggle = async (val) => {
    setIsEnabled(val);
    if (!val) {
      await sendToPage(null, null);
      setIsApplied(false);
      chrome.storage.local.set({ isEnabled: false });
    } else if (selectedProfile && selectedLevel) {
      await sendToPage(selectedProfile, selectedLevel, checkboxState);
      setIsApplied(true);
      chrome.storage.local.set({ isEnabled: true });
    }
  };

  const handleAriaAnalyze = useCallback(() => {
    setIsAriaAnalyzing(true);
    setAriaResult(null);
    setAriaError(null);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        setIsAriaAnalyzing(false);
        setAriaError('Не вдалося отримати активну вкладку.');
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { type: 'ANALYZE_ARIA' }, (response) => {
        setIsAriaAnalyzing(false);
        if (chrome.runtime.lastError) {
          setAriaError('Розширення не підключено до сторінки. Перезавантажте вкладку.');
          return;
        }
        if (response?.success) {
          setAriaResult(response.result);
        } else {
          setAriaError(response?.error ?? 'Аналіз не вдався.');
        }
      });
    });
  }, []);

  const handleAriaReset = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: 'RESET_ARIA' }, () => {
        setAriaResult(null);
        setAriaError(null);
      });
    });
  }, []);

  const accentColor = currentProfile?.color || '#4A90E2';

  return (
    <>
      <div className="app">
        {/* Шапка */}
        <div className="header">
          <div className="header-text">
            <h1>InSite</h1>
            <p>Адаптивний рендеринг сайтів</p>
          </div>
          <div className="header-toggle">
            <div className="toggle-wrap">
              <span className="toggle-label">{isEnabled ? 'Увімк.' : 'Вимк.'}</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  aria-label={isEnabled ? 'Вимкнути розширення' : 'Увімкнути розширення'}
                  checked={isEnabled}
                  onChange={e => handleToggle(e.target.checked)}
                />
                <span className="toggle-track" />
                <span className="toggle-thumb" />
              </label>
            </div>
          </div>
        </div>

        {/* Тіло */}
        <div className="body" style={!isEnabled ? { opacity: 0.4, pointerEvents: 'none' } : {}}>
          {/* Випадаючий список вибору профілю */}
          <div className="dropdown-section">
            <div className="dropdown-label">Тип особливості</div>
            <select
              className="dropdown"
              aria-label="Тип особливості — оберіть профіль доступності"
              value={selectedProfile}
              onChange={handleProfileChange}
              disabled={!isEnabled}
            >
              <option value="">— Оберіть профіль —</option>
              {Object.values(PROFILES).map(p => (
                <option key={p.id} value={p.id}>
                  {p.icon}  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Інформаційна картка обраного профілю */}
          {currentProfile && (
            <div
              className="profile-card"
              style={{
                borderColor: accentColor + '44',
                background: accentColor + '11',
              }}
            >
              <div className="profile-card-header">
                <span className="profile-icon">{currentProfile.icon}</span>
                <span className="profile-name" style={{ color: accentColor }}>
                  {currentProfile.label}
                </span>
              </div>
              <div className="profile-desc">{currentProfile.description}</div>
            </div>
          )}

          {/* Вибір ступеня обмеження */}
          {currentProfile && (
            <div className="level-section">
              <div className="dropdown-label">Ступінь обмеження</div>
              <div className="level-tabs" role="group" aria-label="Ступінь обмеження">
                {currentProfile.levels.map((lv, idx) => {
                  const labels = ['Легкий', 'Помірний', 'Тяжкий'];
                  return (
                    <button
                      key={lv.id}
                      className={`level-tab ${selectedLevel === lv.id ? 'active' : ''}`}
                      aria-label={`${labels[idx]} ступінь — ${lv.label}`}
                      aria-pressed={selectedLevel === lv.id}
                      style={selectedLevel === lv.id ? {
                        background: accentColor,
                        borderColor: accentColor,
                      } : {}}
                      onClick={() => handleLevelChange(lv.id)}
                    >
                      {labels[idx]}
                    </button>
                  );
                })}
              </div>

              {currentLevel && (
                <div className="level-info">
                  <div className="level-info-name" style={{ color: accentColor }}>
                    {currentLevel.label}
                  </div>
                  <div className="level-info-desc">{currentLevel.desc}</div>
                </div>
              )}
            </div>
          )}

          {/* Список активних адаптацій (чекбокси) */}
          {currentLevel && (
            <div className="checkboxes-section">
              <div className="checkboxes-title">Активні адаптації</div>
              <div className="checkbox-list">
                {currentLevel.checkboxes.map(cb => {
                  const key = `${selectedProfile}_${selectedLevel}_${cb.id}`;
                  return (
                    <div
                      key={cb.id}
                      className="checkbox-item"
                      style={checkboxState[key] ? { borderColor: accentColor + '66' } : {}}
                      onClick={() => toggleCheckbox(key)}
                    >
                      <input
                        type="checkbox"
                        id={key}
                        checked={!!checkboxState[key]}
                        onChange={() => toggleCheckbox(key)}
                        onClick={e => e.stopPropagation()}
                        style={{ accentColor }}
                      />
                      <label htmlFor={key}>{cb.label}</label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Порожній стан — профіль не обрано */}
          {!currentProfile && (
            <div className="empty-state">
              <div className="emoji">🌐</div>
              <p>Оберіть тип особливості та ступінь обмеження, щоб адаптувати цей сайт</p>
            </div>
          )}

          {/* Кнопки дії: застосувати / скинути */}
          {currentLevel && (
            <>
              <button
                className="apply-btn"
                aria-label={isApplied ? `Оновити адаптацію: ${currentProfile?.label}, ${currentLevel?.label}` : `Застосувати адаптацію: ${currentProfile?.label}, ${currentLevel?.label}`}
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)` }}
                onClick={handleApply}
                disabled={isSending}
                aria-busy={isSending}
              >
                {isSending ? 'Застосовується...' : isApplied ? 'Оновити адаптацію' : 'Застосувати'}
              </button>
              <button
                className="reset-btn"
                aria-label="Скинути всі адаптації та вимкнути розширення"
                onClick={handleReset}
              >
                ✕ Скинути всі зміни
              </button>
            </>
          )}
        </div>

        {/* Рядок стану */}
        <div className="status-bar" role="status" aria-live="polite" aria-label="Стан розширення">
          <div className={`status-dot ${isApplied && isEnabled ? 'active' : 'inactive'}`} />
          <span className="status-text">
            {!isEnabled
              ? 'Розширення вимкнено'
              : isApplied && currentProfile
              ? `${currentProfile.icon} ${currentProfile.label} • ${currentLevel?.label || ''}`
              : 'Профіль не активовано'}
          </span>
        </div>

        {/* Секція AI аналізу ARIA */}
        <div className="aria-section">
          <button
            className="aria-section-header"
            aria-label={ariaOpen ? 'Згорнути секцію AI аналізу ARIA' : 'Розгорнути секцію AI аналізу ARIA'}
            aria-expanded={ariaOpen}
            aria-controls="aria-section-body"
            onClick={() => setAriaOpen(o => !o)}
          >
            <span className="aria-section-icon"></span>
            <span className="aria-section-title">AI Аналіз ARIA</span>
            <span className="aria-section-chevron">{ariaOpen ? '▲' : '▼'}</span>
          </button>

          {ariaOpen && (
            <div className="aria-section-body" id="aria-section-body">
              <p className="aria-note">
                Додає ARIA-мітки лише там, де нативний HTML недостатній, згідно з
                {' '}<strong>першим правилом ARIA</strong> (W3C). Порушення нативної семантики
                позначаються як попередження.
              </p>

              <div className="aria-btn-row">
                <button
                  className="aria-analyze-btn"
                  aria-label="Запустити AI аналіз ARIA-доступності поточної сторінки"
                  aria-busy={isAriaAnalyzing}
                  onClick={handleAriaAnalyze}
                  disabled={isAriaAnalyzing}
                >
                  {isAriaAnalyzing ? 'Аналізую…' : 'Аналізувати сторінку'}
                </button>
                {ariaResult && (
                  <button
                    className="aria-reset-btn"
                    aria-label="Скасувати всі ARIA-виправлення на сторінці"
                    title="Скасувати всі зміни ARIA"
                    onClick={handleAriaReset}
                  >
                    ✕
                  </button>
                )}
              </div>

              {ariaError && (
                <div className="aria-error">{ariaError}</div>
              )}

              {ariaResult && (
                <div className="aria-result">
                  <div className="aria-result-summary">
                    <span className="aria-badge aria-badge--fixed">
                      Виправлено: {ariaResult.fixed.length}
                    </span>
                    {ariaResult.warnings.length > 0 && (
                      <span className="aria-badge aria-badge--warn">
                        Попередження: {ariaResult.warnings.length}
                      </span>
                    )}
                    {ariaResult.aiUsed && (
                      <span className="aria-badge aria-badge--ai">Chrome AI</span>
                    )}
                  </div>

                  {ariaResult.fixed.length > 0 && (
                    <div className="aria-list">
                      {ariaResult.fixed.slice(0, 6).map((fix, i) => (
                        <div key={i} className="aria-item aria-item--fixed">
                          <span className="aria-item-dot" />
                          <span className="aria-item-text">{fix.description}</span>
                        </div>
                      ))}
                      {ariaResult.fixed.length > 6 && (
                        <div className="aria-item-more">
                          + ще {ariaResult.fixed.length - 6} виправлень
                        </div>
                      )}
                    </div>
                  )}

                  {ariaResult.warnings.length > 0 && (
                    <div className="aria-list aria-list--warn">
                      <div className="aria-list-label">⚠ Порушення першого правила ARIA</div>
                      {ariaResult.warnings.slice(0, 3).map((w, i) => (
                        <div key={i} className="aria-item aria-item--warn">
                          <span className="aria-item-dot" />
                          <span className="aria-item-text">{w.description}</span>
                        </div>
                      ))}
                      {ariaResult.warnings.length > 3 && (
                        <div className="aria-item-more">
                          + ще {ariaResult.warnings.length - 3} попереджень
                        </div>
                      )}
                    </div>
                  )}

                  {ariaResult.fixed.length === 0 && ariaResult.warnings.length === 0 && (
                    <div className="aria-all-good">
                      Сторінка не потребує додаткових ARIA-міток
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Popup;
