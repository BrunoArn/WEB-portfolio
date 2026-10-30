# Atlas — Home do portfólio

O Atlas é a Home em `/pt` e `/en`. A mesma composição e interação ficam disponíveis em `/pt/atlas-preview` e `/en/atlas-preview`, com `noindex` e controles opcionais. WebGL 2 é o renderizador padrão em todas essas páginas. O protótipo independente `atlas-poc` permanece como referência.

## Comece por aqui para manter o Atlas

O ponto de entrada é **AtlasMap.tsx**. Ele descreve a interface. **useAtlasScene.ts** conecta essa interface aos controladores do navegador e libera seus recursos ao desmontar. Não existe um segundo site ou um segundo motor na prévia: Home e prévia usam os mesmos arquivos.

| Quero alterar… | Onde começar |
| --- | --- |
| Fontes do site | Famílias semânticas em `src/styles/tokens.css`, mapeamento em `globals.css`; carregamento no layout de idioma |
| Cores/tamanhos compartilhados da interface | `src/styles/tokens.css` |
| Textos PT/EN, acessibilidade e mensagens | Bloco `atlas` dos dicionários em `src/i18n/dictionaries/` |
| Projetos, imagens, categorias, posições e massas auxiliares | Sanity; `atlas-content.ts` adapta esses dados |
| Estrutura dos marcadores, título e card | `AtlasMap.tsx` |
| Aparência e adaptação da interface do mapa | `AtlasMap.module.css`; tokens `--atlas-*` locais e exceções responsivas junto aos seletores |
| Inicialização, recuperação estática e controles locais | `useAtlasScene.ts` |
| Enquadramento e dimensões do mundo | `atlas-layout.ts` e `atlas-composition.ts` |
| Formação do relevo / territórios | `atlas-field.ts`; `atlas-engine.ts` extrai e prepara as curvas |
| Intensidades padrão do movimento | `atlas-motion-settings.ts` |
| Força por velocidade do mouse | `atlas-pointer-impulse.ts` |
| Movimento desenhado pela GPU | `atlas-webgl.ts`, em `vertexSource` (GLSL) |
| Entrada da página | `atlas-entrance.ts` coordena; `atlas-growth.ts` calcula o avanço |
| Passagem do card para o detalhe | `components/projects/ProjectCoverTransition.tsx`, navegação em `useAtlasScene.ts`, estilos de snapshots em `styles/globals.css` |
| Zoom, transformação da miniatura e fechamento | `atlas-interaction.ts` |

### Tokens e escopo dos estilos

- styles/tokens.css concentra a escala compartilhada, famílias semânticas e reservas de cabeçalho/rodapé do shell. As famílias são resolvidas no body, onde o layout instala as variáveis do next/font.
- styles/globals.css aplica os padrões e expõe as famílias ao Tailwind. O layout carrega as fontes e consome o deslocamento compartilhado do cabeçalho.
- AtlasMap.module.css mantém os tokens tipográficos exclusivos do Atlas no escopo local, com exceções responsivas nos próprios seletores. Cores cartográficas, geometria, câmera e medidas da composição continuam locais.
- DS2.1-B aplica Space Grotesk 500 aos títulos e marcadores, com Geist nos textos, metadados e controles. Tamanhos desktop/mobile: hero 64/44, página 54/40, seção 36/28, card 24/22 e marcador 14/12 px. Em paisagem com altura até 700 px, o Atlas usa o hero mobile de 44 px e marcadores de 12 px para preservar a área do mapa.

Verificação DS2.1-B: lint, TypeScript, build e 271 testes existentes aprovados; 34 cenários de páginas PT/EN e nove tamanhos de viewport do Atlas, 108 aberturas/fechamentos com movimento reduzido e 24 navegações animadas dos seis cards para os detalhes em desktop/mobile. Fontes carregadas, tamanhos, pesos, foco, limites dos cards e ausência de scroll horizontal foram conferidos. Em até 380 px, a entrelinha e o espaço superior dos metadados foram compactados para evitar colisões, sem mover as âncoras ou reduzir a fonte. Capturas desktop/mobile foram inspecionadas; mobile foi simulado no navegador.

