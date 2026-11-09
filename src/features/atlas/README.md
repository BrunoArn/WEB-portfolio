# Atlas — manutenção e arquitetura

O Atlas é a Home em `/pt` e `/en`. `/pt/atlas-preview` e `/en/atlas-preview` usam o mesmo componente e os mesmos controladores, com `noindex`, dados publicados frescos e painéis opcionais. A Home usa o cache compartilhado do Sanity. A prévia não lê rascunhos.

Para edição no CMS, consulte [Atlas no Studio](../../../studio/ATLAS.md). Posições, influências e massas publicadas são consultadas no próprio Sanity; referências de código em `shared/` são apenas fallbacks.

## Onde alterar

| Responsabilidade | Arquivo |
| --- | --- |
| Estrutura, marcadores, introdução e card | `AtlasMap.tsx` |
| Aparência, largura dos rótulos e breakpoints do mapa | `AtlasMap.module.css` |
| Estado, montagem/limpeza, seleção, preparo de capa e navegação | `useAtlasScene.ts` |
| Leitura publicada | `src/sanity/repositories/atlas.ts` |
| Adaptação, imagens, idiomas, validação e projetos sem posição válida | `atlas-content.ts` |
| Dimensões, coordenadas, escala e câmera | `atlas-layout.ts`, `atlas-composition.ts` |
| Campo de relevo e influência espacial de cores | `atlas-field.ts` |
| Mistura RGB e fallback neutro | `atlas-color.ts` |
| Grade, contornos, fitas e prova conservadora de extensão vazia | `atlas-geometry.ts` |
| Cache de amostras, curvas atuais e repouso de uma cena | `atlas-geometry-cache.ts` |
| Canvas, textura, superfície, malha e ciclo do renderizador | `atlas-engine.ts` |
| Ponteiro, relógio e preparação do estado para GPU | `atlas-motion.ts` |
| Gestos de toque e amostragem passiva da rolagem | `atlas-touch.ts` |
| Contato e impulsos limitados por linha | `atlas-pointer-impulse.ts`, `atlas-string-response.ts` |
| Referências do movimento, toque e duração das ondas | `atlas-motion-settings.ts` |
| Crescimento inicial e aparição dos elementos | `atlas-growth.ts`, `atlas-entrance.ts` |
| Malhas indexadas, shaders e recursos GPU | `atlas-webgl.ts` |
| Limites de deformação dos contornos fechados | `atlas-contour-safety.ts` |
| Zoom, modal, foco, transformação e retorno da miniatura | `atlas-interaction.ts` |
| Ícone, fallback para capa e camadas da imagem selecionada | `AtlasThumbnail.tsx` |
| Resolução, DPR, recortes e orçamento de raster | `atlas-raster.ts` |
| Fundos das páginas internas | `AtlasBackground.tsx`, `AtlasBackdrop.tsx`, `atlas-background-scene.ts` |

Os caminhos sem prefixo nesta tabela são relativos a esta pasta; o caminho `src/` parte da raiz do repositório.

## Dados e composição

O servidor carrega dicionário e dados publicados; `adaptAtlasContent` monta projetos e territórios. `AtlasMap` entrega referências HTML a `useAtlasScene`, que monta terreno, entrada e interação. O controlador do terreno prepara geometria e cores. O movimento atualiza o estado das linhas e a GPU desenha; mover o ponteiro não recalcula o campo inteiro.

- Um projeto participa com `atlas.enabled`, posições desktop/mobile válidas e território principal válido, pertencente às suas categorias. Configurações incompletas entram nos diagnósticos de projetos sem posicionamento válido.
- O território define nome, cor e posição independente do rótulo. Ele é exibido quando utilizado por algum projeto válido. Não há paleta fixa por ID nem influência reservada a projetos removidos.
- Posições de projeto alteram marcador, relevo e propagação de cor. Posições de rótulo alteram apenas o texto da categoria. Não há correção automática de colisões.
- Influência aceita **0 a 2**; ausente usa 1. Zero preserva marcador, imagem, card e navegação, mas exclui a fonte do relevo, da contagem de fontes isoladas/agrupadas e das cores. O cache inclui a influência na identidade.
- Massas de suporte e vales são independentes dos projetos. Sem fontes positivas de cor, as curvas que essas massas gerarem usam o fallback neutro compartilhado. Elas podem ficar abaixo do primeiro nível de contorno; sua existência não garante curvas visíveis.

