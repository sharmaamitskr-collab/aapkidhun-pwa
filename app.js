const views=["home","prompt","presets","recorder","transcribe","analyze","lyrics","player","help"];
const $=(q)=>document.querySelector(q);
function show(view){views.forEach(v=>{const el=$(`#view-${v}`);if(!el)return;el.classList.toggle("hidden",v!==view)});document.querySelectorAll(".tab").forEach(b=>{b.classList.toggle("active",b.dataset.view===view)});window.scrollTo(0,0)}
document.querySelectorAll(".tab").forEach(b=>{b.addEventListener("click",()=>show(b.dataset.view))});
document.querySelectorAll("[data-goto]").forEach(b=>{b.addEventListener("click",()=>show(b.dataset.goto))});

// PROMPT
function buildPrompt(d){const lines=[`MODE: ${d.mode}`,`LANGUAGE: ${d.language}`,`THEME: ${d.theme}`,d.stylePack?`STYLE PACK: ${d.stylePack}`:"",d.tempo?`TEMPO: ${d.tempo}`:"",d.rhythm?`RHYTHM: ${d.rhythm}`:"",d.instruments?`INSTRUMENTS: ${d.instruments}`:"",`VOCAL: ${d.vocal}`,`DURATION: ${d.duration||"Unlimited"}`,`PREVIEW FIRST: ${d.previewFirst}`,d.lyricsRule?`LYRICS RULE: ${d.lyricsRule}`:"",d.reference?`REFERENCE: ${d.reference}`:""].filter(Boolean);return lines.join("\n")}
$("#promptForm").addEventListener("submit",(e)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target).entries());$("#promptOut").value=buildPrompt(d)});
$("#btnCopy").addEventListener("click",async()=>{const t=$("#promptOut").value.trim();if(!t)return;await navigator.clipboard.writeText(t);alert("Copied!")});
$("#btnClear").addEventListener("click",()=>{$("#promptOut").value=""});

