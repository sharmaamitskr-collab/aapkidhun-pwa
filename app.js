const views=["home","prompt","presets","recorder","transcribe","analyze","lyrics","help"];
const $=(q)=>document.querySelector(q);
function show(view){views.forEach(v=>{const el=$(`#view-${v}`);if(!el)return;el.classList.toggle("hidden",v!==view)});document.querySelectorAll(".tab").forEach(b=>{b.classList.toggle("active",b.dataset.view===view)});window.scrollTo(0,0)}
document.querySelectorAll(".tab").forEach(b=>{b.addEventListener("click",()=>show(b.dataset.view))});
document.querySelectorAll("[data-goto]").forEach(b=>{b.addEventListener("click",()=>show(b.dataset.goto))});

// PROMPT BUILDER
function buildPrompt(d){const lines=[`MODE: ${d.mode}`,`LANGUAGE: ${d.language}`,`THEME: ${d.theme}`,`STYLE PACK: ${d.stylePack}`,d.tempo?`TEMPO: ${d.tempo}`:"",d.rhythm?`RHYTHM: ${d.rhythm}`:"",d.instruments?`INSTRUMENTS: ${d.instruments}`:"",`VOCAL: ${d.vocal}`,`DURATION: ${d.duration||"Unlimited"}`,`PREVIEW FIRST: ${d.previewFirst}`,d.lyricsRule?`LYRICS RULE: ${d.lyricsRule}`:"",d.reference?`REFERENCE: ${d.reference}`:""].filter(Boolean);return lines.join("\n")}
$("#promptForm").addEventListener("submit",(e)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target).entries());$("#promptOut").value=buildPrompt(d)});
$("#btnCopy").addEventListener("click",async()=>{const t=$("#promptOut").value.trim();if(!t)return;await navigator.clipboard.writeText(t);alert("Copied!")});
$("#btnClear").addEventListener("click",()=>{$("#promptOut").value=""});

// PRESETS
const builtInPresets=[
{id:"holi",title:"Rajasthani — Fagun Holi Dhamal",meta:"118 BPM • Chang Dhamal",data:{mode:"Holi Dhamal",language:"Marwadi",theme:"Fagun Holi masti, crowd singalong",stylePack:"Rajasthani-Marwadi Chang Dhamal",tempo:"118 BPM",rhythm:"Dhamal 4/4 swing + Chang accents",instruments:"Chang, Dholak, Khartal, Algoza, Harmonium",vocal:"AI Female Folk + Chorus",duration:"Unlimited",previewFirst:"YES (3 previews, 20 sec)",lyricsRule:"Clear pronunciation, short hook, call-response",reference:"https://www.youtube.com/watch?v=Gz_j8pPvjfI"}},
{id:"bhajan",title:"Pure Bhajan — Harmonium+Tabla",meta:"76 BPM • Keherwa",data:{mode:"Bhajan",language:"Hindi",theme:"Shri Ram bhajan",stylePack:"Bhajan-Pure",tempo:"76 BPM",rhythm:"Keherwa soft",instruments:"Harmonium, Tabla, Tanpura, Manjira",vocal:"My Recorded Voice",duration:"Unlimited",previewFirst:"YES",lyricsRule:"Clear words, slow melody",reference:""}},
{id:"instrumental",title:"Instrumental — Cinematic",meta:"92 BPM • No vocal",data:{mode:"Instrumental",language:"Hindi",theme:"Instrumental only",stylePack:"Instrumental-Core",tempo:"92 BPM",rhythm:"4/4 steady",instruments:"Guitar, Piano, soft percussion",vocal:"None",duration:"Unlimited",previewFirst:"YES",lyricsRule:"N/A",reference:""}}
];
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
btnRec.addEventListener("click",async()=>{try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];mediaRecorder=new MediaRecorder(stream);mediaRecorder.ondataavailable=(e)=>chunks.push(e.data);mediaRecorder.onstop=()=>{const blob=new Blob(chunks,{type:"audio/webm"});const url=URL.createObjectURL(blob);playback.src=url;btnDl.href=url;btnDl.style.pointerEvents="auto";btnDl.style.opacity="1"};mediaRecorder.start();btnRec.disabled=true;btnStop.disabled=false}catch(err){alert("Mic permission do: "+err.message)}});
btnStop.addEventListener("click",()=>{if(!mediaRecorder)return;mediaRecorder.stop();btnRec.disabled=false;btnStop.disabled=true});