### Caminho dos dados e responsabilidades

1. As páginas de idioma carregam dicionário e dados publicados no servidor.
2. `adaptAtlasContent` produz os projetos e territórios que podem participar da composição.
3. `AtlasMap` monta a interface e entrega suas referências HTML a `useAtlasScene`.
4. O hook monta terreno, entrada e câmera, acompanha ajustes e desmonta os três juntos. Também coordena a preparação da capa e a navegação para o detalhe.
5. O terreno prepara geometria/textura; o movimento atualiza o estado das curvas; WebGL desenha. Mover o mouse não refaz o campo inteiro.

### Limites que devem permanecer claros

- Dicionários guardam textos da interface; Sanity guarda o conteúdo editorial. CSS global guarda padrões do site; CSS do Atlas guarda a composição e suas medidas específicas.
- React mantém a estrutura da interface e o estado de seleção/carregamento. Para preservar a transição aprovada, `atlas-interaction.ts` preenche os campos do card e move **a mesma miniatura HTML** entre mapa, transformação e card. Não renderize uma segunda cópia ou passe a preencher esses mesmos campos por React sem revisar esse contrato.
- Os atributos `data-atlas-*` não são decoração: conectam o HTML aos controladores. Renomeá-los exige conferir seus usos. O nome histórico `data-atlas-preview` também identifica a Home.
- A geometria e os materiais são específicos do Atlas; não precisam virar estilos globais. Os shaders continuam em strings GLSL dentro de TypeScript para usar a configuração de build existente.
- Os controles da prévia não publicam conteúdo. Os ajustes desaparecem ao recarregar.
- O hook cuida de ouvintes, ciclos, animações e recursos. Uma nova interação precisa ter uma forma de parar e limpar seu estado.

### Revisão de uma alteração

Faça uma mudança por responsabilidade. Rode TypeScript, lint e build; abra Home e prévia nos dois idiomas quando alterar textos ou estrutura. Ao mexer em layout/interação, confira desktop, celular, 760/761 px, entrada, abertura/fechamento e retorno ao mapa, teclado e movimento reduzido. Mudanças em WebGL também exigem conferir a recuperação estática. Em mudanças visuais ou de desempenho, complemente a simulação com aparelho físico.

Esta manutenção extraiu a montagem antes embutida em `AtlasMap` para um único hook, abriu código compactado e formatou o CSS mantendo seletores, ordem e valores. Não adicionou dependências, novas funcionalidades ou outro renderizador. As fórmulas do relevo e os shaders não foram alterados. Validação desta manutenção: build de produção, TypeScript e lint passaram; foram repetidos 36 ciclos de cards em PT/EN e seis tamanhos, os 15 cenários de entrada, controles e recuperação estática. As capturas da Home em 1440 px e 384 px ficaram idênticas pixel a pixel às anteriores. Uma comparação da estrutura do código confirmou a preservação da lógica extraída para o hook; a formatação do CSS preservou regras, ordem e valores. Mobile foi simulado, sem nova avaliação física. O histórico de validações e os detalhes técnicos seguem abaixo.

## Estrutura atual

