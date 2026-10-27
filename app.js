/* PRECIFICA: lógica. MKT_PADRAO (marketplaces), calc() (motor financeiro), V (telas), ins() (Assistente). Dados no localStorage. */
window.addEventListener('error',function(e){var a=document.getElementById('app');if(a&&!a.innerHTML)a.innerHTML='<div class="card">Não foi possível iniciar o app. Atualize a página ou use um navegador atualizado. ('+e.message+')</div>'});
const $=s=>document.querySelector(s),n=v=>parseFloat(String(v).replace(',','.'))||0;
const R=v=>isFinite(v)?v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'—';
const P=v=>isFinite(v)?(v*100).toFixed(1).replace('.',',')+'%':'—';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MKT_PADRAO={'Mercado Livre':{com:0,fixa:0,pag:0},'Shopee':{com:0,fixa:0,pag:0},'Amazon':{com:0,fixa:0,pag:0},'TikTok Shop':{com:0,fixa:0,pag:0},'Venda direta':{com:0,fixa:0,pag:0}};
const CFG_PADRAO={fixos:0,rateio:'un',mmin:0,malvo:0,imp:0,cresc:0,caixa:0,diasRepor:0};
const demo=()=>[];
function load(){try{const s=JSON.parse(localStorage.getItem('precifica2'));if(s&&s.prods)return s}catch(e){}return{cfg:{...CFG_PADRAO},mps:JSON.parse(JSON.stringify(MKT_PADRAO)),prods:demo()}}
let S=load();
const save=()=>{try{localStorage.setItem('precifica2',JSON.stringify(S))}catch(e){}};
const blank=()=>({id:''+Date.now(),nome:'',mp:Object.keys(S.mps)[0],custo:0,preco:0,imp:S.cfg.imp,frete:0,emb:0,pub:0,outros:0,vendas:0,estoque:0,conc:0});
S.cur=blank();
let tab=S.prods.length?'cat':'calc',SEL={id:''},SIM={dp:0,dc:0,da:0,dv:0,dd:0};
const toast=t=>{const e=$('#toast');e.textContent=t;e.style.display='block';setTimeout(()=>e.style.display='none',1800)};
const cp=()=>S.prods.find(x=>x.id==SEL.id)||S.prods[0];
const emp='<div class="card">Cadastre ao menos um produto na Calculadora para usar esta tela.</div>';
const sel=()=>`<label>Produto<select onchange="SEL.id=this.value;render()">${S.prods.map(p=>`<option value="${p.id}" ${p.id==cp().id?'selected':''}>${esc(p.nome)}</option>`).join('')}</select></label>`;

/* ===== MOTOR FINANCEIRO ===== */
function T(q){let un=0,fat=0;S.prods.forEach(x=>{if(x.id!==q.id){un+=x.vendas;fat+=x.preco*x.vendas}});return{un:un+q.vendas,fat:fat+q.preco*q.vendas}}
function calc(p,o){
 const q={...p,...o},m=S.mps[q.mp]||{com:0,fixa:0,pag:0},c=S.cfg,t=T(q);
 const pct=(m.com+m.pag+q.imp)/100,ma=c.malvo/100;
 const fx=c.rateio=='fat'?(t.fat?c.fixos*q.preco/t.fat:0):(t.un?c.fixos/t.un:0);
 const dir=q.custo+q.frete+q.emb+q.pub+q.outros+m.fixa;
 const tot=dir+q.preco*pct+fx,luc=q.preco-tot,cm=q.preco*(1-pct)-dir;
 const d=1-pct-ma,d0=1-pct;
 return{q,m,pct,fx,dir,tot,luc,cm,mg:q.preco?luc/q.preco:0,roi:tot?luc/tot:0,
  min:d0>0?(dir+fx)/d0:NaN,ideal:d>0?(dir+fx)/d:NaN,
  cmax:q.preco*d-(dir-q.custo)-fx,pe:cm>0?Math.ceil(c.fixos/cm):null}}
function diag(r){const c=S.cfg;
 if(r.luc<0)return['bad',`Você perde ${R(-r.luc)} em cada venda.`];
 if(r.mg<c.mmin/100)return['war',`Margem abaixo da mínima de ${c.mmin}% definida por você.`];
 return['pos','Margem saudável.']}

