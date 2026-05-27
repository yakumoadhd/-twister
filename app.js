'use strict';
/* ================================================
   ツイスターゲーム — app.js
   全機能実装:
   - ルーレット (20分割, 物理的な針)
   - 音声認識 (スタート/ストップ)
   - ♡エフェクト (マイク音量・ピッチ連動)
   - プレイヤーマーク着色
   - 罰ゲーム画面 (カードフリップ+紙吹雪)
   - アフィリエイト連携
   - 隠し確率変動 (プレイヤーには非公開)
   ================================================ */

/* ─── CONFIG ─── */
const GD = id => `https://lh3.googleusercontent.com/d/${id}`;

const CONFIG = {
  marks: {
    '♥️': GD('1W3ORw4a8s1kSADMonpKdmTBYahVaRaoH'),
    '♠️': GD('1f9WXBdK64sIi8w23fXhd-jdoBXuoiqb4'),
    '♦️': GD('1W3ORw4a8s1kSADMonpKdmTBYahVaRaoH'),
    '♣️': GD('1qh3fIrA9vf7wi111gOfUyy7MgwB-5KJy'),
    '🐾': GD('1N-jMjhcjzQSCc2kL-hpGepPN1PNUcAoA'),
  },
  qr: {
    ubereats:  GD('1NifH4HduwCkJb9uZ-Z8MVTqEhJso2y-e'),
    rakuten:   GD('1FN7u2rMkBgItFAmlrdQdHen6nNWIx4J4'),
    pointmall: GD('10gmZsO-4DM2t0oyjb-8jUy8PQRoYJab0'),
    hapitas:   GD('1Xlw4DGa6RWkMZgAza2ej0iZVeX5MWD8u'),
  },
  links: {
    ubereats:  'https://ubereats.com/feed?promoCode=eats-g1iueentj6',
    rakuten:   'https://hb.afl.rakuten.co.jp/hsc/41d4e0b6.617cd7ca.41649d6b.ff4ed886/?link_type=hybrid_url&ut=eyJwYWdlIjoic2hvcCIsInR5cGUiOiJoeWJyaWRfdXJsIiwiY29sIjoxLCJjYXQiOjEsImJhbiI6MTk2ODYxMCwiYW1wIjpmYWxzZX0%3D',
    pointmall: 'https://hb.afl.rakuten.co.jp/hgc/539a99c0.33a09d25.539a99c1.c77456c9/?pc=https%3A%2F%2Fpointmall.rakuten.co.jp%2Fomikuji&link_type=hybrid_url&ut=eyJwYWdlIjoidXJsIiwidHlwZSI6Imh5YnJpZF91cmwiLCJjb2wiOjF9',
    hapitas:   'https://hapitas.jp/appinvite/?i=25915349',
  },
};

const MARKS = ['♥️', '♠️', '♦️', '♣️', '🐾'];

const DEFAULT_PENALTIES = [
  'スマホのホーム画面をみんなに見せる',
  '30秒創作ダンス披露',
  '勝者を褒めちぎる',
  '今日の服のこだわりポイントを説明する',
  '嫌いな食べ物発表する',
];

/* アフィリエイト連携する罰ゲームテキスト */
const AFFILIATE_MAP = {
  '美味しい食事をおごる':         { title: '今すぐ勝者に美味しい食事をご馳走しよう！', qr: 'ubereats',  link: 'ubereats',  force100: true  },
  'お店を持った気分で夢を語る':   { title: 'お店を持った気分で楽天出店！',              qr: 'rakuten',   link: 'rakuten',   force100: false },
  'みんなが罰ゲーム':             { title: 'みんなでポイ活しよう！',                    qr: 'pointmall', link: 'pointmall', force100: true  },
};