Cada projeto com influência positiva fornece uma elevação gaussiana. Regiões auxiliares somam elevações ou subtraem vales; warp, suavização e extração de contornos completam o relevo. As cores também são calculadas a partir das posições e influências dos projetos, em um campo separado. Mudar uma posição exige conferir ambos os resultados.

`shared/atlas-terrain-settings.ts` resolve Amplitude, Alongamento, Direção, Conexão e Respiro, por perfil. A referência é 50 nos controles de 0–100 e 0° na Direção (-90 a 90°). Valores publicados substituem a referência.

`shared/atlas-composition-regions.ts` resolve as regiões auxiliares. Centros aceitam -50 a 150%; dimensões são dispersões gaussianas, não limites rígidos. `regions` ausente usa a referência do código; lista vazia remove as fontes auxiliares. Restaurar referências no Studio altera o rascunho e exige publicação. Referência do código e composição publicada podem ser diferentes.

## Coordenadas e layout

Os mundos são **1440×790** no desktop e **390×1160** no mobile; o breakpoint do mapa é **760 px**. Desktop ajusta a escala à área disponível. Mobile limita o plano a 390 px e preserva a rolagem vertical; em telas menores, acompanha a largura. O shell usa 48rem, por outra responsabilidade.

Coordenadas normalizadas no conteúdo vêm das porcentagens do CMS. Terreno e marcadores compartilham câmera e transformação. No mobile, `x > 50%` coloca o texto à esquerda do ícone; nos demais casos, à direita. A posição é a âncora do ícone, não o início do texto. Os nomes de território usam seu próprio ponto de posicionamento.

O bloco de marcador tem largura-base explícita de 260 px, limitada pelas regras compactas: 210 px em desktop intermediário, 190 px no mobile, 176 px até 380 px e 130 px em desktop de pouca altura. Isso impede que âncoras próximas da borda comprimam o texto antes da transformação. A fonte não encolhe automaticamente para corrigir colisões.

No mobile, a viewport reserva uma extensão de terreno equivalente a `--shell-footer-reserve`, e a raiz compensa essa reserva para o Footer transparente ficar sobre as curvas. O plano dos projetos permanece acima dessa extensão, com âncoras e escala preservadas; a câmera mobile é alinhada ao topo. A regra é local ao Atlas e não muda o Footer das páginas internas.

O mapa usa `overflow-anchor: none` para que transformações da seleção não mudem a rolagem do documento. A viewport mobile usa `touch-action: pan-y pinch-zoom`; não se bloqueia o scroll com `preventDefault()` ou `touch-action: none`.

Tokens globais e fontes ficam em `src/styles/tokens.css`, `globals.css` e no layout de idioma: Inter 900 nos títulos/marcadores, Geist em corpo e controles. Acento global âmbar suave; cores de categoria vêm do CMS. Regras de composição e câmera permanecem locais. O comportamento de Navbar/Footer está documentado no [mapa do código](../../../docs/CODE_ORGANIZATION.md).

## Movimento e toque

WebGL 2 é o renderizador animado. A CPU detecta o contato mais próximo com as curvas; o vertex shader propaga as ondas por distância ao longo do traçado. O fragment shader combina textura de cores e cobertura das bordas. A respiração usa estado interpolado; não há deformação por vértice em JavaScript a cada quadro.

O mouse aceita velocidades a partir de 8 px/s. O reforço suave de baixa velocidade desaparece nas altas. A faixa de contato começa em 18% do alcance e cresce suavemente até o alcance completo em velocidades altas, evitando perder passagens rápidas. Toque usa seu próprio perfil, com limiar de 25 px/s. Ambos compartilham propagação, dois impulsos por linha, cooldown de 180 ms e dissipação em 1,15 s; ponteiro parado não gera ondas novas.

