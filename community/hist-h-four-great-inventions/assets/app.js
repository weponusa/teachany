let progressMap={};
let sectionProgress=[{"id":"sec-pretest","pts":20},{"id":"sec-mod1","pts":30},{"id":"sec-mod2","pts":25},{"id":"sec-mod3","pts":25}];
let currentMod=1;
let mapInitialized=false;

function updateProgress(pts){
  progressMap[window.location.hash]=(progressMap[window.location.hash]||0)+pts;
  let total=Object.values(progressMap).reduce((a,b)=>a+b,0);
  let pct=Math.min(100,Math.round(total/100*100));
  document.getElementById("mainProgress").style.width=pct+"%";
  document.getElementById("progressLabel").textContent="学习进度："+pct+"%";
}

function setActiveTabs(mod){
  document.querySelectorAll(".tab").forEach(tab=>{
    const match=(tab.getAttribute("onclick")||"").match(/goToMod\((\d+)\)/);
    tab.classList.toggle("active",match&&Number(match[1])===mod);
  });
}

function goToMod(mod){
  currentMod=mod;
  ["sec-mod1","sec-mod2","sec-mod3"].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.classList.remove("active");
  });
  const target=document.getElementById("sec-mod"+mod);
  if(target){
    target.classList.add("active");
    target.scrollIntoView({behavior:"smooth",block:"start"});
  }
  setActiveTabs(mod);
  updateProgress(sectionProgress.find(s=>s.id==="sec-mod"+mod).pts);
  if(mod===1) setTimeout(initInventionMap,120);
}

function handlePretest(btn,correct){
  let fb=document.getElementById("pretest-fb");
  if(correct){btn.classList.add("correct");fb.className="feedback show correct";fb.textContent="正确！造纸术发明于西汉，印刷术发明于唐代，火药发明于唐代，指南针发明于战国。只有印刷术和造纸术在宋代达到成熟。";}
  else{btn.classList.add("wrong");fb.className="feedback show wrong";fb.textContent="再想想！正确答案是B。";}
  updateProgress(20);
}

function handleQuiz(btn,correct,fbId,msg){
  let fb=document.getElementById(fbId);
  if(correct){btn.classList.add("correct");fb.className="feedback show correct";fb.textContent=msg;}
  else{btn.classList.add("wrong");fb.className="feedback show wrong";fb.textContent=msg;}
}

function submitOpen(textId,fbId){
  let fb=document.getElementById(fbId);
  fb.className="feedback show correct";
  fb.innerHTML="很好！你的思考很有价值。参考要点：如果没有闭关锁国，中国可能更早接触欧洲的近代科学方法论，在技术优势基础上嫁接实验科学，科技发展路径可能截然不同。";
  updateProgress(25);
}

function scrollToSection(id){
  document.getElementById(id).scrollIntoView({behavior:"smooth",block:"start"});
}

function initInventionMap(){
  if(mapInitialized) return;
  const el=document.getElementById("inventionMap");
  if(!el) return;
  if(typeof L==="undefined"){
    el.innerHTML=`<div class="fallback-map" aria-label="四大发明传播路线地图">
      <svg viewBox="0 0 900 360" role="img">
        <defs><marker id="mapArrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><polygon points="0 0,10 4,0 8" fill="#7c3aed"></polygon></marker></defs>
        <rect width="900" height="360" fill="#dbeafe"></rect>
        <path d="M60 170 C160 90 275 120 350 180 C435 245 520 210 600 165 C710 105 810 130 860 205 L860 320 L60 320 Z" fill="#dcfce7" stroke="#94a3b8" stroke-width="2"></path>
        <path d="M175 190 C300 145 420 170 520 190 C625 212 690 170 760 150" fill="none" stroke="#7c3aed" stroke-width="6" stroke-dasharray="12 10" marker-end="url(#mapArrow)"></path>
        <g font-family="PingFang SC, Microsoft YaHei, sans-serif" text-anchor="middle">
          <circle cx="175" cy="190" r="14" fill="#f59e0b" stroke="#fff" stroke-width="4"></circle><text x="175" y="235" font-size="22" fill="#1e293b">中国</text><text x="175" y="260" font-size="16" fill="#64748b">发明地</text>
          <circle cx="415" cy="174" r="14" fill="#3b82f6" stroke="#fff" stroke-width="4"></circle><text x="415" y="220" font-size="22" fill="#1e293b">中亚</text><text x="415" y="245" font-size="16" fill="#64748b">丝路通道</text>
          <circle cx="565" cy="185" r="14" fill="#10b981" stroke="#fff" stroke-width="4"></circle><text x="565" y="230" font-size="22" fill="#1e293b">阿拉伯</text><text x="565" y="255" font-size="16" fill="#64748b">中转站</text>
          <circle cx="760" cy="150" r="14" fill="#ef4444" stroke="#fff" stroke-width="4"></circle><text x="760" y="198" font-size="22" fill="#1e293b">欧洲</text><text x="760" y="223" font-size="16" fill="#64748b">变革地</text>
        </g>
      </svg>
    </div>`;
    const fallback=document.getElementById("mapFallback");
    if(fallback) fallback.style.display="block";
    return;
  }
  mapInitialized=true;
  const map=L.map("inventionMap",{scrollWheelZoom:false,worldCopyJump:true});
  const base=L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{
    maxZoom:8,
    attribution:"&copy; OpenStreetMap contributors &copy; CARTO"
  }).addTo(map);
  const hillshade=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",{
    opacity:0.18,
    attribution:"Tiles &copy; Esri"
  }).addTo(map);
  const points=[
    {name:"中国：四大发明的发明与成熟",coord:[34.34,108.94],note:"造纸、印刷、指南针、火药在中国形成关键技术链。"},
    {name:"中亚：陆上海上丝路交汇",coord:[41.31,69.28],note:"造纸术等技术经丝路向西传播。"},
    {name:"阿拉伯世界：翻译与中转",coord:[33.31,44.36],note:"阿拉伯商人与学者推动技术再传播。"},
    {name:"欧洲：引发文明加速",coord:[41.90,12.50],note:"印刷、火药、罗盘等技术催化文艺复兴、大航海与军事革命。"}
  ];
  const latlngs=points.map(p=>p.coord);
  L.polyline(latlngs,{color:"#7c3aed",weight:4,opacity:0.82,dashArray:"8 8"}).addTo(map);
  points.forEach((p,i)=>{
    L.circleMarker(p.coord,{radius:8,color:"#4c1d95",weight:2,fillColor:i===0?"#f59e0b":"#a78bfa",fillOpacity:0.9})
      .addTo(map)
      .bindPopup(`<strong>${p.name}</strong><br>${p.note}`);
  });
  map.fitBounds(latlngs,{padding:[28,28]});
  setTimeout(()=>map.invalidateSize(),250);
}

document.addEventListener("DOMContentLoaded",()=>{
  setActiveTabs(currentMod);
  initInventionMap();
});
