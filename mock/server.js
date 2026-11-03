/* AZ Online Learning Hub (demo) — stands in for the Apps Script server.
 *
 * The live hub calls google.script.run.someFunction(); this file provides the
 * same object, answers each call from the fictional data in data.js, and keeps
 * the same response shapes the live server returns. Nothing here sends email:
 * the "send" functions hand their messages to DemoMail (demo.js) for preview.
 */
(function () {
  'use strict';
  var D = window.DEMO, F = D.fmt;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function flip(name) { var p = String(name).split(','); return p.length > 1 ? p[1].trim() + ' ' + p[0].trim() : String(name); }
  function live() { return D.students.filter(function (s) { return !s.held; }); }
  function later(fn) { setTimeout(function () { if (window.DemoMail) fn(window.DemoMail); }, 0); }
  function batches(list, n) { var out = []; for (var i = 0; i < list.length; i += n) out.push(list.slice(i, i + n)); return out; }
  function emailsFor(list, parents) {
    var set = {};
    list.forEach(function (s) {
      if (s.email) set[s.email.toLowerCase()] = true;
      if (parents && s.parentEmails) s.parentEmails.split(',').forEach(function (e) { e = e.trim().toLowerCase(); if (e) set[e] = true; });
    });
    return Object.keys(set);
  }

  // ═══════ EMAIL TEMPLATES (same layouts as the live hub) ═══════
  var LOGIN_URL = 'https://auth.edgenuity.com/login/login/student';
  function teacherTable() {
    var rows = '';
    Object.keys(D.TEACHERS).forEach(function (label) {
      rows += '<tr><td colspan="2" style="font-size:11px;font-weight:bold;letter-spacing:.5px;text-transform:uppercase;color:#002366;background:#f4f6fb;padding:6px 14px;">' + label + '</td></tr>';
      D.TEACHERS[label].forEach(function (t) {
        rows += '<tr><td style="padding:7px 14px;font-weight:bold;border-bottom:1px solid #f2f4f8;">' + t.name + '</td>' +
          '<td style="padding:7px 14px;border-bottom:1px solid #f2f4f8;text-align:right;"><a href="mailto:' + t.email + '" style="color:#1a5fd4;text-decoration:none;">' + t.email + '</a></td></tr>';
      });
    });
    return '<table style="border-collapse:collapse;width:100%;border:1px solid #eef0f6;">' + rows + '</table>';
  }
  function loginBlock() {
    return '<p style="margin:0 0 10px;"><a href="' + LOGIN_URL + '" style="display:inline-block;background:#002366;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:bold;">Log in to your classes</a></p>' +
      '<p>Or go to: <a href="' + LOGIN_URL + '" style="color:#1a5fd4;">' + LOGIN_URL + '</a><br>' +
      'You\'ll log in with the <b>same username and password you use for your student email and Chromebook</b>.</p>';
  }
  function inactiveEmailHtml() {
    return '<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1d2e;line-height:1.6;max-width:640px;">' +
      '<p>Hello,</p>' +
      '<p>If you are receiving this email, our records show that you have been <b>inactive in your AZ Online Learning course(s) for 5 or more school days</b>. Parents/guardians are copied so you\'re aware as well.</p>' +
      '<p>Please log back in and get to work as soon as possible so you don\'t fall behind.</p>' +
      '<div style="background:#fdeced;border-left:4px solid #8B0000;padding:12px 16px;border-radius:6px;margin:0 0 16px;">' +
      '<b>What\'s expected:</b> students are expected to log in and make progress <b>each day</b>. If inactivity reaches <b>10 school days</b>, the student may be <b>dropped from their course(s)</b>.</div>' +
      loginBlock() +
      '<p style="font-size:12px;color:#5b6178;text-transform:uppercase;letter-spacing:.5px;font-weight:bold;margin:18px 0 6px;">Need help? Contact your supervising teacher</p>' +
      teacherTable() +
      '<p style="margin-top:16px;">We want to help you get back on track — please don\'t hesitate to reach out.</p>' +
      '<p style="color:#5b6178;">Thank you,<br><b>AZ Online Learning</b></p></div>';
  }
  function tierGroupEmailHtml() {
    return '<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1d2e;line-height:1.6;max-width:640px;">' +
      '<p>Hello,</p>' +
      '<p>If you are receiving this email, a recent progress review shows that <b>one or more of your AZ Online Learning courses needs attention</b> — you may be behind the recommended pace, or a grade has slipped in one of your classes. Parents/guardians are copied so you\'re aware as well.</p>' +
      '<p>The good news: there is still plenty of time to get back on track, and we\'re here to help you do it.</p>' +
      '<div style="background:#eef4ff;border-left:4px solid #002366;padding:12px 16px;border-radius:6px;margin:0 0 16px;">' +
      '<b>What to do:</b> log in <b>every day</b> and start with the course that is furthest behind. Steady daily progress is what keeps you on pace to finish on time — even 30–45 focused minutes a day makes a real difference.</div>' +
      loginBlock() +
      '<p style="font-size:12px;color:#5b6178;text-transform:uppercase;letter-spacing:.5px;font-weight:bold;margin:18px 0 6px;">Need help? Contact your supervising teacher</p>' +
      teacherTable() +
      '<p style="margin-top:16px;">We believe in you — please don\'t hesitate to reach out if anything is getting in your way.</p>' +
      '<p style="color:#5b6178;">Thank you,<br><b>AZ Online Learning</b></p></div>';
  }

  // Per-student tier email (the biweekly run).
  var TIER_PALETTE = {
    1: { bar: '#1e8e3e', barText: '#ffffff', border: '#1e8e3e', borderW: '1px', label: 'On track' },
    2: { bar: '#f4a100', barText: '#4a3200', border: '#f4a100', borderW: '1px', label: 'Monitor' },
    3: { bar: '#d93025', barText: '#ffffff', border: '#d93025', borderW: '1px', label: 'Significant concern' },
    4: { bar: '#1c1c1c', barText: '#ffffff', border: '#d93025', borderW: '2px', label: 'Critical' }
  };
  var BADGE = { 1: { bg: '#e6f4ea', text: '#1e8e3e' }, 2: { bg: '#fdf0d5', text: '#8a5a00' }, 3: { bg: '#fbe0de', text: '#a3271f' }, 4: { bg: '#f3d3d0', text: '#7a1c16' } };
  var PHRASES = {
    1: 'Great work staying on track with your coursework. Your consistency really shows, so keep it going.',
    2: 'You are mostly in good shape, with just a couple of spots where a little more consistency would help.',
    3: 'A few of your courses have fallen behind. The good news is that most of your load is fine, so let us make a quick plan for the ones that need it.',
    4: 'Several of your courses are significantly behind and need attention right away. Please reach out today so we can build a recovery plan together.'
  };
  function courseReason(c, inactive) {
    var r = [];
    if (c.grade > 0 && c.grade < 55) r.push('grade below 55%'); else if (c.grade > 0 && c.grade < 70) r.push('grade below 70%');
    if (c.deltaPts !== null && c.target > 0 && c.deltaPts < -0.1 * c.target) r.push('progress off target');
    if (inactive) r.push('inactive');
    return r.join(' and ');
  }
  function tierEmailHtml(s) {
    var tier = s.worstTier, pal = TIER_PALETTE[tier];
    var intro = PHRASES[tier];
    if (tier === 1) {
      s.courses.forEach(function (c) {
        if (c.grade >= 85 && c.grade < 90) intro += ' You are at ' + c.grade.toFixed(2) + '% in ' + c.course + ', which is close to an A. A little extra effort could push you over the top.';
        else if (c.grade >= 78 && c.grade < 80) intro += ' You are at ' + c.grade.toFixed(2) + '% in ' + c.course + ', which is close to a solid B. A small push can get you there.';
      });
    }
    var rows = s.courses.slice().sort(function (a, b) { return b.grade - a.grade; }).map(function (c) {
      var ct = D.tierRank(c.tier) || 1, bp = BADGE[ct];
      var reason = courseReason(c, s.flag === 'Inactive');
      return '<tr style="border-bottom:1px solid #eeeeee;"><td style="padding:5px 0;color:#333333;">' + esc(c.course) +
        '<span style="background:' + bp.bg + ';color:' + bp.text + ';font-size:11px;padding:1px 6px;border-radius:8px;margin-left:6px;">T' + ct + '</span>' +
        (reason ? '<div style="font-size:11px;color:#999999;">' + reason + '</div>' : '') + '</td>' +
        '<td style="padding:5px 0;text-align:right;font-weight:bold;color:#1a1a1a;white-space:nowrap;">' + c.grade.toFixed(2) + '%</td></tr>';
    }).join('');
    var teachers = D.teachersFor(s.grade).map(function (t) { return '<a href="mailto:' + t.email + '" style="color:#1155cc;text-decoration:none;">' + t.name + '</a>'; }).join(', ');
    return '<div style="max-width:600px;background:#ffffff;border:' + pal.borderW + ' solid ' + pal.border + ';border-radius:10px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">' +
      '<div style="background:' + pal.bar + ';padding:10px 16px;color:' + pal.barText + ';font-size:13px;">Tier ' + tier + ': ' + pal.label + '</div>' +
      '<div style="padding:14px 16px;">' +
      '<div style="font-size:17px;font-weight:bold;color:#1a1a1a;margin-bottom:6px;">Hi ' + esc(flip(s.name)) + ',</div>' +
      '<div style="font-size:13px;color:#333333;line-height:1.5;margin-bottom:12px;">' + intro + '</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px;">' + rows + '</table>' +
      '<div style="font-size:12px;color:#777777;margin-top:12px;">If you have questions, reach out to your supervising teacher: ' + teachers + '.</div>' +
      '<div style="margin-top:16px;padding:12px 14px;background:#f7f7f7;border-radius:8px;font-size:12px;color:#555555;line-height:1.5;">' +
      '<div style="font-weight:bold;color:#333333;margin-bottom:4px;">What the tiers mean</div>' +
      '<div>Tier 1: On track. No current concern, keep up the good work.</div><div>Tier 2: Monitor. Early signs of an issue to keep an eye on.</div>' +
      '<div>Tier 3: Significant concern. One or more courses are well behind and need follow up soon.</div><div>Tier 4: Critical. Immediate action is needed.</div>' +
      '<div style="margin-top:8px;">Your overall tier reflects your most serious single course. The colored tag next to each course above shows where that class stands on its own.</div></div>' +
      '<div style="font-size:13px;color:#333333;margin-top:14px;">Let me know how I can help.<br>Thank you,</div></div></div>';
  }

  function attendanceHtml(target, absent, inactive5, critical9, newGrace) {
    var th = 'style="text-align:left;padding:6px 12px;background:#f4f6fb;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#5b6178;"';
    var td = 'style="padding:6px 12px;border-bottom:1px solid #eef0f6;"';
    var tdId = 'style="padding:6px 12px;border-bottom:1px solid #eef0f6;font-family:monospace;color:#5b6178;"';
    function namesIds(list) {
      if (!list.length) return '<p style="color:#059669;margin:6px 0 0;">None. 🎉</p>';
      return '<table style="border-collapse:collapse;width:100%;font-size:13px;"><tr><th ' + th + '>Student</th><th ' + th + '>Student ID</th></tr>' +
        list.map(function (s) { return '<tr><td ' + td + '>' + esc(flip(s.name)) + '</td><td ' + tdId + '>' + s.extId + '</td></tr>'; }).join('') + '</table>';
    }
    function withDays(list) {
      if (!list.length) return '<p style="color:#059669;margin:6px 0 0;">None.</p>';
      return '<table style="border-collapse:collapse;width:100%;font-size:13px;"><tr><th ' + th + '>Student</th><th ' + th + '>Student ID</th><th ' + th + '>Since last login</th></tr>' +
        list.map(function (s) {
          var d = s.daysSince >= 999 ? 'No login on file' : s.daysSince + ' school days';
          return '<tr><td ' + td + '>' + esc(flip(s.name)) + '</td><td ' + tdId + '>' + s.extId + '</td><td style="padding:6px 12px;border-bottom:1px solid #eef0f6;color:#8B0000;font-weight:bold;">' + d + '</td></tr>';
        }).join('') + '</table>';
    }
    function section(title, sub, color, body) {
      return '<div style="margin:0 0 22px;"><div style="font-family:Arial,sans-serif;font-weight:bold;font-size:15px;color:' + color + ';border-left:4px solid ' + color + ';padding-left:10px;">' + title +
        '</div><div style="font-size:12px;color:#98a0b8;padding-left:14px;margin:2px 0 8px;">' + sub + '</div>' + body + '</div>';
    }
    return '<div style="font-family:Arial,sans-serif;color:#1a1d2e;max-width:680px;">' +
      '<div style="background:#002366;color:#fff;padding:16px 20px;border-radius:10px;margin-bottom:20px;">' +
      '<div style="font-size:18px;font-weight:bold;">AZOL Daily Attendance</div>' +
      '<div style="font-size:12px;color:rgba(255,255,255,.7);margin-top:2px;">Based on last login · report data as of ' + F.monD(D.AS_OF) + ', ' + D.AS_OF.getFullYear() + '</div></div>' +
      section('Did not log in ' + target, absent.length + ' student(s) with no login on the last school day', '#8B0000', namesIds(absent)) +
      section('Inactive 5+ school days', inactive5.length + ' student(s)', '#b45309', withDays(inactive5)) +
      section('9+ school days — approaching the 10-day drop', critical9.length + ' student(s) to act on now', '#8B0000', withDays(critical9)) +
      section('New enrollments — first-week grace', newGrace.length + ' student(s) recently enrolled, NOT counted absent (grace period)', '#059669', namesIds(newGrace)) +
      '<p style="font-size:11px;color:#98a0b8;border-top:1px solid #eef0f6;padding-top:10px;">Generated by the AZ Online Learning Hub. Attendance is based on Edgenuity last-login; a login at 10pm or later counts through the next day.</p></div>';
  }

  // ═══════ MANAGE ENROLLMENTS REPORTS (Edgenuity export, 4 weekly snapshots) ═══════
  var ME_FIELDS = ['Name', 'User ID', 'External ID', 'Student Grade Level', 'Home School', 'Course Name', "Course's School",
    'Enrollment ID', 'External Course Code', 'Teachers', 'Subject', 'Series', 'Target Progress', 'Progress', 'Pacing',
    'Overall Grade', 'Relative Grade', 'Actual Grade', 'Active Time', 'Date Enrolled', 'Start Date', 'Target Date',
    'First Gradebook Entry', 'Last Gradebook Entry', 'Enrollment Status', 'Edition', 'ELL', 'IEP'];
  var meRows = null, meSnaps = null;
  function hms(sec) { sec = Math.max(0, Math.round(sec)); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return h + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2); }
  function pct(x) { return (Math.round(x * 100) / 100).toFixed(2) + '%'; }
  function buildMeBase() {
    if (meRows) return;
    meRows = [];
    var enrollSeq = 48100000;
    function add(s, campus, c, userId, ell, iep) {
      var rate = { strong: 1.1, steady: 0.95, slipping: 0.75, behind: 0.45, dark: 0.08, 'new': 0 }[s.profile] || 0.8;
      var started = D.SEM[0];
      var first = new Date(started); first.setDate(first.getDate() + D.ri(0, 4));
      meRows.push({
        s: s, c: c, campus: campus, userId: userId, enrollId: String(enrollSeq += D.ri(7, 61)),
        weekly: (c.target / Math.max(1, D.semFrac * 19)) * rate,      // progress points gained per week
        activeHrs: c.progress * D.rr(0.55, 0.9) + D.rr(1, 6),
        ell: ell, iep: iep, started: started, first: first
      });
    }
    D.students.forEach(function (s) {
      var uid = String(7000000 + Number(s.extId));
      var ell = D.chance(0.06) ? 'Yes' : 'No', iep = D.chance(0.13) ? 'Yes' : 'No';
      s.courses.forEach(function (c) { add(s, 'AZ Online Learning', c, uid, ell, iep); });
    });
    D.otherStudents.forEach(function (s) {
      var uid = String(7000000 + Number(s.extId));
      s.courses.forEach(function (c) { add(s, s.campus, c, uid, D.chance(0.08) ? 'Yes' : 'No', D.chance(0.12) ? 'Yes' : 'No'); });
    });
    meSnaps = [0, 1, 2, 3].map(function (w) {
      var d = new Date(D.AS_OF); d.setDate(d.getDate() - 7 * w);
      var label = F.MON3[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
      return { id: 'me-' + w, weeksBack: w, name: 'Manage Enrollments ' + d.toISOString().slice(0, 10) + '.csv',
        date: d.toISOString().slice(0, 10), label: label + (w === 0 ? ' (just dropped)' : ''), ts: d.getTime(), pending: w === 0, d: d };
    });
  }
  function meReport(snap) {
    buildMeBase();
    var w = snap.weeksBack, rows = [];
    meRows.forEach(function (r) {
      var s = r.s, c = r.c;
      var T = Math.max(0, c.target - (c.target / Math.max(1, D.semFrac * 19)) * w);
      var P = Math.max(0, c.progress - r.weekly * w);
      var lastAct = s.daysSince == null ? null : D.schoolDaysBack(snap.d, Math.min(s.daysSince, 60));
      if (s.profile === 'new') lastAct = null;
      if (s.profile === 'new' && w > 0) return;     // new kids aren't on older reports
      var grade = s.profile === 'new' ? '' : pct(c.grade);
      var targetDate = D.SEM[1];
      rows.push([
        s.name, r.userId, s.extId, String(s.grade), r.campus, c.course, r.campus === 'AZ Online Learning' ? 'AZ Online Learning' : r.campus,
        r.enrollId, c.code, c.teacher, c.subject, r.campus === 'AZ Online Learning' ? 'Core' : 'Credit Recovery',
        pct(T), pct(P), (P - T >= 0 ? '' : '') + pct(P - T),
        grade, s.profile === 'new' ? '' : pct(Math.min(100, c.grade * (P / Math.max(1, T)) * 0.6 + c.grade * 0.4)), grade,
        hms(Math.max(0, r.activeHrs - (r.weekly * w) * 0.75) * 3600),
        F.mdy2(r.started), F.mdy2(r.started), F.mdy2(targetDate),
        s.profile === 'new' ? '' : F.mdy2(r.first), lastAct ? F.mdy2(lastAct) : '',
        'Active', r.campus === 'AZ Online Learning' ? 'Core' : 'Prescriptive', r.ell, r.iep
      ]);
    });
    return { ok: true, id: snap.id, name: snap.name, date: snap.date, label: snap.label, ts: snap.ts, pending: snap.pending,
      fields: ME_FIELDS, rows: rows, count: rows.length };
  }

  // ═══════ AI REVIEW REPORTS (canned, computed from the demo data) ═══════
  function wrapReport(inner, title, subtitle) {
    var asOf = F.mdy(D.AS_OF);
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + title + ' — ' + asOf + '</title>' +
      '<style>body{font-family:Arial,Helvetica,sans-serif;color:#1a1d2e;max-width:880px;margin:0 auto;padding:32px;line-height:1.55;}' +
      '.demo{background:#fff7e6;border:1px solid #f4c46b;color:#7a4b00;border-radius:8px;padding:9px 13px;font-size:12.5px;margin-bottom:18px;}' +
      '.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #8B0000;padding-bottom:12px;margin-bottom:20px;}' +
      '.hd h1{font-size:20px;margin:0;color:#002366;} .hd .sub{font-size:12px;color:#6b7194;font-family:monospace;}' +
      'h3{color:#002366;margin-top:24px;font-size:15px;} ul{margin:6px 0 6px 18px;} li{margin:4px 0;}' +
      'table{border-collapse:collapse;width:100%;margin:8px 0 4px;font-size:13px;} th,td{border:1px solid #e2e5ef;padding:6px 10px;text-align:left;} th{background:#f0f2f8;color:#002366;}' +
      '.btn{background:#8B0000;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-weight:bold;cursor:pointer;font-size:13px;}' +
      '.foot{margin-top:28px;font-size:11px;color:#9ca3c4;border-top:1px solid #e2e5ef;padding-top:10px;} @media print{.btn,.demo{display:none;}}</style></head><body>' +
      '<div class="demo"><b>Demo report.</b> Every student here is fictional. In the live hub this analysis is written by Gemini from de-identified data (names are swapped for tokens before anything leaves the district and swapped back after).</div>' +
      '<div class="hd"><div><h1>AZ Online Learning — ' + title + '</h1><div class="sub">' + subtitle + '  •  data as of ' + asOf + '</div></div>' +
      '<button class="btn" onclick="window.print()">Export PDF</button></div>' + inner +
      '<div class="foot">Generated by the AZ Online Learning Hub (demo). Campus tables are computed directly (not AI-generated).</div></body></html>';
  }
  function afoReviewHtml() {
    var L = live().filter(function (s) { return s.worstTier > 0; });
    var t4 = L.filter(function (s) { return s.worstTier === 4; });
    var dark = L.filter(function (s) { return s.flag === 'Inactive'; }).sort(function (a, b) { return b.daysSince - a.daysSince; });
    var stuck = L.filter(function (s) { return s.worstTier === 3 && s.flag === 'Active'; });
    var courseHot = {};
    L.forEach(function (s) { s.courses.forEach(function (c) { if (D.tierRank(c.tier) >= 3) courseHot[c.course] = (courseHot[c.course] || 0) + 1; }); });
    var hot = Object.keys(courseHot).sort(function (a, b) { return courseHot[b] - courseHot[a]; }).slice(0, 5);
    var reach = t4.concat(stuck).slice(0, 10).map(function (s) {
      var d = D.avgDelta(s);
      var why = s.flag === 'Inactive' ? 'No login in ' + (s.daysSince >= 999 ? 'the report window' : s.daysSince + ' school days') : 'Logging in but ' + Math.abs(Math.round(d)) + ' pts behind pace';
      return '<tr><td>' + esc(flip(s.name)) + '</td><td>' + s.grade + 'th</td><td>Tier ' + s.worstTier + '</td><td>' + why + '</td><td>' +
        (s.flag === 'Inactive' ? 'Phone call to guardian today; confirm device + login' : 'Short call: pick one class, set a daily lesson target') + '</td></tr>';
    }).join('');
    return '<h3>Bottom line</h3><p>' + L.length + ' students are in tiered courses. <b>' + t4.length + '</b> are Tier 4 and <b>' + dark.length +
      '</b> have not logged in for 5+ school days. Most Tier 3 students <i>are</i> logging in, so the problem is pace, not attendance: short, specific calls work better for them than more email.</p>' +
      '<h3>Who to reach this week</h3><table><tr><th>Student</th><th>Grade</th><th>Tier</th><th>Why</th><th>Suggested move</th></tr>' + reach + '</table>' +
      '<h3>Course hot spots</h3><ul>' + hot.map(function (c) { return '<li><b>' + esc(c) + '</b>: ' + courseHot[c] + ' students at Tier 3/4</li>'; }).join('') + '</ul>' +
      '<h3>Patterns worth acting on</h3><ul>' +
      '<li>Inactivity clusters on Mondays after long weekends. A Monday 10 AM check-in text to Tier 3/4 families would catch most of them early.</li>' +
      '<li>Students with one class far behind and others on pace are the fastest wins: one focused week moves them out of Tier 3.</li>' +
      '<li>Seniors short on credits should get a counselor plan before winter break so spring schedules can absorb recovery.</li></ul>';
  }
  function leadershipReviewHtml() {
    buildMeBase();
    var by = {};
    meRows.forEach(function (r) {
      var o = by[r.campus] || (by[r.campus] = { n: 0, stu: {}, behind: 0, fail: 0, gsum: 0 });
      o.n++; o.stu[r.s.extId] = true; o.gsum += r.c.grade || 0;
      if (r.c.deltaPts !== null && r.c.deltaPts < -0.1 * r.c.target) o.behind++;
      if (r.c.grade > 0 && r.c.grade < 60) o.fail++;
    });
    var rows = Object.keys(by).sort().map(function (k) {
      var o = by[k];
      return '<tr><td>' + esc(k) + '</td><td>' + Object.keys(o.stu).length + '</td><td>' + o.n + '</td><td>' + Math.round(o.behind / o.n * 100) + '%</td><td>' +
        Math.round(o.fail / o.n * 100) + '%</td><td>' + (o.gsum / o.n).toFixed(1) + '%</td></tr>';
    }).join('');
    var seniors = live().filter(function (s) { return s.grade === 12 && s.credits && s.credits.gapAfter; }).length;
    var srRisk = live().filter(function (s) { return s.grade === 12 && s.worstTier >= 3; }).length;
    return '<h3>Summary for leadership</h3><p>Online enrollments are steady. Pace, not grades, is the main risk: most at-risk enrollments have passing grades but are well behind where the calendar says they should be. ' +
      '<b>' + srRisk + '</b> seniors are at Tier 3/4 and <b>' + seniors + '</b> are short on credits even if they pass everything, so they need a recovery plan now.</p>' +
      '<h3>Campus comparison (computed, not AI)</h3><table><tr><th>Campus</th><th>Students</th><th>Enrollments</th><th>Behind pace</th><th>Failing (&lt;60%)</th><th>Avg grade</th></tr>' + rows + '</table>' +
      '<h3>Systemic risks</h3><ul><li>Credit-recovery enrollments at comprehensive campuses run further behind pace than core online enrollments. Consider a weekly progress check owned by each campus.</li>' +
      '<li>Integrity flags are mostly AI-use. Pair consequences with a re-teach on acceptable AI use rather than zeros alone.</li>' +
      '<li>Inactive students who pass 10 school days are very hard to recover. The 5-day inactive email + call is the highest-leverage step.</li></ul>' +
      '<h3>Recommendations</h3><ul><li>Keep the biweekly tier emails, and track response rate by tier.</li><li>Stand up a senior credit-recovery review before winter break.</li><li>Share this report with campus principals monthly.</li></ul>';
  }

  // ═══════ THE API (same names and response shapes as the live hub) ═══════
  var SEND_CTX = { email: D.HUB_EMAIL, sender: D.HUB_EMAIL, allowed: true, reason: '', dryRun: false, expected: D.HUB_EMAIL };

  function cardFor(s) {
    var cc = D.contactCounts[s.extId];
    return {
      name: s.name, grade: s.grade, extId: s.extId, email: s.email, parentEmails: s.parentEmails,
      courses: s.courses.map(function (c) { return { course: c.course, grade: c.grade, tier: c.tier, delta: c.deltaPts === null ? null : c.deltaPts / 100 }; }),
      worstTier: s.worstTier, flag: s.flag,
      daysSince: s.daysSince, lastLogin: s.lastLogin,
      contactCount: cc ? cc.count : 0, lastContact: cc ? cc.last : '',
      credits: s.credits, teachers: D.teachersFor(s.grade)
    };
  }
  function inactiveList() { return live().filter(function (s) { return s.worstTier > 0 && s.flag === 'Inactive'; }); }
  function tierList(tier, grade) {
    return live().filter(function (s) { return s.worstTier === Number(tier) && (!grade || grade === 'all' || String(s.grade) === String(grade)); });
  }

  var API = {
    getWebAppUrl: function () { return location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '') + 'manage-enrollments.html'; },

    getRoster: function () {
      return D.students.map(function (s) { return { name: s.name, grade: s.grade, externalId: s.extId, studentEmail: s.email, parentEmails: s.parentEmails }; });
    },

    getDashboardData: function () {
      var tierSummary = { 1: 0, 2: 0, 3: 0, 4: 0 };
      var tierByGrade = { 9: { 1: 0, 2: 0, 3: 0, 4: 0 }, 10: { 1: 0, 2: 0, 3: 0, 4: 0 }, 11: { 1: 0, 2: 0, 3: 0, 4: 0 }, 12: { 1: 0, 2: 0, 3: 0, 4: 0 } };
      var inactiveByGrade = { 9: 0, 10: 0, 11: 0, 12: 0 }, inactiveStudents = [], tier34 = [], fails = {};
      var total = 0, inactiveCount = 0, newCount = 0, excusedCount = D.students.filter(function (s) { return s.held; }).length;
      live().forEach(function (s) {
        s.courses.forEach(function (c) {
          if (c.grade > 0 && c.grade < 59.5) { var k = s.grade + '||' + c.course; (fails[k] = fails[k] || { grade: s.grade, course: c.course, count: 0 }).count++; }
        });
        if (s.worstTier === 0) { if (s.flag === 'New') newCount++; return; }
        total++; tierSummary[s.worstTier]++; tierByGrade[s.grade][s.worstTier]++;
        if (s.flag === 'Inactive') {
          inactiveCount++; inactiveByGrade[s.grade]++;
          inactiveStudents.push({ name: s.name, grade: s.grade, daysSince: s.daysSince, lastLogin: s.lastLogin });
        }
        if (s.worstTier >= 3) tier34.push({ name: s.name, grade: s.grade, tier: 'Tier ' + s.worstTier });
      });
      inactiveStudents.sort(function (a, b) { return b.daysSince - a.daysSince; });
      var top = {};
      [9, 10, 11, 12].forEach(function (g) {
        var e = Object.keys(fails).map(function (k) { return fails[k]; }).filter(function (x) { return x.grade === g; }).sort(function (a, b) { return b.count - a.count; });
        if (e.length) top[g] = { course: e[0].course, count: e[0].count };
      });
      return { asOf: F.mdy(D.AS_OF), grace: false, tierSummary: { total: total, tiers: tierSummary }, tierByGrade: tierByGrade,
        inactiveStudents: inactiveStudents, inactiveByGrade: inactiveByGrade, inactiveCount: inactiveCount,
        newCount: newCount, excusedCount: excusedCount, tier34Students: tier34.slice(0, 30), topFailingByGrade: top };
    },

    getStudentCards: function () {
      return live().map(cardFor).sort(function (a, b) { return a.name.localeCompare(b.name); });
    },

    getLifeEvents: function () {
      return D.lifeEvents.map(function (e) {
        return { name: e.name, grade: e.grade, category: e.category, severity: e.severity, note: e.note, enteredBy: e.enteredBy,
          status: e.status, timeAgo: e.timeAgo, followUp: e.followUp, extId: e.extId, matched: e.matched };
      });
    },
    getLifeEventsUrl: function () { return 'sheet.html?tab=LifeEvents'; },

    getEnrollmentSummary: function () {
      var r = { ok: true, weekLabel: F.monD(D.lastWeekStart) + ' – ' + F.monD(D.lastWeekEnd), weekEnrolled: 0, weekWithdrew: 0,
        weekIEP: 0, week504: 0, weekELL: 0, yearEnrolled: 0, yearWithdrew: 0, yearNet: 0, yearIEP: 0, year504: 0, yearELL: 0 };
      var endWk = new Date(D.lastWeekEnd); endWk.setDate(endWk.getDate() + 1);
      D.registrar.forEach(function (x) {
        var inWk = x.ts >= D.lastWeekStart && x.ts < endWk;
        if (x.purpose === 'Enrollment') {
          r.yearEnrolled++; if (x.special === 'IEP') r.yearIEP++; if (x.special === '504') r.year504++; if (x.special === 'ELL') r.yearELL++;
          if (inWk) { r.weekEnrolled++; if (x.special === 'IEP') r.weekIEP++; if (x.special === '504') r.week504++; if (x.special === 'ELL') r.weekELL++; }
        } else { r.yearWithdrew++; if (inWk) r.weekWithdrew++; }
      });
      r.yearNet = r.yearEnrolled - r.yearWithdrew;
      return r;
    },

    getNewEnrollmentAlerts: function () {
      return { ok: true, stale: false, asOf: F.shortDay(D.AS_OF), threshold: 3, count: D.newEnroll.length, students: D.newEnroll,
        awaitingSetupCount: D.awaitingSetup.length, awaitingSetup: D.awaitingSetup };
    },

    getIntegrityData: function () {
      var types = ['AI', 'Plagiarism', 'Bot/Script', 'Other'];
      function zero() { return { AI: 0, Plagiarism: 0, 'Bot/Script': 0, Other: 0 }; }
      var yr = zero(), wk = zero(), prev = zero(), camp = {};
      var ws = D.weekStart.getTime(), we = D.weekEnd.getTime(), ps = D.prevStart.getTime();
      D.integrity.forEach(function (x) {
        yr[x.type]++;
        if (x.ts >= ws && x.ts <= we) { wk[x.type]++; camp[x.campus] = (camp[x.campus] || 0) + 1; }
        else if (x.ts >= ps && x.ts < ws) prev[x.type]++;
      });
      function sum(o) { return types.reduce(function (a, t) { return a + o[t]; }, 0); }
      return { ok: true, weekLabel: F.monD(D.weekStart) + ' – ' + F.monD(D.weekEnd), weekTotal: sum(wk), weekByType: wk,
        prevWeekTotal: sum(prev), prevWeekByType: prev, weekByCampus: camp, yearTotal: sum(yr), yearByType: yr,
        incidents: D.integrity.map(function (x) { return { type: x.type, date: x.date, ts: x.ts, name: x.name, id: x.id, campus: x.campus, course: x.course, teacher: x.teacher, status: x.status }; }) };
    },

    getQuickLinks: function () {
      return [
        { group: 'Sheets & Tools', label: 'Enrollment Data (Registrar)', url: 'sheet.html?tab=Enrollment', icon: 'fa-user-plus', color: '#059669' },
        { group: 'Sheets & Tools', label: 'Academic Integrity Log', url: 'sheet.html?tab=Integrity', icon: 'fa-shield-halved', color: '#8B0000' },
        { group: 'Sheets & Tools', label: 'AZOL Hub (this dashboard sheet)', url: 'sheet.html?tab=Roster', icon: 'fa-table-cells-large', color: '#002366' },
        { group: 'Sheets & Tools', label: 'Outreach Log', url: 'sheet.html?tab=Outreach', icon: 'fa-bullhorn', color: '#b45309' },
        { group: 'Folders', label: 'Progress Monitoring ' + D.SY_LABEL, url: 'sheet.html?tab=Folder&f=Progress%20Monitoring', icon: 'fa-folder', color: '#b45309' },
        { group: 'Folders', label: 'Tier Reports by Grade ' + D.SY_LABEL, url: 'sheet.html?tab=Folder&f=Tier%20Reports', icon: 'fa-folder', color: '#b45309' },
        { group: 'Folders', label: 'Manage Enrollments Archive', url: 'sheet.html?tab=Folder&f=ME%20Archive', icon: 'fa-folder', color: '#b45309' },
        { group: 'Resources', label: 'Edgenuity Student Login', url: LOGIN_URL, icon: 'fa-right-to-bracket', color: '#1a5fd4' },
        { group: 'Resources', label: 'Manage Enrollments Console', url: 'manage-enrollments.html', icon: 'fa-table-list', color: '#1a5fd4' }
      ];
    },

    getTodayEvents: function () {
      return { ok: true, dateLabel: F.longDay(D.TODAY), count: D.todayEvents.length, events: D.todayEvents };
    },

    getSendContext: function () { return SEND_CTX; },

    createBccDraft: function (grade, includeParents) {
      var list = live().filter(function (s) { return !grade || s.grade === grade; });
      var emails = emailsFor(list, includeParents);
      var label = grade > 0 ? grade + 'th Grade ' + (includeParents ? 'Students + Parents' : 'Students') : 'All ' + (includeParents ? 'Students + Parents' : 'Students');
      var parts = batches(emails, 25);
      later(function (M) {
        M.compose({ mode: 'draft', from: D.HUB_EMAIL, drafts: parts.map(function (b, i) {
          return { bcc: b, subject: 'AZOL Update — ' + label + (parts.length > 1 ? ' (Part ' + (i + 1) + ' of ' + parts.length + ')' : ''),
            html: '<p>Hello,</p><p><br></p><p>Thank you,<br>AZ Online Learning</p>' };
        }) });
      });
      return { count: emails.length, drafts: parts.length };
    },

    getInactiveRecipients: function () {
      var inact = inactiveList(), list = inact.map(function (s) { return { name: s.name, grade: s.grade, student: s.email, parents: s.parentEmails }; });
      list.sort(function (a, b) { return (a.grade - b.grade) || a.name.localeCompare(b.name); });
      var emails = emailsFor(inact, true);
      return { ok: true, count: inact.length, emailCount: emails.length, emails: emails, list: list };
    },

    createInactiveDraft: function () {
      var inact = inactiveList(), emails = emailsFor(inact, true), parts = batches(emails, 25), html = inactiveEmailHtml();
      later(function (M) {
        M.compose({ mode: 'draft', from: D.HUB_EMAIL, drafts: parts.map(function (b, i) {
          return { bcc: b, html: html, subject: 'Student Inactive — Please Log In to AZ Online Learning' + (parts.length > 1 ? ' (Part ' + (i + 1) + ' of ' + parts.length + ')' : '') };
        }) });
      });
      return { ok: true, count: emails.length, drafts: parts.length };
    },

    createTierGroupDraft: function (tier, grade) {
      var list = tierList(tier, grade);
      if (!list.length) return { ok: false, message: 'No students in that group right now.' };
      var emails = emailsFor(list, true), parts = batches(emails, 25), html = tierGroupEmailHtml();
      later(function (M) {
        M.compose({ mode: 'draft', from: D.HUB_EMAIL, drafts: parts.map(function (b, i) {
          return { bcc: b, html: html, subject: 'Progress Check-In — Please Log In to AZ Online Learning' + (parts.length > 1 ? ' (Part ' + (i + 1) + ' of ' + parts.length + ')' : '') };
        }) });
      });
      return { ok: true, count: emails.length, drafts: parts.length, students: list.length };
    },

    runAttendanceReport: function () {
      var target = D.schoolDaysBack(D.AS_OF, 1);
      var L = live().filter(function (s) { return s.flag !== 'Excused'; });
      var absent = [], inactive5 = [], critical9 = [], newGrace = [];
      L.forEach(function (s) {
        if (s.flag === 'New') { newGrace.push(s); return; }
        if (!s.lastLoginDate || s.lastLoginDate < target) absent.push(s);
        if (s.flag === 'Inactive') inactive5.push(s);
        if (s.daysSince != null && s.daysSince >= 9) critical9.push(s);
      });
      absent.sort(function (a, b) { return flip(a.name).localeCompare(flip(b.name)); });
      inactive5.sort(function (a, b) { return b.daysSince - a.daysSince; });
      critical9.sort(function (a, b) { return b.daysSince - a.daysSince; });
      var targetStr = F.longDay(target);
      var html = attendanceHtml(targetStr, absent, inactive5, critical9, newGrace);
      later(function (M) {
        M.compose({ mode: 'sent', from: 'AZOL Hub <' + D.HUB_EMAIL + '>', drafts: [{ to: D.OFFICE.to, cc: D.OFFICE.cc, html: html,
          subject: 'AZOL Attendance — did not log in ' + F.shortDay(target).replace(/, \d{4}$/, '') }] });
      });
      return { ok: true, target: targetStr, absent: absent.length, inactive5: inactive5.length, critical9: critical9.length,
        newGrace: newGrace.length, to: D.OFFICE.to.join(', '), cc: D.OFFICE.cc.join(', ') };
    },

    runTieredEmailsNow: function () {
      var L = live().filter(function (s) { return s.worstTier > 0; });
      var items = L.map(function (s) {
        var pal = TIER_PALETTE[s.worstTier];
        return { tier: s.worstTier, grade: s.grade, to: [s.email], cc: s.parentEmails ? s.parentEmails.split(', ') : [],
          subject: 'Student Update: ' + flip(s.name) + ' (Tier ' + s.worstTier + ': ' + pal.label + ')',
          who: flip(s.name), html: tierEmailHtml(s) };
      }).sort(function (a, b) { return b.tier - a.tier || a.who.localeCompare(b.who); });
      // Teacher digests (one per grade) + the Tier 3 ParentSquare list, like the live run.
      var stamp = F.mdy(D.AS_OF);
      var extras = [9, 10, 11, 12].map(function (g) {
        var n = L.filter(function (s) { return s.grade === g && s.worstTier >= 2; }).length;
        return { tier: 0, grade: g, to: D.teachersFor(g).map(function (t) { return t.email; }), cc: [], who: 'Grade ' + g + ' teachers',
          subject: 'Tiered Intervention Digest – Grade ' + g + ' – ' + stamp,
          html: '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">Good morning,<br><br>Here is a link to a PDF summary of all of the Tier 2–4 students who have been contacted:<br>' +
            '<a href="sheet.html?tab=Folder&f=Tier%20Reports">Grade ' + g + ' Tier Report – ' + stamp + '.pdf</a><br><br>Total students: ' + n + '<br><br>— Automated AZOL Progress Monitor</div>' };
      });
      var t3 = L.filter(function (s) { return s.worstTier === 3; });
      extras.push({ tier: 0, grade: 0, to: ['coordinator@' + D.STAFF_DOMAIN], cc: [], who: 'ParentSquare list',
        subject: 'Tier 3 ParentSquare flag list – ' + stamp + ' (' + t3.length + ' students)',
        html: '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">Attached: <b>tier3_parentsquare_' + D.AS_OF.toISOString().slice(0, 10) + '.csv</b> (' + t3.length +
          ' student IDs, one per line) for the ParentSquare Tier 3 flag.<br><br><span style="font-family:monospace;color:#555;">' + t3.slice(0, 8).map(function (s) { return s.extId; }).join('<br>') + '<br>…</span></div>' });
      later(function (M) { M.outbox({ items: items, extras: extras }); });
      return { ok: true, message: 'DEMO — tiered run complete as ' + D.HUB_EMAIL + '.\n\n' + items.length + ' personalized student emails (parents cc\'d), 4 teacher digests and the Tier 3 ParentSquare list were generated.\n\nNothing was sent. Click OK to open the outbox preview.' };
    },

    markContacted: function (p) {
      var now = new Date();
      D.outreach.push([now, p.name || '', p.grade || '', p.id, p.reason || 'Tier 3 · outreach call', D.HUB_EMAIL]);
      var o = D.calls[p.id] || (D.calls[p.id] = { count: 0, ts: 0, last: '' });
      o.count++; o.ts = now.getTime(); o.last = F.md(now);
      saveCalls();
      return { ok: true, date: F.md(now) };
    },
    getCalledSet: function () { return { roundStart: D.roundStart, calls: JSON.parse(JSON.stringify(D.calls)) }; },
    unmarkContacted: function (p) {
      var o = D.calls[p.id];
      if (o) {
        o.count--;
        var hist = D.outreach.filter(function (r) { return String(r[3]) === String(p.id) && /call/i.test(r[4]); });
        var lastRow = hist[hist.length - 1];
        if (lastRow) D.outreach.splice(D.outreach.indexOf(lastRow), 1);
        var prev = hist[hist.length - 2];
        if (o.count <= 0 || !prev) delete D.calls[p.id];
        else { o.ts = prev[0].getTime(); o.last = F.md(prev[0]); }
      }
      saveCalls();
      return { ok: true, history: D.calls[p.id] || null };
    },

    getAfoReview: function () { return { ok: true, html: wrapReport(afoReviewHtml(), 'AZOL Progress Analysis', 'Operator view — who to reach and why') }; },
    getLeadershipReview: function () { return { ok: true, html: wrapReport(leadershipReviewHtml(), 'Leadership Progress Analysis', 'District view — campuses, seniors, systemic risk') }; },

    getManageEnrollments: function () { return { ok: false, message: 'Use the Manage Enrollments console.' }; },

    // Manage Enrollments console
    meListSnapshots: function () { buildMeBase(); return { ok: true, snapshots: meSnaps.map(stripSnap) }; },
    meGetReport: function (id) {
      buildMeBase();
      var snap = meSnaps.filter(function (s) { return s.id === id; })[0];
      return snap ? meReport(snap) : { ok: false, message: 'Report not found.' };
    },
    meBootstrap: function () { buildMeBase(); return { ok: true, snapshots: meSnaps.map(stripSnap), newest: meReport(meSnaps[0]) }; }
  };
  function stripSnap(s) { return { id: s.id, name: s.name, date: s.date, label: s.label, ts: s.ts, pending: s.pending }; }

  // Calls a visitor logs in the Outreach Call List stick for them (this browser only).
  var CALL_KEY = 'azol-demo-calls-' + D.AS_OF.toISOString().slice(0, 10);
  function saveCalls() { try { localStorage.setItem(CALL_KEY, JSON.stringify(D.calls)); } catch (e) {} }
  try { var saved = localStorage.getItem(CALL_KEY); if (saved) D.calls = JSON.parse(saved); } catch (e) {}

  // ═══════ google.script.run stand-in ═══════
  function Runner(ok, fail) { this._ok = ok; this._fail = fail; }
  Runner.prototype.withSuccessHandler = function (fn) { return new Runner(fn, this._fail); };
  Runner.prototype.withFailureHandler = function (fn) { return new Runner(this._ok, fn); };
  Runner.prototype.withUserObject = function () { return this; };
  Object.keys(API).forEach(function (name) {
    Runner.prototype[name] = function () {
      var args = arguments, ok = this._ok, fail = this._fail;
      setTimeout(function () {
        var res;
        try { res = API[name].apply(null, args); }
        catch (e) { if (fail) fail(e); else console.error(e); return; }
        if (ok) ok(res && typeof res === 'object' ? JSON.parse(JSON.stringify(res)) : res);
      }, 120 + Math.random() * 280);
    };
  });
  window.google = window.google || {};
  window.google.script = { run: new Runner() };
  window.DEMO_API = API;
})();
