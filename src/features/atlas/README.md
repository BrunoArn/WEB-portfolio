# Atlas — Home do portfólio

O Atlas é a Home em `/pt` e `/en`. A mesma composição e interação ficam disponíveis em `/pt/atlas-preview` e `/en/atlas-preview`, com `noindex` e controles opcionais. WebGL 2 é o renderizador padrão em todas essas páginas. O protótipo independente `atlas-poc` permanece como referência.

## Estrutura atual

| Arquivo | Responsabilidade |
| --- | --- |
| `AtlasMap.tsx` | Componente compartilhado pela Home e pela prévia; projetos HTML, card, controles locais e recuperação do renderizador. |
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

Antes do zoom, os limites inversos da câmera estendem o terreno por todo o trajeto. A densidade do raster reserva o zoom máximo de 1,85 desktop / 1,65 mobile, com DPR base limitado a 2 e orçamento de 24 milhões de pixels / 8192 por lado. O recorte durante a transição reduz a superfície redesenhada mantendo a geometria. A densidade inicial volta ao terminar o fechamento; não se redimensiona o backing store a cada quadro.

Câmera e transformação da miniatura duram **400 ms**, seguidas de **220 ms** de abertura do corpo do card para baixo. A mesma miniatura HTML é movida e devolvida ao mapa, com transição dos cantos inferiores. A borda da imagem some no início da abertura do corpo; o card conserva a cor do território. O botão externo de fechar some no início da saída. Imagem, título e ação apontam para o destino localizado existente. Modal nativo, foco visível, contenção de foco, Escape, clique externo e interrupção por resize/movimento reduzido permanecem.

Hover e foco em dispositivo com ponteiro fino ampliam a miniatura em 20%, sem mover o título. A miniatura pede resolução pequena, incluindo a ampliação de hover; a imagem maior só é montada na seleção. A pequena permanece visível até a maior carregar/decodificar e aparecer em 120 ms. Falha da maior conserva a pequena; imagem ausente/falha da miniatura conserva o placeholder. Fechar desmonta a camada maior, que pode aproveitar cache HTTP em nova abertura.

## Diagnóstico local

Na prévia, use `?motion=1`, `?terrain=1` ou ambos. Esses controles alteram apenas estado local, sem salvar no Sanity; recarregar descarta os ajustes. Na recuperação estática, o painel de movimento é ocultado. A Home não expõe os painéis mesmo recebendo esses parâmetros.

O antigo parâmetro `renderer` não seleciona mais implementações: Home e prévia usam WebGL, com recuperação automática. Dados `data-*` do Canvas permitem conferir renderizador, geometria e resolução; o custo de JavaScript registrado não inclui execução assíncrona na GPU ou apresentação.

## Verificação e limites

Validação desta consolidação: build de produção Next/Turbopack, TypeScript e lint completo aprovados; 72 aberturas/fechamentos de cards na Home PT/EN em seis configurações de viewport/DPR (1440×900 DPR 1/2, 384×844 DPR 3, 760×900, 761×900 e 844×390), com foco, links, enquadramento e retorno do relevo. Mais 12 ciclos conferiram a recuperação estática desktop/mobile e o retorno exato de seu raster. Testes com movimento amostraram a cobertura do terreno durante os seis cards desktop e três casos de borda mobile. Falha de inicialização, perda de contexto durante o card, fechamento antecipado, breakpoint, movimento reduzido, cinco controles e preservação de ajustes locais foram verificados. Capturas da Home desktop/mobile e da recuperação estática foram inspecionadas visualmente. A preparação das rotações foi comparada em 12.544 amostras, todas idênticas ao campo anterior. A configuração publicada usada na revisão contém seis projetos e três territórios; não houve escrita de conteúdo, migração, mudança de schema, implantação ou alteração do protótipo independente.

A proteção geométrica anterior foi verificada em 3.744 combinações (desktop/mobile, três escalas, mouse/impulso fortes), eliminando os 910 casos com auto-interseção reproduzidos nesse conjunto. Comparações por transform feedback também verificaram as fórmulas de deslocamento. Esses resultados têm o alcance dos cenários testados, não são uma garantia para qualquer composição futura.

Mobile em navegador de desktop usa viewport/DPR simulados. O S23 foi confirmado pelo usuário antes da migração para shaders; o novo padrão ainda requer revisão física, inclusive aquecimento, consumo e uso prolongado. Outros navegadores também precisam de avaliação. O posicionamento automático de projetos e rótulos permanece fora do escopo.