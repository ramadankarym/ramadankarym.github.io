// Greeting-video creator: canvas + MediaRecorder, fully client-side.
// Scene rendering lives in scenes.js and is deterministic in t.
import { FORMATS, drawScene } from './scenes.js';

const STR = {
  ar: {
    dir: 'rtl',
    eyebrow: 'صنّع تهنئتك بنفسك',
    title: 'أنشئ فيديو تهنئة رمضانية',
    sub: 'اختر القالب، اكتب تهنئتك واسمك، ثم حمّل الفيديو جاهزًا للمشاركة. مجاني، بدون اشتراك، بدون علامة مائية.',
    template: 'القالب',
    templates: { night: 'ليلة رمضان', lanterns: 'فوانيس', crescent: 'هلال ذهبي', mosque: 'المسجد', fanous: 'الفانوس الكبير', calligraphy: 'قوس وزخرفة', iftar: 'سفرة إفطار', geo: 'زخرفة هندسية', minaret: 'مئذنة وهلال' },
    format: 'المقاس',
    formats: { story: 'ستوري 9:16', square: 'مربع 1:1', wide: 'عريض 16:9' },
    lang: 'اللغة',
    line1: 'السطر الأول',
    line2: 'السطر الثاني',
    name: 'الاسم (اختياري)',
    namePh: 'مثال: حمادة زكريا',
    length: 'مدة الفيديو',
    seconds: 'ثوانٍ',
    make: 'إنشاء الفيديو',
    making: (p) => `جارٍ الإنشاء ${p}٪`,
    download: 'تحميل الفيديو',
    again: 'إنشاء نسخة جديدة',
    meta: (v) => `${v.ext.toUpperCase()} · ${v.width}×${v.height} · ${v.secs} ثوانٍ · ${v.sizeMB} م.ب`,
    privacy: 'الفيديو يُصنع بالكامل على جهازك؛ لا يُرفع أي نص أو اسم إلى الإنترنت. صُنع بواسطة حمادة زكريا.',
    unsupported: 'متصفحك لا يدعم إنشاء الفيديو داخل الصفحة. جرّب أحدث نسخة من كروم أو سفاري.',
    line1Default: 'رمضان كريم',
    line2Default: 'كل عام وأنتم بخير',
    namePrefix: 'من ',
    arNum: (n) => new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(n),
  },
  en: {
    dir: 'ltr',
    eyebrow: 'Make your own greeting',
    title: 'Create a Ramadan greeting video',
    sub: 'Pick a template, write your greeting and name, then download the video, ready to share. Free, no sign-up, no watermark.',
    template: 'Template',
    templates: { night: 'Ramadan night', lanterns: 'Lanterns', crescent: 'Golden crescent', mosque: 'The mosque', fanous: 'Grand lantern', calligraphy: 'Arch & ornament', iftar: 'Iftar table', geo: 'Geometric', minaret: 'Minaret' },
    format: 'Size',
    formats: { story: 'Story 9:16', square: 'Square 1:1', wide: 'Wide 16:9' },
    lang: 'Language',
    line1: 'First line',
    line2: 'Second line',
    name: 'Name (optional)',
    namePh: 'e.g. Hamada Zakaria',
    length: 'Video length',
    seconds: 'seconds',
    make: 'Create the video',
    making: (p) => `Creating ${p}%`,
    download: 'Download the video',
    again: 'Start over',
    meta: (v) => `${v.ext.toUpperCase()} · ${v.width}×${v.height} · ${v.secs}s · ${v.sizeMB} MB`,
    privacy: 'The video renders entirely on your device; no text or name is uploaded anywhere. Made by Hamada Zakaria.',
    unsupported: 'Your browser does not support in-page video creation. Try the latest Chrome or Safari.',
    line1Default: 'Ramadan Kareem',
    line2Default: 'Wishing you a blessed month',
    namePrefix: 'From ',
    arNum: (n) => String(n),
  },
};

const $ = (id) => document.getElementById(id);
const canvas = $('rk-canvas');
const state = { lang: 'ar', template: 'night', format: 'story', duration: 8, recording: false, video: null };

function pickMime() {
  const candidates = [
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];
  if (typeof MediaRecorder === 'undefined') return { mime: '', ext: '' };
  for (const c of candidates) {
    try { if (MediaRecorder.isTypeSupported(c.mime)) return c; } catch { /* keep looking */ }
  }
  return { mime: '', ext: '' };
}

let fontReady = null;
function ensureFont() {
  if (!fontReady) {
    fontReady = Promise.all([
      document.fonts.load('800 60px Cairo'),
      document.fonts.load('700 40px Cairo'),
      document.fonts.load('400 30px Cairo'),
    ]).catch(() => {});
  }
  return fontReady;
}

const fmt = () => FORMATS.find((f) => f.id === state.format) || FORMATS[0];
const s = () => STR[state.lang];

function sceneText() {
  return {
    line1: $('rk-line1').value, line2: $('rk-line2').value, name: $('rk-name').value,
    namePrefix: s().namePrefix, font: 'Cairo, Tajawal, sans-serif', dir: s().dir,
  };
}

// Live preview loop (paused while recording).
let previewRaf = 0;
function startPreview() {
  cancelAnimationFrame(previewRaf);
  if (state.recording) return;
  const f = fmt();
  canvas.width = Math.round(f.width * 0.5);
  canvas.height = Math.round(f.height * 0.5);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const start = performance.now();
  const tick = (now) => {
    const t = ((now - start) / 1000) % 20;
    drawScene(ctx, state.template, canvas.width, canvas.height, t, sceneText());
    previewRaf = requestAnimationFrame(tick);
  };
  ensureFont().then(() => { previewRaf = requestAnimationFrame(tick); });
}

