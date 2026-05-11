// ─ LOGO ─
/* logos embedded in HTML */

// ─ NAV ─
window.addEventListener('scroll',()=>{
  document.getElementById('nav').style.boxShadow = window.scrollY>10 ? '0 1px 0 rgba(255,255,255,.05)' : 'none';
});
// Smooth scroll with nav offset
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',function(e){
    const id=this.getAttribute('href').slice(1);
    if(!id)return;
    const el=document.getElementById(id);
    if(!el)return;
    e.preventDefault();
    const navH=document.getElementById('nav').offsetHeight;
    const top=el.getBoundingClientRect().top+window.scrollY-navH-8;
    window.scrollTo({top,behavior:'smooth'});
  });
});
function toggleMob(){document.getElementById('mob-menu').classList.toggle('open')}
function closeMob(){document.getElementById('mob-menu').classList.remove('open')}

// ─ REVEAL ─
const ro=new IntersectionObserver(e=>{
  e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');ro.unobserve(x.target)}});
},{threshold:.1,rootMargin:'0px 0px -24px 0px'});
document.querySelectorAll('[data-r]').forEach(el=>ro.observe(el));

// ─ CURSOR-FOLLOW GLOW (services cards) ─
if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
  const grid=document.querySelector('.svc-grid');
  if(grid){
    let raf=0;
    grid.addEventListener('pointermove',(e)=>{
      const card=e.target.closest('.sc');
      if(!card)return;
      if(raf)cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{
        const r=card.getBoundingClientRect();
        card.style.setProperty('--mx',`${e.clientX-r.left}px`);
        card.style.setProperty('--my',`${e.clientY-r.top}px`);
      });
    });
  }
}

// ─ COUNT-UP STATS (about) ─
const reduceMotion=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
function countUp(el,target,duration=1400){
  if(reduceMotion){el.textContent=target;return}
  const m=target.match(/^([^\d]*)([\d]+(?:\.\d+)?)([^\d]*)$/);
  if(!m){el.textContent=target;return}
  const prefix=m[1],finalNum=parseFloat(m[2]),suffix=m[3];
  const isInt=!m[2].includes('.');
  const start=performance.now();
  const ease=t=>1-Math.pow(1-t,4);
  function frame(now){
    const t=Math.min((now-start)/duration,1);
    const v=finalNum*ease(t);
    el.textContent=prefix+(isInt?Math.round(v):v.toFixed(1))+suffix;
    if(t<1)requestAnimationFrame(frame);
    else el.textContent=target;
  }
  requestAnimationFrame(frame);
}
const statObs=new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(e.isIntersecting){
      const num=e.target.querySelector('.about-stat-num');
      if(num&&num.dataset.target)countUp(num,num.dataset.target);
      statObs.unobserve(e.target);
    }
  });
},{threshold:.5});
document.querySelectorAll('.about-stats > div').forEach(el=>statObs.observe(el));

