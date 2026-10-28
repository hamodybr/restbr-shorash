import test from "node:test";
import assert from "node:assert/strict";
import { catalogView, validateSnapshot, discountFor, priceFor, scheduledAvailable } from "../src/catalog.mjs";

const fixtures = () => ({
  schema: 1,
  tables: {
    categories: [{ id: "c1", name_ar: "مشويات", name_en: "Grill", is_visible: true, is_active: true }],
    products: [
      { id: "p1", category_id: "c1", name_ar: "شاورما", name_en: "Shawarma", is_active: true, is_visible: true, is_available: true, service_mode: "both" },
      { id: "p2", category_id: "c1", name_ar: "صالة فقط", is_active: true, is_visible: true, service_mode: "dinein" },
      { id: "p3", category_id: "c1", name_ar: "سفري فقط", is_active: true, is_visible: true, service_mode: "takeaway" },
    ],
    product_options: [{ id: "o1", product_id: "p1", name_ar: "عادي", price: 5000, takeaway_price: 6000, is_active: true }],
    discounts: [{ id: "d1", scope_type: "restaurant", price_mode: "both", discount_percent: 10, is_active: true }],
  },
  images: {}, savedAt: "2026-10-29T00:00:00.000Z"
});

test("service modes filter correctly", () => {
  const snapshot = fixtures();
  assert.deepEqual(catalogView(snapshot, { mode: "dinein" })[0].products.map(x => x.id), ["p1", "p2"]);
  assert.deepEqual(catalogView(snapshot, { mode: "takeaway" })[0].products.map(x => x.id), ["p1", "p3"]);
});
test("prices account for selected service mode and discounts", () => {
  const snapshot = fixtures();
  assert.equal(catalogView(snapshot, { mode: "takeaway" })[0].products[0].options[0].price.current, 5400);
  assert.equal(catalogView(snapshot, { mode: "dinein" })[0].products[0].options[0].price.current, 4500);
});
test("more specific discount wins even if smaller", () => {
  const product = { id: "p1", category_id: "c1" };
  const rules = [
    { scope_type: "restaurant", price_mode: "both", discount_percent: 25 },
    { scope_type: "product", target_id: "p1", price_mode: "both", discount_percent: 5 }
  ];
  assert.equal(discountFor(product, rules, "dinein"), 5);
  assert.deepEqual(priceFor({ price: 2000, takeaway_price: 3000 }, "takeaway", 5), { original: 3000, current: 2850, discount: 5 });
});
test("invalid or empty catalog never replaces a valid snapshot", () => {
  assert.throws(() => validateSnapshot({ schema: 1, tables: { categories: [], products: [], product_options: [], discounts: [] } }), /Empty/);
});
test("time windows spanning midnight", () => {
  const row = { availability_schedule_enabled: true, available_from: "22:00:00", available_to: "02:00:00" };
  assert.equal(scheduledAvailable(row, new Date("2026-10-28T21:45:00Z")), true);
  assert.equal(scheduledAvailable(row, new Date("2026-10-28T11:45:00Z")), false);
});
