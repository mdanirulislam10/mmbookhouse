# 🏛️ মডিউল ৩ (ভাগ ৪: কাজ ১৬–২০) আর্কিটেকচারাল অডিট রিপোর্ট (Architectural Audit Report)

**অডিট কর্মকর্তা:** সিনিয়র সলিউশনস আর্কিটেক্ট (Senior Solutions Architect)  
**মডিউল:** মডিউল ৩ — "All" হ্যামবার্গার মেগা মেনু ও ক্যাটাগরি সাব-ন্যাভ (Mega Category Drawer)  
**পর্ব:** ভাগ ৪: ক্যাটালগ ডেটা ফেচিং, ক্যাশিং ও এপিআই লেয়ার (Tasks 16 to 20)  
**প্রজেক্ট:** M.M Book House Malda (অ্যামাজন-প্যাটার্ন ই-কমার্স)  
**তারিখ:** ৭ সেপ্টেম্বর ২০২৬  
**চূড়ান্ত স্ট্যাটাস:** ⚠️ **১০টি গুরুত্বপূর্ণ আর্কিটেকচারাল ও সিকিউরিটি ত্রুটি চিহ্নিত (Action Required)**  

---

## ১. 📋 অডিট সারসংক্ষেপ (Audit Summary)

মডিউল ৩-এর **ভাগ ৪ (কাজ ১৬ থেকে ২০: Supabase ডাইনামিক ক্যাটাগরি ট্রি ফেচিং, Next.js ISR ও ট্যাগ ক্যাশিং, শিমার স্কেলিটন লোডার, SEO ফ্রেন্ডলি হায়ারারকিকাল স্ল্যাগ রাউটিং ও সফট প্রি-ফেচিং)** কোডবেসে যুক্ত করা হয়েছে। 

একজন সিনিয়র আর্কিটেক্ট হিসেবে কোডবেসের প্রতিটি ফাইল (`categories.ts`, `route.ts`, `revalidate/route.ts`, `DrawerSkeleton.tsx`, `[...slug]/page.tsx`, `useCategoryData.ts`, `useCategoryPrefetch.ts`, `DrawerSections.tsx`, `SubmenuPanel.tsx`, `CategoryDrawer.tsx`) পুঙ্খানুপুঙ্খ অডিট করে **১০টি প্রযুক্তিগত, পারফরম্যান্স ও সিকিউরিটি ত্রুটি** পাওয়া গেছে।

---

## ২. 🔍 চিহ্নিত ১০টি ত্রুটির বিশদ বিশ্লেষণ

### 🛑 ত্রুটি ১: `/api/revalidate` এন্ডপয়েন্টে গুরুতর সিকিউরিটি ফাঁক (Security Bypass)
* **আক্রান্ত ফাইল:** `src/app/api/revalidate/route.ts` (Line 17)
* **সমস্যা:** কোডে লেখা হয়েছে:
  ```typescript
  const expectedSecret = process.env.REVALIDATION_SECRET || 'mm-book-house-revalidate-secret';
  if (secret && secret !== expectedSecret) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
  ```
  যদি কোনো আক্রমণকারী বা বহিরাগত রিকোয়েস্টে কোনো `secret` প্যারামিটার না পাঠায় (`secret` অনুপস্থিত), তবে `secret && ...` শর্তটি `false` হয়ে যায় এবং সিকিউরিটি চেক বাইপাস হয়ে যায়! এর ফলে পাবলিক ইন্টারনেটের যেকোনো ব্যক্তি কোনো সিক্রেট ছাড়াই `POST /api/revalidate` কল করে সার্ভার ক্যাশ বারবার মুছে দিতে পারবে এবং ডেটাবেসে Denial of Service (DoS) ঘটাতে পারবে।
* **সমাধান:** শর্তটি অবশ্যই কঠোর করতে হবে:
  ```typescript
  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ message: 'Unauthorized / Invalid secret token' }, { status: 401 });
  }
  ```

---

