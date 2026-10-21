"use client";

import JSZip from "jszip";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createTaggedAudio, pickBestAudioFile } from "@/lib/audio-processing";

type BulkSong = {
  id: string;
  title: string;
  artists: string[];
  album?: string | null;
  releaseYear?: number | null;
  genres?: string[];
  tags?: string[];
  fileUrl?: string | null;
  mediaUrl?: string | null;
  audioFiles?: Array<{ id: string; fileName: string; fileType: string; fileSize: number; url: string }>;
};

export default function BulkDownloadPage() {
  const params = useSearchParams();
  const [songs, setSongs] = useState<BulkSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSongs() {
      try {
        const type = params.get("type");
        const id = params.get("id");
        const idsParam = params.get("ids");
        const artist = params.get("artist");
        const genre = params.get("genre");
        const tag = params.get("tag");
        const from = params.get("from");
        const to = params.get("to");

        if (type === "artist" && id) {
          const response = await fetch(`/api/archive/artists/${encodeURIComponent(id)}`);
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Artist not found.");
          const nextSongs = Array.isArray(result.entries) ? result.entries.filter((entry: { kind?: string }) => entry.kind === "song") : [];
          if (active) setSongs(nextSongs);
          return;
        }

        if (type === "album" && id) {
          const response = await fetch(`/api/archive/albums/${encodeURIComponent(id)}`);
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Album not found.");
          const nextSongs = Array.isArray(result.entries) ? result.entries.filter((entry: { kind?: string }) => entry.kind === "song") : [];
          if (active) setSongs(nextSongs);
          return;
        }

        const response = await fetch("/api/archive");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load the archive.");

        let nextSongs: BulkSong[] = Array.isArray(data.entries) ? data.entries.filter((entry: { kind?: string }) => entry.kind === "song") : [];

        if (idsParam) {
          const allowed = new Set(idsParam.split(",").map((value) => value.trim()).filter(Boolean));
          nextSongs = nextSongs.filter((song) => allowed.has(song.id));
        } else {
          if (artist) {
            nextSongs = nextSongs.filter((song) => song.artists.some((value) => value.toLowerCase() === artist.toLowerCase()));
          }
          if (genre) {
            nextSongs = nextSongs.filter((song) => (song.genres ?? []).some((value) => value.toLowerCase() === genre.toLowerCase()));
          }
          if (tag) {
            nextSongs = nextSongs.filter((song) => (song.tags ?? []).some((value) => value.toLowerCase().includes(tag.toLowerCase())));
          }
          if (from) {
            const minYear = Number(from);
            nextSongs = nextSongs.filter((song) => !song.releaseYear || song.releaseYear >= minYear);
          }
          if (to) {
            const maxYear = Number(to);
            nextSongs = nextSongs.filter((song) => !song.releaseYear || song.releaseYear <= maxYear);
          }
        }

        if (active) setSongs(nextSongs);
      } catch (reason: unknown) {
        if (active) setError(reason instanceof Error ? reason.message : "Could not prepare the bulk download.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSongs();
    return () => { active = false; };
  }, [params]);

  async function handleDownload() {
    if (!songs.length) return;
    setBusy(true);
    try {
      const zip = new JSZip();
      for (const song of songs) {
        const files = song.audioFiles?.length ? song.audioFiles : [{ id: song.id, fileName: `${song.title}.mp3`, fileType: "audio/mpeg", fileSize: 0, url: song.fileUrl ?? "" }];
        const bestFile = pickBestAudioFile(files);
        if (!bestFile?.url) continue;
        const tagged = await createTaggedAudio({
          id: song.id,
          title: song.title,
          artists: song.artists.length ? song.artists : ["Unknown artist"],
          album: song.album ?? undefined,
          releaseYear: song.releaseYear ?? undefined,
          genres: song.genres ?? [],
          tags: song.tags ?? [],
          fileName: bestFile.fileName,
          fileType: bestFile.fileType,
          fileUrl: bestFile.url,
          coverUrl: song.mediaUrl ?? undefined,
        });
        const safeName = `${song.title} - ${song.artists[0] || "archive"} - ${tagged.fileName}`.replace(/[\\/:*?\"<>|]/g, "_");
        zip.file(safeName, tagged.blob);
      }

      if (!Object.keys(zip.files).length) return;
      const archive = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(archive);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "xarchive-bulk-download.zip";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "The archive could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="archive-page">
      <header className="archive-page-heading">
        <h1>Bulk download</h1>
        <div className="archive-header-actions">
          <Link className="add-entry-link" href="/">Back to archive</Link>
        </div>
      </header>

      <section className="archive-content" aria-label="Bulk download archive">
        {loading ? (
          <div className="archive-state">Preparing your archive…</div>
        ) : error ? (
          <div className="archive-state archive-error">{error}</div>
        ) : (
          <>
            <div className="bulk-download-header">
              <div>
                <p className="eyebrow">Selected songs</p>
                <h3>{songs.length} tracks ready</h3>
              </div>
              <button type="button" className="bulk-download-button" onClick={() => void handleDownload()} disabled={busy || !songs.length}>
                {busy ? "Packing…" : "Download zip"}
              </button>
            </div>

            {songs.length ? (
              <div className="bulk-song-list">
                {songs.map((song) => (
                  <div key={song.id} className="bulk-song-item">
                    <span>{song.title}</span>
                    <small>{song.artists.join(", ") || "Unknown artist"}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="archive-state">No songs match the selected download criteria.</div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