`atlas-touch.ts` usa Touch Events passivos e scroll passivo, mantendo a amostragem durante a rolagem nativa mesmo quando o navegador cancela Pointer Events. Um tap exige um dedo, até 350 ms, deslocamento de até 10 px, ausência de scroll relevante e início fora de marcador/controle. Arrastar ou rolar deixa de ser tap; tocar no marcador mantém sua ação normal.

O movimento é amostrado no máximo a cada 16 ms, com velocidade limitada a 650 px/s e ganho de pressão de 0,65. A posição do contato é recalculada a partir das coordenadas reais do dedo e da transformação atual do canvas/scroll; só a energia recebe suavização. Ao terminar/cancelar o gesto, não há fonte presa ao dedo; ondas já emitidas dissipam normalmente. Scroll sem gesto de toque ativo não cria um ponteiro artificial.

As referências atuais em `atlas-motion-settings.ts` são: ativo, respiração 90, resposta 85, alcance 65 px, retorno 86 e impulso de seleção 75. O controlador mira 60 redesenhos/s conforme o navegador. Para em aba oculta, mapa fora de vista ou movimento reduzido, e libera seus recursos na desmontagem. Desabilitar o movimento restaura o repouso.

`atlas-contour-safety.ts` limita a deformação de alças frágeis por contorno/escala, com WeakMap. Não há busca de colisões por quadro. A proteção não garante ausência de interseções entre curvas diferentes ou em qualquer composição arbitrária.

## Entrada, seleção e navegação

A entrada dura 2.200 ms: as curvas crescem pelo comprimento do traçado; projetos e territórios aparecem conforme a chegada do crescimento. O plano é preparado para a entrada, não a cada quadro. A entrada ocorre uma vez por montagem. Seleção, Tab, scroll, resize, movimento reduzido ou página oculta encerram a entrada e deixam o mapa utilizável.

A câmera e a abertura do card compartilham 400 ms. O controlador move **a mesma miniatura HTML** entre mapa, card e camada de retorno, preservando sua árvore React. React mantém a estrutura e o estado; o controlador preenche os campos do card e faz a transformação. Os atributos `data-atlas-*` fazem parte desse contrato. O nome histórico `data-atlas-preview` também identifica a Home.

O marcador usa `atlas.icon`, com fallback para capa e depois placeholder. `markerImage` é independente de `image`, a capa do card/detalhe. A imagem pequena permanece montada; as camadas de capa existem durante a seleção e a maior aparece após carregar. Fechar desvanece as capas antes de retornar ao ícone. Capas transparentes podem revelar o ícone abaixo: as camadas são sobrepostas; nenhum arquivo é modificado. A borda do marcador é 2 px e hover de ponteiro fino amplia a miniatura em 20%, sem mover o título.

Hover/foco/início de toque preparam a capa no tamanho do card. A seleção monta suas camadas antes da preparação síncrona do terreno. Após a capa carregar ou falhar, `useAtlasScene` prepara a rota do detalhe e a imagem do hero. O clique explícito prepara imediatamente e reutiliza uma promessa em andamento; o limite é 1,8 s. Fechar durante essa espera cancela a navegação ainda não enviada. Repetições não iniciam preparos concorrentes.

A foto já aceita clique durante a abertura; título e ação continuam com seus destinos localizados. Escape, clique externo, foco e restauração do scroll são coordenados pelo modal. A desmontagem para navegar libera o modal/body sem restaurar o scroll da Home sobre o destino. Cliques modificados e nova aba mantêm o comportamento do navegador.

`src/components/projects/ProjectCoverTransition.tsx` identifica a capa por slug para View Transitions; estilos dos snapshots ficam em `globals.css`. Falha/timeout de imagem, movimento reduzido ou ausência da API mantêm a navegação com fallback visual.

## Geometria, cache e fundos

