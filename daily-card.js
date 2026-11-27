// Daily shareable countdown card: renders a fresh design per day, download/share ready.
import { drawScene } from './scenes.js?v=19';

const canvas = document.getElementById('daily-card-canvas');
if (canvas) {
  const TEMPLATES = ['night', 'crescent', 'fanous', 'minaret', 'geo', 'mosque', 'lanterns', 'dawn', 'calligraphy', 'iftar', 'quran', 'suhoor', 'clock', 'taraweeh', 'misbaha'];
  const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const arDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const EN = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const digits = EN ? (n) => String(n) : arDigits;

  // same number as the main countdown (shared source: countdown-core.js)
  const daysLeft = () => window.RK.daysLeft();

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
    const c = window.RK.cairoToday();
    const dayIndex = Math.floor(Date.UTC(c.year, c.month, c.day) / 86400000);
    return TEMPLATES[dayIndex % TEMPLATES.length];
  }

  function arToday() {
    const c = window.RK.cairoToday();
    if (EN) return new Date(Date.UTC(c.year, c.month, c.day, 12)).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    return AR_DAYS[c.dow] + '، ' + arDigits(c.day) + ' ' + AR_MONTHS[c.month] + ' ' + arDigits(c.year);
  }

  function renderCard() {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    // scene backdrop: a frozen, lively frame of today's template
    drawScene(ctx, templateOfTheDay(), W, H, 6.5, {
      line1: '', line2: '', name: '', namePrefix: '', font: 'Cairo, Tajawal, sans-serif', dir: 'rtl', photo: null,
    });
    // calm the scene into an ambient backdrop: even dim + stronger top/bottom
    ctx.fillStyle = 'rgba(4, 18, 14, 0.45)';
    ctx.fillRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(4, 18, 14, 0.66)');
    grad.addColorStop(0.18, 'rgba(4, 18, 14, 0.34)');
    grad.addColorStop(0.28, 'rgba(4, 18, 14, 0.10)');
    grad.addColorStop(0.75, 'rgba(4, 18, 14, 0.15)');
    grad.addColorStop(1, 'rgba(4, 18, 14, 0.62)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const gold = '#f6c860';
    const cream = '#fdf3d7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = EN ? 'ltr' : 'rtl';

    // header
    ctx.fillStyle = cream;
    ctx.globalAlpha = 0.92;
    ctx.font = `600 ${W * 0.036}px Tajawal, Cairo, sans-serif`;
    ctx.fillText(arToday(), W / 2, H * 0.085);
    ctx.globalAlpha = 1;

    // ornament divider
    ctx.strokeStyle = 'rgba(246, 200, 96, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.30, H * 0.13); ctx.lineTo(W * 0.44, H * 0.13);
    ctx.moveTo(W * 0.56, H * 0.13); ctx.lineTo(W * 0.70, H * 0.13);
    ctx.stroke();
    ctx.fillStyle = gold;
    ctx.font = `${W * 0.035}px Cairo, sans-serif`;
    ctx.fillText('✦', W / 2, H * 0.13);

    // glass panel holding the number: calm and consistent over any scene
    const px = W * 0.10, pw = W * 0.80, py = H * 0.24, ph = H * 0.44, pr = W * 0.045;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, pr);
    ctx.fillStyle = 'rgba(6, 26, 20, 0.80)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(246, 200, 96, 0.40)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.clip();
    const sheen = ctx.createLinearGradient(0, py, 0, py + ph);
    sheen.addColorStop(0, 'rgba(255, 226, 150, 0.08)');
    sheen.addColorStop(0.25, 'rgba(255, 226, 150, 0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();

    // the number: balanced, clearly readable on the panel
    const n = daysLeft();
    ctx.save();
    ctx.shadowColor = 'rgba(246, 200, 96, 0.5)';
    ctx.shadowBlur = W * 0.032;
    ctx.fillStyle = gold;
    ctx.font = `800 ${W * 0.24}px Cairo, sans-serif`;
    ctx.fillText(digits(n), W / 2, H * 0.415);
    ctx.restore();

    // label
    ctx.fillStyle = cream;
    ctx.font = `700 ${W * 0.064}px Cairo, sans-serif`;
    ctx.fillText(EN ? (n === 1 ? 'day until Ramadan' : 'days until Ramadan') : (n === 1 ? 'يوم واحد على رمضان' : 'يوم على رمضان'), W / 2, H * 0.565);

    // footer: branding + url
    ctx.fillStyle = 'rgba(253, 243, 215, 0.85)';
    ctx.font = `500 ${W * 0.030}px Tajawal, Cairo, sans-serif`;
    ctx.fillText(EN ? 'Ramadan 1448 AH' : 'رمضان ١٤٤٨ هـ', W / 2, H * 0.885);
    ctx.fillStyle = gold;
    ctx.font = `700 ${W * 0.032}px Cairo, sans-serif`;
    ctx.direction = 'ltr';
    ctx.fillText('ramadankarym.github.io', W / 2, H * 0.935);
    ctx.direction = EN ? 'ltr' : 'rtl';
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
          await navigator.share({ files: [file], title: EN ? 'Ramadan daily card' : 'بطاقة رمضان اليوم', text: (EN ? daysLeft() + ' days until Ramadan 🌙 ' : 'باقي ' + daysLeft() + ' يوم على رمضان 🌙 ') + 'https://ramadankarym.github.io/' });
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
