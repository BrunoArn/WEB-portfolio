> Registro histórico da rodada individual. Para o estado consolidado dos três jogos e próximos passos, consultar o [índice atual](README.md). As referências ao worktree e ao Git descrevem o momento daquele teste.

# Etapa 12.6.1 — Hungry Worm: validação local de teclado

Data: 24/11/2026. Resultado: **PASS no escopo local testado; recomendada aprovação da mesma solução HTML para Hungry Worm. Publicação não executada.**

## A. Arquivos utilizados e diferenças

Worktree: `C:\Dev\WEB-portfolio-webgl-keyboard`. Branch `feature/webgl-keyboard-html`, upstream `origin/feature/webgl-keyboard-html`, sem commits novos ou divergência do upstream.

Original somente lido: `C:\Dev\playable\Hungry-Worm\index.html`. SHA-256: `7db9efff22b44f71533d98ff66f948a0756a39dc1717dcb496f072495c0579d2`.

Candidata: [`hungry-worm.html`](hungry-worm.html), nesta pasta. Usa os recursos originais `Build/Hungry-Worm.loader.js`, `Hungry-Worm.data.br`, `Hungry-Worm.framework.js.br`, `Hungry-Worm.wasm.br`, e a configuração `StreamingAssets`. Nenhum recurso compilado foi copiado ao Git ou modificado.

O HTML original tem o mesmo canvas `#unity-canvas`, CSS responsivo e `createUnityInstance` da família PortfolioResponsive. Diferenças relevantes em relação ao Bloomancer: resolução inicial 960×640, nomes `Hungry-Worm.*`, companyName e productName próprios, menu inicial e gameplay com mudança de direção por Espaço ou mouse esquerdo. A inspeção dos scripts locais identificou esses dois controles; não substitui um inventário completo de todos os menus do build.

O template padrão, todos os arquivos anteriores da POC, a documentação preexistente e o 2D RPG permaneceram inalterados. Manifesto de 21 arquivos confirmou hashes preservados, incluindo HTML e recursos locais do Hungry Worm e as alterações do Studio. O checkout original continua em production com somente as duas alterações preexistentes em `studio/package.json` e `studio/package-lock.json`.

## B. Diff da candidata

```diff
-  <canvas id="unity-canvas" width=960 height=640 tabindex="-1"
+  <canvas id="unity-canvas" width=960 height=640 tabindex="0" aria-label="Hungry Worm"
```

Antes do loader, foi inserido o listener inline **literalmente idêntico** ao do [template padrão](../../unity/WebGLTemplates/PortfolioResponsive/index.html). Em captura, ele impede que a Unity receba Tab/Shift+Tab no canvas/body/raiz, preservando a ação padrão do navegador. Não há `preventDefault`, postMessage, novas bibliotecas ou adaptações específicas de gameplay.

Uma verificação independente removeu esse bloco e reverteu o atributo do canvas em memória: o resultado correspondeu exatamente ao HTML original. Portanto CSS, dimensões iniciais 960×640, metadados e caminhos relativos não receberam mudanças adicionais.

## C. Testes executados

Navegadores reais automatizados em modo headless: Chrome 157.0.8103.79 e Edge 157.0.4341.46, viewport 1440×1100.

| Cenário | Resultado |
| --- | --- |
| Chrome, original no harness | 3 verificações PASS, incluindo reprodução esperada da retenção de foco |
| Chrome, candidata no harness | 5 verificações PASS |
| Edge, candidata no harness | 5 verificações PASS |
| Chrome, ProjectPlayable real PT e EN | 5 verificações PASS por idioma |
| Edge, ProjectPlayable real PT e EN | 5 verificações PASS por idioma |

Total: 33 verificações automatizadas, sem falhas. Os PASS do original são controles negativos: não significam navegação correta no original.

Foi usado HTTP em origens diferentes: harness em `127.0.0.1:43200`, jogo em `127.0.0.1:43201`, Next.js em `127.0.0.1:43190`. A leitura de `parent.document` no iframe lançou `SecurityError`, confirmando isolamento cross-origin. O QA aguardou os downloads de dados/WASM e cinco segundos adicionais; as capturas mostram o menu e a partida, não apenas o splash.