| Arquivo | Responsabilidade |
| --- | --- |
| `AtlasMap.tsx` | Interface compartilhada pela Home e pela prévia: marcadores, introdução, card e painéis. |
| `useAtlasScene.ts` | Estado local, refs, montagem e limpeza dos controladores; entrada, recuperação e atualização dos ajustes. |
| `atlas-content.ts` | Adapta conteúdo publicado, idiomas, imagens, destinos e participação no mapa. |
| `atlas-field.ts` | Prepara o campo escalar e a influência espacial das cores. |
| `atlas-engine.ts` | Gera/suaviza curvas de nível, prepara fitas de espessura variável, enquadramento, cores e cache de geometria. |
| `atlas-motion.ts` | Velocidade do ponteiro, relógio, proteção das clareiras e preparação dos dados para a GPU. |
| `atlas-pointer-impulse.ts` | Impulsos individuais por passagem do ponteiro, intensidade por velocidade e limite de ondas simultâneas. |
| `atlas-motion-settings.ts` | Valores aprovados, tipos e duração do impulso; fonte única para controles e shaders. |
| `atlas-growth.ts` | Fontes de crescimento, progresso ao longo dos arcos, amostragem das pontas e chegada aos projetos. |
| `atlas-entrance.ts` | Entrada finita, aparição de projetos/rótulos e interrupções por interação. |
| `atlas-webgl.ts` | Malhas indexadas, shaders de deslocamento/cor/cobertura, estado das linhas e recursos da GPU. |
| `atlas-contour-safety.ts` | Limites locais de deformação dos contornos fechados, calculados e armazenados por contorno/escala. |
| `atlas-string-response.ts` | Normais, distâncias ao longo do traçado, contato mais próximo e estado de cada linha. |
| `atlas-interaction.ts` | Câmera, transformação da miniatura em card, foco, fechamento e restauração. |
| `AtlasThumbnail.tsx` | Miniatura pequena e imagem maior carregada apenas na seleção. |
| `atlas-layout.ts` / `atlas-raster.ts` | Mundo, escala uniforme, extensão e orçamento de resolução. |

A implementação animada anterior em Canvas 2D foi removida: não há segundo cálculo de respiração, deformação por vértice em JavaScript ou seletor de renderizador. Canvas 2D continua sendo usado para preparar a textura de cores e para a recuperação estática de compatibilidade.

## Integração com o site

Home e prévia carregam o dicionário no servidor com `getDictionary`, junto dos dados publicados. Apenas o bloco `atlas` do idioma ativo é passado ao componente, como nos demais recursos do site. Textos da interface, acessibilidade, diagnóstico, metadados da prévia e mensagens de dados ausentes ficam em `src/i18n/dictionaries/pt.ts` e `en.ts`. Conteúdo editorial dos projetos e territórios continua vindo do Sanity; os dicionários não substituem esses dados. Os componentes usam tipos derivados do dicionário, sem importar suas traduções em tempo de execução no cliente.

A família tipográfica é herdada do `body` em `src/styles/globals.css` (fonte carregada pelo layout). Atlas não declara família própria, nem mesmo nos títulos/cards. Cores de texto, acento dos controles, pesos, tamanhos compartilhados e espaçamentos usam `src/styles/tokens.css`. A paleta artística do terreno, coordenadas, escala dos marcadores, medidas responsivas e tempos da câmera permanecem locais para preservar a composição e a interação aprovadas. CSS Modules continuam isolando essas regras; não é necessário migrar geometria para classes utilitárias ou expor as animações no CSS global. Traduções da Home anterior sem consumidores foram removidas.

Nesta organização, build de produção, TypeScript e lint passaram. A revisão no navegador conferiu PT/EN em 1440×900, 384×844, 760×900, 761×900, 1000×900 e 844×390: herança da fonte nos títulos, marcadores, cards e botão de fechar; marcadores dentro da largura visível; 36 aberturas/fechamentos de três projetos; oito verificações adicionais de Home/prévia; metadados, controles e recuperação estática nos dois idiomas; páginas Projetos/Sobre. Capturas desktop/mobile e card mobile foram inspecionadas. A adaptação de conteúdo foi comparada com o commit anterior em 14 cenários (publicado e dados ausentes/inválidos, PT/EN), sem diferença de resultado. Os 15 cenários de entrada também passaram após a integração. Mobile foi simulado; não houve teste físico nesta rodada.

## Conteúdo e Sanity

`getAtlasData()` consulta a perspectiva publicada com o cliente existente, sem CDN e com `cache: no-store`. A leitura reúne projetos, territórios habilitados e configurações do Atlas. Publicar e recarregar aplica as alterações; não há assinatura ao vivo nem leitura de rascunhos nesta página.