/* ─── SEGMENTS (20分割) ─── */
/* 各セグメント: 17度 + 両端0.5度の隙間(杭との接触判定用) */
const SEGMENTS = [
  { id:  0, text: '服を脱ぐ',     color: '#232323', tc: '#fff', s: 351.5, e:   8.5, type: 'strip'  },
  { id:  1, text: '右手',         color: '#2E7D32', tc: '#fff', s:   9.5, e:  26.5, type: 'normal', limb: 'rightHand', lc: 'green'  },
  { id:  2, text: '右手',         color: '#F9A825', tc: '#333', s:  27.5, e:  44.5, type: 'normal', limb: 'rightHand', lc: 'yellow' },
  { id:  3, text: '右手',         color: '#1565C0', tc: '#fff', s:  45.5, e:  62.5, type: 'normal', limb: 'rightHand', lc: 'blue'   },
  { id:  4, text: '右手',         color: '#B71C1C', tc: '#fff', s:  63.5, e:  80.5, type: 'normal', limb: 'rightHand', lc: 'red'    },
  { id:  5, text: '右手でくすぐる', color: '#232323', tc: '#fff', s:  81.5, e:  98.5, type: 'tickle', limb: 'rightHand' },
  { id:  6, text: '右足',         color: '#2E7D32', tc: '#fff', s:  99.5, e: 116.5, type: 'normal', limb: 'rightFoot', lc: 'green'  },
  { id:  7, text: '右足',         color: '#F9A825', tc: '#333', s: 117.5, e: 134.5, type: 'normal', limb: 'rightFoot', lc: 'yellow' },
  { id:  8, text: '右足',         color: '#1565C0', tc: '#fff', s: 135.5, e: 152.5, type: 'normal', limb: 'rightFoot', lc: 'blue'   },
  { id:  9, text: '右足',         color: '#B71C1C', tc: '#fff', s: 153.5, e: 170.5, type: 'normal', limb: 'rightFoot', lc: 'red'    },
  { id: 10, text: '足でくすぐる', color: '#232323', tc: '#fff', s: 171.5, e: 188.5, type: 'tickle', limb: 'foot'      },
  { id: 11, text: '左足',         color: '#2E7D32', tc: '#fff', s: 189.5, e: 206.5, type: 'normal', limb: 'leftFoot',  lc: 'green'  },
  { id: 12, text: '左足',         color: '#F9A825', tc: '#333', s: 207.5, e: 224.5, type: 'normal', limb: 'leftFoot',  lc: 'yellow' },
  { id: 13, text: '左足',         color: '#1565C0', tc: '#fff', s: 225.5, e: 242.5, type: 'normal', limb: 'leftFoot',  lc: 'blue'   },
  { id: 14, text: '左足',         color: '#B71C1C', tc: '#fff', s: 243.5, e: 260.5, type: 'normal', limb: 'leftFoot',  lc: 'red'    },
  { id: 15, text: '左手でくすぐる', color: '#232323', tc: '#fff', s: 261.5, e: 278.5, type: 'tickle', limb: 'leftHand'  },
  { id: 16, text: '左手',         color: '#2E7D32', tc: '#fff', s: 279.5, e: 296.5, type: 'normal', limb: 'leftHand',  lc: 'green'  },
  { id: 17, text: '左手',         color: '#F9A825', tc: '#333', s: 297.5, e: 314.5, type: 'normal', limb: 'leftHand',  lc: 'yellow' },
  { id: 18, text: '左手',         color: '#1565C0', tc: '#fff', s: 315.5, e: 332.5, type: 'normal', limb: 'leftHand',  lc: 'blue'   },
  { id: 19, text: '左手',         color: '#B71C1C', tc: '#fff', s: 333.5, e: 350.5, type: 'normal', limb: 'leftHand',  lc: 'red'    },
];

/* 杭の位置: 各セグメントの隙間中点 (20個) */
const PEGS = [9,27,45,63,81,99,117,135,153,171,189,207,225,243,261,279,297,315,333,351];

const COLOR_HEX = { green:'#4CAF50', yellow:'#FFD700', blue:'#2196F3', red:'#F44336' };
const COLOR_JA  = { green:'緑', yellow:'黄', blue:'青', red:'赤' };
const LIMB_JA   = { rightHand:'右手', leftHand:'左手', rightFoot:'右足', leftFoot:'左足', foot:'足' };

/* ─── STATE ─── */
let S = {
  players: [],       // [{name, mark, colors:{lh,rh,lf,rf}}]
  penalties: [...DEFAULT_PENALTIES],
  curPlayer: 0,
  phase: 'top',      // top|idle|spinning|decelerating|result|countdown|penalty|affiliate
  lastSeg: null,
  cdTimer: null,
};

/* ─── WHEEL ANIMATION STATE ─── */
let wRot = 0, wSpeed = 0;
let spinning = false, decel = false;
let dStart = 0, dEnd = 0, dTime = 0, dDur = 0;
let prevRot = 0, prevSeg = -1;
let rafId = null;

/* ─── AUDIO ─── */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function playClick() {
  if (!audioCtx) return;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'triangle';
    const now = audioCtx.currentTime;
    o.frequency.setValueAtTime(550 + Math.random() * 200, now);
    o.frequency.exponentialRampToValueAtTime(280, now + 0.06);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    o.start(now); o.stop(now + 0.08);
  } catch(e) {}
}

/* ─── SCREEN ─── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ════════════════════════════
   TOP SCREEN
════════════════════════════ */
let topInited = false;
function initTop() {
  if (topInited) return;
  topInited = true;

  document.querySelectorAll('.count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      buildPlayerSetup(+btn.dataset.count);
    });
  });

  buildPlayerSetup(2);
  buildPenaltyInputs(S.penalties);
  document.getElementById('btn-start-game').addEventListener('click', onStartGame);
}

