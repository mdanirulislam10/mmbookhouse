import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asService, asUser, createDb, expectError, newUser, type Db } from "./harness";

let db: Db;
let alice: string;
let bob: string;
const book: Record<string, string> = {};
let addrLocal: string;
let addrDelhi: string;

async function addBook(
  slug: string,
  title: string,
  opts: { mrp?: number; price?: number; stock?: number; status?: string; title_bn?: string; lang?: string } = {},
) {
  const r = await db.query<{ id: string }>(
    `insert into books (slug, title, title_bn, mrp, sale_price, status, language, cover_url)
     values ($1,$2,$3,$4,$5,$6::book_status,$7,'https://x/c.jpg') returning id`,
    [slug, title, opts.title_bn ?? null, opts.mrp ?? 500, opts.price ?? 400, opts.status ?? "active", opts.lang ?? "en"],
  );
  const id = r.rows[0].id;
  await db.query(`update inventory set on_hand = $2 where book_id = $1`, [id, opts.stock ?? 10]);
  await db.query(`update book_private set cost_price = $2 where book_id = $1`, [id, (opts.price ?? 400) * 0.7]);
  book[slug] = id;
  return id;
}

beforeAll(async () => {
  db = await createDb();
  alice = await newUser(db, "alice@example.com", "Alice Roy");
  bob = await newUser(db, "bob@example.com", "Bob Sen");

  await addBook("wbcs-polity", "WBCS Indian Polity Made Easy", { mrp: 600, price: 450, stock: 5 });
  await addBook("wbcs-history", "WBCS History Guide", { mrp: 500, price: 400, stock: 2 });
  await addBook("madhyamik-math", "Madhyamik Ganit Prakash", { mrp: 300, price: 250, stock: 1, title_bn: "মাধ্যমিক গণিত প্রকাশ", lang: "bn" });
  await addBook("draft-book", "Secret Draft", { status: "draft" });
  await addBook("archived-book", "Old Edition", { status: "archived" });
  await addBook("sold-out", "Sold Out Title", { stock: 0 });

  const author = await db.query<{ id: string }>(
    `insert into authors (slug, name, name_bn) values ('laxmikanth','M Laxmikanth','এম লক্ষ্মীকান্ত') returning id`,
  );
  await db.query(`insert into book_authors (book_id, author_id) values ($1, $2)`, [book["wbcs-polity"], author.rows[0].id]);

  const cat = await db.query<{ id: string }>(`insert into categories (slug, name) values ('wbcs','WBCS') returning id`);
  const sub = await db.query<{ id: string }>(
    `insert into categories (slug, name, parent_id) values ('wbcs-history','WBCS History',$1) returning id`,
    [cat.rows[0].id],
  );
  await db.query(`insert into book_categories values ($1,$2), ($3,$4)`, [book["wbcs-polity"], cat.rows[0].id, book["wbcs-history"], sub.rows[0].id]);
  book.__cat = cat.rows[0].id;

  const a1 = await db.query<{ id: string }>(
    `insert into addresses (user_id, full_name, phone, line1, city, pincode, is_default)
     values ($1,'Alice Roy','9800000001','12 Station Rd','Local Town','732101', true) returning id`,
    [alice],
  );
  addrLocal = a1.rows[0].id;
  const a2 = await db.query<{ id: string }>(
    `insert into addresses (user_id, full_name, phone, line1, city, state, pincode)
     values ($1,'Alice Roy','9800000001','5 CP','Delhi','Delhi','110001') returning id`,
    [alice],
  );
  addrDelhi = a2.rows[0].id;
});
afterAll(async () => {
  await db.close();
});

type PlaceArgs = { addr?: string | null; pay?: string; ful?: string; coupon?: string | null; items?: unknown };
const place = (uid: string | null, args: PlaceArgs) =>
  asUser(db, uid, () =>
    db.query<{ r: { order_id: string; order_no: string; total: string } }>(
      `select place_order($1::uuid, $2, $3, $4, null, $5::jsonb) as r`,
      [args.addr ?? null, args.pay ?? "cod", args.ful ?? "delivery", args.coupon ?? null, args.items ? JSON.stringify(args.items) : null],
    ),
  );

const stock = async (slug: string) =>
  (await db.query<{ on_hand: number }>(`select on_hand from inventory where book_id = $1`, [book[slug]])).rows[0].on_hand;

