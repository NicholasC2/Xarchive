"use client";

import { ArrowRight, Disc3, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ArchiveEntryRow, { ArchiveEntrySummary } from "./pieces/archive-entry-row";
import SearchInput from "./pieces/search-input";
import "./page.css";

type HomeArtist = ArchiveEntrySummary & { aka?: string[]; bio?: string; views: number };
type HomeSong = ArchiveEntrySummary & { artists: string[]; bio?: string; downloads: number; genres: string[]; tags: string[] };

export default function Home() {
  const [artists, setArtists] = useState<HomeArtist[]>([]);
  const [songs, setSongs] = useState<HomeSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const artistIds = Object.fromEntries(artists.map((artist) => [artist.title.toLowerCase(), artist.id]));

  useEffect(() => {
    fetch("/api/archive/home")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load the archive.");
        setArtists(result.artists);
        setSongs(result.songs);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="archive-page home-page">
      <header className="home-hero">
        <div>
          <p className="eyebrow">A COMMUNITY-BUILT MUSIC ARCHIVE</p>
          <h1>Listen closer.<br /><span>Keep the record.</span></h1>
          <p>Discover songs, artists, albums, and the stories behind the recordings.</p>
          <div className="home-actions">
            <Link className="home-primary-action" href="/search">Explore the archive <ArrowRight size={16} /></Link>
            <Link className="home-secondary-action" href="/contribute"><Plus size={15} /> Contribute</Link>
          </div>
        </div>
        <div className="home-hero-mark" aria-hidden="true"><Disc3 size={116} strokeWidth={0.7} /><span>X</span></div>
      </header>

      {loading ? <div className="archive-state">Opening the archive…</div> : error ? (
        <div className="archive-state archive-error">{error}</div>
      ) : (
        <div className="home-shelves">
          <section aria-labelledby="home-songs-heading">
            <div className="home-shelf-heading"><div><span>BY LISTENS</span><h2 id="home-songs-heading">Popular songs</h2></div><Link href="/search?type=song">All songs <ArrowRight size={14} /></Link></div>
            {songs.length
              ? <div className="entry-list">{songs.map((song) => <ArchiveEntryRow key={song.id} entry={{ ...song, artistIds }} showContributor />)}</div>
              : <p className="home-empty">Songs added to the archive will appear here.</p>}
          </section>
          <section aria-labelledby="home-artists-heading">
            <div className="home-shelf-heading"><div><span>BY COMMUNITY VIEWS</span><h2 id="home-artists-heading">Artists</h2></div><Link href="/search?type=artist">All artists <ArrowRight size={14} /></Link></div>
            {artists.length
              ? <div className="home-artist-grid">{artists.map((artist) => (
                <Link className="home-artist-card" key={artist.id} href={`/artists/${encodeURIComponent(artist.id)}`}>
                  <span className="home-artist-icon"><Users size={19} /></span><span><strong>{artist.title}</strong><small>{artist.views} views</small></span><ArrowRight size={14} />
                </Link>
              ))}</div>
              : <p className="home-empty">Artist contributions will appear here.</p>}
          </section>
        </div>
      )}
    </main>
  );
}
