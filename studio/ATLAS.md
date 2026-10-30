# Atlas no Sanity — configuração e conferência

Os campos Atlas agora controlam a prévia: projetos habilitados e publicados determinam posições, influência e território principal; as categorias determinam cores e rótulos. A Home permanece preservada. Nenhum documento foi alterado, preenchido ou publicado automaticamente, e esta revisão não implantou o Studio hospedado.

## Abrir e revisar

O Studio local está em **http://localhost:3333/**. Se não estiver rodando, execute `npm run dev` dentro de `studio`. Use localhost; o endereço 127.0.0.1 pode exigir uma origem CORS diferente.

1. Em **Category**, abra uma categoria e encontre **Atlas — território**.
2. Habilite **Usar como território no Atlas** para editar a cor, nome curto PT/EN e posições do nome no desktop/celular. O seletor visual e o campo hexadecimal editam a mesma cor. Uma categoria desabilitada continua disponível para classificar os projetos.
3. Em **Project**, abra um projeto e encontre **Atlas — mapa**. Habilite **Participar do Atlas** para editar território principal, posições e influência.
4. O seletor de território principal mostra somente categorias já associadas ao projeto e habilitadas como território. Esta escolha explícita tem prioridade; mudar a ordem das categorias não troca a prioridade.
5. Revise as categorias primeiro e publique-as antes dos projetos quando for adotar a configuração. Depois de publicar, recarregue a prévia para ver o resultado. Rascunhos não alteram o mapa.

Os campos Atlas são opcionais nos documentos antigos. Ao habilitá-los, a validação exige os dados necessários. Posições usam porcentagens: X = esquerda (0) até direita (100); Y = topo (0) até base (100). Desktop e celular têm configurações próprias. A influência aceita 0,1 a 2; 1 ou vazio significa intensidade padrão.

## Valores de referência da composição atual

Estes valores são um guia, **não uma migração executada**. As posições dos rótulos abaixo correspondem à composição desktop ampla; os rótulos agora usam diretamente as posições do Sanity.

| Categoria existente | Território | Cor | Nome curto PT / EN | Rótulo desktop X/Y | Rótulo celular X/Y |
| --- | --- | --- | --- | --- | --- |
| game | Sim | #A4B58C | Games / Games | 45 / 19 | 64 / 25 |
| web-development | Sim | #88AEB8 | Web / Web | 81 / 29 | 64 / 57 |
| interactive-experiences | Sim | #C39374 | Interactive / Interactive | 51 / 88 | 43 / 94 |
| vr | Não | — | — | — | — |

Os nomes curtos são editáveis nos dois idiomas; a tabela conserva a identidade atual. O nome completo da categoria usado no restante do site permanece independente.

| Projeto publicado | Território principal | Projeto desktop X/Y | Projeto celular X/Y | Influência |
| --- | --- | --- | --- | --- |
| Bloomancer | game | 43 / 27 | 30 / 29 | 1 |
| Hungry Worm | game | 25 / 47 | 67 / 39 | 1 |
| 2D RPG Project | game | 57 / 48 | 28 / 46 | 1 |
| Portfólio Gabriela | web-development | 79 / 24 | 53 / 61 | 1 |
| Forensic Injury Visualizer | interactive-experiences | 73 / 65 | 67 / 80 | 1 |
| VR Quintandinha | interactive-experiences | 62 / 82 | 28 / 88 | 1 |

Apple Academy · BGS 2019 não consta entre os projetos publicados e não deve ganhar um documento inventado para preencher o mapa. Sua antiga elevação foi removida. O gerador combina projetos ativos com as massas e vales de composição explicitamente configurados; não há influência reservada para esse projeto.

## Estrutura e validação

