# 🏛️ আর্কিটেকচারাল অডিট ও কারেকশন রিকমেন্ডেশন (Module 1 Directive)
**প্রেরক:** সিনিয়র সলিউশনস আর্কিটেক্ট (Senior Solutions Architect)  
**প্রাপক:** সেশন মডিউল ১ (Database & Core Backend Engineer)  
**বিষয়:** মডিউল ১ (ভাগ ১ ও ভাগ ২: কাজ ১ থেকে ১০) এর অডিট রিপোর্ট ও সংশোধন নির্দেশিকা  
**তারিখ:** ৭ সেপ্টেম্বর ২০২৬  
**স্ট্যাটাস:** অ্যাকশন প্রয়োজন (Action Required)

---

## 🎯 উদ্দেশ্য ও সারসংক্ষেপ
মডিউল ১-এর **ভাগ ১ (কোর ক্যাটালগ ও হায়ারার্কি: কাজ ১ থেকে ৫)** এবং **ভাগ ২ (সার্চ, প্রাইসিং, প্রিভিউ, স্টক লক ও প্রোফাইল: কাজ ৬ থেকে ১০)**-এর আওতায় রচিত স্কিমা ও সিড কোড পর্যালোচনা করা হয়েছে। স্কিমার আর্কিটেকচারাল ভিত্তি অত্যন্ত সমৃদ্ধ ও আধুনিক। তবে প্রোডাকশন নিরাপত্তা, কনকারেন্সি স্থায়িত্ব এবং কুয়েরি পারফরম্যান্সের স্বার্থে **১০টি সুনির্দিষ্ট ত্রুটি ও কমতি** অবিলম্বে সংশোধন করতে হবে।

এই নির্দেশিকা অনুযায়ী প্রয়োজনীয় সংশোধন মাইগ্রেশন তৈরি করে আর্কিটেক্টের নিকট রিপোর্ট পেশ করার নির্দেশ দেওয়া হচ্ছে।

---

## 📋 সংশোধনের তালিকা (Actionable Punch List)

### 🔴 [CRITICAL 1] Row Level Security (RLS) পলিসি কার্যকর করা
* **সমস্যা:** ১০টি টেবিলের কোনোটিতেই RLS সক্রিয় নেই। সুপাবেসে PostgREST এপিআই দিয়ে যে কেউ ক্লায়েন্ট সাইড থেকে টেবিল ড্রপ/আপডেট করতে পারে।
* **করণীয়:** প্রতিটি টেবিলে RLS অন করে সুনির্দিষ্ট পলিসি তৈরি করুন:
  - `publishers`, `authors`, `categories`, `books`, `book_variants`, `book_authors`, `book_categories`: সর্বসাধারণের জন্য শুধুমাত্র সক্রিয় রেকর্ড রিড (SELECT) করার অনুমতি থাকবে (`is_active = TRUE AND deleted_at IS NULL`)।
  - `profiles`: ব্যবহারকারী কেবল নিজের প্রোফাইল রিড ও আপডেট করতে পারবে (`auth.uid() = id`), অ্যাডমিনরা সব পারবে।
  - `inventory` ও `inventory_reservations`: ক্লায়েন্ট থেকে সরাসরি কোনো ইনসার্ট/আপডেট হবে না; শুধুমাত্র `SECURITY DEFINER` ডাটাবেস ফাংশনের মাধ্যমে নিয়ন্ত্রিত হবে।

---

