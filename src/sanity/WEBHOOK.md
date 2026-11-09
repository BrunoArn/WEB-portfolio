# Webhook de atualização do conteúdo

## Estado atual

A rota `POST /api/sanity/revalidate` está implementada. O webhook do projeto já foi configurado e validado com a implantação Railway; isso não certifica a configuração de outro ambiente ou uma entrega futura. Para receber eventos, a rota deve estar publicada no endereço cadastrado e usar o mesmo segredo do Sanity. Sem SANITY_REVALIDATE_SECRET, responde 503 e não invalida nada. A política de uma hora continua como recuperação. Não há atualização automática de abas já abertas.

## Configurar ou transferir para outro ambiente

1. Publicar o site com a rota em um endereço HTTPS acessível pelo Sanity. O Studio pode continuar local.
2. Gerar um segredo exclusivo e configurar SANITY_REVALIDATE_SECRET no ambiente do servidor. Não usar prefixo NEXT_PUBLIC_, token de API nem parâmetro na URL. Não salvar o valor no repositório.
3. No Sanity Manage → projeto → API → Webhooks, cadastrar um webhook de documento (GROQ-powered):

| Campo | Valor |
| --- | --- |
| Nome | Atualizar cache do portfólio |
| URL | https://SEU-DOMINIO/api/sanity/revalidate |
| Método HTTP | POST |
| Dataset | Mesmo NEXT_PUBLIC_SANITY_DATASET do site (atualmente production) |
| Eventos | Create, Update e Delete |
| Drafts | Desativado |
| Versions / releases não publicadas | Desativado |
| Filter | Conteúdo integral de [webhook-filter.groq](webhook-filter.groq) |
| Projection | Conteúdo integral de [webhook-projection.groq](webhook-projection.groq) |
| Secret | Mesmo valor de SANITY_REVALIDATE_SECRET do servidor |

Não configurar header Authorization: o campo Secret faz o Sanity assinar o corpo com sanity-webhook-signature. O endpoint verifica essa assinatura usando @sanity/webhook antes de interpretar o JSON. O payload assinado também precisa informar o dataset esperado.

O filtro ignora rascunhos e versões não publicadas. Para arquivos, só mudanças em videoThumbnail disparam aviso: upload bruto e alteração do lock videoThumbnailProcessing não são conteúdo público. Isso evita requisições desnecessárias e loops; a rota não escreve no CMS.

## Dependências e invalidação

| Evento | Tag invalidada | Caminhos adicionais |
| --- | --- | --- |
| project | sanity:projects | Slug anterior e atual, PT e EN |
| category | sanity:categories | Nenhum: projetos e Atlas já dependem dessa tag |
| atlasSettings | sanity:atlas | Nenhum |
| aboutPage | sanity:about | About PT e EN |
| sanity.fileAsset com thumbnailChanged=true | sanity:projects | Nenhum |

As tags da consulta de Atlas incluem projetos e categorias. Invalidar esses grupos alcança Home, fundos e demais consumidores sem precisar enumerar projetos relacionados. Os caminhos dos slugs tratam páginas antigas e resultados 404 já visitados. Em exclusões/despublicações, before() fornece o slug e o tipo anteriores. Slugs novos continuam permitidos por dynamicParams=true.

O Next recebe revalidateTag(tag, { expire: 0 }): a próxima consulta desses dados espera uma leitura atualizada da API. revalidatePath marca os caminhos para atualização na próxima visita. O webhook não recompila todas as páginas antecipadamente. Entregas repetidas são seguras e podem causar uma nova revalidação; não exigem banco para deduplicação neste volume.

## Validar e diagnosticar

- Conferir no Sanity a URL habilitada, dataset, eventos e uma entrega no histórico de tentativas: HTTP 200 e `revalidated=true`. Adicionar o segredo a `.env.local` ou Railway não preenche o Secret do Sanity; os valores precisam coincidir.
- Publicar uma pequena mudança de About e abrir PT/EN em nova navegação/reload.
- Conferir projeto novo, mudança de slug e despublicação quando houver oportunidade editorial.
- Conferir mudança de categoria/Atlas e thumbnail automática de vídeo.
- Não esperar que uma aba já aberta mude sozinha; o cache do navegador/roteador pode exigir recarregar.

| Resposta | Significado |
| --- | --- |
| 200, revalidated=true | Invalidações aceitas; dados serão buscados na próxima consulta |
| 200, revalidated=false | Evento fora do escopo/rascunho/arquivo sem alteração de thumbnail |
| 400 | JSON, campos, UTF-8 ou dataset inválidos |
| 401 | Assinatura ausente ou inválida |
| 413 | Corpo maior que 16 KiB; conferir projeção configurada |
| 415 | Content-Type não é application/json |
| 503 | Segredo não configurado no servidor |
| 500 | Falha interna; conferir logs e histórico de entrega |
| 405 | Método não implementado, como GET |

Corpo e assinatura não são registrados nos logs. O tamanho é limitado inclusive em streaming. O payload não pode escolher caminhos ou tags arbitrários. O segredo deve ser exclusivo deste webhook/ambiente; a validação usa a assinatura oficial, sem janela adicional de expiração que possa bloquear reentregas legítimas.

### Localhost e troca de domínio

O webhook cadastrado para Railway não alcança `localhost`. Para revisar conteúdo sem cache local, use `/pt/atlas-preview` ou `/en/atlas-preview` no caso do Atlas. Para testar a invalidação real, use um ambiente HTTPS acessível ao Sanity, ou uma requisição local assinada de teste. Não coloque o segredo em URL, terminal compartilhado ou logs. Reiniciar o dev server pode não remover um cache persistido; confira o conteúdo publicado e teste a política com build/start.

Ao trocar o domínio ou ambiente, publique a rota, configure o segredo no servidor, atualize a URL do webhook e repita o teste. O Studio pode continuar local: o evento nasce no Content Lake quando o documento é publicado.

Em hospedagem com várias réplicas Next, planejar cache/invalidação compartilhados antes de ativar: uma chamada a uma única instância não deve deixar outra com cache independente.

Referências: [Sanity — GROQ-powered webhooks](https://www.sanity.io/docs/content-lake/webhooks) e [Next.js — revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag). A implementação instalada pode ser conferida em `src/app/api/sanity/revalidate/route.ts` e `src/sanity/webhook.ts`.
