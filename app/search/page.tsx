"use client";

import { ArrowLeft, ArrowRight, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ArchiveEntryRow, { ArchiveEntrySummary } from "@/app/pieces/archive-entry-row";
import SearchInput from "@/app/pieces/search-input";
import "./search-page.css";

type SearchResponse = { entries: ArchiveEntrySummary[]; page: number; pageSize: number; total: number; error?: string };
const kinds = ["all", "song", "album", "artist", "collective"] as const;
type Kind = (typeof kinds)[number];

export default function SearchPage() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [kind, setKind] = useState<Kind>((kinds as readonly string[]).includes(params.get("type") ?? "") ? params.get("type") as Kind : "all");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const search = new URLSearchParams({ q: query.trim(), page: String(page) });
      if (kind !== "all") search.set("type", kind);
      const response = await fetch(`/api/search?${search}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Search is temporarily unavailable.");
      setResult(data);
    } catch (error) {
      setResult({ entries: [], page, pageSize: 100, total: 0, error: error instanceof Error ? error.message : "Search failed." });
    } finally {
      setLoading(false);
    }
  }, [kind, page, query]);

  useEffect(() => { void runSearch(); }, [runSearch]);

  const pages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    void runSearch();
  }

  return (
    <main className="search-page">
      <Link className="search-back" href="/"><ArrowLeft size={14} /> Home</Link>
      <header className="search-page-heading"><p className="eyebrow">THE FULL COLLECTION</p><h1>Search the archive</h1><p>Browse every song, album, artist, and collective. Results are paginated for large archives.</p></header>
      <form className="archive-search-form" onSubmit={submit}>
        <SearchIcon size={17} />
        <SearchInput searchable={[]} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search titles, artists, tags, genres" aria-label="Search archive" />
        <button type="submit">Search</button>
      </form>
      <div className="search-results-toolbar">
        <div className="search-kind-filters" role="group" aria-label="Filter result type">
          {kinds.map((item) => <button key={item} className={kind === item ? "active" : ""} onClick={() => { setKind(item); setPage(1); }}>
            {item === "all" ? "All" : `${item[0].toUpperCase()}${item.slice(1)}s`}
          </button>)}
        </div>
        <span>{result?.total ?? 0} results</span>
      </div>
      {loading ? <div className="archive-state">Searching…</div> : result?.error ? (
        <p className="search-error" role="alert">{result.error}</p>
      ) : result?.entries.length ? (
        <>
          <div className="search-result-list">{result.entries.map((entry) => <ArchiveEntryRow key={entry.id} entry={entry} showContributor />)}</div>
          <nav className="search-pagination" aria-label="Search result pages">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}><ArrowLeft size={14} /> Previous</button>
            <span>Page {page} of {pages}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(pages, current + 1))} disabled={page >= pages}>Next <ArrowRight size={14} /></button>
          </nav>
        </>
      ) : <div className="search-empty"><SearchIcon size={20} /><p>No archive entries match your search.</p></div>}
    </main>
  );
}
