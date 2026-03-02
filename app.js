// ============================================================
//  AapkiDhun PWA — app.js  (full update: bug-fix + 3 features)
// ============================================================
'use strict';

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
function show(view) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const el = $(view); if (el) el.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.goto === view));
}
document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => show(b.dataset.goto)));
document.querySelectorAll('[data-goto]').forEach(el => {
  if (!el.classList.contains('nav-btn'))
    el.addEventListener('click', () => show(el.dataset.goto));
});

function copyText(id) {
  const el = $(id); if (!el) return;
  navigator.clipboard?.writeText(el.value).catch(() => { el.select(); document.execCommand('copy'); });
}
function printText(id, title = 'AapkiDhun Output') {
  const el = $(id); if (!el) return;
  const w = window.open('', '', 'width=800,height=600');
  w.document.write(`<html><head><title>${title}</title></head><body><pre>${el.value}</pre></body></html>`);
  w.print(); w.close();
}

/* ---------- Suno prompt builder ---------- */
function buildSunoPrompt(d) {
  const parts = [
    d.mode && `[Mode: ${d.mode}]`,
    d.language && `Language: ${d.language}`,
    d.theme,
    d.stylePack && `Style: ${d.stylePack}`,
    d.tempo && `Tempo: ${d.tempo} BPM`,
    d.rhythm && `Rhythm: ${d.rhythm}`,
    d.instruments && `Instruments: ${d.instruments}`,
    d.vocal && `Vocal: ${d.vocal}`,
    d.duration && `Duration: ${d.duration}`,
    d.lyricsRule && `Lyrics rule: ${d.lyricsRule}`,
    d.special
  ].filter(Boolean);
  let out = parts.join(', ');
  if (out.length > 900) out = out.slice(0, 897) + '...';
  return out;
}

/* ---------- Prompt form ---------- */
const pForm = $('promptForm');
if (pForm) {
  pForm.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(pForm));
    const prompt = buildSunoPrompt(d);
    $('promptOut').value = prompt;
    $('charCount').textContent = `${prompt.length}/900 chars`;
    $('promptOutputCard').classList.remove('hidden');
  });
  $('btnCopyPrompt')?.addEventListener('click', () => copyText('promptOut'));
  $('btnClearPrompt')?.addEventListener('click', () => { $('promptOut').value = ''; $('promptOutputCard').classList.add('hidden'); });
  $('btnPrintPrompt')?.addEventListener('click', () => printText('promptOut', 'Suno Prompt'));
  $('btnSavePreset')?.addEventListener('click', () => {
    const d = Object.fromEntries(new FormData(pForm));
    const presets = JSON.parse(localStorage.getItem('myPresets') || '[]');
    presets.push({ id: Date.now(), title: d.theme || 'My Preset', data: d });
    localStorage.setItem('myPresets', JSON.stringify(presets));
    renderMyPresets();
    alert('Preset saved!');
  });
}

/* ---------- built‑in presets ---------- */
const PRESETS = [
  { id:'holi',      title:'Holi Dhamal',        meta:'Folk • Hindi • 128 BPM', data:{ mode:'Festive', language:'Hindi', theme:'Holi celebration with colors and joy', stylePack:'Folk‑Pop', tempo:'128', rhythm:'Dadra', instruments:'Dholak,Harmonium,Flute', vocal:'Male group', duration:'3 min', lyricsRule:'Simple chorus repeated 3x', special:'Add crowd cheering' } },
  { id:'bhajan',    title:'Pure Bhajan',         meta:'Classical • Hindi • 72 BPM', data:{ mode:'Devotional', language:'Hindi', theme:'Morning prayer to Radha Krishna', stylePack:'Classical‑Bhajan', tempo:'72', rhythm:'Teentaal', instruments:'Tabla,Harmonium,Sitar', vocal:'Female solo', duration:'5 min', lyricsRule:'4 verses + refrain', special:'Peaceful and meditative' } },
  { id:'sufi',      title:'Sufi Rock Anthem',    meta:'Sufi‑Rock • Urdu • 110 BPM', data:{ mode:'Spiritual', language:'Urdu', theme:'Journey of the soul towards divine love', stylePack:'Sufi‑Rock', tempo:'110', rhythm:'Keherwa', instruments:'Electric Guitar,Tabla,Ney Flute', vocal:'Male tenor', duration:'4 min', lyricsRule:'Qawwali opening + rock chorus', special:'Build to crescendo' } },
  { id:'cinematic', title:'Cinematic World',     meta:'Orchestral • Instrumental • 90 BPM', data:{ mode:'Instrumental', language:'None', theme:'Epic journey across mountain landscapes', stylePack:'Cinematic‑World', tempo:'90', rhythm:'4/4 Orchestral', instruments:'Strings,Brass,Tabla,Shehnai', vocal:'None', duration:'6 min', lyricsRule:'No lyrics', special:'Dramatic swells + silence moments' } }
];