/* ===== CAMPOS: m=moeda (estilo Nubank, digita só números), p=percentual, ps=percentual com sinal, q=quantidade ===== */
const fv=(k,v)=>k=='m'?R(v):k=='q'?String(Math.round(v)||0):String(Math.round(v*100)/100).replace('.',',');
const ni=(k,v,js)=>`<input type="text" inputmode="${k=='m'||k=='q'?'numeric':'decimal'}" autocomplete="off" value="${esc(fv(k,v))}" oninput="${js}">`;
function fi(el,k){let s=el.value,v;
 if(k=='m'){v=(parseInt(s.replace(/\D/g,'').slice(0,12)||'0',10))/100;el.value=R(v);try{el.setSelectionRange(el.value.length,el.value.length)}catch(e){}}
 else if(k=='q'){s=s.replace(/\D/g,'').slice(0,9);if(s!=el.value)el.value=s;v=+s||0}
 else{const ng=k=='ps'&&s.trim()[0]=='-';s=s.replace(/\./g,',').replace(/[^\d,]/g,'');const i=s.indexOf(',');if(i>=0)s=s.slice(0,i+1)+s.slice(i+1).replace(/,/g,'').slice(0,2);if(n(s)>100)s='100';s=(ng?'-':'')+s;if(s!=el.value)el.value=s;v=n(s)}
 return v}
/* ===== SIMULADOR: barra + campo sincronizados (valores são variações em %) ===== */
const SIMR={dp:[-30,30],dc:[-30,30],da:[-100,100],dv:[-50,100],dd:[0,60]};
const sl=(k,l)=>{const[mn,mx]=SIMR[k];return`<div class="sw"><label for="f_${k}">${l}</label><div class="sr"><input type="range" id="r_${k}" aria-label="${l}" min="${mn}" max="${mx}" step="0.05" value="${SIM[k]}" oninput="simSet('${k}',+this.value,'r')"><div class="pc"><input type="text" id="f_${k}" inputmode="text" autocomplete="off" value="${fv('p',SIM[k])}" oninput="simIn('${k}',this)" onblur="simFix('${k}')"><i>%</i></div></div></div>`};
function simSet(k,v,src){SIM[k]=v;if(src!='r')$('#r_'+k).value=v;if(src!='f')$('#f_'+k).value=fv('p',v);$('#out').innerHTML=(k=='dd'?prOut:simOut)()}
function simIn(k,el){const[mn,mx]=SIMR[k];let s=el.value.replace(/\./g,',').replace(/[^\d,-]/g,'');const ng=s[0]=='-';s=s.replace(/-/g,'');const i=s.indexOf(',');if(i>=0)s=s.slice(0,i+1)+s.slice(i+1).replace(/,/g,'').slice(0,2);s=(ng&&mn<0?'-':'')+s;if(s!=el.value)el.value=s;simSet(k,Math.min(mx,Math.max(mn,n(s))),'f')}
const simFix=k=>{$('#f_'+k).value=fv('p',SIM[k])};
/* ===== ESTOQUE E CAIXA ===== */
const estD=p=>{const cob=p.vendas?p.estoque/(p.vendas/30):Infinity,low=p.estoque<=0||(S.cfg.diasRepor&&cob<S.cfg.diasRepor);return[R(p.estoque*p.custo),isFinite(cob)?Math.round(cob)+' dias':'—',p.estoque<=0?'<span class="bd neg">Sem estoque</span>':low?'<span class="bd war">Repor</span>':'<span class="bd pos">OK</span>',low]};
const estK=()=>{const d=S.prods.map(estD),a=d.filter(x=>x[3]).length;return`<div class="kpis"><div class="kpi"><span>Capital parado</span><b>${R(S.prods.reduce((s,p)=>s+p.estoque*p.custo,0))}</b></div><div class="kpi"><span>Unidades em estoque</span><b>${S.prods.reduce((s,p)=>s+p.estoque,0)}</b></div><div class="kpi"><span>Produtos para repor</span><b class="${a?'war':'pos'}">${a}</b></div></div>`};
function setE(id,v){const p=S.prods.find(x=>x.id==id);if(!p)return;p.estoque=Math.max(0,Math.round(v)||0);if(S.cur.id==id)S.cur.estoque=p.estoque;const d=estD(p);$('#ec_'+id).textContent=d[0];$('#eb_'+id).textContent=d[1];$('#es_'+id).innerHTML=d[2];$('#estK').innerHTML=estK();save();$('#estMsg').textContent='✓ Salvo';clearTimeout(setE.t);setE.t=setTimeout(()=>{const e=$('#estMsg');if(e)e.textContent=''},1500)}
function stepE(id,d){const p=S.prods.find(x=>x.id==id);if(!p)return;setE(id,p.estoque+d);$('#eq_'+id).value=p.estoque}
function fluxo(){const L=S.prods.map(p=>calc(p)),cm=L.reduce((a,r)=>a+r.cm*r.q.vendas,0),g=S.cfg.cresc/100,base=L.reduce((a,r)=>a+r.q.preco*r.q.vendas,0),rows=[];let ac=S.cfg.caixa;
 for(let m=0;m<6;m++){const f=Math.pow(1+g,m),lu=cm*f-S.cfg.fixos;ac+=lu;rows.push([m+1,base*f,lu,ac])}
 const mx=Math.max(...rows.map(r=>Math.abs(r[2])),1),ng=rows.find(r=>r[3]<0);
 return`<p class="${ng?'neg':'pos'}" style="margin:10px 0"><b>${ng?`O caixa fica negativo no mês ${ng[0]}.`:`Caixa positivo nos 6 meses. Saldo final: ${R(rows[5][3])}.`}</b></p><div class="tb"><table><tr><th>Mês</th><th>Faturamento</th><th>Lucro do mês</th><th>Caixa acumulado</th><th></th></tr>
 ${rows.map(([m,rc,lu,a])=>`<tr><td>${m}</td><td>${R(rc)}</td><td class="${lu<0?'neg':'pos'}">${R(lu)}</td><td class="${a<0?'neg':'pos'}"><b>${R(a)}</b></td><td style="width:120px"><div class="bar ${lu<0?'':'l'}" style="width:${Math.abs(lu)/mx*100}%;${lu<0?'background:var(--bad)':''}"></div></td></tr>`).join('')}</table></div>`}
