import sharp from 'sharp'

type Data = Exclude<Parameters<typeof sharp>[0], sharp.SharpOptions>
export type Query = {
  width?: number
  height?: number
  webp?: boolean
}

// return undefined if missing
const min = (defaultNum: number, n?: number): number | undefined =>
  n != null ? Math.min(defaultNum, n) : undefined

export const resize = (query: Query) => async (data: Data): Promise<Buffer> => {
  const image = sharp(data)
  const meta = await image.metadata()

  // guard
  if (meta.format !== 'jpeg') {
    throw new Error(`file format is not jpeg but: ${meta.format}`)
  }

  image.rotate() // before removing metadata

  // resize
  const w = min(meta.width, query.width)
  const h = min(meta.height, query.height)
  image.resize(w, h).max() // keep aspect ratio

  // convert
  if (query.webp) {
    image.webp()
  }

  return image.toBuffer()
}
