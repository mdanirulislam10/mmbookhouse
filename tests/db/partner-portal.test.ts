import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asService, asUser, createDb, expectError, newUser, type Db } from "./harness";

let db: Db;
let pub: string;
let stranger: string;
let partnerId: string;
let bookId: string;
let otherBook: string;

async function order(no: string, status: string, book: string, qty: number, placedAt = "now()") {
  const o = await db.query<{ id: string }>(
    `insert into orders (order_no, status, payment_method, subtotal, total, ship_name, ship_phone, placed_at)
     values ($1, $2, 'cod', 100, 100, 'Buyer', '9800000000', ${placedAt}) returning id`,
    [no, status],
  );
  await db.query(`insert into order_items (order_id, book_id, title, unit_price, mrp, qty, line_total) values ($1, $2, 'x', 100, 100, $3, $4)`, [o.rows[0].id, book, qty, 100 * qty]);
}

beforeAll(async () => {
  db = await createDb();
  pub = await newUser(db, "pub@example.com", "Publisher");
  stranger = await newUser(db, "s@example.com", "Stranger");
  bookId = (await db.query<{ id: string }>(`insert into books (slug, title, title_bn, mrp, sale_price, status) values ('nodi', 'Nodi', 'নদী', 300, 270, 'active') returning id`)).rows[0].id;
  otherBook = (await db.query<{ id: string }>(`insert into books (slug, title, mrp, sale_price, status) values ('other', 'Other', 200, 200, 'active') returning id`)).rows[0].id;
  partnerId = (
    await db.query<{ id: string }>(
      `insert into partners (user_id, kind, name, contact_person, email, phone, country, address, catalogue, terms_version, status)
       values ($1, 'publisher', 'Nodi Prakashani', 'Rahim', 'pub@example.com', '+8801711000000', 'Bangladesh', 'Dhaka, Bangladesh', 'Bengali novels, 20 titles', 'v1', 'approved') returning id`,
      [pub],
    )
  ).rows[0].id;
  await db.query(
    `insert into partner_submissions (partner_id, title, authors, mrp, supply_price, currency, status, book_id, reviewed_at)
     values ($1, 'Nodi', 'A. Rahman', 300, 150, 'INR', 'approved', $2, now() - interval '1 day')`,
    [partnerId, bookId],
  );
  await order("OLD-1", "delivered", bookId, 9, "now() - interval '10 days'"); // before acceptance: not counted
  await order("D-1", "delivered", bookId, 2);
  await order("D-2", "delivered", bookId, 1);
  await order("P-1", "confirmed", bookId, 4);
  await order("C-1", "cancelled", bookId, 5);
  await order("X-1", "delivered", otherBook, 7); // not the partner's book
});
afterAll(async () => {
  await db.close();
});

describe("partner statement", () => {
  it("counts delivered and in-process copies of the partner's accepted books only", async () => {
    const rows = await asUser(db, pub, async () => (await db.query<{ slug: string; sold: number; pending: number; earned: string }>(`select slug, sold, pending, earned from my_partner_sales()`)).rows);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ slug: "nodi", sold: 3, pending: 4 });
    expect(Number(rows[0].earned)).toBe(450);
  });

  it("other users get an empty statement and cannot query another partner directly", async () => {
    const rows = await asUser(db, stranger, async () => (await db.query(`select * from my_partner_sales()`)).rows);
    expect(rows).toHaveLength(0);
    await expectError(asUser(db, stranger, () => db.query(`select * from partner_sales_for($1)`, [partnerId])), "permission denied");
  });

  it("partners see only their own payouts", async () => {
    await asService(db, () => db.query(`insert into partner_payouts (partner_id, amount, currency, reference) values ($1, 300, 'INR', 'NEFT-1')`, [partnerId]));
    expect(await asUser(db, pub, async () => (await db.query(`select amount from partner_payouts`)).rows)).toHaveLength(1);
    expect(await asUser(db, stranger, async () => (await db.query(`select amount from partner_payouts`)).rows)).toHaveLength(0);
    const ins = asUser(db, pub, () => db.query(`insert into partner_payouts (partner_id, amount) values ($1, 999)`, [partnerId]));
    await expectError(ins, "row-level security");
  });

  it("partners update their contact details but not their name or status", async () => {
    await asUser(db, pub, () =>
      db.query(`select update_my_partner_profile($1::jsonb)`, [
        JSON.stringify({ contact_person: "Karim", email: "New@Example.com", phone: "+8801800000000", country: "Bangladesh", address: "Banglabazar, Dhaka", catalogue: "Novels and poetry", name: "Hacked", status: "approved" }),
      ]),
    );
    const p = await asService(db, async () => (await db.query<{ name: string; contact_person: string; email: string }>(`select name, contact_person, email from partners where id = $1`, [partnerId])).rows[0]);
    expect(p).toEqual({ name: "Nodi Prakashani", contact_person: "Karim", email: "new@example.com" });
    await expectError(asUser(db, stranger, () => db.query(`select update_my_partner_profile('{}'::jsonb)`)), "NOT_FOUND");
  });
});