- `category.atlas`: `isTerritory`, `color` (#RRGGBB), `label.pt/en` (até 30 caracteres), `desktop/mobile`.
- `project.atlas`: `enabled`, referência `territory`, `desktop/mobile` e `influence`.
- `atlasPosition`: objeto compartilhado com `x/y` entre 0 e 100.
- `schemaTypes/atlas/atlasValidation.ts`: regras testáveis e confirmação de que a referência está habilitada como território. A leitura considera o rascunho da categoria antes da versão publicada para validar a edição; publique as categorias primeiro.
- `schemaTypes/atlas/AtlasColorInput.tsx`: seletor nativo de cor e entrada padrão do Sanity, sem dependências novas.

Não há desempate automático pela primeira categoria. Se a categoria principal for removida do projeto, excluída ou desabilitada, o Studio aponta a inconsistência ao validar o projeto. Alterar outra categoria não revalida/publica todos os projetos automaticamente; a prévia também trata configurações incompletas e referências inválidas, separando os projetos sem posicionamento válido.

Verificações executadas: TypeScript do Studio, ESLint, build do Studio, validação oficial de esquemas (zero erros e avisos) e 29 verificações de validação, incluindo documentos antigos, ativação opcional, cores, limites de posição, prioridade explícita entre categorias, IDs de rascunho, categoria desabilitada e falha de conexão. O build informa o aviso preexistente de atualização automática sem appId; a configuração de publicação não foi modificada.

A abertura renderizada em localhost chegou à tela de login sem erros JavaScript. Não foi possível inspecionar os formulários autenticados nesta sessão; a edição visual do seletor e a busca real de referências aguardam a revisão com login. Nenhum clique de edição foi feito em documentos reais. Os scripts e a captura ficam no workspace desta conversa em `.work/atlas-studio/`.

Integração do terreno: consulte [a documentação da prévia](../src/features/atlas/README.md). As novas publicações precisam de revisão visual: o posicionamento dos projetos continua manual.

## Atlas — Topografia

No menu principal do Studio, abra **Atlas — Topografia**. Esse documento único reúne os controles gerais; não é necessário editar cada projeto para ajustar o estilo do mapa.

Desktop e celular têm cinco controles separados: **Amplitude**, **Alongamento**, **Direção**, **Conexão** e **Respiro**. Use 50 nos controles de 0–100 e 0 na direção (-90 a 90 graus) como referência inicial. Os próprios campos explicam o efeito. **Restaurar referência deste perfil** repõe somente os cinco números do perfil escolhido, sem alterar projetos, categorias ou o outro perfil.

Os controles de referência são um ponto de partida para revisão visual. Para aplicar, publique o documento e recarregue a prévia. Sem documento publicado, os mesmos padrões são usados. O Studio hospedado precisa receber esta versão do código para exibir os campos; esta entrega não executa deploy.

Para experimentar sem salvar, abra [a prévia de ajustes locais](http://localhost:3000/pt/atlas-preview?terrain=1). Esses sliders não gravam no Sanity e se perdem ao recarregar. Depois de escolher os valores, transfira-os ao perfil correspondente no Studio e publique. A URL normal da prévia não mostra os controles.

As massas e os vales de direção de arte são fontes independentes, que podem continuar sem projetos. Apple Academy continua ausente. A configuração não faz distribuição automática nem corrige todos os possíveis conflitos entre rótulos.

## Massas auxiliares independentes

A direção atual permite massas e vales de composição que continuam existindo independentemente dos projetos. Em **Atlas — Topografia → Regiões de composição**, clique **Carregar regiões da referência no rascunho** se a lista ainda não estiver preenchida. Isso prepara as oito regiões de referência para edição; não publica automaticamente.

Cada região tem nome interno e tipo **Elevação** (soma volume) ou **Vale** (subtrai volume). Abra Desktop/Celular para ativar, posicionar e ajustar a intensidade. Escolha um formato simples ou **Personalizado** para editar largura/altura; a inclinação fica em Formato avançado. X/Y podem sair do intervalo 0–100, permitindo centros além das bordas. Use valores negativos de posição quando necessário, mas mantenha intensidade positiva; o tipo define se ela soma ou subtrai.

Publique e recarregue a prévia para aplicar. Uma lista ausente usa a referência; uma lista vazia remove as regiões. Desativar um perfil remove a região apenas naquele tamanho. Os controles gerais continuam disponíveis, e restaurar um perfil geral não sobrescreve a lista de regiões.

No desktop, a referência recupera os arcos/vales do modelo antigo com os seis projetos existentes. No celular, as massas de referência foram alargadas e achatadas, com pequenas inclinações, para conduzir o olhar lateralmente. Regiões já publicadas mantêm seus valores; restaurar a lista de referência no rascunho carrega essa nova direção mobile e requer publicação para aplicar. Apple Academy não foi recriado. As cores continuam seguindo as categorias dos projetos atuais, portanto algumas diferenças cromáticas locais são esperadas em relação a imagens que ainda incluíam aquele projeto. Sem projetos, massas independentes usam uma cor neutra.

## Conferência dos controles — 29/10/2026

A validação técnica dos controles passou: os cinco parâmetros gerais alteram o campo nos dois layouts; regiões respondem a posição, dimensões, formato, inclinação, intensidade e ativação; elevações somam e vales subtraem. Foram conferidos perfis separados, remoção/ativação/influência dos projetos, prioridade explícita do território, cores, PT/EN, limites e referências ausentes. Os dados publicados atuais retornaram seis projetos, três territórios e nenhuma inconsistência nos dois idiomas.

O documento `atlas-settings` está publicado, com oito regiões. A configuração lida na revisão tem amplitude 52 no desktop e 50 no celular, com os demais controles em 50 e direção 0. Os dois perfis têm sete regiões ativas. A prévia de produção confirmou esses valores. Nenhum dado do Sanity foi alterado nesta conferência.

Os componentes personalizados foram exercitados isoladamente com suas funções reais e patches reais do Sanity: sliders, limites, valores vazios, reset somente do perfil escolhido, carregamento/restauração das regiões, cor, campos somente leitura e filtro de território. Isso testa os callbacks e a renderização estática dos componentes, não substitui a edição no formulário completo. A prévia renderizada passou dez ajustes/restaurações em desktop/celular, preservação dos marcadores, isolamento dos perfis e descarte das alterações locais no reload.

Validação oficial dos esquemas: zero erros/avisos. TypeScript, ESLint e build do Studio passaram. O build mantém o aviso de auto-update sem appId e informa versões locais 6.20.0 versus runtime 6.21.0; as dependências e a configuração de atualização não foram modificadas. As descrições de Conexão e do perfil Celular foram atualizadas para refletir massas independentes e a composição lateral atual.

A conferência técnica e da integração dos dados publicados foi concluída: os valores publicados chegaram ao Canvas de produção, uma alteração local não gravou no CMS e o reload recuperou o publicado. O agente não executou nova edição autenticada, salvamento de rascunho ou publicação; os callbacks dos formulários foram testados isoladamente. Scripts e resultados estão no workspace da conversa em `.work/atlas-control-audit/` e `.work/atlas-final/`; não houve deploy nem alteração da Home.

## Revisão final da integração — 29/10/2026

A configuração publicada foi comparada com o Canvas da versão de produção nos dois layouts. No desktop, o ajuste local de amplitude foi levado a 0, restaurado para a referência 50 e, após reload, voltou ao valor publicado 52. No celular, o publicado 50 também foi recuperado. As oito regiões publicadas geraram sete fontes ativas por perfil. Projetos, categorias, prioridade explícita e idiomas passaram sem inconsistências. A verificação foi somente de leitura no CMS; não foi necessário alterar ou republicar conteúdo.

O build do Studio e a validação oficial dos esquemas passaram (zero erros/avisos), assim como os testes dos componentes e regras de validação. A diferença de versão do auto-update informada acima permanece uma ressalva do ambiente; não houve mudança de dependências. A edição autenticada do formulário completo não foi automatizada. A conferência de integração dos controles publicados está encerrada.
