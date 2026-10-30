This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Páginas de projetos e atualização do Sanity

Os detalhes em PT/EN são pré-gerados na build a partir dos slugs publicados do Sanity (generateStaticParams). dynamicParams = true mantém a geração sob demanda de novos slugs, sem exigir outra build. Slugs inexistentes continuam retornando 404.

A rota de detalhe e as consultas de projetos usam revalidação de 60 segundos. Após esse intervalo, um acesso pode receber a versão anterior enquanto a atualização acontece em segundo plano; os acessos seguintes recebem a versão renovada. Não é atualização instantânea nem um prazo garantido de 60 segundos. Isso também afeta os consumidores dessas consultas, incluindo a lista da Home. Não há webhook configurado por esta alteração.

A build precisa acessar o Sanity. Para conferir o cache e o tempo de navegação, use npm run build e npm run start: next dev continua compilando páginas durante o uso. O Atlas prepara a página e a capa responsiva ao abrir o card, reaproveitando esse trabalho no clique; não baixa antecipadamente as capas de todos os projetos.

Verificação em produção local: 12 detalhes pré-gerados com intervalo de 60 s no manifesto; ciclo real HIT → STALE → HIT; 404 para slug inexistente. Uma cópia isolada omitiu Hungry Worm da build e confirmou geração sob demanda (MISS → HIT) em PT/EN, sem escrita no Sanity. O preparo antecipado da capa foi conferido em desktop e mobile DPR 3, reutilizando a preparação no clique. Validações de transição cobrem os seis projetos e os dois idiomas; não substituem uma avaliação física de rede/dispositivo.
