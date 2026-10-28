export const LANGS = ["ar", "ku", "en"];
export const MODES = ["dinein", "takeaway"];

export function textFor(row, lang = "ar", prefix = "name") {
  if (!row) return "";
  for (const language of [lang, "ar", "ku", "en"]) {
    const value = row[prefix + "_" + language];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function sortRows(rows) {
  return [...rows].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || String(a.id).localeCompare(String(b.id)));
}

export function validateSnapshot(data) {
  if (!data || data.schema !== 1 || !data.tables) throw new Error("Invalid staff menu snapshot");
  for (const key of ["categories", "products", "product_options", "discounts"]) {
    if (!Array.isArray(data.tables[key])) throw new Error("Missing menu table: " + key);
  }
  if (!data.tables.categories.length || !data.tables.products.length) throw new Error("Empty catalog blocked");
  const visibleCategoryIds = new Set(data.tables.categories.filter(c => c.is_active !== false && c.is_visible !== false).map(c => String(c.id)));
  const visibleProducts = data.tables.products.filter(p => p.is_active !== false && p.is_visible !== false && visibleCategoryIds.has(String(p.category_id)));
  if (!visibleProducts.length) throw new Error("No visible products: refusing blank deployment");
  return data;
}

export function baghdadMinutes(now = new Date()) {
  const pieces = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Baghdad", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  return Number(pieces.find(p => p.type === "hour")?.value || 0) * 60 + Number(pieces.find(p => p.type === "minute")?.value || 0);
}

export function scheduledAvailable(row, now = new Date()) {
  if (!row || row.availability_schedule_enabled !== true) return true;
  const parse = value => {
    const match = String(value || "").match(/^([0-2]?\d):([0-5]\d)/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const from = parse(row.available_from);
  const to = parse(row.available_to);
  if (from === null || to === null || from === to) return true;
  const current = baghdadMinutes(now);
  return from < to ? current >= from && current < to : current >= from || current < to;
}

export function allowedServiceMode(row, mode) {
  const service = ["both", "dinein", "takeaway"].includes(row.service_mode) ? row.service_mode : "both";
  return service === "both" || service === mode;
}

export function discountFor(product, discounts, mode) {
  let rank = 0;
  let percent = 0;
  for (const row of discounts) {
    if (row.is_active === false || !["both", mode].includes(row.price_mode)) continue;
    const amount = Number(row.discount_percent);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100) continue;
    const nextRank = row.scope_type === "product" && String(row.target_id) === String(product.id) ? 3
      : row.scope_type === "category" && String(row.target_id) === String(product.category_id) ? 2
      : row.scope_type === "restaurant" ? 1 : 0;
    if (nextRank > rank || (nextRank === rank && amount > percent)) {
      rank = nextRank;
      percent = amount;
    }
  }
  return percent;
}

export function priceFor(option, mode, discount = 0) {
  const base = Number(mode === "takeaway" && option.takeaway_price != null ? option.takeaway_price : option.price);
  if (!Number.isFinite(base) || base < 0) return null;
  return { original: base, current: Math.max(0, Math.round(base * (100 - discount) / 100)), discount };
}

export function catalogView(snapshot, { lang = "ar", mode = "dinein", query = "", now = new Date() } = {}) {
  validateSnapshot(snapshot);
  const tables = snapshot.tables;
  const q = String(query).trim().toLocaleLowerCase();
  const categories = sortRows(tables.categories.filter(c => c.is_active !== false && c.is_visible !== false));
  const optionsByProduct = new Map();
  for (const row of sortRows(tables.product_options.filter(o => o.is_active !== false))) {
    const id = String(row.product_id);
    if (!optionsByProduct.has(id)) optionsByProduct.set(id, []);
    optionsByProduct.get(id).push(row);
  }
  const productsByCategory = new Map(categories.map(c => [String(c.id), []]));
  for (const product of sortRows(tables.products)) {
    if (product.is_active === false || product.is_visible === false || !allowedServiceMode(product, mode)) continue;
    if (!productsByCategory.has(String(product.category_id))) continue;
    const category = categories.find(c => String(c.id) === String(product.category_id));
    if (!category) continue;
    const names = ["ar", "ku", "en"].map(l => textFor(product, l)).join(" ").toLocaleLowerCase();
    if (q && !names.includes(q) && !["ar", "ku", "en"].map(l => textFor(category, l)).join(" ").toLocaleLowerCase().includes(q)) continue;
    const discount = discountFor(product, tables.discounts, mode);
    const options = (optionsByProduct.get(String(product.id)) || []).map(o => ({
      id: o.id,
      name: textFor(o, lang),
      available: o.is_available !== false,
      price: priceFor(o, mode, discount)
    }));
    const available = product.is_available !== false && scheduledAvailable(product, now) && scheduledAvailable(category, now);
    productsByCategory.get(String(category.id)).push({
      id: product.id,
      name: textFor(product, lang),
      description: textFor(product, lang, "description"),
      imagePath: snapshot.images?.[String(product.id)] || "",
      available,
      badges: { popular: product.is_popular === true, hot: product.is_hot === true, new: product.is_new === true, offer: product.is_offer === true },
      options,
      basePrice: options[0]?.price || null
    });
  }
  return categories.map(category => ({
    id: category.id,
    name: textFor(category, lang),
    products: productsByCategory.get(String(category.id)) || []
  })).filter(category => category.products.length);
}
