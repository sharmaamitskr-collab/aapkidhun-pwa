'use strict';
const $ = id => document.getElementById(id);
const views = ['home','prompt','presets','recorder','transcribe','analyze','lyrics','nature','player','help'];

function show(v) {
  if (!views.includes(v)) return;
  document.querySelectorAll('.view').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === v));
  const el = $('view-' + v); if (el) el.classList.remove('hidden');
  window.scrollTo(0, 0);
}
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => show(t.dataset.view)));
// FIX: Feature card navigation
document.addEventListener('click', e => {
  const el = e.target.closest('[data-goto]');
  if (el) show(el.dataset.goto);
});

// ── COPY / PRINT ──
function copyText(id) {
  const el = $(id); if (!el) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(el.value).catch(() => { el.select(); document.execCommand('copy'); });
  } else { el.select(); document.execCommand('copy'); }
  const btns = document.querySelectorAll(`button[onclick*="${id}"]`);
  btns.forEach(b => { const t = b.textContent; b.textContent = '✅ Copied!'; setTimeout(() => b.textContent = t, 1500); });
}
function printText(id, title) {
  const el = $(id); if (!el || !el.value) return;
  const w = window.open('', '_blank');
  w.document.write(`<!doctype html><html><head><title>${title}</title>
  <style>body{font-family:monospace;white-space:pre-wrap;padding:20px;font-size:12px;line-height:1.7}</style>
  </head><body>${el.value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`);
  w.document.close(); w.print();
}

// ── PROMPT (Suno ≤900 chars) ──
function buildSunoPrompt(d) {
  const bpm = d.tempo || 'mid-tempo';
  const lang = (d.language && d.language !== 'None (Instrumental)') ? `, ${d.language} language` : '';
  let p = `${d.theme ? d.theme + '. ' : ''}${d.stylePack || d.mode} composition, ${bpm}, ${d.rhythm || '4/4'}${lang}. `;
  p += `${d.vocal}. `;
  p += `Instruments: ${d.instruments || 'traditional instruments'}. `;
  if (d.lyricsRule) p += `${d.lyricsRule}. `;
  if (d.special) p += `${d.special} `;
  p += `\nReinforcement: Maintain ${d.stylePack || d.mode} authenticity. Natural organic sound.`;
  if (p.length > 900) p = p.substring(0, 897) + '...';
  return p.trim();
}

$('promptForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const out = buildSunoPrompt(d);
  $('promptOut').value = out;
  $('charCount').textContent = `(${out.length}/900 chars)`;
  $('promptOutCard')?.classList.remove('hidden');
  $('promptOutCard')?.scrollIntoView({ behavior: 'smooth' });
});
$('btnCopy')?.addEventListener('click', () => copyText('promptOut'));
$('btnClear')?.addEventListener('click', () => { $('promptOut').value = ''; $('promptOutCard')?.classList.add('hidden'); });
$('btnPrint')?.addEventListener('click', () => printText('promptOut', 'Music Prompt'));
$('btnSavePreset')?.addEventListener('click', () => {
  const d = Object.fromEntries(new FormData($('promptForm')));
  const name = window.prompt('Preset naam:'); if (!name) return;
  const arr = JSON.parse(localStorage.getItem('myPresets') || '[]');
  arr.push({ id: Date.now(), name, data: d });
  localStorage.setItem('myPresets', JSON.stringify(arr));
  alert('✅ Saved: ' + name); renderMyPresets();
});

