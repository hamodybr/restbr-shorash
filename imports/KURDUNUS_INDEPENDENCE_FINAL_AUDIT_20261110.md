# Shorash RESTBR — Kurdunus Independence Audit

**Date:** 2026-11-10 (Asia/Baghdad)  
**Production Supabase project:** `lwwiceogsuxiuorgvwod`  
**Public frontend:** https://hamodybr.github.io/restbr-shorash/  
**Owned asset repository:** https://github.com/hamodybr/-shorash-assets

## Result: zero active Kurdunus menu dependencies

The 16 remaining category images were copied from their existing Kurdunus image URLs into the Shorash-owned GitHub assets repository. GitHub Actions downloaded each file, verified it was a PNG/JPEG/WebP, then committed all 16 files to the public main branch via PR #4.

Immediately before the database update, a complete snapshot of menu data was written to the private table `restbr_internal.menu_import_backups` as **backup #3** (in addition to earlier backup #1 and #2).

Using a guarded transaction, precisely 16 visible category records were updated to use the Shorash-owned URLs. The script verified each existing URL and category ID/name before updating; it aborted transactionally if the row count differed.

**Direct SQL verification:** Zero records containing `kurdunus` in:
- `public.categories`
- `public.products`
- `public.product_options`
- `public.discounts`
- `public.restaurant_settings`
- `public.orders`
- `public.order_items`
- `public.menu_analytics_daily`

Public API smoke test via successful GitHub Actions workflow [read-only RESTBR catalog audit](https://github.com/hamodybr/restbr-shorash/actions/runs/42834426116) verified:
- **17** publicly readable visible categories, all 17 images on Shorash's GitHub assets
- **175** publicly readable products, **0** external Kurdunus image references
- **246** publicly readable options, **0** Kurdunus references
- All public category imagery links point to Shorash-owned images

Full database at migration time:
- **18** category rows total (17 visible, 1 hidden)
- **177** product rows total (175 visible, 2 hidden)
- **249** option rows total
- **2** discount rules unchanged
- Images: **129 product URLs** in **Supabase Storage**, **48 product URLs** in **Shorash-owned GitHub**, and **17 category URLs** in **Shorash-owned GitHub**. The 18th hidden category has no image.
- Restaurant logo in Supabase Storage; background video hosted by Shorash-owned GitHub

## Important technical distinction

**Independent of Kurdunus** does **not** mean every image was moved to Supabase Storage. A portion is now served from the restaurant's own GitHub asset repository and the rest directly from Supabase Storage. All product images and visible category images are hosted independently of Kurdunus. A separate storage-consolidation project may copy the GitHub assets to Supabase Storage using an authenticated Storage upload, when such access is available, without altering menu content.

Historical files and vendor source copies were not deleted. No prices, products, options, hidden items, discounts or configuration were changed during this final image-host migration.

## Links

- Archived category artwork PR: https://github.com/hamodybr/-shorash-assets/pull/4
- Reviewed guarded SQL: [shorash-final-kurdunus-category-urls-20261110.sql](shorash-final-kurdunus-category-urls-20261110.sql)
- Previous category reconciliation: [SHORASH_MENU_COMPARISON_2026-11-10.md](SHORASH_MENU_COMPARISON_2026-11-10.md)
- Frontend production repository: https://github.com/hamodybr/restbr-shorash
