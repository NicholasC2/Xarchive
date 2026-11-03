"use client";

import { ArrowUpRight } from "lucide-react";
import "../pieces/panel.css"
import SongTab from "./song-tab";
import AlbumTab from "./album-tab";
import ArtistTab from "./artist-tab";
import CollectiveTab from "./collective-tab";
import { useState } from "react";
import "./page.css"

export default function ContributionForm() {
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState("song");

  return (
    <main className="archive-page">
      <section className="panel">
        <h2>Contribute</h2>
        <div className="panel-row" role="tablist" aria-label="Entry type">
          {(["song", "album", "artist", "collective"] as const).map((entryMode) => 
            <button 
              key={entryMode}
              aria-selected={page === entryMode} 
              onClick={() => setPage(entryMode)}
            >
              {entryMode}
            </button>)
          }
        </div>
        { page === "song" && <SongTab /> }
        { page === "album" && <AlbumTab /> }
        { page === "artist" && <ArtistTab /> }
        { page === "collective" && <CollectiveTab /> }

        <button type="submit" className="w-full" disabled={busy}>{busy ? "Saving entry…" : `add ${page}`} <ArrowUpRight size={16} /></button>
        <p className="panel-switch">By contributing, you confirm this entry is okay to share with the archive.</p>
      </section>
    </main>
  );
}