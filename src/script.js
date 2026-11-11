// ============================================================
// Fasla.DEV — HTML Fundamentals course platform (vanilla JS)
// ============================================================
import { LESSONS, LEVELS } from './content/index.js';
import { esc, escAttr, highlight, mountEditor, buildPreviewDoc, checkHtml, checkJs } from './editor.js';

/* ---------- Constants ---------- */
const ACCESS_CODE = 'FSD-252005';
const TOTAL = LESSONS.length; // 20
const PASS = 4;               // minimum score (out of 7) to unlock next lesson
const MAX_Q = 7;
const MAX_TOTAL = TOTAL * MAX_Q; // 140
const DB_KEY = 'fasla-dev.students.v1';
const SESSION_KEY = 'fasla-dev.session.v1';

const TABS = [
  { k: 'explain', l: 'الشرح' },
  { k: 'play', l: 'ساحة الكود' },
  { k: 'practice', l: 'التمرين العملي' },
  { k: 'quiz', l: 'الاختبار' },
];
const FILE_LABEL = { html: 'HTML', css: 'CSS', js: 'JavaScript' };
// [minimum percentage, Arabic label, English label]
const BANDS = [
  [95, 'متميز', 'Outstanding'],
  [85, 'ممتاز', 'Excellent'],
  [75, 'جيد جدًا', 'Very Good'],
  [65, 'جيد', 'Good'],
  [50, 'مقبول', 'Acceptable'],
  [0, 'يحتاج إلى مزيد من التدريب', 'Needs More Practice'],
];

const ICON = {
  lock: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" fill="currentColor"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  check: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12.5l4.8 4.8L19.5 7" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>',
};

const app = document.getElementById('app');
const toastRoot = document.getElementById('toast-root');

let db = readDb();
let view = { n: 1, tab: 'explain' };
let playCtx = null; // { frame, log } for the currently mounted playground

/* ---------- Helpers ---------- */
const pad = (n) => String(n).padStart(2, '0');
const isLatin = (t) => /^[\x00-\x7F]+$/.test(t);
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const band = (p) => BANDS.find((b) => p >= b[0]);
const lessonLabel = (s) => (s >= 7 ? 'ممتاز' : s === 6 ? 'جيد جدًا' : s === 5 ? 'جيد' : s === 4 ? 'مقبول' : 'يحتاج إلى تحسين');

// Inline Markdown-lite: **bold** and `code`
function inline(t = '') {
  return esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code dir="ltr">$1</code>');
}
const codeText = (t) => (isLatin(t) ? `<code dir="ltr">${esc(t)}</code>` : esc(t));

function codeBlock(code, lang = 'html') {
  const body = lang === 'text' ? esc(code) : highlight(code, lang);
  return `<div class="code-wrap" dir="ltr"><div class="code-h"><span>${esc(lang.toUpperCase())}</span></div><pre class="code"><code>${body}</code></pre></div>`;
}

function toast(msg, kind = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  toastRoot.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function mount(html) {
  app.innerHTML = html;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    ta.remove();
    return ok;
  }
}

/* ---------- Persistence (LocalStorage) ---------- */
function readDb() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function persist() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    toast('تعذر حفظ التقدم على هذا المتصفح. تأكد من إعدادات التخزين.', 'warn');
  }
}

function me() {
  const id = localStorage.getItem(SESSION_KEY);
  return id && db[id] ? db[id] : null;
}

function makeId(name, age) {
  return `${name.toLowerCase()}|${age}`;
}

// Returns (and lazily creates) the saved record of one lesson.
function recOf(s, n) {
  if (!s.lessons[n]) {
    s.lessons[n] = { done: false, result: null, attempts: 0, quiz: { draft: [], review: false }, code: null, checks: null, checkDetail: null };
  }
  const r = s.lessons[n];
  if (!r.quiz) r.quiz = { draft: [], review: false };
  if (!r.quiz.draft) r.quiz.draft = [];
  return r;
}

const isDone = (s, n) => !!(s.lessons[n] && s.lessons[n].done);
const isUnlocked = (s, n) => n === 1 || isDone(s, n - 1);

function stats(s) {
  let done = 0;
  let total = 0;
  let last = 0;
  for (let n = 1; n <= TOTAL; n++) {
    if (isDone(s, n)) { done++; last = n; }
    total += s.lessons[n]?.result?.score ?? 0;
  }
  let current = TOTAL;
  for (let n = 1; n <= TOTAL; n++) {
    if (!isDone(s, n)) { current = n; break; }
  }
  return {
    done,
    remaining: TOTAL - done,
    pct: Math.round((done / TOTAL) * 100),
    total,
    totalPct: Math.round((total / MAX_TOTAL) * 100),
    last,
    current,
    level: LEVELS[LESSONS[current - 1].lv - 1],
  };
}

