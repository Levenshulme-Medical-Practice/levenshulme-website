// GET /api/tile-order  ->  { "order": ["id", ...], "computedAt": "..." }
import { getStore } from "@netlify/blobs";

export default async () => {
  const store = getStore("tile-usage");
  const ranking = await store.get("ranking/current", { type: "json" });
  return new Response(JSON.stringify(ranking ?? { order: [] }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
      "Netlify-CDN-Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
};

export const config = { path: "/api/tile-order" };
