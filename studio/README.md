# Sanity Studio

Aplicação editorial independente do Next.js, com `package.json` e lockfile próprios. Projeto e dataset estão em `sanity.config.ts` e `sanity.cli.ts` (atualmente `m2kdbi07` / `production`); as variáveis do frontend não substituem essa configuração.

## Executar localmente

Na pasta `studio`:

```sh
npm ci
npm run dev
```

Abra `http://localhost:3333`, entre com sua conta Sanity e confirme as permissões no projeto. O servidor não é iniciado por `npm run dev` da raiz. Use a origem autorizada no CORS do Sanity; `localhost`, `127.0.0.1` e IP de rede são origens distintas. Thumbnails locais exigem HTTPS ou localhost.

## Verificar mudanças no Studio

Execute dentro desta pasta:

```sh
npx eslint .
npx tsc --noEmit
npx sanity schema validate
npm run build
```

Os testes automatizados compartilhados ficam em `../tests` e rodam na raiz com `node --test tests/*.test.mjs`. `npm run start` serve o Studio compilado; não é o servidor Next.js.

## Conteúdo e publicação

O menu contém Project, Category, About Page e Atlas — Topografia. About e Topografia são singletons. O site público lê a perspectiva publicada; salvar um rascunho não o publica.

- Projetos: título, descrição e demais campos localizados devem ter o idioma necessário. `summary` é o resumo opcional dos cards da listagem, até 140 caracteres por idioma. Não aparece nos cards relacionados; tradução ausente fica omitida.
- Atlas: [configuração](ATLAS.md) e [registro da composição](ATLAS-COMPOSITION.md).
- Vídeos: [thumbnails persistentes no upload](VIDEO-THUMBNAILS.md), sem campo manual de poster.
- Jogos: [contrato e publicação WebGL](../docs/webgl/WEBGL-PUBLISHING-STANDARD.md).
- Atualização pública: [cache](../src/sanity/CACHING.md) e [webhook](../src/sanity/WEBHOOK.md).

Publicar um documento altera o dataset e pode atualizar o site por webhook sem deploy. Mudar schema, componentes de upload ou configuração requer executar/distribuir o Studio atualizado; um Studio antigo não ganha esses recursos por publicar conteúdo.

## Distribuir o Studio

`npm run build` gera `dist/`. A hospedagem dessa aplicação é independente do frontend no Railway: pode servir o build em hospedagem própria, com domínio/origens corretos, ou usar `npm run deploy` para o serviço de hospedagem Sanity mediante configuração e autorização. O script `deploy-graphql` não faz parte do fluxo atual: o frontend consulta GROQ.

`sanity.cli.ts` habilita auto-updates. App ID, domínio, hospedagem e permissões são configurações do ambiente; confira os avisos do CLI antes de publicar. Não interprete build local como prova de que um Studio remoto recebeu o código.

Não coloque tokens administrativos nem o segredo do webhook no bundle do Studio. `SANITY_REVALIDATE_SECRET` pertence ao servidor Next.js e ao campo Secret do webhook no Sanity Manage.
