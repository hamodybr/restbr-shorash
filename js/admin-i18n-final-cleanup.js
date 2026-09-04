(() => {
  if (!/(?:^|\/)admin(?:\.html)?\/?$/i.test(location.pathname)) return;
  if (window.__RESTBR_ADMIN_I18N_FINAL_CLEANUP_V1__) return;
  window.__RESTBR_ADMIN_I18N_FINAL_CLEANUP_V1__ = true;

  const staticOriginals = new WeakMap();
  const backupOriginal = new WeakMap();
  const backupTranslated = new WeakMap();

  const isEnglish = () => document.documentElement.dataset.adminLang === 'en';

  const STATIC_BLOCKS = [
    {
      selector: '.ui-design-note',
      english:
        'Each group has its own Default button, and there is also a Reset All button. After any reset, click Save Restaurant Settings.<br>' +
        '0% = exactly the same glass transparency as the footer shown on the live site. Increasing the percentage makes the same glass lighter. The text has no separate background. Default: 0%.'
    },
    {
      selector: '.excel-note',
      english:
        'The file contains Sheets for sections, products, and options. Import updates existing records by <bdi>ID</bdi> and does not delete any record. ' +
        'A full Backup is saved automatically before importing. Best practice: download the current Excel → edit what you need → upload it again.'
    }
  ];

  const BACKUP_EXACT = new Map([
    ['النسخة الكاملة تشمل الأقسام، الأصناف، الخيارات وإعدادات المطعم.', 'The full backup includes sections, products, options, and restaurant settings.'],
    ['النسخة الكاملة تشمل الأقسام، الأصناف، الخيارات وإعدادات المطعم بالكامل.', 'The full backup includes sections, products, options, and all restaurant settings.'],
    ['يشمل الأقسام، الأصناف، الخيارات وإعدادات المطعم بالكامل.', 'Includes sections, products, options, and all restaurant settings.'],
    ['نسخة إعدادات المطعم فقط.', 'Restaurant settings only.'],
    ['نسخة الأقسام فقط.', 'Sections only.'],
    ['نسخة الأصناف والخيارات فقط.', 'Products and options only.'],
    ['نسخة الأسعار فقط.', 'Prices only.']
  ]);

  function translateBackupText(value) {
    const raw = String(value ?? '');
    const trimmed = raw.trim();
    if (!trimmed) return raw;
    if (BACKUP_EXACT.has(trimmed)) return BACKUP_EXACT.get(trimmed);

    let result = trimmed
      .replace(/النسخة الكاملة تشمل/gu, 'The full backup includes')
      .replace(/يشمل/gu, 'Includes')
      .replace(/الأقسام/gu, 'sections')
      .replace(/الأصناف/gu, 'products')
      .replace(/الخيارات/gu, 'options')
      .replace(/إعدادات المطعم/gu, 'restaurant settings')
      .replace(/الأسعار/gu, 'prices')
      .replace(/بالكامل/gu, 'in full');

    return result;
  }

  function applyStaticBlocks() {
    STATIC_BLOCKS.forEach(item => {
      document.querySelectorAll(item.selector).forEach(element => {
        if (!staticOriginals.has(element)) staticOriginals.set(element, element.innerHTML);
        const next = isEnglish() ? item.english : staticOriginals.get(element);
        if (element.innerHTML !== next) element.innerHTML = next;
      });
    });
  }

  function applyBackupNote() {
    const element = document.getElementById('backupTypeNote');
    if (!element) return;

    const live = String(element.textContent ?? '');
    const last = backupTranslated.get(element);
    if (!backupOriginal.has(element) || (last !== undefined && live !== last)) {
      backupOriginal.set(element, live);
    }

    const source = backupOriginal.get(element) ?? live;
    if (isEnglish()) {
      const next = translateBackupText(source);
      backupTranslated.set(element, next);
      if (element.textContent !== next) element.textContent = next;
    } else {
      backupTranslated.delete(element);
      if (element.textContent !== source) element.textContent = source;
    }
  }

  function refresh() {
    applyStaticBlocks();
    applyBackupNote();
  }

  function start() {
    refresh();
    document.addEventListener('restbr:admin-language-change', () => requestAnimationFrame(refresh));

    const observer = new MutationObserver(() => {
      requestAnimationFrame(refresh);
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
