// Greeting-video creator: canvas + MediaRecorder, fully client-side.
// Scene rendering lives in scenes.js and is deterministic in t.
import { FORMATS, drawScene } from './scenes.js?v=13';

const STR = {
  ar: {
    dir: 'rtl',
    eyebrow: 'صنّع تهنئتك بنفسك',
    title: 'أنشئ فيديو تهنئة رمضانية',
    sub: 'اختر القالب، اكتب تهنئتك واسمك، ثم حمّل الفيديو جاهزًا للمشاركة. مجاني، بدون اشتراك، بدون علامة مائية.',
    template: 'القالب',
    templates: { night: 'المسحراتي', lanterns: 'خيامية', crescent: 'هلال النيل', mosque: 'القلعة', fanous: 'الفانوس', calligraphy: 'مشربية', iftar: 'مدفع الإفطار', geo: 'زخرفة إسلامية', minaret: 'مآذن القاهرة', dawn: 'فجر القاهرة', quran: 'المصحف', suhoor: 'سفرة السحور', clock: 'ساعة رمضان', taraweeh: 'التراويح', misbaha: 'المسبحة' },
    format: 'المقاس',
    formats: { story: 'ستوري 9:16', square: 'مربع 1:1', wide: 'عريض 16:9' },
    lang: 'اللغة',
    opener: 'جملة افتتاحية (اختياري)',
    openerPh: 'مثال: بسم الله نبدأ',
    line1: 'اسم التهنئة',
    line2: 'وصف التهنئة',
    closing: 'جملة ختامية / دعاء (اختياري)',
    closingPh: 'مثال: اللهم بلغنا رمضان',
    name: 'التوقيع (اختياري)',
    namePh: 'مثال: أحمد محمد',
    length: 'مدة الفيديو',
    seconds: 'ثوانٍ',
    make: 'إنشاء الفيديو',
    making: (p) => `جارٍ الإنشاء ${p}٪`,
    download: 'تحميل الفيديو',
    again: 'إنشاء نسخة جديدة',
    meta: (v) => `${v.ext.toUpperCase()} · ${v.width}×${v.height} · ${v.secs} ثوانٍ · ${v.sizeMB} م.ب`,
    photo: 'صورتك في التهنئة (اختياري)',
    photoClear: 'إزالة الصورة',
    share: 'شارك التهنئة',
    shareVideo: 'مشاركة الفيديو',
    shareMsg: 'عملت فيديو تهنئة رمضانية 🌙 اعمل تهنئتك باسمك من هنا:',
    videoShared: 'تمت المشاركة',
    privacy: 'الفيديو يُصنع بالكامل على جهازك؛ لا يُرفع أي نص أو اسم أو صورة إلى الإنترنت.',
    sound: 'الصوت',
    music: 'موسيقى خلفية',
    musicVol: 'مستوى الموسيقى',
    voice: 'تعليق صوتي بصوتك (اختياري)',
    voiceRec: '🎙 سجّل صوتك',
    voiceStop: '⏹ إيقاف التسجيل',
    voicePlay: '▶ استمع',
    voiceDel: 'حذف التسجيل',
    voiceHint: 'يُسجَّل على جهازك فقط ولا يُرفع. الموسيقى تخفت تلقائيًا أثناء كلامك.',
    voiceRecording: (n) => `جارٍ التسجيل… ${n}`,
    voiceReady: (n) => `تم التسجيل (${n} ث)`,
    voiceDenied: 'لم يُسمح باستخدام المايك. فعّل الإذن من إعدادات المتصفح.',
    voiceUnsupported: 'متصفحك لا يدعم التسجيل الصوتي.',
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
    templates: { night: 'Mesaharaty', lanterns: 'Khayamiya', crescent: 'Nile crescent', mosque: 'The Citadel', fanous: 'The fanous', calligraphy: 'Mashrabiya', iftar: 'Iftar cannon', geo: 'Islamic pattern', minaret: 'Cairo minarets', dawn: 'Cairo dawn', quran: 'The Quran', suhoor: 'Suhoor table', clock: 'Ramadan watch', taraweeh: 'Taraweeh arches', misbaha: 'Prayer beads' },
    format: 'Size',
    formats: { story: 'Story 9:16', square: 'Square 1:1', wide: 'Wide 16:9' },
    lang: 'Language',
    opener: 'Opening line (optional)',
    openerPh: 'e.g. In the name of God',
    line1: 'Greeting title',
    line2: 'Greeting description',
    closing: 'Closing wish (optional)',
    closingPh: 'e.g. May Allah accept our fasting',
    name: 'Signature (optional)',
    namePh: 'e.g. Ahmed Mohamed',
    length: 'Video length',
    seconds: 'seconds',
    make: 'Create the video',
    making: (p) => `Creating ${p}%`,
    download: 'Download the video',
    again: 'Start over',
    meta: (v) => `${v.ext.toUpperCase()} · ${v.width}×${v.height} · ${v.secs}s · ${v.sizeMB} MB`,
    photo: 'Your photo in the greeting (optional)',
    photoClear: 'Remove the photo',
    share: 'Share the greeting',
    shareVideo: 'Share the video',
    shareMsg: 'I made a Ramadan greeting video 🌙 Make yours here:',
    videoShared: 'Shared',
    privacy: 'The video renders entirely on your device; no text, name or photo is uploaded anywhere.',
    sound: 'Sound',
    music: 'Background music',
    musicVol: 'Music volume',
    voice: 'Voice-over in your own voice (optional)',
    voiceRec: '🎙 Record your voice',
    voiceStop: '⏹ Stop recording',
    voicePlay: '▶ Listen',
    voiceDel: 'Delete recording',
    voiceHint: 'Recorded on your device only, never uploaded. The music dips automatically while you speak.',
    voiceRecording: (n) => `Recording… ${n}`,
    voiceReady: (n) => `Recorded (${n}s)`,
    voiceDenied: 'Microphone access was not allowed. Enable it in your browser settings.',
    voiceUnsupported: 'Your browser does not support audio recording.',
    unsupported: 'Your browser does not support in-page video creation. Try the latest Chrome or Safari.',
    line1Default: 'Ramadan Kareem',
    line2Default: 'Wishing you a blessed month',
    namePrefix: 'From ',
    arNum: (n) => String(n),
  },
};