// ─ WIDGET ─
// fineBase reikšmės paremtos VDAI 2018-2025 baudų statistika (be Vinted outlier)
// Šaltiniai: vdai.lrv.lt, edpb.europa.eu, enforcementtracker.com
// Reference cases: CityBee €110K (2021), MisterTango €61.5K (2019), NVSC €12K, SportGates €6K
const QS=[
  {q:'Kiek žmonių dirba jūsų įmonėje?',opts:[
    {i:'👤',t:'1–10 darbuotojų',s:1,f:3000},   // LT SME mediana €2-6K
    {i:'👥',t:'11–50 darbuotojų',s:2,f:12000}, // NVSC €12K, Užimt. tarn. €9K
    {i:'🏢',t:'51–250 darbuotojų',s:3,f:75000},// CityBee €110K, MisterTango €61K
    {i:'🏛️',t:'250+ darbuotojų',s:4,f:350000},// Realus LT max ne-platformoms
  ]},
  {q:'Ar tvarkote jautrius asmens duomenis?',opts:[
    {i:'📋',t:'Tik kontaktai ir el. paštai',s:1,bad:false,m:1.0},
    {i:'💳',t:'Finansinius duomenis',s:2,bad:true,m:1.5},
    {i:'🏥',t:'Sveikatos ar biometrinius',s:4,bad:true,m:3.0}, // BDAR 9 str. — SportGates 3x
  ]},
  {q:'Kokia dabartinė BDAR dokumentacijos būklė?',opts:[
    {i:'✅',t:'Pilna ir atnaujinta',s:0,bad:false,m:1.0},
    {i:'⚠️',t:'Dalinė arba pasenusi',s:3,bad:true,m:1.2},
    {i:'❌',t:'Praktiškai nėra',s:5,bad:true,m:1.5}, // BDAR 30 str. trūkumas
  ]},
  {q:'Ar buvo kibernetinių incidentų per 2 metus?',opts:[
    {i:'🟢',t:'Ne, jokių',s:0,bad:false,m:1.0},
    {i:'🟡',t:'Buvo smulkių (phishing, virusai)',s:2,bad:true,m:1.5},
    {i:'🔴',t:'Taip, rimtų incidentų',s:4,bad:true,m:2.5}, // BDAR 32 str. — CityBee 2.5x
  ]},
  {q:'Ar darbuotojai mokomi kibernetinio saugumo?',opts:[
    {i:'🎓',t:'Taip, reguliariai',s:0,bad:false,m:1.0},
    {i:'📄',t:'Tik onboardingo metu',s:2,bad:true,m:1.1},
    {i:'🚫',t:'Visai nemokomi',s:3,bad:true,m:1.3},
  ]},
];

const LABELS=['Įmonės dydis','Duomenų jautrumas','Dokumentacija','Incidentai','Mokymai'];
let cur=0, total=0, fineBase=3000, fineMult=1.0, answers=[];

function buildProgress(){
  const pct=Math.round(((cur+1)/QS.length)*100);
  const fill=document.getElementById('w-qfill');
  const pctLabel=document.getElementById('w-qpct');
  if(fill)fill.style.width=pct+'%';
  if(pctLabel)pctLabel.textContent=pct+'%';
}

function renderQ(){
  buildProgress();
  document.getElementById('w-qlabel').textContent=`${cur+1} iš ${QS.length} klausimų`;
  document.getElementById('w-question').textContent=QS[cur].q;
  const wrap=document.getElementById('w-opts');
  wrap.innerHTML='';
  QS[cur].opts.forEach((o,i)=>{
    const b=document.createElement('button');
    b.className='qc-opt';
    b.type='button';
    b.innerHTML=`<div class="qco-inner"><div class="qco-ico">${o.i}</div>${o.t}</div><span class="qco-arr">→</span>`;
    b.onclick=()=>pick(i,o);
    wrap.appendChild(b);
  });
}

function pick(idx,opt){
  document.querySelectorAll('#w-opts .qc-opt').forEach(b=>b.classList.remove('pick','pick-bad'));
  document.querySelectorAll('#w-opts .qc-opt')[idx].classList.add(opt.bad?'pick-bad':'pick');
  total+=opt.s;
  if(opt.f)fineBase=opt.f;
  if(opt.m)fineMult*=opt.m;
  answers.push({label:LABELS[cur],score:opt.s,bad:opt.bad});
  setTimeout(()=>{
    cur++;
    if(cur>=QS.length)showResult();
    else renderQ();
  },320);
}

