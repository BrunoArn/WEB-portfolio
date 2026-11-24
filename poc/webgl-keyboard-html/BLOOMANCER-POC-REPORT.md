> Registro histórico da rodada de 23/11/2026. O estado atual e a validação integrada posterior estão no [índice consolidado](README.md). As referências a Git, diretórios e ausência de commits descrevem aquela rodada.

# Etapa 12.6.1 — POC HTML de teclado do Bloomancer

Data: 2026-11-23. Resultado: **PASS no harness local; integração e publicação não aprovadas nem executadas.**

## A. Git inicial e final

O checkout `C:\Dev\WEB-portfolio` permaneceu em `production`, no commit `154bd704f8a6b55b1566dedbcfaa76a8126f177d`. O fetch de `origin/production` confirmou essa mesma base. Foram preservadas as alterações preexistentes em `studio/package.json` e `studio/package-lock.json`, com hashes iguais antes e depois:

- package.json: `7c38f8aedbbce75d112e0489fe64da6e28cf7fe25c3870399c1d9708ce585009`.
- package-lock.json: `79d637031a98db5b53c72ce6bcfce5cf27f26b3abb0ce18516308d9461372d8b`.

Não houve stash, reset, limpeza, commit de implementação ou PR. O novo worktree contém somente os arquivos novos desta pasta, ainda não rastreados. O HEAD continua igual à base.

## B. Branch e upstream

Worktree: `C:\Dev\WEB-portfolio-webgl-keyboard`.

Branch: `feature/webgl-keyboard-html`, com upstream `origin/feature/webgl-keyboard-html`, confirmado por `git branch -vv` e `git status -sb`. Executado somente o push inicial da branch, sem os arquivos da implementação. O checkout original continua em production.

## C. Original e captura de teclado

Original: `C:\Dev\playable\8-bitty\index.html`. SHA-256 original e final: `d1bebd41889fa5e1b5cbb96cb8b63f884a4018834d26f22111560117b20d1f1e`.

O canvas original tem `tabindex="-1"`; a inicialização usa `createUnityInstance` e caminhos relativos `Build/8-bitty.*`. O HTML não contém mecanismo de saída por teclado. O framework compilado registra callbacks de teclado e pode cancelar a ação padrão quando seu callback informa consumo do evento. Na execução original, Tab e Shift+Tab deixam o foco retido no iframe. A POC intercepta apenas o keydown de Tab na fase de captura, antes do tratamento observado da Unity.

O HTML original e todos os recursos Unity foram apenas lidos. Não foram copiados binários para o Git nem alterados outros jogos.

## D. Arquivos da POC

- `bloomancer.html`: cópia do original com as únicas mudanças funcionais do jogo.
- `harness.html`: página de QA com controle antes e depois do iframe e abertura/fechamento.
- `server.mjs`: dois servidores HTTP loopback, com origens distintas; lê os recursos originais e serve Brotli com headers apropriados.
- `qa.mjs`: automação de navegador e coleta de evidências, sem adicionar dependências ao projeto.
- `README.md`: este relatório e instruções.

Nenhum componente Next.js, C#, schema, conteúdo ou configuração de infraestrutura foi alterado. Os arquivos de suporte são exclusivos do QA.

## E. Diff funcional completo

```diff
-  <canvas id="unity-canvas" width=960 height=600 tabindex="-1"
+  <canvas id="unity-canvas" width=960 height=600 tabindex="0" aria-label="Bloomancer game. Tab and Shift+Tab return to the surrounding page."
     style="background: #231F20"></canvas>
+  <script>
+    // POC only: let the browser move focus across the iframe boundary.
+    // Capture before Unity handles Tab; keep the native default action intact.
+    window.addEventListener("keydown", function allowNativeTab(event) {
+      if (event.key !== "Tab" || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
+      const active = document.activeElement;
+      const canvas = document.getElementById("unity-canvas");
+      if (active !== canvas && active !== document.body && active !== document.documentElement) return;
+      event.stopImmediatePropagation();
+    }, true);
+  </script>
   <script src="Build/8-bitty.loader.js"></script>
```

Não há `preventDefault`, foco programático no pai ou postMessage no jogo. A ação nativa do navegador permanece livre. Shift+Tab usa o mesmo tratamento. Outras teclas, combinações com Ctrl/Alt/Meta, composição e controles HTML com foco próprio não são interceptados por esse listener. Não foi necessário mudar `WebGLInput.captureAllKeyboardInput` nem recompilar a Unity.

## F. Testes executados e reprodução

Executar no worktree:

```powershell
node poc/webgl-keyboard-html/server.mjs
```

O servidor usa `C:\Dev\playable\8-bitty` por padrão. Pode ser configurado por `POC_UNITY_ROOT`. `POC_PARENT_PORT` define a porta do harness; a origem do jogo usa a próxima porta.

- POC: `http://127.0.0.1:43180/?variant=poc`.
- Controle original: `http://127.0.0.1:43180/?variant=original`.
- Jogo: origem `http://127.0.0.1:43181`.

Os testes confirmaram `SecurityError` ao tentar ler `parent.document` a partir do iframe: as origens eram efetivamente diferentes. O sucesso não depende de acesso direto ao DOM externo.

Automação por Playwright em Chrome **157.0.8103.79** e Edge **157.0.4341.46**, ambos headless, viewport 1280×1000, usando os builds reais locais. O QA aguardou o download dos recursos e mais cinco segundos; as capturas finais mostram a cena de tutorial, não apenas o splash.

