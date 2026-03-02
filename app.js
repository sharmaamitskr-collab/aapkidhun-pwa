const views=["home","prompt","presets","recorder","transcribe","analyze","help"];
const $=(q)=>document.querySelector(q);
function show(view){views.forEach(v=>{const el=$(`#view-${v}`);if(!el)return;el.classList.toggle("hidden",v!==view)});document.querySelectorAll(".tab").forEach(b=>{b.classList.toggle("active",b.dataset.view===view)});window.scrollTo(0,0)}
document.querySelectorAll(".tab").forEach(b=>{b.addEventListener("click",()=>show(b.dataset.view))});
document.querySelectorAll("[data-goto]").forEach(b=>{b.addEventListener("click",()=>show(b.dataset.goto))});

// PROMPT BUILDER
function buildPrompt(d){const lines=[`MODE: ${d.mode}`,`LANGUAGE: ${d.language}`,`THEME: ${d.theme}`,`STYLE PACK: ${d.stylePack}`,`TEMPO: ${d.tempo||""}`.trim(),`RHYTHM: ${d.rhythm||""}`.trim(),`INSTRUMENTS: ${d.instruments||""}`.trim(),`VOCAL: ${d.vocal}`,`DURATION: ${d.duration||"Unlimited"}`,`PREVIEW FIRST: ${d.previewFirst}`,`LYRICS RULE: ${d.lyricsRule||""}`.trim(),`REFERENCE: ${d.reference||""}`.trim()].filter(Boolean);return lines.join("\n")}
$("#promptForm").addEventListener("submit",(e)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target).entries());$("#promptOut").value=buildPrompt(d)});
$("#btnCopy").addEventListener("click",async()=>{const t=$("#promptOut").value.trim();if(!t)return;await navigator.clipboard.writeText(t);alert("Copied!")});
$("#btnClear").addEventListener("click",()=>{$("#promptOut").value=""});

// PRESETS
const builtInPresets=[{id:"holi-marwadi",title:"Rajasthani — Fagun Holi Dhamal",meta:"118 BPM • Dhamal 4/4",data:{mode:"Holi Dhamal",language:"Marwadi",theme:"Fagun Holi masti, crowd singalong",stylePack:"Rajasthani-Marwadi (Chang Dhamal)",tempo:"118 BPM",rhythm:"Dhamal 4/4 swing + Chang accents",instruments:"Chang, Dholak, Khartal, Algoza, Harmonium",vocal:"AI Female Folk + Chorus",duration:"Unlimited",previewFirst:"YES (3 previews, 20 sec)",lyricsRule:"Clear pronunciation, short hook, call-response",reference:"https://www.youtube.com/watch?v=Gz_j8pPvjfI"}},{id:"bhajan",title:"Pure Bhajan — Harmonium+Tabla",meta:"76 BPM • Keherwa",data:{mode:"Bhajan",language:"Hindi",theme:"Shri Ram bhajan",stylePack:"Bhajan-Pure",tempo:"76 BPM",rhythm:"Keherwa (soft)",instruments:"Harmonium, Tabla, Tanpura, Manjira",vocal:"My Recorded Voice",duration:"Unlimited",previewFirst:"YES",lyricsRule:"Clear words, slow melody",reference:""}},{id:"instrumental",title:"Instrumental — Acoustic/Cinematic",meta:"92 BPM • No vocal",data:{mode:"Instrumental",language:"Hindi",theme:"Instrumental only",stylePack:"Instrumental-Core",tempo:"92 BPM",rhythm:"4/4 steady",instruments:"Guitar, Piano, soft percussion",vocal:"None",duration:"Unlimited",previewFirst:"YES",lyricsRule:"N/A",reference:""}}];
function renderPresets(){const list=$("#presetList");list.innerHTML="";builtInPresets.forEach(p=>{const div=document.createElement("div");div.className="presetItem";div.innerHTML=`<h3>${p.title}</h3><div class="meta">${p.meta}</div><div class="rowbtn"><button class="btn" data-load="${p.id}">Load</button><button class="btn ghost" data-gen="${p.id}">Generate</button></div>`;list.appendChild(div)});list.querySelectorAll("[data-load]").forEach(b=>{b.addEventListener("click",()=>{const p=builtInPresets.find(x=>x.id===b.dataset.load);fillForm(p.data);show("prompt")})});list.querySelectorAll("[data-gen]").forEach(b=>{b.addEventListener("click",()=>{const p=builtInPresets.find(x=>x.id===b.dataset.gen);fillForm(p.data);$("#promptOut").value=buildPrompt(p.data);show("prompt")})})}
function fillForm(d){const f=$("#promptForm");for(const[k,v]of Object.entries(d)){const el=f.querySelector(`[name="${k}"]`);if(el)el.value=v}}
function getMyPresets(){try{return JSON.parse(localStorage.getItem("myPresets")||"[]")}catch{return[]}}
function setMyPresets(arr){localStorage.setItem("myPresets",JSON.stringify(arr))}
function renderMyPresets(){const list=$("#myPresetList");const arr=getMyPresets();list.innerHTML=arr.length?"":`<div class="muted">No saved presets yet.</div>`;arr.forEach((p,idx)=>{const div=document.createElement("div");div.className="presetItem";div.innerHTML=`<h3>${p.title}</h3><div class="meta">${p.meta}</div><div class="rowbtn"><button class="btn" data-load="${idx}">Load</button><button class="btn ghost" data-del="${idx}">Delete</button></div>`;list.appendChild(div)});list.querySelectorAll("[data-load]").forEach(b=>{b.addEventListener("click",()=>{const p=getMyPresets()[+b.dataset.load];fillForm(p.data);$("#promptOut").value=buildPrompt(p.data);show("prompt")})});list.querySelectorAll("[data-del]").forEach(b=>{b.addEventListener("click",()=>{const arr=getMyPresets();arr.splice(+b.dataset.del,1);setMyPresets(arr);renderMyPresets()})})}
$("#btnSavePreset").addEventListener("click",()=>{const f=$("#promptForm");const d=Object.fromEntries(new FormData(f).entries());const title=prompt("Preset naam?");if(!title)return;const arr=getMyPresets();arr.unshift({title,meta:`${d.mode} • ${d.tempo||""}`,data:d});setMyPresets(arr);alert("Saved!");renderMyPresets()});
renderPresets();renderMyPresets();

