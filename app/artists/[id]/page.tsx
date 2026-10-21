"use client";

import { ArrowLeft, Download, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ArchiveEntryRow from "@/app/pieces/archive-entry-row";
import ReadMore from "@/app/pieces/read-more";
import "./artist-page.css";

type Artist = { id: string; title: string; aka: string[]; bio: string; imageUrl: string | null; images?: { id: string; url: string; kind: string; alt: string }[] };
type RelatedEntry = { id: string; kind: "song" | "album" | "artist" | "collective"; title: string; artists: string[]; bio: string; source: string | null; fileUrl: string | null; mediaUrl: string | null; tracklist: string[]; releaseYear: number | null; collective: string | null };

export default function ArtistPage() {
  const params = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [entries, setEntries] = useState<RelatedEntry[]>([]);
  const [artistIds, setArtistIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetch(`/api/archive/artists/${encodeURIComponent(params.id)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Artist not found.");
        if (active) {
          setArtist(result.artist);
          setEntries(result.entries);
          setArtistIds(Object.fromEntries((result.artists as { id: string; title: string }[]).map((item) => [item.title.toLowerCase(), item.id])));
        }
      })
      .catch((reason: Error) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.id]);

  if (loading) return <main className="artist-page"><p>Loading…</p></main>;
  if (!artist) return <main className="artist-page artist-page-not-found"><p className="artist-page-error">{error || "Artist not found."}</p></main>;

  return (
    <main className="artist-page">
      <div className="artist-page-actions">
        <Link className="artist-back-link" href="/"><ArrowLeft size={15} /> Archive</Link>
        <button type="button" className="bulk-download-button" onClick={() => router.push(`/bulk?type=artist&id=${encodeURIComponent(params.id)}`)} disabled={!entries.some((entry) => entry.kind === "song")}>
          <Download size={15} /> Download artist
        </button>
      </div>
      <div className="artist-layout">
        <section className="artist-main" aria-label="Artist archive entries">
          <header className="artist-section-heading"><h1>Archive entries</h1><span>{entries.length}</span></header>
          {entries.length ? <div className="artist-entry-list">{entries.map((entry) => <ArchiveEntryRow key={entry.id} entry={{ ...entry, artistIds }} />)}</div> : <p className="artist-empty">No entries.</p>}
        </section>
        <aside className="artist-sidebar">
          <div className="artist-photo">{artist.imageUrl ? <Image src={artist.imageUrl} alt="" width={104} height={104} unoptimized /> : <Users size={28} />}</div>
          <div className="artist-record-info"><span>ARTIST</span><h2>{artist.title}</h2>{artist.aka.length > 0 && <p className="artist-aka"><strong>AKA</strong> <ReadMore text={artist.aka.join(", ")} lines={1} /></p>}</div>
          {artist.bio && <div className="artist-bio"><ReadMore text={artist.bio} lines={5} /></div>}
          {artist.images && artist.images.length > 1 && <div className="artist-gallery">{artist.images.map((image) => <Image key={image.id} src={image.url} alt={image.alt} width={70} height={70} unoptimized />)}</div>}
        </aside>
      </div>
    </main>
  );
}