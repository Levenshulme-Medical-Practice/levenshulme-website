import { test } from "node:test";
import assert from "node:assert/strict";
import { computeOrder, scoreTiles } from "./ranking.mjs";

const tiles = [
  { id: "a", seedRank: 1 }, { id: "b", seedRank: 2 }, { id: "c", seedRank: 3 }, { id: "safety", seedRank: 0, pinned: true },
];

test("no data keeps the seed order with pinned first", () => {
  const { order } = computeOrder({ tiles, dailyCounts: [], today: "2026-11-02" });
  assert.deepEqual(order, ["safety", "a", "b", "c"]);
});

test("a clearly more popular tile moves up", () => {
  const dailyCounts = [{ date: "2026-11-01", id: "c", count: 50 }, { date: "2026-11-01", id: "a", count: 10 }];
  const { order } = computeOrder({ tiles, dailyCounts, previousOrder: ["a", "b", "c"], today: "2026-11-02" });
  assert.deepEqual(order, ["safety", "c", "a", "b"]);
});

test("a small lead (under 10%) does not reorder", () => {
  const dailyCounts = [{ date: "2026-11-01", id: "a", count: 100 }, { date: "2026-11-01", id: "b", count: 105 }];
  const { order } = computeOrder({ tiles, dailyCounts, previousOrder: ["a", "b", "c"], today: "2026-11-02" });
  assert.deepEqual(order.slice(1, 3), ["a", "b"]);
});

test("old selections fade and drop out after the window", () => {
  const s = scoreTiles([{ date: "2026-10-01", id: "a", count: 100 }, { date: "2026-10-20", id: "b", count: 100 }], "2026-11-02");
  assert.equal(s.a, undefined);
  assert.ok(s.b > 0 && s.b < 100);
});

test("retired tiles are dropped and new tiles are added", () => {
  const { order } = computeOrder({ tiles, dailyCounts: [], previousOrder: ["gone", "b", "a"], today: "2026-11-02" });
  assert.deepEqual(order, ["safety", "b", "a", "c"]);
});
