# Erro: Rust e Cargo não instalados

## Descrição do Erro
Ao rodar `npm run tauri dev`, o terminal Powershell retorna o erro:
`failed to run 'cargo metadata' command to get workspace directory: ... program not found`

Isso indica que o computador do usuário não possui o ambiente de desenvolvimento da linguagem **Rust** (e o compilador/gerenciador de pacotes `cargo`) instalado. O Tauri exige o Rust nativo instalado nativamente no Windows + as ferramentas de Build do Visual Studio C++ para envelopar a página web no executável `.exe`.

## Solução Adotada
Avisar o usuário que falta esse pré-requisito gigantesco (que pode demorar horas dependendo da internet) e sugerir o contorno: rodar como Aplicação Web localmente (`npm run dev`) primeiro para entregar ou validar a atividade, e caso ele realmente deseje o `.exe`, ele terá de instalar o Rust Toolchain pelo site oficial.
