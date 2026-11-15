(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const money = (value) => value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
  const integer = (value) => value.toLocaleString('pt-BR');
  const escape = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const day = 86400000;
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const dateLabel = (date) => new Date(date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
  const names = ['Aurora Studio', 'Linear Labs', 'Vértice Digital', 'Prisma Creative', 'Orbit Tecnologia', 'Forma Arquitetura', 'Bloom Agency', 'Atlas Ventures', 'Norte Design', 'Oliva Studio', 'Lumina Tech', 'Ponto Digital', 'Cubo Estratégia', 'Marea Co.', 'Estúdio Base', 'Soma Analytics', 'Verde Social', 'Ápice Software', 'Alva Creative', 'Pulso Marketing', 'Órbita Studio', 'Casa Pixel', 'Modo Digital', 'Pilar Tech'];
  const plans = ['Starter', 'Pro', 'Business'];
  const channels = ['Orgânico', 'Indicação', 'Campanhas'];
  const statusLabels = {paid:'Pago', pending:'Pendente', refunded:'Estornado'};
  const base = [];
  for (let age = 179; age >= 0; age--) {
    const count = 2 + (age * 13 % 4);
    for (let index = 0; index < count; index++) {
      const seed = age * 17 + index * 29;
      const plan = plans[seed % 3];
      const price = {Starter:149, Pro:499, Business:1490}[plan];
      base.push({id: `NX-${String(base.length + 1001)}`, customer:names[seed % names.length], plan,
        amount: price * (1 + (seed % 3)), status:seed % 17 === 0 ? 'refunded' : seed % 11 === 0 ? 'pending' : 'paid',
        channel:channels[(seed * 7) % 3], date:new Date(today.getTime() - age * day + index * 3600000).toISOString()});
    }
  }
  const storageKey = 'dutradev-revenue-transactions-v1';
  let additions = [];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('nexo-revenue-transactions-v1') || '[]');
    if (Array.isArray(saved)) additions = saved.filter(item => item && typeof item.id === 'string' && typeof item.customer === 'string' && Number.isFinite(item.amount) && item.amount > 0 && plans.includes(item.plan) && Object.hasOwn(statusLabels, item.status) && channels.includes(item.channel) && Number.isFinite(Date.parse(item.date))).slice(-1000);
  } catch { /* The dashboard still works when browser storage is unavailable. */ }
  let currentPage = 'overview', period = 30, search = '', statusFilter = 'all', page = 1;
  let exportRows = [], exportHeaders = [];
  let toastTimer;
  const all = () => [...base, ...additions].sort((a,b) => new Date(b.date) - new Date(a.date));
  const sum = (rows) => rows.reduce((total, item) => total + item.amount, 0);
  function range(offset = 0) {
    const end = new Date(today); end.setDate(end.getDate() - offset); end.setHours(23,59,59,999);
    const start = new Date(end); start.setDate(start.getDate() - period + 1); start.setHours(0,0,0,0);
    return all().filter(item => new Date(item.date) >= start && new Date(item.date) <= end);
  }
  function stats(rows) {
    const paid = rows.filter(item => item.status === 'paid');
    return {revenue:sum(paid), orders:paid.length, customers:new Set(paid.map(item => item.customer)).size,
      ticket:paid.length ? sum(paid) / paid.length : 0, approval:rows.length ? paid.length / rows.length * 100 : 0};
  }
  function trend(now, previous) {
    const delta = previous ? (now - previous) / previous * 100 : 0;
    return `<span class="metric-tag ${delta >= 0 ? 'positive' : 'negative'}">${delta >= 0 ? '↗' : '↘'} ${Math.abs(delta).toFixed(1).replace('.',',')}%</span>`;
  }
  function metrics(rows) {
    const now = stats(rows), previous = stats(range(period));
    const entries = [['Receita recebida', money(now.revenue), now.revenue, previous.revenue, '↗'], ['Vendas aprovadas', integer(now.orders), now.orders, previous.orders, '▣'], ['Clientes ativos', integer(now.customers), now.customers, previous.customers, '♧'], ['Ticket médio', money(now.ticket), now.ticket, previous.ticket, '◈']];
    return `<section class="metrics" aria-label="Indicadores do período">${entries.map(([label, value, a, b, icon]) => `<article class="metric"><div class="metric-title">${label}<span>${icon}</span></div><div class="metric-value">${value}</div><div class="metric-footer">${trend(a,b)} <span>vs. ${period} dias anteriores</span></div></article>`).join('')}</section>`;
  }
  function transactionTable(rows) {
    return `<div class="table-scroll" tabindex="0" role="region" aria-label="Tabela de transações"><table><thead><tr><th>CLIENTE / TRANSAÇÃO</th><th>STATUS</th><th>VALOR</th><th>PLANO</th><th>DATA</th></tr></thead><tbody>${rows.length ? rows.map(item => `<tr><td><div class="product-cell"><span class="customer-avatar">${escape(item.customer.slice(0,2).toUpperCase())}</span><div><strong>${escape(item.customer)}</strong><small>${escape(item.id)}</small></div></div></td><td><span class="status ${item.status}">${statusLabels[item.status]}</span></td><td class="money-cell">${money(item.amount)}</td><td><span class="plan-chip">${item.plan}</span></td><td>${dateLabel(item.date)}</td></tr>`).join('') : '<tr><td colspan="5"><div class="empty-state"><span>⌕</span><strong>Nenhum resultado encontrado</strong><p>Experimente outro nome, status ou período.</p></div></td></tr>'}</tbody></table></div>`;
  }
  function configureTransactionExport(rows) {
    exportHeaders = ['ID','Cliente','Valor (R$)','Plano','Status','Canal','Data'];
    exportRows = rows.map(item => [item.id, item.customer, item.amount.toFixed(2).replace('.',','), item.plan, statusLabels[item.status], item.channel, new Date(item.date).toLocaleDateString('pt-BR')]);
  }
  function channelPanel(rows) {
    const paid = rows.filter(item => item.status === 'paid');
    const total = sum(paid);
    return `<section class="panel"><div class="panel-heading"><div><h2>De onde vêm os resultados</h2><p>Receita recebida por canal de aquisição</p></div><span>↗</span></div><div class="channel-bars">${channels.map(channel => {
      const value = sum(paid.filter(item => item.channel === channel)), percent = total ? value/total*100 : 0;
      return `<div class="channel-item"><div class="channel-label"><span>${channel}</span><strong class="channel-value">${percent.toFixed(1).replace('.',',')}%</strong></div><div class="channel-track"><span style="width:${percent}%"></span></div></div>`;
    }).join('')}</div><div class="alert-footer">Base: vendas aprovadas <span>${integer(paid.length)}</span></div></section>`;
  }
  function overview(rows) {
    const now = stats(rows), previous = stats(range(period));
    const pending = rows.filter(item => item.status === 'pending');
    const best = plans.map(plan => ({plan, value:sum(rows.filter(item => item.plan === plan && item.status === 'paid'))})).sort((a,b)=>b.value-a.value)[0];
    const delta = previous.revenue ? (now.revenue - previous.revenue) / previous.revenue * 100 : 0;
    $('#content').innerHTML = metrics(rows) + `<div class="analytics-grid"><section class="panel flow-panel"><div class="panel-heading"><div><h2>Receita ao longo do tempo <span class="info" title="Apenas transações pagas; comparação entre períodos de igual duração">i</span></h2><p>Acompanhe o ritmo dos seus resultados</p></div><span class="panel-kicker">BRL · RECEBIDO</span></div><div class="chart-legend"><span><i class="legend-dot incoming"></i> Período atual <strong>${money(now.revenue)}</strong></span><span><i class="legend-dot outgoing"></i> Anterior</span></div><div class="flow-chart" id="revenue-chart" role="img" aria-label="Receita diária: ${money(now.revenue)} no período atual e ${money(previous.revenue)} no anterior."></div><div class="chart-caption"><span class="live-dot"></span> ${period} dias de performance <span>Passe sobre os pontos para detalhes</span></div></section><section class="panel health-panel"><div class="panel-heading"><div><h2>Saúde das vendas</h2><p>Taxa de aprovação no período</p></div><span>↗</span></div><div class="health-summary"><div class="health-gauge" style="--health:${now.approval}"><div><span class="tiny-label">VENDAS APROVADAS</span><strong>${now.approval.toFixed(1).replace('.',',')}<small>%</small></strong><span class="health-description">do total de transações</span></div></div><div class="health-legend">${Object.entries(statusLabels).map(([key,label])=>`<div><span><i class="legend-dot ${key==='paid'?'incoming':key==='pending'?'amber':'red'}"></i>${label}</span><strong>${rows.filter(item=>item.status===key).length}</strong></div>`).join('')}</div></div></section></div><div class="bottom-grid"><section class="panel activity-panel"><div class="panel-heading"><div><h2>Últimas transações</h2><p>Os movimentos mais recentes do negócio</p></div><a class="text-link" href="#transactions">Ver todas ↗</a></div>${transactionTable(rows.slice(0,5))}</section><section class="panel"><div class="panel-heading"><div><h2>Seu radar de oportunidades</h2><p>Os dados contam uma história</p></div><span class="amber-text">✧</span></div><div class="insight-card"><div class="insight-item"><span class="insight-icon">↗</span><div><strong>Receita ${delta>=0?'em expansão':'em atenção'}</strong><p>Variação de ${Math.abs(delta).toFixed(1).replace('.',',')}% ${delta>=0?'acima':'abaixo'} do período anterior.</p></div></div><div class="insight-item"><span class="insight-icon">◈</span><div><strong>${best.plan} lidera a receita</strong><p>${money(best.value)} recebidos neste plano.</p></div></div><div class="insight-item"><span class="insight-icon">◷</span><div><strong>${pending.length} pagamentos pendentes</strong><p>${money(sum(pending))} aguardando confirmação.</p></div></div></div><div class="insight-bottom">Cada indicador é calculado a partir das transações desta demonstração.</div></section></div>`;
    configureTransactionExport(rows);
    drawChart(rows, range(period));
  }
  function drawChart(rows, previous) {
    const target = $('#revenue-chart'); if (!target) return;
    const width = Math.max(280, target.clientWidth - 32), height = 240, left = 44, right = width - 12, top = 15, bottom = 195;
    const start = new Date(today); start.setDate(start.getDate() - period + 1); start.setHours(0,0,0,0);
    function values(source, offset) {
      return Array.from({length:period}, (_,i) => {
        const date = new Date(start); date.setDate(date.getDate()+i-offset);
        return sum(source.filter(item=>item.status==='paid' && new Date(item.date).toDateString()===date.toDateString()));
      });
    }
    const current = values(rows,0), prior = values(previous,period);
    const maximum = Math.max(100, ...current, ...prior);
    const scale = Math.ceil(maximum/4/100)*400;
    const coords = values => values.map((value,i)=>[left+i/(period-1)*(right-left),bottom-value/scale*(bottom-top)]);
    const points = coords(current), oldPoints = coords(prior);
    const path = positions=>positions.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    const grid = Array.from({length:5},(_,i)=>{const y=bottom-(bottom-top)*i/4; const value=scale*i/4;return `<line x1="${left}" x2="${right}" y1="${y}" y2="${y}" stroke="#eaf0ed" stroke-dasharray="3 4"/><text x="${left-9}" y="${y+3}" fill="#9aaa9f" font-size="12" text-anchor="end">${value>=1000?(value/1000).toFixed(1).replace('.',',')+'k':value}</text>`;}).join('');
    const labels = [0,Math.round((period-1)/4),Math.round((period-1)/2),Math.round((period-1)*.75),period-1].map(i=>{const date=new Date(start);date.setDate(date.getDate()+i);return `<text x="${points[i][0]}" y="226" class="chart-date" text-anchor="middle">${dateLabel(date)}</text>`;}).join('');
    target.innerHTML=`<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#469b72" stop-opacity=".20"/><stop offset="100%" stop-color="#469b72" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${path(points)} L${right},${bottom} L${left},${bottom} Z" fill="url(#revenue-fill)"/><path class="chart-line" d="${path(oldPoints)}" fill="none" stroke="#c1cfe0" stroke-width="1.5" stroke-dasharray="4 5"/><path class="chart-line" d="${path(points)}" fill="none" stroke="#428b65" stroke-width="2" stroke-linejoin="round"/>${points.map(([x,y],i)=>{const date=new Date(start);date.setDate(date.getDate()+i);return `<circle class="chart-hover-point" cx="${x}" cy="${y}" r="4" fill="transparent"><title>${dateLabel(date)}: ${money(current[i])}</title></circle>`;}).join('')}${labels}</svg>`;
  }
  function transactionPage(rows) {
    $('#content').innerHTML=`<section class="panel full-panel"><div class="panel-heading"><div><h2>Explorar transações</h2><p>Busque, filtre e acompanhe cada movimento.</p></div><span class="panel-kicker">${rows.length} NO PERÍODO</span></div><div class="table-tools"><label class="sr-only" for="search">Buscar cliente ou transação</label><input id="search" class="search-input" type="search" placeholder="⌕ Buscar cliente ou ID…" value="${escape(search)}"><label class="sr-only" for="status-filter">Status da transação</label><select id="status-filter"><option value="all">Todos os status</option>${Object.entries(statusLabels).map(([key,label])=>`<option value="${key}" ${key===statusFilter?'selected':''}>${label}</option>`).join('')}</select></div><div id="table-results"></div></section>`;
    const refresh = () => {
      const query=search.toLocaleLowerCase('pt-BR');
      const filtered=rows.filter(item=>(statusFilter==='all'||item.status===statusFilter)&&`${item.customer} ${item.id}`.toLocaleLowerCase('pt-BR').includes(query));
      const pages=Math.max(1,Math.ceil(filtered.length/10));page=Math.min(page,pages);
      $('#table-results').innerHTML=transactionTable(filtered.slice((page-1)*10,page*10))+`<div class="table-summary"><span>${filtered.length} resultados · Página ${page} de ${pages}</span><div class="pagination-buttons"><button id="previous-page" aria-label="Página anterior" ${page===1?'disabled':''}>←</button><button id="next-page" aria-label="Próxima página" ${page===pages?'disabled':''}>→</button></div></div>`;
      $('#previous-page').onclick=()=>{page--;refresh();};$('#next-page').onclick=()=>{page++;refresh();};configureTransactionExport(filtered);
    };
    $('#search').oninput=event=>{search=event.target.value;page=1;refresh();};
    $('#status-filter').onchange=event=>{statusFilter=event.target.value;page=1;refresh();};refresh();
  }
  function customersPage(rows) {
    const groups=new Map();
    rows.filter(item=>item.status==='paid').forEach(item=>{
      const customer=groups.get(item.customer)||{name:item.customer,amount:0,orders:0,plan:item.plan,date:item.date};
      customer.amount+=item.amount;customer.orders++;groups.set(item.customer,customer);
    });
    const customers=[...groups.values()].sort((a,b)=>b.amount-a.amount);
    $('#content').innerHTML=`<section class="panel full-panel"><div class="panel-heading"><div><h2>Relacionamentos que geram valor</h2><p>Clientes com vendas pagas no período · Ordenados por receita</p></div><span class="panel-kicker">${customers.length} CLIENTES</span></div><div class="table-tools"><label class="sr-only" for="customer-search">Buscar cliente</label><input id="customer-search" type="search" class="search-input" placeholder="⌕ Buscar cliente…"></div><div id="customer-results"></div></section>`;
    const refresh=query=>{
      const filtered=customers.filter(item=>item.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
      $('#customer-results').innerHTML=`<div class="table-scroll" tabindex="0" role="region" aria-label="Clientes"><table><thead><tr><th>CLIENTE</th><th>ÚLTIMO PLANO</th><th>VENDAS PAGAS</th><th>RECEITA NO PERÍODO</th><th>ÚLTIMA COMPRA</th></tr></thead><tbody>${filtered.map(item=>`<tr><td><div class="product-cell"><span class="customer-avatar">${escape(item.name.slice(0,2).toUpperCase())}</span><strong>${escape(item.name)}</strong></div></td><td><span class="plan-chip">${item.plan}</span></td><td>${item.orders}</td><td class="money-cell">${money(item.amount)}</td><td>${dateLabel(item.date)}</td></tr>`).join('')||'<tr><td colspan="5"><div class="empty-state">Nenhum cliente encontrado.</div></td></tr>'}</tbody></table></div><div class="table-summary">${filtered.length} clientes neste resultado</div>`;
      exportHeaders=['Cliente','Último plano','Vendas pagas','Receita (R$)','Última compra'];exportRows=filtered.map(item=>[item.name,item.plan,item.orders,item.amount.toFixed(2).replace('.',','),dateLabel(item.date)]);
    };
    $('#customer-search').oninput=event=>refresh(event.target.value);refresh('');
  }
  function insightsPage(rows) {
    const paid=rows.filter(item=>item.status==='paid'), total=sum(paid);
    $('#content').innerHTML=`<div class="insights-intro"><div><div class="eyebrow">DO NÚMERO À DECISÃO</div><h2 style="margin-top:10px">Entenda o que impulsiona sua receita.</h2><p>Compare a participação dos planos e a origem das suas vendas. Todos os números abaixo respeitam o período selecionado e consideram apenas pagamentos aprovados.</p></div><span class="insight-big-icon">✧</span></div><section class="plan-grid" aria-label="Desempenho por plano">${plans.map((plan,index)=>{const selected=paid.filter(item=>item.plan===plan),value=sum(selected),share=total?value/total*100:0;return `<article class="plan-card"><div class="eyebrow">0${index+1} / ${plan.toUpperCase()}</div><h3>${money(value)}</h3><p>${selected.length} vendas aprovadas</p><div class="channel-track"><span style="width:${share}%"></span></div><div class="channel-label"><span>Participação na receita</span><strong>${share.toFixed(1).replace('.',',')}%</strong></div></article>`;}).join('')}</section><div style="margin-top:20px">${channelPanel(rows)}</div>`;
    exportHeaders=['Plano','Vendas aprovadas','Receita (R$)','Participação (%)'];exportRows=plans.map(plan=>{const selected=paid.filter(item=>item.plan===plan),value=sum(selected);return [plan,selected.length,value.toFixed(2).replace('.',','),(total?value/total*100:0).toFixed(2).replace('.',',')];});
  }
  const titles={overview:['Seu negócio, em foco','Uma visão conectada de tudo que move seus resultados.','Visão geral','Performance do negócio'],transactions:['Cada movimento conta','Acompanhe o caminho de cada venda, do início ao resultado.','Transações','Central de transações'],customers:['Boas conexões, bons negócios','Conheça quem está do outro lado dos seus resultados.','Clientes','Sua base de clientes'],insights:['Os dados têm algo a dizer','Encontre os sinais que merecem sua próxima decisão.','Insights','Inteligência do negócio']};
  function render() {
    const key=location.hash.slice(1);currentPage=Object.hasOwn(titles,key)?key:'overview';
    const [title,description,label,section]=titles[currentPage];
    $('#page-title').textContent=title;const dot=document.createElement('span');dot.textContent='.';$('#page-title').append(dot);
    $('#page-description').textContent=description;$('#breadcrumb-current').textContent=label;$('#section-label').textContent=section;
    document.title=`DutraDEV · ${label} — Wendel Dutra`;
    document.querySelectorAll('[data-page]').forEach(link=>{const active=link.dataset.page===currentPage;link.classList.toggle('selected',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    const rows=range();$('#nav-count').textContent=rows.length;
    ({overview,transactions:transactionPage,customers:customersPage,insights:insightsPage})[currentPage](rows);
  }
  function toast(message) {clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4000);}
  $('#period').onchange=event=>{period=Number(event.target.value);page=1;render();};
  window.addEventListener('hashchange',()=>{page=1;search='';statusFilter='all';render();closeMenu();});
  const dialog=$('#transaction-dialog');
  $('#new-transaction').onclick=()=>{$('#form-error').textContent='';dialog.showModal();};
  document.querySelectorAll('.close-dialog').forEach(button=>button.onclick=()=>dialog.close());
  $('#transaction-form').onsubmit=event=>{
    event.preventDefault();const data=new FormData(event.target);const amount=Number(data.get('amount')),customer=data.get('customer').trim();
    if(!customer||customer.length>70||!Number.isFinite(amount)||amount<=0||amount>1000000){$('#form-error').textContent='Informe um cliente e um valor entre R$ 0,01 e R$ 1.000.000,00.';return;}
    const transaction={id:`NX-D${Date.now().toString(36).toUpperCase()}`,customer,amount,plan:data.get('plan'),status:data.get('status'),channel:'Orgânico',date:new Date().toISOString()};
    additions.push(transaction);let saved=true;
    try{localStorage.setItem(storageKey,JSON.stringify(additions));}catch{saved=false;}
    dialog.close();event.target.reset();render();toast(saved?'Transação salva. Indicadores atualizados.':'Transação adicionada nesta sessão. Armazenamento local indisponível.');
  };
  $('#export').onclick=()=>{
    function csv(value){const text=String(value);return '"'+(/^[=+\-@\t\r]/.test(text)?"'":'')+text.replace(/"/g,'""')+'"';}
    const content=[exportHeaders,...exportRows].map(row=>row.map(csv).join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8;'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download=`dutradev-${currentPage}-${period}dias.csv`;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`${exportRows.length} registros exportados.`);
  };
  const menu=$('#menu-toggle'),sidebar=$('#sidebar');
  function closeMenu(){sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false');}
  menu.onclick=()=>{const open=sidebar.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));};
  document.addEventListener('click',event=>{if(!sidebar.contains(event.target)&&!menu.contains(event.target))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&sidebar.classList.contains('open')){closeMenu();menu.focus();}});
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (currentPage === 'overview') drawChart(range(), range(period)); }, 120);
  });
  render();
})();
