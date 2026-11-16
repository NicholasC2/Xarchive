"use client";

import SongTab from "./song-edit";
import AlbumTab from "./album-tab";
import ArtistTab from "./artist-tab";
import { useState } from "react";
import "./page.css"

export default function ContributionForm() {
  const [page, setPage] = useState("song");

  return (
    <main className="archive-page">
      <section className="panel">
        <h2>Contribute</h2>
        <div className="panel-row" role="tablist" aria-label="Entry type">
          {(["song", "album", "artist"] as const).map((entryMode) => 
            <button 
              key={entryMode}
              aria-selected={page === entryMode} 
              onClick={() => setPage(entryMode)}
              className="flex-1"
            >
              {entryMode}
            </button>)
          }
        </div>
        { page === "song" && <SongTab /> }
        { page === "album" && <AlbumTab /> }
        { page === "artist" && <ArtistTab /> }

        <p className="panel-switch">By contributing, you confirm this entry is okay to share with the archive.</p>
      </section>
    </main>
  );
}