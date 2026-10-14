// 아리아펫 쇼츠 — 영상 그리기 · 배경음악 · 녹화
// 30초 = 시작 5초(마주 보는 그림) + 사진·영상 20초 + 끝 5초(감사 인사)

const W = 720, H = 1280, FPS = 30;
const INTRO = 5, MID = 20, OUTRO = 5, TOTAL = INTRO + MID + OUTRO;
const FADE = 0.6;
const YELLOW = "#f9e000", INK = "#23282b";
const FONT = '"Gowun Batang", "Malgun Gothic", serif';

// ── 로고 스타일 선 그림: 왼쪽 반려동물, 오른쪽 사람이 마주 봄 ──
const DOG = [[67, 572], [67, 482], [135, 454], [185, 498], [264, 499], [270, 525], [202, 613], [227, 652], [195, 928]];
const DOG_EYE = [[107, 510], [146, 537], [107, 566]];
const PERSON = [[690, 470], [580, 445], [535, 505], [520, 575], [478, 630], [512, 655], [500, 690], [515, 715], [502, 755], [565, 790], [585, 920]];
const PERSON_EYE = [[580, 560], [545, 585], [580, 610]];
const GROUND = [[40, 900], [370, 960], [690, 900]];
const CENTER = { x: 374, y: 540 };

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (v) => 1 - Math.pow(1 - clamp(v), 3);
const span = (t, a, b) => ease((t - a) / (b - a));

function polyLen(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}

function drawLine(ctx, pts, p) {
  if (p <= 0) return;
  const L = polyLen(pts);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.setLineDash([L * p, L]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.6);
  ctx.bezierCurveTo(x - s * 1.3, y - s * 0.2, x - s * 0.6, y - s * 1.1, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.3, y - s * 0.2, x, y + s * 0.6);
  ctx.closePath();
}

// p: 선이 그려진 정도(0~1), heart: 동그라미가 하트로 바뀐 정도(0~1)
function drawArt(ctx, p, heart) {
  ctx.fillStyle = YELLOW;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = 14;
  ctx.lineJoin = "miter";
  ctx.lineCap = "butt";

  drawLine(ctx, GROUND, clamp(p / 0.35));
  drawLine(ctx, DOG, clamp((p - 0.15) / 0.6));
  drawLine(ctx, PERSON, clamp((p - 0.25) / 0.6));
  drawLine(ctx, DOG_EYE, clamp((p - 0.75) / 0.2));
  drawLine(ctx, PERSON_EYE, clamp((p - 0.75) / 0.2));

  const pop = clamp((p - 0.85) / 0.15);
  if (pop > 0 && heart < 1) {
    ctx.globalAlpha = 1 - heart;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, 22 * ease(pop), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (heart > 0) {
    const beat = 1 + 0.06 * Math.sin(heart * Math.PI * 4) * (1 - heart);
    heartPath(ctx, CENTER.x, CENTER.y, 42 * ease(heart) * beat);
    ctx.fill();
  }
}

function wrap(ctx, text, maxW) {
  const out = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; }
      else line = test;
    }
    out.push(line);
  }
  return out;
}

function drawText(ctx, text, y, { size = 46, color = INK, alpha = 1, shadow = false } = {}) {
  if (alpha <= 0 || !text) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  if (shadow) { ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 12; }
  const lines = wrap(ctx, text, W - 100);
  const lh = size * 1.45;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, y + (i - (lines.length - 1) / 2) * lh));
  ctx.restore();
}

function drawBrand(ctx, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = '700 44px "Consolas", "Courier New", monospace';
  ctx.textAlign = "right";
  ctx.fillStyle = INK;
  ctx.fillText("ARIA.PET", W - 40, H - 60);
  ctx.restore();
}

// ── 장면 ─────────────────────────────────────────────
function drawIntro(ctx, t, cap) {
  drawArt(ctx, span(t, 0.2, 3.4), 0);
  drawText(ctx, cap.intro, 250, { alpha: span(t, 1.6, 2.6) });
  drawBrand(ctx, span(t, 2.5, 3.5));
}

