(function(){
'use strict';
const db=window.supabaseClient;
const style=document.createElement('style');
style.textContent=`html:not(.access-approved) body > :not(#access-gate):not(script){visibility:hidden!important}
#access-gate{position:fixed;inset:0;z-index:2147483647;background:#f3f6f8;display:grid;place-items:center;font:16px system-ui,sans-serif;color:#172638;padding:18px;overflow:auto}
html.access-approved #access-gate{display:none}
.access-box{background:white;border:1px solid #dce5ed;border-radius:18px;box-shadow:0 20px 60px #101d2c20;padding:32px;width:min(100%,440px)}
.access-box h1{margin:0 0 8px;font-size:28px}.access-box p{color:#607084;line-height:1.5}
.access-box input{display:block;width:100%;padding:13px;margin:12px 0;border:1px solid #aab8c7;border-radius:8px}
.access-box button{padding:12px 16px;border:0;border-radius:8px;background:#1977e6;color:white;cursor:pointer;margin:5px}
.access-box button.secondary{background:#e8eef5;color:#172638}.access-box button:disabled{opacity:.6}
.access-box .error{color:#b42318}.access-box .success{color:#13733a}
.access-box li{padding:10px 0;border-bottom:1px solid #eee;list-style:none}
`;
document.head.append(style);
const gate=document.createElement('div');gate.id='access-gate';document.body.append(gate);
const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const screen=(html)=>{document.documentElement.classList.remove('access-approved');gate.innerHTML='<div class="access-box">'+html+'</div>';};
const msg=(s,error=false)=>{const e=gate.querySelector('#access-message');if(e){e.textContent=s;e.className=error?'error':'success';}};
function login(mode='login'){
screen('<h1>Base Lotufo</h1><p>'+(mode==='signup'?'Crie sua conta para solicitar acesso.':'Entre para acessar os tutoriais.')+'</p><form id="access-form">'+(mode==='signup'?'<input name="name" placeholder="Nome de usuário" maxlength="80" required>':'')+'<input name="email" type="email" autocomplete="email" placeholder="E-mail" required><input name="password" type="password" minlength="6" autocomplete="'+(mode==='signup'?'new-password':'current-password')+'" placeholder="Senha" required><button type="submit">'+(mode==='signup'?'Solicitar cadastro':'Entrar')+'</button></form><button class="secondary" id="access-toggle">'+(mode==='signup'?'Já tenho conta':'Criar conta')+'</button><p id="access-message" role="status"></p>');
gate.querySelector('#access-toggle').onclick=()=>login(mode==='signup'?'login':'signup');
gate.querySelector('form').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget;const b=form.querySelector('button');b.disabled=true;
try{if(!db)throw Error('Supabase não está configurado.');const email=form.email.value.trim(),password=form.password.value;
const r=mode==='signup'?await db.auth.signUp({email,password,options:{data:{display_name:form.elements.name.value.trim()}}}):await db.auth.signInWithPassword({email,password});
if(r.error)throw r.error;if(mode==='signup'){screen('<h1>Cadastro recebido</h1><p>Verifique seu e-mail, se a confirmação estiver habilitada. Seu acesso depende da aprovação do administrador.</p><button id="back-login">Voltar ao login</button>');gate.querySelector('button').onclick=()=>login();}else await check();}
catch(err){msg(err.message||'Não foi possível autenticar.',true)}finally{b.disabled=false;}};
}
async function check(){
if(!db){screen('<h1>Configuração pendente</h1><p>O Supabase não foi inicializado.</p>');return;}
try{const {data:{user},error}=await db.auth.getUser();if(error||!user){login();return;}
const result=await db.from('access_profiles').select('status,is_admin').eq('user_id',user.id).single();if(result.error)throw result.error;
const profile=result.data;
if(profile.status==='approved'){
document.documentElement.classList.add('access-approved');gate.innerHTML='';
const logout=document.createElement('button');logout.textContent='Sair da conta';logout.type='button';logout.style.cssText='position:fixed;bottom:15px;right:15px;z-index:99999;background:#172638;color:#fff;border:0;border-radius:8px;padding:10px 15px;cursor:pointer';logout.onclick=async()=>{await db.auth.signOut();location.reload()};document.body.append(logout);
if(profile.is_admin)admin();return;}
screen('<h1>'+ (profile.status==='blocked'?'Acesso bloqueado':'Aguardando aprovação')+'</h1><p>'+ (profile.status==='blocked'?'Sua conta está bloqueada.':'Seu cadastro foi recebido. Aguarde o administrador liberar o acesso.')+'</p><button id="access-exit">Sair</button><button id="access-refresh" class="secondary">Verificar novamente</button><p id="access-message"></p>');
gate.querySelector('#access-exit').onclick=async()=>{await db.auth.signOut();login();};gate.querySelector('#access-refresh').onclick=check;
}catch(err){screen('<h1>Não foi possível verificar seu acesso</h1><p class="error">'+escapeHtml(err.message)+'</p><button id="retry">Tentar novamente</button>');gate.querySelector('button').onclick=check;}
}
function admin(){
const btn=document.createElement('button');btn.textContent='Gerenciar usuários';btn.style.cssText='position:fixed;bottom:15px;left:15px;z-index:99999;background:#1977e6;color:white;border:0;border-radius:8px;padding:11px 15px;cursor:pointer';document.body.append(btn);
btn.onclick=async()=>{
const r=await db.from('access_profiles').select('user_id,display_name,status,is_admin,created_at').order('created_at',{ascending:false});
if(r.error){alert('Erro ao carregar usuários: '+r.error.message);return;}
screen('<h1>Gerenciar usuários</h1><p>Cadastros pendentes, aprovados e bloqueados.</p><ul style="padding:0">'+r.data.map(u=>'<li><strong>'+escapeHtml(u.display_name||u.user_id)+'</strong><p>'+escapeHtml(u.status)+'</p>'+(u.is_admin?'Administrador':(['approved','blocked','pending'].map(status=>'<button data-user="'+escapeHtml(u.user_id)+'" data-status="'+status+'">'+({approved:'Aprovar',blocked:'Bloquear',pending:'Pendente'}[status])+'</button>').join(''))+'</li>').join('')+'</ul><button id="admin-close" class="secondary">Fechar</button><p id="access-message"></p>');
gate.querySelector('#admin-close').onclick=()=>{gate.innerHTML='';document.documentElement.classList.add('access-approved')};
gate.querySelectorAll('[data-user]').forEach(button=>button.onclick=async()=>{button.disabled=true;const result=await db.from('access_profiles').update({status:button.dataset.status}).eq('user_id',button.dataset.user);if(result.error){msg(result.error.message,true);button.disabled=false}else btn.click();});
};
}
if(db)db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){document.documentElement.classList.remove('access-approved');login();}});
check();
})();