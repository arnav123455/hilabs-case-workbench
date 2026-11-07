(function(){
const P=window.PATIENTS, FACT=window.FACTORS, NOW=window.NOW;
const $=s=>document.querySelector(s);
let S={weights:Object.fromEntries(FACT.map(f=>[f.k,f.w])),snoozed:{},done:{},confirmed:{},resolved:{},nbaState:{},asked:{},logs:[],consent:{},signed:{},callOn:null,whyOpen:{}};
try{const x=localStorage.getItem("hilabs_proto_v1");if(x){S=Object.assign(S,JSON.parse(x))}}catch(e){}
function save(){try{localStorage.setItem("hilabs_proto_v1",JSON.stringify(S))}catch(e){}}
function log(msg){S.logs.unshift({t:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),m:msg});S.logs=S.logs.slice(0,40);save()}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const score=p=>FACT.reduce((a,f)=>a+(p.flags[f.k]?S.weights[f.k]:0),0);
const days=d=>Math.round((new Date(d+"T00:00:00")-new Date("2026-11-09T00:00:00"))/86400000);
const dueTxt=c=>{const n=days(c.date);return n<0?`${c.label}: overdue`:n===0?`${c.label}: due today`:`${c.label}: due in ${n} d`};
const ranked=()=>P.slice().sort((a,b)=>score(b)-score(a));
function monthsOld(d){return (NOW-new Date(d))/(86400000*30.4)}
function route(){
  const h=location.hash||"#/queue";const [,r,id]=h.split("/");
  document.querySelectorAll("nav a").forEach(a=>a.classList.remove("on"));
  const nv=$("#nav-"+(r==="about"?"about":"queue"));nv&&nv.classList.add("on");
  const p=P.find(x=>x.id===id);
  if(r==="member"&&p)memberView(p);else if(r==="outreach"&&p)outreachView(p);else if(r==="about")aboutView();else queueView();
  window.scrollTo(0,0);
}
/* ---------------- QUEUE ---------------- */
function queueView(){
  const list=ranked();const active=list.filter(p=>!S.snoozed[p.id]&&!S.done[p.id]);const snoozed=list.filter(p=>S.snoozed[p.id]);const done=list.filter(p=>S.done[p.id]);
  let h=`<h1>Today: who to work first</h1><div class="sub"><b>${active.length}</b> need action today · 43 other cases on track (collapsed) · queue ordered by a transparent score, not a black box</div>`;
  active.forEach((p,i)=>{
    const sc=score(p);
    h+=`<div class="card"><div class="qcard"><div class="rank">${i+1}</div><div>
      <div><b style="font-size:17px">${esc(p.name)}</b>, ${p.age} · <span class="pill">${esc(p.plan)}</span> <span class="pill">${esc(p.lang)}</span></div>
      <div class="sub" style="margin:2px 0 4px">${esc(p.scenario)}</div>
      <div>${p.clocks.map(c=>`<span class="chip ${days(c.date)<=3?"rd":"am"}">⏱ ${esc(dueTxt(c))}</span>`).join("")}${p.chips.map(c=>`<span class="chip ${c.c}">${esc(c.t)}</span>`).join("")}</div>
      <div class="next"><b>Next best action:</b> ${esc(p.next)} <a href="#" data-why="${p.id}" style="color:var(--cy)">why this rank?</a></div>
      ${S.whyOpen[p.id]?whyBox(p):""}
    </div><div class="acts" style="text-align:right"><div class="score"><b>${sc}</b>/100</div><div style="margin-top:8px"><a class="btn" href="#/member/${p.id}">Open brief</a></div><div style="margin-top:6px"><select data-snooze="${p.id}" style="width:auto;font-size:12px"><option value="">Snooze…</option><option>Waiting on provider</option><option>Waiting on member callback</option><option>Not needed today</option></select></div></div></div></div>`;
  });
  h+=`<div class="card"><h2>Score settings (editable weights)</h2><div class="sub" style="margin-bottom:8px">Weights are assumptions to calibrate with clinicians in the pilot. Change them and the queue re-orders; Maria can always override.</div>`;
  FACT.forEach(f=>h+=`<div class="bar" style="grid-template-columns:300px 1fr 40px"><span>${esc(f.n)}</span><input type="range" min="0" max="40" value="${S.weights[f.k]}" data-w="${f.k}"><b>${S.weights[f.k]}</b></div>`);
  h+=`<button class="btn o sm" id="resetw" style="margin-top:8px">Reset weights</button></div>`;
  if(snoozed.length){h+=`<div class="card"><h2>Waiting on others (${snoozed.length})</h2>`+snoozed.map(p=>`<div style="padding:4px 0">${esc(p.name)} <span class="pill">${esc(S.snoozed[p.id])}</span> <button class="btn o sm" data-unsnooze="${p.id}">Resurface</button></div>`).join("")+`</div>`}
  if(done.length){h+=`<div class="card"><h2>Worked today (${done.length})</h2>`+done.map(p=>`<div class="done-badge">✓ ${esc(p.name)} · note signed</div>`).join("")+`</div>`}
  if(S.logs.length)h+=`<div class="card"><h2>Activity log</h2><div class="log">${S.logs.map(l=>`<div>${l.t} · ${esc(l.m)}</div>`).join("")}</div><button class="btn o sm" id="resetall" style="margin-top:8px">Reset demo</button></div>`;
  $("#app").innerHTML=h;
  document.querySelectorAll("[data-why]").forEach(a=>a.onclick=e=>{e.preventDefault();S.whyOpen[a.dataset.why]=!S.whyOpen[a.dataset.why];queueView()});
  document.querySelectorAll("[data-snooze]").forEach(s=>s.onchange=()=>{if(s.value){S.snoozed[s.dataset.snooze]=s.value;log(`Snoozed ${P.find(x=>x.id===s.dataset.snooze).name}: ${s.value}`);save();queueView()}});
  document.querySelectorAll("[data-unsnooze]").forEach(b=>b.onclick=()=>{delete S.snoozed[b.dataset.unsnooze];save();queueView()});
  document.querySelectorAll("[data-w]").forEach(r=>r.oninput=()=>{S.weights[r.dataset.w]=+r.value;save();queueView()});
  const rw=$("#resetw");rw&&(rw.onclick=()=>{FACT.forEach(f=>S.weights[f.k]=f.w);save();queueView()});
  const ra=$("#resetall");ra&&(ra.onclick=()=>{try{localStorage.removeItem("hilabs_proto_v1")}catch(e){}location.reload()});
}
function whyBox(p){return `<div class="why"><b>Score breakdown (${score(p)}/100)</b>`+FACT.map(f=>{const on=p.flags[f.k];return `<div class="bar ${on?"":"off"}"><span>${on?"●":"○"} ${esc(f.n)}</span><i style="width:${on?S.weights[f.k]*2.5:0}px"></i><b>${on?S.weights[f.k]:0}</b></div>`}).join("")+`<div class="log">Risk drivers: ${esc(p.risk.drivers)} (score ${p.risk.score})</div></div>`}
/* ---------------- MEMBER BRIEF ---------------- */
function memberView(p){
  const cf=S.consent[p.id];
  let h=`<a class="back" href="#/queue">← Today</a><h1>${esc(p.name)}, ${p.age}</h1><div class="sub">${esc(p.plan)} · ${esc(p.lang)} · PCP: ${esc(p.pcp)} · Member ID ${p.id}</div>
  <div class="card"><div>${p.clocks.map(c=>`<span class="chip ${days(c.date)<=3?"rd":"am"}">⏱ ${esc(dueTxt(c))}</span>`).join("")}${p.chips.map(c=>`<span class="chip ${c.c}">${esc(c.t)}</span>`).join("")}</div>
  <div style="margin-top:8px"><a class="btn" href="#/outreach/${p.id}">Reach out &amp; document →</a></div></div>
  <div class="card ai"><h2>AI brief <span class="chip bl">draft: you confirm</span></h2><div class="brief" contenteditable="true" id="brief">${esc(p.brief)}</div>
  <div class="log" style="margin-top:6px">Sources: ADT, claims, pharmacy, clinical documents, contact history. Edit the text above if needed.</div>
  <div style="margin-top:8px">${S.confirmed[p.id]?`<span class="done-badge">✓ Reviewed by Maria</span>`:`<button class="btn sm" id="confbrief">Confirm brief</button>`}</div></div>
  <div class="card"><h2>Data freshness: how current is each source?</h2>${p.fresh.map(f=>`<span class="chip ${f.c}">${esc(f.t)}</span>`).join("")}<div class="log" style="margin-top:6px">Green = current · amber = partial · red = lagging or incomplete · grey = old or no event. Stale data is shown as stale; nothing is silently overwritten.</div></div>`;
  h+=`<div class="card"><h2>Conflicts across sources (${p.conflicts.filter(c=>!S.resolved[p.id+c.id]).length} open)</h2>`;
  p.conflicts.forEach(c=>{const k=p.id+c.id;const r=S.resolved[k];
    h+=`<div class="conf" style="${r?"border-color:var(--gr);background:rgba(111,240,176,.07)":""}"><b>${esc(c.title)}</b> <span class="chip ${c.conf==="High"?"gr":"am"}">confidence: ${c.conf}</span>
    <div class="vs"><div><small>${esc(c.a.src)} · ${esc(c.a.date)}</small>${esc(c.a.v)}</div><div><small>${esc(c.b.src)} · ${esc(c.b.date)}</small>${esc(c.b.v)}</div></div>
    <div><b>Suggestion:</b> ${esc(c.sug)} <span class="log">Why: ${esc(c.why)}</span></div>
    <div style="margin-top:6px">${r?`<span class="done-badge">✓ ${esc(r)}</span>`:`<button class="btn sm" data-res="${k}|Accepted suggestion">Accept suggestion</button> <button class="btn o sm" data-res="${k}|Kept both: needs verification">Keep both</button> ${c.prescriber?`<button class="btn o sm" data-res="${k}|Message sent to ${esc(c.prescriber)}">Message ${esc(c.prescriber)}</button>`:""}`}</div></div>`});
  h+=`</div><div class="card"><h2>Next best actions</h2>`;
  p.nba.forEach(n=>{const st=S.nbaState[p.id+n.id];
    h+=`<div class="nba ${st==="done"?"done":""}"><div><b>${esc(n.t)}</b><small>Why: ${esc(n.why)}</small></div><div>${st?`<span class="pill">${st==="done"?"✓ task created":st}</span>`:`<button class="btn sm" data-nba="${p.id+n.id}|done">Accept</button> <button class="btn o sm" data-nba="${p.id+n.id}|snoozed">Snooze</button> <button class="btn o sm" data-nba="${p.id+n.id}|not relevant">Not relevant</button>`}</div></div>`});
  h+=`</div><div class="two"><div class="card"><h2>Medications (all sources side by side)</h2><table><tr><th>Drug</th><th>Source</th><th>Date</th><th>Status</th></tr>${p.meds.map(m=>`<tr><td>${esc(m.drug)}</td><td>${esc(m.src)}</td><td>${esc(m.date)}</td><td><b style="color:${/ok/.test(m.status)?"var(--gr)":"var(--am)"}">${esc(m.status)}</b></td></tr>`).join("")}</table></div>
  <div class="card"><h2>Timeline (ADT + claims merged)</h2><table>${p.timeline.map(t=>`<tr><td style="white-space:nowrap">${esc(t.d)}</td><td>${esc(t.e)}</td><td>${esc(t.s)}</td></tr>`).join("")}</table></div></div>
  <div class="two"><div class="card"><h2>Social needs (self-reported)</h2><table>${p.sdoh.map(s=>{const m=monthsOld(s.date);return `<tr><td>${esc(s.d)}</td><td>${esc(s.f)}</td><td><span class="chip ${m>6?"rd":"gr"}">${m.toFixed(0)} mo${m>6?" · re-confirm":""}</span></td></tr>`}).join("")}</table></div>
  <div class="card"><h2>Risk &amp; consent</h2><div>Risk score <b>${p.risk.score}</b> · ${esc(p.risk.drivers)}</div>
  ${p.restricted?`<div class="restr">${cf?`<b>${esc(p.restricted.label)}</b><br><span class="log">Shown because consent is on file (logged).</span>`:`🔒 One diagnosis is hidden. ${esc(p.restricted.note)}<br><button class="btn sm" id="consent" style="margin-top:6px">Record consent on file</button>`}</div>`:`<div class="log" style="margin-top:6px">No access restrictions on this record.</div>`}</div></div>`;
  $("#app").innerHTML=h;
  const cb=$("#confbrief");cb&&(cb.onclick=()=>{S.confirmed[p.id]=1;log(`Brief confirmed: ${p.name}`);save();memberView(p)});
  document.querySelectorAll("[data-res]").forEach(b=>b.onclick=()=>{const [k,t]=b.dataset.res.split("|");S.resolved[k]=t;log(`${p.name}: ${t}`);save();memberView(p)});
  document.querySelectorAll("[data-nba]").forEach(b=>b.onclick=()=>{const [k,t]=b.dataset.nba.split("|");let reason="";if(t==="not relevant"){reason=prompt("Why is this not relevant? (helps tune the rules)")||"no reason given"}S.nbaState[k]=t==="not relevant"?"not relevant: "+reason:t;log(`${p.name}: action ${t}${reason?" ("+reason+")":""}`);save();memberView(p)});
  const co=$("#consent");co&&(co.onclick=()=>{S.consent[p.id]=1;log(`Consent recorded for ${p.name} (access logged)`);save();memberView(p)});
}
/* ---------------- OUTREACH & DOC ---------------- */
function outreachView(p){
  const asked=S.asked[p.id]||{};const nAsk=p.assess.ask.length,nJ=p.assess.judge.length,nPre=p.assess.pre.length;const filled=Object.keys(asked).filter(k=>asked[k]).length;
  const total=nPre+nAsk+nJ;
  const note=(S.notes&&S.notes[p.id])||p.noteDraft;
  let h=`<a class="back" href="#/member/${p.id}">← Member brief</a><h1>Reach out &amp; document: ${esc(p.name)}</h1><div class="sub">${esc(p.lang)} · best time: ${esc(p.best)} · SMS: ${esc(p.sms)}</div><div class="two"><div>
  <div class="card"><h2>1. Which number?</h2>${p.contacts.map((c,i)=>{const blocked=c.gated&&!S.consent[p.id+"sh"];return `<div class="num ${c.state}"><div><b>${esc(c.num)}</b> <span class="chip ${c.state==="good"?"gr":c.state==="dead"?"rd":"am"}">${esc(c.conf)}</span><br>${esc(c.label)}<div class="log">${esc(c.ev)}</div></div><div>${c.state==="dead"?`<span class="pill">suppressed</span>`:blocked?`<button class="btn o sm" data-cons="${p.id}sh">Record consent</button>`:S.callOn===p.id+i?`<button class="btn sm" data-end="${i}">End call</button>`:`<button class="btn sm" data-call="${i}">Call</button>`}</div></div>`}).join("")}
  <div class="log">Dead or unusable numbers are not offered for auto-dial. Confidence comes from agreement across sources, not a single field.</div></div>
  <div class="card"><h2>2. Before you dial</h2><div>${esc(p.before)}</div><h3>Suggested opener <span class="chip bl">editable draft</span></h3><div contenteditable="true" style="background:rgba(0,0,0,.25);border-radius:8px;padding:8px">${esc(p.opener)}</div></div></div><div>
  <div class="card ai"><h2>3. Call note <span class="chip bl">AI draft: you confirm</span></h2><textarea id="note">${esc(note)}</textarea>
  <h3>Outcome</h3><select id="outcome"><option value="">Select outcome…</option><option>Reached member</option><option>Reached caregiver / authorized rep</option><option>Voicemail left</option><option>No answer</option><option>Number not working</option></select>
  <div class="log" style="margin-top:6px">Dictate or type. Structured fields below update the care plan automatically.</div></div>
  <div class="card"><h2>4. Assessment: ${total} fields</h2><div class="prog"><i style="width:${nPre/total*100}%;background:var(--gr)"></i><i style="width:${filled/total*100}%;background:var(--cy)"></i><i style="width:${(nAsk-filled+nJ)/total*100}%;background:rgba(255,255,255,.2)"></i></div>
  <span class="chip gr">${nPre} prefilled from data</span><span class="chip am">${nAsk-filled} ask member</span><span class="chip bl">${nJ} clinical judgment</span>
  <h3>Ask the member (click to record answer)</h3>${p.assess.ask.map((q,i)=>`<div class="ask"><span style="min-width:210px">${esc(q)}</span><input type="text" data-ask="${i}" placeholder="answer…" value="${esc(asked[i]||"")}"></div>`).join("")}
  <h3>Clinical judgment: yours alone</h3>${p.assess.judge.map(j=>`<div class="ask">◆ ${esc(j)}</div>`).join("")}
  <details style="margin-top:8px"><summary class="log" style="cursor:pointer">Show the ${nPre} prefilled fields</summary><div class="log">${p.assess.pre.map(esc).join(" · ")}</div></details></div>
  <div class="card">${S.signed[p.id]?`<span class="done-badge">✓ Signed and filed</span>`:`<label class="log"><input type="checkbox" id="rev"> I reviewed and edited the AI-drafted content</label><div style="margin-top:8px"><button class="btn" id="sign" disabled>Review &amp; sign</button></div>`}</div></div></div>`;
  $("#app").innerHTML=h;
  document.querySelectorAll("[data-cons]").forEach(b=>b.onclick=()=>{S.consent[b.dataset.cons]=1;log("Consent recorded to contact shelter caseworker");save();outreachView(p)});
  document.querySelectorAll("[data-call]").forEach(b=>b.onclick=()=>{S.callOn=p.id+b.dataset.call;log(`Call started: ${p.contacts[b.dataset.call].num}`);outreachView(p)});
  document.querySelectorAll("[data-end]").forEach(b=>b.onclick=()=>{S.callOn=null;log("Call ended");save();outreachView(p)});
  document.querySelectorAll("[data-ask]").forEach(i=>i.onchange=()=>{S.asked[p.id]=S.asked[p.id]||{};S.asked[p.id][i.dataset.ask]=i.value.trim();save();const y=window.scrollY;outreachView(p);window.scrollTo(0,y)});
  const rev=$("#rev"),sg=$("#sign"),nt=$("#note"),oc=$("#outcome");
  if(rev){const chk=()=>sg.disabled=!(rev.checked&&nt.value.trim()&&oc.value);rev.onchange=chk;oc.onchange=chk;nt.oninput=()=>{S.notes=S.notes||{};S.notes[p.id]=nt.value;chk()};
    sg.onclick=()=>{S.signed[p.id]=1;S.done[p.id]=1;log(`Note signed for ${p.name} (${oc.value})`);save();outreachView(p)}}
}
/* ---------------- ABOUT ---------------- */
function aboutView(){
  $("#app").innerHTML=`<h1>How this prototype works</h1><div class="sub">A clickable MVP of the Case Management Workbench from the HiLabs APM product caselet. All data is synthetic and runs in your browser.</div>
  <div class="three"><div class="card"><h2>1 · Today</h2>Ranked work queue with a transparent 100-point score, due-clocks and one next action per member. Change the weights; snooze with a reason.</div>
  <div class="card"><h2>2 · Member brief</h2>Freshness chips, cross-source conflicts with confidence, AI brief you must confirm, next-best-actions (accept / snooze / not relevant) and a side-by-side medication view.</div>
  <div class="card"><h2>3 · Outreach &amp; documentation</h2>Number ranking that suppresses dead numbers, opener, call-note draft and assessment prefill; nothing is filed until the clinician signs.</div></div>
  <div class="card"><h2>What is automated vs. confirmed</h2><div class="legend"><span class="chip gr">Automated</span> joining sources, freshness, clocks, score, number validity<br><br><span class="chip bl">AI drafts → clinician confirms</span> brief, conflict suggestions, call note, assessment prefill<br><br><span class="chip am">Clinician only</span> assessment judgments, care-plan goals, medication questions to prescribers, closing a case</div></div>
  <div class="card"><h2>Try this</h2>Open Terrence → record consent → try the Outreach view. Open Ruth → resolve the three conflicts. Reorder the queue by changing weights. Sign a note and watch the patient move to "Worked today". Use <i>Reset demo</i> at the bottom of Today to start over.</div>
  <a class="btn" href="#/queue">Go to Today</a>`;
}
window.addEventListener("hashchange",route);route();
})();
