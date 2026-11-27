// Procedural Ramadan scene renderer. All drawing is deterministic in `t` (seconds)
// so the live preview and the recorded video show the same animation.
export const FORMATS = [
    { id: 'story', width: 1080, height: 1920 },
    { id: 'square', width: 1080, height: 1080 },
    { id: 'wide', width: 1920, height: 1080 },
];
// Deterministic PRNG so stars and particles are stable frame to frame.
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function makeStars(seed, count, maxY) {
    const rnd = mulberry32(seed);
    const stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({ x: rnd(), y: rnd() * maxY, r: 0.6 + rnd() * 1.9, phase: rnd() * Math.PI * 2, speed: 0.6 + rnd() * 1.6 });
    }
    return stars;
}
function drawStars(ctx, W, H, t, stars) {
    ctx.save();
    for (const s of stars) {
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.globalAlpha = tw;
        ctx.fillStyle = '#fff7e0';
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r * (W / 1080), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
function drawCrescent(ctx, cx, cy, R, glow) {
    ctx.save();
    // soft halo
    const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.4 * glow);
    halo.addColorStop(0, 'rgba(255, 205, 105, 0.28)');
    halo.addColorStop(0.5, 'rgba(255, 190, 90, 0.09)');
    halo.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 2.4 * glow, 0, Math.PI * 2);
    ctx.fill();
    // crescent sliver: outer disc minus offset bite disc, drawn as one path
    const bx = cx + R * 0.42, by = cy - R * 0.18, rb = R * 0.86;
    const d = Math.hypot(bx - cx, by - cy);
    const theta = Math.atan2(by - cy, bx - cx);
    const alpha = Math.acos(Math.min(1, (R * R + d * d - rb * rb) / (2 * R * d)));
    const a1 = theta + alpha, a2 = theta - alpha;
    const b1 = Math.atan2(cy + R * Math.sin(a2) - by, cx + R * Math.cos(a2) - bx);
    const b2 = Math.atan2(cy + R * Math.sin(a1) - by, cx + R * Math.cos(a1) - bx);
    const body = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    body.addColorStop(0, '#ffe9ad');
    body.addColorStop(0.55, '#f6c860');
    body.addColorStop(1, '#d99a2b');
    ctx.fillStyle = body;
    ctx.shadowColor = 'rgba(255, 200, 100, 0.5)';
    ctx.shadowBlur = R * 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, R, a1, a2 + Math.PI * 2, false);
    ctx.arc(bx, by, rb, b1, b2, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}
