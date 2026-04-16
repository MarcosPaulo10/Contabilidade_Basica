# Erro: Tailwind CSS v4 Sintaxe Obsoleta

## Descrição do Erro
A aplicação web rodou, mas ao entrar na página, apareceu um *overlay* de erro do Vite acusando:
`Cannot apply unknown utility class bg-gray-50. Are you using CSS modules or similar and missing @reference?` 

Este é um erro de incompatibilidade com as diretivas do Tailwind v4. Na versão v3 e anteriores, era usado o padrão `@tailwind base; @tailwind components; @tailwind utilities;`. A versão 4.0 alterou as referências internas para usar importação unificada e também mudou como ele lida com a diretiva `@apply` dentro das camadas (`@layer`) customizadas de base. Quando o parser passa o olho nessas antigas diretivas, ele não encontra o dicionário de classes utilitárias (como `bg-gray-50`).

## Solução Adotada
Atualizamos o arquivo `frontend/src/index.css` para a sintaxe universal contemporânea adotada pelo Tailwind 4: Trocamos as diretivas passadas pelo simples `@import "tailwindcss";` no topo do arquivo.
O próprio Vite com Hot Module Replacement cuida do resto pra atualizar o navegador.
