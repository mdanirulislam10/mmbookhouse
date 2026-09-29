import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asService, asUser, createDb, expectError, newUser, type Db } from "./harness";

let db: Db;
let alice: string;
let staff: string;
const book: Record<string, string> = {};

async function addBook(slug: string, title: string, price: number, stock: number, mrp = price) {
  const r = await db.query<{ id: string }>(
    `insert into books (slug, title, mrp, sale_price, status) values ($1,$2,$3,$4,'active') returning id`,
    [slug, title, mrp, price],
  );
  await db.query(`update inventory set on_hand = $2, low_stock_threshold = 3 where book_id = $1`, [r.rows[0].id, stock]);
  await db.query(`update book_private set cost_price = $2 where book_id = $1`, [r.rows[0].id, price * 0.6]);
  book[slug] = r.rows[0].id;
}
const stock = async (slug: string) => (await db.query<{ on_hand: number }>(`select on_hand from inventory where book_id=$1`, [book[slug]])).rows[0].on_hand;
const svc = <T>(sql: string, params: unknown[] = []) => asService(db, () => db.query<T>(sql, params));

beforeAll(async () => {
  db = await createDb();
  alice = await newUser(db, "alice@example.com", "Alice Roy");
  staff = await newUser(db, "staff@example.com", "Staff");
  await addBook("a", "Book A", 400, 10, 500);
  await addBook("b", "Book B", 200, 2);
  await addBook("dead", "Dead Stock Book", 100, 7);
});
afterAll(async () => {
  await db.close();
});

describe("admin functions are private", () => {
  it("no admin_* function is executable by anon or authenticated", async () => {
    const r = await db.query<{ proname: string; a: boolean; u: boolean }>(
      `select p.proname, has_function_privilege('anon', p.oid, 'execute') as a, has_function_privilege('authenticated', p.oid, 'execute') as u
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'admin\\_%'`,
    );
    expect(r.rows.length).toBeGreaterThan(8);
    expect(r.rows.filter((x) => x.a || x.u).map((x) => x.proname)).toEqual([]);
  });

  it("customers get permission denied when calling them", async () => {
    await expectError(asUser(db, alice, () => db.query(`select admin_counters()`)), "permission denied");
  });
});

describe("stock", () => {
  it("adjusts stock with a movement log and refuses negatives", async () => {
    const after = (await svc<{ s: number }>(`select admin_adjust_stock($1, 5, 'restock', 'delivery from distributor', $2) as s`, [book.b, staff])).rows[0].s;
    expect(after).toBe(7);
    await expectError(svc(`select admin_adjust_stock($1, -99, 'adjust', null, $2)`, [book.b, staff]), "STOCK_NEGATIVE");
    await expectError(svc(`select admin_adjust_stock($1, 0, 'adjust', null, $2)`, [book.b, staff]), "DELTA_ZERO");
    expect((await svc<{ s: number }>(`select admin_set_stock($1, 2, 'recount', $2) as s`, [book.b, staff])).rows[0].s).toBe(2);
    const log = await db.query<{ delta: number; reason: string }>(`select delta, reason from stock_movements where book_id = $1 order by id`, [book.b]);
    expect(log.rows).toEqual([{ delta: 5, reason: "restock" }, { delta: -5, reason: "adjust" }]);
  });

  it("lists low stock items", async () => {
    const low = await svc<{ title: string }>(`select title from admin_low_stock(10)`);
    expect(low.rows.map((r) => r.title)).toContain("Book B");
    expect(low.rows.map((r) => r.title)).not.toContain("Book A");
  });
});