Um projeto participa quando `atlas.enabled` e suas configurações são válidos. Posição desktop/mobile, influência e território principal vêm do Sanity. O território principal deve pertencer às categorias do próprio projeto e ter configurações publicadas válidas. As demais categorias continuam nas informações do projeto. O adaptador registra dados inválidos/ausentes sem inventar posição, conteúdo ou associação de imagem.

Nomes, cores e posições dos rótulos vêm das categorias habilitadas como territórios. Um território aparece quando algum projeto válido o utiliza. A influência cromática é calculada espacialmente a partir desses projetos, com transições contidas; não depende de um ponto isolado de cada curva. Não há tabela fixa de IDs, três cores obrigatórias ou influência reservada para projetos removidos.

Projetos novos com configurações completas entram no mapa sem alteração de código. Remover/desabilitar um projeto retira seu marcador e influência. O posicionamento continua manual: novas configurações precisam de revisão visual para evitar sobreposições.

## Campo e composição

Cada projeto contribui com uma elevação suave. Regiões auxiliares independentes adicionam elevações ou subtraem vales. Warp orgânico, curvas de nível, suavização, filtragem de alças muito pequenas no mobile e espessura variável permanecem. A introdução recebe atenuação local suave. O campo e os contornos não são regenerados a cada quadro.

As rotações dos núcleos do campo são preparadas uma vez por geração e reaproveitadas na amostragem. Essa otimização foi comparada numericamente com o campo anterior, sem mudança de valores.

No Studio, **Atlas — Topografia** edita o singleton `atlas-settings`, com perfis separados para desktop e mobile:

| Controle | Intervalo | Referência |
| --- | --- | --- |
| Amplitude | 0–100 | 50 |
| Alongamento | 0–100 | 50 |
| Direção | -90–90° | 0 |
| Conexão | 0–100 | 50 |
| Respiro | 0–100 | 50 |

Os padrões, limites e resolução defensiva são compartilhados em `shared/atlas-terrain-settings.ts`. Valores publicados substituem a referência. Os comandos de restauração do Studio editam o rascunho; é necessário publicar para aplicar.

Em **Regiões de composição**, cada fonte tem nome, tipo elevação/vale e perfis com habilitação, centro, intensidade, forma, largura/altura e rotação. Centros aceitam -50 a 150% para massas que entram/saem do quadro. As dimensões são dispersões gaussianas suaves. Campo `regions` ausente usa a referência de `shared/atlas-composition-regions.ts`; lista explícita vazia remove as fontes auxiliares. Regiões independem de projetos; sem projetos, o terreno usa tom mineral neutro. Nenhum documento é criado ou publicado automaticamente.

## Movimento e desenho

A CPU encontra o contato mais próximo em cada linha e emite impulsos pela passagem do ponteiro. O vertex shader aplica respiração interpolada na grade e propaga as ondas ao longo de cada traçado. O fragment shader aplica a textura de cores e suaviza suas bordas por cobertura. A GPU recebe malhas indexadas e uma pequena textura de estado; não se trata de deformar uma imagem pronta.

A resposta do mouse usa a mesma propagação por distância de arco da seleção, com força dosada pela velocidade em pixels CSS por segundo. Uma passagem lenta gera uma onda suave; uma rápida gera uma expansão maior, com ganho limitado. Cada linha conserva até dois impulsos independentes, que continuam após a passagem e expiram em 1,15 s. Não se reinicia uma onda ativa para acompanhar o cursor, nem se emitem ondas com o ponteiro parado. O alcance controla a região inicial de contato; a onda segue pela própria curva. Resposta controla sua força e retorno regula o amortecimento. O impulso da seleção mantém seu ganho separado. Limiares de velocidade, ganho e rearmamento ficam em `atlas-pointer-impulse.ts`; os controles existentes continuam locais.

