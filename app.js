var SUPA_URL = 'https://gnyrtuhstyailttzinfa.supabase.co';
var SUPA_KEY = 'sb_publishable_ATAy-TCbwOmkEmqqSuyEIA_1_VUhkim';
var SITE_URL = 'https://servis-com.vercel.app/texnika_servis.html';
var ADMIN_PASS = '1234';
var adminOk = false;
var currentDevId = null;
var editDevId = null;
var labelData = null;

// Set today date
document.getElementById('a-date').value = new Date().toISOString().slice(0,10);

// Auto-open from QR
window.addEventListener('load', function(){
  var id = new URLSearchParams(window.location.search).get('id');
  if(id){
    document.getElementById('s-id').value = id;
    showNavDirect('skaaner');
    scanDev();
  }
});

function supaFetch(path, method, body){
  var opts = {
    method: method||'GET',
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': 'Bearer '+SUPA_KEY,
      'Content-Type': 'application/json',
      'Prefer': method==='POST' ? 'return=representation' : (method==='PATCH' ? 'return=minimal' : '')
    }
  };
  if(body) opts.body = JSON.stringify(body);
  return fetch(SUPA_URL+'/rest/v1/'+path, opts).then(function(r){
    if(!r.ok) return r.text().then(function(t){throw new Error(t);});
    var ct = r.headers.get('content-type')||'';
    if(ct.indexOf('json')>=0) return r.json();
    return {};
  });
}

function statusBadge(s){
  var map = {
    'ok':       ['badge-ok',     '✅ Ишлаяпти'],
    'qabul':    ['badge-blue',   '📥 Қабул қилинди'],
    'diag':     ['badge-purple', '🔬 Диагностикада'],
    'ehtiyot':  ['badge-teal',   '🔩 Эҳтиёт қисм кутиляпти'],
    'repair':   ['badge-warn',   '🔧 Таъмирланмоқда'],
    'bad':      ['badge-bad',    '❌ Бузилган'],
    'zavod':    ['badge-orange', '🏭 Заводга қайтарилади'],
    'hisobdan': ['badge-gray',   '🗑️ Ҳисобдан чиқарилади']
  };
  var v = map[s]||['badge-gray', s];
  return '<span class="badge '+v[0]+'">'+v[1]+'</span>';
}

function sourceLabel(t){
  if(t==='baza')  return '🏪 База магазинлардан';
  if(t==='diler') return '🏬 Дистрибьютор дўконлардан';
  if(t==='mijoz') return '👤 Ташқи мижоздан';
  return t||'';
}

function showNav(p, btn){
  document.querySelectorAll('.page').forEach(function(x){x.classList.remove('active');});
  document.querySelectorAll('.nav button').forEach(function(x){x.classList.remove('active');});
  document.getElementById('page-'+p).classList.add('active');
  btn.classList.add('active');
  if(p==='royhati') loadList();
}

function showNavDirect(p){
  document.querySelectorAll('.page').forEach(function(x){x.classList.remove('active');});
  document.querySelectorAll('.nav button').forEach(function(x){x.classList.remove('active');});
  document.getElementById('page-'+p).classList.add('active');
  var idx = {'omborxona':0,'skaaner':1,'royhati':2}[p]||0;
  document.querySelectorAll('.nav button')[idx].classList.add('active');
}

function togglePhone(){
  // nothing needed, phone always visible now
}

function closeModal(id){
  document.getElementById(id).classList.remove('open');
}

// ---- THERMAL LABEL PRINT (58x40mm) ----
function qrSrcFor(id){
  return 'https://api.qrserver.com/v1/create-qr-code/?size=210x210&margin=10&data='
    +encodeURIComponent(SITE_URL+'?id='+encodeURIComponent(id));
}

function escapeHtml(s){
  return String(s==null?'':s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
  });
}