// ── PRESETS ──
const builtInPresets = [
  { id:'holi', title:'🎉 Rajasthani Holi Dhamal', meta:'Marwadi • 118 BPM',
    data:{ mode:'Holi Dhamal', language:'Marwadi', theme:'Fagun Holi masti rang gulal', stylePack:'Rajasthani-Marwadi Folk', tempo:'118 BPM', rhythm:'Dhamal 4/4 swing', instruments:'Chang, Dholak, Khartal, Algoza, Harmonium', vocal:'Male Folk + Group Chorus call-response', lyricsRule:'Short hook clear pronunciation energetic', special:'Raw folk energy no EDM no auto-tune' }},
  { id:'bhajan', title:'🙏 Pure Bhajan', meta:'Devotional • 76 BPM',
    data:{ mode:'Bhajan', language:'Hindi', theme:'Ram bhakti devotional surrender', stylePack:'North Indian Devotional', tempo:'76 BPM', rhythm:'Teen taal 16-beat', instruments:'Harmonium, Tabla, Tanpura, Manjira', vocal:'Female Classical — Khayal/Thumri', lyricsRule:'Simple Hindi devotional meditative', special:'No drums no rock pure classical' }},
  { id:'sufi', title:'🎸 Sufi Rock Anthem', meta:'Sufi Rock • 104 BPM',
    data:{ mode:'World Fusion', language:'Punjabi-Urdu Mix', theme:'Spiritual Sufi love longing divine', stylePack:'Pakistani Sufi Rock', tempo:'104 BPM', rhythm:'4/4 rock groove', instruments:'Electric guitar overdriven, Dhol, Bass guitar, Harmonium drone, Tabla', vocal:'Male Sufi — Chest voice + Alaap', lyricsRule:'Emotional stretched syllables Sufi metaphors', special:'No EDM no pop synths raw analog stadium energy' }},
  { id:'cinematic', title:'🎬 Cinematic World', meta:'Orchestral • 92 BPM',
    data:{ mode:'Cinematic / Orchestral', language:'None (Instrumental)', theme:'Epic cinematic journey mountains stars', stylePack:'World Cinematic Orchestra', tempo:'92 BPM', rhythm:'4/4 orchestral build', instruments:'Strings, Tabla, Bansuri flute, Piano, Soft percussion', vocal:'Karaoke — No Vocals (Instrumental)', lyricsRule:'No lyrics', special:'Large hall reverb cinematic no vocals' }}
];

function renderPresets() {
  const list = $('builtInList'); if (!list) return;
  list.innerHTML = builtInPresets.map(p => `
    <div class="presetItem">
      <h3>${p.title}</h3><div class="meta muted small">${p.meta}</div>
      <div class="rowbtn">
        <button class="btn" onclick="loadPreset('${p.id}')">📂 Load</button>
        <button class="btn ghost" onclick="genPreset('${p.id}')">⚡ Generate</button>
      </div>
    </div>`).join('');
}
function loadPreset(id) {
  const p = builtInPresets.find(x => x.id === id); if (!p) return;
  Object.entries(p.data).forEach(([k,v]) => { const el = $('promptForm')?.querySelector(`[name="${k}"]`); if (el) el.value = v; });
  show('prompt');
}
function genPreset(id) {
  const p = builtInPresets.find(x => x.id === id); if (!p) return;
  const out = buildSunoPrompt(p.data);
  $('promptOut').value = out;
  $('charCount').textContent = `(${out.length}/900 chars)`;
  $('promptOutCard')?.classList.remove('hidden');
  show('prompt');
}
function renderMyPresets() {
  const list = $('myPresetList'); if (!list) return;
  const arr = JSON.parse(localStorage.getItem('myPresets') || '[]');
  list.innerHTML = arr.length ? arr.map((p,i) => `
    <div class="presetItem"><h3>${p.name}</h3>
      <div class="rowbtn">
        <button class="btn" onclick="loadMy(${i})">📂 Load</button>
        <button class="btn ghost" onclick="delPreset(${i})">🗑️</button>
      </div></div>`).join('') : '<p class="muted">No saved presets.</p>';
}
function loadMy(i) {
  const arr = JSON.parse(localStorage.getItem('myPresets') || '[]');
  const p = arr[i]; if (!p) return;
  Object.entries(p.data).forEach(([k,v]) => { const el = $('promptForm')?.querySelector(`[name="${k}"]`); if (el) el.value = v; });
  show('prompt');
}
function delPreset(i) {
  if (!confirm('Delete?')) return;
  const arr = JSON.parse(localStorage.getItem('myPresets') || '[]');
  arr.splice(i,1); localStorage.setItem('myPresets', JSON.stringify(arr)); renderMyPresets();
}

// ── PWA ──
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; $('btnInstall')?.classList.remove('hidden'); });
$('btnInstall')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') $('btnInstall')?.classList.add('hidden');
  deferredPrompt = null;
});