| Verificação | Resultado nos dois navegadores |
| --- | --- |
| Carregamento HTTP e cena Unity | PASS |
| Original: Tab/Shift+Tab retidos | Reproduzido como controle negativo |
| Entrada por teclado na POC | PASS: botão Close → Tab → canvas |
| Saída real por Tab | PASS: canvas → controle posterior ao iframe |
| Saída real por Shift+Tab | PASS: canvas → botão Close anterior |
| Entrada com mouse e saída em ambos os sentidos | PASS |
| Dez ciclos completos de foco por navegador | PASS; mesma instância, sem reinicialização |
| Continuidade após alternar foco | PASS no tutorial; personagem responde a W/A/S/D |
| Setas | ArrowRight enviado; indicador do tutorial responde; não comprova todo o sistema de combate |
| ESC | Iframe permanece montado; nenhum novo tratamento de ESC foi adicionado |
| Fechar/recriar | Iframe anterior removido e nova instância inicializada; foco funciona novamente |
| Console e rede | Sem pageerror, console.error ou HTTP >=400 nas execuções finais |

Existem warnings compartilhados pelo original e pela POC: precedência de `allow` sobre `allowfullscreen` no harness e `WebGL: INVALID_ENUM` no ambiente de teste. Não são novos erros da modificação.

Também foi testada saída com W pressionado e soltura fora do iframe. Nas capturas após o retorno, o personagem permaneceu parado entre duas observações separadas por 500 ms, no original e na POC. Não foi confirmada regressão de tecla presa nesse caso. Isso não prova todos os estados de entrada, menus ou plataformas.

Execução repetível:

```powershell
$env:POC_QA_OUTPUT = "$env:TEMP\webgl-keyboard-html-qa"
node poc/webgl-keyboard-html/qa.mjs
# Para Edge, antes de executar novamente:
$env:POC_BROWSER = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node poc/webgl-keyboard-html/qa.mjs
```

O script utiliza o Playwright já disponível no runtime do Codex. Em outro ambiente, definir `POC_PLAYWRIGHT_PATH` para uma instalação existente. `POC_HARNESS_ORIGIN` permite outra porta. Não instalar ou alterar dependências do portfólio para esta POC.

Evidências finais fora do repositório: `C:\Users\Bruno\Documents\ChatGPT\Meu site de potfolio\.work\webgl-keyboard-html\qa-chrome-scene` e `qa-edge-scene`, contendo `results.json` e capturas. Cada execução final encerrou com código 0: seis verificações do controle original e sete da POC. Os PASS do controle original incluem a reprodução esperada da retenção; não significam que sua navegação está correta. Capturas de movimento e retorno foram inspecionadas visualmente; diferenças de hash isoladas não foram usadas como prova de gameplay.

## G. Limitações e riscos

- Resultados obtidos somente no harness local cross-origin. Não foi testado o portfólio Next.js integrado ou o domínio público com este HTML.
- Chrome e Edge compartilham Chromium; Firefox, Safari, leitores de tela e dispositivos físicos não foram testados.
- Somente Bloomancer; os outros dois jogos e seus frameworks não foram alterados nem validados.
- Tab e Shift+Tab passam a pertencer à navegação. Um jogo que use essas teclas para menus/gameplay exige avaliação própria.
- O listener depende de executar antes dos handlers relevantes do engine. Atualizações de template/Unity precisam repetir o controle negativo e a matriz de foco.
- Não foi testado fullscreen, campanha completa, todos os menus, desempenho comparativo ou liberação imediata de memória/GPU após desmontagem. Remoção do iframe foi confirmada, não um benchmark de coleta de recursos.
- O aria-label está em inglês nesta POC; localização da instrução deve ser decidida antes de publicação. O teste não comprova acessibilidade completa do jogo.
- Perder foco não pausa automaticamente o jogo. Nenhum contrato de pausa foi criado.

## H. Conclusão

**HTML isolado foi suficiente no cenário testado.** Houve saída real do foco em ambos os sentidos, entre origens distintas, com repetição e retorno à mesma partida. Não surgiu necessidade técnica demonstrada de postMessage ou mudanças no Next.js para esse cenário. Isso não equivale a aprovação universal para os três jogos ou para produção.

## I. Próxima decisão recomendada

Aprovar primeiro a revisão manual desta POC. Depois, em missão separada, validar o mesmo wrapper no DOM real do ProjectPlayable, sem mudar sua arquitetura a priori, e repetir em Firefox/Safari e com teclado físico. Só então avaliar os outros dois jogos individualmente. O custo aparente é baixo e o benefício de remover retenção de teclado é relevante.

Uma publicação futura deve usar um novo caminho versionado (por exemplo, uma versão v2 do wrapper/build), preservando v1. Manter caminhos relativos válidos para os recursos, revisar headers e testar a URL candidata antes de alterar qualquer referência do site. Não houve upload ao R2, alteração no CMS ou publicação nesta missão.

## J. Rollback e limpeza — instruções, não executadas

Produção não precisa de rollback: nunca recebeu a POC. Para voltar ao comportamento original no QA, abrir `?variant=original`.

Para encerrar o servidor, usar Ctrl+C no processo em primeiro plano. Nesta sessão ele foi iniciado em segundo plano: PID 4644; confirmar sua linha de comando antes de encerrá-lo, pois PIDs podem ser reutilizados.

Antes de limpar, revisar `git status` nos dois checkouts e salvar os arquivos desta pasta se desejar preservá-los. Remover somente os artefatos específicos da POC após autorização; não usar reset/clean/stash. O worktree tem arquivos não rastreados: não forçar sua remoção. Após backup ou decisão explícita de descartar a POC, remover o worktree com o fluxo normal do Git e depois avaliar a exclusão das branches local/remota. Preservar o diretório original do jogo e as duas alterações do Studio.