// TRANSCRIBE
const transcribePresets=[
{id:"folk",label:"🪘 Folk/Regional",genre:"Regional Folk",instruments:"Dholak, Harmonium, Flute, Chorus"},
{id:"hindustani",label:"🎻 Hindustani Classical",genre:"Hindustani Classical",instruments:"Sitar, Tabla, Tanpura, Harmonium"},
{id:"carnatic",label:"🎵 Carnatic",genre:"Carnatic Classical",instruments:"Veena, Mridangam, Violin, Flute"},
{id:"qawwali",label:"🕌 Qawwali/Sufi",genre:"Qawwali/Sufi",instruments:"Harmonium, Tabla, Dholak, Vocals"},
{id:"bollywood",label:"🎬 Bollywood",genre:"Bollywood",instruments:"Orchestra, Synth, Tabla, Vocal"},
{id:"jazz",label:"🎷 Jazz/Blues",genre:"Jazz/Blues",instruments:"Piano, Bass, Drums, Sax"},
{id:"western",label:"🎼 Western Classical",genre:"Western Classical",instruments:"Piano, Violin, Cello, Orchestra"},
{id:"hiphop",label:"🎤 Hip-Hop/R&B",genre:"Hip-Hop/R&B",instruments:"808 Bass, Drum machine, Synth, Vocal"},
{id:"edm",label:"🎧 EDM",genre:"EDM/Electronic",instruments:"Synth lead, Sub bass, Drum machine"},
{id:"flamenco",label:"💃 Flamenco/Latin",genre:"Flamenco/Latin",instruments:"Guitar, Cajon, Violin, Vocals"},
{id:"reggae",label:"🌴 Reggae/Afrobeat",genre:"Reggae/Afrobeat",instruments:"Bass, Drums, Guitar, Keyboard"},
{id:"world",label:"🌍 World Music",genre:"World Music",instruments:"Auto-detect all"}
];
const tg=$("#tGenre");
transcribePresets.forEach(p=>{const o=document.createElement("option");o.value=p.id;o.textContent=p.label;tg.appendChild(o)});
tg.addEventListener("change",function(){const p=transcribePresets.find(x=>x.id===this.value);if(p)$("#tInst").value=p.instruments});
$("#tInst").value=transcribePresets[0].instruments;
function buildTranscribePrompt(url,genre,inst,key,tempo){return `🎵 UNIVERSAL MUSIC TRANSCRIPTION PROMPT
==========================================
SOURCE URL: ${url}
GENRE: ${genre}
INSTRUMENTS: ${inst}
KEY: ${key||"Auto-detect"}
TEMPO: ${tempo||"Auto-detect BPM"}
==========================================
A) SUMMARY
1. Title + Source info
2. Detected Key (with enharmonic spellings)
3. BPM + all tempo changes with timestamps
4. Time Signature(s) with timestamps
5. Arrangement Map:
   [Intro] 0:00-0:XX instruments: ...
   [Verse] 0:XX-0:XX instruments: ...
   [Chorus] 0:XX-0:XX instruments: ...
   [Outro] 0:XX-end instruments: ...

B) MELODY & HARMONY
1. Melody note-by-note with octave numbers
   e.g. E4(q) D#4(e) F#4(h) G4(q)
2. Chord progression per measure:
   ||: Am | G | F | E :||
3. Roman numeral analysis relative to key
4. Timestamps + confidence score per phrase

C) INSTRUMENTATION
For EACH instrument:
• Name (specific) + Role
• 1-2 bar rhythmic loop pattern
• Timbre description
• MIDI channel + patch suggestion
• Pan + volume level

D) PERCUSSION / RHYTHM
• Bar-by-bar groove notation
• Accent points + ghost notes
• 4-bar loop transcription
• Sync timestamps (where beat 1 falls)

E) ARRANGEMENT NOTES
• Entry/exit timestamp per instrument
• Dynamics: p / mp / mf / f
• Harmony voicing suggestions

F) DAW RECREATION
• Channel list + pan + volume
• VST/sample plugin suggestions
• Reverb/delay/EQ per channel

G) CONFIDENCE SCORES
• Per-section pitch accuracy (0.0-1.0)
• Flag ambiguous notes with 2 alternatives
==========================================
OUTPUT:
[1] ABC NOTATION (MIDI-ready copy-paste)
[2] PLAIN TEXT (PDF-printable)
==========================================`}
$("#tForm").addEventListener("submit",(e)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target).entries());const p=transcribePresets.find(x=>x.id===d.gp);$("#tText").value=buildTranscribePrompt(d.url,p?p.genre:d.gp,d.inst,d.key,d.tempo);$("#tOut").style.display="block"});
$("#tCopy").addEventListener("click",async()=>{await navigator.clipboard.writeText($("#tText").value);alert("Copied!")});
$("#tPDF").addEventListener("click",()=>{printText("tText","Transcription Prompt")});