// ── RECORDER ──
let mr, chunks = [];
$('btnRec')?.addEventListener('click', async () => {
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    mr = new MediaRecorder(s); chunks = [];
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = () => {
      const url = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }));
      const a = $('recAudio'); if (a) { a.src = url; a.load(); }
      const d = $('btnDownload');
      if (d) { d.disabled = false; d.onclick = () => { const x = document.createElement('a'); x.href = url; x.download = 'rec.webm'; x.click(); }; }
    };
    mr.start(); $('btnRec').disabled = true; $('btnStop').disabled = false;
  } catch(e) { alert('Mic error: ' + e.message); }
});
$('btnStop')?.addEventListener('click', () => { mr?.stop(); $('btnRec').disabled = false; $('btnStop').disabled = true; });

// ── MUSIC SHEET BUILDER (no URLs, looks like real sheet) ──
function buildMusicSheet(srcLabel, genre, key, bpm, vocal) {
  const g = genre === 'auto' ? 'Auto-detect' : genre;
  const k = key || 'Auto-detect';
  const b = bpm || 'Auto-detect';
  const v = vocal === 'auto' ? 'Auto-detect' : vocal;
  const bpmNum = parseInt(b) || 120;
  const keyABC = k.replace(' Major','').replace(' Minor','m').replace('Auto-detect','C');

  return `╔══════════════════════════════════════════╗
║         🎵 MUSIC ANALYSIS SHEET          ║
╚══════════════════════════════════════════╝
 ${srcLabel}
 Genre : ${g}
 Key   : ${k}
 BPM   : ${b}
 Time  : Auto-detect (4/4 or 3/4 or 6/8)
 Vocal : ${v}
══════════════════════════════════════════

📍 ARRANGEMENT MAP:
┌──────────┬────────────┬──────────────────┐
│ Section  │ Timestamp  │ Description      │
├──────────┼────────────┼──────────────────┤
│ Intro    │ 0:00 – ?   │ [fill]           │
│ Verse 1  │ ? – ?      │ [fill]           │
│ Chorus   │ ? – ?      │ [fill]           │
│ Verse 2  │ ? – ?      │ [fill]           │
│ Bridge   │ ? – ?      │ [fill]           │
│ Outro    │ ? – end    │ [fill]           │
└──────────┴────────────┴──────────────────┘

🎹 MELODY NOTES (MIDI note-by-note):
Format: Bar1: G4(♩) A4(♪) B4(♩) G4(♩) — [conf%]
Provide every bar with confidence score
Include ornaments: ~ meend ↗ gamak ↻ murki

🎼 CHORD PROGRESSION:
Format: | Chord | Chord | Chord | Chord |
Add Roman numerals: I ii IV V / i bVII bVI V

🎤 VOCAL NOTES + LYRICS:
Format: [time] [note][dur] "[syllable]" [ornament]
Ex:     0:15   B4(♩)  "fa-"   meend↓G4
        0:17   A4(♪)  "gun"
        0:18   G4(♩)  "aa"    gamak

🥁 RHYTHM GROOVE (4-bar loop):
Beat:    1   +   2   +   3   +   4   +
Inst 1:  D . . d . . D . . d . . D D d .
Inst 2:  . . X . . . X . . . X . . . X .
Swing factor: [straight / light / medium / heavy]

🎸 INSTRUMENTS TABLE:
┌──────────┬─────────┬──────────┬──────────┬─────┬─────┐
│ Name     │ Role    │ MIDI Ch  │ GM Patch │ Pan │ Vol │
├──────────┼─────────┼──────────┼──────────┼─────┼─────┤
│ [detect] │ [role]  │ [ch]     │ [patch]  │ [p] │ [v] │
│ [detect] │ [role]  │ [ch]     │ [patch]  │ [p] │ [v] │
│ [detect] │ [role]  │ [ch]     │ [patch]  │ [p] │ [v] │
└──────────┴─────────┴──────────┴──────────┴─────┴─────┘

🎵 ABC NOTATION (MIDI-ready):
X:1
T:${g} Analysis
M:4/4
Q:1/4=${bpmNum}
K:${keyABC}
%%MIDI channel 0
%%MIDI program 0
|: [fill after analysis] :|

📊 CONFIDENCE SCORES:
Overall   : [0-100%]
Melody    : [0-100%]
Rhythm    : [0-100%]
Harmony   : [0-100%]
Lyrics    : [0-100%]
══════════════════════════════════════════`;
}

