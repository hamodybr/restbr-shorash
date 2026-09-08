(() => {
  if (/(?:^|\/)admin(?:\.html)?\/?$/i.test(location.pathname)) return;
  if (window.__RESTBR_CATEGORY_NAV_V2__) return;
  window.__RESTBR_CATEGORY_NAV_V2__ = true;

  const imageById = new Map();
  let decorateQueued = false;
  let touchState = null;
  let mouseState = null;
  let suppressClickUntil = 0;

  function safeMedia(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (typeof window.RESTBR_SAFE_MEDIA_URL === 'function') {
      return window.RESTBR_SAFE_MEDIA_URL(raw) || '';
    }
    return raw;
  }

  function smartIcon(value) {
    const text = String(value || '').toLowerCase();
    if (/بركر|برجر|burger/.test(text)) return '🍔';
    if (/بيتزا|pizza/.test(text)) return '🍕';
    if (/فطور|breakfast|صبح/.test(text)) return '🍳';
    if (/مشاوي|مشوي|grill|kebab|كباب/.test(text)) return '🔥';
    if (/شاورما|shawarma/.test(text)) return '🌯';
    if (/دجاج|مريشك|مریشک|chicken/.test(text)) return '🍗';
    if (/لحم|گوشت|گۆشت|meat/.test(text)) return '🥩';
    if (/سمك|ماسي|ماهی|fish/.test(text)) return '🐟';
    if (/رز|ارز|برنج|rice|منسف|قوزي|قوزی/.test(text)) return '🍚';
    if (/ساند|سندوي|sandwich/.test(text)) return '🥪';
    if (/مقبل|سلط|salad|starter/.test(text)) return '🥗';
    if (/حلويات|حلو|dessert|sweet/.test(text)) return '🍰';
    if (/قهو|coffee|كاف|کاف/.test(text)) return '☕';
    if (/شاي|tea|چا/.test(text)) return '🫖';
    if (/عصير|مشروب|drink|juice|cold|بارد/.test(text)) return '🥤';
    if (/اطفال|kids|child/.test(text)) return '🧒';
    return '🍽️';
  }

  function installStyles() {
    if (document.getElementById('restbrCategoryNavV2Style')) return;
    const style = document.createElement('style');
    style.id = 'restbrCategoryNavV2Style';
    style.textContent = `
      #smCats.sm-cats{
        gap:8px!important;
        padding:5px 10px 7px!important;
        overflow-x:auto!important;
        overflow-y:hidden!important;
        scroll-behavior:auto!important;
        scroll-snap-type:none!important;
        overscroll-behavior-x:contain!important;
        scrollbar-width:none!important;
        -ms-overflow-style:none!important;
        -webkit-user-select:none!important;
        user-select:none!important;
      }
      #smCats.sm-cats::-webkit-scrollbar{display:none!important}
      #smCats.sm-cats.restbr-manual-drag{cursor:grabbing!important}
      #smCats.sm-cats .sm-cat{
        flex:0 0 auto!important;
        min-width:118px!important;
        max-width:164px!important;
        min-height:58px!important;
        padding:7px 10px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        gap:8px!important;
        border:1px solid rgba(216,169,88,.20)!important;
        border-radius:15px!important;
        background:linear-gradient(145deg,rgba(27,19,12,.92),rgba(11,8,5,.90))!important;
        color:#e7dfd4!important;
        box-shadow:0 8px 22px rgba(0,0,0,.13)!important;
        font-size:11px!important;
        line-height:1.25!important;
        font-weight:850!important;
        white-space:normal!important;
        text-align:start!important;
        scroll-snap-align:none!important;
        transform:none!important;
        touch-action:manipulation!important;
        -webkit-tap-highlight-color:transparent!important;
      }
      #smCats.sm-cats .sm-cat.active{
        border-color:rgba(226,181,94,.68)!important;
        background:linear-gradient(145deg,rgba(72,48,20,.96),rgba(25,16,8,.94))!important;
        color:#f1c977!important;
        box-shadow:0 0 0 1px rgba(226,181,94,.12) inset,0 9px 24px rgba(0,0,0,.16)!important;
      }
      .restbr-cat-icon{
        width:36px!important;
        height:36px!important;
        min-width:36px!important;
        flex:0 0 36px!important;
        display:grid!important;
        place-items:center!important;
        overflow:hidden!important;
        border:1px solid rgba(226,181,94,.16)!important;
        border-radius:11px!important;
        background:rgba(255,255,255,.055)!important;
        font-size:19px!important;
        line-height:1!important;
        pointer-events:none!important;
      }
      .restbr-cat-icon img{
        display:block!important;
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
        object-position:center!important;
      }
      .sm-cat.active .restbr-cat-icon{
        border-color:rgba(241,201,119,.34)!important;
        background:rgba(241,201,119,.10)!important;
      }
      @media(max-width:390px){
        #smCats.sm-cats .sm-cat{
          min-width:108px!important;
          max-width:146px!important;
          min-height:54px!important;
          padding:6px 9px!important;
          gap:7px!important;
          font-size:10px!important;
        }
        .restbr-cat-icon{
          width:33px!important;
          height:33px!important;
          min-width:33px!important;
          flex-basis:33px!important;
          font-size:18px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  async function loadCategoryImages() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('categories')
        .select('id,image_url');
      if (error) throw error;
      imageById.clear();
      (data || []).forEach(row => {
        const id = String(row?.id || '');
        const image = safeMedia(row?.image_url);
        if (id && image) imageById.set(id, image);
      });
      scheduleDecorate();
    } catch (error) {
      console.debug('Category navigation image lookup skipped:', error?.message || error);
    }
  }

  function decorateButton(button) {
    if (!button) return;
    const label = String(button.textContent || '').trim();
    const categoryId = String(button.dataset.catId || '');
    const image = imageById.get(categoryId) || '';

    let holder = button.querySelector(':scope > .restbr-cat-icon');
    if (!holder) {
      holder = document.createElement('span');
      holder.className = 'restbr-cat-icon';
      holder.setAttribute('aria-hidden', 'true');
      button.prepend(holder);
    }

    const key = image ? `img:${image}` : `emoji:${smartIcon(label)}`;
    if (holder.dataset.iconKey === key) return;
    holder.dataset.iconKey = key;
    holder.replaceChildren();

    if (image) {
      const img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      img.loading = 'lazy';
      img.src = image;
      img.addEventListener('error', () => {
        holder.dataset.iconKey = '';
        holder.textContent = smartIcon(label);
      }, { once: true });
      holder.appendChild(img);
    } else {
      holder.textContent = smartIcon(label);
    }
  }

  function decorate() {
    installStyles();
    const rail = document.getElementById('smCats');
    if (!rail) return;
    rail.querySelectorAll('.sm-cat').forEach(decorateButton);
  }

  function scheduleDecorate() {
    if (decorateQueued) return;
    decorateQueued = true;
    requestAnimationFrame(() => {
      decorateQueued = false;
      decorate();
    });
  }

  function centerClicked(button) {
    if (!button) return;
    try {
      button.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    } catch (_) {}
  }

  function bindManualDrag() {
    const rail = document.getElementById('smCats');
    if (!rail || rail.dataset.restbrDragV2 === '1') return;
    rail.dataset.restbrDragV2 = '1';

    rail.addEventListener('touchstart', event => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      touchState = {
        x: touch.clientX,
        y: touch.clientY,
        scrollLeft: rail.scrollLeft,
        intent: '',
        moved: false
      };
    }, { passive: true });

    rail.addEventListener('touchmove', event => {
      if (!touchState || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - touchState.x;
      const dy = touch.clientY - touchState.y;

      if (!touchState.intent && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        touchState.intent = Math.abs(dx) > Math.abs(dy) * 1.12 ? 'horizontal' : 'vertical';
      }
      if (touchState.intent !== 'horizontal') return;

      event.preventDefault();
      if (Math.abs(dx) > 7) touchState.moved = true;
      rail.scrollLeft = touchState.scrollLeft - dx;
    }, { passive: false });

    const finishTouch = () => {
      if (touchState?.moved) suppressClickUntil = Date.now() + 260;
      touchState = null;
    };
    rail.addEventListener('touchend', finishTouch, { passive: true });
    rail.addEventListener('touchcancel', finishTouch, { passive: true });

    rail.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      mouseState = { x: event.clientX, scrollLeft: rail.scrollLeft, moved: false };
      rail.classList.add('restbr-manual-drag');
      rail.setPointerCapture?.(event.pointerId);
    });

    rail.addEventListener('pointermove', event => {
      if (!mouseState || event.pointerType !== 'mouse') return;
      const dx = event.clientX - mouseState.x;
      if (Math.abs(dx) > 5) mouseState.moved = true;
      rail.scrollLeft = mouseState.scrollLeft - dx;
    });

    const finishPointer = event => {
      if (!mouseState) return;
      if (mouseState.moved) suppressClickUntil = Date.now() + 220;
      mouseState = null;
      rail.classList.remove('restbr-manual-drag');
      try { rail.releasePointerCapture?.(event.pointerId); } catch (_) {}
    };
    rail.addEventListener('pointerup', finishPointer);
    rail.addEventListener('pointercancel', finishPointer);

    rail.addEventListener('click', event => {
      const button = event.target.closest?.('.sm-cat');
      if (!button) return;
      if (Date.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      setTimeout(() => centerClicked(button), 20);
    }, true);
  }

  function start() {
    installStyles();
    bindManualDrag();
    decorate();
    void loadCategoryImages();

    const rail = document.getElementById('smCats');
    if (rail) {
      const observer = new MutationObserver(scheduleDecorate);
      observer.observe(rail, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    window.addEventListener('restbr:ready', () => {
      bindManualDrag();
      scheduleDecorate();
      void loadCategoryImages();
    });

    document.addEventListener('click', event => {
      if (event.target.closest?.('[data-lang]')) setTimeout(scheduleDecorate, 40);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