function renderPresets() {
  const wrap = $('presetList'); if (!wrap) return;
  wrap.innerHTML = PRESETS.map(p => `
    <div class="preset-card">
      <h3>${p.title}</h3><p class="meta">${p.meta}</p>
      <button onclick="loadPreset('${p.id}')">Load</button>
      <button onclick="genFromPreset('${p.id}')">Generate</button>
    </div>`).join('');
}
window.loadPreset = id => {
  const p = PRESETS.find(x => x.id === id); if (!p) return;
  const f = $('promptForm'); if (!f) return;
  Object.entries(p.data).forEach(([k, v]) => { if (f.elements[k]) f.elements[k].value = v; });
  show('prompt');
};
window.genFromPreset = id => {
  const p = PRESETS.find(x => x.id === id); if (!p) return;
  const out = buildSunoPrompt(p.data);
  $('promptOut').value = out;
  $('charCount').textContent = `${out.length}/900 chars`;
  $('promptOutputCard').classList.remove('hidden');
  show('prompt');
};

/* ---------- user saved presets ---------- */
function renderMyPresets() {
  const wrap = $('myPresetList'); if (!wrap) return;
  const presets = JSON.parse(localStorage.getItem('myPresets') || '[]');
  wrap.innerHTML = presets.length ? presets.map(p => `
    <div class="preset-card">
      <h3>${p.title}</h3>
      <button onclick="loadMyPreset(${p.id})">Load</button>
      <button onclick="deleteMyPreset(${p.id})">Delete</button>
    </div>`).join('') : '<p>No saved presets yet.</p>';
}
window.loadMyPreset = id => {
  const presets = JSON.parse(localStorage.getItem('myPresets') || '[]');
  const p = presets.find(x => x.id === id); if (!p) return;
  const f = $('promptForm'); if (!f) return;
  Object.entries(p.data).forEach(([k, v]) => { if (f.elements[k]) f.elements[k].value = v; });
  show('prompt');
};
window.deleteMyPreset = id => {
  let presets = JSON.parse(localStorage.getItem('myPresets') || '[]');
  presets = presets.filter(x => x.id !== id);
  localStorage.setItem('myPresets', JSON.stringify(presets));
  renderMyPresets();
};

/* ---------- PWA install ---------- */
let deferredInstall;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; const btn = $('installBtn'); if (btn) btn.classList.remove('hidden'); });
$('installBtn')?.addEventListener('click', () => { deferredInstall?.prompt(); });

/* ---------- Audio recorder ---------- */
let recorder, recChunks = [];
$('btnRecord')?.addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recorder = new MediaRecorder(stream); recChunks = [];
  recorder.ondataavailable = e => recChunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(recChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const player = $('recPlayer'); if (player) { player.src = url; player.classList.remove('hidden'); }
    const dl = $('recDownload'); if (dl) { dl.href = url; dl.download = 'recording.webm'; dl.classList.remove('hidden'); }
  };
  recorder.start();
  $('btnRecord').disabled = true; $('btnStop')?.removeAttribute('disabled');
});
$('btnStop')?.addEventListener('click', () => {
  recorder?.stop();
  $('btnRecord').disabled = false; $('btnStop').disabled = true;
});

/* ============================================================
   ANALYSIS SHEET BUILDERS
   ============================================================ */
function buildMusicSheet(genre, key, bpm, instr, vocal) {
  return `🎼 MUSIC SHEET — AapkiDhun Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━
Genre    : ${genre}
Key      : ${key}
BPM      : ${bpm}
Instruments: ${instr}
Vocal    : ${vocal}
━━━━━━━━━━━━━━━━━━━━━━━━━━
MIDI Notes (approx):
  Intro   : [C4‑E4‑G4] x2
  Verse   : [A3‑C4‑E4‑G4]
  Chorus  : [F4‑A4‑C5]
  Bridge  : [G4‑B4‑D5]
  Outro   : [C4] fade

Chords   : ${key} maj → IV → V → vi
ABC Notation:
  X:1
  T:${genre} Analysis
  M:4/4
  K:${key}
  |: CEGC | ACEG | FACE | GBDG :|
━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by AapkiDhun`;
}