function setProgress(p) {
  $('rk-progress').hidden = p === null;
  if (p !== null) $('rk-progress-fill').style.width = p + '%';
}

async function generate() {
  if (state.recording) return;
  const picked = pickMime();
  if (!picked.mime) {
    $('rk-unsupported').hidden = false;
    $('rk-unsupported').textContent = s().unsupported;
    return;
  }
  $('rk-unsupported').hidden = true;
  hideResult();
  await ensureFont();
  state.recording = true;
  cancelAnimationFrame(previewRaf);
  const makeBtn = $('rk-make');
  makeBtn.disabled = true;
  const f = fmt();
  canvas.width = f.width;
  canvas.height = f.height;
  const ctx = canvas.getContext('2d');
  setProgress(0);
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: picked.mime, videoBitsPerSecond: 8000000 });
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const done = new Promise((resolve) => { rec.onstop = resolve; });
  rec.start(250);
  const t0 = performance.now();
  const text = sceneText();
  await new Promise((resolve) => {
    const tick = (now) => {
      const t = (now - t0) / 1000;
      drawScene(ctx, state.template, canvas.width, canvas.height, t, text);
      const p = Math.min(100, Math.round((t / state.duration) * 100));
      setProgress(p);
      $('rk-make-label').textContent = s().making(s().arNum(p));
      if (t < state.duration) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });
  rec.stop();
  await done;
  stream.getTracks().forEach((tr) => tr.stop());
  const blob = new Blob(chunks, { type: picked.mime.split(';')[0] });
  state.video = {
    url: URL.createObjectURL(blob), ext: picked.ext,
    sizeMB: (blob.size / (1024 * 1024)).toFixed(1),
    width: f.width, height: f.height, secs: state.duration,
  };
  state.recording = false;
  makeBtn.disabled = false;
  $('rk-make-label').textContent = s().make;
  setProgress(null);
  showResult();
  startPreview();
}

function showResult() {
  const v = state.video;
  if (!v) return;
  $('rk-video').src = v.url;
  $('rk-meta').textContent = s().meta(v);
  $('rk-result').hidden = false;
  $('rk-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideResult() {
  $('rk-result').hidden = true;
  if (state.video) { URL.revokeObjectURL(state.video.url); state.video = null; }
  $('rk-video').removeAttribute('src');
}

function download() {
  const v = state.video;
  if (!v) return;
  const a = document.createElement('a');
  a.href = v.url;
  a.download = `ramadan-kareem-${state.template}-${v.width}x${v.height}.${v.ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function buildPills(containerId, entries, current, onPick) {
  const box = $(containerId);
  box.textContent = '';
  for (const [value, label] of entries) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rk-pill';
    b.textContent = label;
    b.setAttribute('aria-pressed', String(value === current));
    b.addEventListener('click', () => {
      onPick(value);
      for (const child of box.children) child.setAttribute('aria-pressed', String(child === b));
      startPreview();
    });
    box.appendChild(b);
  }
}

function renderControls() {
  const t = s();
  $('t-eyebrow').textContent = t.eyebrow;
  $('creator-title').textContent = t.title;
  $('t-sub').textContent = t.sub;
  $('t-template').textContent = t.template;
  $('t-format').textContent = t.format;
  $('t-lang').textContent = t.lang;
  $('t-line1').textContent = t.line1;
  $('t-line2').textContent = t.line2;
  $('t-name').textContent = t.name;
  $('rk-name').placeholder = t.namePh;
  $('t-length').textContent = t.length;
  $('rk-duration-value').textContent = t.arNum(state.duration);
  $('t-seconds').textContent = t.seconds;
  $('rk-make-label').textContent = t.make;
  $('t-download').textContent = t.download;
  $('t-again').textContent = t.again;
  $('t-privacy').textContent = t.privacy;
  $('rk-controls').dir = t.dir;
  $('rk-line1').dir = t.dir;
  $('rk-line2').dir = t.dir;
  $('rk-name').dir = t.dir;
  buildPills('rk-templates', Object.entries(t.templates), state.template, (v) => { state.template = v; });
  buildPills('rk-formats', Object.entries(t.formats), state.format, (v) => { state.format = v; });
  buildPills('rk-langs', [['ar', 'العربية'], ['en', 'English']], state.lang, (v) => {
    state.lang = v;
    $('rk-line1').value = t && STR[v].line1Default;
    $('rk-line2').value = STR[v].line2Default;
    renderControls();
  });
}

function init() {
  $('rk-line1').value = STR.ar.line1Default;
  $('rk-line2').value = STR.ar.line2Default;
  renderControls();
  $('rk-line1').addEventListener('input', startPreview);
  $('rk-line2').addEventListener('input', startPreview);
  $('rk-name').addEventListener('input', startPreview);
  $('rk-duration').addEventListener('input', () => {
    state.duration = Number($('rk-duration').value);
    $('rk-duration-value').textContent = s().arNum(state.duration);
  });
  $('rk-make').addEventListener('click', generate);
  $('rk-download').addEventListener('click', download);
  $('rk-again').addEventListener('click', () => { hideResult(); canvas.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  startPreview();
}

init();
