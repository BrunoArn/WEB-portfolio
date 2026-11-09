# Atlas no Sanity

Os dados publicados controlam a Home, a prévia e os fundos das páginas internas. Projetos definem posição, influência e território principal; categorias definem cor e nome do território; `atlas-settings` reúne os controles gerais e as massas de suporte. O site não distribui pontos nem evita colisões automaticamente.

O [guia técnico do Atlas](../src/features/atlas/README.md) descreve renderização e interação. Os valores publicados consultados em **09/11/2026** ficam em [ATLAS-COMPOSITION.md](ATLAS-COMPOSITION.md), separados destas instruções. O Sanity é a fonte de verdade após novas edições; tabelas no Git não atualizam o CMS.

## Abrir e editar

Siga o [README do Studio](README.md) para iniciar `http://localhost:3333`. O acesso requer login e permissão no projeto. `localhost`, `127.0.0.1` e IP da rede são origens diferentes para CORS.

1. Em **Category → Atlas — território**, habilite **Usar como território no Atlas**. Preencha cor, nome PT/EN e posições do nome em desktop/celular. A categoria também pode classificar projetos sem ser um território.
2. Use nomes consistentes com as categorias: Jogos / Games, Desenvolvimento Web / Web Development e Experiências Interativas / Interactive Experiences na composição registrada. `name` e `atlas.label` são campos independentes; alterar um não sincroniza o outro.
3. Em **Project → Atlas — mapa**, habilite **Participar do Atlas**, escolha território principal, posições e influência. O seletor oferece categorias já associadas ao projeto e habilitadas como território. Mudar a ordem das categorias não substitui essa escolha.
4. Publique categorias antes de projetos dependentes. Remover/desabilitar uma categoria não revalida nem republica todos os projetos automaticamente.
5. Publique e recarregue `/pt/atlas-preview` e `/en/atlas-preview` para conferir os dados atuais. Essa rota busca dados publicados sem cache; rascunhos não aparecem. Confira depois a Home e o detalhe no ambiente que recebe o webhook.

Os objetos Atlas são opcionais em documentos antigos. Ao habilitá-los, a validação exige os campos necessários. Uma configuração inválida pode retirar o projeto do mapa e aparecer nos diagnósticos; não há fallback automático para a primeira categoria nesse processo. O fallback de accent dos cards fora do mapa é uma regra separada.

## Posições e influência

X/Y vão de 0 a 100: esquerda→direita e topo→base. Desktop e mobile são independentes. A posição do projeto é a âncora do ícone; mover essa posição também muda relevo e cores. A posição do nome da categoria move apenas o texto, sem mudar seu território.

No mobile, pontos com X maior que 50 colocam o texto à esquerda; os demais, à direita. O texto ocupa espaço além do círculo. Revise nomes longos e metadados nos dois idiomas, especialmente até 380 px. Só separar os ícones não garante que os rótulos não se sobreponham.

Influência aceita **0 a 2**, com padrão 1 quando vazia. Zero mantém marcador, imagem, card, categoria e navegação, sem gerar relevo ou espalhar cor. Também não entra na contagem de fontes isoladas/agrupadas. Valores positivos continuam afetando terreno e cor; a influência é compartilhada pelos perfis desktop/mobile.

Massas de suporte são independentes dos projetos. Se todos os projetos tiverem influência zero, as curvas que as massas gerarem usam o fallback neutro. A presença de uma massa não garante curvas: o campo pode ficar abaixo do primeiro nível de contorno. Sem fontes de relevo, não há curvas para desenhar.

## Ícone e capa

**Ícone do Atlas** (`atlas.icon`) é opcional, aceita PNG/WebP e permite crop/hotspot. Prefira imagem quadrada com margem para a máscara circular. O mesmo arquivo atende PT/EN; a identificação acessível usa o título localizado.