const $ = (id) => document.getElementById(id);
// ---- Sound: licensed background music + optional voice-over recorded by the visitor ----
const audio = { ctx: null, music: null, musicLoading: null, voice: null, voiceBlob: null, rec: null, recTimer: 0, previewEl: null };
function getCtx() {
  if (!audio.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio.ctx = new AC();
  }
  if (audio.ctx.state === 'suspended') audio.ctx.resume().catch(() => {});
  return audio.ctx;
}
function decode(ctx, arrayBuffer) {
  return new Promise((resolve, reject) => {
    const p = ctx.decodeAudioData(arrayBuffer, resolve, reject);
    if (p && p.catch) p.catch(reject);
  });
}
function loadMusic(ctx) {
  if (audio.music) return Promise.resolve(audio.music);
  if (!audio.musicLoading) {
    audio.musicLoading = Promise.all([0, 1, 2, 3, 4].map((i) => fetch(`/music-0${i}.b64`).then((r) => r.text())))
      .then((parts) => {
        const bin = atob(parts.join('').replace(/\s+/g, ''));
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return decode(ctx, bytes.buffer);
      })
      .then((buf) => { audio.music = buf; return buf; })
      .catch(() => { audio.musicLoading = null; return null; });
  }
  return audio.musicLoading;
}
// Builds the soundtrack for a video of `secs` seconds; returns { track, stop } or null.
async function buildSoundtrack(secs) {
  const useMusic = $('rk-music').checked;
  if (!useMusic && !audio.voice) return null;
  const ctx = getCtx();
  if (!ctx || !ctx.createMediaStreamDestination) return null;
  const dest = ctx.createMediaStreamDestination();
  const nodes = [];
  const now = ctx.currentTime + 0.08;
  const vol = Number($('rk-music-vol').value) / 100;
  const hasVoice = !!audio.voice;
  const voiceAt = 0.7;
  let voiceEnd = 0;
  if (hasVoice) voiceEnd = Math.min(secs - 0.3, voiceAt + audio.voice.duration);
  if (useMusic) {
    const buf = await loadMusic(ctx);
    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const g = ctx.createGain();
      const full = vol * 0.8;
      const low = full * 0.28;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(hasVoice ? low : full, now + 1.0);
      if (hasVoice) {
        g.gain.setValueAtTime(low, now + Math.max(1.0, voiceEnd - 0.1));
        g.gain.linearRampToValueAtTime(full, now + voiceEnd + 0.7);
      }
      g.gain.setValueAtTime(full, now + Math.max(0.1, secs - 1.6));
      g.gain.linearRampToValueAtTime(0, now + secs);
      src.connect(g); g.connect(dest);
      src.start(now, 12);
      src.stop(now + secs + 0.2);
      nodes.push(src);
    }
  }
  if (hasVoice) {
    const v = ctx.createBufferSource();
    v.buffer = audio.voice;
    const vg = ctx.createGain();
    vg.gain.value = 1.4;
    v.connect(vg); vg.connect(dest);
    v.start(now + voiceAt);
    nodes.push(v);
  }
  const track = dest.stream.getAudioTracks()[0];
  return track ? { track, stop: () => { nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } }); track.stop(); } } : null;
}