### 🔴 [CRITICAL 2] তাৎক্ষণিক স্টক রিজার্ভেশন রিলিজ ফাংশন তৈরি
* **সমস্যা:** কাস্টমার যদি চেকআউট স্ক্রিনে গিয়ে পেমেন্ট ফেইল করে বা ব্যাক বাটনে ক্লিক করে, তবে স্টক ১০ মিনিট পর্যন্ত লক থাকে। কোনো রিলিজ ফাংশন নেই।
* **করণীয়:** নিচের ফাংশনটি যুক্ত করুন:
  ```sql
  CREATE OR REPLACE FUNCTION release_stock_reservation(p_reservation_token UUID)
  RETURNS BOOLEAN AS $$
  DECLARE
      v_res inventory_reservations%ROWTYPE;
  BEGIN
      SELECT * INTO v_res 
      FROM inventory_reservations 
      WHERE reservation_token = p_reservation_token 
      FOR UPDATE;

      IF NOT FOUND THEN
          RETURN FALSE;
      END IF;

      IF v_res.status = 'active' THEN
          UPDATE inventory 
          SET reserved_quantity = GREATEST(0, reserved_quantity - v_res.quantity),
              updated_at = NOW()
          WHERE variant_id = v_res.variant_id;

          UPDATE inventory_reservations 
          SET status = 'released' 
          WHERE id = v_res.id;

          RETURN TRUE;
      END IF;

      RETURN FALSE;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```

---

### 🔴 [CRITICAL 3] মেয়াদোত্তীর্ণ রিজার্ভেশনের স্বয়ংক্রিয় লেজি ক্লিনআপ (Lazy Cleanup)
* **সমস্যা:** `release_expired_reservations()` ফাংশন থাকলেও ডাটাবেসে স্বয়ংক্রিয় ব্যাকগ্রাউন্ড ক্রন না থাকলে মেয়াদোত্তীর্ণ স্টক লক হয়ে থাকবে।
* **করণীয়:** নতুন রিজার্ভেশন করার সময় `reserve_stock()` ফাংশনের শুরুর লাইনেই লেজি ক্লিনআপ কল করুন:
  ```sql
  -- reserve_stock() ফাংশনের ভেতরে সবার শুরুতে যুক্ত করুন:
  PERFORM release_expired_reservations();
  ```
  *(এর ফলে বাহ্যিক কোনো ক্রন জব ছাড়াও প্রতিবার স্টক রিকোয়েস্টে এক্সপায়ার্ড লকগুলো নিমেষে মুক্ত হয়ে যাবে)*।

---

### 🟡 [HIGH 4] `search_books` ফাংশনের পারফরম্যান্স অপ্টিমাইজেশন
* **সমস্যা:** `book_author_agg` এবং `book_price_agg` পুরো টেবিল ফুল-স্ক্যান করে এগ্রিগেট করছে, যা ৫,০০০+ বই থাকলে সার্চ স্লো করবে। এছাড়া `similarity_threshold` প্যারামিটার পাস হলেও `set_limit()` দিয়ে কার্যকর করা হয়নি।
* **করণীয়:** 
  1. ফাংশনের শুরুতে `PERFORM set_limit(similarity_threshold);` কল করুন।
  2. প্রথমে ফিল্টার ও লিমিট প্রয়োগ করে ম্যাচিং বইগুলো তুলুন, তারপর শুধুমাত্র সেই ২০টি বইয়ের জন্য লেখক ও দাম জয়েন/এগ্রিগেট করুন।

---

### 🟡 [HIGH 5] `v_catalog_books` ভিউতে লেখক ও স্টক ডেটা সংযোজন
* **সমস্যা:** হোমপেজ বা ক্যাটাগরি গ্রিডে বই প্রদর্শনের জন্য এই ভিউ ব্যবহার হবে, অথচ এতে লেখকের নাম ও লাইভ স্টক ফ্ল্যাগ নেই।
* **করণীয়:** ভিউতে নিচের কলামগুলো যুক্ত করুন:
  - `author_names TEXT` (কমা দিয়ে সংযুক্ত প্রধান লেখকদের তালিকা)
  - `cover_image_url TEXT` (বইয়ের প্রাইমারি কভার ইমেজ)
  - `total_available_stock INT` (সকল ভ্যারিয়েন্টের মোট অ্যাভেইলেবল স্টক)
  - `is_in_stock BOOLEAN` (স্টকে কমপক্ষে ১ কপি আছে কিনা)

