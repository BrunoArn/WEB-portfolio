import {set, type NumberInputProps, type ObjectInputProps} from 'sanity'
import {
  atlasTerrainControlKeys,
  atlasTerrainLimits,
  atlasTerrainReference,
  type AtlasTerrainControls,
} from '../../../shared/atlas-terrain-settings'

export function AtlasTerrainSlider(props: NumberInputProps) {
  const key = props.path[props.path.length - 1] as keyof AtlasTerrainControls
  const limits = atlasTerrainLimits(key)
  const value =
    typeof props.value === 'number' && Number.isFinite(props.value)
      ? props.value
      : atlasTerrainReference[key]
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
      <input
        type="range"
        {...limits}
        value={value}
        disabled={props.readOnly}
        aria-label={props.schemaType.title}
        onChange={(event) => props.onChange(set(Number(event.currentTarget.value)))}
        style={{flex: 1, minWidth: 80}}
      />
      <div style={{width: 100}}>{props.renderDefault(props)}</div>
    </div>
  )
}

export function AtlasTerrainInput(props: ObjectInputProps) {
  return (
    <div>
      {props.renderDefault(props)}
      <button
        type="button"
        disabled={props.readOnly}
        onClick={() =>
          props.onChange(
            atlasTerrainControlKeys.map((key) => set(atlasTerrainReference[key], [key])),
          )
        }
        style={{
          marginTop: 16,
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #888',
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
        }}
      >
        Restaurar referência deste perfil
      </button>
    </div>
  )
}