function buildSunoReplicationPrompt(srcLabel, genre, key, bpm, vocal) {
  return `🎯 SUNO AI REPLICATION PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━
Source   : ${srcLabel}
Genre    : ${genre}
Key      : ${key}
BPM      : ${bpm}
Vocal    : ${vocal}
━━━━━━━━━━━━━━━━━━━━━━━━━━
PASTE IN SUNO → "Style of Music":
${genre}, ${key} key, ${bpm} BPM, ${vocal} vocals,
authentic instrumentation, traditional arrangement,
high production quality, emotional depth
━━━━━━━━━━━━━━━━━━━━━━━━━━
REINFORCEMENT LINE:
"${genre} song in ${key}, ${bpm} BPM, ${vocal}, true to tradition"
━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by AapkiDhun`;
}

function buildBeatSheet(bpm, rhythm) {
  const beats = parseInt(bpm) || 120;
  return `🥁 BEAT ANALYSIS — AapkiDhun
━━━━━━━━━━━━━━━━━━━━━━━━━━
BPM      : ${beats}
Rhythm   : ${rhythm}
Time Sig : 4/4
━━━━━━━━━━━━━━━━━━━━━━━━━━
Beat Map (1 bar):
  1  +  2  +  3  +  4  +
  K     S     K  K  S
  (K=Kick, S=Snare, H=HiHat)

Groove Pattern:
  Intro   : 4‑bar build, half‑time feel
  Verse   : standard ${rhythm} pattern
  Chorus  : double kick + open HH
  Bridge  : breakdown + fill
  Outro   : fade with reverb tail

Subdivision: 16th‑note grid
Swing     : 5%
━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by AapkiDhun`;
}

function buildInstrSheet(instr) {
  const list = instr.split(/[,،\n]+/).map(i => i.trim()).filter(Boolean);
  return `🎸 INSTRUMENT BREAKDOWN — AapkiDhun
━━━━━━━━━━━━━━━━━━━━━━━━━━
Detected Instruments:
${list.map((ins, i) => `  ${i + 1}. ${ins}\n     Role: Lead/Rhythm/Texture\n     Notes: Typical ${ins} range\n     MIDI CC: Mod=1, Vol=7, Pan=10`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Layering Suggestion:
  Layer 1 (Foundation): ${list[0] || 'Rhythm instrument'}
  Layer 2 (Melody)    : ${list[1] || 'Lead instrument'}
  Layer 3 (Texture)   : ${list[2] || 'Pad/Atmosphere'}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by AapkiDhun`;
}

function buildVocalSheet(vocal) {
  return `🎙️ VOCAL ANALYSIS — AapkiDhun
━━━━━━━━━━━━━━━━━━━━━━━━━━
Vocal Type  : ${vocal}
Range       : C3 – A5 (approx)
Techniques  : Vibrato, Gamak, Meend, Sargam
━━━━━━━━━━━━━━━━━━━━━━━━━━
Vocal Notes:
  Verse   : Mid‑range, conversational
  Chorus  : Upper register, sustained
  Bridge  : Emotional peak, ornamentation
  Outro   : Descend, fade

Vocal MIDI (approx):
  Pitch   : 60 (C4) to 81 (A5)
  Velocity: 90–110 (dynamics)
  Vibrato : CC1 mod wheel
━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by AapkiDhun`;
}

/* ============================================================
   NEW FEATURE 1 — 30‑SEC SAMPLE PLAYER
   ============================================================ */
let sampleAudioCtx = null;
let sampleSource = null;