const fluxoUpd=()=>{$('#fluxo').innerHTML=fluxo()};

/* ===== TELAS ===== */
const F=[['nome','Produto','text','w'],['mp','Marketplace','sel','w'],['custo','Custo de aquisição (R$)','m'],['preco','Preço de venda (R$)','m'],['imp','Impostos (%)','p'],['frete','Frete (R$)','m'],['emb','Embalagem (R$)','m'],['pub','Publicidade por venda (R$)','m'],['outros','Outros custos variáveis (R$)','m'],['vendas','Vendas por mês (un.)','q'],['estoque','Estoque (un.)','q'],['conc','Preço do concorrente (R$)','m']];
function upd(k,v){S.cur[k]=(k=='nome'||k=='mp')?v:n(v);$('#res').innerHTML=res(calc(S.cur))}
function res(r){const q=r.q,[cl,tx]=diag(r),m=r.m;
 if(!q.preco)return'<h3>Quanto você realmente ganha</h3><p class="mu">Informe o preço de venda e os custos. O resultado aparece aqui, calculado só com os seus números.</p>';
 const br=[['Custo do produto',q.custo],['Comissão e taxas',q.preco*(m.com+m.pag)/100+m.fixa],['Impostos',q.preco*q.imp/100],['Frete',q.frete],['Embalagem',q.emb],['Publicidade',q.pub],['Outros custos',q.outros],['Custos fixos (rateio)',r.fx],['Lucro',r.luc]];
 return`<h3>Quanto você realmente ganha</h3><div class="big ${r.luc<0?'neg':'pos'}">${R(r.luc)}</div><div class="${cl}" style="margin:4px 0 12px">por unidade. ${tx}</div>
 <div class="kpis"><div class="kpi"><span>Margem de lucro</span><b>${P(r.mg)}</b></div><div class="kpi"><span>ROI</span><b>${P(r.roi)}</b></div><div class="kpi"><span>Custo total por venda</span><b>${R(r.tot)}</b></div>
 <div class="kpi"><span>Preço mínimo</span><b>${R(r.min)}</b></div><div class="kpi"><span>Preço ideal (${S.cfg.malvo}%)</span><b>${R(r.ideal)}</b></div><div class="kpi"><span>Custo máx. de aquisição</span><b>${R(r.cmax)}</b></div>
 <div class="kpi"><span>Ponto de equilíbrio</span><b>${r.pe===null?'—':r.pe+' un./mês'}</b></div></div>
 <div class="mu" style="font-size:13px;margin-bottom:6px">Para onde vai cada ${R(q.preco)}</div>
 ${br.map(([a,v],i)=>`<div class="bl"><span>${a}</span><div><div class="bar ${i==8?'l':''}" style="width:${Math.max(0,Math.min(100,q.preco?v/q.preco*100:0))}%"></div></div><span>${R(v)}</span></div>`).join('')}
 <div class="mu" style="font-size:12px;margin-top:8px">Ponto de equilíbrio: unidades por mês para cobrir os custos fixos vendendo só este produto.</div>${m.com||m.fixa||m.pag?'':'<div class="war" style="font-size:13px;margin-top:8px">As taxas deste marketplace estão zeradas. Informe-as em Ajustes para o lucro refletir a comissão real.</div>'}`}
