const maximumFileBytes = 100 * 1024 * 1024

/** Correlate the local file with Sanity's content-addressed asset before saving a frame. */
export async function videoFileHash(file: File): Promise<string> {
  if (file.size > maximumFileBytes)
    throw new Error('A thumbnail automática suporta vídeos de até 100 MiB.')
  if (!globalThis.crypto?.subtle)
    throw new Error('Abra o Studio em HTTPS ou localhost para gerar a thumbnail.')
  const hash = await crypto.subtle.digest('SHA-1', await file.arrayBuffer())
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Local upload only: capture once, then revoke the blob URL and release the decoder. */
export function captureVideoFrame(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    let settled = false
    let encoding = false
    let target = 0
    const timer = window.setTimeout(
      () => finish(undefined, new Error('Não foi possível ler um frame deste vídeo a tempo.')),
      30000,
    )
    function finish(blob?: Blob, error?: Error) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      video.removeEventListener('loadedmetadata', seek)
      video.removeEventListener('loadeddata', capture)
      video.removeEventListener('seeked', capture)
      video.removeEventListener('error', fail)
      video.pause()
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(url)
      if (blob) resolve(blob)
      else reject(error ?? new Error('Não foi possível gerar a thumbnail.'))
    }
    function seek() {
      target =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.min(30, video.duration * 0.1)
          : 0
      try {
        video.currentTime = target
      } catch {
        fail()
      }
    }
    function fail() {
      finish(
        undefined,
        new Error(
          'O navegador não conseguiu ler este vídeo. Prefira MP4 com H.264 ou WebM compatível.',
        ),
      )
    }
    function capture() {
      if (
        settled ||
        encoding ||
        video.seeking ||
        video.readyState < 2 ||
        video.currentTime + 0.01 < target ||
        !video.videoWidth ||
        !video.videoHeight
      )
        return
      encoding = true
      try {
        const scale = Math.min(1280 / video.videoWidth, 720 / video.videoHeight, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
        const context = canvas.getContext('2d')
        if (!context) {
          fail()
          return
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => finish(blob ?? undefined), 'image/webp', 0.8)
      } catch {
        fail()
      }
    }
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.addEventListener('loadedmetadata', seek)
    video.addEventListener('loadeddata', capture)
    video.addEventListener('seeked', capture)
    video.addEventListener('error', fail)
    video.src = url
    video.load()
  })
}