function printLabel(){
  if(!labelData){ alert('Аввал техника қўшинг ёки очинг'); return; }
  var L = labelData;
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>label</title><style>'
    +'@page{size:58mm 40mm;margin:0}'
    +'*{margin:0;padding:0;box-sizing:border-box}'
    +'html,body{width:58mm;height:40mm}'
    +'body{font-family:Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
    +'.label{width:58mm;height:40mm;display:flex;align-items:center;padding:2mm;gap:2mm}'
    +'.qr{width:30mm;height:30mm;flex:0 0 30mm}'
    +'.qr img{width:100%;height:100%;display:block}'
    +'.info{flex:1;min-width:0}'
    +'.info .t{font-size:9pt;font-weight:700;line-height:1.15;margin-bottom:1.2mm;word-break:break-word}'
    +'.info .m{font-size:7pt;margin-bottom:1mm;word-break:break-word}'
    +'.info .id{font-size:9pt;font-weight:700;letter-spacing:.3px}'
    +'.info .c{font-size:6.5pt;color:#333;margin-top:.5mm;word-break:break-word}'
    +'</style></head><body><div class="label">'
    +'<div class="qr"><img src="'+L.qrSrc+'"></div>'
    +'<div class="info">'
    +'<div class="t">'+escapeHtml(L.title)+'</div>'
    +(L.model?'<div class="m">'+escapeHtml(L.model)+'</div>':'')
    +'<div class="id">'+escapeHtml(L.id)+'</div>'
    +(L.code?'<div class="c">'+escapeHtml(L.code)+'</div>':'')
    +'</div></div></body></html>';

  var ifr = document.getElementById('print-frame');
  if(!ifr){
    ifr = document.createElement('iframe');
    ifr.id = 'print-frame';
    ifr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(ifr);
  }
  var doc = ifr.contentWindow.document;
  doc.open(); doc.write(html); doc.close();
  var win = ifr.contentWindow;
  var img = doc.querySelector('img');
  var done = false;
  function go(){ if(done) return; done=true; try{ win.focus(); win.print(); }catch(e){ alert('Принтер хатоси: '+e.message); } }
  if(img && !img.complete){ img.onload=go; img.onerror=go; setTimeout(go, 3000); }
  else { setTimeout(go, 200); }
}

// ---- ADD DEVICE ----
async function genNextId(){
  try{
    var res = await supaFetch('devices?select=id&order=id.desc&limit=1');
    var last = 0;
    if(res && res.length>0){ var n=parseInt(res[0].id,10); if(!isNaN(n)) last=n; }
    return String(last+1).padStart(10,'0');
  }catch(e){ return String(Date.now()).slice(-10); }
}

async function addDevice(){
  var code   = document.getElementById('a-code').value.trim();
  var brand  = document.getElementById('a-brand').value.trim();
  var name   = document.getElementById('a-name').value.trim();
  var model  = document.getElementById('a-model').value.trim();
  var stype  = document.getElementById('a-source-type').value;
  var source = document.getElementById('a-source').value.trim();
  var address= document.getElementById('a-address').value.trim();
  var phone  = document.getElementById('a-phone').value.trim();
  var fault  = document.getElementById('a-fault').value.trim();
  var date   = document.getElementById('a-date').value;
  var price  = document.getElementById('a-price').value;
  var status = document.getElementById('a-status').value;
  var msgEl  = document.getElementById('add-msg');
  msgEl.innerHTML='';

  if(!name||!date){ msgEl.innerHTML='<div class="msg-err">❌ Камида номи ва санани киритинг!</div>'; return; }

  var btn = document.getElementById('add-btn');
  btn.disabled=true; btn.textContent='⏳ Сақланмоқда...';

  try{
    var id = await genNextId();
    var now0=new Date();
    var initLog=[{from:'',to:status,date:now0.toISOString().slice(0,10),time:now0.toTimeString().slice(0,5)}];
    var dev = {id:id,code:code,brand:brand,name:name,model:model,
               source_type:stype,source:source,address:address,phone:phone,
               fault:fault,date:date,price:price,status:status,history:[],status_log:initLog};
    await supaFetch('devices','POST',dev);

    // Generate QR with full URL
    var qrSrc  = qrSrcFor(id);
    document.getElementById('qr-title').textContent  = (brand?brand+' ':'')+name;
    document.getElementById('qr-model').textContent  = model||'';
    document.getElementById('qr-idlbl').textContent  = 'ID: '+id+(code?' | Код: '+code:'');
    document.getElementById('qr-img').src = qrSrc;
    document.getElementById('qr-wrap').style.display='block';
    labelData = {title:(brand?brand+' ':'')+name, model:model||'', id:id, code:code||'', qrSrc:qrSrc};

    ['a-code','a-brand','a-name','a-model','a-source','a-address','a-phone','a-price','a-fault'].forEach(function(i){
      document.getElementById(i).value='';
    });
    document.getElementById('a-source-type').value='';
    document.getElementById('a-status').value='qabul';
    document.getElementById('a-date').value=new Date().toISOString().slice(0,10);

    msgEl.innerHTML='<div class="msg-ok">✅ Қўшилди! ID: <strong>'+id+'</strong></div>';
  }catch(e){
    msgEl.innerHTML='<div class="msg-err">❌ Хатолик: '+e.message+'</div>';
  }
  btn.disabled=false; btn.textContent='+ Қўшиш ва QR ясаш';
}

