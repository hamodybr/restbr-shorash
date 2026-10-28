import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { createClient } from "@supabase/supabase-js";
import { catalogView, validateSnapshot, textFor } from "./catalog.mjs";

const PREFIX = "shorash-staff-v1";
const PER_PAGE = 500;
const SETTINGS = window.RESTBR_CONFIG || {};
const state = {
  snapshot: null,
  busy: false,
  lang: "ar",
  mode: "dinein",
  query: "",
  category: "",
  lastAttemptAt: 0,
  mediaCache: new Map()
};
const WORDS = {
  ar: { title: "منيو شورش", tagline: "خاص بالكرسون · عرض فقط", sync: "تحديث المنيو", syncing: "جاري التحديث...", ready: "محفوظ على الجهاز", offline: "بدون إنترنت", online: "متصل بالإنترنت", none: "لا توجد أصناف", unavailable: "غير متوفر حالياً", latest: "آخر تحديث ناجح", first: "شبّك الإنترنت واضغط تحديث المنيو لتحميل النسخة الأولى", error: "تعذر التحديث، بقيت النسخة السابقة محفوظة", dinein: "داخل المطعم", takeaway: "سفري", search: "ابحث عن صنف...", all: "الكل", popular: "الأكثر طلباً", new: "جديد", hot: "حار", offer: "عرض", noImage: "بدون صورة" },
  ku: { title: "مینیویا شورش", tagline: "تایبەت ب گارسۆنان · تەنێ پیشاندان", sync: "نووکرنا مینیو", syncing: "مینیو دهێتە نووکرن...", ready: "د ناڤ ئامێرێ دا پاراستیە", offline: "بێ ئینتەرنێت", online: "ئینتەرنێت هەیە", none: "هیچ بەرهەم نەهاتە دیتن", unavailable: "نە بەردەستە", latest: "دوماهیک نووکرن", first: "بۆ جارەکا ئێکێ ئینتەرنێتێ گرێبدە و مینیو نوو بکە", error: "نووکرن سەرنەکەفت؛ وەشانا بەری پاراستی مایە", dinein: "د ناڤ چێشتخانێ دا", takeaway: "بۆ دەرڤە", search: "لێگەریان بۆ خوارنێ...", all: "هەمی", popular: "زۆر هاتیه داخوازی", new: "نوو", hot: "گەرْم", offer: "ئۆفەر", noImage: "بێ وێنە" },
  en: { title: "SHORASH Menu", tagline: "Waiter edition · View only", sync: "Update menu", syncing: "Updating...", ready: "Saved on device", offline: "Offline", online: "Online", none: "No items found", unavailable: "Currently unavailable", latest: "Last successful update", first: "Connect to the internet and tap Update Menu to download the first copy", error: "Update failed. Previous saved version is still available", dinein: "Dine-in", takeaway: "Takeaway", search: "Search products...", all: "All", popular: "Popular", new: "New", hot: "Hot", offer: "Offer", noImage: "No image" }
};
const $ = id => document.getElementById(id);
const w = key => WORDS[state.lang][key] || WORDS.ar[key] || key;
const esc = value => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const money = value => Number(value).toLocaleString("en-US") + (state.lang === "en" ? " IQD" : " د.ع");
let supabase = null;

function connectionText() {
  return navigator.onLine ? w("online") : w("offline");
}

