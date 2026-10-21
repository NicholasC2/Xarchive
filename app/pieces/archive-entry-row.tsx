import { Disc3, Users, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ReadMore from "@/app/pieces/read-more";
import { triggerTaggedAudioDownload } from "@/lib/audio-processing";
import "./archive-entry-row.css";

export type ArchiveLink = {
  label: string;
  url: string;
  icon?: string | null;
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
  mediaUrl?: string | null;
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
  const artists = entry.artists ?? [];
  const artistIds = entry.artistIds ?? {};
  const aka = entry.aka ?? [];
  const tracklist = entry.tracklist ?? [];
  const externalLinks = entry.links ?? [];
  const audioFiles = entry.audioFiles ?? [];

  return (
    <article className="archive-entry-row">
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
        {entry.bio && <ReadMore maxLines={3} className="archive-entry-bio-read-more"><p className="archive-entry-bio">{entry.bio}</p></ReadMore>}
        {entry.kind === "album" && <div className="archive-entry-toolbar"><Link href={`/albums/${encodeURIComponent(entry.id)}`}>Open album</Link></div>}
        {externalLinks.length > 0 && <div className="archive-entry-links">{externalLinks.map((link) => <a key={`${link.label}-${link.url}`} className="archive-entry-link" href={link.url} target="_blank" rel="noreferrer"><span className="archive-link-icon">{getLinkIcon(link.icon)}</span>{link.label}</a>)}</div>}
        {audioFiles.length > 0 && (
          <div className="audio-file-list">
            <div className="audio-file-list-heading">Audio files <span>{audioFiles.length}</span></div>
            {audioFiles.map((file, index) => (
              <div key={file.id} className="audio-file-item">
                <div className="audio-file-meta"><span>{index === 0 ? "Primary" : `Variant ${index + 1}`}</span><strong>{file.fileName}</strong><small>{Math.max(1, Math.round((Number(file.fileSize) || 0) / (1024 * 1024)))} MB</small></div>
                <div className="audio-file-actions">
                  <button type="button" onClick={() => {
                    void triggerTaggedAudioDownload({
                      id: file.id,
                      title: entry.title,
                      artists: artists.length ? artists : ["Unknown artist"],
                      album: entry.kind === "song" && entry.artists?.length ? entry.title : undefined,
                      releaseYear: entry.releaseYear ?? undefined,
                      genres: entry.genres ?? [],
                      tags: entry.tags ?? [],
                      fileName: file.fileName,
                      fileType: file.fileType,
                      fileUrl: file.url,
                      coverUrl: entry.mediaUrl ?? undefined,
                    });
                  }}>Download</button>
                </div>
              </div>
            ))}
            {entry.fileUrl && <audio controls preload="none" src={entry.fileUrl} aria-label={`Listen to ${entry.title}`} />}
          </div>
        )}
        {!audioFiles.length && entry.fileUrl && <audio controls preload="none" src={entry.fileUrl} aria-label={`Listen to ${entry.title}`} />}
      </div>
      {showContributor && entry.createdBy ? (
        <div className="archive-entry-meta">{entry.source && <span>{entry.source}</span>}<Link href={`/profile/${encodeURIComponent(entry.createdBy)}`}>{entry.creatorName || "Listener"}</Link></div>
      ) : entry.source ? <span className="archive-entry-meta">{entry.source}</span> : null}
    </article>
  );
}