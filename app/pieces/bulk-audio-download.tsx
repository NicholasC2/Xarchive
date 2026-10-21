"use client";

import { useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import { ArchiveEntrySummary, AudioFileSummary } from "./archive-entry-row";
import { createTaggedAudio } from "@/lib/audio-processing";
import SearchInput from "./search-input";
import "./bulk-audio-download.css";

type Song = ArchiveEntrySummary & {
  kind: "song";
  artists: string[];
  genres?: string[];
  tags?: string[];
  audioFiles?: AudioFileSummary[];
};
type Field = "title" | "artist" | "collective" | "album" | "source" | "tag" | "genre" | "year";
type Operator = "is" | "contains" | "regex" | "is-not" | "does-not-contain";
type Rule = { field: Field; operator: Operator; value: string };
type FilterGroup = { id: string; join: "and" | "or"; rules: Rule[] };
type SelectedSong = { song: Song; fileId: string };
type SearchResponse = { entries: Song[]; page: number; pageSize: number; total: number; error?: string };

const fields: { value: Field; label: string }[] = [
  { value: "title", label: "Song title" },
  { value: "artist", label: "Artist" },
  { value: "collective", label: "Collective" },
  { value: "album", label: "Album" },
  { value: "source", label: "Source" },
  { value: "tag", label: "Tag" },
  { value: "genre", label: "Genre" },
  { value: "year", label: "Release year" },
];
const operators: { value: Operator; label: string }[] = [
  { value: "contains", label: "contains" },
  { value: "is", label: "is exactly" },
  { value: "does-not-contain", label: "does not contain" },
  { value: "is-not", label: "is not" },
  { value: "regex", label: "matches regex" },
];

function safeName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim() || "Unknown";
}

