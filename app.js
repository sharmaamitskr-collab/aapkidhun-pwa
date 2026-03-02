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
  const v = vocal === 'auto' ? 'Auto-detect' : vocal;
  return `🎤 VOCAL ANALYSIS — ${srcLabel}
Genre: ${g} | Vocal: ${v}
══════════════════════════════════
TYPE    : [detect]
RANGE   : [lowest – highest]
LANG    : [detect]

NOTE-BY-NOTE:
[time] [note] "[syllable]" [ornament] [conf%]

ORNAMENTS: Meend / Gamak / Murki / Kan
BREATH MARKS: [timestamps]
FULL LYRICS: [original | phonetic | meaning]`;
}

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

$('ttabFile')?.addEventListener('click', () => { $('ttabFile').classList.add('active'); $('ttabLink')?.classList.remove('active'); $('tFileArea')?.classList.remove('hidden'); $('tLinkArea')?.classList.add('hidden'); });
$('ttabLink')?.addEventListener('click', () => { $('ttabLink').classList.add('active'); $('ttabFile')?.classList.remove('active'); $('tLinkArea')?.classList.remove('hidden'); $('tFileArea')?.classList.add('hidden'); });

let tUploadedFile = '';
$('tAudioFile')?.addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  tUploadedFile = file.name;
  const url = URL.createObjectURL(file);
  const info = $('tFileInfo');
  if (info) { info.className = 'file-info-box'; info.innerHTML = `<div class="file-name">📁 ${file.name}</div><div class="muted small">${(file.size/1024/1024).toFixed(2)} MB</div><audio class="audio" controls src="${url}" style="margin-top:8px;width:100%"></audio>`; }
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
  $('transcribeOut').value = buildMusicSheet(srcLabel, genre, key, bpm, 'Auto-detect') + `\n\nINSTRUMENTS TO DETECT: ${inst}`;
  $('transcribeOutCard')?.classList.remove('hidden');
  $('transcribeOutCard')?.scrollIntoView({ behavior: 'smooth' });
});
$('btnCopyT')?.addEventListener('click', () => copyText('transcribeOut'));
$('btnPrintT')?.addEventListener('click', () => printText('transcribeOut', 'Music Sheet'));

let uploadedFile = '';
$('utabFile')?.addEventListener('click', () => { $('utabFile').classList.add('active'); $('utabLink')?.classList.remove('active'); $('uploadFileArea')?.classList.remove('hidden'); $('uploadLinkArea')?.classList.add('hidden'); });
$('utabLink')?.addEventListener('click', () => { $('utabLink').classList.add('active'); $('utabFile')?.classList.remove('active'); $('uploadLinkArea')?.classList.remove('hidden'); $('uploadFileArea')?.classList.add('hidden'); });

$('audioFile')?.addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  uploadedFile = file.name;
  const url = URL.createObjectURL(file);
  const fi = $('fileInfo');
  if (fi) { fi.className = 'file-info-box'; fi.innerHTML = `<div class="file-name">📁 ${file.name}</div><div class="muted small">${(file.size/1024/1024).toFixed(2)} MB · ${file.type||'audio'}</div><audio class="audio" controls src="${url}" style="margin-top:8px;width:100%"></audio><button class="btn ghost" style="margin-top:8px;font-size:12px" onclick="resetUpload()">✕ Remove</button>`; }
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
  $('fullOut').value = buildSunoReplicationPrompt(srcLabel, genre, key, bpm, vocal);
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
  $('newComposeOut').value = `[High-fidelity stereo, warm analog texture]\n\n${genre} composition, ${bpm}, ${key}, ${lang} lyrics.\n${vocal} — authentic phrasing.\nTheme: ${theme}\nKeep: ${keep}\n\n[Intro] establish mood\n[Verse 1] ${lang} lyrics, ${theme}\n[Chorus] hook in ${lang}\n[Outro] fade\n\nTempo: ${bpm} | Key: ${key} | Vocal: ${vocal}\nReinforcement: Fresh ${lang} lyrics — same feel as reference`;
});

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
  const prov = d.nlProvider === 'auto' ? 'Use best AI judgment.' : `Optimized for ${d.nlProvider}.`;
  $('newLyricsOut').value = `✍️ NEW LYRICS PROMPT\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nGenre: ${d.nlGenre} | Lang: ${d.nlLang} | Vocal: ${d.nlVocal}\nTheme: ${d.nlTheme} | Mood: ${d.nlMood}\nStruct: ${d.nlStruct} | BPM: ${d.nlBpm||'medium'}\n${d.nlSpecial?'Special: '+d.nlSpecial:''}\n${prov}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nWRITE:\n[Mukhda/Hook] catchy 2-4 lines, AABB rhyme\n[Verse 1] develop theme: ${d.nlTheme}\n[Verse 2] fresh angle, escalate emotion\n[Bridge] contrast/resolution\n\nOutput: full lyrics + section labels + melody hints (UP/DOWN/HOLD)`;
  $('newLyricsOutCard')?.classList.remove('hidden');
  $('newLyricsOutCard')?.scrollIntoView({ behavior: 'smooth' });
});

