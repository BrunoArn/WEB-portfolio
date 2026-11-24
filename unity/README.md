# Template Unity WebGL do portfólio

Fonte reutilizável: [`WebGLTemplates/PortfolioResponsive`](WebGLTemplates/PortfolioResponsive). Não é um build exportado: os placeholders e diretivas precisam ser processados pela Unity. Não abrir seu `index.html` diretamente como se fosse um jogo pronto.

## Origem e arquivos

Fonte inspecionada em 23/11/2026 e consolidada em 24/11/2026 na branch `feature/webgl-keyboard-html`, com upstream `origin/feature/webgl-keyboard-html`. O worktree temporário foi usado somente para isolamento; o workflow principal retorna a `C:\Dev\WEB-portfolio`. Os três HTMLs foram aprovados localmente. Nenhuma publicação foi realizada.

A base foi copiada de `C:\Dev\GAME-2D-RPG-Project\Assets\WebGLTemplates\PortfolioResponsive`. Existe cópia idêntica em `C:\Dev\GAME-Endless-runner-GameJam\Assets\WebGLTemplates\PortfolioResponsive`. SHA-256 do `index.html` de ambas: `6e8dff06fdef07c197a86c020f839317806c2695284f98e76e317594398ca7c3`.

O projeto Bloomancer (`C:\Dev\GAME-8-Bit-GameJam`) seleciona `PROJECT:PortfolioResponsive`, mas sua pasta `Assets/WebGLTemplates` estava vazia. Seu HTML já exportado tem a mesma estrutura responsiva dos outros dois jogos. Isso não comprova qual arquivo-fonte histórico produziu aquele build.

Os três `ProjectSettings/ProjectVersion.txt` registram `6000.3.10f1`. É evidência da configuração dos projetos locais, não certificação dos binários publicados.

Arquivos distribuídos:

- `index.html`: fonte do template; alteração funcional limitada ao foco do canvas e listener de Tab.
- `thumbnail.png`: imagem original de seleção do template no Editor, sem alteração.
- `TemplateData/webmemd-icon.png`: ícone original do diagnóstico opcional, sem alteração.
- `tests/template.test.mjs`: verificações locais, fora da pasta copiada para a Unity.

Arquivos `.meta` não foram copiados: o Editor gera seus próprios GUIDs na importação. Antes de atualizar um template já instalado, preservar os `.meta` existentes e fazer backup do diretório. Os originais externos não foram modificados; uma cópia de segurança e hashes foram guardados na pasta de evidências local da POC.

## Contrato de teclado e identificação acessível

O canvas recebe `tabindex="0"`. Antes do loader, um listener `keydown` em captura usa `stopImmediatePropagation()` exclusivamente para Tab/Shift+Tab quando o foco está no canvas, body ou raiz do documento. Não usa `preventDefault()`: a navegação nativa entre iframe e página permanece disponível. Não há postMessage, dependências externas, alterações de C# ou de `ProjectPlayable`.

Ctrl/Alt/Meta+Tab, composição e eventos de outros controles HTML não são interceptados pelo listener. W/A/S/D, setas, espaço, Enter e ESC não recebem novo tratamento. Tab fica reservado à navegação: jogos que o utilizem como comando precisam de avaliação antes de adotar este template. Não se trata de garantia de acessibilidade completa, pausa automática ou correção universal de estados de entrada.

O `aria-label` usa `PRODUCT_NAME`, com escape para atributo HTML. Assim identifica cada jogo sem nomes fixos, sem instruções de saída incorretas e sem texto de ajuda somente em inglês. O título externo do iframe continua sendo fornecido pelo dicionário PT/EN do portfólio. Não adicionamos instruções localizadas ao jogo. O `lang="en-us"` herdado descreve os jogos atualmente em inglês; ajustar esse atributo se o idioma real de um futuro jogo for diferente. Não inferir o idioma interno pelo idioma do portfólio.

Diff funcional sobre o original:

1. `tabindex="-1"` → `tabindex="0"` e nome acessível derivado de `PRODUCT_NAME`.
2. Listener inline da POC aprovada, antes do loader, com comentário genérico.

Dimensões, CSS, viewport, backgrounds, `createUnityInstance`, callbacks, referências `Build/`, `StreamingAssets`, macros `{{{ ... }}}`, inclusões `<<< ... >>>` e condicionais de diagnostics/threads/WASM/symbols foram preservados. Nenhuma biblioteca de scripts compartilhados foi criada.

## Uso em novos jogos

1. Fazer backup de qualquer `Assets/WebGLTemplates/PortfolioResponsive` existente no projeto Unity. Não substituir personalizações sem revisar o diff.
2. Copiar **somente** a pasta `WebGLTemplates/PortfolioResponsive` deste diretório para `Assets/WebGLTemplates/PortfolioResponsive` do projeto. Não copiar testes, POC ou README para dentro do template.
3. Selecionar a plataforma Web e o template `PortfolioResponsive` em Player Settings / Resolution and Presentation. Re-selecioná-lo após atualizar sua fonte quando necessário para o Editor reler o template.
4. Conferir Product Name, idioma real do HTML, dimensões nativas, compressão, threading e demais opções do jogo. Não usar Tab como comando interno sem resolver o conflito.
5. Exportar pelo fluxo normal do projeto para um diretório novo. Manter HTML, loader e recursos do mesmo build. Não editar nomes ou dimensões para corresponder a outro jogo.
6. Servir por HTTP com MIME/Content-Encoding corretos; testar foco antes/depois do iframe, retorno à partida, controles, ESC e fechar/reabrir. Repetir no `ProjectPlayable` real, PT/EN e navegadores suportados.
7. Somente após aprovação, publicar em prefixo de versão novo, validar a URL candidata e trocar a referência editorial. Preservar a versão anterior para rollback. Seguir o [padrão de publicação](../docs/webgl/WEBGL-PUBLISHING-STANDARD.md).

Diagnostics depende de `TemplateData/webmemd-icon.png` e dos includes `TemplateData/diagnostics.css` / `diagnostics.js` fornecidos pela instalação da Unity. Esses includes foram encontrados em `6000.3.10f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/WebGLTemplates/WebGLIncludes`. Não duplicar esses scripts de distribuição aqui. Builds com diagnostics ativado precisam verificar sua inclusão efetiva no export. Threads, símbolos e backgrounds opcionais também exigem QA dos recursos que o Editor exportar.

