/* TeachAny geo-m-contour-topographic course JS */
window.__TEACHANY_LEARNER_QUESTION__ = '';
window.__TEACHANY_TUTOR_CONFIG__ = {
  courseId: 'geo-m-contour-topographic',
  courseTitle: '等高线与地形图',
  subject: 'geography',
  grade: '7',
  nodeId: 'ext-geo-contour-topo',
  lessonType: 'new-concept',
  getLearnerQuestion: () => window.__TEACHANY_LEARNER_QUESTION__ || '',
  getContext: () => {
    const s = document.querySelector('section.current-section') || (location.hash ? document.querySelector(location.hash) : null);
    return (s || document.body).innerText.slice(0, 3000);
  }
};

function setTeachAnyLearnerQuestion(q) {
  window.__TEACHANY_LEARNER_QUESTION__ = q || '';
  const f = document.getElementById('anchor-feedback');
  if (f) f.textContent = q ? `你的问题：${q}` : '选择或输入后，本课会围绕你的问题展开。';
}
document.querySelectorAll('[data-anchor-choice]').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('[data-anchor-choice]').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    setTeachAnyLearnerQuestion(b.dataset.anchorChoice || b.textContent.trim());
  });
});
document.getElementById('learner-question-input')?.addEventListener('input', e => setTeachAnyLearnerQuestion(e.target.value.trim()));

document.addEventListener('DOMContentLoaded', () => {
  const cv = document.querySelector('meta[name="course-version"]')?.content;
  const sv = document.querySelector('meta[name="teachany-version"]')?.content;
  if (cv) document.getElementById('course-version-display').textContent = cv;
  if (sv) document.getElementById('skill-version-display').textContent = sv.replace(/^v/, '');
});

/* ===== Module 1: Slice Canvas ===== */
;(function(){
  const c = document.getElementById('sliceCanvas'); if (!c) return;
  const ctx = c.getContext('2d'), W = c.width, H = c.height;
  const sl = document.getElementById('sliceHeightSlider');
  const lb = document.getElementById('sliceHeightLabel');
  const rs = document.getElementById('sliceResult');
  const peakH = 400, baseY = H * 0.78;

  function draw(sh) {
    ctx.clearRect(0,0,W,H);
    const sig = W * 0.18;
    // fill
    const grd = ctx.createLinearGradient(0, baseY-H*.6, 0, baseY);
    grd.addColorStop(0,'rgba(56,189,248,.25)'); grd.addColorStop(1,'rgba(56,189,248,.03)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.moveTo(0,baseY);
    for(let x=0;x<=W;x++){const dx=x-W/2;const e=peakH*Math.exp(-dx*dx/(2*sig*sig));ctx.lineTo(x,baseY-e/peakH*H*.6)}
    ctx.lineTo(W,baseY); ctx.closePath(); ctx.fill();
    // outline
    ctx.strokeStyle='rgba(56,189,248,.6)'; ctx.lineWidth=2; ctx.beginPath();
    for(let x=0;x<=W;x++){const dx=x-W/2;const e=peakH*Math.exp(-dx*dx/(2*sig*sig));const y=baseY-e/peakH*H*.6;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}
    ctx.stroke();
    // slice line
    const sy = baseY - sh/peakH*H*.6;
    ctx.setLineDash([6,4]); ctx.strokeStyle='#f87171'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,sy); ctx.lineTo(W,sy); ctx.stroke(); ctx.setLineDash([]);
    // intersection
    if(sh>0&&sh<peakH){
      const md=sig*Math.sqrt(Math.max(0,2*Math.log(peakH/sh)));
      const x1=Math.max(0,W/2-md),x2=Math.min(W,W/2+md);
      ctx.fillStyle='rgba(248,113,113,.35)'; ctx.fillRect(x1,sy-3,x2-x1,6);
      ctx.fillStyle='#f87171'; ctx.beginPath(); ctx.arc(x1,sy,4,0,Math.PI*2); ctx.arc(x2,sy,4,0,Math.PI*2); ctx.fill();
    }
    // labels
    ctx.fillStyle='#9fb4cc'; ctx.font='12px system-ui'; ctx.textAlign='left';
    ctx.fillText(`海拔 ${sh}m`,14,sy-8);
    ctx.fillText(`山顶 ${peakH}m`,W/2+4,baseY-H*.6-8);
    ctx.fillText('0m',14,baseY-4);
  }
  function upd(){const v=+sl.value;lb.textContent=v;draw(v);
    rs.textContent=v===0?'切面在山脚。':v>=peakH?'切面超过山顶，无交线。':v>peakH*.7?'山顶附近：等高线是很小的闭合圈。':`海拔 ${v}m：等高线是闭合圈，圈越小说明海拔越高。`}
  sl.addEventListener('input',upd); upd();
})();

