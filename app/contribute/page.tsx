"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Genre } from "@/lib/types";
import { stripAudioMetadata } from "@/lib/audio-processing";
import SearchInput from "@/app/pieces/search-input";
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
  const [coverImages, setCoverImages] = useState<File[]>([]);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
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
    setCoverImages([]);
    setBannerImage(null);
    setGalleryImages([]);
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
        const audioSource = String(form.get("source") ?? "unknown");
        const audioBio = String(form.get("audioBio") ?? "").trim();
        const audioLabels = String(form.get("audioLabels") ?? "").split(",").map((label) => label.trim()).filter(Boolean);
        for (const file of audioFiles) {
          const cleanedFile = await stripAudioMetadata(file);
          if (cleanedFile.size > 8 * 1024 * 1024) throw new Error(`${file.name} exceeds 8 MB after metadata is removed.`);
          cleanedAudioFiles.push({
            fileUrl: await fileAsDataUrl(cleanedFile),
            fileName: cleanedFile.name,
            fileType: cleanedFile.type,
            fileSize: cleanedFile.size,
            source: audioSource,
            bio: audioBio,
            labels: audioLabels,
          });
        }
        if (coverImages.some((file) => file.size > 2 * 1024 * 1024)) throw new Error("Each song cover must be 2 MB or smaller.");
        if (coverImages.length > 10) throw new Error("Add up to 10 song cover images.");
        const covers = await Promise.all(coverImages.map(fileAsDataUrl));
        const parsedYear = Number(form.get("songReleaseYear"));
        payload = { kind: "song", title, artists: artistNames, collectiveId, bio,
          source: audioSource, audioFiles: cleanedAudioFiles,
          mediaUrl: covers[0] ?? null, coverImages: covers, albumId: String(form.get("albumId") ?? "") || null,
          releaseYear: Number.isInteger(parsedYear) && parsedYear >= 1000 ? parsedYear : null,
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
        if ([artistImage, bannerImage, ...galleryImages].some((file) => file && file.size > 2 * 1024 * 1024)) throw new Error("Each collective image must be 2 MB or smaller.");
        payload = { kind: "collective", title, artists: artistNames, bio,
          mediaUrl: artistImage ? await fileAsDataUrl(artistImage) : null,
          bannerImage: bannerImage ? await fileAsDataUrl(bannerImage) : null,
          galleryImages: await Promise.all(galleryImages.map(fileAsDataUrl)) };
      } else {
        if (artistImage && artistImage.size > 2 * 1024 * 1024) throw new Error("Artist images must be 2 MB or smaller.");
        if ([bannerImage, ...galleryImages].some((file) => file && file.size > 2 * 1024 * 1024)) throw new Error("Each artist image must be 2 MB or smaller.");
        payload = {
          kind: "artist",
          title,
          aka: String(form.get("aka") ?? "").split(",").map((name) => name.trim()).filter(Boolean),
          bio,
          mediaUrl: artistImage ? await fileAsDataUrl(artistImage) : null,
          bannerImage: bannerImage ? await fileAsDataUrl(bannerImage) : null,
          galleryImages: await Promise.all(galleryImages.map(fileAsDataUrl)),
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

            {mode === "song" ? (
              <>
                <label className="field-label" htmlFor="entry-artists">Artist(s)<span>Separate with commas</span></label>
                <SearchInput id="entry-artists" name="artists" searchable={entries.filter((entry) => entry.kind === "artist").map((artist) => artist.title)} splitAt="," required placeholder="Artist or group" />
                <label className="field-label" htmlFor="song-collective">Collective<span>Optional</span></label>
                <select id="song-collective" name="collectiveId" defaultValue=""><option value="">No collective</option>{entries.filter((entry) => entry.kind === "collective").map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select>
                <label className="field-label" htmlFor="song-album">Album<span>Optional · album artwork is used automatically</span></label>
                <select id="song-album" name="albumId" value={selectedAlbumId} onChange={(event) => {
                  const albumId = event.target.value;
                  setSelectedAlbumId(albumId);
                  setArtistImage(null);
                  setImagePreview(albums.find((album) => album.id === albumId)?.mediaUrl ?? "");
                }}><option value="">No album</option>{albums.map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}</select>
                <div className="field-row">
                  <div className="field-group"><label className="field-label" htmlFor="entry-source">Audio source</label><select id="entry-source" name="source" defaultValue="unknown"><option value="soundcloud">SoundCloud</option><option value="spotify">Spotify</option><option value="youtube">YouTube</option><option value="social media">Social media</option><option value="unknown">Unknown</option></select></div>
                  <div className="field-group"><label className="field-label" htmlFor="entry-audio">Audio files<span>Up to 10 · 8 MB each</span></label><label className="file-picker" htmlFor="entry-audio"><Music2 size={16} /><span>{audioFiles.length ? `${audioFiles.length} files selected` : "Choose audio files"}</span><input id="entry-audio" type="file" multiple accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/ogg,audio/flac,audio/webm" onChange={(event) => setAudioFiles(Array.from(event.target.files ?? []))} required /></label></div>
                </div>
                {audioFiles.length > 0 && <ul className="audio-file-list">{audioFiles.map((file) => <li key={`${file.name}-${file.size}`}><Music2 size={13} /><span>{file.name}</span><small>{(file.size / (1024 * 1024)).toFixed(1)} MB</small></li>)}</ul>}
                <div className="field-row">
                  <div className="field-group"><label className="field-label" htmlFor="audio-labels">Audio labels<span>Comma-separated</span></label><input id="audio-labels" name="audioLabels" placeholder="radio edit, clean" /></div>
                  <div className="field-group"><label className="field-label" htmlFor="audio-bio">Audio version notes<span>Optional</span></label><input id="audio-bio" name="audioBio" maxLength={2000} placeholder="Notes specific to these files" /></div>
                </div>
                <div className="field-row">
                  <div className="field-group"><label className="field-label" htmlFor="song-release-year">Release year<span>Optional</span></label><input id="song-release-year" name="songReleaseYear" type="number" min="1000" max="3000" placeholder="YYYY" /></div>
                  <div className="field-group"><label className="field-label" htmlFor="song-tags">Tags<span>Comma-separated</span></label><input id="song-tags" name="tags" placeholder="live, demo, remaster" /></div>
                </div>
                <fieldset className="genre-options"><legend>Genres<span>Choose any that fit</span></legend>{Object.values(Genre).map((genre) => <label key={genre}><input type="checkbox" name="genres" value={genre} /><span>{genre}</span></label>)}</fieldset>
                <label className="field-label" htmlFor="song-image">Song covers<span>Optional · first cover is used for exports</span></label>
                <label className="image-picker" htmlFor="song-image">
                  {imagePreview ? <Image src={imagePreview} alt="Album cover preview" width={36} height={36} unoptimized /> : <ImagePlus size={22} />}
                  <span>{coverImages.length ? `${coverImages.length} covers selected` : "Choose cover images"}</span>
                  <input id="song-image" type="file" multiple accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    setCoverImages(files);
                    setImagePreview("");
                  }} />
                </label>
                {coverImages.map((file) => <span className="cover-file-name" key={`${file.name}-${file.size}`}>{file.name}</span>)}
                {imagePreview && <Image className="contribution-image-preview" src={imagePreview} alt="Song cover preview" width={300} height={180} unoptimized />}
                <label className="field-label" htmlFor="entry-bio">Audio bio / notes<span>Optional</span></label>
                <textarea id="entry-bio" name="bio" maxLength={2000} rows={3} placeholder="A little context about this recording…" />
              </>
            ) : mode === "album" ? (
              <>
                <label className="field-label" htmlFor="album-artists">Artist(s)<span>Separate with commas</span></label>
                <SearchInput id="album-artists" name="artists" searchable={entries.filter((entry) => entry.kind === "artist").map((artist) => artist.title)} splitAt="," required placeholder="Artist or group" />
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
                <SearchInput id="collective-artists" name="artists" searchable={entries.filter((entry) => entry.kind === "artist").map((artist) => artist.title)} splitAt="," required placeholder="Add artists from the archive" />
                <p className="collective-hint"><Users size={14} />Every member must have an artist entry in the archive.</p>
                <label className="field-label" htmlFor="collective-image">Profile image<span>Optional</span></label>
                <label className="file-picker" htmlFor="collective-image"><ImagePlus size={16} /><span>{artistImage?.name ?? "Choose image"}</span><input id="collective-image" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => setArtistImage(event.target.files?.[0] ?? null)} /></label>
                <label className="field-label" htmlFor="collective-banner">Banner image<span>Optional</span></label>
                <label className="file-picker" htmlFor="collective-banner"><ImagePlus size={16} /><span>{bannerImage?.name ?? "Choose banner"}</span><input id="collective-banner" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => setBannerImage(event.target.files?.[0] ?? null)} /></label>
                <label className="field-label" htmlFor="collective-gallery">Gallery images<span>Optional · up to 10</span></label>
                <label className="file-picker" htmlFor="collective-gallery"><ImagePlus size={16} /><span>{galleryImages.length ? `${galleryImages.length} images selected` : "Choose gallery images"}</span><input id="collective-gallery" type="file" multiple accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => setGalleryImages(Array.from(event.target.files ?? []))} /></label>
                <label className="field-label" htmlFor="entry-bio">About this collective<span>Optional</span></label>
                <textarea id="entry-bio" name="bio" maxLength={2000} rows={4} placeholder="A shared project, crew, or music group…" />
              </>
            ) : (
              <>
                <label className="field-label" htmlFor="entry-aka">Also known as<span>Separate names with commas</span></label>
                <input id="entry-aka" name="aka" placeholder="Aliases, former names, alternate spellings" />
                <label className="field-label" htmlFor="entry-image">Artist profile image<span>Optional · PNG, JPG, GIF, WebP · up to 2 MB</span></label>
                <label className="image-picker" htmlFor="entry-image">
                  {imagePreview ? <Image src={imagePreview} alt="Artist image preview" width={36} height={36} unoptimized /> : <ImagePlus size={22} />}
                  <span>{artistImage?.name ?? "Choose an image"}</span>
                  <input id="entry-image" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={selectImage} />
                </label>
                <label className="field-label" htmlFor="artist-banner">Banner image<span>Optional · up to 2 MB</span></label>
                <label className="file-picker" htmlFor="artist-banner"><ImagePlus size={16} /><span>{bannerImage?.name ?? "Choose banner"}</span><input id="artist-banner" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => setBannerImage(event.target.files?.[0] ?? null)} /></label>
                <label className="field-label" htmlFor="artist-gallery">Gallery images<span>Optional · up to 10</span></label>
                <label className="file-picker" htmlFor="artist-gallery"><ImagePlus size={16} /><span>{galleryImages.length ? `${galleryImages.length} images selected` : "Choose gallery images"}</span><input id="artist-gallery" type="file" multiple accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => setGalleryImages(Array.from(event.target.files ?? []))} /></label>
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