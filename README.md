# Educatech — Plataforma SaaS

Repositório do projeto TCC Escola da Nuvem (EDN).

## Estrutura do projeto

```text
.
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── config.js
│   └── README.md
├── infrastructure/
│   └── cloudformation/
│       └── educatech.yaml
├── backend/
│   └── lambda/
│       └── README.md
├── docs/
│   └── README.md
├── scripts/
│   └── README.md
├── tests/
│   └── README.md
├── .github/workflows/
├── .gitignore
└── SECURITY.md
```

## Frontend

Os arquivos web ficam em `frontend/`. O `index.html` carrega `styles.css`, `config.js` e `app.js` usando caminhos relativos; publique o conteúdo dessa pasta na raiz do bucket S3 que serve o site, ou ajuste o pipeline de deploy para preservar essa relação.

`config.js` é configuração pública do navegador: use apenas IDs e URLs não secretos. Nunca inclua senhas, chaves AWS, tokens privados ou Cognito App Client Secret. Os valores de exemplo precisam ser substituídos pelos Outputs reais da stack antes da publicação.

## Infraestrutura

O template CloudFormation está em `infrastructure/cloudformation/educatech.yaml`. Revise e valide o template antes de qualquer implantação. Esta reorganização não implanta nem altera recursos na AWS.

## Segurança

Consulte [SECURITY.md](SECURITY.md). Arquivos locais de credenciais, ambientes virtuais e segredos não devem ser versionados. Use credenciais temporárias e OIDC quando possível.