// PRESETS
const builtInPresets=[
{id:"holi",title:"Rajasthani — Fagun Holi Dhamal",meta:"118 BPM • Chang Dhamal",data:{mode:"Holi Dhamal",language:"Marwadi",theme:"Fagun Holi masti, crowd singalong",stylePack:"Rajasthani-Marwadi Chang Dhamal",tempo:"118 BPM",rhythm:"Dhamal 4/4 swing + Chang accents",instruments:"Chang, Dholak, Khartal, Algoza, Harmonium",vocal:"AI Female Folk + Chorus",duration:"Unlimited",previewFirst:"YES",lyricsRule:"Clear pronunciation, short hook",reference:"https://www.youtube.com/watch?v=Gz_j8pPvjfI"}},
{id:"bhajan",title:"Pure Bhajan — Harmonium+Tabla",meta:"76 BPM • Keherwa",data:{mode:"Bhajan",language:"Hindi",theme:"Shri Ram bhajan",stylePack:"Bhajan-Pure",tempo:"76 BPM",rhythm:"Keherwa soft",instruments:"Harmonium, Tabla, Tanpura, Manjira",vocal:"My Recorded Voice",duration:"Unlimited",previewFirst:"YES",lyricsRule:"Clear words slow melody",reference:""}},
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
function buildTranscribePrompt(url,genre,inst,key,tempo){return `🎵 UNIVERSAL MUSIC TRANSCRIPTION PROMPT\n==========================================\nSOURCE: ${url}\nGENRE: ${genre}\nINSTRUMENTS: ${inst}\nKEY: ${key||"Auto-detect"}\nTEMPO: ${tempo||"Auto-detect"}\n==========================================\nA) SUMMARY: Title, Key, BPM, Time Sig, Arrangement Map\nB) MELODY: Note-by-note octave + timestamps + confidence\nC) CHORDS: Per measure + Roman numeral\nD) INSTRUMENTS: Role + loop + MIDI map + pan + volume\nE) PERCUSSION: Bar-by-bar + 4-bar loop + sync timestamps\nF) ARRANGEMENT: Entry/exit + dynamics\nG) DAW: Channels, pan, VST, FX\nH) CONFIDENCE: Per-section (0-1) + alternatives\n==========================================\nOUTPUT: [1] ABC Notation [2] Plain Text PDF\n==========================================`}
$("#tForm").addEventListener("submit",(e)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target).entries());const p=transcribePresets.find(x=>x.id===d.gp);$("#tText").value=buildTranscribePrompt(d.url,p?p.genre:d.gp,d.inst,d.key,d.tempo);$("#tOut").style.display="block"});
$("#tCopy").addEventListener("click",async()=>{await navigator.clipboard.writeText($("#tText").value);alert("Copied!")});
$("#tPDF").addEventListener("click",()=>printText("tText","Transcription Prompt"));

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
  if(activeTab==="link"&&onlineLink)src=onlineLink;
  else if(activeTab==="file"&&fileEl)src=fileEl.name;
  else if(activeTab==="link"&&!onlineLink){alert("Link dalo!");return}
  else if(activeTab==="file"&&!fileEl){alert("File select karo!");return}
  const genre=d.aGenre,key=d.aKey||"Auto-detect",bpm=d.aBpm||"Auto-detect",vocal=d.aVocal;
  document.getElementById("beatPrompt").value=`🥁 BEAT + RHYTHM SYNC PROMPT\n==========================================\nSOURCE: ${src}\nGENRE: ${genre} | BPM: ${bpm}\n==========================================\n1. EXACT BPM + tempo changes with timestamps\n2. TIME SIGNATURE + changes\n3. BEAT MAP every bar:\n   Bar 1: BEAT1(strong) beat2 BEAT3 beat4\n4. GROOVE PATTERN 1-4 bar loop\n5. ACCENT POINTS timestamps\n6. FILLS location + description\n7. SWING/SHUFFLE factor\n8. BEAT 1 SYNC TIMESTAMPS:\n   0:00.00, 0:02.03, 0:04.06...\n9. DAW GRID: BPM:${bpm} Quantize:1/16\n10. PERCUSSION INSTRUMENTS LIST\n==========================================\nOUTPUT: Beat map + ABC percussion`;
  document.getElementById("instrPrompt").value=`🎸 INSTRUMENTS DETECTION PROMPT\n==========================================\nSOURCE: ${src}\nGENRE: ${genre} | KEY: ${key} | BPM: ${bpm}\n==========================================\nFor EACH instrument:\n1. NAME (specific)\n2. ROLE: rhythm/melody/bass/pad/drone\n3. ENTRY + EXIT timestamp\n4. SECTIONS active in\n5. RHYTHMIC PATTERN 1-2 bar loop\n6. PITCH RANGE\n7. TIMBRE description\n8. MIDI: Channel + GM Patch + Velocity\n9. MIX: Pan + Volume + FX\nALSO:\n- Instrument timeline table\n- Layer combinations\n- Microtonal notes\n- Sample pack suggestions\n==========================================\nOUTPUT: Instrument table + loop notation`;
  document.getElementById("vocalPrompt").value=`🎤 VOCAL ANALYSIS PROMPT\n==========================================\nSOURCE: ${src}\nVOCAL: ${vocal} | GENRE: ${genre} | KEY: ${key}\n==========================================\n1. VOCAL TYPE: ${vocal}\n2. LEAD MELODY:\n   - Pitch range\n   - Note-by-note: 0:15 B4(q) A4(e) G4(h)\n   - Confidence per phrase\n3. HARMONY: voices + interval + timestamps\n4. ORNAMENTS: Meend, Gamak, Murki, bends\n5. LYRICS: phonetic + timestamps + syllables\n6. BREATH MARKS + PHRASES\n7. STYLE TAGS\n8. RECREATION: VST + pitch correct + FX\n==========================================\nOUTPUT: Notes + lyrics + confidence`;
  document.getElementById("fullPrompt").value=`🎵 FULL COMPOSITION PROMPT\n==========================================\nSOURCE: ${src}\nGENRE: ${genre} | KEY: ${key} | BPM: ${bpm}\nVOCAL: ${vocal}\n==========================================\nA) OVERVIEW: Key, BPM, Time Sig, Duration\nB) ARRANGEMENT MAP with timestamps\nC) MELODY: notes + chords + roman numerals\nD) ALL INSTRUMENTS (detailed)\nE) BEAT SYNC (detailed)\nF) VOCAL (detailed)\nG) NEW COMPOSITION GUIDE:\n   - Same BPM + key\n   - Different melody + lyrics\n   - Structure: Intro(8) Verse(16) Chorus(8) Bridge(8) Outro(4)\nH) SUNO/UDIO AI PROMPT (ready to use)\nI) DAW TEMPLATE\nJ) ABC NOTATION (MIDI ready)\nK) CONFIDENCE SCORES\n==========================================\nOUTPUT: Full analysis + ABC + DAW guide`;
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
  document.getElementById("newLyricsText").value=`✍️ NEW LYRICS PROMPT\n==========================================\nGENRE: ${d.lg} | LANGUAGE: ${d.ll}\nTHEME: ${d.ltheme} | MOOD: ${d.lmood}\nSTRUCTURE: ${d.lstruct} | VOCAL: ${d.lvocal}\nSPECIAL: ${d.lspecial||"None"}\n==========================================\nWrite COMPLETE ORIGINAL LYRICS:\nRULES:\n- Language: ${d.ll} ONLY\n- Mood: ${d.lmood}, Theme: ${d.ltheme}\n- Rhyme: AABB or ABAB\n- Max 8 syllables per line\n- NO copying existing songs\n\n[Mukhda/Hook] 4-8 catchy lines\n[Antara 1] 4-8 lines expand theme\n[Antara 2] 4-8 lines new angle\n[Bridge] 2-4 lines emotional peak\n\nALSO PROVIDE:\n- Syllable count per line\n- Melody contour HIGH/mid/low\n- BPM range suggestion\n- AI music tags for Suno/Udio\n==========================================`;
  document.getElementById("newLyricsOut").style.display="block";
});

