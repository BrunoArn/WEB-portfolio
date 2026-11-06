# Portfólio — Bruno Arnaud

Site em Next.js App Router, React, TypeScript e Tailwind CSS, com conteúdo em PT/EN e Sanity Studio em `studio/`. A branch de publicação é `production`; a hospedagem atual é Railway.

## Executar e verificar

```sh
npm ci
npm run dev
```

O site abre em `http://localhost:3000`. Para validar cache, prefetch e comportamento de produção:

```sh
npm run lint
npx tsc --noEmit
node --test tests/*.test.mjs
npm run build
npm run start
```

A build acessa o Sanity e pode precisar de rede para as fontes do `next/font`. Configure as variáveis de ambiente locais conforme os arquivos de configuração; não versione segredos. O Studio tem seu próprio `package.json` e comandos em `studio/`.

## Onde encontrar cada responsabilidade

- [Mapa de organização do código](docs/CODE_ORGANIZATION.md): layout, tokens, dicionários, CMS e regras específicas.
- [Atlas](src/features/atlas/README.md): composição, geometria, câmera, interação e renderização.
- [Cache de conteúdo](src/sanity/CACHING.md): consultas, tags e dependências.
- [Webhook](src/sanity/WEBHOOK.md): configuração, assinatura, respostas e validação.

## Conteúdo, cache e navegação

As consultas públicas compartilham a política de cache em `src/sanity/cache.ts`: uma hora como recuperação e invalidação por tags através de `POST /api/sanity/revalidate`. PT e EN reutilizam os dados brutos; a localização ocorre nos adaptadores. A configuração do webhook depende do ambiente publicado e do segredo correspondente. O endereço de produção não invalida o cache do servidor local e abas abertas não são atualizadas automaticamente.

Detalhes existentes são pré-gerados a partir dos slugs publicados. Novos slugs podem renderizar sob demanda; slugs inexistentes retornam 404. A listagem e os relacionados buscam somente os campos dos cards; a página de detalhe recebe os dados completos.

`IntentLink` habilita o prefetch por hover de mouse, foco ou início de toque/caneta. Não há prefetch de todas as rotas só por entrarem na viewport. No Atlas, a intenção prepara a capa no tamanho do card; a seleção monta a capa antes da animação e, após seu carregamento ou falha, prepara o detalhe e o hero. O clique explícito para navegar mantém a preparação imediata com timeout. Nenhum evento bloqueia a rolagem para antecipar dados.
