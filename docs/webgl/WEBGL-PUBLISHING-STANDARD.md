# Unity WebGL Publishing Standard

Manual de publicação Unity WebGL do portfólio WEB-portfolio. Integração com o código revisada em **09/11/2026**. A referência de exportação e as respostas HTTP abaixo são registros históricos da POC Bloomancer de **19/10/2026**, não uma nova auditoria do R2 nem uma garantia do estado atual da infraestrutura.

Este documento descreve a integração existente e o procedimento operacional para novas publicações. Comandos são instruções para o operador; nenhum upload, alteração de CMS ou configuração de infraestrutura foi executado ao elaborar este manual.

**Como interpretar as evidências:**

- **Inspecionado:** código ou arquivos locais lidos durante a elaboração.
- **Verificado via HTTP:** resposta pública consultada na POC de 19/10/2026, sem execução interativa do jogo.
- **Informado:** configuração ou teste relatado pelo usuário.
- **Recomendado/pendente:** procedimento reutilizável ou validação futura, sem resultado de teste atribuído.

**Limitação das fontes:** `WEBGL-R2-POC-REPORT.md` foi procurado na raiz e entre os arquivos do checkout, mas não está disponível neste estado do repositório. O registro abaixo preserva as evidências da elaboração original; a conversa e artefatos locais externos não são pré-requisitos disponíveis em todo clone. Não há transcrição dos comandos originalmente executados na POC. A seção Wrangler reproduz o procedimento solicitado com os artefatos reais e a sintaxe oficial atual; não é uma transcrição certificada do terminal original. Bucket `portfolio-webgl` e opções do Editor são informações fornecidas pelo usuário; o painel Cloudflare e o projeto Unity não foram acessados.

## 1. Architecture Overview

```text
Unity WebGL Build → Cloudflare R2 → Sanity CMS → Project Detail → ProjectPlayable → iframe
```

As setas representam o fluxo de publicação e configuração. Os binários não passam pelo Sanity: o navegador os carrega diretamente do R2 por meio do iframe.

| Camada | Responsabilidade |
| --- | --- |
| Unity | Exportar HTML, loader, WebAssembly, dados e recursos compatíveis entre si. O template controla o canvas dentro da página exportada. |
| Cloudflare R2 | Armazenar os arquivos com caminhos e metadados corretos; disponibilizá-los pelo endpoint HTTP escolhido. |
| Sanity CMS | Guardar tipo, URL de entrada e dimensões nativas no objeto opcional `playable` do projeto. |
| Project Detail | Consultar e adaptar o conteúdo do Sanity e decidir se exibe seção e CTA. |
| ProjectPlayable | Mostrar capa e controles, preservar a proporção externa e criar/remover o iframe sob demanda. |
| iframe | Abrir o `index.html` do build; o HTML e o loader Unity carregam os demais recursos do R2. |

**Inspecionado:** `projectProjection` seleciona `type`, `source`, `width` e `height`; `adaptProject` valida o objeto; a página usa `project.playable` como única fonte do jogo. Não existe dependência React específica para carregar o runtime Unity.

## 2. Unity WebGL Build Standard

### Referência Bloomancer

| Opção | Configuração de referência | Evidência |
| --- | --- | --- |
| Unity | `6000.3.10f1` | Informado; versão do Editor não verificada localmente |
| Template | `PortfolioResponsive` | Informado; HTML responsivo inspecionado |
| Resolution | `960 × 600` | Informado e confirmado no canvas do HTML local |
| Compression Format | `Brotli` | Informado; extensões `.br` e headers verificados |
| Decompression Fallback | `Disabled` | Informado na POC; referências `.br` coerentes com descompressão nativa |
| Data Caching | `Enabled` | Informado; persistência efetiva não testada na POC |
| Code Optimization | `Disk Size` | Informado; Player Settings não acessado |
| Development Build | `Disabled` | Informado; Player Settings não acessado |
| Multithreading | `Disabled` | Informado; Player Settings não acessado |

Essa combinação é a referência validada funcionalmente com Bloomancer, não uma garantia universal para outros jogos.

### Aplicação a novos projetos

**Recomendado:** exportar um build de distribuição, manter cada HTML/loader junto de seus próprios binários, usar template adaptável ao viewport e conferir os metadados da compressão escolhida. Usar a configuração acima como ponto de partida quando adequada ao jogo.

