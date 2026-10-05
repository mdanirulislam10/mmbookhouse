import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asService, asUser, createDb, expectError, newUser, type Db } from "./harness";

let db: Db;
let pub: string;
let other: string;
beforeAll(async () => {
  db = await createDb();
  pub = await newUser(db, "pub@example.com", "Publisher");
  other = await newUser(db, "other@example.com", "Other");
});
afterAll(async () => {
  await db.close();
});

const application = {
  kind: "publisher",
  name: "Dhaka Prakashani",
  contact_person: "Rahim",
  email: "Pub@Example.com",
  phone: "+880 1711 000000",
  country: "Bangladesh",
  address: "Banglabazar, Dhaka",
  catalogue: "Bengali novels and children's books, about 120 titles",
};
const book = { title: "Nodir Kotha", authors: "A. Rahman", mrp: 300, supply_price: 4, currency: "USD", language: "bn" };

const apply = (userId: string | null, p = application) =>
  asUser(db, userId, () => db.query(`select public.apply_partner($1::jsonb, '2026-10-05')`, [JSON.stringify(p)]));
const submit = (userId: string, b: object = book) => asUser(db, userId, () => db.query(`select public.submit_partner_book($1::jsonb)`, [JSON.stringify(b)]));
const status = async (userId: string) =>
  asService(db, async () => (await db.query<{ status: string }>(`select status from public.partners where user_id = $1`, [userId])).rows[0]?.status);

describe("partner applications", () => {
  it("guests cannot apply; signed-in users apply as pending", async () => {
    await expectError(apply(null), "permission denied");
    await apply(pub);
    expect(await status(pub)).toBe("pending");
    const row = await asService(db, async () => (await db.query<{ email: string }>(`select email from public.partners where user_id = $1`, [pub])).rows[0]);
    expect(row.email).toBe("pub@example.com");
  });

  it("an applicant sees only their own application and cannot approve themselves", async () => {
    await apply(other, { ...application, name: "Other House" });
    const seen = await asUser(db, pub, async () => (await db.query(`select name from public.partners`)).rows);
    expect(seen).toEqual([{ name: "Dhaka Prakashani" }]);
    const upd = await asUser(db, pub, () => db.query(`update public.partners set status = 'approved'`));
    expect(upd.affectedRows ?? 0).toBe(0);
    expect(await status(pub)).toBe("pending");
  });

  it("pending partners cannot submit books", async () => {
    await expectError(submit(pub), "PARTNER_NOT_APPROVED");
  });

  it("approved partners submit books; re-applying cannot reset an approval", async () => {
    await asService(db, () => db.query(`update public.partners set status = 'approved' where user_id = $1`, [pub]));
    await submit(pub);
    const subs = await asUser(db, pub, async () => (await db.query<{ status: string; currency: string }>(`select status, currency from public.partner_submissions`)).rows);
    expect(subs).toEqual([{ status: "pending", currency: "USD" }]);
    expect(await asUser(db, other, async () => (await db.query(`select id from public.partner_submissions`)).rows)).toHaveLength(0);
    await expectError(apply(pub), "PARTNER_EXISTS");
  });

  it("rejects invalid books and a rejected applicant can apply again", async () => {
    await expectError(submit(pub, { ...book, isbn: "123" }), "partner_submissions_isbn_check");
    await asService(db, () => db.query(`update public.partners set status = 'rejected', admin_note = 'incomplete' where user_id = $1`, [other]));
    await apply(other, { ...application, name: "Other House" });
    expect(await status(other)).toBe("pending");
  });
});