function buildPlayerSetup(n) {
  const c = document.getElementById('player-setup');
  c.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const row = document.createElement('div');
    row.className = 'player-row';
    row.innerHTML = `
      <div class="player-num-badge">${i+1}</div>
      <input class="player-name-input" type="text" data-pi="${i}"
             placeholder="プレイヤー${i+1}" maxlength="10">
      <div class="mark-selector" data-pi="${i}">
        ${MARKS.map((m,mi) => `<button class="mark-btn${mi===i%MARKS.length?' active':''}"
          data-mark="${m}" data-pi="${i}">${m}</button>`).join('')}
      </div>`;
    c.appendChild(row);
  }
  c.querySelectorAll('.mark-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      c.querySelectorAll(`.mark-btn[data-pi="${btn.dataset.pi}"]`).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function buildPenaltyInputs(vals) {
  const c = document.getElementById('penalty-inputs');
  c.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const row = document.createElement('div');
    row.className = 'penalty-input-row';
    row.innerHTML = `<div class="penalty-num">${i+1}</div>
      <input class="penalty-input" type="text" value="${(vals[i]||'').replace(/"/g,'&quot;')}"
             placeholder="罰ゲームを入力...">`;
    c.appendChild(row);
  }
}

function collectTop() {
  const n = +document.querySelector('.count-btn.active').dataset.count;
  S.players = [];
  for (let i = 0; i < n; i++) {
    const nameEl = document.querySelector(`.player-name-input[data-pi="${i}"]`);
    const markEl = document.querySelector(`.mark-btn.active[data-pi="${i}"]`);
    const name = (nameEl?.value.trim()) || `プレイヤー${i+1}`;
    const mark = markEl?.dataset.mark || MARKS[i%MARKS.length];
    S.players.push({ name, mark, colors: initColors(i, n) });
  }
  const penElems = document.querySelectorAll('.penalty-input');
  S.penalties = [];
  penElems.forEach(el => { if (el.value.trim()) S.penalties.push(el.value.trim()); });
  if (!S.penalties.length) S.penalties = [...DEFAULT_PENALTIES];
}

function initColors(idx, n) {
  if (n === 1) return { lh: 'red', rh: 'green', lf: 'green', rf: 'red' };
  const pre = [
    { lf:'yellow', rf:'blue',   lh:null, rh:null },
    { lf:'blue',   rf:'yellow', lh:null, rh:null },
    { lf:'green',  rf:'green',  lh:null, rh:null },
    { lf:'red',    rf:'red',    lh:null, rh:null },
  ];
  return pre[idx] || { lh:null, rh:null, lf:null, rf:null };
}

function onStartGame() {
  collectTop();
  S.curPlayer = 0;
  initRoulette();
  showScreen('screen-roulette');
  initVoice();
}

/* ════════════════════════════
   ROULETTE SCREEN
════════════════════════════ */
let rouletteInited = false;

function initRoulette() {
  buildPlayerMarks();
  setupCanvas();
  setHeader('idle');

  if (!rouletteInited) {
    rouletteInited = true;
    document.getElementById('spin-btn').addEventListener('click', onSpinBtn);
    document.getElementById('btn-dekita').addEventListener('click', onDekita);
    document.getElementById('btn-nuida').addEventListener('click', onDekita);
    ['btn-giveup-act','btn-giveup-cd','btn-giveup-footer'].forEach(id => {
      document.getElementById(id).addEventListener('click', onGiveup);
    });
    document.getElementById('btn-back-roulette').addEventListener('click', () => {
      stopAll();
      showScreen('screen-top');
    });
  }
  highlightPlayer();
}

function buildPlayerMarks() {
  const area = document.getElementById('player-marks-area');
  area.innerHTML = '';
  S.players.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.id = `pcard-${i}`;

    const imgSrc = CONFIG.marks[p.mark] || '';
    card.innerHTML = `
      <img class="player-mark-img" src="${imgSrc}" alt="${p.mark}"
           onerror="this.style.display='none';document.getElementById('pmf-${i}').style.display='block';">
      <div id="pmf-${i}" class="player-mark-fallback" style="display:none">${p.mark}</div>
      <div class="player-card-name">${p.name}</div>
      ${makeFigureSVG(i, p.colors)}`;
    area.appendChild(card);
  });
}

