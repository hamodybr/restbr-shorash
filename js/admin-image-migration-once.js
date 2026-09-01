(() => {
  'use strict';

  if (!/\/admin(?:\.html)?(?:$|[?#])/i.test(location.pathname + location.search + location.hash)) return;
  if (window.__RESTBR_IMAGE_MIGRATION_ONCE__) return;
  window.__RESTBR_IMAGE_MIGRATION_ONCE__ = true;

  const FUNCTION_NAME = 'migrate-menu-images';
  const BATCH_SIZE = 8;
  const MAX_ROUNDS = 30;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'className') node.className = value;
      else if (key === 'textContent') node.textContent = value;
      else node.setAttribute(key, value);
    });
    children.forEach((child) => node.appendChild(child));
    return node;
  }

  function installStyles() {
    if (document.getElementById('restbrImageMigrationStyles')) return;
    const style = document.createElement('style');
    style.id = 'restbrImageMigrationStyles';
    style.textContent = `
      #restbrImageMigrationPanel{position:fixed;z-index:2147483000;inset:auto 12px 12px 12px;max-width:560px;margin:auto;background:#15171b;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:14px;box-shadow:0 12px 44px rgba(0,0,0,.4);font-family:system-ui,-apple-system,sans-serif;direction:rtl}
      #restbrImageMigrationPanel .rim-title{font-weight:800;font-size:15px;margin-bottom:8px}
      #restbrImageMigrationPanel .rim-status{font-size:13px;line-height:1.7;white-space:pre-wrap;max-height:180px;overflow:auto;background:rgba(255,255,255,.06);border-radius:10px;padding:9px}
      #restbrImageMigrationPanel .rim-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      #restbrImageMigrationPanel button{appearance:none;border:0;border-radius:10px;padding:10px 13px;font-weight:800;cursor:pointer}
      #restbrImageMigrationPanel button:disabled{opacity:.5;cursor:not-allowed}
      #restbrImageMigrationPanel .rim-primary{background:#fff;color:#111}
      #restbrImageMigrationPanel .rim-secondary{background:rgba(255,255,255,.12);color:#fff}
      #restbrImageMigrationPanel .rim-close{margin-inline-start:auto;background:transparent;color:#bbb}
    `;
    document.head.appendChild(style);
  }

  async function waitForClient() {
    for (let i = 0; i < 240; i += 1) {
      try {
        if (typeof supabaseClient !== 'undefined' && supabaseClient?.functions?.invoke) {
          return supabaseClient;
        }
      } catch (_) {}
      await sleep(25);
    }
    throw new Error('Supabase client is not ready');
  }

  function buildPanel() {
    installStyles();
    const status = el('div', { className: 'rim-status', textContent: 'جاري فحص الصور الخارجية…' });
    const inspectButton = el('button', { className: 'rim-secondary', type: 'button', textContent: 'فحص فقط' });
    const migrateButton = el('button', { className: 'rim-primary', type: 'button', textContent: 'ترحيل الكل' });
    const closeButton = el('button', { className: 'rim-close', type: 'button', textContent: 'إغلاق' });
    const actions = el('div', { className: 'rim-actions' }, [inspectButton, migrateButton, closeButton]);
    const panel = el('div', { id: 'restbrImageMigrationPanel' }, [
      el('div', { className: 'rim-title', textContent: 'ترحيل صور SHORASH إلى Supabase Storage' }),
      status,
      actions,
    ]);
    document.body.appendChild(panel);
    return { panel, status, inspectButton, migrateButton, closeButton };
  }

  function messageFromInvokeError(error) {
    if (!error) return 'Unknown function error';
    return error.message || String(error);
  }

  async function invoke(client, body) {
    const { data, error } = await client.functions.invoke(FUNCTION_NAME, { body });
    if (error) throw new Error(messageFromInvokeError(error));
    if (!data?.ok) throw new Error(data?.error || 'Migration function returned an error');
    return data;
  }

  async function boot() {
    const ui = buildPanel();
    const client = await waitForClient();
    let busy = false;

    const setBusy = (value) => {
      busy = value;
      ui.inspectButton.disabled = value;
      ui.migrateButton.disabled = value;
      ui.closeButton.disabled = value;
    };

    const inspect = async () => {
      if (busy) return;
      setBusy(true);
      ui.status.textContent = 'جاري الفحص فقط — لن يتم تغيير أي رابط…';
      try {
        const data = await invoke(client, { dryRun: true, limit: BATCH_SIZE });
        const sample = Array.isArray(data.sample) ? data.sample : [];
        const names = sample.slice(0, 5).map((item) => `• ${item.name_ar || item.id}`).join('\n');
        ui.status.textContent = `الصور الخارجية المتبقية: ${data.external_remaining}\nحجم الدفعة: ${BATCH_SIZE}${names ? `\n\nعينة:\n${names}` : ''}`;
        ui.migrateButton.disabled = Number(data.external_remaining || 0) < 1;
      } catch (error) {
        ui.status.textContent = `فشل الفحص:\n${error?.message || error}`;
      } finally {
        busy = false;
        ui.inspectButton.disabled = false;
        ui.closeButton.disabled = false;
      }
    };

    const migrateAll = async () => {
      if (busy) return;
      if (!confirm('سيتم نسخ الصور الخارجية إلى Supabase وتحديث روابط المنتجات فقط بعد نجاح كل رفع. نبدأ؟')) return;

      setBusy(true);
      let totalMigrated = 0;
      try {
        for (let round = 1; round <= MAX_ROUNDS; round += 1) {
          ui.status.textContent = `الدفعة ${round}…\nتم ترحيل ${totalMigrated} صورة حتى الآن.`;
          const data = await invoke(client, { dryRun: false, limit: BATCH_SIZE });
          totalMigrated += Number(data.migrated || 0);

          if (Number(data.failed || 0) > 0 || Number(data.skipped || 0) > 0) {
            const problem = (data.results || []).find((item) => item.status !== 'migrated');
            throw new Error(
              `توقف آمن بعد ${totalMigrated} صورة.\n` +
              `${problem?.name_ar || problem?.id || 'صورة'}: ${problem?.error || problem?.reason || 'تعذر الترحيل'}`
            );
          }

          const remaining = Number(data.external_remaining_estimate || 0);
          ui.status.textContent = `تم ترحيل ${totalMigrated} صورة.\nالمتبقي التقريبي: ${remaining}`;
          if (remaining <= 0 || Number(data.requested || 0) === 0) {
            const finalCheck = await invoke(client, { dryRun: true, limit: BATCH_SIZE });
            const exactRemaining = Number(finalCheck.external_remaining || 0);
            if (exactRemaining === 0) {
              ui.status.textContent = `✅ اكتمل الترحيل.\nتم نقل ${totalMigrated} صورة بهذه العملية.\nالصور الخارجية المتبقية: 0`;
              return;
            }
          }

          await sleep(350);
        }
        throw new Error(`وصلنا للحد الآمن (${MAX_ROUNDS} دفعة) قبل اكتمال الترحيل.`);
      } catch (error) {
        ui.status.textContent = `⚠️ ${error?.message || error}\n\nلم يتم تغيير أي منتج فشل رفع صورته.`;
      } finally {
        busy = false;
        ui.inspectButton.disabled = false;
        ui.migrateButton.disabled = false;
        ui.closeButton.disabled = false;
      }
    };

    ui.inspectButton.addEventListener('click', inspect);
    ui.migrateButton.addEventListener('click', migrateAll);
    ui.closeButton.addEventListener('click', () => ui.panel.remove());

    await inspect();
  }

  boot().catch((error) => {
    console.warn('[RESTBR image migration runner]', error);
  });
})();