function drawOutro(ctx, t, cap) {
  drawArt(ctx, span(t, 0, 0.9), span(t, 1.0, 2.2));
  const lines = cap.outro.split("\n").filter(Boolean);
  lines.forEach((l, i) => drawText(ctx, l, 170 + i * 80, { size: 52, alpha: span(t, 1.6 + i * 0.7, 2.3 + i * 0.7) }));
  drawBrand(ctx, 1);
}

function drawCover(ctx, el, scale, panX) {
  const sw = el.videoWidth || el.naturalWidth, sh = el.videoHeight || el.naturalHeight;
  if (!sw) return;
  const s = Math.max(W / sw, H / sh) * scale;
  ctx.drawImage(el, (W - sw * s) / 2 + panX, (H - sh * s) / 2, sw * s, sh * s);
}

const TINTS = [["#f3e7c9", "#8a7a66"], ["#e9f0e0", "#5d7253"], ["#fbe3c4", "#a5643a"], ["#efe6dd", "#6f5f52"]];

function drawMedia(ctx, item, i, k, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  if (!item) {
    // 사진이 없을 때: 따뜻한 색 배경
    const [a, b] = TINTS[i % TINTS.length];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, a); g.addColorStop(1, b);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else if (item.type === "image") {
    // 사진은 천천히 확대하며 좌우로 살짝 이동 (켄 번스 효과)
    const dir = i % 2 ? 1 : -1;
    drawCover(ctx, item.el, 1.06 + 0.1 * k, dir * 40 * (k - 0.5));
  } else {
    drawCover(ctx, item.el, 1, 0);
  }
  ctx.restore();
}

function drawMid(ctx, t, media, cap) {
  const n = Math.max(media.length, 1);
  const d = MID / n;
  const idx = Math.min(n - 1, Math.floor(t / d));
  const local = t - idx * d;
  drawMedia(ctx, media[idx], idx, local / d, 1);
  if (idx + 1 < n && local > d - FADE) drawMedia(ctx, media[idx + 1], idx + 1, 0, (local - (d - FADE)) / FADE);

  // 아래쪽 어둡게 깔고 문구 (5초마다 하나)
  const g = ctx.createLinearGradient(0, H * 0.55, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.6)");
  ctx.fillStyle = g;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);

  const per = MID / cap.mid.length;
  const ci = Math.min(cap.mid.length - 1, Math.floor(t / per));
  const ct = t - ci * per;
  const a = Math.min(clamp(ct / 0.6), clamp((per - ct) / 0.6));
  drawText(ctx, cap.mid[ci], 1010, { color: "#fff", alpha: a, shadow: true });
}

// t초 시점의 장면(액자 없이)
function drawScene(ctx, t, media, cap) {
  if (t < INTRO) return drawIntro(ctx, t, cap);
  if (t < INTRO + MID) {
    drawMid(ctx, t - INTRO, media, cap);
    if (t < INTRO + FADE) { ctx.globalAlpha = 1 - (t - INTRO) / FADE; drawIntro(ctx, INTRO, cap); ctx.globalAlpha = 1; }
    return;
  }
  const o = t - INTRO - MID;
  if (o < FADE) drawMid(ctx, MID - 0.001, media, cap);
  ctx.globalAlpha = clamp(o / FADE);
  drawOutro(ctx, o, cap);
  ctx.globalAlpha = 1;
}

// ── 황실 액자(궁전풍) ─────────────────────────────────────
// 검은 띠 위에 금 장식: 위 왕관 + 그리핀 한 쌍 + 구슬띠, 좌우 코린트식 기둥(홈·주두·받침),
// 아래 모서리 백합 문장. 장면은 액자 안쪽(540×960)에 0.75배로 들어간다.
const PF = { side: 90, top: 160, bottom: 160 };                 // 띠 두께
const INNER = { x: PF.side, y: PF.top, w: W - PF.side * 2, h: H - PF.top - PF.bottom, s: (W - PF.side * 2) / W };
const GOLD = { dark: "#5a3f0a", mid: "#c99a2e", light: "#ffe79a", deep: "#2b1d04" };
const BLACK = "#0b0b0b";

function goldFill(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  [[0, GOLD.dark], [0.3, GOLD.mid], [0.5, GOLD.light], [0.7, GOLD.mid], [1, GOLD.dark]].forEach(([p, c]) => g.addColorStop(p, c));
  return g;
}
function goldStroke(ctx, lw = 1.2) { ctx.lineWidth = lw; ctx.strokeStyle = GOLD.deep; }

