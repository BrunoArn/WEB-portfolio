import {set, type StringInputProps} from 'sanity'
import {isHexColor} from './atlasValidation'

/** Native color chooser alongside Sanity's standard, accessible text input. */
export function AtlasColorInput(props: StringInputProps) {
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
      <input
        type="color"
        aria-label="Escolher cor do território"
        value={isHexColor(props.value) ? props.value : '#808080'}
        disabled={props.readOnly}
        onChange={(event) => props.onChange(set(event.currentTarget.value))}
        style={{
          width: 44,
          height: 38,
          flexShrink: 0,
          cursor: props.readOnly ? 'default' : 'pointer',
        }}
      />
      <div style={{flex: 1, minWidth: 0}}>{props.renderDefault(props)}</div>
    </div>
  )
}
