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
document.addEventListener('click', e => {
  const el = e.target.closest('[data-goto]');
  if (el) show(el.dataset.goto);
});

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
  w.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:monospace;white-space:pre-wrap;padding:20px;font-size:12px;line-height:1.7}</style></head><body>${el.value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`);
  w.document.close(); w.print();
}

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

const builtInPresets = [
  { id:'holi', title:'🎉 Rajasthani Holi Dhamal', meta:'Marwadi • 118 BPM', data:{ mode:'Holi Dhamal', language:'Marwadi', theme:'Fagun Holi masti rang gulal', stylePack:'Rajasthani-Marwadi Folk', tempo:'118 BPM', rhythm:'Dhamal 4/4 swing', instruments:'Chang, Dholak, Khartal, Algoza, Harmonium', vocal:'Male Folk + Group Chorus call-response', lyricsRule:'Short hook clear pronunciation energetic', special:'Raw folk energy no EDM no auto-tune' }},
  { id:'bhajan', title:'🙏 Pure Bhajan', meta:'Devotional • 76 BPM', data:{ mode:'Bhajan', language:'Hindi', theme:'Ram bhakti devotional surrender', stylePack:'North Indian Devotional', tempo:'76 BPM', rhythm:'Teen taal 16-beat', instruments:'Harmonium, Tabla, Tanpura, Manjira', vocal:'Female Classical — Khayal/Thumri', lyricsRule:'Simple Hindi devotional meditative', special:'No drums no rock pure classical' }},
  { id:'sufi', title:'🎸 Sufi Rock Anthem', meta:'Sufi Rock • 104 BPM', data:{ mode:'World Fusion', language:'Punjabi-Urdu Mix', theme:'Spiritual Sufi love longing divine', stylePack:'Pakistani Sufi Rock', tempo:'104 BPM', rhythm:'4/4 rock groove', instruments:'Electric guitar overdriven, Dhol, Bass guitar, Harmonium drone, Tabla', vocal:'Male Sufi — Chest voice + Alaap', lyricsRule:'Emotional stretched syllables Sufi metaphors', special:'No EDM no pop synths raw analog stadium energy' }},
  { id:'cinematic', title:'🎬 Cinematic World', meta:'Orchestral • 92 BPM', data:{ mode:'Cinematic / Orchestral', language:'None (Instrumental)', theme:'Epic cinematic journey mountains stars', stylePack:'World Cinematic Orchestra', tempo:'92 BPM', rhythm:'4/4 orchestral build', instruments:'Strings, Tabla, Bansuri flute, Piano, Soft percussion', vocal:'Karaoke — No Vocals (Instrumental)', lyricsRule:'No lyrics', special:'Large hall reverb cinematic no vocals' }}
];

function renderPresets() {
  const list = $('builtInList'); if (!list) return;
  list.innerHTML = builtInPresets.map(p => `<div class="presetItem"><h3>${p.title}</h3><div class="meta muted small">${p.meta}</div><div class="rowbtn"><button class="btn" onclick="loadPreset('${p.id}')">📂 Load</button><button class="btn ghost" onclick="genPreset('${p.id}')">⚡ Generate</button></div></div>`).join('');
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
  list.innerHTML = arr.length ? arr.map((p,i) => `<div class="presetItem"><h3>${p.name}</h3><div class="rowbtn"><button class="btn" onclick="loadMy(${i})">📂 Load</button><button class="btn ghost" onclick="delPreset(${i})">🗑️</button></div></div>`).join('') : '<p class="muted">No saved presets.</p>';
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

let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; $('btnInstall')?.classList.remove('hidden'); });
$('btnInstall')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') $('btnInstall')?.classList.add('hidden');
  deferredPrompt = null;
});

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

function buildMusicSheet(srcLabel, genre, key, bpm, vocal) {
  const g = genre === 'auto' ? 'Auto-detect' : genre;
  const k = key || 'Auto-detect';
  const b = bpm || 'Auto-detect';
  const v = vocal === 'auto' ? 'Auto-detect' : vocal;
  const bpmNum = parseInt(b) || 120;
  const keyABC = k.replace(' Major','').replace(' Minor','m').replace('Auto-detect','C');
  return `╔══════════════════════════════════════════════╗
║      🎵 SONG MICRO-DETAIL ANALYZER          ║
╚══════════════════════════════════════════════╝
 Source : ${srcLabel}
 Genre  : ${g}  |  Key : ${k}  |  BPM : ${b}
 Vocal  : ${v}
══════════════════════════════════════════════

━━━ 1. MUSICAL TAXONOMY ━━━━━━━━━━━━━━━━━━━━

🎸 GENRE & STYLE
  Genre    : ${g}
  Style    : [specific style descriptors]
  Sub-tags : [3-5 micro-genre descriptors]

🌊 MOOD & EMOTIONAL DIRECTION
  Arc      : Intro→Verse→Chorus→Outro emotional journey
  Feel     : [Listener experience description]

🥁 TEMPO & RHYTHM
  BPM      : ${b}
  Pattern  : [groove description]
  Swing    : [straight/light/medium/heavy]

🎼 KEY & HARMONY
  Key      : ${k}
  Chords   : [Main progression]
  Tension  : [How harmony creates tension]

🎹 INSTRUMENTATION
  [List each instrument: name | role | sound]

🎚️ PRODUCTION & TEXTURE
  Quality  : [lo-fi/hi-fi/analog/digital]
  Reverb   : [dry/room/hall/heavy]
  Texture  : [warm/cold/compressed/wide]

🎤 VOCAL
  Type     : ${v}
  Tone     : [description]
  Process  : [dry/reverbed/layered]

📐 SONG STRUCTURE
  Intro → Verse 1 → Pre-Chorus → Chorus → Verse 2 → Bridge → Outro

⚡ ENERGY CURVE
  Intro:[1-10] → Verse:[1-10] → Chorus:[1-10] → Outro:[1-10]

━━━ 2. SUNO AI REPLICATION PROMPT ━━━━━━━━━━

[High-fidelity stereo, warm analog texture, ${g} style]

${g}, ${b}, ${k}.
Mood: [fill]
Style: [fill]

[Intro]
[sparse entry, establish mood]

[Verse 1]
[${v} — intimate delivery]
[main groove enters]

[Chorus]
[full arrangement — emotional peak]
[layered harmonies]

[Bridge]
[contrast or breakdown]

[Outro]
[return to intro feel, fade]

Tempo: ${b} | Key: ${k} | Vocal: ${v}
Reinforcement: Maintain authentic ${g} character throughout
══════════════════════════════════════════════`;
}

function buildSunoReplicationPrompt(srcLabel, genre, key, bpm, vocal) {
  const g = genre === 'auto' ? 'World Folk' : genre;
  const k = key || 'Auto key';
  const b = bpm || 'Mid-tempo';
  const v = vocal === 'auto' ? 'Auto-detect vocal' : vocal;
  return `[High-fidelity stereo, warm analog texture]

${g} composition, ${b}, ${k}.
Mood: [fill — e.g. euphoric devotional / melancholic restrained]
Style: [fill — e.g. live temple folk / cinematic / bedroom lo-fi]

[Intro]
[sparse — establish main instrument, no full drums yet]
[set emotional tone from first note]

[Verse 1]
[${v} — intimate, close-mic delivery]
[main groove instruments enter]
[low-to-mid energy, storytelling tone]

[Pre-Chorus]
[tension builds — add layer, rhythm tightens]

[Chorus]
[full arrangement — emotional peak]
[layered harmonies / call-and-response]
[hook — most memorable moment]

[Verse 2]
[same groove, slight variation]
[new lyrical imagery]

[Bridge]
[contrast — breakdown or key shift]
[most vulnerable or intense moment]

[Outro]
[return to intro feel]
[fade gently / hard stop]

Tempo: ${b} | Key: ${k} | Vocal: ${v}
Production: warm analog, organic mix, no EDM
Reinforcement: Maintain authentic ${g} character throughout`;
}

function buildBeatSheet(srcLabel, genre, bpm) {
  const g = genre === 'auto' ? 'Auto-detect' : genre;
  const b = bpm || 'Auto-detect';
  const bpmNum = parseInt(b) || 120;
  return `🥁 BEAT ANALYSIS — ${srcLabel}
Genre: ${g} | BPM: ${b}
══════════════════════════════
EXACT BPM      : [detect]
TIME SIGNATURE : [detect]
SWING FACTOR   : [straight/light/medium/heavy]

4-BAR GROOVE:
Beat: 1 + 2 + 3 + 4 +
[P1]: D . d . D . d .
[P2]: . X . . X . . X

ABC:
X:2
M:4/4
Q:1/4=${bpmNum}
K:C clef=perc
|: [fill] :|`;
}

function buildInstrSheet(srcLabel, genre, key) {
  const g = genre === 'auto' ? 'Auto-detect' : genre;
  const k = key || 'Auto-detect';
  return `🎸 INSTRUMENTS — ${srcLabel}
Genre: ${g} | Key: ${k}
════════════════════════════════
FOR EACH INSTRUMENT:
  Name | Role | Timbre | MIDI Ch | Pan | FX
────────────────────────────────
[detect all instruments]
[list entry/exit timestamps]
[note microtonal bends if any]`;
}

function buildVocalSheet(srcLabel, genre, vocal) {
  const g = genre === 'auto' ? 'Auto-detect' : genre;
  const v = vocal === '
