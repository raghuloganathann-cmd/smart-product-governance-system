const STAGES=["Draft","Under review","Approved","Released","Retired"];
const CHECKS=["Security review","Privacy assessment","Quality testing","Legal and licence check"];
const KEY="spgs-v1";
let state={products:[],log:[],sel:null};

try{const s=localStorage.getItem(KEY);if(s)state=JSON.parse(s)}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

// Smart rule 1: risk score from data sensitivity, reach and criticality
function riskOf(p){
  const score=(p.data?3:0)+p.users*2+p.crit*2;
  return {score,level:score>=7?"High":score>=4?"Medium":"Low"};
}
// Smart rule 2: checks required before approval depend on the risk level
function required(p){
  const lvl=riskOf(p).level;
  if(lvl==="High")return CHECKS;
  if(lvl==="Medium")return p.data?CHECKS.slice(0,3):[CHECKS[0],CHECKS[2]];
  return [CHECKS[2]];
}
function note(msg,pid){state.log.unshift({t:new Date().toLocaleString(),msg,pid});state.log=state.log.slice(0,200)}
function find(id){return state.products.find(p=>p.id===id)}

function addProduct(){
  const name=$("name").value.trim(),owner=$("owner").value.trim();
  if(!name||!owner){$("name").reportValidity();return}
  const p={id:Date.now(),name,owner,cat:$("cat").value,data:+$("data").value,users:+$("users").value,crit:+$("crit").value,stage:0,checks:{}};
  state.products.push(p);state.sel=p.id;
  note(`Registered "${name}" (risk ${riskOf(p).level})`,p.id);
  $("form").reset();save();render();
}
function toggleCheck(id,c){
  const p=find(id);p.checks[c]=!p.checks[c];
  note(`${p.checks[c]?"Passed":"Cleared"} "${c}" for ${p.name}`,id);save();render();
}
function canAdvance(p){
  if(p.stage===1)return required(p).every(c=>p.checks[c]);
  return p.stage<4;
}
function advance(id){
  const p=find(id);
  if(!canAdvance(p)){$("msg").textContent="Complete all required checks before approval.";return}
  p.stage++;note(`${p.name} moved to ${STAGES[p.stage]}`,id);save();render();
}
function reject(id){
  const p=find(id);p.stage=0;note(`${p.name} sent back to Draft`,id);save();render();
}
function remove(id){
  const p=find(id);state.products=state.products.filter(x=>x.id!==id);
  note(`Deleted "${p.name}"`,id);state.sel=null;save();render();
}
function select(id){state.sel=id;render()}

function render(){
  const ps=state.products,count=s=>ps.filter(p=>p.stage===s).length;
  $("stats").innerHTML=[["Products",ps.length],["In review",count(1)],["Released",count(3)],["High risk",ps.filter(p=>riskOf(p).level==="High").length]]
    .map(([l,v])=>`<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("");
  $("empty").hidden=ps.length>0;
  $("rows").innerHTML=ps.map(p=>{const r=riskOf(p);
    return `<tr class="${p.id===state.sel?"sel":""}" onclick="select(${p.id})"><td>${esc(p.name)}<br><small>${esc(p.cat)}</small></td><td>${esc(p.owner)}</td><td><span class="badge">${STAGES[p.stage]}</span></td><td class="risk-${r.level}">${r.level} (${r.score})</td></tr>`}).join("");
  const p=find(state.sel);
  if(!p){$("detail").innerHTML=`<h2>Product details</h2><p class="empty">Select a product to review its checks and move it through the stages.</p>`}
  else{
    const r=riskOf(p),req=required(p),next=STAGES[p.stage+1];
    $("detail").innerHTML=`<h3>${esc(p.name)}</h3>
      <p class="sub">${esc(p.cat)} · owner ${esc(p.owner)} · <span class="risk-${r.level}">${r.level} risk</span></p>
      <h2 style="margin-top:14px">Required checks</h2>
      <div class="checks">${req.map(c=>`<label><input type="checkbox" ${p.checks[c]?"checked":""} onchange="toggleCheck(${p.id},'${c}')">${c}</label>`).join("")}</div>
      <div class="row">
        ${next?`<button class="primary" style="margin:0;width:auto" onclick="advance(${p.id})">Move to ${next}</button>`:""}
        ${p.stage>0&&p.stage<3?`<button onclick="reject(${p.id})">Send back to Draft</button>`:""}
        <button onclick="remove(${p.id})">Delete</button>
      </div>
      <div class="msg" id="msg" role="alert"></div>`;
  }
  $("log").innerHTML=state.log.length?state.log.map(l=>`<li><time>${l.t}</time>${esc(l.msg)}</li>`).join(""):`<li class="empty">No activity yet.</li>`;
}
$("add").addEventListener("click",addProduct);
render();