// ANALYZE TABS
document.querySelectorAll(".atab").forEach(b=>{
  b.addEventListener("click",()=>{
    document.querySelectorAll(".atab").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    const tab=b.dataset.atab;
    document.getElementById("atab-file").style.display=tab==="file"?"block":"none";
    document.getElementById("atab-link").style.display=tab==="link"?"block":"none";
  });
});

// ANALYZE
function copyText(id){navigator.clipboard.writeText(document.getElementById(id).value);alert("Copied!")}
function printText(id,title){const t=document.getElementById(id).value;const w=window.open("","_blank");w.document.write(`<html><head><title>${title}</title><style>body{font-family:monospace;padding:24px;white-space:pre-wrap;font-size:13px;line-height:1.6}</style></head><body>${t.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</body></html>`);w.document.close();w.print()}
$("#btnUpload").addEventListener("click",()=>$("#fileInput").click());
$("#uploadBox").addEventListener("click",(e)=>{if(e.target.id!=="btnUpload")$("#fileInput").click()});
$("#fileInput").addEventListener("change",function(){if(!this.files[0])return;const f=this.files[0];$("#fileName").textContent=f.name;$("#fileSize").textContent=`(${(f.size/1024/1024).toFixed(2)} MB)`;$("#fileInfo").style.display="flex"});

