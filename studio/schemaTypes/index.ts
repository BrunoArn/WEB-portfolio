import { atlasPosition } from './objects/atlasPosition'
import { atlasCategorySettings } from './objects/atlasCategorySettings'
import { atlasProjectSettings } from './objects/atlasProjectSettings'
import { localizedString } from './objects/localizedString'
import { localizedText } from './objects/localizedText'
import { playableConfig } from './objects/playableConfig'
import { projectImage } from './objects/projectImage'
import { projectVideo } from './objects/projectVideo'
import { teamMember } from './objects/teamMember'
import { seo } from './objects/seo'

import { category } from './documents/category'
import { project } from './documents/project'
import { aboutPage } from './documents/aboutPage'

export const schemaTypes = [
  atlasPosition,
  atlasCategorySettings,
  atlasProjectSettings,
  localizedString,
  localizedText,
  teamMember,
  projectImage,
  projectVideo,
  playableConfig,
  seo,
  category,
  project,
  aboutPage,
]