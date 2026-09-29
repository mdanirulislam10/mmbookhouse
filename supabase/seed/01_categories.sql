-- Starter category tree for mmbookhouse (safe to re-run). Edit later from Admin -> Categories.
insert into public.categories (slug, name, name_bn, sort_order, show_on_home) values
  ('wbcs-competitive',  'WBCS & Competitive Exams', 'ডব্লিউবিসিএস ও প্রতিযোগিতামূলক পরীক্ষা', 1, true),
  ('school-books',      'School Books',             'স্কুলের বই',                          2, true),
  ('college-semesters', 'College & University',     'কলেজ ও বিশ্ববিদ্যালয়',                  3, true),
  ('entrance-exams',    'Entrance (NEET / JEE)',    'প্রবেশিকা (NEET / JEE)',                4, true),
  ('novels-literature', 'Novels & Literature',      'উপন্যাস ও সাহিত্য',                     5, true),
  ('children',          'Children''s Books',        'শিশুদের বই',                           6, true),
  ('reference',         'Dictionaries & Reference', 'অভিধান ও রেফারেন্স',                   7, false)
on conflict (slug) do nothing;

insert into public.categories (slug, name, name_bn, parent_id, sort_order)
select v.slug, v.name, v.name_bn, p.id, v.ord
  from (values
    ('wbcs',            'WBCS',                 'ডব্লিউবিসিএস',           'wbcs-competitive', 1),
    ('railway-ssc',     'Railway & SSC',        'রেলওয়ে ও এসএসসি',        'wbcs-competitive', 2),
    ('primary-tet',     'Primary TET / SLST',   'প্রাইমারি টেট / এসএলএসটি', 'wbcs-competitive', 3),
    ('class-5-8',       'Class V – VIII',       'পঞ্চম – অষ্টম শ্রেণি',     'school-books',     1),
    ('madhyamik',       'Madhyamik (Class X)',  'মাধ্যমিক (দশম)',          'school-books',     2),
    ('higher-secondary','Higher Secondary (XI–XII)', 'উচ্চ মাধ্যমিক (একাদশ–দ্বাদশ)', 'school-books', 3),
    ('ba-bsc-bcom',     'B.A. / B.Sc. / B.Com.','বি.এ. / বি.এসসি. / বি.কম.', 'college-semesters', 1),
    ('ma-msc',          'M.A. / M.Sc.',         'এম.এ. / এম.এসসি.',        'college-semesters', 2)
  ) as v(slug, name, name_bn, parent, ord)
  join public.categories p on p.slug = v.parent
on conflict (slug) do nothing;
