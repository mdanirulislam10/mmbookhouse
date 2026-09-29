// Loads the starter categories (and optionally demo books) through the API using the service-role key.
//   node --env-file=.env.local scripts/seed-demo.mjs [--books]
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
const db = createClient(url, key, { auth: { persistSession: false } });
const must = (label, { error }) => { if (error) { console.error(label, error.message); process.exit(1); } };

const roots = [
  ["wbcs-competitive", "WBCS & Competitive Exams", "ডব্লিউবিসিএস ও প্রতিযোগিতামূলক পরীক্ষা", 1, true],
  ["school-books", "School Books", "স্কুলের বই", 2, true],
  ["college-semesters", "College & University", "কলেজ ও বিশ্ববিদ্যালয়", 3, true],
  ["entrance-exams", "Entrance (NEET / JEE)", "প্রবেশিকা (NEET / JEE)", 4, true],
  ["novels-literature", "Novels & Literature", "উপন্যাস ও সাহিত্য", 5, true],
  ["children", "Children's Books", "শিশুদের বই", 6, true],
  ["reference", "Dictionaries & Reference", "অভিধান ও রেফারেন্স", 7, false],
];
must("roots", await db.from("categories").upsert(roots.map(([slug, name, name_bn, sort_order, show_on_home]) => ({ slug, name, name_bn, sort_order, show_on_home })), { onConflict: "slug", ignoreDuplicates: true }));
const { data: cats } = await db.from("categories").select("id, slug");
const id = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
const subs = [
  ["wbcs", "WBCS", "ডব্লিউবিসিএস", "wbcs-competitive", 1],
  ["railway-ssc", "Railway & SSC", "রেলওয়ে ও এসএসসি", "wbcs-competitive", 2],
  ["primary-tet", "Primary TET / SLST", "প্রাইমারি টেট / এসএলএসটি", "wbcs-competitive", 3],
  ["class-5-8", "Class V – VIII", "পঞ্চম – অষ্টম শ্রেণি", "school-books", 1],
  ["madhyamik", "Madhyamik (Class X)", "মাধ্যমিক (দশম)", "school-books", 2],
  ["higher-secondary", "Higher Secondary (XI–XII)", "উচ্চ মাধ্যমিক (একাদশ–দ্বাদশ)", "school-books", 3],
  ["ba-bsc-bcom", "B.A. / B.Sc. / B.Com.", "বি.এ. / বি.এসসি. / বি.কম.", "college-semesters", 1],
  ["ma-msc", "M.A. / M.Sc.", "এম.এ. / এম.এসসি.", "college-semesters", 2],
];
must("subs", await db.from("categories").upsert(subs.map(([slug, name, name_bn, p, sort_order]) => ({ slug, name, name_bn, parent_id: id[p], sort_order })), { onConflict: "slug", ignoreDuplicates: true }));
console.log("categories ok");

if (process.argv.includes("--books")) {
  const { data: cats2 } = await db.from("categories").select("id, slug");
  const cid = Object.fromEntries(cats2.map((c) => [c.slug, c.id]));
  must("pubs", await db.from("publishers").upsert([{ slug: "demo-chhaya", name: "Chhaya Prakashani (demo)" }, { slug: "demo-oxford", name: "Oxford University Press (demo)" }], { onConflict: "slug", ignoreDuplicates: true }));
  const { data: pubs } = await db.from("publishers").select("id, slug");
  const pid = Object.fromEntries(pubs.map((p) => [p.slug, p.id]));
  const books = [
    ["demo-wbcs-polity", "WBCS Indian Polity Made Easy", "ডব্লিউবিসিএস ভারতীয় সংবিধান সহজ পাঠ", "en", 600, 450, 25, "wbcs", "demo-chhaya", "M. Laxmikanth"],
    ["demo-wbcs-history", "WBCS History Guide", "ডব্লিউবিসিএস ইতিহাস গাইড", "bn", 500, 400, 18, "wbcs", "demo-chhaya", "S. Roy"],
    ["demo-railway-gk", "Railway Group D General Knowledge", "রেলওয়ে গ্রুপ ডি সাধারণ জ্ঞান", "bn", 350, 280, 40, "railway-ssc", "demo-chhaya", "P. Das"],
    ["demo-madhyamik-math", "Madhyamik Ganit Prakash", "মাধ্যমিক গণিত প্রকাশ", "bn", 300, 255, 60, "madhyamik", "demo-chhaya", "A. Sen"],
    ["demo-madhyamik-sci", "Madhyamik Life Science", "মাধ্যমিক জীবনবিজ্ঞান", "bn", 320, 272, 35, "madhyamik", "demo-chhaya", "D. Ghosh"],
    ["demo-hs-physics", "Higher Secondary Physics Vol 1", "উচ্চ মাধ্যমিক পদার্থবিজ্ঞান ১ম খণ্ড", "en", 550, 470, 22, "higher-secondary", "demo-oxford", "H. C. Verma"],
    ["demo-ba-english", "B.A. English Honours Companion", "বি.এ. ইংরেজি অনার্স সহায়িকা", "en", 450, 380, 12, "ba-bsc-bcom", "demo-oxford", "R. Mukherjee"],
    ["demo-neet-bio", "NEET Biology Practice Set", "NEET জীববিজ্ঞান প্র্যাকটিস সেট", "en", 700, 560, 8, "entrance-exams", "demo-oxford", "K. Basu"],
    ["demo-pather-panchali", "Pather Panchali", "পথের পাঁচালী", "bn", 250, 210, 30, "novels-literature", "demo-chhaya", "Bibhutibhushan Bandyopadhyay"],
    ["demo-feluda", "Feluda Samagra", "ফেলুদা সমগ্র", "bn", 800, 640, 3, "novels-literature", "demo-chhaya", "Satyajit Ray"],
    ["demo-thakurmar-jhuli", "Thakurmar Jhuli", "ঠাকুরমার ঝুলি", "bn", 180, 150, 50, "children", "demo-chhaya", "Dakshinaranjan Mitra Majumder"],
    ["demo-dictionary", "Bengali to English Dictionary", "বাংলা থেকে ইংরেজি অভিধান", "bn", 400, 340, 0, "reference", "demo-oxford", "Ashok Mukhopadhyay"],
  ];
  for (const [slug, title, title_bn, language, mrp, sale_price, stock, cat, pub, author] of books) {
    const { data: ex } = await db.from("books").select("id").eq("slug", slug).maybeSingle();
    if (ex) continue;
    const res = await db.rpc("admin_save_book", {
      p: { slug, title, title_bn, language, binding: "paperback", condition: "new", mrp, sale_price, status: "active", is_featured: stock > 30, gallery: [], preview_pages: [],
           description: "Demo listing — replace with a real book from the admin panel.", publisher: { name: pub === "demo-chhaya" ? "Chhaya Prakashani (demo)" : "Oxford University Press (demo)", slug: pub },
           authors: [{ name: author, slug: "demo-" + author.toLowerCase().replace(/[^a-z]+/g, "-") }], category_ids: [cid[cat]], on_hand: stock },
      p_actor: null,
    });
    must("book " + slug, res);
  }
  console.log("demo books ok");
}
const { count } = await db.from("books").select("id", { count: "exact", head: true });
console.log("books in DB:", count);