// A stylized fanous (Ramadan lantern), swaying around its hanging point.
function drawLantern(ctx, x, yTop, len, s, sway, glowPulse) {
    ctx.save();
    ctx.translate(x, yTop);
    ctx.rotate(sway);
    // hanging string
    ctx.strokeStyle = 'rgba(230, 200, 140, 0.55)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, len);
    ctx.stroke();
    ctx.translate(0, len);
    const w = 90 * s; // body half-width
    const h = 150 * s; // body height
    const capH = 34 * s;
    // warm halo behind the lantern
    const halo = ctx.createRadialGradient(0, h * 0.55, 4, 0, h * 0.55, w * 3.2);
    halo.addColorStop(0, `rgba(255, 176, 66, ${0.34 * glowPulse})`);
    halo.addColorStop(1, 'rgba(255, 176, 66, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, h * 0.55, w * 3.2, 0, Math.PI * 2);
    ctx.fill();
    // top cap (little dome + ring)
    ctx.fillStyle = '#8a5a1d';
    ctx.beginPath();
    ctx.arc(0, 0, 7 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-w * 0.62, capH);
    ctx.quadraticCurveTo(0, -capH * 1.3, w * 0.62, capH);
    ctx.closePath();
    ctx.fillStyle = '#a86e24';
    ctx.fill();
    // glass body: glowing trapezoid
    const glass = ctx.createLinearGradient(0, capH, 0, capH + h);
    glass.addColorStop(0, `rgba(255, 214, 120, ${0.92 * glowPulse})`);
    glass.addColorStop(0.5, `rgba(255, 166, 54, ${0.95 * glowPulse})`);
    glass.addColorStop(1, `rgba(214, 108, 24, ${0.92 * glowPulse})`);
    ctx.beginPath();
    ctx.moveTo(-w * 0.62, capH);
    ctx.lineTo(w * 0.62, capH);
    ctx.lineTo(w, capH + h);
    ctx.lineTo(-w, capH + h);
    ctx.closePath();
    ctx.fillStyle = glass;
    ctx.fill();
    // ribs
    ctx.strokeStyle = 'rgba(96, 48, 8, 0.55)';
    ctx.lineWidth = 3 * s;
    for (const fx of [-0.62, -0.2, 0.2, 0.62]) {
        ctx.beginPath();
        ctx.moveTo(w * fx, capH);
        ctx.lineTo(w * fx * 1.6, capH + h);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-w * 0.62, capH);
    ctx.lineTo(w * 0.62, capH);
    ctx.moveTo(-w, capH + h);
    ctx.lineTo(w, capH + h);
    ctx.stroke();
    // bottom ring + finial
    ctx.fillStyle = '#8a5a1d';
    ctx.beginPath();
    ctx.moveTo(-w, capH + h);
    ctx.lineTo(w, capH + h);
    ctx.lineTo(w * 0.45, capH + h + 26 * s);
    ctx.lineTo(-w * 0.45, capH + h + 26 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, capH + h + 38 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
function drawMosque(ctx, W, H, baseY, color) {
    ctx.save();
    ctx.fillStyle = color;
    const u = W / 1080; // unit
    ctx.beginPath();
    ctx.rect(0, baseY, W, H - baseY);
    // main building
    ctx.rect(W * 0.30, baseY - 150 * u, W * 0.40, 150 * u);
    // main dome
    ctx.moveTo(W * 0.32, baseY - 150 * u);
    ctx.quadraticCurveTo(W * 0.5, baseY - 430 * u, W * 0.68, baseY - 150 * u);
    // dome finial
    ctx.rect(W * 0.5 - 4 * u, baseY - 320 * u, 8 * u, 30 * u);
    // side domes
    ctx.moveTo(W * 0.20, baseY - 100 * u);
    ctx.quadraticCurveTo(W * 0.27, baseY - 240 * u, W * 0.34, baseY - 100 * u);
    ctx.moveTo(W * 0.66, baseY - 100 * u);
    ctx.quadraticCurveTo(W * 0.73, baseY - 240 * u, W * 0.80, baseY - 100 * u);
    ctx.rect(W * 0.18, baseY - 100 * u, W * 0.18, 100 * u);
    ctx.rect(W * 0.64, baseY - 100 * u, W * 0.18, 100 * u);
    // minarets
    for (const mx of [W * 0.08, W * 0.88]) {
        ctx.rect(mx, baseY - 420 * u, 34 * u, 420 * u);
        ctx.rect(mx - 8 * u, baseY - 300 * u, 50 * u, 14 * u); // balcony
        ctx.moveTo(mx - 4 * u, baseY - 420 * u);
        ctx.quadraticCurveTo(mx + 17 * u, baseY - 520 * u, mx + 38 * u, baseY - 420 * u);
    }
    ctx.fill();
    // gold tip on the main dome finial
    ctx.fillStyle = 'rgba(255, 214, 130, 0.95)';
    ctx.beginPath();
    ctx.arc(W * 0.5, baseY - 327 * u, 8 * u, 0, Math.PI * 2);
    ctx.fill();
    // lit windows
    ctx.fillStyle = 'rgba(255, 190, 90, 0.85)';
    for (let i = 0; i < 5; i++) {
        const wx = W * 0.36 + i * W * 0.07;
        ctx.beginPath();
        ctx.moveTo(wx, baseY - 40 * u);
        ctx.lineTo(wx, baseY - 90 * u);
        ctx.quadraticCurveTo(wx + 14 * u, baseY - 118 * u, wx + 28 * u, baseY - 90 * u);
        ctx.lineTo(wx + 28 * u, baseY - 40 * u);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}
function makeParticles(seed, count) {
    const rnd = mulberry32(seed);
    const ps = [];
    for (let i = 0; i < count; i++) {
        ps.push({ x: rnd(), y0: rnd(), r: 1.5 + rnd() * 5, speed: 0.02 + rnd() * 0.05, phase: rnd() * Math.PI * 2, drift: 10 + rnd() * 30 });
    }
    return ps;
}
function drawParticles(ctx, W, H, t, ps, color) {
    ctx.save();
    for (const p of ps) {
        const yFrac = ((p.y0 - t * p.speed) % 1 + 1) % 1;
        const x = p.x * W + Math.sin(t * 0.7 + p.phase) * p.drift * (W / 1080);
        const fade = Math.sin(yFrac * Math.PI); // fade in/out over the journey
        ctx.globalAlpha = 0.55 * fade;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, yFrac * H, p.r * (W / 1080), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
// n-point star path (alternating outer/inner radius).
function starPath(ctx, cx, cy, rOut, rIn, n, rot) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
        const r = i % 2 === 0 ? rOut : rIn;
        const a = rot + (i * Math.PI) / n - Math.PI / 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
}
// Pointed mihrab-style arch path.
function archPath(ctx, cx, baseY, w, h) {
    const topY = baseY - h;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, baseY);
    ctx.lineTo(cx - w / 2, topY + h * 0.45);
    ctx.quadraticCurveTo(cx - w / 2, topY + h * 0.06, cx, topY);
    ctx.quadraticCurveTo(cx + w / 2, topY + h * 0.06, cx + w / 2, topY + h * 0.45);
    ctx.lineTo(cx + w / 2, baseY);
    ctx.closePath();
}
// Slow-breathing lattice of gold 8-point stars.
function drawGeoLattice(ctx, W, H, t, alpha) {
    const u = Math.min(W, H) / 1080;
    const step = 150 * u;
    const pulse = 0.9 + 0.1 * Math.sin(t * 0.5);
    ctx.save();
    ctx.strokeStyle = `rgba(214, 178, 94, ${alpha})`;
    ctx.lineWidth = 1.3 * u;
    for (let y = step / 2; y < H + step; y += step) {
        for (let x = step / 2; x < W + step; x += step) {
            starPath(ctx, x, y, step * 0.44 * pulse, step * 0.18 * pulse, 8, Math.PI / 8);
            ctx.stroke();
        }
    }
    ctx.restore();
}
// Animated steam wisps above a cup.
function drawSteam(ctx, x, y, s, t, phase) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 240, 210, 0.4)';
    ctx.lineWidth = 3 * s;
    ctx.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
        const ph = phase + k * 1.7;
        ctx.beginPath();
        for (let i = 0; i <= 12; i++) {
            const f = i / 12;
            const yy = y - f * 62 * s;
            const xx = x + (k - 0.5) * 9 * s + Math.sin(t * 1.5 + ph + f * 4) * 9 * s * f;
            if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
        }
        ctx.globalAlpha = 0.4 + 0.25 * Math.sin(t * 1.2 + ph);
        ctx.stroke();
    }
    ctx.restore();
}
// Bowl of dates.
function drawDatesBowl(ctx, cx, cy, s) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#5a3a16';
    ctx.beginPath();
    ctx.moveTo(-70 * s, 0);
    ctx.quadraticCurveTo(0, 58 * s, 70 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7a5020';
    ctx.beginPath();
    ctx.ellipse(0, 0, 70 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a1f0c';
    const rnd = mulberry32(99);
    for (let i = 0; i < 9; i++) {
        const dx = (rnd() - 0.5) * 100 * s;
        const dy = -4 * s - rnd() * 12 * s;
        ctx.beginPath();
        ctx.ellipse(dx, dy, 14 * s, 8 * s, rnd() * 0.8 - 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 190, 110, 0.25)';
    ctx.beginPath();
    ctx.ellipse(-20 * s, -10 * s, 8 * s, 4 * s, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
// Small glowing drink cup with steam.
function drawCup(ctx, x, y, s, t, phase) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#6e451a';
    ctx.beginPath();
    ctx.moveTo(-22 * s, -30 * s);
    ctx.lineTo(22 * s, -30 * s);
    ctx.lineTo(16 * s, 0);
    ctx.lineTo(-16 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 190, 90, 0.5)';
    ctx.fillRect(-19 * s, -22 * s, 38 * s, 8 * s);
    drawSteam(ctx, 0, -34 * s, s, t, phase);
    ctx.restore();
}
// Tall minaret silhouette with balconies and spire.
function drawMinaretSil(ctx, x, baseY, h, w, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(x - w / 2, baseY - h, w, h);
    ctx.rect(x - w * 0.85, baseY - h * 0.62, w * 1.7, h * 0.035);
    ctx.rect(x - w * 0.8, baseY - h * 0.38, w * 1.6, h * 0.03);
    ctx.rect(x - w * 0.7, baseY - h * 1.08, w * 1.4, h * 0.09);
    ctx.moveTo(x - w * 0.7, baseY - h * 1.08);
    ctx.quadraticCurveTo(x, baseY - h * 1.16, x + w * 0.7, baseY - h * 1.08);
    ctx.rect(x - w * 0.05, baseY - h * 1.20, w * 0.10, h * 0.05);
    ctx.fill();
    // gold tip on the finial
    ctx.fillStyle = 'rgba(255, 214, 130, 0.95)';
    ctx.beginPath();
    ctx.arc(x, baseY - h * 1.205, w * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
// Per-template static state (stars, particles) so we don't reseed per frame.
const CACHE = {};
function stateFor(key, seed) {
    if (!CACHE[key]) {
        CACHE[key] = { stars: makeStars(seed, 90, 0.75), particles: makeParticles(seed + 7, 42) };
    }
    return CACHE[key];
}
function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
function fitFontSize(ctx, txt, weight, family, maxWidth, maxSize, minSize) {
    // Largest font size at which `txt` fits `maxWidth`, never below `minSize`.
    let hi = Math.max(maxSize, minSize);
    ctx.font = `${weight} ${hi}px ${family}`;
    if (ctx.measureText(txt).width <= maxWidth) return hi;
    let lo = minSize;
    for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        ctx.font = `${weight} ${mid}px ${family}`;
        if (ctx.measureText(txt).width <= maxWidth) lo = mid; else hi = mid;
    }
    return Math.max(minSize, lo);
}

// Lay a line out on one row, or break it on the best word boundary into two
// balanced rows when that buys a meaningfully larger type size.
function layoutLine(ctx, txt, weight, family, maxW, cap, floor, comfort) {
    const single = fitFontSize(ctx, txt, weight, family, maxW, cap, floor);
    // the floor keeps type readable, but it must never push a line past the margins
    ctx.font = `${weight} ${single}px ${family}`;
    const overflows = ctx.measureText(txt).width > maxW + 0.5;
    // only break a line that is genuinely too small on this canvas, or does not fit
    const shouldWrap = overflows || single < comfort;
    const words = txt.split(/\s+/).filter(Boolean);
    if (words.length < 2) return { rows: [txt], size: overflows ? fitFontSize(ctx, txt, weight, family, maxW, cap, 1) : single };
    let best = null;
    for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(' ');
        const b = words.slice(i).join(' ');
        const sa = fitFontSize(ctx, a, weight, family, maxW, cap, 1);
        const sb = fitFontSize(ctx, b, weight, family, maxW, cap, 1);
        const size = Math.min(sa, sb);
        if (!best || size > best.size) best = { rows: [a, b], size };
    }
    if (overflows && best) return best;
    if (shouldWrap && best && best.size > single * 1.14) return best;
    return { rows: [txt], size: single };
}

// One shared type system for every template:
//   line 1  900 weight, fills the safe width (or breaks to two balanced rows)
//   line 2  700 weight, up to 0.82x line 1 so it always reads at phone size
//   name    500 weight, up to 0.40x line 1
function drawTextBlock(ctx, W, H, cy, t, text, accent, zoneIn, zoneAlt) {
    // square and wide canvases scale the art by height, so some templates need a different free zone
    const zone = (zoneAlt && W / H > 0.9) ? zoneAlt : zoneIn;
    const u = W / 1080;
    const appear = easeOutCubic(Math.min(1, t / 1.4));
    const breathe = 1 + 0.012 * Math.sin(t * 1.1);
    const family = text.font;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = text.dir;

    const margin = Math.max(42 * u, W * 0.065);
    const maxW = W - margin * 2;
    const cap1 = Math.min(H * 0.105, 156 * u);
    const floor1 = Math.max(26 * u, W * 0.03);
    const clean = (v) => (v || '').trim();
    const opener = clean(text.opener);
    const line1 = clean(text.line1);
    const line2 = clean(text.line2);
    const closing = clean(text.closing);
    const nameLine = `${text.namePrefix}${text.name}`.trim();
    const extra = !!(opener || closing);
    const comfort = Math.min(W, H) * 0.085;

    // Five-level hierarchy, every level its own size:
    //   title 1.00 > description <=.82/.70 > closing wish <=.54 > opener <=.46 > signature <=.38
    const main = line1 ? layoutLine(ctx, line1, 900, family, maxW, cap1, floor1, comfort)
        : { rows: [], size: cap1 * 0.8 };
    let size1 = main.size;
    const items = [];
    const add = (key, txt, weight, cap, min, cmf, gap) => {
        if (!txt) return;
        const L = layoutLine(ctx, txt, weight, family, maxW, cap, min, cmf);
        items.push({ key, rows: L.rows, size: L.size, gap });
    };
    if (opener) add('opener', opener, 600, size1 * 0.46, size1 * 0.30, comfort * 0.6, 1.30);
    if (line1) items.push({ key: 'line1', rows: main.rows, size: size1, gap: 1.35 });
    if (line2) add('line2', line2, 700, size1 * (extra ? 0.70 : 0.82), size1 * 0.46, comfort * 0.8, 1.42);
    if (closing) add('closing', closing, 600, size1 * 0.54, size1 * 0.34, comfort * 0.65, 1.5);
    if (nameLine) {
        const L = layoutLine(ctx, nameLine, 500, family, maxW, size1 * 0.38, 1, comfort * 0.5);
        items.push({ key: 'name', rows: L.rows, size: L.size, gap: 1.55 });
    }
    // keep levels strictly ordered even when a long line had to shrink
    const by = (k) => items.find((i) => i.key === k);
    const ord = ['line1', 'line2', 'closing', 'opener', 'name'].map(by).filter(Boolean);
    for (let i = 1; i < ord.length; i++) {
        const lim = ord[i - 1].size * 0.80;
        if (ord[i].size > lim) ord[i].size = lim;
    }
    if (by('opener') && by('name') && by('name').size > by('opener').size * 0.9) by('name').size = by('opener').size * 0.9;

    if (!items.length) { ctx.restore(); return; }
    const pitchOf = (it) => it.size * 1.30;
    const blockExtent = () => {
        let y = 0; const centers = []; let prev = null;
        items.forEach((it) => {
            if (prev) y += (prev.size + it.size) / 2 * it.gap - (prev.rows.length - 1) * 0 ;
            // distance from previous item's last row to this item's first row
            centers.push(y);
            y += (it.rows.length - 1) * pitchOf(it);
            prev = it;
        });
        const first = items[0], last = items[items.length - 1];
        return { centers, top: -first.size / 2, bottom: y + last.size / 2 };
    };
    // keep the whole block inside the canvas height (matters on 16:9 and with all 5 fields)
    let ext = blockExtent();
    // each template passes the art-free zone it wants the text to live in
    const zoneH = zone ? (zone[1] - zone[0]) * H : H * 0.80;
    const maxBlock = Math.min(H * 0.80, zoneH);
    let crowded = false;
    if (ext.bottom - ext.top > maxBlock) {
        // never shrink below 52% so the type stays readable; any overflow past the zone gets a stronger band
        const f = Math.max(0.52, maxBlock / (ext.bottom - ext.top));
        crowded = f > maxBlock / (ext.bottom - ext.top) + 1e-6;
        items.forEach((it) => { it.size *= f; });
        ext = blockExtent();
    }
    const spanTop = ext.top, spanBottom = ext.bottom;
    let shift = cy - (spanTop + spanBottom) / 2;
    const edge = H * 0.04;
    if (spanTop + shift < edge) shift = edge - spanTop;
    if (spanBottom + shift > H - edge) shift = H - edge - spanBottom;
    const blockH = spanBottom - spanTop;
    const top = spanTop + shift;
    const rise = (1 - appear) * 60 * u;
    const size1f = (by('line1') || items[0]).size;

    // soft full-width band behind the type so it keeps contrast on busy artwork
    const bandCy = (top + spanBottom + shift) / 2;
    const bandH = Math.max(blockH * 1.5, size1f * 2.4);
    const band = ctx.createLinearGradient(0, bandCy - bandH / 2, 0, bandCy + bandH / 2);
    band.addColorStop(0, 'rgba(3, 10, 8, 0)');
    band.addColorStop(0.5, crowded ? 'rgba(3, 10, 8, 0.62)' : 'rgba(3, 10, 8, 0.34)');
    band.addColorStop(1, 'rgba(3, 10, 8, 0)');
    ctx.globalAlpha = appear;
    ctx.fillStyle = band;
    ctx.fillRect(0, bandCy - bandH / 2, W, bandH);

    // optional personal photo above the block
    if (text.photo && text.photo.width) {
        const appearP = easeOutCubic(Math.max(0, Math.min(1, (t - 0.15) / 1.2)));
        const r = size1f * 0.5;
        const py = top - r - size1f * 0.28;
        ctx.globalAlpha = appearP;
        ctx.shadowColor = 'rgba(255, 190, 90, 0.45)';
        ctx.shadowBlur = 24 * u;
        ctx.beginPath(); ctx.arc(W / 2, py, r + 5 * u, 0, Math.PI * 2);
        ctx.fillStyle = accent; ctx.fill();
        ctx.shadowBlur = 0;
        ctx.save();
        ctx.beginPath(); ctx.arc(W / 2, py, r, 0, Math.PI * 2); ctx.clip();
        const img = text.photo;
        const ir = Math.max((r * 2) / img.width, (r * 2) / img.height);
        const dw = img.width * ir, dh = img.height * ir;
        ctx.drawImage(img, W / 2 - dw / 2, py - dh / 2, dw, dh);
        ctx.restore();
    }

    const style = {
        opener:  { w: 600, delay: 0.10, rise: 0.8, fill: 'rgba(255, 226, 160, 0.92)', sh: 'rgba(255, 190, 90, 0.35)', blur: 18 },
        line1:   { w: 900, delay: 0.00, rise: 1.0, fill: accent, sh: 'rgba(255, 190, 90, 0.55)', blur: 34 },
        line2:   { w: 700, delay: 0.45, rise: 0.6, fill: 'rgba(255, 246, 224, 0.96)', sh: 'rgba(0, 0, 0, 0.45)', blur: 14 },
        closing: { w: 600, delay: 0.70, rise: 0.5, fill: 'rgba(255, 212, 135, 0.97)', sh: 'rgba(0, 0, 0, 0.45)', blur: 12 },
        name:    { w: 500, delay: 0.95, rise: 0.4, fill: 'rgba(255, 246, 224, 0.84)', sh: 'rgba(0, 0, 0, 0.4)', blur: 12 },
    };
    items.forEach((it, idx) => {
        const st = style[it.key];
        const ap = easeOutCubic(Math.max(0, Math.min(1, (t - st.delay) / 1.4)));
        ctx.globalAlpha = it.key === 'line1' ? appear : ap;
        const size = it.key === 'line1' ? it.size * breathe : it.size;
        ctx.font = `${st.w} ${size}px ${family}`;
        ctx.shadowColor = st.sh;
        ctx.shadowBlur = st.blur * u;
        ctx.fillStyle = st.fill;
        it.rows.forEach((row, i) => {
            ctx.fillText(row, W / 2, ext.centers[idx] + i * pitchOf(it) + shift + rise * st.rise);
        });
    });
    ctx.restore();
}
// ---------------------------------------------------------------------------
// New Egyptian-Islamic template set (Nov 2026). Keys are unchanged so tool.js
// state and links keep working; names were updated in tool.js STR.templates.
// ---------------------------------------------------------------------------

// Dark radial scrim so text stays readable over busy art.
function drawScrim(ctx, W, cy, r) {
    const g = ctx.createRadialGradient(W / 2, cy, r * 0.1, W / 2, cy, r);
    g.addColorStop(0, 'rgba(2, 8, 10, 0.52)');
    g.addColorStop(0.7, 'rgba(2, 8, 10, 0.30)');
    g.addColorStop(1, 'rgba(2, 8, 10, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(W / 2, cy, r, 0, Math.PI * 2);
    ctx.fill();
}
// Classic Egyptian fanous: crowned hexagonal glass body, pierced caps, finial.
function drawFanousEgy(ctx, x, yTop, len, s, sway, glowPulse, t) {
    ctx.save();
    ctx.translate(x, yTop);
    ctx.rotate(sway);
    ctx.strokeStyle = 'rgba(230, 200, 140, 0.55)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len); ctx.stroke();
    ctx.translate(0, len);
    const w = 74 * s;       // body half-width
    const glassH = 130 * s; // glass height
    const crownH = 46 * s;
    // halo
    const halo = ctx.createRadialGradient(0, crownH + glassH * 0.5, 4, 0, crownH + glassH * 0.5, w * 3.4);
    halo.addColorStop(0, `rgba(255, 176, 66, ${0.36 * glowPulse})`);
    halo.addColorStop(1, 'rgba(255, 176, 66, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, crownH + glassH * 0.5, w * 3.4, 0, Math.PI * 2); ctx.fill();
    // ring + crown (conical cap) + tiny crescent finial
    ctx.fillStyle = '#7c4f16';
    ctx.beginPath(); ctx.arc(0, 0, 6 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-w * 0.92, crownH);
    ctx.lineTo(0, -crownH * 0.35);
    ctx.lineTo(w * 0.92, crownH);
    ctx.closePath();
    ctx.fillStyle = '#a86e24'; ctx.fill();
    // crescent finial on the crown
    ctx.save();
    ctx.translate(0, -crownH * 0.62);
    ctx.fillStyle = '#f6c860';
    ctx.beginPath(); ctx.arc(0, 0, 9 * s, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(3.6 * s, -2 * s, 7.6 * s, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // neck band with pierced holes
    ctx.fillStyle = '#8a5a1d';
    ctx.fillRect(-w * 0.92, crownH - 6 * s, w * 1.84, 12 * s);
    ctx.fillStyle = 'rgba(20, 10, 4, 0.8)';
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(i * w * 0.24, crownH, 2.6 * s, 0, Math.PI * 2); ctx.fill(); }
    // glass body: hexagonal (two trapezoids)
    const gy = crownH + 6 * s;
    const glass = ctx.createLinearGradient(0, gy, 0, gy + glassH);
    glass.addColorStop(0, `rgba(255, 216, 128, ${0.94 * glowPulse})`);
    glass.addColorStop(0.5, `rgba(255, 166, 54, ${0.96 * glowPulse})`);
    glass.addColorStop(1, `rgba(206, 100, 22, ${0.94 * glowPulse})`);
    ctx.beginPath();
    ctx.moveTo(-w * 0.62, gy);
    ctx.lineTo(w * 0.62, gy);
    ctx.lineTo(w, gy + glassH * 0.5);
    ctx.lineTo(w * 0.62, gy + glassH);
    ctx.lineTo(-w * 0.62, gy + glassH);
    ctx.lineTo(-w, gy + glassH * 0.5);
    ctx.closePath();
    ctx.fillStyle = glass; ctx.fill();
    // glass ribs
    ctx.strokeStyle = 'rgba(96, 48, 8, 0.6)';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(-w * 0.62, gy); ctx.lineTo(-w, gy + glassH * 0.5); ctx.lineTo(-w * 0.62, gy + glassH);
    ctx.moveTo(w * 0.62, gy); ctx.lineTo(w, gy + glassH * 0.5); ctx.lineTo(w * 0.62, gy + glassH);
    ctx.moveTo(0, gy); ctx.lineTo(0, gy + glassH);
    ctx.stroke();
    // base cap + finial
    ctx.fillStyle = '#8a5a1d';
    ctx.beginPath();
    ctx.moveTo(-w * 0.62, gy + glassH);
    ctx.lineTo(w * 0.62, gy + glassH);
    ctx.lineTo(w * 0.30, gy + glassH + 30 * s);
    ctx.lineTo(-w * 0.30, gy + glassH + 30 * s);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(0, gy + glassH + 42 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}
// Ottoman pencil minaret (Citadel style).
function drawPencilMinaret(ctx, x, baseY, h, w, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(x - w / 2, baseY - h, w, h);
    // two balcony rings
    ctx.rect(x - w * 0.95, baseY - h * 0.66, w * 1.9, h * 0.035);
    ctx.rect(x - w * 0.85, baseY - h * 0.44, w * 1.7, h * 0.032);
    // conical cap
    ctx.moveTo(x - w * 0.55, baseY - h);
    ctx.lineTo(x, baseY - h * 1.22);
    ctx.lineTo(x + w * 0.55, baseY - h);
    ctx.fill();
    ctx.restore();
}
// Muhammad Ali (Citadel) mosque silhouette: grand dome, semi-domes, pencil minarets.
function drawCitadel(ctx, W, H, baseY, color) {
    const u = W / 1080;
    ctx.save();
    ctx.fillStyle = color;
    const cx = W / 2;
    // prayer-hall block
    ctx.beginPath();
    ctx.rect(cx - W * 0.24, baseY - 120 * u, W * 0.48, 120 * u);
    // cascade of small domes along the roofline
    for (const dx of [-0.20, -0.12, 0.12, 0.20]) {
        ctx.moveTo(cx + dx * W - 34 * u, baseY - 120 * u);
        ctx.quadraticCurveTo(cx + dx * W, baseY - 190 * u, cx + dx * W + 34 * u, baseY - 120 * u);
    }
    // semi-domes flanking the grand dome
    for (const dx of [-0.115, 0.115]) {
        ctx.moveTo(cx + dx * W - 52 * u, baseY - 120 * u);
        ctx.quadraticCurveTo(cx + dx * W, baseY - 300 * u, cx + dx * W + 52 * u, baseY - 120 * u);
    }
    // grand dome (slightly pointed Ottoman profile) + finial
    ctx.moveTo(cx - 92 * u, baseY - 120 * u);
    ctx.quadraticCurveTo(cx - 88 * u, baseY - 330 * u, cx, baseY - 380 * u);
    ctx.quadraticCurveTo(cx + 88 * u, baseY - 330 * u, cx + 92 * u, baseY - 120 * u);
    ctx.rect(cx - 4 * u, baseY - 415 * u, 8 * u, 40 * u);
    ctx.fill();
    // pencil minarets
    drawPencilMinaret(ctx, cx - W * 0.315, baseY, 430 * u, 26 * u, color);
    drawPencilMinaret(ctx, cx + W * 0.315, baseY, 430 * u, 26 * u, color);
    // gold finial tips
    ctx.fillStyle = 'rgba(255, 224, 150, 0.95)';
    ctx.beginPath(); ctx.arc(cx, baseY - 418 * u, 7 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - W * 0.315, baseY - 432 * u, 5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + W * 0.315, baseY - 432 * u, 5 * u, 0, Math.PI * 2); ctx.fill();
    // lit windows row
    ctx.fillStyle = 'rgba(255, 190, 90, 0.85)';
    for (let i = -3; i <= 3; i++) {
        const wx = cx + i * 54 * u;
        ctx.beginPath();
        ctx.moveTo(wx - 10 * u, baseY - 34 * u);
        ctx.lineTo(wx - 10 * u, baseY - 66 * u);
        ctx.quadraticCurveTo(wx, baseY - 88 * u, wx + 10 * u, baseY - 66 * u);
        ctx.lineTo(wx + 10 * u, baseY - 34 * u);
        ctx.closePath(); ctx.fill();
    }
    ctx.restore();
}
// Old Cairo house block with a mashrabiya bay and lit windows.
function drawHouse(ctx, x, baseY, w, h, color, litSeed, t) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(x, baseY - h, w, h);
    // cornice
    ctx.fillRect(x - w * 0.04, baseY - h, w * 1.08, h * 0.05);
    // mashrabiya bay window (protruding lattice box)
    const bw = w * 0.42, bh = h * 0.30;
    const bx = x + w * 0.30, by = baseY - h * 0.62;
    ctx.fillRect(bx - bw * 0.08, by, bw * 1.16, bh);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(bx + (bw / 4) * i, by + 3); ctx.lineTo(bx + (bw / 4) * i, by + bh - 3); ctx.stroke();
    }
    for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(bx, by + (bh / 3) * i); ctx.lineTo(bx + bw, by + (bh / 3) * i); ctx.stroke();
    }
    // lit windows, some gently flickering
    const rnd = mulberry32(litSeed);
    for (let i = 0; i < 3; i++) {
        const wx = x + w * (0.14 + rnd() * 0.7), wy = baseY - h * (0.12 + rnd() * 0.35);
        const ww = w * 0.10, wh = h * 0.09;
        const on = rnd() > 0.25;
        const flick = on ? (0.65 + 0.35 * Math.sin(t * (1 + rnd() * 2) + rnd() * 6)) : 0.14;
        ctx.fillStyle = `rgba(255, 186, 92, ${flick})`;
        ctx.fillRect(wx, wy, ww, wh);
    }
    ctx.restore();
}
// Mesaharaty silhouette: galabeya figure with drum, stick arm and hand lantern.
function drawMesaharaty(ctx, x, baseY, s, t, color) {
    ctx.save();
    ctx.translate(x, baseY);
    const bob = Math.sin(t * 6) * 3 * s;
    ctx.translate(0, bob);
    ctx.fillStyle = color;
    // legs (alternating stride)
    const step = Math.sin(t * 6);
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4 * s, -52 * s); ctx.lineTo(-4 * s + step * 12 * s, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5 * s, -52 * s); ctx.lineTo(5 * s - step * 12 * s, 0); ctx.stroke();
    ctx.restore();
    // galabeya body
    ctx.beginPath();
    ctx.moveTo(-16 * s, -52 * s);
    ctx.quadraticCurveTo(-20 * s, -110 * s, -10 * s, -128 * s);
    ctx.lineTo(10 * s, -128 * s);
    ctx.quadraticCurveTo(20 * s, -110 * s, 16 * s, -52 * s);
    ctx.closePath(); ctx.fill();
    // head + taqiyah cap
    ctx.beginPath(); ctx.arc(0, -142 * s, 11 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -147 * s, 10 * s, Math.PI, Math.PI * 2); ctx.fill();
    // drum at the waist front
    ctx.beginPath(); ctx.ellipse(16 * s, -86 * s, 12 * s, 15 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(230, 200, 140, 0.25)'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.ellipse(16 * s, -86 * s, 12 * s, 15 * s, 0, 0, Math.PI * 2); ctx.stroke();
    // stick arm (striking)
    const strike = Math.sin(t * 6) * 0.5;
    ctx.save();
    ctx.translate(8 * s, -116 * s);
    ctx.rotate(-0.9 + strike);
    ctx.strokeStyle = color; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(26 * s, 22 * s); ctx.stroke();
    ctx.restore();
    // lantern arm (left, hanging low) + little glow
    ctx.save();
    ctx.translate(-8 * s, -116 * s);
    const sw = 0.18 * Math.sin(t * 2.4);
    ctx.rotate(0.5 + sw);
    ctx.strokeStyle = color; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-20 * s, 30 * s); ctx.stroke();
    ctx.translate(-20 * s, 30 * s);
    const glow = 0.75 + 0.25 * Math.sin(t * 2.1);
    const hg = ctx.createRadialGradient(0, 14 * s, 1, 0, 14 * s, 34 * s);
    hg.addColorStop(0, `rgba(255, 186, 92, ${0.5 * glow})`);
    hg.addColorStop(1, 'rgba(255, 186, 92, 0)');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.arc(0, 14 * s, 34 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(-6 * s, 0, 12 * s, 22 * s);
    ctx.fillStyle = `rgba(255, 200, 110, ${0.9 * glow})`;
    ctx.fillRect(-3.5 * s, 4 * s, 7 * s, 12 * s);
    ctx.restore();
    ctx.restore();
}
// Felucca with a lateen sail.
function drawFelucca(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    // hull
    ctx.beginPath();
    ctx.moveTo(-46 * s, 0);
    ctx.quadraticCurveTo(0, 18 * s, 50 * s, -2 * s);
    ctx.lineTo(42 * s, 8 * s);
    ctx.quadraticCurveTo(0, 24 * s, -40 * s, 8 * s);
    ctx.closePath(); ctx.fill();
    // mast + lateen yard + triangular sail
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -58 * s); ctx.closePath();
    ctx.strokeStyle = color; ctx.lineWidth = 3 * s; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-30 * s, -8 * s);
    ctx.lineTo(30 * s, -62 * s);
    ctx.lineTo(-2 * s, -6 * s);
    ctx.closePath();
    ctx.fillStyle = 'rgba(238, 224, 190, 0.85)';
    ctx.fill();
    ctx.restore();
}
// Nile water: dark band with animated gold shimmer under the moon.
function drawWater(ctx, W, topY, H, t, moonX) {
    ctx.save();
    const g = ctx.createLinearGradient(0, topY, 0, H);
    g.addColorStop(0, '#0a1830');
    g.addColorStop(1, '#040a18');
    ctx.fillStyle = g;
    ctx.fillRect(0, topY, W, H - topY);
    const rnd = mulberry32(77);
    for (let i = 0; i < 60; i++) {
        const fy = rnd();
        const y = topY + fy * (H - topY);
        const spread = 40 + fy * 190;
        const x = moonX + (rnd() - 0.5) * spread * 2;
        const len = (8 + rnd() * 46) * (0.4 + fy);
        const a = (0.05 + 0.30 * (1 - fy)) * (0.5 + 0.5 * Math.sin(t * (1.2 + rnd() * 2) + rnd() * 6.28));
        ctx.strokeStyle = `rgba(255, 205, 110, ${a})`;
        ctx.lineWidth = 1.5 + fy * 2.5;
        ctx.beginPath(); ctx.moveTo(x - len / 2, y); ctx.lineTo(x + len / 2, y); ctx.stroke();
    }
    ctx.restore();
}
// Khayamiya (Egyptian tentmaker) applique pattern, slowly breathing.
function drawKhayamiya(ctx, W, H, t) {
    ctx.fillStyle = '#171310';
    ctx.fillRect(0, 0, W, H);
    const cell = Math.min(W, H) / 3.4;
    const colors = ['#a92e2e', '#0e6e6a', '#c98a1f', '#1f3f78'];
    const cream = '#f0e2c4';
    const drift = (t * 6) % cell;
    ctx.save();
    ctx.translate(-cell + drift * 0.4, -cell * 0.5);
    let row = 0;
    for (let y = 0; y < H + cell * 2; y += cell * 0.72, row++) {
        for (let x = (row % 2) * cell * 0.5; x < W + cell * 2; x += cell) {
            const ci = (Math.round(x / cell) + row * 2) % 4;
            const pulse = 0.94 + 0.06 * Math.sin(t * 0.7 + x * 0.01 + y * 0.013);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = colors[(ci + 4) % 4];
            ctx.fillRect(-cell * 0.42 * pulse, -cell * 0.42 * pulse, cell * 0.84 * pulse, cell * 0.84 * pulse);
            ctx.strokeStyle = cream;
            ctx.lineWidth = cell * 0.02;
            ctx.strokeRect(-cell * 0.42 * pulse, -cell * 0.42 * pulse, cell * 0.84 * pulse, cell * 0.84 * pulse);
            ctx.rotate(-Math.PI / 4);
            // rosette
            starPath(ctx, 0, 0, cell * 0.30 * pulse, cell * 0.12 * pulse, 8, Math.PI / 8);
            ctx.fillStyle = cream;
            ctx.globalAlpha = 0.92;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.beginPath(); ctx.arc(0, 0, cell * 0.07 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = colors[(ci + 5) % 4];
            ctx.fill();
            ctx.restore();
        }
    }
    ctx.restore();
}
// Mashrabiya lattice inside an arch, over a warm backlight.
function drawMashrabiyaWindow(ctx, cx, baseY, w, h, t) {
    ctx.save();
    archPath(ctx, cx, baseY, w, h);
    ctx.clip();
    // warm backlight, gently sweeping
    const sweep = 0.5 + 0.3 * Math.sin(t * 0.4);
    const bg = ctx.createRadialGradient(cx + (sweep - 0.5) * w, baseY - h * 0.45, 10, cx, baseY - h * 0.5, w);
    bg.addColorStop(0, 'rgba(255, 190, 100, 0.85)');
    bg.addColorStop(0.6, 'rgba(200, 120, 50, 0.55)');
    bg.addColorStop(1, 'rgba(90, 45, 20, 0.35)');
    ctx.fillStyle = bg;
    ctx.fillRect(cx - w, baseY - h, w * 2, h);
    // lattice: offset rows of turned-wood beads
    const step = w / 14;
    ctx.fillStyle = 'rgba(26, 13, 6, 0.92)';
    let row = 0;
    for (let y = baseY - h; y < baseY + step; y += step * 0.87, row++) {
        for (let x = cx - w; x < cx + w; x += step) {
            const xx = x + (row % 2) * step * 0.5;
            ctx.beginPath(); ctx.arc(xx, y, step * 0.34, 0, Math.PI * 2); ctx.fill();
        }
    }
    ctx.restore();
    // gold frame
    ctx.save();
    archPath(ctx, cx, baseY, w, h);
    ctx.strokeStyle = 'rgba(230, 195, 110, 0.9)';
    ctx.lineWidth = 4 * (Math.min(w, h) / 400);
    ctx.stroke();
    ctx.restore();
}
// Ramadan cannon silhouette (barrel, big wheel, trail).
function drawCannon(ctx, x, baseY, s, color) {
    ctx.save();
    ctx.translate(x, baseY);
    ctx.fillStyle = color;
    // trail + carriage
    ctx.beginPath();
    ctx.moveTo(-10 * s, 0);
    ctx.lineTo(70 * s, 0);
    ctx.lineTo(30 * s, -26 * s);
    ctx.lineTo(-10 * s, -26 * s);
    ctx.closePath(); ctx.fill();
    // barrel (angled up-left)
    ctx.save();
    ctx.translate(-6 * s, -40 * s);
    ctx.rotate(0.5);
    ctx.beginPath();
    ctx.roundRect(-90 * s, -13 * s, 104 * s, 26 * s, 12 * s);
    ctx.fill();
    // muzzle ring
    ctx.fillRect(-92 * s, -16 * s, 10 * s, 32 * s);
    ctx.restore();
    // big spoked wheel
    const wy = -26 * s, wr = 30 * s;
    ctx.beginPath(); ctx.arc(10 * s, wy, wr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(10 * s, wy, wr * 0.72, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 4 * s;
    for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath(); ctx.moveTo(10 * s, wy); ctx.lineTo(10 * s + Math.cos(a) * wr * 0.7, wy + Math.sin(a) * wr * 0.7); ctx.stroke();
    }
    ctx.restore();
}
// Interlaced 12-point girih medallion.
function drawGirihMedallion(ctx, cx, cy, r, rot, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(240, 205, 120, 0.95)';
    ctx.lineWidth = Math.max(1.5, r * 0.016);
    // two overlaid 12-point star polygons
    for (const off of [0, Math.PI / 12]) {
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const a1 = off + (i * 2 * Math.PI) / 12;
            const a2 = off + ((i + 5) * 2 * Math.PI) / 12;
            const x1 = Math.cos(a1) * r, y1 = Math.sin(a1) * r;
            const x2 = Math.cos(a2) * r, y2 = Math.sin(a2) * r;
            if (i === 0) ctx.moveTo(x1, y1); else ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        ctx.stroke();
    }
    // outer ring + inner rosette
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i++) {
        const a = (i * 2 * Math.PI) / 12;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.30, Math.sin(a) * r * 0.30, r * 0.12, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}
// Spiral (Ibn Tulun) minaret.
function drawSpiralMinaret(ctx, x, baseY, h, w, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(x - w / 2, baseY - h, w, h);
    // external spiral staircase bands
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 190, 110, 0.28)';
    ctx.lineWidth = w * 0.22;
    for (let i = 0; i < 5; i++) {
        const y0 = baseY - h + (i + 0.5) * (h / 5);
        ctx.beginPath();
        ctx.moveTo(x - w * 0.9, y0 + h * 0.06);
        ctx.quadraticCurveTo(x, y0 - h * 0.05, x + w * 0.9, y0 + h * 0.06);
        ctx.stroke();
    }
    ctx.restore();
    // top pavilion + dome cap
    ctx.rect(x - w * 0.8, baseY - h * 1.10, w * 1.6, h * 0.10);
    ctx.moveTo(x - w * 0.5, baseY - h * 1.10);
    ctx.quadraticCurveTo(x, baseY - h * 1.24, x + w * 0.5, baseY - h * 1.10);
    ctx.fill();
    ctx.restore();
}
// Mamluk ornate minaret (tiered shafts + balconies + lantern top).
function drawMamlukMinaret(ctx, x, baseY, h, w, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    // tier 1 (square), tier 2 (octagonal, narrower), tier 3 (round shaft)
    ctx.rect(x - w * 0.7, baseY - h * 0.45, w * 1.4, h * 0.45);
    ctx.rect(x - w * 0.5, baseY - h * 0.78, w, h * 0.33);
    ctx.rect(x - w * 0.32, baseY - h * 1.02, w * 0.64, h * 0.24);
    // balconies
    ctx.rect(x - w * 0.9, baseY - h * 0.48, w * 1.8, h * 0.03);
    ctx.rect(x - w * 0.7, baseY - h * 0.80, w * 1.4, h * 0.028);
    // lantern pavilion + bulb
    ctx.rect(x - w * 0.5, baseY - h * 1.12, w, h * 0.10);
    ctx.moveTo(x - w * 0.34, baseY - h * 1.12);
    ctx.quadraticCurveTo(x, baseY - h * 1.26, x + w * 0.34, baseY - h * 1.12);
    ctx.fill();
    // gold tip
    ctx.fillStyle = 'rgba(255, 224, 150, 0.9)';
    ctx.beginPath(); ctx.arc(x, baseY - h * 1.24, w * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}
function drawBird(ctx, x, y, s, flap, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 8 * s, y - flap);
    ctx.quadraticCurveTo(x, y + 3 * s, x + 8 * s, y - flap);
    ctx.stroke();
    ctx.restore();
}

export function drawScene(ctx, template, W, H, t, text) {
    const u = W / 1080;
    const mu = Math.min(W, H) / 1080;
    if (template === 'night') {
        // المسحراتي: old Cairo alley, the dawn caller with his drum and lantern.
        const st = stateFor('night', 11);
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#0a1129');
        sky.addColorStop(0.6, '#18264d');
        sky.addColorStop(1, '#2d3f6e');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);
        drawStars(ctx, W, H, t, st.stars);
        drawCrescent(ctx, W * 0.78, H * 0.13, 76 * mu * 1.2, 1 + 0.05 * Math.sin(t * 0.8));
        // far houses (darker, taller band)
        const gy = H * 0.90;
        const far = '#131c38';
        drawHouse(ctx, -W * 0.05, gy, W * 0.30, H * 0.34, far, 5, t);
        drawHouse(ctx, W * 0.22, gy, W * 0.26, H * 0.28, far, 6, t);
        drawHouse(ctx, W * 0.55, gy, W * 0.30, H * 0.36, far, 7, t);
        drawHouse(ctx, W * 0.82, gy, W * 0.24, H * 0.30, far, 8, t);
        // near houses with lit windows
        const near = '#0a0e1e';
        drawHouse(ctx, W * 0.02, gy, W * 0.26, H * 0.22, near, 15, t);
        drawHouse(ctx, W * 0.60, gy, W * 0.30, H * 0.24, near, 16, t);
        drawHouse(ctx, W * 0.88, gy, W * 0.20, H * 0.20, near, 17, t);
        // street
        ctx.fillStyle = '#03050c';
        ctx.fillRect(0, gy, W, H - gy);
        // the mesaharaty walks in the middle of the alley
        drawMesaharaty(ctx, W * 0.42, gy + 2, mu * 1.75, t, '#04060f');
        drawParticles(ctx, W, H, t, st.particles.slice(0, 18), 'rgba(255, 209, 128, 0.5)');
        drawScrim(ctx, W, H * 0.42, H * 0.34);
        drawTextBlock(ctx, W, H, H * 0.385, t, text, '#ffd98a', [0.17, 0.6]);
    }
    else if (template === 'lanterns') {
        // خيامية: Egyptian tentmaker applique, bold rosettes on dark cloth.
        drawKhayamiya(ctx, W, H, t);
        const st = stateFor('lanterns', 23);
        drawParticles(ctx, W, H, t, st.particles.slice(0, 20), 'rgba(255, 214, 140, 0.55)');
        drawScrim(ctx, W, H * 0.5, H * 0.40);
        drawTextBlock(ctx, W, H, H * 0.500, t, text, '#ffe3a1', [0.12, 0.88]);
    }
    else if (template === 'crescent') {
        // هلال النيل: crescent over the Nile, a felucca drifting past.
        const st = stateFor('crescent', 37);
        const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
        sky.addColorStop(0, '#05091a');
        sky.addColorStop(0.6, '#0d1a3d');
        sky.addColorStop(1, '#1d3260');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H * 0.62);
        drawStars(ctx, W, H * 0.62, t, st.stars);
        drawCrescent(ctx, W * 0.66, H * 0.15, 96 * mu * 1.15, 1 + 0.06 * Math.sin(t * 0.7));
        // far bank silhouette (palm + low houses)
        const by = H * 0.62;
        ctx.fillStyle = '#050c1c';
        ctx.fillRect(0, by - 6 * mu, W, 8 * mu);
        for (let i = 0; i < 6; i++) {
            const px = W * (0.05 + i * 0.17);
            ctx.beginPath();
            ctx.moveTo(px, by - 4 * mu);
            ctx.lineTo(px, by - 26 * mu);
            ctx.lineWidth = 3 * mu;
            ctx.strokeStyle = '#050c1c';
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(px, by - 28 * mu, 9 * mu, Math.PI, Math.PI * 2);
            ctx.fillStyle = '#050c1c';
            ctx.fill();
        }
        drawWater(ctx, W, by, H, t, W * 0.66);
        // felucca glides slowly across
        const fx = ((t * 0.028) % 1.4 - 0.2) * W;
        drawFelucca(ctx, fx, H * 0.78, mu * 1.5, '#03060e');
        // its lantern
        const lg = ctx.createRadialGradient(fx + 30 * mu, H * 0.775, 1, fx + 30 * mu, H * 0.775, 26 * mu);
        lg.addColorStop(0, 'rgba(255, 200, 110, 0.55)');
        lg.addColorStop(1, 'rgba(255, 200, 110, 0)');
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.arc(fx + 30 * mu, H * 0.775, 26 * mu, 0, Math.PI * 2); ctx.fill();
        drawTextBlock(ctx, W, H, H * 0.560, t, text, '#ffd98a', [0.24, 0.88]);
    }
    else if (template === 'mosque') {
        // القلعة: the Citadel mosque at dusk, gold horizon.
        const st = stateFor('mosque', 51);
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#18264e');
        sky.addColorStop(0.55, '#5c3d63');
        sky.addColorStop(0.8, '#c96f4a');
        sky.addColorStop(1, '#eda25e');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);
        drawStars(ctx, W, H * 0.4, t, st.stars.slice(0, 45));
        // horizon glow
        const hz = ctx.createRadialGradient(W / 2, H * 0.88, 10, W / 2, H * 0.88, W * 0.65);
        hz.addColorStop(0, 'rgba(255, 205, 120, 0.5)');
        hz.addColorStop(1, 'rgba(255, 205, 120, 0)');
        ctx.fillStyle = hz;
        ctx.fillRect(0, 0, W, H);
        drawCrescent(ctx, W * 0.84, H * 0.10, 46 * mu, 1 + 0.05 * Math.sin(t * 0.75));
        // drifting birds
        ctx.strokeStyle = 'rgba(20, 16, 30, 0.8)';
        ctx.lineWidth = 2.4 * mu;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            const bx = ((t * 0.02 + i * 0.3) % 1.2 - 0.1) * W;
            const byy = H * (0.18 + i * 0.05);
            const flap = Math.sin(t * 5 + i) * 4 * mu;
            ctx.beginPath();
            ctx.moveTo(bx - 8 * mu, byy - flap);
            ctx.quadraticCurveTo(bx, byy + 3 * mu, bx + 8 * mu, byy - flap);
            ctx.stroke();
        }
        // hill + citadel
        const gy = H * 0.90;
        ctx.fillStyle = '#0a0d18';
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.quadraticCurveTo(W * 0.3, gy - 40 * mu, W * 0.62, gy - 18 * mu);
        ctx.quadraticCurveTo(W * 0.85, gy - 4 * mu, W, gy - 14 * mu);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();
        ctx.save();
        ctx.translate(W / 2, gy - 14 * mu);
        ctx.scale(0.72, 0.72);
        ctx.translate(-W / 2, -(gy - 14 * mu));
        drawCitadel(ctx, W, H, gy - 14 * mu, '#070a14');
        ctx.restore();
        drawParticles(ctx, W, H, t, st.particles.slice(0, 20), 'rgba(255, 209, 128, 0.6)');
        drawScrim(ctx, W, H * 0.33, H * 0.28);
        drawTextBlock(ctx, W, H, H * 0.370, t, text, '#ffe9b8', [0.1, 0.64]);
    }
    else if (template === 'fanous') {
        // الفانوس: the classic Egyptian fanous, glowing in a bokeh alley.
        const st = stateFor('fanous', 67);
        const bg = ctx.createRadialGradient(W / 2, H * 0.36, 10, W / 2, H * 0.4, Math.max(W, H) * 0.85);
        bg.addColorStop(0, '#14352a');
        bg.addColorStop(1, '#04100b');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        // warm bokeh lights drifting gently
        const rnd = mulberry32(201);
        for (let i = 0; i < 12; i++) {
            const bx = rnd() * W;
            const by = rnd() * H;
            const br = (14 + rnd() * 40) * mu;
            const fl = 0.06 + 0.05 * Math.sin(t * (0.6 + rnd()) + rnd() * 6);
            const bgc = ctx.createRadialGradient(bx, by, 1, bx, by, br);
            bgc.addColorStop(0, `rgba(255, 190, 100, ${fl})`);
            bgc.addColorStop(1, 'rgba(255, 190, 100, 0)');
            ctx.fillStyle = bgc;
            ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
        }
        // dim companions
        ctx.save();
        ctx.globalAlpha = 0.4;
        drawFanousEgy(ctx, W * 0.10, -10, H * 0.17, mu * 0.75, 0.05 * Math.sin(t * 0.8 + 1), 0.85 + 0.1 * Math.sin(t * 2.2), t);
        drawFanousEgy(ctx, W * 0.90, -10, H * 0.22, mu * 0.65, 0.06 * Math.sin(t * 0.9 + 2.4), 0.85 + 0.1 * Math.sin(t * 1.8 + 1), t);
        ctx.restore();
        drawFanousEgy(ctx, W * 0.5, -10, H * 0.08, mu * 2.3, 0.03 * Math.sin(t * 0.7), 0.9 + 0.1 * Math.sin(t * 2.0), t);
        drawParticles(ctx, W, H, t, st.particles, 'rgba(255, 196, 100, 0.85)');
        drawScrim(ctx, W, H * 0.74, H * 0.26);
        drawTextBlock(ctx, W, H, H * 0.650, t, text, '#ffe3a1', [0.38, 0.92]);
    }
    else if (template === 'calligraphy') {
        // مشربية: arched mashrabiya screen with a warm glow behind.
        const st = stateFor('calligraphy', 83);
        const bg = ctx.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H * 0.46, Math.max(W, H) * 0.9);
        bg.addColorStop(0, '#0b2d22');
        bg.addColorStop(1, '#03100b');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        drawGeoLattice(ctx, W, H, t, 0.06);
        const ww = Math.min(W * 0.66, H * 0.5);
        const wbase = H * 0.58;
        const wh = H * 0.42;
        drawMashrabiyaWindow(ctx, W / 2, wbase, ww, wh, t);
        // crescent finial above the arch
        drawCrescent(ctx, W / 2, wbase - wh - 50 * mu, 30 * mu, 1 + 0.05 * Math.sin(t * 0.8));
        drawParticles(ctx, W, H, t, st.particles.slice(0, 20), 'rgba(255, 209, 128, 0.5)');
        drawScrim(ctx, W, H * 0.76, H * 0.24);
        drawTextBlock(ctx, W, H, H * 0.805, t, text, '#f8d789', [0.65, 0.96], [0.76, 0.99]);
    }
    else if (template === 'iftar') {
        // مدفع الإفطار: the Ramadan cannon over the city at sunset.
        const st = stateFor('iftar', 97);
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#231844');
        sky.addColorStop(0.5, '#6e3355');
        sky.addColorStop(0.8, '#d96d43');
        sky.addColorStop(1, '#f0a055');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);
        drawStars(ctx, W, H * 0.35, t, st.stars.slice(0, 35));
        drawCrescent(ctx, W * 0.80, H * 0.12, 48 * mu, 1 + 0.05 * Math.sin(t * 0.7));
        // city skyline with twinkling lights
        const cy = H * 0.86;
        ctx.fillStyle = '#14101f';
        const rnd = mulberry32(300);
        let bx = 0;
        while (bx < W) {
            const bw = (30 + rnd() * 70) * u * 3;
            const bh = (40 + rnd() * 90) * mu;
            ctx.fillRect(bx, cy - bh, bw, bh);
            bx += bw + 4 * mu;
        }
        for (let i = 0; i < 40; i++) {
            const lx = rnd() * W, ly = cy - rnd() * 90 * mu;
            const tw2 = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * (1 + rnd() * 3) + rnd() * 6));
            ctx.fillStyle = `rgba(255, 196, 100, ${0.5 * tw2})`;
            ctx.fillRect(lx, ly, 3 * mu, 3 * mu);
        }
        // minarets, a dome and palms rising over the skyline
        drawMinaretSil(ctx, W * 0.14, cy + 4 * mu, 200 * mu, 26 * mu, '#14101f');
        drawMinaretSil(ctx, W * 0.88, cy + 4 * mu, 240 * mu, 30 * mu, '#14101f');
        ctx.fillStyle = '#14101f';
        ctx.beginPath();
        ctx.arc(W * 0.66, cy + 2 * mu, 48 * mu, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(W * 0.66 - 3 * mu, cy - 66 * mu, 6 * mu, 22 * mu);
        ctx.fillStyle = 'rgba(255, 214, 130, 0.9)';
        ctx.beginPath(); ctx.arc(W * 0.66, cy - 68 * mu, 5 * mu, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#14101f';
        for (const px of [W * 0.36, W * 0.48]) {
            ctx.lineWidth = 7 * mu;
            ctx.beginPath();
            ctx.moveTo(px, cy + 4 * mu);
            ctx.quadraticCurveTo(px + 10 * mu, cy - 70 * mu, px + 5 * mu, cy - 108 * mu);
            ctx.stroke();
            ctx.lineWidth = 4.5 * mu;
            for (let f = 0; f < 6; f++) {
                const fa = -Math.PI * (0.12 + f * 0.15);
                ctx.beginPath();
                ctx.moveTo(px + 5 * mu, cy - 108 * mu);
                ctx.quadraticCurveTo(px + 5 * mu + Math.cos(fa) * 46 * mu, cy - 108 * mu + Math.sin(fa) * 34 * mu, px + 5 * mu + Math.cos(fa) * 62 * mu, cy - 108 * mu + Math.sin(fa) * 50 * mu + 16 * mu);
                ctx.stroke();
            }
        }
        // citadel hill + cannon
        const gy = H * 0.94;
        ctx.fillStyle = '#0a0714';
        ctx.beginPath();
        ctx.moveTo(0, gy - 10 * mu);
        ctx.quadraticCurveTo(W * 0.4, gy - 56 * mu, W, gy - 22 * mu);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();
        drawCannon(ctx, W * 0.52, gy - 20 * mu, mu * 2.4, '#05030c');
        // firing cycle: flash + drifting smoke rings every 8s
        const phase = t % 8;
        const mx = W * 0.52 - 204 * mu, my = gy - 20 * mu - 199 * mu;
        if (phase < 0.6) {
            const fl = 1 - phase / 0.6;
            const fg = ctx.createRadialGradient(mx, my, 2, mx, my, 90 * mu * fl);
            fg.addColorStop(0, `rgba(255, 230, 160, ${0.9 * fl})`);
            fg.addColorStop(1, 'rgba(255, 230, 160, 0)');
            ctx.fillStyle = fg;
            ctx.beginPath(); ctx.arc(mx, my, 90 * mu * fl, 0, Math.PI * 2); ctx.fill();
        }
        if (phase > 0.3 && phase < 4) {
            const sp = (phase - 0.3) / 3.7;
            for (let k = 0; k < 3; k++) {
                const spk = Math.min(1, sp + k * 0.08);
                ctx.strokeStyle = `rgba(220, 210, 200, ${0.35 * (1 - spk)})`;
                ctx.lineWidth = 5 * mu;
                ctx.beginPath();
                ctx.arc(mx - spk * 60 * mu - k * 22 * mu, my - spk * 70 * mu, (14 + spk * 46 + k * 8) * mu, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        drawScrim(ctx, W, H * 0.36, H * 0.30);
        drawTextBlock(ctx, W, H, H * 0.380, t, text, '#ffe9b8', [0.1, 0.66]);
    }
    else if (template === 'geo') {
        // زخرفة إسلامية: interlaced girih medallion, gold on deep indigo.
        const st = stateFor('geo', 111);
        const bg = ctx.createRadialGradient(W / 2, H * 0.40, 10, W / 2, H * 0.45, Math.max(W, H) * 0.85);
        bg.addColorStop(0, '#101c44');
        bg.addColorStop(1, '#04060f');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        drawGeoLattice(ctx, W, H, t, 0.05);
        // corner medallions
        const cm = Math.min(W, H) * 0.09;
        for (const [qx, qy] of [[0.08, 0.08], [0.92, 0.08], [0.08, 0.92], [0.92, 0.92]]) {
            drawGirihMedallion(ctx, W * qx, H * qy, cm, -t * 0.02, 0.35);
        }
        // hero medallion
        const mr = Math.min(W, H) * 0.24;
        const mg = ctx.createRadialGradient(W / 2, H * 0.36, mr * 0.2, W / 2, H * 0.36, mr * 2.4);
        mg.addColorStop(0, 'rgba(255, 205, 105, 0.20)');
        mg.addColorStop(1, 'rgba(255, 205, 105, 0)');
        ctx.fillStyle = mg;
        ctx.beginPath(); ctx.arc(W / 2, H * 0.36, mr * 2.4, 0, Math.PI * 2); ctx.fill();
        drawGirihMedallion(ctx, W / 2, H * 0.36, mr, t * 0.03, 1);
        drawCrescent(ctx, W / 2, H * 0.36, mr * 0.24, 1 + 0.05 * Math.sin(t * 0.8));
        drawParticles(ctx, W, H, t, st.particles.slice(0, 24), 'rgba(255, 209, 128, 0.5)');
        drawScrim(ctx, W, H * 0.76, H * 0.26);
        drawTextBlock(ctx, W, H, H * 0.745, t, text, '#f6c860', [0.54, 0.95], [0.62, 0.98]);
    }
    else if (template === 'dawn') {
        // فجر القاهرة: first light over a mosque silhouette, birds waking up.
        const st = stateFor('dawn', 151);
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#0c1430');
        sky.addColorStop(0.45, '#3b2d5e');
        sky.addColorStop(0.72, '#b05a6a');
        sky.addColorStop(0.92, '#f2a06a');
        sky.addColorStop(1, '#ffd28e');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);
        drawStars(ctx, W, H * 0.3, t, st.stars.slice(0, 30));
        const pulse = 0.85 + 0.15 * Math.sin(t * 0.6);
        const dg = ctx.createRadialGradient(W / 2, H * 0.86, 10, W / 2, H * 0.86, W * 0.75);
        dg.addColorStop(0, `rgba(255, 214, 140, ${0.55 * pulse})`);
        dg.addColorStop(1, 'rgba(255, 214, 140, 0)');
        ctx.fillStyle = dg;
        ctx.fillRect(0, 0, W, H);
        // sweeping dawn light rays fanning from the horizon glow
        for (let i = 0; i < 4; i++) {
            const ang = -Math.PI / 2 + (i - 1.5) * 0.28 + 0.06 * Math.sin(t * 0.9 + i);
            ctx.save();
            ctx.translate(W / 2, H * 0.86);
            ctx.rotate(ang);
            const ray = ctx.createLinearGradient(0, 0, 0, -H);
            ray.addColorStop(0, 'rgba(255, 224, 160, 0.16)');
            ray.addColorStop(1, 'rgba(255, 224, 160, 0)');
            ctx.fillStyle = ray;
            ctx.beginPath();
            ctx.moveTo(-14 * mu, 0);
            ctx.lineTo(14 * mu, 0);
            ctx.lineTo(60 * mu, -H);
            ctx.lineTo(-60 * mu, -H);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        drawCrescent(ctx, W * 0.16, H * 0.10, 40 * mu, 1 + 0.04 * Math.sin(t * 0.7));
        for (let i = 0; i < 3; i++) {
            const cx2 = ((t * (0.010 + i * 0.005) + i * 0.4) % 1.3 - 0.15) * W;
            const cyy = H * (0.16 + i * 0.08);
            ctx.fillStyle = 'rgba(255, 220, 200, 0.10)';
            ctx.beginPath();
            ctx.ellipse(cx2, cyy, W * 0.15, 9 * mu, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        for (let i = 0; i < 7; i++) {
            const bx = ((t * 0.045 + i * 0.17) % 1.2 - 0.1) * W;
            drawBird(ctx, bx, H * (0.20 + i * 0.045), mu * (0.8 + i * 0.15), Math.sin(t * 5 + i) * 4 * mu, 'rgba(30, 22, 40, 0.85)');
        }
        const gy = H * 0.88;
        ctx.save();
        ctx.translate(W / 2, gy);
        ctx.scale(0.8, 0.8);
        ctx.translate(-W / 2, -gy);
        drawMosque(ctx, W, H, gy, '#0b0a18');
        ctx.restore();
        drawParticles(ctx, W, H, t, st.particles.slice(0, 16), 'rgba(255, 220, 150, 0.5)');
        drawScrim(ctx, W, H * 0.34, H * 0.28);
        drawTextBlock(ctx, W, H, H * 0.340, t, text, '#ffe9b8', [0.1, 0.58]);
    }

    else if (template === 'quran') {
        // المصحف: an open mushaf on a rehl stand, light streaming down.
        const st = stateFor('quran', 167);
        const bg = ctx.createRadialGradient(W / 2, H * 0.44, 10, W / 2, H * 0.48, Math.max(W, H) * 0.85);
        bg.addColorStop(0, '#0e3328');
        bg.addColorStop(1, '#040f0a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        drawGeoLattice(ctx, W, H, t, 0.05);
        // gentle light rays from above
        for (let i = 0; i < 3; i++) {
            const ang = (i - 1) * 0.20 + 0.03 * Math.sin(t * 0.8 + i);
            ctx.save();
            ctx.translate(W / 2, -H * 0.05);
            ctx.rotate(ang);
            const ray = ctx.createLinearGradient(0, 0, 0, H * 0.75);
            ray.addColorStop(0, 'rgba(255, 224, 160, 0.12)');
            ray.addColorStop(1, 'rgba(255, 224, 160, 0)');
            ctx.fillStyle = ray;
            ctx.beginPath();
            ctx.moveTo(-14 * mu, 0);
            ctx.lineTo(14 * mu, 0);
            ctx.lineTo(80 * mu, H * 0.75);
            ctx.lineTo(-80 * mu, H * 0.75);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        drawCrescent(ctx, W * 0.84, H * 0.09, 40 * mu, 1 + 0.05 * Math.sin(t * 0.8));
        // glow behind the book
        const gy = H * 0.60;
        const glow = ctx.createRadialGradient(W / 2, gy, 10, W / 2, gy, W * 0.48);
        glow.addColorStop(0, `rgba(255, 205, 110, ${0.26 + 0.05 * Math.sin(t * 1.2)})`);
        glow.addColorStop(1, 'rgba(255, 205, 110, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(W / 2, gy, W * 0.48, 0, Math.PI * 2); ctx.fill();
        // rehl (X-shaped stand)
        const bw = Math.min(W * 0.60, H * 0.40);
        ctx.strokeStyle = '#4a2e12';
        ctx.lineWidth = 10 * mu;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(W / 2 - bw * 0.32, gy + 30 * mu);
        ctx.lineTo(W / 2 + bw * 0.28, gy + 150 * mu);
        ctx.moveTo(W / 2 + bw * 0.32, gy + 30 * mu);
        ctx.lineTo(W / 2 - bw * 0.28, gy + 150 * mu);
        ctx.stroke();
        // open book: two curved pages
        const pageH = bw * 0.36;
        ctx.save();
        ctx.translate(W / 2, gy);
        for (const dir of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(0, -pageH * 0.15);
            ctx.quadraticCurveTo(dir * bw * 0.30, -pageH * 0.62, dir * bw * 0.5, -pageH * 0.28);
            ctx.quadraticCurveTo(dir * bw * 0.53, pageH * 0.02, dir * bw * 0.5, pageH * 0.26);
            ctx.quadraticCurveTo(dir * bw * 0.28, pageH * 0.08, 0, pageH * 0.24);
            ctx.closePath();
            const pg = ctx.createLinearGradient(0, -pageH * 0.5, 0, pageH * 0.3);
            pg.addColorStop(0, '#f7ecc9');
            pg.addColorStop(1, '#e6d29e');
            ctx.fillStyle = pg;
            ctx.fill();
            ctx.strokeStyle = 'rgba(120, 86, 34, 0.65)';
            ctx.lineWidth = 2 * mu;
            ctx.stroke();
            // gold script lines on each page
            ctx.strokeStyle = 'rgba(150, 110, 40, 0.55)';
            ctx.lineWidth = 2.2 * mu;
            for (let li = 0; li < 4; li++) {
                const ly = -pageH * 0.20 + li * pageH * 0.13;
                ctx.beginPath();
                ctx.moveTo(dir * bw * 0.10, ly);
                ctx.quadraticCurveTo(dir * bw * 0.27, ly - 4 * mu, dir * bw * 0.44, ly + 2 * mu);
                ctx.stroke();
            }
        }
        ctx.restore();
        // illuminated medallion centered over the seam
        drawGirihMedallion(ctx, W / 2, gy - pageH * 0.1, 26 * mu, t * 0.05, 0.9);
        drawParticles(ctx, W, H, t, st.particles.slice(0, 22), 'rgba(255, 214, 140, 0.6)');
        drawScrim(ctx, W, H * 0.27, H * 0.23);
        drawTextBlock(ctx, W, H, H * 0.285, t, text, '#ffe3a1', [0.07, 0.5]);
    }
    else if (template === 'suhoor') {
        // سفرة السحور: a pre-dawn table by an arched window, crescent still out.
        const st = stateFor('suhoor', 181);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0a0f24');
        bg.addColorStop(1, '#1d1540');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        drawStars(ctx, W, H * 0.30, t, st.stars.slice(35, 70));
        // arched window on the left, night sky inside
        const wx = W * 0.27, wbase = H * 0.68, ww = W * 0.37, wh = H * 0.32;
        ctx.save();
        archPath(ctx, wx, wbase, ww, wh);
        ctx.clip();
        const nsky = ctx.createLinearGradient(0, wbase - wh, 0, wbase);
        nsky.addColorStop(0, '#0a1130');
        nsky.addColorStop(1, '#2a3a6e');
        ctx.fillStyle = nsky;
        ctx.fillRect(wx - ww / 2, wbase - wh, ww, wh);
        ctx.translate(wx - ww / 2, wbase - wh);
        drawStars(ctx, ww, wh, t, st.stars.slice(0, 30));
        ctx.restore();
        drawCrescent(ctx, wx + ww * 0.15, wbase - wh * 0.64, 34 * mu, 1 + 0.05 * Math.sin(t * 0.8));
        // window frame + mullions
        ctx.strokeStyle = 'rgba(214, 178, 94, 0.6)';
        ctx.lineWidth = 5 * mu;
        archPath(ctx, wx, wbase, ww, wh);
        ctx.stroke();
        ctx.lineWidth = 2.5 * mu;
        ctx.beginPath();
        ctx.moveTo(wx, wbase);
        ctx.lineTo(wx, wbase - wh + ww * 0.30);
        ctx.moveTo(wx - ww / 2, wbase - wh * 0.42);
        ctx.lineTo(wx + ww / 2, wbase - wh * 0.42);
        ctx.stroke();
        // warm interior light from the right
        const wl = ctx.createRadialGradient(W, H * 0.45, 10, W, H * 0.45, W * 0.9);
        wl.addColorStop(0, 'rgba(255, 190, 100, 0.15)');
        wl.addColorStop(1, 'rgba(255, 190, 100, 0)');
        ctx.fillStyle = wl;
        ctx.fillRect(0, 0, W, H);
        // hanging fanous, top right
        drawFanousEgy(ctx, W * 0.85, -10, H * 0.07, mu * 1.1, 0.04 * Math.sin(t * 0.8), 0.85 + 0.1 * Math.sin(t * 2.1), t);
        // table
        const ty = H * 0.84;
        ctx.fillStyle = '#120a1e';
        ctx.fillRect(0, ty, W, H - ty);
        ctx.fillStyle = 'rgba(214, 178, 94, 0.22)';
        ctx.fillRect(0, ty, W, 3 * mu);
        // the spread: dallah, dates bowl, two steaming cups
        ctx.save();
        ctx.translate(W * 0.86, ty);
        ctx.scale(2.1, 2.1);
        ctx.fillStyle = '#3a2410';
        ctx.beginPath();
        ctx.moveTo(-24 * mu, 0);
        ctx.quadraticCurveTo(-32 * mu, -58 * mu, -10 * mu, -76 * mu);
        ctx.lineTo(10 * mu, -76 * mu);
        ctx.quadraticCurveTo(32 * mu, -58 * mu, 24 * mu, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3a2410';
        ctx.lineWidth = 6 * mu;
        ctx.beginPath();
        ctx.moveTo(-8 * mu, -68 * mu);
        ctx.quadraticCurveTo(-38 * mu, -82 * mu, -32 * mu, -106 * mu);
        ctx.stroke();
        ctx.fillRect(-12 * mu, -84 * mu, 24 * mu, 8 * mu);
        ctx.beginPath(); ctx.arc(0, -90 * mu, 5 * mu, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255, 200, 110, 0.5)';
        ctx.lineWidth = 2 * mu;
        ctx.beginPath();
        ctx.moveTo(24 * mu, -2 * mu);
        ctx.quadraticCurveTo(32 * mu, -58 * mu, 10 * mu, -76 * mu);
        ctx.stroke();
        ctx.restore();
        drawDatesBowl(ctx, W * 0.53, ty - 4 * mu, mu * 1.9);
        drawCup(ctx, W * 0.30, ty, mu * 2.1, t, 0.4);
        drawCup(ctx, W * 0.69, ty, mu * 1.6, t, 2.2);
        drawParticles(ctx, W, H, t, st.particles.slice(0, 18), 'rgba(255, 209, 128, 0.5)');
        drawScrim(ctx, W, H * 0.21, H * 0.22);
        drawTextBlock(ctx, W, H, H * 0.350, t, text, '#ffd98a', [0.1, 0.6], [0.06, 0.52]);
    }
    else if (template === 'clock') {
        // ساعة رمضان: an ornate pocket watch on night blue, hands sweeping.
        const st = stateFor('clock', 199);
        const bg = ctx.createRadialGradient(W / 2, H * 0.38, 10, W / 2, H * 0.42, Math.max(W, H) * 0.85);
        bg.addColorStop(0, '#0d1838');
        bg.addColorStop(1, '#03060f');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        drawGeoLattice(ctx, W, H, t, 0.04);
        drawStars(ctx, W, H, t, st.stars.slice(0, 40));
        const cxp = W / 2, cyp = H * 0.38, cr = Math.min(W, H) * 0.20;
        // chain from the top + crown loop
        ctx.strokeStyle = 'rgba(214, 178, 94, 0.55)';
        ctx.lineWidth = 4 * mu;
        ctx.beginPath();
        ctx.moveTo(cxp, 0);
        ctx.quadraticCurveTo(cxp + 12 * mu, cyp - cr - 70 * mu, cxp, cyp - cr - 30 * mu);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(cxp, cyp - cr - 18 * mu, 15 * mu, 0, Math.PI * 2); ctx.stroke();
        // glow
        const cg = ctx.createRadialGradient(cxp, cyp, cr * 0.2, cxp, cyp, cr * 2.2);
        cg.addColorStop(0, `rgba(255, 205, 105, ${0.20 + 0.04 * Math.sin(t * 1.1)})`);
        cg.addColorStop(1, 'rgba(255, 205, 105, 0)');
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(cxp, cyp, cr * 2.2, 0, Math.PI * 2); ctx.fill();
        // case + face
        ctx.beginPath(); ctx.arc(cxp, cyp, cr, 0, Math.PI * 2);
        ctx.fillStyle = '#0a1428';
        ctx.fill();
        ctx.lineWidth = 9 * mu;
        ctx.strokeStyle = '#d6b25e';
        ctx.stroke();
        ctx.beginPath(); ctx.arc(cxp, cyp, cr * 0.88, 0, Math.PI * 2);
        ctx.lineWidth = 2 * mu;
        ctx.strokeStyle = 'rgba(214, 178, 94, 0.5)';
        ctx.stroke();
        // Arabic-Indic numerals
        const nums = ['١٢', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠', '١١'];
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#e9cf8f';
        ctx.font = `700 ${Math.round(cr * 0.13)}px Cairo, sans-serif`;
        for (let i = 0; i < 12; i++) {
            const a = i * Math.PI / 6 - Math.PI / 2;
            ctx.fillText(nums[i], cxp + Math.cos(a) * cr * 0.74, cyp + Math.sin(a) * cr * 0.74);
        }
        ctx.restore();
        // small crescent on the face
        drawCrescent(ctx, cxp, cyp - cr * 0.38, cr * 0.10, 1);
        // hands: minute turns every 10s, hour slower
        const minA = (t / 10) * Math.PI * 2 - Math.PI / 2;
        const hrA = (t / 120) * Math.PI * 2 - Math.PI / 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#f6c860';
        ctx.lineWidth = 5 * mu;
        ctx.beginPath(); ctx.moveTo(cxp, cyp); ctx.lineTo(cxp + Math.cos(minA) * cr * 0.62, cyp + Math.sin(minA) * cr * 0.62); ctx.stroke();
        ctx.lineWidth = 8 * mu;
        ctx.beginPath(); ctx.moveTo(cxp, cyp); ctx.lineTo(cxp + Math.cos(hrA) * cr * 0.42, cyp + Math.sin(hrA) * cr * 0.42); ctx.stroke();
        ctx.beginPath(); ctx.arc(cxp, cyp, 7 * mu, 0, Math.PI * 2); ctx.fillStyle = '#f6c860'; ctx.fill();
        drawParticles(ctx, W, H, t, st.particles.slice(0, 18), 'rgba(255, 209, 128, 0.5)');
        drawScrim(ctx, W, H * 0.76, H * 0.26);
        drawTextBlock(ctx, W, H, H * 0.820, t, text, '#f6c860', [0.68, 0.96]);
    }
    else if (template === 'taraweeh') {
        // التراويح: a glowing mosque interior, arches receding, worshippers bowing in unison.
        const st = stateFor('taraweeh', 211);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#241a0c');
        bg.addColorStop(1, '#0a0603');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        const floorY = H * 0.86;
        // receding mihrab arches
        for (let i = 0; i < 3; i++) {
            const f = 1 - i * 0.20;
            ctx.strokeStyle = `rgba(214, 178, 94, ${0.55 - i * 0.15})`;
            ctx.lineWidth = (6 - i * 1.5) * mu;
            archPath(ctx, W / 2, floorY, W * 0.88 * f, H * 0.62 * f);
            ctx.stroke();
        }
        // warm glow deep in the hall
        const hg = ctx.createRadialGradient(W / 2, floorY - H * 0.22, 10, W / 2, floorY - H * 0.22, W * 0.55);
        hg.addColorStop(0, `rgba(255, 200, 110, ${0.30 + 0.05 * Math.sin(t * 1.3)})`);
        hg.addColorStop(1, 'rgba(255, 200, 110, 0)');
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(W / 2, floorY - H * 0.22, W * 0.55, 0, Math.PI * 2); ctx.fill();
        // hanging fanawis
        drawFanousEgy(ctx, W * 0.30, -10, H * 0.08, mu * 0.8, 0.04 * Math.sin(t * 0.8), 0.85 + 0.1 * Math.sin(t * 2.0), t);
        drawFanousEgy(ctx, W * 0.70, -10, H * 0.12, mu * 0.7, 0.05 * Math.sin(t * 0.9 + 2), 0.85 + 0.1 * Math.sin(t * 1.7 + 1), t);
        drawFanousEgy(ctx, W * 0.5, -10, H * 0.04, mu * 0.6, 0.04 * Math.sin(t * 0.7 + 4), 0.85 + 0.1 * Math.sin(t * 2.4 + 2), t);
        // a row of worshippers in unison
        const bow = Math.max(0, Math.sin(t * 0.9)) * 0.5;
        for (let i = 0; i < 6; i++) {
            const fx = W * (0.15 + i * 0.14);
            const fs = mu * (1.05 + 0.12 * Math.sin(i * 2.1));
            ctx.save();
            ctx.translate(fx, floorY);
            ctx.scale(fs, fs);
            ctx.fillStyle = '#05030c';
            const lean = bow * 34;
            ctx.beginPath();
            ctx.moveTo(-16, 0);
            ctx.quadraticCurveTo(-18 - lean * 0.4, -70, -6 - lean, -96);
            ctx.quadraticCurveTo(0 - lean, -104, 6 - lean, -96);
            ctx.quadraticCurveTo(18 - lean * 0.4, -70, 16, 0);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath(); ctx.arc(-lean * 1.1, -110, 10, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        // floor sheen
        ctx.fillStyle = 'rgba(214, 178, 94, 0.08)';
        ctx.fillRect(0, floorY, W, H - floorY);
        drawParticles(ctx, W, H, t, st.particles.slice(0, 16), 'rgba(255, 214, 140, 0.45)');
        drawScrim(ctx, W, H * 0.28, H * 0.24);
        drawTextBlock(ctx, W, H, H * 0.520, t, text, '#ffe9b8', [0.2, 0.84]);
    }
    else if (template === 'misbaha') {
        // المسبحة: amber prayer beads draped on dark cloth, a glow traveling bead to bead.
        const st = stateFor('misbaha', 223);
        const bg = ctx.createRadialGradient(W / 2, H * 0.44, 10, W / 2, H * 0.48, Math.max(W, H) * 0.85);
        bg.addColorStop(0, '#0e241c');
        bg.addColorStop(1, '#040d09');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        drawGeoLattice(ctx, W, H, t, 0.04);
        // draped strand: U-shaped bezier
        const x0 = W * 0.16, y0 = H * 0.26;
        const x1 = W * 0.84, y1 = H * 0.26;
        const cxx = W * 0.5, cyy = H * 0.90;
        const N = 27;
        const pts = [];
        for (let i = 0; i < N; i++) {
            const f = i / (N - 1);
            pts.push([
                (1 - f) * (1 - f) * x0 + 2 * (1 - f) * f * cxx + f * f * x1,
                (1 - f) * (1 - f) * y0 + 2 * (1 - f) * f * cyy + f * f * y1,
            ]);
        }
        // string
        ctx.strokeStyle = 'rgba(214, 178, 94, 0.4)';
        ctx.lineWidth = 2 * mu;
        ctx.beginPath();
        pts.forEach(([px, py], i) => { if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
        ctx.stroke();
        // beads with a traveling glow
        const glowI = Math.floor(t * 6) % N;
        for (let i = 0; i < N; i++) {
            const [px, py] = pts[i];
            const isGlow = i === glowI;
            const br = 10 * mu;
            if (isGlow) {
                const gg = ctx.createRadialGradient(px, py, 1, px, py, br * 3);
                gg.addColorStop(0, 'rgba(255, 220, 150, 0.8)');
                gg.addColorStop(1, 'rgba(255, 200, 110, 0)');
                ctx.fillStyle = gg;
                ctx.beginPath(); ctx.arc(px, py, br * 3, 0, Math.PI * 2); ctx.fill();
            }
            const bgc = ctx.createRadialGradient(px - br * 0.35, py - br * 0.35, 1, px, py, br * 1.15);
            bgc.addColorStop(0, isGlow ? '#ffe0a0' : '#e8a04c');
            bgc.addColorStop(1, '#7a4413');
            ctx.fillStyle = bgc;
            ctx.beginPath(); ctx.arc(px, py, br, 0, Math.PI * 2); ctx.fill();
        }
        // tassel at the bottom of the U with a crescent charm
        const [tx2, ty2] = pts[Math.floor(N / 2)];
        ctx.strokeStyle = '#d6b25e';
        ctx.lineWidth = 3 * mu;
        ctx.beginPath(); ctx.moveTo(tx2, ty2 + 12 * mu); ctx.lineTo(tx2, ty2 + 40 * mu); ctx.stroke();
        ctx.fillStyle = '#d6b25e';
        ctx.beginPath();
        ctx.moveTo(tx2 - 10 * mu, ty2 + 40 * mu);
        ctx.lineTo(tx2 + 10 * mu, ty2 + 40 * mu);
        ctx.lineTo(tx2 + 6 * mu, ty2 + 58 * mu);
        ctx.lineTo(tx2 - 6 * mu, ty2 + 58 * mu);
        ctx.closePath();
        ctx.fill();
        for (let k = -3; k <= 3; k++) {
            ctx.strokeStyle = 'rgba(214, 178, 94, 0.7)';
            ctx.lineWidth = 2 * mu;
            ctx.beginPath();
            ctx.moveTo(tx2 + k * 3 * mu, ty2 + 58 * mu);
            ctx.lineTo(tx2 + k * 4.5 * mu, ty2 + 92 * mu);
            ctx.stroke();
        }
        drawCrescent(ctx, tx2, ty2 + 76 * mu, 9 * mu, 1 + 0.05 * Math.sin(t * 0.9));
        drawParticles(ctx, W, H, t, st.particles.slice(0, 16), 'rgba(255, 209, 128, 0.45)');
        drawScrim(ctx, W, H * 0.76, H * 0.24);
        drawTextBlock(ctx, W, H, H * 0.765, t, text, '#ffe3a1', [0.58, 0.95], [0.64, 0.98]);
    }
    else {
        // minaret → مآذن القاهرة: Cairo skyline of historic minarets at dusk.
        const st = stateFor('minaret', 131);
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#131c40');
        sky.addColorStop(0.55, '#43305e');
        sky.addColorStop(0.82, '#a05a52');
        sky.addColorStop(1, '#e0915a');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);
        drawStars(ctx, W, H * 0.4, t, st.stars);
        drawCrescent(ctx, W * 0.22, H * 0.13, 60 * mu, 1 + 0.05 * Math.sin(t * 0.65));
        // drifting thin clouds
        for (let i = 0; i < 3; i++) {
            const cx2 = ((t * (0.008 + i * 0.004) + i * 0.4) % 1.3 - 0.15) * W;
            const cyy = H * (0.2 + i * 0.09);
            ctx.fillStyle = 'rgba(240, 210, 190, 0.10)';
            ctx.beginPath();
            ctx.ellipse(cx2, cyy, W * 0.16, 10 * mu, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        // skyline
        const gy = H * 0.93;
        ctx.fillStyle = '#0a0a16';
        ctx.fillRect(0, gy, W, H - gy);
        // domes between the minarets
        ctx.beginPath();
        ctx.moveTo(W * 0.30, gy);
        ctx.quadraticCurveTo(W * 0.40, gy - 80 * mu, W * 0.50, gy);
        ctx.moveTo(W * 0.62, gy);
        ctx.quadraticCurveTo(W * 0.70, gy - 60 * mu, W * 0.78, gy);
        ctx.fill();
        drawSpiralMinaret(ctx, W * 0.10, gy, H * 0.26, 38 * mu, '#0a0a16');
        drawMamlukMinaret(ctx, W * 0.28, gy, H * 0.34, 42 * mu, '#0a0a16');
        drawPencilMinaret(ctx, W * 0.52, gy, H * 0.29, 26 * mu, '#0a0a16');
        drawMamlukMinaret(ctx, W * 0.68, gy, H * 0.40, 44 * mu, '#0a0a16');
        drawPencilMinaret(ctx, W * 0.90, gy, H * 0.27, 24 * mu, '#0a0a16');
        // twinkling city lights at the base
        const rnd = mulberry32(400);
        for (let i = 0; i < 30; i++) {
            const lx = rnd() * W, ly = gy - rnd() * 20 * mu;
            const tw2 = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * (1 + rnd() * 3) + rnd() * 6));
            ctx.fillStyle = `rgba(255, 196, 100, ${0.55 * tw2})`;
            ctx.fillRect(lx, ly, 3 * mu, 3 * mu);
        }
        drawParticles(ctx, W, H, t, st.particles.slice(0, 16), 'rgba(255, 209, 128, 0.5)');
        drawScrim(ctx, W, H * 0.32, H * 0.28);
        drawTextBlock(ctx, W, H, H * 0.390, t, text, '#ffe9b8', [0.14, 0.64]);
    }
}
