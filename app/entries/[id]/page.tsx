"use client";

import { ArrowLeft, Disc3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ArchiveComments from "@/app/pieces/archive-comments";
import ArchiveEntryRow, { ArchiveEntrySummary } from "@/app/pieces/archive-entry-row";
import ReadMore from "@/app/pieces/read-more";
import "./entry-page.css";

type EntryResponse = { entry: ArchiveEntrySummary; comments: unknown[] };

export default function EntryPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EntryResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/archive/${encodeURIComponent(id)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load this archive entry.");
        if (active) setData(result);
      })
      .catch((reason: Error) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <main className="entry-detail-page"><p className="entry-detail-state">Loading entry…</p></main>;
  if (!data) return <main className="entry-detail-page"><p className="entry-detail-state" role="alert">{error || "Entry not found."}</p></main>;

  const { entry } = data;
  return (
    <main className="entry-detail-page">
      <Link className="entry-detail-back" href="/search"><ArrowLeft size={14} /> Back to search</Link>
      <header className="entry-detail-heading">
        {entry.mediaUrl ? <Image className="entry-detail-cover" src={entry.mediaUrl} alt="" width={128} height={128} unoptimized /> : <div className="entry-detail-cover entry-detail-placeholder"><Disc3 size={32} /></div>}
        <div><span>{entry.kind}</span><h1>{entry.title}</h1>
          {entry.artists?.length ? <p>{entry.artists.join(", ")}</p> : null}
          {entry.album && <p>Album: {entry.album}</p>}
          {entry.releaseYear && <p>{entry.releaseYear}</p>}
        </div>
      </header>
      {entry.images && entry.images.length > 1 && (
        <div className="entry-image-gallery" aria-label="Image gallery">
          {entry.images.map((image) => <Image key={image.id} src={image.url} alt={image.alt} width={130} height={130} unoptimized />)}
        </div>
      )}
      {entry.aka?.length ? <section className="entry-detail-text"><h2>Also known as</h2><ReadMore text={entry.aka.join(", ")} lines={1} /></section> : null}
      {entry.bio && <section className="entry-detail-text"><h2>About</h2><ReadMore text={entry.bio} lines={5} /></section>}
      <section className="entry-detail-audio"><h2>Archive record</h2><ArchiveEntryRow entry={entry} /></section>
      <ArchiveComments entry={entry} />
    </main>
  );
}