---

### 🟡 [HIGH 6] `profiles` টেবিলে `email` ফিল্ড ও `auth.users` Foreign Key
* **সমস্যা:** প্রোফাইল টেবিলে ইমেইল নেই এবং সুপাবেস অথের সাথে ক্যাসকেড ডিলিশন লিংক মিসিং।
* **করণীয়:** 
  ```sql
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
  
  -- handle_new_user ট্রিগারে NEW.email সংরক্ষণ করুন
  ```

---

### 🟡 [DATA INTEGRITY 7] ক্যাটাগরি সেলফ-প্যারেন্টিং ও সাইকেল প্রতিরোধ
* **সমস্যা:** `parent_id = id` হলে রিকার্সিভ ক্যাটাগরি কুয়েরি ডাটাবেস ইনফিনিট লুপে ক্র্যাশ করবে।
* **করণীয়:**
  ```sql
  ALTER TABLE categories ADD CONSTRAINT chk_category_no_self_parent 
  CHECK (parent_id IS NULL OR parent_id != id);
  ```

---

### 🟡 [DATA INTEGRITY 8] `book_categories`-এ একক প্রাইমারি ক্যাটাগরি কনস্ট্রেইন্ট
* **সমস্যা:** একই বইয়ের জন্য একাধিক ক্যাটাগরিতে `is_primary = true` হওয়া সম্ভব, যা ক্যানোনিকাল ইউআরএল নষ্ট করে।
* **করণীয়:**
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS uq_book_single_primary_category 
  ON book_categories (book_id) 
  WHERE is_primary = TRUE;
  ```

---

### 🟢 [OPTIMIZATION 9] ডুপ্লিকেট ইনডেক্স ক্লিনআপ
* **করণীয়:** কম্পোজিট ইউনিক কনস্ট্রেইন্ট থাকায় নিচের দুটি রিডানড্যান্ট ইনডেক্স ড্রপ করুন:
  ```sql
  DROP INDEX IF EXISTS idx_book_authors_book_id;
  DROP INDEX IF EXISTS idx_book_categories_book_id;
  ```

---

### 🟢 [AUTOMATION 10] নতুন ভ্যারিয়েন্টে অটো-ইনভেন্টরি ইনিশিয়ালাইজেশন
* **সমস্যা:** কোনো অ্যাডমিন বা কোড `book_variants`-এ এন্ট্রি দিলে যদি `inventory` টেবিলে এন্ট্রি দিতে ভুলে যায়, তবে চেকআউট ক্র্যাশ করবে।
* **করণীয়:** `book_variants` টেবিলে `AFTER INSERT` ট্রিগার তৈরি করুন যা স্বয়ংক্রিয়ভাবে `inventory` টেবিলে `stock_quantity = 0` সহ রো তৈরি করে দেবে।

---

## 📤 সেশন মডিউল ১-এর নিকট প্রত্যাশিত রিপোর্ট ফরম্যাট
সেশন মডিউল ১ এই কাজগুলো সম্পন্ন করে একটি সংশোধন মাইগ্রেশন ফাইল (`20260907000003_consolidated_fixes_part1_and_2.sql`) প্রস্তুত করবে এবং নিম্নলিখিত বিষয়গুলো কনফার্ম করে আর্কিটেক্টকে রিপোর্ট করবে:
1. RLS সক্রিয় হয়েছে কিনা এবং পলিসি টেস্ট সফল হয়েছে কিনা।
2. `release_stock_reservation` ফাংশন ও লেজি ক্লিনআপ কাজ করছে কিনা।
3. `v_catalog_books` এবং `search_books` অপ্টিমাইজড হয়েছে কিনা।
4. কনস্ট্রেইন্ট ও ইউনিক ইনডেক্স কার্যকর হয়েছে কিনা।
