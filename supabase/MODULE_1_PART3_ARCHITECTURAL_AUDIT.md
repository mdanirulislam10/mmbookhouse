# 🏛️ আর্কিটেকচারাল অডিট ও সংশোধন নির্দেশিকা: ভাগ ৩ (Part 3 Directive)
**প্রেরক:** সিনিয়র সলিউশনস আর্কিটেক্ট (Senior Solutions Architect)  
**প্রাপক:** সেশন মডিউল ১ (Database & Core Backend Engineer)  
**বিষয়:** মডিউল ১ (ভাগ ৩: কাজ ১১ থেকে ১৫) এর কোড-লেভেল অডিট ও প্রয়োজনীয় সংশোধন  
**তারিখ:** ৭ সেপ্টেম্বর ২০২৬  
**স্ট্যাটাস:** অ্যাকশন প্রয়োজন (Action Required)

---

## 🎯 অডিট সারসংক্ষেপ
মডিউল ১-এর **ভাগ ৩ (কাজ ১১ থেকে ১৫: কাস্টমার অ্যাড্রেস বুক, অর্ডার স্ন্যাপশট, পেমেন্ট লেজার ও পারসিসটেন্ট কার্ট)**-এর কোড (`20260907000004_address_order_payment_cart.sql` ও সিড ফাইল) অত্যন্ত যত্নসহকারে পর্যালোচনা করা হয়েছে।

অপরিবর্তনযোগ্য অ্যাড্রেস স্ন্যাপশট (`shipping_address_snapshot JSONB`), সিকোয়েন্সিয়াল অর্ডার নম্বর (`MMB-YYYYMM-XXXXX`), এবং আইডেমপোটেন্ট পেমেন্ট লেজার বাস্তবায়নের সিদ্ধান্তগুলো চমৎকার হয়েছে। 

তবে ফিন্যান্সিয়াল সিকিউরিটি, ডেটা ইনটেগ্রিটি এবং অ্যামাজন-প্যাটার্ন লজিস্টিকসের মানদণ্ডে **৭টি গুরুত্বপূর্ণ ঝুঁকি ও সংশোধনী** চিহ্নিত হয়েছে।

---

## 📋 সংশোধনের তালিকা (Actionable Punch List for Part 3)

### 🔴 [CRITICAL 1] Orders টেবিলে ক্লায়েন্ট সাইড ডাইরেক্ট ইনসার্ট নিরাপত্তা ঝুঁকি
* **সমস্যা:** `orders` টেবিলের RLS পলিসিতে `FOR INSERT WITH CHECK (auth.uid() = user_id)` দেওয়া হয়েছে।
* **বিপদ:** ক্লায়েন্ট সরাসরি পোস্টগ্রেস্ট এপিআই দিয়ে ইনসার্ট করতে পারলে কোনো অসৎ ব্যবহারকারী `total_payable_amount = 0.00`, `status = 'delivered'` বা `payment_status = 'captured'` দিয়ে ভুয়া অর্ডার তৈরি করে নিতে পারে!
* **করণীয়:** 
  1. `orders` ইনসার্ট পলিসিতে অবশ্যই স্টেট কনস্ট্রেইন্ট যোগ করুন:
     ```sql
     DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
     CREATE POLICY "Users can insert own orders" 
         ON orders FOR INSERT 
         WITH CHECK (
             (auth.uid() = user_id OR public.is_admin_or_staff())
             AND status = 'pending'
             AND payment_status = 'pending'
         );
     ```
  2. এছাড়া `orders` টেবিলে একটি ম্যাথমেটিক্যাল চেক কনস্ট্রেইন্ট দিন:
     ```sql
     ALTER TABLE orders ADD CONSTRAINT chk_orders_total_payable_math
     CHECK (total_payable_amount = GREATEST(0, (total_items_price - discount_amount + delivery_fee + packaging_fee)));
     ```

---

### 🔴 [CRITICAL 2] ফিন্যান্সিয়াল অডিটের স্বার্থে Payments টেবিলে ON DELETE RESTRICT
* **সমস্যা:** `payments.order_id` তে `ON DELETE CASCADE` রয়েছে।
* **ঝুঁকি:** কোনো কারণে যদি অ্যাডমিন বা বাগ কোনো অর্ডার রো ডিলিট করে, তবে জিএসটি ও ব্যাংকিং অডিটের জন্য আবশ্যিক পেমেন্ট রেকর্ড স্বয়ংক্রিয়ভাবে মুছে যাবে (Financial Ledger Loss)।
* **করণীয়:** `payments` টেবিলে ফরেন কী পরিবর্তন করে `ON DELETE RESTRICT` করতে হবে:
  ```sql
  ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_order_id_fkey;
  ALTER TABLE payments ADD CONSTRAINT payments_order_id_fkey 
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;
  ```

