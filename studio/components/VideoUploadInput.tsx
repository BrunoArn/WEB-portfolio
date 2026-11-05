import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
} from 'react'
import {Button, Card, Stack, Text} from '@sanity/ui'
import {useClient, type FileInputProps} from 'sanity'
import {localVideo, thumbnailForUpload, type LocalVideo} from '../lib/video-thumbnails/upload'

export function VideoUploadInput(props: FileInputProps) {
  const client = useClient({apiVersion: '2026-10-01'})
  const stableClient = useMemo(() => client.withConfig({useCdn: false}), [client])
  const [source, setSource] = useState<LocalVideo>()
  const [status, setStatus] = useState<{
    asset: string
    kind: 'working' | 'ready' | 'error'
    message: string
  }>()
  const [retry, setRetry] = useState(0)
  const assetId = props.value?.asset?._ref

  function select(files: File[]) {
    if (props.readOnly) return
    const file = files.find(
      (file) => file.type.startsWith('video/') || /\.(mp4|m4v|webm|mov|ogv)$/i.test(file.name),
    )
    if (file) {
      setStatus(undefined)
      setSource(localVideo(file))
    }
  }
  function change(event: ChangeEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLInputElement && event.target.type === 'file')
      select(Array.from(event.target.files ?? []))
  }
  function drop(event: DragEvent<HTMLDivElement>) {
    select(Array.from(event.dataTransfer.files))
  }
  function paste(event: ClipboardEvent<HTMLDivElement>) {
    select(Array.from(event.clipboardData.files))
  }

  useEffect(() => {
    if (!assetId || !source || props.readOnly) return
    let active = true
    async function generate() {
      try {
        const hash = await source!.hash
        if (!active || !assetId!.startsWith('file-' + hash + '-')) return
        setStatus({asset: assetId!, kind: 'working', message: 'Gerando thumbnail automática…'})
        await thumbnailForUpload(stableClient, assetId!, source!)
        if (active)
          setStatus({asset: assetId!, kind: 'ready', message: 'Thumbnail automática salva.'})
      } catch (error) {
        if (active)
          setStatus({
            asset: assetId!,
            kind: 'error',
            message: error instanceof Error ? error.message : 'Não foi possível gerar a thumbnail.',
          })
      }
    }
    void generate()
    return () => {
      active = false
    }
  }, [assetId, source, stableClient, retry, props.readOnly])

  const currentStatus = status?.asset === assetId ? status : undefined
  return (
    <div onChangeCapture={change} onDropCapture={drop} onPasteCapture={paste}>
      <Stack gap={3}>
        {props.renderDefault(props)}
        {currentStatus && (
          <Card
            padding={3}
            radius={2}
            tone={currentStatus.kind === 'error' ? 'caution' : 'transparent'}
          >
            <Stack gap={3}>
              <Text size={1} aria-live="polite">
                {currentStatus.message}
              </Text>
              {currentStatus.kind === 'error' && !props.readOnly && (
                <Button
                  mode="ghost"
                  text="Tentar gerar novamente"
                  onClick={() => setRetry((value) => value + 1)}
                />
              )}
            </Stack>
          </Card>
        )}
      </Stack>
    </div>
  )
}