// ---- SCAN ----
async function scanDev(){
  var id   = document.getElementById('s-id').value.trim();
  var cont = document.getElementById('scan-result');
  if(!id){ alert('ID киritинг'); return; }
  cont.innerHTML='<div class="spinner">⏳ Қидирилмоқда...</div>';
  try{
    var data = await supaFetch('devices?id=eq.'+encodeURIComponent(id)+'&select=*');
    if(!data||data.length===0){
      cont.innerHTML='<div class="card msg-err">❌ Топилмади: '+id+'</div>'; return;
    }
    renderDetail(data[0], cont);
  }catch(e){
    cont.innerHTML='<div class="card msg-err">❌ Хатолик: '+e.message+'</div>';
  }
}

function renderDetail(dev, cont){
  labelData = {title:(dev.brand?dev.brand+' ':'')+dev.name, model:dev.model||'', id:dev.id, code:dev.code||'', qrSrc:qrSrcFor(dev.id)};
  var hist = dev.history||[];
  var histHTML='';
  if(hist.length===0){
    histHTML='<p style="font-size:13px;color:#888">Таъмир тарихи йўқ</p>';
  }else{
    hist.slice().reverse().forEach(function(h){
      histHTML+='<div class="history-item">'
        +'<div style="display:flex;justify-content:space-between;align-items:center">'
        +'<span style="font-size:12px;color:#888">'+h.date+(h.time?' '+h.time:'')+'</span>'
        +statusBadge(h.status)+'</div>'
        +'<p style="font-size:13px;margin-top:5px">'+h.note+'</p>'
        +(h.cost?'<p style="font-size:12px;color:#888;margin-top:3px">Нарх: '+Number(h.cost).toLocaleString()+' сўм</p>':'')
        +'</div>';
    });
  }

  var rows='';
  rows+='<div class="row"><span class="lbl">ID</span><span class="val" style="font-size:12px;color:#888">'+dev.id+'</span></div>';
  if(dev.brand) rows+='<div class="row"><span class="lbl">Бренд</span><span class="val">'+dev.brand+'</span></div>';
  rows+='<div class="row"><span class="lbl">Техника</span><span class="val">'+dev.name+'</span></div>';
  if(dev.model) rows+='<div class="row"><span class="lbl">Модели</span><span class="val">'+dev.model+'</span></div>';
  if(dev.code)  rows+='<div class="row"><span class="lbl">Штрих код</span><span class="val">'+dev.code+'</span></div>';
  if(dev.source_type) rows+='<div class="row"><span class="lbl">Қаердан</span><span class="val">'+sourceLabel(dev.source_type)+'</span></div>';
  if(dev.source) rows+='<div class="row"><span class="lbl">Номи</span><span class="val">'+dev.source+'</span></div>';
  if(dev.address) rows+='<div class="row"><span class="lbl">Манзил</span><span class="val">'+dev.address+'</span></div>';
  if(dev.phone) rows+='<div class="row"><span class="lbl">Телефон</span><span class="val"><a href="tel:'+dev.phone+'" style="color:#178060">'+dev.phone+'</a></span></div>';
  if(dev.fault) rows+='<div class="row" style="flex-direction:column;gap:4px"><span class="lbl">Носозлик</span><span style="font-size:13px">'+dev.fault+'</span></div>';
  rows+='<div class="row"><span class="lbl">Кириш санаси</span><span class="val">'+dev.date+'</span></div>';
  if(dev.price) rows+='<div class="row"><span class="lbl">Нарх</span><span class="val">'+Number(dev.price).toLocaleString()+' сўм</span></div>';
  // Охирги ҳолат ўзгарган сана
  var slog2 = dev.status_log||[];
  var lastStatusDate = '';
  if(slog2.length>0){
    var last2 = slog2[slog2.length-1];
    lastStatusDate = last2.date+' '+last2.time;
  }
  rows+='<div class="row"><span class="lbl">Ҳолат</span><span>'+statusBadge(dev.status)+'</span></div>';
  rows+='<div class="row"><span class="lbl">Ўзгарган сана</span><span class="val" style="color:#888;font-size:13px">'+(lastStatusDate||'—')+'</span></div>';

  // Ҳолат ўзгариш тарихи
  var slog = dev.status_log||[];
  var slogHTML = '';
  if(slog.length>0){
    slog.slice().reverse().forEach(function(s){
      var stMap={'ok':'Ишлаяпти','qabul':'Қабул қилинди','diag':'Диагностикада',
        'ehtiyot':'Эҳтиёт қисм кутиляпти','repair':'Таъмирланмоқда',
        'bad':'Бузилган','zavod':'Заводга қайтарилади','hisobdan':'Ҳисобдан чиқарилади'};
      slogHTML+='<div class="history-item">'
        +'<span style="font-size:12px;color:#888">'+s.date+' '+s.time+'</span>'
        +'<p style="font-size:13px;margin-top:3px">'+statusBadge(s.from)+' → '+statusBadge(s.to)+'</p>'
        +'</div>';
    });
  } else {
    slogHTML='<p style="font-size:13px;color:#888">Ҳолат ўзгаришлари йўқ</p>';
  }

  cont.innerHTML=
    '<div class="card">'+rows+'</div>'
    +'<p class="section-title">Ҳолат ўзгариш тарихи</p>'
    +'<div class="card">'+slogHTML+'</div>'
    +'<p class="section-title">Таъмир тарихи ('+hist.length+' та)</p>'
    +'<div class="card">'+histHTML+'</div>'
    +'<button class="btn btn-primary" onclick="openRepair(\''+dev.id+'\')">+ Таъмир баёни қўшиш</button>'
    +'<button class="btn" style="background:#1a56db;color:#fff;border-color:#1a56db" onclick="printLabel()">🖨️ Этикетка чиқариш (58×40)</button>'
    +'<div style="display:flex;gap:8px;margin-top:8px">'
    +'<button class="btn btn-edit" onclick="openEdit(\''+dev.id+'\')">✏️ Ўзгартириш</button>'
    +'<button class="btn btn-danger" onclick="deleteDev(\''+dev.id+'\')">🗑️ Ўчириш</button>'
    +'</div>';
}

