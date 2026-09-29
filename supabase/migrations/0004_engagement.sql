-- 0004 Engagement: reviews, Q&A, banners, notifications, outbound message queue

-- --------------------------------------------------------------- reviews ---
create table public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  book_id            uuid not null references public.books(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  reviewer_name      text,
  rating             smallint not null check (rating between 1 and 5),
  title              text check (title is null or length(title) <= 120),
  body               text check (body is null or length(body) <= 4000),
  verified_purchase  boolean not null default false,
  status             text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  helpful_count      integer not null default 0 check (helpful_count >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (book_id, user_id)
);
create index idx_reviews_book on public.reviews (book_id, status, created_at desc);
create trigger trg_reviews_updated before update on public.reviews
  for each row execute function public.set_updated_at();

create table public.review_votes (
  review_id  uuid not null references public.reviews(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  primary key (review_id, user_id)
);

-- Customers can never choose their own status or "verified" flag; staff (service role) can.
create or replace function public.reviews_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    new.status := 'pending';
    new.helpful_count := case when tg_op = 'UPDATE' then old.helpful_count else 0 end;
    new.verified_purchase := exists (
      select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
       where o.user_id = new.user_id and oi.book_id = new.book_id and o.status = 'delivered');
    if new.reviewer_name is null then
      select coalesce(nullif(split_part(full_name, ' ', 1), ''), 'Reader') into new.reviewer_name
        from public.profiles where id = new.user_id;
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.reviews_guard() from public, anon, authenticated;
create trigger trg_reviews_guard before insert or update on public.reviews
  for each row execute function public.reviews_guard();

create or replace function public.reviews_rollup() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  b uuid := coalesce(new.book_id, old.book_id);
begin
  update public.books set
    rating_count = (select count(*) from public.reviews where book_id = b and status = 'published'),
    rating_avg   = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where book_id = b and status = 'published'), 0)
   where id = b;
  return null;
end $$;
revoke execute on function public.reviews_rollup() from public, anon, authenticated;
create trigger trg_reviews_rollup after insert or update or delete on public.reviews
  for each row execute function public.reviews_rollup();

create or replace function public.review_votes_rollup() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r uuid := coalesce(new.review_id, old.review_id);
begin
  update public.reviews set helpful_count = (select count(*) from public.review_votes where review_id = r) where id = r;
  return null;
end $$;
revoke execute on function public.review_votes_rollup() from public, anon, authenticated;
create trigger trg_review_votes_rollup after insert or delete on public.review_votes
  for each row execute function public.review_votes_rollup();

alter table public.reviews      enable row level security;
alter table public.review_votes enable row level security;
create policy reviews_read on public.reviews for select to anon, authenticated
  using (status = 'published' or user_id = auth.uid());
create policy reviews_insert_own on public.reviews for insert to authenticated with check (user_id = auth.uid());
create policy reviews_update_own on public.reviews for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reviews_delete_own on public.reviews for delete to authenticated using (user_id = auth.uid());
create policy review_votes_own on public.review_votes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------------- Q&A ---
create table public.book_questions (
  id           uuid primary key default gen_random_uuid(),
  book_id      uuid not null references public.books(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  asker_name   text,
  question     text not null check (length(btrim(question)) between 5 and 1000),
  answer       text,
  answered_at  timestamptz,
  status       text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at   timestamptz not null default now()
);
create index idx_questions_book on public.book_questions (book_id, status, created_at desc);

create or replace function public.questions_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    new.status := 'pending';
    new.answer := case when tg_op = 'UPDATE' then old.answer else null end;
    new.answered_at := case when tg_op = 'UPDATE' then old.answered_at else null end;
    if new.asker_name is null then
      select coalesce(nullif(split_part(full_name, ' ', 1), ''), 'Reader') into new.asker_name
        from public.profiles where id = new.user_id;
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.questions_guard() from public, anon, authenticated;
create trigger trg_questions_guard before insert or update on public.book_questions
  for each row execute function public.questions_guard();

alter table public.book_questions enable row level security;
create policy questions_read on public.book_questions for select to anon, authenticated
  using (status = 'published' or user_id = auth.uid());
create policy questions_insert_own on public.book_questions for insert to authenticated with check (user_id = auth.uid());

-- --------------------------------------------------------------- banners ---
create table public.banners (
  id                uuid primary key default gen_random_uuid(),
  placement         text not null default 'hero' check (placement in ('hero', 'strip')),
  title             text not null,
  title_bn          text,
  subtitle          text,
  subtitle_bn       text,
  image_url         text,
  mobile_image_url  text,
  link_url          text,
  cta_label         text,
  cta_label_bn      text,
  bg_color          text check (bg_color is null or bg_color ~ '^#[0-9a-fA-F]{6}$'),
  sort_order        integer not null default 0,
  starts_at         timestamptz,
  ends_at           timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index idx_banners_active on public.banners (placement, sort_order) where is_active;
alter table public.banners enable row level security;
create policy banners_read on public.banners for select to anon, authenticated
  using (is_active and (starts_at is null or now() >= starts_at) and (ends_at is null or now() < ends_at));

-- --------------------------------------------------------- notifications ---
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_notifications_user on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy notifications_select_own on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Outbound messages (email now; SMS / WhatsApp once a provider key exists).
create table public.outbox (
  id          uuid primary key default gen_random_uuid(),
  channel     text not null check (channel in ('email', 'sms', 'whatsapp')),
  recipient   text not null,
  template    text not null,
  payload     jsonb not null default '{}'::jsonb,
  status      text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  attempts    integer not null default 0,
  last_error  text,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
create index idx_outbox_queue on public.outbox (created_at) where status = 'queued';
alter table public.outbox enable row level security;   -- service role only

-- ------------------------------------------------------------- enquiries ---
-- Bulk / institutional order requests from the public form (written by the server only).
create table public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'bulk' check (kind in ('bulk', 'support')),
  org         text,
  contact     text not null,
  phone       text not null,
  email       text,
  message     text not null,
  status      text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  handled_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index idx_enquiries_status on public.enquiries (status, created_at desc);
alter table public.enquiries enable row level security;   -- service role only
