# mmbookhouse — পুনর্নির্মাণ পরিকল্পনা (Rebuild Plan v2)

তারিখ: ২০২৬-০৯-২৯ · ব্রাঞ্চ: `rebuild-v2` · পুরোনো কোডের ব্যাকআপ: `C:\sabir\mmbookhouse_OLD_backup_2026-09-29`

## ১. বর্তমান অবস্থার নিরীক্ষা (ব্রাউজার থেকে দেখা)

| জায়গা | যা পাওয়া গেছে | করণীয় |
| :-- | :-- | :-- |
| **Live সাইট** `mmbookhouse.vercel.app` | চলছে, কিন্তু হোমপেজে ডেভেলপার-নোট দেখা যায় ("মডিউল ৪: ব্যানার…কাজ ১-৫", "৫/৫ কাজ প্রস্তুত") | নতুন সাইটে কোনো ডেভ-লেবেল থাকবে না |
| **Vercel env** (শুধু Production) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PANEL_PASSWORD`, `ADMIN_SESSION_SECRET`, `GITHUB_BACKUP_*` (৪টি) | **নেই:** `NEXT_PUBLIC_SITE_URL`, `ADMIN_OWNER_EMAILS`, Preview/Development env, পেমেন্ট/SMS কী (পরে) |
| **GitHub secrets** | `BACKUP_ENCRYPTION_KEY`, `GOOGLE_DRIVE_*` (৩টি), `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY` | ব্যাকআপ পাইপলাইন ঠিক আছে — রাখা হবে; `SUPABASE_DB_URL` দিয়েই আমরা migration চালাব |
| **Supabase** `kdtozonoecjnvsrdmxdr` | পুরোনো ৩০+ টেবিল (books, orders, hero_banners, audit_logs, backup_jobs…) | পুরো `public` স্কিমা রিসেট → নতুন স্কিমা (ধাপ ১) |

## ২. মূল সিদ্ধান্ত (আপনার উত্তর অনুযায়ী)

1. **ডাটাবেস:** পুরো `public` স্কিমা রিসেট। আমি `supabase/reset_public_schema.sql` লিখব; **ব্রাউজার থেকে আমি ডেটা মুছব না** — আপনি Supabase SQL Editor-এ নিজে চালাবেন।
2. **ধাপে ধাপে:** নিচের ৮টি ধাপ, প্রতিটি শেষে build/type-check/টেস্ট পাস করিয়ে তবে পরেরটিতে যাব।
3. **লগইন:** ইমেইল+পাসওয়ার্ড, ইমেইল OTP, Google — এখনই। মোবাইল OTP: SMS API পেলে যোগ হবে (কোডে প্রোভাইডার-ইন্টারফেস আগেই রাখা থাকবে)।
4. **নিরাপত্তা:** পুরোনো কোড `main`-এ অক্ষত থাকে; নতুন কাজ `rebuild-v2`-এ। আপনি বলার আগে `main`-এ মার্জ বা push হবে না, তাই লাইভ সাইট এর মধ্যে ভাঙবে না।

## ৩. প্রযুক্তি স্ট্যাক (অপরিবর্তিত, পরিষ্কারভাবে ব্যবহার)

Next.js 15 (App Router, Server Components + Server Actions) · React 19 · TypeScript strict · Tailwind 3.4 · Supabase (Postgres + Auth + RLS + Storage) · Zod · lucide-react · Zustand শুধু ছোট ক্লায়েন্ট-স্টেটে।
**স্থানীয় SQL টেস্ট:** PGlite (in-memory Postgres, `pg_trgm` সহ) — লাইভ ডাটাবেসে না গিয়েই migration যাচাই।

## ৪. নতুন কোড-কাঠামো

```
src/
  app/
    (shop)/            হোম, ক্যাটালগ, সার্চ, বই, কার্ট, চেকআউট, অ্যাকাউন্ট, অর্ডার
    admin/             লগইন + ড্যাশবোর্ড, বই, স্টক, অর্ডার, কুপন, ব্যানার, সেটিংস, রিপোর্ট
    api/               শুধু যেখানে Server Action চলে না (সার্চ, ওয়েবহুক, হেলথ)
  components/          ui/ (Button, Input…) · shop/ · admin/
  lib/
    supabase/          browser, server, admin(service-role) ক্লায়েন্ট
    auth/              সেশন, ভূমিকা, গার্ড
    db/                টাইপ ও কোয়েরি ফাংশন (ডোমেইন-ভিত্তিক)
    i18n/              bn/en ডিকশনারি
    validation/        Zod স্কিমা
