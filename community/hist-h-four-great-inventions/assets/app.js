let progressMap={};
let sectionProgress=[{"id":"sec-pretest","pts":20},{"id":"sec-mod1","pts":30},{"id":"sec-mod2","pts":25},{"id":"sec-mod3","pts":25}];
let currentMod=1;

function updateProgress(pts){
  progressMap[window.location.hash]=(progressMap[window.location.hash]||0)+pts;
  let total=Object.values(progressMap).reduce((a,b)=>a+b,0);
  let pct=Math.min(100,Math.round(total/100*100));
  document.getElementById("mainProgress").style.width=pct+"%";
  document.getElementById("progressLabel").textContent="学习进度："+pct+"%";
}

function goToMod(mod){
  currentMod=mod;
  ["sec-mod1","sec-mod2","sec-mod3"].forEach(id=>{
    document.getElementById(id).classList.remove("active");
  });
  document.getElementById("sec-mod"+mod).classList.add("active");
  document.querySelectorAll(".tab").forEach((t,i)=>{
    t.classList.toggle("active",i+1===mod);
  });
  updateProgress(sectionProgress.find(s=>s.id==="sec-mod"+mod).pts);
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
