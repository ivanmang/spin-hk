const PALETTE=["#c4785a","#6f8f78","#5e7a92","#c4b49a","#a97878","#5f8c88","#8a8074","#6a7380"];
const PRESETS={
  eat:["茶餐廳","車仔麵","火鍋","壽司","麥當勞","腸粉","韓燒","叫外賣"],
  drink:["絲襪奶茶","凍檸茶","咖啡","檸檬可樂","珍珠奶茶","豆漿","清水"],
  commute:["港鐵","巴士","小巴","的士","Uber","行路"],
  weekend:["行山","去沙灘","行商場","睇戲","留喺屋企","去澳門","行街市","去公園"],
  afterschool:["溫習","打機","去街","補習","打波","睇 YouTube","瞓一陣","食嘢"],
  study:["溫書 25 分鐘","休息 10 分鐘","做 past paper","早啲瞓","去飲茶","覆筆記"],
  studySpot:["圖書館","自修室","屋企","Cafe","麥當勞","同學屋企"],
  date:["睇戲","行海傍","Cafe","行山","夜市","卡拉 OK","逛街","食甜品"],
  chores:["你做","我做","一齊做","叫外賣算","聽日先算"],
  gift:["花","甜品","電影飛","手作","公仔","蛋糕","心意卡"]
};
const GROUPS=[
  {id:"daily",label:"日常",chips:[["eat","今晚食咩"],["drink","飲咩好"],["commute","點返屋企"],["weekend","週末去邊"]]},
  {id:"student",label:"學生",chips:[["afterschool","放學後"],["study","溫書定休息"],["studySpot","邊度溫書"]]},
  {id:"couple",label:"拍拖",chips:[["date","拍拖去邊"],["chores","邊個做家務"],["gift","送咩禮物"]]}
];
const canvas=document.getElementById("wheel");
const ctx=canvas.getContext("2d");
const optionsEl=document.getElementById("options");
const historyEl=document.getElementById("history");
const spinBtn=document.getElementById("spinBtn");
const modal=document.getElementById("modal");
const winnerTitle=document.getElementById("winnerTitle");
const soundBtn=document.getElementById("soundBtn");
const elimSwitch=document.getElementById("elimSwitch");
const weightSwitch=document.getElementById("weightSwitch");
const weightHint=document.getElementById("weightHint");
const confettiCanvas=document.getElementById("confetti");
const cctx=confettiCanvas.getContext("2d");
const storeKey="spin-hk-v1";
const state={options:[],rotation:0,spinning:false,showWeights:false,eliminate:false,sound:true,history:[],particles:[]};
const uid=()=>Math.random().toString(36).slice(2,9);
const fromLabels=ls=>ls.map((label,i)=>({id:uid(),label,color:PALETTE[i%PALETTE.length],weight:1}));
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return "&"+({"&":"amp","<":"lt",">":"gt",'"':"quot"}[c])+";";});}
function load(){
  try{
    const data=JSON.parse(localStorage.getItem(storeKey)||"null");
    if(data&&data.options&&data.options.length){state.options=data.options;state.history=data.history||[];state.sound=data.sound!==false;state.eliminate=!!data.eliminate;state.showWeights=!!data.showWeights;}
    else state.options=fromLabels(PRESETS.eat);
  }catch(e){state.options=fromLabels(PRESETS.eat);}
  const hash=location.hash.replace(/^#w=/,"");
  if(hash){try{const parsed=JSON.parse(decodeURIComponent(escape(atob(hash))));if(Array.isArray(parsed)&&parsed.length>=2){state.options=parsed.map((p,i)=>({id:uid(),label:String(p.l).slice(0,42),color:PALETTE[i%PALETTE.length],weight:Math.max(1,Number(p.w)||1)}));}}catch(e){}}
  syncToggles();
}
function save(){localStorage.setItem(storeKey,JSON.stringify({options:state.options,history:state.history.slice(0,20),sound:state.sound,eliminate:state.eliminate,showWeights:state.showWeights}));}
function syncToggles(){soundBtn.style.opacity=state.sound?"1":".45";elimSwitch.classList.toggle("on",state.eliminate);weightSwitch.classList.toggle("on",state.showWeights);weightHint.style.display=state.showWeights?"block":"none";}
function slices(){const total=state.options.reduce((s,o)=>s+Math.max(1,Number(o.weight)||1),0)||1;let angle=0;return state.options.map(o=>{const size=(Math.max(1,Number(o.weight)||1)/total)*Math.PI*2;const slice=Object.assign({},o,{start:angle,end:angle+size,size});angle+=size;return slice;});}
function contrast(hex){const c=hex.replace("#","");const y=(parseInt(c.slice(0,2),16)*299+parseInt(c.slice(2,4),16)*587+parseInt(c.slice(4,6),16)*114)/1000;return y>=150?"#1c1916":"#f7f4ef";}
function truncate(text,max){if(ctx.measureText(text).width<=max)return text;let t=text;while(t.length&&ctx.measureText(t+"…").width>max)t=t.slice(0,-1);return t+"…";}
function drawWheel(){
  const w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,r=Math.min(w,h)/2-28;
  ctx.clearRect(0,0,w,h);
  ctx.beginPath();ctx.arc(cx,cy,r+16,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,.03)";ctx.fill();
  ctx.save();ctx.translate(cx,cy);ctx.rotate(state.rotation);
  const segs=slices();
  if(!segs.length){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle="#161618";ctx.fill();}
  else segs.forEach(function(seg){
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,seg.start,seg.end);ctx.closePath();
    ctx.fillStyle=seg.color;ctx.fill();ctx.strokeStyle="rgba(10,10,11,.55)";ctx.lineWidth=1.5;ctx.stroke();
    const mid=(seg.start+seg.end)/2;ctx.save();ctx.rotate(mid);
    const flip=mid>Math.PI/2&&mid<Math.PI*1.5;if(flip)ctx.rotate(Math.PI);
    ctx.textAlign=flip?"left":"right";ctx.textBaseline="middle";ctx.fillStyle=contrast(seg.color);
    ctx.font="500 "+(segs.length>10?20:segs.length>6?24:28)+'px "Noto Sans TC",sans-serif';
    ctx.fillText(truncate(seg.label,r*0.58),flip?-(r-22):r-22,0);ctx.restore();
  });
  ctx.beginPath();ctx.arc(0,0,r+8,0,Math.PI*2);ctx.strokeStyle="rgba(232,233,237,.16)";ctx.lineWidth=12;ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,r+1,0,Math.PI*2);ctx.strokeStyle="rgba(10,10,11,.7)";ctx.lineWidth=3;ctx.stroke();
  for(let i=0;i<48;i++){const a=(i/48)*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*(r+4),Math.sin(a)*(r+4));ctx.lineTo(Math.cos(a)*(r+11),Math.sin(a)*(r+11));ctx.strokeStyle=i%4===0?"rgba(232,233,237,.45)":"rgba(232,233,237,.16)";ctx.lineWidth=i%4===0?1.5:1;ctx.stroke();}
  ctx.restore();
  ctx.beginPath();ctx.arc(cx,cy,46,0,Math.PI*2);ctx.fillStyle="#121214";ctx.fill();
  ctx.strokeStyle="rgba(232,233,237,.22)";ctx.lineWidth=3;ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,10,0,Math.PI*2);ctx.fillStyle="#e8e9ed";ctx.fill();
}
function renderOptions(){
  optionsEl.innerHTML=state.options.length?state.options.map(function(o){
    return '<li class="option" data-id="'+o.id+'"><span class="swatch" style="background:'+o.color+'"></span><input class="label" type="text" maxlength="42" value="'+esc(o.label)+'" /><input class="weight" type="number" min="1" max="20" value="'+o.weight+'" '+(state.showWeights?"":'style="display:none"')+' /><button class="del" type="button">x</button></li>';
  }).join(""):'<li class="sub" style="padding:2rem 0;text-align:center">最少加兩個選項先轉得。</li>';
}
function renderHistory(){historyEl.innerHTML=state.history.length?state.history.slice(0,6).map(function(h){return "<li><b>"+esc(h.label)+"</b><span>"+h.time+"</span></li>";}).join(""):"<li>未轉過。</li>";}
function winnerAtPointer(){const segs=slices();if(!segs.length)return null;let a=((-Math.PI/2-state.rotation)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);return segs.find(function(s){return a>=s.start&&a<s.end;})||segs[segs.length-1];}
let audioCtx=null;
function ensureAudio(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume();}
function tick(){if(!state.sound||!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="square";o.frequency.value=740;g.gain.value=.025;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.035);o.stop(audioCtx.currentTime+.04);}
function winTone(){if(!state.sound||!audioCtx)return;const now=audioCtx.currentTime;[392,523,659].forEach(function(f,i){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="sine";o.frequency.value=f;g.gain.value=.04;o.connect(g);g.connect(audioCtx.destination);o.start(now+i*.07);g.gain.exponentialRampToValueAtTime(.0001,now+i*.07+.28);o.stop(now+i*.07+.3);});}
function easeOut(t){return 1-Math.pow(1-t,3);}
function spin(){
  if(state.spinning||state.options.length<2)return;
  ensureAudio();state.spinning=true;spinBtn.disabled=true;spinBtn.textContent="轉緊…";
  const extra=5+Math.random()*3.5,start=state.rotation,target=start+extra*Math.PI*2+Math.random()*Math.PI*2;
  const duration=4200+Math.random()*800,t0=performance.now();let last=(winnerAtPointer()||{}).id;
  function frame(now){const t=Math.min(1,(now-t0)/duration);state.rotation=start+(target-start)*easeOut(t);drawWheel();const cur=winnerAtPointer();if(cur&&cur.id!==last){last=cur.id;tick();}if(t<1)requestAnimationFrame(frame);else{state.rotation=target;drawWheel();finishSpin();}}
  requestAnimationFrame(frame);
}
function finishSpin(){
  const win=winnerAtPointer();state.spinning=false;spinBtn.disabled=false;spinBtn.textContent="轉盤";
  if(!win)return;
  state.history.unshift({label:win.label,time:new Date().toLocaleTimeString("zh-HK",{hour:"2-digit",minute:"2-digit"})});
  if(state.eliminate&&state.options.length>2)state.options=state.options.filter(function(o){return o.id!==win.id;});
  save();renderOptions();renderHistory();drawWheel();
  winnerTitle.textContent=win.label;modal.classList.add("show");winTone();burst();
}
function resizeConfetti(){confettiCanvas.width=innerWidth;confettiCanvas.height=innerHeight;}
resizeConfetti();addEventListener("resize",resizeConfetti);
function burst(){for(let i=0;i<90;i++)state.particles.push({x:innerWidth/2,y:innerHeight*.32,vx:(Math.random()-.5)*14,vy:Math.random()*-12-3,g:.26+Math.random()*.1,w:5+Math.random()*5,h:7+Math.random()*7,rot:Math.random()*Math.PI,vr:(Math.random()-.5)*.28,color:PALETTE[i%PALETTE.length],life:80+Math.random()*40});if(!state.confettiOn){state.confettiOn=true;requestAnimationFrame(tickC);}}
function tickC(){cctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);state.particles=state.particles.filter(function(p){return p.life>0;});state.particles.forEach(function(p){p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;p.life--;cctx.save();cctx.translate(p.x,p.y);cctx.rotate(p.rot);cctx.globalAlpha=Math.max(0,p.life/70);cctx.fillStyle=p.color;cctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cctx.restore();});if(state.particles.length)requestAnimationFrame(tickC);else{state.confettiOn=false;cctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);}}
document.getElementById("groups").innerHTML=GROUPS.map(function(g){return '<div class="group"><p>'+g.label+'</p><div class="chips">'+g.chips.map(function(c){return '<button data-k="'+c[0]+'">'+c[1]+"</button>";}).join("")+"</div></div>";}).join("");
document.getElementById("groups").addEventListener("click",function(e){const k=e.target.dataset.k;if(!k||!PRESETS[k])return;state.options=fromLabels(PRESETS[k]);save();renderOptions();drawWheel();});
document.getElementById("addBtn").addEventListener("click",function(){const input=document.getElementById("newOption");const t=input.value.trim();if(!t)return;state.options.push({id:uid(),label:t.slice(0,42),color:PALETTE[state.options.length%PALETTE.length],weight:1});input.value="";save();renderOptions();drawWheel();});
document.getElementById("newOption").addEventListener("keydown",function(e){if(e.key==="Enter")document.getElementById("addBtn").click();});
optionsEl.addEventListener("input",function(e){const row=e.target.closest(".option");if(!row)return;const opt=state.options.find(function(o){return o.id===row.dataset.id;});if(!opt)return;if(e.target.classList.contains("label"))opt.label=e.target.value;if(e.target.classList.contains("weight"))opt.weight=Math.max(1,Math.min(20,Number(e.target.value)||1));save();drawWheel();});
optionsEl.addEventListener("click",function(e){if(!e.target.classList.contains("del"))return;state.options=state.options.filter(function(o){return o.id!==e.target.closest(".option").dataset.id;});save();renderOptions();drawWheel();});
spinBtn.addEventListener("click",spin);
document.getElementById("againBtn").addEventListener("click",function(){modal.classList.remove("show");spin();});
document.getElementById("closeModal").addEventListener("click",function(){modal.classList.remove("show");});
modal.addEventListener("click",function(e){if(e.target===modal)modal.classList.remove("show");});
soundBtn.addEventListener("click",function(){state.sound=!state.sound;if(state.sound)ensureAudio();syncToggles();save();});
elimSwitch.addEventListener("click",function(){state.eliminate=!state.eliminate;syncToggles();save();});
weightSwitch.addEventListener("click",function(){state.showWeights=!state.showWeights;syncToggles();renderOptions();save();});
document.getElementById("fsBtn").addEventListener("click",function(){const el=document.getElementById("stage");if(!document.fullscreenElement)el.requestFullscreen&&el.requestFullscreen();else document.exitFullscreen&&document.exitFullscreen();});
document.getElementById("shareBtn").addEventListener("click",async function(){const payload=btoa(unescape(encodeURIComponent(JSON.stringify(state.options.map(function(o){return {l:o.label,w:o.weight};})))));const url=location.origin+location.pathname+"#w="+payload;try{await navigator.clipboard.writeText(url);alert("已複製連結");}catch(e){prompt("複製呢條連結",url);}});
addEventListener("keydown",function(e){if(e.code==="Space"&&e.target.tagName!=="INPUT"){e.preventDefault();if(modal.classList.contains("show"))modal.classList.remove("show");spin();}if(e.key==="Escape")modal.classList.remove("show");});
load();renderOptions();renderHistory();drawWheel();
