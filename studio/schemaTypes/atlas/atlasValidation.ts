import type {Reference, ValidationContext} from 'sanity'

export interface AtlasPointValue {
  x?: number
  y?: number
}
export interface AtlasCategoryValue {
  isTerritory?: boolean
  color?: string
  label?: {pt?: string; en?: string}
  desktop?: AtlasPointValue
  mobile?: AtlasPointValue
}
export interface AtlasProjectValue {
  enabled?: boolean
  territory?: Reference
  desktop?: AtlasPointValue
  mobile?: AtlasPointValue
  influence?: number
}

export const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)

export const canonicalId = (id: string) => id.replace(/^drafts\./, '')

export function validAtlasPoint(value: AtlasPointValue | undefined) {
  return (
    value != null &&
    [value.x, value.y].every(
      (coordinate) =>
        typeof coordinate === 'number' &&
        Number.isFinite(coordinate) &&
        coordinate >= 0 &&
        coordinate <= 100,
    )
  )
}

export function validateAtlasCategory(value: AtlasCategoryValue | undefined) {
  if (!value?.isTerritory) return true
  if (!isHexColor(value.color)) return 'Escolha uma cor no formato #RRGGBB para o território.'
  if (
    ![value.label?.pt, value.label?.en].every(
      (label) => typeof label === 'string' && label.trim().length > 0 && label.trim().length <= 30,
    )
  ) {
    return 'Preencha o nome curto do território em português e inglês (até 30 caracteres).'
  }
  if (!validAtlasPoint(value.desktop) || !validAtlasPoint(value.mobile)) {
    return 'Defina as posições do nome no desktop e no celular, com X e Y entre 0 e 100.'
  }
  return true
}

export async function validateAtlasProject(
  value: AtlasProjectValue | undefined,
  context: ValidationContext,
) {
  if (!value?.enabled) return true
  const territory = value.territory?._ref
  if (!territory) return 'Escolha o território principal deste projeto.'
  const categories = (context.document?.categories ?? []) as Reference[]
  if (
    !categories.some(
      (category) => category._ref && canonicalId(category._ref) === canonicalId(territory),
    )
  ) {
    return 'O território principal precisa estar entre as categorias do projeto.'
  }
  if (!validAtlasPoint(value.desktop) || !validAtlasPoint(value.mobile)) {
    return 'Defina as posições do projeto no desktop e no celular, com X e Y entre 0 e 100.'
  }
  if (
    value.influence !== undefined &&
    (!Number.isFinite(value.influence) || value.influence < 0.1 || value.influence > 2)
  ) {
    return 'A influência no relevo deve estar entre 0,1 e 2. Deixe vazio para usar 1.'
  }
  const id = canonicalId(territory)
  try {
    const category = await context
      .getClient({apiVersion: '2026-10-01'})
      .withConfig({perspective: 'raw', useCdn: false})
      .fetch<{_type?: string; atlas?: {isTerritory?: boolean}} | null>(
        'coalesce(*[_id == $draftId][0], *[_id == $id][0]){_type, atlas{isTerritory}}',
        {id, draftId: `drafts.${id}`},
      )
    return category?._type === 'category' && category.atlas?.isTerritory === true
      ? true
      : 'A categoria escolhida não está habilitada como território no Atlas.'
  } catch {
    return 'Não foi possível verificar o território. Confira a conexão e tente novamente.'
  }
}