function buildBeatSheet(srcLabel, genre, bpm) {
  const g = genre === 'auto' ? 'Auto-detect' : genre;
  const b = bpm || 'Auto-detect';
  const bpmNum = parseInt(b) || 120;
  return `╔══════════════════════════════╗
║   🥁 BEAT ANALYSIS SHEET    ║
╚══════════════════════════════╝
 ${srcLabel} | Genre: ${g} | BPM: ${b}
══════════════════════════════

EXACT BPM: [detect]
TIME SIGNATURE: [detect]
TEMPO CHANGES: [list with timestamps]
SWING FACTOR: [straight/light/medium/heavy]

4-BAR GROOVE LOOP:
Beat: 1   +   2   +   3   +   4   +
[P1]: D . . d . . D . . d . . D D d .
[P2]: . . X . . . X . . . X . . . X .
[P3]: [fill notation here]

ACCENT TIMESTAMPS:
[time]: strong beat | [time]: weak beat

FILLS:
[time]: [description]

PERCUSSION INSTRUMENTS:
Name | Role | Sound description | MIDI patch

ABC PERCUSSION:
X:2
T:Beat Loop
M:4/4
Q:1/4=${bpmNum}
K:C clef=perc
%%MIDI channel 9
|: [fill] :|
══════════════════════════════`;
}

function buildInstrSheet(srcLabel, genre, key) {
  const g = genre === 'auto' ? 'Auto-detect' : genre;
  const k = key || 'Auto-detect';
  return `╔════════════════════════════════╗
║  🎸 INSTRUMENTS SHEET        ║
╚════════════════════════════════╝
 ${srcLabel} | Genre: ${g} | Key: ${k}
════════════════════════════════

FOR EACH INSTRUMENT DETECTED:

NAME: [instrument name]
  Role         : melody / harmony / bass / rhythm / drone / pad
  Entry time   : [timestamp]
  Exit time    : [timestamp]
  Pitch range  : [lowest] – [highest]
  1-bar loop   : [notation]
  Timbre       : [description]
  MIDI Ch      : [1-16]
  GM Patch     : [number + name]
  Pan          : [L100-C-R100]
  Volume       : [0-127]
  FX           : [reverb, delay, etc]
───────────────────────────────

LAYER COMBINATIONS:
[time] Active layers: [list]

MICROTONAL NOTES:
[instrument]: [description of microtones/bends]

SAMPLE PACK SUGGESTIONS:
[instrument] → [suggested pack/library]
════════════════════════════════`;
}

function buildVocalSheet(srcLabel, genre, vocal) {
  const g = genre === 'auto' ? 'Auto-detect' : genre;
  const v = vocal === 'auto' ? 'Auto-detect' : vocal;
  return `╔══════════════════════════════════╗
║   🎤 VOCAL ANALYSIS SHEET      ║
╚══════════════════════════════════╝
 ${srcLabel}
 Genre: ${g} | Vocal: ${v}
══════════════════════════════════

VOCAL TYPE: [detect exact type]
PITCH RANGE: [lowest note] – [highest note]
LANGUAGE: [detect]

MELODY NOTE-BY-NOTE:
[time]  [note]([dur])  "[syllable]"  [ornament]  [conf%]
─────────────────────────────────────
0:00   [note](♩)    "[word]"     —           [%]
0:02   [note](♪)    "[word]"     meend↓      [%]
0:04   [note](♩)    "[word]"     gamak       [%]
[continue for full song]

ORNAMENTS DETECTED:
 ~ Meend    : [timestamps]
 ↗ Gamak    : [timestamps]
 ↻ Murki    : [timestamps]
 ∿ Kan swar : [timestamps]

BREATH MARKS:
[timestamp] – [timestamp]: phrase 1
[timestamp] – [timestamp]: phrase 2

HARMONY VOICES:
[voice]: [notes] at [timestamps]

STYLE TAGS:
[list of detected style characteristics]

VST RECOMMENDATIONS:
Lead voice   : [suggestion]
Harmonies    : [suggestion]
FX chain     : [reverb + delay + EQ]

FULL LYRICS (phonetic + translation):
[timestamp] | [original] | [phonetic] | [meaning]
══════════════════════════════════`;
}

