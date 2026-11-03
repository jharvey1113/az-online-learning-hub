/* AZ Online Learning Hub (demo) — fictional data generator.
 *
 * Every student, parent, teacher, phone number and email address here is
 * invented. Emails use the reserved .example domain and phone numbers use the
 * 555-01xx fictional range, so nothing can ever reach a real person.
 *
 * The generator is seeded, so every page (hub, Manage Enrollments console,
 * sheet viewer) builds the same students. Dates are relative to today so the
 * demo always looks current.
 */
(function () {
  'use strict';

  // ── seeded random ────────────────────────────────────────────────────────
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry32(2026);
  function rr(a, b) { return a + (b - a) * rnd(); }
  function ri(a, b) { return Math.floor(rr(a, b + 1)); }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function chance(p) { return rnd() < p; }
  function weighted(pairs) {
    var t = 0, i; for (i = 0; i < pairs.length; i++) t += pairs[i][1];
    var x = rnd() * t;
    for (i = 0; i < pairs.length; i++) { x -= pairs[i][1]; if (x <= 0) return pairs[i][0]; }
    return pairs[pairs.length - 1][0];
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function round2(x) { return Math.round(x * 100) / 100; }

  // ── dates (school days relative to today) ────────────────────────────────
  function dOnly(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function isWeekend(d) { return d.getDay() === 0 || d.getDay() === 6; }
  function schoolDaysBack(from, n) {
    var d = dOnly(from);
    while (n > 0) { d.setDate(d.getDate() - 1); if (!isWeekend(d)) n--; }
    return d;
  }
  function schoolDaysBetween(a, b) {
    var n = 0, d = dOnly(a), e = dOnly(b);
    while (d < e) { d.setDate(d.getDate() + 1); if (!isWeekend(d)) n++; }
    return n;
  }
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var MON3 = MONTHS.map(function (m) { return m.slice(0, 3); });
  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function md(d) { return (d.getMonth() + 1) + '/' + d.getDate(); }
  function mdy(d) { return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear(); }
  function mdy2(d) { return ('0' + (d.getMonth() + 1)).slice(-2) + '/' + ('0' + d.getDate()).slice(-2) + '/' + d.getFullYear(); }
  function monD(d) { return MON3[d.getMonth()] + ' ' + d.getDate(); }
  function longDay(d) { return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function shortDay(d) { return DAYS[d.getDay()].slice(0, 3) + ', ' + MON3[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }

  var TODAY = dOnly(new Date());
  var AS_OF = new Date(TODAY);                       // the "report" date: today, or Friday on a weekend
  while (isWeekend(AS_OF)) AS_OF.setDate(AS_OF.getDate() - 1);

  // Semester window → how far along students "should" be today.
  var Y = AS_OF.getFullYear(), M = AS_OF.getMonth();
  var syStart = M >= 6 ? Y : Y - 1;                   // school year starts in July
  var S1 = [new Date(syStart, 7, 4), new Date(syStart, 11, 18)];
  var S2 = [new Date(syStart + 1, 0, 6), new Date(syStart + 1, 4, 21)];
  var sem = (AS_OF >= S2[0]) ? S2 : S1;
  var semFrac = Math.max(0.08, Math.min(0.97, (AS_OF - sem[0]) / (sem[1] - sem[0])));
  var SY_LABEL = String(syStart).slice(2) + '-' + String(syStart + 1).slice(2);
  var SEM_LABEL = sem === S1 ? 'Sem 1' : 'Sem 2';

  // ── people ───────────────────────────────────────────────────────────────
  var FIRST = ['Aiden','Alejandro','Amara','Andre','Aria','Ava','Benjamin','Brianna','Caleb','Camila','Carlos','Chloe','Daniel',
    'Daniela','Destiny','Diego','Elena','Elijah','Emily','Emmanuel','Erin','Ethan','Gabriel','Gianna','Grace','Hailey','Hannah',
    'Isaac','Isabella','Isaiah','Jada','Jasmine','Javier','Jayden','Jordan','Josiah','Julian','Kayla','Kevin','Kiara','Landon',
    'Layla','Leah','Liam','Lucas','Luis','Madison','Malik','Marcus','Maria','Mateo','Maya','Micah','Mia','Nadia','Naomi','Nathan',
    'Nevaeh','Noah','Olivia','Omar','Owen','Priya','Rafael','Riley','Rosa','Ryan','Samantha','Santiago','Sara','Sebastian','Sofia',
    'Tanner','Taylor','Trinity','Tyler','Valeria','Victor','Xavier','Yasmin','Zoe','Adrian','Bella','Cristian','Dominic','Eva',
    'Felix','Hector','Iris','Jalen','Kai','Lena','Mason','Nora','Paige','Quinn','Reyna','Silas','Talia','Uriel','Wyatt'];
  var LAST = ['Acosta','Adams','Aguilar','Allen','Alvarez','Anderson','Bailey','Baker','Barnes','Bell','Bennett','Brooks','Bryant',
    'Castillo','Castro','Chavez','Chen','Coleman','Collins','Cook','Cooper','Cruz','Davis','Delgado','Diaz','Dominguez','Edwards',
    'Ellis','Espinoza','Evans','Fisher','Flores','Foster','Garcia','Gomez','Gonzalez','Graham','Gray','Green','Guerrero','Gutierrez',
    'Hall','Harris','Hayes','Henderson','Hernandez','Herrera','Hill','Howard','Hughes','Jackson','James','Jenkins','Jimenez',
    'Johnson','Jordan','Kelly','Kim','King','Lee','Lewis','Long','Lopez','Martin','Martinez','Medina','Mendoza','Meyer','Mitchell',
    'Moore','Morales','Moreno','Murphy','Myers','Nelson','Nguyen','Ortiz','Owens','Parker','Patel','Perez','Peterson','Phillips',
    'Price','Ramirez','Ramos','Reed','Reyes','Rivera','Roberts','Robinson','Rodriguez','Romero','Ross','Ruiz','Russell','Salazar',
    'Sanchez','Sanders','Scott','Silva','Simmons','Soto','Stewart','Sullivan','Thomas','Thompson','Torres','Tran','Turner',
    'Vargas','Vasquez','Walker','Ward','Washington','Watson','White','Williams','Wilson','Wood','Wright','Young'];
  var GUARD_F = ['Adriana','Angela','Carmen','Claudia','Denise','Erica','Gloria','Jennifer','Karen','Laura','Lisa','Marisol',
    'Monica','Patricia','Raquel','Sandra','Teresa','Veronica','Yolanda'];
  var GUARD_M = ['Brian','Christopher','David','Eduardo','Francisco','James','Jose','Manuel','Michael','Paul','Robert','Steven','William'];
  var GUARD_FIRST = GUARD_F.concat(GUARD_M);

  var STU_DOMAIN = 'students.azol.example';
  var FAM_DOMAIN = 'family.example';
  var STAFF_DOMAIN = 'azol.example';

  var TEACHERS = {
    '9th & 10th Grade': [
      { name: 'Ms. Alvarez', email: 'malvarez@' + STAFF_DOMAIN },
      { name: 'Mr. Brooks', email: 'tbrooks@' + STAFF_DOMAIN }
    ],
    '11th Grade': [
      { name: 'Ms. Chen', email: 'lchen@' + STAFF_DOMAIN },
      { name: 'Mr. Duarte', email: 'rduarte@' + STAFF_DOMAIN }
    ],
    '12th Grade': [
      { name: 'Ms. Ellis', email: 'kellis@' + STAFF_DOMAIN },
      { name: 'Mr. Foster', email: 'jfoster@' + STAFF_DOMAIN },
      { name: 'Ms. Garza', email: 'agarza@' + STAFF_DOMAIN }
    ]
  };
  function teachersFor(g) { return TEACHERS[g <= 10 ? '9th & 10th Grade' : (g === 11 ? '11th Grade' : '12th Grade')]; }

  var HUB_EMAIL = 'hub@' + STAFF_DOMAIN;
  var OFFICE = { to: ['attendance@' + STAFF_DOMAIN, 'frontoffice@' + STAFF_DOMAIN], cc: ['coordinator@' + STAFF_DOMAIN] };

  // Course teachers of record (Edgenuity "Teachers" column)
  var COURSE_TEACHERS = ['Rivera, Ana', 'Hale, Marcus', 'Okafor, Grace', 'Lindqvist, Erik', 'Montoya, Celia', 'Park, Daniel', 'Whitfield, June'];

  // ── courses ──────────────────────────────────────────────────────────────
  var S = SEM_LABEL === 'Sem 1' ? 'A' : 'B';
  function c(name, subject, code) { return { name: name + ' ' + S, subject: subject, code: code + S }; }
  var POOL = {
    9:  [c('English 9', 'English Language Arts', 'ELA9'), c('Algebra I', 'Mathematics', 'ALG1'), c('Biology', 'Science', 'BIO'),
         c('World History', 'Social Studies', 'WHIS'), c('Health', 'Physical Education & Health', 'HLTH'),
         c('Physical Education', 'Physical Education & Health', 'PE'), c('Spanish I', 'World Languages', 'SPN1'),
         c('Digital Literacy', 'Electives', 'DLIT')],
    10: [c('English 10', 'English Language Arts', 'ELA10'), c('Geometry', 'Mathematics', 'GEOM'), c('Chemistry', 'Science', 'CHEM'),
         c('World Geography', 'Social Studies', 'WGEO'), c('Spanish II', 'World Languages', 'SPN2'),
         c('Art Appreciation', 'Electives', 'ARTA'), c('Physical Education', 'Physical Education & Health', 'PE'),
         c('Earth & Space Science', 'Science', 'ESS')],
    11: [c('English 11', 'English Language Arts', 'ELA11'), c('Algebra II', 'Mathematics', 'ALG2'), c('Physics', 'Science', 'PHYS'),
         c('U.S. History', 'Social Studies', 'USH'), c('Psychology', 'Electives', 'PSY'), c('Environmental Science', 'Science', 'ENVS'),
         c('Financial Literacy', 'Electives', 'FINL'), c('Spanish II', 'World Languages', 'SPN2')],
    12: [c('English 12', 'English Language Arts', 'ELA12'), c('Pre-Calculus', 'Mathematics', 'PREC'),
         c('American Government', 'Social Studies', 'GOV'), c('Economics', 'Social Studies', 'ECON'),
         c('Consumer Math', 'Mathematics', 'CMTH'), c('Sociology', 'Electives', 'SOC'), c('Anatomy & Physiology', 'Science', 'ANAT'),
         c('Career Explorations', 'Electives', 'CARX')]
  };

  // ── tier rule (same rule as the live pipeline) ───────────────────────────
  function tierFor(F, T, P, J, act, isNew, hasData) {
    if (isNew || !hasData) return '—';
    var s = 0;
    if (F !== null && F >= 0 && P !== null && P > 0) { if (F < 70) s += 1; if (F < 55) s += 1; }
    if (J !== null && T !== null && T > 0) {
      if (J <= -0.2 * T) s += 2;
      else if (J > -0.2 * T && J < -0.1 * T) s += 1;
    }
    if (!act) s += 2;
    return s >= 5 ? 'Tier 4' : s >= 3 ? 'Tier 3' : s >= 1 ? 'Tier 2' : 'Tier 1';
  }
  function tierRank(t) { return { 'Tier 1': 1, 'Tier 2': 2, 'Tier 3': 3, 'Tier 4': 4 }[t] || 0; }

  // ── build AZOL students ──────────────────────────────────────────────────
  var usedNames = {}, usedIds = {};
  function newName() {
    for (;;) {
      var n = pick(LAST) + ', ' + pick(FIRST);
      if (!usedNames[n]) { usedNames[n] = true; return n; }
    }
  }
  function newId() {
    for (;;) {
      var id = String(ri(310000, 389999));
      if (!usedIds[id]) { usedIds[id] = true; return id; }
    }
  }
  function slug(s) { return s.toLowerCase().replace(/[^a-z]/g, ''); }
  function phone() { return '(602) 555-01' + ('0' + ri(0, 99)).slice(-2); }

  var GRADE_COUNTS = { 9: 34, 10: 48, 11: 62, 12: 78 };
  var PROFILES = [['strong', 44], ['steady', 22], ['slipping', 12], ['behind', 11], ['dark', 8], ['new', 3]];
  var target = round2(semFrac * 100);

  var students = [];
  [9, 10, 11, 12].forEach(function (g) {
    for (var k = 0; k < GRADE_COUNTS[g]; k++) {
      var name = newName(), id = newId();
      var parts = name.split(', ');
      var first = parts[1], last = parts[0];
      var profile = weighted(PROFILES);
      var nCourses = g === 12 ? ri(3, 5) : ri(3, 6);
      var courses = shuffle(POOL[g]).slice(0, nCourses);
      // a few students were enrolled late, so their own target is lower
      var lateStart = chance(0.12) ? rr(0.55, 0.85) : 1;
      var dark = profile === 'dark', isNew = profile === 'new';
      var daysSince = isNew ? null : dark ? weighted([[5, 4], [6, 3], [7, 3], [8, 2], [9, 1], [11, 1], [14, 1], [18, 1]]) : weighted([[0, 56], [1, 32], [2, 7], [3, 3], [4, 2]]);
      var lastLogin = (daysSince === null || (dark && chance(0.12))) ? null : schoolDaysBack(AS_OF, daysSince);
      if (dark && !lastLogin) daysSince = 999;
      var act = !dark;
      var flag = isNew ? 'New' : (dark ? 'Inactive' : 'Active');

      var crs = courses.map(function (co) {
        var T = round2(target * lateStart * rr(0.94, 1.04));
        var P, F;
        switch (profile) {
          case 'strong':   P = T + rr(-4, 14);           F = rr(81, 98); break;
          case 'steady':   P = T + rr(-9, 5);            F = rr(71, 92); break;
          case 'slipping': P = T * (1 - rr(0.06, 0.24)); F = rr(64, 86); break;
          case 'behind':   P = T * (1 - rr(0.3, 0.75));  F = rr(42, 74); break;
          case 'dark':     P = T * (1 - rr(0.35, 0.9));  F = rr(28, 66); break;
          default:         P = 0;                        F = null;
        }
        // mixed loads: even strong kids sometimes have one rough class
        if ((profile === 'strong' || profile === 'steady') && chance(0.04)) { P = T * (1 - rr(0.1, 0.24)); F = rr(62, 79); }
        P = Math.max(0, Math.min(100, round2(P)));
        F = F === null ? null : round2(F);
        var J = isNew ? null : round2(P - T);
        var tier = tierFor(F, T, P, J, act, isNew, P > 0 || dark);
        return {
          course: co.name, subject: co.subject, code: co.code,
          grade: F === null ? 0 : F, target: T, progress: P, deltaPts: J, tier: tier,
          teacher: pick(COURSE_TEACHERS)
        };
      });

      var worst = 0;
      crs.forEach(function (cc) { worst = Math.max(worst, tierRank(cc.tier)); });

      var guardians = [];
      var nG = chance(0.7) ? 1 : 2;
      for (var gI = 0; gI < nG; gI++) {
        var rel = gI === 0 ? weighted([['Mother', 55], ['Father', 30], ['Grandmother', 8], ['Guardian', 7]]) : weighted([['Father', 60], ['Mother', 30], ['Stepparent', 10]]);
        var gf = pick(rel === 'Mother' || rel === 'Grandmother' ? GUARD_F : rel === 'Father' ? GUARD_M : GUARD_FIRST);
        var phones = [{ number: phone(), type: 'Cell' }];
        if (chance(0.25)) phones.push({ number: phone(), type: 'Work' });
        guardians.push({ name: gf + ' ' + last, relation: rel, email: slug(gf) + '.' + slug(last) + (gI ? gI + 1 : '') + '@' + FAM_DOMAIN, phones: phones });
      }

      students.push({
        name: name, first: first, last: last, grade: g, extId: id, profile: profile,
        email: slug(first).charAt(0) + slug(last) + id.slice(-3) + '@' + STU_DOMAIN,
        guardians: guardians,
        courses: crs, worstTier: worst, flag: flag,
        daysSince: daysSince, lastLoginDate: lastLogin,
        lastLogin: lastLogin ? md(lastLogin) : 'Never',
        enrolled: isNew ? schoolDaysBack(AS_OF, ri(2, 9)) : new Date(sem[0].getTime() + rr(0, 1 - lateStart + 0.02) * (AS_OF - sem[0]))
      });
    }
  });
  students.forEach(function (s) { s.parentEmails = s.guardians.map(function (g) { return g.email; }).join(', '); });

  // ── credits (22 to graduate, 5.5/yr pace, 0.5 per semester class) ────────
  var REQ_LEFT = {
    12: ['English 12 (Sem 2)', 'American Government', 'Economics', 'Senior Math (Sem 2)'],
    11: ['English 11 (Sem 2)', 'U.S. History (Sem 2)', 'Algebra II (Sem 2)', 'Lab Science (Sem 2)'],
    10: ['English 10 (Sem 2)', 'Geometry (Sem 2)', 'World Geography (Sem 2)'],
    9:  ['English 9 (Sem 2)', 'Algebra I (Sem 2)', 'Biology (Sem 2)']
  };
  students.forEach(function (s) {
    var base = 5.5 * (s.grade - 9) + (sem === S2 ? 3 : 0);
    var adj = { strong: rr(0, 1.5), steady: rr(-0.5, 0.5), slipping: rr(-1.5, 0), behind: rr(-4, -1), dark: rr(-6, -1.5), 'new': rr(-3, 0.5) }[s.profile];
    var earned = Math.max(0, Math.round((base + adj) * 2) / 2);
    var current = s.courses.length * 0.5;
    var s2 = sem === S1 ? Math.round(rr(2.5, 3) * 2) / 2 : 0;
    var proj = earned + current + s2;
    var gapAfter = '';
    if (s.grade === 12 && proj < 22) {
      var short = 22 - proj;
      gapAfter = short >= 1.5 ? '1.0 English; ' + (short - 1).toFixed(1) + ' elective' : short.toFixed(1) + ' Social Studies (Economics)';
    } else if (s.grade < 12 && proj < 5.5 * (s.grade - 8) - 3) {
      gapAfter = (5.5 * (s.grade - 8) - proj).toFixed(1) + ' credits vs. pace';
    }
    s.credits = {
      cohort: String(syStart + 1 + (12 - s.grade)),
      earned: earned, current: current, s2: s2, gapAfter: gapAfter,
      westMec: chance(0.06) ? 'Automotive Technology (CTE elective)' : '',
      reqInProgress: s.courses.slice(0, 2).map(function (c) { return c.course; }).join('; '),
      reqPartial: chance(0.15) ? pick(REQ_LEFT[s.grade]) : '',
      reqNotStarted: (s.grade >= 11 && chance(0.25)) ? pick(REQ_LEFT[s.grade]).replace(' (Sem 2)', '') : '',
      reqCheck: chance(0.05) ? 'World History (transfer, out of state)' : '',
      studentEmail: s.email,
      guardians: s.guardians,
      asOf: mdy(AS_OF)
    };
  });

  // ── life events (these students are "held harmless") ─────────────────────
  var LIFE = [
    ['Medical / Illness', 'High', 'Hospitalized last week; family asked for a pause on outreach. Nurse is coordinating a return plan.', 'Active', 3, 7],
    ['Family Loss', 'High', 'Grandparent passed away. Counselor checked in; extended deadlines through next Friday.', 'Active', 5, 4],
    ['Housing / RTC Placement', 'Medium', 'Moved to a residential program; new site will send work-time schedule.', 'Active', 9, 10],
    ['New Baby', 'Medium', 'Student had a baby 10/22. Reduced load approved by admin; check in weekly.', 'Monitoring', 12, 14],
    ['Extended Absence', 'Low', 'Family travel out of country, returning mid-month. Laptop and hotspot with student.', 'Monitoring', 16, 9],
    ['Personal Crisis', 'Medium', 'Working with counselor and outside provider. Keep contact through counselor only.', 'Active', 2, 5]
  ];
  var lifeEvents = [];
  var heldPool = students.filter(function (s) { return s.profile !== 'new'; });
  heldPool = shuffle(heldPool).slice(0, LIFE.length);
  heldPool.forEach(function (s, i) {
    var L = LIFE[i];
    s.held = true;
    var ts = new Date(TODAY); ts.setDate(ts.getDate() - L[4]); ts.setHours(8 + i, (17 * i) % 60);
    var fu = new Date(TODAY); fu.setDate(fu.getDate() + L[5]);
    var days = L[4];
    lifeEvents.push({
      name: s.name, grade: String(s.grade), category: L[0], severity: L[1], note: L[2],
      enteredBy: pick(['Ms. Chen', 'Mr. Brooks', 'Counseling', 'Ms. Ellis']), status: L[3],
      timeAgo: days === 0 ? 'Today' : days === 1 ? '1d ago' : days < 7 ? days + 'd ago' : Math.floor(days / 7) + 'w ago',
      followUp: md(fu), extId: s.extId, matched: true, timestamp: ts, followUpDate: fu
    });
  });
  var sevOrder = { High: 0, Medium: 1, Low: 2 };
  lifeEvents.sort(function (a, b) { return sevOrder[a.severity] - sevOrder[b.severity]; });

  // ── outreach (tier email rounds + phone calls) ───────────────────────────
  var roundStart = schoolDaysBack(AS_OF, 7); roundStart.setHours(11, 29, 0, 0);
  var prevRound = schoolDaysBack(AS_OF, 17);
  var outreach = [];   // [date, name, grade, id, reason, sentBy]
  students.forEach(function (s) {
    if (s.held) return;
    if (s.worstTier >= 2) {
      outreach.push([prevRound, s.name, s.grade, s.extId, 'Tier email · Tier ' + s.worstTier, HUB_EMAIL]);
      outreach.push([new Date(roundStart), s.name, s.grade, s.extId, 'Tier email · Tier ' + s.worstTier, HUB_EMAIL]);
    }
    if (s.flag === 'Inactive' && chance(0.7)) outreach.push([schoolDaysBack(AS_OF, ri(1, 4)), s.name, s.grade, s.extId, 'Inactive 5+ days', HUB_EMAIL]);
  });

  // Call list = Tier 3, average delta between -20 and -60, not New/Excused.
  function avgDelta(s) {
    var sum = 0, n = 0;
    s.courses.forEach(function (c) { if (c.deltaPts !== null) { sum += c.deltaPts; n++; } });
    return n ? sum / n : null;
  }
  var callable = students.filter(function (s) {
    var d = avgDelta(s);
    return !s.held && s.worstTier === 3 && s.flag !== 'New' && d !== null && d <= -20 && d >= -60;
  });
  var calls = {};   // id -> {count, ts, last}
  var staffCallers = ['lchen@', 'tbrooks@', 'kellis@', 'jfoster@'];
  callable.forEach(function (s) {
    var r = rnd();
    var when = [];
    if (r < 0.4) { when.push(schoolDaysBack(AS_OF, ri(0, 5))); if (chance(0.4)) when.push(schoolDaysBack(AS_OF, ri(9, 14))); }
    else if (r < 0.65) when.push(schoolDaysBack(AS_OF, ri(9, 16)));
    when.forEach(function (d) {
      d.setHours(ri(9, 15), ri(0, 59));
      outreach.push([d, s.name, s.grade, s.extId, 'Tier 3 · outreach call', pick(staffCallers) + STAFF_DOMAIN]);
      var o = calls[s.extId] || (calls[s.extId] = { count: 0, ts: 0, last: '' });
      o.count++;
      if (d.getTime() > o.ts) { o.ts = d.getTime(); o.last = md(d); }
    });
  });
  outreach.sort(function (a, b) { return a[0] - b[0]; });

  var contactCounts = {};
  outreach.forEach(function (r) {
    var o = contactCounts[r[3]] || (contactCounts[r[3]] = { count: 0, last: '' });
    o.count++; o.last = md(r[0]);
  });

  // ── new enrollees with no start yet ──────────────────────────────────────
  var newEnroll = students.filter(function (s) { return s.profile === 'new' && !s.held; }).map(function (s) {
    var days = schoolDaysBetween(s.enrolled, AS_OF);
    var g = s.guardians[0];
    return {
      id: s.extId, name: s.name, grade: s.grade, daysSince: days, enrolled: mdy(s.enrolled),
      parentName: g.name, contactEmail: g.email, parentPhone: g.phones.map(function (p) { return p.number; }).join(', '),
      studentEmail: s.email
    };
  }).filter(function (x) { return x.daysSince >= 3; }).sort(function (a, b) { return b.daysSince - a.daysSince; });
  var awaitingSetup = [0, 1].map(function () {
    var nm = newName(), id = newId(), p = nm.split(', ');
    return { id: id, name: nm, grade: ri(9, 12), daysSince: ri(1, 2), enrolled: mdy(schoolDaysBack(AS_OF, 2)),
      parentName: pick(GUARD_FIRST) + ' ' + p[0], contactEmail: slug(p[1]) + '.' + slug(p[0]) + '@' + FAM_DOMAIN, parentPhone: phone(), studentEmail: '' };
  });

  // ── other campuses (for the district-wide Manage Enrollments report) ─────
  var CAMPUSES = [['Desert Ridge High School', 46], ['Sonoran Valley High School', 38], ['Mesa Verde High School', 52],
    ['Canyon View High School', 31], ['Saguaro Peak High School', 27]];
  var otherStudents = [];
  CAMPUSES.forEach(function (cp) {
    for (var i = 0; i < cp[1]; i++) {
      var g = weighted([[9, 18], [10, 24], [11, 28], [12, 30]]);
      var nm = newName(), id = newId(), parts = nm.split(', ');
      var profile = weighted([['strong', 30], ['steady', 30], ['slipping', 20], ['behind', 15], ['dark', 5]]);
      var crs = shuffle(POOL[g]).slice(0, ri(1, 2)).map(function (co) {
        var T = round2(target * rr(0.9, 1.04)), P, F;
        switch (profile) {
          case 'strong': P = T + rr(-5, 12); F = rr(80, 97); break;
          case 'steady': P = T + rr(-12, 3); F = rr(68, 90); break;
          case 'slipping': P = T * (1 - rr(0.08, 0.3)); F = rr(58, 82); break;
          case 'behind': P = T * (1 - rr(0.3, 0.7)); F = rr(42, 72); break;
          default: P = T * (1 - rr(0.4, 0.9)); F = rr(30, 62);
        }
        P = Math.max(0, Math.min(100, round2(P)));
        return { course: co.name, subject: co.subject, code: co.code, grade: round2(F), target: T, progress: P, deltaPts: round2(P - T), teacher: pick(COURSE_TEACHERS) };
      });
      otherStudents.push({ name: nm, first: parts[1], last: parts[0], grade: g, extId: id, campus: cp[0], profile: profile, courses: crs,
        daysSince: profile === 'dark' ? ri(5, 15) : ri(0, 3) });
    }
  });

  // ── academic integrity incidents ─────────────────────────────────────────
  var weekStart = new Date(AS_OF); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  var weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
  var prevStart = new Date(weekStart); prevStart.setDate(prevStart.getDate() - 7);
  var trackStart = new Date(sem[0]); trackStart.setDate(trackStart.getDate() + 7);
  var STATUSES = ['Teacher conference held; redo assigned', 'Parent contacted; zero on assignment', 'Second offense: referred to admin',
    'AI detector + version history reviewed; redo assigned', 'Student admitted; resubmitted with citations', 'Under review'];
  var integrity = [];
  var poolAll = students.filter(function (s) { return !s.held && s.profile !== 'new'; });
  function addIncident(d) {
    var useAzol = chance(0.72);
    var s = useAzol ? pick(poolAll) : pick(otherStudents);
    var crs = pick(s.courses);
    var type = weighted([['AI', 55], ['Plagiarism', 24], ['Bot/Script', 8], ['Other', 13]]);
    integrity.push({
      type: type, date: mdy(d), ts: dOnly(d).getTime(),
      name: s.first + ' ' + s.last, id: s.extId,
      campus: useAzol ? 'AZ Online Learning' : s.campus,
      course: crs.course, teacher: crs.teacher.split(', ').reverse().join(' '),
      status: 'INC-' + String(syStart + 1).slice(2) + '-' + ri(1001, 1499) + ' · ' + (dOnly(d) >= weekStart ? 'Under review' : pick(STATUSES))
    });
  }
  for (var d0 = new Date(trackStart); d0 < weekStart; d0.setDate(d0.getDate() + 1)) {
    if (isWeekend(d0)) continue;
    var inPrev = d0 >= prevStart;
    if (chance(inPrev ? 0.75 : 0.42)) addIncident(new Date(d0));
  }
  for (var d1 = new Date(weekStart); d1 <= AS_OF; d1.setDate(d1.getDate() + 1)) {
    if (isWeekend(d1)) continue;
    addIncident(new Date(d1));
    if (chance(0.6)) addIncident(new Date(d1));
  }
  integrity.sort(function (a, b) { return b.ts - a.ts; });

  // ── registrar enrollment form (for the enrollment banner + sheet viewer) ─
  var lastWeekStart = new Date(weekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  var lastWeekEnd = new Date(lastWeekStart); lastWeekEnd.setDate(lastWeekEnd.getDate() + 4);
  var registrar = [];
  for (var d2 = new Date(sem[0]); d2 <= AS_OF; d2.setDate(d2.getDate() + 1)) {
    if (isWeekend(d2)) continue;
    var early = (d2 - sem[0]) / 86400000 < 21;
    var nIn = early ? ri(1, 5) : (chance(0.55) ? ri(1, 2) : 0);
    var nOut = chance(early ? 0.2 : 0.3) ? 1 : 0;
    for (var a = 0; a < nIn + nOut; a++) {
      var t = new Date(d2); t.setHours(ri(8, 15), ri(0, 59));
      registrar.push({ ts: t, purpose: a < nIn ? 'Enrollment' : 'Withdrawal', name: newName(), grade: ri(9, 12),
        special: a < nIn ? weighted([['', 76], ['IEP', 11], ['504', 7], ['ELL', 6]]) : '' });
    }
  }

  // ── calendar for "Today at AZOL" ─────────────────────────────────────────
  var todayEvents = [
    { title: 'Progress reports window open', allDay: true, time: 'All day', start: 0 },
    { title: 'Staff huddle (Meet)', allDay: false, time: '7:45 AM', start: 1 },
    { title: 'Math office hours: Algebra II', allDay: false, time: '10:00 AM', start: 2 },
    { title: 'Tier 3 call block', allDay: false, time: '1:00 PM', start: 3 },
    { title: 'New student orientation', allDay: false, time: '3:30 PM', start: 4 }
  ];

  window.DEMO = {
    TODAY: TODAY, AS_OF: AS_OF, SEM: sem, SEM_LABEL: SEM_LABEL, SY_LABEL: SY_LABEL, semFrac: semFrac,
    weekStart: weekStart, weekEnd: weekEnd, prevStart: prevStart, lastWeekStart: lastWeekStart, lastWeekEnd: lastWeekEnd,
    roundStart: roundStart.getTime(),
    students: students, otherStudents: otherStudents, campuses: CAMPUSES.map(function (c) { return c[0]; }),
    lifeEvents: lifeEvents, outreach: outreach, contactCounts: contactCounts, calls: calls,
    newEnroll: newEnroll, awaitingSetup: awaitingSetup, integrity: integrity, registrar: registrar,
    todayEvents: todayEvents, TEACHERS: TEACHERS, teachersFor: teachersFor,
    HUB_EMAIL: HUB_EMAIL, OFFICE: OFFICE, STAFF_DOMAIN: STAFF_DOMAIN,
    tierRank: tierRank, avgDelta: avgDelta,
    fmt: { md: md, mdy: mdy, mdy2: mdy2, monD: monD, longDay: longDay, shortDay: shortDay, MON3: MON3 },
    schoolDaysBack: schoolDaysBack, schoolDaysBetween: schoolDaysBetween,
    rnd: rnd, ri: ri, rr: rr, pick: pick, chance: chance
  };
})();
