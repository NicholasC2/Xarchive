import { Disc3, Users, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import "./archive-entry-row.css";

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
  createdBy?: string;
  creatorName?: string | null;
};

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

  return (
    <article className="archive-entry-row">
      <div className="archive-entry-art">
        {entry.mediaUrl ? <Image src={entry.mediaUrl} alt="" width={48} height={48} unoptimized /> : entry.kind === "collective" ? <UsersRound size={21} /> : entry.kind === "artist" ? <Users size={21} /> : <Disc3 size={22} />}
      </div>
      <div className="archive-entry-content">
        <div className="archive-entry-title"><span>{entry.kind}</span><h2>{entry.kind === "artist" && artistIds[entry.title.toLowerCase()] ? <Link href={`/artists/${encodeURIComponent(artistIds[entry.title.toLowerCase()])}`}>{entry.title}</Link> : entry.title}</h2></div>
        {(entry.kind === "song" || entry.kind === "album") && <p><ArtistNames names={artists} artistIds={artistIds} />{entry.releaseYear ? ` · ${entry.releaseYear}` : ""}</p>}
        {entry.kind === "artist" && aka.length > 0 && <p>AKA: {aka.join(", ")}</p>}
        {entry.kind === "collective" && <p>Artists: <ArtistNames names={artists} artistIds={artistIds} /></p>}
        {entry.collective && <p>Collective: {entry.collective}</p>}
        {tracklist.length > 0 && <p className="archive-entry-tracklist">{entry.kind === "album" ? `${tracklist.length} tracks · ` : ""}{tracklist.join(" · ")}</p>}
        {entry.bio && <p className="archive-entry-bio">{entry.bio}</p>}
        {entry.fileUrl && <audio controls preload="none" src={entry.fileUrl} aria-label={`Listen to ${entry.title}`} />}
      </div>
      {showContributor && entry.createdBy ? (
        <div className="archive-entry-meta">{entry.source && <span>{entry.source}</span>}<Link href={`/profile/${encodeURIComponent(entry.createdBy)}`}>{entry.creatorName || "Listener"}</Link></div>
      ) : entry.source ? <span className="archive-entry-meta">{entry.source}</span> : null}
    </article>
  );
}