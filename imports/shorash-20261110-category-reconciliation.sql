-- Shorash RESTBR reconciliation against Kurdunus API (2026-11-10)
-- FULL BACKUP: restbr_internal.menu_import_backups id=2; reviewed 20 unique mappings.
-- Only 20 category moves, 1 archival, Pancakes image, and two option changes.
-- No hard deletion; no edits to orders/discounts/restaurant settings.
-- Exact state assertions guarantee full rollback if data changed since review.
begin;
set local lock_timeout='5s';
set local statement_timeout='45s';
do $shorash$
declare n integer;
begin
 if not exists (select 1 from restbr_internal.menu_import_backups where id=2
  and jsonb_array_length(snapshot->'products')=177
  and jsonb_array_length(snapshot->'categories')=17
  and jsonb_array_length(snapshot->'product_options')=247) then
   raise exception 'Pre-reconciliation backup #2 missing or mismatched';
 end if;
 if (select count(*) from public.products)<>177
 or (select count(*) from public.categories)<>17
 or (select count(*) from public.product_options)<>247 then
   raise exception 'Live catalog counts changed since backup #2';
 end if;

 -- This category currently exists only in Kurdunus. The photo is copied to our own GitHub assets.
 insert into public.categories (id,name_ar,name_ku,name_en,slug,image_url,sort_order,is_active,is_visible)
 values (md5('restbr-shorash-juice-category-20261110')::uuid,'العصائر','شەربەت','Juice','legacy-ve7rkl2r3k',
 'https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/category-ve7rkL2R3k.png',17,true,true);
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Juice category insert mismatch';end if;

 -- All these products were moved by the restaurant from "Cold drinks" to "Juice".
 update public.products set category_id=md5('restbr-shorash-juice-category-20261110')::uuid,updated_at=now()
 where id=any(array[
 'b629ed6d-287a-5dab-811b-5c412a7f1287',
 '7483296e-569e-5775-a6f8-ecad2331f6df',
 '02bd03fa-89ca-5081-919f-eec3c63d9657',
 '054ec11d-0176-56a9-a6c5-6fd19364038a',
 'd08aec9e-f2dc-5cd4-9c99-8275863d30f9',
 '56e3f8ec-169c-542c-a448-17ba3ee06050',
 '9fb5a90f-2deb-55f2-ae88-305043c96620',
 'bf6a597e-7a8d-5a44-8531-151448d9a7a0',
 '76efe852-5e15-5995-b0c4-cd6a1e4a8206',
 '42c68f30-b065-52df-bcb2-f822ea8dbf1e',
 '51070978-76ab-5859-9d98-dd3a1ee0f18d',
 '69d571f4-81cc-5273-9c72-0b9455a52dd9',
 '8e45cb38-c0d8-5700-b2a1-d20a2864f46d',
 '0db6017f-d797-5921-8d72-ef86dbf2d734',
 '1a71ac4b-1ea4-5547-b795-b7cd02dcdcf8',
 'b38ac575-16ce-5538-ba12-274cfb0beb7e',
 '57901788-cbc8-5b6e-9a06-1e2fe96104c0',
 'f38f009c-bf32-5696-bc37-1ccff228cd0f',
 '4882f6b1-0215-50ed-8683-a4174bd9ca56',
 'ac84ffe3-30f7-590a-94ef-93d0104426e6']::uuid[])
 and category_id='0e6fa72e-d50d-579f-bb99-076ace5d8088'
 and is_active=true and is_visible=true;
 get diagnostics n=row_count;
 if n<>20 then raise exception 'Expected 20 products moved; got %',n;end if;

 -- Archived, NOT deleted: no longer present anywhere in Kurdunus source.
 update public.products set is_active=false,is_visible=false,is_available=false,updated_at=now()
 where id='fc4014a9-c8fd-5a18-881e-603544f6e6ff'
 and name_ar='أيس كراميل لاتيه' and name_en='Iced Caramel Latte'
 and category_id='dfd0c087-060a-58b1-aade-4a089ec9ad9b'
 and is_active=true and is_visible=true;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Deleted-from-source item mismatch';end if;

 -- Pancakes: owner explicitly requests newest Kurdunus photo instead of preserved custom upload.
 update public.products set image_url=
  'https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/ogDRJp8dM5.jpg',
  updated_at=now()
 where id='eab612ae-e58c-5aa2-9a65-276879b29e68'
 and image_url='https://lwwiceogsuxiuorgvwod.supabase.co/storage/v1/object/public/menu-images/products/eab612ae-e58c-5aa2-9a65-276879b29e68/1788239688966-pqehpw.png';
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Pancakes custom image changed since backup';end if;

 -- Source Latte now has 3 flavors instead of 4. Keep existing option for history but hide it.
 update public.product_options set is_active=false,is_available=false,updated_at=now()
 where id='ec8c6cd4-8e5d-59e3-a0e9-d318fd36b1b6'
 and product_id='7c4a5a9a-e1f7-55bd-8d31-ea1097959e2f'
 and name_en='Spanish Latte' and price=4000 and is_active=true;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Latte Spanish option differs from expected';end if;

 -- Source Iced Latte has plain, caramel and vanilla, all 5,000 IQD.
 update public.product_options
 set name_ar='ساده',name_ku='ساده',name_en='Iced Latte',updated_at=now()
 where id='3924919b-78b4-524b-a59d-76beacc0976b'
 and product_id='9541222f-952b-5b89-a51c-b542fdc2808d'
 and name_ar='أيس لاتيه' and price=5000 and takeaway_price=5000
 and sort_order=1 and is_active=true;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Iced Latte plain variant differs from expected';end if;

 insert into public.product_options
 (id,product_id,name_ar,name_ku,name_en,price,takeaway_price,sort_order,is_active,is_available)
 values
 (md5('restbr-kurdunus-20261110-iced-latte-caramel')::uuid,
  '9541222f-952b-5b89-a51c-b542fdc2808d','كرميل','کەرەمێل','Caramel',5000,5000,2,true,true),
 (md5('restbr-kurdunus-20261110-iced-latte-vanilla')::uuid,
  '9541222f-952b-5b89-a51c-b542fdc2808d','ڤانيلا','ڤانێلا','Vanilla',5000,5000,3,true,true);
 get diagnostics n=row_count;
 if n<>2 then raise exception 'New Iced Latte option count mismatch';end if;
end
$shorash$;
commit;

-- Post-update checks:
select (select count(*) from public.categories) categories,
 (select count(*) from public.categories where is_visible and is_active) visible_categories,
 (select count(*) from public.products) products,
 (select count(*) from public.product_options) options,
 (select count(*) from public.discounts) discounts,
 (select count(*) from public.products where category_id=md5('restbr-shorash-juice-category-20261110')::uuid) juice_products,
 (select count(*) from public.products where category_id='0e6fa72e-d50d-579f-bb99-076ace5d8088' and is_visible and is_active) cold_drinks_products;