export type AudioFileRow = {
  id: string;
  songId: string;
  fileName: string;
  fileType: string;
  fileSize: number | string;
};

export type AudioFileSummary = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
};

export function withAudioFileSummaries<T extends { id: string; kind: string; fileUrl?: string | null }>(
  entries: T[],
  audioRows: AudioFileRow[],
) {
  const audioBySong = new Map<string, AudioFileSummary[]>();
  for (const audio of audioRows) {
    const files = audioBySong.get(audio.songId) ?? [];
    files.push({
      id: audio.id,
      fileName: audio.fileName,
      fileType: audio.fileType,
      fileSize: Number(audio.fileSize),
      url: `/api/archive/${encodeURIComponent(audio.songId)}/audio?file=${encodeURIComponent(audio.id)}`,
    });
    audioBySong.set(audio.songId, files);
  }

  return entries.map((entry) => {
    const audioFiles = audioBySong.get(entry.id) ?? [];
    return {
      ...entry,
      audioFiles,
      fileUrl: audioFiles[0]?.url ?? (entry.kind === "song" ? `/api/archive/${encodeURIComponent(entry.id)}/audio` : entry.fileUrl ?? null),
    };
  });
}
