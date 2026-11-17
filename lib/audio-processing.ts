import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

import { albums, artists, db, mediaFiles, type MediaFile, type Song } from "./db";
import { and, eq, inArray, sql } from "drizzle-orm";

export interface TaggedAudioResult {
	blob: Blob;
	fileName: string;
}

type AudioExtension =
	| "mp3"
	| "wav"
	| "m4a"
	| "aac"
	| "ogg"
	| "flac"
	| "webm"
	| "aiff";

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
	if (!ffmpegPromise) {
		ffmpegPromise = (async () => {
			const ffmpeg = new FFmpeg();

			const coreBase = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";

			const coreURL = await toBlobURL(
				`${coreBase}/ffmpeg-core.js`,
				"text/javascript",
			);

			const wasmURL = await toBlobURL(
				`${coreBase}/ffmpeg-core.wasm`,
				"application/wasm",
			);

			await ffmpeg.load({ coreURL, wasmURL });

			return ffmpeg;
		})().catch((error: unknown) => {
			ffmpegPromise = null;
			throw error;
		});
	}

	return ffmpegPromise;
}

const MIME_EXTENSIONS: Record<string, AudioExtension> = {
	"audio/mpeg": "mp3",
	"audio/mp4": "m4a",
	"audio/x-m4a": "m4a",
	"audio/wav": "wav",
	"audio/x-wav": "wav",
	"audio/flac": "flac",
	"audio/x-flac": "flac",
	"audio/aac": "aac",
	"audio/ogg": "ogg",
	"audio/webm": "webm",
	"audio/aiff": "aiff",
	"audio/x-aiff": "aiff",
};

const VALID_EXTENSIONS = new Set<AudioExtension>([
	"mp3",
	"wav",
	"m4a",
	"aac",
	"ogg",
	"flac",
	"webm",
	"aiff",
]);

const EXTENSION_PRIORITY: Record<AudioExtension, number> = {
	flac: 100,
	wav: 90,
	aiff: 88,
	aac: 78,
	m4a: 76,
	ogg: 70,
	webm: 68,
	mp3: 50,
};

function getExtension(
	fileName: string,
	mimeType?: string | null,
	format?: string | null,
): AudioExtension {
	const candidates = [
		format?.toLowerCase().replace(/^\./, ""),
		(() => {
			try {
				return new URL(fileName).pathname.split(".").pop()?.toLowerCase();
			} catch {
				return fileName.split("?")[0].split(".").pop()?.toLowerCase();
			}
		})(),
	];

	for (const candidate of candidates) {
		if (candidate && VALID_EXTENSIONS.has(candidate as AudioExtension)) {
			return candidate as AudioExtension;
		}
	}

	const mimeExtension = mimeType
		? MIME_EXTENSIONS[mimeType.toLowerCase()]
		: undefined;

	if (mimeExtension) return mimeExtension;

	throw new Error(
		"Unsupported audio format. Supported formats: MP3, WAV, M4A, AAC, OGG, FLAC, WebM and AIFF.",
	);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	return new Uint8Array(bytes).buffer;
}

function sanitizeFileName(name: string): string {
	return name.replace(/[\\/:*?"<>|]/g, "_").trim() || "audio";
}

function getFileName(song: Song, extension: AudioExtension): string {
	return `${sanitizeFileName(song.name)}.${extension}`;
}

async function fetchFile(url: string, errorMessage: string): Promise<Uint8Array> {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`${errorMessage} (HTTP ${response.status})`);
	}

	return new Uint8Array(await response.arrayBuffer());
}

async function writeRemoteFile(
	ffmpeg: FFmpeg,
	url: string,
	path: string,
	errorMessage: string,
): Promise<void> {
	const bytes = await fetchFile(url, errorMessage);
	await ffmpeg.writeFile(path, bytes);
}

async function readOutput(
	ffmpeg: FFmpeg,
	path: string,
): Promise<Uint8Array> {
	const output = await ffmpeg.readFile(path);

	if (typeof output === "string") {
		throw new Error("FFmpeg returned an invalid output file.");
	}

	return output;
}

export function pickBestAudioFile(files: MediaFile[]): MediaFile | null {
	if (!files.length) return null;

	return [...files].sort((a, b) => {
		const getScore = (file: MediaFile): number => {
			let extension: string | undefined;

			try {
				extension = new URL(file.url).pathname.split(".").pop()?.toLowerCase();
			} catch {
				extension = file.url.split(".").pop()?.toLowerCase();
			}

			const priority = EXTENSION_PRIORITY[extension as AudioExtension] ?? 0;

			const size = Math.max(
				0,
				Number(file.sizeBytes || 0) / (1024 * 1024),
			);

			return priority + size;
		};

		return getScore(b) - getScore(a);
	})[0];
}