describe("catalog visibility and privacy", () => {
  it("anon sees only active books through the view", async () => {
    const r = await asUser(db, null, () => db.query<{ slug: string }>(`select slug from v_books order by slug`));
    const slugs = r.rows.map((x) => x.slug);
    expect(slugs).toContain("wbcs-polity");
    expect(slugs).not.toContain("draft-book");
    expect(slugs).not.toContain("archived-book");
  });

  it("wholesale cost is never visible to customers", async () => {
    const r = await asUser(db, alice, () => db.query(`select * from book_private`));
    expect(r.rows).toHaveLength(0);
  });

  it("a live flash deal lowers the price, an expired one does not", async () => {
    await db.query(
      `insert into flash_deals (book_id, deal_price, starts_at, ends_at) values ($1, 300, now() - interval '1 hour', now() + interval '1 hour')`,
      [book["wbcs-polity"]],
    );
    await db.query(
      `insert into flash_deals (book_id, deal_price, starts_at, ends_at) values ($1, 100, now() - interval '3 hour', now() - interval '2 hour')`,
      [book["wbcs-history"]],
    );
    const r = await db.query<{ slug: string; price: string; discount_pct: number }>(
      `select slug, price, discount_pct from v_books where slug in ('wbcs-polity','wbcs-history')`,
    );
    const by = Object.fromEntries(r.rows.map((x) => [x.slug, x]));
    expect(Number(by["wbcs-polity"].price)).toBe(300);
    expect(by["wbcs-polity"].discount_pct).toBe(50);
    expect(Number(by["wbcs-history"].price)).toBe(400);
    await db.query(`delete from flash_deals`);
  });

  it("rejects sale prices above MRP and duplicate ISBNs", async () => {
    await expect(db.query(`insert into books (slug,title,mrp,sale_price) values ('bad','Bad',100,200)`)).rejects.toThrow();
    await db.query(`update books set isbn = '9788123456789' where slug = 'wbcs-history'`);
    await expect(db.query(`update books set isbn = '9788123456789' where slug = 'wbcs-polity'`)).rejects.toThrow();
  });
});

describe("search", () => {
  const search = async (
    q: string | null,
    extra: Partial<{ cat: string; sort: string; inStock: boolean; min: number; max: number }> = {},
  ) =>
    (
      await asUser(db, null, () =>
        db.query<{ slug: string; total_count: string }>(
          `select slug, total_count from search_books($1, $2::uuid, $3, $4, null, $5, $6)`,
          [q, extra.cat ?? null, extra.min ?? null, extra.max ?? null, extra.inStock ?? false, extra.sort ?? "relevance"],
        ),
      )
    ).rows;

  it("finds by title words in any order and by author", async () => {
    expect((await search("polity wbcs")).map((r) => r.slug)).toContain("wbcs-polity");
    expect((await search("laxmikanth")).map((r) => r.slug)).toEqual(["wbcs-polity"]);
  });

  it("tolerates typos", async () => {
    expect((await search("polty")).map((r) => r.slug)).toContain("wbcs-polity");
  });

  it("supports Bengali text", async () => {
    expect((await search("গণিত")).map((r) => r.slug)).toEqual(["madhyamik-math"]);
    expect((await search("লক্ষ্মীকান্ত")).map((r) => r.slug)).toEqual(["wbcs-polity"]);
  });

  it("never returns drafts, and escapes LIKE wildcards", async () => {
    expect((await search("secret")).length).toBe(0);
    expect((await search("%")).length).toBe(0);
  });

  it("filters by category including sub-categories, price and stock", async () => {
    const inCat = (await search(null, { cat: book.__cat })).map((r) => r.slug).sort();
    expect(inCat).toEqual(["wbcs-history", "wbcs-polity"]);
    expect((await search(null, { min: 420 })).map((r) => r.slug)).toEqual(["wbcs-polity"]);
    expect((await search(null, { inStock: true })).map((r) => r.slug)).not.toContain("sold-out");
  });

  it("sorts and reports total count", async () => {
    const rows = (
      await asUser(db, null, () =>
        db.query<{ price: string; total_count: string }>(`select price, total_count from search_books(null,null,null,null,null,false,'price_asc')`),
      )
    ).rows;
    const prices = rows.map((r) => Number(r.price));
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
    expect(Number(rows[0].total_count)).toBe(4);
  });
});

