// Levenshulme Medical Practice: small progressive enhancements.
// The site works fully without this file.
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  // Mobile menu
  var button = document.querySelector(".menu-button");
  var nav = document.getElementById("main-nav");
  if (button && nav) {
    button.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Hide the update notice once its end date has passed (even before the site is rebuilt)
  var notice = document.querySelector(".notice[data-until]");
  if (notice) {
    var until = notice.getAttribute("data-until");
    var today = new Date().toISOString().slice(0, 10);
    if (until && today > until) notice.hidden = true;
  }

  // Count which help option was chosen. Anonymous: no cookies, no identifiers.
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest("[data-track-tile]");
    if (!link || !navigator.sendBeacon) return;
    var payload = JSON.stringify({ tile: link.getAttribute("data-track-tile"), source: link.getAttribute("data-track-source") || "home" });
    try { navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" })); } catch (err) { /* never block navigation */ }
  });

  // Reorder homepage tiles by the weekly usage ranking. Pinned tiles stay first.
  var grid = document.querySelector("[data-tiles]");
  if (!grid || !window.fetch) return;
  var SHOWN = 6;
  fetch("/api/tile-order", { headers: { Accept: "application/json" } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !Array.isArray(data.order) || !data.order.length) return;
      var items = Array.prototype.slice.call(grid.children);
      var pos = {};
      data.order.forEach(function (id, i) { pos[id] = i; });
      var seed = items.slice();
      items.sort(function (a, b) {
        var ap = a.hasAttribute("data-pinned"), bp = b.hasAttribute("data-pinned");
        if (ap !== bp) return ap ? -1 : 1;
        var ai = pos[a.dataset.tileId], bi = pos[b.dataset.tileId];
        ai = ai === undefined ? 1000 + seed.indexOf(a) : ai;
        bi = bi === undefined ? 1000 + seed.indexOf(b) : bi;
        return ai - bi;
      });
      items.forEach(function (el, i) {
        el.hidden = i >= SHOWN;
        grid.appendChild(el);
      });
    })
    .catch(function () { /* keep the built order */ });
})();
