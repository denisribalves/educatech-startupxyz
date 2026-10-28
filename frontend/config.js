// Educatech - configuração PÚBLICA do front-end (publicar ao lado do index.html).
// Tudo aqui vai para o navegador: somente IDs e URLs. Nunca coloque senha, chave de acesso ou client secret.
// Os valores PREENCHER_* são recusados de propósito pelo site (ele lista o que falta); troque os três.
// Região: use a da sua stack (o bucket do front está em us-east-2; confirme no seletor de região do console).
window.EDUCATECH_CONFIG = Object.freeze({
  // Cognito > User pools > seu pool > "User pool ID". Formato: <regiao>_<id>, ex.: us-east-2_AbCdEfGhI
  userPoolId: 'PREENCHER_USER_POOL_ID',
  // Cognito > seu pool > App integration > App clients > "Client ID" (App Client SEM client secret, com USER_PASSWORD_AUTH).
  clientId: 'PREENCHER_CLIENT_ID',
  // API Gateway > sua API > Stages > estágio (ex.: dev) > "Invoke URL", sem barra final.
  // Formato: https://<api-id>.execute-api.<regiao>.amazonaws.com/<stage>
  apiEndpoint: 'PREENCHER_API_ENDPOINT',
  // Nome do ambiente exibido no topo da tela.
  environment: 'dev'
});
