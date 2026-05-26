const PROFILES = {
  visual: {
    id: 'visual',
    icon: '👁',
    label: 'Зорові порушення',
    description: 'Контраст, шрифт, screen reader',
    color: '#1565C0',
    bgLight: '#E3F2FD',
    levels: [
      {
        id: 'low',
        label: 'Слабкий зір',
        desc: 'Збільшений шрифт, кращий контраст, позначення зображень без alt',
        checkboxes: [
          { id: 'font-size', label: 'Збільшення шрифту (+10%)', default: true },
          { id: 'line-height', label: 'Збільшений міжрядковий інтервал', default: true },
          { id: 'alt-tag', label: 'Позначити зображення без alt', default: true },
          { id: 'skip-link', label: 'Посилання "Перейти до контенту"', default: true },
        ],
      },
      {
        id: 'medium',
        label: 'Помірний зоровий бар\'єр',
        desc: 'Дислексія, макулярна дегенерація — шрифт, контраст, кнопки',
        checkboxes: [
          { id: 'high-contrast', label: 'Підвищений контраст тексту', default: true },
          { id: 'larger-buttons', label: 'Збільшені кнопки (44px)', default: true },
          { id: 'focus-ring', label: 'Яскравий індикатор фокусу', default: true },
          { id: 'skip-link', label: 'Посилання "Перейти до контенту"', default: true },
        ],
      },
      {
        id: 'high',
        label: 'Сліпота / Дуже слабкий зір',
        desc: 'Режим High Contrast: чорний фон, жовті посилання, для screen reader',
        checkboxes: [
          { id: 'dark-bg', label: 'Чорний фон, білий текст', default: true },
          { id: 'yellow-links', label: 'Жовті посилання', default: true },
          { id: 'large-focus', label: 'Великий індикатор фокусу (gold)', default: true },
          { id: 'skip-link', label: 'Посилання "Перейти до контенту"', default: true },
          { id: 'fix-alt', label: 'Виправити відсутні alt-теги', default: true },
        ],
      },
    ],
  },
  hearing: {
    id: 'hearing',
    icon: '👂',
    label: 'Слухові порушення',
    description: 'Субтитри, візуальні сповіщення',
    color: '#6A1B9A',
    bgLight: '#F3E5F5',
    levels: [
      {
        id: 'low',
        label: 'Легка втрата слуху',
        desc: 'Позначити відео без субтитрів, увімкнути підсилювачі',
        checkboxes: [
          { id: 'mark-video', label: 'Позначити відео без субтитрів', default: true },
          { id: 'visual-alerts', label: 'Візуальні індикатори для сповіщень', default: true },
        ],
      },
      {
        id: 'medium',
        label: 'Значна втрата слуху',
        desc: 'Повна підтримка: субтитри, ARIA live regions, візуальні події',
        checkboxes: [
          { id: 'mark-video', label: 'Попередження на відео без субтитрів', default: true },
          { id: 'visual-alerts', label: 'Яскраві візуальні сповіщення', default: true },
          { id: 'aria-live', label: 'Підсвітити ARIA live regions', default: true },
          { id: 'stop-audio', label: 'Зупинити автовідтворення аудіо', default: true },
        ],
      },
      {
        id: 'high',
        label: 'Повна глухота',
        desc: 'Максимальна видимість: всі аудіо-події через візуальні сигнали',
        checkboxes: [
          { id: 'mark-video', label: 'Попередження на відео без субтитрів', default: true },
          { id: 'visual-alerts', label: 'Флеш-сповіщення для аудіо-подій', default: true },
          { id: 'aria-live', label: 'Підсвітити & показати SR-текст', default: true },
          { id: 'stop-audio', label: 'Вимкнути всі звуки', default: true },
          { id: 'show-captions', label: 'Показати приховані субтитри', default: true },
        ],
      },
    ],
  },
  motor: {
    id: 'motor',
    icon: '🖱',
    label: 'Моторні порушення',
    description: 'Клавіатурна навігація, великі цілі',
    color: '#2E7D32',
    bgLight: '#E8F5E9',
    levels: [
      {
        id: 'low',
        label: 'Легкі моторні обмеження',
        desc: 'Мінімальні кнопки 44px, видимий фокус',
        checkboxes: [
          { id: 'min-target', label: 'Мінімальний розмір цілі 44px', default: true },
          { id: 'focus-visible', label: 'Видимий індикатор фокусу', default: true },
          { id: 'skip-link', label: 'Посилання "Перейти до контенту"', default: true },
        ],
      },
      {
        id: 'medium',
        label: 'Тремор / Слабкість рук',
        desc: 'Збільшені цілі, розширені зони кліку, клавіатурні еквіваленти',
        checkboxes: [
          { id: 'large-target', label: 'Збільшені кнопки (48px)', default: true },
          { id: 'focus-visible', label: 'Яскравий фокус (синій)', default: true },
          { id: 'skip-link', label: 'Посилання "Перейти до контенту"', default: true },
          { id: 'mouse-focus', label: 'Клавіатурні альтернативи для hover', default: true },
        ],
      },
      {
        id: 'high',
        label: 'Тяжкі моторні порушення',
        desc: 'Лише клавіатура/switch: максимальні цілі, drag-and-drop альтернативи',
        checkboxes: [
          { id: 'xl-target', label: 'Великі кнопки (56px)', default: true },
          { id: 'focus-visible', label: 'Максимальний фокус (5px)', default: true },
          { id: 'skip-link', label: 'Посилання "Перейти до контенту"', default: true },
          { id: 'drag-alt', label: 'Позначити drag-and-drop елементи', default: true },
          { id: 'big-checkbox', label: 'Збільшені checkbox/radio (24px)', default: true },
        ],
      },
    ],
  },
  cognitive: {
    id: 'cognitive',
    icon: '🧠',
    label: 'Когнітивні порушення',
    description: 'Спрощення, анімації, читабельність',
    color: '#E65100',
    bgLight: '#FFF3E0',
    levels: [
      {
        id: 'low',
        label: 'Легкі когнітивні труднощі',
        desc: 'Уповільнення анімацій, кращі шрифти',
        checkboxes: [
          { id: 'reduce-motion', label: 'Зменшити швидкість анімацій', default: true },
          { id: 'readable-font', label: 'Читабельний шрифт (Arial)', default: true },
          { id: 'line-height', label: 'Збільшений рядковий інтервал', default: true },
          { id: 'stop-autoplay', label: 'Зупинити автовідтворення медіа', default: true },
        ],
      },
      {
        id: 'medium',
        label: 'СДУГ / Дислексія',
        desc: 'Вимкнення анімацій, видалення відволікань, підтримка форм',
        checkboxes: [
          { id: 'no-motion', label: 'Вимкнути всі анімації', default: true },
          { id: 'readable-font', label: 'Шрифт Arial + відступи для дислексії', default: true },
          { id: 'hide-ads', label: 'Приховати рекламу/банери', default: true },
          { id: 'form-hints', label: 'Підказки у формах', default: true },
          { id: 'stop-autoplay', label: 'Зупинити автовідтворення медіа', default: true },
        ],
      },
      {
        id: 'high',
        label: 'Деменція / Тяжкі когнітивні порушення',
        desc: 'Максимальне спрощення: видалення відволікань, структурований контент',
        checkboxes: [
          { id: 'no-motion', label: 'Прибрати всі анімації', default: true },
          { id: 'simple-layout', label: 'Спрощений макет (1 колонка)', default: true },
          { id: 'hide-distractions', label: 'Приховати sidebar, рекламу', default: true },
          { id: 'highlight-headers', label: 'Підсвітити заголовки (зелений)', default: true },
          { id: 'form-hints', label: 'Підказки у формах', default: true },
          { id: 'stop-autoplay', label: 'Зупинити автовідтворення медіа', default: true },
          { id: 'current-nav', label: 'Підсвітити поточний пункт меню', default: true },
        ],
      },
    ],
  },
};

export { PROFILES };