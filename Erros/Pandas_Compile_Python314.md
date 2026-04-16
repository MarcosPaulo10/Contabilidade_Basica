# Erro: Falha na Instalação do Pandas

## Descrição do Erro
Ao tentar rodar `pip install -r requirements.txt`, o pip tenta compilar a roda (wheel) do pacote `pandas` (versão 2.2.2) do zero porque não encontra binários pré-compilados para a versão do interpretador (Python 3.14). A compilação falha indicando `Python dependency not found` pelo sistema Meson.

## Solução Adotada
Como as rotas de exportação para CSV e XLSX ainda não estão prioritárias e o foco do teste agora é o fluxo local de CRUD e listagem do Balanço, a solução imediata foi remover as dependências `pandas` e `openpyxl` do `requirements.txt`.

Futuramente, para a exportação de CSV, utilizaremos a biblioteca padrão embutida no python (`csv`), evitando dependências pesadas de compilação.
