> Registro histórico da rodada individual. Para o estado consolidado dos três jogos e próximos passos, consultar o [índice atual](README.md). As referências ao worktree e ao Git descrevem o momento daquele teste.

# Etapa 12.6.1 — 2D RPG Project: validação de teclado

Data: 24/11/2026. Recomendação: **aprovar a candidata HTML no escopo local testado**, com registro de uma falha transitória de mídia externa na primeira execução integrada. Nenhuma publicação realizada.

## A. Originais e hashes

Diretório somente lido: `C:\Dev\playable\2D-RPG`. O HTML usa `#unity-canvas`, dimensões iniciais 960×600, `createUnityInstance`, caminhos `Build/2D-RPG.*` e `StreamingAssets`. Estrutura responsiva equivalente à do template PortfolioResponsive, com valores concretos de exportação e condicionais opcionais já resolvidas.

SHA-256 dos arquivos originais, conferidos antes e depois:

| Arquivo relativo ao diretório original | SHA-256 |
| --- | --- |
| `index.html` | `fa74a74d4d35582fc56ee9200807f1586578ab4055f6755c7720383d088d823a` |
| `Build/2D-RPG.loader.js` | `a9048c0c16a116dfc764669f81dc707cf6dc0135ab91fb0ae4a9467fe70fd9e3` |
| `Build/2D-RPG.data.br` | `9e666d1fa04d1eee4f1c96809fef38e69465b3984a0252d16688cdd102e6eb60` |
| `Build/2D-RPG.framework.js.br` | `9344e7872b4e0f596fbd4399050416fe015e6a42cba50175fd87d6b3c2375fe6` |
| `Build/2D-RPG.wasm.br` | `525f84bef13a3877adad92ed3a98b3270c50571c7e2e771ce73776287bce6bf3` |
| `TemplateData/webmemd-icon.png` | `c56f5494640cedda273aad38d58e6ab9da625d5b3f4d875c0ff92c6192a569c2` |

A pasta `.wrangler` não foi usada. Nenhum C#, binário, loader ou original foi editado. Um manifesto externo de 33 arquivos também protegeu os arquivos anteriores da POC, o template e sua documentação/testes, os três conjuntos de recursos locais e os dois arquivos do Studio com alterações preexistentes.

## B. Diff funcional

Candidata: [`2d-rpg.html`](2d-rpg.html).

```diff
-  <canvas id="unity-canvas" width=960 height=600 tabindex="-1"
+  <canvas id="unity-canvas" width=960 height=600 tabindex="0" aria-label="2D RPG"
     style="background: #231F20"></canvas>
+  <script>
+    // Let the browser move focus across the iframe boundary.
+    // Capture before Unity handles Tab; keep the native default action intact.
+    window.addEventListener("keydown", function allowNativeTab(event) {
+      if (event.key !== "Tab" || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
+      const active = document.activeElement;
+      const canvas = document.getElementById("unity-canvas");
+      if (active !== canvas && active !== document.body && active !== document.documentElement) return;
+      event.stopImmediatePropagation();
+    }, true);
+  </script>
   <script src="Build/2D-RPG.loader.js"></script>
```

O listener é literalmente igual ao do template padrão, antes do loader. O nome acessível é o Product Name deste export, sem instruções fixas em inglês. Não há postMessage, `preventDefault`, dependências novas ou comportamento específico do RPG. A verificação estática removeu o bloco e reverteu o atributo do canvas em memória: o resultado coincidiu exatamente com o HTML original. CSS, proporção, metadados, inicialização e caminhos relativos permaneceram iguais.

## C. Testes objetivos

Chrome 157.0.8103.79 e Edge 157.0.4341.46, navegadores reais automatizados em modo headless, viewport 1440×1100. HTTP com harness em `127.0.0.1:43210`, jogo em `127.0.0.1:43211`, Next.js em `127.0.0.1:43190`. A tentativa de ler `parent.document` a partir do jogo lançou `SecurityError`, confirmando origens diferentes.