function micMime() {
  for (const m of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']) {
    try { if (MediaRecorder.isTypeSupported(m)) return m; } catch { /* next */ }
  }
  return '';
}
function setVoiceUi(mode) {
  const rec = $('rk-voice-rec'), play = $('rk-voice-play'), del = $('rk-voice-del');
  rec.textContent = mode === 'recording' ? s().voiceStop : s().voiceRec;
  rec.classList.toggle('is-rec', mode === 'recording');
  play.hidden = mode !== 'ready';
  del.hidden = mode !== 'ready';
  play.textContent = s().voicePlay;
  del.textContent = s().voiceDel;
}
function clearVoice() {
  audio.voice = null; audio.voiceBlob = null;
  if (audio.previewEl) { audio.previewEl.pause(); audio.previewEl = null; }
  $('rk-voice-status').textContent = '';
  setVoiceUi('idle');
}
async function toggleVoiceRecord() {
  if (audio.rec) { audio.rec.stop(); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
    $('rk-voice-status').textContent = s().voiceUnsupported; return;
  }
  const ctx = getCtx();
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
  catch { $('rk-voice-status').textContent = s().voiceDenied; return; }
  clearVoice();
  const mime = micMime();
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks = [];
  const t0 = performance.now();
  const maxSecs = Math.max(3, state.duration - 1);
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  rec.onstop = async () => {
    clearInterval(audio.recTimer);
    stream.getTracks().forEach((t) => t.stop());
    audio.rec = null;
    const blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' });
    try {
      const buf = await decode(ctx, await blob.arrayBuffer());
      audio.voice = buf; audio.voiceBlob = blob;
      $('rk-voice-status').textContent = s().voiceReady(s().arNum(Math.round(buf.duration * 10) / 10));
      setVoiceUi('ready');
    } catch {
      $('rk-voice-status').textContent = s().voiceUnsupported;
      setVoiceUi('idle');
    }
  };
  audio.rec = rec;
  rec.start();
  setVoiceUi('recording');
  audio.recTimer = setInterval(() => {
    const el = (performance.now() - t0) / 1000;
    $('rk-voice-status').textContent = s().voiceRecording(`${s().arNum(Math.floor(el))}/${s().arNum(maxSecs)}`);
    if (el >= maxSecs && audio.rec) audio.rec.stop();
  }, 250);
}
function playVoice() {
  if (!audio.voiceBlob) return;
  if (audio.previewEl) audio.previewEl.pause();
  const el = new Audio(URL.createObjectURL(audio.voiceBlob));
  audio.previewEl = el;
  el.play().catch(() => {});
}

