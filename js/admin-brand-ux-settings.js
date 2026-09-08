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
      tickerMotionHelp: 'العربي والكوردي يتحركان من اليسار لليمين، والإنكليزي بالعكس حتى تدخل بداية الجملة أولاً.',
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

  let existingDesign = {};
  let settingsLoaded = false;
  let collectPatched = false;

  function lang() {
    return localStorage.getItem('RESTBR_ADMIN_LANGUAGE_V1') === 'en' ? 'en' : 'ar';
  }

  function objectValue(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function asBool(value, fallback) {
    if (value === true || value === false) return value;
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
    return fallback;
  }

  function clamp(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function hex(value, fallback) {
    const raw = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : fallback;
  }

  function normalize(source) {
    const data = objectValue(source);
    return {
      brand_gradient_enabled: asBool(data.brand_gradient_enabled, DEFAULTS.brand_gradient_enabled),
      brand_gradient_primary: hex(data.brand_gradient_primary, DEFAULTS.brand_gradient_primary),
      brand_gradient_secondary: hex(data.brand_gradient_secondary, DEFAULTS.brand_gradient_secondary),
      brand_gradient_strength: Math.round(clamp(data.brand_gradient_strength, 0, 60, DEFAULTS.brand_gradient_strength)),
      brand_background_darkness: Math.round(clamp(data.brand_background_darkness, 45, 92, DEFAULTS.brand_background_darkness)),
      announcement_ticker_motion: asBool(data.announcement_ticker_motion, DEFAULTS.announcement_ticker_motion),
      announcement_ticker_speed: Math.round(clamp(data.announcement_ticker_speed, 8, 30, DEFAULTS.announcement_ticker_speed))
    };
  }

  function installStyle() {
    if (document.getElementById('restbrAdminBrandUxStyle')) return;
    const style = document.createElement('style');
    style.id = 'restbrAdminBrandUxStyle';
    style.textContent = `
      .restbr-brand-ux-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding-top:10px}
      .restbr-brand-ux-control{min-width:0;padding:12px;border:1px solid rgba(216,169,88,.13);border-radius:13px;background:rgba(216,169,88,.035)}
      .restbr-brand-ux-control.full{grid-column:1/-1}
      .restbr-brand-ux-label{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;font-size:12px;font-weight:800}
      .restbr-brand-ux-control small{display:block;margin-top:7px;color:#8f8981;font-size:10.5px;line-height:1.55}
      .restbr-brand-ux-toggle{display:flex;align-items:center;gap:10px;cursor:pointer}
      .restbr-brand-ux-toggle input{width:20px;height:20px;accent-color:#d8a958}
      .restbr-brand-ux-color-row{display:grid;grid-template-columns:52px minmax(0,1fr);gap:8px;align-items:center}
      .restbr-brand-ux-color-row input[type="color"]{width:52px;height:42px;padding:3px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:transparent}
      .restbr-brand-ux-color-row input[type="text"]{width:100%;min-width:0;padding:10px 11px;border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(0,0,0,.22);color:inherit;font:inherit}
      .restbr-brand-ux-range{display:grid;grid-template-columns:minmax(0,1fr) 68px;gap:8px;align-items:center}
      .restbr-brand-ux-range input[type="range"]{width:100%}
      .restbr-brand-ux-range input[type="number"]{width:68px;padding:9px 7px;border:1px solid rgba(255,255,255,.10);border-radius:9px;background:rgba(0,0,0,.22);color:inherit;text-align:center}
      .restbr-brand-ux-reset{border:1px solid rgba(216,169,88,.20);border-radius:9px;padding:6px 9px;background:rgba(216,169,88,.06);color:#d9b46f;font:inherit;font-size:10px;font-weight:800;cursor:pointer}
      @media(max-width:650px){.restbr-brand-ux-grid{grid-template-columns:1fr}.restbr-brand-ux-control.full{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function markup() {
    return `
      <details class="ui-design-group restbr-brand-ux-group" open data-restbr-brand-ux>
        <summary>
          <span class="ui-design-group-title"><strong data-brand-copy="title"></strong><small data-brand-copy="subtitle"></small></span>
          <button class="restbr-brand-ux-reset" type="button" data-brand-reset></button>
        </summary>
        <div class="restbr-brand-ux-grid">
          <div class="restbr-brand-ux-control full">
            <label class="restbr-brand-ux-toggle"><input id="restbrBrandGradientEnabled" type="checkbox"><strong data-brand-copy="gradientEnabled"></strong></label>
            <small data-brand-copy="gradientEnabledHelp"></small>
          </div>

          <div class="restbr-brand-ux-control">
            <div class="restbr-brand-ux-label"><span data-brand-copy="primary"></span></div>
            <div class="restbr-brand-ux-color-row"><input id="restbrBrandPrimaryColor" type="color"><input id="restbrBrandPrimaryText" type="text" maxlength="7" spellcheck="false"></div>
          </div>

          <div class="restbr-brand-ux-control">
            <div class="restbr-brand-ux-label"><span data-brand-copy="secondary"></span></div>
            <div class="restbr-brand-ux-color-row"><input id="restbrBrandSecondaryColor" type="color"><input id="restbrBrandSecondaryText" type="text" maxlength="7" spellcheck="false"></div>
          </div>

          <div class="restbr-brand-ux-control">
            <div class="restbr-brand-ux-label"><span data-brand-copy="strength"></span><b id="restbrBrandStrengthValue"></b></div>
            <div class="restbr-brand-ux-range"><input id="restbrBrandStrength" type="range" min="0" max="60" step="1"><input id="restbrBrandStrengthNumber" type="number" min="0" max="60" step="1"></div>
          </div>

          <div class="restbr-brand-ux-control">
            <div class="restbr-brand-ux-label"><span data-brand-copy="darkness"></span><b id="restbrBrandDarknessValue"></b></div>
            <div class="restbr-brand-ux-range"><input id="restbrBrandDarkness" type="range" min="45" max="92" step="1"><input id="restbrBrandDarknessNumber" type="number" min="45" max="92" step="1"></div>
          </div>

          <div class="restbr-brand-ux-control full">
            <label class="restbr-brand-ux-toggle"><input id="restbrTickerMotion" type="checkbox"><strong data-brand-copy="tickerMotion"></strong></label>
            <small data-brand-copy="tickerMotionHelp"></small>
          </div>

          <div class="restbr-brand-ux-control full">
            <div class="restbr-brand-ux-label"><span data-brand-copy="tickerSpeed"></span><b id="restbrTickerSpeedValue"></b></div>
            <div class="restbr-brand-ux-range"><input id="restbrTickerSpeed" type="range" min="8" max="30" step="1"><input id="restbrTickerSpeedNumber" type="number" min="8" max="30" step="1"></div>
          </div>
        </div>
      </details>
    `;
  }

  function updateCopy() {
    const copy = COPY[lang()];
    document.querySelectorAll('[data-brand-copy]').forEach(node => {
      const value = copy[node.dataset.brandCopy];
      if (value) node.textContent = value;
    });
    const reset = document.querySelector('[data-brand-reset]');
    if (reset) reset.textContent = copy.reset;
    updateLabels();
  }

  function setValue(id, value) {
    const node = document.getElementById(id);
    if (node) node.value = String(value);
  }

  function render(source) {
    const value = normalize(source);
    const gradient = document.getElementById('restbrBrandGradientEnabled');
    const motion = document.getElementById('restbrTickerMotion');
    if (gradient) gradient.checked = value.brand_gradient_enabled;
    if (motion) motion.checked = value.announcement_ticker_motion;

    setValue('restbrBrandPrimaryColor', value.brand_gradient_primary);
    setValue('restbrBrandPrimaryText', value.brand_gradient_primary);
    setValue('restbrBrandSecondaryColor', value.brand_gradient_secondary);
    setValue('restbrBrandSecondaryText', value.brand_gradient_secondary);
    setValue('restbrBrandStrength', value.brand_gradient_strength);
    setValue('restbrBrandStrengthNumber', value.brand_gradient_strength);
    setValue('restbrBrandDarkness', value.brand_background_darkness);
    setValue('restbrBrandDarknessNumber', value.brand_background_darkness);
    setValue('restbrTickerSpeed', value.announcement_ticker_speed);
    setValue('restbrTickerSpeedNumber', value.announcement_ticker_speed);
    updateLabels();
  }

  function updateLabels() {
    const strength = Math.round(clamp(document.getElementById('restbrBrandStrength')?.value, 0, 60, DEFAULTS.brand_gradient_strength));
    const darkness = Math.round(clamp(document.getElementById('restbrBrandDarkness')?.value, 45, 92, DEFAULTS.brand_background_darkness));
    const speed = Math.round(clamp(document.getElementById('restbrTickerSpeed')?.value, 8, 30, DEFAULTS.announcement_ticker_speed));

    const strengthLabel = document.getElementById('restbrBrandStrengthValue');
    const darknessLabel = document.getElementById('restbrBrandDarknessValue');
    const speedLabel = document.getElementById('restbrTickerSpeedValue');
    if (strengthLabel) strengthLabel.textContent = `${strength}%`;
    if (darknessLabel) darknessLabel.textContent = `${darkness}%`;
    if (speedLabel) speedLabel.textContent = `${speed} ${COPY[lang()].seconds}`;
  }

  function bindColor(colorId, textId, fallback) {
    const color = document.getElementById(colorId);
    const text = document.getElementById(textId);
    if (!color || !text) return;

    color.addEventListener('input', () => {
      const value = hex(color.value, fallback);
      color.value = value;
      text.value = value;
    });
    const commitText = () => {
      const value = hex(text.value, fallback);
      text.value = value;
      color.value = value;
    };
    text.addEventListener('change', commitText);
    text.addEventListener('blur', commitText);
  }

  function bindRange(rangeId, numberId, min, max, fallback) {
    const range = document.getElementById(rangeId);
    const number = document.getElementById(numberId);
    if (!range || !number) return;

    const commit = raw => {
      const value = Math.round(clamp(raw, min, max, fallback));
      range.value = String(value);
      number.value = String(value);
      updateLabels();
    };
    range.addEventListener('input', () => commit(range.value));
    number.addEventListener('input', () => commit(number.value));
    number.addEventListener('blur', () => commit(number.value));
  }

  function bind() {
    const group = document.querySelector('[data-restbr-brand-ux]');
    if (!group || group.dataset.bound === '1') return;
    group.dataset.bound = '1';

    bindColor('restbrBrandPrimaryColor', 'restbrBrandPrimaryText', DEFAULTS.brand_gradient_primary);
    bindColor('restbrBrandSecondaryColor', 'restbrBrandSecondaryText', DEFAULTS.brand_gradient_secondary);
    bindRange('restbrBrandStrength', 'restbrBrandStrengthNumber', 0, 60, DEFAULTS.brand_gradient_strength);
    bindRange('restbrBrandDarkness', 'restbrBrandDarknessNumber', 45, 92, DEFAULTS.brand_background_darkness);
    bindRange('restbrTickerSpeed', 'restbrTickerSpeedNumber', 8, 30, DEFAULTS.announcement_ticker_speed);

    group.querySelector('[data-brand-reset]')?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      render(DEFAULTS);
    });
  }

  function inject() {
    if (document.querySelector('[data-restbr-brand-ux]')) return true;
    const wrap = document.querySelector('.ui-design-wrap');
    if (!wrap) return false;

    installStyle();
    const shell = document.createElement('div');
    shell.innerHTML = markup().trim();
    const group = shell.firstElementChild;
    const topbar = wrap.querySelector('.ui-design-topbar');
    if (topbar?.nextSibling) wrap.insertBefore(group, topbar.nextSibling);
    else wrap.appendChild(group);

    bind();
    updateCopy();
    render(existingDesign);
    return true;
  }

  function collectCustom() {
    const fallback = normalize(existingDesign);
    return {
      brand_gradient_enabled: document.getElementById('restbrBrandGradientEnabled')?.checked ?? fallback.brand_gradient_enabled,
      brand_gradient_primary: hex(document.getElementById('restbrBrandPrimaryText')?.value, fallback.brand_gradient_primary),
      brand_gradient_secondary: hex(document.getElementById('restbrBrandSecondaryText')?.value, fallback.brand_gradient_secondary),
      brand_gradient_strength: Math.round(clamp(document.getElementById('restbrBrandStrengthNumber')?.value, 0, 60, fallback.brand_gradient_strength)),
      brand_background_darkness: Math.round(clamp(document.getElementById('restbrBrandDarknessNumber')?.value, 45, 92, fallback.brand_background_darkness)),
      announcement_ticker_motion: document.getElementById('restbrTickerMotion')?.checked ?? fallback.announcement_ticker_motion,
      announcement_ticker_speed: Math.round(clamp(document.getElementById('restbrTickerSpeedNumber')?.value, 8, 30, fallback.announcement_ticker_speed))
    };
  }

  function patchCollector() {
    if (collectPatched || typeof window.collectUiDesignSettings !== 'function') return false;
    const original = window.collectUiDesignSettings;

    window.collectUiDesignSettings = function() {
      const result = original.apply(this, arguments);
      const base = objectValue(result);
      const merged = {
        ...objectValue(existingDesign),
        ...base,
        ...collectCustom()
      };
      existingDesign = { ...merged };
      return merged;
    };

    collectPatched = true;
    return true;
  }

  async function loadSettings() {
    if (settingsLoaded || typeof supabaseClient === 'undefined' || !supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('restaurant_settings')
        .select('ui_design_settings')
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      existingDesign = { ...objectValue(data?.ui_design_settings) };
      settingsLoaded = true;
      if (inject()) render(existingDesign);
    } catch (error) {
      console.debug('Brand UX settings read fallback:', error?.message || error);
    }
  }

  function start() {
    installStyle();
    inject();
    patchCollector();
    void loadSettings();

    const timer = setInterval(() => {
      inject();
      patchCollector();
      if (collectPatched && document.querySelector('[data-restbr-brand-ux]')) clearInterval(timer);
    }, 160);
    setTimeout(() => clearInterval(timer), 15000);

    document.addEventListener('restbr:admin-language-change', () => setTimeout(updateCopy, 0));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