function saveP(){const c=S.cur;if(!c.nome.trim())return toast('Dê um nome ao produto');const i=S.prods.findIndex(x=>x.id==c.id);const v={...c};i<0?S.prods.push(v):S.prods[i]=v;save();toast('Produto salvo')}
const newP=()=>{S.cur=blank();render()};
const editP=id=>{S.cur={...S.prods.find(x=>x.id==id)};go('calc')};
const delP=id=>{if(confirm('Excluir este produto?')){S.prods=S.prods.filter(x=>x.id!=id);save();render()}};

const V={
calc(){const c=S.cur,ed=S.prods.some(x=>x.id==c.id);if(ed)c.estoque=S.prods.find(x=>x.id==c.id).estoque;
 return`<h1>Descubra quanto você realmente ganha em cada produto.</h1><p class="mu" style="margin-top:0">Preencha os custos da venda. O resultado atualiza enquanto você digita.</p>
 <div class="grid"><div class="card"><h3>${ed?'Editando produto':'Novo produto'}</h3><div class="fm">${F.map(([k,l,t,w])=>`<label class="${w||''}">${l}${t=='sel'?`<select onchange="upd('${k}',this.value)">${Object.keys(S.mps).map(x=>`<option ${x==c[k]?'selected':''}>${esc(x)}</option>`).join('')}</select>`:(t=='text'?`<input type="text" value="${esc(c[k])}" oninput="upd('${k}',this.value)">`:ni(t,c[k],`upd('${k}',fi(this,'${t}'))`))}</label>`).join('')}</div>
 <div class="row"><button class="pri" onclick="saveP()">Salvar no catálogo</button><button onclick="newP()">Novo produto</button></div></div>
 <div class="card" id="res">${res(calc(c))}</div></div>`},
cat(){if(!S.prods.length)return emp;
 const L=S.prods.map(p=>calc(p)).sort((a,b)=>a.mg-b.mg),rec=L.reduce((a,r)=>a+r.q.preco*r.q.vendas,0),cm=L.reduce((a,r)=>a+r.cm*r.q.vendas,0),luc=cm-S.cfg.fixos,al=L.filter(r=>r.mg<S.cfg.mmin/100).length;
 return`<div class="kpis"><div class="kpi"><span>Faturamento mensal</span><b>${R(rec)}</b></div><div class="kpi"><span>Lucro mensal (após fixos)</span><b class="${luc<0?'neg':'pos'}">${R(luc)}</b></div><div class="kpi"><span>Margem geral</span><b>${P(rec?luc/rec:0)}</b></div><div class="kpi"><span>Produtos em alerta</span><b class="${al?'war':'pos'}">${al}</b></div></div>
 <div class="card"><h3>Catálogo, do mais frágil ao mais forte</h3><div class="tb"><table><tr><th>Produto</th><th>Marketplace</th><th>Preço</th><th>Lucro/un.</th><th>Margem</th><th>ROI</th><th>Status</th><th></th></tr>
 ${L.map(r=>{const[cl,tx]=diag(r);return`<tr><td>${esc(r.q.nome)}</td><td>${esc(r.q.mp)}</td><td>${R(r.q.preco)}</td><td class="${cl}">${R(r.luc)}</td><td>${P(r.mg)}</td><td>${P(r.roi)}</td><td><span class="bd ${cl}">${r.luc<0?'Prejuízo':cl=='war'?'Alerta':'OK'}</span></td><td><button onclick="editP('${r.q.id}')">Editar</button> <button onclick="delP('${r.q.id}')">Excluir</button></td></tr>`}).join('')}</table></div></div>`},
sim(){if(!S.prods.length)return emp;
 return`<div class="card"><h3>Simulador de cenários</h3>${sel()}<p class="mu" style="margin:8px 0 0">Arraste a barra ou digite o valor exato (ex.: 14,25). Todos os campos são variações em relação ao valor atual.</p><div class="fm" style="margin-top:10px">${sl('dp','Preço (variação %)')}${sl('dc','Custo de aquisição (variação %)')}${sl('da','Publicidade (variação %)')}${sl('dv','Volume de vendas (variação %)')}</div><div id="out" style="margin-top:12px">${simOut()}</div></div>`},
mk(){if(!S.prods.length)return emp;const p=cp(),L=Object.keys(S.mps).map(k=>[k,calc(p,{mp:k})]).sort((a,b)=>b[1].luc-a[1].luc);
 return`<div class="card"><h3>Onde este produto rende mais</h3>${sel()}<p class="mu">Mesmo preço, custos e impostos em cada marketplace. As taxas vêm de Ajustes.</p><div class="tb"><table><tr><th>Marketplace</th><th>Lucro/un.</th><th>Margem</th><th>ROI</th><th>Preço para ${S.cfg.malvo}%</th></tr>
 ${L.map(([k,r],i)=>`<tr><td>${esc(k)} ${i==0?'<span class="bd pos">melhor</span>':''}${k==p.mp?' <span class="bd mu">atual</span>':''}</td><td class="${r.luc<0?'neg':''}">${R(r.luc)}</td><td>${P(r.mg)}</td><td>${P(r.roi)}</td><td>${R(r.ideal)}</td></tr>`).join('')}</table></div></div>`},
pr(){if(!S.prods.length)return emp;
 return`<div class="card"><h3>Análise de promoção</h3>${sel()}<div style="margin-top:10px">${sl('dd','Desconto (%)')}</div><div id="out" style="margin-top:12px">${prOut()}</div></div>`},
est(){if(!S.prods.length)return emp;
 return`<div id="estK">${estK()}</div><div class="card"><h3>Estoque</h3><p class="mu" style="margin-top:0">Altere a quantidade direto na tabela. Salvo automaticamente <b id="estMsg" class="pos"></b></p><div class="tb"><table><tr><th>Produto</th><th>Quantidade</th><th>Capital parado</th><th>Cobertura</th><th>Situação</th></tr>
 ${S.prods.map(p=>{const d=estD(p);return`<tr><td>${esc(p.nome)}</td><td><div class="qty"><button onclick="stepE('${p.id}',-1)" aria-label="Diminuir">−</button><input id="eq_${p.id}" type="text" inputmode="numeric" autocomplete="off" value="${p.estoque}" oninput="setE('${p.id}',fi(this,'q'))" aria-label="Quantidade de ${esc(p.nome)}"><button onclick="stepE('${p.id}',1)" aria-label="Aumentar">+</button></div></td><td id="ec_${p.id}">${d[0]}</td><td id="eb_${p.id}">${d[1]}</td><td id="es_${p.id}">${d[2]}</td></tr>`}).join('')}</table></div></div>
 <div class="card"><h3>Fluxo de caixa projetado (6 meses)</h3><p class="mu" style="margin-top:0">Estes parâmetros são os mesmos de Ajustes.</p><div class="fm"><label>Caixa inicial${ni('m',S.cfg.caixa,"S.cfg.caixa=fi(this,'m');save();fluxoUpd()")}</label><label>Custos fixos mensais${ni('m',S.cfg.fixos,"S.cfg.fixos=fi(this,'m');save();fluxoUpd()")}</label><label>Crescimento mensal das vendas (%)${ni('ps',S.cfg.cresc,"S.cfg.cresc=fi(this,'ps');save();fluxoUpd()")}</label></div><div id="fluxo">${fluxo()}</div></div>`},
ia(){if(!S.prods.length)return emp;
 return`<div class="card"><h3>O que eu deveria fazer para ganhar mais dinheiro?</h3><p class="mu">Análise automática do catálogo por regras. Cada item traz diagnóstico, recomendação e ação.</p>${ins().map(([t,x])=>`<div class="ins ${t}">${x}</div>`).join('')}</div>`},
cfg(){const c=S.cfg,f=(k,l,t)=>`<label>${l}${ni(t,c[k],`S.cfg.${k}=fi(this,'${t}');save()`)}</label>`;
 return`<div class="card"><h3>Operação</h3><div class="fm">${f('fixos','Custos fixos mensais (R$)','m')}<label>Rateio dos custos fixos<select onchange="S.cfg.rateio=this.value;save()"><option value="un" ${c.rateio=='un'?'selected':''}>Por unidade vendida</option><option value="fat" ${c.rateio=='fat'?'selected':''}>Por faturamento</option></select></label>${f('mmin','Margem mínima (%)','p')}${f('malvo','Margem alvo (%)','p')}${f('imp','Imposto padrão (%)','p')}${f('cresc','Crescimento mensal das vendas (%)','ps')}${f('caixa','Caixa inicial (R$)','m')}${f('diasRepor','Alertar reposição abaixo de (dias de estoque)','q')}</div></div>
 <div class="card"><h3>Marketplaces: informe as taxas de cada um</h3><div class="tb"><table><tr><th>Nome</th><th>Comissão %</th><th>Taxa fixa R$</th><th>Pagamento %</th></tr>${Object.entries(S.mps).map(([k,m])=>`<tr><td>${esc(k)}</td>${['com','fixa','pag'].map(x=>`<td>${ni(x=='fixa'?'m':'p',m[x],`S.mps['${k.replace(/'/g,"\\'")}'].${x}=fi(this,'${x=='fixa'?'m':'p'}');save()`)}</td>`).join('')}</tr>`).join('')}</table></div>
 <div class="row"><button onclick="addMp()">Adicionar marketplace</button></div></div>
 <div class="card"><h3>Dados</h3><div class="row"><button onclick="exp()">Exportar JSON</button><button onclick="$('#imp').click()">Importar JSON</button><button onclick="reset()">Apagar todos os dados</button></div><input id="imp" type="file" accept=".json" hidden onchange="imp(this.files[0])"></div>`}
};
function simOut(){const p=cp(),a=calc(p),b=calc(p,{preco:p.preco*(1+SIM.dp/100),custo:p.custo*(1+SIM.dc/100),pub:p.pub*(1+SIM.da/100)}),k=1+SIM.dv/100;
 const rw=(l,x,y,f)=>`<tr><td>${l}</td><td>${f(x)}</td><td>${f(y)}</td></tr>`;
 return`<p>${SIM.dp||SIM.dc||SIM.da?`Com essas mudanças, sua margem vai de <b>${P(a.mg)}</b> para <b class="${b.mg<S.cfg.mmin/100?'neg':'pos'}">${P(b.mg)}</b>.`:'Mova os controles para ver o efeito.'}</p><div class="tb"><table><tr><th></th><th>Hoje</th><th>Cenário</th></tr>
 ${rw('Preço',a.q.preco,b.q.preco,R)}${rw('Custo total por venda',a.tot,b.tot,R)}${rw('Lucro por unidade',a.luc,b.luc,R)}${rw('Margem',a.mg,b.mg,P)}${rw('ROI',a.roi,b.roi,P)}
 <tr><td>Lucro mensal antes dos fixos</td><td>${R(a.cm*p.vendas)}</td><td>${R(b.cm*p.vendas*k)}</td></tr></table></div>`}
function prOut(){const p=cp(),a=calc(p),pr=p.preco*(1-SIM.dd/100),b=calc(p,{preco:pr}),pmin=(a.dir+a.fx)/(1-a.pct-S.cfg.mmin/100),dmax=Math.max(0,1-pmin/p.preco);
 const need=b.cm>0?Math.ceil(a.cm*p.vendas/b.cm):null;
 return`<div class="kpis"><div class="kpi"><span>Preço promocional</span><b>${R(pr)}</b></div><div class="kpi"><span>Margem na promoção</span><b class="${b.mg<S.cfg.mmin/100?'neg':'pos'}">${P(b.mg)}</b></div><div class="kpi"><span>Lucro por unidade</span><b>${R(b.luc)}</b></div><div class="kpi"><span>Vendas para igualar o lucro de hoje</span><b>${need===null?'inviável':need+' un.'}</b></div></div>
 <p>${need===null?'Neste desconto cada venda não cobre os custos variáveis. Não vale a pena.':`Você precisa vender ${(need/p.vendas).toFixed(1).replace('.',',')}x o volume atual (${p.vendas} un.) para ganhar o mesmo que hoje.`} O desconto máximo que mantém sua margem mínima é <b>${P(dmax)}</b>.</p>`}
function ins(){const o=[],L=S.prods.map(p=>calc(p)),rec=L.reduce((a,r)=>a+r.q.preco*r.q.vendas,0),c=S.cfg;
 L.forEach(r=>{const q=r.q,nm='<b>'+esc(q.nome)+'</b>';
  if(r.luc<0)o.push(['bad',`${nm}: você perde ${R(-r.luc)} a cada venda. O preço mínimo para não ter prejuízo é ${R(r.min)}.`]);
  else if(r.mg<c.mmin/100)o.push(['warn',`${nm} está abaixo da margem mínima definida por você (${P(r.mg)} contra ${c.mmin}%). Para chegar a ${c.malvo}%, venda por ${R(r.ideal)} ou pague no máximo ${R(r.cmax)} no produto. Ele representa ${P(rec?q.preco*q.vendas/rec:0)} do seu faturamento.`]);
  if(q.conc>0&&q.conc<q.preco)o.push(['info',`${nm}: o concorrente cobra ${R(q.conc)}. Igualar o preço levaria sua margem de ${P(r.mg)} para ${P(calc(q,{preco:q.conc}).mg)}.`]);
  if(q.conc>q.preco){const np=q.conc;o.push(['info',`${nm}: o concorrente cobra mais (${R(q.conc)}). Você pode subir até ${R(np)} e ir de ${P(r.mg)} a ${P(calc(q,{preco:np}).mg)} de margem.`])}
  const best=Object.keys(S.mps).map(k=>[k,calc(q,{mp:k}).luc]).sort((a,b)=>b[1]-a[1])[0];
  if(best[0]!==q.mp&&best[1]-r.luc>.5)o.push(['info',`${nm}: em ${esc(best[0])} o lucro por unidade seria ${R(best[1])}, contra ${R(r.luc)} em ${esc(q.mp)}.`]);
  const cob=q.vendas?q.estoque/(q.vendas/30):Infinity;
  if(c.diasRepor&&cob<c.diasRepor&&r.mg>=c.malvo/100)o.push(['ok',`${nm} tem boa margem (${P(r.mg)}) e estoque para só ${Math.round(cob)} dias. Vale repor.`]);
 });
 if(!o.length)o.push(['ok','Nenhum alerta: todos os produtos estão acima da margem mínima.']);return o}
function addMp(){const k=prompt('Nome do marketplace:');if(k&&!S.mps[k]){S.mps[k]={com:0,fixa:0,pag:0};save();render()}}
function exp(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({cfg:S.cfg,mps:S.mps,prods:S.prods},null,1)],{type:'application/json'}));a.download='precifica-dados.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
function imp(f){if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.prods)throw 0;S={...d,cur:blank()};save();render();toast('Dados importados')}catch(e){toast('Arquivo inválido')}};r.readAsText(f)}
function reset(){if(confirm('Apagar todos os produtos e ajustes?')){S={cfg:{...CFG_PADRAO},mps:JSON.parse(JSON.stringify(MKT_PADRAO)),prods:demo()};S.cur=blank();save();render()}}
const MAIN=[['cat','Catálogo'],['est','Estoque'],['calc','Calculadora']],TOOLS=[['sim','Simulador'],['mk','Marketplaces'],['pr','Promoções'],['ia','Assistente'],['cfg','Ajustes']];
const nb=([k,l])=>`<button class="${k==tab?'on':''}" onclick="go('${k}')">${l}</button>`;
function go(t){tab=t;render()}
function render(){$('#nav').innerHTML=MAIN.map(nb).join('')+`<div class="tools"><small>Ferramentas</small>${TOOLS.map(nb).join('')}</div>`;$('#app').innerHTML=V[tab]()}
render();