// ORIGINAL LYRICS
$("#origLyricsForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const d=Object.fromEntries(new FormData(e.target).entries());
  const lyrics=e.target.olyrics.value;
  document.getElementById("origLyricsText").value=`📜 ORIGINAL LYRICS PROMPT\n==========================================\nSONG: ${d.otitle} | GENRE: ${d.og} | BPM: ${d.obpm||"auto"}\n==========================================\nMY LYRICS:\n${lyrics}\n==========================================\nProvide:\n1. MELODY: note sequence + octave per line\n2. RHYTHM: beat placement + BPM suggestion\n3. CHORDS: progression + key + roman numerals\n4. ARRANGEMENT: instruments + intro/outro\n5. AI PROMPT: Suno/Udio ready\n6. IMPROVEMENTS: rhyme + flow + alternatives\n==========================================`;
  document.getElementById("origLyricsOut").style.display="block";
});

// REFERENCE LYRICS
$("#refLyricsForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const d=Object.fromEntries(new FormData(e.target).entries());
  const reflyrics=e.target.rlyrics.value;
  document.getElementById("refLyricsText").value=`🎵 REFERENCE-BASED LYRICS PROMPT\n==========================================\nREF URL: ${d.rurl||"Not provided"}\nREF LYRICS:\n${reflyrics||"[Detect from URL]"}\n==========================================\nNEW: THEME:${d.rtheme} | LANG:${d.rlang} | MOOD:${d.rmood}\nSTRUCTURE: ${d.rstruct} | STYLE: ${d.rstyle||"Similar feel"}\n==========================================\nSTEP 1 - ANALYZE REFERENCE:\n- Syllable count per line\n- Rhyme scheme\n- Rhythmic pattern\n- Emotional tone\n\nSTEP 2 - WRITE NEW LYRICS:\n- SAME rhythm + syllable count\n- DIFFERENT words + meaning\n- Theme: ${d.rtheme}, Mood: ${d.rmood}\n- Language: ${d.rlang}\n- ZERO copying from reference\n\n[Mukhda] match reference pattern\n[Antara 1] match rhythm\n[Antara 2] match rhythm\n\nSTEP 3 - PROVIDE:\n- Syllable map + rhyme scheme\n- Pronunciation guide\n- Melody contour\n\nSTEP 4 - AI PROMPT:\nSuno/Udio ready with all tags\n==========================================`;
  document.getElementById("refLyricsOut").style.display="block";
});

// ===== MUSIC PLAYER =====
let playlist=[];
let currentTrack=0;
const mainPlayer=$("#mainPlayer");

function formatTime(s){if(isNaN(s))return"0:00";const m=Math.floor(s/60);const sec=Math.floor(s%60);return`${m}:${sec<10?"0"+sec:sec}`}

function loadTrack(idx){
  if(!playlist[idx])return;
  const track=playlist[idx];
  mainPlayer.src=track.url;
  $("#playerTitle").textContent="🎵 "+track.name;
  $("#pFile").textContent=track.name;
  $("#playerCard").style.display="block";
  $("#playerDisc").textContent="🎵";
  mainPlayer.load();
  // Auto rotate disc
  $("#playerDisc").style.animation="none";
  setTimeout(()=>$("#playerDisc").style.animation="spin 3s linear infinite",10);
}

