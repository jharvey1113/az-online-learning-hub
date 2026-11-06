/* AZ Online Learning Hub (demo) — simulated Gmail, calls and the demo badge.
 *
 * DemoMail.compose() shows a Gmail-style draft (or a sent message) and
 * DemoMail.outbox() shows every email a tiered run would send. mailto:, tel:
 * and Google Voice links are caught here and simulated, so nothing in the demo
 * ever opens a real mail client, dials a number or sends anything.
 */
(function () {
  'use strict';
  var D = window.DEMO;

  var css = '' +
    '.dm-ov{position:fixed;inset:0;background:rgba(0,12,45,.5);z-index:20000;display:flex;align-items:center;justify-content:center;padding:20px;animation:dmFade .18s ease;}' +
    '@keyframes dmFade{from{opacity:0}to{opacity:1}}' +
    '.dm-win{background:#fff;border-radius:12px;width:min(820px,100%);max-height:92vh;display:flex;flex-direction:column;box-shadow:0 24px 70px rgba(0,12,45,.4);overflow:hidden;font-family:"DM Sans",Arial,sans-serif;}' +
    '.dm-bar{background:#404650;color:#fff;display:flex;align-items:center;gap:10px;padding:10px 14px;font-size:14px;font-weight:600;}' +
    '.dm-bar .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.dm-bar button{background:transparent;border:0;color:#fff;font-size:18px;cursor:pointer;width:30px;height:30px;border-radius:6px;}' +
    '.dm-bar button:hover{background:rgba(255,255,255,.15);}' +
    '.dm-tabs{display:flex;gap:4px;padding:8px 12px 0;background:#f2f4f8;flex-wrap:wrap;}' +
    '.dm-tab{border:0;background:#e3e7ef;color:#4a5068;font-size:12px;font-weight:700;padding:6px 12px;border-radius:8px 8px 0 0;cursor:pointer;font-family:inherit;}' +
    '.dm-tab.on{background:#fff;color:#002366;}' +
    '.dm-tab.sent{color:#059669;}' +
    '.dm-note{background:#fff7e6;color:#7a4b00;border-bottom:1px solid #f4dcae;font-size:12px;padding:7px 16px;display:flex;gap:8px;align-items:center;}' +
    '.dm-f{display:flex;align-items:flex-start;gap:10px;border-bottom:1px solid #eef0f6;padding:7px 16px;font-size:13px;}' +
    '.dm-f .k{color:#80869e;min-width:52px;padding-top:3px;}' +
    '.dm-f .v{flex:1;min-width:0;display:flex;flex-wrap:wrap;gap:4px;}' +
    '.dm-chip{background:#f0f2f8;border:1px solid #e2e5ef;border-radius:14px;padding:2px 9px;font-size:12px;color:#1a1d2e;font-family:"JetBrains Mono",monospace;}' +
    '.dm-more{background:#eaf1ff;border:1px solid #cddcff;color:#1a5fd4;border-radius:14px;padding:2px 9px;font-size:12px;cursor:pointer;font-family:inherit;font-weight:700;}' +
    '.dm-subj{font-weight:700;color:#1a1d2e;padding-top:3px;}' +
    '.dm-body p{margin:0 0 12px;} .dm-body ul,.dm-body ol{margin:0 0 12px 22px;} .dm-body table{margin-bottom:4px;}' +
    '.dm-body{flex:1;overflow:auto;padding:18px 20px;font-size:14px;color:#1a1d2e;min-height:160px;}' +
    '.dm-body[contenteditable]:focus{outline:none;}' +
    '.dm-foot{display:flex;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid #eef0f6;background:#fafbfd;}' +
    '.dm-send{background:#0b57d0;color:#fff;border:0;border-radius:18px;padding:9px 22px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:8px;}' +
    '.dm-send:hover{background:#0a4ab3;} .dm-send[disabled]{background:#9db7e6;cursor:default;}' +
    '.dm-foot .hint{flex:1;font-size:11.5px;color:#80869e;}' +
    '.dm-ghost{background:transparent;border:0;color:#6b7194;font-size:16px;cursor:pointer;width:34px;height:34px;border-radius:8px;}' +
    '.dm-ghost:hover{background:#eef0f6;}' +
    '.dm-sentbadge{display:inline-flex;align-items:center;gap:6px;background:#e6f4ea;color:#1e7e34;border-radius:14px;padding:4px 11px;font-size:12px;font-weight:700;}' +
    '.dm-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:#1f2430;color:#fff;padding:13px 22px;border-radius:10px;font-size:13px;z-index:20050;box-shadow:0 10px 30px rgba(0,0,0,.3);font-family:"DM Sans",Arial,sans-serif;display:flex;gap:10px;align-items:center;max-width:620px;}' +
    /* outbox */
    '.ob-win{width:min(1180px,100%);height:min(820px,92vh);}' +
    '.ob-sum{display:flex;gap:10px;flex-wrap:wrap;padding:12px 16px;background:#f7f8fc;border-bottom:1px solid #eef0f6;align-items:center;}' +
    '.ob-stat{background:#fff;border:1px solid #e2e5ef;border-radius:10px;padding:6px 12px;font-size:12px;color:#6b7194;}' +
    '.ob-stat b{font-family:Outfit,sans-serif;font-size:16px;color:#002366;margin-right:4px;}' +
    '.ob-main{flex:1;display:flex;min-height:0;}' +
    '.ob-list{width:360px;border-right:1px solid #eef0f6;display:flex;flex-direction:column;min-height:0;}' +
    '.ob-filters{display:flex;gap:4px;flex-wrap:wrap;padding:10px;}' +
    '.ob-filters button{border:1px solid #e2e5ef;background:#fff;border-radius:14px;padding:3px 10px;font-size:11.5px;font-weight:700;color:#6b7194;cursor:pointer;font-family:inherit;}' +
    '.ob-filters button.on{background:#002366;color:#fff;border-color:#002366;}' +
    '.ob-search{margin:0 10px 8px;padding:8px 10px;border:1px solid #e2e5ef;border-radius:8px;font-size:13px;font-family:inherit;}' +
    '.ob-items{flex:1;overflow:auto;}' +
    '.ob-it{padding:10px 14px;border-bottom:1px solid #f2f4f8;cursor:pointer;display:flex;gap:10px;align-items:flex-start;}' +
    '.ob-it:hover{background:#f7f9ff;} .ob-it.on{background:#eaf1ff;}' +
    '.ob-tb{flex:none;font-size:10px;font-weight:800;color:#fff;border-radius:6px;padding:3px 6px;min-width:28px;text-align:center;margin-top:2px;}' +
    '.ob-it .w{font-weight:700;font-size:13px;color:#1a1d2e;} .ob-it .s{font-size:11.5px;color:#6b7194;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:270px;}' +
    '.ob-prev{flex:1;display:flex;flex-direction:column;min-width:0;}' +
    '@media(max-width:760px){.ob-main{flex-direction:column;}.ob-list{width:auto;height:42%;border-right:0;border-bottom:1px solid #eef0f6;}}' +
    /* call */
    '.cl-win{width:min(380px,100%);padding:30px 26px;text-align:center;}' +
    '.cl-ring{width:84px;height:84px;border-radius:50%;background:#059669;color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 16px;animation:clPulse 1.4s infinite;}' +
    '@keyframes clPulse{0%{box-shadow:0 0 0 0 rgba(5,150,105,.5)}70%{box-shadow:0 0 0 22px rgba(5,150,105,0)}100%{box-shadow:0 0 0 0 rgba(5,150,105,0)}}' +
    '.cl-win h3{font-family:Outfit,sans-serif;font-size:20px;color:#002366;margin-bottom:4px;}' +
    '.cl-num{font-family:"JetBrains Mono",monospace;color:#6b7194;font-size:14px;}' +
    '.cl-timer{font-family:"JetBrains Mono",monospace;font-size:13px;color:#059669;margin:14px 0 4px;}' +
    '.cl-end{margin-top:18px;background:#d93025;color:#fff;border:0;border-radius:50%;width:56px;height:56px;font-size:20px;cursor:pointer;}' +
    /* demo badge + about */
    '.demo-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,193,7,.18);border:1px solid rgba(255,193,7,.55);color:#ffe08a;border-radius:20px;padding:4px 11px;font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;font-family:"JetBrains Mono",monospace;}' +
    '.demo-pill:hover{background:rgba(255,193,7,.3);}' +
    '.demo-play{display:inline-flex;align-items:center;gap:7px;background:#fff;color:#002366;border:0;border-radius:20px;padding:6px 14px;font:700 12px "DM Sans",sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);}' +
    '.demo-play i{color:#8B0000;font-size:10px;}' +
    '.demo-play:hover{transform:translateY(-1px);}' +
    '.aw-win{width:min(1320px,100%);height:min(900px,94vh);}' +
    '.ab-win{width:min(640px,100%);}' +
    '.ab-body{padding:22px 26px;overflow:auto;font-size:14px;line-height:1.6;color:#1a1d2e;}' +
    '.ab-body h3{font-family:Outfit,sans-serif;color:#002366;font-size:15px;margin:16px 0 6px;} .ab-body h3:first-child{margin-top:0;}' +
    '.ab-body ul{margin-left:20px;} .ab-body li{margin:3px 0;}' +
    '.ab-flow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12px;margin:8px 0 4px;}' +
    '.ab-flow span{background:#eef2fb;color:#002366;border-radius:8px;padding:5px 9px;font-weight:700;} .ab-flow i{color:#9ca3c4;font-size:10px;}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function overlay(cls) {
    var ov = document.createElement('div'); ov.className = 'dm-ov';
    var win = document.createElement('div'); win.className = 'dm-win ' + (cls || '');
    ov.appendChild(win); document.body.appendChild(ov);
    function close() { ov.remove(); document.removeEventListener('keydown', onKey, true); }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    document.addEventListener('keydown', onKey, true);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    return { ov: ov, win: win, close: close };
  }
  function toast(html, ms) {
    var old = document.querySelector('.dm-toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'dm-toast'; t.innerHTML = html; document.body.appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 300); }, ms || 4500);
  }
  function chips(list) {
    list = (list || []).filter(Boolean);
    if (!list.length) return '';
    var SHOW = 6, head = list.slice(0, SHOW).map(function (e) { return '<span class="dm-chip">' + esc(e) + '</span>'; }).join('');
    if (list.length <= SHOW) return head;
    var rest = list.slice(SHOW).map(function (e) { return '<span class="dm-chip">' + esc(e) + '</span>'; }).join('');
    return head + '<button class="dm-more" onclick="this.outerHTML=this.nextElementSibling.innerHTML">+' + (list.length - SHOW) + ' more</button><template>' + rest + '</template>';
  }
  function field(k, list) { var c = chips(list); return c ? '<div class="dm-f"><span class="k">' + k + '</span><span class="v">' + c + '</span></div>' : ''; }
  function arr(x) { return Array.isArray(x) ? x : (x ? String(x).split(',').map(function (s) { return s.trim(); }).filter(Boolean) : []); }

  // ═══════ compose / sent message ═══════
  // opts: { mode:'draft'|'sent', from, drafts:[{to,cc,bcc,subject,html}] }
  function compose(opts) {
    var drafts = opts.drafts || [opts], cur = 0, sent = {};
    var sentMode = opts.mode === 'sent';
    var o = overlay();
    function render() {
      var d = drafts[cur];
      var tabs = drafts.length > 1 ? '<div class="dm-tabs">' + drafts.map(function (x, i) {
        return '<button class="dm-tab' + (i === cur ? ' on' : '') + (sent[i] ? ' sent' : '') + '" data-i="' + i + '">' + (sent[i] ? '✓ ' : '') + 'Draft ' + (i + 1) + ' of ' + drafts.length + '</button>';
      }).join('') + '</div>' : '';
      var note = sentMode
        ? '<div class="dm-note"><i class="fa-solid fa-circle-info"></i><span>In the live hub this email sends automatically from the program account. <b>Demo: nothing was sent.</b></span></div>'
        : '<div class="dm-note"><i class="fa-solid fa-flask"></i><span>Demo mode. In the live hub this lands in the program account\'s <b>Gmail Drafts</b> for review. Nothing is sent from here.' +
          (drafts.length > 1 ? ' Gmail limits recipients per message, so the list is split into ' + drafts.length + ' drafts.' : '') + '</span></div>';
      o.win.innerHTML =
        '<div class="dm-bar"><i class="fa-solid ' + (sentMode ? 'fa-paper-plane' : 'fa-pen-to-square') + '"></i><span class="t">' + (sentMode ? 'Sent' : 'Draft') + ' — ' + esc(d.subject || '(no subject)') + '</span><button title="Close" data-x>&times;</button></div>' +
        tabs + note +
        field('From', [opts.from || D.HUB_EMAIL]) + field('To', arr(d.to)) + field('Cc', arr(d.cc)) + field('Bcc', arr(d.bcc)) +
        '<div class="dm-f"><span class="k">Subject</span><span class="v dm-subj">' + esc(d.subject || '') + '</span></div>' +
        '<div class="dm-body"' + (sentMode ? '' : ' contenteditable="true"') + '>' + (d.html || '<p><br></p>') + '</div>' +
        '<div class="dm-foot">' +
        (sentMode
          ? '<span class="dm-sentbadge"><i class="fa-solid fa-check"></i>Delivered (simulated)</span><span class="hint">' + (arr(d.to).length + arr(d.cc).length) + ' recipients · ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '</span>'
          : (sent[cur] ? '<span class="dm-sentbadge"><i class="fa-solid fa-check"></i>Sent (simulated)</span>' : '<button class="dm-send" data-send><i class="fa-solid fa-paper-plane"></i>Send</button>') +
            '<span class="hint">' + (arr(d.to).length + arr(d.cc).length + arr(d.bcc).length) + ' recipients · you can edit the text above</span>' +
            '<button class="dm-ghost" title="Discard draft" data-x><i class="fa-regular fa-trash-can"></i></button>') +
        '</div>';
      [].forEach.call(o.win.querySelectorAll('[data-x]'), function (b) { b.onclick = o.close; });
      [].forEach.call(o.win.querySelectorAll('.dm-tab'), function (b) { b.onclick = function () { cur = +b.getAttribute('data-i'); render(); }; });
      var send = o.win.querySelector('[data-send]');
      if (send) send.onclick = function () {
        send.disabled = true; send.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>Sending…';
        setTimeout(function () {
          sent[cur] = true;
          toast('<i class="fa-solid fa-shield-halved" style="color:#ffd166"></i><span><b>Not sent — this is a demo.</b> In the live hub, Send goes out from the program\'s Gmail to these ' + (arr(d.to).length + arr(d.cc).length + arr(d.bcc).length) + ' recipients.</span>');
          var next = -1; for (var i = 0; i < drafts.length; i++) if (!sent[i]) { next = i; break; }
          if (next < 0) { setTimeout(o.close, 700); render(); return; }
          cur = next; render();
        }, 700);
      };
    }
    render();
  }

  // ═══════ outbox for the tiered run ═══════
  var TCOL = { 0: '#6b7194', 1: '#1e8e3e', 2: '#e09400', 3: '#d93025', 4: '#1c1c1c' };
  function outbox(opts) {
    var all = opts.items.concat(opts.extras || []), filt = 'all', q = '', sel = 0;
    var o = overlay('ob-win');
    var counts = { 1: 0, 2: 0, 3: 0, 4: 0 }, recips = 0;
    opts.items.forEach(function (x) { counts[x.tier]++; recips += x.to.length + x.cc.length; });
    o.win.innerHTML =
      '<div class="dm-bar"><i class="fa-solid fa-inbox"></i><span class="t">Tiered intervention run — outbox preview</span><button data-x>&times;</button></div>' +
      '<div class="dm-note"><i class="fa-solid fa-flask"></i><span><b>Demo: 0 emails sent.</b> In the live hub this run sends one personalized email per student (parents cc\'d), saves a PDF per grade, emails each grade\'s teachers a digest, and logs every contact. It also runs on a schedule every two weeks.</span></div>' +
      '<div class="ob-sum">' +
      '<span class="ob-stat"><b>' + opts.items.length + '</b>student emails</span><span class="ob-stat"><b>' + recips + '</b>recipients</span>' +
      [4, 3, 2, 1].map(function (t) { return '<span class="ob-stat"><b style="color:' + TCOL[t] + '">' + counts[t] + '</b>Tier ' + t + '</span>'; }).join('') +
      '<span class="ob-stat"><b>' + (opts.extras || []).length + '</b>staff emails</span></div>' +
      '<div class="ob-main"><div class="ob-list"><div class="ob-filters">' +
      [['all', 'All'], ['4', 'Tier 4'], ['3', 'Tier 3'], ['2', 'Tier 2'], ['1', 'Tier 1'], ['0', 'Staff']].map(function (f) {
        return '<button data-f="' + f[0] + '"' + (f[0] === 'all' ? ' class="on"' : '') + '>' + f[1] + '</button>';
      }).join('') + '</div><input class="ob-search" placeholder="Find a student…"><div class="ob-items"></div></div>' +
      '<div class="ob-prev"></div></div>';
    o.win.querySelector('[data-x]').onclick = o.close;
    var itemsEl = o.win.querySelector('.ob-items'), prevEl = o.win.querySelector('.ob-prev');
    function visible() {
      return all.filter(function (x) { return (filt === 'all' || String(x.tier) === filt) && (!q || x.who.toLowerCase().indexOf(q) > -1); });
    }
    function renderList() {
      var v = visible();
      itemsEl.innerHTML = v.map(function (x) {
        var i = all.indexOf(x);
        return '<div class="ob-it' + (i === sel ? ' on' : '') + '" data-i="' + i + '"><span class="ob-tb" style="background:' + TCOL[x.tier] + '">' + (x.tier ? 'T' + x.tier : 'Staff') + '</span>' +
          '<div style="min-width:0"><div class="w">' + esc(x.who) + (x.grade ? ' <span style="color:#9ca3c4;font-weight:500;">· ' + x.grade + 'th</span>' : '') + '</div><div class="s">' + esc(x.subject) + '</div></div></div>';
      }).join('') || '<div style="padding:20px;color:#9ca3c4;font-size:13px;">No emails match.</div>';
      [].forEach.call(itemsEl.querySelectorAll('.ob-it'), function (el) { el.onclick = function () { sel = +el.getAttribute('data-i'); renderList(); renderPrev(); }; });
    }
    function renderPrev() {
      var x = all[sel];
      prevEl.innerHTML = field('From', [D.HUB_EMAIL]) + field('To', x.to) + field('Cc', x.cc) +
        '<div class="dm-f"><span class="k">Subject</span><span class="v dm-subj">' + esc(x.subject) + '</span></div>' +
        '<div class="dm-body">' + x.html + '</div>' +
        '<div class="dm-foot"><span class="dm-sentbadge" style="background:#fff7e6;color:#7a4b00;"><i class="fa-solid fa-ban"></i>Not sent (demo)</span><span class="hint">Email ' + (sel + 1) + ' of ' + all.length + '</span></div>';
    }
    [].forEach.call(o.win.querySelectorAll('.ob-filters button'), function (b) {
      b.onclick = function () {
        filt = b.getAttribute('data-f');
        [].forEach.call(o.win.querySelectorAll('.ob-filters button'), function (x) { x.classList.toggle('on', x === b); });
        var v = visible(); if (v.length) sel = all.indexOf(v[0]);
        renderList(); renderPrev();
      };
    });
    o.win.querySelector('.ob-search').oninput = function (e) { q = e.target.value.toLowerCase().trim(); var v = visible(); if (v.length) sel = all.indexOf(v[0]); renderList(); renderPrev(); };
    renderList(); renderPrev();
  }

  // ═══════ simulated phone call ═══════
  function call(number, who) {
    var o = overlay('cl-win'), t0 = Date.now(), timer;
    o.win.innerHTML = '<div class="cl-ring"><i class="fa-solid fa-phone"></i></div><h3>' + esc(who || 'Calling…') + '</h3><div class="cl-num">' + esc(number) + '</div>' +
      '<div class="cl-timer">Ringing…</div><div style="font-size:12px;color:#9ca3c4;margin-top:8px;">Demo: no call is placed. In the live hub this dials through Google Voice.</div>' +
      '<button class="cl-end" title="Hang up"><i class="fa-solid fa-phone-slash"></i></button>';
    var tEl = o.win.querySelector('.cl-timer');
    timer = setInterval(function () {
      var s = Math.floor((Date.now() - t0) / 1000);
      if (s >= 3) tEl.textContent = 'Connected (simulated) · ' + Math.floor((s - 3) / 60) + ':' + ('0' + ((s - 3) % 60)).slice(-2);
    }, 500);
    var close = o.close;
    o.close = function () { clearInterval(timer); close(); };
    o.win.querySelector('.cl-end').onclick = function () { o.close(); toast('<i class="fa-solid fa-phone-slash"></i>Call ended (simulated).', 2500); };
    o.ov.addEventListener('click', function (e) { if (e.target === o.ov) clearInterval(timer); });
  }

  // ═══════ link + window.open interception ═══════
  function parseMailto(href) {
    var m = String(href).replace(/^mailto:/i, ''), qi = m.indexOf('?');
    var to = decodeURIComponent(qi < 0 ? m : m.slice(0, qi)), params = {};
    if (qi >= 0) m.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); params[p[0].toLowerCase()] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); });
    return { to: arr(to), cc: arr(params.cc), bcc: arr(params.bcc), subject: params.subject || '', body: params.body || '' };
  }
  function openMailto(href) {
    var m = parseMailto(href);
    compose({ mode: 'draft', from: D.HUB_EMAIL, drafts: [{ to: m.to, cc: m.cc, bcc: m.bcc, subject: m.subject,
      html: m.body ? esc(m.body).replace(/\n/g, '<br>') : '<p>Hi,</p><p><br></p><p>Thank you,<br>AZ Online Learning</p>' }] });
  }
  function nameNear(el) {
    var who = el.closest('.orl-who, .card-overlay, .orl-card');
    if (!who) return '';
    // Prefer the guardian's name (call list contact row, new-enrollee card) over the student's.
    var sels = ['.nm', '[style*="font-size:14px;font-weight:600"]', 'h4', '[style*="font-size:18px"]'];
    for (var i = 0; i < sels.length; i++) { var nm = who.querySelector(sels[i]); if (nm) return nm.textContent.trim(); }
    return '';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^mailto:/i.test(href)) { e.preventDefault(); e.stopPropagation(); openMailto(href); return; }
    if (/^tel:/i.test(href)) { e.preventDefault(); e.stopPropagation(); call(a.textContent.trim() || href.slice(4), nameNear(a)); return; }
    if (/voice\.google\.com/i.test(href)) {
      e.preventDefault(); e.stopPropagation();
      var num = decodeURIComponent((href.match(/%2B1?(\d{10})/) || [])[1] || '');
      call(num ? '(' + num.slice(0, 3) + ') ' + num.slice(3, 6) + '-' + num.slice(6) : a.textContent.trim(), nameNear(a));
    }
  }, true);
  var nativeOpen = window.open;
  window.open = function (url) {
    if (typeof url === 'string' && /^mailto:/i.test(url)) { openMailto(url); return null; }
    if (typeof url === 'string' && /mail\.google\.com/i.test(url)) { return null; }
    return nativeOpen.apply(window, arguments);
  };

  // Large grade lists: the live hub shows a copy-the-BCC box and opens Gmail;
  // the demo shows the draft it would produce instead.
  window.showCopyModal = function (emails, label) {
    var t = document.getElementById('draftToast'); if (t) t.remove();
    var parts = []; for (var i = 0; i < emails.length; i += 25) parts.push(emails.slice(i, i + 25));
    compose({ mode: 'draft', from: D.HUB_EMAIL, drafts: parts.map(function (b, i) {
      return { bcc: b, subject: 'AZOL Update — ' + label + (parts.length > 1 ? ' (Part ' + (i + 1) + ' of ' + parts.length + ')' : ''),
        html: '<p>Hello,</p><p><br></p><p>Thank you,<br>AZ Online Learning</p>' };
    }) });
  };

  // ═══════ demo badge + "about this demo" ═══════
  function about() {
    var o = overlay('ab-win');
    o.win.innerHTML = '<div class="dm-bar"><i class="fa-solid fa-circle-info"></i><span class="t">About this demo</span><button data-x>&times;</button></div>' +
      '<div class="ab-body">' +
      '<h3>What you are looking at</h3><p>A working copy of an online-school staff hub with <b>entirely fictional students</b>. Every button works; emails and calls are simulated so nothing ever leaves this page.</p>' +
      '<h3>Where the data comes from</h3><p>Everything is driven by the Edgenuity <b>Manage Enrollments</b> report (plus the student login report). Staff drop the daily export in a Drive folder; a Google Apps Script pipeline scores each course and the hub reads the result.</p>' +
      '<div class="ab-flow"><span>Edgenuity export</span><i class="fa-solid fa-arrow-right"></i><span>Drive drop folder</span><i class="fa-solid fa-arrow-right"></i><span>Apps Script pipeline</span><i class="fa-solid fa-arrow-right"></i><span>Google Sheet</span><i class="fa-solid fa-arrow-right"></i><span>This hub</span></div>' +
      '<h3>How a course is tiered</h3><ul><li>Grade under 70% +1, under 55% +1</li><li>Progress 10–20% behind target +1, 20%+ behind +2</li><li>No login in 5 school days +2</li><li>Score 0 = Tier 1, 1–2 = Tier 2, 3–4 = Tier 3, 5+ = Tier 4. A student\'s tier is their worst course.</li></ul>' +
      '<h3>Things to try</h3><ul><li><b>▶ Watch the automation</b> (top of the page) plays the daily data drop from Edgenuity to this hub.</li><li><b>Progress Spikes</b> / <b>Spike Radar</b> lists students whose progress jumped well above their own normal pace, for a person to review.</li><li>Click a tier in the donut legend, then <b>Email group</b>.</li><li><b>Send Tiered Emails</b> in the sidebar shows every personalized email a run would send.</li><li><b>Outreach Call List</b> opens a call script per student; tick the box to log a call.</li><li><b>Inactive 5+ Days</b> → email all inactive families.</li><li><b>Manage Enrollments</b> opens the full report browser with week-over-week progress compare.</li><li>The Gemini buttons open a sample AI analysis.</li></ul>' +
      '</div>';
    o.win.querySelector('[data-x]').onclick = o.close;
  }
  // The data-drop walkthrough, played inside the hub. When it finishes, the hub refreshes.
  var HOWTO = 'https://jharvey1113.github.io/azol-data-howto/?embed=1';
  function watch() {
    var o = overlay('aw-win');
    o.win.innerHTML = '<div class="dm-bar"><i class="fa-solid fa-play"></i><span class="t">How the data gets in — the daily automation</span>' +
      '<a href="' + HOWTO.replace('?embed=1', '') + '" target="_blank" rel="noopener" title="Open in a new tab" style="color:#fff;margin-right:6px;font-size:14px"><i class="fa-solid fa-up-right-from-square"></i></a><button data-x>&times;</button></div>' +
      '<iframe src="' + HOWTO + '" title="Data automation walkthrough" style="border:0;width:100%;flex:1;min-height:0;background:#f4f6fb" allow="fullscreen"></iframe>';
    o.win.querySelector('[data-x]').onclick = o.close;
    function done(e) {
      if (e.data !== 'azol-howto-done' || !document.body.contains(o.ov)) return;
      window.removeEventListener('message', done);
      setTimeout(function () {
        o.close();
        if (window.refreshAll) window.refreshAll();
        toast('<i class="fa-solid fa-rotate" style="color:#81c995"></i><span><b>Today\'s data is loaded.</b> Tiers, the call list, Progress Spikes and the email tools now run from this morning\'s reports.</span>', 6000);
      }, 2500);
    }
    window.addEventListener('message', done);
  }
  function badge() {
    var meta = document.querySelector('.header-meta > div');
    if (!meta) return;
    var b = document.createElement('span'); b.className = 'demo-pill'; b.title = 'All students are fictional. Click for details.';
    b.innerHTML = '<i class="fa-solid fa-flask"></i>Demo data';
    b.onclick = about;
    meta.insertBefore(b, meta.firstChild);
    var w = document.createElement('button'); w.className = 'demo-play'; w.title = 'Play the daily automation: Edgenuity reports → Drive → pipeline → hub';
    w.innerHTML = '<i class="fa-solid fa-play"></i>Watch the automation';
    w.onclick = watch;
    meta.insertBefore(w, meta.firstChild);
    var fs =document.getElementById('footerStatus');
    if (fs) new MutationObserver(function () { if (fs.textContent.indexOf('DEMO') < 0) fs.textContent = fs.textContent.replace('LIVE', 'DEMO'); }).observe(fs, { childList: true });
    var lb = document.querySelector('.live-badge'); if (lb) lb.innerHTML = '<span class="status-dot"></span> DEMO';
  }
  badge();
  try { if (!sessionStorage.getItem('azol-demo-about')) { sessionStorage.setItem('azol-demo-about', '1'); setTimeout(about, 600); } } catch (e) {}

  window.DemoMail = { compose: compose, outbox: outbox, call: call, toast: toast, about: about };
})();
