import {defineField, defineType, type Reference} from 'sanity'
import {PinIcon} from '@sanity/icons/Pin'
import {canonicalId, validateAtlasProject} from '../atlas/atlasValidation'

export const atlasProjectSettings = defineType({
  name: 'atlasProjectSettings',
  title: 'Atlas — projeto',
  type: 'object',
  icon: PinIcon,
  validation: (rule) => rule.custom(validateAtlasProject),
  fields: [
    defineField({
      name: 'enabled',
      title: 'Participar do Atlas',
      type: 'boolean',
      initialValue: false,
      description:
        'Projetos publicados e habilitados participam do mapa. Publique e recarregue a prévia para ver as alterações.',
    }),
    defineField({
      name: 'territory',
      title: 'Território principal',
      type: 'reference',
      to: [{type: 'category'}],
      description:
        'Tem prioridade sobre as outras categorias e determina a cor e a influência no mapa. Associe a categoria ao projeto primeiro.',
      hidden: ({parent}) => parent?.enabled !== true,
      options: {
        disableNew: true,
        filter: ({document}) => {
          const references = (document.categories ?? []) as Reference[]
          const ids = references.flatMap((reference) =>
            reference._ref
              ? [canonicalId(reference._ref), `drafts.${canonicalId(reference._ref)}`]
              : [],
          )
          return {filter: 'atlas.isTerritory == true && _id in $ids', params: {ids}}
        },
      },
    }),
    defineField({
      name: 'desktop',
      title: 'Posição do projeto — desktop',
      type: 'atlasPosition',
      hidden: ({parent}) => parent?.enabled !== true,
    }),
    defineField({
      name: 'mobile',
      title: 'Posição do projeto — celular',
      type: 'atlasPosition',
      hidden: ({parent}) => parent?.enabled !== true,
    }),
    defineField({
      name: 'influence',
      title: 'Influência no relevo',
      type: 'number',
      initialValue: 1,
      description: 'De 0,1 a 2. Use 1 como ponto de partida. Vazio também significa 1.',
      hidden: ({parent}) => parent?.enabled !== true,
    }),
  ],
})
