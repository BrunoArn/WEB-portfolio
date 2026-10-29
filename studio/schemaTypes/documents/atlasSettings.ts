import {defineField, defineType} from 'sanity'
import {PinIcon} from '@sanity/icons/Pin'
import {atlasTerrainReference} from '../../../shared/atlas-terrain-settings'

export const atlasSettings = defineType({
  name: 'atlasSettings',
  title: 'Atlas — Topografia',
  type: 'document',
  icon: PinIcon,
  initialValue: {desktop: {...atlasTerrainReference}, mobile: {...atlasTerrainReference}},
  fields: [
    defineField({
      name: 'desktop',
      title: 'Desktop',
      type: 'atlasTerrainControls',
      description: 'Ajusta a composição ampla. Valores vazios usam a referência.',
    }),
    defineField({
      name: 'mobile',
      title: 'Celular',
      type: 'atlasTerrainControls',
      description: 'Ajusta a composição vertical, sem esticar o mapa.',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Atlas — Topografia', subtitle: 'Composição desktop e celular'}),
  },
})