As malhas intermediárias usam sete valores Float32 por vértice; pesos redundantes e buffers da antiga deformação em CPU foram retirados. Buffers de geometria são pré-dimensionados, sem grandes listas intermediárias, e o envio de estado por quadro não cria arrays temporários por linha. A preparação de malhas/texturas ainda é repetida quando muda o enquadramento do raster; esse custo é distinto da animação contínua.

Os parâmetros aprovados em `atlas-motion-settings.ts` são: cenário ativo, respiração **90**, resposta **85**, alcance **65 px**, retorno **86** e impulso **75**. A duração do impulso é compartilhada com o shader. A atualização mira 60 redesenhos/s conforme a cadência do navegador, integrando a resposta pelo tempo transcorrido. O loop para em aba oculta, fora da área visível ou com movimento reduzido. Desabilitar o movimento restaura a paisagem em repouso.

Alças estreitas recebem uma margem local de deformação baseada em curvatura e proximidade de outras partes do mesmo contorno. A restrição se espalha suavemente pelo arco, inclusive na emenda fechada, e satura a soma das ondas do ponteiro e do impulso da seleção. Os limites são pré-calculados e armazenados em WeakMap; não existe busca de colisões por quadro. Isso protege contornos fechados frágeis, sem resolver colisões entre curvas diferentes ou uma geometria de origem arbitrária que já tenha interseções.

## Entrada da página

Após preparar o primeiro desenho, as próprias curvas crescem e se desenrolam em uma entrada de **2.200 ms**. A ordem de início parte da esquerda, com leve influência vertical, mas o avanço percorre o comprimento de cada traçado. Não existe máscara espacial de opacidade sobre o terreno. Nome e descrição permanecem visíveis; os projetos/rótulos aparecem quando o crescimento da curva mais próxima chega à sua região.

`atlas-growth.ts` escolhe um ponto de origem por curva e mantém o progresso em distâncias de arco. Contornos fechados crescem em duas direções e se reencontram; abertos também podem crescer para ambos os lados da origem. Apenas as duas pontas de cada curva são amostradas por quadro. Esses poucos parâmetros seguem na textura de estado para a GPU. O vertex shader mantém a parte ainda não formada recolhida nas pontas, abre gradualmente a espessura e aplica uma pequena flexão que se acomoda atrás do avanço. A flexão respeita os limites locais dos contornos fechados e a proteção da introdução/projetos. A suavização de cobertura e o afinamento curto das pontas evitam pontes visíveis entre os dois braços ainda separados de uma alça.

Ao completar, o shader volta ao caminho original exato, sem o estágio de crescimento. Relevo, cores, espessuras, posições e movimento contínuo finais permanecem os aprovados. A malha não é regenerada por quadro; durante a entrada, a CPU atualiza apenas o estado por curva. Depois dela, não calcula pontas ou flexões de crescimento. Planos de entrada não são preparados durante o zoom/recorte quando o mapa já está completo.

`atlas-entrance.ts` usa um ciclo finito. Com movimento contínuo ativo, atualiza apenas o progresso e os elementos HTML; o loop existente desenha o terreno. Com o cenário parado, a entrada solicita os desenhos necessários. Ao completar, cancela seu ciclo, remove os ouvintes temporários e limpa os estilos de entrada. A aparição de cada projeto usa o ponto mais próximo do relevo e a respectiva chegada do crescimento, em vez de uma coordenada de cortina compartilhada.

A entrada ocorre uma vez por montagem e não reinicia com controles, seleção/fechamento, fontes ou mudança de conteúdo/idioma no mesmo componente. Selecionar um projeto, usar Tab, rolar ou redimensionar encerra a entrada e preserva a interação normal. Movimento reduzido, recuperação estática, página oculta ou posição de rolagem já restaurada mostram o mapa completo. Alterar a preferência durante a entrada também a encerra. O ciclo duplo de efeitos do modo estrito de desenvolvimento é respeitado. Sem JavaScript, o estilo `noscript` mantém os nomes visíveis como antes, sem tornar os cards interativos.