$("#analyzeForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const d=Object.fromEntries(new FormData(e.target).entries());
  const activeTab=document.querySelector(".atab.active").dataset.atab;
  const onlineLink=$("#onlineLink").value.trim();
  const fileEl=$("#fileInput").files[0];
  let src="[source]";
  if(activeTab==="link"&&onlineLink){src=onlineLink}
  else if(activeTab==="file"&&fileEl){src=fileEl.name}
  else if(activeTab==="link"&&!onlineLink){alert("Link dalo pehle!");return}
  else if(activeTab==="file"&&!fileEl){alert("File select karo pehle!");return}
  const genre=d.aGenre;const key=d.aKey||"Auto-detect";const bpm=d.aBpm||"Auto-detect";const vocal=d.aVocal;

  document.getElementById("beatPrompt").value=`🥁 BEAT + RHYTHM SYNC PROMPT
==========================================
SOURCE: ${src}
GENRE: ${genre} | BPM: ${bpm}
==========================================
Analyze this audio and provide EXACT:

1. BPM (auto-detect) + all tempo changes with timestamps
2. TIME SIGNATURE + any changes with timestamps
3. BEAT MAP — every bar:
   Bar 1: BEAT1(strong) beat2 BEAT3 beat4
   Bar 2: ...
4. GROOVE PATTERN (1-4 bar loop in notation):
   e.g. Dha-ge-na-Ti Dha-ge-na-Ti
   e.g. KICK-hat-SNARE-hat-KICK-hat-SNARE
5. ACCENT POINTS — strong hit timestamps
6. FILLS — location + description (timestamp)
7. SWING/SHUFFLE factor if present
8. BEAT 1 SYNC TIMESTAMPS:
   Every bar start: 0:00.00, 0:02.03, 0:04.06...
9. DAW GRID SETTINGS:
   BPM: ${bpm}
   Quantize: 1/16
   Swing: [detected %]
10. PERCUSSION INSTRUMENTS LIST with roles
==========================================
OUTPUT: Plain text beat map + ABC percussion`;

  document.getElementById("instrPrompt").value=`🎸 INSTRUMENTS DETECTION PROMPT
==========================================
SOURCE: ${src}
GENRE: ${genre} | KEY: ${key} | BPM: ${bpm}
==========================================
Detect ALL instruments. For EACH provide:

1. INSTRUMENT NAME (specific, not generic)
2. ROLE: rhythm/melody/bass/pad/drone/ornament
3. ENTRY timestamp
4. EXIT timestamp
5. ACTIVE SECTIONS: Intro/Verse/Chorus/Bridge
6. RHYTHMIC PATTERN (1-2 bar loop):
   e.g. Chang: X . . x . X . x (X=hit .=rest)
7. PITCH RANGE: lowest → highest note
8. TIMBRE: bright/warm/dry/wet/nasal/resonant
9. MIDI MAPPING:
   Channel: [1-16]
   GM Patch: [name]
   Velocity: [range 0-127]
10. MIX:
    Pan: L30/C/R30
    Volume: [0-100]
    FX: [reverb/delay/compression]

PROVIDE ALSO:
• Full instrument timeline table
• Which instruments play together (layers)
• Any microtonal/non-western tuning notes
• Suggested sample packs for recreation
==========================================
OUTPUT: Per-instrument table + loop notation`;

  document.getElementById("vocalPrompt").value=`🎤 VOCAL ANALYSIS PROMPT
==========================================
SOURCE: ${src}
VOCAL: ${vocal} | GENRE: ${genre} | KEY: ${key}
==========================================
Analyze ONLY vocals. Provide:

1. VOCAL TYPE: ${vocal}
2. LEAD VOCAL MELODY:
   • Pitch range (e.g. C3-G5)
   • Note-by-note with octave:
     0:15 → B4(q) A4(e) G4(e) E4(h)
   • Confidence per phrase (0.0-1.0)
3. HARMONY/CHORUS VOCALS:
   • Number of voices
   • Harmony interval (3rd/5th/octave)
   • Entry/exit timestamps
4. ORNAMENTS (non-western):
   • Meend (glide): from→to note, timestamp
   • Gamak (oscillation): note+speed, timestamp
   • Murki (grace notes): timestamp
   • Microtonal bends >50 cents: mark "approx"
5. LYRICS:
   • Line-by-line phonetic transcription
   • Timestamp per line
   • Syllable count per line
6. BREATH MARKS + PHRASE LENGTHS
7. VOCAL STYLE TAGS:
   e.g. nasal, breathy, powerful, devotional
8. VOCAL RECREATION GUIDE:
   • Suggested VST/plugin
   • Pitch correction: amount + speed
   • Reverb: room size + wet %
   • Compression settings
==========================================
OUTPUT: Note sequence + lyrics + confidence`;

  document.getElementById("fullPrompt").value=`🎵 FULL COMPOSITION ANALYSIS PROMPT
==========================================
SOURCE: ${src}
GENRE: ${genre} | KEY: ${key} | BPM: ${bpm}
VOCAL: ${vocal}
==========================================
COMPLETE ANALYSIS:

A) OVERVIEW
• Key: ${key} (enharmonic spelling + scale notes)
• BPM: ${bpm} + all tempo changes
• Time Signature + changes
• Total duration + section count

B) ARRANGEMENT MAP (with timestamps)
[Intro]  0:00-0:XX  instruments: ...
[Verse1] 0:XX-0:XX  instruments: ...
[Chorus] 0:XX-0:XX  instruments: ...
[Verse2] 0:XX-0:XX  instruments: ...
[Bridge] 0:XX-0:XX  instruments: ...
[Outro]  0:XX-end   instruments: ...

C) MELODY (complete)
• Full note sequence with octave + timing
• Chord progression: ||: Am | G | F | E :||
• Roman numeral: i-VII-VI-V
• Key modulations (if any)

D) ALL INSTRUMENTS
(See Instruments Prompt — full detail)

E) BEAT SYNC
(See Beat Prompt — full detail)

F) VOCAL
(See Vocal Prompt — full detail)

G) NEW COMPOSITION GUIDE
To create NEW original song in same style:
1. Keep: BPM ${bpm} + time signature
2. Key: ${key} — use same scale
3. Change: melody, lyrics, arrangement
4. New structure:
   Intro(8 bars) Verse(16) Chorus(8) Bridge(8) Outro(4)
5. Instruments to use: [detected list]
6. Avoid: copying any melody/lyrics from source

H) SUNO/UDIO AI PROMPT
Ready-to-use AI music generation prompt:
[genre] [mood] [instruments] [bpm] [vocal style]
[key] [feel] [reference style — not exact copy]

I) DAW TEMPLATE
• Track list with settings
• Plugin suggestions
• Mix template

J) ABC NOTATION (full song MIDI-ready)

K) CONFIDENCE SCORES
• Per section accuracy (0.0-1.0)
• Ambiguous passages + alternatives
==========================================
OUTPUT: Complete analysis + ABC + DAW guide`;

  $("#analyzeOut").style.display="block";
  setTimeout(()=>document.getElementById("analyzeOut").scrollIntoView({behavior:"smooth"}),100);
});

