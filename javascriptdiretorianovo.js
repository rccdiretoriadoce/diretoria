/* ============================================================================
   PATCH — [DIR] Central de Mensagens Privadas
   Substitua no arquivo original apenas os blocos marcados abaixo.
   ============================================================================
   [1] novas constantes de envio        -> COLAR logo abaixo do const CFG
   [2] sanitizeNick                     -> SUBSTITUIR a linha existente
   [3] nAddBulk / nkey / nai            -> SUBSTITUIR as 3 funções
   [4] renderPills                      -> SUBSTITUIR
   [5] addLog / updLog                  -> SUBSTITUIR as 2 funções
   [6] sendMP / sendMPGroup             -> SUBSTITUIR o bloco "SISTEMA DE ENVIO"
   [7] send / sendG                     -> SUBSTITUIR as 2 funções
   [8] última linha do arquivo          -> SUBSTITUIR "popSel();bootstrap();"
   ============================================================================ */


/* ─── [1] COLAR logo abaixo da constante CFG ─────────────────────────────── */

const DELAY_IND  = 1200;          // ms entre cada MP individual
const DELAY_GRP  = 5000;          // ms entre cada grupo (antiflood do Forumeiros)
const TENTATIVAS = 3;             // retentativas quando o fórum recusa por flood
const CAMPO_GRUPO = 'usergroup';  // nome do campo do formulário de MP em grupo
let TOK = {};                     // campos ocultos do formulário (tid, lt, etc.)


/* ─── [2] SUBSTITUIR a linha do sanitizeNick ─────────────────────────────
   Antiga: const sanitizeNick=s=>s.replace(/[^\w\-\.]/g,'').trim();
   Ela apagava . : @ , ! acentos e espaços. Agora só remove caracteres de
   controle e normaliza espaços, então qualquer nickname do fórum passa.     */

const sanitizeNick = s => String(s)
  .replace(/[\u0000-\u001F\u007F]/g, '')
  .replace(/\s+/g, ' ')
  .trim();


/* ─── [3] SUBSTITUIR nAddBulk, nkey e nai (e acrescentar flushNick/wire) ──
   Único separador continua sendo "/". A diferença é que o que ficou escrito
   no campo agora é capturado sozinho ao sair do campo e ao clicar em enviar. */

function nAddBulk(form, raw){
  if(!NS[form]) NS[form] = [];
  String(raw).split('/').map(sanitizeNick).filter(Boolean).forEach(n => {
    if(!NS[form].some(x => norm(x) === norm(n))) NS[form].push(n);
  });
  renderPills(form);
}

function nkey(e, form){
  if(e.key !== 'Enter') return;
  e.preventDefault();
  flushNick(form);
}

function nai(e, form){
  const v = e.target.value;
  if(v.indexOf('/') === -1) return;
  const partes = v.split('/');
  const resto  = partes.pop();
  nAddBulk(form, partes.join('/'));
  e.target.value = resto.replace(/^\s+/, '');
}

function flushNick(form){
  const inp = $(`#n-${form}`);
  if(!inp) return;
  if(inp.value.trim()){ nAddBulk(form, inp.value); inp.value = ''; }
}

function wireNickInputs(){
  document.querySelectorAll('.pill-wrap input.ni[id^="n-"]').forEach(inp => {
    inp.addEventListener('blur', () => flushNick(inp.id.slice(2)));
  });
}


/* ─── [4] SUBSTITUIR renderPills ─────────────────────────────────────────
   O onclick antigo era montado dentro de uma string, então nickname com
   aspas, dois-pontos ou barra invertida quebrava o botão de remover.       */

function renderPills(form){
  const c = $(`#p-${form}`);
  if(!c) return;
  c.innerHTML = '';
  (NS[form] || []).forEach(nick => {
    const pill = document.createElement('div'); pill.className = 'pill';

    const box = document.createElement('div'); box.className = 'pav';
    const img = document.createElement('img'); img.loading = 'lazy';
    img.src = `${AV}?img_format=png&user=${encodeURIComponent(nick)}&direction=2&head_direction=2&size=m&headonly=1`;
    box.appendChild(img);

    const nome = document.createElement('span'); nome.className = 'pnm';
    nome.textContent = nick;

    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'prm';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    btn.addEventListener('click', () => remPill(form, nick));

    pill.append(box, nome, btn);
    c.appendChild(pill);
  });
}


/* ─── [5] SUBSTITUIR addLog e updLog ─────────────────────────────────────
   Passa a identificar a linha por data-k em vez de comparar texto, então
   funciona com qualquer caractere no nickname.                             */

function addLog(f, nick, st, msg){
  const log = $(`#lg-${f}`);
  const grupo = /^Grupo\s/.test(nick);

  const d = document.createElement('div');
  d.className = 'li';
  d.dataset.k = nick;

  const av = document.createElement('div'); av.className = 'lav';
  if(grupo){
    av.style.cssText = 'display:flex;align-items:center;justify-content:center;color:#85E300;font-weight:800;font-size:11px';
    av.textContent = '#';
  }else{
    const img = document.createElement('img'); img.loading = 'lazy';
    img.src = `${AV}?img_format=png&user=${encodeURIComponent(nick)}&direction=2&head_direction=2&size=m&headonly=1`;
    av.appendChild(img);
  }

  const n = document.createElement('span'); n.className = 'lnk'; n.textContent = nick;
  const s = document.createElement('span'); s.className = 'lst ' + st; s.textContent = msg;

  d.append(av, n, s);
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}

function updLog(f, nick, st, msg){
  const item = document.querySelector(`#lg-${f} .li[data-k="${CSS.escape(nick)}"]`);
  if(!item) return;
  const s = item.querySelector('.lst');
  s.className = 'lst ' + st;
  s.textContent = msg;
}


