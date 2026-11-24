# Navegação por teclado — Unity WebGL

Consolidação da Etapa 12.6.1 em 24/11/2026. Os três HTMLs foram aprovados após testes locais e no ProjectPlayable real. **Nenhum foi publicado nesta missão.**

## Fonte e HTMLs candidatos

O padrão para novas exportações é o [PortfolioResponsive](../../unity/README.md). Os HTMLs abaixo preservam os valores dos exports existentes; não são builds completos nem substituem o template-fonte:

| Jogo | HTML candidato | Recursos relativos | Dimensões iniciais |
| --- | --- | --- | --- |
| Bloomancer | [bloomancer.html](bloomancer.html) | `Build/8-bitty.*` | 960×600 |
| Hungry Worm | [hungry-worm.html](hungry-worm.html) | `Build/Hungry-Worm.*` | 960×640 |
| 2D RPG Project | [2d-rpg.html](2d-rpg.html) | `Build/2D-RPG.*` | 960×600 |

Todos usam o mesmo listener de Tab/Shift+Tab do template, sem postMessage ou mudanças no Next.js. A cópia histórica do Bloomancer conserva o nome acessível mais longo da primeira POC; novas exportações usam PRODUCT_NAME, conforme o padrão. Não copiar seu texto de ajuda em inglês para os outros jogos.

Para reproduzir a correção em um export existente: comparar seu HTML com a candidata correspondente, aplicar somente `tabindex="0"`, nome acessível apropriado e o listener antes do loader; preservar CSS, proporção, configuração e todos os paths daquele export. Não usar o HTML de um jogo com binários de outro. Os testes de contrato reconstituem os originais em memória e verificam seus SHA-256.

## Resultados e limites

Chrome 157.0.8103.79 e Edge 157.0.4341.46, headless, com HTTP cross-origin real:

| Jogo | Harness e controle negativo | ProjectPlayable PT/EN | Observações |
| --- | --- | --- | --- |
| Bloomancer | PASS nos dois navegadores | 32 verificações funcionais PASS na matriz integrada | Movimento, setas, foco, fechar/recriar; 5 ciclos por combinação integrada |
| Hungry Worm | PASS; original reteve Tab | PASS nos dois navegadores | 33 verificações totais; Espaço e mouse; 10 ciclos por cenário candidato |
| 2D RPG | PASS; original reteve Tab | PASS nos dois navegadores | 33 verificações funcionais; timeout de GIF na primeira execução PT; repetição de 5 verificações sem erro |

Os PASS do controle original significam reprodução esperada do problema, não navegação correta. O timeout do RPG ocorreu em `/_next/image` ao buscar um GIF da CDN Sanity, fora do runtime Unity. O processo daquela matriz retornou código 1 por esse erro; a repetição retornou 0. Não ocultar essa ocorrência ao interpretar os resultados.

Tab alcançou o próximo controle externo; Shift+Tab retornou a Fechar jogo; voltar ao canvas manteve a instância. Fechar por teclado removeu o iframe e devolveu foco a Jogar. Os comandos próprios de cada jogo foram exercitados com capturas, conforme os relatórios:

- [Bloomancer: POC original](BLOOMANCER-POC-REPORT.md), registro histórico de 23/11/2026. A matriz integrada posterior está resumida acima e preservada nas evidências externas.
- [Hungry Worm](HUNGRY-WORM-VALIDATION.md).
- [2D RPG Project](2D-RPG-VALIDATION.md), incluindo hashes dos recursos e a ocorrência de mídia.

Não houve testes de Firefox/Safari, leitor de tela, dispositivos físicos, fullscreen ou partidas completas. Não há garantia de acessibilidade integral da UI interna Unity, pausa ao perder foco ou liberação imediata de memória/GPU. O template foi materializado para QA, sem exportação nova pelo Editor.

## Reproduzir testes sem alterar o site

Na raiz do repositório:

```powershell
node --test unity/tests/template.test.mjs unity/tests/exported-html.test.mjs
```

Esses testes não exigem binários, Unity instalado ou Playwright. Validam o contrato e os três diffs, sem substituir QA interativo.

O harness e a automação versionados nesta pasta são os da POC **Bloomancer**; não executar seus comandos de gameplay como se fossem QA dos outros jogos. Para utilizá-los, é preciso ter o export original local:

```powershell
$env:POC_UNITY_ROOT = 'C:\Dev\playable\8-bitty'
node poc/webgl-keyboard-html/server.mjs
```

Em outro terminal, com uma instalação de Playwright existente:

```powershell
$env:POC_PLAYWRIGHT_PATH = 'C:\caminho\para\node_modules\playwright'
$env:POC_QA_OUTPUT = "$env:TEMP\bloomancer-keyboard-qa"
node poc/webgl-keyboard-html/qa.mjs
```

Por padrão, o script procura o runtime Playwright do Codex e Chrome instalado. `POC_BROWSER` aceita o executável Edge. O servidor usa apenas loopback, porta 43180 para o harness e 43181 para o jogo; `POC_PARENT_PORT` muda a primeira porta e `POC_HARNESS_ORIGIN` ajusta a URL da automação. Ctrl+C encerra o servidor.

Para Hungry Worm/RPG, os adaptadores temporários e scripts de integração usados nas rodadas estão preservados no backup externo indicado abaixo; os relatórios descrevem origens, controles e ordem de foco. Na integração, só o navegador de QA redireciona a URL do iframe para um servidor local separado. Não criar override no Next.js nem alterar o Sanity para testar.

## Evidências preservadas fora do Git

Capturas, JSONs brutos, logs e scripts temporários estão em `C:\Users\Bruno\Documents\ChatGPT\Meu site de potfolio\.work\webgl-keyboard-html`. Antes da consolidação foi feito backup em `C:\Users\Bruno\Documents\ChatGPT\Meu site de potfolio\.work\webgl-keyboard-consolidation-20261124`, com cópia dos arquivos anteriores, evidências, alterações locais do Studio e manifesto de hashes. Esses dados locais não são pré-requisitos de um clone nem foram incluídos nos commits.

## Próximo passo

Revisar o PR quando autorizado. Para publicação manual futura, aprovar os candidatos, preparar destino versionado sem sobrescrever v1, preservar os recursos correspondentes e validar headers e URL antes de trocar qualquer referência no CMS. Nada nesta pasta é carregado automaticamente pelo portfólio ou publicado pelo deploy Next.js. Nenhuma versão v2 foi criada nesta consolidação.
