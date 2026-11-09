# Organização do código

## Layout e estilos

| Responsabilidade | Fonte |
| --- | --- |
| Cores globais, fontes, escala de espaços, raios e movimento | `src/styles/tokens.css` |
| Largura máxima, margens, recuo da Home e reservas do shell | `src/styles/tokens.css`, grupo Layout |
| Base de HTML/body, integração Tailwind e transições entre páginas | `src/styles/globals.css` |
| Estrutura do documento, fontes carregadas, Navbar e Footer | `src/app/[lang]/layout.tsx` |
| Container das páginas internas | `src/components/layout/Container.tsx` |
| Navegação ativa e identificação do Atlas | `src/components/navigation/navigation-state.ts` |
| Aparência e estados específicos dos componentes | CSS Modules ao lado do componente e classes Tailwind no JSX |
| Mundo, limites e conversão de coordenadas do Atlas | `src/features/atlas/atlas-layout.ts` e módulos descritos no README do Atlas |
| Tamanho responsivo da capa/hero e preparação para navegação | `src/components/projects/ProjectCoverTransition.tsx` |

`--layout-content-inset` mantém Navbar e Footer alinhados ao Container nas páginas internas. `--layout-home-inset` governa o recuo na Home. As transições continuam nos módulos dos componentes.

O `globals.css` não deve concentrar toda regra de layout. Tokens reutilizados pertencem ao `tokens.css`; posicionamento de cards, proporções, estados e composição de cada seção permanecem locais. Coordenadas dinâmicas, transforms calculados e cores vindas do conteúdo usam estilos inline ou propriedades CSS específicas. Isso evita dependências globais sobre geometria e interação.

As strings `sizes` das imagens descrevem a largura renderizada para o navegador escolher o arquivo antes do CSS carregar; não aceitam tokens CSS como substitutos das condições e larguras. A capa do hero e o poster do jogo compartilham `projectHeroSizes`. Miniaturas, cards da listagem e relacionados têm larguras diferentes e mantêm suas próprias regras.

Os breakpoints do shell (48rem) e do mapa/jogo (760px) têm responsabilidades distintas. Não devem ser unificados apenas por serem próximos. Fallbacks de CSS anchor do fundo do Atlas também são intencionais.

## Textos e conteúdo

| Tipo de informação | Fonte |
| --- | --- |
| Textos de interface, labels, mensagens, acessibilidade e descrição global dos metadados | `src/i18n/dictionaries/pt.ts` e `en.ts` |
| Carregamento e tipo do dicionário | `src/i18n/get-dictionary.ts` |
| Idiomas suportados e idioma padrão | `src/i18n/config.ts` |
| Idioma inicial em URLs sem prefixo; URLs explícitas prevalecem | `src/i18n/preferred-locale.ts` e `src/proxy.ts` |
| Destinos fixos dos perfis do shell | `src/config/site.ts` |
| Projetos, categorias, About e conteúdo editorial | Sanity → repositories/queries → `src/content/adapters` → componentes |
| Campos editoriais e instruções do CMS | `studio/schemaTypes/` |

Nome e descrição do site ficam no grupo `site` dos dicionários. O título do Atlas reutiliza o nome na definição do dicionário. Metadados das páginas podem usar os textos da própria página ou do projeto, preservando a localização do CMS.

GitHub, LinkedIn, PT/EN e símbolos de controle são nomes/códigos invariantes, não frases sem tradução. Os nomes das marcas permanecem literais no Footer/menu; os labels acessíveis dos controles vêm do dicionário. Links profissionais editoriais do About continuam no Sanity, independentes dos dois destinos fixos do shell.

Erros internos, identificadores de campos e diagnósticos técnicos não são textos editoriais. Mensagens do Studio pertencem à interface editorial, que atualmente é em português; não devem entrar no dicionário do site público.

## Funcionalidades e contratos atuais

- Navbar: `src/components/layout/Navbar.module.css` define fundo opaco nas páginas internas e fade inferior de 32 px; páginas identificadas como Atlas preservam a sobreposição transparente. Desktop alinha à esquerda, mobile conserva seus controles. Footer e Navbar compartilham recuos, com transição e respeito a movimento reduzido.
- Cor de projeto: `src/content/adapters/project.ts` resolve a categoria e o fallback; `src/styles/accent.ts` aplica variáveis locais. O accent global continua independente das cores dos territórios.
- Listagem e relacionados: `src/sanity/repositories/projects.ts` usa `getProjectCards`/`adaptProjectCard` para dados leves. `summary` só aparece na listagem. O detalhe ordena relacionados por categorias em comum, completa com outros e limita a seis, excluindo o atual.
- Galeria: `src/features/project-detail/ProjectMediaPreview.tsx` coordena seleção, ampliação, teclado, clique externo e retorno do vídeo; `GalleryMedia.tsx` cuida de carregamento/erro e `gallery-image-prefetch.ts` do preparo limitado de imagens. Thumbnails de vídeo são geradas no Studio e persistidas no asset, não capturadas pelo visitante.
- Jogo: `ProjectPlayable.tsx` monta iframe sob demanda no desktop. Até 760 px ou com ponteiro primário coarse sem hover, mostra aviso e cópia de link; `ProjectPlayable.module.css` e a consulta de mídia no componente devem permanecer coerentes. Textos pertencem ao dicionário.
- Atlas: posições, influências e labels são conteúdo do Sanity. O mapa, a prévia e os fundos compartilham geometria; [guia técnico](../src/features/atlas/README.md), [edição](../studio/ATLAS.md) e [registro datado](../studio/ATLAS-COMPOSITION.md) têm responsabilidades distintas.

## Manter esta documentação

Comportamento atual deve ser descrito como contrato, com o caminho do responsável. Valores editoriais publicados precisam de data e não devem ser tratados como defaults de código. Resultados antigos de testes não comprovam o estado de uma nova composição. Ao mudar um contrato, atualize o guia correspondente e confira os links do README. Licenças em `src/components/icons/NOTICE.md` devem ser preservadas.