A bolinha já exibe o ícone: prioridade ícone válido → capa → placeholder. O adaptador usa `@sanity/image-url`, saída quadrada de 256×256 e formato automático; `sizes` escolhe a resolução efetivamente transferida. O card aberto e a transição para o detalhe continuam usando a capa, não o ícone. A borda da bolinha é 2 px.

O ícone permanece montado durante a seleção para suavizar o retorno. Capas transparentes podem revelar essa camada abaixo; isso não modifica os arquivos. Trocar o ícone não muda posição, território ou relevo. Campos novos só aparecem no Studio executado a partir do código atualizado.

## Topografia

**Atlas — Topografia** edita o singleton `atlas-settings`. Há cinco controles separados por perfil: Amplitude, Alongamento, Direção, Conexão e Respiro. A referência do código é 50 nos controles de 0–100 e 0 na Direção (-90 a 90°). Ela não é uma cópia dos valores publicados.

**Restaurar referência deste perfil** altera somente os cinco números do perfil no rascunho; não altera projetos, categorias, outro perfil ou regiões. Publicar aplica o resultado. Sem documento publicado, o site usa os padrões de `shared/atlas-terrain-settings.ts`.

Para experimentar sem salvar, abra `/pt/atlas-preview?terrain=1` ou a rota EN. Sliders alteram só o estado local, perdido no reload. Para persistir uma escolha, transfira os valores ao Studio e publique. `?motion=1` também é local; não é um campo persistente do CMS.

## Massas e vales independentes

Em **Regiões de composição**, cada item tem nome interno, tipo Elevação/Vale e perfis desktop/mobile. Cada perfil define habilitação, centro, intensidade, formato, dimensões e inclinação. Intensidade é positiva; o tipo determina se soma ou subtrai. Centros aceitam -50 a 150%, dimensões de 0,1 a 100%, intensidade de 0 a 2 e rotação de -180 a 180°.

Uma lista ausente usa as oito regiões de referência em `shared/atlas-composition-regions.ts`; lista vazia remove as regiões. Desabilitar um perfil remove aquela fonte somente naquele perfil. As regiões não criam marcadores ou categorias e não fornecem cor própria.

**Carregar regiões da referência no rascunho** prepara os valores do código para editar e exige publicação. Regiões já publicadas conservam seus valores até uma edição explícita. Restaurar a referência pode alterar a direção de arte: não a use para recuperar uma composição editorial sem consultar o registro correspondente.

## Atualização e publicação

Publicar conteúdo no Sanity altera o dataset independentemente de commit, push, PR ou deploy. Mudanças em schema/componentes do Studio dependem do código atualizado do Studio; alterações do frontend dependem do deploy do site. São operações distintas.

A Home e os fundos usam cache de uma hora como recuperação e invalidação assinada por webhook. A prévia publicada é fresca por requisição. O webhook enviado ao Railway não invalida seu servidor local. Recarregue abas após publicar; não há atualização ao vivo. Consulte [cache](../src/sanity/CACHING.md) e [webhook](../src/sanity/WEBHOOK.md).

## Conferência e fontes

- Confira ícones/capas, categorias, PT/EN e foco/abertura/fechamento dos cards.
- Confira 320/360/390/760 px, desktop e a transição 760→761 px; revise rótulos e limites da tela.
- Observe relevo e mistura de cores após incluir/remover um projeto ou mudar influência/posição.
- Confira os fundos da listagem, About e detalhe, pois reutilizam os mesmos dados.
- Teste scroll e ondas em celular físico após mudanças de interação; emulação não comprova a sensação no aparelho.

Regras do Studio: `schemaTypes/atlas/atlasValidation.ts`, `schemaTypes/objects/atlasCategorySettings.ts`, `atlasProjectSettings.ts`, `atlasPosition.ts`. Adaptação pública: `src/features/atlas/atlas-content.ts`. As verificações automatizadas são executadas na raiz conforme o README; validação/build próprios do Studio estão no seu README.
