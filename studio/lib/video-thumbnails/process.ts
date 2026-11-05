const maximumVideoBytes = 100 * 1024 * 1024

// Minimal Studio client contract, also used by isolated upload tests.
interface ThumbnailPatch {
  ifRevisionId(revision: string): ThumbnailPatch
  set(values: Record<string, unknown>): ThumbnailPatch
  unset(paths: string[]): ThumbnailPatch
  commit(): Promise<unknown>
}
interface ThumbnailClient {
  config(): {projectId?: string; dataset?: string}
  getDocument<T extends Record<string, unknown>>(id: string): Promise<T | undefined>
  patch(id: string): ThumbnailPatch
  assets: {
    upload(
      type: 'image',
      bytes: Blob,
      options: {filename: string; contentType: string},
    ): Promise<{_id: string}>
  }
}

type Asset = {
  _id: string
  _rev: string
  _type: string
  url: string
  mimeType?: string
  size?: number
  videoThumbnail?: {_ref?: string}
  videoThumbnailProcessing?: {owner: string; startedAt: number}
}
export class ThumbnailBusyError extends Error {}
export class ThumbnailInputError extends Error {}

/** Durable idempotency belongs to the immutable file asset, shared by every project. */
export async function processVideoThumbnail(
  client: ThumbnailClient,
  id: string,
  extract: () => Promise<Blob>,
): Promise<'created' | 'existing' | 'ignored'> {
  if (!/^file-[a-f0-9]{40}-[a-z0-9]+$/i.test(id))
    throw new ThumbnailInputError('Invalid file asset ID.')
  const asset = await client.getDocument<Asset>(id)
  if (!asset || asset._type !== 'sanity.fileAsset' || !asset.mimeType?.startsWith('video/'))
    return 'ignored'
  if (asset.videoThumbnail?._ref) {
    const image = await client.getDocument<{_id: string; _type: string}>(asset.videoThumbnail._ref)
    if (image?._type === 'sanity.imageAsset') return 'existing'
  }
  if ((asset.size ?? 0) > maximumVideoBytes) throw new ThumbnailInputError('Video exceeds 100 MiB.')
  const {projectId, dataset} = client.config()
  const [, hash, extension] = id.split('-')
  const expected =
    'https://cdn.sanity.io/files/' + projectId + '/' + dataset + '/' + hash + '.' + extension
  if (asset.url !== expected) throw new ThumbnailInputError('Unexpected video asset URL.')
  if (
    asset.videoThumbnailProcessing &&
    Date.now() - asset.videoThumbnailProcessing.startedAt < 300000
  ) {
    throw new ThumbnailBusyError('Thumbnail generation is already running.')
  }
  const owner = crypto.randomUUID()
  try {
    await client
      .patch(id)
      .ifRevisionId(asset._rev)
      .set({videoThumbnailProcessing: {owner, startedAt: Date.now()}})
      .commit()
  } catch (error) {
    if ((error as {statusCode?: number}).statusCode === 409)
      throw new ThumbnailBusyError('Another worker claimed this video.')
    throw error
  }
  try {
    const bytes = await extract()
    const image = await client.assets.upload('image', bytes, {
      filename: hash + '-thumbnail.' + (bytes.type === 'image/webp' ? 'webp' : 'png'),
      contentType: bytes.type,
    })
    const live = await client.getDocument<Asset>(id)
    if (live?.videoThumbnailProcessing?.owner !== owner)
      throw new ThumbnailBusyError('Thumbnail ownership changed.')
    await client
      .patch(id)
      .ifRevisionId(live._rev)
      .set({
        videoThumbnail: {_type: 'reference', _ref: image._id},
      })
      .unset(['videoThumbnailProcessing'])
      .commit()
    return 'created'
  } catch (error) {
    // Failed attempts can be retried; never clear a newer worker's lock.
    const live = await client.getDocument<Asset>(id).catch(() => undefined)
    if (live?.videoThumbnailProcessing?.owner === owner) {
      await client
        .patch(id)
        .ifRevisionId(live._rev)
        .unset(['videoThumbnailProcessing'])
        .commit()
        .catch(() => {
          /* An expired claim can be recovered by a later upload. */
        })
    }
    throw error
  }
}
