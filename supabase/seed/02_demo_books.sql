-- OPTIONAL demo catalogue for trying the shop. Every demo book has a slug starting with "demo-".
-- Remove them all later with:  delete from public.books where slug like 'demo-%';
-- Requires 01_categories.sql. Uses generated covers (no images), so it is safe to publish nowhere.
do $$
declare
  b uuid;
  r record;
  pub uuid;
begin
  insert into public.publishers (slug, name, name_bn) values
    ('demo-chhaya', 'Chhaya Prakashani (demo)', 'ছায়া প্রকাশনী (ডেমো)'),
    ('demo-oxford', 'Oxford University Press (demo)', 'অক্সফোর্ড (ডেমো)')
  on conflict (slug) do nothing;

  for r in select * from (values
    ('demo-wbcs-polity',    'WBCS Indian Polity Made Easy',   'ডব্লিউবিসিএস ভারতীয় সংবিধান সহজ পাঠ', 'en', 600, 450, 25, 'wbcs',       'demo-chhaya', 'M. Laxmikanth'),
    ('demo-wbcs-history',   'WBCS History Guide',             'ডব্লিউবিসিএস ইতিহাস গাইড',           'bn', 500, 400, 18, 'wbcs',       'demo-chhaya', 'S. Roy'),
    ('demo-railway-gk',     'Railway Group D General Knowledge','রেলওয়ে গ্রুপ ডি সাধারণ জ্ঞান',    'bn', 350, 280, 40, 'railway-ssc','demo-chhaya', 'P. Das'),
    ('demo-madhyamik-math', 'Madhyamik Ganit Prakash',        'মাধ্যমিক গণিত প্রকাশ',              'bn', 300, 255, 60, 'madhyamik',  'demo-chhaya', 'A. Sen'),
    ('demo-madhyamik-sci',  'Madhyamik Life Science',         'মাধ্যমিক জীবনবিজ্ঞান',              'bn', 320, 272, 35, 'madhyamik',  'demo-chhaya', 'D. Ghosh'),
    ('demo-hs-physics',     'Higher Secondary Physics Vol 1', 'উচ্চ মাধ্যমিক পদার্থবিজ্ঞান ১ম খণ্ড', 'en', 550, 470, 22, 'higher-secondary','demo-oxford','H. C. Verma'),
    ('demo-ba-english',     'B.A. English Honours Companion', 'বি.এ. ইংরেজি অনার্স সহায়িকা',        'en', 450, 380, 12, 'ba-bsc-bcom','demo-oxford', 'R. Mukherjee'),
    ('demo-neet-bio',       'NEET Biology Practice Set',      'NEET জীববিজ্ঞান প্র্যাকটিস সেট',     'en', 700, 560, 8,  'entrance-exams','demo-oxford','K. Basu'),
    ('demo-pather-panchali','Pather Panchali',                'পথের পাঁচালী',                       'bn', 250, 210, 30, 'novels-literature','demo-chhaya','Bibhutibhushan Bandyopadhyay'),
    ('demo-feluda',         'Feluda Samagra',                 'ফেলুদা সমগ্র',                       'bn', 800, 640, 3,  'novels-literature','demo-chhaya','Satyajit Ray'),
    ('demo-thakurmar-jhuli','Thakurmar Jhuli',                'ঠাকুরমার ঝুলি',                     'bn', 180, 150, 50, 'children',   'demo-chhaya', 'Dakshinaranjan Mitra Majumder'),
    ('demo-dictionary',     'Bengali to English Dictionary',  'বাংলা থেকে ইংরেজি অভিধান',           'bn', 400, 340, 0,  'reference',  'demo-oxford', 'Ashok Mukhopadhyay')
  ) as t(slug, title, title_bn, lang, mrp, price, stock, cat, pub, author)
  loop
    continue when exists (select 1 from public.books where slug = r.slug);
    select id into pub from public.publishers where slug = r.pub;
    insert into public.books (slug, title, title_bn, language, mrp, sale_price, status, publisher_id, description, is_featured, pages)
    values (r.slug, r.title, r.title_bn, r.lang, r.mrp, r.price, 'active', pub,
            'Demo listing — replace with a real book from the admin panel.', r.stock > 30, 300)
    returning id into b;
    update public.inventory set on_hand = r.stock where book_id = b;
    insert into public.book_categories select b, id from public.categories where slug = r.cat;
    declare a uuid;
    begin
      select id into a from public.authors where slug = 'demo-' || lower(regexp_replace(r.author, '[^a-zA-Z]+', '-', 'g'));
      if a is null then
        insert into public.authors (slug, name) values ('demo-' || lower(regexp_replace(r.author, '[^a-zA-Z]+', '-', 'g')), r.author) returning id into a;
      end if;
      insert into public.book_authors (book_id, author_id) values (b, a) on conflict do nothing;
    end;
    perform public.refresh_book_search(b);
  end loop;
end $$;
