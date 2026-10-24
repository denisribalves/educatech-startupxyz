# Plano incremental de migração — EducaTech

## Objetivo

Evoluir a infraestrutura para corresponder à nova topologia sem recriar recursos desnecessariamente, perder dados ou quebrar contratos da aplicação.

## Etapa 0 — Pré-requisitos

- [ ] Obter o template CloudFormation atual aprovado.
- [ ] Identificar a branch e o commit da última versão válida.
- [ ] Inventariar recursos e estado de stack por conta e região, em modo somente leitura.
- [ ] Identificar handlers Lambda, artefatos e dependências do frontend.
- [ ] Confirmar se OpenSearch e DynamoDB Streams continuam necessários.
- [ ] Definir RPO/RTO e orçamento máximo para DR.

**Bloqueio:** não gerar uma atualização destrutiva do stack sem conhecer o template de origem e os recursos atuais.

## Etapa 1 — Comparação e validação

- [ ] Comparar logical IDs, parâmetros, condições, outputs e referências.
- [ ] Identificar substituições, remoções e recursos com dados.
- [ ] Validar template com cfn-lint e aws cloudformation validate-template.
- [ ] Executar análise de segurança IaC.
- [ ] Produzir diff e lista de riscos.

## Etapa 2 — Segurança e proteção de dados

- [ ] Avaliar KMS e políticas de chave de menor privilégio.
- [ ] Definir política de ciclo de vida S3, incluindo versões não atuais.
- [ ] Confirmar criptografia, versionamento e bloqueio de acesso público.
- [ ] Confirmar PITR/backup DynamoDB.
- [ ] Definir estratégia de backup e recuperação testável.

## Etapa 3 — Disaster Recovery

- [ ] Confirmar sa-east-1 como região primária pretendida e us-east-1 como secundária.
- [ ] Definir estratégia para S3 (por exemplo, CRR) e configuração de destino.
- [ ] Definir estratégia DynamoDB (PITR, backup/cópia ou alternativa adequada).
- [ ] Planejar recuperação de Cognito, API, Lambda, OpenSearch e configuração da aplicação.
- [ ] Documentar custos e testar recuperação em ambiente controlado.

## Etapa 4 — CI/CD

- [ ] Validar YAML e templates em pull request.
- [ ] Usar GitHub OIDC e role AWS de privilégio mínimo.
- [ ] Gerar changeset para revisão.
- [ ] Exigir aprovação antes de deploy.
- [ ] Bloquear exclusões/substituições críticas sem revisão.

## Etapa 5 — FinOps e observabilidade

- [ ] Definir AWS Budgets e limiares.
- [ ] Confirmar tópico/assinatura SNS e destinatários.
- [ ] Validar CloudWatch, alarmes e retenção de logs.
- [ ] Validar instrumentação X-Ray.
- [ ] Estimar custos regionais, backup, replicação, KMS, OpenSearch e recuperação de arquivos.

## Critérios para autorizar implantação

- Template de origem identificado.
- Diff revisado.
- Nenhuma exclusão ou substituição crítica sem aprovação.
- Parâmetros, conta e região confirmados.
- Artefatos Lambda disponíveis.
- Testes e validações concluídos.
- Plano de rollback e limites documentados.
- Aprovação humana explícita.