// 구슬·잎 띠(에그 앤 다트)
function drawEggBand(ctx, x0, x1, y, h) {
  const step = 26;
  for (let x = x0 + step / 2; x < x1; x += step) {
    ctx.fillStyle = goldFill(ctx, x - 8, y, x + 8, y + h);
    ctx.beginPath(); ctx.ellipse(x, y + h / 2, 7, h / 2 - 1, 0, 0, Math.PI * 2); ctx.fill(); goldStroke(ctx); ctx.stroke();
    ctx.fillStyle = GOLD.mid;
    ctx.beginPath(); ctx.moveTo(x + step / 2, y + 2); ctx.lineTo(x + step / 2 + 3, y + h - 3); ctx.lineTo(x + step / 2 - 3, y + h - 3); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = GOLD.mid; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x0, y - 2); ctx.lineTo(x1, y - 2); ctx.moveTo(x0, y + h + 2); ctx.lineTo(x1, y + h + 2); ctx.stroke();
}

// 왕관(코로넷): 받침띠 + 보석 + 다섯 꼭지와 진주
function drawCrown(ctx, cx, cy, w = 84, h = 52) {
  ctx.save(); ctx.translate(cx, cy);
  const bw = w, bh = 16;
  ctx.fillStyle = goldFill(ctx, -bw / 2, 0, bw / 2, 0);
  ctx.beginPath(); ctx.roundRect(-bw / 2, -bh, bw, bh, 3); ctx.fill(); goldStroke(ctx); ctx.stroke();
  // 꼭지
  ctx.beginPath(); ctx.moveTo(-bw / 2, -bh);
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const x = -bw / 2 + (bw / n) * i;
    if (i < n) ctx.lineTo(x + bw / n / 2, -bh - (i === 2 ? h : h * 0.72));
    ctx.lineTo(Math.min(x + bw / n, bw / 2), -bh);
  }
  ctx.closePath(); ctx.fillStyle = goldFill(ctx, -bw / 2, -bh - h, bw / 2, -bh); ctx.fill(); ctx.stroke();
  for (let i = 0; i < n; i++) {
    const x = -bw / 2 + (bw / n) * (i + 0.5), y = -bh - (i === 2 ? h : h * 0.72);
    ctx.fillStyle = GOLD.light; ctx.beginPath(); ctx.arc(x, y - 3, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  // 보석
  ["#b3121d", "#1b4fb3", "#b3121d"].forEach((c, i) => {
    const x = -bw / 2 + (bw / 4) * (i + 1);
    const g = ctx.createRadialGradient(x - 2, -bh / 2 - 2, 1, x, -bh / 2, 5);
    g.addColorStop(0, "#fff"); g.addColorStop(0.3, c); g.addColorStop(1, "#200");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, -bh / 2, 4.5, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}

// 그리핀(사자 몸 + 독수리 머리·날개) 실루엣 — 원점이 발밑, +x 를 바라봄
function drawGriffin(ctx, x, y, flip = false, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
  ctx.fillStyle = goldFill(ctx, -70, -90, 70, 0); goldStroke(ctx, 1.5); ctx.lineJoin = "round";
  // 날개
  ctx.beginPath(); ctx.moveTo(-20, -40);
  ctx.quadraticCurveTo(-60, -95, -80, -60); ctx.quadraticCurveTo(-62, -70, -58, -52);
  ctx.quadraticCurveTo(-70, -72, -80, -42); ctx.quadraticCurveTo(-60, -52, -52, -40);
  ctx.quadraticCurveTo(-64, -50, -70, -28); ctx.quadraticCurveTo(-45, -36, -20, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
  // 몸통·뒷다리
  ctx.beginPath(); ctx.moveTo(-50, -10);
  ctx.quadraticCurveTo(-60, -40, -20, -42); ctx.quadraticCurveTo(10, -46, 30, -60);
  ctx.quadraticCurveTo(26, -34, 34, -24); ctx.lineTo(44, 0); ctx.lineTo(34, 0); ctx.lineTo(24, -16);
  ctx.quadraticCurveTo(10, -10, 0, -4); ctx.lineTo(4, 0); ctx.lineTo(-8, 0); ctx.lineTo(-14, -14);
  ctx.quadraticCurveTo(-34, -8, -40, 0); ctx.lineTo(-52, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  // 머리(독수리) + 부리 + 귀
  ctx.beginPath(); ctx.moveTo(30, -60); ctx.quadraticCurveTo(44, -80, 54, -68);
  ctx.quadraticCurveTo(64, -62, 60, -56); ctx.lineTo(52, -56); ctx.quadraticCurveTo(44, -48, 34, -50); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(42, -78); ctx.lineTo(46, -90); ctx.lineTo(50, -76); ctx.closePath(); ctx.fill();
  ctx.fillStyle = GOLD.deep; ctx.beginPath(); ctx.arc(48, -68, 1.8, 0, Math.PI * 2); ctx.fill();
  // 꼬리
  ctx.strokeStyle = GOLD.mid; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-50, -10); ctx.quadraticCurveTo(-72, -16, -66, -34); ctx.stroke();
  ctx.fillStyle = GOLD.mid; ctx.beginPath(); ctx.arc(-66, -36, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// 백합 문장(플뢰르 드 리스)
function drawFleur(ctx, cx, cy, s) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 40, s / 40);
  ctx.fillStyle = goldFill(ctx, -30, -40, 30, 40); goldStroke(ctx, 1);
  ctx.beginPath(); ctx.moveTo(0, -42); ctx.quadraticCurveTo(12, -20, 6, 2); ctx.lineTo(-6, 2); ctx.quadraticCurveTo(-12, -20, 0, -42); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const d of [1, -1]) {
    ctx.beginPath(); ctx.moveTo(d * 6, -2); ctx.quadraticCurveTo(d * 30, -26, d * 30, -6);
    ctx.quadraticCurveTo(d * 28, 6, d * 10, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(d * 6, 14); ctx.quadraticCurveTo(d * 22, 18, d * 20, 34); ctx.quadraticCurveTo(d * 10, 26, d * 4, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.beginPath(); ctx.roundRect(-14, 4, 28, 9, 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5, 13); ctx.lineTo(5, 13); ctx.lineTo(3, 36); ctx.lineTo(-3, 36); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// 코린트식 기둥: 받침 → 홈 파인 몸통 → 잎 주두 → 윗판. cx 는 기둥 중심
function drawColumn(ctx, cx, yTop, yBot, w = 56) {
  const capH = 70, baseH = 44;
  const shaftTop = yTop + capH, shaftBot = yBot - baseH;
  // 몸통(세로 홈)
  ctx.fillStyle = goldFill(ctx, cx - w / 2, 0, cx + w / 2, 0);
  ctx.fillRect(cx - w / 2, shaftTop, w, shaftBot - shaftTop);
  const flutes = 6;
  for (let i = 0; i < flutes; i++) {
    const fx = cx - w / 2 + (w / flutes) * (i + 0.5);
    const g = ctx.createLinearGradient(fx - 4, 0, fx + 4, 0);
    g.addColorStop(0, GOLD.dark); g.addColorStop(0.5, GOLD.deep); g.addColorStop(1, GOLD.light);
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(fx - 3.5, shaftTop + 10, 7, shaftBot - shaftTop - 20, 3.5); ctx.fill();
  }
  goldStroke(ctx, 1.2); ctx.strokeRect(cx - w / 2, shaftTop, w, shaftBot - shaftTop);
  // 주두: 종 모양 + 잎 두 줄 + 소용돌이 + 윗판
  ctx.fillStyle = goldFill(ctx, cx - w, yTop, cx + w, yTop + capH);
  ctx.beginPath(); ctx.moveTo(cx - w / 2 - 2, yTop + capH); ctx.lineTo(cx + w / 2 + 2, yTop + capH);
  ctx.lineTo(cx + w / 2 + 14, yTop + 18); ctx.lineTo(cx - w / 2 - 14, yTop + 18); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const [row, n, yy, lh] of [[0, 5, yTop + capH - 4, 26], [1, 4, yTop + capH - 24, 26]]) {
    for (let i = 0; i < n; i++) {
      const lx = cx - w / 2 - 6 + ((w + 12) / n) * (i + 0.5);
      ctx.fillStyle = row ? GOLD.mid : GOLD.light;
      ctx.beginPath(); ctx.moveTo(lx, yy); ctx.quadraticCurveTo(lx - 9, yy - lh * 0.5, lx - 3, yy - lh);
      ctx.quadraticCurveTo(lx, yy - lh * 0.7, lx + 3, yy - lh); ctx.quadraticCurveTo(lx + 9, yy - lh * 0.5, lx, yy); ctx.fill(); goldStroke(ctx, 0.8); ctx.stroke();
    }
  }
  for (const d of [-1, 1]) {   // 소용돌이
    ctx.strokeStyle = GOLD.deep; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx + d * (w / 2 + 4), yTop + 26, 7, 0, Math.PI * 1.6); ctx.stroke();
    ctx.fillStyle = GOLD.light; ctx.beginPath(); ctx.arc(cx + d * (w / 2 + 4), yTop + 26, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = goldFill(ctx, cx - w, 0, cx + w, 0);
  ctx.fillRect(cx - w / 2 - 18, yTop, w + 36, 12); goldStroke(ctx); ctx.strokeRect(cx - w / 2 - 18, yTop, w + 36, 12);
  // 받침(몰딩 세 단)
  for (const [dy, hh, ww] of [[0, 12, w + 8], [12, 10, w + 18], [22, 22, w + 30]]) {
    ctx.fillStyle = goldFill(ctx, cx - ww / 2, 0, cx + ww / 2, 0);
    ctx.beginPath(); ctx.roundRect(cx - ww / 2, shaftBot + dy, ww, hh, 3); ctx.fill(); goldStroke(ctx); ctx.stroke();
  }
}

// 아리아펫 로고 — 페이지 상단의 <img class="logo"> 를 그대로 쓴다(단일 파일에서는 data: 주소라 바로 그려짐)
let _logo = null;
function logoImage() {
  if (_logo === null) _logo = document.querySelector("img.logo") || false;
  return _logo && _logo.complete && _logo.naturalWidth ? _logo : null;
}

// 하단: 아리아펫 로고를 일렬로 반복(둥근 네모로 잘라 금테). 로고가 없으면 작은 금 구슬로 대신
function drawLogoRow(ctx, x0, x1, cy, size = 30, gap = 14) {
  const img = logoImage();
  const step = size + gap;
  const n = Math.floor((x1 - x0 - size) / step) + 1;
  const start = x0 + ((x1 - x0) - ((n - 1) * step + size)) / 2;      // 가운데 맞춤
  for (let i = 0; i < n; i++) {
    const x = start + i * step, y = cy - size / 2;
    ctx.save();
    if (img) {
      ctx.beginPath(); ctx.roundRect(x, y, size, size, size * 0.22); ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore(); ctx.save();
      ctx.strokeStyle = GOLD.mid; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x, y, size, size, size * 0.22); ctx.stroke();
    } else {
      ctx.fillStyle = GOLD.light; ctx.beginPath(); ctx.arc(x + size / 2, cy, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

// 아래 모서리 네모 틀 + 백합
function drawCornerPanel(ctx, cx, cy, size) {
  ctx.fillStyle = BLACK; ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
  ctx.strokeStyle = GOLD.mid; ctx.lineWidth = 3; ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
  ctx.strokeStyle = GOLD.light; ctx.lineWidth = 1; ctx.strokeRect(cx - size / 2 + 5, cy - size / 2 + 5, size - 10, size - 10);
  drawFleur(ctx, cx, cy + 2, size * 0.46);
}

function drawPalaceFrame(ctx) {
  ctx.save(); ctx.globalAlpha = 1;
  const { side: S, top: T, bottom: B } = PF;
  // 검은 띠
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, T); ctx.fillRect(0, H - B, W, B); ctx.fillRect(0, 0, S, H); ctx.fillRect(W - S, 0, S, H);
  // 안쪽 테두리 금선 두 줄
  ctx.strokeStyle = GOLD.mid; ctx.lineWidth = 3; ctx.strokeRect(S - 3, T - 3, W - 2 * S + 6, H - T - B + 6);
  ctx.strokeStyle = GOLD.light; ctx.lineWidth = 1; ctx.strokeRect(S - 7, T - 7, W - 2 * S + 14, H - T - B + 14);
  // 바깥 테두리 금선
  ctx.strokeStyle = GOLD.mid; ctx.lineWidth = 4; ctx.strokeRect(2, 2, W - 4, H - 4);
  // 위: 아리아펫 로고 줄 + 그리핀 + 왕관
  drawLogoRow(ctx, 12, W - 12, 22, 30, 14);
  drawGriffin(ctx, W / 2 - 150, T - 28, false, 1.05);
  drawGriffin(ctx, W / 2 + 150, T - 28, true, 1.05);
  drawCrown(ctx, W / 2, T - 30, 96, 56);
  ctx.strokeStyle = GOLD.mid; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(S + 10, T - 22); ctx.lineTo(W - S - 10, T - 22); ctx.stroke();
  // 좌우 기둥
  const colTop = T - 10, colBot = H - B - 10;
  drawColumn(ctx, S / 2, colTop, colBot, 52);
  drawColumn(ctx, W - S / 2, colTop, colBot, 52);
  // 아래: 모서리 백합 판 + 몰딩 + 가운데 아리아펫 로고 줄
  drawCornerPanel(ctx, S / 2 + 2, H - B / 2 + 6, 76);
  drawCornerPanel(ctx, W - S / 2 - 2, H - B / 2 + 6, 76);
  for (const [y, lw, c] of [[H - B + 14, 2, GOLD.mid], [H - B + 22, 1, GOLD.light], [H - 16, 3, GOLD.mid]]) {
    ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(S + 10, y); ctx.lineTo(W - S - 10, y); ctx.stroke();
  }
  drawLogoRow(ctx, S + 24, W - S - 24, H - B / 2 + 6, 80, 20);   // 2.5배(80px), 5개
  ctx.restore();
}

// t초 시점의 한 장면 = 장면(액자 안쪽에 0.75배) + 황실 액자
function drawFrame(ctx, t, media, cap) {
  ctx.save();
  ctx.fillStyle = BLACK; ctx.fillRect(0, 0, W, H);
  ctx.translate(INNER.x, INNER.y); ctx.scale(INNER.s, INNER.s);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  drawScene(ctx, t, media, cap);
  ctx.restore();
  drawPalaceFrame(ctx);
}

// ── 배경음악 ────────────────────────────────────────────
// 내장곡 3개는 전부 브라우저가 그 자리에서 합성한다(저작권 걱정 없음).
// "내 음악 파일"은 사용자가 고른 오디오(MP3·M4A 등)를 30초에 맞춰 반복·페이드한다. "무음"도 된다.
// music = { id: "piano" | "guitar" | "musicbox" | "file" | "none", buffer?: AudioBuffer }
const CHORDS = [
  [130.81, 261.63, 329.63, 392.0, 493.88], // Cmaj7
  [110.0, 220.0, 261.63, 329.63, 392.0],   // Am7
  [87.31, 174.61, 220.0, 261.63, 329.63],  // Fmaj7
  [98.0, 196.0, 246.94, 293.66, 392.0],    // G
];
const CHORD_LEN = TOTAL / 8; // 한 화음 3.75초

// 곡 1: 잔잔한 피아노 — 처음 만든 곡 그대로
function playPiano(actx, master, t0, len) {
  for (let c = 0; c * CHORD_LEN < len; c++) {
    const notes = CHORDS[c % 4];
    const start = t0 + c * CHORD_LEN;
    notes.forEach((f) => {
      const osc = actx.createOscillator(), g = actx.createGain();
      osc.type = "triangle"; osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.05, start + 1.2);
      g.gain.linearRampToValueAtTime(0.0001, start + CHORD_LEN + 1.0);
      osc.connect(g).connect(master);
      osc.start(start); osc.stop(start + CHORD_LEN + 1.1);
    });
    const arp = [notes[1], notes[2], notes[3], notes[4] * 2 > 900 ? notes[4] : notes[4] * 2, notes[3], notes[2]];
    arp.forEach((f, j) => {
      const s = start + j * (CHORD_LEN / arp.length);
      const osc = actx.createOscillator(), g = actx.createGain();
      osc.type = "sine"; osc.frequency.value = f * 2;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.09, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 2.2);
      osc.connect(g).connect(master);
      osc.start(s); osc.stop(s + 2.3);
    });
  }
}

// 곡 2: 따뜻한 기타 — 줄을 튕기는 소리(톱니파를 저음 통과시켜 빨리 사그라들게)
const GUITAR = [
  [73.42, 146.83, 220.0, 293.66, 369.99], // D
  [55.0, 110.0, 220.0, 277.18, 329.63],   // A
  [61.74, 123.47, 185.0, 246.94, 293.66], // Bm
  [49.0, 98.0, 196.0, 246.94, 293.66],    // G
];
function pluck(actx, master, f, s, peak, decay) {
  const osc = actx.createOscillator(), g = actx.createGain(), lp = actx.createBiquadFilter();
  osc.type = "sawtooth"; osc.frequency.value = f;
  lp.type = "lowpass"; lp.frequency.setValueAtTime(2200, s); lp.frequency.exponentialRampToValueAtTime(500, s + decay);
  g.gain.setValueAtTime(0.0001, s);
  g.gain.exponentialRampToValueAtTime(peak, s + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, s + decay);
  osc.connect(lp).connect(g).connect(master);
  osc.start(s); osc.stop(s + decay + 0.05);
}
function playGuitar(actx, master, t0, len) {
  const bar = CHORD_LEN / 2; // 1.875초마다 한 번 긁음
  for (let b = 0; b * bar < len; b++) {
    const notes = GUITAR[Math.floor(b / 2) % 4];
    const start = t0 + b * bar;
    pluck(actx, master, notes[0], start, 0.16, 1.8);                       // 베이스
    notes.slice(1).forEach((f, j) => pluck(actx, master, f, start + 0.05 + j * 0.045, 0.09, 1.6)); // 스트럼
    [notes[3], notes[4], notes[2]].forEach((f, j) => pluck(actx, master, f * 2, start + bar * 0.5 + j * (bar / 6), 0.06, 1.2)); // 뒤쪽 한 음씩
  }
}

// 곡 3: 포근한 오르골 — 맑고 짧은 종소리(사인파 + 약한 배음)
function playMusicBox(actx, master, t0, len) {
  const step = CHORD_LEN / 8; // 음 하나 0.47초
  for (let c = 0; c * CHORD_LEN < len; c++) {
    const n = CHORDS[c % 4];
    const start = t0 + c * CHORD_LEN;
    // 깔리는 화음(아주 작게)
    [n[1], n[2]].forEach((f) => {
      const osc = actx.createOscillator(), g = actx.createGain();
      osc.type = "sine"; osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.035, start + 1.0);
      g.gain.linearRampToValueAtTime(0.0001, start + CHORD_LEN + 0.8);
      osc.connect(g).connect(master);
      osc.start(start); osc.stop(start + CHORD_LEN + 0.9);
    });
    const pattern = [n[2], n[4], n[3], n[1], n[4], n[2], n[3], c % 2 ? n[1] : n[4]];
    pattern.forEach((f, j) => {
      const s = start + j * step;
      [[4, 0.11], [8, 0.025], [12, 0.008]].forEach(([mul, peak]) => {
        const osc = actx.createOscillator(), g = actx.createGain();
        osc.type = "sine"; osc.frequency.value = f * mul;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(peak, s + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 1.6);
        osc.connect(g).connect(master);
        osc.start(s); osc.stop(s + 1.65);
      });
    });
  }
}

const MUSIC = [
  { id: "piano", name: "잔잔한 피아노", desc: "느리게 한 음씩 짚는 소리", play: playPiano },
  { id: "guitar", name: "따뜻한 기타", desc: "포근하게 튕기는 소리", play: playGuitar },
  { id: "musicbox", name: "포근한 오르골", desc: "작고 맑은 종소리", play: playMusicBox },
  { id: "file", name: "내 음악 파일", desc: "MP3·M4A·WAV 등 가진 음악을 올려 씁니다" },
  { id: "none", name: "무음", desc: "배경음악 없이" },
];

// music 대로 len초 동안 outs 에 음악을 깐다. 되돌려주는 함수로 멈춘다.
function startMusic(actx, outs, music, len = TOTAL) {
  music = music || { id: "piano" };
  if (music.id === "none" || (music.id === "file" && !music.buffer)) return () => {};
  const t0 = actx.currentTime + 0.05;
  const master = actx.createGain();
  const peak = music.id === "file" ? 0.7 : 0.22;
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.linearRampToValueAtTime(peak, t0 + 1.5);
  master.gain.setValueAtTime(peak, t0 + Math.max(1.5, len - 2.5));
  master.gain.linearRampToValueAtTime(0.0001, t0 + len);
  let tail = master;
  if (music.id !== "file") {
    const lp = actx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 1800;
    master.connect(lp); tail = lp;
  }
  outs.forEach((o) => tail.connect(o));
  if (music.id === "file") {
    const src = actx.createBufferSource();
    src.buffer = music.buffer; src.loop = true;
    src.connect(master);
    src.start(t0); src.stop(t0 + len + 0.1);
  } else {
    (MUSIC.find((m) => m.id === music.id) || MUSIC[0]).play(actx, master, t0, len);
  }
  return () => { try { master.disconnect(); } catch {} };
}

// 사용자가 고른 오디오 파일 → AudioBuffer
async function decodeMusic(file) {
  const actx = new AudioContext();
  try { return await actx.decodeAudioData(await file.arrayBuffer()); }
  finally { actx.close(); }
}

// 들어보기: seconds초만 틀고 끝. 되돌려주는 함수로 바로 멈춘다.
function previewMusic(music, seconds = 8) {
  const actx = new AudioContext();
  const stop = startMusic(actx, [actx.destination], music, seconds);
  let closed = false;
  const close = () => { if (!closed) { closed = true; stop(); actx.close(); } };
  const timer = setTimeout(close, (seconds + 0.3) * 1000);
  return () => { clearTimeout(timer); close(); };
}

// ── 재생 / 녹화 ────────────────────────────────────────
function pickMime() {
  const list = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"];
  return list.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
}

// record=true면 30초 녹화 후 영상 파일(Blob)을 돌려줌
function playShorts(canvas, media, cap, { record = false, onTime, music } = {}) {
  const ctx = canvas.getContext("2d");
  const actx = new AudioContext();
  const outs = [actx.destination];
  let recorder, chunks = [], mime = "";

  if (record) {
    const dest = actx.createMediaStreamDestination();
    outs.push(dest);
    const stream = canvas.captureStream(FPS);
    dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
    mime = pickMime();
    recorder = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: 6_000_000 });
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  }

  media.forEach((m) => m.type === "video" && (m.el.pause(), (m.el.currentTime = 0)));
  const stopMusic = startMusic(actx, outs, music);
  recorder?.start(500);

  let playingVideo = -1, stopped = false, raf;
  const begin = performance.now();

  return {
    stop() { stopped = true; },
    done: new Promise((resolve) => {
      const finish = () => {
        cancelAnimationFrame(raf);
        stopMusic();
        media.forEach((m) => m.type === "video" && m.el.pause());
        const close = () => actx.close();
        if (!recorder) { close(); return resolve(null); }
        recorder.onstop = () => { close(); resolve(stopped ? null : { blob: new Blob(chunks, { type: mime || "video/webm" }), mime }); };
        recorder.stop();
      };
      const tick = () => {
        const t = (performance.now() - begin) / 1000;
        if (stopped || t >= TOTAL) return finish();
        // 영상 클립은 자기 차례가 되면 처음부터 재생
        if (t >= INTRO && t < INTRO + MID && media.length) {
          const idx = Math.min(media.length - 1, Math.floor((t - INTRO) / (MID / media.length)));
          if (idx !== playingVideo) {
            playingVideo = idx;
            const m = media[idx];
            if (m.type === "video") { m.el.currentTime = 0; m.el.play(); }
          }
        }
        drawFrame(ctx, t, media, cap);
        onTime?.(t);
        raf = requestAnimationFrame(tick);
      };
      tick();
    }),
  };
}

window.Shorts = { W, H, TOTAL, drawFrame, playShorts, MUSIC, decodeMusic, previewMusic };
