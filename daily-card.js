// Daily shareable countdown card: renders a fresh design per day, download/share ready.
import { drawScene } from './scenes.js';

const canvas = document.getElementById('daily-card-canvas');
if (canvas) {
  const TEMPLATES = ['night', 'crescent', 'fanous', 'minaret', 'geo', 'mosque', 'lanterns', 'dawn', 'calligraphy', 'iftar', 'quran', 'suhoor', 'clock', 'taraweeh', 'misbaha'];
  const COUNTDOWN_TARGET = new Date('2027-02-07T17:34:00+02:00');
  const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const arDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

  const daysLeft = () => Math.max(0, Math.ceil((COUNTDOWN_TARGET.getTime() - Date.now()) / 86400000));

  async function ensureFont() {
    try {
      await Promise.all([
        document.fonts.load('800 60px Cairo'),
        document.fonts.load('700 40px Cairo'),
        document.fonts.load('400 30px Cairo'),
      ]);
    } catch { /* fall back to system fonts */ }
  }

  function templateOfTheDay() {
    const now = new Date();
    const dayIndex = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    return TEMPLATES[dayIndex % TEMPLATES.length];
  }

  function arToday() {
    const now = new Date();
    return AR_DAYS[now.getDay()] + '، ' + arDigits(now.getDate()) + ' ' + AR_MONTHS[now.getMonth()] + ' ' + arDigits(now.getFullYear());
  }

  function renderCard() {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    // scene backdrop: a frozen, lively frame of today's template
    drawScene(ctx, templateOfTheDay(), W, H, 6.5, {
      line1: '', line2: '', name: '', namePrefix: '', font: 'Cairo, Tajawal, sans-serif', dir: 'rtl', photo: null,
    });
    // deepen top and bottom for legibility
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(4, 18, 14, 0.72)');
    grad.addColorStop(0.38, 'rgba(4, 18, 14, 0.15)');
    grad.addColorStop(0.72, 'rgba(4, 18, 14, 0.55)');
    grad.addColorStop(1, 'rgba(4, 18, 14, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const gold = '#f6c860';
    const cream = '#fdf3d7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';

    // header
    ctx.fillStyle = cream;
    ctx.globalAlpha = 0.92;
    ctx.font = `600 ${W * 0.037}px Tajawal, Cairo, sans-serif`;
    ctx.fillText(arToday(), W / 2, H * 0.115);
    ctx.globalAlpha = 1;

    // ornament divider
    ctx.strokeStyle = 'rgba(246, 200, 96, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.30, H * 0.165); ctx.lineTo(W * 0.44, H * 0.165);
    ctx.moveTo(W * 0.56, H * 0.165); ctx.lineTo(W * 0.70, H * 0.165);
    ctx.stroke();
    ctx.fillStyle = gold;
    ctx.font = `${W * 0.035}px Cairo, sans-serif`;
    ctx.fillText('✦', W / 2, H * 0.165);

    // the big number
    const n = daysLeft();
    ctx.save();
    ctx.shadowColor = 'rgba(246, 200, 96, 0.55)';
    ctx.shadowBlur = W * 0.045;
    ctx.fillStyle = gold;
    ctx.font = `800 ${W * 0.42}px Cairo, sans-serif`;
    ctx.fillText(arDigits(n), W / 2, H * 0.47);
    ctx.restore();

    // label
    ctx.fillStyle = cream;
    ctx.font = `700 ${W * 0.075}px Cairo, sans-serif`;
    ctx.fillText(n === 1 ? 'يوم واحد على رمضان' : 'يوم على رمضان', W / 2, H * 0.70);

    // footer: branding + url
    ctx.fillStyle = 'rgba(253, 243, 215, 0.85)';
    ctx.font = `500 ${W * 0.030}px Tajawal, Cairo, sans-serif`;
    ctx.fillText('رمضان ١٤٤٨ هـ', W / 2, H * 0.885);
    ctx.fillStyle = gold;
    ctx.font = `700 ${W * 0.032}px Cairo, sans-serif`;
    ctx.direction = 'ltr';
    ctx.fillText('ramadankarym.github.io', W / 2, H * 0.935);
    ctx.direction = 'rtl';
  }

  function download() {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ramadan-card-${daysLeft()}-days.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
  }

  async function share() {
    canvas.toBlob(async (blob) => {
      if (!blob) { download(); return; }
      const file = new File([blob], 'ramadan-card.png', { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'بطاقة رمضان اليوم', text: 'باقي ' + daysLeft() + ' يوم على رمضان 🌙 https://ramadankarym.github.io/' });
          return;
        }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      download();
    }, 'image/png');
  }

  ensureFont().then(renderCard);
  const dl = document.getElementById('daily-download');
  if (dl) dl.addEventListener('click', download);
  const sh = document.getElementById('daily-share');
  if (sh) sh.addEventListener('click', share);
}