`atlas-geometry.ts` não importa DOM, React ou WebGL. `describe()` do cache resolve identidade/cobertura sem construir curvas; `prepare()` reaproveita ou constrói depois de descartar notificações redundantes.

| Estado | Dono e validade |
| --- | --- |
| Grade de amostras | Uma grade Float32 por cache de cena; identidade considera mundo, perfil, projetos/posições/influências, controles e regiões. Reuso apenas na cobertura válida. |
| Curvas atuais e de repouso | Uma entrada atual e uma referência para retorno; não há lista crescente por projeto. |
| Prova de extensão vazia | Geometria atual mais limites solicitados, incluindo a borda compartilhada; incerteza usa geração normal. |
| Leitor de cores | Um por configuração/ordem dos territórios no controlador; substituído ao mudar dados. |
| Superfície e malha | Assinaturas separadas de geometria, câmera, recorte, resolução e clareiras; mudar apenas o raster não reinicia ondas/malha desnecessariamente. |

`clear()` libera as referências do cache de cena. Desmontar invalida assinaturas, remove ouvintes/observadores e encerra renderizador e movimento. O RGB usa saída temporária reutilizável por chamador, sem cache global de pixels.

`atlas-background-scene.ts` compartilha a geometria e mantém até quatro promessas de cenas por processo, identificadas pelos dados. O SVG simplifica contornos e compacta comandos; a cor usa uma pequena imagem de paleta, não outro motor cartográfico. Não é um cache de conteúdo com prazo independente do Sanity.

Projetos e About usam o Atlas completo atenuado; o detalhe usa o enquadramento correspondente à seleção do projeto no Atlas. Os fundos são preparados no servidor para evitar aguardar WebGL no cliente. Falha de leitura ou projeto ausente do mapa permite omitir a decoração. Mudanças publicadas de geometria também afetam os fundos após a invalidação do conteúdo.

O terreno pode ser estendido antes do zoom pelos limites inversos da câmera. O raster reserva zoom máximo de 1,85 desktop / 1,65 mobile, DPR-base até 2, orçamento de 24 milhões de pixels e 8192 por lado. Câmera, conteúdo e geometria permanecem separados da resolução do desenho.

Sem WebGL 2, com falha/perda de contexto ou superfície incompatível, a cena remonta Canvas estático com o mesmo relevo/cor em repouso, sem loop permanente. Cards, links e teclado continuam ativos; ajustes locais de terreno são preservados e a seleção em andamento é encerrada. Recarregar tenta WebGL novamente.

## Diagnóstico e validação

Na prévia, `?motion=1`, `?terrain=1` ou ambos mostram controles locais. Recarregar descarta alterações; não gravam no CMS. A Home não expõe os painéis. O antigo parâmetro `renderer` não escolhe renderizador. Dados `data-*` do canvas ajudam a conferir estado, geometria e resolução; custo de JavaScript não mede o trabalho assíncrono da GPU.

Comandos na raiz: `npm run lint`, `npx tsc --noEmit`, `node --test tests/*.test.mjs`, `npm run build`. Os testes cobrem adaptação, geometria, influência zero, caches, fronteiras entre servidor/navegador, toque, movimento e navegação. Não trate uma contagem antiga de testes ou de projetos como contrato permanente.

Ao alterar composição/interação, conferir PT/EN, larguras de 320, 360, 390, 760/761 px e desktop, títulos longos, nomes dos territórios, limites da página, entrada, abertura/fechamento, teclado, scroll, movimento reduzido e fallback sem WebGL. Não há prevenção automática de sobreposição: novos projetos, textos e posições exigem revisão visual. Comprovar ganhos de desempenho por medição separada.

Em 09/11/2026, a composição mobile publicada foi conferida em 18 perfis de navegador (PT/EN × 320/360/375/380/381/390/414/760/1440 px), sem sobreposição de caixas de projetos ou entre rótulos de território e projetos nos perfis mobile. A verificação usou dados publicados e movimento reduzido; não certifica composições futuras, animação em todo quadro, aparelho físico ou todos os navegadores.