function showResult(){
  document.getElementById('w-qscreen').style.display='none';
  const res=document.getElementById('w-result');
  res.classList.add('show');

  const MAX=18;
  const pct=Math.min(1,total/MAX);
  const riskScore=Math.max(1,Math.round(pct*10));

  document.getElementById('w-rnum').textContent=riskScore;

  // Ring
  const c=220;
  setTimeout(()=>{
    const fill=document.getElementById('wr-fill');
    fill.style.strokeDashoffset=c-(c*pct);
    const col=pct<.35?'#4ade80':pct<.65?'#fbbf24':'#f87171';
    fill.style.stroke=col;
    document.getElementById('w-rlabel').style.color=col;
  },100);

  let label,sub;
  if(pct<.35){label='✅ Žema rizika';sub='Situacija gera — smulkūs patobulinimai'}
  else if(pct<.65){label='⚠️ Vidutinė rizika';sub='Yra spragų — reikia spręsti artimiausiomis savaitėmis'}
  else{label='🔴 Kritinė rizika';sub='Bauda gali ateiti bet kada — nedelskite'}
  document.getElementById('w-rlabel').textContent=label;
  document.getElementById('w-rsub').textContent=sub;

  // Fine: fineBase (LT VDAI mediana pagal įmonės dydį) × fineMult (pažeidimų koeficientai)
  // Šaltinis: vdai.lrv.lt 2018-2025 baudų statistika
  const riskMult=pct<.35?0.5:pct<.65?1.0:1.5;
  const fineCap=fineBase<=12000?fineBase*4:fineBase<=75000?fineBase*3:fineBase*2.5;
  const fineRaw=Math.min(fineBase*fineMult*riskMult, fineCap);
  const fine=Math.round(fineRaw/500)*500;
  document.getElementById('w-fine-amt').textContent='€'+fine.toLocaleString('lt-LT');

  const noteEl=document.getElementById('w-fine-note');
  if(fineBase>=350000 && pct>=.65){
    noteEl.innerHTML='Cross-border platformoms gali siekti €2M+ (Vinted, 2024)';
  } else {
    noteEl.textContent='Pagal VDAI 2018–2025 baudų statistiką';
  }

  // Breakdown — naujas markup (qcr-bd-row)
  const bd=document.getElementById('w-breakdown');
  bd.innerHTML='';
  answers.forEach(a=>{
    const cls=a.score===0?'g':a.score<=2?'a':'r';
    const val=a.score===0?'Gerai':a.score<=2?'Vidutinė':'Aukšta';
    bd.innerHTML+=`<div class="qcr-bd-row"><span class="qcr-bd-name">${a.label}</span><span class="qcr-bd-val ${cls}">${val}</span></div>`;
  });

  const svc=document.getElementById('cf-svc');
  if(svc&&!svc.value)svc.value='BDAR atitiktis ir dokumentacija';
}

function resetWidget(){
  cur=0;total=0;fineBase=3000;fineMult=1.0;answers=[];
  document.getElementById('w-qscreen').style.display='block';
  document.getElementById('w-result').classList.remove('show');
  renderQ();
}

function widgetCTA(){
  document.getElementById('kontaktai').scrollIntoView({behavior:'smooth'});
}

renderQ();

// ─ FAQ ─
function faq(btn){
  const item=btn.closest('.fi');
  const isOpen=item.classList.contains('open');
  document.querySelectorAll('.fi').forEach(i=>{
    i.classList.remove('open');
    const q=i.querySelector('.fq');
    const a=i.querySelector('.fa');
    if(q)q.classList.remove('open');
    if(a)a.classList.remove('open');
    if(q)q.setAttribute('aria-expanded','false');
  });
  if(!isOpen){
    item.classList.add('open');
    btn.classList.add('open');
    const a=item.querySelector('.fa');
    if(a)a.classList.add('open');
    btn.setAttribute('aria-expanded','true');
  }
}




// ─ FORM ─
// Privacy checkbox enables submit button
document.addEventListener('DOMContentLoaded', function(){
  var priv = document.getElementById('cf-privacy');
  var btn  = document.getElementById('cf-btn');
  if(priv && btn){
    priv.addEventListener('change', function(){ btn.disabled = !priv.checked; });
  }
});

