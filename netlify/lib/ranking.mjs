// Tile ranking: pure functions, so they can be unit-tested without Netlify.
//
// score = sum of daily selections, each weighted by how recent it is
//         (a selection loses half its weight every `halfLifeDays`).
// Only the last `windowDays` count. Pinned tiles always come first.
// To stop tiles flickering, a tile only overtakes the one above it when its
// score beats that tile's by more than `margin` (10% by default).

export const DEFAULTS = { windowDays: 28, halfLifeDays: 14, margin: 1.1 };

export function daysBetween(a, b) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

export function scoreTiles(dailyCounts, today, opts = {}) {
  const { windowDays, halfLifeDays } = { ...DEFAULTS, ...opts };
  const scores = {};
  for (const { date, id, count } of dailyCounts) {
    const age = daysBetween(date, today);
    if (age < 0 || age >= windowDays) continue;
    scores[id] = (scores[id] || 0) + count * Math.pow(0.5, age / halfLifeDays);
  }
  return scores;
}

export function computeOrder({ tiles, dailyCounts, previousOrder = [], today, ...opts }) {
  const { margin } = { ...DEFAULTS, ...opts };
  const scores = scoreTiles(dailyCounts, today, opts);
  const active = new Map(tiles.map((t) => [t.id, t]));
  const pinned = tiles.filter((t) => t.pinned).sort((a, b) => a.seedRank - b.seedRank).map((t) => t.id);

  // Start from last week's order (dropping retired tiles), then add new tiles in seed order.
  const start = previousOrder.filter((id) => active.has(id) && !active.get(id).pinned);
  const added = tiles
    .filter((t) => !t.pinned && !start.includes(t.id))
    .sort((a, b) => a.seedRank - b.seedRank)
    .map((t) => t.id);
  const order = [...start, ...added];

  // Insertion pass with hysteresis: move a tile up only past tiles it clearly beats.
  for (let i = 1; i < order.length; i++) {
    let j = i;
    while (j > 0 && (scores[order[j]] || 0) > (scores[order[j - 1]] || 0) * margin && (scores[order[j]] || 0) > 0) {
      [order[j - 1], order[j]] = [order[j], order[j - 1]];
      j--;
    }
  }
  return { order: [...pinned, ...order], scores };
}
