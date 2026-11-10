-- Shorash active menu image independence; read-only source mapping verified 2026-11-10.
-- Backup restbr_internal.menu_import_backups #3 was taken immediately before this operation.
-- Rollback-safe: update exactly 16 existing category image URLs, nothing else.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '35s';
do $shorash_media$
declare affected integer;
begin
  if not exists(
    select 1 from restbr_internal.menu_import_backups
    where id=3 and jsonb_array_length(snapshot->'categories')=18
      and jsonb_array_length(snapshot->'products')=177
      and jsonb_array_length(snapshot->'product_options')=249
  ) then
    raise exception 'Backup #3 missing or unexpected: refusing media migration';
  end if;
  with expected as (
    select * from jsonb_to_recordset($media_ref$[{"id":"38e54479-3c69-5c25-8019-5eeddd3c7b02","name":"فطور صباحي","old_url":"https://catalog.kurdunus.com/Public/53450a37-83ed-4924-9dd0-8cfa88e3dc45.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/38e54479-3c69-5c25-8019-5eeddd3c7b02.png"},{"id":"096f82b5-a0ab-56fd-8d83-0ae0f2c2e973","name":"منسف","old_url":"https://catalog.kurdunus.com/Public/a493898a-61c6-4e76-a045-400f54380cbf.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/096f82b5-a0ab-56fd-8d83-0ae0f2c2e973.png"},{"id":"1ca203af-1e4d-5c8b-9a52-6a5af75e9e23","name":"لأطباق الشرقيه","old_url":"https://catalog.kurdunus.com/Public/14a27792-1ade-4eca-b903-8e75f471f405.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/1ca203af-1e4d-5c8b-9a52-6a5af75e9e23.png"},{"id":"d81580be-2e93-5298-9f95-799d320f04c8","name":"مشاوي","old_url":"https://catalog.kurdunus.com/Public/bbfd6df9-e710-4cee-bebc-fd9cf74a42fd.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/d81580be-2e93-5298-9f95-799d320f04c8.png"},{"id":"b4860e89-039b-542e-b2ce-4947be341e12","name":"قلية","old_url":"https://catalog.kurdunus.com/Public/e35103fe-3c77-4ea7-bd91-ad5ad9fc7003.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/b4860e89-039b-542e-b2ce-4947be341e12.png"},{"id":"87479e28-bcac-5426-845a-1f51e6afd37b","name":"الوجبات الغربي","old_url":"https://catalog.kurdunus.com/Public/e801d494-3b76-4e7c-af95-73baad17fa5b.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/87479e28-bcac-5426-845a-1f51e6afd37b.png"},{"id":"71d0cb5d-cf5c-5a3e-a2d8-de16b8ca09b8","name":"بركر","old_url":"https://catalog.kurdunus.com/Public/8eafe11a-184b-4003-8177-ca94ec296c6e.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/71d0cb5d-cf5c-5a3e-a2d8-de16b8ca09b8.png"},{"id":"5e8a32ae-a591-5e00-bf05-a868ac47b243","name":"بيتزا","old_url":"https://catalog.kurdunus.com/Public/c609590d-8ef9-478c-a41d-2d937b82f133.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/5e8a32ae-a591-5e00-bf05-a868ac47b243.png"},{"id":"aa57aed7-6744-509c-9573-582c431a5b74","name":"السندويشات","old_url":"https://catalog.kurdunus.com/Public/448f73dd-ec72-4f84-9e64-b590928d72b7.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/aa57aed7-6744-509c-9573-582c431a5b74.png"},{"id":"0e6fa72e-d50d-579f-bb99-076ace5d8088","name":"مشروبات بارده","old_url":"https://catalog.kurdunus.com/Public/385ea9c0-339d-4089-95b1-2d2aca0aed6c.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/0e6fa72e-d50d-579f-bb99-076ace5d8088.png"},{"id":"6e1a6610-e762-51f7-86a3-8772e202c503","name":"القهوة","old_url":"https://catalog.kurdunus.com/Public/a78bd3d1-87e2-4423-bbbd-44714ea644b2.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/6e1a6610-e762-51f7-86a3-8772e202c503.png"},{"id":"dfd0c087-060a-58b1-aade-4a089ec9ad9b","name":"القهوة الباردة","old_url":"https://catalog.kurdunus.com/Public/8adee767-5549-49c4-90dc-6dbc51b20ed3.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/dfd0c087-060a-58b1-aade-4a089ec9ad9b.png"},{"id":"0ebf1323-6d8e-5f1b-b2f3-4fe8f5dc201b","name":"موهيتو","old_url":"https://catalog.kurdunus.com/Public/e1951922-aeba-40ce-b77b-3406662bd6f1.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/0ebf1323-6d8e-5f1b-b2f3-4fe8f5dc201b.png"},{"id":"7aa1fe72-90ba-5021-9389-418cf778b1c0","name":"سموذي","old_url":"https://catalog.kurdunus.com/Public/9bdb651f-7c46-4070-b208-76bccbef3b5f.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/7aa1fe72-90ba-5021-9389-418cf778b1c0.png"},{"id":"7ff4c143-149a-5874-994a-f9a71f692dc1","name":"ميلك شيك","old_url":"https://catalog.kurdunus.com/Public/9b4da6ba-ff68-4d86-8dfa-f933b96af756.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/7ff4c143-149a-5874-994a-f9a71f692dc1.png"},{"id":"a9cdec9e-d4c5-510f-b8d9-7af8b0c41df7","name":"حلويات","old_url":"https://catalog.kurdunus.com/Public/3f9c01b6-5362-43a1-847d-274db52f73c7.png","new_url":"https://raw.githubusercontent.com/hamodybr/-shorash-assets/main/restbr-2026-11-10/categories/a9cdec9e-d4c5-510f-b8d9-7af8b0c41df7.png"}]$media_ref$::jsonb)
      as item (id uuid,name text,old_url text,new_url text)
  )
  update public.categories as c
    set image_url=e.new_url, updated_at=now()
  from expected e
  where c.id=e.id and c.image_url=e.old_url
    and c.name_ar=e.name and c.is_active=true and c.is_visible=true;
  get diagnostics affected = row_count;
  if affected <> 16 then
     raise exception 'Expected 16 URLs to change, changed %. Rollback',affected;
  end if;
end
$shorash_media$;
commit;
select (select count(*) from public.categories where image_url ilike '%catalog.kurdunus.com%') as category_kurdunus_links,
       (select count(*) from public.products where image_url ilike '%catalog.kurdunus.com%') as product_kurdunus_links,
       (select count(*) from public.categories) as categories_total,
       (select count(*) from public.products) as products_total,
       (select count(*) from public.product_options) as options_total;