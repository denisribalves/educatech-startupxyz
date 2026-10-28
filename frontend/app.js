(() => {
'use strict';
const CFG = window.EDUCATECH_CONFIG || {};
const $ = (selector) => document.querySelector(selector);
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf','image/png','image/jpeg','image/webp','image/tiff']);
const EXT_TYPES = {pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',tif:'image/tiff',tiff:'image/tiff'};
const ERRORS = {
  NotAuthorizedException:'E-mail ou senha incorretos ou código inválido.', UserNotFoundException:'Se os dados corresponderem a uma conta, você receberá as instruções por e-mail.',
  UsernameExistsException:'Este e-mail já possui cadastro.', InvalidPasswordException:'A senha não atende à política de segurança configurada.',
  CodeMismatchException:'Código incorreto. Confira a mensagem recebida.', ExpiredCodeException:'O código expirou. Solicite outro.',
  LimitExceededException:'Muitas tentativas. Aguarde antes de tentar novamente.', TooManyRequestsException:'Muitas tentativas. Aguarde um pouco.',
  UserNotConfirmedException:'Confirme seu e-mail antes de entrar.', InvalidParameterException:'Os dados enviados são inválidos. Confira os campos.',
  PasswordResetRequiredException:'É necessário recuperar sua senha.'
};
let session = null, currentMode = 'login', currentEmail = '', pendingChallenge = null, documents = [], noticeTimer = null;
const authModes = {
 login:{eyebrow:'BEM-VINDO DE VOLTA',title:'Entre na sua conta',subtitle:'Use seu e-mail e senha para continuar.',fields:[['email','E-mail','email','email','email'],['password','Senha','password','current-password','senha']],submit:'Entrar',links:[['Esqueci minha senha','forgot'],['Criar uma conta','signup']]},
 signup:{eyebrow:'COMECE AGORA',title:'Crie sua conta',subtitle:'Use no mínimo 12 caracteres, com maiúscula, minúscula, número e símbolo.',fields:[['email','E-mail','email','email','email'],['password','Senha','password','new-password','senha']],submit:'Criar conta',links:[['Já tenho conta','login']]},
 confirm:{eyebrow:'VERIFIQUE SEU E-MAIL',title:'Confirme seu cadastro',subtitle:'Digite o código enviado para seu e-mail.',fields:[['code','Código de confirmação','text','one-time-code','123456']],submit:'Confirmar e-mail',links:[['Reenviar código','resend'],['Voltar ao login','login']]},
 forgot:{eyebrow:'RECUPERAÇÃO DE CONTA',title:'Recupere sua senha',subtitle:'Enviaremos um código para o e-mail cadastrado.',fields:[['email','E-mail','email','email','email']],submit:'Enviar código',links:[['Voltar ao login','login']]},
 reset:{eyebrow:'NOVA SENHA',title:'Crie uma nova senha',subtitle:'Informe o código recebido e escolha uma nova senha.',fields:[['code','Código recebido','text','one-time-code','123456'],['password','Nova senha','password','new-password','nova senha']],submit:'Redefinir senha',links:[['Voltar ao login','login']]},
 mfa:{eyebrow:'VERIFICAÇÃO DE SEGURANÇA',title:'Confirme sua identidade',subtitle:'Digite o código do aplicativo autenticador.',fields:[['code','Código de autenticação','text','one-time-code','123456']],submit:'Verificar',links:[['Cancelar','login']]},
 newpw:{eyebrow:'SEGURANÇA DA CONTA',title:'Atualize sua senha',subtitle:'Sua conta precisa de uma nova senha para continuar.',fields:[['password','Nova senha','password','new-password','nova senha']],submit:'Salvar nova senha',links:[['Cancelar','login']]}
};
function toast(message, isError=false){const el=$('#notice');el.textContent=message;el.classList.toggle('notice-error', isError);el.hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.hidden=true,5000)}
function log(method,path,result,ms){const el=$('#api-log');if(el.textContent.startsWith('Pronto'))el.textContent='';el.textContent+=`[${new Date().toLocaleTimeString('pt-BR')}] ${method} ${path} → ${result}${ms?` (${ms} ms)`:''}\n`;el.scrollTop=el.scrollHeight}
function formatBytes(bytes){if(bytes<1024)return `${bytes} B`;if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`;return `${(bytes/1024/1024).toFixed(1)} MB`}
function decodeJwt(token){try{return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))}catch{return {}}}
function region(){return String(CFG.userPoolId||'').split('_')[0]}
function apiBase(){return String(CFG.apiEndpoint||'').replace(/\/+$/,'')}
function configurationValid(){return /^\w{2}-[a-z]+-\d_[A-Za-z0-9]+$/.test(CFG.userPoolId||'')&&/^[A-Za-z0-9]+$/.test(CFG.clientId||'')&&/^https:\/\/[\w.-]+\.execute-api\.[\w-]+\.amazonaws\.com\/[\w-]+\/?$/.test(CFG.apiEndpoint||'')}
async function cognito(operation, payload){
 const started=performance.now();let response;
 try{response=await fetch(`https://cognito-idp.${region()}.amazonaws.com/`,{method:'POST',headers:{'Content-Type':'application/x-amz-json-1.1','X-Amz-Target':`AWSCognitoIdentityProviderService.${operation}`},body:JSON.stringify({ClientId:CFG.clientId,...payload})})}
 catch{throw new Error('Não foi possível conectar ao serviço de autenticação. Verifique sua conexão.')}
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const code=String(data.__type||'').split('#').pop();const error=new Error(ERRORS[code]||data.message||'Não foi possível concluir a autenticação.');error.code=code;throw error}
 return data;
}
function saveSession(authResult, refreshToken){session={idToken:authResult.IdToken,accessToken:authResult.AccessToken,refreshToken:authResult.RefreshToken||refreshToken||null,expiresAt:Date.now()+Number(authResult.ExpiresIn||3600)*1000};sessionStorage.setItem('educatech.session',JSON.stringify(session))}
function restoreSession(){try{const s=JSON.parse(sessionStorage.getItem('educatech.session')||'null');if(s&&s.idToken&&s.expiresAt>Date.now()+30000){session=s;return true}}catch{}sessionStorage.removeItem('educatech.session');return false}
async function refreshSession(){if(!session?.refreshToken)return false;try{const result=await cognito('InitiateAuth',{AuthFlow:'REFRESH_TOKEN_AUTH',AuthParameters:{REFRESH_TOKEN:session.refreshToken}});saveSession(result,session.refreshToken);return true}catch{return false}}
async function api(method,path,body,retried=false){
 if(!session)throw new Error('Sua sessão terminou. Entre novamente.');
 if(session.expiresAt<Date.now()+45000&&!await refreshSession()){await signOut(false);throw new Error('Sua sessão expirou. Entre novamente.')}
 const started=performance.now();let response;
 try{response=await fetch(apiBase()+path,{method,headers:{Authorization:session.idToken,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})}
 catch{log(method,path,'FALHA DE REDE');throw new Error('Não foi possível conectar à API. Confira o endpoint e a configuração CORS.')}
 log(method,path,response.status,Math.round(performance.now()-started));
 const data=await response.json().catch(()=>({}));
 if(response.status===401){if(!retried&&await refreshSession())return api(method,path,body,true);await signOut(false);throw new Error('Sessão expirada. Entre novamente.')}
 if(!response.ok)throw new Error(data.message||`A API retornou HTTP ${response.status}.`);
 return data;
}
function showMode(mode){currentMode=mode;const m=authModes[mode]||authModes.login;$('#auth-eyebrow').textContent=m.eyebrow;$('#auth-title').textContent=m.title;$('#auth-subtitle').textContent=m.subtitle;$('#auth-error').hidden=true;$('#auth-error').textContent='';$('#auth-submit').textContent=m.submit;$('#auth-fields').replaceChildren();
 for(const [id,label,type,autocomplete,placeholder] of m.fields){const wrap=document.createElement('div');wrap.className='field';const lab=document.createElement('label');lab.htmlFor=`field-${id}`;lab.textContent=label;const input=document.createElement('input');input.id=`field-${id}`;input.name=id;input.type=type;input.autocomplete=autocomplete;input.required=true;if(id==='email'){input.value=currentEmail;input.placeholder='voce@exemplo.com';input.autocapitalize='none';input.spellcheck=false}else if(id==='code'){input.inputMode='numeric';input.maxLength=8;input.placeholder=placeholder}else if(id==='password'){input.placeholder=mode==='signup'?'Mínimo 12 caracteres':'Digite sua senha';if(mode!=='login')input.minLength=12}wrap.append(lab,input);$('#auth-fields').append(wrap)}
 const links=$('#auth-links');links.replaceChildren();for(const [label,target] of m.links){const b=document.createElement('button');b.type='button';b.className='text-button';b.textContent=label;b.addEventListener('click',()=>handleAuthLink(target));links.append(b)}
 $('#auth-submit').disabled=false;$('#auth-view').hidden=false;$('#dashboard-view').hidden=true;$('#user-email').hidden=true;$('#logout-button').hidden=true;$('#auth-fields').querySelector('input')?.focus();}
async function handleAuthLink(target){if(target==='resend'){try{await cognito('ResendConfirmationCode',{Username:currentEmail});toast('Se o endereço puder receber um código, a mensagem será enviada.')}catch(e){toast(e.message,true)}return}if(target==='forgot')currentEmail=$('#field-email')?.value.trim().toLowerCase()||currentEmail;showMode(target)}
function showAuthError(message){const el=$('#auth-error');el.textContent=message;el.hidden=false}
async function submitAuth(event){event.preventDefault();const button=$('#auth-submit');button.disabled=true;$('#auth-error').hidden=true;const val=id=>$('#field-'+id)?.value.trim()||'';
 try{
  if(currentMode==='signup'){currentEmail=val('email').toLowerCase();const password=$('#field-password').value;await cognito('SignUp',{Username:currentEmail,Password:password,UserAttributes:[{Name:'email',Value:currentEmail}]});showMode('confirm');toast('Cadastro recebido. Confira seu e-mail para confirmar a conta.');return}
  if(currentMode==='confirm'){await cognito('ConfirmSignUp',{Username:currentEmail,ConfirmationCode:val('code')});showMode('login');toast('E-mail confirmado. Agora você pode entrar.');return}
  if(currentMode==='forgot'){currentEmail=val('email').toLowerCase();await cognito('ForgotPassword',{Username:currentEmail});showMode('reset');toast('Se a conta e o e-mail estiverem aptos, enviaremos um código de recuperação.');return}
  if(currentMode==='reset'){await cognito('ConfirmForgotPassword',{Username:currentEmail,ConfirmationCode:val('code'),Password:$('#field-password').value});showMode('login');toast('Senha redefinida. Entre com sua nova senha.');return}
  let result;
  if(currentMode==='login'){currentEmail=val('email').toLowerCase();result=await cognito('InitiateAuth',{AuthFlow:'USER_PASSWORD_AUTH',AuthParameters:{USERNAME:currentEmail,PASSWORD:$('#field-password').value}})}
  else if(currentMode==='mfa')result=await cognito('RespondToAuthChallenge',{ChallengeName:'SOFTWARE_TOKEN_MFA',Session:pendingChallenge.session,ChallengeResponses:{USERNAME:pendingChallenge.username,SOFTWARE_TOKEN_MFA_CODE:val('code')}});
  else if(currentMode==='newpw')result=await cognito('RespondToAuthChallenge',{ChallengeName:'NEW_PASSWORD_REQUIRED',Session:pendingChallenge.session,ChallengeResponses:{USERNAME:pendingChallenge.username,NEW_PASSWORD:$('#field-password').value}});
  if(result.AuthenticationResult){saveSession(result.AuthenticationResult);pendingChallenge=null;showDashboard();return}
  if(result.ChallengeName==='SOFTWARE_TOKEN_MFA'||result.ChallengeName==='NEW_PASSWORD_REQUIRED'){pendingChallenge={session:result.Session,username:result.ChallengeParameters?.USER_ID_FOR_SRP||currentEmail};showMode(result.ChallengeName==='SOFTWARE_TOKEN_MFA'?'mfa':'newpw');return}
  throw new Error('O serviço retornou um desafio de autenticação não suportado: '+(result.ChallengeName||'desconhecido'));
 }catch(error){if(error.code==='UserNotConfirmedException'){showMode('confirm');showAuthError('Confirme seu e-mail para continuar.')}else showAuthError(error.message||'Não foi possível concluir a operação.')}finally{button.disabled=false}}
async function signOut(callRevoke=true){const old=session;session=null;pendingChallenge=null;sessionStorage.removeItem('educatech.session');documents=[];if(callRevoke&&old?.refreshToken)cognito('RevokeToken',{Token:old.refreshToken}).catch(()=>{});showMode('login')}
function showDashboard(){if(!session)return showMode('login');$('#auth-view').hidden=true;$('#dashboard-view').hidden=false;$('#user-email').textContent=decodeJwt(session.idToken).email||currentEmail;$('#user-email').hidden=false;$('#logout-button').hidden=false;$('#environment').textContent=CFG.environment||'AWS';$('#environment').hidden=false;loadDocuments()}
function normalizeType(file){const ext=(file.name.split('.').pop()||'').toLowerCase();return file.type||EXT_TYPES[ext]||''}
function fileLooksAllowed(file){return ALLOWED_TYPES.has(normalizeType(file))}
function base64(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('Não foi possível ler o arquivo.'));reader.readAsDataURL(file)})}
async function uploadFiles(files){for(const file of files){const item=document.createElement('li');item.textContent=`Enviando ${file.name}…`;$ ('#upload-results').prepend(item);try{if(!fileLooksAllowed(file))throw new Error('Formato não permitido. Use PDF, PNG, JPG, WEBP ou TIFF.');if(!file.size)throw new Error('O arquivo está vazio.');if(file.size>MAX_BYTES)throw new Error('O limite do site é 4 MB por arquivo.');item.textContent=`Enviando ${file.name}…`;await api('POST','/upload',{fileName:file.name,contentType:normalizeType(file),contentBase64:await base64(file)});item.className='success';item.textContent=`✓ ${file.name} enviado.`}catch(error){item.className='error';item.textContent=`✕ ${file.name}: ${error.message}`}}await loadDocuments()}
async function loadDocuments(){try{const result=await api('GET','/documents');documents=Array.isArray(result.documents)?result.documents:[];renderDocuments()}catch(error){toast(error.message,true)}}
function renderDocuments(){const query=$('#search-input').value.trim().toLocaleLowerCase('pt-BR'),includeDeleted=$('#include-deleted').checked;const active=documents.filter(d=>d.status!=='DELETED');$('#stat-active').textContent=active.length;$('#stat-deleted').textContent=documents.length-active.length;$('#stat-size').textContent=formatBytes(active.reduce((sum,d)=>sum+Number(d.sizeBytes||0),0));const visible=documents.filter(d=>(includeDeleted||d.status!=='DELETED')&&String(d.fileName||'').toLocaleLowerCase('pt-BR').includes(query)).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));const body=$('#document-rows');body.replaceChildren();for(const doc of visible){const tr=document.createElement('tr');const name=document.createElement('td');name.textContent=doc.fileName||'Documento';const size=document.createElement('td');size.textContent=formatBytes(Number(doc.sizeBytes||0));const date=document.createElement('td');date.textContent=doc.createdAt?new Date(doc.createdAt).toLocaleDateString('pt-BR'):'—';const statusCell=document.createElement('td');const status=document.createElement('span');status.className='status'+(doc.status==='DELETED'?' deleted':'');status.textContent=doc.status==='DELETED'?'Excluído':'Ativo';statusCell.append(status);const actions=document.createElement('td');const wrap=document.createElement('div');wrap.className='row-actions';const download=document.createElement('button');download.className='row-button';download.textContent='Baixar';download.disabled=doc.status==='DELETED';download.addEventListener('click',()=>downloadDocument(doc,download));const remove=document.createElement('button');remove.className='row-button danger';remove.textContent='Excluir';remove.disabled=doc.status==='DELETED';remove.addEventListener('click',()=>deleteDocument(doc));wrap.append(download,remove);actions.append(wrap);tr.append(name,size,date,statusCell,actions);body.append(tr)}$('#empty-state').hidden=visible.length>0}
async function downloadDocument(doc,button){button.disabled=true;try{const result=await api('GET','/documents/'+encodeURIComponent(doc.documentId));if(!result.downloadUrl||!/^https:\/\//.test(result.downloadUrl))throw new Error('A API não retornou um link de download válido.');const a=document.createElement('a');a.href=result.downloadUrl;a.target='_blank';a.rel='noopener noreferrer';a.download=doc.fileName||'';document.body.append(a);a.click();a.remove();toast('Link temporário gerado para o download.')}catch(error){toast(error.message,true)}finally{button.disabled=false}}
async function deleteDocument(doc){if(!window.confirm(`Deseja excluir “${doc.fileName}”?`))return;try{await api('DELETE','/documents/'+encodeURIComponent(doc.documentId));toast('Documento movido para excluídos.');await loadDocuments()}catch(error){toast(error.message,true)}}
function init(){
  // Renderiza a interface mesmo antes da configuração AWS estar presente.
  // A ausência de config nunca deve substituir a página inteira nem gerar uma tela vazia.
  showMode('login');
  if(!configurationValid()){
    $('#auth-submit').disabled=true;
    $('#auth-links').hidden=true;
    showAuthError('A interface Educatech foi carregada, mas ainda não está conectada à AWS. Publique o arquivo config.js com as saídas reais do CloudFormation para habilitar cadastro, login e documentos.');
    return;
  }
  $('#auth-form').addEventListener('submit',submitAuth);
  $('#logout-button').addEventListener('click',()=>signOut());
  $('#refresh-button').addEventListener('click',loadDocuments);
  $('#search-input').addEventListener('input',renderDocuments);
  $('#include-deleted').addEventListener('change',renderDocuments);
  $('#file-input').addEventListener('change',event=>{uploadFiles([...event.target.files]);event.target.value=''});
  const zone=$('#drop-zone');
  zone.addEventListener('dragover',event=>{event.preventDefault();zone.classList.add('drag-over')});
  zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
  zone.addEventListener('drop',event=>{event.preventDefault();zone.classList.remove('drag-over');uploadFiles([...event.dataTransfer.files])});
  if(restoreSession())showDashboard();
}
document.addEventListener('DOMContentLoaded',init);
})();
