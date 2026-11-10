-- SHORASH / Kurdunus price sync — REVIEW ONLY, NOT EXECUTED
-- Based on a live public RESTBR read and Kurdunus public catalog snapshot, 2026-11-10.
-- Destination Supabase project ref: lwwiceogsuxiuorgvwod
-- Run in that project's SQL Editor ONLY after reviewing a database backup.
-- Guarded transaction: will stop if rows/prices differ from the recorded baseline.
-- Changes only two existing product prices; does NOT migrate images, categories or new products.
-- Takeaway_price is changed only when it still equals the previous base price.
begin;
set local lock_timeout = '5s';

do $sync$
declare
  updated_product integer;
  updated_option integer;
begin
  -- CHICKEN BOX: 4,000 -> 5,000 IQD
  if not exists (
    select 1 from public.products
    where id = '9e68d1f9-5a51-5bf1-af6a-986d2f9ab38a'
      and name_ar = 'بوكس شاورما' and base_price = 4000
  ) then
    raise exception 'Chicken Box changed since audit: aborting whole transaction';
  end if;
  update public.product_options
  set price = 5000,
      takeaway_price = case when takeaway_price = 4000 then 5000 else takeaway_price end,
      updated_at = now()
  where id = '6c796fea-29c8-58da-b8e7-606f567277b4'
    and product_id = '9e68d1f9-5a51-5bf1-af6a-986d2f9ab38a'
    and price = 4000;
  get diagnostics updated_option = row_count;
  if updated_option <> 1 then
    raise exception 'Chicken Box option mismatch: aborting whole transaction';
  end if;
  update public.products set base_price = 5000, updated_at = now()
  where id = '9e68d1f9-5a51-5bf1-af6a-986d2f9ab38a' and base_price = 4000;
  get diagnostics updated_product = row_count;
  if updated_product <> 1 then
    raise exception 'Chicken Box product mismatch: aborting whole transaction';
  end if;

  -- BANANA MILK COCKTAIL: 6,000 -> 5,000 IQD
  -- Source item moved to the "Juice" category in Kurdunus; preserve its current RESTBR category.
  if not exists (
    select 1 from public.products
    where id = 'b629ed6d-287a-5dab-811b-5c412a7f1287'
      and name_ar = 'كوكتيل موز حليب' and base_price = 6000
  ) then
    raise exception 'Banana Milk Cocktail changed since audit: aborting whole transaction';
  end if;
  update public.product_options
  set price = 5000,
      takeaway_price = case when takeaway_price = 6000 then 5000 else takeaway_price end,
      updated_at = now()
  where id = '5ddf261f-dd37-56c1-81c6-75b149b91363'
    and product_id = 'b629ed6d-287a-5dab-811b-5c412a7f1287'
    and price = 6000;
  get diagnostics updated_option = row_count;
  if updated_option <> 1 then
    raise exception 'Banana Milk Cocktail option mismatch: aborting whole transaction';
  end if;
  update public.products set base_price = 5000, updated_at = now()
  where id = 'b629ed6d-287a-5dab-811b-5c412a7f1287' and base_price = 6000;
  get diagnostics updated_product = row_count;
  if updated_product <> 1 then
    raise exception 'Banana Milk Cocktail product mismatch: aborting whole transaction';
  end if;
end
$sync$;
commit;

-- Verification (read-only):
select p.name_ar, p.base_price, o.name_ar as variant, o.price, o.takeaway_price
from public.products p
join public.product_options o on o.product_id = p.id
where p.id in (
  '9e68d1f9-5a51-5bf1-af6a-986d2f9ab38a',
  'b629ed6d-287a-5dab-811b-5c412a7f1287'
)
order by p.name_ar, o.sort_order;
