import {set, type ArrayOfObjectsInputProps} from 'sanity'
import {atlasReferenceRegions} from '../../../shared/atlas-composition-regions'
export function AtlasRegionsInput(props: ArrayOfObjectsInputProps) {
  return (
    <div>
      <p style={{fontSize: 13, opacity: 0.8}}>
        {props.value === undefined
          ? 'A prévia usa as regiões da referência. Carregue a lista abaixo para editá-las.'
          : 'Lista vazia significa somente relevo dos projetos. As regiões são independentes dos projetos.'}
      </p>
      {props.renderDefault(props)}
      <button
        type="button"
        disabled={props.readOnly}
        onClick={() => props.onChange(set(atlasReferenceRegions()))}
        style={{
          marginTop: 12,
          padding: '8px 12px',
          border: '1px solid #888',
          borderRadius: 6,
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
        }}
      >
        {props.value === undefined
          ? 'Carregar regiões da referência no rascunho'
          : 'Restaurar regiões da referência'}
      </button>
    </div>
  )
}
