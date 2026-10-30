import {defineField, defineType} from 'sanity'
import {PinIcon} from '@sanity/icons/Pin'
export const atlasCompositionRegion = defineType({
  name: 'atlasCompositionRegion',
  title: 'Região de composição',
  type: 'object',
  icon: PinIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Nome para organização',
      type: 'string',
      description: 'Ex.: Faixa superior ou Vale central. Não aparece no mapa.',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'kind',
      title: 'Tipo',
      type: 'string',
      initialValue: 'elevation',
      options: {
        layout: 'radio',
        list: [
          {title: 'Elevação — acrescenta relevo', value: 'elevation'},
          {title: 'Vale — abre espaço', value: 'valley'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'desktop', title: 'Desktop', type: 'atlasRegionProfile'}),
    defineField({name: 'mobile', title: 'Celular', type: 'atlasRegionProfile'}),
  ],
  preview: {
    select: {title: 'name', kind: 'kind'},
    prepare: ({title, kind}) => ({title, subtitle: kind === 'valley' ? 'Vale' : 'Elevação'}),
  },
})
