# Portfólio — Bruno Arnaud

Site em Next.js App Router, React, TypeScript e Tailwind CSS, com PT/EN e conteúdo do Sanity. O Studio é uma aplicação independente em `studio/`. A branch de publicação é `production`; a hospedagem atual do site é Railway. Consulte os manifests/lockfiles para as versões de cada aplicação.

## Executar

Na raiz, instale dependências com `npm ci`, copie `.env.example` para `.env.local` e preencha os valores:

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Projeto Sanity lido pelo frontend; deve corresponder ao Studio. |
| `NEXT_PUBLIC_SANITY_DATASET` | Dataset publicado, atualmente `production`. |
| `SANITY_REVALIDATE_SECRET` | Segredo só do servidor, igual ao Secret do webhook. Sem ele, a rota de invalidação responde 503. Não é necessário para apenas consultar conteúdo público. |

Não versione `.env.local`, tokens ou segredos. O frontend usa consultas públicas, sem token administrativo. A configuração do Studio está nos seus próprios arquivos; veja [studio/README.md](studio/README.md).

```sh
npm run dev
```

Abra `http://localhost:3000`. Para testar no celular na mesma rede, use `npm run dev -- --hostname 0.0.0.0` e o IP local atual da máquina; porta/firewall precisam permitir o acesso. Endereços de rede mudam. Cópia via Clipboard pode falhar em HTTP de rede local: o player oferece o link para cópia manual.

## Verificar

Na raiz:

```sh
npm run lint
npx tsc --noEmit
node --test tests/*.test.mjs
npm run build
npm run start
```

A build acessa o Sanity e pode precisar de rede para as fontes de `next/font`. Teste cache/prefetch com `next build`/`next start`; o servidor dev e HMR têm comportamento diferente. Comandos do Studio rodam em sua pasta, não na raiz.

## Guia de manutenção

| Tema | Documento |
| --- | --- |
| Layout, tokens, dicionários e responsabilidades | [Organização do código](docs/CODE_ORGANIZATION.md) |
| Geometria, câmera, interação e renderização | [Atlas](src/features/atlas/README.md) |
| Edição de projetos, territórios e topografia | [Atlas no Studio](studio/ATLAS.md) |
| Cache, tags, configuração e diagnóstico da invalidação | [Cache e webhook](src/sanity/WEBHOOK.md) |
| Upload de vídeo e geração única de poster | [Studio — thumbnails](studio/README.md#thumbnails) |
| Exportação Unity, R2 e player | [Publicação WebGL](docs/webgl/WEBGL-PUBLISHING-STANDARD.md) |

## Idioma inicial

URLs sem prefixo usam `Accept-Language`: variantes de português levam a `/pt`, inglês a `/en`, respeitando prioridades. Sem idioma compatível, o fallback é inglês. A decisão fica em `src/i18n/preferred-locale.ts` e `src/proxy.ts`.

Uma URL explícita com `/pt` ou `/en` prevalece. O seletor manual troca o caminho sem cookie nem redirecionamento forçado. Só o redirecionamento de entrada varia por idioma e usa `private/no-store`; isso não elimina o cache das páginas localizadas.

## Conteúdo e cache

As consultas públicas usam `src/sanity/cache.ts`: uma hora como recuperação e invalidação por tags via `POST /api/sanity/revalidate`. PT/EN reutilizam dados brutos; adaptadores localizam depois da consulta. O webhook da implantação Railway foi configurado e validado no projeto; ao preparar outro ambiente, configure URL e segredo correspondentes. Ele não invalida o servidor local nem atualiza abas abertas automaticamente.

A prévia do Atlas solicita dados publicados sem cache a cada requisição; não é uma prévia de rascunhos. Conteúdo do CMS e código têm ciclos distintos: publicar posições/textos pode atualizar o site sem commit, mas CSS/schema/componentes dependem do código distribuído na aplicação correspondente.

Detalhes existentes são pré-gerados pelos slugs publicados; novos slugs podem renderizar sob demanda, e inexistentes retornam 404. Listagem e relacionados usam `getProjectCards` e dados leves. Só o detalhe consulta galeria, playable e demais campos completos. `summary` é opcional e aparece apenas na listagem, sem fallback para outro idioma. Relacionados mostram até seis projetos, priorizando categorias compartilhadas e completando com outros, sem incluir o atual.

## Navegação e mídia

`IntentLink` ativa prefetch por hover de mouse, foco ou início de toque/caneta; não antecipa todas as rotas apenas por entrarem na viewport. No Atlas, intenção prepara a capa do card. A seleção monta a capa antes da animação; depois de carregar/falhar, prepara detalhe e hero. Clique explícito prepara imediatamente, com limite de espera de 1,8 s e fallback visual.

O ícone da bolinha (`atlas.icon`) é independente da capa aberta. Galeria usa posters persistentes gerados pelo Studio, prefetch limitado de imagens e estados de carregamento/erro. Vídeos podem tentar reprodução ao selecionar, sujeita à política do navegador. O jogo só monta iframe ao jogar no desktop; em tela pequena ou ponteiro primário touch-only, a seção oferece aviso e cópia do link para desktop.

O cache de consultas não substitui o cache HTTP de imagens/vídeos nem elimina o tráfego dos assets. O frontend não converte GIFs ou transcodifica vídeos. Mudanças de mídia/conteúdo e a configuração do domínio final precisam de revisão própria.
