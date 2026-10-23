# Revisão de custos — EducaTech

Nenhum valor monetário é estimado nesta versão, pois faltam região/uso confirmado, volume de documentos, requisições, retenção e parâmetros da conta. Preencher com AWS Pricing Calculator e hipóteses documentadas antes de habilitar recursos pagos.

## Componentes a estimar

| Componente | Variáveis de custo |
|---|---|
| API Gateway | Requisições, tipo de API, logs e transferência |
| Lambda | Invocações, duração, arquitetura e memória |
| S3 | Volume, requisições, versões, replicação e recuperação |
| S3 Intelligent-Tiering | Monitoramento e tamanho/quantidade de objetos elegíveis |
| Glacier Deep Archive | Volume, duração mínima, solicitações e restauração |
| DynamoDB | Capacidade sob demanda/provisionada, armazenamento, PITR e backups |
| OpenSearch | Tipo e quantidade de nós, armazenamento, tráfego e ambiente ativo |
| KMS | Chaves, chamadas e uso regional |
| CloudWatch / X-Ray | Ingestão/armazenamento de logs, métricas, traces e alarmes |
| WAF / CloudFront | Regras, requisições, tráfego e transferência |
| DR em us-east-1 | Recursos de standby, replicação, backups e testes de recuperação |
| AWS Budgets / SNS | Orçamentos, notificações e serviços relacionados |

## Recomendações

- Usar parâmetros para ativar recursos opcionais de ambientes de estudo.
- Não manter OpenSearch ou uma cópia completa da aplicação em execução sem justificar o custo.
- Avaliar se DR exige standby ativo, standby mínimo ou recuperação sob demanda.
- Definir alertas de orçamento; não presumir que Budget interrompe recursos automaticamente.
- Incluir custos de recuperação de dados e taxas de transferência entre regiões.
- Registrar limites e premissas junto à estimativa.