// Sound controls are injected here so the page markup stays untouched.
const SOUND_CSS = ".rk-sound { gap: 9px; padding: 12px; border: 1px solid rgba(228, 199, 131, .2); border-radius: 14px; background: rgba(228, 199, 131, .035); }\n.rk-check { display: flex; align-items: center; gap: 10px; min-height: 44px; color: #ecd8a4; font-size: 14px; font-weight: 600; cursor: pointer; }\n.rk-check input { width: 22px; height: 22px; accent-color: #e4c783; }\n.rk-voice-row { display: flex; flex-wrap: wrap; gap: 8px; }\n.rk-voice-row .ambience-button { min-height: 44px; }\n.rk-voice-row .is-rec { border-color: #e0795f; color: #ffd9cc; background: rgba(224, 121, 95, .18); }\n.rk-voice-status:empty { display: none; }\n.rk-hint { color: #9caf9f; font-size: 12px; line-height: 1.7; }\n\n.rk-music-credit a { color: #e4c783; }\n";
const SOUND_HTML = "<div class=\"rk-field rk-sound\">\n                <span class=\"rk-label\" id=\"t-sound\">الصوت</span>\n                <label class=\"rk-check\"><input type=\"checkbox\" id=\"rk-music\" checked /> <span id=\"t-music\">موسيقى خلفية</span></label>\n                <label class=\"rk-label\" for=\"rk-music-vol\" id=\"t-music-vol\">مستوى الموسيقى</label>\n                <input class=\"rk-range\" id=\"rk-music-vol\" type=\"range\" min=\"10\" max=\"100\" step=\"5\" value=\"55\" />\n                <span class=\"rk-label\" id=\"t-voice\">تعليق صوتي بصوتك (اختياري)</span>\n                <div class=\"rk-voice-row\">\n                  <button class=\"ambience-button\" id=\"rk-voice-rec\" type=\"button\">🎙 سجّل صوتك</button>\n                  <button class=\"ambience-button\" id=\"rk-voice-play\" type=\"button\" hidden>▶ استمع</button>\n                  <button class=\"ambience-button\" id=\"rk-voice-del\" type=\"button\" hidden>حذف التسجيل</button>\n                </div>\n                <span class=\"rk-note rk-voice-status\" id=\"rk-voice-status\" aria-live=\"polite\"></span>\n                <span class=\"rk-hint\" id=\"rk-voice-hint\"></span>\n              </div>";
function injectSound() {
  if ($('rk-music')) return;
  const st = document.createElement('style'); st.textContent = SOUND_CSS; document.head.appendChild(st);
  const anchor = $('rk-duration').closest('.rk-field');
  const tpl = document.createElement('template'); tpl.innerHTML = SOUND_HTML.trim();
  anchor.parentNode.insertBefore(tpl.content.firstElementChild, anchor);
}
const CREDIT = {
  ar: 'الموسيقى: «Desert City» تأليف Kevin MacLeod (<a href="https://incompetech.com" target="_blank" rel="noopener">incompetech.com</a>)، رخصة <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>.',
  en: 'Music: "Desert City" by Kevin MacLeod (<a href="https://incompetech.com" target="_blank" rel="noopener">incompetech.com</a>), licensed <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>.',
};

