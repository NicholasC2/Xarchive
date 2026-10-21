"use client";

import { Disc3, Users, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createTaggedAudio } from "@/lib/audio-processing";
import { useRouter } from "next/navigation";
import { MouseEvent, KeyboardEvent } from "react";
import "./archive-entry-row.css";

export type AudioFileSummary = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  source?: string | null;
  bio?: string;
  labels?: string[];
};

export type ArchiveEntrySummary = {
  id: string;
  kind: "song" | "album" | "artist" | "collective";
  title: string;
  artists?: string[];
  artistIds?: Record<string, string>;
  aka?: string[];
  bio?: string;
  source?: string | null;
  fileUrl?: string | null;
  audioFiles?: AudioFileSummary[];
  mediaUrl?: string | null;
  album?: string | null;
  tags?: string[];
  genres?: string[];
  images?: { id: string; url: string; kind: string; alt: string }[];
  collective?: string | null;
  releaseYear?: number | null;
  tracklist?: string[];
  tags?: string[];
  genres?: string[];
  createdBy?: string;
  creatorName?: string | null;
  links?: ArchiveLink[];
  audioFiles?: Array<{ id: string; fileName: string; fileType: string; fileSize: number; url: string }>;
};

const linkIconMap: Record<string, string> = {
  spotify: "♪",
  soundcloud: "◌",
  youtube: "▶",
  bandcamp: "B",
  tidal: "T",
  apple: "A",
  applemusic: "A",
  website: "↗",
  instagram: "◎",
  x: "X",
  twitter: "X",
  discord: "D",
  lastfm: "L",
};

function getLinkIcon(icon?: string | null) {
  const normalized = (icon ?? "website").toLowerCase().replace(/\s+/g, "-");
  return linkIconMap[normalized] ?? "↗";
}

function ArtistNames({ names, artistIds }: { names: string[]; artistIds: Record<string, string> }) {
  return <>{names.map((name, index) => {
    const id = artistIds[name.toLowerCase()];
    return <span key={`${name}-${index}`}>{id ? <Link className="artist-name-link" href={`/artists/${encodeURIComponent(id)}`}>{name}</Link> : name}{index < names.length - 1 ? ", " : ""}</span>;
  })}</>;
}

export default function ArchiveEntryRow({ entry, showContributor = false }: { entry: ArchiveEntrySummary; showContributor?: boolean }) {
  const [taggingFile, setTaggingFile] = useState("");
  const [tagError, setTagError] = useState("");
  const router = useRouter();
  const artists = entry.artists ?? [];
  const artistIds = entry.artistIds ?? {};
  const aka = entry.aka ?? [];
  const tracklist = entry.tracklist ?? [];
  const audioFiles = entry.audioFiles ?? [];

  async function downloadTaggedAudio(audioFile: AudioFileSummary) {
    setTaggingFile(audioFile.id);
    setTagError("");
    try {
      const { blob, fileName } = await createTaggedAudio({
        id: entry.id,
        title: entry.title,
        artists,
        album: entry.album,
        releaseYear: entry.releaseYear,
        genres: entry.genres,
        tags: entry.tags,
        fileName: audioFile.fileName,
        fileType: audioFile.fileType,
        fileUrl: audioFile.url,
        coverUrl: entry.mediaUrl,
        source: audioFile.source,
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (reason) {
      setTagError(reason instanceof Error ? reason.message : "Could not create a tagged audio file.");
    } finally {
      setTaggingFile("");
    }
  }

  function openEntry(event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) {
    if (event.target instanceof Element && event.target.closest("a, button, audio, input, select, textarea")) return;
    router.push(`/entries/${encodeURIComponent(entry.id)}`);
  }

  return (
    <article className="archive-entry-row" role="link" tabIndex={0} onClick={openEntry} onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openEntry(event);
      }
    }}>
      <div className="archive-entry-art">
        {entry.mediaUrl ? <Image src={entry.mediaUrl} alt="" width={48} height={48} unoptimized /> : entry.kind === "collective" ? <UsersRound size={21} /> : entry.kind === "artist" ? <Users size={21} /> : <Disc3 size={22} />}
      </div>
      <div className="archive-entry-content">
        <div className="archive-entry-title"><span>{entry.kind}</span><h2>{entry.kind === "artist" && artistIds[entry.title.toLowerCase()] ? <Link className="entry-title-link" href={`/artists/${encodeURIComponent(artistIds[entry.title.toLowerCase()])}`}>{entry.title}</Link> : entry.kind === "album" ? <Link className="entry-title-link" href={`/albums/${encodeURIComponent(entry.id)}`}>{entry.title}</Link> : entry.title}</h2></div>
        {(entry.kind === "song" || entry.kind === "album") && <p><ArtistNames names={artists} artistIds={artistIds} />{entry.releaseYear ? ` · ${entry.releaseYear}` : ""}</p>}
        {entry.kind === "artist" && aka.length > 0 && <p className="aka-row"><span>AKA:</span> <ReadMore maxLines={2} className="meta-read-more">{aka.join(", ")}</ReadMore></p>}
        {entry.kind === "collective" && <p>Artists: <ArtistNames names={artists} artistIds={artistIds} /></p>}
        {entry.collective && <p>Collective: {entry.collective}</p>}
        {tracklist.length > 0 && <p className="archive-entry-tracklist">{entry.kind === "album" ? `${tracklist.length} tracks · ` : ""}{tracklist.join(" · ")}</p>}
        {entry.bio && <p className="archive-entry-bio">{entry.bio}</p>}
        {entry.kind === "song" && (
          <div className="audio-file-list">
            {(audioFiles.length ? audioFiles : entry.fileUrl ? [{ id: entry.id, fileName: "Audio", fileType: "audio/mpeg", fileSize: 0, url: entry.fileUrl }] : []).map((file) => (
              <div className="audio-file-item" key={file.id}>
                <div className="audio-file-details"><strong>{file.fileName}</strong><span>{file.fileType}{file.fileSize ? ` · ${(file.fileSize / (1024 * 1024)).toFixed(1)} MB` : ""}</span></div>
                <audio controls preload="none" src={file.url} aria-label={`Listen to ${entry.title} — ${file.fileName}`} />
                <div className="audio-file-actions">
                  <a href={`${file.url}${file.url.includes("?") ? "&" : "?"}download=1`} aria-label={`Download ${file.fileName}`}>Download</a>
                  <button type="button" onClick={() => void downloadTaggedAudio(file)} disabled={taggingFile !== ""} aria-label={`Download tagged ${file.fileName}`}>
                    {taggingFile === file.id ? "Tagging…" : "Tagged"}
                  </button>
                </div>
              </div>
            ))}
            {tagError && <p className="audio-file-error" role="alert">{tagError}</p>}
          </div>
        )}
        {audioFiles.map((file) => (file.bio || file.source || file.labels?.length) ? (
          <div className="audio-file-meta" key={`${file.id}-meta`}>
            {file.source && <span>Source: {file.source}</span>}{file.labels?.map((label) => <span key={label}>{label}</span>)}{file.bio && <p>{file.bio}</p>}
          </div>
        ) : null)}
      </div>
      {showContributor && entry.createdBy ? (
        <div className="archive-entry-meta">{entry.source && <span>{entry.source}</span>}<Link href={`/profile/${encodeURIComponent(entry.createdBy)}`}>{entry.creatorName || "Listener"}</Link></div>
      ) : entry.source ? <span className="archive-entry-meta">{entry.source}</span> : null}
    </article>
  );
}