describe("counter (POS) sales", () => {
  it("sells at the counter, reduces stock, records a delivered/paid order", async () => {
    const res = (await svc<{ r: { order_id: string; order_no: string; total: string } }>(
      `select admin_pos_sale($1::jsonb, $2, 'cash', 'Ramesh', null) as r`,
      [JSON.stringify([{ book_id: book.a, qty: 2 }, { book_id: book.b, qty: 1, unit_price: 150 }]), staff],
    )).rows[0].r;
    expect(res.order_no).toMatch(/^POS-\d{4}-\d{5}$/);
    expect(Number(res.total)).toBe(2 * 400 + 150);
    expect(await stock("a")).toBe(8);
    expect(await stock("b")).toBe(1);
    const o = (await db.query<{ status: string; payment_status: string; channel: string }>(`select status, payment_status, channel from orders where id=$1`, [res.order_id])).rows[0];
    expect(o).toEqual({ status: "delivered", payment_status: "paid", channel: "pos" });
    expect((await db.query(`select 1 from stock_movements where order_id=$1 and reason='pos_sale'`, [res.order_id])).rows).toHaveLength(2);
  });

  it("rejects overselling, price above MRP and empty carts — atomically", async () => {
    await expectError(svc(`select admin_pos_sale($1::jsonb, $2)`, [JSON.stringify([{ book_id: book.a, qty: 1 }, { book_id: book.b, qty: 5 }]), staff]), "OUT_OF_STOCK");
    expect(await stock("a")).toBe(8);
    await expectError(svc(`select admin_pos_sale($1::jsonb, $2)`, [JSON.stringify([{ book_id: book.a, qty: 1, unit_price: 9999 }]), staff]), "PRICE_INVALID");
    await expectError(svc(`select admin_pos_sale($1::jsonb, $2)`, [JSON.stringify([]), staff]), "EMPTY_CART");
  });
});

describe("dashboard and reports", () => {
  it("summarises sales, profit and top books", async () => {
    const d = (await svc<{ d: any }>(`select admin_dashboard(30) as d`)).rows[0].d;
    expect(Number(d.today.sales)).toBe(950);
    expect(d.today.orders).toBe(1);
    expect(d.series).toHaveLength(30);
    expect(d.top_books[0].title).toBe("Book A");
    // profit = revenue - cost: A 800 - 2*240, B 150 - 120
    expect(Number(d.period.profit)).toBeCloseTo(800 - 480 + (150 - 120), 2);
  });

  it("counts things that need attention", async () => {
    const c = (await svc<{ c: Record<string, number> }>(`select admin_counters() as c`)).rows[0].c;
    expect(c.low_stock).toBeGreaterThanOrEqual(1);
    expect(c).toHaveProperty("pending_orders");
  });

  it("builds a sales report, HSN summary and dead stock list", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const rep = (await svc<{ r: any }>(`select admin_sales_report($1::date, $2::date) as r`, [today, today])).rows[0].r;
    expect(Number(rep.totals.net)).toBe(950);
    expect(rep.totals.units).toBe(3);
    expect(Number(rep.totals.profit)).toBeCloseTo(350, 2);
    expect(rep.by_channel[0].channel).toBe("pos");

    const hsn = await svc<{ hsn_code: string; total_qty: string; total_value: string; taxable_value: string }>(`select * from admin_hsn_summary($1::date, $2::date)`, [today, today]);
    expect(hsn.rows[0].hsn_code).toBe("4901");
    expect(Number(hsn.rows[0].total_qty)).toBe(3);
    expect(Number(hsn.rows[0].taxable_value)).toBe(0); // nil-rated

    const dead = await svc<{ title: string; cost_value: string }>(`select title, cost_value from admin_dead_stock(90, 10)`);
    expect(dead.rows.map((r) => r.title)).toEqual(["Dead Stock Book"]);
    expect(Number(dead.rows[0].cost_value)).toBeCloseTo(7 * 60, 2);
  });
});

