import {defineField, defineType} from 'sanity'
import {ColorWheelIcon} from '@sanity/icons/ColorWheel'
import {AtlasColorInput} from '../atlas/AtlasColorInput'
import {validateAtlasCategory} from '../atlas/atlasValidation'

export const atlasCategorySettings = defineType({
  name: 'atlasCategorySettings',
  title: 'Atlas — território',
  type: 'object',
  icon: ColorWheelIcon,
  validation: (rule) => rule.custom(validateAtlasCategory),
  fields: [
    defineField({
      name: 'isTerritory',
      title: 'Usar como território no Atlas',
      type: 'boolean',
      initialValue: false,
      description: 'Uma categoria pode classificar projetos sem criar um território próprio.',
    }),
    defineField({
      name: 'color',
      title: 'Cor do território',
      type: 'string',
      description:
        'A cor será compartilhada pelo relevo, marcadores e bordas dos cards. Ex.: #A4B58C.',
      components: {input: AtlasColorInput},
      hidden: ({parent}) => parent?.isTerritory !== true,
    }),
    defineField({
      name: 'label',
      title: 'Nome curto no mapa',
      type: 'localizedString',
      description: 'Até 30 caracteres em cada idioma. Ex.: Jogos / Games.',
      hidden: ({parent}) => parent?.isTerritory !== true,
    }),
    defineField({
      name: 'desktop',
      title: 'Posição do nome — desktop',
      type: 'atlasPosition',
      hidden: ({parent}) => parent?.isTerritory !== true,
    }),
    defineField({
      name: 'mobile',
      title: 'Posição do nome — celular',
      type: 'atlasPosition',
      hidden: ({parent}) => parent?.isTerritory !== true,
    }),
  ],
})
