/* AZ Online Learning Hub (demo) — Spike Radar.
 *
 * Flags progress that is unusual FOR THAT STUDENT, so a person can take a
 * look. It is an alert, not a verdict: every flag says why in plain words and
 * ends in a human decision (Looks fine / Concern).
 *
 * In the live hub the pipeline saves each day's progress + active time per
 * enrollment from the Manage Enrollments export and runs these rules once a
 * day; here the daily history is generated from the fictional students.
 */
(function () {
  'use strict';
  var D = window.DEMO, F = D.fmt;
  if (!D) return;

  // Own seeded random so the rest of the demo's data is unchanged.
  var seed = 7349;
  function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function rr(a, b) { return a + (b - a) * rnd(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function flip(n) { var p = String(n).split(','); return p.length > 1 ? p[1].trim() + ' ' + p[0].trim() : n; }
  function first(n) { var p = String(n).split(','); return p.length > 1 ? p[1].trim() : n; }
  function r1(x) { return (Math.round(x * 10) / 10).toFixed(1); }
  function hm(min) { min = Math.round(min); return min < 60 ? min + ' min' : Math.floor(min / 60) + 'h ' + ('0' + (min % 60)).slice(-2) + 'm'; }

  var DAYS = 15, RECENT = 3;
  var dates = [];
  for (var i = DAYS - 1; i >= 0; i--) dates.push(D.schoolDaysBack(D.AS_OF, i));
  var elapsed = Math.max(10, D.schoolDaysBetween(D.SEM[0], D.AS_OF));

  // ── daily history per enrollment (gain in progress points, active minutes) ──
  var pool = D.students.filter(function (s) { return !s.held && s.worstTier > 0 && s.profile !== 'new'; });
  var hist = {};   // extId -> { mpp, courses: [{c, gain[], min[]}] }
  pool.forEach(function (s) {
    var mpp = rr(14, 30);                                   // this student's usual minutes per progress point
    hist[s.extId] = { s: s, mpp: mpp, courses: s.courses.filter(function (c) { return c.progress > 0; }).map(function (c) {
      var base = Math.max(0.8, c.progress / elapsed) * rr(0.8, 1.25);
      var gain = [], min = [];
      for (var d = 0; d < DAYS; d++) {
        var idle = s.flag === 'Inactive' && s.daysSince < 999 && (DAYS - 1 - d) < s.daysSince;
        var g = idle ? 0 : (rnd() < 0.15 ? 0 : base * rr(0.25, 1.85));
        gain.push(g);
        min.push(g > 0 ? g * mpp * rr(0.75, 1.3) : (idle ? 0 : rr(0, 8)));
      }
      return { c: c, gain: gain, min: min };
    }) };
  });

  // Plant the cases a reviewer should see (and two that turn out to be fine).
  var active = pool.filter(function (s) { return s.flag === 'Active' && s.worstTier <= 3 && hist[s.extId].courses.length >= 3; });
  active.sort(function (a, b) { return a.extId.localeCompare(b.extId); });
  var plan = [['pace', 4], ['rate', 2], ['notime', 1], ['jump', 1], ['catchup', 2]], pi = 0;
  plan.forEach(function (p) {
    for (var n = 0; n < p[1]; n++) {
      var s = active[(pi += 7) % active.length], h = hist[s.extId];
      var cs = h.courses, c = cs[Math.floor(rnd() * cs.length)];
      var base = c.gain.slice(0, DAYS - RECENT).reduce(function (a, b) { return a + b; }, 0) / (DAYS - RECENT);
      for (var d = DAYS - RECENT; d < DAYS; d++) {
        var g;
        if (p[0] === 'pace') { g = Math.max(9, base * rr(9, 14)); c.gain[d] = g; c.min[d] = g * h.mpp * rr(0.12, 0.3); }
        if (p[0] === 'catchup') { g = Math.max(6, base * rr(5, 7)); c.gain[d] = g; c.min[d] = g * h.mpp * rr(0.9, 1.15); }
      }
      if (p[0] === 'rate') { c.gain[DAYS - 2] = rr(11, 16); c.min[DAYS - 2] = rr(12, 22); }
      if (p[0] === 'notime') { c.gain[DAYS - 2] = rr(6, 9); c.min[DAYS - 2] = rr(0, 3); c.gain[DAYS - 1] = rr(5, 8); c.min[DAYS - 1] = rr(0, 3); }
      if (p[0] === 'jump') { c.gain[DAYS - 1] = rr(30, 40); c.min[DAYS - 1] = rr(35, 55); }
      if (p[0] === 'pace' && cs.length > 1 && rnd() < 0.5) {   // sometimes it shows up in a second class too
        var c2 = cs[(cs.indexOf(c) + 1) % cs.length];
        for (var e = DAYS - RECENT; e < DAYS; e++) { var g2 = Math.max(7, rr(8, 12)); c2.gain[e] = g2; c2.min[e] = g2 * h.mpp * rr(0.15, 0.35); }
      }
    }
  });

  // ── the rules (all relative to the student's own history) ──
  var SENS = { fewer: { label: 'Fewer flags', k: 1.4 }, balanced: { label: 'Balanced', k: 1 }, more: { label: 'More flags', k: 0.75 } };
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function analyze(k) {
    var out = [];
    Object.keys(hist).forEach(function (id) {
      var h = hist[id], s = h.s, flagged = [];
      h.courses.forEach(function (cc) {
        var pg = cc.gain.slice(0, DAYS - RECENT), pm = cc.min.slice(0, DAYS - RECENT);
        var rg = cc.gain.slice(DAYS - RECENT), rm = cc.min.slice(DAYS - RECENT);
        var base = sum(pg) / pg.length, baseMin = sum(pm) / pm.length;
        var basePPH = sum(pm) > 0 ? sum(pg) / (sum(pm) / 60) : 3;
        var recentAvg = sum(rg) / RECENT, recentMin = sum(rm), recentPPH = recentMin > 0 ? sum(rg) / (recentMin / 60) : 99;
        var rules = [], score = 0;
        if (recentAvg >= Math.max(4 * base, base + 5) * k && recentAvg >= 5 * k) {
          rules.push({ key: 'pace', text: 'Last ' + RECENT + ' school days averaged ' + r1(recentAvg) + '%/day, about ' + Math.round(recentAvg / Math.max(base, .1)) + '× their usual ' + r1(base) + '%/day.' });
          score += 2;
        }
        var maxDay = Math.max.apply(null, rg), maxIdx = rg.indexOf(maxDay);
        if (maxDay >= Math.max(6 * base, 15) * k) {
          rules.push({ key: 'jump', text: 'One-day jump of ' + r1(maxDay) + '% on ' + F.monD(dates[DAYS - RECENT + maxIdx]) + '.' });
          score += 2;
        }
        for (var d = 0; d < RECENT; d++) {
          var dayPPH = rm[d] > 0 ? rg[d] / (rm[d] / 60) : 99;
          if (rg[d] >= 4 && rm[d] < 10) {
            rules.push({ key: 'notime', text: r1(rg[d]) + '% progress on ' + F.monD(dates[DAYS - RECENT + d]) + ' with only ' + Math.round(rm[d]) + ' min of active time.' });
            score += 5; break;
          }
          if (rg[d] >= 5 && dayPPH >= 4 * basePPH * k) {
            rules.push({ key: 'rate', text: r1(rg[d]) + '% in ' + hm(rm[d]) + ' on ' + F.monD(dates[DAYS - RECENT + d]) + ' (' + r1(dayPPH) + '%/hour vs. their usual ' + r1(basePPH) + '%/hour).' });
            score += 3; break;
          }
        }
        if (!rules.length) return;
        var timeMatches = recentPPH <= 1.6 * basePPH && !rules.some(function (r) { return r.key === 'rate' || r.key === 'notime'; });
        if (timeMatches) { rules.push({ key: 'ok', text: 'Active time rose to match (' + hm(recentMin) + ' over ' + RECENT + ' days vs. about ' + hm(baseMin * RECENT) + ' normally). Likely real catch-up work.' }); score = 1; }
        flagged.push({ cc: cc, rules: rules, score: score, base: base, recentAvg: recentAvg, recentMin: recentMin, baseMin: baseMin, timeMatches: timeMatches });
      });
      if (!flagged.length) return;
      flagged.sort(function (a, b) { return b.score - a.score; });
      var top = flagged[0], sc = top.score + (flagged.length > 1 ? 1 : 0);
      var sev = top.timeMatches && flagged.every(function (f) { return f.timeMatches; }) ? 'Low' : sc >= 5 ? 'High' : sc >= 3 ? 'Medium' : 'Low';
      var rg = top.cc.gain.slice(DAYS - RECENT), rm = top.cc.min.slice(DAYS - RECENT), big = Math.max.apply(null, rg), bi = rg.indexOf(big);
      var headline = big >= 0.6 * sum(rg)
        ? flip(s.name) + ' usually gains about ' + r1(top.base) + '%/day in ' + top.cc.c.course + '. On ' + F.monD(dates[DAYS - RECENT + bi]) +
          ' it jumped ' + r1(big) + '% with ' + hm(rm[bi]) + ' of active time.'
        : flip(s.name) + ' averaged ' + r1(top.base) + '%/day in ' + top.cc.c.course + ' over the prior ' + (DAYS - RECENT) +
          ' school days. The last ' + RECENT + ' days averaged ' + r1(top.recentAvg) + '%/day, with ' + hm(top.recentMin) + ' of active time.';
      out.push({ id: id, s: s, flagged: flagged, sev: sev, score: sc, headline: headline });
    });
    var ord = { High: 0, Medium: 1, Low: 2 };
    out.sort(function (a, b) { return ord[a.sev] - ord[b.sev] || b.score - a.score || a.s.name.localeCompare(b.s.name); });
    return out;
  }

  // ── review decisions (live hub: a shared "Spike Reviews" tab; demo: this browser) ──
  var KEY = 'azol-demo-spikes-' + D.AS_OF.toISOString().slice(0, 10);
  var reviews = {};
  try { reviews = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(reviews)); } catch (e) {} }

  // ── styles ──
  var css = '' +
    '.summary-strip{grid-template-columns:repeat(6,1fr)!important}' +
    '@media(max-width:1024px){.summary-strip{grid-template-columns:repeat(3,1fr)!important}}' +
    '@media(max-width:768px){.summary-strip{grid-template-columns:repeat(2,1fr)!important}}' +
    '.spk-ov{position:fixed;inset:0;background:rgba(0,12,45,.55);z-index:9200;display:flex;justify-content:center;align-items:flex-start;padding:26px 16px;overflow-y:auto}' +
    '.spk-win{background:var(--surface-alt);border-radius:16px;width:min(1240px,100%);box-shadow:0 30px 80px rgba(0,12,45,.4);overflow:hidden;display:flex;flex-direction:column;max-height:calc(100vh - 52px)}' +
    '.spk-top{background:var(--surface);border-top:5px solid #d97706;padding:18px 24px 14px}' +
    '.spk-top h2{font-family:Outfit,sans-serif;font-size:21px;color:var(--blue);font-weight:900}' +
    '.spk-top .sub{color:var(--text-muted);font-size:12.5px;margin-top:2px}' +
    '.spk-ctrls{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:12px}' +
    '.spk-seg{display:inline-flex;background:var(--surface-hover);border-radius:10px;padding:3px;gap:2px}' +
    '.spk-seg button{border:0;background:transparent;padding:6px 12px;border-radius:8px;font:700 12px "DM Sans",sans-serif;color:var(--text-muted);cursor:pointer}' +
    '.spk-seg button.on{background:#fff;color:var(--blue);box-shadow:0 1px 2px rgba(0,12,45,.14)}' +
    '.spk-x{margin-left:auto;border:0;background:var(--surface-hover);width:34px;height:34px;border-radius:8px;cursor:pointer;color:var(--text-muted);font-size:16px}' +
    '.spk-body{display:flex;min-height:0;flex:1}' +
    '.spk-list{width:360px;border-right:1px solid var(--border);overflow-y:auto;background:var(--surface)}' +
    '.spk-it{padding:11px 14px;border-bottom:1px solid var(--border-light);cursor:pointer;display:flex;gap:10px}' +
    '.spk-it:hover{background:#f7f9ff}.spk-it.on{background:#eaf1ff}' +
    '.spk-it .nm{font-weight:700;font-size:13px}.spk-it .rs{font-size:11.5px;color:var(--text-muted);margin-top:2px;line-height:1.35}' +
    '.spk-sev{flex:none;font-size:10px;font-weight:800;border-radius:6px;padding:3px 7px;height:fit-content;margin-top:2px}' +
    '.spk-sev.High{background:rgba(139,0,0,.12);color:#8B0000}.spk-sev.Medium{background:rgba(217,119,6,.14);color:#92400e}.spk-sev.Low{background:rgba(37,99,235,.12);color:#2563eb}' +
    '.spk-st{font-size:10px;font-weight:700;border-radius:10px;padding:1px 8px;margin-left:6px}' +
    '.spk-st.concern{background:#8B0000;color:#fff}.spk-st.fine{background:#059669;color:#fff}' +
    '.spk-det{flex:1;overflow-y:auto;padding:18px 22px;min-width:0}' +
    '.spk-det h3{font-family:Outfit,sans-serif;font-size:20px;color:var(--blue)}' +
    '.spk-meta{color:var(--text-muted);font-size:12.5px;margin:2px 0 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
    '.spk-meta a{color:var(--blue);font-weight:700;cursor:pointer}' +
    '.spk-head{background:rgba(217,119,6,.08);border:1px solid rgba(217,119,6,.28);color:#7a3e05;border-radius:10px;padding:11px 14px;font-size:13.5px;line-height:1.5;font-weight:600}' +
    '.spk-card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-top:12px}' +
    '.spk-card h4{font-size:14px;color:var(--text);display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}' +
    '.spk-card ul{margin:8px 0 6px 18px;font-size:12.5px;color:var(--text);line-height:1.5}' +
    '.spk-card li.ok{color:#047857;list-style:"✓  "}' +
    '.spk-leg{display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:var(--text-muted);margin-top:4px}' +
    '.spk-leg em{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px}' +
    '.spk-check{margin-top:14px;background:#f4f6fb;border-radius:10px;padding:12px 14px;font-size:12.5px;line-height:1.55}' +
    '.spk-check b{color:var(--blue)}' +
    '.spk-act{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;align-items:center}' +
    '.spk-act button{border:0;border-radius:9px;padding:10px 16px;font:700 13px "DM Sans",sans-serif;cursor:pointer;display:inline-flex;gap:8px;align-items:center}' +
    '.spk-fine{background:#059669;color:#fff}.spk-con{background:#8B0000;color:#fff}.spk-undo{background:var(--surface-hover);color:var(--text-muted)}' +
    '.spk-note{flex:1;min-width:200px;border:1px solid var(--border);border-radius:9px;padding:9px 11px;font:13px "DM Sans",sans-serif}' +
    '.spk-done{margin-top:12px;font-size:12.5px;font-weight:600;border-radius:9px;padding:9px 12px}' +
    '.spk-empty{padding:40px 20px;text-align:center;color:var(--text-faint);font-size:13px}' +
    '@media(max-width:820px){.spk-body{flex-direction:column}.spk-list{width:auto;max-height:260px;border-right:0;border-bottom:1px solid var(--border)}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ── chart: % gained per day (top) over active minutes per day (bottom band), usual pace dashed ──
  function chart(f) {
    var W = 640, padL = 40, n = DAYS, bw = (W - padL - 10) / n;
    var gTop = 10, gH = 120, mTop = gTop + gH + 26, mH = 38, H = mTop + mH + 22;
    var g = f.cc.gain, m = f.cc.min;
    var maxG = Math.max(6, Math.max.apply(null, g) * 1.1), maxM = Math.max(30, Math.max.apply(null, m) * 1.1);
    var y = function (v) { return gTop + gH * (1 - v / maxG); };
    var ym = function (v) { return mTop + mH * (1 - v / maxM); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;margin-top:8px" role="img" aria-label="Daily progress and active time">';
    [0, .5, 1].forEach(function (t) { var v = maxG * t, yy = y(v); s += '<line x1="' + padL + '" x2="' + (W - 6) + '" y1="' + yy + '" y2="' + yy + '" stroke="#eef0f6"/><text x="' + (padL - 6) + '" y="' + (yy + 4) + '" font-size="10" text-anchor="end" fill="#9ca3c4">' + Math.round(v) + '%</text>'; });
    s += '<text x="' + (padL - 6) + '" y="' + (mTop + 10) + '" font-size="10" text-anchor="end" fill="#9ca3c4">' + Math.round(maxM) + 'm</text>' +
      '<text x="' + padL + '" y="' + (mTop - 7) + '" font-size="10" fill="#6b7194" font-weight="700">Active time per day</text>' +
      '<line x1="' + padL + '" x2="' + (W - 6) + '" y1="' + (mTop + mH) + '" y2="' + (mTop + mH) + '" stroke="#e2e5ef"/>';
    for (var i = 0; i < n; i++) {
      var x = padL + i * bw + bw * .15, w = bw * .7, rec = i >= n - RECENT;
      s += '<rect x="' + x + '" y="' + y(g[i]) + '" width="' + w + '" height="' + Math.max(0, y(0) - y(g[i])) + '" rx="2" fill="' + (rec ? '#d97706' : '#9db4e0') + '"><title>' + F.monD(dates[i]) + ': +' + r1(g[i]) + '%, ' + hm(m[i]) + '</title></rect>';
      s += '<rect x="' + x + '" y="' + ym(m[i]) + '" width="' + w + '" height="' + Math.max(0, mTop + mH - ym(m[i])) + '" rx="1.5" fill="' + (rec ? '#34a37a' : '#a7d8c2') + '"><title>' + F.monD(dates[i]) + ': ' + hm(m[i]) + '</title></rect>';
      if (i % 2 === 0 || rec) s += '<text x="' + (x + w / 2) + '" y="' + (H - 6) + '" font-size="9.5" text-anchor="middle" fill="' + (rec ? '#92400e' : '#9ca3c4') + '">' + (dates[i].getMonth() + 1) + '/' + dates[i].getDate() + '</text>';
    }
    s += '<line x1="' + padL + '" x2="' + (padL + (n - RECENT) * bw) + '" y1="' + y(f.base) + '" y2="' + y(f.base) + '" stroke="#002366" stroke-width="1.5" stroke-dasharray="5 4"/>';
    s += '</svg><div class="spk-leg"><span><em style="background:#9db4e0"></em>% gained per day</span><span><em style="background:#d97706"></em>Last ' + RECENT + ' days</span>' +
      '<span><em style="background:#002366;height:2px"></em>Their usual pace (' + r1(f.base) + '%/day)</span><span><em style="background:#34a37a"></em>Active time</span></div>';
    return s;
  }

  // ── overlay ──
  var sensKey = 'balanced', filt = 'review', sel = null, data = [];
  function counts() {
    var c = { review: 0, concern: 0, fine: 0, all: data.length };
    data.forEach(function (x) { var r = reviews[x.id]; c[r ? r.status : 'review']++; });
    return c;
  }
  function visible() { return data.filter(function (x) { var r = reviews[x.id], k = r ? r.status : 'review'; return filt === 'all' || filt === k; }); }

  function open(id) {
    data = analyze(SENS[sensKey].k);
    var ov = document.getElementById('spkOv');
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'spkOv'; ov.className = 'spk-ov';
      ov.innerHTML = '<div class="spk-win"><div class="spk-top"><div style="display:flex;gap:12px;align-items:flex-start">' +
        '<div><h2><i class="fa-solid fa-gauge-high" style="color:#d97706;margin-right:8px"></i>Spike Radar</h2>' +
        '<div class="sub">Progress that is unusual <b>for that student</b>, compared with their own last ' + (DAYS - RECENT) + ' school days. A prompt for a person to take a look, not proof of anything.</div></div>' +
        '<button class="spk-x" id="spkX">&times;</button></div>' +
        '<div class="spk-ctrls"><div class="spk-seg" id="spkF"></div><div class="spk-seg" id="spkS">' +
        Object.keys(SENS).map(function (k) { return '<button data-k="' + k + '">' + SENS[k].label + '</button>'; }).join('') + '</div></div></div>' +
        '<div class="spk-body"><div class="spk-list" id="spkL"></div><div class="spk-det" id="spkD"></div></div></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
      document.getElementById('spkX').onclick = close;
      document.getElementById('spkS').onclick = function (e) {
        var b = e.target.closest('button'); if (!b) return;
        sensKey = b.getAttribute('data-k'); data = analyze(SENS[sensKey].k); sel = null; render(); updateStrip();
      };
      document.getElementById('spkF').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; filt = b.getAttribute('data-f'); sel = null; render(); };
      document.addEventListener('keydown', onKey);
    }
    if (id) { filt = 'all'; sel = id; }
    render();
  }
  function onKey(e) { if (e.key === 'Escape' && document.getElementById('spkOv') && !document.querySelector('.dm-ov,.card-overlay')) close(); }
  function close() { var o = document.getElementById('spkOv'); if (o) o.remove(); document.removeEventListener('keydown', onKey); updateStrip(); }

  function render() {
    var c = counts();
    document.getElementById('spkF').innerHTML = [['review', 'Needs review'], ['concern', 'Concern'], ['fine', 'Looks fine'], ['all', 'All']].map(function (f) {
      return '<button data-f="' + f[0] + '"' + (filt === f[0] ? ' class="on"' : '') + '>' + f[1] + ' · ' + c[f[0]] + '</button>';
    }).join('');
    [].forEach.call(document.querySelectorAll('#spkS button'), function (b) { b.classList.toggle('on', b.getAttribute('data-k') === sensKey); });
    var v = visible();
    if (!sel || !v.some(function (x) { return x.id === sel; })) sel = v.length ? v[0].id : null;
    document.getElementById('spkL').innerHTML = v.map(function (x) {
      var r = reviews[x.id], f0 = x.flagged[0];
      var short = f0.timeMatches ? 'Big jump, but active time rose too' : (f0.rules[0].key === 'notime' ? 'Progress with almost no time logged' : f0.rules[0].key === 'rate' ? 'Fast for the time logged' : f0.rules[0].key === 'jump' ? 'One-day jump' : 'Far above their usual pace');
      return '<div class="spk-it' + (x.id === sel ? ' on' : '') + '" data-id="' + x.id + '"><span class="spk-sev ' + x.sev + '">' + x.sev + '</span><div style="min-width:0">' +
        '<div class="nm">' + esc(flip(x.s.name)) + ' <span style="color:var(--text-faint);font-weight:500">· ' + x.s.grade + 'th</span>' +
        (r ? '<span class="spk-st ' + r.status + '">' + (r.status === 'fine' ? 'Looks fine' : 'Concern') + '</span>' : '') + '</div>' +
        '<div class="rs">' + short + ' · ' + esc(f0.cc.c.course) + (x.flagged.length > 1 ? ' +' + (x.flagged.length - 1) + ' more' : '') + '</div></div></div>';
    }).join('') || '<div class="spk-empty"><i class="fa-solid fa-circle-check" style="font-size:22px;color:#059669;display:block;margin-bottom:8px"></i>Nothing here' + (filt === 'review' ? '. Every flag has been reviewed.' : '.') + '</div>';
    [].forEach.call(document.querySelectorAll('#spkL .spk-it'), function (el) { el.onclick = function () { sel = el.getAttribute('data-id'); render(); }; });
    renderDetail();
  }

  function renderDetail() {
    var det = document.getElementById('spkD'), x = data.filter(function (d) { return d.id === sel; })[0];
    if (!x) { det.innerHTML = '<div class="spk-empty">Pick a student on the left.</div>'; return; }
    var s = x.s, r = reviews[x.id];
    var flaggedIds = x.flagged.map(function (f) { return f.cc.c.course; });
    var others = hist[x.id].courses.filter(function (cc) { return flaggedIds.indexOf(cc.c.course) < 0; }).map(function (cc) { return cc.c.course; });
    var anyFast = x.flagged.some(function (f) { return !f.timeMatches; });
    det.innerHTML =
      '<h3>' + esc(flip(s.name)) + '</h3>' +
      '<div class="spk-meta">' + s.grade + 'th Grade · ID ' + s.extId + ' · Tier ' + s.worstTier + ' · <span class="spk-sev ' + x.sev + '">' + x.sev + '</span> · <a id="spkCard">Open student card</a></div>' +
      '<div class="spk-head"><i class="fa-solid fa-triangle-exclamation" style="margin-right:6px"></i>' + esc(x.headline) + ' Worth a check.</div>' +
      x.flagged.map(function (f) {
        return '<div class="spk-card"><h4><span>' + esc(f.cc.c.course) + '</span><span style="color:var(--text-muted);font-weight:500;font-size:12px">Teacher: ' + esc(f.cc.c.teacher.split(', ').reverse().join(' ')) + ' · now ' + r1(f.cc.c.progress) + '% complete</span></h4>' +
          '<ul>' + f.rules.map(function (ru) { return '<li' + (ru.key === 'ok' ? ' class="ok"' : '') + '>' + esc(ru.text) + '</li>'; }).join('') + '</ul>' + chart(f) + '</div>';
      }).join('') +
      (others.length ? '<div style="font-size:12px;color:var(--text-muted);margin-top:10px"><i class="fa-solid fa-check" style="color:#059669;margin-right:5px"></i>Normal pace in: ' + others.map(esc).join(', ') + '</div>' : '') +
      '<div class="spk-check"><b>Before deciding, a quick look:</b> ' +
      (anyFast ? 'open the student\'s Edgenuity activity log for these days (time on each lesson, quiz and test scores, attempts). Lessons finished in a few minutes with high quiz scores, or work done at odd hours, are worth a conversation. ' : 'the time logged went up with the progress, which usually means honest catch-up. A quick check of quiz scores is usually enough. ') +
      'Students do sometimes speed up for good reasons (a deadline, a new plan with their teacher, a test-out). That is why a person decides.</div>' +
      (r ? '<div class="spk-done" style="background:' + (r.status === 'fine' ? 'rgba(5,150,105,.1);color:#047857' : 'rgba(139,0,0,.08);color:#8B0000') + '">' +
          (r.status === 'fine' ? '<i class="fa-solid fa-check"></i> Marked <b>Looks fine</b>' : '<i class="fa-solid fa-flag"></i> Marked <b>Concern</b>') + ' on ' + esc(r.when) + (r.note ? ': “' + esc(r.note) + '”' : '') +
          '</div><div class="spk-act"><button class="spk-undo" id="spkUndo"><i class="fa-solid fa-rotate-left"></i>Undo</button></div>'
        : '<div class="spk-act"><input class="spk-note" id="spkNote" placeholder="Optional note (e.g. talked with student, test-out approved)">' +
          '<button class="spk-fine" id="spkFine"><i class="fa-solid fa-check"></i>Looks fine</button>' +
          '<button class="spk-con" id="spkCon"><i class="fa-solid fa-flag"></i>Concern: notify teacher</button></div>' +
          '<div style="font-size:11px;color:var(--text-faint);margin-top:6px">In the live hub, decisions save to a shared Spike Reviews tab so the whole team works one queue, and a Concern is added to the Academic Integrity Log.</div>');
    document.getElementById('spkCard').onclick = function () {
      var card = (window.dashboardDataCache || []).filter(function (c) { return c.extId === s.extId; })[0];
      if (card && window.openStudentCard) window.openStudentCard(card);
    };
    var undo = document.getElementById('spkUndo');
    if (undo) undo.onclick = function () { delete reviews[x.id]; save(); render(); };
    var fine = document.getElementById('spkFine');
    if (fine) fine.onclick = function () { decide(x, 'fine'); };
    var con = document.getElementById('spkCon');
    if (con) con.onclick = function () { decide(x, 'concern'); };
  }

  function decide(x, status) {
    var note = (document.getElementById('spkNote') || {}).value || '';
    var now = new Date();
    reviews[x.id] = { status: status, note: note, when: F.md(now) + ' ' + now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };
    save();
    if (status === 'concern' && window.DemoMail) {
      var s = x.s, f = x.flagged[0];
      var tFirst = f.cc.c.teacher.split(', ')[1] || 'teacher', tLast = f.cc.c.teacher.split(', ')[0];
      var teacherEmail = (tFirst.charAt(0) + tLast).toLowerCase().replace(/[^a-z]/g, '') + '@' + D.STAFF_DOMAIN;
      var sup = D.teachersFor(s.grade).map(function (t) { return t.email; });
      var rows = x.flagged.map(function (ff) { return '<li><b>' + esc(ff.cc.c.course) + '</b>: ' + ff.rules.filter(function (ru) { return ru.key !== 'ok'; }).map(function (ru) { return esc(ru.text); }).join(' ') + '</li>'; }).join('');
      window.DemoMail.compose({ mode: 'draft', from: D.HUB_EMAIL, drafts: [{ to: [teacherEmail], cc: sup,
        subject: 'Progress spike to review: ' + flip(s.name) + ' (' + f.cc.c.course + ')',
        html: '<p>Hi ' + esc(tFirst) + ',</p><p>Spike Radar flagged unusual progress for <b>' + esc(flip(s.name)) + '</b> (' + s.grade + 'th grade, ID ' + s.extId + '). This isn\'t an accusation, just something worth a look:</p>' +
          '<ul>' + rows + '</ul>' + (note ? '<p><b>Reviewer note:</b> ' + esc(note) + '</p>' : '') +
          '<p>Could you check the activity log for those days and let me know if anything looks off? If it does, the next step is a conversation with ' + esc(first(s.name)) + '.</p><p>Thanks,<br>AZ Online Learning</p>' }] });
    } else if (window.DemoMail) {
      window.DemoMail.toast('<i class="fa-solid fa-check" style="color:#81c995"></i>Marked <b>Looks fine</b>. It leaves the review queue.', 2500);
    }
    render();
  }

  // ── strip card + sidebar button ──
  function updateStrip() {
    var all = analyze(SENS[sensKey].k), need = all.filter(function (x) { return !reviews[x.id]; }), hi = need.filter(function (x) { return x.sev === 'High'; }).length;
    var n = document.getElementById('stripSpikes'), dl = document.getElementById('stripSpikesDelta');
    if (n) n.textContent = need.length;
    if (dl) { dl.innerHTML = hi ? '<i class="fa-solid fa-triangle-exclamation" style="font-size:7px"></i> ' + hi + ' high · click to review' : (need.length ? 'click to review' : 'all reviewed'); dl.className = 'strip-delta ' + (hi ? 'down' : 'neutral'); }
  }
  var strip = document.querySelector('.summary-strip');
  if (strip) {
    var card = document.createElement('div');
    card.className = 'strip-card strip-clickable'; card.title = 'Students whose progress jumped well above their own normal pace';
    card.onclick = function () { open(); };
    card.innerHTML = '<div class="strip-icon" style="background:rgba(217,119,6,0.1);color:#d97706;"><i class="fa-solid fa-gauge-high"></i></div>' +
      '<div class="strip-data"><div class="strip-num" id="stripSpikes">—</div><div class="strip-label">Progress Spikes <i class="fa-solid fa-chevron-right" style="font-size:8px;opacity:.4;"></i></div>' +
      '<div class="strip-delta neutral" id="stripSpikesDelta">loading…</div></div>';
    strip.appendChild(card);
  }
  var tiered = [].filter.call(document.querySelectorAll('.sidebar .gemini-btn'), function (b) { return /Tiered/.test(b.textContent); })[0];
  if (tiered) {
    var b = document.createElement('button');
    b.className = 'gemini-btn'; b.style.cssText = 'background:linear-gradient(135deg,#b45309,#d97706);margin-top:10px;';
    b.innerHTML = '<i class="fa-solid fa-gauge-high"></i><span>Spike Radar</span>';
    b.onclick = function () { open(); };
    tiered.parentNode.insertBefore(b, tiered.nextSibling);
  }
  updateStrip();

  window.SpikeRadar = { open: open, analyze: function () { return analyze(SENS[sensKey].k); } };
})();
