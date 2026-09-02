const PRESETS=DATA.presets;
const GROUPS=DATA.groups;
const CHIPS=DATA.chips;
const PALETTE=["#c4785a","#6f8f78","#5e7a92","#c4b49a","#a97878","#5f8c88","#8a8074","#6a7380"];
const storeKey="spin-hk-pages-v3";
const canvas=document.getElementById("wheel");
const ctx=canvas.getContext("2d");
const optionsEl=document.getElementById("options");
const historyEl=document.getElementById("history");
const spinBtn=document.getElementById("spinBtn");
const modal=document.getElementById("modal");
const winnerTitle=document.getElementById("winnerTitle");
const winnerEmoji=document.getElementById("winnerEmoji");
const soundBtn=document.getElementById("soundBtn");
const elimSwitch=document.getElementById("elimSwitch");
const weightSwitch=document.getElementById("weightSwitch");
const weightHint=document.getElementById("weightHint");
const tabsEl=document.getElementById("tabs");
const chipsEl=document.getElementById("chips");
const themeLabel=document.getElementById("themeLabel");
const saveModal=document.getElementById("saveModal");
const saveName=document.getElementById("saveName");
const confettiCanvas=document.getElementById("confetti");
const cctx=confettiCanvas.getContext("2d");
const uid=()=>Math.random().toString(36).slice(2,9);
const state={options:[],rotation:0,spinning:false,showWeights:false,eliminate:false,sound:true,history:[],saved:[],activePreset:"eat",activeSavedId:null,group:"picks",particles:[]};
function fromPreset(items){return items.map((item,i)=>({id:uid(),label:item.l,emoji:item.e||"\u2728",color:PALETTE[i%PALETTE.length],weight:1}));}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){if(c==="&")return "\u0026amp;";if(c==="<")return "\u0026lt;";if(c===">")return "\u0026gt;";if(c==='"')return "\u0026quot;";return "\u0026#39;";});}
function chipFor(key){return CHIPS.find(function(c){return c.key===key && c.group!=="picks";})||CHIPS.find(function(c){return c.key===key;});}
function load(){
  try{
    var data=JSON.parse(localStorage.getItem(storeKey)||"null");
    if(data&&data.options&&data.options.length){
      state.options=data.options.map(function(o,i){return {id:o.id||uid(),label:String(o.label||""),emoji:o.emoji||"\u2728",color:o.color||PALETTE[i%PALETTE.length],weight:Math.max(1,Number(o.weight)||1)};});
      state.history=(data.history||[]).map(function(h){return {id:h.id||uid(),label:h.label,emoji:h.emoji||"\u2728",time:h.time||""};});
      state.saved=(data.saved||[]).filter(function(w){return w&&w.options&&w.options.length>=2;});
      state.sound=data.sound!==false;state.eliminate=!!data.eliminate;state.showWeights=!!data.showWeights;
      state.activePreset=data.activePreset||null;state.activeSavedId=data.activeSavedId||null;
    } else state.options=fromPreset(PRESETS.eat);
  }catch(e){state.options=fromPreset(PRESETS.eat);}
  var hash=location.hash.replace(/^#w=/,"");
  if(hash){try{var parsed=JSON.parse(decodeURIComponent(escape(atob(hash))));if(Array.isArray(parsed)&&parsed.length>=2){state.options=parsed.map(function(p,i){return {id:uid(),label:String(p.l).slice(0,42),emoji:p.e||"\u2728",color:PALETTE[i%PALETTE.length],weight:Math.max(1,Number(p.w)||1)};});state.activePreset=null;state.activeSavedId=null;}}catch(e){}}
  syncToggles();
}
function save(){localStorage.setItem(storeKey,JSON.stringify({options:state.options,history:state.history.slice(0,20),saved:state.saved.slice(0,24),sound:state.sound,eliminate:state.eliminate,showWeights:state.showWeights,activePreset:state.activePreset,activeSavedId:state.activeSavedId}));}
function syncToggles(){soundBtn.style.opacity=state.sound?"1":".45";elimSwitch.classList.toggle("on",state.eliminate);weightSwitch.classList.toggle("on",state.showWeights);weightHint.style.display=state.showWeights?"block":"none";}
function slices(){var total=state.options.reduce(function(s,o){return s+Math.max(1,Number(o.weight)||1);},0)||1;var angle=0;return state.options.map(function(o){var size=(Math.max(1,Number(o.weight)||1)/total)*Math.PI*2;var slice=Object.assign({},o,{start:angle,end:angle+size,size:size});angle+=size;return slice;});}
function contrast(hex){var c=hex.replace("#","");var y=(parseInt(c.slice(0,2),16)*299+parseInt(c.slice(2,4),16)*587+parseInt(c.slice(4,6),16)*114)/1000;return y>=150?"#1c1916":"#f7f4ef";}
function truncate(text,max){var chars=Array.from(String(text||""));if(!chars.length)return "";var t=chars.join("");if(ctx.measureText(t).width<=max)return t;while(chars.length&&ctx.measureText(chars.join("")+"\u2026").width>max)chars.pop();return chars.join("")+"\u2026";}
function drawWheel(){
  var w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,r=Math.min(w,h)/2-28;
  ctx.clearRect(0,0,w,h);
  ctx.beginPath();ctx.arc(cx,cy,r+16,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,.03)";ctx.fill();
  ctx.save();ctx.translate(cx,cy);ctx.rotate(state.rotation);
  var segs=slices();
  if(!segs.length){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle="#161618";ctx.fill();}
  else segs.forEach(function(seg){
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,seg.start,seg.end);ctx.closePath();
    ctx.fillStyle=seg.color;ctx.fill();ctx.strokeStyle="rgba(10,10,11,.55)";ctx.lineWidth=1.5;ctx.stroke();
    var mid=(seg.start+seg.end)/2;ctx.save();ctx.rotate(mid);
    var flip=mid>Math.PI/2&&mid<Math.PI*1.5;if(flip)ctx.rotate(Math.PI);
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=contrast(seg.color);
    var fs=segs.length>10?18:segs.length>6?22:26;
    if(seg.emoji){ctx.font=(fs+6)+'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';ctx.fillText(seg.emoji,flip?-(r*0.46):r*0.46,0);}
    ctx.font="500 "+fs+'px "Noto Sans TC",sans-serif';
    ctx.fillText(truncate(seg.label,r*0.42),flip?-(r*0.78):r*0.78,0);
    ctx.restore();
  });
  ctx.beginPath();ctx.arc(0,0,r+8,0,Math.PI*2);ctx.strokeStyle="rgba(232,233,237,.16)";ctx.lineWidth=12;ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,r+1,0,Math.PI*2);ctx.strokeStyle="rgba(10,10,11,.7)";ctx.lineWidth=3;ctx.stroke();
  for(var i=0;i<48;i++){var a=(i/48)*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*(r+4),Math.sin(a)*(r+4));ctx.lineTo(Math.cos(a)*(r+11),Math.sin(a)*(r+11));ctx.strokeStyle=i%4===0?"rgba(232,233,237,.45)":"rgba(232,233,237,.16)";ctx.lineWidth=i%4===0?1.5:1;ctx.stroke();}
  ctx.restore();
  ctx.beginPath();ctx.arc(cx,cy,46,0,Math.PI*2);ctx.fillStyle="#121214";ctx.fill();
  ctx.strokeStyle="rgba(232,233,237,.22)";ctx.lineWidth=3;ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,10,0,Math.PI*2);ctx.fillStyle="#e8e9ed";ctx.fill();
}
function currentTitle(){
  if(state.activeSavedId){var w=state.saved.find(function(s){return s.id===state.activeSavedId;});if(w)return (w.emoji||"\u2728")+" "+w.name;}
  var chip=chipFor(state.activePreset);if(chip)return chip.emoji+" "+chip.label;
  return "\u81ea\u5df1\u6c7a\u5b9a";
}
function renderTheme(){themeLabel.textContent=currentTitle()+" \u00b7 "+state.options.length+" \u500b\u9078\u9805";}
function renderTabs(){
  tabsEl.innerHTML=GROUPS.map(function(g){return '<button type="button" class="'+(state.group===g.id?"on":"")+'" data-g="'+g.id+'">'+esc(g.label)+"</button>";}).join("");
}
function renderChips(){
  if(state.group==="custom"){
    if(!state.saved.length){chipsEl.innerHTML='<p class="hint" style="padding:.35rem 0">\u6539\u597d\u9078\u9805\u4e4b\u5f8c\u64b3\u66f8\u7c64\uff0c\u5c31\u53ef\u4ee5\u5132\u5b58\u81ea\u5df1\u5605\u76e4\u3002</p>';return;}
    chipsEl.innerHTML=state.saved.map(function(w){
      return '<span class="saved '+(state.activeSavedId===w.id?"on":"")+'"><button type="button" data-saved="'+w.id+'"><span class="emoji">'+esc(w.emoji||"\u2728")+"</span> "+esc(w.name)+'</button><button type="button" class="x" data-delsaved="'+w.id+'" aria-label="\u522a\u8d70">\u00d7</button></span>';
    }).join("");
    return;
  }
  chipsEl.innerHTML=CHIPS.filter(function(c){return c.group===state.group;}).map(function(c){
    return '<button type="button" class="'+(state.activePreset===c.key?"on":"")+'" data-k="'+c.key+'"><span class="emoji">'+esc(c.emoji)+"</span> "+esc(c.label)+"</button>";
  }).join("");
}
function renderOptions(){
  optionsEl.innerHTML=state.options.length?state.options.map(function(o){
    return '<li class="option" data-id="'+o.id+'"><span class="swatch" style="background:'+o.color+'"></span><span class="emoji">'+esc(o.emoji||"\u2728")+'</span><input class="label" type="text" maxlength="42" value="'+esc(o.label)+'" /><input class="weight" type="number" min="1" max="20" value="'+o.weight+'" '+(state.showWeights?"":'style="display:none"')+' /><button class="del" type="button" aria-label="\u522a\u9664">\u00d7</button></li>';
  }).join(""):'<li class="sub" style="padding:2rem 0;text-align:center">\u63c0\u4e0a\u9762\u4e00\u500b\u4e3b\u984c\uff0c\u6216\u8005\u6700\u5c11\u52a0\u5169\u500b\u9078\u9805\u3002</li>';
}
function renderHistory(){
  var clearBtn=document.getElementById("clearHistory");
  clearBtn.style.display=state.history.length?"inline":"none";
  historyEl.innerHTML=state.history.length?state.history.slice(0,8).map(function(h){
    return '<li><span><span class="emoji">'+esc(h.emoji||"\u2728")+"</span> <b>"+esc(h.label)+'</b></span><span class="hist-meta"><span>'+esc(h.time)+'</span><button type="button" class="x" data-delh="'+h.id+'" aria-label="\u522a\u8d70">\u00d7</button></span></li>';
  }).join(""):"<li>\u672a\u8f49\u904e\u3002</li>";
}
function renderAll(){renderTabs();renderChips();renderOptions();renderHistory();renderTheme();drawWheel();}
function winnerAtPointer(){var segs=slices();if(!segs.length)return null;var a=((-Math.PI/2-state.rotation)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);return segs.find(function(s){return a>=s.start&&a<s.end;})||segs[segs.length-1];}
var audioCtx=null;
function ensureAudio(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume();}
function tick(){if(!state.sound||!audioCtx)return;var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="square";o.frequency.value=740;g.gain.value=.025;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.035);o.stop(audioCtx.currentTime+.04);}
function winTone(){if(!state.sound||!audioCtx)return;var now=audioCtx.currentTime;[392,523,659].forEach(function(f,i){var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="sine";o.frequency.value=f;g.gain.value=.04;o.connect(g);g.connect(audioCtx.destination);o.start(now+i*.07);g.gain.exponentialRampToValueAtTime(.0001,now+i*.07+.28);o.stop(now+i*.07+.3);});}
function easeOut(t){return 1-Math.pow(1-t,3);}
function spin(){
  if(state.spinning||state.options.length<2)return;
  ensureAudio();state.spinning=true;spinBtn.disabled=true;spinBtn.textContent="\u8f49\u7dca\u2026";
  var extra=5+Math.random()*3.5,start=state.rotation,target=start+extra*Math.PI*2+Math.random()*Math.PI*2;
  var duration=4200+Math.random()*800,t0=performance.now();var last=(winnerAtPointer()||{}).id;
  function frame(now){var t=Math.min(1,(now-t0)/duration);state.rotation=start+(target-start)*easeOut(t);drawWheel();var cur=winnerAtPointer();if(cur&&cur.id!==last){last=cur.id;tick();}if(t<1)requestAnimationFrame(frame);else{state.rotation=target;drawWheel();finishSpin();}}
  requestAnimationFrame(frame);
}
function finishSpin(){
  var win=winnerAtPointer();state.spinning=false;spinBtn.disabled=false;spinBtn.textContent="\u8f49\u76e4";
  if(!win)return;
  state.history.unshift({id:uid(),label:win.label,emoji:win.emoji||"\u2728",time:new Date().toLocaleTimeString("zh-HK",{hour:"2-digit",minute:"2-digit"})});
  if(state.eliminate&&state.options.length>2)state.options=state.options.filter(function(o){return o.id!==win.id;});
  save();renderAll();
  winnerEmoji.textContent=win.emoji||"\u2728";winnerTitle.textContent=win.label;modal.classList.add("show");winTone();burst();
}
function resizeConfetti(){confettiCanvas.width=innerWidth;confettiCanvas.height=innerHeight;}
resizeConfetti();addEventListener("resize",resizeConfetti);
function burst(){for(var i=0;i<90;i++)state.particles.push({x:innerWidth/2,y:innerHeight*.32,vx:(Math.random()-.5)*14,vy:Math.random()*-12-3,g:.26+Math.random()*.1,w:5+Math.random()*5,h:7+Math.random()*7,rot:Math.random()*Math.PI,vr:(Math.random()-.5)*.28,color:PALETTE[i%PALETTE.length],life:80+Math.random()*40});if(!state.confettiOn){state.confettiOn=true;requestAnimationFrame(tickC);}}
function tickC(){cctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);state.particles=state.particles.filter(function(p){return p.life>0;});state.particles.forEach(function(p){p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;p.life--;cctx.save();cctx.translate(p.x,p.y);cctx.rotate(p.rot);cctx.globalAlpha=Math.max(0,p.life/70);cctx.fillStyle=p.color;cctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cctx.restore();});if(state.particles.length)requestAnimationFrame(tickC);else{state.confettiOn=false;cctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);}}
function loadPreset(key){if(!PRESETS[key])return;state.options=fromPreset(PRESETS[key]);state.activePreset=key;state.activeSavedId=null;save();renderAll();}
function loadSaved(id){var w=state.saved.find(function(s){return s.id===id;});if(!w)return;state.options=w.options.map(function(o,i){return Object.assign({},o,{id:o.id||uid(),color:o.color||PALETTE[i%PALETTE.length]});});state.activeSavedId=id;state.activePreset=null;save();renderAll();}
tabsEl.addEventListener("click",function(e){var g=e.target.dataset.g;if(!g)return;state.group=g;renderTabs();renderChips();});
chipsEl.addEventListener("click",function(e){
  var del=e.target.closest("[data-delsaved]");if(del){state.saved=state.saved.filter(function(s){return s.id!==del.dataset.delsaved;});if(state.activeSavedId===del.dataset.delsaved)state.activeSavedId=null;save();renderAll();return;}
  var saved=e.target.closest("[data-saved]");if(saved){loadSaved(saved.dataset.saved);return;}
  var k=e.target.closest("[data-k]");if(k)loadPreset(k.dataset.k);
});
document.getElementById("addBtn").addEventListener("click",function(){var input=document.getElementById("newOption");var t=input.value.trim();if(!t)return;state.options.push({id:uid(),label:t.slice(0,42),emoji:"\u2728",color:PALETTE[state.options.length%PALETTE.length],weight:1});input.value="";if(!state.activeSavedId)state.activePreset=null;else {var w=state.saved.find(function(s){return s.id===state.activeSavedId;});if(w)w.options=state.options.map(function(o){return Object.assign({},o);});}save();renderAll();});
document.getElementById("newOption").addEventListener("keydown",function(e){if(e.key==="Enter")document.getElementById("addBtn").click();});
optionsEl.addEventListener("input",function(e){var row=e.target.closest(".option");if(!row)return;var opt=state.options.find(function(o){return o.id===row.dataset.id;});if(!opt)return;if(e.target.classList.contains("label"))opt.label=e.target.value;if(e.target.classList.contains("weight"))opt.weight=Math.max(1,Math.min(20,Number(e.target.value)||1));if(!state.activeSavedId)state.activePreset=null;save();drawWheel();renderTheme();});
optionsEl.addEventListener("click",function(e){if(!e.target.classList.contains("del"))return;state.options=state.options.filter(function(o){return o.id!==e.target.closest(".option").dataset.id;});if(!state.activeSavedId)state.activePreset=null;save();renderAll();});
document.getElementById("shuffleBtn").addEventListener("click",function(){var next=state.options.slice();for(var i=next.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=next[i];next[i]=next[j];next[j]=t;}state.options=next;save();renderAll();});
document.getElementById("randBtn").addEventListener("click",function(){var keys=Object.keys(PRESETS).filter(function(k){return k!==state.activePreset;});var key=keys[Math.floor(Math.random()*keys.length)]||"eat";var chip=chipFor(key);if(chip)state.group=chip.group;loadPreset(key);});
document.getElementById("saveBtn").addEventListener("click",function(){if(state.options.filter(function(o){return o.label.trim();}).length<2){alert("\u6700\u5c11\u5169\u500b\u9078\u9805\u5148\u53ef\u4ee5\u5132\u5b58");return;}var chip=chipFor(state.activePreset);var cur=state.saved.find(function(s){return s.id===state.activeSavedId;});saveName.value=(cur&&cur.name)||(chip&&chip.label)||"\u81ea\u8a02\u76e4";saveModal.classList.add("show");saveName.focus();saveName.select();});
document.getElementById("confirmSave").addEventListener("click",function(){var options=state.options.filter(function(o){return o.label.trim();});if(options.length<2)return;var saved={id:uid(),name:(saveName.value.trim()||"\u81ea\u8a02\u76e4").slice(0,20),emoji:options[0].emoji||"\u2728",options:options.map(function(o){return Object.assign({},o);})};state.saved.push(saved);if(state.saved.length>24)state.saved=state.saved.slice(-24);state.activeSavedId=saved.id;state.activePreset=null;state.group="custom";saveModal.classList.remove("show");save();renderAll();});
document.getElementById("cancelSave").addEventListener("click",function(){saveModal.classList.remove("show");});
saveModal.addEventListener("click",function(e){if(e.target===saveModal)saveModal.classList.remove("show");});
historyEl.addEventListener("click",function(e){var btn=e.target.closest("[data-delh]");if(!btn)return;state.history=state.history.filter(function(h){return h.id!==btn.dataset.delh;});save();renderHistory();});
document.getElementById("clearHistory").addEventListener("click",function(){state.history=[];save();renderHistory();});
spinBtn.addEventListener("click",spin);
document.getElementById("againBtn").addEventListener("click",function(){modal.classList.remove("show");spin();});
document.getElementById("closeModal").addEventListener("click",function(){modal.classList.remove("show");});
modal.addEventListener("click",function(e){if(e.target===modal)modal.classList.remove("show");});
soundBtn.addEventListener("click",function(){state.sound=!state.sound;if(state.sound)ensureAudio();syncToggles();save();});
elimSwitch.addEventListener("click",function(){state.eliminate=!state.eliminate;syncToggles();save();});
weightSwitch.addEventListener("click",function(){state.showWeights=!state.showWeights;syncToggles();renderOptions();save();});
document.getElementById("fsBtn").addEventListener("click",function(){var el=document.getElementById("stage");if(!document.fullscreenElement)el.requestFullscreen&&el.requestFullscreen();else document.exitFullscreen&&document.exitFullscreen();});
document.getElementById("shareBtn").addEventListener("click",async function(){var payload=btoa(unescape(encodeURIComponent(JSON.stringify(state.options.map(function(o){return {l:o.label,w:o.weight,e:o.emoji};})))));var url=location.origin+location.pathname+"#w="+payload;try{await navigator.clipboard.writeText(url);alert("\u5df2\u8907\u88fd\u9023\u7d50");}catch(e){prompt("\u8907\u88fd\u5462\u689d\u9023\u7d50",url);}});
addEventListener("keydown",function(e){if(e.code==="Space"&&e.target.tagName!=="INPUT"){e.preventDefault();if(modal.classList.contains("show"))modal.classList.remove("show");spin();}if(e.key==="Escape"){modal.classList.remove("show");saveModal.classList.remove("show");}});
load();renderAll();