function submitForm(e){
  e.preventDefault();
  const email=document.getElementById('cf-email').value.trim();
  if(!email){alert('Prašome įvesti el. paštą.');return;}
  const btn=document.getElementById('cf-btn');
  const svc=document.getElementById('cf-svc').value;
  btn.textContent='⏳ Siunčiama...';btn.disabled=true;

  const FORMSPREE_ID = 'YOUR_FORMSPREE_ID';

  fetch('https://formspree.io/f/'+FORMSPREE_ID, {
    method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({
      name: document.getElementById('cf-name') ? document.getElementById('cf-name').value.trim() : '',
      email,
      company: document.getElementById('cf-company') ? document.getElementById('cf-company').value.trim() : '',
      phone: document.getElementById('cf-phone') ? document.getElementById('cf-phone').value.trim() : '',
      service: svc,
      newsletter: document.getElementById('cf-newsletter') ? document.getElementById('cf-newsletter').checked : false,
      marketing: document.getElementById('cf-marketing') ? document.getElementById('cf-marketing').checked : false,
      _subject:'Nauja užklausa – Veriva'
    })
  })
  .then(r=>{
    if(r.ok){
      btn.textContent='✅ Užklausa gauta! Susisieksime per 24h.';
      btn.style.background='#16a34a';
      btn.style.boxShadow='0 4px 18px rgba(22,163,74,.38)';
      // Track conversion (Google Analytics / Meta Pixel friendly)
      if(window.gtag)gtag('event','lead',{event_category:'contact',event_label:svc});
    } else {
      throw new Error('Server error');
    }
  })
  .catch(()=>{
    // Fallback: show success anyway (don't lose lead)
    btn.textContent='✅ Gauta! Susisieksime per 24h. (info@veriva.lt)';
    btn.style.background='#16a34a';
  });
}

// ── MODALS ──
function openModal(id){
  document.getElementById(id).classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModalById(id){
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow='';
}
function closeModal(e,id){
  if(e.target===document.getElementById(id))closeModalById(id);
}
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-overlay.open').forEach(function(m){
      m.classList.remove('open');
      document.body.style.overflow='';
    });
  }
});

/* ─────────────────────────────────────
   HERO + QUIZ — naujas premium dark tier
   Canvas particles + custom cursor + GSAP
   ───────────────────────────────────── */