### 🛑 ত্রুটি ২: শিমার স্কেলিটন লোডার সম্পূর্ণ ডেড কোড (Unreachable Skeleton Loader)
* **আক্রান্ত ফাইল:** `src/hooks/useCategoryData.ts` (Line 20) ও `src/components/category-drawer/DrawerSections.tsx` (Line 104)
* **সমস্যা:** 
  ১. `useCategoryData.ts`-এ স্টেট ইনিশিয়ালাইজেশনে শুরুতেই ফলব্যাক ট্রি দিয়ে দেওয়া হয়েছে:
  ```typescript
  const [categories, setCategories] = useState<CategoryTreeNode[]>(
    cachedCategories || getFallbackCategoryTree()
  );
  ```
  ফলে `categories.length` সবসময় ৫ থাকে।  
  ২. আর `DrawerSections.tsx`-এ স্কেলিটন দেখানোর শর্ত দেওয়া হয়েছে:
  ```typescript
  if (isLoading && (!categories || categories.length === 0)) {
    return <DrawerSkeleton />;
  }
  ```
  যেহেতু `categories.length` কখনোই শূন্য নয়, তাই `DrawerSkeleton` **বাস্তবে ব্রাউজারে কখনো এক মিলি-সেকেন্ডের জন্যও রেন্ডার হয় না!** কাজ ১৮-এর উদ্দেশ্য ছিল স্লো নেটওয়ার্কে ব্যবহারকারীকে শিমার দেখানো, কিন্তু এই লজিক ত্রুটির কারণে তা সম্পূর্ণ অকার্যকর।
* **সমাধান:** ক্লায়েন্টে প্রথমবারের ফেচ চলাকালীন (`!cachedCategories && isLoading`) স্কেলিটন দেখাতে হবে, অথবা ফেচ শেষ হওয়া পর্যন্ত ফলব্যাক প্রতিস্থাপনের সময় স্মুথ স্কেলিটন ট্রানজিশন দিতে হবে।

---

### 🛑 ত্রুটি ৩: ক্যাটাগরি পেজে `generateStaticParams` অনুপস্থিত (Dynamic Cold Start vs True ISR)
* **আক্রান্ত ফাইল:** `src/app/category/[...slug]/page.tsx`
* **সমস্যা:** ফাইলে `export const revalidate = 3600;` দেওয়া হলেও কোনো `generateStaticParams()` ফাংশন এক্সপোর্ট করা হয়নি। Next.js 15-এ ক্যাচ-অল রুট `[...slug]`-এ `generateStaticParams` না থাকলে Next.js এটিকে বিল্ড টাইমে প্রি-রেন্ডার করতে পারে না এবং রুটটি `ƒ (Dynamic)` অন-ডিমান্ড সার্ভার রেন্ডারিং হিসেবে থাকে (বিল্ড লগে `ƒ /category/[...slug]` দৃশ্যমান)। ফলে শীর্ষ ক্যাটাগরিগুলোতে (`/category/wbcs`, `/category/college` ইত্যাদি) প্রথম ভিজিটে ইনস্ট্যান্ট এজ ক্যাশ (Sub-50ms) পাওয়া যায় না।
* **সমাধান:** `generateStaticParams()` যোগ করে শীর্ষ ডিপার্টমেন্ট এবং জনপ্রিয় সাব-ক্যাটাগরিগুলোকে বিল্ড টাইমে প্রি-জেনারেট করতে হবে।

---

### 🛑 ত্রুটি ৪: `CategoryPage`-এ ডিপার্টমেন্ট কি (Key) অসঙ্গতি ও সাব-ক্যাটাগরি চিপস গায়েব
* **আক্রান্ত ফাইল:** `src/app/category/[...slug]/page.tsx` (Line 53–54)
* **সমস্যা:** কোডে লেখা হয়েছে:
  ```typescript
  const rootSlug = slug[0];
  const deptKey = `dept-${rootSlug}`;
  const subcategories = DEPARTMENT_SUBCATEGORIES[deptKey] || [];
  ```
  যখন কোনো শিক্ষার্থী `/category/competitive-exams` বা `/category/competitive-exams/wb-police` ভিজিট করবে:
  - `rootSlug` = `'competitive-exams'`
  - `deptKey` = `'dept-competitive-exams'`
  কিন্তু `departmentData.ts`-এ মূল কি ছিল `'dept-gov-jobs'` এবং এলিয়াস ছিল `DEPARTMENT_SUBCATEGORIES['competitive-exams']` (সামনে `dept-` ছাড়া)।  
  ফলে `DEPARTMENT_SUBCATEGORIES['dept-competitive-exams']` রিটার্ন করে `undefined`! অর্থাৎ প্রতিযোগিতামূলক পরীক্ষার পেজে সাব-ক্যাটাগরি চিপস (WBP Police, TET, Rail, SSC, Clerkship) **একদম প্রদর্শিত হবে না**!
* **সমাধান:** ফলব্যাক রেজোলিউশন যুক্ত করতে হবে:
  ```typescript
  const subcategories = DEPARTMENT_SUBCATEGORIES[deptKey] || DEPARTMENT_SUBCATEGORIES[rootSlug] || [];
  ```

---

