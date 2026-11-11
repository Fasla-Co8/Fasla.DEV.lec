// ============================================================
// Fasla.DEV - code editor, syntax highlighter, validators & preview builder
// Pure vanilla JS. No external dependencies.
// ============================================================

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const escAttr = (s) => esc(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const span = (cls, txt) => `<span class="tk-${cls}">${esc(txt)}</span>`;

// Escapes the gaps between matches and lets `fn` render each match.
function tokenize(src, re, fn) {
  let out = '';
  let last = 0;
  src.replace(re, (...args) => {
    const m = args[0];
    const idx = args[args.length - 2];
    out += esc(src.slice(last, idx));
    out += fn(m, args.slice(1, -2));
    last = idx + m.length;
    return m;
  });
  return out + esc(src.slice(last));
}

/* ---------- HTML ---------- */
function hlHtml(src) {
  return tokenize(src, /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>/g, (m) => {
    if (m.startsWith('<!--')) return span('com', m);
    if (m.startsWith('<!')) return span('kw', m);
    const pre = m.match(/^<\/?/)[0];
    const name = m.slice(pre.length).match(/^[\w:-]+/)[0];
    const inner = m.slice(pre.length + name.length);
    const attrs = tokenize(inner, /("[^"]*"|'[^']*')|([^\s="'<>\/]+)/g, (t, g) =>
      g[0] !== undefined ? span('str', t) : span('attr', t)
    );
    return span('pu', pre) + span('tag', name) + attrs;
  });
}

/* ---------- CSS ---------- */
function hlCss(src) {
  const re =
    /(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(#[0-9a-fA-F]{3,8}\b)|(@[\w-]+)|([^{};\n]+(?=\{))|([\w-]+(?=\s*:))|((?<![\w-])-?\d*\.?\d+(?:px|em|rem|%|vh|vw|s|ms|deg|fr)?)/g;
  const types = ['com', 'str', 'num', 'kw', 'sel', 'prop', 'num'];
  return tokenize(src, re, (m, g) => span(types[g.findIndex((x) => x !== undefined)], m));
}

/* ---------- JavaScript ---------- */
function hlJs(src) {
  const re =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|(\b(?:const|let|var|function|return|if|else|for|while|do|class|new|try|catch|finally|throw|async|await|import|export|from|of|in|switch|case|break|continue|default|typeof|instanceof|this|extends)\b)|(\b(?:true|false|null|undefined)\b)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][\w$]*(?=\())/g;
  const types = ['com', 'str', 'kw', 'num', 'num', 'fn'];
  return tokenize(src, re, (m, g) => span(types[g.findIndex((x) => x !== undefined)], m));
}

export function highlight(src, lang = 'html') {
  if (lang === 'css') return hlCss(src);
  if (lang === 'js' || lang === 'javascript') return hlJs(src);
  return hlHtml(src);
}

/* ---------- Validators ---------- */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

// Lightweight tag-balance checker. Returns Arabic warning strings.
export function checkHtml(src) {
  const warnings = [];
  const clean = String(src)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, (m) => m.replace(/[^\n]/g, ' '));
  const stack = [];
  const re = /<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(clean))) {
    const close = m[1] === '/';
    const name = m[2].toLowerCase();
    const selfClosing = m[4] === '/';
    if (!close) {
      if (name === 'img' && !/\balt\s*=/i.test(m[3])) {
        warnings.push('صورة <img> بدون خاصية alt — أضفها لتحسين إمكانية الوصول.');
      }
      if (VOID.has(name) || selfClosing) continue;
      stack.push(name);
    } else {
      if (VOID.has(name)) continue;
      const i = stack.lastIndexOf(name);
      if (i === -1) {
        warnings.push(`وسم الإغلاق </${name}> ليس له وسم فتح مقابل.`);
      } else {
        for (let j = stack.length - 1; j > i; j--) {
          warnings.push(`الوسم <${stack[j]}> لم يُغلق قبل </${name}>.`);
        }
        stack.length = i;
      }
    }
  }
  stack.forEach((n) => warnings.push(`الوسم <${n}> مفتوح ولم يتم إغلاقه.`));
  return [...new Set(warnings)];
}

// Returns an error message string, or null if the JS parses correctly.
export function checkJs(src) {
  if (!String(src).trim()) return null;
  try {
    // eslint-disable-next-line no-new-func
    new Function(src);
    return null;
  } catch (e) {
    return e.message;
  }
}

/* ---------- Preview builder ---------- */
// Bridge script injected into the sandboxed iframe: forwards runtime errors and console output.
const BRIDGE = `<script>(function(){
  function send(type, data){ try { parent.postMessage({ fasla: 1, type: type, data: String(data) }, '*'); } catch(e){} }
  window.addEventListener('error', function(e){ send('error', e.message + (e.lineno ? ' (سطر ' + e.lineno + ')' : '')); });
  ['log','info','warn','error'].forEach(function(k){
    var orig = console[k];
    console[k] = function(){
      var txt = Array.prototype.map.call(arguments, function(a){
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(x){ return String(a); }
      }).join(' ');
      send(k === 'error' ? 'error' : (k === 'warn' ? 'warn' : 'log'), txt);
      if (orig) orig.apply(console, arguments);
    };
  });
})();<\/script>`;

export function buildPreviewDoc(html = '', css = '', js = '') {
  const style = css.trim() ? `<style>\n${css}\n</style>` : '';
  const script = js.trim() ? `<script>\n${js}\n<\/script>` : '';
  if (/<html[\s>]/i.test(html)) {
    let doc = html;
    doc = /<\/head>/i.test(doc)
      ? doc.replace(/<\/head>/i, `${BRIDGE}${style}</head>`)
      : `${BRIDGE}${style}` + doc;
    doc = /<\/body>/i.test(doc)
      ? doc.replace(/<\/body>/i, `${script}</body>`)
      : doc + script;
    return doc;
  }
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${BRIDGE}
${style}
</head>
<body>
${html}
${script}
</body>
</html>`;
}

/* ---------- Editor ---------- */
// Layered editor: transparent <textarea> on top of a highlighted <pre>, with a synced line-number gutter.
export function mountEditor(host, { lang = 'html', value = '', onInput, onRun, label = 'محرر الكود' } = {}) {
  host.innerHTML = `
    <div class="cm-gutter" aria-hidden="true"><div class="cm-nums"></div></div>
    <div class="cm-main">
      <pre class="cm-hl" aria-hidden="true"></pre>
      <textarea class="cm-ta" spellcheck="false" wrap="off" dir="ltr" aria-label="${escAttr(label)}"></textarea>
    </div>`;
  const nums = host.querySelector('.cm-nums');
  const pre = host.querySelector('.cm-hl');
  const ta = host.querySelector('.cm-ta');

  const render = () => {
    const v = ta.value;
    pre.innerHTML = highlight(v, lang) + '\n';
    const n = v.split('\n').length;
    let s = '';
    for (let i = 1; i <= n; i++) s += i + '\n';
    nums.textContent = s;
  };

  ta.value = value;
  render();

  ta.addEventListener('input', () => {
    render();
    if (onInput) onInput(ta.value);
  });

  ta.addEventListener('scroll', () => {
    pre.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
    nums.style.transform = `translateY(${-ta.scrollTop}px)`;
  });

  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(ta.selectionEnd);
      ta.selectionStart = ta.selectionEnd = s + 2;
      render();
      if (onInput) onInput(ta.value);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onRun) onRun();
    }
  });

  return {
    getValue: () => ta.value,
    focus: () => ta.focus(),
  };
}
