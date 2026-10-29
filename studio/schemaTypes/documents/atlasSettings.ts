import {atlasReferenceRegions} from '../../../shared/atlas-composition-regions'
import {AtlasRegionsInput} from '../atlas/AtlasRegionsInput'
import {defineField, defineType, defineArrayMember} from 'sanity'
import {PinIcon} from '@sanity/icons/Pin'
import {atlasTerrainReference} from '../../../shared/atlas-terrain-settings'

export const atlasSettings = defineType({
  name: 'atlasSettings',
  title: 'Atlas — Topografia',
  type: 'document',
  icon: PinIcon,
  initialValue: {
    regions: atlasReferenceRegions(),
    desktop: {...atlasTerrainReference},
    mobile: {...atlasTerrainReference},
  },
  fields: [
    defineField({
      name: 'regions',
      title: 'Regiões de composição',
      description:
        'Elevações auxiliares e vales independentes dos projetos. Lista vazia remove todas as regiões.',
      type: 'array',
      of: [defineArrayMember({type: 'atlasCompositionRegion'})],
      components: {input: AtlasRegionsInput},
      initialValue: atlasReferenceRegions,
      validation: (rule) => rule.max(32),
    }),
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
