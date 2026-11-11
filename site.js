/* Team Bernard site script.
   Content lives in data.js (members + builds) and journals.js.
   You should not need to edit this file to add content. */
(function () {
  "use strict";
  var S = window.SITE || { members: [], builds: [], slots: [] };
  var J = window.JOURNALS || { topics: [], entries: [] };

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function titles(html) { return html.replace(/Art and Agency/g, "<em>Art and Agency</em>").replace(/Paradise Lost/g, "<em>Paradise Lost</em>"); }
  function param(name) { return new URLSearchParams(location.search).get(name) || ""; }
  function member(id) { return S.members.filter(function (m) { return m.id === id; })[0]; }
  function posted(id) { return S.builds.filter(function (b) { return b.member === id; }).sort(function (a, b) { return a.n - b.n; }); }
  function build(id, n) { return S.builds.filter(function (b) { return b.member === id && b.n === n; })[0]; }
  function slotName(n) { var s = S.slots.filter(function (x) { return x.n === n; })[0]; return s ? s.name : "Build " + n; }
  function buildUrl(b, extra) { return "build.html?m=" + b.member + "&n=" + b.n + (extra || ""); }
  function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function mark(html, q) {
    if (!q) return html;
    var re = new RegExp("(" + reEsc(esc(q)) + ")", "gi");
    return html.split(/(<[^>]+>)/).map(function (part) { return part.charAt(0) === "<" ? part : part.replace(re, "<mark>$1</mark>"); }).join("");
  }
  function para(text, q) {
    if (text.indexOf("> ") === 0) return "<blockquote>" + mark(titles(esc(text.slice(2))), q) + "</blockquote>";
    if (/^[“"]/.test(text) && text.length > 300) return "<blockquote>" + mark(titles(esc(text)), q) + "</blockquote>";
    return "<p>" + mark(titles(esc(text)), q) + "</p>";
  }
  function snippet(text, q, len) {
    len = len || 220;
    var i = text.toLowerCase().indexOf(q.toLowerCase());
    var start = Math.max(0, i - 80), s = text.slice(start, start + len);
    return (start > 0 ? "…" : "") + mark(esc(s), q) + (start + len < text.length ? "…" : "");
  }
  function matches(text, q) { return text.toLowerCase().indexOf(q.toLowerCase()) !== -1; }

  /* ---------- shared chrome ---------- */
  function chrome() {
    var btn = $(".menu-btn"), nav = $(".nav");
    if (btn && nav) btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    var page = document.body.getAttribute("data-page");
    $all(".nav a").forEach(function (a) { if (a.getAttribute("data-nav") === page) a.setAttribute("aria-current", "page"); });
    var q = param("q");
    $all('.search-form input[name="q"]').forEach(function (i) { if (q && page === "search") i.value = q; });
    var top = $(".to-top");
    if (top) window.addEventListener("scroll", function () { top.classList.toggle("show", window.scrollY > 900); }, { passive: true });
    var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ---------- the maze ---------- */
  function hash(n) { var x = Math.sin(n * 91.7 + 13.1) * 10000; return x - Math.floor(x); }
  function polar(r, deg) { var a = (deg - 90) * Math.PI / 180; return [250 + r * Math.cos(a), 250 + r * Math.sin(a)]; }
  function arc(r, a1, a2) {
    var p1 = polar(r, a1), p2 = polar(r, a2), large = (a2 - a1) > 180 ? 1 : 0;
    return "M" + p1[0].toFixed(1) + " " + p1[1].toFixed(1) + " A" + r + " " + r + " 0 " + large + " 1 " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
  }
  function drawMaze(holder, opts) {
    opts = opts || {};
    var slots = S.slots.slice().sort(function (a, b) { return a.n - b.n; });
    var N = slots.length, R = 232, core = 46, step = (R - core - 14) / N;
    var svg = '<svg class="maze-svg" viewBox="0 0 500 500" role="group" aria-label="Maze of builds. The outer ring is Build 1 and each ring inward is the next build.">' +
      '<defs><radialGradient id="coreGlow"><stop offset="0" stop-color="#f0d49a" stop-opacity="0.9"/><stop offset="0.5" stop-color="#c9a45f" stop-opacity="0.25"/><stop offset="1" stop-color="#c9a45f" stop-opacity="0"/></radialGradient></defs>';
    slots.forEach(function (slot, i) {
      var r = R - i * step;
      var g1 = Math.round(hash(i + 1) * 300), gw = 22;           // entrance gap
      var g2 = (g1 + 140 + Math.round(hash(i + 7) * 80)) % 360;  // second gap
      var gaps = [g1, g2].sort(function (a, b) { return a - b; });
      var segs = [[gaps[0] + gw, gaps[1]], [gaps[1] + gw, gaps[0] + 360]];
      var team = S.builds.some(function (b) { return b.n === slot.n; });
      var mine = opts.member ? !!build(opts.member, slot.n) : team;
      var cls = "ring" + (team ? " reached" : "") + (mine ? " mine" : "");
      var d = segs.map(function (s) { return arc(r, s[0], s[1]); }).join(" ");
      var href = opts.link ? opts.link(slot.n) : "#build-" + slot.n;
      svg += '<a href="' + href + '" data-n="' + slot.n + '" aria-label="' + esc(slot.name) + (team ? "" : ", not posted yet") + '"><g class="' + cls + '"><path d="' + d + '"/></g></a>';
      if (i < N - 1) { // a short wall joining this ring to the next
        var wa = (gaps[1] + 60 + Math.round(hash(i + 3) * 60)) % 360, p1 = polar(r - 4, wa), p2 = polar(r - step + 4, wa);
        svg += '<line x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) + '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) + '" stroke="#24323c" stroke-width="5" stroke-linecap="round"/>';
      }
    });
    svg += '<circle class="core-glow" cx="250" cy="250" r="' + (core + 26) + '"/><circle class="core" cx="250" cy="250" r="' + (core - 6) + '"/>';
    svg += '<text x="250" y="255" text-anchor="middle">center</text></svg>';
    holder.innerHTML = svg;
    return holder.querySelector("svg");
  }
  function readout(el, n, memberId) {
    var list = S.builds.filter(function (b) { return b.n === n; });
    var html = "<h3>" + esc(slotName(n)) + "</h3>";
    if (!list.length) {
      html += '<p class="who">Nobody has posted this build yet.</p>';
    } else {
      html += '<p class="who">Posted by ' + list.map(function (b) { return esc(member(b.member).name); }).join(", ") + "</p>";
      list.forEach(function (b) {
        html += '<p><a href="' + buildUrl(b) + '">' + titles(esc(b.title)) + "</a>, by " + esc(member(b.member).name) + '<br><span class="muted">' + titles(esc(b.summary)) + "</span></p>";
      });
    }
    el.innerHTML = html;
  }

  /* ---------- pages ---------- */
  var order = {}; S.members.forEach(function (m, i) { order[m.id] = i; });
  J.entries.sort(function (a, b) { return order[a.member] - order[b.member]; });
  var pages = {};

  pages.home = function () {
    var roster = $("#roster");
    if (roster) roster.innerHTML = S.members.map(function (m) {
      var c = posted(m.id).length;
      return '<li><a href="member.html?id=' + m.id + '"><span class="r-name">' + esc(m.name) + '</span><span class="r-quality">Writing on <b>' + esc(m.quality.toLowerCase()) + '</b></span><span class="r-count">' + (c ? plural(c, "build") + " posted" : "Builds coming soon") + "</span></a></li>";
    }).join("");
    var holder = $("#maze");
    if (holder) {
      drawMaze(holder, { link: function (n) { return "builds.html?ring=" + n; } });
      var out = $("#maze-readout");
      $all("a[data-n]", holder).forEach(function (a) {
        var n = +a.getAttribute("data-n");
        a.addEventListener("mouseenter", function () { readout(out, n); });
        a.addEventListener("focus", function () { readout(out, n); });
      });
    }
    $all("[data-try]").forEach(function (b) {
      b.addEventListener("click", function () { location.href = "search.html?q=" + encodeURIComponent(b.getAttribute("data-try")); });
    });
    var stats = $("#stat-line");
    if (stats) stats.textContent = plural(S.members.length, "member") + ", " + plural(S.builds.length, "build") + " and " + plural(J.entries.length, "journal entry").replace("entrys", "entries") + " so far.";
  };

  pages.builds = function () {
    var state = { m: param("m"), q: param("q"), ring: +param("ring") || 0 };
    var chips = $("#member-chips"), list = $("#build-list"), input = $("#build-filter"), count = $("#build-count");
    chips.innerHTML = '<button class="chip" data-m="">Everyone</button>' + S.members.map(function (m) { return '<button class="chip" data-m="' + m.id + '">' + esc(m.name) + "</button>"; }).join("");
    input.value = state.q;
    var holder = $("#maze"), out = $("#maze-readout");

    function sync() {
      var p = new URLSearchParams();
      if (state.m) p.set("m", state.m); if (state.q) p.set("q", state.q); if (state.ring) p.set("ring", state.ring);
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
    }
    function renderMaze() {
      drawMaze(holder, { member: state.m || null, link: function (n) { return "#build-" + n; } });
      $all("a[data-n]", holder).forEach(function (a) {
        var n = +a.getAttribute("data-n");
        if (n === state.ring) $(".ring", a).classList.add("active");
        a.addEventListener("click", function (e) {
          e.preventDefault(); state.ring = n; sync(); renderMaze(); readout(out, n);
          var rows = $all('.build-row[data-n="' + n + '"]');
          rows.forEach(function (r) { r.classList.remove("flash"); void r.offsetWidth; r.classList.add("flash"); });
          if (rows[0]) rows[0].scrollIntoView({ behavior: "smooth", block: "center" });
        });
      });
    }
    function render() {
      $all(".chip", chips).forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-m") === state.m ? "true" : "false"); });
      var q = state.q.trim(), shown = 0, html = "";
      S.members.filter(function (m) { return !state.m || m.id === state.m; }).forEach(function (m) {
        var rows = "";
        S.slots.forEach(function (slot) {
          var b = build(m.id, slot.n);
          if (q) {
            if (!b) return;
            var hay = [b.title, b.summary].concat(b.paragraphs).join(" ");
            if (!matches(hay, q)) return;
          }
          shown += b ? 1 : 0;
          if (b) {
            var hit = q ? b.paragraphs.map(function (p, i) { return matches(p, q) ? i : -1; }).filter(function (i) { return i >= 0; }) : [];
            rows += '<div class="build-row" id="' + (m.id + "-" + slot.n) + '" data-n="' + slot.n + '"><div class="num">' + esc(slot.name) + "</div><div><h4><a href=\"" + buildUrl(b, q ? "&q=" + encodeURIComponent(q) + (hit.length ? "#p" + (hit[0] + 1) : "") : "") + '">' + titles(esc(b.title)) + "</a></h4><p>" + mark(titles(esc(b.summary)), q) + "</p>" +
              (q && hit.length ? '<p class="muted">' + snippet(b.paragraphs[hit[0]], q) + "</p>" : "") + "</div></div>";
          } else {
            rows += '<div class="build-row pending" data-n="' + slot.n + '"><div class="num">' + esc(slot.name) + "</div><div><h4>Not posted yet</h4></div></div>";
          }
        });
        if (rows) html += '<section class="build-group"><h3><a href="member.html?id=' + m.id + '" style="color:inherit;text-decoration:none">' + esc(m.name) + "</a></h3>" + rows + "</section>";
      });
      list.innerHTML = html || '<p class="empty">No builds match “' + esc(q) + '”. Try a shorter word, or clear the search to see every build.</p>';
      count.textContent = plural(shown, "build") + " shown";
      renderMaze();
      if (state.ring) readout(out, state.ring);
    }
    chips.addEventListener("click", function (e) { var c = e.target.closest(".chip"); if (!c) return; state.m = c.getAttribute("data-m"); sync(); render(); });
    input.addEventListener("input", function () { state.q = input.value; sync(); render(); });
    render();
    if (state.ring) { var r = $('.build-row[data-n="' + state.ring + '"]'); if (r) setTimeout(function () { r.scrollIntoView({ block: "center" }); r.classList.add("flash"); }, 50); }
  };

  pages.build = function () {
    var id = param("m"), n = +param("n"), q = param("q"), b = build(id, n), m = member(id), root = $("#reader");
    if (!b || !m) {
      root.innerHTML = '<div class="prose"><h1>Build not found</h1><p>This link doesn’t match a posted build. <a href="builds.html">See all builds</a> instead.</p></div>';
      return;
    }
    document.title = b.title + " | " + m.name + " | Team Bernard";
    var mine = posted(id), idx = mine.indexOf(b), prev = mine[idx - 1], next = mine[idx + 1];
    var others = S.builds.filter(function (x) { return x.n === n && x.member !== id; });
    var words = b.paragraphs.join(" ").split(/\s+/).length;
    root.innerHTML =
      '<header><nav class="crumbs" aria-label="Breadcrumb"><a href="builds.html">Builds</a> / <a href="member.html?id=' + id + '">' + esc(m.name) + "</a> / " + esc(slotName(n)) + "</nav>" +
      "<h1>" + titles(esc(b.title)) + '</h1><p class="byline">' + esc(m.name) + ", " + esc(slotName(n)) + ", about " + Math.max(1, Math.round(words / 230)) + " min read</p>" +
      '<p class="muted">' + titles(esc(b.summary)) + "</p>" +
      '<div class="tools"><button type="button" id="copy-link">Copy link</button><button type="button" id="size-up" aria-label="Larger text">Larger text</button><button type="button" id="size-down" aria-label="Smaller text">Smaller text</button>' + (q ? '<a class="btn ghost" href="' + buildUrl(b) + '">Clear highlights</a>' : "") + "</div></header>" +
      '<article class="essay" id="essay">' + b.paragraphs.map(function (p, i) { return para(p, q).replace(/^<(p|blockquote)>/, '<$1 id="p' + (i + 1) + '">'); }).join("") + "</article>" +
      '<nav class="pager" aria-label="More builds by ' + esc(m.name) + '">' +
      (prev ? '<a class="prev" href="' + buildUrl(prev) + '"><small>Previous build</small>' + titles(esc(prev.title)) + "</a>" : "") +
      (next ? '<a class="next" href="' + buildUrl(next) + '"><small>Next build</small>' + titles(esc(next.title)) + "</a>" : '<a class="next" href="member.html?id=' + id + '"><small>Done reading</small>Back to ' + esc(m.name) + "’s page</a>") + "</nav>" +
      (others.length ? '<section class="prose" style="margin-top:3rem"><h2 style="font-size:1.6rem">Other takes on ' + esc(slotName(n)) + "</h2><ul>" + others.map(function (o) { return '<li><a href="' + buildUrl(o) + '">' + titles(esc(o.title)) + "</a>, by " + esc(member(o.member).name) + "</li>"; }).join("") + "</ul></section>" : "");
    var size = 1.2, essay = $("#essay");
    $("#size-up").onclick = function () { size = Math.min(1.6, size + 0.1); essay.style.fontSize = size + "rem"; };
    $("#size-down").onclick = function () { size = Math.max(1, size - 0.1); essay.style.fontSize = size + "rem"; };
    $("#copy-link").onclick = function () {
      var btn = this;
      (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(function () { btn.textContent = "Link copied"; }, function () { btn.textContent = "Copy failed. Use the address bar"; });
    };
    if (location.hash) { var t = $(location.hash); if (t) setTimeout(function () { t.scrollIntoView({ block: "center" }); }, 30); }
  };

  function entryHtml(e, q, showTopic) {
    var m = member(e.member), t = J.topics.filter(function (x) { return x.id === e.topic; })[0];
    return '<article class="entry"><div class="who"><a href="member.html?id=' + e.member + '#journal">' + esc(m.name) + "</a>" +
      (showTopic ? '<a class="muted" style="font-family:inherit;font-size:.95rem" href="journals.html?topic=' + e.topic + '">' + esc(t.label) + "</a>" : "") +
      '</div><p class="q">' + mark(esc(e.prompt), q) + "</p>" + e.text.map(function (p) { return para(p, q); }).join("") + "</article>";
  }

  pages.journals = function () {
    var state = { topic: param("topic") || (J.topics[0] && J.topics[0].id), m: param("m"), q: param("q") };
    var nav = $("#topic-nav"), body = $("#journal-body"), chips = $("#member-chips"), input = $("#journal-filter"), count = $("#journal-count");
    var used = J.topics.filter(function (t) { return J.entries.some(function (e) { return e.topic === t.id; }); });
    nav.innerHTML = '<ol>' + used.map(function (t) { return '<li><button type="button" data-t="' + t.id + '">' + esc(t.label) + "</button></li>"; }).join("") + "</ol>";
    chips.innerHTML = '<button class="chip" data-m="">Everyone</button>' + S.members.map(function (m) { return '<button class="chip" data-m="' + m.id + '">' + esc(m.name) + "</button>"; }).join("");
    input.value = state.q;
    function sync() {
      var p = new URLSearchParams();
      if (state.topic) p.set("topic", state.topic); if (state.m) p.set("m", state.m); if (state.q) p.set("q", state.q);
      history.replaceState(null, "", location.pathname + "?" + p);
    }
    function render() {
      $all(".chip", chips).forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-m") === state.m ? "true" : "false"); });
      var q = state.q.trim();
      $all("button", nav).forEach(function (b) { b.setAttribute("aria-current", !q && b.getAttribute("data-t") === state.topic ? "true" : "false"); });
      var list = J.entries.filter(function (e) { return !state.m || e.member === state.m; });
      var html;
      if (q) {
        list = list.filter(function (e) { return matches(e.prompt + " " + e.text.join(" "), q); });
        html = '<h2 class="topic-title">Entries mentioning “' + esc(q) + "”</h2>" + (list.length ? list.map(function (e) { return entryHtml(e, q, true); }).join("") : '<p class="empty">No journal entries mention “' + esc(q) + '”. Try another word, or pick a prompt from the list.</p>');
      } else {
        var t = J.topics.filter(function (x) { return x.id === state.topic; })[0] || used[0];
        list = list.filter(function (e) { return e.topic === t.id; });
        var i = used.indexOf(t), nxt = used[i + 1];
        html = '<h2 class="topic-title">' + esc(t.label) + "</h2>" + (list.length ? list.map(function (e) { return entryHtml(e, "", false); }).join("") : '<p class="empty">No entry on this prompt from this member yet. Choose “Everyone” to see the rest of the team.</p>') +
          (nxt ? '<div class="actions"><button class="btn ghost" type="button" data-t="' + nxt.id + '">Next prompt: ' + esc(nxt.label) + "</button></div>" : "");
      }
      body.innerHTML = html;
      count.textContent = plural(list.length, "entry").replace("entrys", "entries") + " shown";
    }
    function pick(t) { state.topic = t; state.q = ""; input.value = ""; sync(); render(); $("#journal-top").scrollIntoView({ behavior: "smooth" }); }
    nav.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) pick(b.getAttribute("data-t")); });
    body.addEventListener("click", function (e) { var b = e.target.closest("button[data-t]"); if (b) pick(b.getAttribute("data-t")); });
    chips.addEventListener("click", function (e) { var c = e.target.closest(".chip"); if (!c) return; state.m = c.getAttribute("data-m"); sync(); render(); });
    input.addEventListener("input", function () { state.q = input.value; sync(); render(); });
    render();
  };

  pages.member = function () {
    var id = param("id"), m = member(id), root = $("#member");
    if (!m) { root.innerHTML = '<div class="wrap page-head"><h1>Member not found</h1><p><a href="about.html">Meet the team</a> instead.</p></div>'; return; }
    document.title = m.name + " | Team Bernard";
    var bs = posted(id), entries = J.entries.filter(function (e) { return e.member === id; });
    var first = entries.filter(function (e) { return e.topic === "consciousness"; })[0];
    var html = '<header class="page-head"><div class="wrap"><nav class="crumbs"><a href="about.html">Team</a> / ' + esc(m.name) + "</nav><h1>" + esc(m.name) + "</h1>" +
      "<p>Writing on <b style=\"color:var(--brass);font-weight:500\">" + esc(m.quality.toLowerCase()) + "</b>: " + esc(m.qualityNote) + ".</p>" +
      (m.placeholder ? '<p class="muted" style="font-size:1rem">Name to be added. Update this member in <code>assets/js/data.js</code>.</p>' : "") +
      '<div class="actions"><a class="btn" href="#builds">' + (bs.length ? "Read builds" : "Builds") + '</a><a class="btn ghost" href="#journal">Read journal</a></div></div></header>';
    html += '<section class="section" id="builds"><div class="wrap maze-layout"><div id="maze"></div><div><h2>Builds</h2>';
    html += bs.length ? bs.map(function (b) { return '<div class="build-row" data-n="' + b.n + '"><div class="num">' + esc(slotName(b.n)) + '</div><div><h4><a href="' + buildUrl(b) + '">' + titles(esc(b.title)) + "</a></h4><p>" + titles(esc(b.summary)) + "</p></div></div>"; }).join("")
      : '<p class="empty">No builds posted yet. They will appear here as soon as they are added to <code>assets/js/data.js</code>.</p>';
    html += "</div></div></section>";
    html += '<section class="section" id="journal"><div class="wrap"><div class="section-head"><h2>Journal</h2><span class="muted">' + plural(entries.length, "entry").replace("entrys", "entries") + "</span></div>" +
      (first ? '<p class="prose" style="font-size:1.3rem">' + esc(first.text[0]) + "</p>" : "") +
      entries.map(function (e) { var t = J.topics.filter(function (x) { return x.id === e.topic; })[0]; return '<details class="entry"><summary style="cursor:pointer"><span class="q" style="font-style:normal;color:var(--bone)">' + esc(t.label) + '</span><br><span class="q">' + esc(e.prompt) + "</span></summary>" + e.text.map(function (p) { return para(p); }).join("") + '<p><a href="journals.html?topic=' + e.topic + '">Compare with the team</a></p></details>'; }).join("") +
      "</div></section>";
    root.innerHTML = html;
    drawMaze($("#maze"), { member: id, link: function (n) { var b = build(id, n); return b ? buildUrl(b) : "builds.html?ring=" + n; } });
  };

  pages.about = function () {
    var holder = $("#members-list");
    if (!holder) return;
    holder.innerHTML = S.members.map(function (m) {
      var e = J.entries.filter(function (x) { return x.member === m.id && x.topic === "consciousness"; })[0];
      var said = e ? e.text[0].split(/(?<=\.)\s/).slice(0, 2).join(" ") : "";
      var c = posted(m.id).length;
      return '<div class="member-block"><div><h3><a href="member.html?id=' + m.id + '">' + esc(m.name) + '</a></h3><p class="muted">Writing on ' + esc(m.quality.toLowerCase()) + "</p></div><div>" +
        (said ? '<p class="said">' + esc(said) + '</p><p class="muted" style="font-size:.95rem">From the first journal entry: how I used to understand consciousness.</p>' : "") +
        '<p><a href="member.html?id=' + m.id + '">' + (c ? "Read " + plural(c, "build") + " and journal" : "Read journal") + "</a></p></div></div>";
    }).join("");
  };

  pages.search = function () {
    var q = param("q").trim(), out = $("#results"), head = $("#results-head");
    var input = $("#search-page-input"); if (input) input.value = q;
    if (!q) { head.textContent = "Search the site"; out.innerHTML = '<p class="empty">Type a word or name, like “Gell”, “maze” or “free will”, and press Enter.</p>'; return; }
    var res = [];
    S.members.forEach(function (m) { if (matches(m.name + " " + m.quality, q)) res.push({ kind: "Member", title: m.name, url: "member.html?id=" + m.id, text: "Writing on " + m.quality.toLowerCase() + ": " + m.qualityNote }); });
    S.builds.forEach(function (b) {
      var hits = b.paragraphs.map(function (p, i) { return matches(p, q) ? i : -1; }).filter(function (i) { return i >= 0; });
      if (hits.length || matches(b.title + b.summary, q)) res.push({ kind: slotName(b.n) + " by " + member(b.member).name + (hits.length ? ", " + plural(hits.length, "paragraph") + " match" : ""), title: b.title, url: buildUrl(b, "&q=" + encodeURIComponent(q) + (hits.length ? "#p" + (hits[0] + 1) : "")), html: hits.length ? snippet(b.paragraphs[hits[0]], q) : mark(esc(b.summary), q), score: hits.length + 5 });
    });
    J.entries.forEach(function (e) {
      var all = e.prompt + " " + e.text.join(" ");
      if (!matches(all, q)) return;
      var t = J.topics.filter(function (x) { return x.id === e.topic; })[0];
      var p = e.text.filter(function (x) { return matches(x, q); })[0] || e.prompt;
      res.push({ kind: "Journal entry by " + member(e.member).name, title: t.label, url: "journals.html?topic=" + e.topic + "&q=" + encodeURIComponent(q) + "&m=" + e.member, html: snippet(p.replace(/^> /, ""), q), score: 1 });
    });
    res.sort(function (a, b) { return (b.score || 10) - (a.score || 10); });
    head.textContent = plural(res.length, "result") + " for “" + q + "”";
    out.innerHTML = res.length ? '<ul class="results">' + res.map(function (r) { return '<li><div class="kind">' + esc(r.kind) + '</div><a class="title" href="' + r.url + '">' + titles(esc(r.title)) + "</a><p>" + (r.html || esc(r.text)) + "</p></li>"; }).join("") + "</ul>"
      : '<p class="empty">Nothing on the site mentions “' + esc(q) + '”. Check the spelling, try a shorter word, or browse the <a href="builds.html">builds</a> and <a href="journals.html">journals</a>.</p>';
  };

  document.addEventListener("DOMContentLoaded", function () {
    chrome();
    var p = document.body.getAttribute("data-page");
    if (pages[p]) pages[p]();
  });
})();