const canvas = $('rk-canvas');
const state = {
  lang: (document.documentElement.lang || 'ar').toLowerCase().startsWith('en') ? 'en' : 'ar',
  template: 'night', format: 'story', duration: 8, recording: false, video: null, photo: null,
};

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
    opener: $('rk-opener').value, line1: $('rk-line1').value, line2: $('rk-line2').value, closing: $('rk-closing').value, name: $('rk-name').value,
    namePrefix: s().namePrefix, font: 'Cairo, Tajawal, sans-serif', dir: s().dir, photo: state.photo,
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
  let sound = null;
  try { sound = await buildSoundtrack(state.duration); } catch { sound = null; }
  if (sound) stream.addTrack(sound.track);
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
  if (sound) sound.stop();
  const blob = new Blob(chunks, { type: picked.mime.split(';')[0] });
  state.video = {
    url: URL.createObjectURL(blob), blob, ext: picked.ext,
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
  $('rk-video').muted = false;
  $('rk-video').src = v.url;
  $('rk-meta').textContent = s().meta(v);
  $('rk-result').hidden = false;
  setupShare();
  $('rk-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function siteUrl() {
  const canonical = document.querySelector('link[rel="canonical"]');
  return canonical ? canonical.href : location.href;
}

function setupShare() {
  const box = $('rk-share');
  if (!box) return;
  const url = siteUrl();
  const msg = `${s().shareMsg} ${url}`;
  $('rk-share-wa').href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  $('rk-share-fb').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  $('rk-share-tg').href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(s().shareMsg)}`;
  const shareVideoBtn = $('rk-share-video');
  let file = null;
  try {
    file = new File([state.video.blob], `ramadan-kareem.${state.video.ext}`, { type: state.video.blob.type });
  } catch { file = null; }
  const canShareFiles = file && navigator.canShare && navigator.canShare({ files: [file] });
  shareVideoBtn.hidden = !canShareFiles;
  if (canShareFiles) {
    shareVideoBtn.onclick = async () => {
      try {
        await navigator.share({ files: [file], title: document.title, text: s().shareMsg });
      } catch (error) {
        if (!error || error.name !== 'AbortError') $('rk-share-status').textContent = '';
      }
    };
  }
  box.hidden = false;
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

// Live thumbnail grid: each tile is a small canvas animating its own template.
const gridTiles = [];
let gridRaf = 0;
let gridLast = 0;
let gridIo = null;
function buildTemplateGrid(containerId, entries, current, onPick) {
  const box = $(containerId);
  box.textContent = '';
  box.classList.add('rk-grid');
  gridTiles.length = 0;
  const text = () => ({ opener: '', closing: '', line1: '', line2: '', name: '', namePrefix: '', font: 'Cairo, Tajawal, sans-serif', dir: 'rtl', photo: null });
  for (const [value, label] of entries) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'rk-tile';
    tile.setAttribute('aria-pressed', String(value === current));
    const cv = document.createElement('canvas');
    cv.width = 108; cv.height = 192;
    const name = document.createElement('span');
    name.className = 'rk-tile-name';
    name.textContent = label;
    tile.appendChild(cv);
    tile.appendChild(name);
    tile.addEventListener('click', () => {
      onPick(value);
      for (const child of box.children) child.setAttribute('aria-pressed', String(child === tile));
      startPreview();
    });
    box.appendChild(tile);
    gridTiles.push({ ctx: cv.getContext('2d'), template: value, phase: Math.random() * 14 });
  }
  cancelAnimationFrame(gridRaf);
  const tick = (now) => {
    gridRaf = requestAnimationFrame(tick);
    if (now - gridLast < 100) return; // ~10fps is plenty for thumbnails
    gridLast = now;
    const t = now / 1000;
    for (const tile of gridTiles) {
      if (!tile.ctx) continue;
      drawScene(tile.ctx, tile.template, 108, 192, (t + tile.phase) % 20, text());
    }
  };
  // animate only while the grid is on screen
  if (gridIo) gridIo.disconnect();
  const io = new IntersectionObserver((obs) => {
    if (obs[0].isIntersecting) { gridRaf = requestAnimationFrame(tick); }
    else { cancelAnimationFrame(gridRaf); }
  });
  io.observe(box);
  gridIo = io;
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
  $('t-opener').textContent = t.opener;
  $('t-closing').textContent = t.closing;
  $('rk-opener').placeholder = t.openerPh;
  $('rk-closing').placeholder = t.closingPh;
  $('t-line1').textContent = t.line1;
  $('t-line2').textContent = t.line2;
  $('t-name').textContent = t.name;
  $('rk-name').placeholder = t.namePh;
  $('t-length').textContent = t.length;
  $('rk-duration-value').textContent = t.arNum(state.duration);
  $('t-seconds').textContent = t.seconds;
  $('rk-make-label').textContent = t.make;
  $('t-photo').textContent = t.photo;
  $('t-sound').textContent = t.sound;
  $('t-music').textContent = t.music;
  $('t-music-vol').textContent = t.musicVol;
  $('t-voice').textContent = t.voice;
  $('rk-voice-hint').textContent = t.voiceHint;
  setVoiceUi(audio.rec ? 'recording' : audio.voice ? 'ready' : 'idle');
  $('t-share').textContent = t.share;
  $('t-share-video').textContent = t.shareVideo;
  $('t-download').textContent = t.download;
  $('t-again').textContent = t.again;
  $('t-privacy').textContent = t.privacy;
  $('rk-controls').dir = t.dir;
  $('rk-opener').dir = t.dir;
  $('rk-closing').dir = t.dir;
  $('rk-line1').dir = t.dir;
  $('rk-line2').dir = t.dir;
  $('rk-name').dir = t.dir;
  buildTemplateGrid('rk-templates', Object.entries(t.templates), state.template, (v) => { state.template = v; });
  buildPills('rk-formats', Object.entries(t.formats), state.format, (v) => { state.format = v; });
  buildPills('rk-langs', [['ar', 'العربية'], ['en', 'English']], state.lang, (v) => {
    state.lang = v;
    $('rk-opener').value = '';
    $('rk-closing').value = '';
    $('rk-line1').value = t && STR[v].line1Default;
    $('rk-line2').value = STR[v].line2Default;
    renderControls();
  });
}

function init() {
  injectSound();
  $('rk-line1').value = s().line1Default;
  $('rk-line2').value = s().line2Default;
  renderControls();
  $('rk-opener').addEventListener('input', startPreview);
  $('rk-closing').addEventListener('input', startPreview);
  $('rk-line1').addEventListener('input', startPreview);
  $('rk-line2').addEventListener('input', startPreview);
  $('rk-name').addEventListener('input', startPreview);
  $('rk-duration').addEventListener('input', () => {
    state.duration = Number($('rk-duration').value);
    $('rk-duration-value').textContent = s().arNum(state.duration);
  });
  $('rk-photo').addEventListener('change', () => {
    const file = $('rk-photo').files && $('rk-photo').files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      state.photo = img;
      $('rk-photo-name').textContent = file.name;
      $('rk-photo-clear').hidden = false;
      startPreview();
    };
    img.src = URL.createObjectURL(file);
  });
  $('rk-photo-clear').addEventListener('click', () => {
    state.photo = null;
    $('rk-photo').value = '';
    $('rk-photo-name').textContent = '';
    $('rk-photo-clear').hidden = true;
    startPreview();
  });
  $('rk-voice-rec').addEventListener('click', toggleVoiceRecord);
  $('rk-voice-play').addEventListener('click', playVoice);
  $('rk-voice-del').addEventListener('click', clearVoice);
  $('rk-music').addEventListener('change', () => { if ($('rk-music').checked) { const c = getCtx(); if (c) loadMusic(c); } });
  $('rk-make').addEventListener('click', generate);
  $('rk-download').addEventListener('click', download);
  $('rk-again').addEventListener('click', () => { hideResult(); canvas.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  startPreview();
}

init();
