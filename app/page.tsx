"use client";

import { FileAudio2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import ArchiveEntryRow, { ArchiveEntrySummary } from "./pieces/archive-entry-row";
import "./page.css";

type ArchiveEntry = ArchiveEntrySummary & {
  aka: string[];
  artists: string[];
  fileName: string | null;
  tracklist: string[];
  createdBy: string;
  createdAt: string;
};

type Filter = "all" | "song" | "album" | "artist" | "collective";

export default function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = use(searchParams);
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [artistIds, setArtistIds] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState(q);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/archive")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load the archive.");
        setEntries(data.entries);
        setArtistIds(Object.fromEntries((data.artists as { id: string; title: string }[]).map((artist) => [artist.title.toLowerCase(), artist.id])));
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (filter !== "all" && entry.kind !== filter) return false;
      if (!normalizedQuery) return true;
      return [entry.title, entry.bio, entry.collective ?? "", ...entry.artists, ...entry.aka, ...entry.tracklist]
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [entries, filter, query]);

  return (
    <main className="archive-page">
      <header className="archive-page-heading"><h1>Archive</h1><Link className="add-entry-link" href="/contribute"><Plus size={16} /> Add entry</Link></header>
      <section className="archive-content" aria-label="Music archive">
        <div className="archive-heading">
          <label className="collection-search">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, artist, collective" aria-label="Search archive" />
          </label>
        </div>

        <div className="archive-toolbar">
          <div className="archive-filters" role="group" aria-label="Filter archive">
            {(["all", "song", "album", "artist", "collective"] as const).map((item) => (
              <button key={item} className={filter === item ? "filter-active" : ""} onClick={() => setFilter(item)}>
                {item === "all" ? "Everything" : item === "song" ? "Songs" : item === "album" ? "Albums" : item === "artist" ? "Artists" : "Collectives"}
              </button>
            ))}
          </div>
          <span className="entry-count">{visibleEntries.length} {visibleEntries.length === 1 ? "ENTRY" : "ENTRIES"}</span>
        </div>

        {loading ? (
          <div className="archive-state">Opening the archive…</div>
        ) : error ? (
          <div className="archive-state archive-error">{error}</div>
        ) : visibleEntries.length ? (
          <div className="entry-list">
            {visibleEntries.map((entry) => <ArchiveEntryRow key={entry.id} entry={{ ...entry, artistIds }} showContributor />)}
          </div>
        ) : (
          <div className="empty-archive">
            <FileAudio2 size={27} strokeWidth={1.4} />
            <div><h3>{query ? "Nothing found" : "The first entry is yours."}</h3><p>{query ? "Try a different title, artist, or search." : "Add a song, album, artist, or collective to start the collection."}</p></div>
            <Link href="/contribute" aria-label="Add an archive entry"><Plus size={19} /></Link>
          </div>
        )}
      </section>
    </main>
  );
}