function makeFigureSVG(id, c) {
  const lh = COLOR_HEX[c.lh] || '#3a3a4a';
  const rh = COLOR_HEX[c.rh] || '#3a3a4a';
  const lf = COLOR_HEX[c.lf] || '#3a3a4a';
  const rf = COLOR_HEX[c.rf] || '#3a3a4a';
  return `<svg class="player-figure-svg" viewBox="0 0 80 155" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="13" r="11" fill="#FFE4B5" stroke="#c9a870" stroke-width="1.5"/>
    <circle cx="36" cy="10" r="1.5" fill="#4a3728"/>
    <circle cx="44" cy="10" r="1.5" fill="#4a3728"/>
    <path d="M37 16 Q40 19 43 16" stroke="#c08060" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <line x1="40" y1="24" x2="40" y2="83" stroke="#5a6474" stroke-width="5" stroke-linecap="round"/>
    <line x1="40" y1="44" x2="14" y2="70" stroke="#5a6474" stroke-width="5" stroke-linecap="round"/>
    <line x1="40" y1="44" x2="66" y2="70" stroke="#5a6474" stroke-width="5" stroke-linecap="round"/>
    <line x1="40" y1="83" x2="22" y2="131" stroke="#5a6474" stroke-width="5" stroke-linecap="round"/>
    <line x1="40" y1="83" x2="58" y2="131" stroke="#5a6474" stroke-width="5" stroke-linecap="round"/>
    <circle id="p${id}-lh" cx="14" cy="70" r="9" fill="${lh}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <circle id="p${id}-rh" cx="66" cy="70" r="9" fill="${rh}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <circle id="p${id}-lf" cx="22" cy="131" r="9" fill="${lf}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <circle id="p${id}-rf" cx="58" cy="131" r="9" fill="${rf}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
  </svg>`;
}

function setLimbColor(pid, limb, colorKey) {
  if (!colorKey) return;
  S.players[pid].colors[limb] = colorKey;
  const suffix = {leftHand:'lh', rightHand:'rh', leftFoot:'lf', rightFoot:'rf', foot:null}[limb];
  if (!suffix) return;
  const el = document.getElementById(`p${pid}-${suffix}`);
  if (el) el.setAttribute('fill', COLOR_HEX[colorKey] || '#3a3a4a');
}

function highlightPlayer() {
  document.querySelectorAll('.player-card').forEach((el,i) =>
    el.classList.toggle('current-player', i === S.curPlayer));
}

/* ─── Canvas Setup ─── */
let canvas, ctx, wheelR;

function setupCanvas() {
  canvas = document.getElementById('wheel-canvas');
  ctx = canvas.getContext('2d');
  sizeCanvas();
  wRot = 0; prevRot = 0;
  prevSeg = segAtNeedle(0);
  drawWheel();
}

function sizeCanvas() {
  const wa = document.getElementById('wheel-area');
  const btnH = 46, needleH = 28, pad = 16;
  const avail = Math.min(wa.clientWidth - pad*2, wa.clientHeight - btnH - needleH - pad);
  const sz = Math.min(Math.max(avail, 120), 340);
  canvas.width = sz; canvas.height = sz;
  wheelR = sz * 0.45;
}