// LYRICS MODES
document.querySelectorAll(".lmode").forEach(b=>{
  b.addEventListener("click",()=>{
    document.querySelectorAll(".lmode").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    document.querySelectorAll(".lview").forEach(x=>x.classList.add("hidden"));
    const el=document.getElementById(`lview-${b.dataset.lmode}`);
    if(el)el.classList.remove("hidden");
  });
});

// NEW LYRICS
$("#newLyricsForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const d=Object.fromEntries(new FormData(e.target).entries());
  document.getElementById("newLyricsText").value=`✍️ NEW LYRICS COMPOSITION PROMPT
==========================================
GENRE: ${d.lg}
LANGUAGE: ${d.ll}
THEME: ${d.ltheme}
MOOD: ${d.lmood}
STRUCTURE: ${d.lstruct}
VOCAL: ${d.lvocal}
SPECIAL: ${d.lspecial||"None"}
==========================================
Write COMPLETE ORIGINAL LYRICS:

RULES:
• Language: ${d.ll} ONLY
• Mood: ${d.lmood}
• Theme: ${d.ltheme}
• Rhyme scheme: AABB or ABAB
• Max 8 syllables per line (singable)
• NO copying existing songs
• Label each section clearly

STRUCTURE TO FOLLOW: ${d.lstruct}

FORMAT:
[Mukhda / Hook]
(4-8 catchy lines — sets the theme)

[Antara 1 / Verse 1]
(4-8 lines — expands theme)

[Antara 2 / Verse 2]
(4-8 lines — new angle)

[Bridge] (optional)
(2-4 lines — emotional peak)

ALSO PROVIDE:
• Syllable count per line
• Rhyme scheme used
• Suggested BPM range
• Melody contour (HIGH/mid/low per line)
• AI music generation tags:
  [genre] [mood] [instruments] [vocal style]
==========================================
OUTPUT: Complete lyrics + melody hints + AI tags`;
  document.getElementById("newLyricsOut").style.display="block";
});