Referência: [Unity 6000.3 — Web templates](https://docs.unity.com/en-us/engine/6000.3/manual/platform-specific/webgl/building-distribution/templates). As macros são avaliadas no build; nosso teste local não substitui o processador da Unity.

## Compatibilidade dos três jogos — validação local concluída

| Jogo | HTML / canvas | Comandos exercitados | Resultado local |
| --- | --- | --- | --- |
| Bloomancer | `8-bitty.*`, 960×600 | WASD e setas | PASS no harness e ProjectPlayable PT/EN em Chrome/Edge |
| Hungry Worm | `Hungry-Worm.*`, 960×640 | Espaço e mouse esquerdo | PASS no harness e ProjectPlayable PT/EN em Chrome/Edge |
| 2D RPG | `2D-RPG.*`, 960×600 | WASD, ataque, dash, slots 1–5 | PASS funcional no harness e ProjectPlayable PT/EN em Chrome/Edge; timeout de GIF repetido sem erro |

O [índice de validação](../poc/webgl-keyboard-html/README.md) reúne fontes, resultados e limitações. Os três HTMLs candidatos estão versionados como fontes, sem binários. Todos conservam o mesmo listener do template; os originais externos continuam intactos. O Bloomancer histórico mantém a identificação acessível da primeira POC; futuras exportações seguem PRODUCT_NAME deste template.

Os projetos Hungry Worm e RPG selecionam o mesmo template externo. Não foi encontrado conflito de Tab nos comandos inspecionados ou exercitados. Isso não certifica todos os menus, builds futuros, navegadores ou acessibilidade completa do jogo.

Para atualizar os exports existentes após aprovação da publicação: usar a candidata correspondente e preservar seus nomes, dimensões e recursos. Não substituir o HTML de um jogo pelo export de outro. O pequeno diff HTML não exige recompilar os binários. A publicação futura precisa de destino versionado completo, QA de headers/URL e manutenção de v1 para rollback. Nenhuma nova versão foi criada nesta missão.

## Testes desta padronização

Com Node disponível, sem instalação de dependências:

```powershell
node --test unity/tests/template.test.mjs unity/tests/exported-html.test.mjs
```

O teste de template cobre: estrutura e ordem de scripts; oito combinações de condicionais; nome acessível com aspas/ampersand/ângulos; matriz de eventos verificando o escopo do listener e preservação da ação padrão. Os caminhos relativos e a sintaxe dos scripts materializados foram conferidos. Mais três testes verificam cada HTML candidato contra o listener padrão e reconstituem seu original em memória para conferir o SHA-256, detectando alterações indevidas de layout, inicialização ou caminhos. O teste de condicionais é uma simulação local das diretivas usadas aqui, não uma exportação pelo Editor.

Para QA de navegador, o teste pode escrever HTML materializado mediante `UNITY_TEMPLATE_QA_PROFILE` (caminho de JSON com valores do export real) e `UNITY_TEMPLATE_QA_HTML` (destino externo ao template). É um recurso de QA, sem implementação no runtime. A materialização desta rodada usou os nomes e dimensões do Bloomancer existente; nenhum arquivo `.wasm`, `.data.br`, framework ou loader foi alterado.

Testes reais do HTML materializado em Chrome 157.0.8103.79 e Edge 157.0.4341.46, headless, no harness HTTP cross-origin: entrada por mouse/teclado, Tab, Shift+Tab, controles externos, dez ciclos de foco por navegador sem reinicialização, retorno com W anteriormente pressionado, WASD/ArrowRight/ESC e fechar/recriar. As sete verificações da POC passaram em cada navegador; o original foi executado como controle e reproduziu retenção. Sem pageerror, console.error ou HTTP >=400 nas execuções finais. Warnings de permissões/WebGL também presentes no controle original. Capturas foram revisadas: movimento respondeu após alternar foco; não foi observada tecla presa no cenário exercitado.

Evidências locais: `C:\Users\Bruno\Documents\ChatGPT\Meu site de potfolio\.work\webgl-keyboard-html\template-chrome` e `template-edge`, com `results.json` e capturas. Os arquivos da POC anterior foram reutilizados sem alterações, e as substituições de HTML ocorreram apenas no contexto do navegador de QA.

O HTML materializado do template foi testado no harness; não se repetiu a integração Next.js com esse materializado. Separadamente, os três HTMLs candidatos de exports existentes foram testados no ProjectPlayable real, PT/EN, conforme o índice consolidado. Não houve nova exportação pelo Unity Editor, testes de Firefox/Safari/leitores de tela, dispositivos físicos, fullscreen ou validação de produção com os candidatos. Variantes opcionais de diagnostics/threads foram verificadas estaticamente, não executadas com builds específicos.

## Pendências de PR e publicação

Revisar os commits da consolidação e os relatórios antes de abrir PR quando autorizado. O backup externo preserva capturas, resultados brutos e alterações preexistentes do Studio; esses artefatos não entram no Git. Não há mudança de aplicação Next.js nem referência automática a estes HTMLs.

A futura exportação normal pelo Editor deve certificar o processamento Unity do template-fonte. Definir o QA adicional dos navegadores/dispositivos suportados. Para publicar os exports atuais, seguir o procedimento versionado somente após autorização; não sobrescrever v1, não criar v2 durante a consolidação e não trocar URLs do CMS antecipadamente.

Originais externos, HTMLs/recursos dos três builds e alterações preexistentes do Studio foram preservados. Não foram alterados production, R2, Sanity ou Railway.