/* ===== Module 2: Slope Canvas ===== */
;(function(){
  const c=document.getElementById('slopeCanvas'); if(!c) return;
  const ctx=c.getContext('2d'),W=c.width,H=c.height;
  const sl=document.getElementById('slopeSlider');
  const lb=document.getElementById('slopeLabel');
  const rs=document.getElementById('slopeResult');
  const names=['极缓','较缓','中等','较陡','极陡'];
  const baseY=H*.8,peakH=400,interval=50;

  function draw(lv){
    ctx.clearRect(0,0,W,H);
    const sigs=[W*.35,W*.25,W*.18,W*.12,W*.07];
    const sig=sigs[lv-1];
    const grd=ctx.createLinearGradient(0,baseY-H*.65,0,baseY);
    grd.addColorStop(0,'rgba(56,189,248,.2)'); grd.addColorStop(1,'rgba(56,189,248,.03)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.moveTo(0,baseY);
    for(let x=0;x<=W;x++){const dx=x-W/2;const e=peakH*Math.exp(-dx*dx/(2*sig*sig));ctx.lineTo(x,baseY-e/peakH*H*.6)}
    ctx.lineTo(W,baseY); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(56,189,248,.5)'; ctx.lineWidth=2; ctx.beginPath();
    for(let x=0;x<=W;x++){const dx=x-W/2;const e=peakH*Math.exp(-dx*dx/(2*sig*sig));const y=baseY-e/peakH*H*.6;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}
    ctx.stroke();
    for(let h=interval;h<peakH;h+=interval){
      const md=sig*Math.sqrt(Math.max(0,2*Math.log(peakH/h)));
      const x1=W/2-md,x2=W/2+md,y=baseY-h/peakH*H*.6;
      ctx.strokeStyle='rgba(56,189,248,.6)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
      ctx.fillStyle='#64748b'; ctx.font='10px system-ui'; ctx.textAlign='right';
      ctx.fillText(h+'m',x1-4,y+4);
    }
    ctx.fillStyle='#9fb4cc'; ctx.font='13px system-ui'; ctx.textAlign='center';
    ctx.fillText(`等高距 = ${interval}m`,W/2,baseY+24);
    ctx.fillText(lv<=2?'等高线间距大 → 缓坡':lv>=4?'等高线间距小 → 陡坡':'等高线间距适中',W/2,baseY+42);
  }
  const msgs=['极缓坡：等高线间隔很大。','较缓坡：等高线间距较大。','中等坡度：间距适中。','较陡坡：间距较小。','极陡坡：等高线挤在一起！'];
  function upd(){const v=+sl.value;lb.textContent=names[v-1];draw(v);rs.textContent=msgs[v-1]}
  sl.addEventListener('input',upd); upd();
})();

/* ===== Module 3: Terrain Canvas ===== */
;(function(){
  const c=document.getElementById('terrainCanvas'); if(!c) return;
  const ctx=c.getContext('2d'),W=c.width,H=c.height;
  const rs=document.getElementById('terrainResult');
  const p1={x:W*.35,y:H*.28}, p2={x:W*.65,y:H*.22};
  const contours=[{r:150,h:100},{r:120,h:150},{r:90,h:200},{r:60,h:250},{r:35,h:300},{r:12,h:350}];
  const info={
    all:'全图视图。点击下方按钮切换地形类型。',
    peak:'【山顶】等高线闭合，内高外低。黄色标注。',
    ridge:'【山脊】等高线向低处凸出。红色标注。',
    valley:'【山谷】等高线向高处凸出。蓝色标注。',
    cliff:'【陡崖】等高线重叠。紫色标注。',
    saddle:'【鞍部】两组闭合之间。绿色标注。'
  };

  function draw(t){
    ctx.clearRect(0,0,W,H);
    function pk(px,py,sc){
      contours.forEach((c,i)=>{
        const r=c.r*sc;
        ctx.strokeStyle=t==='peak'&&i>=contours.length-2?'#fde047':'rgba(56,189,248,.5)';
        ctx.lineWidth=t==='peak'&&i>=contours.length-2?2.5:1.2;
        ctx.beginPath(); ctx.ellipse(px,py,r,r*.7,0,0,Math.PI*2); ctx.stroke();
      });
    }
    pk(p1.x,p1.y,.8); pk(p2.x,p2.y,.5);

    if(t==='ridge'||t==='all'){
      ctx.strokeStyle=t==='ridge'?'#f87171':'rgba(248,113,113,.3)'; ctx.lineWidth=t==='ridge'?2.5:1.5;
      ctx.setLineDash([6,4]); ctx.beginPath();
      ctx.moveTo(p1.x,p1.y+30); ctx.quadraticCurveTo(p1.x-80,p1.y+50,p1.x-150,p1.y+80); ctx.stroke(); ctx.setLineDash([]);
      if(t==='ridge'){ctx.fillStyle='#fca5a5';ctx.font='13px system-ui';ctx.textAlign='center';ctx.fillText('山脊(向低处凸出)',p1.x-80,p1.y+60)}
    }
    if(t==='valley'||t==='all'){
      const vx=(p1.x+p2.x)/2+10;
      ctx.strokeStyle=t==='valley'?'#7dd3fc':'rgba(125,211,252,.3)'; ctx.lineWidth=t==='valley'?2.5:1.5;
      ctx.setLineDash([6,4]); ctx.beginPath();
      ctx.moveTo(vx,(p1.y+p2.y)/2-10); ctx.quadraticCurveTo(vx-10,(p1.y+p2.y)/2+40,vx-20,(p1.y+p2.y)/2+90); ctx.stroke(); ctx.setLineDash([]);
      if(t==='valley'){ctx.fillStyle='#7dd3fc';ctx.font='13px system-ui';ctx.textAlign='center';ctx.fillText('山谷(向高处凸出)',vx-10,(p1.y+p2.y)/2+55)}
    }
    if(t==='cliff'||t==='all'){
      const cx=p1.x+60,cy=p1.y-60;
      ctx.strokeStyle=t==='cliff'?'#c4b5fd':'rgba(196,181,253,.3)'; ctx.lineWidth=t==='cliff'?3:1;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+10,cy+30); ctx.stroke();
      if(t==='cliff'){ctx.fillStyle='#c4b5fd';ctx.font='13px system-ui';ctx.fillText('陡崖(等高线重叠)',cx+16,cy+22)}
    }
    if(t==='saddle'||t==='all'){
      const sx=(p1.x+p2.x)/2,sy=(p1.y+p2.y)/2;
      ctx.fillStyle=t==='saddle'?'rgba(34,197,94,.2)':'rgba(34,197,94,.05)';
      ctx.beginPath(); ctx.ellipse(sx,sy,25,18,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=t==='saddle'?'#86efac':'rgba(134,239,172,.3)'; ctx.lineWidth=1.5; ctx.stroke();
      if(t==='saddle'){ctx.fillStyle='#86efac';ctx.font='13px system-ui';ctx.textAlign='center';ctx.fillText('鞍部(两峰之间)',sx,sy+28)}
    }
    if(t==='peak'||t==='all'){
      ctx.fillStyle=t==='peak'?'#fde047':'#94a3b8'; ctx.font='12px system-ui'; ctx.textAlign='center';
      ctx.fillText('山顶▲',p1.x,p1.y-35); ctx.fillText('山顶▲',p2.x,p2.y-25);
    }
  }
  document.querySelectorAll('[data-terrain]').forEach(b=>{
    b.addEventListener('click',()=>{
      document.querySelectorAll('[data-terrain]').forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); const t=b.dataset.terrain; draw(t); rs.textContent=info[t]||'';
    });
  });
  draw('all');
})();

