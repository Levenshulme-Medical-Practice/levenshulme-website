// Eleventy configuration for the Levenshulme Medical Practice website.
export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });

  const today = new Date().toISOString().slice(0, 10);

  // Homepage tiles: every help page tagged "tile" that is active.
  // Pinned tiles come first, then the seed order (used until real usage data exists).
  eleventyConfig.addCollection("tiles", (api) => {
    const tiles = api
      .getFilteredByTag("tile")
      .filter((t) => t.data.active !== false)
      .sort((a, b) => {
        if (!!b.data.pinned - !!a.data.pinned) return !!b.data.pinned - !!a.data.pinned;
        return (a.data.seedRank ?? 99) - (b.data.seedRank ?? 99);
      });
    for (const t of tiles) {
      const review = t.data.clinical?.reviewBy;
      if (!t.data.clinical?.approvedOn) {
        console.warn(`[clinical] Tile "${t.data.title}" has no clinical approval recorded.`);
      } else if (review && String(review).slice(0, 10) < today) {
        console.warn(`[clinical] Tile "${t.data.title}" was due for review on ${review}.`);
      }
    }
    return tiles;
  });

  eleventyConfig.addCollection("news", (api) =>
    api.getFilteredByTag("news").sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addFilter("longDate", (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" })
  );
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("pick", (ids, library) => (ids || []).map((id) => ({ id, ...library[id] })).filter((f) => f.text));
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("head", (arr, n) => (arr || []).slice(0, n));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
