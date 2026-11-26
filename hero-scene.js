// Cinematic hero background: the countdown hero becomes a living scene —
// slow crossfades between engine scenes, gentle camera drift. Pauses with the
// page's existing motion toggle (html.motion-paused) and prefers-reduced-motion.
import { drawScene } from './scenes.js';

const canvas = document.getElementById('hero-scene');
if (canvas) {
    const ctx = canvas.getContext('2d');
    const hero = canvas.closest('.hero') || canvas.parentElement;
    const emptyText = { line1: '', line2: '', name: '', namePrefix: '', font: 'Cairo, Tajawal, sans-serif', dir: 'rtl', photo: null };
    const SCENES = ['night', 'crescent', 'dawn'];
    const PERIOD = 14;   // seconds per scene
    const FADE = 1.8;    // crossfade seconds
    let W = 0, H = 0;
    let acc = 0;
    let last = performance.now();

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        W = Math.max(2, Math.round(hero.clientWidth * dpr));
        H = Math.max(2, Math.round(hero.clientHeight * dpr));
        canvas.width = W;
        canvas.height = H;
    }

    function drawAt(tpl, t) {
        // gentle cinematic drift: slow zoom breathing + sideways pan
        const zoom = 1.07 + 0.04 * (0.5 + 0.5 * Math.sin(t * 0.10));
        const pan = Math.sin(t * 0.06) * W * 0.018;
        ctx.setTransform(zoom, 0, 0, zoom, (W - W * zoom) / 2 + pan, (H - H * zoom) / 2);
        drawScene(ctx, tpl, W, H, t, emptyText);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    function frame(now) {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (!document.documentElement.classList.contains('motion-paused')) acc += dt;
        const t = acc;
        const idx = Math.floor(t / PERIOD) % SCENES.length;
        const local = t - Math.floor(t / PERIOD) * PERIOD;
        drawAt(SCENES[idx], t);
        if (local > PERIOD - FADE) {
            ctx.save();
            ctx.globalAlpha = (local - (PERIOD - FADE)) / FADE;
            drawAt(SCENES[(idx + 1) % SCENES.length], t);
            ctx.restore();
        }
        // v3: green color grade so the whole hero stays in the green family
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'hue';
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#35e2a0';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);

    // v2: odometer digits on every time unit (slide-in for changed digits)
    function rebuild(el) {
        const txt = el.textContent;
        const prev = el.dataset.prev || '';
        el.dataset.prev = txt;
        el.innerHTML = [...txt].map((ch, i) =>
            `<span class="dv${prev.length === txt.length && prev[i] !== ch ? ' d-in' : ''}">${ch}</span>`
        ).join('');
    }
    document.querySelectorAll('.time-value').forEach((el) => {
        rebuild(el);
        // skip self-triggered mutations: rebuild only when app.js changed the text
        new MutationObserver(() => { if (el.textContent !== el.dataset.prev) rebuild(el); })
            .observe(el, { childList: true, characterData: true, subtree: true });
    });

    // v2: journey-to-Ramadan progress (Hijri-year span, same target as app.js)
    const fill = document.getElementById('journey-fill');
    const moon = document.getElementById('journey-moon');
    const pctEl = document.getElementById('journey-pct');
    if (fill && moon && pctEl) {
        const target = new Date('2027-02-07T17:34:00+02:00').getTime();
        const SPAN = 354 * 24 * 3600 * 1000;
        const arDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
        const tickJourney = () => {
            const rem = Math.max(0, target - Date.now());
            const pct = Math.min(99.4, Math.max(0, (1 - rem / SPAN) * 100));
            fill.style.width = pct + '%';
            moon.style.insetInlineStart = pct + '%';
            pctEl.textContent = arDigits(Math.floor(pct)) + '٪';
        };
        tickJourney();
        setInterval(tickJourney, 1000);
    }
}