Validação em produção: 15 cenários cobriram crescimento progressivo na Home/prévia PT/EN, desktop/mobile e 760/761 px; geometria reaproveitada; seleção durante a entrada; Tab, rolagem, resize, preferência, perda de contexto e navegação; início reduzido/estático e entrada com movimento contínuo desligado. Oito verificações adicionais de páginas/cards PT/EN passaram. Amostragem de 264 pontas e 264 chegadas conferiu o percurso original; 96 comparações por transform feedback verificaram as posições e o recolhimento inicial (erro máximo inferior a 0,00002 px). Outras 60 comparações confirmaram o movimento aprovado após completar. Em 1.482 combinações amostradas de alças fechadas, fases e escalas, as partes formadas da linha central não apresentaram auto-interseção; não é garantia para qualquer nova composição ou para espessuras arbitrárias. Capturas intermediárias desktop/mobile foram inspecionadas visualmente. A avaliação física permanece pendente.
Validação da resposta por velocidade: passagens lentas e rápidas no navegador confirmaram forças diferentes, propagação após a saída e repouso sem redesenhos contínuos com respiração desligada. Sessenta comparações das posições calculadas pelo shader conferiram ondas do ponteiro e seleção independentes. Foram repetidos os 15 cenários de entrada e verificados movimento reduzido, desativação, resposta zero e abertura/fechamento por toque simulado. A sensação do novo efeito ainda depende da revisão do usuário; não houve teste em celular físico nesta rodada.

## Compatibilidade

Sem WebGL 2, com falha de inicialização, superfície incompatível ou perda do contexto, o componente remonta um Canvas estático. Ele desenha o mesmo campo, cores e espessuras em repouso, sem montar o controlador de movimento ou um loop permanente. Câmera, miniaturas, cards, links e teclado continuam funcionais. Uma seleção em andamento é encerrada na recuperação e os ajustes locais de terreno são preservados. A página informa “Visualização simplificada ativada”. Recarregar permite tentar WebGL novamente.

A recuperação estática é um caminho pequeno de compatibilidade, não a implementação animada antiga. Recursos e ouvintes WebGL são liberados ao desmontar.

## Enquadramento e interação

Mundos: **1440×790** no desktop e **390×1160** no mobile, com breakpoint em **760 px**. Escala uniforme preserva as proporções. Desktop ocupa a área disponível sem rolagem vertical; mobile conserva rolagem proporcional. Terreno, cores e marcadores compartilham as mesmas coordenadas.

A raiz do Atlas usa overflow-anchor: none. A câmera e as miniaturas mudam de posição durante a seleção; o navegador não deve usar esses elementos como âncoras automáticas da rolagem do documento. A regra fica restrita ao mapa e preserva a rolagem manual no mobile. Sem ela, foi reproduzido um salto de scrollY de 160 para 497 px durante a abertura, seguido de outra mudança ao fechar. Após a correção, 45 ciclos nos seis projetos (390 px com mouse e toque simulado, 384, 760 e 761 px) mantiveram a rolagem e a posição da área do mapa estáveis em todos os quadros amostrados. Foram verificadas a rolagem após fechar e as regressões de recuperação estática, perda de contexto, fechamento antecipado, movimento reduzido e breakpoint. A gravação fornecida foi inspecionada, mas não houve nova validação em aparelho físico.

Antes do zoom, os limites inversos da câmera estendem o terreno por todo o trajeto. A densidade do raster reserva o zoom máximo de 1,85 desktop / 1,65 mobile, com DPR base limitado a 2 e orçamento de 24 milhões de pixels / 8192 por lado. O recorte durante a transição reduz a superfície redesenhada mantendo a geometria. A densidade inicial volta ao terminar o fechamento; não se redimensiona o backing store a cada quadro.

Câmera e abertura total do card compartilham uma transição de **400 ms**. A miniatura HTML é colocada dentro do card antes do primeiro quadro; imagem, borda e corpo viajam em um único contêiner. Não há imagem voando em uma camada separada nem transferência ao chegar. O contêiner usa escala uniforme para preservar as proporções; a altura da mídia é compensada em 33 quadros-chave preparados uma vez por seleção. O corpo se abre para baixo durante o percurso. A borda da miniatura se desfaz quando o corpo começa a abrir, e os cantos se acomodam continuamente até o formato final.