describe("place_order", () => {
  it("requires login", async () => {
    await expectError(place(null, { addr: addrLocal }), "permission denied");
  });

  it("prices on the server, applies free-delivery threshold and decrements stock", async () => {
    await asUser(db, alice, () =>
      db.query(`insert into cart_items (user_id, book_id, qty) values ($1,$2,1), ($1,$3,1)`, [alice, book["wbcs-polity"], book["wbcs-history"]]),
    );
    const res = (await place(alice, { addr: addrLocal })).rows[0].r;
    expect(Number(res.total)).toBe(850); // 450 + 400, local zone free above 299
    expect(res.order_no).toMatch(/^MMB-\d{4}-\d{5}$/);
    expect(await stock("wbcs-polity")).toBe(4);
    expect(await stock("wbcs-history")).toBe(1);
    const cart = await db.query(`select * from cart_items where user_id = $1`, [alice]);
    expect(cart.rows).toHaveLength(0);
    const ev = await db.query(`select status from order_events where order_id = $1`, [res.order_id]);
    expect(ev.rows).toHaveLength(1);
    const cost = await db.query(`select unit_cost from order_item_costs`);
    expect(cost.rows.length).toBe(2);
  });

  it("charges the local-zone fee under the threshold, and cancel restocks", async () => {
    const res = (await place(alice, { addr: addrLocal, items: [{ book_id: book["madhyamik-math"], qty: 1 }] })).rows[0].r;
    expect(Number(res.total)).toBe(280); // 250 < 299 -> +30
    expect(await stock("madhyamik-math")).toBe(0);
    await db.query(`select admin_set_order_status($1, 'cancelled', 'test', null, true)`, [res.order_id]);
    expect(await stock("madhyamik-math")).toBe(1);
  });

  it("never oversells and is atomic", async () => {
    await expectError(
      place(bob, { addr: null, ful: "pickup", items: [{ book_id: book["wbcs-history"], qty: 2 }, { book_id: book["wbcs-polity"], qty: 1 }] }),
      "OUT_OF_STOCK",
    );
    expect(await stock("wbcs-history")).toBe(1);
    expect(await stock("wbcs-polity")).toBe(4);
    await expectError(place(bob, { ful: "pickup", items: [{ book_id: book["sold-out"], qty: 1 }] }), "OUT_OF_STOCK");
    await expectError(place(bob, { ful: "pickup", items: [{ book_id: book["draft-book"], qty: 1 }] }), "BOOK_UNAVAILABLE");
    await expectError(place(bob, { ful: "pickup", items: [{ book_id: book["wbcs-polity"], qty: 999 }] }), "QTY_INVALID");
    // No phone on file yet, so a pickup order has nobody to call.
    await expectError(place(bob, { ful: "pickup", items: [{ book_id: book["wbcs-polity"], qty: 1 }] }), "CONTACT_REQUIRED");
  });

  it("blocks COD outside the COD zone and using someone else's address", async () => {
    await expectError(place(alice, { addr: addrDelhi, items: [{ book_id: book["wbcs-polity"], qty: 1 }] }), "COD_NOT_AVAILABLE_HERE");
    const ok = (await place(alice, { addr: addrDelhi, pay: "upi", items: [{ book_id: book["wbcs-polity"], qty: 1 }] })).rows[0].r;
    expect(Number(ok.total)).toBe(450 + 90);
    await db.query(`select admin_set_order_status($1, 'cancelled', 'cleanup', null, true)`, [ok.order_id]);
    await expectError(place(bob, { addr: addrLocal, items: [{ book_id: book["wbcs-polity"], qty: 1 }] }), "ADDRESS_INVALID");
  });

  it("applies and reverses coupons, honouring per-user limits", async () => {
    await db.query(
      `insert into coupons (code, kind, value, min_order, per_user_limit, usage_limit)
       values ('WBCS10','percent',10,300,1,5), ('FLAT50','flat',50,0,1,5), ('EXPIRED','flat',50,0,1,5)`,
    );
    await db.query(`update coupons set ends_at = now() - interval '1 day' where code = 'EXPIRED'`);
    const items = [{ book_id: book["wbcs-polity"], qty: 1 }];
    await expectError(place(alice, { addr: addrLocal, items, coupon: "NOPE" }), "COUPON_INVALID");
    await expectError(place(alice, { addr: addrLocal, items, coupon: "EXPIRED" }), "COUPON_EXPIRED");
    const o = (await place(alice, { addr: addrLocal, items, coupon: "wbcs10" })).rows[0].r;
    expect(Number(o.total)).toBe(405); // 450 - 45 (10%), free delivery
    await expectError(place(alice, { addr: addrLocal, items, coupon: "WBCS10" }), "COUPON_ALREADY_USED");
    expect((await db.query<{ used_count: number }>(`select used_count from coupons where code='WBCS10'`)).rows[0].used_count).toBe(1);
    await asUser(db, alice, () => db.query(`select cancel_my_order($1)`, [o.order_id]));
    expect((await db.query<{ used_count: number }>(`select used_count from coupons where code='WBCS10'`)).rows[0].used_count).toBe(0);
    expect(await stock("wbcs-polity")).toBe(4);
  });

  it("enforces the COD limit and maintenance mode", async () => {
    await db.query(`update site_settings set value = jsonb_set(value, '{cod_max_order}', '100') where key = 'payment'`);
    await expectError(place(alice, { addr: addrLocal, items: [{ book_id: book["wbcs-polity"], qty: 1 }] }), "COD_LIMIT_EXCEEDED");
    await db.query(`update site_settings set value = jsonb_set(value, '{cod_max_order}', '3000') where key = 'payment'`);
    await db.query(`update site_settings set value = jsonb_set(value, '{enabled}', 'true') where key = 'maintenance'`);
    await expectError(place(alice, { addr: addrLocal, items: [{ book_id: book["wbcs-polity"], qty: 1 }] }), "STORE_MAINTENANCE");
    await db.query(`update site_settings set value = jsonb_set(value, '{enabled}', 'false') where key = 'maintenance'`);
  });
});