No harness: controle anterior → Tab → canvas → Tab → controle posterior; Shift+Tab realiza a sequência inversa. O original foi executado em Chrome e reteve Tab e Shift+Tab dentro do iframe.

No componente real: Jogar/Play acionado por Enter monta o iframe e foca Fechar jogo/Close game. Tab entra no canvas; Shift+Tab retorna ao botão Fechar. Tab para frente alcança o primeiro card relacionado (`/pt/projects/2d-rpg-project` ou `/en/projects/2d-rpg-project`), e Shift+Tab retorna ao canvas. Foram executados dez ciclos completos em cada um dos seis cenários da candidata, sem nova inicialização da Unity.

Gameplay: Start Game foi clicado dentro do canvas, seguido da contagem de entrada. Espaço e clique esquerdo foram exercitados. As capturas revisadas mostram o personagem mudando de direção e respondendo novamente a Espaço após sair para o controle externo e retornar ao canvas. Houve continuidade da instância, sem reiniciar o jogo. O teste é uma amostra curta da partida, não uma campanha ou teste completo de colisões/pontuação.

ESC não desmontou o iframe e a saída posterior por Shift+Tab continuou funcionando. Fechar por teclado removeu o iframe, devolveu o foco a Jogar/Play, e a recriação inicializou uma nova instância com navegação funcional. Nenhum pageerror, console.error ou HTTP >=400 foi registrado nas sete execuções finais. Warnings de permissões do iframe e WebGL também apareceram no original; o servidor Next emitiu avisos de GIFs animados não otimizáveis, sem impedir os testes.

As evidências e scripts de QA estão fora do repositório em `C:\Users\Bruno\Documents\ChatGPT\Meu site de potfolio\.work\webgl-keyboard-html\hungry-worm`, incluindo `results/results.json`, capturas, manifesto de hashes e verificação do diff. As capturas, e não apenas diferenças de hash, foram utilizadas para avaliar os comandos do jogo.

## D. Compatibilidade e comparação com Bloomancer

O mesmo listener produziu a mesma saída nativa real do iframe, retorno à instância existente e fechamento/recriação no harness e no ProjectPlayable PT/EN. Nenhuma incompatibilidade exigiu mudança no template ou implementação alternativa.

O nome acessível é a materialização de PRODUCT_NAME para este export: `Hungry Worm`. A resolução inicial 960×640 permanece no HTML. A Unity continua adaptando o canvas ao viewport: no harness foi observado 960×640; no componente real, 1198×798, conforme o contêiner disponível. Essa adaptação já pertence ao template responsivo e não foi alterada pela candidata.

## E. Limitações e reversão do ambiente

Não foram testados Firefox/Safari, leitores de tela, teclado físico, fullscreen, todos os menus ou partidas prolongadas. Não se afirma acessibilidade completa dos controles internos Unity. Tab permanece reservado à navegação externa; os comandos inspecionados de Hungry Worm não exigiram tratamento específico. ESC apenas foi observado; nenhum contrato novo de pausa ou saída foi criado.

A validação integrada usou o ProjectPlayable original, via Next.js de desenvolvimento com Webpack. Somente o navegador de QA redirecionou a navegação publicada `https://play.bruno-arnaud.com/Games/HungryWorm/v1/index.html` para a candidata HTTP local; o CMS e o código Next.js não foram editados. Os contextos de navegador foram fechados, eliminando esse redirecionamento.

Para rodar o checkout isolado, foram usados temporariamente uma cópia de `.env.local` e um junction para as dependências já instaladas no checkout original. Esses dois itens, o cache e os tipos gerados pelo Next foram removidos ao encerrar a validação. Os servidores temporários desta rodada foram encerrados. Os scripts e logs de QA foram preservados como evidência externa. O servidor anterior da POC Bloomancer não foi alterado.

## F. Recomendação

**Recomendada aprovação da solução HTML isolada para Hungry Worm no escopo testado.** Não houve necessidade de alterar o template, Next.js, C# ou recursos compilados. O 2D RPG permanece aguardando missão própria.

Após revisão humana, o próximo passo poderá ser preparar uma versão candidata em novo prefixo, com HTML e recursos consistentes, validar seus headers e execução antes de qualquer troca de referência. Não sobrescrever v1. Nenhum upload, alteração no Sanity, deploy, commit, push ou PR foi realizado nesta rodada.