### 🛑 ত্রুটি ৫: ডাইনামিক ডেটাবেস ক্যাটাগরির হায়ারারকিকাল URL হারানো (SEO Slug Bug)
* **আক্রান্ত ফাইল:** `src/components/category-drawer/SubmenuPanel.tsx` (Line 101)
* **সমস্যা:** `SubmenuPanel.tsx`-এ সাব-ক্যাটাগরির লিঙ্ক দেওয়া হয়েছে:
  ```tsx
  <Link href={`/category/${subItem.slug}`}>
  ```
  Supabase ডাটাবেস সীডে সাব-ক্যাটাগরির স্লাগগুলো ফ্ল্যাট থাকে (যেমন: `wbcs-special`, `primary-tet-slst`)। `CategoryTreeNode`-এ সুন্দরভাবে প্যারেন্ট স্লাগ সহ `fullPath` তৈরি করা হয়েছিল (`/category/competitive-exams/wbcs-special`), কিন্তু `SubmenuPanel` সেটিকে অগ্রাহ্য করে লিঙ্ক বানাচ্ছে `/category/wbcs-special`। এর ফলে কাজ ১৯-এর উদ্দেশ্য (SEO ফ্রেন্ডলি হায়ারারকিকাল ইউআরএল `/category/:parent/:child`) ভেঙে যায়।
* **সমাধান:** লিঙ্কে `subItem.fullPath` অগ্রাধিকার দিতে হবে:
  ```tsx
  href={subItem.fullPath || `/category/${subItem.slug}`}
  ```

---

### 🛑 ত্রুটি ৬: Supabase কুয়েরির সাথে Next.js Data Cache ও Tag ইনভ্যালিডেশনের বিচ্ছেদ
* **আক্রান্ত ফাইল:** `src/lib/supabase/categories.ts` (Line 119)
* **সমস্যা:** কাজ ১৭-এর লক্ষ্য ছিল ট্যাগ ক্যাশিং ও অন-ডিমান্ড রিভ্যালিডেশন। কিন্তু `fetchCategoryTree()` সরাসরি `supabase.from('categories').select('*')` কল করে। Next.js 15 ডেটা ক্যাশে Supabase ক্লায়েন্টের রেসপন্স স্বয়ংক্রিয়ভাবে ক্যাশ হয় না যদি না সেটি `unstable_cache` দিয়ে র‍্যাপ করা থাকে। ফলে `/api/revalidate?tag=categories` কল করলেও Next.js-এর কোনো ক্যাশ ইনভ্যালিডেট হয় না।
* **সমাধান:** `fetchCategoryTree` ফাংশনটিকে Next.js-এর `unstable_cache` দিয়ে র‍্যাপ করতে হবে এবং ট্যাগ `'categories'` ও `revalidate: 3600` নিশ্চিত করতে হবে।

---

### 🛑 ত্রুটি ৭: অপ্রয়োজনীয় ও অপচয়মূলক সফট প্রি-ফেচিং (Misdirected Prefetch)
* **আক্রান্ত ফাইল:** `src/components/category-drawer/DrawerSections.tsx` (Line 203)
* **সমস্যা:** 
  ```tsx
  <button
    onClick={() => handleDepartmentClick(dept)}
    onPointerEnter={() => prefetchUrl(`/category/${dept.slug}`)}
  ```
  ব্যবহারকারী যখন ড্রয়ারের কোনো ডিপার্টমেন্ট বাটনে ক্লিক করে, তখন কিন্তু পেজ নেভিগেশন ঘটে না—বরং ড্রয়ারের ভেতরে ২য় লেয়ার সাবমেনু স্লাইড প্যানেল ওপেন হয়! অথচ হোভারে অপ্রয়োজনীয়ভাবে `/category/${dept.slug}` পেজ ডেটা প্রি-ফেচ হচ্ছে, যা মোবাইল ডেটা ও সার্ভার রিসোর্সের অপচয় ঘটায়।
* **সমাধান:** ডিপার্টমেন্ট ট্রিগার বাটন থেকে অপ্রয়োজনীয় পেজ প্রি-ফেচ বাদ দিতে হবে এবং শুধুমাত্র সাবমেনুর চূড়ান্ত লিঙ্কে প্রি-ফেচ বজায় রাখতে হবে।

---

### 🛑 ত্রুটি ৮: মেমরি লিকেজ ও রেফারেন্স রিসেট ইন `useCategoryPrefetch`
* **আক্রান্ত ফাইল:** `src/hooks/useCategoryPrefetch.ts` (Line 12)
* **সমস্যা:** হুকের ভেতরে `const prefetchedUrlsRef = useRef<Set<string>>(new Set())` রাখা হয়েছে। `SubmenuPanel` যখনই আনমাউন্ট হয় বা ইউজার ড্রয়ার বন্ধ করে, রেফারেন্সটি ধ্বংস হয়ে নতুন খালি সেট তৈরি হয়। ফলে একই সেশনে একাধিকবার একই ইউআরএল বারবার প্রি-ফেচ হতে থাকে।
* **সমাধান:** মডিউল-লেভেল ক্যাশ `Set<string>` ব্যবহার করতে হবে যাতে ড্রয়ার খোলা বা বন্ধের পরও প্রি-ফেচ মেমরি কার্যকর থাকে।