describe("order lifecycle", () => {
  let orderId: string;

  it("UPI: customer submits UTR, staff approves, pipeline runs to delivery", async () => {
    orderId = (await place(alice, { addr: addrLocal, pay: "upi", items: [{ book_id: book["wbcs-polity"], qty: 1 }] })).rows[0].r.order_id;
    await expectError(asUser(db, bob, () => db.query(`select submit_utr($1, 'ABCDEF123456')`, [orderId])), "ORDER_NOT_FOUND");
    await expectError(asUser(db, alice, () => db.query(`select submit_utr($1, 'short')`, [orderId])), "UTR_INVALID");
    await asUser(db, alice, () => db.query(`select submit_utr($1, 'ABCDEF123456')`, [orderId]));
    expect(
      (await db.query<{ payment_status: string }>(`select payment_status from orders where id=$1`, [orderId])).rows[0].payment_status,
    ).toBe("pending_verification");
    await expectError(asUser(db, alice, () => db.query(`select submit_utr($1, 'ABCDEF123456')`, [orderId])), "PAYMENT_ALREADY_SUBMITTED");

    await asService(db, () => db.query(`select admin_review_payment($1, true, null, null)`, [orderId]));
    const o = (await db.query<{ status: string; payment_status: string }>(`select status, payment_status from orders where id=$1`, [orderId])).rows[0];
    expect(o).toEqual({ status: "confirmed", payment_status: "paid" });

    await expectError(asService(db, () => db.query(`select admin_set_order_status($1,'delivered',null,null)`, [orderId])), "STATUS_TRANSITION_INVALID");
    for (const s of ["processing", "dispatched", "delivered"]) {
      await asService(db, () => db.query(`select admin_set_order_status($1,$2,null,null)`, [orderId, s]));
    }
    const done = (await db.query<{ status: string }>(`select status from orders where id=$1`, [orderId])).rows[0];
    expect(done.status).toBe("delivered");
    const timeline = await db.query<{ status: string }>(`select status from order_events where order_id=$1 order by id`, [orderId]);
    expect(timeline.rows.map((r) => r.status)).toEqual(["pending", "pending", "confirmed", "processing", "dispatched", "delivered"]);
  });

  it("customers cannot call staff functions or edit orders", async () => {
    await expectError(asUser(db, alice, () => db.query(`select admin_set_order_status($1,'cancelled',null,null)`, [orderId])), "permission denied");
    await asUser(db, alice, () => db.query(`update orders set total = 1 where id = $1`, [orderId])); // RLS: silently affects 0 rows
    expect(Number((await db.query<{ total: string }>(`select total from orders where id = $1`, [orderId])).rows[0].total)).toBeGreaterThan(1);
    const other = await asUser(db, bob, () => db.query(`select * from orders`));
    expect(other.rows).toHaveLength(0);
  });

  it("COD becomes paid on delivery; cancel after dispatch is refused", async () => {
    const id = (await place(alice, { addr: addrLocal, items: [{ book_id: book["wbcs-polity"], qty: 1 }] })).rows[0].r.order_id;
    for (const s of ["processing", "dispatched"]) {
      await asService(db, () => db.query(`select admin_set_order_status($1,$2,null,null)`, [id, s]));
    }
    await expectError(asUser(db, alice, () => db.query(`select cancel_my_order($1)`, [id])), "ORDER_NOT_CANCELLABLE");
    await asService(db, () => db.query(`select admin_set_order_status($1,'delivered',null,null)`, [id]));
    expect((await db.query<{ payment_status: string }>(`select payment_status from orders where id=$1`, [id])).rows[0].payment_status).toBe("paid");
    const before = await stock("wbcs-polity");
    await asService(db, () => db.query(`select admin_set_order_status($1,'returned','RTO damaged',null,false)`, [id]));
    expect(await stock("wbcs-polity")).toBe(before);
  });

  it("public tracking needs the matching phone", async () => {
    const no = (await db.query<{ order_no: string }>(`select order_no from orders where id=$1`, [orderId])).rows[0].order_no;
    const ok = await asUser(db, null, () => db.query<{ t: { status: string; events: { note: string }[] } }>(`select track_order($1, '+91 98000-00001') as t`, [no]));
    expect(ok.rows[0].t.status).toBe("delivered");
    expect(ok.rows[0].t.events.every((e) => !String(e.note).startsWith("UTR"))).toBe(true);
    const bad = await asUser(db, null, () => db.query<{ t: unknown }>(`select track_order($1, '9999999999') as t`, [no]));
    expect(bad.rows[0].t).toBeNull();
  });
});

