import { describe, expect, it } from "vitest";
import { MAX_RECENT, parseRecent, pushRecent, serializeRecent } from "@/lib/recent";

describe("recently viewed cookie", () => {
  it("moves a re-viewed book to the front without duplicating it", () => {
    expect(pushRecent(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
    expect(pushRecent([], "a")).toEqual(["a"]);
  });

  it("caps the list", () => {
    let list: string[] = [];
    for (let i = 0; i < 30; i++) list = pushRecent(list, `book-${i}`);
    expect(list).toHaveLength(MAX_RECENT);
    expect(list[0]).toBe("book-29");
  });

  it("round-trips slugs including Bengali and commas", () => {
    const slugs = ["feluda-samagra", "বাংলা-বই", "odd,slug"];
    expect(parseRecent(serializeRecent(slugs))).toEqual(slugs);
  });

  it("survives junk and hostile values", () => {
    expect(parseRecent(undefined)).toEqual([]);
    expect(parseRecent("%E0%A4%A,ok,,ok,%00bad")).toEqual(["ok"]);
    expect(parseRecent("x".repeat(500))).toEqual([]);
    expect(parseRecent(Array.from({ length: 100 }, (_, i) => `s${i}`).join(","))).toHaveLength(MAX_RECENT);
  });
});