// INSTALL
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredPrompt=e;$("#btnInstall").style.display="inline-block"});
$("#btnInstall").addEventListener("click",async()=>{if(!deferredPrompt){alert("iPhone: Safari → Share → Add to Home Screen");return}deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null});

// RECORDER
let mediaRecorder,chunks=[];
const btnRec=$("#btnRec"),btnStop=$("#btnStop"),btnDl=$("#btnDownload"),playback=$("#playback");
btnRec.addEventListener("click",async()=>{const stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];mediaRecorder=new MediaRecorder(stream);mediaRecorder.ondataavailable=(e)=>chunks.push(e.data);mediaRecorder.onstop=()=>{const blob=new Blob(chunks,{type:"audio/webm"});const url=URL.createObjectURL(blob);playback.src=url;btnDl.href=url;btnDl.style.pointerEvents="auto";btnDl.style.opacity="1"};mediaRecorder.start();btnRec.disabled=true;btnStop.disabled=false});
btnStop.addEventListener("click",()=>{if(!mediaRecorder)return;mediaRecorder.stop();btnRec.disabled=false;btnStop.disabled=true});

// TRANSCRIBE
const transcribePresets=[{id:"folk",label:"🪘 Folk/Regional",genre:"Regional Folk",instruments:"Dholak, Harmonium, Flute, Chorus"},{id:"hindustani",label:"🎻 Hindustani Classical",genre:"Hindustani Classical",instruments:"Sitar, Tabla, Tanpura, Harmonium"},{id:"qawwali",label:"🕌 Qawwali/Sufi",genre:"Qawwali/Sufi",instruments:"Harmonium, Tabla, Dholak, Vocals"},{id:"bollywood",label:"🎬 Bollywood",genre:"Bollywood",instruments:"Orchestra, Synth, Tabla, Vocal"},{id:"jazz",label:"🎷 Jazz/Blues",genre:"Jazz/Blues",instruments:"Piano, Bass, Drums, Sax"},{id:"edm",label:"🎧 EDM",genre:"EDM/Electronic",instruments:"Synth, Sub bass, Drum machine"},{id:"world",label:"🌍 World Music",genre:"World Music",instruments:"Auto-detect all"}];
const tg=$("#tGenre");
transcribePresets.forEach(p=>{const o=document.createElement("option");o.value=p.id;o.textContent=p.label;tg.appendChild(o)});
tg.addEventListener("change",function(){const p=transcribePresets.find(x=>x.id===this.value);if(p)$("#tInst").value=p.instruments});
$("#tInst").value=transcribePresets[0].instruments;
function buildTranscribePrompt(url,genre,inst,key,tempo){return `🎵 UNIVERSAL MUSIC TRANSCRIPTION PROMPT\n==========================================\nURL: ${url}\nGenre: ${genre}\nInstruments: ${inst}\nKey: ${key||"Auto-detect"}\nTempo: ${tempo||"Auto-detect"}\n==========================================\nA) SUMMARY: Title, Key, BPM, Time Sig, Arrangement Map\nB) MELODY: Note-by-note with octave + timestamps + confidence\nC) CHORDS: Per measure + Roman numeral analysis\nD) INSTRUMENTS: Each instrument role + rhythmic loop + MIDI map\nE) PERCUSSION: Bar-by-bar groove + 4-bar loop\nF) ARRANGEMENT: Entry/exit timestamps + dynamics\nG) DAW: Channels, pan, VST suggestions, FX\nH) CONFIDENCE: Per-section accuracy (0-1)\n==========================================\nOUTPUT: [1] ABC Notation [2] Plain Text PDF\n==========================================`}
$("#tForm").addEventListener("submit",(e)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target).entries());const p=transcribePresets.find(x=>x.id===d.gp);$("#tText").value=buildTranscribePrompt(d.url,p?p.genre:d.gp,d.inst,d.key,d.tempo);$("#tOut").style.display="block"});
$("#tCopy").addEventListener("click",async()=>{await navigator.clipboard.writeText($("#tText").value);alert("Copied!")});
$("#tPDF").addEventListener("click",()=>{const t=$("#tText").value;const w=window.open("","_blank");w.document.write(`<html><head><title>Transcription</title><style>body{font-family:monospace;padding:24px;white-space:pre-wrap;font-size:13px}</style></head><body>${t.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</body></html>`);w.document.close();w.print()});

