// POST /api/track  { "tile": "<id>", "source": "home" | "help" }
// Adds one to today's count for that tile. Stores nothing about the visitor.
import { getStore } from "@netlify/blobs";

const ID_PATTERN = /^[a-z0-9-]{1,40}$/;
let validIds = null;
let fetchedAt = 0;

async function knownTiles(origin) {
  if (!validIds || Date.now() - fetchedAt > 60 * 60 * 1000) {
    const res = await fetch(new URL("/tiles.json", origin));
    if (!res.ok) throw new Error("Could not load tiles.json");
    validIds = new Set((await res.json()).map((t) => t.id));
    fetchedAt = Date.now();
  }
  return validIds;
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }
  const id = String(body?.tile ?? "");
  const source = body?.source === "help" ? "help" : "home";
  if (!ID_PATTERN.test(id)) return new Response("Bad request", { status: 400 });

  const tiles = await knownTiles(new URL(req.url).origin);
  if (!tiles.has(id)) return new Response("Unknown tile", { status: 400 });

  const day = new Date().toISOString().slice(0, 10);
  const store = getStore({ name: "tile-usage", consistency: "strong" });
  const key = `daily/${day}/${id}`;
  const current = (await store.get(key, { type: "json" })) ?? { home: 0, help: 0 };
  current[source] = (current[source] ?? 0) + 1;
  await store.setJSON(key, current);

  return new Response(null, { status: 204 });
};

export const config = {
  path: "/api/track",
  // Limits how fast any one visitor can add counts, so the ranking is hard to game.
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