function updatePlayBtn(){
  $("#btnPlayPause").textContent=mainPlayer.paused?"▶️ Play":"⏸️ Pause";
}

$("#btnPlayerUpload").addEventListener("click",()=>$("#playerFileInput").click());
$("#playerUploadBox").addEventListener("click",(e)=>{if(e.target.id!=="btnPlayerUpload")$("#playerFileInput").click()});

$("#playerFileInput").addEventListener("change",function(){
  if(!this.files.length)return;
  Array.from(this.files).forEach(f=>{
    const url=URL.createObjectURL(f);
    playlist.push({name:f.name,url});
  });
  currentTrack=playlist.length-this.files.length;
  loadTrack(currentTrack);
  renderPlaylist();
  $("#playerInfo").style.display="block";
  $("#playerFileName").textContent=playlist[currentTrack].name;
});

mainPlayer.addEventListener("timeupdate",()=>{
  $("#pDuration").textContent=formatTime(mainPlayer.currentTime)+" / "+formatTime(mainPlayer.duration);
});

mainPlayer.addEventListener("ended",()=>{
  if(currentTrack<playlist.length-1){currentTrack++;loadTrack(currentTrack);mainPlayer.play();renderPlaylist();}
  updatePlayBtn();
});

mainPlayer.addEventListener("play",updatePlayBtn);
mainPlayer.addEventListener("pause",updatePlayBtn);

$("#btnPlayPause").addEventListener("click",()=>{
  if(mainPlayer.paused)mainPlayer.play();
  else mainPlayer.pause();
});

$("#btnNext").addEventListener("click",()=>{
  if(currentTrack<playlist.length-1){currentTrack++;loadTrack(currentTrack);mainPlayer.play();renderPlaylist();}
});

$("#btnPrev").addEventListener("click",()=>{
  if(currentTrack>0){currentTrack--;loadTrack(currentTrack);mainPlayer.play();renderPlaylist();}
});

$("#btnPlaylist").addEventListener("click",()=>$("#playlistInput").click());
$("#playlistInput").addEventListener("change",function(){
  if(!this.files.length)return;
  Array.from(this.files).forEach(f=>{
    playlist.push({name:f.name,url:URL.createObjectURL(f)});
  });
  renderPlaylist();
  if(playlist.length===this.files.length){loadTrack(0);}
});

function renderPlaylist(){
  const container=document.getElementById("playlistItems");
  if(!playlist.length){container.innerHTML=`<div class="muted small">No tracks yet.</div>`;return}
  container.innerHTML="";
  playlist.forEach((t,i)=>{
    const div=document.createElement("div");
    div.className="presetItem";
    div.style.cursor="pointer";
    div.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:13px;${i===currentTrack?"color:#ff6b00;font-weight:800":""}">${i===currentTrack?"▶️ ":"🎵 "}${t.name}</span>
      <button class="btn ghost" style="padding:6px 10px;font-size:12px" data-pidx="${i}">Play</button>
    </div>`;
    container.appendChild(div);
  });
  container.querySelectorAll("[data-pidx]").forEach(b=>{
    b.addEventListener("click",()=>{
      currentTrack=+b.dataset.pidx;
      loadTrack(currentTrack);
      mainPlayer.play();
      renderPlaylist();
    });
  });
}

// Add spin animation
const style=document.createElement("style");
style.textContent=`
.player-art{display:flex;justify-content:center;margin:16px 0}
.player-disc{width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#ff6b00,#ffb347);display:flex;align-items:center;justify-content:center;font-size:40px;box-shadow:0 8px 24px rgba(255,107,0,.3)}
.player-controls{display:flex;gap:10px;justify-content:center;margin:10px 0}
.analyze-tabs{display:flex;gap:8px;margin:10px 0}
.atab{padding:8px 14px;border:1.5px solid var(--border);background:#fff;color:var(--text);border-radius:20px;cursor:pointer;font-size:13px;font-weight:600}
.atab.active{background:linear-gradient(135deg,#ff6b00,#ff8c00);border-color:#ff6b00;color:#fff;font-weight:800}
.lyric-modes{display:flex;gap:8px;margin:10px 0;flex-wrap:wrap}
.lmode{padding:8px 14px;border:1.5px solid var(--border);background:#fff;color:var(--text);border-radius:20px;cursor:pointer;font-size:13px;font-weight:600}
.lmode.active{background:linear-gradient(135deg,#ff6b00,#ff8c00);border-color:#ff6b00;color:#fff;font-weight:800}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;
document.head.appendChild(style);

show("home");