function downloadUrl(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}download=1`;
}

export default function BulkAudioDownload() {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<FilterGroup[]>([]);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [selected, setSelected] = useState<Record<string, SelectedSong>>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const rules = useMemo(() => groups.map((group) => ({
    join: group.join,
    rules: group.rules.filter((rule) => rule.value.trim().length > 0),
  })).filter((group) => group.rules.length), [groups]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setBusy(true);
      fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, type: "song", page, groups: rules }),
      }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load songs.");
        if (active) {
          setResult(data);
          setError("");
        }
      }).catch((reason: Error) => {
        if (active) {
          setError(reason.message);
          setResult(null);
        }
      }).finally(() => { if (active) setBusy(false); });
    }, 240);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [groups, page, query, rules]);

  const pages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  const selectedSongs = Object.values(selected);

  function updateGroup(groupId: string, update: (group: FilterGroup) => FilterGroup) {
    setGroups((current) => current.map((group) => group.id === groupId ? update(group) : group));
    setPage(1);
  }

  function updateRule(groupId: string, ruleIndex: number, patch: Partial<Rule>) {
    updateGroup(groupId, (group) => ({
      ...group,
      rules: group.rules.map((rule, index) => index === ruleIndex ? { ...rule, ...patch } : rule),
    }));
  }

  function toggleSong(song: Song) {
    setSelected((current) => {
      if (current[song.id]) {
        const next = { ...current };
        delete next[song.id];
        return next;
      }
      if (Object.keys(current).length >= 200) {
        setError("Select up to 200 songs per ZIP.");
        return current;
      }
      setError("");
      return { ...current, [song.id]: { song, fileId: song.audioFiles?.[0]?.id ?? "" } };
    });
  }

  async function downloadZip() {
    if (!selectedSongs.length) return;
    setBusy(true);
    setError("");
    const zip = new JSZip();
    try {
      for (const [index, selection] of selectedSongs.entries()) {
        const { song } = selection;
        const audioFile = song.audioFiles?.find((file) => file.id === selection.fileId) ?? song.audioFiles?.[0];
        const fileUrl = audioFile?.url ?? song.fileUrl;
        if (!fileUrl) throw new Error(`No audio file is available for ${song.title}.`);
        setProgress(`Tagging ${index + 1} of ${selectedSongs.length}: ${song.title}`);
        const { blob, fileName } = await createTaggedAudio({
          id: song.id,
          title: song.title,
          artists: song.artists,
          album: song.album,
          releaseYear: song.releaseYear,
          genres: song.genres,
          tags: song.tags,
          fileName: audioFile?.fileName ?? `${song.title}.mp3`,
          fileType: audioFile?.fileType ?? "audio/mpeg",
          fileUrl: downloadUrl(fileUrl),
          coverUrl: song.mediaUrl,
          source: audioFile?.source,
        });
        zip.file(`${safeName(song.artists.join(" & "))}/${safeName(song.title)}-${song.id.slice(0, 8)}.${fileName.split(".").pop()}`, blob);
      }
      setProgress("Creating ZIP…");
      const blob = await zip.generateAsync({ type: "blob" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "xarchive-tagged-audio.zip";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the ZIP download.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <section className="bulk-download-page-tool">
      <div className="bulk-download-page-heading">
        <div><p className="eyebrow">DOWNLOAD COLLECTIONS</p><h1>Build a music pack</h1><p>Combine archive filters, choose the audio version, and export a tagged ZIP.</p></div>
        <div className="bulk-selected-count"><strong>{selectedSongs.length}</strong><span>of 200 selected</span></div>
      </div>
      <div className="bulk-builder">
        <label className="bulk-title-query">Title search<SearchInput searchable={[]} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search song names" /></label>
        <div className="bulk-builder-heading"><h2>Filter groups</h2><button type="button" onClick={() => {
          setGroups((current) => [...current, { id: crypto.randomUUID(), join: "and", rules: [{ field: "artist", operator: "contains", value: "" }] }]);
          setPage(1);
        }}>Add filter group</button></div>
        {!groups.length && <p className="bulk-filter-help">No filters are applied. Add a group to combine artist, collective, album, source, tag, genre, year, exact-title, or regex rules.</p>}
        {groups.map((group, groupIndex) => (
          <fieldset className="bulk-filter-group" key={group.id}>
            <legend>Group {groupIndex + 1}</legend>
            <div className="bulk-filter-group-head">
              <label>Match rules<select value={group.join} onChange={(event) => updateGroup(group.id, (current) => ({ ...current, join: event.target.value as "and" | "or" }))}><option value="and">All rules (AND)</option><option value="or">Any rule (OR)</option></select></label>
              <button type="button" onClick={() => { setGroups((current) => current.filter((item) => item.id !== group.id)); setPage(1); }}>Remove group</button>
            </div>
            {group.rules.map((rule, ruleIndex) => (
              <div className="bulk-filter-rule" key={ruleIndex}>
                <select aria-label="Filter field" value={rule.field} onChange={(event) => updateRule(group.id, ruleIndex, { field: event.target.value as Field })}>{fields.map((field) => <option key={field.value} value={field.value}>{field.label}</option>)}</select>
                <select aria-label="Filter operation" value={rule.operator} onChange={(event) => updateRule(group.id, ruleIndex, { operator: event.target.value as Operator })}>{operators.map((operator) => <option key={operator.value} value={operator.value}>{operator.label}</option>)}</select>
                <input aria-label="Filter value" value={rule.value} maxLength={100} onChange={(event) => updateRule(group.id, ruleIndex, { value: event.target.value })} placeholder={rule.operator === "regex" ? "Example: ^Live.*$" : "Filter value"} />
                <button type="button" aria-label="Remove filter" onClick={() => updateGroup(group.id, (current) => ({ ...current, rules: current.rules.filter((_, index) => index !== ruleIndex) }))}>×</button>
              </div>
            ))}
            <button className="bulk-add-rule" type="button" onClick={() => updateGroup(group.id, (current) => ({ ...current, rules: [...current.rules, { field: "tag", operator: "contains", value: "" }] }))}>Add rule</button>
          </fieldset>
        ))}
        <p className="bulk-filter-help">Groups combine with AND. Regex expressions are restricted to a safe subset and run against song titles or the selected metadata field.</p>
      </div>

      <div className="bulk-results-heading"><h2>Matching songs</h2><span>{result?.total ?? 0} results · 100 per page</span></div>
      {error && <p className="bulk-download-error" role="alert">{error}</p>}
      {busy && !result ? <div className="bulk-empty">Loading songs…</div> : result?.entries.length ? (
        <div className="bulk-song-list">
          {result.entries.map((song) => {
            const selection = selected[song.id];
            const audioFiles = song.audioFiles ?? [];
            return (
              <div className="bulk-song-row" key={song.id}>
                <label className="bulk-song-select"><input type="checkbox" checked={Boolean(selection)} onChange={() => toggleSong(song)} disabled={busy && Boolean(progress)} /><span>{song.title}</span><small>{song.artists.join(", ")}</small></label>
                <div className="bulk-song-version">
                  <span>{audioFiles.length ? `${audioFiles.length} audio ${audioFiles.length === 1 ? "version" : "versions"}` : "No audio available"}</span>
                  {selection && audioFiles.length > 1 && (
                    <select aria-label={`Select version for ${song.title}`} value={selection.fileId} onChange={(event) => setSelected((current) => ({ ...current, [song.id]: { ...selection, fileId: event.target.value } }))}>
                      {audioFiles.map((file) => <option key={file.id} value={file.id}>{file.fileName} · {file.fileType} · {(file.fileSize / 1_048_576).toFixed(1)} MB</option>)}
                    </select>
                  )}
                  {!selection && audioFiles[0] && <small>Best available: {audioFiles[0].fileType}, {(audioFiles[0].fileSize / 1_048_576).toFixed(1)} MB</small>}
                </div>
              </div>
            );
          })}
        </div>
      ) : <div className="bulk-empty">{busy ? "Searching…" : error ? "" : "No songs match these filters."}</div>}
      <nav className="bulk-pagination" aria-label="Bulk result pages">
        <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || busy}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button type="button" onClick={() => setPage((current) => Math.min(pages, current + 1))} disabled={page >= pages || busy}>Next</button>
      </nav>
      <div className="bulk-download-actions">
        {progress && <span role="status">{progress}</span>}
        <button type="button" onClick={() => void downloadZip()} disabled={busy || !selectedSongs.length}>{busy ? "Preparing…" : `Download ${selectedSongs.length || ""} as ZIP`}</button>
      </div>
    </section>
  );
}
