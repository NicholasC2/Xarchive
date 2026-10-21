"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Genre } from "@/lib/types";
import { stripAudioMetadata } from "@/lib/audio-processing";
import SongTab from "./song-tab";
import AlbumTab from "./album-tab";
import ArtistTab from "./artist-tab";
import CollectiveTab from "./collective-tab";
import type { ArchiveEntry, ContributionMode } from "./types";
import "./contribution-form.css";

function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read file."));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function parseReleaseYearFromInput(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const yearFromIso = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? Number(trimmed.slice(0, 4))
    : null;

  if (yearFromIso !== null && yearFromIso >= 1000 && yearFromIso <= 3000) {
    return yearFromIso;
  }

  const asNumber = Number(trimmed);
  if (Number.isInteger(asNumber) && asNumber >= 1000 && asNumber <= 3000) {
    return asNumber;
  }

  return null;
}

export default function ContributionForm() {
  const router = useRouter();
  const [mode, setMode] = useState<ContributionMode>("song");
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [albums, setAlbums] = useState<ArchiveEntry[]>([]);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [selectedAlbumTitle, setSelectedAlbumTitle] = useState("");
  const [selectedSongCollectiveId, setSelectedSongCollectiveId] = useState("");
  const [selectedSongCollectiveTitle, setSelectedSongCollectiveTitle] = useState("");
  const [selectedAlbumCollectiveId, setSelectedAlbumCollectiveId] = useState("");
  const [selectedAlbumCollectiveTitle, setSelectedAlbumCollectiveTitle] = useState("");
  const [artistImage, setArtistImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState("");
  const [albumTracks, setAlbumTracks] = useState<string[]>([""]);
  const [albumArtistInput, setAlbumArtistInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/archive").then((response) => response.json()).then((data) => {
      if (Array.isArray(data.entries)) setEntries(data.entries);
      if (Array.isArray(data.albums)) setAlbums(data.albums);
    }).catch(() => {});
  }, []);

  async function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setArtistImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  }

  function changeMode(nextMode: ContributionMode) {
    setMode(nextMode);
    setAudioFiles([]);
    setArtistImage(null);
    setBannerImage(null);
    setGalleryImages([]);
    setImagePreview("");
    setSelectedAlbumId("");
    setSelectedAlbumTitle("");
    setSelectedSongCollectiveId("");
    setSelectedSongCollectiveTitle("");
    setSelectedAlbumCollectiveId("");
    setSelectedAlbumCollectiveTitle("");
    if (nextMode !== "album") setAlbumTracks([""]);
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
        if (audioFiles.length === 0) throw new Error("Choose at least one audio file to add this song to the archive.");
        if (audioFiles.length > 10) throw new Error("Add up to 10 audio files per song.");
        if (audioFiles.some((file) => file.size > 8 * 1024 * 1024)) throw new Error("Each audio file must be 8 MB or smaller.");
        if (audioFiles.reduce((size, file) => size + file.size, 0) > 32 * 1024 * 1024) throw new Error("The combined audio files must be 32 MB or smaller.");
        const cleanedAudioFiles = [];
        for (const file of audioFiles) {
          const cleanedFile = await stripAudioMetadata(file);
          if (cleanedFile.size > 8 * 1024 * 1024) throw new Error(`${file.name} exceeds 8 MB after metadata is removed.`);
          cleanedAudioFiles.push({
            fileUrl: await fileAsDataUrl(cleanedFile),
            fileName: cleanedFile.name,
            fileType: cleanedFile.type,
            fileSize: cleanedFile.size,
          });
        }
        if (artistImage && artistImage.size > 2 * 1024 * 1024) throw new Error("Song artwork must be 2 MB or smaller.");
        const coverUrl = artistImage ? await fileAsDataUrl(artistImage) : null;
        const parsedYear = parseReleaseYearFromInput(form.get("songReleaseDate") ?? form.get("songReleaseYear"));
        payload = { kind: "song", title, artists: artistNames, collectiveId, bio,
          source: String(form.get("source") ?? "unknown"), audioFiles: cleanedAudioFiles,
          mediaUrl: coverUrl, albumId: String(form.get("albumId") ?? "") || null,
          releaseYear: parsedYear,
          tags: String(form.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
          genres: form.getAll("genres").map(String) };
      } else if (mode === "album") {
        if (artistImage && artistImage.size > 2 * 1024 * 1024) throw new Error("Album artwork must be 2 MB or smaller.");
        const imageUrl = artistImage ? await fileAsDataUrl(artistImage) : null;
        const parsedYear = parseReleaseYearFromInput(form.get("releaseDate") ?? form.get("releaseYear"));
        payload = { kind: "album", title, artists: artistNames, collectiveId, bio, mediaUrl: imageUrl,
          releaseYear: parsedYear,
          tracklist: albumTracks.map((track) => track.trim()).filter(Boolean),
          genres: form.getAll("genres").map(String) };
      } else if (mode === "collective") {
        if (artistImage && artistImage.size > 2 * 1024 * 1024) throw new Error("Collective images must be 2 MB or smaller.");
        if (bannerImage && bannerImage.size > 2 * 1024 * 1024) throw new Error("Collective banners must be 2 MB or smaller.");
        const imageUrl = artistImage ? await fileAsDataUrl(artistImage) : null;
        const bannerUrl = bannerImage ? await fileAsDataUrl(bannerImage) : null;
        const uploadedGallery = await Promise.all(galleryImages.map((file) => fileAsDataUrl(file)));
        payload = {
          kind: "collective",
          title,
          artists: artistNames,
          bio,
          mediaUrl: imageUrl,
          bannerUrl,
          galleryImages: uploadedGallery,
        };
      } else {
        if (artistImage && artistImage.size > 2 * 1024 * 1024) throw new Error("Artist images must be 2 MB or smaller.");
        if (bannerImage && bannerImage.size > 2 * 1024 * 1024) throw new Error("Artist banners must be 2 MB or smaller.");
        const imageUrl = artistImage ? await fileAsDataUrl(artistImage) : null;
        const bannerUrl = bannerImage ? await fileAsDataUrl(bannerImage) : null;
        const uploadedGallery = await Promise.all(galleryImages.map((file) => fileAsDataUrl(file)));
        payload = {
          kind: "artist",
          title,
          aka: String(form.get("aka") ?? "").split(",").map((name) => name.trim()).filter(Boolean),
          bio,
          mediaUrl: imageUrl,
          bannerUrl,
          galleryImages: uploadedGallery,
          genres: form.getAll("genres").map(String),
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

  const renderTab = () => {
    const sharedProps = {
      entries,
      albums,
      artistImage,
      bannerImage,
      galleryImages,
      imagePreview,
      selectedAlbumId,
      selectedAlbumTitle,
      selectedAlbumCollectiveId,
      selectedAlbumCollectiveTitle,
      selectedSongCollectiveId,
      selectedSongCollectiveTitle,
      setArtistImage,
      setBannerImage,
      setGalleryImages,
      setImagePreview,
      setSelectedAlbumId,
      setSelectedAlbumTitle,
      setSelectedAlbumCollectiveId,
      setSelectedAlbumCollectiveTitle,
      setSelectedSongCollectiveId,
      setSelectedSongCollectiveTitle,
      albumArtistInput,
      setAlbumArtistInput,
      albumTracks,
      setAlbumTracks,
      audioFiles,
      setAudioFiles,
    };

    switch (mode) {
      case "song":
        return <SongTab {...sharedProps} />;
      case "album":
        return <AlbumTab {...sharedProps} />;
      case "collective":
        return <CollectiveTab {...sharedProps} />;
      default:
        return <ArtistTab {...sharedProps} />;
    }
  };

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
            {renderTab()}
            {message && <p className="form-message" role="alert">{message}</p>}
            <button className="submit-entry" type="submit" disabled={busy}>{busy ? "Saving entry…" : `Add ${mode}`} <ArrowUpRight size={16} /></button>
            <p className="contribution-footnote">By contributing, you confirm this entry is okay to share with the archive.</p>
          </form>
        </section>
      </div>
    </main>
  );
}