// ANALYZE
function copyText(id){navigator.clipboard.writeText(document.getElementById(id).value);alert("Copied!")}
function printText(id,title){const t=document.getElementById(id).value;const w=window.open("","_blank");w.document.write(`<html><head><title>${title}</title><style>body{font-family:monospace;padding:24px;white-space:pre-wrap;font-size:13px;line-height:1.6}</style></head><body>${t.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</body></html>`);w.document.close();w.print()}

$("#btnUpload").addEventListener("click",()=>$("#fileInput").click());
$("#uploadBox").addEventListener("click",()=>$("#fileInput").click());
$("#fileInput").addEventListener("change",function(){
  if(!this.files[0])return;
  const f=this.files[0];
  $("#fileName").textContent=f.name;
  $("#fileSize").textContent=`(${(f.size/1024/1024).toFixed(2)} MB)`;
  $("#fileInfo").style.display="flex";
});

$("#analyzeForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const f=$("#fileInput").files[0];
  const d=Object.fromEntries(new FormData(e.target).entries());
  const fname=f?f.name:"[uploaded file]";
  const genre=d.aGenre;const key=d.aKey||"Auto-detect";const bpm=d.aBpm||"Auto-detect";const vocal=d.aVocal;

  document.getElementById("beatPrompt").value=`🥁 BEAT + RHYTHM SYNC PROMPT
==========================================
FILE: ${fname}
GENRE: ${genre}
==========================================
Analyze this audio and provide:

1. EXACT BPM (auto-detect + timestamps for any tempo changes)
2. TIME SIGNATURE (e.g. 4/4, 6/8) with timestamps
3. BEAT MAP — bar by bar:
   Bar 1: BEAT 1(strong) beat2 BEAT3(medium) beat4
   Bar 2: ...
4. GROOVE PATTERN (1-4 bar loop):
   e.g. Dha-ge-na-Ti Dha-ge-na-Ti (tabla)
   e.g. KICK-hat-SNARE-hat (western)
5. ACCENT POINTS — where are the strong hits?
6. FILLS — where do drum fills occur? (timestamp)
7. SWING/SHUFFLE factor (if any)
8. SYNC POINTS — exact timestamps where beat 1 falls
   e.g. 0:00, 0:02.03, 0:04.06...
9. RECOMMENDED DAW GRID:
   • Grid: ${bpm||"auto"} BPM
   • Quantize: 1/16
   • Swing: [detected value]%
==========================================
OUTPUT: Plain text + ABC percussion notation`;

  document.getElementById("instrPrompt").value=`🎸 INSTRUMENTS DETECTION PROMPT
==========================================
FILE: ${fname}
GENRE: ${genre}
KEY: ${key}
BPM: ${bpm}
==========================================
Detect ALL instruments in this audio and for EACH provide:

1. INSTRUMENT NAME (specific — e.g. "Dholak" not just "drum")
2. ROLE: rhythm / melody / bass / pad / drone / ornament
3. ENTRY TIME: when does it first appear? (timestamp)
4. EXIT TIME: when does it stop? (timestamp)
5. RHYTHMIC PATTERN (1-2 bar loop in notation):
   e.g. Chang: X . . x . X . x (X=hit, .=rest)
6. PITCH RANGE: lowest to highest note played
7. TIMBRE: bright/warm/dry/wet/nasal/resonant
8. MIDI MAPPING:
   • Channel: [1-16]
   • Program/Patch: [GM patch name]
   • Velocity range: [0-127]
9. PAN POSITION: L/C/R + value
10. MIX LEVEL: relative volume (0-100)
11. FX: reverb/delay/compression suggestions

ALSO PROVIDE:
• Instrument interaction map (which play together)
• Arrangement timeline (which section has which instruments)
• Any microtonal/non-western tuning notes
==========================================
OUTPUT: Per-instrument table + ABC notation loops`;

  document.getElementById("vocalPrompt").value=`🎤 VOCAL ANALYSIS PROMPT
==========================================
FILE: ${fname}
VOCAL STYLE: ${vocal}
GENRE: ${genre}
KEY: ${key}
==========================================
Analyze ONLY the vocal track and provide:

1. VOCAL TYPE: ${vocal}
2. LEAD VOCAL:
   • Pitch range (e.g. C3–G5)
   • Melody note-by-note with octave numbers
   • Timestamps: 0:15 → B4(q) A4(e) G4(e) E4(h)
   • Confidence score per phrase (0-1)
3. CHORUS/HARMONY VOCALS:
   • How many voices?
   • Harmony interval (3rd/5th/octave?)
   • Timestamps
4. ORNAMENTS:
   • Meend (glide): from note → to note, timestamp
   • Gamak (oscillation): note, speed, timestamp
   • Murki (rapid grace notes): timestamp
   • Microtonal bends (>50 cents): mark as "approx"
5. LYRICS (if audible):
   • Phonetic transcription line by line
   • Timestamps per line
6. BREATH MARKS & PHRASES:
   • Where does singer breathe?
   • Phrase lengths in bars
7. VOCAL STYLE TAGS:
   e.g. nasal, breathy, powerful, soft, devotional
8. RECREATION GUIDE:
   • Suggested VST/plugin
   • Pitch correction settings
   • Reverb/delay for this vocal style
==========================================
OUTPUT: Note sequence + phonetic lyrics + confidence`;

  document.getElementById("fullPrompt").value=`🎵 FULL COMPOSITION PROMPT
==========================================
FILE: ${fname}
GENRE: ${genre} | KEY: ${key} | BPM: ${bpm}
VOCAL: ${vocal}
==========================================
Complete analysis + new composition guide:

A) FULL ANALYSIS
1. Key: ${key} — include enharmonic spelling
2. BPM: ${bpm} — all tempo changes with timestamps
3. Time Signature — changes with timestamps
4. Arrangement Map:
   [Intro] 0:00–0:XX — instruments: ...
   [Verse] 0:XX–0:XX — instruments: ...
   [Chorus] 0:XX–0:XX — instruments: ...
   [Bridge] 0:XX–0:XX — instruments: ...
   [Outro] 0:XX–end — instruments: ...

B) MELODY (complete)
• Full note sequence: E4(q) D4(e) F#4(h)...
• Chord progression: ||: Am | G | F | E :||
• Roman numeral: i–VII–VI–V

C) ALL INSTRUMENTS (see Instruments Prompt)
D) BEAT SYNC (see Beat Prompt)
E) VOCAL (see Vocal Prompt)

F) NEW COMPOSITION GUIDE
Using this song as reference, create NEW original composition:
1. Keep: same BPM + time signature
2. Use: same scale/key
3. Change: melody, lyrics, arrangement
4. Instruments to use: [detected list]
5. Structure: Intro(8 bars) Verse(16) Chorus(8) Bridge(8) Outro(4)
6. Suggested DAW template setup

G) ABC NOTATION (full song — MIDI ready)
H) CONFIDENCE SCORES per section
==========================================
OUTPUT: Complete sheet + ABC + DAW guide`;

  $("#analyzeOut").style.display="block";
  window.scrollTo(0,400);
});

show("home");
