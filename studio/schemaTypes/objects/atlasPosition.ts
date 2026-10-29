import {defineField, defineType} from 'sanity'
import {PinIcon} from '@sanity/icons/Pin'

export const atlasPosition = defineType({
  name: 'atlasPosition',
  title: 'Posição no mapa',
  type: 'object',
  icon: PinIcon,
  options: {columns: 2},
  fields: [
    defineField({
      name: 'x',
      title: 'X (%)',
      type: 'number',
      description: '0 = esquerda; 100 = direita.',
      validation: (rule) => rule.min(0).max(100),
    }),
    defineField({
      name: 'y',
      title: 'Y (%)',
      type: 'number',
      description: '0 = topo; 100 = base.',
      validation: (rule) => rule.min(0).max(100),
    }),
  ],
  preview: {
    select: {x: 'x', y: 'y'},
    prepare: ({x, y}) => ({title: `X: ${x ?? '—'}% · Y: ${y ?? '—'}%`}),
  },
})