describe("reviews", () => {
  it("customers cannot self-publish; verified flag follows real purchases; ratings roll up", async () => {
    const r = await asUser(db, alice, () =>
      db.query<{ id: string }>(
        `insert into reviews (book_id, user_id, rating, body, status, verified_purchase) values ($1,$2,5,'Great','published', false) returning id`,
        [book["wbcs-polity"], alice],
      ),
    );
    const row = (
      await db.query<{ status: string; verified_purchase: boolean; reviewer_name: string }>(
        `select status, verified_purchase, reviewer_name from reviews where id=$1`,
        [r.rows[0].id],
      )
    ).rows[0];
    expect(row.status).toBe("pending");
    expect(row.verified_purchase).toBe(true); // Alice has a delivered order
    expect(row.reviewer_name).toBe("Alice");
    expect((await db.query<{ rating_count: number }>(`select rating_count from books where slug='wbcs-polity'`)).rows[0].rating_count).toBe(0);

    await asService(db, () => db.query(`update reviews set status='published' where id=$1`, [r.rows[0].id]));
    const b = (await db.query<{ rating_avg: string; rating_count: number }>(`select rating_avg, rating_count from books where slug='wbcs-polity'`)).rows[0];
    expect(b.rating_count).toBe(1);
    expect(Number(b.rating_avg)).toBe(5);

    await expectError(
      asUser(db, alice, () => db.query(`insert into reviews (book_id,user_id,rating) values ($1,$2,4)`, [book["wbcs-polity"], alice])),
      "duplicate key",
    );
    const bobReview = await asUser(db, bob, () =>
      db.query<{ verified_purchase: boolean }>(`insert into reviews (book_id, user_id, rating) values ($1,$2,3) returning verified_purchase`, [
        book["wbcs-polity"],
        bob,
      ]),
    );
    expect(bobReview.rows[0].verified_purchase).toBe(false);
  });
});

describe("rate limiting", () => {
  it("blocks after the limit and can be reset", async () => {
    const hit = async () =>
      (await asService(db, () => db.query<{ ok: boolean }>(`select hit_rate_limit('login:1.2.3.4', 3, 60, 900) as ok`))).rows[0].ok;
    expect([await hit(), await hit(), await hit(), await hit(), await hit()]).toEqual([true, true, true, false, false]);
    await asService(db, () => db.query(`select reset_rate_limit('login:1.2.3.4')`));
    expect(await hit()).toBe(true);
  });
});

describe("addresses", () => {
  it("keeps exactly one default and validates pincodes", async () => {
    await asUser(db, alice, () => db.query(`update addresses set is_default = true where id = $1`, [addrDelhi]));
    const d = await db.query<{ id: string }>(`select id from addresses where user_id=$1 and is_default`, [alice]);
    expect(d.rows.map((r) => r.id)).toEqual([addrDelhi]);
    await expect(
      db.query(`insert into addresses (user_id, full_name, phone, line1, city, pincode) values ($1,'A B','9800000001','line one','x','12')`, [alice]),
    ).rejects.toThrow();
  });
});
