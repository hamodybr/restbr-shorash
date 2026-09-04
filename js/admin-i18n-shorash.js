(() => {
  if (!/(?:^|\/)admin(?:\.html)?\/?$/i.test(location.pathname)) return;
  if (window.__RESTBR_SHORASH_ADMIN_I18N_V1__) return;
  window.__RESTBR_SHORASH_ADMIN_I18N_V1__ = true;

  const EXACT = new Map(Object.entries({
    'إغلاق':'Close',
    'رابط الاستعادة غير موثّق من Supabase. اطلب رابط استعادة جديد من شاشة الدخول.':'The recovery link could not be verified by Supabase. Request a new recovery link from the sign-in screen.',
    'هذا الحساب غير مخول للدخول إلى لوحة الإدارة.':'This account is not authorized to access the admin dashboard.',
    'تعذر التحقق من صلاحية حساب الإدارة. حاول تحديث الصفحة.':'Could not verify this admin account. Refresh the page and try again.',

    'تغيير البريد الإلكتروني':'Change Email Address',
    'البريد الحالي:':'Current email:',
    'البريد الإلكتروني الجديد':'New email address',
    'تأكيد البريد الإلكتروني الجديد':'Confirm new email address',
    'أعد كتابة البريد الجديد':'Re-enter the new email address',
    'كلمة المرور الحالية':'Current password',
    'طلب تغيير البريد الإلكتروني':'Request Email Change',
    'اكتب بريد إلكتروني جديد صحيح.':'Enter a valid new email address.',
    'تأكيد البريد الإلكتروني غير مطابق.':'The email confirmation does not match.',
    'اكتب كلمة المرور الحالية للتأكيد.':'Enter your current password to confirm.',
    'جاري إرسال الطلب...':'Sending request...',
    'Supabase Auth غير جاهز.':'Supabase Auth is not ready.',
    'لا توجد جلسة تسجيل دخول فعالة.':'There is no active sign-in session.',
    'البريد الجديد هو نفسه البريد الحالي.':'The new email is the same as the current email.',
    'تم تغيير البريد الإلكتروني بنجاح ✓':'Email address changed successfully ✓',
    'تم إرسال طلب تغيير البريد ✓ افتح رسائل التحقق المطلوبة في البريد القديم والجديد وأكمل التأكيد. بعد التأكيد استخدم البريد الجديد لتسجيل الدخول.':'Email change request sent ✓ Open the verification messages sent to the old and new email addresses and complete confirmation. After confirmation, use the new email to sign in.',
    'كلمة المرور الحالية غير صحيحة.':'The current password is incorrect.',
    'هذا البريد مستخدم في حساب آخر.':'This email address is already used by another account.',
    'البريد الإلكتروني الجديد غير صحيح.':'The new email address is invalid.',
    'تم إرسال طلبات كثيرة. انتظر قليلًا ثم حاول مرة ثانية.':'Too many requests were sent. Wait a little and try again.',
    'انتهت جلسة الدخول. سجل دخول من جديد ثم حاول.':'Your session has expired. Sign in again and retry.',

    'تغيير كلمة المرور':'Change Password',
    'إذا دخلت من رابط الاستعادة، استخدم شاشة الاستعادة التي تظهر تلقائياً.':'If you opened the dashboard from a recovery link, use the recovery screen that appears automatically.',
    'كلمة المرور الجديدة':'New password',
    'تأكيد كلمة المرور الجديدة':'Confirm new password',
    '8 أحرف أو أكثر':'8 characters or more',
    'أعد كتابة كلمة المرور':'Re-enter the password',
    'نسيت كلمة المرور؟':'Forgot your password?',
    'اكتب بريد حساب الإدارة، ونرسل لك رابط آمن لاختيار كلمة مرور جديدة.':'Enter the admin account email and we will send a secure link to choose a new password.',
    'إرسال رابط الاستعادة':'Send Recovery Link',
    'اكتب بريد إلكتروني صحيح.':'Enter a valid email address.',
    'جاري الإرسال...':'Sending...',
    'تم إرسال رابط الاستعادة ✓ افتح أحدث رسالة في بريدك واضغط الرابط.':'Recovery link sent ✓ Open the latest email in your inbox and tap the link.',
    'رابط الرجوع غير مسموح في إعدادات Supabase Auth.':'The return URL is not allowed in Supabase Auth settings.',
    'اختيار كلمة مرور جديدة':'Choose a New Password',
    'تم التحقق من رابط الاستعادة. اختر كلمة مرور جديدة لحساب الإدارة.':'The recovery link was verified. Choose a new password for the admin account.',
    'حفظ كلمة المرور الجديدة':'Save New Password',
    'إلغاء والعودة لتسجيل الدخول':'Cancel and Return to Sign In',
    'كلمة المرور لازم تكون 8 أحرف على الأقل.':'The password must be at least 8 characters.',
    'تأكيد كلمة المرور غير مطابق.':'The password confirmation does not match.',
    'رابط الاستعادة منتهي أو جلسة الاستعادة غير موجودة.':'The recovery link has expired or the recovery session is unavailable.',
    'تم تغيير كلمة المرور بنجاح ✓ جاري العودة لتسجيل الدخول...':'Password changed successfully ✓ Returning to sign in...',
    'رابط الاستعادة منتهي أو غير صالح. اطلب رابط جديد.':'The recovery link is expired or invalid. Request a new link.',
    'كلمة المرور الجديدة لا تطابق شروط الأمان.':'The new password does not meet the security requirements.',
    'اكتب كلمة المرور الحالية.':'Enter your current password.',
    'كلمة المرور الجديدة لازم تكون 8 أحرف على الأقل.':'The new password must be at least 8 characters.',
    'اختر كلمة مرور جديدة مختلفة عن الحالية.':'Choose a new password that is different from the current password.',
    'جاري التغيير...':'Changing...',
    'تم تغيير كلمة المرور بنجاح ✓':'Password changed successfully ✓'
  }));

  const originalText = new WeakMap();
  const translatedText = new WeakMap();
  const originalAttrs = new WeakMap();
  let observer = null;

  const isEnglish = () => document.documentElement.dataset.adminLang === 'en';

  function translate(value) {
    const raw = String(value ?? '');
    const trimmed = raw.trim();
    if (!trimmed) return raw;

    let translated = EXACT.get(trimmed) || trimmed;
    translated = translated
      .replace(/^فشل تغيير البريد الإلكتروني:\s*/u, 'Failed to change email address: ')
      .replace(/^فشل إرسال رابط الاستعادة:\s*/u, 'Failed to send recovery link: ')
      .replace(/^فشل تغيير كلمة المرور:\s*/u, 'Failed to change password: ')
      .replace(/^Failed تغيير البريد الإلكتروني:\s*/u, 'Failed to change email address: ')
      .replace(/^Failed إرسال رابط الاستعادة:\s*/u, 'Failed to send recovery link: ')
      .replace(/^Failed تغيير كلمة المرور:\s*/u, 'Failed to change password: ');

    if (translated === trimmed) return raw;
    const prefix = raw.match(/^\s*/u)?.[0] || '';
    const suffix = raw.match(/\s*$/u)?.[0] || '';
    return prefix + translated + suffix;
  }

  function applyText(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const parent = node.parentElement;
    if (!parent || ['SCRIPT','STYLE','TEXTAREA'].includes(parent.tagName)) return;

    const live = String(node.nodeValue ?? '');
    const last = translatedText.get(node);
    if (last === undefined || live !== last) originalText.set(node, live);
    const source = originalText.get(node) ?? live;

    if (isEnglish()) {
      const next = translate(source);
      translatedText.set(node, next);
      if (node.nodeValue !== next) node.nodeValue = next;
    } else {
      translatedText.delete(node);
    }
  }

  function applyAttrs(el) {
    if (!(el instanceof Element)) return;
    let cache = originalAttrs.get(el);
    if (!cache) {
      cache = {};
      originalAttrs.set(el, cache);
    }

    ['placeholder','title','aria-label'].forEach(attr => {
      if (!el.hasAttribute(attr)) return;
      const live = el.getAttribute(attr) || '';
      if (!(attr in cache) || !isEnglish()) cache[attr] = live;
      if (isEnglish()) {
        const next = translate(cache[attr]);
        if (next !== live) el.setAttribute(attr, next);
      }
    });

    if (el.classList.contains('restbr-recovery-card')) {
      el.setAttribute('dir', isEnglish() ? 'ltr' : 'rtl');
    }
  }

  function walk(root = document.body) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      applyText(root);
      return;
    }
    if (!(root instanceof Element) && root !== document) return;
    if (root instanceof Element) applyAttrs(root);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) applyText(node);
      else applyAttrs(node);
      node = walker.nextNode();
    }
  }

  function refresh() {
    requestAnimationFrame(() => walk(document.body));
  }

  function start() {
    refresh();
    document.addEventListener('restbr:admin-language-change', refresh);

    observer = new MutationObserver(() => {
      if (!isEnglish()) return;
      setTimeout(() => walk(document.body), 0);
    });
    observer.observe(document.body, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['placeholder','title','aria-label','dir'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
