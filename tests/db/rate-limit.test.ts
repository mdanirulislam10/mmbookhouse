import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asService, createDb, type Db } from "./harness";

let db: Db;
beforeAll(async () => {
  db = await createDb();
});
afterAll(async () => {
  await db.close();
});

const hit = (key: string, max: number, windowSec: number, blockSec: number) =>
  asService(db, async () => (await db.query<{ hit_rate_limit: boolean }>(`select public.hit_rate_limit($1,$2,$3,$4)`, [key, max, windowSec, blockSec])).rows[0].hit_rate_limit);

describe("hit_rate_limit as used for the e-mail code lock", () => {
  it("lets four wrong codes through and locks on the fifth (max 4)", async () => {
    // true = allowed, false = blocked. The auth action reports "locked" when this returns false.
    const results: boolean[] = [];
    for (let i = 0; i < 7; i++) results.push(await hit("otpfail:x@example.com", 4, 21_600, 21_600));
    expect(results).toEqual([true, true, true, true, false, false, false]);
  });

  it("stays locked for the block period and a reset frees the address", async () => {
    expect(await hit("otpfail:x@example.com", 4, 21_600, 21_600)).toBe(false);
    await asService(db, () => db.query(`select public.reset_rate_limit($1)`, ["otpfail:x@example.com"]));
    expect(await hit("otpfail:x@example.com", 4, 21_600, 21_600)).toBe(true);
  });

  it("keeps addresses apart", async () => {
    for (let i = 0; i < 6; i++) await hit("otpfail:a@example.com", 4, 21_600, 21_600);
    expect(await hit("otpfail:b@example.com", 4, 21_600, 21_600)).toBe(true);
  });
});
