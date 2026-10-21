"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Genre } from "@/lib/types";
import { stripAudioMetadata } from "@/lib/audio-processing";
import SearchInput from "@/app/pieces/search-input";
import "./contribution-form.css";

export default function ContributionForm() {
  const [mode, setMode] = useState("")
  const [busy, setBusy] = useState(false)

  return (
    <main className="archive-page">
      <div className="contribution-layout">
        <section className="contribution-panel">
          <div className="contribution-tabs" role="tablist" aria-label="Entry type">
            {(["song", "album", "artist", "collective"] as const).map((entryMode) => <button key={entryMode} type="button" role="tab" aria-selected={mode === entryMode} className={mode === entryMode ? "selected" : ""} onClick={() => changeMode(entryMode)}>{entryMode === "collective" ? "Collective" : entryMode[0].toUpperCase() + entryMode.slice(1)}</button>)}
          </div>
          <form className="contribution-form">
            <div className="form-heading"><div><span>NEW {mode.toUpperCase()} ENTRY</span><h2>{mode === "song" ? "Add a song" : mode === "album" ? "Add an album" : mode === "collective" ? "Add a collective" : "Add an artist"}</h2></div><span className="form-step">01 / 01</span></div>
            <label className="field-label" htmlFor="entry-title">{mode === "song" ? "Song title" : mode === "album" ? "Album title" : mode === "collective" ? "Collective name" : "Artist name"}<span>Required</span></label>
            <input id="entry-title" name="title" required maxLength={160} placeholder={mode === "song" ? "What is the track called?" : mode === "album" ? "What is the album called?" : mode === "collective" ? "Name this group" : "Who are we listening to?"} />

            <button className="submit-entry" type="submit" disabled={busy}>{busy ? "Saving entry…" : `Add ${mode}`} <ArrowUpRight size={16} /></button>
            <p className="contribution-footnote">By contributing, you confirm this entry is okay to share with the archive.</p>
          </form>
        </section>
      </div>
    </main>
  );
}