function status(message = "") {
  const saved = state.snapshot?.savedAt;
  $("connection").textContent = connectionText();
  $("connection").dataset.online = String(navigator.onLine);
  $("savedStatus").textContent = saved
    ? w("latest") + ": " + new Date(saved).toLocaleString("en-GB", { timeZone: "Asia/Baghdad", hour12: false })
    : w("first");
  $("message").textContent = message || (saved ? w("ready") : "");
  $("syncBtn").disabled = state.busy;
  $("syncBtn").textContent = state.busy ? w("syncing") : w("sync");
}
async function ensureDir() {
  await Filesystem.mkdir({ path: PREFIX + "/media", directory: Directory.Data, recursive: true });
}
async function loadFile(path) {
  const file = await Filesystem.readFile({ path, directory: Directory.Data, encoding: Encoding.UTF8 });
  return typeof file.data === "string" ? file.data : await file.data.text();
}
async function writeJson(path, data) {
  await Filesystem.writeFile({ path, directory: Directory.Data, encoding: Encoding.UTF8, recursive: true, data: JSON.stringify(data) });
}
async function loadLatest() {
  const candidates = [];
  for (const slot of ["a", "b"]) {
    try {
      const data = validateSnapshot(JSON.parse(await loadFile(PREFIX + "/snapshot-" + slot + ".json")));
      candidates.push({ slot, data });
    } catch (_) { /* File may not exist or an incomplete write is ignored. */ }
  }
  candidates.sort((a, b) => String(b.data.savedAt).localeCompare(String(a.data.savedAt)));
  if (candidates.length) {
    state.snapshot = candidates[0].data;
    state.snapshotSlot = candidates[0].slot;
    return true;
  }
  return false;
}
function projectClient() {
  if (supabase) return supabase;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(String(SETTINGS.supabaseUrl || ""))) throw new Error("Invalid restaurant URL");
  if (String(SETTINGS.supabasePublishableKey || "").length < 20) throw new Error("Missing publishable key");
  supabase = createClient(SETTINGS.supabaseUrl, SETTINGS.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { params: { eventsPerSecond: 1 } }
  });
  return supabase;
}
async function fetchPages(table) {
  const output = [];
  for (let page = 0; page < 100; page++) {
    const first = page * PER_PAGE;
    const { data, error } = await projectClient().from(table).select("*").order("id", { ascending: true }).range(first, first + PER_PAGE - 1);
    if (error) throw new Error(table + ": " + error.message);
    output.push(...(data || []));
    if (!data || data.length < PER_PAGE) return output;
  }
  throw new Error(table + " exceeds safe pagination limit");
}
async function fetchCatalog() {
  const [categories, products, product_options, discounts, setting] = await Promise.all([
    fetchPages("categories"),
    fetchPages("products"),
    fetchPages("product_options"),
    fetchPages("discounts"),
    projectClient().from("restaurant_settings").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle()
  ]);
  if (setting.error) throw new Error("restaurant_settings: " + setting.error.message);
  return { categories, products, product_options, discounts, restaurant_settings: setting.data || {} };
}
async function digest(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...hash].map(n => n.toString(16).padStart(2, "0")).join("");
}
async function imageBase64(response) {
  if (!response.ok) throw new Error("Image download HTTP " + response.status);
  const mime = response.headers.get("content-type") || "";
  if (!mime.startsWith("image/")) throw new Error("Invalid image format");
  const blob = await response.blob();
  if (blob.size > 12 * 1024 * 1024) throw new Error("Image too large");
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, 960 / bitmap.width, 960 / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78).split(",")[1];
  } finally {
    bitmap.close?.();
  }
}
async function storeImages(tables) {
  const images = {};
  const visibleCategories = new Set(tables.categories.filter(c => c.is_active !== false && c.is_visible !== false).map(c => String(c.id)));
  const products = tables.products.filter(p => p.is_active !== false && p.is_visible !== false && visibleCategories.has(String(p.category_id)) && p.image_url);
  let done = 0;
  for (const product of products) {
    const url = String(product.image_url || "").trim();
    if (!/^https:\/\//i.test(url)) continue;
    const key = (await digest(url + "|" + String(product.updated_at || ""))).slice(0, 32);
    const path = PREFIX + "/media/" + key + ".jpg";
    try {
      await Filesystem.stat({ path, directory: Directory.Data });
    } catch (_) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
        const data = await imageBase64(response);
        await Filesystem.writeFile({ path, directory: Directory.Data, data, recursive: true });
      } finally {
        clearTimeout(timeout);
      }
    }
    images[String(product.id)] = path;
    done++;
    if (done % 4 === 0 || done === products.length) status("Images: " + done + "/" + products.length);
  }
  return images;
}
async function syncMenu({ silent = false } = {}) {
  if (state.busy || !navigator.onLine) return;
  if (silent && Date.now() - state.lastAttemptAt < 60000) return;
  state.lastAttemptAt = Date.now();
  state.busy = true;
  status();
  try {
    const tables = await fetchCatalog();
    const candidate = validateSnapshot({ schema: 1, tables, images: {}, savedAt: new Date().toISOString() });
    if (state.snapshot && JSON.stringify(state.snapshot.tables) === JSON.stringify(tables)) {
      status(w("ready"));
      return;
    }
    candidate.images = await storeImages(tables);
    const nextSlot = state.snapshotSlot === "a" ? "b" : "a";
    const path = PREFIX + "/snapshot-" + nextSlot + ".json";
    await writeJson(path, candidate);
    validateSnapshot(JSON.parse(await loadFile(path)));
    state.snapshot = candidate;
    state.snapshotSlot = nextSlot;
    state.mediaCache.clear();
    render();
    status(w("ready"));
  } catch (error) {
    console.error("Shorash Staff update failed", error);
    status(w("error") + ": " + (error?.message || "unknown"));
  } finally {
    state.busy = false;
    status($("message").textContent);
  }
}
async function nativeImageUrl(path) {
  if (state.mediaCache.has(path)) return state.mediaCache.get(path);
  const promise = Filesystem.getUri({ path, directory: Directory.Data })
    .then(result => Capacitor.convertFileSrc(result.uri))
    .catch(() => "");
  state.mediaCache.set(path, promise);
  return promise;
}
function imageForCurrentCards() {
  document.querySelectorAll("img[data-local-image]").forEach(async img => {
    const path = img.dataset.localImage;
    if (!path) return;
    const source = await nativeImageUrl(path);
    if (img.isConnected && img.dataset.localImage === path && source) img.src = source;
  });
}
function render() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === "en" ? "ltr" : "rtl";
  document.title = w("title");
  $("heading").textContent = w("title");
  $("tagline").textContent = w("tagline");
  $("search").placeholder = w("search");
  $("modeDinein").textContent = w("dinein");
  $("modeTakeaway").textContent = w("takeaway");
  $("modeDinein").classList.toggle("selected", state.mode === "dinein");
  $("modeTakeaway").classList.toggle("selected", state.mode === "takeaway");
  document.querySelectorAll("[data-lang]").forEach(button => button.classList.toggle("selected", button.dataset.lang === state.lang));
  status();
  if (!state.snapshot) { $("categories").replaceChildren(); $("menu").textContent = w("first"); return; }
  const data = catalogView(state.snapshot, { lang: state.lang, mode: state.mode, query: state.query });
  if (!data.some(c => c.id === state.category)) state.category = data[0]?.id || "";
  $("categories").innerHTML = data.map(c => '<button type="button" class="cat ' + (String(c.id) === String(state.category) ? "selected" : "") + '" data-category="' + esc(c.id) + '">' + esc(c.name) + '<span>' + c.products.length + '</span></button>').join("");
  const chosen = state.query ? data : data.filter(c => String(c.id) === String(state.category));
  $("menu").innerHTML = chosen.map(category =>
    '<section class="section"><h2>' + esc(category.name) + '</h2><div class="cards">' +
    category.products.map(product => {
      const labels = Object.entries(product.badges).filter(([key,value]) => value).map(([key]) => '<span class="pill">' + esc(w(key)) + '</span>').join("");
      const options = product.options.map(option => {
        const amount = option.price ? money(option.price.current) : "—";
        const old = option.price && option.price.discount > 0 ? '<del>' + money(option.price.original) + '</del>' : '';
        return '<div class="option"><span>' + esc(option.name) + '</span><strong>' + old + esc(amount) + '</strong></div>';
      }).join("");
      const cover = product.imagePath
        ? '<img loading="lazy" alt="" data-local-image="' + esc(product.imagePath) + '">'
        : '<img loading="lazy" src="./assets/shorash-logo.jpeg" alt="">';
      return '<article class="card ' + (!product.available ? "unavailable" : "") + '">' +
        '<div class="card-image">' + cover + (!product.available ? '<span class="unavailable-label">' + esc(w("unavailable")) + '</span>' : '') + '</div>' +
        '<div class="card-info">' + '<div class="badges">' + labels + '</div><h3>' + esc(product.name) + '</h3>' +
        (product.description ? '<p>' + esc(product.description) + '</p>' : '') + '<div class="options">' + options + '</div></div></article>';
    }).join("") + '</div></section>'
  ).join("") || '<div class="empty">' + esc(w("none")) + '</div>';
  imageForCurrentCards();
}
function bind() {
  $("syncBtn").addEventListener("click", () => void syncMenu());
  $("modeDinein").addEventListener("click", () => { state.mode = "dinein"; render(); });
  $("modeTakeaway").addEventListener("click", () => { state.mode = "takeaway"; render(); });
  document.querySelectorAll("[data-lang]").forEach(button => button.addEventListener("click", () => { state.lang = button.dataset.lang; render(); }));
  $("search").addEventListener("input", event => { state.query = event.target.value || ""; render(); });
  $("categories").addEventListener("click", event => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    render();
  });
  window.addEventListener("online", () => { status(); void syncMenu({ silent: true }); });
  window.addEventListener("offline", () => status());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) void syncMenu({ silent: true });
  });
}
async function boot() {
  bind();
  render();
  if (!Capacitor.isNativePlatform()) {
    status("Requires an installed Android APK for reliable device storage");
    return;
  }
  try {
    await ensureDir();
    await loadLatest();
    render();
  } catch (error) {
    console.error("Device storage error", error);
    status("Device storage unavailable");
    return;
  }
  if (navigator.onLine) await syncMenu({ silent: true });
}
void boot();
