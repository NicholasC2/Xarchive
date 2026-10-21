export type ArchiveImageRow = {
  id: string;
  entryId: string;
  imageKind?: string;
  alt?: string;
};

export type ArchiveImageSummary = {
  id: string;
  url: string;
  kind: string;
  alt: string;
};

export function withArchiveImageSummaries<
  T extends { id: string; kind: string; mediaUrl?: string | null },
>(entries: T[], imageRows: ArchiveImageRow[]) {
  const imageByEntry = new Map<string, ArchiveImageSummary[]>();
  for (const image of imageRows) {
    const images = imageByEntry.get(image.entryId) ?? [];
    images.push({
      id: image.id,
      url: `/api/archive/${encodeURIComponent(image.entryId)}/images/${encodeURIComponent(image.id)}`,
      kind: image.imageKind ?? "gallery",
      alt: image.alt ?? "",
    });
    imageByEntry.set(image.entryId, images);
  }

  return entries.map((entry) => {
    const images = imageByEntry.get(entry.id) ?? [];
    const cover = images.find((image) => image.kind === "cover");
    const banner = images.find((image) => image.kind === "banner");
    return {
      ...entry,
      images,
      mediaUrl: cover?.url ?? entry.mediaUrl ?? null,
      bannerUrl: banner?.url ?? null,
    };
  });
}