// ── TRANSCRIBE ──
const tPresets = [
  { id:'folk', label:'🪘 Folk/Regional', genre:'Regional Folk', inst:'Dholak, Harmonium, Flute, Khartal' },
  { id:'hindustani', label:'🎵 Hindustani Classical', genre:'Hindustani Classical', inst:'Tabla, Sitar, Harmonium, Tanpura' },
  { id:'carnatic', label:'🎶 Carnatic', genre:'Carnatic Classical', inst:'Mridangam, Veena, Violin, Ghatam' },
  { id:'qawwali', label:'🌙 Qawwali/Sufi', genre:'Qawwali', inst:'Harmonium, Tabla, Dholak, Chorus' },
  { id:'bollywood', label:'🎬 Bollywood', genre:'Bollywood', inst:'Strings, Tabla, Guitar, Piano, Brass' },
  { id:'jazz', label:'🎷 Jazz', genre:'Jazz', inst:'Piano, Bass, Drums, Sax, Trumpet' },
  { id:'western', label:'🎻 Western Classical', genre:'Western Classical', inst:'Violin, Cello, Piano, Woodwinds' },
  { id:'hiphop', label:'🎤 Hip-Hop', genre:'Hip-Hop', inst:'808 Bass, Hi-hat, Snare, Synth' },
  { id:'edm', label:'🎛️ EDM', genre:'EDM', inst:'Synth Lead, Bass Drop, Kick Drum' },
  { id:'flamenco', label:'💃 Flamenco', genre:'Flamenco', inst:'Spanish Guitar, Cajon, Castanets' },
  { id:'reggae', label:'🌿 Reggae', genre:'Reggae', inst:'Bass Guitar, Rhythm Guitar, Drums' },
  { id:'world', label:'🌍 World Fusion', genre:'World Fusion', inst:'Global instruments mix' }
];
const tSel = $('transcribeGenre');
if (tSel) {
  tPresets.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = p.label; tSel.appendChild(o); });
  tSel.addEventListener('change', () => { const p = tPresets.find(x => x.id === tSel.value); if (p) $('transcribeInst').value = p.inst; });
}

// Transcribe source tabs
$('ttabFile')?.addEventListener('click', () => {
  $('ttabFile').classList.add('active'); $('ttabLink')?.classList.remove('active');
  $('tFileArea')?.classList.remove('hidden'); $('tLinkArea')?.classList.add('hidden');
});
$('ttabLink')?.addEventListener('click', () => {
  $('ttabLink').classList.add('active'); $('ttabFile')?.classList.remove('active');
  $('tLinkArea')?.classList.remove('hidden'); $('tFileArea')?.classList.add('hidden');
});

// Transcribe file upload (iOS fix: label handles it, just listen to change)
let tUploadedFile = '';
$('tAudioFile')?.addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  tUploadedFile = file.name;
  const url = URL.createObjectURL(file);
  const info = $('tFileInfo');
  if (info) {
    info.className = 'file-info-box';
    info.innerHTML = `<div class="file-name">📁 ${file.name}</div>
      <div class="muted small">${(file.size/1024/1024).toFixed(2)} MB</div>
      <audio class="audio" controls src="${url}" style="margin-top:8px;width:100%"></audio>`;
  }
  $('tUploadBox')?.classList.add('hidden');
});