// ---- LIST ----
async function loadList(){
  var cont=document.getElementById('list-cont');
  cont.innerHTML='<div class="spinner">⏳ Юкланмоқда...</div>';
  try{
    var devs=await supaFetch('devices?select=*&order=id.desc');
    if(!devs||devs.length===0){
      cont.innerHTML='<div class="card" style="color:#888;text-align:center">Ҳали техника қўшилмаган</div>'; return;
    }
    cont.innerHTML=devs.map(function(d){
      return '<div class="device-row" onclick="openFromList(\''+d.id+'\')">'+
        '<div style="max-width:68%">'+
        '<p style="font-size:12px;color:#888">'+d.id+(d.brand?' · '+d.brand:'')+'</p>'+
        '<p style="font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+d.name+(d.model?' '+d.model:'')+'</p>'+
        '<p style="font-size:12px;color:#888">'+(d.source||'')+(d.date?' · '+d.date:'')+'</p>'+
        '</div>'+statusBadge(d.status)+'</div>';
    }).join('');
  }catch(e){
    cont.innerHTML='<div class="msg-err">❌ '+e.message+'</div>';
  }
}

function openFromList(id){
  document.getElementById('s-id').value=id;
  showNavDirect('skaaner');
  scanDev();
}

// ---- REPAIR ----
function openRepair(id){
  currentDevId=id;
  document.getElementById('r-note').value='';
  document.getElementById('r-cost').value='';
  document.getElementById('r-status').value='repair';
  document.getElementById('repair-modal').classList.add('open');
}

async function saveRepair(){
  var note=document.getElementById('r-note').value.trim();
  if(!note){alert('Баён ёзинг!');return;}
  var btn=document.querySelector('#repair-modal .btn-primary');
  btn.disabled=true; btn.textContent='⏳...';
  try{
    var data=await supaFetch('devices?id=eq.'+encodeURIComponent(currentDevId)+'&select=*');
    var dev=data[0];
    var hist=dev.history||[];
    var st=document.getElementById('r-status').value;
    var now = new Date();
    var dateStr = now.toISOString().slice(0,10);
    var timeStr = now.toTimeString().slice(0,5);
    hist.push({date:dateStr,time:timeStr,note:note,cost:document.getElementById('r-cost').value,status:st});
    // Ҳолат ўзгарса — status_log га ёзиш
    var patch = {history:hist,status:st};
    if(dev.status !== st){
      var slog = dev.status_log||[];
      slog.push({from:dev.status, to:st, date:dateStr, time:timeStr});
      patch.status_log = slog;
      dev.status_log = slog;
    }
    await supaFetch('devices?id=eq.'+encodeURIComponent(currentDevId),'PATCH',patch);
    dev.history=hist; dev.status=st;
    closeModal('repair-modal');
    renderDetail(dev,document.getElementById('scan-result'));
  }catch(e){alert('❌ '+e.message);}
  btn.disabled=false; btn.textContent='💾 Сақлаш';
}

