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
| Destinos fixos dos perfis do shell | `src/config/site.ts` |
| Projetos, categorias, About e conteúdo editorial | Sanity → repositories/queries → `src/content/adapters` → componentes |
| Campos editoriais e instruções do CMS | `studio/schemaTypes/` |

Nome e descrição do site ficam no grupo `site` dos dicionários. O título do Atlas reutiliza o nome na definição do dicionário. Metadados das páginas podem usar os textos da própria página ou do projeto, preservando a localização do CMS.

GitHub, LinkedIn, PT/EN e símbolos de controle são nomes/códigos invariantes, não frases sem tradução. Os nomes das marcas permanecem literais no Footer/menu; os labels acessíveis dos controles vêm do dicionário. Links profissionais editoriais do About continuam no Sanity, independentes dos dois destinos fixos do shell.

Erros internos, identificadores de campos e diagnósticos técnicos não são textos editoriais. Mensagens do Studio pertencem à interface editorial, que atualmente é em português; não devem entrar no dicionário do site público.

## Revisão desta etapa

- Corrigido o README raiz, que ainda mencionava cache de 60 segundos, ausência de webhook e instruções do template inicial.
- Centralizada a fórmula de alinhamento compartilhada por Navbar e Footer.
- Poster do jogo passou a reutilizar o tamanho responsivo do hero.
- Nome/descrição globais organizados nos dicionários, incluindo descrição PT nos metadados.
- Destinos duplicados de GitHub/LinkedIn no layout extraídos para configuração do site.
- Seletor de idioma reutiliza o tipo `Locale` existente.

A varredura dos nós de texto JSX e atributos literais de acessibilidade não encontrou outras frases de interface pública fora do dicionário/CMS. Símbolos e marcas foram classificados separadamente. É uma revisão estática com verificações de execução, não uma garantia de que qualquer futura string será detectada automaticamente.
