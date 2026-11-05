import {captureVideoFrame, videoFileHash} from './capture'
import {processVideoThumbnail, ThumbnailBusyError} from './process'

type Client = Parameters<typeof processVideoThumbnail>[0]
const pending = new Map<string, Promise<string>>()
export type LocalVideo = {file: File; hash: Promise<string>}

export function localVideo(file: File): LocalVideo {
  // The native Studio upload remains responsible for the actual video file.
  const hash = videoFileHash(file)
  void hash.catch(() => {
    /* Reported by the input after the native upload resolves. */
  })
  return {file, hash}
}

/** Never capture a previous/newer file while the native upload changes its asset reference. */
export async function thumbnailForUpload(
  client: Client,
  assetId: string,
  source: LocalVideo,
): Promise<string> {
  const hash = await source.hash
  if (!assetId.startsWith('file-' + hash + '-')) return 'waiting'
  const config = client.config()
  const key = config.projectId + '/' + config.dataset + '/' + assetId
  const existing = pending.get(key)
  if (existing) return existing
  async function generate() {
    for (let attempt = 0; attempt < 15; attempt++) {
      try {
        return await processVideoThumbnail(client, assetId, () => captureVideoFrame(source.file))
      } catch (error) {
        if (!(error instanceof ThumbnailBusyError)) throw error
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }
    throw new Error(
      'A thumbnail ainda está sendo preparada em outra sessão. Tente novamente em instantes.',
    )
  }
  const job = generate()
  pending.set(key, job)
  try {
    return await job
  } finally {
    if (pending.get(key) === job) pending.delete(key)
  }
}
