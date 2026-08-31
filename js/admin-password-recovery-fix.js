(() => {
  if (!/(?:^|\/)admin(?:\.html)?\/?$/i.test(location.pathname)) return;
  if (window.__RESTBR_PASSWORD_RECOVERY_FIX_V1__) return;
  window.__RESTBR_PASSWORD_RECOVERY_FIX_V1__ = true;

  const q = (sel, root = document) => root.querySelector(sel);
  const RECOVERY_PARAM = 'recovery';
  const cleanAdminUrl = () => `${window.location.origin}${window.location.pathname}`;
  const recoveryAdminUrl = () => {
    const url = new URL(cleanAdminUrl());
    url.searchParams.set(RECOVERY_PARAM, '1');
    return url.toString();
  };

  function status(message = '', ok = false) {
    const el = q('#restbrForgotStatus');
    if (!el) return;
    el.textContent = message;
    el.style.color = ok ? '#86efac' : '#fecaca';
  }

  function recoveryStatus(message = '', ok = false) {
    const el = q('#restbrRecoveryFixStatus');
    if (!el) return;
    el.textContent = message;
    el.style.color = ok ? '#86efac' : '#fecaca';
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  async function sendRecoveryEmail() {
    const email = String(q('#restbrForgotEmail')?.value || '').trim().toLowerCase();
    const btn = q('#restbrForgotSendBtn');

    if (!validEmail(email)) {
      status('اكتب بريد إلكتروني صحيح.');
      return;
    }

    if (!btn) return;
    btn.disabled = true;
    btn.textContent = 'جاري الإرسال...';
    status('');

    try {
      if (typeof supabaseClient === 'undefined' || !supabaseClient?.auth) {
        throw new Error('Supabase Auth غير جاهز.');
      }

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: recoveryAdminUrl()
      });
      if (error) throw error;

      status('تم إرسال رابط الاستعادة ✓ افتح أحدث رسالة في بريدك واضغط الرابط.', true);
    } catch (error) {
      console.error('RESTBR PASSWORD RECOVERY FIX EMAIL ERROR:', error);
      const raw = String(error?.message || error || '');
      let message = raw;
      if (/rate|too many/i.test(raw)) message = 'تم إرسال طلبات كثيرة. انتظر قليلًا ثم حاول مرة ثانية.';
      else if (/redirect|url/i.test(raw)) message = 'رابط الرجوع غير مسموح في إعدادات Supabase Auth.';
      status('فشل إرسال رابط الاستعادة: ' + message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'إرسال رابط الاستعادة';
    }
  }

  function takeOverForgotControls() {
    const oldBtn = q('#restbrForgotSendBtn');
    if (!oldBtn || oldBtn.dataset.recoveryFix === '1') return false;

    const btn = oldBtn.cloneNode(true);
    btn.dataset.recoveryFix = '1';
    oldBtn.replaceWith(btn);
    btn.addEventListener('click', () => void sendRecoveryEmail());

    document.addEventListener('keydown', event => {
      if (event.target?.id !== 'restbrForgotEmail' || event.key !== 'Enter') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void sendRecoveryEmail();
    }, true);

    return true;
  }

  function installStyles() {
    if (q('#restbrRecoveryFixStyles')) return;
    const style = document.createElement('style');
    style.id = 'restbrRecoveryFixStyles';
    style.textContent = `
      .restbr-recovery-fix-overlay{
        position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;
        padding:18px;background:rgba(3,2,1,.97);backdrop-filter:blur(16px);
        -webkit-backdrop-filter:blur(16px)
      }
      .restbr-recovery-fix-card{
        width:min(420px,100%);display:grid;gap:12px;padding:20px;
        border:1px solid rgba(216,169,88,.3);border-radius:20px;background:#0b0805;
        box-shadow:0 25px 80px rgba(0,0,0,.7)
      }
      .restbr-recovery-fix-card h2{margin:0;color:#e2b55e;font-size:21px;text-align:center}
      .restbr-recovery-fix-card p{margin:0;color:#9d958c;font-size:11px;line-height:1.8;text-align:center}
      .restbr-recovery-fix-card label{display:grid;gap:6px;color:#b7aea5;font-size:10px}
      .restbr-recovery-fix-card input{
        width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.11);
        background:#050403;color:#fff;border-radius:11px;padding:12px;font:inherit;
        font-size:16px;outline:none;direction:ltr;text-align:left
      }
      .restbr-recovery-fix-card input:focus{border-color:rgba(216,169,88,.58)}
      #restbrRecoveryFixSave{border:0;border-radius:11px;background:#d8a958;color:#100b05;font:inherit;font-weight:900;padding:12px;cursor:pointer}
      #restbrRecoveryFixSave:disabled{opacity:.55;cursor:not-allowed}
      #restbrRecoveryFixCancel{border:1px solid rgba(255,255,255,.1);border-radius:11px;background:#17120e;color:#ddd;font:inherit;padding:10px;cursor:pointer}
      #restbrRecoveryFixStatus{min-height:19px;font-size:10px;line-height:1.6;text-align:center}
    `;
    document.head.appendChild(style);
  }

  function isRecoveryReturn() {
    const params = new URLSearchParams(window.location.search || '');
    const hash = window.location.hash || '';
    return params.get(RECOVERY_PARAM) === '1' || /type=recovery/i.test(hash) || /type=recovery/i.test(window.location.search || '');
  }

  function showRecoveryOverlay() {
    if (q('#restbrRecoveryFixOverlay')) return;
    installStyles();

    const overlay = document.createElement('div');
    overlay.id = 'restbrRecoveryFixOverlay';
    overlay.className = 'restbr-recovery-fix-overlay';
    overlay.innerHTML = `
      <div class="restbr-recovery-fix-card" dir="rtl">
        <h2>اختيار كلمة مرور جديدة</h2>
        <p>تم فتح رابط استعادة كلمة المرور. اختر كلمة مرور جديدة قبل الدخول إلى لوحة الإدارة.</p>
        <label>كلمة المرور الجديدة
          <input id="restbrRecoveryFixPassword" type="password" autocomplete="new-password" placeholder="8 أحرف أو أكثر">
        </label>
        <label>تأكيد كلمة المرور الجديدة
          <input id="restbrRecoveryFixConfirm" type="password" autocomplete="new-password" placeholder="أعد كتابة كلمة المرور">
        </label>
        <button id="restbrRecoveryFixSave" type="button">حفظ كلمة المرور الجديدة</button>
        <button id="restbrRecoveryFixCancel" type="button">إلغاء والعودة لتسجيل الدخول</button>
        <div id="restbrRecoveryFixStatus">جاري التحقق من رابط الاستعادة...</div>
      </div>
    `;
    document.body.appendChild(overlay);

    q('#restbrRecoveryFixSave')?.addEventListener('click', () => void savePassword());
    q('#restbrRecoveryFixCancel')?.addEventListener('click', () => void cancelRecovery());
    q('#restbrRecoveryFixConfirm')?.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      void savePassword();
    });

    setTimeout(() => q('#restbrRecoveryFixPassword')?.focus(), 60);
    waitForRecoverySession();
  }

  async function waitForRecoverySession() {
    for (let i = 0; i < 20; i++) {
      try {
        const { data:{ session } } = await supabaseClient.auth.getSession();
        if (session) {
          recoveryStatus('الرابط صالح ✓ اختر كلمة المرور الجديدة.', true);
          return true;
        }
      } catch (_) {}
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    recoveryStatus('تعذر تأكيد جلسة الاستعادة. اطلب رابط استعادة جديد.');
    return false;
  }

  async function savePassword() {
    const password = q('#restbrRecoveryFixPassword')?.value || '';
    const confirm = q('#restbrRecoveryFixConfirm')?.value || '';
    const btn = q('#restbrRecoveryFixSave');

    if (password.length < 8) {
      recoveryStatus('كلمة المرور لازم تكون 8 أحرف على الأقل.');
      return;
    }
    if (password !== confirm) {
      recoveryStatus('تأكيد كلمة المرور غير مطابق.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'جاري الحفظ...';
    recoveryStatus('جاري حفظ كلمة المرور الجديدة...');

    try {
      const { data:{ session }, error:sessionError } = await supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('Recovery session missing');

      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) throw error;

      recoveryStatus('تم تغيير كلمة المرور بنجاح ✓ جاري العودة لتسجيل الدخول...', true);
      await supabaseClient.auth.signOut();
      setTimeout(() => window.location.replace(cleanAdminUrl()), 700);
    } catch (error) {
      console.error('RESTBR PASSWORD RECOVERY FIX SAVE ERROR:', error);
      const raw = String(error?.message || error || '');
      let message = raw;
      if (/expired|invalid|missing|session|otp/i.test(raw)) message = 'رابط الاستعادة منتهي أو غير صالح. اطلب رابط جديد.';
      recoveryStatus('فشل تغيير كلمة المرور: ' + message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'حفظ كلمة المرور الجديدة';
    }
  }

  async function cancelRecovery() {
    try { await supabaseClient.auth.signOut(); } catch (_) {}
    window.location.replace(cleanAdminUrl());
  }

  function init() {
    if (isRecoveryReturn()) showRecoveryOverlay();

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (takeOverForgotControls() || attempts > 100) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
})();