// ---- EDIT ----
function checkPass(cb){
  if(adminOk){cb();return;}
  var p=prompt('🔐 Админ паролини киритинг:');
  if(p===ADMIN_PASS){adminOk=true;cb();}
  else if(p!==null) alert('❌ Пароль нотўғри!');
}

function openEdit(id){
  checkPass(async function(){
    try{
      var data=await supaFetch('devices?id=eq.'+encodeURIComponent(id)+'&select=*');
      var d=data[0]; editDevId=id;
      document.getElementById('e-code').value   =d.code||'';
      document.getElementById('e-brand').value  =d.brand||'';
      document.getElementById('e-name').value   =d.name||'';
      document.getElementById('e-model').value  =d.model||'';
      document.getElementById('e-source-type').value=d.source_type||'';
      document.getElementById('e-source').value =d.source||'';
      document.getElementById('e-address').value=d.address||'';
      document.getElementById('e-phone').value  =d.phone||'';
      document.getElementById('e-fault').value  =d.fault||'';
      document.getElementById('e-date').value   =d.date||'';
      document.getElementById('e-price').value  =d.price||'';
      document.getElementById('e-status').value =d.status||'qabul';
      document.getElementById('edit-modal').classList.add('open');
    }catch(e){alert('❌ '+e.message);}
  });
}

async function saveEdit(){
  var updated={
    code:        document.getElementById('e-code').value.trim(),
    brand:       document.getElementById('e-brand').value.trim(),
    name:        document.getElementById('e-name').value.trim(),
    model:       document.getElementById('e-model').value.trim(),
    source_type: document.getElementById('e-source-type').value,
    source:      document.getElementById('e-source').value.trim(),
    address:     document.getElementById('e-address').value.trim(),
    phone:       document.getElementById('e-phone').value.trim(),
    fault:       document.getElementById('e-fault').value.trim(),
    date:        document.getElementById('e-date').value,
    price:       document.getElementById('e-price').value,
    status:      document.getElementById('e-status').value
  };
  if(!updated.name||!updated.date){alert('Номи ва санани киритинг!');return;}
  var btn=document.querySelector('#edit-modal .btn-primary');
  btn.disabled=true; btn.textContent='⏳...';
  try{
    // Ҳолат ўзгарса — тарихга ёзиш
    var origData = await supaFetch('devices?id=eq.'+encodeURIComponent(editDevId)+'&select=status,status_log,history');
    var orig = origData[0]||{};
    if(orig.status !== updated.status){
      var now2 = new Date();
      var slog = orig.status_log||[];
      slog.push({from:orig.status, to:updated.status, date:now2.toISOString().slice(0,10), time:now2.toTimeString().slice(0,5)});
      updated.status_log = slog;
    }
    await supaFetch('devices?id=eq.'+encodeURIComponent(editDevId),'PATCH',updated);
    closeModal('edit-modal');
    document.getElementById('s-id').value=editDevId;
    scanDev();
  }catch(e){alert('❌ '+e.message);}
  btn.disabled=false; btn.textContent='💾 Сақлаш';
}

// ---- DELETE ----
function deleteDev(id){
  checkPass(async function(){
    if(!confirm('🗑️ "'+id+'" ни ўчиришни тасдиқлайсизми?')) return;
    try{
      await supaFetch('devices?id=eq.'+encodeURIComponent(id),'DELETE');
      document.getElementById('scan-result').innerHTML='<div class="msg-ok">✅ Ўчирилди!</div>';
    }catch(e){alert('❌ '+e.message);}
  });
}