/* ---------- Answer grading ---------- */
const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '').replace(/["']/g, '');

function gradeQ(q, ans) {
  if (q.t === 'm') return ans === q.a;
  if (!Array.isArray(ans)) return false;
  return q.a.every((correct, k) => correct.split('|').some((alt) => norm(alt) === norm(ans[k])));
}

function isAnswered(q, a) {
  if (q.t === 'm') return typeof a === 'number';
  return Array.isArray(a) && q.a.every((_, k) => (a[k] || '').trim() !== '');
}

/* ---------- Shell & chrome ---------- */
const logoMark = () =>
  '<svg class="logo-mark" viewBox="0 0 100 100" aria-hidden="true"><polygon fill="#1675F9" points="0,26 19,0 100,0 86,21 27,21 0,57"/><polygon fill="#1675F9" points="40,35 86,35 74,53 40,53 0,100 0,72"/></svg>';

function shell(body, s, active) {
  const ready = stats(s).done === TOTAL;
  return `
    <header class="topbar">
      <div class="wrap topbar-in">
        <a class="brand" href="#/dashboard" aria-label="Fasla.DEV — لوحة التحكم">
          ${logoMark()}
          <span class="brand-words"><span class="bw-main">Fasla<em>.DEV</em></span><span class="bw-tag">Code • Learn • Build</span></span>
        </a>
        <nav class="mainnav" aria-label="القائمة الرئيسية">
          <a href="#/dashboard" class="${active === 'dash' || active === 'lesson' ? 'on' : ''}">لوحة التحكم</a>
          ${ready
            ? `<a href="#/results" class="${active === 'results' ? 'on' : ''}">النتيجة النهائية</a>`
            : `<span class="nav-locked" title="تتاح بعد إكمال جميع الدروس">${ICON.lock} النتيجة النهائية</span>`}
        </nav>
        <div class="userbox">
          <div class="ub-info"><b>${esc(s.name)}</b><span dir="ltr">${esc(s.code)}</span></div>
          <button class="btn btn-outline btn-sm" id="logout" type="button">تسجيل الخروج</button>
        </div>
      </div>
    </header>
    <main class="wrap main">${body}</main>
    <footer class="footer">
      <div class="wrap footer-in">
        <span>© Fasla.DEV — Code • Learn • Build</span>
        <span>التقدم محفوظ على هذا المتصفح والجهاز فقط.</span>
      </div>
    </footer>`;
}

/* ---------- Router ---------- */
function route() {
  playCtx = null;
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const s = me();
  if (!s) {
    renderLogin();
    return;
  }
  if (parts[0] === 'lesson') {
    const n = parseInt(parts[1], 10);
    if (n >= 1 && n <= TOTAL) {
      renderLesson(n);
      return;
    }
  }
  if (parts[0] === 'results') {
    view = { n: 0, tab: 'explain' };
    renderResults();
    return;
  }
  view = { n: 0, tab: 'explain' };
  renderDashboard();
}

/* ---------- Login / verification ---------- */
function renderLogin(err = '', vals = {}) {
  mount(`
    <div class="auth">
      <aside class="auth-brand">
        <div class="auth-logo">
          ${logoMark()}
          <div class="brand-words big"><span class="bw-main">Fasla<em>.DEV</em></span><span class="bw-tag">Code • Learn • Build</span></div>
        </div>
        <div class="auth-copy">
          <span class="eyebrow">HTML Fundamentals</span>
          <h1>تعلّم HTML من الصفر حتى الاحتراف، خطوة بخطوة</h1>
          <p>كورس عربي من 20 درسًا، كل درس يحتوي على شرح مفصل، وساحة كود حية، وتمارين عملية، واختبار بعد كل درس.</p>
        </div>
        <ul class="auth-points">
          <li><span>01</span>شرح عربي واضح مع مصطلحات إنجليزية مترجمة</li>
          <li><span>02</span>ساحة كود مباشرة تعرض النتيجة فورًا</li>
          <li><span>03</span>اختبار بعد كل درس وفتح تدريجي للدروس</li>
          <li><span>04</span>تقرير أداء نهائي مبني على إجاباتك الفعلية</li>
        </ul>
      </aside>
      <section class="auth-card">
        <div class="auth-card-in">
          <span class="eyebrow dark">بوابة التحقق من الطالب</span>
          <h2>سجّل بياناتك لبدء الكورس</h2>
          <p class="muted">أدخل بياناتك كما هي، ورمز الوصول الذي استلمته. إذا سبق لك التسجيل بنفس البيانات سيتم استعادة تقدمك تلقائيًا.</p>
          <form id="login-form" class="auth-form" novalidate>
            <div class="field">
              <label for="f-name">الاسم الكامل</label>
              <input id="f-name" name="name" type="text" maxlength="60" autocomplete="name" placeholder="مثال: محمد أحمد علي" value="${escAttr(vals.name || '')}" />
            </div>
            <div class="field">
              <label for="f-age">العمر</label>
              <input id="f-age" name="age" type="number" min="5" max="100" inputmode="numeric" placeholder="مثال: 18" value="${escAttr(vals.age || '')}" />
            </div>
            <div class="field">
              <label for="f-code">رمز الوصول (Access Code)</label>
              <input id="f-code" name="code" type="text" dir="ltr" autocomplete="off" spellcheck="false" placeholder="FSD-XXXXXX" value="${escAttr(vals.code || '')}" />
            </div>
            <div class="alert" id="login-err" role="alert" ${err ? '' : 'hidden'}>${esc(err)}</div>
            <button class="btn btn-blue btn-block btn-lg" type="submit">تحقق وادخل إلى الكورس</button>
          </form>
          <p class="note"><b>ملاحظة:</b> يتم حفظ التقدم في LocalStorage على هذا المتصفح والجهاز فقط، ولا يتم مزامنته بين الأجهزة المختلفة.</p>
        </div>
      </section>
    </div>`);
}

function handleLogin(form) {
  const fd = new FormData(form);
  const name = String(fd.get('name') || '').trim().replace(/\s+/g, ' ');
  const ageRaw = String(fd.get('age') || '').trim();
  const age = Number(ageRaw);
  const code = String(fd.get('code') || '').trim().toUpperCase();
  const vals = { name, age: ageRaw, code };

  if (name.length < 5 || name.split(' ').length < 2) {
    return renderLogin('يرجى كتابة الاسم الكامل (الاسم الأول واسم العائلة على الأقل).', vals);
  }
  if (!ageRaw || !Number.isInteger(age) || age < 5 || age > 100) {
    return renderLogin('يرجى إدخال عمر صحيح بين 5 و100 سنة.', vals);
  }
  if (code !== ACCESS_CODE) {
    return renderLogin('رمز الوصول غير صحيح. تأكد من كتابته كما ورد إليك بالضبط، ثم حاول مرة أخرى.', vals);
  }

  const id = makeId(name, age);
  const existing = db[id];
  if (existing) {
    existing.code = code;
  } else {
    db[id] = { name, age, code, createdAt: new Date().toISOString(), lessons: {} };
  }
  localStorage.setItem(SESSION_KEY, id);
  persist();
  const first = name.split(' ')[0];
  toast(existing ? `مرحبًا بعودتك يا ${first}! تم استعادة تقدمك المحفوظ.` : `مرحبًا بك يا ${first}! تم إنشاء ملفك الدراسي.`, 'ok');
  location.hash = '#/dashboard';
  route();
}

function logout() {
  if (!confirm('سيتم تسجيل الخروج من هذا الجهاز. تقدمك محفوظ ولن يُحذف، ويمكنك الدخول لاحقًا بنفس البيانات. هل تريد المتابعة؟')) return;
  localStorage.removeItem(SESSION_KEY);
  location.hash = '#/login';
  route();
  toast('تم تسجيل الخروج. تقدمك محفوظ على هذا المتصفح.', 'ok');
}

/* ---------- Dashboard ---------- */
function lessonCard(s, L) {
  const n = L.id;
  const done = isDone(s, n);
  const unlocked = isUnlocked(s, n);
  const current = unlocked && !done;
  const cls = done ? 'done' : unlocked ? 'open' : 'locked';
  const status = done ? 'مكتمل' : unlocked ? (current ? 'الدرس الحالي' : 'متاح') : 'مقفل';
  const score = s.lessons[n]?.result ? `${s.lessons[n].result.score}/${MAX_Q}` : '—';
  const inner = `
    <div class="lc-top">
      <span class="lc-day">Day ${pad(n)}</span>
      <span class="lc-badge ${done ? 'b-done' : unlocked ? 'b-open' : 'b-lock'}">${done ? ICON.check : unlocked ? '' : ICON.lock}</span>
    </div>
    <h4>${esc(L.t)}</h4>
    <p class="lc-en" dir="ltr">${esc(L.en)}</p>
    <div class="lc-foot"><span class="lc-status">${status}</span><span class="lc-score">الدرجة: ${score}</span></div>
    <span class="lc-cta">${unlocked ? (done ? 'مراجعة الدرس ←' : 'ابدأ الدرس ←') : `يُفتح بعد اجتياز الدرس ${pad(n - 1)}`}</span>`;
  return unlocked
    ? `<a class="lcard ${cls}" href="#/lesson/${n}" aria-label="الدرس ${n}: ${escAttr(L.t)}">${inner}</a>`
    : `<div class="lcard ${cls}" aria-disabled="true">${inner}</div>`;
}

function renderDashboard() {
  const s = me();
  const st = stats(s);
  const b = band(st.totalPct);

  const levelsHtml = LEVELS.map((lv) => {
    const ls = LESSONS.filter((l) => l.lv === lv.n);
    const d = ls.filter((l) => isDone(s, l.id)).length;
    return `
      <section class="level-block">
        <header class="level-head">
          <div>
            <span class="lvl-tag">المستوى ${lv.n}</span>
            <h3>${esc(lv.name)} <small dir="ltr">${esc(lv.en)}</small></h3>
          </div>
          <div class="lvl-prog">
            <span>${d} / ${ls.length} مكتمل</span>
            <div class="bar sm"><span style="width:${Math.round((d / ls.length) * 100)}%"></span></div>
          </div>
        </header>
        <div class="lesson-grid">${ls.map((l) => lessonCard(s, l)).join('')}</div>
      </section>`;
  }).join('');

  mount(shell(`
    <section class="hero">
      <div class="hero-main">
        <span class="eyebrow">الدورة</span>
        <h1>HTML Fundamentals</h1>
        <p class="hero-welcome">أهلاً بك يا <strong>${esc(s.name)}</strong></p>
        <p class="hero-desc">20 درسًا متدرجًا من الصفر حتى الاحتراف. لا يمكن تخطي أي درس: اقرأ الشرح، جرّب الكود في الساحة، ثم اجتز الاختبار بدرجة ${PASS}/7 على الأقل لفتح الدرس التالي.</p>
        <div class="hero-actions">
          <a class="btn btn-blue btn-lg" href="#/lesson/${st.current}">${st.done === 0 ? 'ابدأ الدرس الأول' : st.done === TOTAL ? 'مراجعة الكورس' : 'متابعة الدرس ' + pad(st.current)} ←</a>
          ${st.done === TOTAL ? '<a class="btn btn-outline-light btn-lg" href="#/results">عرض النتيجة النهائية</a>' : ''}
        </div>
      </div>
      <dl class="hero-info">
        <div><dt>المستوى الحالي</dt><dd>${esc(st.level.name)}</dd></div>
        <div><dt>إجمالي الدروس</dt><dd>${TOTAL} درسًا</dd></div>
        <div><dt>آخر درس مكتمل</dt><dd>${st.last ? 'الدرس ' + pad(st.last) + ' — ' + esc(LESSONS[st.last - 1].t) : 'لم تكمل أي درس بعد'}</dd></div>
      </dl>
    </section>

    <section class="progress-panel">
      <div class="pp-top">
        <div>
          <span class="eyebrow dark">نسبة التقدم الكلية</span>
          <h2>${st.pct}%</h2>
        </div>
        <p>${st.done} من ${TOTAL} درسًا مكتملًا · المتبقي ${st.remaining} درسًا</p>
      </div>
      <div class="bar xl" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${st.pct}"><span style="width:${st.pct}%"></span></div>
    </section>

    <section class="stats">
      <div class="stat"><span>الدروس المكتملة</span><b>${st.done}</b><small>من ${TOTAL} درسًا</small></div>
      <div class="stat"><span>الدروس المتبقية</span><b>${st.remaining}</b><small>درسًا</small></div>
      <div class="stat"><span>مجموع الدرجات</span><b>${st.total}</b><small>من ${MAX_TOTAL} (${st.totalPct}%)</small></div>
      <div class="stat"><span>التقدير الحالي</span><b class="stat-sm">${b[1]}</b><small dir="ltr">${b[2]}</small></div>
    </section>

    ${levelsHtml}

    <section class="note-box">
      <h3>عن حفظ التقدم</h3>
      <p>يُحفظ تقدمك في <b>LocalStorage</b> على هذا المتصفح وهذا الجهاز فقط. تحديث الصفحة أو إغلاق المتصفح أو إعادة تشغيل الجهاز لن يمسح تقدمك. أما فتح الكورس من جهاز أو متصفح آخر فسيحتاج إلى بيانات جديدة، لأن البيانات لا تنتقل بين الأجهزة.</p>
    </section>
  `, s, 'dash'));
}

/* ---------- Lesson page ---------- */
function sideList(s, n) {
  return `
    <div class="side-h">خريطة الكورس</div>
    ${LEVELS.map((lv) => `
      <div class="side-lv">${esc(lv.name)}</div>
      ${LESSONS.filter((l) => l.lv === lv.n).map((l) => {
        const done = isDone(s, l.id);
        const un = isUnlocked(s, l.id);
        const cls = l.id === n ? 'cur' : done ? 'done' : un ? 'open' : 'locked';
        const icon = done ? ICON.check : un ? '<span class="dot"></span>' : ICON.lock;
        const inner = `<span class="si-n">${pad(l.id)}</span><span class="si-t">${esc(l.t)}</span><span class="si-i">${icon}</span>`;
        return un
          ? `<a class="side-item ${cls}" href="#/lesson/${l.id}">${inner}</a>`
          : `<div class="side-item ${cls}" aria-disabled="true">${inner}</div>`;
      }).join('')}`).join('')}`;
}

function renderLesson(n, opts = {}) {
  const s = me();
  const L = LESSONS[n - 1];
  if (!isUnlocked(s, n)) {
    toast(`الدرس ${pad(n)} مقفل. أكمل الدرس ${pad(n - 1)} بدرجة ${PASS}/7 على الأقل أولًا.`, 'warn');
    location.hash = '#/dashboard';
    return;
  }
  if (view.n !== n) view = { n, tab: 'explain' };
  const r = recOf(s, n);
  r.visited = new Date().toISOString();
  persist();

  let prev = 0;
  for (let k = n - 1; k >= 1; k--) { if (isDone(s, k)) { prev = k; break; } }
  const nextOpen = n < TOTAL && isUnlocked(s, n + 1) ? n + 1 : 0;
  const st = stats(s);
  const stepIdx = TABS.findIndex((t) => t.k === view.tab);
  const done = isDone(s, n);

  mount(shell(`
    <nav class="crumbs" aria-label="مسار التنقل">
      <a href="#/dashboard">لوحة التحكم</a><span>/</span><span>الدرس ${pad(n)}</span>
    </nav>

    <section class="lesson-hero">
      <div class="lh-main">
        <div class="lh-eyebrow"><span>${esc(LEVELS[L.lv - 1].name)}</span><span dir="ltr">Day ${pad(n)}</span></div>
        <h1>${esc(L.t)}</h1>
        <p class="lh-en" dir="ltr">${esc(L.en)}</p>
      </div>
      <div class="lh-state ${done ? 'is-done' : ''}">
        <span class="lh-state-label">${done ? ICON.check + ' درس مكتمل' : 'قيد التعلم'}</span>
        <span class="lh-score">${r.result ? `أفضل درجة: ${r.result.score}/${MAX_Q}` : 'لم يُختبر بعد'}</span>
      </div>
    </section>

    <div class="lesson-actions">
      <a class="btn btn-outline" href="#/dashboard">→ لوحة التحكم</a>
      ${prev
        ? `<a class="btn btn-dark" href="#/lesson/${prev}">→ الدرس ${pad(prev)} (السابق المكتمل)</a>`
        : '<span class="btn btn-dark is-disabled" aria-disabled="true">→ لا يوجد درس سابق مكتمل</span>'}
      ${nextOpen
        ? `<a class="btn btn-blue" href="#/lesson/${nextOpen}">الدرس ${pad(nextOpen)} (التالي المفتوح) ←</a>`
        : `<span class="btn btn-dark is-disabled" aria-disabled="true">${n < TOTAL ? `الدرس ${pad(n + 1)} مقفل حتى تجتاز هذا الاختبار` : 'لا يوجد درس بعد هذا'}</span>`}
    </div>

    <div class="lesson-progress">
      <div class="lp-row"><span>تقدم الكورس: ${st.done} من ${TOTAL} درسًا مكتملًا</span><span>الخطوة ${stepIdx + 1} من ${TABS.length}</span></div>
      <div class="bar"><span style="width:${st.pct}%"></span></div>
    </div>

    <div class="lesson-layout">
      <aside class="lesson-side">${sideList(s, n)}</aside>
      <div class="lesson-main" id="lesson-main">
        <div class="tabs" role="tablist">
          ${TABS.map((t, i) => `
            <button role="tab" type="button" data-tab="${t.k}" class="tab ${view.tab === t.k ? 'on' : ''}" aria-selected="${view.tab === t.k}">
              <span class="tab-n">${i + 1}</span>${t.l}
            </button>`).join('')}
        </div>
        <div class="tab-body" id="tab-body" role="tabpanel"></div>
      </div>
    </div>
  `, s, 'lesson'));

  renderTab(n, L);
  if (opts.scroll) document.getElementById('lesson-main')?.scrollIntoView?.({ block: 'start' });
}

function renderTab(n, L) {
  const body = document.getElementById('tab-body');
  if (!body) return;
  if (view.tab === 'explain') body.innerHTML = renderExplain(L);
  else if (view.tab === 'play') {
    body.innerHTML = `
      <div class="tab-intro">
        <h2>ساحة الكود التفاعلية</h2>
        <p>عدّل الكود في المحرر ثم اضغط <b>تشغيل الكود</b> (أو Ctrl+Enter) لعرض النتيجة في المعاينة. يتم حفظ كودك تلقائيًا على هذا المتصفح، ويمكنك التجربة بحرية دون أي خوف من إفساد الدرس.</p>
      </div>
      <div id="pg-host"></div>
      <div class="tab-next"><button class="btn btn-blue" type="button" data-tab="practice">التالي: التمرين العملي ←</button></div>`;
    mountPlayground(document.getElementById('pg-host'), L, n);
  } else if (view.tab === 'practice') body.innerHTML = renderPractice(L, n);
  else if (view.tab === 'quiz') body.innerHTML = renderQuiz(L, n);
}

function renderExplain(L) {
  return `
    <div class="doc">
      <section class="doc-block obj">
        <h2>أهداف الدرس</h2>
        <ul class="obj-list">${L.obj.map((o) => `<li>${inline(o)}</li>`).join('')}</ul>
      </section>

      ${L.sec.map((sec) => `
        <section class="doc-sec">
          <h2>${esc(sec.h)}</h2>
          ${sec.p.map((p) => `<p>${inline(p)}</p>`).join('')}
          ${sec.c ? codeBlock(sec.c, sec.l || 'html') : ''}
        </section>`).join('')}

      <section class="doc-block">
        <h2>المفاهيم الأساسية</h2>
        <div class="concepts">${L.con.map(([t, d]) => `<div class="concept"><h4 dir="ltr">${esc(t)}</h4><p>${inline(d)}</p></div>`).join('')}</div>
      </section>

      <section class="doc-block">
        <h2>المصطلحات الإنجليزية وترجمتها</h2>
        <div class="table-wrap">
          <table class="terms">
            <thead><tr><th>English Term</th><th>الترجمة العربية</th></tr></thead>
            <tbody>${L.terms.map(([en, ar]) => `<tr><td><code dir="ltr">${esc(en)}</code></td><td>${esc(ar)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </section>

      <section class="doc-block">
        <h2>أمثلة عملية وأكواد</h2>
        ${L.ex.map((ex) => `
          <div class="example">
            <h4>${esc(ex.t)}</h4>
            ${codeBlock(ex.c, ex.l || 'html')}
            ${ex.n ? `<p class="ex-note">${inline(ex.n)}</p>` : ''}
          </div>`).join('')}
      </section>

      <section class="doc-block warn-block">
        <h2>الأخطاء الشائعة</h2>
        ${L.mis.map(([w, f]) => `
          <div class="mistake">
            <div class="mis-bad"><span>✕ الخطأ</span><div>${inline(w)}</div></div>
            <div class="mis-good"><span>✓ الصحيح</span><div>${inline(f)}</div></div>
          </div>`).join('')}
      </section>

      <section class="doc-block tip-block">
        <h2>نصائح احترافية</h2>
        <ul class="tips">${L.tips.map((t) => `<li>${inline(t)}</li>`).join('')}</ul>
      </section>

      <div class="tab-next"><button class="btn btn-blue" type="button" data-tab="play">التالي: ساحة الكود ←</button></div>
    </div>`;
}

/* ---------- Playground ---------- */
function getCode(L, n) {
  const starter = { html: L.pg.html || '', css: L.pg.css || '', js: L.pg.js || '' };
  const r = recOf(me(), n);
  return r.code ? { ...starter, ...r.code } : starter;
}

function mountPlayground(host, L, n) {
  if (!host) return;
  const s = me();
  const r = recOf(s, n);
  const tabs = L.pg.tabs || ['html'];
  const starter = { html: L.pg.html || '', css: L.pg.css || '', js: L.pg.js || '' };
  let code = { ...starter, ...(r.code || {}) };
  let cur = tabs[0];

  host.innerHTML = `
    <div class="pg">
      <div class="pg-bar">
        <div class="pg-files" role="tablist" aria-label="ملفات المشروع">
          ${tabs.map((t) => `<button type="button" role="tab" class="pg-file ${t === cur ? 'on' : ''}" data-file="${t}">${FILE_LABEL[t]}</button>`).join('')}
        </div>
        <div class="pg-actions">
          <button type="button" class="btn btn-blue btn-sm" data-pg="run">تشغيل الكود <kbd>Ctrl+Enter</kbd></button>
          <button type="button" class="btn btn-ghost-dark btn-sm" data-pg="reset">إعادة الضبط</button>
          <button type="button" class="btn btn-ghost-dark btn-sm" data-pg="clear">مسح الكود</button>
          <button type="button" class="btn btn-ghost-dark btn-sm" data-pg="copy">نسخ الكود</button>
        </div>
      </div>
      <div class="pg-body">
        <div class="pg-editor">
          <div class="pg-editor-h"><span id="pg-file-name">${FILE_LABEL[cur]}</span><span>أرقام السطور مفعّلة · Tab للمسافة</span></div>
          <div class="cm" id="pg-cm"></div>
        </div>
        <div class="pg-preview">
          <div class="pv-bar">
            <span class="pv-title">المعاينة المباشرة</span>
            <div class="pv-modes">
              <button type="button" class="pv-mode on" data-pv="desk">سطح المكتب</button>
              <button type="button" class="pv-mode" data-pv="mob">الجوال</button>
            </div>
          </div>
          <div class="pv-stage" id="pv-stage">
            <iframe id="pv-frame" class="pv-frame" title="معاينة الكود المباشرة" sandbox="allow-scripts allow-forms allow-modals"></iframe>
          </div>
          <div class="pv-console">
            <div class="pv-ch"><span>وحدة الأخطاء والرسائل</span><button type="button" data-pg="logclear">مسح الرسائل</button></div>
            <div class="pv-cb" id="pv-log" aria-live="polite"></div>
          </div>
        </div>
      </div>
      <p class="pg-hint">هذه المعاينة تعمل داخل iframe معزول (sandbox) ولا تستطيع الوصول إلى بيانات الموقع أو التخزين المحلي.</p>
    </div>`;

  const frame = host.querySelector('#pv-frame');
  const logEl = host.querySelector('#pv-log');
  const stage = host.querySelector('#pv-stage');
  const cmHost = host.querySelector('#pg-cm');

  const log = (type, text) => {
    const d = document.createElement('div');
    d.className = `log ${type}`;
    d.textContent = text;
    logEl.appendChild(d);
    logEl.scrollTop = logEl.scrollHeight;
  };
  const clearLog = () => { logEl.innerHTML = ''; };

  const saveCode = () => {
    r.code = { ...code };
    persist();
  };

  const loadEditor = () => {
    host.querySelectorAll('.pg-file').forEach((b) => b.classList.toggle('on', b.dataset.file === cur));
    host.querySelector('#pg-file-name').textContent = FILE_LABEL[cur];
    mountEditor(cmHost, {
      lang: cur,
      value: code[cur],
      label: `محرر ${FILE_LABEL[cur]}`,
      onInput: (v) => { code[cur] = v; saveCode(); },
      onRun: run,
    });
  };

  function run() {
    clearLog();
    checkHtml(code.html).forEach((m) => log('warn', `تحذير HTML: ${m}`));
    const jsErr = checkJs(code.js);
    if (jsErr) log('err', `خطأ في JavaScript: ${jsErr}`);
    frame.srcdoc = buildPreviewDoc(code.html, code.css, jsErr ? '' : code.js);
    log('ok', 'تم تنفيذ الكود وتحديث المعاينة بنجاح.');
  }

  playCtx = { frame, log };

  host.addEventListener('click', (e) => {
    const fileBtn = e.target.closest('[data-file]');
    if (fileBtn) {
      cur = fileBtn.dataset.file;
      loadEditor();
      return;
    }
    const pgBtn = e.target.closest('[data-pg]');
    if (pgBtn) {
      const act = pgBtn.dataset.pg;
      if (act === 'run') run();
      if (act === 'logclear') clearLog();
      if (act === 'reset') {
        if (!confirm('سيتم استعادة الكود الأصلي للدرس (كل الملفات). هل تريد المتابعة؟')) return;
        code = { ...starter };
        saveCode();
        loadEditor();
        run();
        toast('تمت استعادة الكود الأصلي للدرس.', 'ok');
      }
      if (act === 'clear') {
        code[cur] = '';
        saveCode();
        loadEditor();
        toast(`تم مسح محتوى ملف ${FILE_LABEL[cur]}.`, 'info');
      }
      if (act === 'copy') {
        copyText(code[cur]).then((ok) => toast(ok ? `تم نسخ كود ${FILE_LABEL[cur]} إلى الحافظة.` : 'تعذر النسخ تلقائيًا، حدد الكود ثم انسخه يدويًا.', ok ? 'ok' : 'warn'));
      }
      return;
    }
    const pvBtn = e.target.closest('[data-pv]');
    if (pvBtn) {
      host.querySelectorAll('[data-pv]').forEach((b) => b.classList.toggle('on', b === pvBtn));
      stage.classList.toggle('is-mobile', pvBtn.dataset.pv === 'mob');
    }
  });

  loadEditor();
  run();
}

/* ---------- Practice / checks ---------- */
function renderPractice(L, n) {
  const s = me();
  const r = recOf(s, n);
  const detail = r.checkDetail;
  const best = r.checks;
  return `
    <div class="practice">
      <div class="tab-intro">
        <h2>التمرين العملي</h2>
        <p>نفّذ التمارين التالية داخل <b>ساحة الكود</b>، ثم اضغط <b>تحقق من تمريني</b> ليقوم النظام بفحص الكود تلقائيًا ومقارنته بمعايير الدرس. التمرين غير إلزامي للانتقال للاختبار، لكنه أفضل وسيلة للتعلم الفعلي.</p>
      </div>
      <ol class="challenges">
        ${L.chal.map(([t, d], i) => `
          <li>
            <span class="ch-n">${i + 1}</span>
            <div><h4>${esc(t)}</h4><p>${inline(d)}</p></div>
          </li>`).join('')}
      </ol>
      <section class="checks">
        <div class="checks-head">
          <div>
            <h3>معايير التحقق التلقائي</h3>
            <p>${best ? `أفضل نتيجة سابقة: ${best.passed} من ${best.total} معايير (${fmtDate(best.date)})` : 'لم يتم التحقق بعد.'}</p>
          </div>
          <button type="button" class="btn btn-blue" data-check>تحقق من تمريني</button>
        </div>
        <ul class="check-list">
          ${L.ch.map(([label], i) => {
            const d = detail ? detail[i] : null;
            const st = d ? (d.ok ? 'ok' : 'bad') : 'idle';
            return `<li class="ck ${st}"><span class="ck-i">${st === 'ok' ? ICON.check : st === 'bad' ? '✕' : '○'}</span><span>${esc(label)}</span></li>`;
          }).join('')}
        </ul>
        ${detail
          ? `<p class="check-summary ${detail.every((d) => d.ok) ? 'ok' : ''}">${detail.every((d) => d.ok)
              ? 'ممتاز! اجتزت جميع معايير التمرين.'
              : `نجحت في ${detail.filter((d) => d.ok).length} من ${detail.length} معايير. راجع المعايير غير المكتملة وعدّل الكود في ساحة الكود.`}</p>`
          : ''}
      </section>
      <div class="tab-next">
        <button class="btn btn-outline" type="button" data-tab="play">→ العودة إلى ساحة الكود</button>
        <button class="btn btn-blue" type="button" data-tab="quiz">التالي: الاختبار ←</button>
      </div>
    </div>`;
}

function runChecks(n) {
  const L = LESSONS[n - 1];
  const s = me();
  const r = recOf(s, n);
  const code = getCode(L, n);
  const src = `${code.html}\n${code.css}\n${code.js}`;
  const detail = L.ch.map(([label, rx]) => ({ label, ok: new RegExp(rx, 'i').test(src) }));
  const passed = detail.filter((d) => d.ok).length;
  r.checkDetail = detail;
  if (!r.checks || passed >= r.checks.passed) {
    r.checks = { passed, total: detail.length, date: new Date().toISOString() };
  }
  persist();
  toast(passed === detail.length ? 'ممتاز! اجتزت جميع معايير التمرين.' : `نجحت في ${passed} من ${detail.length} معايير.`, passed === detail.length ? 'ok' : 'info');
  renderLesson(n, { scroll: false });
  view.tab = 'practice';
  renderTab(n, L);
}

/* ---------- Quiz ---------- */
function renderQuiz(L, n) {
  const s = me();
  const r = recOf(s, n);
  if (r.quiz.review && r.result) return renderReview(L, n, r);

  const draft = r.quiz.draft;
  const answered = L.quiz.filter((q, i) => isAnswered(q, draft[i])).length;
  const qHtml = L.quiz.map((q, i) => questionHtml(q, i, draft[i])).join('');
  const retake = r.result ? `<p class="retake-note">آخر محاولة: ${r.result.score}/${MAX_Q} — أعد الاختبار بعد مراجعة الشرح لتحسين درجتك.</p>` : '';

  return `
    <div class="quiz">
      <div class="quiz-intro">
        <div>
          <h2>اختبار الدرس ${pad(n)}</h2>
          <p>${L.quiz.length} أسئلة: اختيار من متعدد وأكمل الكود. لا تظهر النتيجة إلا بعد التسليم. الحد الأدنى للنجاح <b>${PASS}/7</b>، ويتم فتح الدرس التالي عند النجاح.</p>
          ${retake}
        </div>
        <div class="quiz-scale">
          <span><b>7</b> ممتاز</span><span><b>6</b> جيد جدًا</span><span><b>5</b> جيد</span><span><b>4</b> مقبول</span><span><b>0–3</b> يحتاج إلى تحسين</span>
        </div>
      </div>
      <form class="quiz-form" id="quiz-form" onsubmit="return false">
        ${qHtml}
        <div class="quiz-foot">
          <div class="q-progress">
            <span id="q-count">أجبت ${answered} من ${L.quiz.length}</span>
            <div class="bar sm"><span id="q-bar" style="width:${Math.round((answered / L.quiz.length) * 100)}%"></span></div>
          </div>
          <button type="button" class="btn btn-blue btn-lg" data-submit>تسليم الإجابات وعرض النتيجة</button>
        </div>
      </form>
    </div>`;
}

function questionHtml(q, i, a) {
  const head = `
    <header class="q-head">
      <span class="q-num">السؤال ${i + 1}</span>
      <span class="q-type">${q.t === 'm' ? 'اختيار من متعدد' : 'أكمل الكود'}</span>
      <span class="q-topic">${esc(q.g)}</span>
    </header>`;
  if (q.t === 'm') {
    return `
      <article class="q-card">
        ${head}
        <h4 class="q-text">${inline(q.q)}</h4>
        ${q.c ? codeBlock(q.c, 'html') : ''}
        <div class="q-opts" role="radiogroup" aria-label="السؤال ${i + 1}">
          ${q.o.map(([t], j) => `
            <label class="opt">
              <input type="radio" name="q${i}" value="${j}" ${a === j ? 'checked' : ''} />
              <span class="opt-k">${'ABCD'[j]}</span>
              <span class="opt-t">${isLatin(t) ? `<code dir="ltr">${esc(t)}</code>` : esc(t)}</span>
            </label>`).join('')}
        </div>
      </article>`;
  }
  const parts = q.c.split('____');
  const filled = parts
    .map((p, k) => esc(p) + (k < parts.length - 1
      ? `<input class="fill-in" type="text" dir="ltr" autocomplete="off" spellcheck="false" data-q="${i}" data-b="${k}" value="${escAttr((a && a[k]) || '')}" aria-label="الفراغ ${k + 1} في السؤال ${i + 1}" />`
      : ''))
    .join('');
  return `
    <article class="q-card">
      ${head}
      <h4 class="q-text">${inline(q.q)}</h4>
      <div class="code-wrap" dir="ltr"><div class="code-h"><span>HTML — املأ الفراغات</span></div><pre class="code fill-code"><code>${filled}</code></pre></div>
    </article>`;
}

function updateQuizProgress() {
  const L = LESSONS[view.n - 1];
  const r = recOf(me(), view.n);
  const answered = L.quiz.filter((q, i) => isAnswered(q, r.quiz.draft[i])).length;
  const c = document.getElementById('q-count');
  const bar = document.getElementById('q-bar');
  if (c) c.textContent = `أجبت ${answered} من ${L.quiz.length}`;
  if (bar) bar.style.width = `${Math.round((answered / L.quiz.length) * 100)}%`;
}

function submitQuiz(n) {
  const L = LESSONS[n - 1];
  const s = me();
  const r = recOf(s, n);
  const draft = r.quiz.draft;
  const missing = L.quiz.map((q, i) => (isAnswered(q, draft[i]) ? 0 : i + 1)).filter(Boolean);
  if (missing.length) {
    toast(`لم تُجب على السؤال ${missing.join('، ')}. أجب على جميع الأسئلة قبل التسليم.`, 'warn');
    return;
  }
  const answers = L.quiz.map((q, i) => (q.t === 'm' ? draft[i] : draft[i].slice(0, q.a.length)));
  const score = L.quiz.reduce((acc, q, i) => acc + (gradeQ(q, answers[i]) ? 1 : 0), 0);

  r.attempts = (r.attempts || 0) + 1;
  const result = { score, answers, date: new Date().toISOString(), attempt: r.attempts };
  if (!r.result || score >= r.result.score) r.result = result;
  r.quiz.review = true;

  const wasDone = !!r.done;
  if (score >= PASS) r.done = true;
  persist();

  if (score >= PASS && !wasDone) {
    toast(`أحسنت! اجتزت الدرس ${pad(n)} بدرجة ${score}/7.`, 'ok');
    if (n < TOTAL) toast(`تم فتح الدرس ${pad(n + 1)}.`, 'ok');
    if (stats(s).done === TOTAL) {
      s.finalAt = new Date().toISOString();
      persist();
      toast('أكملت جميع الدروس العشرين! تقريرك النهائي جاهز.', 'ok');
    }
  } else if (score < PASS) {
    toast(`نتيجتك ${score}/7. الحد الأدنى للنجاح ${PASS}/7، راجع الشرح ثم أعد الاختبار.`, 'warn');
  } else {
    toast(`نتيجتك ${score}/7 في هذه المحاولة.`, 'info');
  }
  renderLesson(n, { scroll: true });
}

function retakeQuiz(n) {
  const r = recOf(me(), n);
  r.quiz.review = false;
  r.quiz.draft = [];
  persist();
  renderLesson(n, { scroll: true });
  toast('بدأت محاولة جديدة. تذكر أن أفضل درجة هي التي تُعتمد.', 'info');
}

function recommend(L, res) {
  const wrong = L.quiz.map((q, i) => ({ q, ok: gradeQ(q, res.answers[i]) })).filter((x) => !x.ok);
  if (!wrong.length) {
    return 'أداء ممتاز في كل الأسئلة. انتقل الآن إلى الدرس التالي، وحاول أن تكتب مثالًا من عندك في ساحة الكود لترسيخ المعلومة.';
  }
  const topics = [...new Set(wrong.map((x) => x.q.g))].join('، ');
  const lead = res.score >= PASS ? 'أحسنت في اجتياز الدرس، ولتقوية فهمك ' : 'لتحسين نتيجتك في المحاولة القادمة ';
  return `${lead}راجع المحاور التالية: ${topics}. أعد قراءة الأقسام المرتبطة بها في تبويب الشرح، ثم جرّب الأمثلة في ساحة الكود بتعديل القيم ومشاهدة النتيجة مباشرة.`;
}

function reviewItem(q, i, ans) {
  const ok = gradeQ(q, ans);
  let body = '';
  if (q.t === 'm') {
    body = `<ol class="rv-opts">${q.o.map(([t, why], j) => {
      const correct = j === q.a;
      const chosen = j === ans;
      const cls = correct ? 'is-correct' : chosen ? 'is-wrong' : '';
      const tag = correct ? 'الإجابة الصحيحة' : chosen ? 'اختيارك (خطأ)' : '';
      return `<li class="rv-opt ${cls}">
        <div class="rv-opt-h"><span class="opt-k">${'ABCD'[j]}</span><span class="rv-opt-t">${codeText(t)}</span>${tag ? `<em>${tag}</em>` : ''}</div>
        <p>${inline(why)}</p>
      </li>`;
    }).join('')}</ol>`;
  } else {
    const filled = q.c.split('____').reduce((acc, part, k) => acc + part + (k < q.a.length ? q.a[k].split('|')[0] : ''), '');
    body = `
      <div class="rv-blanks">
        ${q.a.map((c, k) => {
          const okB = c.split('|').some((alt) => norm(alt) === norm((ans || [])[k]));
          return `<div class="rv-blank ${okB ? 'is-correct' : 'is-wrong'}"><span>الفراغ ${k + 1}</span><span>إجابتك: <code dir="ltr">${esc((ans || [])[k] || '—')}</code></span>${okB ? '' : `<span>الصحيح: <code dir="ltr">${esc(c.split('|')[0])}</code></span>`}</div>`;
        }).join('')}
      </div>
      <p class="rv-label">الكود بعد تصحيح الإجابات:</p>
      ${codeBlock(filled, 'html')}`;
  }
  return `
    <article class="rv-item ${ok ? 'ok' : 'bad'}">
      <header class="q-head">
        <span class="q-num">السؤال ${i + 1}</span>
        <span class="rv-res">${ok ? ICON.check + ' إجابة صحيحة' : '✕ إجابة خاطئة'}</span>
        <span class="q-topic">${esc(q.g)}</span>
      </header>
      <h4 class="q-text">${inline(q.q)}</h4>
      ${q.t === 'm' && q.c ? codeBlock(q.c, 'html') : ''}
      ${body}
      ${q.t === 'f' && q.e ? `<div class="rv-explain"><b>لماذا؟</b> ${inline(q.e)}</div>` : ''}
    </article>`;
}

function renderReview(L, n, r) {
  const res = r.result;
  const passed = res.score >= PASS;
  return `
    <div class="quiz">
      <div class="res-card ${passed ? 'is-pass' : 'is-fail'}">
        <div class="res-score"><b>${res.score}</b><span>/ 7</span></div>
        <div class="res-info">
          <span class="res-grade">${lessonLabel(res.score)}</span>
          <h3>${passed ? 'تم اجتياز الدرس بنجاح' : 'لم تحقق الحد الأدنى للنجاح بعد'}</h3>
          <p>${passed
            ? (n < TOTAL ? `الدرس ${pad(n + 1)} أصبح مفتوحًا الآن.` : 'لقد أكملت آخر درس في الكورس. افتح النتيجة النهائية لرؤية تقريرك الكامل.')
            : `تحتاج إلى ${PASS}/7 على الأقل للنجاح. راجع الشرح والتمارين ثم أعد الاختبار.`}</p>
          <p class="res-meta">أفضل محاولة: المحاولة رقم ${res.attempt} · ${fmtDate(res.date)} · إجمالي المحاولات: ${r.attempts || 1}</p>
        </div>
        <div class="res-actions">
          ${!passed ? '<button type="button" class="btn btn-blue" data-retry>إعادة الاختبار</button>' : ''}
          ${passed && n < TOTAL ? `<a class="btn btn-blue" href="#/lesson/${n + 1}">الدرس التالي ←</a>` : ''}
          ${passed && n === TOTAL ? '<a class="btn btn-blue" href="#/results">عرض النتيجة النهائية ←</a>' : ''}
          <a class="btn btn-outline" href="#/dashboard">لوحة التحكم</a>
        </div>
      </div>
      <div class="rec-box"><h4>توصية تعليمية</h4><p>${esc(recommend(L, res))}</p></div>
      <div class="review-list">
        <h3 class="review-h">مراجعة إجاباتك وشرح كل خيار</h3>
        ${L.quiz.map((q, i) => reviewItem(q, i, res.answers[i])).join('')}
      </div>
    </div>`;
}

/* ---------- Final evaluation ---------- */
function evaluate(s) {
  const rows = LESSONS.map((L) => {
    const res = s.lessons[L.id]?.result || null;
    const answers = L.quiz.map((q, i) => {
      const a = res ? res.answers[i] : undefined;
      return { q, i, a, ok: res ? gradeQ(q, a) : false };
    });
    return { L, res, score: res ? res.score : 0, answers };
  });
  const total = rows.reduce((acc, x) => acc + x.score, 0);
  const pct = Math.round((total / MAX_TOTAL) * 100);

  // Accuracy per skill tag
  const tags = {};
  rows.forEach((row) => row.answers.forEach((x) => {
    const t = x.q.g;
    if (!tags[t]) tags[t] = { tag: t, ok: 0, n: 0, wrong: [] };
    tags[t].n++;
    if (x.ok) tags[t].ok++;
    else tags[t].wrong.push({ L: row.L, ...x });
  }));
  const tagList = Object.values(tags).map((t) => ({ ...t, acc: t.n ? t.ok / t.n : 0 }));
  const strongest = tagList.filter((t) => t.acc >= 0.7).sort((a, b) => b.acc - a.acc || b.ok - a.ok).slice(0, 5);
  const weakest = tagList.filter((t) => t.acc < 1).sort((a, b) => a.acc - b.acc || b.wrong.length - a.wrong.length).slice(0, 5);
  const mistakeTags = tagList.filter((t) => t.wrong.length).sort((a, b) => b.wrong.length - a.wrong.length).slice(0, 5);

  const levels = LEVELS.map((lv) => {
    const ls = rows.filter((x) => x.L.lv === lv.n);
    const sc = ls.reduce((acc, x) => acc + x.score, 0);
    const max = ls.length * MAX_Q;
    return { lv, sc, max, pct: Math.round((sc / max) * 100) };
  });

  const revision = rows.filter((x) => x.score < 6);
  const projects = [5, 20].map((n) => {
    const c = s.lessons[n]?.checks || null;
    return { n, L: LESSONS[n - 1], checked: !!c, passed: c?.passed ?? 0, total: c?.total ?? 0, pct: c && c.total ? Math.round((c.passed / c.total) * 100) : 0 };
  });
  const wrongCount = rows.reduce((acc, x) => acc + x.answers.filter((a) => !a.ok).length, 0);
  return { rows, total, pct, band: band(pct), tagList, strongest, weakest, mistakeTags, levels, revision, projects, wrongCount };
}

function recommendationsFor(ev) {
  const list = [];
  ev.weakest.slice(0, 3).forEach((t) => list.push(`راجع محور «${t.tag}» وأعد كتابة أمثلته بيدك في ساحة الكود، لأن نسبة إجاباتك الصحيحة فيه ${Math.round(t.acc * 100)}%.`));
  ev.revision.slice(0, 5).forEach((x) => list.push(`أعد دراسة الدرس ${pad(x.L.id)} «${x.L.t}» (درجتك ${x.score}/7) وحل تمارينه العملية مرة أخرى.`));
  ev.projects.filter((p) => p.checked && p.pct < 100).forEach((p) => list.push(`أكمل معايير مشروع الدرس ${pad(p.n)} (${p.passed}/${p.total}) حتى تصل إلى تنفيذ كامل للمشروع.`));
  ev.projects.filter((p) => !p.checked).forEach((p) => list.push(`لم تشغّل التحقق من مشروع الدرس ${pad(p.n)} بعد. افتح تبويب التمرين العملي واضغط «تحقق من تمريني».`));
  const b = ev.band[0];
  const general = b >= 95
    ? 'مستواك متميز. استمر في بناء مشاريع حقيقية، وادرس CSS وJavaScript لتكتمل مهاراتك كمطور واجهات.'
    : b >= 85
      ? 'مستواك ممتاز. ركّز على نقاط الخسارة القليلة لتصل إلى الإتقان الكامل، ثم تابع إلى تعلم CSS.'
      : b >= 75
        ? 'مستواك جيد جدًا. ثبّت مفاهيم الدلالات وإمكانية الوصول بتطبيقها في كل مشروع تبنيه.'
        : b >= 65
          ? 'مستواك جيد. كرر الدروس التي حصلت فيها على أقل من 6/7 وركّز على الفروق الدقيقة بين العناصر.'
          : b >= 50
            ? 'مستواك مقبول. أعد دراسة الأساسيات (الدروس 1 إلى 5) بتركيز، ثم أعد الاختبارات بعد التدريب في الساحة.'
            : 'تحتاج إلى مزيد من التدريب. ابدأ بالدروس الأولى وطبّق كل مثال بنفسك قبل الانتقال للاختبار.';
  list.push(general);
  return list;
}

function renderResults() {
  const s = me();
  const st = stats(s);
  if (st.done < TOTAL) {
    mount(shell(`
      <section class="locked-page">
        <div class="lp-icon">${ICON.lock}</div>
        <span class="eyebrow dark">النتيجة النهائية</span>
        <h1>هذه الصفحة مقفلة حاليًا</h1>
        <p>تُفتح النتيجة النهائية والتقرير التفصيلي بعد إكمال جميع الدروس العشرين. أنت الآن مكتمل <b>${st.done} من ${TOTAL}</b> دروس، والمتبقي ${st.remaining} دروس.</p>
        <a class="btn btn-blue btn-lg" href="#/dashboard">العودة إلى لوحة التحكم</a>
      </section>`, s, 'results'));
    return;
  }

  const ev = evaluate(s);
  const [, bandAr, bandEn] = ev.band;
  const finalProjects = ev.projects.filter((p) => p.checked);
  const projAvg = finalProjects.length ? Math.round(finalProjects.reduce((a, p) => a + p.pct, 0) / finalProjects.length) : null;

  const wrongGroups = ev.rows.filter((x) => x.answers.some((a) => !a.ok));
  const detailHtml = wrongGroups.length
    ? wrongGroups.map((x) => `
        <div class="rp-lesson">
          <h5>الدرس ${pad(x.L.id)} — ${esc(x.L.t)} <small>(${x.score}/7)</small></h5>
          <ul>${x.answers.filter((a) => !a.ok).map((a) => {
            const q = a.q;
            let your;
            let correct;
            let why;
            if (q.t === 'm') {
              your = a.a === undefined ? 'لم تُجب' : q.o[a.a][0];
              correct = q.o[q.a][0];
              why = q.o[q.a][1];
            } else {
              your = (a.a || []).map((v) => v || '—').join(' ، ');
              correct = q.a.map((c) => c.split('|')[0]).join(' ، ');
              why = q.e || '';
            }
            return `<li><b>س${a.i + 1} (${esc(q.g)}):</b> ${inline(q.q)}<br/>إجابتك: <code dir="ltr">${esc(your)}</code> — الصحيح: <code dir="ltr">${esc(correct)}</code>.<br/><span class="rp-why">${inline(why)}</span></li>`;
          }).join('')}</ul>
        </div>`).join('')
    : '<p>لم تُسجَّل أي إجابة خاطئة في الاختبارات. أداء استثنائي.</p>';

  const strongTxt = ev.strongest.length
    ? ev.strongest.map((t) => `${esc(t.tag)} (${Math.round(t.acc * 100)}%)`).join('، ')
    : 'لم تتشكل بعد نقاط قوة واضحة، وهذا يحتاج مزيدًا من التدريب.';
  const weakTxt = ev.weakest.length
    ? ev.weakest.map((t) => `${esc(t.tag)} (${Math.round(t.acc * 100)}%)`).join('، ')
    : 'لا توجد محاور ضعيفة؛ أجبت بشكل صحيح على كل الأسئلة.';
  const mistakesTxt = ev.mistakeTags.length
    ? ev.mistakeTags.map((t) => `${esc(t.tag)} (${t.wrong.length} خطأ)`).join('، ')
    : 'لا توجد أخطاء متكررة.';

  const recs = recommendationsFor(ev);

  mount(shell(`
    <section class="res-hero">
      <div>
        <span class="eyebrow">التقرير النهائي</span>
        <h1>نتيجة كورس HTML Fundamentals</h1>
        <p>هذا التقرير مبني على إجاباتك الفعلية في ${TOTAL} اختبارًا، وليس على تقدير عشوائي. يمكنك طباعته أو حفظه كملف PDF.</p>
      </div>
      <div class="res-grade-box">
        <span>التقدير النهائي</span>
        <b>${bandAr}</b>
        <small dir="ltr">${bandEn}</small>
        <div class="res-pct">${ev.pct}%</div>
      </div>
    </section>

    <section class="box res-student">
      <dl class="rs-grid">
        <div><dt>الاسم الكامل</dt><dd>${esc(s.name)}</dd></div>
        <div><dt>العمر</dt><dd>${esc(s.age)}</dd></div>
        <div><dt>رمز الوصول</dt><dd dir="ltr">${esc(s.code)}</dd></div>
        <div><dt>الدروس المكتملة</dt><dd>${st.done} / ${TOTAL}</dd></div>
        <div><dt>مجموع الدرجات</dt><dd>${ev.total} / ${MAX_TOTAL}</dd></div>
        <div><dt>النسبة المئوية</dt><dd>${ev.pct}%</dd></div>
        <div><dt>تاريخ الإتمام</dt><dd>${fmtDate(s.finalAt)}</dd></div>
        <div><dt>عدد الإجابات الخاطئة</dt><dd>${ev.wrongCount} من ${MAX_TOTAL}</dd></div>
      </dl>
    </section>

    <section class="box">
      <h3>الأداء حسب المستوى</h3>
      <div class="lv-bars">
        ${ev.levels.map((x) => `
          <div class="lv-row">
            <div class="lv-name"><b>${esc(x.lv.name)}</b><span dir="ltr">${esc(x.lv.en)}</span></div>
            <div class="bar"><span style="width:${x.pct}%"></span></div>
            <div class="lv-val">${x.sc} / ${x.max} <small>(${x.pct}%)</small></div>
          </div>`).join('')}
      </div>
    </section>

    <section class="res-2col">
      <div class="box">
        <h3>أقوى المهارات</h3>
        <p>${strongTxt}</p>
      </div>
      <div class="box">
        <h3>أضعف المهارات</h3>
        <p>${weakTxt}</p>
      </div>
      <div class="box">
        <h3>أكثر الأخطاء تكرارًا</h3>
        <p>${mistakesTxt}</p>
      </div>
      <div class="box">
        <h3>موضوعات تحتاج مراجعة</h3>
        ${ev.revision.length
          ? `<ul class="plain">${ev.revision.map((x) => `<li>الدرس ${pad(x.L.id)} — ${esc(x.L.t)} (${x.score}/7)</li>`).join('')}</ul>`
          : '<p>لا توجد موضوعات تحتاج مراجعة عاجلة؛ جميع الدروس بدرجة 6/7 أو أعلى.</p>'}
      </div>
    </section>

    <section class="box">
      <h3>تقييم المشروع النهائي</h3>
      <div class="proj-grid">
        ${ev.projects.map((p) => `
          <div class="proj">
            <span>مشروع الدرس ${pad(p.n)} — ${esc(p.L.t)}</span>
            <b>${p.checked ? `${p.pct}%` : 'لم يُفحص'}</b>
            <small>${p.checked ? `${p.passed} من ${p.total} معايير` : 'افتح التمرين العملي وشغّل التحقق'}</small>
          </div>`).join('')}
      </div>
      <p class="proj-note">${projAvg === null
        ? 'لم يتم فحص أي مشروع بعد. الفحص التلقائي يتيح لك معرفة مدى تطبيقك لمعايير الدلالات وإمكانية الوصول والـ SEO.'
        : `متوسط تنفيذ المشروع: ${projAvg}%. ${projAvg >= 90 ? 'تنفيذ قوي يطابق متطلبات الاحتراف.' : projAvg >= 70 ? 'تنفيذ جيد، لكن هناك معايير ما زالت تحتاج اكتمالًا.' : 'تحتاج إلى إعادة بناء المشروع وفق معايير الدرس بالكامل.'}`}</p>
    </section>

    <section class="box">
      <h3>توصيات شخصية</h3>
      <ol class="recs">${recs.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
    </section>

    <section class="box report">
      <h3>التقرير التفصيلي للأداء</h3>
      <p>حصلت على <b>${ev.total} من ${MAX_TOTAL}</b> بنسبة <b>${ev.pct}%</b>، وهو تقدير <b>${bandAr}</b>. ${ev.wrongCount === 0 ? 'لم تُخطئ في أي سؤال، وهذا مستوى متميز يستحق الاستمرار.' : `أخطأت في ${ev.wrongCount} سؤالًا من أصل ${MAX_TOTAL}، وتفاصيل هذه الأخطاء موضحة أدناه مع الإجابة الصحيحة والسبب.`}</p>
      <p><b>نقاط القوة:</b> ${strongTxt}.</p>
      <p><b>ما يحتاج إلى تحسين:</b> ${weakTxt}.</p>
      <p><b>ملاحظة على الأخطاء:</b> ${ev.mistakeTags.length ? `تكررت الأخطاء أكثر في المحاور: ${mistakesTxt}. الخطأ المتكرر غالبًا يدل على فهم ناقص لقاعدة واحدة، فابحث عن القاعدة المشتركة بين الأسئلة وأعد تطبيقها بنفسك.` : 'لم تتكرر الأخطاء في محور واحد، وهذا دليل على تنوع الفهم.'}</p>
      <h4>تفصيل الإجابات الخاطئة</h4>
      ${detailHtml}
    </section>

    <section class="box">
      <h3>جدول نتائج الدروس</h3>
      <div class="table-wrap">
        <table class="terms results-table">
          <thead><tr><th>الدرس</th><th>العنوان</th><th>الدرجة</th><th>التقدير</th><th>الحالة</th></tr></thead>
          <tbody>
            ${ev.rows.map((x) => `
              <tr>
                <td><code dir="ltr">Day ${pad(x.L.id)}</code></td>
                <td>${esc(x.L.t)}</td>
                <td><b>${x.score}/7</b></td>
                <td>${lessonLabel(x.score)}</td>
                <td>${isDone(s, x.L.id) ? 'مكتمل' : 'غير مكتمل'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <div class="res-actions">
      <button type="button" class="btn btn-blue" data-print>طباعة التقرير / حفظه PDF</button>
      <a class="btn btn-outline" href="#/dashboard">العودة إلى لوحة التحكم</a>
    </div>
  `, s, 'results'));
}

/* ---------- Global event delegation ---------- */
app.addEventListener('submit', (e) => {
  if (e.target.id === 'login-form') {
    e.preventDefault();
    handleLogin(e.target);
  }
});

app.addEventListener('click', (e) => {
  if (e.target.closest('#logout')) return logout();

  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn && view.n) {
    view.tab = tabBtn.dataset.tab;
    renderLesson(view.n, { scroll: true });
    return;
  }
  if (e.target.closest('[data-submit]')) return submitQuiz(view.n);
  if (e.target.closest('[data-retry]')) return retakeQuiz(view.n);
  if (e.target.closest('[data-check]')) return runChecks(view.n);
  if (e.target.closest('[data-print]')) return window.print();
});

app.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('.q-opts input[type="radio"]') && view.n) {
    const i = Number(el.name.slice(1));
    const r = recOf(me(), view.n);
    r.quiz.draft[i] = Number(el.value);
    persist();
    updateQuizProgress();
  }
});

app.addEventListener('input', (e) => {
  const el = e.target;
  if (el.matches('.fill-in') && view.n) {
    const i = Number(el.dataset.q);
    const b = Number(el.dataset.b);
    const r = recOf(me(), view.n);
    if (!Array.isArray(r.quiz.draft[i])) r.quiz.draft[i] = [];
    r.quiz.draft[i][b] = el.value;
    persist();
    updateQuizProgress();
  }
});

// Keyboard: Escape closes nothing special; we keep the hash router as single source of truth.
window.addEventListener('message', (e) => {
  if (!playCtx || !playCtx.frame || e.source !== playCtx.frame.contentWindow) return;
  const d = e.data;
  if (!d || d.fasla !== 1) return;
  const cls = d.type === 'error' ? 'err' : d.type === 'warn' ? 'warn' : 'info';
  playCtx.log(cls, (d.type === 'log' ? '› ' : '') + d.data);
});

window.addEventListener('hashchange', route);
route();