| Execução | Resultado funcional | Rede e console |
| --- | --- | --- |
| Chrome, original no harness | 3 verificações PASS, incluindo retenção esperada de Tab/Shift+Tab | Sem erros |
| Chrome, candidata no harness | 5 PASS | Sem erros |
| Edge, candidata no harness | 5 PASS | Sem erros |
| Chrome, ProjectPlayable PT | 5 PASS | Um HTTP 500 de imagem GIF e console.error correspondente; ver ocorrência abaixo |
| Chrome, ProjectPlayable EN | 5 PASS | Sem erros |
| Edge, ProjectPlayable PT | 5 PASS | Sem erros |
| Edge, ProjectPlayable EN | 5 PASS | Sem erros |
| Repetição Chrome, ProjectPlayable PT | 5 PASS | Sem erros |

São 33 verificações funcionais na matriz inicial e cinco na repetição. Os PASS do original significam que o controle negativo reproduziu o problema esperado, não que sua navegação era correta. O processo da matriz inicial retornou código 1 por causa do erro de imagem, apesar de seus checks funcionais passarem; a repetição retornou código 0. As evidências originais não foram sobrescritas.

Fluxos comprovados:

- Entrada por mouse e por teclado no canvas; Tab sai para o controle seguinte, Shift+Tab retorna ao controle anterior.
- No ProjectPlayable real, Jogar/Play acionado por Enter monta o iframe e foca Fechar jogo/Close game. Tab entra no canvas; Shift+Tab retorna a Fechar. O próximo controle após o iframe é o primeiro card relacionado, Bloomancer, no idioma correspondente. Shift+Tab retorna desse card ao canvas.
- Dez ciclos completos em cada cenário da candidata, sem reinicialização do engine. A mesma instância respondeu aos comandos depois de alternar foco.
- WASD exercitado; clique esquerdo para ataque, Espaço em movimento para dash, teclas 1–5 para slots. Capturas revisadas mostram deslocamento, consumo de stamina/efeito de dash, ataques e mudanças de seleção. O teste não certifica dano, todos os alvos, todos os itens ou slots vazios como armas utilizáveis.
- Também foi exercitada saída com S pressionado, soltura fora do iframe e retorno. Nas capturas observadas, não se identificou deslocamento contínuo indevido após a volta. É uma amostra, não prova de todos os estados de entrada.
- ESC não desmontou o iframe e a saída por Shift+Tab permaneceu funcional. Não foi adicionado tratamento de pausa ou ESC.
- Fechar com Enter remove o iframe e devolve foco a Jogar/Play; reabrir cria outra instância e a navegação funciona novamente.

O QA aguardou dados/WASM e cinco segundos adicionais antes de exercitar o jogo. As capturas mostram a cena ativa; não se usou apenas um listener acionado ou diferenças de hash como prova de gameplay. O teste reutilizado tem um rótulo interno de foco contendo a palavra “Menu”; neste jogo o cenário observado é a cena ativa, não um menu inicial.

**Ocorrência de rede:** a primeira execução Chrome PT registrou timeout no servidor Next ao obter `a5b1d649ce205c01cda242b5910947cbd6803c85-1591x885.gif` da CDN Sanity, com HTTP 500 em `/_next/image?...&w=96&q=75`. É uma requisição de mídia da página, separada dos caminhos Build/ e do HTML do iframe. Os recursos Unity não falharam. A repetição completa desse cenário terminou sem HTTP >=400, pageerror ou console.error. Isso sustenta classificá-la como ocorrência transitória de mídia externa nesta sessão; não demonstra disponibilidade permanente da CDN nem corrige a causa do timeout.

Warnings de precedência de `allow`/`allowfullscreen` e `WebGL: INVALID_ENUM` também aparecem no controle original. O servidor Next registrou avisos de GIFs animados não otimizáveis. Nenhuma correção de mídia, Next.js ou infraestrutura foi tentada.

## D. Compatibilidade com o padrão