/* ===== Module 4: Profile Canvas ===== */
;(function(){
  const c=document.getElementById('profileCanvas'); if(!c) return;
  const ctx=c.getContext('2d'),W=c.width,H=c.height;
  const sl=document.getElementById('profileLineSlider');
  const lb=document.getElementById('profileLineLabel');
  const rs=document.getElementById('profileResult');
  const pk1={x:W*.35,y:H*.18,sig:75}, pk2={x:W*.65,y:H*.14,sig:55};
  const mapH=H*.42, proTop=H*.55;

  function elev(x,y){
    const d1=Math.sqrt((x-pk1.x)**2+(y-pk1.y)**2);
    const d2=Math.sqrt((x-pk2.x)**2+(y-pk2.y)**2);
    return Math.max(380*Math.exp(-d1*d1/(2*pk1.sig*pk1.sig)), 300*Math.exp(-d2*d2/(2*pk2.sig*pk2.sig)));
  }
  function draw(lp){
    ctx.clearRect(0,0,W,H);
    const ly=lp/100*mapH;
    // map bg
    ctx.fillStyle='rgba(10,26,46,.5)'; ctx.fillRect(0,0,W,mapH);
    // contour ellipses
    [pk1,pk2].forEach(pk=>{
      [150,120,90,60,35,12].forEach((r,i)=>{
        ctx.strokeStyle='rgba(56,189,248,.4)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.ellipse(pk.x,pk.y,r,r*.65,0,0,Math.PI*2); ctx.stroke();
      });
    });
    // profile line
    ctx.setLineDash([6,4]); ctx.strokeStyle='#f87171'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,ly); ctx.lineTo(W,ly); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#f87171'; ctx.font='11px system-ui'; ctx.textAlign='left'; ctx.fillText('剖面线',8,ly-6);
    // divider
    ctx.strokeStyle='rgba(148,163,184,.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,mapH+4); ctx.lineTo(W,mapH+4); ctx.stroke();
    ctx.fillStyle='#9fb4cc'; ctx.font='12px system-ui'; ctx.textAlign='left'; ctx.fillText('地形剖面图',10,proTop-10);
    // profile
    const proBase=H-20, proMaxH=H-proTop-30;
    const grd=ctx.createLinearGradient(0,proBase-proMaxH,0,proBase);
    grd.addColorStop(0,'rgba(56,189,248,.3)'); grd.addColorStop(1,'rgba(56,189,248,.03)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.moveTo(0,proBase);
    for(let x=0;x<=W;x+=2){const e=elev(x,ly);ctx.lineTo(x,proBase-e/400*proMaxH)}
    ctx.lineTo(W,proBase); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(56,189,248,.7)'; ctx.lineWidth=2; ctx.beginPath();
    for(let x=0;x<=W;x+=2){const e=elev(x,ly);const y=proBase-e/400*proMaxH;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}
    ctx.stroke();
    // height grid
    ctx.fillStyle='#64748b'; ctx.font='9px system-ui'; ctx.textAlign='right';
    for(let h=100;h<=400;h+=100){
      const y=proBase-h/400*proMaxH;
      ctx.fillText(h+'m',36,y+3);
      ctx.strokeStyle='rgba(148,163,184,.15)'; ctx.lineWidth=.5; ctx.setLineDash([2,3]);
      ctx.beginPath(); ctx.moveTo(40,y); ctx.lineTo(W,y); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  function upd(){
    const v=+sl.value;
    const ls={20:'上方',35:'偏上',50:'中间',65:'偏下',80:'下方'};
    let best='中间',bd=999;
    for(const[k,l] of Object.entries(ls)){const d=Math.abs(v-+k);if(d<bd){bd=d;best=l}}
    lb.textContent=best; draw(v);
    rs.textContent=`剖面线在地图${best}位置，拖动滑块观察不同剖面。`;
  }
  sl.addEventListener('input',upd); upd();
})();

/* ===== Quiz interactions ===== */
function setupQuiz(sid,sel,fbSel){
  const s=document.getElementById(sid); if(!s) return;
  s.querySelectorAll(sel).forEach(b=>{
    b.addEventListener('click',()=>{
      s.querySelectorAll(sel).forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected');
      const ok=b.dataset.answer==='correct'||b.dataset.correct==='true';
      const diag=b.dataset.diagnosis||'';
      const fb=s.querySelector(fbSel);
      if(fb){fb.className=ok?'result':'result warn';fb.textContent=diag||(ok?'✓ 正确！':'✗ 再想想。')}
    });
  });
}
setupQuiz('pretest','[data-answer]','[data-feedback-for="pretest"]');
setupQuiz('conceptest-1','[data-choice]','[data-feedback-for="conceptest-1"]');
setupQuiz('posttest','[data-posttest-choice]','[data-feedback-for="posttest"]');

/* debug checks */
if(location.hostname==='localhost'||location.search.includes('debug')){
  const checks=[
    ['course-id meta',()=>!!document.querySelector('meta[name="course-id"]')?.content],
    ['problem anchor',()=>!!document.getElementById('problem-anchor')],
    ['AI tutor card',()=>!!document.querySelector('[data-teachany-tutor-card]')],
    ['knowledge graph API',()=>!!document.querySelector('[data-teachany-kg]')],
    ['canvas interactions',()=>!!(document.getElementById('sliceCanvas')&&document.getElementById('slopeCanvas')&&document.getElementById('terrainCanvas')&&document.getElementById('profileCanvas'))]
  ];
  checks.forEach(([n,fn])=>{const ok=!!fn();console[ok?'log':'warn'](`[TeachAny] ${ok?'PASS':'MISSING'} ${n}`)});
}