describe("admin_save_book", () => {
  const base = { slug: "new-book", title: "New Book", language: "en", binding: "paperback", condition: "new", mrp: 300, sale_price: 250, status: "active", gallery: [], preview_pages: [] };

  it("creates a book with publisher, authors, categories, cost and opening stock atomically", async () => {
    const cat = await db.query<{ id: string }>(`insert into categories (slug, name) values ('c1','C1') returning id`);
    const p = { ...base, publisher: { name: "Chhaya Prakashani", slug: "chhaya-prakashani" }, authors: [{ name: "A. Writer", slug: "a-writer" }, { name: "B. Editor", slug: "b-editor", role: "editor" }], category_ids: [cat.rows[0].id], cost_price: 180, rack_location: "R2-S3", on_hand: 12, low_stock_threshold: 4 };
    const id = (await svc<{ id: string }>(`select admin_save_book($1::jsonb, $2) as id`, [JSON.stringify(p), staff])).rows[0].id;

    const v = (await db.query<any>(`select title, publisher_name, author_names, on_hand, low_stock, price from v_books where id = $1`, [id])).rows[0];
    expect(v).toMatchObject({ title: "New Book", publisher_name: "Chhaya Prakashani", author_names: "A. Writer", on_hand: 12, low_stock: false });
    expect((await db.query<any>(`select cost_price, rack_location from book_private where book_id=$1`, [id])).rows[0]).toEqual({ cost_price: "180.00", rack_location: "R2-S3" });
    expect((await db.query(`select 1 from book_categories where book_id=$1`, [id])).rows).toHaveLength(1);
    expect((await db.query<any>(`select search_text from books where id=$1`, [id])).rows[0].search_text).toContain("chhaya prakashani");
    expect((await db.query(`select 1 from stock_movements where book_id=$1 and reason='restock'`, [id])).rows).toHaveLength(1);
  });

  it("edits a book: changes fields, replaces authors, keeps cost when not supplied, reuses publishers/authors", async () => {
    const id = (await db.query<{ id: string }>(`select id from books where slug='new-book'`)).rows[0].id;
    const edit = { ...base, id, title: "New Book (2nd ed)", sale_price: 200, publisher: { name: "chhaya prakashani", slug: "other-slug" }, authors: [{ name: "A. WRITER", slug: "a-writer-2" }], category_ids: [] };
    await svc(`select admin_save_book($1::jsonb, $2)`, [JSON.stringify(edit), staff]);
    const b = (await db.query<any>(`select title, sale_price from books where id=$1`, [id])).rows[0];
    expect(b).toEqual({ title: "New Book (2nd ed)", sale_price: "200.00" });
    expect((await db.query(`select count(*)::int as n from publishers where lower(name)='chhaya prakashani'`)).rows[0]).toEqual({ n: 1 });
    expect((await db.query(`select count(*)::int as n from authors where lower(name)='a. writer'`)).rows[0]).toEqual({ n: 1 });
    expect((await db.query(`select 1 from book_authors where book_id=$1`, [id])).rows).toHaveLength(1);
    expect((await db.query(`select 1 from book_categories where book_id=$1`, [id])).rows).toHaveLength(0);
    expect((await db.query<any>(`select cost_price from book_private where book_id=$1`, [id])).rows[0].cost_price).toBe("180.00");
    // a later save must not touch opening stock
    expect((await db.query<any>(`select on_hand from inventory where book_id=$1`, [id])).rows[0].on_hand).toBe(12);
  });

  it("never merges two different people who slugify the same", async () => {
    const id = (await svc<{ id: string }>(`select admin_save_book($1::jsonb, $2) as id`, [JSON.stringify({ ...base, slug: "collide", authors: [{ name: "A Writer", slug: "a-writer" }] }), staff])).rows[0].id;
    const names = (await db.query<{ name: string }>(`select a.name from book_authors ba join authors a on a.id = ba.author_id where ba.book_id = $1`, [id])).rows.map((r) => r.name);
    expect(names).toEqual(["A Writer"]);
    expect((await db.query(`select 1 from authors where name in ('A. Writer', 'A Writer')`)).rows).toHaveLength(2);
  });

  it("enforces constraints: duplicate slug, price above MRP", async () => {
    await expectError(svc(`select admin_save_book($1::jsonb, $2)`, [JSON.stringify({ ...base, slug: "a" }), staff]), "duplicate key");
    await expectError(svc(`select admin_save_book($1::jsonb, $2)`, [JSON.stringify({ ...base, slug: "pricey", sale_price: 999 }), staff]), "violates check constraint");
  });

  it("bulk price tool changes a publisher's books by percentage and respects MRP", async () => {
    const pub = (await db.query<{ id: string }>(`select id from publishers where slug='chhaya-prakashani'`)).rows[0].id;
    const n = (await svc<{ n: number }>(`select admin_bulk_price($1, null, 'discount_pct', 10, $2) as n`, [pub, staff])).rows[0].n;
    expect(n).toBe(1);
    expect((await db.query<any>(`select sale_price from books where slug='new-book'`)).rows[0].sale_price).toBe("270.00");
    await svc(`select admin_bulk_price($1, null, 'adjust_pct', 50, $2)`, [pub, staff]);
    expect((await db.query<any>(`select sale_price from books where slug='new-book'`)).rows[0].sale_price).toBe("300.00"); // capped at MRP
    await expectError(svc(`select admin_bulk_price(null, null, 'discount_pct', 10, $1)`, [staff]), "SCOPE_REQUIRED");
  });
});