---

### 🛑 ত্রুটি ৯: অব্যবহৃত ডেড কোড `buildCategorySlugUrl`
* **আক্রান্ত ফাইল:** `src/lib/supabase/categories.ts` (Line 30)
* **সমস্যা:** `buildCategorySlugUrl()` ফাংশনটি তৈরি করা হয়েছিল কিন্তু প্রজেক্টের কোথাও এটি ব্যবহার করা হয়নি। স্ল্যাশ ক্লিনিং এবং স্ল্যাগ নরম্যালাইজেশনের জন্য এটি `buildCategoryTree` এবং `SubmenuPanel`-এ সক্রিয়ভাবে ব্যবহার করা উচিত।

---

### 🛑 ত্রুটি ১০: এসইও মেটাডাটা জেনারেশনে অশুদ্ধ ইংরেজি শিরোনাম ও বাংলা অনুপস্থিতি
* **আক্রান্ত ফাইল:** `src/app/category/[...slug]/page.tsx` (Line 25–28)
* **সমস্যা:** 
  `/category/college/ugb` বা `/category/wbcs/prelims` ইউআরএলে গেলে মেটাডাটা টাইটেল হয়:
  `Ugb বইয়ের তালিকা | M.M Book House Malda` বা `Prelims বইয়ের তালিকা`।  
  যেখানে প্রকৃত নাম হওয়া উচিত: `গৌড়বঙ্গ বিশ্ববিদ্যালয় (UGB)` বা `WBCS প্রিলিমস গাইড`। মালদার স্থানীয় শিক্ষার্থীদের সার্চ ইঞ্জিনের জন্য বাংলা ও দ্বিভাষিক টাইটেল হওয়া অপরিহার্য।
* **সমাধান:** ক্যাটাগরি স্ল্যাগ থেকে মেটাডাটা টাইটেল তৈরির সময় রেজিস্ট্রি থেকে `titleBn` বা সম্পূর্ণ নাম অনুসন্ধান করে মেটাডাটায় যুক্ত করতে হবে।

---

## ৩. 🎯 অ্যাকশন প্ল্যান ও ফ্রন্টএন্ড ইঞ্জিনিয়ারকে করণীয় নির্দেশ

| ক্র. | ফাইল | করণীয় কাজ |
| :--- | :--- | :--- |
| **১** | `src/app/api/revalidate/route.ts` | `if (!secret \|\| secret !== expectedSecret)` দিয়ে সিকিউরিটি হোল বন্ধ করা। |
| **২** | `src/components/category-drawer/DrawerSections.tsx` & `useCategoryData.ts` | প্রথম লোডে `DrawerSkeleton` দৃশ্যমান করা এবং ফলব্যাক ট্রানজিশন ঠিক করা। |
| **৩** | `src/app/category/[...slug]/page.tsx` | `generateStaticParams()` যুক্ত করা এবং `DEPARTMENT_SUBCATEGORIES[rootSlug]` ফলব্যাক দেওয়া। |
| **৪** | `src/components/category-drawer/SubmenuPanel.tsx` | `href={subItem.fullPath \|\| ...}` দিয়ে হায়ারারকিকাল URL রক্ষা করা। |
| **৫** | `src/lib/supabase/categories.ts` | `unstable_cache` যুক্ত করা এবং `buildCategorySlugUrl` সক্রিয় করা। |
| **৬** | `src/components/category-drawer/DrawerSections.tsx` | ডিপার্টমেন্ট টগল বাটনে অপ্রয়োজনীয় প্রি-ফেচিং বাতিল করা। |
| **৭** | `src/hooks/useCategoryPrefetch.ts` | মডিউল-লেভেল `Set` দিয়ে প্রি-ফেচিং ডুপ্লিকেট রোধ করা। |
| **৮** | `src/app/category/[...slug]/page.tsx` | মেটাডাটায় দ্বিভাষিক ও খাঁটি বাংলা টাইটেল রেজোলিউশন যুক্ত করা। |

সিনিয়র আর্কিটেক্ট হিসেবে এই ১০টি ত্রুটি অবিলম্বে সংশোধনের জন্য মডিউল ৩ ইঞ্জিনিয়ারিং টিমকে নির্দেশ দেওয়া হোক।
