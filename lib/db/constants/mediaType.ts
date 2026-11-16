export const mediaTypes = [
  "image",
  "audio",
  "video",
  "cover",
  "banner" // N/A for albums or songs
] as const;
export type MediaType = (typeof mediaTypes)[number];