O enquadramento final fica ancorado durante a abertura, evitando que a mudança de altura recentralize o card a cada quadro. Apenas um espaço de scrollbar realmente presente é reservado; medidas de conteúdo arredondadas não devem criar uma faixa artificial na imagem. Ao concluir, os estilos normais assumem sem mudar o pai, o tamanho ou a posição da imagem. O fechamento usa a camada de transformação para devolver a mesma miniatura ao mapa; captura escala, altura e cantos correntes para permitir interrupção da abertura. O botão externo some no início da saída. Imagem, título e ação mantêm seus destinos localizados. Modal nativo, foco, Escape, clique externo e interrupções por resize/movimento reduzido permanecem.

Validação: 30 ciclos nos seis projetos em 1440, 384, 760, 761 e 844 px, incluindo hover antes de selecionar em desktop; 210 quadros amostrados conferiram identidade do elemento e permanência dentro da mídia. A diferença máxima da caixa inicial foi inferior a 0,003 px; não houve alteração da caixa ao encerrar a abertura. Quinze fechamentos interrompidos preservaram a caixa corrente, com diferença inferior a 0,016 px. O placeholder também foi conferido. Home/prévia PT/EN e os caminhos de recuperação passaram nas verificações de regressão. Capturas intermediárias desktop/mobile foram inspecionadas; a avaliação física e a percepção final do movimento dependem da revisão do usuário.

Hover e foco em dispositivo com ponteiro fino ampliam a miniatura em 20%, sem mover o título. A miniatura pede resolução pequena, incluindo a ampliação de hover; a imagem maior só é montada na seleção. A pequena permanece visível até a maior carregar/decodificar e aparecer em 120 ms. Falha da maior conserva a pequena; imagem ausente/falha da miniatura conserva o placeholder. Fechar desmonta a camada maior, que pode aproveitar cache HTTP em nova abertura.

## Do card para a página do projeto

As capas do Atlas e do hero compartilham uma identidade por slug em components/projects/ProjectCoverTransition.tsx. O componente usa ViewTransition do React disponibilizado pelo App Router instalado, sem biblioteca adicional ou flag experimental. No desktop, o destino inclui a imagem, o degradê e os textos já sobrepostos no hero; no mobile, os textos abaixo da capa acompanham a entrada da página. A transformação dura --motion-project-cover (520 ms em styles/tokens.css); a saída do mapa/card dura 160 ms e a entrada do conteúdo usa 360 ms com 100 ms de atraso. Os pseudo-elementos de transição pertencem ao documento, por isso seus estilos ficam em styles/globals.css.

Imagem, título e ação usam Next Link com hrefs localizados derivados do projeto selecionado e pré-carregamento da rota. A miniatura mantém sua árvore React original mesmo sendo movida para dentro do card. Por isso, o controlador recebe o clique real no DOM e entrega a navegação ao hook, que usa startTransition/router.push. Isso evita recarga completa especificamente no clique da imagem. Cliques modificados, nova aba e downloads conservam o comportamento do navegador; dados sem destino não disparam navegação.

Ao abrir o card, prepareProjectCover escolhe e decodifica a imagem com getImageProps e os mesmos sizes do hero; o clique normal reutiliza esse preparo. Enquanto aguarda, o card permanece visível, com aria-busy e indicação discreta de espera. Cada tentativa é limitada a 1,8 s. Falha/tempo excedido desativa o par de imagem nesta navegação e mantém uma entrada simples; movimento reduzido ou ausência da API pula a espera e a transformação. Fechar o card durante a preparação cancela a navegação ainda não enviada. Cliques repetidos não iniciam preparações simultâneas.

