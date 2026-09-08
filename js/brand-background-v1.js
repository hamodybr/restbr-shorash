(() => {
  if (/(?:^|\/)admin(?:\.html)?\/?$/i.test(location.pathname)) return;
  if (window.__RESTBR_BRAND_BACKGROUND_V1__) return;
  window.__RESTBR_BRAND_BACKGROUND_V1__ = true;

  const DEFAULTS = Object.freeze({
    brand_gradient_enabled: true,
    brand_gradient_primary: '#d8a958',
    brand_gradient_secondary: '#6b3d1f',
    brand_gradient_strength: 24,
    brand_background_darkness: 72
  });

  function designSettings() {
    const value = window.RESTBR_DB?.settings?.uiDesign;
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function asBool(value, fallback) {
    if (value === true || value === false) return value;
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
    return fallback;
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function normalizeHex(value, fallback) {
    const raw = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : fallback;
  }

  function hexToRgb(hex) {
    const clean = normalizeHex(hex, '#000000').slice(1);
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16)
    ];
  }

  function installStyles() {
    if (document.getElementById('restbrBrandBackgroundV1Style')) return;

    const style = document.createElement('style');
    style.id = 'restbrBrandBackgroundV1Style';
    style.textContent = `
      html.restbr-brand-atmosphere{
        background:#070503!important;
      }

      html.restbr-brand-atmosphere body{
        min-height:100svh;
        background:
          radial-gradient(ellipse 86% 48% at 5% 2%, rgba(var(--restbr-brand-primary-rgb),var(--restbr-brand-primary-a)) 0%, transparent 67%),
          radial-gradient(ellipse 76% 46% at 98% 30%, rgba(var(--restbr-brand-secondary-rgb),var(--restbr-brand-secondary-a)) 0%, transparent 70%),
          radial-gradient(ellipse 84% 42% at 12% 88%, rgba(var(--restbr-brand-secondary-rgb),var(--restbr-brand-secondary-soft-a)) 0%, transparent 72%),
          linear-gradient(180deg,#0b0805 0%,#070503 48%,#050403 100%)!important;
        background-attachment:fixed!important;
      }

      html.restbr-brand-atmosphere .sm-bg-overlay{
        background:
          linear-gradient(180deg,
            rgba(4,3,2,var(--restbr-brand-dark-top)),
            rgba(5,4,3,var(--restbr-brand-dark-mid)) 43%,
            rgba(5,4,3,var(--restbr-brand-dark-bottom))
          ),
          radial-gradient(circle at 50% 11%,rgba(var(--restbr-brand-primary-rgb),var(--restbr-brand-overlay-a)),transparent 37%),
          radial-gradient(circle at 92% 58%,rgba(var(--restbr-brand-secondary-rgb),var(--restbr-brand-overlay-secondary-a)),transparent 44%)!important;
      }

      html.restbr-brand-atmosphere .sm-app,
      html.restbr-brand-atmosphere .sm-header,
      html.restbr-brand-atmosphere .sm-menu,
      html.restbr-brand-atmosphere .sm-section,
      html.restbr-brand-atmosphere .sm-footer{
        background-color:transparent!important;
      }

      /* Keep utility buttons on the physical right in Arabic, Kurdish and English. */
      #smHeaderTools.sm-header-tools,
      .sm-header-tools{
        left:auto!important;
        right:max(10px,env(safe-area-inset-right))!important;
        margin-left:0!important;
        margin-right:0!important;
        direction:ltr!important;
        justify-content:flex-start!important;
      }

      .sm-cats-wrap,
      .sm-cats-wrap.fixed{
        background:rgba(8,6,4,.82)!important;
        -webkit-backdrop-filter:blur(18px) saturate(1.08)!important;
        backdrop-filter:blur(18px) saturate(1.08)!important;
      }

      @media(max-width:650px){
        #smHeaderTools.sm-header-tools,
        .sm-header-tools{
          left:auto!important;
          right:max(8px,env(safe-area-inset-right))!important;
        }
      }

      @media(prefers-reduced-transparency:reduce){
        .sm-cats-wrap,
        .sm-cats-wrap.fixed{
          background:rgba(8,6,4,.96)!important;
          -webkit-backdrop-filter:none!important;
          backdrop-filter:none!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function apply() {
    installStyles();
    const settings = designSettings();
    const enabled = asBool(settings.brand_gradient_enabled, DEFAULTS.brand_gradient_enabled);
    const root = document.documentElement;

    root.classList.toggle('restbr-brand-atmosphere', enabled);
    if (!enabled) return;

    const primary = normalizeHex(settings.brand_gradient_primary, DEFAULTS.brand_gradient_primary);
    const secondary = normalizeHex(settings.brand_gradient_secondary, DEFAULTS.brand_gradient_secondary);
    const strength = clampNumber(settings.brand_gradient_strength, 0, 60, DEFAULTS.brand_gradient_strength);
    const darkness = clampNumber(settings.brand_background_darkness, 45, 92, DEFAULTS.brand_background_darkness);
    const primaryRgb = hexToRgb(primary).join(',');
    const secondaryRgb = hexToRgb(secondary).join(',');

    const primaryA = 0.055 + (strength / 100) * 0.30;
    const secondaryA = 0.045 + (strength / 100) * 0.24;
    const overlayA = 0.035 + (strength / 100) * 0.20;
    const darkBase = darkness / 100;

    root.style.setProperty('--restbr-brand-primary-rgb', primaryRgb);
    root.style.setProperty('--restbr-brand-secondary-rgb', secondaryRgb);
    root.style.setProperty('--restbr-brand-primary-a', primaryA.toFixed(3));
    root.style.setProperty('--restbr-brand-secondary-a', secondaryA.toFixed(3));
    root.style.setProperty('--restbr-brand-secondary-soft-a', (secondaryA * .58).toFixed(3));
    root.style.setProperty('--restbr-brand-overlay-a', overlayA.toFixed(3));
    root.style.setProperty('--restbr-brand-overlay-secondary-a', (overlayA * .62).toFixed(3));
    root.style.setProperty('--restbr-brand-dark-top', Math.max(.35, darkBase - .24).toFixed(3));
    root.style.setProperty('--restbr-brand-dark-mid', Math.max(.46, darkBase - .10).toFixed(3));
    root.style.setProperty('--restbr-brand-dark-bottom', Math.min(.94, darkBase + .07).toFixed(3));
  }

  function start() {
    apply();
    window.addEventListener('restbr:ready', () => {
      apply();
      setTimeout(apply, 100);
    });
    window.addEventListener('pageshow', apply);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