/* ─── [6] SUBSTITUIR todo o bloco "SISTEMA DE ENVIO" ─────────────────────
   O código antigo só olhava r.ok. O Forumeiros devolve 200 mesmo quando
   recusa (antiflood, falta de permissão, sessão expirada), então o painel
   marcava "enviado" sem ter enviado nada. Agora a resposta é lida de fato,
   os campos ocultos do formulário (tid/lt) vão junto e há retentativa.      */

async function carregarTokens(){
  try{
    const r = await fetch('/privmsg?mode=post&folder=inbox', { credentials:'include', cache:'no-store' });
    if(!r.ok) return;
    const doc  = new DOMParser().parseFromString(await r.text(), 'text/html');
    const form = doc.querySelector('form[action*="privmsg"]') || doc.forms[0];
    const t = {};
    if(form) form.querySelectorAll('input[type="hidden"]').forEach(i => {
      if(i.name && !/^(message|subject|username|usergroup|post|mode|folder)$/i.test(i.name)) t[i.name] = i.value;
    });
    TOK = t;
  }catch{}
}

function lerResposta(html){
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const txt = ((doc.body && doc.body.textContent) || '').replace(/\s+/g, ' ').trim();

  if(/(mensagem.{0,30}foi enviada|enviada com sucesso|message has been sent)/i.test(txt)) return { ok:true };
  if(/(muito rapidamente|aguarde|flood|espere.{0,12}segundos)/i.test(txt))                return { ok:false, retry:true, msg:'Antiflood' };
  if(/(n[ãa]o (tem|possui).{0,15}permiss[ãa]o|n[ãa]o est[áa] autorizado|not authoris?zed)/i.test(txt)) return { ok:false, msg:'Sem permissão' };
  if(/(sess[ãa]o.{0,20}expir|fa[çc]a login|entre novamente)/i.test(txt))                  return { ok:false, msg:'Sessão expirada' };
  if(doc.querySelector('textarea[name="message"]'))                                       return { ok:false, msg:'Recusado pelo fórum' };
  return { ok:true };
}

async function postMP(extra){
  const body = new URLSearchParams(Object.assign({ folder:'inbox', mode:'post', post:'1' }, TOK, extra));
  const r = await fetch('/privmsg', {
    method:'POST',
    headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
    credentials:'include',
    body
  });
  if(!r.ok) return { ok:false, retry:true, msg:'HTTP ' + r.status };
  return lerResposta(await r.text());
}

async function comRetentativa(fn){
  let res = { ok:false, msg:'Erro' };
  for(let i = 0; i < TENTATIVAS; i++){
    try{ res = await fn(); }catch{ res = { ok:false, retry:true, msg:'Falha de rede' }; }
    if(res.ok || !res.retry) return res;
    await sleep(6000 * (i + 1));
  }
  return res;
}

const sendMP = (username, subject, message) =>
  comRetentativa(() => postMP({ username, subject, message }));

const sendMPGroup = (groupId, subject, message) =>
  comRetentativa(() => postMP({ [CAMPO_GRUPO]: String(groupId), subject, message }));


/* ─── [7] SUBSTITUIR send e sendG ────────────────────────────────────────
   flushNick antes de validar resolve o "só envia se apertar Enter".
   O log passa a mostrar o motivo real de cada falha.                       */

async function send(f){
  if(lock){ toast('Aguarde o envio atual.', 'e'); return; }
  flushNick(f);
  if(!validate(f)) return;
  lock = true;

  await carregarTokens();
  const nks = (NS[f] || []).map(sanitizeNick).filter(Boolean);
  initP(f, nks.length);

  let ok = 0, er = 0;
  for(let i = 0; i < nks.length; i++){
    const n = nks[i];
    addLog(f, n, 'sd', 'Enviando…');
    const res = await sendMP(n, SB[f], buildBB(f, n));
    if(res.ok){ updLog(f, n, 'ok', '✓ Enviado'); ok++; }
    else      { updLog(f, n, 'er', '✗ ' + (res.msg || 'Erro')); er++; }
    updBar(f, i + 1, nks.length);
    if(i < nks.length - 1) await sleep(DELAY_IND);
  }

  showSum(f, ok, er);
  lock = false;
  toast(er === 0 ? `✓ ${ok} MP(s) enviada(s)!` : `${ok} ok · ${er} erro(s)`, er === 0 ? 's' : 'e');
}

async function sendG(f){
  if(lock){ toast('Aguarde o envio atual.', 'e'); return; }
  flushNick(f);
  if(!validate(f)) return;
  lock = true;

  await carregarTokens();
  const grupos = [...new Set(getGrupos(f))];
  initP(f, grupos.length);
  const msg = buildBBG(f);

  let ok = 0, er = 0;
  for(let i = 0; i < grupos.length; i++){
    const gid = grupos[i], label = 'Grupo ' + gid;
    addLog(f, label, 'sd', 'Enviando…');
    const res = await sendMPGroup(gid, SB[f], msg);
    if(res.ok){ updLog(f, label, 'ok', '✓ Enviado'); ok++; }
    else      { updLog(f, label, 'er', '✗ ' + (res.msg || 'Erro')); er++; }
    updBar(f, i + 1, grupos.length);
    if(i < grupos.length - 1) await sleep(DELAY_GRP);
  }

  showSum(f, ok, er);
  lock = false;
  toast(er === 0 ? `✓ Enviado para ${ok} grupo(s)!` : `${ok} ok · ${er} erro(s)`, er === 0 ? 's' : 'e');
}


/* ─── [8] SUBSTITUIR a última linha do arquivo ───────────────────────────
   Antiga: popSel();bootstrap();                                            */

popSel(); wireNickInputs(); bootstrap();