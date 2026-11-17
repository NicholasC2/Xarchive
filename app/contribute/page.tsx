"use client";

import SongEdit from "./song-edit";
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
        { page === "song" && <SongEdit /> }
        { page === "album" && <AlbumTab /> }
        { page === "artist" && <ArtistTab /> }
      </section>
    </main>
  );
}