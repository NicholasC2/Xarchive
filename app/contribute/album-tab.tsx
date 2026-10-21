import Image from "next/image";
import { ImagePlus } from "lucide-react";
import SearchInput from "../pieces/search-input";
import { Genre } from "@/lib/types";
import type { SharedContributionProps } from "./types";

export default function AlbumTab({
  entries,
  albumArtistInput,
  setAlbumArtistInput,
  selectedAlbumCollectiveId,
  selectedAlbumCollectiveTitle,
  setSelectedAlbumCollectiveId,
  setSelectedAlbumCollectiveTitle,
  setArtistImage,
  setImagePreview,
  imagePreview,
  artistImage,
  albumTracks,
  setAlbumTracks,
}: SharedContributionProps) {
  const albumSongOptions = Array.from(
    new Set(
      entries
        .filter((entry) => entry.kind === "song")
        .filter((entry) => {
          const targetArtists = albumArtistInput.split(",").map((name) => name.trim().toLowerCase()).filter(Boolean);
          if (targetArtists.length === 0) return true;
          const songArtists = Array.isArray(entry.artists) ? entry.artists : [];
          return songArtists.some((artist) => targetArtists.includes(artist.trim().toLowerCase()));
        })
        .map((entry) => entry.title)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const updateAlbumTrack = (index: number, value: string) => {
    setAlbumTracks(albumTracks.map((track, trackIndex) => trackIndex === index ? value : track));
  };

  const addAlbumTrack = () => setAlbumTracks([...albumTracks, ""]);

  const removeAlbumTrack = (index: number) => {
    if (albumTracks.length === 1) {
      setAlbumTracks([""]);
      return;
    }
    setAlbumTracks(albumTracks.filter((_, trackIndex) => trackIndex !== index));
  };

  const moveAlbumTrack = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= albumTracks.length) return;
    const copy = [...albumTracks];
    [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
    setAlbumTracks(copy);
  };

  return (
    <>
      <label className="field-label" htmlFor="album-artists">Artist(s)<span>Separate with commas</span></label>
      <input id="album-artists" name="artists" list="album-artists-list" required placeholder="Artist or group" onChange={(event) => setAlbumArtistInput(event.target.value)} />
      <datalist id="album-artists-list">{entries.filter((entry) => entry.kind === "artist").map((artist) => <option key={artist.title} value={artist.title} />)}</datalist>
      <label className="field-label" htmlFor="album-collective-search">Collective<span>Optional</span></label>
      <SearchInput
        id="album-collective-search"
        searchable={entries.filter((entry) => entry.kind === "collective").map((entry) => entry.title)}
        value={selectedAlbumCollectiveTitle}
        placeholder="Search for a collective"
        onChange={(event) => {
          const title = event.target.value;
          setSelectedAlbumCollectiveTitle(title);
          const match = entries.find((entry) => entry.kind === "collective" && entry.title.toLowerCase() === title.trim().toLowerCase());
          setSelectedAlbumCollectiveId(match?.id ?? "");
        }}
        onClickItem={(title) => {
          setSelectedAlbumCollectiveTitle(title);
          const match = entries.find((entry) => entry.kind === "collective" && entry.title.toLowerCase() === title.trim().toLowerCase());
          setSelectedAlbumCollectiveId(match?.id ?? "");
        }}
      />
      <input type="hidden" name="collectiveId" value={selectedAlbumCollectiveId} />
      <div className="field-row">
        <div className="field-group"><label className="field-label" htmlFor="release-date">Release date<span>Optional</span></label><input id="release-date" name="releaseDate" type="date" max={new Date().toISOString().split("T")[0]} /></div>
        <div className="field-group"><label className="field-label" htmlFor="album-image">Album artwork<span>Optional · up to 2 MB</span></label><label className="file-picker" htmlFor="album-image"><ImagePlus size={16} /><span>{artistImage?.name ?? "Choose image"}</span><input id="album-image" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setArtistImage(file);
          setImagePreview(file ? URL.createObjectURL(file) : "");
        }} /></label></div>
      </div>
      <div className="tracklist-editor">
        <div className="tracklist-header">
          <label className="field-label" htmlFor="album-tracklist-0">Track list<span>Reorder as needed</span></label>
          <button type="button" className="tracklist-add" onClick={addAlbumTrack}>Add track</button>
        </div>
        <div className="tracklist-items" id="album-tracklist-list">
          {albumTracks.map((track, index) => {
            const visibleSuggestions = albumSongOptions.filter((songTitle) => {
              const query = track.trim().toLowerCase();
              if (!query) return true;
              return songTitle.toLowerCase().includes(query);
            }).slice(0, 8);

            return (
              <div key={`track-${index}`} className="tracklist-item">
                <span className="tracklist-index">{index + 1}</span>
                <div className="track-search">
                  <SearchInput
                    id={`album-tracklist-${index}`}
                    searchable={albumSongOptions}
                    value={track}
                    onChange={(event) => updateAlbumTrack(index, event.target.value)}
                    onClickItem={(songTitle) => updateAlbumTrack(index, songTitle)}
                    placeholder="Search song title"
                  />
                  {visibleSuggestions.length > 0 && (
                    <div className="track-search-suggestions" role="listbox" aria-label={`Song suggestions for track ${index + 1}`}>
                      {visibleSuggestions.map((songTitle) => (
                        <button key={`${songTitle}-${index}`} type="button" className="track-search-option" onClick={() => updateAlbumTrack(index, songTitle)}>{songTitle}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="tracklist-item-actions">
                  <button type="button" className="tracklist-action" onClick={() => moveAlbumTrack(index, -1)} disabled={index === 0}>↑</button>
                  <button type="button" className="tracklist-action" onClick={() => moveAlbumTrack(index, 1)} disabled={index === albumTracks.length - 1}>↓</button>
                  <button type="button" className="tracklist-action danger" onClick={() => removeAlbumTrack(index)} disabled={albumTracks.length === 1}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <fieldset className="genre-options"><legend>Genres<span>Choose any that fit</span></legend><div className="genre-chip-grid">{Object.values(Genre).map((genre) => <label key={genre} className="genre-chip"><input type="checkbox" name="genres" value={genre} /><span>{genre}</span></label>)}</div></fieldset>
      <label className="field-label" htmlFor="entry-bio">Album notes<span>Optional</span></label>
      <textarea id="entry-bio" name="bio" maxLength={2000} rows={3} placeholder="A little context about this release…" />
      {imagePreview && <Image className="contribution-image-preview" src={imagePreview} alt="Album artwork preview" width={300} height={180} unoptimized />}
    </>
  );
}