$('btnTranscribe')?.addEventListener('click', () => {
  const genreId = $('transcribeGenre')?.value;
  const p = tPresets.find(x => x.id === genreId);
  const genre = p?.genre || 'Auto-detect';
  const inst = $('transcribeInst')?.value || p?.inst || 'Auto-detect';
  const key = $('transcribeKey')?.value || 'Auto-detect';
  const bpm = $('transcribeTempo')?.value || 'Auto-detect';
  const tLink = $('tUrl')?.value?.trim();
  const srcLabel = tUploadedFile ? `File: ${tUploadedFile}` : (tLink ? 'Online source' : 'Audio source');

  const out = buildMusicSheet(srcLabel, genre, key, bpm, 'Auto-detect') +
    `\n\nINSTRUMENTS TO DETECT: ${inst}`;

  $('transcribeOut').value = out;
  $('transcribeOutCard')?.classList.remove('hidden');
  $('transcribeOutCard')?.scrollIntoView({ behavior: 'smooth' });
});
$('btnCopyT')?.addEventListener('click', () => copyText('transcribeOut'));
$('btnPrintT')?.addEventListener('click', () => printText('transcribeOut', 'Music Sheet'));

// ── ANALYZE — iOS FILE UPLOAD FIX ──
let uploadedFile = '';
$('utabFile')?.addEventListener('click', () => {
  $('utabFile').classList.add('active'); $('utabLink')?.classList.remove('active');
  $('uploadFileArea')?.classList.remove('hidden'); $('uploadLinkArea')?.classList.add('hidden');
});
$('utabLink')?.addEventListener('click', () => {
  $('utabLink').classList.add('active'); $('utabFile')?.classList.remove('active');
  $('uploadLinkArea')?.classList.remove('hidden'); $('uploadFileArea')?.classList.add('hidden');
});

// iOS fix: label approach — just listen to change event
$('audioFile')?.addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  uploadedFile = file.name;
  const url = URL.createObjectURL(file);
  const fi = $('fileInfo');
  if (fi) {
    fi.className = 'file-info-box';
    fi.innerHTML = `<div class="file-name">📁 ${file.name}</div>
      <div class="muted small">${(file.size/1024/1024).toFixed(2)} MB · ${file.type || 'audio'}</div>
      <audio class="audio" controls src="${url}" style="margin-top:8px;width:100%"></audio>
      <button class="btn ghost" style="margin-top:8px;font-size:12px" onclick="resetUpload()">✕ Remove</button>`;
  }
  $('uploadBox')?.classList.add('hidden');
});

function resetUpload() {
  uploadedFile = '';
  const fi = $('fileInfo'); if (fi) { fi.className = 'hidden'; fi.innerHTML = ''; }
  $('uploadBox')?.classList.remove('hidden');
}

$('btnAnalyze')?.addEventListener('click', () => {
  const link = $('analyzeUrl')?.value?.trim();
  if (!uploadedFile && !link) { alert('File upload karo ya link paste karo!'); return; }
  const srcLabel = uploadedFile ? `File: ${uploadedFile}` : 'Online source provided';
  const genre = $('analyzeGenre')?.value || 'auto';
  const key = $('analyzeKey')?.value || '';
  const bpm = $('analyzeBpm')?.value || '';
  const vocal = $('analyzeVocal')?.value || 'auto';

  $('sheetOut').value = buildMusicSheet(srcLabel, genre, key, bpm, vocal);
  $('beatOut').value = buildBeatSheet(srcLabel, genre, bpm);
  $('instrOut').value = buildInstrSheet(srcLabel, genre, key);
  $('vocalOut').value = buildVocalSheet(srcLabel, genre, vocal);

  const g = genre === 'auto' ? 'Auto-detect genre' : genre;
  const v = vocal === 'auto' ? 'Auto-detect' : vocal;
  $('fullOut').value = `${g} composition, ${bpm || 'mid-tempo'}, ${key || 'auto key'}, ${v} vocal.\nAuthentic instruments, natural organic mix.\n[Add theme after analysis]\nNo auto-tune, real instrument textures.\n\nReinforcement: Preserve authentic ${g} character throughout.`;

  $('analyzeOutCard')?.classList.remove('hidden');
  $('analyzeOutCard')?.scrollIntoView({ behavior: 'smooth' });
});

document.querySelectorAll('.rtab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.rtab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.rt-panel').forEach(p => p.classList.add('hidden'));
    btn.classList.add('active');
    $('rt-' + btn.dataset.rt)?.classList.remove('hidden');
  });
});

