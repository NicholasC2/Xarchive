"use client";

import { ArrowUpRight } from "lucide-react";
import "../pieces/form.css"
import SongTab from "./song-tab";
import AlbumTab from "./album-tab";
import ArtistTab from "./artist-tab";
import CollectiveTab from "./collective-tab";
import { useState } from "react";

export default function ContributionForm() {
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState("song");

  return (
    <main className="archive-page">
      <section className="panel">
        <div className="flex flex-row w-full gap-1" role="tablist" aria-label="Entry type">
          {(["song", "album", "artist", "collective"] as const).map((entryMode) => <button key={entryMode} type="button" role="tab" aria-selected={page === entryMode} className={"w-full" + (page === entryMode ? " selected" : "")} onClick={() => setPage(entryMode)}>{entryMode === "collective" ? "Collective" : entryMode[0].toUpperCase() + entryMode.slice(1)}</button>)}
        </div>
        <form className="contribution-form">
          { page === "song" && <SongTab /> }
          { page === "album" && <AlbumTab /> }
          { page === "artist" && <ArtistTab /> }
          { page === "collective" && <CollectiveTab /> }

          <button type="submit" className="w-full" disabled={busy}>{busy ? "Saving entry…" : `Add ${page}`} <ArrowUpRight size={16} /></button>
          <small>By contributing, you confirm this entry is okay to share with the archive.</small>
        </form>
      </section>
    </main>
  );
}