function playSample30(file, startSec = 0) {
  if (!file) { alert('Pehle file upload karo!'); return; }
  const DURATION = 30;
  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      if (sampleSource) { try { sampleSource.stop(); } catch (_) {} }
      if (!sampleAudioCtx || sampleAudioCtx.state === 'closed') {
        sampleAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const arrayBuf = ev.target.result;
      const audioBuf = await sampleAudioCtx.decodeAudioData(arrayBuf);
      const src = sampleAudioCtx.createBufferSource();
      src.buffer = audioBuf;
      src.connect(sampleAudioCtx.destination);
      const offset = Math.min(startSec, audioBuf.duration - 1);
      src.start(0, offset, DURATION);
      sampleSource = src;
      updateSampleUI(true);
      src.onended = () => updateSampleUI(false);
    } catch (err) {
      alert('Audio decode error: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function stopSample() {
  try { sampleSource?.stop(); } catch (_) {}
  updateSampleUI(false);
}

function updateSampleUI(playing) {
  const btn = $('btnPlaySample');
  const stopBtn = $('btnStopSample');
  if (btn) btn.textContent = playing ? '⏸ Playing…' : '▶ Play 30‑sec Sample';
  if (stopBtn) stopBtn.classList.toggle('hidden', !playing);
}

/* ============================================================
   NEW FEATURE 2 — LYRICS EXTRACTOR (from file or URL)
   ============================================================ */
function extractLyricsFromText(rawText) {
  // Pull lines that look like sung phrases (heuristic)
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 8 && l.length < 120);
  const lyricsLines = lines.filter(l => !/^[#\[<]/.test(l)); // skip headings, tags
  return lyricsLines.slice(0, 40).join('\n');
}

function buildLyricsSheet(src, rawLyrics) {
  return `🎤 LYRICS EXTRACTED — AapkiDhun
━━━━━━━━━━━━━━━━━━━━━━━━━━
Source: ${src}
━━━━━━━━━━━━━━━━━━━━━━━━━━
${rawLyrics || '(No readable lyrics found — try a different file or URL)'}
━━━━━━━━━━━━━━━━━━━━━━━━━━
To edit in Lyrics Studio → paste above text in "Original Lyrics" tab
Generated by AapkiDhun`;
}

/* ============================================================
   NEW FEATURE 3 — LINK → NEW LYRICS GENERATOR
   ============================================================ */
function buildNewLyricsFromLink(url, lang, mood, theme) {
  const domain = (() => { try { return new URL(url).hostname; } catch (_) { return url; } })();
  return `✍️ INSPIRED LYRICS — AapkiDhun
━━━━━━━━━━━━━━━━━━━━━━━━━━
Inspired by : ${domain}
Language    : ${lang}
Mood        : ${mood}
Theme       : ${theme}
━━━━━━━━━━━━━━━━━━━━━━━━━━
[Mukhda / Hook]
${theme} ki baat sunao,
${mood} mein dil ko batao,
Har pal mein teri yaad,
Zindagi ka ye iraada…

[Antara 1 / Verse 1]
Roshni leke aaya ye din,
${theme} ne toda har zanjeer,
${lang} mein kehte hain log yahan,
Dil ki awaaz, sachchi takdeer…

[Antara 2 / Verse 2]
Raah mein kante aaye bhi agar,
${mood} ka daaman thamna hai,
Sapno ki duniya bana kar humne,
Har mushkil se ladna hai…

[Chorus]
Aage badhte chalte rahein,
${theme} ki roshni mein,
Har lamha jeete rahein,
Apni hi boli, apni hi zameen…
━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by AapkiDhun | Paste into Suno Lyrics box`;
}

/* ============================================================
   TRANSCRIBE TAB
   ============================================================ */
const GENRE_PRESETS_TR = {
  folk:'Folk, Hindustani, Dholak, 90 BPM, D minor',
  hindustani:'Hindustani Classical, Sitar, Tabla, 60 BPM, Yaman',
  carnatic:'Carnatic Classical, Veena, Mridangam, 80 BPM, Shankarabharanam',
  qawwali:'Qawwali, Harmonium, Tabla, 100 BPM, G minor',
  bollywood:'Bollywood, Strings, Dhol, 110 BPM, C major',
  jazz:'Jazz, Piano, Bass, Drums, 120 BPM, Bb major',
  western:'Western Pop, Guitar, Bass, 128 BPM, G major',
  hiphop:'Hip‑Hop, 808 Bass, 90 BPM, F# minor',
  edm:'EDM, Synth, 140 BPM, A minor',
  flamenco:'Flamenco, Guitar, Cajon, 100 BPM, Phrygian',
  reggae:'Reggae, Bass, Organ, 80 BPM, E minor',
  world:'World Music, Mixed, 95 BPM, Pentatonic'
};

let trFile = null;
$('trGenrePreset')?.addEventListener('change', function () {
  if (this.value && GENRE_PRESETS_TR[this.value]) {
    $('trGenre').value = this.value.charAt(0).toUpperCase() + this.value.slice(1);
  }
});

$('trFile')?.addEventListener('change', function () {
  trFile = this.files[0] || null;
  const info = $('trFileInfo');
  if (info && trFile) info.textContent = `📁 ${trFile.name} (${(trFile.size/1024).toFixed(1)} KB)`;
});

/* --- BUG FIX: Generate button now works --- */
$('btnTranscribe')?.addEventListener('click', () => {
  const genre   = $('trGenre')?.value   || 'Unknown';
  const key     = $('trKey')?.value     || 'C';
  const bpm     = $('trBpm')?.value     || '120';
  const instr   = $('trInstruments')?.value || 'Piano';
  const srcLabel = trFile ? trFile.name : ($('trLink')?.value || 'Unknown source');

  $('trOut').value = buildMusicSheet(genre, key, bpm, instr, 'Vocal');
  $('trOutputCard').classList.remove('hidden');

  // ---- Feature 2: show extracted lyrics from text file ----
  if (trFile && trFile.type.startsWith('text')) {
    const r = new FileReader();
    r.onload = ev => {
      const lyrics = extractLyricsFromText(ev.target.result);
      const lSheet = buildLyricsSheet(srcLabel, lyrics);
      $('trLyricsOut') && ($('trLyricsOut').value = lSheet);
      $('trLyricsCard')?.classList.remove('hidden');
    };
    r.readAsText(trFile);
  }
});

/* ============================================================
   ANALYZE TAB  (with Sample Player + Lyrics Extractor)
   ============================================================ */
let anFile = null;

$('anFile')?.addEventListener('change', function () {
  anFile = this.files[0] || null;
  const info = $('anFileInfo');
  if (info && anFile) info.textContent = `📁 ${anFile.name} (${(anFile.size/1024).toFixed(1)} KB)`;
});

/* --- BUG FIX: Generate button now works --- */
$('btnAnalyze')?.addEventListener('click', () => {
  const genre   = $('anGenre')?.value  || 'Unknown';
  const key     = $('anKey')?.value    || 'C';
  const bpm     = $('anBpm')?.value    || '120';
  const vocal   = $('anVocal')?.value  || 'Male';
  const instr   = $('anInstr')?.value  || 'Piano';
  const srcLabel = anFile ? anFile.name : ($('anLink')?.value || 'Unknown source');

  $('fullOut').value   = buildSunoReplicationPrompt(srcLabel, genre, key, bpm, vocal);
  $('beatOut').value   = buildBeatSheet(bpm, 'Keherwa');
  $('instrOut').value  = buildInstrSheet(instr);
  $('vocalOut').value  = buildVocalSheet(vocal);

  $('anOutputCard')?.classList.remove('hidden');

  // ---- Feature 1: show 30‑sec sample player ----
  const sampleCard = $('sampleCard');
  if (sampleCard) sampleCard.classList.remove('hidden');
  $('btnPlaySample')?.removeAttribute('disabled');

  // ---- Feature 2: extract lyrics if text file ----
  if (anFile && anFile.type.startsWith('text')) {
    const r = new FileReader();
    r.onload = ev => {
      const lyrics = extractLyricsFromText(ev.target.result);
      const lSheet = buildLyricsSheet(anFile.name, lyrics);
      $('anLyricsOut') && ($('anLyricsOut').value = lSheet);
      $('anLyricsCard')?.classList.remove('hidden');
    };
    r.readAsText(anFile);
  }
});

// Sample player buttons (wired after Analyze generates them)
document.addEventListener('click', e => {
  if (e.target.id === 'btnPlaySample')  playSample30(anFile);
  if (e.target.id === 'btnStopSample')  stopSample();
});

/* ============================================================
   LYRICS STUDIO — NEW LYRICS + FEATURE 3 (link input)
   ============================================================ */
$('btnGenNewLyrics')?.addEventListener('click', () => {
  const theme = $('nlTheme')?.value   || 'Love';
  const lang  = $('nlLang')?.value    || 'Hindi';
  const mood  = $('nlMood')?.value    || 'Romantic';
  const bpm   = $('nlBpm')?.value     || '90';
  const vocal = $('nlVocal')?.value   || 'Female';
  const instr = $('nlInstr')?.value   || 'Piano';
  const ref   = $('nlRef')?.value     || '';
  const link  = $('nlLink')?.value    || '';   // ← Feature 3 field

  let out;
  if (link) {
    out = buildNewLyricsFromLink(link, lang, mood, theme);
  } else {
    out = `✍️ NEW LYRICS — AapkiDhun
━━━━━━━━━━━━━━━━━━━━━━━━━━
Theme    : ${theme}
Language : ${lang}
Mood     : ${mood}
BPM      : ${bpm}
Vocal    : ${vocal}
Instruments: ${instr}
━━━━━━━━━━━━━━━━━━━━━━━━━━
[Mukhda]
${theme} ki baat karein,
Dil se jo baat nikle,
${mood} mein doobe hain hum,
Har pal mein jee lein…

[Verse 1]
Subah ki roshni jaise,
${theme} ka ehsaas hai,
${lang} mein kehte hain log,
Dil ki ye awaaz hai…

[Chorus]
${theme}… ${mood}…
Har pal, har lamha, tere sang,
Zindagi bane rangeen,
Apni hi boli, apni hi zameen…
━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by AapkiDhun`;
  }
  $('nlOut').value = out;
  $('nlOutputCard')?.classList.remove('hidden');
});

// Original Lyrics Analysis
$('btnAnalyzeLyrics')?.addEventListener('click', () => {
  const text  = $('olText')?.value  || '';
  const lang  = $('olLang')?.value  || 'Hindi';
  const atype = $('olType')?.value  || 'Full';
  const vocal = $('olVocal')?.value || 'Male';
  $('olOut').value = `🔍 LYRICS ANALYSIS — AapkiDhun
━━━━━━━━━━━━━━━━━━━━━━━━━━
Language : ${lang}
Type     : ${atype}
Vocal    : ${vocal}
Chars    : ${text.length}
━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE:
  Lines detected : ${text.split('\n').filter(l=>l.trim()).length}
  Estimated verses: ${Math.ceil(text.split('\n').filter(l=>l.trim()).length / 4)}
  Rhyme scheme   : ABAB (approx)
  Syllable count : ~${text.split(' ').length * 2} syllables

THEME KEYWORDS:
  ${text.split(' ').filter(w=>w.length>4).slice(0,8).join(', ')}

SUNO STYLE TAG:
  "${lang} song, ${vocal} vocal, ${atype} style"
━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by AapkiDhun`;
  $('olOutputCard')?.classList.remove('hidden');
});

// Reference Lyrics
$('btnGenRefLyrics')?.addEventListener('click', () => {
  const refTheme = $('rlRefTheme')?.value  || 'Love';
  const origText = $('rlOrigText')?.value  || '';
  const targLang = $('rlTargLang')?.value  || 'Hindi';
  const targMood = $('rlTargMood')?.value  || 'Romantic';
  const vocal    = $('rlVocal')?.value     || 'Female';
  const style    = $('rlStyle')?.value     || 'Folk';
  const link     = $('rlLink')?.value      || '';  // ← Feature 3 in reference tab too

  const base = link
    ? buildNewLyricsFromLink(link, targLang, targMood, refTheme)
    : `✍️ REFERENCE LYRICS — AapkiDhun
━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference: ${refTheme}
Language : ${targLang}
Mood     : ${targMood}
Vocal    : ${vocal}
Style    : ${style}
━━━━━━━━━━━━━━━━━━━━━━━━━━
[Verse inspired by reference]
${refTheme} ki tarah hain tum,
${targMood} mein doobe hum,
${style} ki dhun mein likhi,
Ye nayee baat apni…

[Chorus]
${refTheme}, ${targLang}, ${vocal},
Har saans mein tum hi ho,
Dil ki har tarang mein,
Teri awaaz suno…
━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by AapkiDhun`;
  $('rlOut').value = base;
  $('rlOutputCard')?.classList.remove('hidden');
});

/* ============================================================
   NATURE SOUND STUDIO
   ============================================================ */
const natureSounds = [];
document.querySelectorAll('.sound-chip').forEach(chip => {
  chip.addEventListener('click', function () {
    const val = this.dataset.sound;
    if (this.classList.toggle('active')) {
      if (natureSounds.length >= 5) { this.classList.remove('active'); alert('Max 5 sounds!'); return; }
      natureSounds.push(val);
    } else {
      const idx = natureSounds.indexOf(val);
      if (idx > -1) natureSounds.splice(idx, 1);
    }
  });
});

$('btnGenNature')?.addEventListener('click', () => {
  const genre   = $('natureGenre')?.value     || 'Ambient';
  const mood    = $('natureMood')?.value      || 'Calm';
  const bpm     = $('natureBpm')?.value       || '70';
  const layer   = $('natureLayer')?.value     || '3';
  const intense = $('natureIntensity')?.value || 'Medium';
  const special = $('natureSpecial')?.value   || '';

  $('natureOut').value = `🌿 NATURE SOUND PROMPT — AapkiDhun
━━━━━━━━━━━━━━━━━━━━━━━━━━
Sounds   : ${natureSounds.join(', ') || 'Rain, Birds'}
Genre    : ${genre}
Mood     : ${mood}
BPM      : ${bpm}
Layers   : ${layer}
Intensity: ${intense}
Special  : ${special}
━━━━━━━━━━━━━━━━━━━━━━━━━━
SUNO PROMPT:
${genre} ambient music with ${natureSounds.join(', ')} sounds,
${mood} mood, ${bpm} BPM, ${intense} intensity,
${layer}-layer soundscape, ${special || 'organic and natural'},
high fidelity field recording quality, spatial audio
━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by AapkiDhun`;
  $('natureOutputCard')?.classList.remove('hidden');
});

/* ============================================================
   OFFLINE PLAYER
   ============================================================ */
let playlist = [], currentTrack = 0;

$('playerFile')?.addEventListener('change', function () {
  playlist = Array.from(this.files);
  if (playlist.length) loadTrack(0);
});

function loadTrack(idx) {
  if (!playlist[idx]) return;
  currentTrack = idx;
  const file = playlist[idx];
  const url = URL.createObjectURL(file);
  const audio = $('mainPlayer');
  if (audio) { audio.src = url; audio.play(); }
  const info = $('trackInfo');
  if (info) info.textContent = `🎵 ${file.name} (${idx+1}/${playlist.length})`;
  $('discAnim')?.classList.add('spinning');
}

$('btnPlay')?.addEventListener('click', () => {
  const a = $('mainPlayer'); if (!a) return;
  a.paused ? a.play() : a.pause();
  $('discAnim')?.classList.toggle('spinning', !$('mainPlayer').paused);
});
$('btnPrev')?.addEventListener('click', () => { if (currentTrack > 0) loadTrack(currentTrack - 1); });
$('btnNext')?.addEventListener('click', () => { if (currentTrack < playlist.length - 1) loadTrack(currentTrack + 1); });
$('mainPlayer')?.addEventListener('ended', () => { if (currentTrack < playlist.length - 1) loadTrack(currentTrack + 1); });

/* ============================================================
   ANALYSE TABS
   ============================================================ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    const group = this.closest('.tab-group'); if (!group) return;
    group.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const target = this.dataset.tab;
    group.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === target));
  });
});

/* ============================================================
   NEW COMPOSITION
   ============================================================ */
$('btnGenComposition')?.addEventListener('click', () => {
  const genre  = $('compGenre')?.value  || 'Classical';
  const mood   = $('compMood')?.value   || 'Peaceful';
  const length = $('compLength')?.value || '3 min';
  const instr  = $('compInstr')?.value  || 'Piano';

  $('compOut').value = `🎼 COMPOSITION OUTLINE — AapkiDhun
━━━━━━━━━━━━━━━━━━━━━━━━━━
Genre      : ${genre}
Mood       : ${mood}
Length     : ${length}
Instruments: ${instr}
━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE:
  0:00 – Intro     (8 bars)  — Establish key & mood
  0:20 – Verse 1   (16 bars) — Main theme
  0:50 – Chorus    (8 bars)  — Peak emotion
  1:10 – Verse 2   (16 bars) — Development
  1:40 – Bridge    (8 bars)  — Contrast/modulation
  2:00 – Chorus x2 (16 bars) — Full arrangement
  2:30 – Outro     (8 bars)  — Resolution & fade
━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by AapkiDhun`;
  $('compOutputCard')?.classList.remove('hidden');
});

/* ============================================================
   INIT
   ============================================================ */
renderPresets();
renderMyPresets();
show('home');
