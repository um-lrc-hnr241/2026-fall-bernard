/* Playable circular maze for the home page.
   Guide the light from the entrance to the center to reveal a line from the team's work. */
(function () {
  "use strict";
  var holder = document.getElementById("play-maze");
  if (!holder) return;
  var S = window.SITE || { builds: [], members: [] }, J = window.JOURNALS || { entries: [] };
  var COUNTS = [1, 6, 12, 12, 24, 24, 24, 48], RINGS = COUNTS.length, W = 30, C = 250;
  var NS = "http://www.w3.org/2000/svg";
  var links, pos, trail, moves, done, seed, choice = {};

  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function key(a, b) { return a < b ? a + "|" + b : b + "|" + a; }
  function id(r, k) { return r + ":" + k; }
  function wrap(r, k) { return ((k % COUNTS[r]) + COUNTS[r]) % COUNTS[r]; }
  function inward(r, k) { if (r === 0) return null; if (r === 1) return [0, 0]; return [r - 1, COUNTS[r - 1] === COUNTS[r] ? k : Math.floor(k / 2)]; }
  function outward(r, k) {
    if (r === RINGS - 1) return [];
    if (r === 0) { var all = []; for (var i = 0; i < COUNTS[1]; i++) all.push([1, i]); return all; }
    return COUNTS[r + 1] === COUNTS[r] ? [[r + 1, k]] : [[r + 1, 2 * k], [r + 1, 2 * k + 1]];
  }
  function neighbours(r, k) {
    var n = outward(r, k).slice(), i = inward(r, k);
    if (i) n.push(i);
    if (r > 0) { n.push([r, wrap(r, k - 1)]); n.push([r, wrap(r, k + 1)]); }
    return n;
  }
  function linked(a, b) { return !!links[key(id(a[0], a[1]), id(b[0], b[1]))]; }

  function generate() {
    var rand = rng(seed), seen = {}, stack = [[RINGS - 1, 0]];
    links = {}; seen[id(RINGS - 1, 0)] = true;
    while (stack.length) {
      var cur = stack[stack.length - 1];
      var opts = neighbours(cur[0], cur[1]).filter(function (n) { return !seen[id(n[0], n[1])]; });
      if (!opts.length) { stack.pop(); continue; }
      var nx = opts[Math.floor(rand() * opts.length)];
      links[key(id(cur[0], cur[1]), id(nx[0], nx[1]))] = true;
      seen[id(nx[0], nx[1])] = true; stack.push(nx);
    }
  }

  function polar(r, deg) { var a = (deg - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; }
  function arcD(rad, a1, a2) { var p1 = polar(rad, a1), p2 = polar(rad, a2); return "M" + p1[0].toFixed(2) + " " + p1[1].toFixed(2) + " A" + rad + " " + rad + " 0 " + (a2 - a1 > 180 ? 1 : 0) + " 1 " + p2[0].toFixed(2) + " " + p2[1].toFixed(2); }
  function centre(r, k) { if (r === 0) return [C, C]; var t = 360 / COUNTS[r]; return polar((r + 0.5) * W, (k + 0.5) * t); }

  function draw() {
    var d = "";
    for (var r = 1; r < RINGS; r++) {
      var t = 360 / COUNTS[r];
      for (var k = 0; k < COUNTS[r]; k++) {
        if (!linked([r, k], inward(r, k))) d += arcD(r * W, k * t, (k + 1) * t) + " ";
        if (!linked([r, k], [r, wrap(r, k - 1)])) { var a = polar(r * W, k * t), b = polar((r + 1) * W, k * t); d += "M" + a[0].toFixed(2) + " " + a[1].toFixed(2) + " L" + b[0].toFixed(2) + " " + b[1].toFixed(2) + " "; }
      }
    }
    var to = 360 / COUNTS[RINGS - 1];
    d += arcD(RINGS * W, to, 360);
    holder.innerHTML =
      '<svg viewBox="-12 -12 524 524" class="play-svg" aria-hidden="true">' +
      '<defs><radialGradient id="playGlow"><stop offset="0" stop-color="#f0d49a" stop-opacity=".95"/><stop offset=".45" stop-color="#c9a45f" stop-opacity=".35"/><stop offset="1" stop-color="#c9a45f" stop-opacity="0"/></radialGradient></defs>' +
      '<circle class="goal-glow" cx="250" cy="250" r="34"/>' +
      '<path class="trail" d=""/>' +
      '<path class="walls" d="' + d + '"/>' +
      '<g class="player"><circle class="halo" r="13"/><circle class="dot" r="6"/></g>' +
      "</svg>";
  }

  function trailD() {
    var s = "", p = trail[0], c0 = centre(p[0], p[1]);
    s = "M" + c0[0].toFixed(2) + " " + c0[1].toFixed(2);
    for (var i = 1; i < trail.length; i++) {
      var a = trail[i - 1], b = trail[i], cb = centre(b[0], b[1]);
      if (a[0] === b[0] && a[0] > 0) {
        var rad = (a[0] + 0.5) * W, t = 360 / COUNTS[a[0]];
        var diff = wrap(a[0], b[1] - a[1]) === 1 ? 1 : 0;
        s += " A" + rad + " " + rad + " 0 0 " + diff + " " + cb[0].toFixed(2) + " " + cb[1].toFixed(2);
      } else s += " L" + cb[0].toFixed(2) + " " + cb[1].toFixed(2);
    }
    return s;
  }
  function render() {
    var c = centre(pos[0], pos[1]);
    holder.querySelector(".player").setAttribute("transform", "translate(" + c[0].toFixed(2) + " " + c[1].toFixed(2) + ")");
    holder.querySelector(".trail").setAttribute("d", trailD());
    document.getElementById("play-moves").textContent = moves + (moves === 1 ? " step" : " steps");
  }

  function go(next) {
    if (done || !next || !linked(pos, next)) { holder.classList.remove("bump"); void holder.offsetWidth; holder.classList.add("bump"); return; }
    var prev = trail[trail.length - 2];
    if (prev && prev[0] === next[0] && prev[1] === next[1]) trail.pop(); else trail.push(next);
    pos = next; moves++; render();
    if (pos[0] === 0) finish();
  }
  function step(dir) {
    var r = pos[0], k = pos[1], cand;
    if (dir === "in") cand = [inward(r, k)];
    else if (dir === "out") cand = outward(r, k);
    else if (r === 0) cand = [];
    else cand = [[r, wrap(r, k + (dir === "cw" ? 1 : -1))]];
    var ok = cand.filter(function (n) { return n && linked(pos, n); });
    if (ok.length > 1) { // two open ways out: alternate between them on repeated presses
      var c = id(r, k); choice[c] = ((choice[c] === undefined ? -1 : choice[c]) + 1) % ok.length;
      go(ok[choice[c]]); return;
    }
    go(ok[0] || cand[0]);
  }

  function excerpts() {
    var out = [];
    function pick(text, label, url) {
      (text.replace(/^> /, "").match(/[^.!?]+[.!?]+["”’)]*/g) || []).forEach(function (s) {
        s = s.trim(); if (s.length > 70 && s.length < 230 && !/^\(|^Passage/.test(s)) out.push({ s: s, label: label, url: url });
      });
    }
    S.builds.forEach(function (b) {
      var who = b.member === "team" ? "the whole team" : (S.members.filter(function (m) { return m.id === b.member; })[0] || {}).name;
      b.paragraphs.forEach(function (p) { pick(p, who + ", Build " + b.n, "build.html?m=" + b.member + "&n=" + b.n); });
    });
    return out;
  }
  var pool = null;
  function finish() {
    done = true; holder.classList.add("solved");
    pool = pool || excerpts();
    var e = pool[Math.floor(Math.random() * pool.length)];
    var box = document.getElementById("play-reveal");
    box.innerHTML = '<p class="reveal-kicker">You reached the center in ' + moves + " steps. Waiting there:</p>" +
      (e ? '<blockquote class="reveal-quote">' + e.s.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }) + '</blockquote><p class="muted">From ' + e.label + '. <a href="' + e.url + '">Read the full build</a></p>' : "") +
      '<div class="actions"><button type="button" class="btn" id="play-again">Walk a new maze</button></div>';
    box.hidden = false;
    document.getElementById("play-again").onclick = function () { reset(true); holder.focus(); };
  }

  function reset(newSeed) {
    seed = newSeed ? Math.floor(Math.random() * 1e9) : 241;
    pos = [RINGS - 1, 0]; trail = [pos]; moves = 0; done = false; choice = {};
    holder.classList.remove("solved");
    var box = document.getElementById("play-reveal"); box.hidden = true; box.innerHTML = "";
    generate(); draw(); render();
  }

  holder.addEventListener("keydown", function (e) {
    var map = { ArrowUp: "in", w: "in", ArrowDown: "out", s: "out", ArrowLeft: "ccw", a: "ccw", ArrowRight: "cw", d: "cw" };
    if (map[e.key]) { e.preventDefault(); step(map[e.key]); }
  });
  holder.addEventListener("click", function (e) {
    holder.focus();
    var svg = holder.querySelector("svg"); if (!svg) return;
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var p = pt.matrixTransform(svg.getScreenCTM().inverse());
    var dx = p.x - C, dy = p.y - C, rad = Math.sqrt(dx * dx + dy * dy), r = Math.floor(rad / W);
    if (r >= RINGS) return;
    var ang = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360, k = r === 0 ? 0 : Math.floor(ang / (360 / COUNTS[r]));
    var target = [r, k];
    if (neighbours(pos[0], pos[1]).some(function (n) { return n[0] === r && n[1] === k; })) go(target);
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-step]"), function (b) {
    b.addEventListener("click", function () { step(b.getAttribute("data-step")); });
  });
  document.getElementById("play-reset").addEventListener("click", function () { reset(true); holder.focus(); });
  holder._maze = { links: function () { return links; }, pos: function () { return pos; } }; // used by automated tests
  reset(false);
})();
