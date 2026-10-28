# Frontend

Arquivos da interface web: `index.html`, `app.js`, `styles.css` e `config.js`.

O `config.js` é público e deve conter apenas IDs e URLs não secretos. Antes de publicar, configure os valores reais da stack AWS; não inclua senhas, chaves AWS, tokens ou Cognito App Client Secret.

O `index.html` usa caminhos relativos para os três arquivos auxiliares. Publique o conteúdo desta pasta no diretório raiz do bucket de frontend ou atualize o pipeline de implantação.