/* ─── Wheel Drawing ─── */
function drawWheel() {
  const sz = canvas.width, cx = sz/2, cy = sz/2, r = wheelR;
  ctx.clearRect(0, 0, sz, sz);

  /* Glow ring */
  const g = ctx.createRadialGradient(cx,cy,r*0.75,cx,cy,r*1.1);
  g.addColorStop(0,'transparent');
  g.addColorStop(1,'rgba(255,200,80,0.12)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx,cy,r*1.1,0,Math.PI*2); ctx.fill();

  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(wRot*Math.PI/180);

  SEGMENTS.forEach(seg => {
    let s = seg.s, e = seg.e;
    if (e < s) e += 360; // wrap-around (seg 0)
    const sr = (s-90)*Math.PI/180, er = (e-90)*Math.PI/180;

    ctx.beginPath(); ctx.moveTo(0,0);
    ctx.arc(0,0,r,sr,er,false); ctx.closePath();
    ctx.fillStyle = seg.color; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=0.8; ctx.stroke();

    /* Text */
    const midD = s + (e-s)/2;
    const midR = (midD-90)*Math.PI/180;
    const tr = r*0.68;
    ctx.save();
    ctx.translate(Math.cos(midR)*tr, Math.sin(midR)*tr);
    ctx.rotate(midR+Math.PI/2);
    const fsz = Math.max(7, r*0.057);
    ctx.font = `bold ${fsz}px 'Noto Sans JP',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle = seg.tc;
    const t = seg.text;
    if (t.length <= 2) {
      ctx.fillText(t, 0, 0);
    } else if (t.length <= 4) {
      ctx.fillText(t, 0, 0);
    } else {
      const h = Math.ceil(t.length/2);
      ctx.fillText(t.slice(0,h), 0, -fsz*0.62);
      ctx.fillText(t.slice(h),   0,  fsz*0.62);
    }
    ctx.restore();
  });

  /* Pegs (at segment gaps, rotate with wheel) */
  PEGS.forEach(deg => {
    const rad = (deg-90)*Math.PI/180;
    const px = Math.cos(rad)*(r+8), py = Math.sin(rad)*(r+8);
    ctx.beginPath(); ctx.arc(px,py,5.5,0,Math.PI*2);
    ctx.fillStyle='#DEB887'; ctx.fill();
    ctx.strokeStyle='#8B6914'; ctx.lineWidth=1.2; ctx.stroke();
  });

  /* Outer ring */
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
  ctx.strokeStyle='rgba(222,184,135,0.7)'; ctx.lineWidth=3.5; ctx.stroke();

  /* Hub */
  ctx.beginPath(); ctx.arc(0,0,r*0.11,0,Math.PI*2);
  const hg = ctx.createRadialGradient(0,0,0,0,0,r*0.11);
  hg.addColorStop(0,'#FF6B6B'); hg.addColorStop(1,'#cc2222');
  ctx.fillStyle=hg; ctx.fill();
  ctx.beginPath(); ctx.arc(0,0,r*0.055,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fill();

  ctx.restore();
}

/* ─── Spin Logic ─── */
function segAtNeedle(rot) {
  const na = ((360 - rot % 360) % 360 + 360) % 360;
  for (const seg of SEGMENTS) {
    let s=seg.s, e=seg.e;
    if (e < s) {
      if (na >= s || na <= e) return seg.id;
    } else {
      if (na >= s && na <= e) return seg.id;
    }
  }
  return -1; // gap
}

function onSpinBtn() {
  if (S.phase === 'result' || S.phase === 'countdown') return;
  if (!spinning) {
    doStart();
  } else if (!decel) {
    doStop();
  }
}

function doStart() {
  if (spinning) return;
  ensureAudio();
  spinning = true; decel = false;
  wSpeed = 13 + Math.random() * 5;
  S.phase = 'spinning';
  const btn = document.getElementById('spin-btn');
  btn.textContent = '⏹ ストップ';
  btn.classList.add('stop-mode');
  btn.disabled = false;
  setHeader('spinning');
  prevRot = wRot;
  prevSeg = segAtNeedle(wRot);
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(animFrame);
}

function doStop() {
  if (!spinning || decel) return;
  decel = true;
  S.phase = 'decelerating';
  document.getElementById('spin-btn').disabled = true;

  const tidx = weightedSegment();
  const seg = SEGMENTS[tidx];
  let sv = seg.s, ev = seg.e;
  if (ev < sv) ev += 360;
  let center = (sv+ev)/2;
  if (center >= 360) center -= 360;

  const tmod = (360 - center + 360) % 360;
  let delta = (tmod - wRot % 360 + 360) % 360;
  if (delta < 10) delta += 360;

  const speedDps = wSpeed * 60; // deg/s at 60fps
  const minAngle = speedDps * 3.2 / 3;
  while (delta < minAngle) delta += 360;

  dStart = wRot;
  dEnd   = wRot + delta;
  dTime  = performance.now();
  dDur   = Math.min(5500, Math.max(3000, 3 * delta / speedDps * 1000));
}

function animFrame(ts) {
  prevRot = wRot;

  if (decel) {
    const t = Math.min(1, (ts - dTime) / dDur);
    const e = 1 - Math.pow(1-t, 3); // cubic ease-out
    wRot = dStart + (dEnd - dStart) * e;

    if (t >= 1) {
      wRot = dEnd;
      spinning = false; decel = false;
      checkPegs(prevRot, wRot);
      drawWheel();
      onStopped();
      return;
    }
  } else {
    wRot += wSpeed;
  }

  checkPegs(prevRot, wRot);
  drawWheel();
  if (spinning) rafId = requestAnimationFrame(animFrame);
}

function checkPegs(prev, curr) {
  /* 各杭P: triggerRot=(360-P)%360 が prev～curr に含まれるとき発火 */
  for (const peg of PEGS) {
    const tBase = (360 - peg) % 360;
    const k = Math.floor(prev / 360);
    for (let kk = k-1; kk <= k+2; kk++) {
      const t = tBase + 360*kk;
      if (t > prev && t <= curr) { onPeg(); break; }
    }
  }
}

function onPeg() {
  playClick();
  const needle = document.getElementById('needle');
  needle.classList.remove('bounce');
  void needle.offsetWidth;
  needle.classList.add('bounce');
}

function onStopped() {
  S.phase = 'result';
  const sid = segAtNeedle(wRot);
  const seg = sid >= 0 ? SEGMENTS[sid] : SEGMENTS[0];
  S.lastSeg = seg;

  const btn = document.getElementById('spin-btn');
  btn.textContent = '▶ スタート';
  btn.classList.remove('stop-mode');
  btn.disabled = true;

  showResult(seg);
}

function stopAll() {
  spinning = false; decel = false;
  cancelAnimationFrame(rafId);
  clearInterval(S.cdTimer);
}

/* ─── Hidden Probability ─── */
function weightedSegment() {
  const mark = S.players[S.curPlayer].mark;
  let stripP = 0, tickleP = 0;
  if (mark === '♥️' || mark === '♠️') { stripP = 0.20; tickleP = 0.20; }
  else if (mark === '🐾')              { stripP = 0.27; tickleP = 0.27; }

  const r = Math.random();
  if (r < stripP) return 0;
  const tickles = [5, 10, 15];
  if (r < stripP + tickleP) return tickles[Math.floor(Math.random() * tickles.length)];
  const normals = SEGMENTS.filter(s => s.type === 'normal').map(s => s.id);
  return normals[Math.floor(Math.random() * normals.length)];
}

/* ─── Game Logic ─── */
function showResult(seg) {
  const player = S.players[S.curPlayer];
  const ht = document.getElementById('header-text');
  const ha = document.getElementById('header-actions');
  const dk = document.getElementById('btn-dekita');
  const nu = document.getElementById('btn-nuida');
  const cb = document.getElementById('countdown-box');

  ha.classList.remove('hidden');
  cb.classList.add('hidden');
  dk.classList.remove('hidden');
  nu.classList.add('hidden');

  if (seg.type === 'normal') {
    ht.textContent = `${player.name}さん：${LIMB_JA[seg.limb]}を${COLOR_JA[seg.lc]}においてね🎯`;
    S.phase = 'result';
  } else if (seg.type === 'strip') {
    ht.textContent = `🌬️ ${player.name}さん：服を1枚脱いで下さい 🌞`;
    dk.classList.add('hidden');
    nu.classList.remove('hidden');
    S.phase = 'result';
  } else if (seg.type === 'tickle') {
    const others = S.players.map((_,i)=>i).filter(i=>i!==S.curPlayer);
    const opIdx = others.length ? others[Math.floor(Math.random()*others.length)] : -1;
    const op = opIdx >= 0 ? `${S.players[opIdx].name}さんを` : '相手を';
    ht.textContent = `😂 ${player.name}さん：${LIMB_JA[seg.limb]}で${op}10秒くすぐって！😂`;
    ha.classList.add('hidden');
    cb.classList.remove('hidden');
    startCD(10, () => advance());
  }
}

function startCD(sec, cb) {
  S.phase = 'countdown';
  const el = document.getElementById('countdown-num');
  let rem = sec;
  el.textContent = rem;
  clearInterval(S.cdTimer);
  S.cdTimer = setInterval(() => {
    rem--;
    el.textContent = rem;
    if (rem <= 0) { clearInterval(S.cdTimer); cb(); }
  }, 1000);
}

function onDekita() {
  if (S.phase !== 'result') return;
  const seg = S.lastSeg;
  if (seg?.type === 'normal') setLimbColor(S.curPlayer, seg.limb, seg.lc);
  advance();
}

function onGiveup() {
  stopAll();
  openPenalty();
}

function advance() {
  S.curPlayer = (S.curPlayer + 1) % S.players.length;
  highlightPlayer();
  S.phase = 'idle';
  S.lastSeg = null;
  setHeader('idle');
  const btn = document.getElementById('spin-btn');
  btn.disabled = false;
  btn.textContent = '▶ スタート';
  btn.classList.remove('stop-mode');
}

function setHeader(phase) {
  const p = S.players[S.curPlayer];
  document.getElementById('header-text').textContent =
    phase === 'idle' ? (p ? `${p.name}さんの番です！スピンしてね🎯` : 'スタートしてね！')
                     : 'ルーレットを回してね！🎡';
  document.getElementById('header-actions').classList.add('hidden');
  document.getElementById('countdown-box').classList.add('hidden');
}

/* ════════════════════════════
   PENALTY SCREEN
════════════════════════════ */
let chosenPenalty = null;

function openPenalty() {
  S.phase = 'penalty';
  showScreen('screen-penalty');
  const inst = document.getElementById('penalty-instruction-text');
  inst.textContent = '罰ゲームを選択して下さい';
  document.getElementById('penalty-result-text').classList.add('hidden');
  document.getElementById('btn-back-penalty').classList.add('hidden');
  buildCards();
}

/* 罰ゲーム選択ロジック (force100% 対応) */
function pickPenalty() {
  /* force100% チェック */
  for (const [text, info] of Object.entries(AFFILIATE_MAP)) {
    if (info.force100 && S.penalties.includes(text)) {
      return { text, affiliate: info };
    }
  }
  /* ランダム選択 */
  if (!S.penalties.length) return { text: 'なし', affiliate: null };
  const idx = Math.floor(Math.random() * S.penalties.length);
  const text = S.penalties[idx];
  const affiliate = AFFILIATE_MAP[text] || null;
  return { text, affiliate, idx };
}

const CARD_EMOJI = ['🎴','🃏','🀄','🎰','🎲'];

function buildCards() {
  chosenPenalty = pickPenalty();

  const wrap = document.getElementById('penalty-cards-wrap');
  const area = document.getElementById('penalty-cards-area');
  area.innerHTML = '';

  const wSz = wrap.clientWidth || 300;
  const cr = wSz * 0.32;
  const cx = wSz / 2, cy = wSz / 2;
  const cW = 92, cH = 128;

  for (let i = 0; i < 5; i++) {
    const ang = (i/5)*2*Math.PI - Math.PI/2;
    const x = cx + cr*Math.cos(ang);
    const y = cy + cr*Math.sin(ang);

    const card = document.createElement('div');
    card.className = `penalty-card`;
    card.style.left = (x - cW/2) + 'px';
    card.style.top  = (y - cH/2) + 'px';

    card.innerHTML = `
      <div class="card-face card-back card-back-${(i%5)+1}"></div>
      <div class="card-face card-front">
        <div class="card-front-emoji">${CARD_EMOJI[i]}</div>
        <div class="card-front-text">${chosenPenalty.text}</div>
      </div>`;

    const ci = i;
    card.addEventListener('click', () => flipCard(card, ci), {once:true});
    area.appendChild(card);
  }
}

function flipCard(card, idx) {
  card.classList.add('flipped');

  /* Hide other cards after flip animation */
  setTimeout(() => {
    document.querySelectorAll('.penalty-card').forEach((c, i) => {
      if (i !== idx) c.classList.add('vanished');
    });

    document.getElementById('penalty-instruction-text').textContent = chosenPenalty.text;
    document.getElementById('penalty-result-text').textContent = `🎉 ${chosenPenalty.text} 🎉`;
    document.getElementById('penalty-result-text').classList.remove('hidden');

    launchConfetti();

    /* Show back button */
    const backBtn = document.getElementById('btn-back-penalty');
    backBtn.classList.remove('hidden');
    backBtn.onclick = () => {
      removePenalty(chosenPenalty.text);
      syncPenaltyInputs();
      showScreen('screen-top');
    };

    /* Affiliate auto-transition */
    if (chosenPenalty.affiliate) {
      setTimeout(() => openAffiliate(chosenPenalty), 5000);
    }
  }, 750);
}

function removePenalty(text) {
  const idx = S.penalties.indexOf(text);
  if (idx < 0) return;
  /* 書き換え候補があれば置換、なければ削除 */
  const replacements = ['みんなが罰ゲーム','美味しい食事をおごる','お店を持った気分で夢を語る'];
  const unused = replacements.find(r => !S.penalties.includes(r));
  if (unused) S.penalties[idx] = unused;
  else S.penalties.splice(idx, 1);
}

function syncPenaltyInputs() {
  document.querySelectorAll('.penalty-input').forEach((el, i) => {
    el.value = S.penalties[i] || '';
  });
}

/* ════════════════════════════
   AFFILIATE SCREEN
════════════════════════════ */
function openAffiliate(penalty) {
  const info = penalty.affiliate;
  if (!info) return;
  document.getElementById('affiliate-title').textContent = info.title;
  document.getElementById('affiliate-qr').src = CONFIG.qr[info.qr];
  document.getElementById('affiliate-link').href = CONFIG.links[info.link];

  document.getElementById('btn-back-affiliate').onclick = () => {
    removePenalty(penalty.text);
    syncPenaltyInputs();
    showScreen('screen-top');
  };

  showScreen('screen-affiliate');
}

/* ════════════════════════════
   CONFETTI
════════════════════════════ */
function launchConfetti() {
  const cnv = document.getElementById('confetti-canvas');
  const cc  = cnv.getContext('2d');
  cnv.width  = window.innerWidth;
  cnv.height = window.innerHeight;
  cnv.style.display = 'block';

  const colors = ['#FF6B6B','#FFD700','#4CAF50','#2196F3','#FF69B4','#9C27B0','#FF9800'];
  const ps = [];

  /* 画面下部の左右から上部中央へ */
  for (let i = 0; i < 130; i++) {
    ps.push({
      x: Math.random() * window.innerWidth * 0.3,
      y: window.innerHeight,
      vx: 6 + Math.random()*10,
      vy: -(14+Math.random()*14),
      color: colors[i%colors.length],
      w: 7+Math.random()*9, h: 4+Math.random()*5,
      rot: Math.random()*360, rv: (Math.random()-.5)*9,
    });
    ps.push({
      x: window.innerWidth - Math.random()*window.innerWidth*0.3,
      y: window.innerHeight,
      vx: -(6+Math.random()*10),
      vy: -(14+Math.random()*14),
      color: colors[(i+3)%colors.length],
      w: 7+Math.random()*9, h: 4+Math.random()*5,
      rot: Math.random()*360, rv: (Math.random()-.5)*9,
    });
  }

  let fr = 0;
  (function tick() {
    cc.clearRect(0,0,cnv.width,cnv.height);
    let alive = false;
    ps.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.38; p.vx *= 0.985;
      p.rot += p.rv;
      if (p.y < cnv.height + 60) alive = true;
      cc.save();
      cc.translate(p.x, p.y);
      cc.rotate(p.rot*Math.PI/180);
      cc.globalAlpha = Math.max(0, 1 - fr/160);
      cc.fillStyle = p.color;
      cc.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      cc.restore();
    });
    fr++;
    if (alive && fr < 200) requestAnimationFrame(tick);
    else cnv.style.display = 'none';
  })();
}

/* ════════════════════════════
   VOICE RECOGNITION
════════════════════════════ */
let recog = null, voiceOn = false;

function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  recog = new SR();
  recog.lang = 'ja-JP';
  recog.continuous = true;
  recog.interimResults = true;
  recog.onresult = e => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      handleVoice(e.results[i][0].transcript);
    }
  };
  recog.onerror = () => {};
  recog.onend = () => { if (voiceOn) try { recog.start(); } catch(_){} };
  try { recog.start(); voiceOn = true; } catch(_){}
  document.getElementById('voice-status').classList.remove('hidden');
  initMicHearts();
}

function handleVoice(txt) {
  if (/スタート|すたーと/i.test(txt)) {
    if (!spinning && (S.phase === 'idle' || S.phase === 'top')) doStart();
  }
  if (/ストップ|すとっぷ|止まれ/i.test(txt)) {
    if (spinning && !decel) doStop();
  }
  if (/出来た|できた|オッケー|ok/i.test(txt)) {
    if (S.phase === 'result') onDekita();
  }
  if (/ギブアップ|ぎぶ/i.test(txt)) {
    onGiveup();
  }
}

/* ════════════════════════════
   HEART ANIMATION (マイク連動)
════════════════════════════ */
let micAna = null;

function initMicHearts() {
  if (!navigator.mediaDevices) return;
  navigator.mediaDevices.getUserMedia({audio:true, video:false})
    .then(stream => {
      ensureAudio();
      const src = audioCtx.createMediaStreamSource(stream);
      micAna = audioCtx.createAnalyser();
      micAna.fftSize = 512;
      src.connect(micAna);
      setInterval(analyzeVoice, 90);
    })
    .catch(()=>{});
}

function analyzeVoice() {
  if (!micAna) return;
  const data = new Uint8Array(micAna.frequencyBinCount);
  micAna.getByteFrequencyData(data);

  let sum = 0;
  for (const v of data) sum += v;
  const vol = sum / data.length;
  if (vol < 12) return;

  /* Dominant frequency = pitch */
  let mx = 0, mxI = 1;
  for (let i = 2; i < data.length; i++) { if (data[i]>mx) { mx=data[i]; mxI=i; } }
  const pitch = mxI * (audioCtx.sampleRate / (micAna.fftSize * 2));

  spawnHeart(vol, pitch);
}

function spawnHeart(vol, pitch) {
  const cont = document.getElementById('hearts-overlay');
  if (!cont) return;
  if (cont.children.length > 25) cont.firstChild?.remove();

  /* 声の大きさ → サイズ */
  const sz = Math.max(18, Math.min(76, vol * 1.6));
  /* 声のピッチ → 色: 高い=白ピンク系, 低い=濃い紫系 */
  let color;
  if (pitch > 280) {
    const t = Math.min(1, (pitch-280)/600);
    color = `hsl(${330+t*28}, ${100-t*50}%, ${55+t*42}%)`;
  } else {
    const t = Math.min(1, (280-pitch)/220);
    color = `hsl(${280-t*55}, 75%, ${48-t*28}%)`;
  }

  const h = document.createElement('div');
  h.className = 'heart-particle';
  h.textContent = '♡';
  const dur = (1.6 + Math.random()*0.9).toFixed(2);
  const lft = (8 + Math.random()*84).toFixed(1);
  const r0 = ((Math.random()-.5)*30).toFixed(1);
  const r1 = ((Math.random()-.5)*40).toFixed(1);
  const r2 = ((Math.random()-.5)*20).toFixed(1);
  const sm = (1+Math.random()*0.3).toFixed(2);
  h.style.cssText = `font-size:${sz}px;color:${color};left:${lft}vw;
    --dur:${dur}s;--r0:${r0}deg;--r1:${r1}deg;--r2:${r2}deg;--sm:${sm};
    filter:drop-shadow(0 0 ${(sz*0.25).toFixed(0)}px ${color});`;
  cont.appendChild(h);
  setTimeout(() => h.remove(), dur*1000+200);
}

/* ════════════════════════════
   INIT
════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initTop();
  showScreen('screen-top');

  /* canvas resize */
  window.addEventListener('resize', () => {
    if (document.getElementById('screen-roulette').classList.contains('active')) {
      sizeCanvas(); drawWheel();
    }
  });
});
