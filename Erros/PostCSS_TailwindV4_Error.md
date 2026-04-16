# Erro: TailwindCSS e PostCSS Plugin

## Descrição do Erro
Ao rodar `npm run dev`, o Vite acusa erro no `index.css` via PostCSS:
`[postcss] It looks like you're trying to use 'tailwindcss' directly as a PostCSS plugin. The PostCSS plugin has moved to a separate package, so to continue using Tailwind CSS with PostCSS you'll need to install '@tailwindcss/postcss' and update your PostCSS configuration.`

Isso acontece porque as versões recentes do Tailwind (v4) extraíram a integração com o PostCSS para um pacote separado, e o nosso `postcss.config.js` estava apontando para a sintaxe antiga do v3.

## Solução Adotada
Atualizamos o arquivo `postcss.config.js` mudando de `tailwindcss: {}` para `'@tailwindcss/postcss': {}`.
E solicitamos ao usuário que instale a dependência correta no projeto front-end.
