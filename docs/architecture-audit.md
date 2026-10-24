# Auditoria inicial da arquitetura — Startup XYZ / EducaTech

**Estado: parcial — aguardando o template CloudFormation atual e inventário AWS.**

Em 2026-10-23, o repositório acessível contém um README mínimo. Não foi localizado um template CloudFormation nos caminhos convencionais testados: educatech-main.yaml, template.yaml, template.yml e infrastructure/educatech-main.yaml. Esta auditoria registra a arquitetura de referência e as lacunas conhecidas; não afirma que os recursos estejam implantados.

## Arquitetura de referência a comparar

- Frontend web/mobile.
- Amazon Cognito para autenticação e MFA.
- AWS WAF e Amazon API Gateway.
- AWS Lambda para envio, listagem, consulta e exclusão lógica de documentos.
- Amazon S3 privado para conteúdo documental.
- Amazon DynamoDB para metadados e dados da aplicação.
- Amazon OpenSearch e mecanismo de indexação, se ainda forem requisitos.
- Amazon CloudWatch, AWS X-Ray e Amazon SNS para observabilidade e notificações.
- AWS KMS para criptografia gerenciada pelo cliente, se confirmada.
- AWS Budgets para alertas de custos.
- GitHub Actions + AWS OIDC para CI/CD.
- Estratégia de backup/DR entre sa-east-1 (primária pretendida) e us-east-1 (secundária pretendida).

## Matriz inicial

| Área | Referência | Estado comprovado neste repositório | Próxima ação |
|---|---|---|---|
| CloudFormation principal | Stack da aplicação | Template não localizado nos caminhos testados | Adicionar a versão atual aprovada antes de editar |
| Cognito / API Gateway / WAF | Fluxo de autenticação e API | Não verificado | Inspecionar template e estado AWS autorizado |
| Lambda | Operações documentais | Handlers não verificados | Inventariar código, runtime e artefatos |
| S3 / KMS / ciclo de vida | Documentos criptografados e retenção | Não verificado | Definir classes, prazos, chaves e retenção |
| DynamoDB / PITR | Dados e recuperação | Não verificado | Definir tabelas, backup e estratégia regional |
| OpenSearch | Pesquisa e indexação | Requisito a confirmar | Preservar até decisão explícita |
| CloudWatch / X-Ray / SNS | Observabilidade | Não verificado | Validar logs, métricas, alarmes e tracing |
| GitHub Actions | CI e planejamento de deploy | Workflow adicionado em etapa inicial | Validar em pull request |
| AWS Budgets | Controle de custo | Não verificado | Confirmar limites e destinatários |
| DR multi-região | sa-east-1 → us-east-1 | Não implementado/comprovado neste repositório | Definir RPO/RTO, replicação e runbook |

## Riscos e guardrails

1. Não executar deploy automaticamente.
2. Não excluir stacks, buckets, tabelas ou User Pools.
3. Não trocar logical IDs de recursos existentes sem análise de substituição.
4. Não presumir que PITR substitui replicação entre regiões.
5. Não presumir que mudanças de criptografia recriptografam dados existentes.
6. Não remover OpenSearch/Streams sem confirmar requisitos.
7. Não adicionar segredos, access keys ou credenciais ao Git.
8. Confirmar conta, região, stack e estado antes de preparar changesets.

## Evidências necessárias para concluir a auditoria

- Template CloudFormation mais recente e templates auxiliares.
- Código-fonte e pacotes das funções Lambda.
- Estrutura do frontend e configuração de endpoints.
- Saída de leitura do estado do stack e recursos relevantes, se autorizado.
- Requisitos confirmados de retenção, custo, RPO/RTO e pesquisa.
