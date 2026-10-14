// 아리아펫 쇼츠 앱 — 화면 동작
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const MAX_MEDIA = 6;

let media = [];   // { type: "image" | "video", url, el }
let player = null;

// 단계 이동
function go(step) {
  $$("[data-step]").forEach((el) => (el.hidden = Number(el.dataset.step) !== step));
  $$("#steps li").forEach((li, i) => {
    li.classList.toggle("on", i === step - 1);
    li.classList.toggle("done", i < step - 1);
  });
  player?.stop();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$$("[data-back]").forEach((b) => b.addEventListener("click", () => go(Number(b.dataset.back))));

// ── 1단계: 사진·영상 올리기 ───────────────────────────
function loadMedia(file) {
  const url = URL.createObjectURL(file);
  if (file.type.startsWith("video/")) {
    const el = document.createElement("video");
    Object.assign(el, { src: url, muted: true, playsInline: true, preload: "auto" });
    return new Promise((ok) => el.addEventListener("loadeddata", () => ok({ type: "video", url, el }), { once: true }));
  }
  const el = new Image();
  el.src = url;
  return el.decode().then(() => ({ type: "image", url, el }));
}

$("#files").addEventListener("change", async (e) => {
  const files = [...e.target.files].slice(0, MAX_MEDIA - media.length);
  for (const f of files) {
    try { media.push(await loadMedia(f)); } catch { alert(`${f.name} 파일을 열 수 없습니다.`); }
  }
  e.target.value = "";
  renderThumbs();
});

function renderThumbs() {
  $("#thumbs").innerHTML = media.map((m, i) => `
    <div class="thumb">
      ${m.type === "video" ? `<video src="${m.url}" muted></video><span class="tag">영상</span>` : `<img src="${m.url}" alt="">`}
      <button type="button" data-del="${i}" aria-label="빼기">×</button>
    </div>`).join("");
  $$("[data-del]").forEach((b) => b.addEventListener("click", () => {
    const [m] = media.splice(Number(b.dataset.del), 1);
    URL.revokeObjectURL(m.url);
    renderThumbs();
  }));
  $(".upload").hidden = media.length >= MAX_MEDIA;
}

// ── 2단계: 문구 ─────────────────────────────────────
// 받침 여부로 조사 고르기 (보리와 / 콩과)
function josa(name, withoutBatchim, withBatchim) {
  const c = name.charCodeAt(name.length - 1);
  const has = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  return name + (has ? withBatchim : withoutBatchim);
}

function defaultTexts(name) {
  const withPet = name ? `${josa(name, "와", "과")} 함께한 모든 날,` : "너와 함께한 모든 날,";
  const call = name ? josa(name, "야", "아") : "사랑하는 아이야";
  return [
    { key: "intro", label: "시작 (0~5초) · 마주 보는 그림", text: "우리는 서로를\n바라보았습니다" },
    { key: "mid", label: "공감 (5~10초)", text: "많이 그리우시죠.\n그 슬픔은 사랑의 크기입니다" },
    { key: "mid", label: "사랑 (10~15초)", text: `${withPet}\n우리는 서로를 사랑했습니다` },
    { key: "mid", label: "고마움 (15~20초)", text: `${call},\n곁에 있어 주어서 고마웠어` },
    { key: "mid", label: "극복 (20~25초)", text: "슬픔은 천천히 추억이 됩니다.\n아리아펫이 함께하겠습니다" },
    { key: "outro", label: "끝 (25~30초) · 한 줄씩 나타남", text: "사랑했고,\n고마웠고,\n감사했습니다" },
  ];
}

let texts = [];
let textsFor = null; // 문구를 만든 기준 이름 (이름이 바뀌면 다시 만듦)

$("#toText").addEventListener("click", () => {
  const name = $("#petName").value.trim();
  if ((name || media.length) && !$("#consent").checked) {
    alert("고객 반려동물의 사진·이름을 쓰려면 보호자 동의 확인란에 체크해 주세요.");
    return;
  }
  if (textsFor !== name) {
    texts = defaultTexts(name);
    textsFor = name;
  }
  $("#texts").innerHTML = texts.map((t, i) => `
    <label class="field">${t.label}
      <textarea data-i="${i}" rows="3">${t.text}</textarea>
    </label>`).join("");
  $$("#texts textarea").forEach((ta) => ta.addEventListener("input", () => (texts[ta.dataset.i].text = ta.value)));
  go(2);
});

function captions() {
  return {
    intro: texts.find((t) => t.key === "intro").text,
    mid: texts.filter((t) => t.key === "mid").map((t) => t.text),
    outro: texts.find((t) => t.key === "outro").text,
  };
}

// ── 3단계: 배경음악 고르기 ────────────────────────────
let music = { id: "piano" };      // { id, buffer?(내 파일일 때), name?(파일 이름) }
let stopListen = null;            // 들어보기 멈추는 함수
try { const saved = localStorage.getItem("ariapet.music"); if (saved && saved !== "file") music.id = saved; } catch {}

function stopListening() {
  stopListen?.(); stopListen = null;
  $$("[data-listen]").forEach((b) => (b.textContent = "▶ 들어보기"));
}

function renderMusic() {
  $("#music").innerHTML = Shorts.MUSIC.map((m) => `
    <label class="track ${music.id === m.id ? "on" : ""}">
      <input type="radio" name="music" value="${m.id}" ${music.id === m.id ? "checked" : ""}>
      <span class="name">${m.name}<small>${m.id === "file" ? (music.name || m.desc) : m.desc}</small></span>
      ${m.id === "file" ? `<button type="button" class="listen" data-pick>${music.buffer ? "바꾸기" : "파일 고르기"}</button>` : ""}
      ${m.id !== "none" ? `<button type="button" class="listen" data-listen="${m.id}">▶ 들어보기</button>` : ""}
    </label>`).join("");

  $$('input[name="music"]').forEach((r) => r.addEventListener("change", () => {
    stopListening();
    if (r.value === "file" && !music.buffer) { $("#musicFile").click(); renderMusic(); return; }
    music.id = r.value;
    try { localStorage.setItem("ariapet.music", music.id); } catch {}
    renderMusic();
  }));
  $$("[data-pick]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); $("#musicFile").click(); }));
  $$("[data-listen]").forEach((b) => b.addEventListener("click", (e) => {
    e.preventDefault();
    const id = b.dataset.listen;
    if (stopListen && b.textContent.startsWith("■")) { stopListening(); return; }
    stopListening();
    if (id === "file" && !music.buffer) { $("#musicFile").click(); return; }
    player?.stop();
    const stop = Shorts.previewMusic(id === "file" ? music : { id }, 8);
    stopListen = () => stop();
    b.textContent = "■ 멈추기";
    setTimeout(() => { if (b.textContent.startsWith("■")) stopListening(); }, 8300);
  }));
}

$("#musicFile").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f) { renderMusic(); return; }
  try {
    const buffer = await Shorts.decodeMusic(f);
    music = { id: "file", buffer, name: `${f.name} (${Math.round(buffer.duration)}초${buffer.duration < Shorts.TOTAL ? ", 모자라면 반복" : ", 앞 30초"})` };
  } catch { alert(`${f.name} 파일을 열 수 없습니다. MP3·M4A·WAV 를 써 주세요.`); }
  renderMusic();
});