supabase/
  migrations/          নতুন, পরিষ্কার, ক্রমানুসারী
  reset_public_schema.sql
  seed/                ডেমো ক্যাটালগ (ঐচ্ছিক)
```

## ৫. ধাপসমূহ ও ডেলিভারেবল

### ধাপ ০ — পরিষ্কার ও ভিত্তি *(এখন)*
- ব্যাকআপ ✅ · ব্রাঞ্চ `rebuild-v2` · পুরোনো `src/`, `scripts/` (ব্যাকআপ ছাড়া), `supabase/migrations|seed|audit-md`, রিপোর্ট/লগ ফাইল মোছা
- **রাখা হচ্ছে:** `.github/workflows` + ব্যাকআপ স্ক্রিপ্ট (Google Drive এনক্রিপ্টেড ব্যাকআপ, ধাপ ৭-এ নতুন স্কিমার সাথে মেলানো), `supabase/DISASTER_RECOVERY_RUNBOOK.md`, `public/icons`
- নতুন Next.js স্কেলিটন, ডিজাইন টোকেন, env ভ্যালিডেশন (`src/lib/env.ts`)

### ধাপ ১ — ডাটাবেস স্কিমা (Supabase)
`profiles`, `staff_members`(ভূমিকা: super_admin / inventory_manager / dispatch_staff), `publishers`, `authors`, `categories`(ট্রি), `books`, `book_authors`, `book_categories`, `inventory`+`stock_movements`, `carts`/`cart_items`, `wishlist_items`, `addresses`, `pincodes`(সার্ভিসেবিলিটি), `orders`/`order_items`/`order_events`, `payments`, `coupons`/`coupon_redemptions`, `reviews`, `questions`, `banners`, `flash_deals`, `site_settings`, `audit_logs`, `notifications`।
- সব টেবিলে RLS; `SECURITY DEFINER` RPC: `place_order()` (স্টক-লক + মূল্য সার্ভারে পুনর্গণনা + কুপন — এক ট্রানজ্যাকশনে), `adjust_stock()`, `search_books()` (pg_trgm)।
- PGlite টেস্ট: স্কিমা তৈরি, RLS নীতি, `place_order` এ ওভারসেল হয় না — এটি প্রমাণ।

### ধাপ ২ — স্টোরফ্রন্ট: হেডার, হোম, ক্যাটালগ, সার্চ, বইয়ের পেজ
- হেডার (লোগো, সার্চ, অ্যাকাউন্ট, কার্ট), মেগা-মেনু ড্রয়ার, মোবাইল নিচের নেভ, ফুটার; ডাইনামিক নোটিশ বার (`site_settings` থেকে)
- হোম: ব্যানার স্লাইডার, ফ্ল্যাশ ডিল, ক্যাটাগরি গ্রিড, বেস্টসেলার/নতুন — সব ডাটাবেস থেকে, হার্ডকোড নয়
- ক্যাটাগরি/সার্চ পেজে ফিল্টার + সর্ট + পেজিনেশন; টাইপো-টলারেন্ট লাইভ সাজেশন (বাংলা+ইংরেজি)
- বইয়ের পেজ: ছবি, দাম/ছাড়, স্টক-অবস্থা, পিনকোড ডেলিভারি চেক, "একসাথে কেনা", SEO মেটা + JSON-LD

### ধাপ ৩ — অথেন্টিকেশন ও অ্যাকাউন্ট
- ইমেইল+পাসওয়ার্ড, ইমেইল OTP (magic code), Google; পাসওয়ার্ড রিসেট; মিডলওয়্যারে সেশন রিফ্রেশ
- মোবাইল OTP: `SmsProvider` ইন্টারফেস ও UI প্রস্তুত, প্রোভাইডার কী পেলেই চালু (এখন বন্ধ)
- অ্যাকাউন্ট: প্রোফাইল, ঠিকানা-বই, উইশলিস্ট, অর্ডার-ইতিহাস

### ধাপ ৪ — কার্ট, চেকআউট, অর্ডার
- কার্ট (গেস্ট → লগইনে মার্জ), Save for Later, কুপন
- চেকআউট: ঠিকানা → ডেলিভারি/পিকআপ → পেমেন্ট (**COD** + **UPI QR/UTR ম্যানুয়াল যাচাই**; Razorpay/Cashfree এর জন্য `PaymentProvider` ইন্টারফেস — কী পেলে চালু) → `place_order` RPC
- অর্ডার-সফল পেজ, ট্র্যাকিং টাইমলাইন, গেস্ট ট্র্যাক (অর্ডার নং + ফোন)

### ধাপ ৫ — অ্যাডমিন প্যানেল (মূল অগ্রাধিকার)
- লগইন: Supabase Auth + `staff_members` ভূমিকা-ভিত্তিক (সার্ভারে গার্ড, শুধু UI লুকানো নয়); ৫ ভুলে লকআউট; ২ ঘণ্টা নিষ্ক্রিয়তায় লগআউট; প্রতিটি পরিবর্তন `audit_logs`-এ
- ড্যাশবোর্ড KPI (আজকের বিক্রি, নতুন অর্ডার, ডিসপ্যাচের অপেক্ষায়, লো-স্টক)
- বই CRUD + ছবি আপলোড (Supabase Storage), ISBN/বারকোড লুকআপ, সফট-আর্কাইভ, বাল্ক CSV ইম্পোর্ট, বাল্ক প্রাইস মডিফায়ার
- স্টক ম্যানেজার + মুভমেন্ট লগ + কাউন্টার সেল (POS)
- অর্ডার পাইপলাইন (Pending → Processing → Ready → Dispatched → Delivered/Cancelled), ইনভয়েস/প্যাকিং স্লিপ/৪×৬ লেবেল প্রিন্ট, UTR যাচাই, রিফান্ড/RTO নোট
- কুপন, ব্যানার, ফ্ল্যাশ ডিল, FBT কম্বো, নোটিশ বার, মেইনটেন্যান্স মোড, দোকানের প্রোফাইল/UPI সেটিংস, ডেলিভারি জোন ও ফি
- মোবাইল-রেসপন্সিভ; ভূমিকা অনুযায়ী মেনু ও ফিল্ড (কেনা দাম/লাভ শুধু সুপার অ্যাডমিন)

### ধাপ ৬ — রিভিউ, ইনভয়েস, নোটিফিকেশন, রিপোর্ট
- ভেরিফাইড-বায়ার রিভিউ ও Q&A (অ্যাডমিন মডারেশন)
- PDF-প্রিন্টযোগ্য ইনভয়েস (HSN 4901, ০% GST) + QR যাচাই পেজ
- ইমেইল নোটিফিকেশন (অর্ডার/স্ট্যাটাস); SMS/WhatsApp ইন্টারফেস (কী পেলে)
- রিপোর্ট: বিক্রি-ট্রেন্ড, সেরা বই, ডেড স্টক, জেলা-ভিত্তিক, GSTR-1 CSV, অর্ডার CSV এক্সপোর্ট

### ধাপ ৭ — PWA, নিরাপত্তা, ব্যাকআপ, ডেপ্লয়
- PWA (manifest, সার্ভিস ওয়ার্কার, ইনস্টল প্রম্পট), sitemap/robots, রেট-লিমিট, সিকিউরিটি হেডার
- ব্যাকআপ ওয়ার্কফ্লো নতুন স্কিমার সাথে মেলানো ও পরীক্ষা
- Vercel env সম্পূর্ণ করা (নিচে তালিকা), Preview env, `rebuild-v2` → Vercel Preview ডেপ্লয় ও পরীক্ষা, তারপর আপনার অনুমতিতে `main`-এ মার্জ

### ধাপ ৮ — ফাইনাল অডিট
- সব ফ্লো এন্ড-টু-এন্ড (ব্রাউজারে): কেনা → অর্ডার → অ্যাডমিনে প্রসেস; `tsc`, `next build`, টেস্ট সব পাস; স্পেসিফিকেশনের সাথে চেকলিস্ট মিলানো

## ৬. আপনাকে যা করতে হবে (আমি কখন বলব সেটাও লেখা)

| কখন | কাজ |
| :-- | :-- |
| ধাপ ১ শেষে | Supabase SQL Editor-এ `reset_public_schema.sql` চালানো, তারপর `migrations/*.sql` চালানো (আমি একসাথে একটি ফাইল বানিয়ে দেব) — অথবা আমাকে ব্রাউজারে চালানোর অনুমতি দিন |
| ধাপ ১ শেষে | মালিকের ইমেইল কোনটি হবে (অ্যাডমিন হিসেবে) জানানো — Supabase Auth-এ সেই ইমেইলে নিজে সাইন-আপ করবেন |
| ধাপ ৩-এ | Supabase → Authentication → Providers-এ Email (OTP) ও Google চালু; Site URL ও Redirect URL সেট (আমি সঠিক মান দেব) |
| ধাপ ৭-এ | Vercel-এ `NEXT_PUBLIC_SITE_URL`, `ADMIN_OWNER_EMAILS` যোগ (Production + Preview) — *কী/টোকেন আমি নিজে কোনো ফর্মে বসাব না* |
| পরে | SMS/WhatsApp ও Razorpay/Cashfree API কী পেলে জানাবেন |