$('btnNewCompose')?.addEventListener('click', () => {
  const lang = $('newLang')?.value || 'Hindi';
  const vocal = $('newVocal')?.value || 'Solo Male';
  const theme = $('newTheme')?.value || 'custom theme';
  const keep = $('keepFrom')?.value || 'same energy and feel';
  const genre = $('analyzeGenre')?.value || 'Folk';
  const bpm = $('analyzeBpm')?.value || 'same BPM';
  const key = $('analyzeKey')?.value || 'same key';
  $('newComposeOut').value = `${genre} composition, ${bpm}, ${key}, ${lang} lyrics.\n${vocal} with authentic phrasing.\nTheme: ${theme}\nKeep from reference: ${keep}\nNatural organic mix.\n\nReinforcement: Same feel as reference — fresh ${lang} lyrics and melody.`;
});

// ── LYRICS ──
document.querySelectorAll('.ltab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ltab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.lt-panel').forEach(p => p.classList.add('hidden'));
    btn.classList.add('active');
    $('lt-' + btn.dataset.lt)?.classList.remove('hidden');
  });
});

$('newLyricsForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const prov = d.nlProvider === 'auto' ? 'Use best AI judgment for all creative choices.' : `Optimized for ${d.nlProvider}.`;
  $('newLyricsOut').value = `✍️ NEW LYRICS\nGenre: ${d.nlGenre} | Lang: ${d.nlLang} | Vocal: ${d.nlVocal}\nTheme: ${d.nlTheme} | Mood: ${d.nlMood}\nStructure: ${d.nlStruct} | BPM: ${d.nlBpm || 'medium'}\n${d.nlSpecial ? 'Special: '+d.nlSpecial+'\n' : ''}${prov}\n\nWRITE:\n- Hook/Mukhda: 2-4 lines, catchy, memorable\n- Verse x2-3: develop theme, new imagery each\n- Bridge: emotional peak\n- Rhyme: AABB or ABAB\n- Match syllables to ${d.nlBpm || 'medium'} BPM rhythm\n- Mark melody: UP / DOWN / HOLD per line\n\nOUTPUT: Full lyrics + structure labels + melody hints`;
  $('newLyricsOutCard')?.classList.remove('hidden');
  $('newLyricsOutCard')?.scrollIntoView({ behavior: 'smooth' });
});

$('origLyricsForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  $('origLyricsOut').value = `📝 LYRICS ANALYSIS\nGenre: ${d.olGenre} | Lang: ${d.olLang}\n\nANALYZE:\n- Language + translation\n- Structure: verse/chorus/bridge labels\n- Rhyme scheme + syllable count per line\n- Emotional arc\n- Cultural references\n- Melody suggestions per line\n${d.olLyrics?.trim() ? '\nLYRICS:\n'+d.olLyrics : ''}`;
  $('origLyricsOutCard')?.classList.remove('hidden');
  $('origLyricsOutCard')?.scrollIntoView({ behavior: 'smooth' });
});

$('refLyricsForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  $('refLyricsOut').value = `🔗 REFERENCE-BASED LYRICS\nNew lang: ${d.rlLang} | Vocal: ${d.rlVocal}\nNew theme: ${d.rlTheme} | Style: ${d.rlStyle}\n${d.rlSpecial ? 'Special: '+d.rlSpecial+'\n' : ''}\nCREATE:\n- New lyrics with same meter/rhythm as reference\n- Keep: syllable count, energy, rhyme scheme\n- Change: theme → ${d.rlTheme}, fresh images in ${d.rlLang}\n- Match original structure exactly\n\nOUTPUT: New full lyrics + old vs new structure comparison`;
  $('refLyricsOutCard')?.classList.remove('hidden');
  $('refLyricsOutCard')?.scrollIntoView({ behavior: 'smooth' });
});