// ORIGINAL LYRICS
$("#origLyricsForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const d=Object.fromEntries(new FormData(e.target).entries());
  const lyrics=e.target.olyrics.value;
  document.getElementById("origLyricsText").value=`📜 ORIGINAL LYRICS MUSIC PROMPT
==========================================
SONG: ${d.otitle}
GENRE: ${d.og}
BPM: ${d.obpm||"Auto-suggest"}
==========================================
MY LYRICS:
${lyrics}
==========================================
Based on my lyrics above, provide:

1. MELODY SUGGESTION:
   • Note sequence per line with octave
   • Syllable-to-note mapping
   • Octave range suggestion

2. RHYTHM MAPPING:
   • Beat placement per syllable
   • Stress/accent marks
   • BPM suggestion: ${d.obpm||"auto"}

3. CHORD PROGRESSION:
   • Suggested chords per line
   • Key suggestion
   • Roman numeral analysis

4. MUSIC ARRANGEMENT:
   • Instruments (based on genre: ${d.og})
   • Intro/Outro ideas
   • Section structure

5. AI MUSIC PROMPT (Suno/Udio ready):
   Complete prompt with genre, mood,
   instruments, vocal style, BPM, key

6. IMPROVEMENTS:
   • Rhyme suggestions
   • Flow/meter improvements
   • Alternative stronger lines
==========================================
OUTPUT: Melody notes + chords + AI prompt`;
  document.getElementById("origLyricsOut").style.display="block";
});

// REFERENCE LYRICS
$("#refLyricsForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const d=Object.fromEntries(new FormData(e.target).entries());
  const reflyrics=e.target.rlyrics.value;
  document.getElementById("refLyricsText").value=`🎵 REFERENCE-BASED NEW LYRICS PROMPT
==========================================
REFERENCE URL: ${d.rurl||"Not provided"}
REFERENCE LYRICS:
${reflyrics||"[Please detect/analyze from URL above]"}
==========================================
NEW COMPOSITION:
THEME: ${d.rtheme}
LANGUAGE: ${d.rlang}
MOOD: ${d.rmood}
STRUCTURE: ${d.rstruct}
STYLE: ${d.rstyle||"Similar rhythmic feel"}
==========================================
STEP 1 — ANALYZE REFERENCE:
• Detect rhythm pattern of lyrics
• Count syllables per line
• Identify rhyme scheme (AABB/ABAB/ABCB)
• Note emotional tone + language style
• Identify hook/catchphrase pattern

STEP 2 — WRITE NEW ORIGINAL LYRICS:
• SAME rhythm + syllable count as reference
• COMPLETELY DIFFERENT words + meaning
• New theme: ${d.rtheme}
• Mood: ${d.rmood}
• Language: ${d.rlang}
• STRICT RULE: Zero copying from reference

FORMAT:
[Mukhda / Hook]
(match reference syllable pattern)

[Antara 1 / Verse 1]
(match reference rhythm)

[Antara 2 / Verse 2]
(match reference rhythm)

STEP 3 — PROVIDE:
• Syllable count per line (verify matches)
• Rhyme scheme used
• Pronunciation guide for difficult words
• Melody contour (HIGH/mid/low)

STEP 4 — AI MUSIC GENERATION PROMPT:
Complete Suno/Udio prompt:
• Genre tags
• Mood/feel tags
• Instrument tags
• Vocal style
• BPM + key
• Style reference (NOT exact copy)
==========================================
OUTPUT: New lyrics + syllable map + AI prompt`;
  document.getElementById("refLyricsOut").style.display="block";
});

show("home");
