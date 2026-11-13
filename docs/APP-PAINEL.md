# Painel como aplicativo (PWA)

O painel (`painel.html`) pode ser instalado no celular e no computador como um aplicativo: ícone da loja na tela inicial, tela cheia, abre na hora e continua funcionando sem internet (os dados de demonstração ficam no aparelho; com o Supabase, sincronizam quando a internet volta).

## Como instalar
- **Android (Chrome):** abra o painel → botão **Instalar** no aviso do topo (ou ícone de download na barra) → Instalar.
- **iPhone (Safari):** abra o painel no Safari → **Compartilhar** → **Adicionar à Tela de Início** → Adicionar. O próprio painel mostra esse passo a passo.
- **Computador (Chrome/Edge):** ícone de instalar na barra de endereço, ou o botão **Instalar app** no topo do painel.

## Arquivos
- `painel.webmanifest` — nome, cores, ícones e atalhos (Leads, Estoque, Agenda).
- `sw.js` — service worker: guarda o painel para abrir rápido e funcionar offline. Nunca guarda `/api` (assistente de IA).
- `assets/js/app.js` — registro do service worker, botão/aviso de instalação, passo a passo do iPhone e barra de abas no celular.
- `assets/img/app/` — ícones (192, 512, maskable 512 e 180 para iPhone).

## Ao publicar uma versão nova
Suba o `?v=` nos HTML (como sempre) **e** o nome do cache em `sw.js` (`const CACHE = 'painel-...-vN'`). O painel avisa “Tem uma versão nova” e atualiza com um toque.

## Requisito
O app só instala em **https** (Vercel e Netlify já são). Em `localhost` também funciona para testes.

## Uso no celular (v5)
- **Fechar:** toda janela tem o X no topo (abaixo do relógio do iPhone). O botão voltar do Android também fecha a janela, o menu ou a assistente, sem sair do painel.
- **Assistente:** arraste para a direita ou toque no X para fechar. No celular ela não abre sozinha ao entrar no painel.
- **Menu:** arraste para a esquerda, toque fora ou no X. Sair e Configurações ficam acessíveis rolando o menu.
- **Leads:** escolha a etapa nas abas de cima; o botão no cartão passa o lead para a próxima etapa (no celular não dá para arrastar).
- **Teclado:** a barra de abas some enquanto você digita, para não cobrir o campo.
