import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

export type DownloadTrack = {
  id: string;
  title: string;
  artists: string[];
  album?: string | null;
  releaseYear?: number | null;
  genres?: string[];
  tags?: string[];
  fileName: string;
  fileType?: string | null;
  fileUrl: string;
  coverUrl?: string | null;
};

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      const coreBase = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
      const coreURL = await toBlobURL(`${coreBase}/ffmpeg-core.js`, "text/javascript");
      const wasmURL = await toBlobURL(`${coreBase}/ffmpeg-core.wasm`, "application/wasm");
      await ffmpeg.load({ coreURL, wasmURL });
      return ffmpeg;
    })().catch((error: unknown) => {
      ffmpegPromise = null;
      throw error;
    });
  }
  return ffmpegPromise;
}

function audioExtension(fileName: string, fileType?: string | null) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]{2,5}$/.test(extension)) return extension;
  const mimeExtension: Record<string, string> = {
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/x-wav": "wav",
    "audio/wav": "wav",
    "audio/flac": "flac",
    "audio/ogg": "ogg",
    "audio/aac": "aac",
    "audio/webm": "webm",
  };
  return fileType ? mimeExtension[fileType] : undefined;
}

function toArrayBuffer(bytes: Uint8Array) {
  return new Uint8Array(bytes).buffer;
}

export function pickBestAudioFile<T extends { fileName: string; fileType?: string | null; fileSize?: number | string; url: string }>(files: T[]) {
  if (!files.length) return null;
  const extensionPriority: Record<string, number> = {
    flac: 100,
    wav: 90,
    aiff: 88,
    aac: 78,
    m4a: 76,
    mp4: 76,
    ogg: 70,
    webm: 68,
    mp3: 50,
  };

  return [...files].sort((left, right) => {
    const leftExtension = (left.fileName.split(".").pop() || left.fileType?.split("/").pop() || "").toLowerCase();
    const rightExtension = (right.fileName.split(".").pop() || right.fileType?.split("/").pop() || "").toLowerCase();
    const leftScore = (extensionPriority[leftExtension] ?? 0) + Math.max(0, Number(left.fileSize || 0) / (1024 * 1024));
    const rightScore = (extensionPriority[rightExtension] ?? 0) + Math.max(0, Number(right.fileSize || 0) / (1024 * 1024));
    return rightScore - leftScore;
  })[0];
}

export async function stripAudioMetadata(file: File) {
  const extension = audioExtension(file.name, file.type);
  if (!extension) throw new Error("Use an MP3, WAV, M4A, AAC, OGG, FLAC, or WebM audio file.");
  const ffmpeg = await getFFmpeg();
  const inputPath = `upload-${crypto.randomUUID()}.${extension}`;
  const outputPath = `clean-${crypto.randomUUID()}.${extension}`;
  try {
    await ffmpeg.writeFile(inputPath, new Uint8Array(await file.arrayBuffer()));
    const result = await ffmpeg.exec([
      "-i", inputPath,
      "-map", "0:a:0",
      "-map_metadata", "-1",
      "-map_chapters", "-1",
      "-c:a", "copy",
      outputPath,
    ]);
    if (result !== 0) throw new Error("Could not clean metadata from this audio file.");
    const cleaned = await ffmpeg.readFile(outputPath);
    if (typeof cleaned === "string") throw new Error("Could not read the cleaned audio file.");
    return new File([toArrayBuffer(cleaned)], file.name, { type: file.type || "application/octet-stream" });
  } finally {
    await ffmpeg.deleteFile(inputPath).catch(() => {});
    await ffmpeg.deleteFile(outputPath).catch(() => {});
  }
}

export async function createTaggedAudio(track: DownloadTrack) {
  const extension = audioExtension(track.fileName, track.fileType);
  if (!extension) throw new Error(`Unsupported audio format for ${track.title}.`);
  const ffmpeg = await getFFmpeg();
  const inputPath = `source-${crypto.randomUUID()}.${extension}`;
  const coverExtension = track.coverUrl?.startsWith("data:image/png") ? "png" : "jpg";
  const coverPath = `cover-${crypto.randomUUID()}.${coverExtension}`;
  const outputPath = `tagged-${crypto.randomUUID()}.${extension}`;
  try {
    const audioBytes = new Uint8Array(await (await fetch(track.fileUrl)).arrayBuffer());
    await ffmpeg.writeFile(inputPath, audioBytes);
    const args = ["-i", inputPath];
    if (track.coverUrl) {
      const coverBytes = new Uint8Array(await (await fetch(track.coverUrl)).arrayBuffer());
      await ffmpeg.writeFile(coverPath, coverBytes);
      args.push("-i", coverPath, "-map", "0:a:0", "-map", "1:v:0");
    } else {
      args.push("-map", "0:a:0");
    }
    args.push(
      "-map_metadata", "-1",
      "-c:a", "copy",
      "-metadata", `title=${track.title}`,
      "-metadata", `artist=${track.artists.join(" & ")}`,
      "-metadata", `album=${track.album || ""}`,
      "-metadata", `date=${track.releaseYear || ""}`,
      "-metadata", `genre=${(track.genres ?? []).join("; ")}`,
      "-metadata", `comment=${(track.tags ?? []).join(", ")}`,
    );
    if (track.coverUrl) {
      args.push(
        "-c:v", "copy",
        "-disposition:v:0", "attached_pic",
        "-metadata:s:v:0", "title=Album cover",
        "-metadata:s:v:0", "comment=Cover (front)",
      );
    }
    if (extension === "mp3") args.push("-id3v2_version", "3");
    args.push(outputPath);
    const result = await ffmpeg.exec(args);
    if (result !== 0) throw new Error(`Could not add metadata to ${track.title}; this audio format may not support embedded cover art.`);
    const tagged = await ffmpeg.readFile(outputPath);
    if (typeof tagged === "string") throw new Error(`Could not read the tagged file for ${track.title}.`);
    return {
      blob: new Blob([toArrayBuffer(tagged)], { type: track.fileType || "application/octet-stream" }),
      fileName: `${track.title.replace(/[\\/:*?"<>|]/g, "_")}.${extension}`,
    };
  } finally {
    await ffmpeg.deleteFile(inputPath).catch(() => {});
    await ffmpeg.deleteFile(coverPath).catch(() => {});
    await ffmpeg.deleteFile(outputPath).catch(() => {});
  }
}

export async function triggerTaggedAudioDownload(track: DownloadTrack) {
  const { blob, fileName } = await createTaggedAudio(track);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
