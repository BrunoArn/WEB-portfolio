import {defineField, defineType} from 'sanity'
import {PinIcon} from '@sanity/icons/Pin'
import {
  resolveAtlasRegionProfile,
  type AtlasRegionProfile,
} from '../../../shared/atlas-composition-regions'
export const atlasRegionProfile = defineType({
  name: 'atlasRegionProfile',
  title: 'Configuração da região',
  type: 'object',
  icon: PinIcon,
  options: {collapsible: true, collapsed: true},
  initialValue: {
    enabled: true,
    shape: 'elongated',
    x: 50,
    y: 50,
    width: 20,
    height: 10,
    rotation: 0,
    intensity: 0.3,
  },
  fieldsets: [
    {name: 'position', title: 'Centro da região', options: {columns: 2}},
    {name: 'advanced', title: 'Formato avançado', options: {collapsible: true, collapsed: true}},
  ],
  validation: (rule) =>
    rule.custom((value: Partial<AtlasRegionProfile> | undefined, context) => {
      if (!value || value.enabled === false) return true
      const mobile = context.path?.includes('mobile') ?? false
      return (
        resolveAtlasRegionProfile(value, mobile) != null ||
        'Confira posição, formato e intensidade da região.'
      )
    }),
  fields: [
    defineField({
      name: 'enabled',
      title: 'Ativar neste tamanho de tela',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'shape',
      title: 'Formato',
      type: 'string',
      initialValue: 'elongated',
      options: {
        list: [
          {title: 'Arredondada', value: 'rounded'},
          {title: 'Alongada', value: 'elongated'},
          {title: 'Faixa', value: 'band'},
          {title: 'Personalizado', value: 'custom'},
        ],
      },
      hidden: ({parent}) => parent?.enabled === false,
    }),
    defineField({
      name: 'intensity',
      title: 'Intensidade',
      type: 'number',
      description: '0 a 2. Elevações acrescentam volume; vales retiram volume.',
      validation: (rule) => rule.min(0).max(2),
      hidden: ({parent}) => parent?.enabled === false,
    }),
    defineField({
      name: 'x',
      title: 'X (%)',
      type: 'number',
      fieldset: 'position',
      description: '-50 a 150. Permite colocar o centro fora da janela.',
      validation: (rule) => rule.min(-50).max(150),
      hidden: ({parent}) => parent?.enabled === false,
    }),
    defineField({
      name: 'y',
      title: 'Y (%)',
      type: 'number',
      fieldset: 'position',
      description: '0 = topo; 100 = base. Pode ir além das bordas.',
      validation: (rule) => rule.min(-50).max(150),
      hidden: ({parent}) => parent?.enabled === false,
    }),
    defineField({
      name: 'width',
      title: 'Largura (%)',
      type: 'number',
      fieldset: 'advanced',
      description: 'Alcance suave horizontal. Usado no formato personalizado.',
      validation: (rule) => rule.min(0.1).max(100),
      hidden: ({parent}) => parent?.enabled === false || parent?.shape !== 'custom',
    }),
    defineField({
      name: 'height',
      title: 'Altura (%)',
      type: 'number',
      fieldset: 'advanced',
      description: 'Alcance suave vertical. Usado no formato personalizado.',
      validation: (rule) => rule.min(0.1).max(100),
      hidden: ({parent}) => parent?.enabled === false || parent?.shape !== 'custom',
    }),
    defineField({
      name: 'rotation',
      title: 'Inclinação (graus)',
      type: 'number',
      fieldset: 'advanced',
      initialValue: 0,
      validation: (rule) => rule.min(-180).max(180),
      hidden: ({parent}) => parent?.enabled === false,
    }),
  ],
})
