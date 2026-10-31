# Levenshulme Medical Practice website

A static website built with [Eleventy](https://www.11ty.dev/) and hosted on Netlify. Content lives in Markdown and JSON files, so it can later be edited through a CMS without changing any code.

## Deploying to Netlify

**Recommended: deploy from Git.** This enables the tile-ranking functions.

1. Put this folder in a GitHub repository.
2. In Netlify, choose **Add new site → Import an existing project** and pick the repository. Netlify reads `netlify.toml`, so no build settings need changing.
3. After the first deploy, the weekly `rerank` function appears under **Logs → Functions**. You can run it by hand there at any time.

**Quick preview only:** drag the `_site` folder (in `site-preview.zip`) onto Netlify Drop. Everything works except the usage ranking. The tiles stay in their starting order and the click counter quietly does nothing.

To work on it locally: `npm install`, then `npm start`, then open http://localhost:8080.

## Where things are

| To change | Edit |
|---|---|
| Phone, email, access hours, building hours, key links | `src/_data/site.json` |
| Homepage update notice (and its end date) | `src/_data/notice.json` |
| Homepage tiles and the page each one opens | `src/help/*.md` (one file per tile) |
| Red-flag wording (shared by all tiles) | `src/_data/redflags.json` |
| Main menu | `src/_data/nav.json` |
| News | `src/news/*.md` |
| Other pages | `src/*.md` |
| Old-address redirects | `src/_redirects` |

Opening hours and contact details are stored once in `site.json`, which feeds the homepage, Opening hours and Contact pages, so they can't drift apart.

## Tiles and clinical sign-off

Each tile file has a `clinical` block (`approvedBy`, `approvedOn`, `reviewBy`, `hazardRef`). The build prints a `[clinical]` warning for any tile with no approval recorded or past its review date. **All tile content and red flags in this mockup are drafts awaiting clinical sign-off.**

To add a tile, copy an existing file in `src/help/`, give it a new `tileId` and `seedRank`, and set `active: false` until it's approved. Setting `pinned: true` keeps a tile at the top regardless of usage.

## How the usage ranking works

- A click on a tile (on the homepage or the "Everything we can help with" page) sends an anonymous count to `/api/track`. No cookies, no identifiers and no IP addresses are stored, only "tile X, date Y, +1". The endpoint is rate-limited per visitor to make the ranking hard to game.
- Once a week, `rerank` scores each tile on the last 28 days of counts. Recent clicks weigh more, halving every 14 days. A tile only overtakes the one above it if it leads by more than 10%, so tiles don't flicker. Pinned tiles always stay first.
- The homepage shows the top 6. Every active tile is always listed on `/help/`.
- The ranking logic is in `netlify/lib/ranking.mjs`, with tests (`npm test`).

## Placeholders to fill before go-live

Anything in square brackets appears on the site as a visible placeholder:

- telephone and in-person hours (`site.json`)
- the update notice (`notice.json`)
- the MSK self-referral link and service name (`site.json` and `help/muscle-joint.md`)
- GP earnings figures, complaints procedure, privacy notice, accessibility statement results, premises access details, vaccination programme
- the weight loss medicines news item: check the current NHS Greater Manchester position first

Also confirm which Accurx flow should handle medication questions (it currently uses the medical-request flow).

## Changes from the old site worth knowing

- **Test results:** the "if you don't hear from us, assume it's normal" wording has been removed.
- **Online access:** the online request now appears alongside phone and in person on Appointments and Prescriptions. The "8am release" wording is gone, and the hours for each access route are shown, as the 2026/27 contract requires.
- **Translation:** the Google Translate widget has been replaced with a page explaining built-in browser translation, so no third-party script or cookies are needed.
- **Old OPG forms:** these are not reproduced. Their replacement routes still need deciding (see MIGRATION-NOTES.md from the scrape).

## Going live

1. Get the domain registrant transferred to the practice.
2. Add the domain in Netlify (**Domain management**) and update the DNS when ready. Netlify issues the HTTPS certificate automatically.
3. Check that the old `/pages/...` addresses redirect correctly, then update the NHS.uk practice profile.