O mesmo mecanismo já usado no Bloomancer e Hungry Worm funcionou no RPG sem alterar o template ou introduzir adaptação de runtime. Dimensões iniciais 960×600 foram preservadas. O canvas se adapta normalmente ao contêiner: observado 960×600 no harness e 1198×748 no ProjectPlayable desta sessão. Isso é comportamento do template responsivo existente.

A validação integrada utilizou o ProjectPlayable original e a URL editorial `https://play.bruno-arnaud.com/Games/2DRPGProject/v1/index.html`, redirecionada para a candidata somente no contexto de rede do navegador de QA. Não se alterou o Sanity ou a prop `source` no código. Não há mudança permanente no Next.js.

## E. Conflitos e limites

Nos arquivos `Player Controls.inputactions`, `PlayerController.cs`, `ActiveInventory.cs` e `ActiveWeapon.cs`, os comandos relevantes inspecionados são WASD, mouse esquerdo, Espaço e slots 1–5. Nenhum conflito com Tab foi encontrado nesses comandos ou observado nos testes. Tab passa a pertencer à navegação do navegador; isso não garante acessibilidade completa da interface interna Unity.

Firefox não estava disponível no PATH, nas instalações usuais ou no cache Playwright consultado. Safari, leitores de tela, teclado físico, fullscreen e sessões prolongadas não foram testados. Não houve exportação/recompilação Unity nem QA de produção com a candidata. Next.js foi executado em desenvolvimento com Webpack. Os resultados não certificam todos os menus, interações com NPCs/portas, combate completo, desempenho ou consumo de recursos após coleta de lixo.

## F. Recomendação

**Recomendada aprovação da solução HTML isolada para o 2D RPG Project no escopo testado.** Não foi identificada incompatibilidade que exija mudar o template, o ProjectPlayable ou a arquitetura. Registrar o timeout de mídia como observação separada, sem atribuí-lo ao listener.

## G. Git final e reversão

Branch mantida: `feature/webgl-keyboard-html`, upstream `origin/feature/webgl-keyboard-html`. HEAD permanece `154bd704f8a6b55b1566dedbcfaa76a8126f177d`, sem commits novos e sem divergência do upstream.

Estado anterior preservado: `M docs/webgl/WEBGL-PUBLISHING-STANDARD.md`, `?? poc/`, `?? unity/`. Adicionados nesta rodada somente a candidata e este relatório dentro de `poc/webgl-keyboard-html`. Nenhum arquivo foi staged.

O checkout original continua em production com somente as alterações preexistentes de `studio/package.json` e `studio/package-lock.json`. Os hashes de todos os 33 arquivos do manifesto permaneceram iguais, inclusive HTMLs/recursos dos três jogos e template padrão.

Os contextos Playwright foram fechados, removendo o redirecionamento de teste. A cópia temporária de `.env.local`, o junction de dependências e os arquivos gerados pelo Next foram removidos, e os servidores temporários desta rodada foram encerrados. O servidor anterior da POC Bloomancer não foi alterado. Scripts, logs, hashes e capturas desta rodada permanecem como evidências externas em `C:\Users\Bruno\Documents\ChatGPT\Meu site de potfolio\.work\webgl-keyboard-html\2d-rpg`, com `results/results.json` e `results-retry/results.json` separados.

## H. Pendências antes dos commits e publicação

1. Revisão humana desta candidata e de suas limitações. Não houve commits, push ou PR nesta rodada.
2. Antes de commits, revisar o conjunto de arquivos não rastreados e consolidar a documentação de compatibilidade dos três jogos com os relatórios atuais. Não adicionar indiscriminadamente artefatos locais ou binários.
3. Decidir o QA adicional de navegadores/dispositivos suportados; uma exportação normal futura pelo Editor ainda deverá certificar o template-fonte.
4. Após aprovação separada, preparar cada jogo em novo prefixo versionado, mantendo v1 e os recursos correspondentes. Validar headers e URL candidata antes de qualquer atualização editorial. Nenhuma publicação R2, modificação no Sanity ou deploy foi executado.