Versão do Unity, resolução, proporção e nomes de arquivos são específicos de cada exportação. Preencher as dimensões correspondentes no Sanity; não impor 960 × 600 a jogos com outra proporção. Data Caching não assegura funcionamento offline ou persistência ilimitada.

Mudanças de versão do Editor, template, compressão, fallback ou threading exigem nova validação. A entrega nativa Brotli requer headers correspondentes; WebAssembly usa `application/wasm`. Não misturar artefatos de builds diferentes. Referência: [Unity 6000.3 — Deploy a Web application](https://docs.unity3d.com/6000.3/Documentation/Manual/webgl-deploying.html).

## 3. Cloudflare R2 Structure

Bucket informado: `portfolio-webgl`. Estrutura atual da POC, corroborada pelo build local e pelas URLs consultadas:

```text
portfolio-webgl
└── Games/
    └── Bloomancer/
        └── v1/
            ├── index.html
            ├── Build/
            │   ├── 8-bitty.data.br
            │   ├── 8-bitty.framework.js.br
            │   ├── 8-bitty.loader.js
            │   └── 8-bitty.wasm.br
            └── TemplateData/
                └── webmemd-icon.png
```

R2 usa chaves de objetos; as pastas representam prefixos. Preservar exatamente maiúsculas/minúsculas e nomes, incluindo `Games`, `Bloomancer`, `Build` e `TemplateData`. Usar `/` nas chaves remotas. O nome comercial Bloomancer não exige renomear arquivos compilados `8-bitty.*`.

**Convenção reutilizável recomendada:** `Games/<NomeEstavelDoProjeto>/v<N>/`. Escolher um nome estável e manter sua capitalização. Publicar versões completas em prefixos novos, como `v2`, `v3`; nunca substituir parcialmente arquivos de uma versão já referenciada pelo CMS.

Para uma nova versão: exportar, enviar todos os arquivos ao novo prefixo, validar a execução independente e integrada e só então atualizar `playable.source`. Publicar o `index.html` por último reduz a exposição de uma entrada incompleta; a troca de versão no CMS é o ponto de ativação editorial, não uma operação atômica de upload.

**Rollback:** restaurar no Sanity a URL da versão anterior já validada e suas dimensões, caso tenham mudado; confirmar a atualização na página publicada. Manter as versões anteriores disponíveis enquanto forem necessárias para rollback ou ainda houver referências. Não depender de sobrescrever `v1` nem de apagar objetos para voltar uma versão.

## 4. Upload Procedure — Wrangler

### Pré-requisitos e autenticação

O operador precisa de PowerShell, acesso à internet, Node.js/npm e uma versão do Wrangler já disponível no ambiente/cache, além de acesso à conta Cloudflare com permissão de leitura e escrita no bucket. Registrar a versão usada na publicação. Este manual não adiciona Wrangler às dependências do portfólio.

Os comandos usam `npx --no-install` para impedir instalação automática. Se Wrangler não estiver disponível, interromper e preparar a ferramenta separadamente pelo procedimento da equipe. Não remover essa opção para provocar uma instalação durante uma publicação sem preparação.

Executar a autenticação interativa na conta correta; não inserir tokens nos comandos ou neste documento:

```powershell
npx --no-install wrangler --version
npx --no-install wrangler login
npx --no-install wrangler whoami
npx --no-install wrangler r2 bucket list
npx --no-install wrangler r2 bucket info portfolio-webgl
```

Confirmar que `portfolio-webgl` pertence à conta pretendida. A listagem/informação do bucket verifica acesso de leitura administrativo, não comprova permissão de escrita nem exposição pública. Erros de autenticação ou autorização devem ser resolvidos antes do upload. `login`, `whoami` e operações de bucket não usam `--remote`; as operações de objetos abaixo usam.

Referências: [Cloudflare — R2 CLI](https://developers.cloudflare.com/r2/get-started/cli/) e [Wrangler — General commands](https://developers.cloudflare.com/workers/wrangler/commands/general/).

### Conferência do build e destino

Build real inspecionado: `C:\Dev\playable\8-bitty`. Os nomes abaixo foram confirmados nesse diretório. Não executar comandos de upload antes de conferir o destino: `object put` grava na chave indicada e pode substituir um objeto existente.

```powershell
$webglBuildRoot = 'C:\Dev\playable\8-bitty'
Get-ChildItem -LiteralPath $webglBuildRoot
Get-ChildItem -LiteralPath "$webglBuildRoot\Build" -File
Get-ChildItem -LiteralPath "$webglBuildRoot\TemplateData" -File
Get-Content -LiteralPath "$webglBuildRoot\index.html"

# v1 é a POC existente. Escolha uma versão NOVA e ainda não utilizada.
# v2 é apenas exemplo; confirme sua disponibilidade antes de continuar.
$webglVersion = 'v2'
$webglObjectRoot = "portfolio-webgl/Games/Bloomancer/$webglVersion"
Write-Output $webglObjectRoot
```

O destino histórico da POC é `portfolio-webgl/Games/Bloomancer/v1`. Os exemplos usam outra versão para evitar sobrescrevê-lo. Para outro jogo, adaptar o prefixo e os nomes a partir do HTML exportado, preservando a relação entre eles.

### Upload dos arquivos Build/

Enviar cada arquivo individualmente, com metadados explícitos. Os comandos não comprimem o conteúdo; os `.br` já precisam vir comprimidos do Unity.

```powershell
npx --no-install wrangler r2 object put "$webglObjectRoot/Build/8-bitty.data.br" --file "$webglBuildRoot\Build\8-bitty.data.br" --content-type 'application/octet-stream' --content-encoding 'br' --remote
npx --no-install wrangler r2 object put "$webglObjectRoot/Build/8-bitty.framework.js.br" --file "$webglBuildRoot\Build\8-bitty.framework.js.br" --content-type 'application/javascript' --content-encoding 'br' --remote
npx --no-install wrangler r2 object put "$webglObjectRoot/Build/8-bitty.wasm.br" --file "$webglBuildRoot\Build\8-bitty.wasm.br" --content-type 'application/wasm' --content-encoding 'br' --remote
npx --no-install wrangler r2 object put "$webglObjectRoot/Build/8-bitty.loader.js" --file "$webglBuildRoot\Build\8-bitty.loader.js" --content-type 'application/javascript' --remote
```

Executar um comando por vez e conferir sucesso e `$LASTEXITCODE` igual a `0` antes de continuar. `--remote` seleciona o armazenamento remoto; um teste em armazenamento local não publica a POC.

### Upload dos recursos TemplateData/

O único arquivo presente nessa pasta do build inspecionado é `webmemd-icon.png`:

```powershell
npx --no-install wrangler r2 object put "$webglObjectRoot/TemplateData/webmemd-icon.png" --file "$webglBuildRoot\TemplateData\webmemd-icon.png" --content-type 'image/png' --remote
```

O HTML inspecionado não referencia esse ícone, mas o recurso faz parte da pasta exportada e está publicado. Em outros templates, enviar também todos os recursos efetivamente exportados, inclusive subpastas, com seus caminhos e MIME types correspondentes: por exemplo, CSS como `text/css`, PNG como `image/png` e JavaScript como `application/javascript`. Não aplicar `Content-Encoding: br` a arquivos sem compressão Brotli.

O HTML menciona `StreamingAssets`, mas não há essa pasta no build local inspecionado. Se uma nova exportação a produzir, publicar seus arquivos e quaisquer bundles/recursos adicionais referenciados; não presumir que a árvore mínima da POC contém todos os arquivos de todo jogo.

### Upload do index.html e verificação pós-upload

Enviar a entrada depois de os recursos estarem disponíveis:

```powershell
npx --no-install wrangler r2 object put "$webglObjectRoot/index.html" --file "$webglBuildRoot\index.html" --content-type 'text/html' --remote
```

Sintaxe e flags conferidas na [referência Wrangler R2](https://developers.cloudflare.com/workers/wrangler/commands/r2/). Estes comandos não definem uma política `Cache-Control`: essa política não foi comprovada na POC e será definida na Etapa 11.

Depois do upload, verificar cada URL pública pelo procedimento da seção 6, abrir o jogo isoladamente e realizar o checklist. O bucket estar acessível ao Wrangler não o torna público automaticamente. Não cadastrar no Sanity uma versão com arquivos ausentes, headers incorretos ou falha de inicialização.

## 5. MIME Types & Brotli

| Arquivo | Content-Type | Content-Encoding |
| --- | --- | --- |
| `.data.br` | `application/octet-stream` | `br` |
| `.framework.js.br` | `application/javascript` | `br` |
| `.wasm.br` | `application/wasm` | `br` |
| `.loader.js` | `application/javascript` | Nenhum |
| `.html` | `text/html` | Nenhum |

“Nenhum” significa header ausente, não o valor literal `Nenhum`. Para PNG da POC, usar `image/png` sem Content-Encoding.

O MIME descreve o conteúdo original, e o encoding descreve a compressão aplicada. A extensão `.br` sozinha não instrui o navegador a descomprimir. Não rotular o WebAssembly comprimido simplesmente como arquivo Brotli genérico nem comprimir novamente os artefatos no upload.

Upload pelo painel pode inferir metadados a partir da extensão final ou não configurar o encoding exigido pelo build. Não assumir que arrastar arquivos para o bucket produz a mesma configuração: conferir os metadados e, principalmente, a resposta pública. Isso é um risco operacional, não evidência de que todo upload pelo painel esteja incorreto. A Cloudflare permite definir metadados no upload: [Upload objects](https://developers.cloudflare.com/r2/objects/upload-objects/).

## 6. HTTP Validation

### Chrome DevTools → Network → Headers

1. Abrir a URL HTTPS completa do `index.html`; abrir DevTools e selecionar **Network**. Ativar **Preserve log** para acompanhar falhas.
2. Para validar uma transferência inicial, marcar **Disable cache** enquanto DevTools estiver aberto e recarregar.
3. Selecionar documento, loader, dados, framework e WebAssembly. Em **Headers**, verificar URL final, HTTP 200, Content-Type e, nos três `.br`, Content-Encoding `br`.
4. Conferir **Console** e requisições com erro. Não deve haver 404, mixed content ou falha de descompressão/compilação. Verificar também recursos adicionais carregados durante a partida.
5. Para testar cache, desmarcar **Disable cache** e recarregar. Um HTTP 304 pode resultar de revalidação com ETag/Last-Modified; significa reutilização do corpo armazenado, não ausência do arquivo. Respostas servidas de memória/disco também podem ocorrer. Um novo 200 não é, isoladamente, falha de cache.
6. Registrar navegador/versão, dispositivo, URL da versão, resultado inicial e resultado com cache. Repetir no ProjectPlayable; o sucesso independente não comprova o embedding.

HTTP 304 não precisa repetir todos os headers da resposta 200. Ao diagnosticar MIME/encoding, conferir uma transferência 200 sem cache. Se o loader Unity reutilizar dados de seu próprio armazenamento, limpar os dados do site de teste pelo DevTools e repetir; isso pode remover saves locais, portanto usar um perfil/dados de QA.

Consulta complementar PowerShell, somente leitura; os comandos abaixo usam a URL histórica de desenvolvimento da POC:

```powershell
$webglPocUrl = 'https://pub-6971307aa3cc48a1a01ef99c5c652518.r2.dev/Games/Bloomancer/v1'
curl.exe -I "$webglPocUrl/index.html"
curl.exe -I -H 'Accept-Encoding: br' "$webglPocUrl/Build/8-bitty.data.br"
curl.exe -I -H 'Accept-Encoding: br' "$webglPocUrl/Build/8-bitty.framework.js.br"
curl.exe -I -H 'Accept-Encoding: br' "$webglPocUrl/Build/8-bitty.wasm.br"
```

Adaptar a URL para a versão recém-publicada. HEAD confirma headers, não integridade dos corpos ou execução do jogo. Negociar Brotli explicitamente evita interpretar uma resposta para cliente sem suporte declarado como prova de header ausente.

### Resultados comprovados e limites

**Informado pelo usuário:** jogo real executando no portfólio, controles, abertura/fechamento/reabertura, navegação PT/EN e headers Brotli conferidos manualmente no navegador.

**Verificado via HTTP nesta elaboração, 19/10/2026, 19:11 UTC:**

| Recurso de `Games/Bloomancer/v1/` | Status | Content-Type | Content-Encoding com `Accept-Encoding: br` |
| --- | --- | --- | --- |
| `index.html` | 200 | `text/html` | Ausente |
| `Build/8-bitty.loader.js` | 200 | `application/javascript` | Ausente |
| `Build/8-bitty.data.br` | 200 | `application/octet-stream` | `br` |
| `Build/8-bitty.framework.js.br` | 200 | `application/javascript` | `br` |
| `Build/8-bitty.wasm.br` | 200 | `application/wasm` | `br` |
| `TemplateData/webmemd-icon.png` | 200 | `image/png` | Ausente |

As respostas incluíram ETag e Last-Modified; não apresentaram Cache-Control explícito. **Não há resultado comprovado de HTTP 304, medição de desempenho ou matriz de navegadores.** Nenhum novo teste interativo do jogo foi realizado nesta elaboração. O acesso público não confirma o nome administrativo do bucket.

## 7. ProjectPlayable Integration

**Comportamento atual do wrapper, revisado no código:**

- **Desktop sob demanda:** inicia com capa e botão; o iframe só existe depois de Play/Jogar.
- **Celular/touch-only:** até 760 px, ou com ponteiro primário coarse sem hover, a seção preserva a capa e mostra aviso para jogar no desktop e botão para copiar o link do projeto. Não monta o iframe. Ao entrar nessa condição com jogo ativo, desmonta-o. A decisão é por media query, não por detecção de sistema operacional.
- **Cópia do link:** usa a origem e o caminho atuais, sem query/hash, acompanhando o domínio servido. Se Clipboard falhar (por exemplo em HTTP de rede local), mostra o link em um campo selecionável para cópia manual.
- **Play/Close/Play:** fechar remove o iframe; reabrir cria um contexto novo. A partida em memória não é preservada pelo componente; saves dependem do jogo.
- **Proporção:** `aspectRatio` usa `width / height` e o iframe preenche o contêiner. O template Unity precisa adaptar o canvas internamente; a proporção externa não corrige um template incompatível.
- **PT/EN:** título da seção, título do iframe e controles vêm dos dicionários. Isso não traduz o conteúdo interno do jogo nem garante continuidade da partida ao trocar idioma.
- **Sem playable:** sem objeto no Sanity, não há seção WebGL nem CTA de jogar. Objetos inválidos são erros, não equivalem à ausência.
- **iframe:** recebe a URL do HTML e título com o projeto; usa `allow="fullscreen; gamepad"` e `allowFullScreen`. Isso permite recursos, mas não cria botão de fullscreen nem comprova suporte a gamepad.
- **Foco:** ao iniciar, vai para fechar; ao fechar, retorna a jogar, ou ao botão de copiar quando a política mobile se aplica. Há ajuste de scroll quando o controle ficaria oculto. Testar a saída do canvas pelo teclado.

Não há protocolo de prontidão com o jogo, estado próprio de erro/timeout, sandbox ou referrerPolicy explícitos no componente atual. O HTML exportado inspecionado usa `alert` em falha de inicialização. Registrar falhas pela rede/console sem presumir que a interface do portfólio as detectará.

## 8. Desenvolvimento local

O jogo exibido localmente vem do objeto `playable` do projeto publicado no Sanity, assim como no site de produção. Para testar o player, abrir um projeto com esse objeto configurado; Bloomancer é a referência existente. As mesmas regras de desktop e aviso para celular se aplicam.

A página não usa variáveis de ambiente para substituir o jogo. Configurar tipo, URL e dimensões no Sanity conforme a seção seguinte. Remover o objeto de um projeto sem jogo, em vez de publicar dados parciais. Não é necessário manter configuração de teste de playable no ambiente local ou no Railway.

## 9. Sanity CMS Integration

No documento correto de projeto, preencher o objeto opcional `playable` por completo:

| Campo | Preenchimento |
| --- | --- |
| `type` | `unity-webgl` |
| `source` | URL HTTPS completa e confiável do `index.html` da versão validada |
| `width` | Largura nativa inteira positiva; 960 na referência Bloomancer |
| `height` | Altura nativa inteira positiva; 600 na referência Bloomancer |

Usar o endpoint definitivo de produção quando disponível, não promover a URL `r2.dev` como solução permanente. Não cadastrar URL do `.wasm`, URL administrativa do bucket, URL com credenciais ou apenas uma pasta esperando resolução de index automática.

O campo `source` atual é uma string obrigatória; o adapter exige string não vazia, mas não impõe HTTPS, host ou disponibilidade. Este padrão exige validação operacional de confiança e HTTPS. Não interpretar a aceitação do campo no Studio como aprovação de segurança.

**Objetos incompletos:** tipo diferente, source vazio ou dimensões inválidas causam exceção em `adaptProject` e podem impedir a renderização do detalhe correspondente. Listagem e relacionados usam `getProjectCards`/`adaptProjectCard`, cuja projeção não inclui `playable`; um erro exclusivo desse objeto não é validado nessas consultas leves. Outros campos obrigatórios inválidos dos cards ainda podem afetar suas listas. Para projeto sem WebGL, remover o objeto em vez de publicar dados parciais.

Publicar somente depois do QA e confirmar a página real. A atualização dos dados passa pelo [webhook de cache](../../src/sanity/WEBHOOK.md), com [recuperação por tempo](../../src/sanity/WEBHOOK.md#cache). Isso não invalida o cache HTTP do R2, dados do loader Unity ou abas já abertas.

## 10. Production Considerations — Etapa 11

Pendências de infraestrutura registradas para a Etapa 11. Esta revisão documental não as implementa nem certifica o estado dos painéis externos:

| Tema | Decisão/validação pendente |
| --- | --- |
| Domínio personalizado | Preparar endpoint de produção e substituir a URL temporária `r2.dev` nos documentos apropriados. |
| Cache/CDN | Definir política para HTML e binários versionados, revalidação, invalidação e rollback; medir cache efetivo. |
| Origem e HTTPS | Definir destinos confiáveis e política de validação; manter builds ativos em origem separada do portfólio. |
| Segurança do iframe | Avaliar sandbox, referrerPolicy, CSP/Permissions-Policy e permissões necessárias com testes reais; o componente atual não aplica todas essas restrições. |
| Performance | Medir download, inicialização, memória, densidade de pixels e ciclos de reabertura em dispositivos alvo. |
| Compatibilidade | Definir navegadores/dispositivos suportados e testar cada novo build/versão Unity. |
| Produção | Repetir QA no domínio final, com headers efetivos do pai e do frame usando o playable publicado no Sanity. |

`r2.dev` é destinado a desenvolvimento e tem rate limiting; produção deve usar entrega apropriada, como domínio personalizado conectado ao R2. A Cloudflare não recomenda CNAME direto para `r2.dev`. Fonte: [Cloudflare — Public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/).

Não exigir CORS apenas porque o iframe é externo: o HTML e os arquivos da POC usam a mesma origem entre si. Recursos buscados de outras origens exigem avaliação própria. Se threading for habilitado em outra exportação, revisar isolamento e políticas do documento pai e do frame; não assumir que headers apenas no R2 resolvem todas as exigências de um iframe. A POC sem multithreading não valida esse cenário.

## 11. QA Checklist

Preencher por jogo e versão. Registrar data, responsável, URL, versão Unity, navegador/versão e dispositivo junto ao registro de publicação utilizado pela equipe. Não marcar um item com base no resultado de outro jogo.

- [ ] Build íntegro: HTML, loader, dados e WebAssembly da mesma exportação; opções do Editor registradas.
- [ ] Nomes e caminhos conferidos no HTML; nenhum arquivo necessário omitido.
- [ ] Todos os objetos publicados remotamente, inclusive TemplateData/StreamingAssets quando aplicável.
- [ ] HTTP 200 em transferência inicial; MIME e Brotli corretos; nenhum 404.
- [ ] HTTPS no documento e recursos; nenhuma requisição mixed content.
- [ ] Execução independente pelo `index.html` público.
- [ ] Execução no ProjectPlayable do projeto pretendido.
- [ ] Controles e áudio após interação do usuário; gamepad/fullscreen quando fizerem parte dos requisitos.
- [ ] Play/Close/Play funciona; áudio encerra ao fechar e reabertura não mantém instância anterior ativa.
- [ ] PT/EN: rótulos, navegação e associação do playable corretos; tradução interna avaliada separadamente.
- [ ] Responsividade: canvas, proporção, orientação, viewport pequeno e alta densidade de pixels.
- [ ] Teclado/foco: iniciar, entrar/sair do canvas, acessar fechar e retornar ao botão jogar; verificar zoom e tecnologia assistiva quando aplicável.
- [ ] Console e Network sem erros de inicialização, descompressão, WebAssembly ou recursos ausentes.
- [ ] Cache: primeira carga, recarga/revalidação e nova versão sem mistura de artefatos; registrar se houve 304 ou cache local.
- [ ] Navegadores e dispositivos oficialmente suportados testados e identificados.
- [ ] Projeto sem playable não exibe seção ou CTA; nenhum objeto parcial publicado.
- [ ] Produção usa o objeto Sanity correto; URL anterior preservada para rollback.
- [ ] Celular/touch-only mostra aviso e não carrega iframe; cópia funciona em HTTPS ou oferece campo de cópia manual.
- [ ] Redimensionar ou trocar a condição de entrada encerra o jogo quando o aviso desktop passa a ser necessário.

## 12. Troubleshooting

| Sintoma | Conferência e ação operacional |
| --- | --- |
| Brotli não carrega/erro de parsing | Conferir `Content-Encoding: br` em resposta 200 negociada com Brotli; conferir que o corpo é realmente o `.br` exportado. Corrigir o upload/metadados da versão em preparação; não habilitar fallback sem tratar isso como novo build. |
| MIME incorreto | Verificar `application/wasm` no `.wasm.br`, JavaScript no framework/loader e octet-stream nos dados. MIME da extensão final `.br` não basta. |
| Arquivos 404 | Comparar URL requisitada com chave remota: prefixo, versão, capitalização, nome completo e subpastas. Confirmar upload remoto e acesso público. |
| URLs relativas incorretas | Abrir o HTML e conferir `Build/...`, `StreamingAssets` e outros caminhos. Manter a árvore relativa original; caminhos absolutos começando por `/` apontam para a raiz do host, não para a pasta da versão. |
| Canvas com proporção errada | Comparar `width/height` do CMS com o build e conferir CSS/viewport do template. O aspectRatio do wrapper não controla sozinho o canvas interno. |
| Conteúdo antigo/cache inesperado | Confirmar URL e versão do CMS, ETag e origem da resposta. Testar sem cache e, em perfil de QA, sem dados persistidos do loader. Publicar nova versão em prefixo novo; não misturar loader novo com binários antigos. |
| Falha de carregamento sem mensagem no portfólio | Consultar Console e Network do frame e abrir a URL isoladamente; verificar rede, HTTPS, memória disponível, erro de runtime e política de embedding. O wrapper não tem timeout/erro próprio. |
| Template incompatível | Revalidar viewport, canvas, paths e APIs do template na versão Unity usada. `PortfolioResponsive` validado com Bloomancer não certifica templates diferentes. |
| Jogo isolado funciona, iframe falha | Conferir CSP `frame-src` do pai, `frame-ancestors`/X-Frame-Options do documento incorporado e políticas/permissões efetivas. Avaliar também armazenamento, áudio e recursos dependentes de interação. |
| Detalhe falha após editar playable no CMS | Conferir os quatro campos do objeto. Completar ou remover quando não houver jogo. Para falha na listagem/relacionados, revisar os campos da projeção leve, que não inclui playable. |
| Celular não mostra botão Jogar | Comportamento previsto para telas pequenas ou entrada coarse sem hover; a seção oferece acesso pelo desktop. |
| Copiar link falha no celular pela rede local | Clipboard pode estar indisponível no HTTP local; usar o campo manual e validar novamente no HTTPS publicado. |

### Fontes consultadas e limites de validação

Fontes locais inspecionadas:

- `src/features/project-detail/ProjectPlayable.tsx` e `ProjectHero.tsx`.
- `studio/schemaTypes/objects/playableConfig.ts` e campo `playable` em `studio/schemaTypes/documents/project.ts`.
- `src/content/adapters/project.ts`, `src/sanity/queries/project.ts` e `src/sanity/repositories/projects.ts`.
- `src/app/[lang]/projects/[slug]/page.tsx`, que usa o playable publicado no Sanity.
- Dicionários `src/i18n/dictionaries/pt.ts` e `en.ts`; contrato em `src/content/types/project.ts`.
- [README do site](../../README.md), [README do Studio](../../studio/README.md), `.env.example`, `next.config.ts` e `AGENTS.md`. A configuração de ambiente não possui override de playable.
- Registro histórico da POC: build local então inspecionado em `C:\Dev\playable\8-bitty`. Esse diretório externo não faz parte do repositório e não é requisito para outros clones.
- Skill `sanity-best-practices`, incluindo referência de schema, para revisão do contrato existente.

As referências oficiais Cloudflare/Unity usadas estão vinculadas nas seções correspondentes. Nenhum comando Wrangler foi executado; sua disponibilidade e versão efetiva no ambiente de publicação não foram validadas. Não foram acessados Player Settings, painel Cloudflare, permissões administrativas ou dataset/Studio remoto. Na elaboração original não houve upload, novo QA interativo nem teste de 304. A revisão de 09/11/2026 conferiu a integração no código e as referências oficiais de R2/webhooks, sem executar Wrangler, reauditar os arquivos remotos ou repetir a POC. Essas limitações não devem ser interpretadas como falhas observadas do jogo.
