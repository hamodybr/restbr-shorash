(() => {
  [
    ['restbrBrandBackgroundV1Script', 'js/brand-background-v1.js?v=1.0'],
    ['restbrCategoryNavigationV2Script', 'js/category-navigation-v2.js?v=1.0']
  ].forEach(([id, src]) => {
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  });
})();

(() => {
  if (!document.getElementById('smSeamlessBackgroundVideoLoader')) {
    const script = document.createElement('script');
    script.id = 'smSeamlessBackgroundVideoLoader';
    script.src = 'js/seamless-background-video.js?v=1.0';
    script.defer = true;
    document.head.appendChild(script);
  }
})();

(() => {
  if (window.__RESTBR_ANNOUNCEMENT_TICKER_V2__) return;
  window.__RESTBR_ANNOUNCEMENT_TICKER_V2__ = true;

  const STYLE_ID = 'smUnifiedNewsTickerV2Style';
  let resizeTimer = 0;

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #smAnnouncement.sm-news-ticker,
      .sm-news-ticker{
        overflow:hidden!important;
        border:1px solid rgba(209,153,72,.30)!important;
        background:linear-gradient(90deg,rgba(16,10,6,.96),rgba(10,8,6,.94))!important;
        color:#f0e8db!important;
        box-shadow:0 8px 24px rgba(0,0,0,.18)!important;
        opacity:1!important;
      }

      #smAnnouncement .sm-news-label,
      .sm-news-ticker .sm-news-label{
        position:relative!important;
        z-index:4!important;
        flex:0 0 auto!important;
        min-width:52px!important;
        padding-inline:10px!important;
        border-radius:999px!important;
        background:linear-gradient(135deg,#b92d27,#7e1714)!important;
        color:#fff4ef!important;
        -webkit-text-fill-color:#fff4ef!important;
        font-weight:950!important;
        opacity:1!important;
        text-shadow:none!important;
        box-shadow:0 0 18px rgba(185,45,39,.18)!important;
      }

      #smAnnouncement .sm-news-window,
      .sm-news-ticker .sm-news-window{
        position:relative!important;
        overflow:hidden!important;
        flex:1 1 auto!important;
        min-width:0!important;
        -webkit-mask-image:linear-gradient(to right,transparent 0,#000 3%,#000 97%,transparent 100%)!important;
        mask-image:linear-gradient(to right,transparent 0,#000 3%,#000 97%,transparent 100%)!important;
      }

      #smAnnouncement .sm-news-track,
      .sm-news-ticker .sm-news-track{
        position:absolute!important;
        top:0!important;
        bottom:0!important;
        left:0!important;
        width:max-content!important;
        min-width:max-content!important;
        height:100%!important;
        display:flex!important;
        align-items:center!important;
        white-space:nowrap!important;
        will-change:transform,opacity!important;
      }

      #smAnnouncement .sm-news-copy,
      .sm-news-ticker .sm-news-copy{
        color:#f0e8db!important;
        -webkit-text-fill-color:#f0e8db!important;
        font-weight:850!important;
        opacity:1!important;
        filter:none!important;
        text-shadow:none!important;
      }

      .sm-news-ticker.sm-news-motion .sm-news-track{
        animation:smUnifiedTickerMotionV2 var(--sm-news-motion-duration,14s) linear infinite!important;
      }

      .sm-news-ticker.sm-news-motion-rtl{
        direction:rtl!important;
      }
      .sm-news-ticker.sm-news-motion-rtl .sm-news-label{
        order:0!important;
        direction:rtl!important;
      }
      .sm-news-ticker.sm-news-motion-rtl .sm-news-window{
        order:1!important;
        direction:rtl!important;
      }
      .sm-news-ticker.sm-news-motion-rtl .sm-news-track,
      .sm-news-ticker.sm-news-motion-rtl .sm-news-copy{
        direction:rtl!important;
        text-align:right!important;
      }

      .sm-news-ticker.sm-news-motion-ltr{
        direction:ltr!important;
      }
      .sm-news-ticker.sm-news-motion-ltr .sm-news-label{
        order:0!important;
        direction:ltr!important;
      }
      .sm-news-ticker.sm-news-motion-ltr .sm-news-window{
        order:1!important;
        direction:ltr!important;
      }
      .sm-news-ticker.sm-news-motion-ltr .sm-news-track,
      .sm-news-ticker.sm-news-motion-ltr .sm-news-copy{
        direction:ltr!important;
        text-align:left!important;
      }

      .sm-news-ticker.sm-news-static .sm-news-track{
        position:relative!important;
        inset:auto!important;
        width:100%!important;
        min-width:0!important;
        transform:none!important;
        animation:none!important;
        opacity:1!important;
      }
      .sm-news-ticker.sm-news-static .sm-news-copy{
        display:block!important;
        width:100%!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
      }

      .sm-news-ticker .sm-news-copy[aria-hidden="true"]{
        display:none!important;
      }

      @keyframes smUnifiedTickerMotionV2{
        0%{transform:translateX(var(--sm-news-motion-start,0px));opacity:0}
        4%{opacity:1}
        96%{opacity:1}
        100%{transform:translateX(var(--sm-news-motion-end,0px));opacity:0}
      }

      @media(prefers-reduced-motion:reduce){
        .sm-news-ticker.sm-news-motion .sm-news-track{
          animation:none!important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function currentLanguage() {
    const lang = String(
      (typeof window.RESTBR_LANG === 'function' ? window.RESTBR_LANG() : '') ||
      localStorage.getItem('RESTBR_LANG_V1') ||
      document.documentElement.lang ||
      'ar'
    ).toLowerCase();
    return ['ar', 'ku', 'en'].includes(lang) ? lang : 'ar';
  }

  function uiDesign() {
    const value = window.RESTBR_DB?.settings?.uiDesign;
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function asBool(value, fallback = true) {
    if (value === true || value === false) return value;
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
    return fallback;
  }

  function durationSeconds() {
    const configured = Number(uiDesign().announcement_ticker_speed);
    if (Number.isFinite(configured)) return Math.min(30, Math.max(8, configured));

    const ticker = document.getElementById('smAnnouncement');
    const raw = ticker ? getComputedStyle(ticker).getPropertyValue('--sm-news-duration').trim() : '';
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) && parsed > 0 ? Math.min(30, Math.max(8, parsed)) : 14;
  }

  function motionEnabled() {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return false;
    return asBool(uiDesign().announcement_ticker_motion, true);
  }

  function restart(track) {
    if (!track) return;
    track.style.animation = 'none';
    void track.offsetWidth;
    track.style.removeProperty('animation');
  }

  function syncTicker({ restartAnimation = false } = {}) {
    installStyle();

    const ticker = document.getElementById('smAnnouncement');
    if (!ticker || ticker.style.display === 'none') return;

    const windowEl = ticker.querySelector('.sm-news-window');
    const track = ticker.querySelector('.sm-news-track');
    if (!windowEl || !track) return;

    const lang = currentLanguage();
    const rtl = lang !== 'en';
    const animate = motionEnabled();

    ticker.classList.toggle('sm-news-motion-rtl', rtl);
    ticker.classList.toggle('sm-news-motion-ltr', !rtl);
    ticker.classList.toggle('sm-news-motion', animate);
    ticker.classList.toggle('sm-news-static', !animate);

    if (!animate) {
      track.style.removeProperty('animation');
      track.style.removeProperty('transform');
      return;
    }

    const windowWidth = Math.max(1, Math.ceil(windowEl.getBoundingClientRect().width));
    const trackWidth = Math.max(1, Math.ceil(track.scrollWidth));
    const edge = 14;

    // The BEGINNING of the sentence enters first:
    // RTL Arabic/Kurdish: the right edge (text start) enters from the left.
    // LTR English: the left edge (text start) enters from the right.
    const start = rtl
      ? -(trackWidth + edge)
      : windowWidth + edge;
    const end = rtl
      ? windowWidth + edge
      : -(trackWidth + edge);

    ticker.style.setProperty('--sm-news-motion-start', `${start}px`);
    ticker.style.setProperty('--sm-news-motion-end', `${end}px`);
    ticker.style.setProperty('--sm-news-motion-duration', `${durationSeconds().toFixed(1)}s`);

    if (restartAnimation) restart(track);
  }

  function syncSoon() {
    requestAnimationFrame(() => syncTicker({ restartAnimation: true }));
    setTimeout(() => syncTicker({ restartAnimation: true }), 80);
    setTimeout(() => syncTicker({ restartAnimation: true }), 220);
  }

  window.addEventListener('restbr:ready', syncSoon);
  window.addEventListener('pageshow', syncSoon);

  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-lang],[data-sm-gate-lang]')) syncSoon();
  });

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => syncTicker({ restartAnimation: false }), 80);
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(syncSoon, 220), { once: true });
  } else {
    setTimeout(syncSoon, 220);
  }
})();
