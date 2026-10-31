// Runs weekly (and can be run by hand from the Netlify dashboard).
// Recalculates the homepage tile order from the last 4 weeks of selections.
import { getStore } from "@netlify/blobs";
import { computeOrder, daysBetween, DEFAULTS } from "../lib/ranking.mjs";

const KEEP_DAYS = 90;

export default async () => {
  const origin = process.env.URL;
  const tiles = await (await fetch(new URL("/tiles.json", origin))).json();
  const store = getStore({ name: "tile-usage", consistency: "strong" });
  const today = new Date().toISOString().slice(0, 10);

  const { blobs } = await store.list({ prefix: "daily/" });
  const dailyCounts = [];
  for (const { key } of blobs) {
    const [, date, id] = key.split("/");
    const age = daysBetween(date, today);
    if (age >= KEEP_DAYS) { await store.delete(key); continue; }
    if (age >= DEFAULTS.windowDays) continue;
    const c = (await store.get(key, { type: "json" })) ?? {};
    dailyCounts.push({ date, id, count: (c.home ?? 0) + (c.help ?? 0) });
  }

  const previous = (await store.get("ranking/current", { type: "json" }))?.order ?? [];
  const { order, scores } = computeOrder({ tiles, dailyCounts, previousOrder: previous, today });
  await store.setJSON("ranking/current", { order, scores, computedAt: new Date().toISOString() });
  console.log("New tile order:", order.join(", "));
};

export const config = { schedule: "@weekly" };