export async function stripAudioMetadata(file: File): Promise<File> {
	const extension = getExtension(file.name, file.type);

	const ffmpeg = await getFFmpeg();

	const UUID = crypto.randomUUID();

	const inputPath = `input-${UUID}.${extension}`;
	const outputPath = `output-${UUID}.${extension}`;

	try {
		await ffmpeg.writeFile(
			inputPath,
			new Uint8Array(await file.arrayBuffer()),
		);

		const result = await ffmpeg.exec([
			"-i", inputPath,
			"-map", "0:a:0",
			"-map_metadata", "-1",
			"-map_chapters", "-1",
			"-c:a", "copy",
			outputPath,
		]);

		if (result !== 0) {
			throw new Error("Could not remove audio metadata.");
		}

		const output = await readOutput(ffmpeg, outputPath);

		return new File(
			[toArrayBuffer(output)],
			file.name,
			{ type: file.type || "application/octet-stream" },
		);
	} finally {
		await ffmpeg.deleteFile(inputPath).catch(() => {});
		await ffmpeg.deleteFile(outputPath).catch(() => {});
	}
}

function getMetadataJoiners(joiner: MetadataJoiner) {
    if (typeof joiner === "string") {
        return {
            artist: joiner,
            genre: joiner,
            tags: joiner,
        };
    }

    return joiner;
}

export interface MetadataJoiners {
    artist: string;
    genre: string;
    tags: string;
}

export type MetadataJoiner = string | MetadataJoiners;

export async function createTaggedAudio(
	song: Song,
	media: MediaFile,
	joiner: MetadataJoiner = ", "
): Promise<TaggedAudioResult> {
	const ffmpeg = await getFFmpeg();

	const extension = getExtension(
		media.url,
		media.mimeType,
		media.format,
	);

	const UUID = crypto.randomUUID();

	const inputPath = `source-${UUID}.${extension}`;
	const outputPath = `tagged-${UUID}.${extension}`;
	const fCoverPath = `f-cover-${UUID}.${extension}`;

	try {
		await writeRemoteFile(
			ffmpeg,
			media.url,
			inputPath,
			`Could not download audio for "${song.name}".`,
		);

		const args = [
			"-i", inputPath,
		];

		const album = await db.query.albums.findFirst({
			where: sql`${albums.songs} @> ${JSON.stringify([song.id])}::jsonb`,
		});

		const albumCover = album?.media.length
			? await db.query.mediaFiles.findFirst({
				where: and(
					eq(mediaFiles.type, "cover-front"),
					inArray(mediaFiles.url, album.media),
				),
			})
			: undefined;

		const songCover = song.media.length
			? await db.query.mediaFiles.findFirst({
				where: and(
					eq(mediaFiles.type, "cover-front"),
					inArray(mediaFiles.url, song.media),
				),
			})
			: undefined;

		const fCover = albumCover ?? songCover;

		if (fCover) {
			await writeRemoteFile(
				ffmpeg,
				fCover.url,
				fCoverPath,
				`Could not download cover art for "${song.name}".`,
			);

			args.push(
				"-i", fCoverPath,
				"-map", "0:a:0",
				"-map", "1:v:0",
				"-c:v", "copy",
				"-disposition:v:0", "attached_pic",
				"-metadata:s:v:0", "title=Album cover",
				"-metadata:s:v:0", "comment=Cover (front)",
			);
		} else {
			args.push("-map", "0:a:0");
		}

		args.push(
			"-map_metadata", "-1",
			"-map_chapters", "-1",
			"-c:a", "copy",
		);

		const artistRecords = song.artists.length
			? await db.query.artists.findMany({
				where: inArray(artists.id, song.artists),
			})
			: [];
		
		const artistNames = song.artists
			.map(id => artistRecords.find(artist => artist.id === id)?.name)
    		.filter((name): name is string => Boolean(name));

		const separators = getMetadataJoiners(joiner);

		const metadata = {
			title: song.name,
			artist: artistNames.join(separators.artist),
			album: album?.name ?? "",
			date: song.releaseDate ?? "",
			genre: song.genres.join(separators.genre),
			comment: song.tags.join(separators.tags),
		};

		for (const [key, value] of Object.entries(metadata)) {
			args.push("-metadata", `${key}=${value}`);
		}

		if (extension === "mp3") {
			args.push("-id3v2_version", "3");
		}

		args.push(outputPath);

		const result = await ffmpeg.exec(args);

		if (result !== 0) {
			throw new Error(
				`Could not tag "${song.name}". This format may not support the requested metadata or cover art.`,
			);
		}

		const output = await readOutput(ffmpeg, outputPath);

		return {
			blob: new Blob(
				[toArrayBuffer(output)],
				{ type: media.mimeType || "application/octet-stream" },
			),
			fileName: getFileName(song, extension),
		};
	} finally {
		await ffmpeg.deleteFile(inputPath).catch(() => {});
		await ffmpeg.deleteFile(fCoverPath).catch(() => {});
		await ffmpeg.deleteFile(outputPath).catch(() => {});
	}
}

export async function triggerTaggedAudioDownload(
	song: Song,
	media: MediaFile
): Promise<void> {
	const { blob, fileName } = await createTaggedAudio(
		song,
		media
	);

	const url = URL.createObjectURL(blob);

	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;

	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();

	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