---

### 🟡 [HIGH 3] Gateway Payment ID-তে পার্শিয়াল ইউনিক ইনডেক্স
* **সমস্যা:** Razorpay/Cashfree থেকে একই পেমেন্টের জন্য একাধিকবার ওয়েবহুক হিট এলে যেন ডুপ্লিকেট পেমেন্ট রো তৈরি না হয়।
* **করণীয়:**
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_gateway_payment_id 
  ON payments (gateway_payment_id) 
  WHERE gateway_payment_id IS NOT NULL;
  ```

---

### 🟡 [HIGH 4] অর্ডারে লজিস্টিকস ও ট্র্যাকিং ফিল্ড সংযোজন
* **সমস্যা:** Shiprocket বা India Post ডেলিভারির জন্য `orders` টেবিলে কুরিয়ার পার্টনার, ট্র্যাকিং নম্বর ও আনুমানিক ডেলিভারি তারিখ নেই।
* **করণীয়:** `orders` টেবিলে নিচের কলামগুলো যুক্ত করুন:
  ```sql
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100);
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
  ```

---

### 🟡 [HIGH 5] Order Items টেবিলে কভার ইমেজ স্ন্যাপশট
* **সমস্যা:** কাস্টমার যখন "My Orders" পেজে গিয়ে অর্ডারের হিস্ট্রি বা ইনভয়েস দেখবে, তখন বইয়ের ছবি প্রদর্শনের জন্য `order_items`-এ কোনো ইমেজ স্ন্যাপশট নেই। ভবিষ্যতে মূল ক্যাটালগে বই ডিলিট বা পরিবর্তন হলে অর্ডার পেজের ছবি ভেঙে যাবে।
* **করণীয়:**
  ```sql
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
  ```

---

### 🟡 [DATA INTEGRITY 6] অ্যাড্রেস বুকে একক ডিফল্ট অ্যাড্রেসের ইউনিক ইনডেক্স ও পিনকোড ভ্যালিডেশন
* **সমস্যা ১:** একই ইউজারের জন্য কনকারেন্ট দুটি রিকোয়েস্টে একাধিক `is_default = TRUE` হওয়া আটকাতে কোনো ইউনিক পার্শিয়াল ইনডেক্স নেই।
* **সমস্যা ২:** পিনকোডে কোনো ফরম্যাট ভ্যালিডেশন নেই, ফলে ভুল পিনকোড শিপমেন্টে সমস্যা তৈরি করতে পারে।
* **করণীয়:**
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_single_default_address 
  ON customer_addresses (user_id) 
  WHERE is_default = TRUE;

  ALTER TABLE customer_addresses ADD CONSTRAINT chk_valid_indian_pincode 
  CHECK (pincode ~ '^[1-9][0-9]{5}$');
  ```

---

### 🟢 [AUTOMATION 7] কার্ট থেকে অর্ডার তৈরি করার অ্যাটমিক ট্রানজ্যাকশন ফাংশন
* **প্রয়োজনীয়তা:** ক্লায়েন্ট যাতে আলাদা আলাদা কোয়েরি না চালিয়ে এক ক্লিকে কার্ট থেকে অর্ডার স্ন্যাপশট ও আইটেম তৈরি করে কার্ট খালি করতে পারে।
* **করণীয়:** একটি স্টোরড প্রসিডিউর/ফাংশন `place_order_from_cart(p_user_id UUID, p_address_id UUID, p_payment_method VARCHAR, ...)` তৈরি করুন যা পুরো ট্রানজ্যাকশনকে অ্যাটমিক রাখবে।

---

## 📤 সেশন মডিউল ১-এর নিকট প্রত্যাশিত রিপোর্ট
সেশন মডিউল ১ এই পয়েন্টগুলোর ভিত্তিতে প্যাচ মাইগ্রেশন (`20260907000005_part3_order_payment_hardening.sql`) তৈরি করে অবিলম্বে আর্কিটেক্টকে অবহিত করবে।