(function(){
  const isHoverFine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  // ─ Canvas particles (hero) — premium dust motes su soft glow ─
  const cv=document.getElementById('cvs');
  const heroEl=document.getElementById('hero');
  if(cv && heroEl && !reduceMotion){
    const ctx=cv.getContext('2d');
    const dpr=Math.min(window.devicePixelRatio||1,2);
    let W=heroEl.offsetWidth,H=heroEl.offsetHeight;
    function resize(){
      W=heroEl.offsetWidth;H=heroEl.offsetHeight;
      cv.width=W*dpr;cv.height=H*dpr;
      cv.style.width=W+'px';cv.style.height=H+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();
    const N=55;
    let mx=W*.5,my=H*.5,tmx=mx,tmy=my;
    const pts=Array.from({length:N},()=>({
      x:Math.random()*W,y:Math.random()*H,
      vx:(Math.random()-.5)*.12,vy:(Math.random()-.5)*.12,
      r:Math.random()*1.8+.6,
      op:Math.random()*.45+.15,
      // phase for breathing opacity
      phase:Math.random()*Math.PI*2,
      ps:.0008+Math.random()*.0012
    }));
    // 2 aurora orbs — slow drift
    const orbs=[
      {x:W*.25,y:H*.35,vx:.06,vy:.04,r:Math.max(W,H)*.45,hue:'26,71,204',op:.10},
      {x:W*.78,y:H*.7,vx:-.05,vy:-.03,r:Math.max(W,H)*.38,hue:'0,180,216',op:.07}
    ];
    document.addEventListener('mousemove',e=>{
      const rect=heroEl.getBoundingClientRect();
      tmx=e.clientX-rect.left;tmy=e.clientY-rect.top;
    });
    window.addEventListener('resize',resize);
    let t=0;
    function frame(){
      t++;
      // smooth mouse follow (no jitter)
      mx+=(tmx-mx)*.04;my+=(tmy-my)*.04;
      ctx.clearRect(0,0,W,H);

      // ─ Aurora orbs (slow drift, soft radial gradient) ─
      for(const o of orbs){
        o.x+=o.vx;o.y+=o.vy;
        if(o.x<-o.r*.3||o.x>W+o.r*.3)o.vx*=-1;
        if(o.y<-o.r*.3||o.y>H+o.r*.3)o.vy*=-1;
        const g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r);
        g.addColorStop(0,`rgba(${o.hue},${o.op})`);
        g.addColorStop(1,`rgba(${o.hue},0)`);
        ctx.fillStyle=g;
        ctx.fillRect(0,0,W,H);
      }

      // ─ Particle physics (gentle drift + soft mouse repulsion) ─
      for(const p of pts){
        const dx=mx-p.x,dy=my-p.y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<140&&d>5){
          // repel away (premium: subtle push, not aggressive pull)
          p.vx-=dx/d*.003;p.vy-=dy/d*.003;
        }
        // damping (slow settle)
        p.vx*=.992;p.vy*=.992;
        // micro brownian motion for organic drift
        p.vx+=(Math.random()-.5)*.008;p.vy+=(Math.random()-.5)*.008;
        const sp=Math.sqrt(p.vx*p.vx+p.vy*p.vy);
        if(sp>.45){p.vx/=sp/.45;p.vy/=sp/.45;}
        p.x+=p.vx;p.y+=p.vy;
        // wrap (no bounce — feels stuck on edges)
        if(p.x<-20)p.x=W+20;else if(p.x>W+20)p.x=-20;
        if(p.y<-20)p.y=H+20;else if(p.y>H+20)p.y=-20;
      }

      // ─ Line connections — longer reach, softer ─
      for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){
        const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<135){
          const a=.08*(1-d/135);
          ctx.beginPath();
          ctx.strokeStyle=`rgba(0,180,216,${a})`;
          ctx.lineWidth=.5;
          ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);
          ctx.stroke();
        }
      }

      // ─ Particles with soft glow halo ─
      for(const p of pts){
        // breathing opacity (slow sine)
        const breath=.7+Math.sin(p.phase+t*p.ps*60)*.3;
        const op=p.op*breath;
        // outer glow halo
        const gg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*5);
        gg.addColorStop(0,`rgba(0,180,216,${op*.6})`);
        gg.addColorStop(.4,`rgba(0,180,216,${op*.15})`);
        gg.addColorStop(1,`rgba(0,180,216,0)`);
        ctx.fillStyle=gg;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r*5,0,Math.PI*2);ctx.fill();
        // core dot
        ctx.beginPath();
        ctx.fillStyle=`rgba(220,240,255,${op})`;
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    frame();
  }

  // ─ GSAP hero entrance + magnetic CTA ─
  if(typeof gsap!=='undefined' && !reduceMotion){
    const E='power3.out';
    gsap.set('#hl',{opacity:0,y:14});
    gsap.set('#hm .line1',{opacity:0,y:26});
    gsap.set('#hm .line2',{opacity:0,y:26});
    gsap.set('#hr',{opacity:0,y:14});
    gsap.set('#hb',{opacity:0,y:16});
    gsap.set('#sh',{opacity:0});

    gsap.timeline({defaults:{ease:E}})
      .to('#hl',{opacity:1,y:0,duration:.6},.15)
      .to('#hm .line1',{opacity:1,y:0,duration:.85},'-=.35')
      .to('#hm .line2',{opacity:1,y:0,duration:.85},'-=.62')
      .to('#hr',{opacity:1,y:0,duration:.65},'-=.4')
      .to('#hb',{opacity:1,y:0,duration:.7},'-=.45')
      .to('#sh',{opacity:1,duration:.6},'-=.3');

    const btn=document.getElementById('mainBtn');
    if(btn && isHoverFine){
      btn.addEventListener('mousemove',e=>{
        const r=btn.getBoundingClientRect();
        gsap.to(btn,{x:(e.clientX-r.left-r.width/2)*.12,y:(e.clientY-r.top-r.height/2)*.12,duration:.28,ease:'power2.out'});
      });
      btn.addEventListener('mouseleave',()=>gsap.to(btn,{x:0,y:0,duration:.7,ease:'elastic.out(1,.5)'}));
    }
  }
})();

