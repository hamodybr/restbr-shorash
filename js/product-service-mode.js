(() => {
  if (/(?:^|\/)admin(?:\.html)?\/?$/i.test(location.pathname)) return;

  const PRODUCTS_TABLE = 'products';
  const modeByProduct = new Map();
  const metaByProduct = new Map();
  let loaded = false;
  let supported = true;
  let channel = null;
  let switchingCategory = false;
  let refreshTimer = 0;
  let modeWatchTimer = 0;
  let lastMode = '';

  function normalizeMode(value) {
    const mode = String(value || '').trim();
    return ['both', 'dinein', 'takeaway'].includes(mode) ? mode : 'both';
  }

  function currentMode() {
    const mode = String(
      window.RESTBR_ORDER_MODE ||
      document.documentElement.dataset.smDiningMode ||
      ''
    ).trim();

    return ['dinein', 'takeaway'].includes(mode) ? mode : '';
  }

  function allowedForMode(serviceMode, orderMode) {
    const normalized = normalizeMode(serviceMode);
    if (!orderMode) return true;
    return normalized === 'both' || normalized === orderMode;
  }

  function installStyles() {
    if (document.getElementById('smProductServiceModeStyles')) return;
    const style = document.createElement('style');
    style.id = 'smProductServiceModeStyles';
    style.textContent = `.sm-service-mode-hidden{display:none!important}`;
    document.head.appendChild(style);
  }

  async function fetchModes() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;

    const { data, error } = await supabaseClient
      .from(PRODUCTS_TABLE)
      .select('id,category_id,service_mode,is_active,is_visible');

    if (error) {
      if (/service_mode/i.test(String(error.message || error))) {
        supported = false;
        loaded = true;
        modeByProduct.clear();
        metaByProduct.clear();
        console.debug('Product service mode is waiting for its database migration.');
        return;
      }
      throw error;
    }

    supported = true;
    loaded = true;
    modeByProduct.clear();
    metaByProduct.clear();

    (data || []).forEach(row => {
      if (!row?.id) return;
      const id = String(row.id);
      const serviceMode = normalizeMode(row.service_mode);
      modeByProduct.set(id, serviceMode);
      metaByProduct.set(id, {
        categoryId: row.category_id == null ? '' : String(row.category_id),
        serviceMode,
        isActive: row.is_active !== false,
        isVisible: row.is_visible !== false
      });
    });
  }

  function clearVisibilityFilters() {
    document
      .querySelectorAll('.sm-service-mode-hidden')
      .forEach(element => element.classList.remove('sm-service-mode-hidden'));
  }

  function updateSearchCountFromVisibleCards() {
    const input = document.getElementById('smSearchInput');
    if (!input?.value?.trim()) return;

    const count = [...document.querySelectorAll('#smMenu [data-product-card]')]
      .filter(card => !card.classList.contains('sm-service-mode-hidden'))
      .length;

    const holder = document.getElementById('smSearchCount');
    if (!holder) return;
    const lang = localStorage.getItem('RESTBR_LANG_V1') || 'ar';
    holder.textContent =
      lang === 'en'
        ? `${count} result${count === 1 ? '' : 's'}`
        : lang === 'ku'
          ? `${count} ئەنجام`
          : `${count} نتيجة`;
  }

  function ensureVisibleActiveCategory() {
    const searchValue = document.getElementById('smSearchInput')?.value?.trim() || '';
    if (searchValue || switchingCategory) return;

    const activeButton = document.querySelector('#smCats .sm-cat.active');
    if (!activeButton?.classList.contains('sm-service-mode-hidden')) return;

    const firstAllowed = [...document.querySelectorAll('#smCats .sm-cat')]
      .find(button => !button.classList.contains('sm-service-mode-hidden'));

    if (!firstAllowed) return;

    switchingCategory = true;
    queueMicrotask(() => {
      try {
        firstAllowed.click();
      } finally {
        switchingCategory = false;
      }
    });
  }

  function applyVisibility() {
    installStyles();

    if (!loaded || !supported) {
      clearVisibilityFilters();
      return;
    }

    const orderMode = currentMode();
    if (!orderMode) {
      clearVisibilityFilters();
      return;
    }

    const allowedCategories = new Set();

    metaByProduct.forEach(meta => {
      if (!meta.isActive || !meta.isVisible || !meta.categoryId) return;
      if (allowedForMode(meta.serviceMode, orderMode)) {
        allowedCategories.add(meta.categoryId);
      }
    });

    document.querySelectorAll('#smMenu [data-product-card]').forEach(card => {
      const id = String(card.dataset.productCard || '');
      const allowed = allowedForMode(modeByProduct.get(id) || 'both', orderMode);
      card.classList.toggle('sm-service-mode-hidden', !allowed);
    });

    document.querySelectorAll('#smCats .sm-cat[data-cat-id]').forEach(button => {
      const categoryId = String(button.dataset.catId || '');
      button.classList.toggle(
        'sm-service-mode-hidden',
        !!categoryId && !allowedCategories.has(categoryId)
      );
    });

    updateSearchCountFromVisibleCards();
    ensureVisibleActiveCategory();
  }

  function scheduleApply() {
    cancelAnimationFrame(refreshTimer);
    refreshTimer = requestAnimationFrame(applyVisibility);
  }

  async function refreshModes() {
    try {
      await fetchModes();
    } catch (error) {
      console.debug('Product service mode refresh fallback:', error?.message || error);
    }
    applyVisibility();
  }

  function subscribeProducts() {
    if (channel || typeof supabaseClient === 'undefined' || !supabaseClient) return;

    channel = supabaseClient
      .channel('restbr-product-service-mode')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: PRODUCTS_TABLE },
        () => void refreshModes()
      )
      .subscribe();
  }

  function startModeWatcher() {
    if (modeWatchTimer) return;
    modeWatchTimer = window.setInterval(() => {
      const mode = currentMode();
      if (mode !== lastMode) {
        lastMode = mode;
        if (loaded) applyVisibility();
        else void refreshModes();
      }
    }, 200);
  }

  function observeRenders() {
    const observer = new MutationObserver(scheduleApply);
    const menu = document.getElementById('smMenu');
    const cats = document.getElementById('smCats');
    if (menu) observer.observe(menu, { childList: true, subtree: true });
    if (cats) observer.observe(cats, { childList: true, subtree: true });
  }

  function boot() {
    installStyles();
    observeRenders();
    startModeWatcher();
    subscribeProducts();
    void refreshModes();
  }

  window.addEventListener('restbr:ready', () => {
    void refreshModes();
    subscribeProducts();
  });

  window.addEventListener('restbr:prices-updated', event => {
    if (event?.detail?.source !== 'dining-mode') return;
    if (loaded) applyVisibility();
    else void refreshModes();
  });

  window.addEventListener('pageshow', () => {
    void refreshModes();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
