import * as sharp from "sharp";

type Data = Buffer | string;

export interface Query {
  width?: number;
  height?: number;
  webp?: boolean;
}

export const resize = (query: Query) => async (data: Data): Promise<Buffer> => {
  const image = sharp(data);
  const meta = await image.metadata();

  // guard
  if (meta.format !== "jpeg") {
    throw new Error(`file format is not jpeg but: ${meta.format}`);
  }

  image.rotate(); // before removing metadata

  const { width, height, webp } = query;

  // resize
  const w = min(meta.width, width);
  const h = min(meta.height, height);
  image.resize(w, h).max(); // keep aspect ratio

  // convert
  if (webp) {
    image.webp();
  }

  return await image.toBuffer();
};

// return null if null
const min = (defaultNum: number, n?: number) => n && Math.min(defaultNum, n);