A limpeza de layout libera o modal e a trava do body antes de medir/focar o destino. A limpeza passiva continua liberando os demais recursos da cena. Restaurar o scroll da Home na desmontagem sobrescreveria o enquadramento do detalhe; apenas o fechamento normal devolve a rolagem salva. Essa ordem também evita um deslocamento ao reaparecer a barra de rolagem no desktop. Não são mantidas cópias manuais da imagem entre rotas nem criada outra câmera de navegação.

Verificação desta rodada: build de produção, TypeScript e lint; 24 navegações nos seis projetos, PT/EN, desktop e mobile simulado, cobrindo os três links e teclado. Foram conferidos navegação no mesmo documento, capa pronta na captura, ausência de modal bloqueando o destino e estabilidade do hero até o fim, também com scrollbars visíveis. Casos adicionais cobriram voltar ao mapa, nova aba, ausência da API, movimento reduzido e carregamento lento de rota/imagem. Testes de falha/timeout da imagem e cancelamento durante a preparação passaram. A navegação de volta mantém o funcionamento normal do histórico; a transformação compartilhada é priorizada no percurso card → detalhe. Capturas intermediárias foram inspecionadas; não houve teste físico no S23 ou revisão em outros navegadores nesta rodada.

### Preparo antecipado da navegação

Ao selecionar um projeto, useAtlasScene chama router.prefetch e prepara a capa responsiva do detalhe. O clique reutiliza a mesma promessa; não começa outro download enquanto ela estiver pendente. Uma mudança de largura/DPR exige novo preparo; falhas e timeout permitem nova tentativa. A navegação mantém o limite de espera de 1,8 s e o fallback visual existente. Somente o projeto selecionado é preparado. A pré-geração e a revalidação das páginas estão descritas no README da raiz.

## Diagnóstico local

Na prévia, use `?motion=1`, `?terrain=1` ou ambos. Esses controles alteram apenas estado local, sem salvar no Sanity; recarregar descarta os ajustes. Na recuperação estática, o painel de movimento é ocultado. A Home não expõe os painéis mesmo recebendo esses parâmetros.

O antigo parâmetro `renderer` não seleciona mais implementações: Home e prévia usam WebGL, com recuperação automática. Dados `data-*` do Canvas permitem conferir renderizador, geometria e resolução; o custo de JavaScript registrado não inclui execução assíncrona na GPU ou apresentação.

## Verificação e limites

Validação desta consolidação: build de produção Next/Turbopack, TypeScript e lint completo aprovados; 72 aberturas/fechamentos de cards na Home PT/EN em seis configurações de viewport/DPR (1440×900 DPR 1/2, 384×844 DPR 3, 760×900, 761×900 e 844×390), com foco, links, enquadramento e retorno do relevo. Mais 12 ciclos conferiram a recuperação estática desktop/mobile e o retorno exato de seu raster. Testes com movimento amostraram a cobertura do terreno durante os seis cards desktop e três casos de borda mobile. Falha de inicialização, perda de contexto durante o card, fechamento antecipado, breakpoint, movimento reduzido, cinco controles e preservação de ajustes locais foram verificados. Capturas da Home desktop/mobile e da recuperação estática foram inspecionadas visualmente. A preparação das rotações foi comparada em 12.544 amostras, todas idênticas ao campo anterior. A configuração publicada usada na revisão contém seis projetos e três territórios; não houve escrita de conteúdo, migração, mudança de schema, implantação ou alteração do protótipo independente.

A proteção geométrica anterior foi verificada em 3.744 combinações (desktop/mobile, três escalas, mouse/impulso fortes), eliminando os 910 casos com auto-interseção reproduzidos nesse conjunto. Comparações por transform feedback também verificaram as fórmulas de deslocamento. Esses resultados têm o alcance dos cenários testados, não são uma garantia para qualquer composição futura.

Mobile em navegador de desktop usa viewport/DPR simulados. O S23 foi confirmado pelo usuário antes da migração para shaders; o novo padrão ainda requer revisão física, inclusive aquecimento, consumo e uso prolongado. Outros navegadores também precisam de avaliação. O posicionamento automático de projetos e rótulos permanece fora do escopo.