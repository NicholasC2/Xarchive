"use client";

import { ArrowLeft, ArrowUpRight, ImagePlus, Music2, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./contribution-form.css";

type Mode = "song" | "album" | "artist" | "collective";
type ArchiveEntry = { id: string; kind: string; title: string; aka: string[] };

function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read file."));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export default function ContributionForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("song");
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artistImage, setArtistImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/archive").then((response) => response.json()).then((data) => {
      if (Array.isArray(data.entries)) setEntries(data.entries);
    }).catch(() => {});
  }, []);

  async function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setArtistImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setArtistImage(null);
    setImagePreview("");
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    try {
      let payload: Record<string, unknown>;
      const bio = String(form.get("bio") ?? "").trim();
      const artistNames = String(form.get("artists") ?? "").split(",").map((name) => name.trim()).filter(Boolean);
      const collectiveId = String(form.get("collectiveId") ?? "") || null;

      if (mode === "song") {
        if (!audioFile) throw new Error("Choose an audio file to add this song to the archive.");
        if (audioFile.size > 8 * 1024 * 1024) throw new Error("Audio files must be 8 MB or smaller.");
        payload = { kind: "song", title, artists: artistNames, collectiveId, bio,
          source: String(form.get("source") ?? "unknown"), fileUrl: await fileAsDataUrl(audioFile),
          fileName: audioFile.name, fileType: audioFile.type, fileSize: audioFile.size };
      } else if (mode === "album") {
        if (artistImage && artistImage.size > 2 * 1024 * 1024) throw new Error("Album artwork must be 2 MB or smaller.");
        const imageUrl = artistImage ? await fileAsDataUrl(artistImage) : null;
        const parsedYear = Number(form.get("releaseYear"));
        payload = { kind: "album", title, artists: artistNames, collectiveId, bio, mediaUrl: imageUrl,
          releaseYear: Number.isInteger(parsedYear) && parsedYear > 0 ? parsedYear : null,
          tracklist: String(form.get("tracklist") ?? "").split("\n").map((track) => track.trim()).filter(Boolean) };
      } else if (mode === "collective") {
        payload = { kind: "collective", title, artists: artistNames, bio };
      } else {
        if (artistImage && artistImage.size > 2 * 1024 * 1024) throw new Error("Artist images must be 2 MB or smaller.");
        const imageUrl = artistImage ? await fileAsDataUrl(artistImage) : null;
        payload = {
          kind: "artist",
          title,
          aka: String(form.get("aka") ?? "").split(",").map((name) => name.trim()).filter(Boolean),
          bio,
          mediaUrl: imageUrl,
        };
      }

      const response = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save this entry.");
      router.push("/");
      router.refresh();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not save this entry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="contribution-page">
      <Link className="back-link" href="/"><ArrowLeft size={15} /> Back to archive</Link>
      <div className="contribution-layout">
        <section className="contribution-panel">
          <div className="contribution-tabs" role="tablist" aria-label="Entry type">
            {(["song", "album", "artist", "collective"] as const).map((entryMode) => <button key={entryMode} type="button" role="tab" aria-selected={mode === entryMode} className={mode === entryMode ? "selected" : ""} onClick={() => changeMode(entryMode)}>{entryMode === "collective" ? "Collective" : entryMode[0].toUpperCase() + entryMode.slice(1)}</button>)}
          </div>
          <form className="contribution-form" onSubmit={submit}>
            <div className="form-heading"><div><span>NEW {mode.toUpperCase()} ENTRY</span><h2>{mode === "song" ? "Add a song" : mode === "album" ? "Add an album" : mode === "collective" ? "Add a collective" : "Add an artist"}</h2></div><span className="form-step">01 / 01</span></div>
            <label className="field-label" htmlFor="entry-title">{mode === "song" ? "Song title" : mode === "album" ? "Album title" : mode === "collective" ? "Collective name" : "Artist name"}<span>Required</span></label>
            <input id="entry-title" name="title" required maxLength={160} placeholder={mode === "song" ? "What is the track called?" : mode === "album" ? "What is the album called?" : mode === "collective" ? "Name this group" : "Who are we listening to?"} />

            {mode === "song" ? (
              <>
                <label className="field-label" htmlFor="entry-artists">Artist(s)<span>Separate with commas</span></label>
                <input id="entry-artists" name="artists" list="archive-artists" required placeholder="Artist or group" />
                <datalist id="archive-artists">{entries.filter((entry) => entry.kind === "artist").map((artist) => <option key={artist.title} value={artist.title} />)}</datalist>
                <label className="field-label" htmlFor="song-collective">Collective<span>Optional</span></label>
                <select id="song-collective" name="collectiveId" defaultValue=""><option value="">No collective</option>{entries.filter((entry) => entry.kind === "collective").map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select>
                <div className="field-row">
                  <div className="field-group"><label className="field-label" htmlFor="entry-source">Audio source</label><select id="entry-source" name="source" defaultValue="unknown"><option value="soundcloud">SoundCloud</option><option value="spotify">Spotify</option><option value="youtube">YouTube</option><option value="social media">Social media</option><option value="unknown">Unknown</option></select></div>
                  <div className="field-group"><label className="field-label" htmlFor="entry-audio">Audio file<span>Up to 8 MB</span></label><label className="file-picker" htmlFor="entry-audio"><Music2 size={16} /><span>{audioFile?.name ?? "Choose audio"}</span><input id="entry-audio" type="file" accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/ogg,audio/flac,audio/webm" onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)} required /></label></div>
                </div>
                <label className="field-label" htmlFor="entry-bio">Audio bio / notes<span>Optional</span></label>
                <textarea id="entry-bio" name="bio" maxLength={2000} rows={3} placeholder="A little context about this recording…" />
              </>
            ) : mode === "album" ? (
              <>
                <label className="field-label" htmlFor="album-artists">Artist(s)<span>Separate with commas</span></label>
                <input id="album-artists" name="artists" list="album-artists-list" required placeholder="Artist or group" />
                <datalist id="album-artists-list">{entries.filter((entry) => entry.kind === "artist").map((artist) => <option key={artist.title} value={artist.title} />)}</datalist>
                <label className="field-label" htmlFor="album-collective">Collective<span>Optional</span></label>
                <select id="album-collective" name="collectiveId" defaultValue=""><option value="">No collective</option>{entries.filter((entry) => entry.kind === "collective").map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select>
                <div className="field-row">
                  <div className="field-group"><label className="field-label" htmlFor="release-year">Release year<span>Optional</span></label><input id="release-year" name="releaseYear" type="number" min="1000" max="3000" placeholder="YYYY" /></div>
                  <div className="field-group"><label className="field-label" htmlFor="album-image">Album artwork<span>Optional · up to 2 MB</span></label><label className="file-picker" htmlFor="album-image"><ImagePlus size={16} /><span>{artistImage?.name ?? "Choose image"}</span><input id="album-image" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => { const file = event.target.files?.[0] ?? null; setArtistImage(file); setImagePreview(file ? URL.createObjectURL(file) : ""); }} /></label></div>
                </div>
                <label className="field-label" htmlFor="album-tracklist">Track list<span>Optional · one track per line</span></label>
                <textarea id="album-tracklist" name="tracklist" maxLength={10000} rows={4} placeholder={"01. Opening track\n02. Another favorite"} />
                <label className="field-label" htmlFor="entry-bio">Album notes<span>Optional</span></label>
                <textarea id="entry-bio" name="bio" maxLength={2000} rows={3} placeholder="A little context about this release…" />
                {imagePreview && <Image className="contribution-image-preview" src={imagePreview} alt="Album artwork preview" width={300} height={180} unoptimized />}
              </>
            ) : mode === "collective" ? (
              <>
                <label className="field-label" htmlFor="collective-artists">Artists in this collective<span>Separate with commas</span></label>
                <input id="collective-artists" name="artists" list="collective-artist-list" required placeholder="Add artists from the archive" />
                <datalist id="collective-artist-list">{entries.filter((entry) => entry.kind === "artist").map((artist) => <option key={artist.title} value={artist.title} />)}</datalist>
                <p className="collective-hint"><Users size={14} />Every member must have an artist entry in the archive.</p>
                <label className="field-label" htmlFor="entry-bio">About this collective<span>Optional</span></label>
                <textarea id="entry-bio" name="bio" maxLength={2000} rows={4} placeholder="A shared project, crew, or music group…" />
              </>
            ) : (
              <>
                <label className="field-label" htmlFor="entry-aka">Also known as<span>Separate names with commas</span></label>
                <input id="entry-aka" name="aka" placeholder="Aliases, former names, alternate spellings" />
                <label className="field-label" htmlFor="entry-image">Artist image<span>Optional · PNG, JPG, GIF, WebP · up to 2 MB</span></label>
                <label className="image-picker" htmlFor="entry-image">
                  {imagePreview ? <Image src={imagePreview} alt="Artist image preview" width={36} height={36} unoptimized /> : <ImagePlus size={22} />}
                  <span>{artistImage?.name ?? "Choose an image"}</span>
                  <input id="entry-image" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={selectImage} />
                </label>
                <label className="field-label" htmlFor="entry-bio">Artist bio<span>Optional</span></label>
                <textarea id="entry-bio" name="bio" maxLength={2000} rows={4} placeholder="What should people know about this artist?" />
              </>
            )}

            {message && <p className="form-message" role="alert">{message}</p>}
            <button className="submit-entry" type="submit" disabled={busy}>{busy ? "Saving entry…" : `Add ${mode}`} <ArrowUpRight size={16} /></button>
            <p className="contribution-footnote">By contributing, you confirm this entry is okay to share with the archive.</p>
          </form>
        </section>
      </div>
    </main>
  );
}