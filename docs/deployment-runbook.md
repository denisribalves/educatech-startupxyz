# Runbook de validação e implantação — EducaTech

> Este runbook prepara e valida uma implantação. Não autoriza nem executa mudanças por conta própria.

## 1. Pré-verificações

1. Confirme a branch e o commit revisado.
2. Confirme a conta AWS com aws sts get-caller-identity.
3. Confirme a região pretendida. A topologia indica sa-east-1 como primária e us-east-1 como secundária.
4. Identifique o nome e o estado atual da stack.
5. Confirme que os artefatos Lambda e parâmetros necessários existem.
6. Revise as mudanças em recursos com estado, como S3, DynamoDB e Cognito.

## 2. Validação local

Instale cfn-lint no ambiente de desenvolvimento e execute:

    cfn-lint infrastructure/*.yaml

Valide cada template CloudFormation:

    aws cloudformation validate-template --template-body file://infrastructure/educatech-main.yaml --region sa-east-1

Ajuste os caminhos aos nomes reais dos templates. A validação de template não comprova que o deploy funcionará.

## 3. Planejamento

Depois de revisar o template e os parâmetros:

- Gere um changeset.
- Examine Add, Modify, Remove e substituições.
- Interrompa o processo se houver remoção inesperada de bucket, tabela, User Pool, chave KMS ou outro recurso crítico.
- Não execute o changeset até receber aprovação explícita.

## 4. Pós-implantação autorizada

- Verifique o estado da stack e os eventos.
- Teste login, MFA e autorização por usuário.
- Teste upload, listagem, consulta e exclusão lógica.
- Verifique logs, alarmes e tracing.
- Verifique criptografia e políticas de acesso.
- Teste procedimentos de recuperação em ambiente controlado.

## 5. Rollback e limites

CloudFormation rollback não restaura necessariamente dados apagados, objetos excluídos, mudanças externas ou todos os dados de serviços gerenciados. Para recursos de dados, valide backups e políticas de retenção antes da implantação.

Não use exclusão da stack como estratégia genérica de recuperação.
