import {defineField, defineType} from 'sanity'
import {PinIcon} from '@sanity/icons/Pin'
import {
  atlasTerrainReference,
  atlasTerrainLimits,
  atlasTerrainControlKeys,
} from '../../../shared/atlas-terrain-settings'
import {AtlasTerrainInput, AtlasTerrainSlider} from '../atlas/AtlasTerrainInput'

const labels = {
  amplitude: ['Amplitude', 'Formações mais concentradas (0) ou mais amplas (100).'],
  elongation: [
    'Alongamento',
    'Formações mais verticais (0), equilibradas (50) ou horizontais (100), antes da direção.',
  ],
  direction: [
    'Direção',
    'Inclinação adicional em graus: -90 a 90. Zero mantém a orientação de referência.',
  ],
  connection: [
    'Conexão',
    'Intensidade das elevações auxiliares: 0 remove sua contribuição; 50 mantém a referência. Os projetos continuam independentes.',
  ],
  negativeSpace: ['Respiro', 'Menos (0) ou mais (100) espaços vazios e separação entre as massas.'],
} as const

export const atlasTerrainControls = defineType({
  name: 'atlasTerrainControls',
  title: 'Controles da topografia',
  type: 'object',
  icon: PinIcon,
  components: {input: AtlasTerrainInput},
  initialValue: {...atlasTerrainReference},
  fields: atlasTerrainControlKeys.map((key) => {
    const {min, max} = atlasTerrainLimits(key)
    return defineField({
      name: key,
      title: labels[key][0],
      description: labels[key][1],
      type: 'number',
      initialValue: atlasTerrainReference[key],
      components: {input: AtlasTerrainSlider},
      validation: (rule) => rule.min(min).max(max).integer(),
    })
  }),
})