$('origLyricsForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  $('origLyricsOut').value = `📝 LYRICS ANALYSIS\nGenre: ${d.olGenre} | Lang: ${d.olLang}\n\nANALYZE:\n${d.olLyrics?.trim()||'[Paste lyrics above]'}\n\n1. Translation\n2. Structure map\n3. Rhyme scheme\n4. Syllable count\n5. Emotional arc\n6. Cultural references\n7. Melody suggestions\n8. Singability score`;
  $('origLyricsOutCard')?.classList.remove('hidden');
  $('origLyricsOutCard')?.scrollIntoView({ behavior: 'smooth' });
});

$('refLyricsForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  $('refLyricsOut').value = `🔗 REFERENCE LYRICS\nNew Lang: ${d.rlLang} | Vocal: ${d.rlVocal}\nTheme: ${d.rlTheme} | Style: ${d.rlStyle}\n${d.rlSpecial?'Special: '+d.rlSpecial:''}\n\nCREATE: same meter + rhyme, new theme\nOutput: side-by-side original vs new`;
  $('refLyricsOutCard')?.classList.remove('hidden');
  $('refLyricsOutCard')?.scrollIntoView({ behavior: 'smooth' });
});

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
    if (!selSounds.length) { if(m) m.style.display=''; return; }
    if(m) m.style.display='none';
    selSounds.forEach(s => {
      const t = document.createElement('span'); t.className = 'sel-tag';
      t.textContent = s.split(' ').slice(0,3).join(' ') + ' ✕';
      t.onclick = () => { selSounds = selSounds.filter(x => x !== s); document.querySelectorAll(`.chip[data-sound="${CSS.escape(s)}"]`).forEach(c => c.classList.remove('active')); $('selCount').textContent = selSounds.length; t.remove(); if(!selSounds.length && m) m.style.display=''; };
      disp.appendChild(t);
    });
  });
});

$('btnClearNature')?.addEventListener('click', () => {
  selSounds = []; document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  $('selCount').textContent = '0';
  const d = $('selectedSoundsDisplay'); if (d) d.querySelectorAll('.sel-tag').forEach(t => t.remove());
  const m = $('noSelMsg'); if (m) m.style.display='';
});

$('btnGenNature')?.addEventListener('click', () => {
  if (!selSounds.length) { alert('Koi sound select karo!'); return; }
  const g = $('natGenre')?.value||'Ambient', mood = $('natMood')?.value||'Peaceful';
  const bpm = $('natBpm')?.value||'70 BPM', layer = $('natLayer')?.value||'Background';
  const intensity = $('natIntensity')?.value||'Moderate', special = $('natSpecial')?.value||'';
  $('natureOut').value = `[Stereo, spatial 3D, organic]\n\n${g}, ${bpm}, ${mood} mood.\nNature: ${selSounds.slice(0,5).join(', ')}.\n${layer}, ${intensity}.\n${special||'Blend nature sounds with music.'}\n\n[Intro] nature only — ${selSounds[0]}\n[Build] music enters softly\n[Main] full — nature at ${intensity}\n[Outro] music fades, nature returns\n\nMood: ${mood} | Tempo: ${bpm}\nReinforcement: organic character throughout`;
  $('natureOutCard')?.classList.remove('hidden');
  $('natureOutCard')?.scrollIntoView({ behavior: 'smooth' });
});

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
  if (p.paused) { p.play(); $('btnPlayPause').textContent = '⏸ Pause'; $('playerDisc')?.classList.add('spinning'); }
  else { p.pause(); $('btnPlayPause').textContent = '▶️ Play'; $('playerDisc')?.classList.remove('spinning'); }
});
$('btnPrev')?.addEventListener('click', () => loadTrack(curTrack - 1));
$('btnNext')?.addEventListener('click', () => loadTrack(curTrack + 1));
$('mainPlayer')?.addEventListener('ended', () => { if (curTrack < playlist.length - 1) loadTrack(curTrack + 1); else $('playerDisc')?.classList.remove('spinning'); });

renderPresets();
renderMyPresets();
show('home');
