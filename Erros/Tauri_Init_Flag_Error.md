# Erro: Flag de Init do Tauri Inválida (--dev-path)

## Descrição do Erro
Ao executar a inicialização do Tauri v2 com o comando:
`npx tauri init [...] --dev-path "http://localhost:5173"`
Ocorreu o erro: `error: unexpected argument '--dev-path' found`

Esta flag existia na branch v1 do Tauri, mas na nova versão (v2) que foi instalada, a nomenclatura correta para passar a url do vite é `--dev-url`.

## Solução Adotada
O comando de inicialização fornecido para o usuário rodar no terminal deve utilizar a nomenclatura atualizada (`--dev-url`), ignorando o parâmetro antigo.
A solicitação de comando foi corrigida de imediato na próxima interação.
