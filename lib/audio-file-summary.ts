export type AudioFileRow = {
  id: string;
  songId: string;
  fileName: string;
  fileType: string;
  fileSize: number | string;
  source?: string | null;
  bio?: string;
  labels?: string[];
};

export type AudioFileSummary = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  source: string | null;
  bio: string;
  labels: string[];
};

function qualityRank(audio: AudioFileRow) {
  const format = `${audio.fileType} ${audio.fileName}`.toLowerCase();
  return /\b(flac|wav|wave|alac|aiff|ape|wv)\b/.test(format) ? 0 : 1;
}

export function withAudioFileSummaries<T extends { id: string; kind: string; fileUrl?: string | null }>(
  entries: T[],
  audioRows: AudioFileRow[],
) {
  const audioBySong = new Map<string, AudioFileSummary[]>();
  const sortedAudioRows = [...audioRows].sort((left, right) =>
    qualityRank(left) - qualityRank(right) || Number(right.fileSize) - Number(left.fileSize),
  );
  for (const audio of sortedAudioRows) {
    const files = audioBySong.get(audio.songId) ?? [];
    files.push({
      id: audio.id,
      fileName: audio.fileName,
      fileType: audio.fileType,
      fileSize: Number(audio.fileSize),
      url: `/api/archive/${encodeURIComponent(audio.songId)}/audio?file=${encodeURIComponent(audio.id)}`,
      source: audio.source ?? null,
      bio: audio.bio ?? "",
      labels: audio.labels ?? [],
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
