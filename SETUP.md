# mmbookhouse — সেটআপ ও চালু করার ধাপ (Setup guide)

## ১. ডাটাবেস (Supabase) — একবারের কাজ

> ⚠️ ধাপ ১.২ পুরো `public` স্কিমা মুছে ফেলে (গ্রাহকের লগইন-অ্যাকাউন্ট `auth` স্কিমায় থাকে, সেগুলো থাকবে)।
> আগে GitHub → Actions → “Encrypted database backup” → Run workflow চালিয়ে ব্যাকআপ নিয়ে রাখুন।

1. Supabase → **SQL Editor → New query**।
2. `supabase/reset_and_migrate.sql` ফাইলের পুরো লেখা কপি করে বসান → **Run**। (এটি পুরোনো টেবিল মুছে নতুন স্কিমা বানায়।)
3. দোকানের শুরুর ক্যাটাগরি চাইলে `supabase/seed/01_categories.sql` চালান।
4. ডেমো বই দিয়ে পরীক্ষা করতে চাইলে `supabase/seed/02_demo_books.sql` চালান। পরে মুছতে: `delete from public.books where slug like 'demo-%';`

বিকল্প (কমান্ড লাইন): `.env.local`-এ `SUPABASE_DB_URL` দিয়ে `npm run db:migrate -- --reset`।

## ২. Supabase Authentication সেটিংস

**Authentication → Providers**
- **Email:** চালু। “Confirm email” চালু রাখা ভালো।
- **Google:** Client ID/Secret বসান (Google Cloud Console → OAuth client)। Redirect URL: `https://<project-ref>.supabase.co/auth/v1/callback`।

**Authentication → URL Configuration**
- Site URL: `https://mmbookhouse.vercel.app` (কাস্টম ডোমেইন হলে সেটি)
- Redirect URLs: `https://mmbookhouse.vercel.app/**` এবং `http://localhost:3000/**`

**Authentication → Email Templates** (৬-সংখ্যার কোড ও যেকোনো ডিভাইসে কাজ করার জন্য)
- *Magic Link* টেমপ্লেটে বডিতে যোগ করুন: `আপনার কোড: {{ .Token }}` এবং লিংক: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink`
- *Confirm signup* লিংক: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup`
- *Reset Password* লিংক: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/account/reset-password`

**Authentication → SMTP:** Supabase-এর ডিফল্ট ইমেইল ঘণ্টায় খুব অল্প পাঠায়। আসল ব্যবহারের জন্য নিজের SMTP (Resend / Brevo / Gmail App Password) দিন।

## ৩. Vercel Environment Variables (Production **এবং** Preview)

| নাম | মান |
| :-- | :-- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | আগে থেকেই আছে (Preview-তেও দিন) |
| `NEXT_PUBLIC_SITE_URL` | `https://mmbookhouse.vercel.app` |
| `ADMIN_OWNER_EMAILS` | মালিকের ইমেইল (কমা দিয়ে একাধিক)। এই ইমেইলে সাইটে অ্যাকাউন্ট খুলে সাইন ইন করলে প্রথমবার নিজে থেকে **Super Admin** হবেন |
| `GITHUB_REPOSITORY`, `GITHUB_BACKUP_REF`, `GITHUB_BACKUP_WORKFLOW`, `GITHUB_BACKUP_TOKEN` | আগে থেকেই আছে (অ্যাডমিন → ব্যাকআপ বোতামের জন্য) |

পুরোনো `ADMIN_PANEL_PASSWORD` ও `ADMIN_SESSION_SECRET` আর লাগবে না।

## ৪. প্রথম ব্যবহার

1. সাইটে `ADMIN_OWNER_EMAILS`-এর ইমেইলে অ্যাকাউন্ট খুলুন → `/admin/login` → সাইন ইন।
2. **অ্যাডমিন → দোকানের সেটিংস:** ফোন, হোয়াটসঅ্যাপ, UPI ID, ডেলিভারি চার্জ ঠিক করুন।
3. **অ্যাডমিন → বই → বই যোগ করুন** (বা CSV ইম্পোর্ট)।
4. **অ্যাডমিন → কর্মী:** কর্মীকে আগে ওয়েবসাইটে অ্যাকাউন্ট খুলতে বলুন, তারপর ইমেইল দিয়ে ভূমিকা দিন।

## ৫. পরে যা যোগ হবে
- মোবাইল OTP (SMS প্রোভাইডারের কী পেলে) · Razorpay/Cashfree · WhatsApp/SMS নোটিফিকেশন।

## ৬. ডেভেলপারদের জন্য
```
npm install
npm run dev          # http://localhost:3000
npm run typecheck && npm test   # টাইপ-চেক ও ডাটাবেস টেস্ট (PGlite, লাইভ ডাটাবেস লাগে না)
node scripts/db-bundle.mjs      # migrations বদলালে SQL বান্ডেল আবার বানান
```