// ---- EXCEL EXPORT ----
async function exportExcel(){
  var btn = event.target;
  btn.textContent='⏳ Юкланмоқда...'; btn.disabled=true;
  try{
    var devs = await supaFetch('devices?select=*&order=id.asc');
    if(!devs||devs.length===0){alert('Рўйхат бўш!');return;}

    var stMap={
      'ok':'Ишлаяпти','qabul':'Қабул қилинди','diag':'Диагностикада',
      'ehtiyot':'Эҳтиёт қисм кутиляпти','repair':'Таъмирланмоқда',
      'bad':'Бузилган','zavod':'Заводга қайтарилади','hisobdan':'Ҳисобдан чиқарилади'
    };
    var srcMap={'baza':'База магазинлардан','diler':'Дистрибьютор дўконлардан','mijoz':'Ташқи мижоздан'};

    // Load SheetJS
    if(typeof XLSX==='undefined'){
      await new Promise(function(res,rej){
        var s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload=res; s.onerror=rej;
        document.head.appendChild(s);
      });
    }

    var wb = XLSX.utils.book_new();

    // === Sheet 1: Товарлар рўйхати ===
    var h1=['№','ID','Штрих код','Бренд','Техника номи','Модели',
      'Қаердан келган','Магазин/Мижоз номи','Манзил','Телефон',
      'Мижоз носозлиги','Кириш санаси','Нарх (сўм)','Жорий ҳолат','Ҳолат ўзгарган сана',
      'Таъмир сони','Ҳолат ўзгариш сони'];
    var d1=[h1].concat(devs.map(function(d,i){
      return [i+1, d.id||'', d.code||'', d.brand||'', d.name||'', d.model||'',
        srcMap[d.source_type]||'', d.source||'', d.address||'', d.phone||'',
        d.fault||'', d.date||'', d.price?Number(d.price):'',
        stMap[d.status]||d.status||'',
        (function(){ var sl=d.status_log||[]; if(!sl.length) return ''; var l=sl[sl.length-1]; return (l.date||'')+(l.time?' '+l.time:''); })(),
        (d.history||[]).length, (d.status_log||[]).length];
    }));
    var ws1=XLSX.utils.aoa_to_sheet(d1);
    ws1['!cols']=h1.map(function(h,i){return {wch: i===10?30:i===0?5:18};});
    ws1['!autofilter']={ref:'A1:'+XLSX.utils.encode_col(h1.length-1)+'1'};
    ws1['!freeze']={xSplit:0,ySplit:1};
    XLSX.utils.book_append_sheet(wb,ws1,'Товарлар рўйхати');

    // === Sheet 2: Ҳолат тарихи ===
    var h2=['ID','Бренд','Техника номи','Сана','Вақт','Олдинги ҳолат','Янги ҳолат'];
    var d2=[h2];
    devs.forEach(function(d){
      (d.status_log||[]).forEach(function(s){
        d2.push([d.id,d.brand||'',d.name,s.date||'',s.time||'',
          stMap[s.from]||s.from||'', stMap[s.to]||s.to||'']);
      });
    });
    if(d2.length===1) d2.push(['Ҳолат ўзгаришлари ҳали йўқ','','','','','','']);
    var ws2=XLSX.utils.aoa_to_sheet(d2);
    ws2['!cols']=h2.map(function(){return {wch:20};});
    ws2['!autofilter']={ref:'A1:G1'};
    ws2['!freeze']={xSplit:0,ySplit:1};
    XLSX.utils.book_append_sheet(wb,ws2,'Ҳолат тарихи');

    // === Sheet 3: Таъмир тарихи ===
    var h3=['ID','Бренд','Техника номи','Сана','Вақт','Натижа','Баён','Нарх (сўм)'];
    var d3=[h3];
    devs.forEach(function(d){
      (d.history||[]).forEach(function(h){
        d3.push([d.id,d.brand||'',d.name,h.date||'',h.time||'',
          stMap[h.status]||h.status||'', h.note||'', h.cost?Number(h.cost):'']);
      });
    });
    if(d3.length===1) d3.push(['Таъмир тарихи ҳали йўқ','','','','','','','']);
    var ws3=XLSX.utils.aoa_to_sheet(d3);
    ws3['!cols']=h3.map(function(h,i){return {wch:i===6?35:20};});
    ws3['!autofilter']={ref:'A1:H1'};
    ws3['!freeze']={xSplit:0,ySplit:1};
    XLSX.utils.book_append_sheet(wb,ws3,'Таъмир тарихи');

    var today=new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb,'servis_'+today+'.xlsx');

  }catch(e){alert('❌ Хатолик: '+e.message);}
  btn.textContent='📥 Excel'; btn.disabled=false;
}