// ── 3단계: 미리보기·만들기 ────────────────────────────
const stage = $("#stage");
const sctx = stage.getContext("2d");

async function showPoster() {
  await document.fonts.load('700 40px "Gowun Batang"').catch(() => {});
  Shorts.drawFrame(sctx, 4.9, media, captions());
}

$("#toMake").addEventListener("click", () => {
  $("#download").hidden = $("#share").hidden = true;
  $("#barFill").style.width = "0";
  go(3);
  renderMusic();
  showPoster();
});

function setBusy(busy) {
  $("#preview").disabled = busy && !player?.previewing;
  $("#make").disabled = busy;
}

$("#preview").addEventListener("click", async () => {
  if (player) { player.stop(); return; }
  stopListening();
  player = Shorts.playShorts(stage, media, captions(), { onTime: progress, music });
  player.previewing = true;
  $("#preview").textContent = "■ 멈추기";
  setBusy(true);
  await player.done;
  player = null;
  $("#preview").textContent = "▶ 미리보기";
  setBusy(false);
  showPoster();
});

$("#make").addEventListener("click", async () => {
  if (!window.MediaRecorder || !stage.captureStream) {
    alert("이 브라우저는 영상 녹화를 지원하지 않습니다. 크롬이나 엣지에서 열어 주세요.");
    return;
  }
  $("#download").hidden = $("#share").hidden = true;
  stopListening();
  player = Shorts.playShorts(stage, media, captions(), { record: true, onTime: progress, music });
  setBusy(true);
  $("#makeHint").textContent = "녹화 중입니다… 30초 동안 이 화면을 켜 두세요.";
  const result = await player.done;
  player = null;
  setBusy(false);
  if (!result) return;

  const ext = result.mime.includes("mp4") ? "mp4" : "webm";
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const name = $("#petName").value.trim();
  const a = $("#download");
  a.href = URL.createObjectURL(result.blob);
  a.download = `아리아펫_쇼츠_${name ? name + "_" : ""}${stamp}.${ext}`;
  a.hidden = false;
  a.textContent = `영상 내려받기 (${ext.toUpperCase()})`;

  // 휴대폰: 공유 창으로 카카오톡 전송·사진첩 저장
  const file = new File([result.blob], a.download, { type: result.blob.type });
  shareFile = navigator.canShare?.({ files: [file] }) ? file : null;
  $("#share").hidden = !shareFile;
  $("#makeHint").textContent = ext === "mp4"
    ? "완성되었습니다. 내려받아 유튜브 쇼츠·인스타 릴스에 올리시면 됩니다."
    : "완성되었습니다. 이 브라우저는 WEBM 형식으로 저장합니다(유튜브는 그대로 올릴 수 있음). MP4가 필요하면 최신 크롬·엣지를 쓰세요.";
});

let shareFile = null;
$("#share").addEventListener("click", () => {
  navigator.share({ files: [shareFile], title: "아리아펫 쇼츠" }).catch(() => {});
});

function progress(t) {
  $("#barFill").style.width = `${Math.min(100, (t / Shorts.TOTAL) * 100)}%`;
}

renderThumbs();

// 휴대폰 홈 화면에 앱으로 설치할 수 있게 함 (인터넷 주소로 열었을 때만)
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js");
}