// ── NATURE ──
let selSounds = [];
document.querySelectorAll('.chip').forEach(c => {
  c.addEventListener('click', () => {
    const s = c.dataset.sound;
    if (c.classList.contains('active')) { c.classList.remove('active'); selSounds = selSounds.filter(x => x !== s); }
    else { c.classList.add('active'); selSounds.push(s); }
    const cnt = $('selCount'); if (cnt) cnt.textContent = selSounds.length;
    const disp = $('selectedSoundsDisplay'), m = $('noSelMsg');
    if (!disp) return;
    disp.querySelectorAll('.sel-tag').forEach(t => t.remove());
    if (!selSounds.length) { m && (m.style.display=''); return; }
    m && (m.style.display='none');
    selSounds.forEach(s => {
      const t = document.createElement('span'); t.className = 'sel-tag';
      t.textContent = s.split(' ').slice(0,3).join(' ') + ' ✕';
      t.onclick = () => { selSounds = selSounds.filter(x => x !== s); document.querySelectorAll(`.chip[data-sound="${CSS.escape(s)}"]`).forEach(c => c.classList.remove('active')); $('selCount').textContent = selSounds.length; t.remove(); if (!selSounds.length && m) m.style.display=''; };
      disp.appendChild(t);
    });
  });
});
$('btnClearNature')?.addEventListener('click', () => { selSounds = []; document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); $('selCount').textContent = '0'; const d = $('selectedSoundsDisplay'); if (d) d.querySelectorAll('.sel-tag').forEach(t => t.remove()); const m = $('noSelMsg'); if (m) m.style.display=''; });
$('btnGenNature')?.addEventListener('click', () => {
  if (!selSounds.length) { alert('Koi sound select karo!'); return; }
  const g = $('natGenre')?.value || 'Ambient';
  const mood = $('natMood')?.value || 'Peaceful';
  const bpm = $('natBpm')?.value || '70 BPM';
  const layer = $('natLayer')?.value || 'Background';
  const intensity = $('natIntensity')?.value || 'Moderate';
  const special = $('natSpecial')?.value || '';
  $('natureOut').value = `${g}, ${bpm}, ${mood} mood.\nNature elements: ${selSounds.slice(0,5).join(', ')}.\n${layer}, ${intensity} mix.\nSpatial reverb, organic textures, 3D immersive.\n${special || 'Blend nature sounds with music seamlessly.'}\n\nReinforcement: ${layer.includes('Back') ? 'Nature sounds subtle under music' : 'Nature sounds featured prominently'}. Keep organic character.`;
  $('natureOutCard')?.classList.remove('hidden');
  $('natureOutCard')?.scrollIntoView({ behavior: 'smooth' });
});

// ── PLAYER ──
let playlist = [], curTrack = 0;
$('playerFiles')?.addEventListener('change', e => {
  const files = Array.from(e.target.files); if (!files.length) return;
  playlist = files.map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
  curTrack = 0; renderPL(); loadTrack(0);
});
function renderPL() {
  const c = $('playlistItems'); if (!c) return;
  c.innerHTML = playlist.map((t,i) => `<div class="pl-item${i===curTrack?' active':''}" onclick="loadTrack(${i})">${i===curTrack?'▶️':'🎵'} ${t.name}</div>`).join('');
}
function loadTrack(i) {
  if (i < 0 || i >= playlist.length) return;
  curTrack = i;
  const p = $('mainPlayer'); if (p) { p.src = playlist[i].url; p.play().catch(()=>{}); }
  $('trackName').textContent = playlist[i].name;
  $('trackNum').textContent = `${i+1} / ${playlist.length}`;
  $('btnPlayPause').textContent = '⏸ Pause';
  $('playerDisc')?.classList.add('spinning');
  renderPL();
}
$('btnPlayPause')?.addEventListener('click', () => {
  const p = $('mainPlayer'); if (!p) return;
  if (p.paused) { p.play(); $('btnPlayPause').textContent = '⏸ Pause'; }
  else { p.pause(); $('btnPlayPause').textContent = '▶️ Play'; }
});
$('btnPrev')?.addEventListener('click', () => loadTrack(curTrack-1));
$('btnNext')?.addEventListener('click', () => loadTrack(curTrack+1));
$('mainPlayer')?.addEventListener('ended', () => { if (curTrack < playlist.length-1) loadTrack(curTrack+1); else $('playerDisc')?.classList.remove('spinning'); });

// ── INIT ──
renderPresets();
renderMyPresets();
show('home');

