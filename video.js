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

// t초 시점의 한 장면을 그림
function drawFrame(ctx, t, media, cap) {
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

// ── 배경음악: 잔잔한 피아노풍 화음을 브라우저에서 직접 만듦 (저작권 걱정 없음) ──
const CHORDS = [
  [130.81, 261.63, 329.63, 392.0, 493.88], // Cmaj7
  [110.0, 220.0, 261.63, 329.63, 392.0],   // Am7
  [87.31, 174.61, 220.0, 261.63, 329.63],  // Fmaj7
  [98.0, 196.0, 246.94, 293.66, 392.0],    // G
];

function startMusic(actx, out) {
  const t0 = actx.currentTime + 0.05;
  const master = actx.createGain();
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.linearRampToValueAtTime(0.22, t0 + 1.5);
  master.gain.setValueAtTime(0.22, t0 + TOTAL - 2.5);
  master.gain.linearRampToValueAtTime(0.0001, t0 + TOTAL);
  const lp = actx.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 1800;
  master.connect(lp);
  out.forEach((o) => lp.connect(o));

  const len = TOTAL / 8;
  for (let c = 0; c < 8; c++) {
    const notes = CHORDS[c % 4];
    const start = t0 + c * len;
    // 바탕 화음 (부드럽게 깔리는 소리)
    notes.forEach((f) => {
      const osc = actx.createOscillator(), g = actx.createGain();
      osc.type = "triangle"; osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.05, start + 1.2);
      g.gain.linearRampToValueAtTime(0.0001, start + len + 1.0);
      osc.connect(g).connect(master);
      osc.start(start); osc.stop(start + len + 1.1);
    });
    // 한 음씩 짚는 피아노풍 소리
    const arp = [notes[1], notes[2], notes[3], notes[4] * 2 > 900 ? notes[4] : notes[4] * 2, notes[3], notes[2]];
    arp.forEach((f, j) => {
      const s = start + j * (len / arp.length);
      const osc = actx.createOscillator(), g = actx.createGain();
      osc.type = "sine"; osc.frequency.value = f * 2;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.09, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 2.2);
      osc.connect(g).connect(master);
      osc.start(s); osc.stop(s + 2.3);
    });
  }
  return () => master.disconnect();
}

// ── 재생 / 녹화 ────────────────────────────────────────
function pickMime() {
  const list = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"];
  return list.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
}

// record=true면 30초 녹화 후 영상 파일(Blob)을 돌려줌
function playShorts(canvas, media, cap, { record = false, onTime } = {}) {
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
  const stopMusic = startMusic(actx, outs);
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

window.Shorts = { W, H, TOTAL, drawFrame, playShorts };
