(() => {
  if (!/(?:^|\/)admin(?:\.html)?\/?$/i.test(location.pathname)) return;
  if (window.__RESTBR_ADMIN_BRAND_UX_V1__) return;
  window.__RESTBR_ADMIN_BRAND_UX_V1__ = true;

  const DEFAULTS = Object.freeze({
    brand_gradient_enabled: true,
    brand_gradient_primary: '#d8a958',
    brand_gradient_secondary: '#6b3d1f',
    brand_gradient_strength: 24,
    brand_background_darkness: 72,
    announcement_ticker_motion: true,
    announcement_ticker_speed: 14
  });

  let existingDesign = {};
  let collectPatched = false;
  let resetPatched = false;
  let settingsLoaded = false;

  const COPY = {
    ar: {
      title: '🎨 هوية الخلفية وشريط الإعلان',
      subtitle: 'تدرج خفيف من ألوان البراند وحركة إعلان أوضح للزبون',
      gradientEnabled: 'تفعيل خلفية البراند المتدرجة',
      gradientEnabledHelp: 'تضيف جو لوني خفيف فوق الخلفية الحالية بدون إلغاء فيديو الخلفية.',
      primary: 'اللون الرئيسي',
      secondary: 'اللون الثانوي',
      strength: 'قوة التدرج',
      darkness: 'عتامة خلفية المحتوى',
      tickerMotion: 'تحريك شريط الإعلان',
      tickerMotionHelp: 'العربي والكوردي يتحركان من اليسار لليمين، والإنكليزي بالعكس حتى تبدأ الجملة أولاً.',
      tickerSpeed: 'مدة دورة الإعلان',
      seconds: 'ثانية',
      reset: 'افتراضي'
    },
    en: {
      title: '🎨 Brand Background & Announcement',
      subtitle: 'Subtle brand gradients and clearer announcement motion',
      gradientEnabled: 'Enable brand gradient background',
      gradientEnabledHelp: 'Adds a subtle brand atmosphere without replacing the existing background video.',
      primary: 'Primary color',
      secondary: 'Secondary color',
      strength: 'Gradient strength',
      darkness: 'Content background darkness',
      tickerMotion: 'Animate announcement ticker',
      tickerMotionHelp: 'Arabic/Kurdish move left-to-right and English right-to-left so the sentence beginning enters first.',
      tickerSpeed: 'Announcement cycle duration',
      seconds: 'sec',
      reset: 'Default'
    }
  };

  function language() {
    return localStorage.getItem('RESTBR_ADMIN_LANGUAGE_V1') === 'en' ? 'en' : 'ar';
  }

  function isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function normalizeHex(value, fallback) {
    const raw = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : fallback;
  }

  function clamp(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function asBool(value, fallback) {
    if (value === true || value === false) return value;
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
    return fallback;
  }

  function valuesFrom(source = {}) {
    const data = isObject(source) ? source : {};
    return {
      brand_gradient_enabled: asBool(data.brand_gradient_enabled, DEFAULTS.brand_gradient_enabled),
      brand_gradient_primary: normalizeHex(data.brand_gradient_primary, DEFAULTS.brand_gradient_primary),
      brand_gradient_secondary: normalizeHex(data.brand_gradient_secondary, DEFAULTS.brand_gradient_secondary),
      brand_gradient_strength: clamp(data.brand_gradient_strength, 0, 60, DEFAULTS.brand_gradient_strength),
      brand_background_darkness: clamp(data.brand_background_darkness, 45, 92, DEFAULTS.brand_background_darkness),
      announcement_ticker_motion: asBool(data.announcement_ticker_motion, DEFAULTS.announcement_ticker_motion),
      announcement_ticker_speed: clamp(data.announcement_ticker_speed, 8, 30, DEFAULTS.announcement_ticker_speed)
    };
  }

  function installStyles() {
    if (document.getElementById('restbrAdminBrandUxStyle')) return;
    const style = document.createElement('style');
    style.id = 'restbrAdminBrandUxStyle';
    style.textContent = `
      .restbr-brand-ux-group .restbr-brand-ux-grid{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;
        padding-top:10px;
      }
      .restbr-brand-ux-control{
        min-width:0;
        padding:12px;
        border:1px solid rgba(216,169,88,.13);
        border-radius:13px;
        background:rgba(216,169,88,.035);
      }
      .restbr-brand-ux-control.full{grid-column:1/-1}
      .restbr-brand-ux-label{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:8px;
        color:inherit;
        font-size:12px;
        font-weight:800;
      }
      .restbr-brand-ux-control small{
        display:block;
        margin-top:7px;
        color:#8f8981;
        font-size:10.5px;
        line-height:1.55;
      }
      .restbr-brand-ux-color-row{
        display:grid;
        grid-template-columns:52px minmax(0,1fr);
        gap:8px;
        align-items:center;
      }
      .restbr-brand-ux-color-row input[type="color"]{
        width:52px;
        height:42px;
        padding:3px;
        border:1px solid rgba(255,255,255,.12);
        border-radius:10px;
        background:transparent;
      }
      .restbr-brand-ux-color-row input[type="text"]{
        width:100%;
        min-width:0;
        padding:10px 11px;
        border:1px solid rgba(255,255,255,.10);
        border-radius:10px;
        background:rgba(0,0,0,.22);
        color:inherit;
        font:inherit;
      }
      .restbr-brand-ux-range{
        display:grid;
        grid-template-columns:minmax(0,1fr) 68px;
        gap:8px;
        align-items:center;
      }
      .restbr-brand-ux-range input[type="range"]{width:100%}
      .restbr-brand-ux-range input[type="number"]{
        width:68px;
        padding:9px 7px;
        border:1px solid rgba(255,255,255,.10);
        border-radius:9px;
        background:rgba(0,0,0,.22);
        color:inherit;
        text-align:center;
      }
      .restbr-brand-ux-toggle{
        display:flex;
        align-items:center;
        gap:10px;
        cursor:pointer;
      }
      .restbr-brand-ux-toggle input{
        width:20px;
        height:20px;
        accent-color:#d8a958;
      }
      .restbr-brand-ux-reset{
        border:1px solid rgba(216,169,88,.20);
        border-radius:9px;
        padding:6px 9px;
        background:rgba(216,169,88,.06);
        color:#d9b46f;
        font:inherit;
        font-size:10px;
        font-weight:800;
        cursor:pointer;
      }
      @media(max-width:650px){
        .restbr-brand-ux-group .restbr-brand-ux-grid{grid-template-columns:1fr}
        .restbr-brand-ux-control.full{grid-column:auto}
      }
    `;
    document.head.appendChild(style);
  }

  function groupMarkup() {
    return `
      <details class="ui-design-group restbr-brand-ux-group" open data-restbr-brand-ux>
        <summary>
          <span class="ui-design-group-title">
            <strong data-brand-copy="title"></strong>
            <small data-brand-copy="subtitle"></small>
          </span>
          <button class="restbr-brand-ux-reset" type="button" data-brand-reset></button>
        </summary>
        <div class="restbr-brand-ux-grid">
          <div class="restbr-brand-ux-control full">
            <label class="restbr-brand-ux-toggle">
              <input id="restbrBrandGradientEnabled" type="checkbox">
              <strong data-brand-copy="gradientEnabled"></strong>
            </label>
            <small data-brand-copy="gradientEnabledHelp"></small>
          </div>

          <div class="restbr-brand-ux-control">
            <div class="restbr-brand-ux-label"><span data-brand-copy="primary"></span></div>
            <div class="restbr-brand-ux-color-row">
              <input id="restbrBrandPrimaryColor" type="color" aria-label="Primary color">
              <input id="restbrBrandPrimaryText" type="text" maxlength="7" spellcheck="false" inputmode="text">
            </div>
          </div>

          <div class="restbr-brand-ux-control">
            <div class="restbr-brand-ux-label"><span data-brand-copy="secondary"></span></div>
            <div class="restbr-brand-ux-color-row">
              <input id="restbrBrandSecondaryColor" type="color" aria-label="Secondary color">
              <input id="restbrBrandSecondaryText" type="text" maxlength="7" spellcheck="false" inputmode="text">
            </div>
          </div>

          <div class="restbr-brand-ux-control">
            <div class="restbr-brand-ux-label"><span data-brand-copy="strength"></span><b id="restbrBrandStrengthValue"></b></div>
            <div class="restbr-brand-ux-range">
              <input id="restbrBrandStrength" type="range" min="0" max="60" step="1">
              <input id="restbrBrandStrengthNumber" type="number" min="0" max="60" step="1">
            </div>
          </div>

          <div class="restbr-brand-ux-control">
            <div class="restbr-brand-ux-label"><span data-brand-copy="darkness"></span><b id="restbrBrandDarknessValue"></b></div>
            <div class="restbr-brand-ux-range">
              <input id="restbrBrandDarkness" type="range" min="45" max="92" step="1">
              <input id="restbrBrandDarknessNumber" type="number" min="45" max="92" step="1">
            </div>
          </div>

          <div class="restbr-brand-ux-control full">
            <label class="restbr-brand-ux-toggle">
              <input id="restbrTickerMotion" type="checkbox">
              <strong data-brand-copy="tickerMotion"></strong>
            </label>
            <small data-brand-copy="tickerMotionHelp"></small>
          </div>

          <div class="restbr-brand-ux-control full">
            <div class="restbr-brand-ux-label"><span data-brand-copy="tickerSpeed"></span><b id="restbrTickerSpeedValue"></b></div>
            <div class="restbr-brand-ux-range">
              <input id="restbrTickerSpeed" type="range" min="8" max="30" step="1">
              <input id="restbrTickerSpeedNumber" type="number" min="8" max="30" step="1">
            </div>
          </div>
        </div>
      </details>
    `;
  }

  function injectGroup() {
    if (document.querySelector('[data-restbr-brand-ux]')) return true;
    const wrap = document.querySelector('.ui-design-wrap');
    if (!wrap) return false;

    installStyles();
    const holder = document.createElement('div');
    holder.innerHTML = groupMarkup().trim();
    const group = holder.firstElementChild;
    const topbar = wrap.querySelector('.ui-design-topbar');
    if (topbar?.nextSibling) wrap.insertBefore(group, topbar.nextSibling);
    else wrap.appendChild(group);

    bindControls();
    updateLanguage();
    renderControls(valuesFrom(existingDesign));
    return true;
  }

  function updateLanguage() {
    const copy = COPY[language()];
    document.querySelectorAll('[data-brand-copy]').forEach(node => {
      const key = node.dataset.brandCopy;
      if (copy[key]) node.textContent = copy[key];
    });
    const reset = document.querySelector('[data-brand-reset]');
    if (reset) reset.textContent = copy.reset;
    updateValueLabels();
  }

  function syncColor(colorId, textId, fallback) {
    const color = document.getElementById(colorId);
    const text = document.getElementById(textId);
    if (!color || !text) return;

    const commit = value => {
      const next = normalizeHex(value, fallback);
      color.value = next;
      text.value = next;
    };

    color.addEventListener('input', () => commit(color.value));
    text.addEventListener('change', () => commit(text.value));
    text.addEventListener('blur', () => commit(text.value));
  }

  function syncRange(rangeId, numberId, min, max, fallback) {
    const range = document.getElementById(rangeId);
    const number = document.getElementById(numberId);
    if (!range || !number) return;

    const commit = value => {
      const next = Math.round(clamp(value, min, max, fallback));
      range.value = String(next);
      number.value = String(next);
      updateValueLabels();
    };

    range.addEventListener('input', () => commit(range.value));
    number.addEventListener('input', () => commit(number.value));
    number.addEventListener('blur', () => commit(number.value));
  }

  function bindControls() {
    const group = document.querySelector('[data-restbr-brand-ux]');
    if (!group || group.dataset.bound === '1') return;
    group.dataset.bound = '1';

    syncColor('restbrBrandPrimaryColor', 'restbrBrandPrimaryText', DEFAULTS.brand_gradient_primary);
    syncColor('restbrBrandSecondaryColor', 'restbrBrandSecondaryText', DEFAULTS.brand_gradient_secondary);
    syncRange('restbrBrandStrength', 'restbrBrandStrengthNumber', 0, 60, DEFAULTS.brand_gradient_strength);
    syncRange('restbrBrandDarkness', 'restbrBrandDarknessNumber', 45, 92, DEFAULTS.brand_background_darkness);
    syncRange('restbrTickerSpeed', 'restbrTickerSpeedNumber', 8, 30, DEFAULTS.announcement_ticker_speed);

    group.querySelector('[data-brand-reset]')?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      renderControls(DEFAULTS);
    });
  }

  function updateValueLabels() {
    const lang = language();
    const strength = Math.round(clamp(document.getElementById('restbrBrandStrength')?.value, 0, 60, DEFAULTS.brand_gradient_strength));
    const darkness = Math.round(clamp(document.getElementById('restbrBrandDarkness')?.value, 45, 92, DEFAULTS.brand_background_darkness));
    const speed = Math.round(clamp(document.getElementById('restbrTickerSpeed')?.value, 8, 30, DEFAULTS.announcement_ticker_speed));

    const strengthValue = document.getElementById('restbrBrandStrengthValue');
    const darknessValue = document.getElementById('restbrBrandDarknessValue');
    const speedValue = document.getElementById('restbrTickerSpeedValue');
    if (strengthValue) strengthValue.textContent = `${strength}%`;
    if (darknessValue) darknessValue.textContent = `${darkness}%`;
    if (speedValue) speedValue.textContent = `${speed} ${COPY[lang].seconds}`;
  }

  function renderControls(source) {
    const values = valuesFrom(source);
    const setChecked = (id, value) => {
      const input = document.getElementById(id);
      if (input) input.checked = !!value;
    };
    const setValue = (id, value) => {
      const input = document.getElementById(id);
      if (input) input.value = String(value);
    };

    setChecked('restbrBrandGradientEnabled', values.brand_gradient_enabled);
    setValue('restbrBrandPrimaryColor', values.brand_gradient_primary);
    setValue('restbrBrandPrimaryText', values.brand_gradient_primary);
    setValue('restbrBrandSecondaryColor', values.brand_gradient_secondary);
    setValue('restbrBrandSecondaryText', values.brand_gradient_secondary);
    setValue('restbrBrandStrength', values.brand_gradient_strength);
    setValue('restbrBrandStrengthNumber', values.brand_gradient_strength);
    setValue('restbrBrandDarkness', values.brand_background_darkness);
    setValue('restbrBrandDarknessNumber', values.brand_background_darkness);
    setChecked('restbrTickerMotion', values.announcement_ticker_motion);
    setValue('restbrTickerSpeed', values.announcement_ticker_speed);
    setValue('restbrTickerSpeedNumber', values.announcement_ticker_speed);
    updateValueLabels();
  }

  function collectCustomValues() {
    const fallback = valuesFrom(existingDesign);
    return {
      brand_gradient_enabled: document.getElementById('restbrBrandGradientEnabled')?.checked ?? fallback.brand_gradient_enabled,
      brand_gradient_primary: normalizeHex(document.getElementById('restbrBrandPrimaryText')?.value, fallback.brand_gradient_primary),
      brand_gradient_secondary: normalizeHex(document.getElementById('restbrBrandSecondaryText')?.value, fallback.brand_gradient_secondary),
      brand_gradient_strength: Math.round(clamp(document.getElementById('restbrBrandStrengthNumber')?.value, 0, 60, fallback.brand_gradient_strength)),
      brand_background_darkness: Math.round(clamp(document.getElementById('restbrBrandDarknessNumber')?.value, 45, 92, fallback.brand_background_darkness)),
      announcement_ticker_motion: document.getElementById('restbrTickerMotion')?.checked ?? fallback.announcement_ticker_motion,
      announcement_ticker_speed: Math.round(clamp(document.getElementById('restbrTickerSpeedNumber')?.value, 8, 30, fallback.announcement_ticker_speed))
    };
  }

  function patchCollect() {
    if (collectPatched || typeof window.collectUiDesignSettings !== 'function') return false;
    const original = window.collectUiDesignSettings;

    window.collectUiDesignSettings = function() {
      const normal = isObject(original.apply(this, arguments)) ? original.apply(this, arguments) : {};
      const merged = {
        ...(isObject(existingDesign) ? existingDesign : {}),
        ...normal,
        ...collectCustomValues()
      };
      existingDesign = { ...merged };
      return merged;
    };

    collectPatched = true;
    return true;
  }

  function patchReset() {
    if (resetPatched || typeof window.resetUiDesignAll !== 'function') return false;
    const original = window.resetUiDesignAll;
    window.resetUiDesignAll = function() {
      const result = original.apply(this, arguments);
      // The base reset has its own confirmation. Apply these defaults only when
      // the existing controls were actually reset by that handler.
      setTimeout(() => {
        try {
          const baseDefaults = typeof UI_DESIGN_DEFAULTS !== 'undefined' ? UI_DESIGN_DEFAULTS : null;
          const firstKey = baseDefaults ? Object.keys(baseDefaults)[0] : '';
          const firstRange = firstKey ? document.querySelector(`[data-ui-key="${firstKey}"]`) : null;
          if (!firstKey || !firstRange || Number(firstRange.value) === Number(baseDefaults[firstKey])) {
            renderControls(DEFAULTS);
          }
        } catch (_) {}
      }, 0);
      return result;
    };
    resetPatched = true;
    return true;
  }

  async function loadExistingSettings() {
    if (settingsLoaded || typeof supabaseClient === 'undefined' || !supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('restaurant_settings')
        .select('ui_design_settings')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      existingDesign = isObject(data?.ui_design_settings) ? { ...data.ui_design_settings } : {};
      settingsLoaded = true;
      if (injectGroup()) renderControls(existingDesign);
    } catch (error) {
      console.debug('Brand UX settings read fallback:', error?.message || error);
    }
  }

  function start() {
    installStyles();
    injectGroup();
    patchCollect();
    patchReset();
    void loadExistingSettings();

    const timer = setInterval(() => {
      injectGroup();
      patchCollect();
      patchReset();
      if (collectPatched && resetPatched && document.querySelector('[data-restbr-brand-ux]')) {
        clearInterval(timer);
      }
    }, 160);
    setTimeout(() => clearInterval(timer), 15000);

    document.addEventListener('restbr:admin-language-change', () => setTimeout(updateLanguage, 0));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
