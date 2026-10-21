"use client";

import { ArrowLeft, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ArchiveEntryRow from "@/app/pieces/archive-entry-row";
import ReadMore from "@/app/pieces/read-more";

type Album = { id: string; title: string; artists: string[]; aka: string[]; bio: string; imageUrl: string | null; releaseYear: number | null; tracklist: string[]; collective: string | null; links?: Array<{ label: string; url: string; icon?: string | null }> };
type RelatedSong = { id: string; kind: "song" | "album" | "artist" | "collective"; title: string; artists: string[]; bio: string; source: string | null; fileUrl: string | null; mediaUrl: string | null; tracklist: string[]; releaseYear: number | null; collective: string | null; audioFiles?: Array<{ id: string; fileName: string; fileType: string; fileSize: number; url: string }> };

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [entries, setEntries] = useState<RelatedSong[]>([]);
  const [artistIds, setArtistIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetch(`/api/archive/albums/${encodeURIComponent(params.id)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Album not found.");
        if (active) {
          setAlbum(result.album);
          setEntries(result.entries);
          setArtistIds(Object.fromEntries((result.artists as { id: string; title: string }[]).map((item) => [item.title.toLowerCase(), item.id])));
        }
      })
      .catch((reason: Error) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.id]);

  if (loading) return <main className="artist-page"><p>Loading…</p></main>;
  if (!album) return <main className="artist-page artist-page-not-found"><p className="artist-page-error">{error || "Album not found."}</p></main>;

  return (
    <main className="artist-page">
      <div className="artist-page-actions">
        <Link className="artist-back-link" href="/"><ArrowLeft size={15} /> Archive</Link>
        <button type="button" className="bulk-download-button" onClick={() => router.push(`/bulk?type=album&id=${encodeURIComponent(params.id)}`)} disabled={!entries.length}>
          <Download size={15} /> Download album
        </button>
      </div>
      <div className="artist-layout">
        <section className="artist-main" aria-label="Album tracks">
          <header className="artist-section-heading"><h1>Tracks</h1><span>{entries.length}</span></header>
          {entries.length ? <div className="artist-entry-list">{entries.map((entry) => <ArchiveEntryRow key={entry.id} entry={{ ...entry, artistIds }} />)}</div> : <p className="artist-empty">No tracks yet.</p>}
        </section>
        <aside className="artist-sidebar">
          <div className="artist-photo">{album.imageUrl ? <Image src={album.imageUrl} alt="" width={104} height={104} unoptimized /> : <span>{album.title.slice(0, 1).toUpperCase()}</span>}</div>
          <div className="artist-record-info"><span>ALBUM</span><h2>{album.title}</h2>{album.aka.length > 0 && <p><strong>AKA</strong> <ReadMore maxLines={2} className="meta-read-more">{album.aka.join(", ")}</ReadMore></p>}</div>
          {album.bio && <ReadMore maxLines={4} className="artist-bio-read-more"><p className="artist-bio">{album.bio}</p></ReadMore>}
          {album.releaseYear && <p className="artist-bio">Released {album.releaseYear}</p>}
          {album.collective && <p className="artist-bio">Collective: {album.collective}</p>}
        </aside>
      </div>
    </main>
  );
}
