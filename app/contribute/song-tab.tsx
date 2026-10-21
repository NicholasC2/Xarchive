import Image from "next/image";
import { ImagePlus, Music2 } from "lucide-react";
import SearchInput from "../pieces/search-input";
import { Genre } from "@/lib/types";
import type { SharedContributionProps } from "./types";

export default function SongTab({
  entries,
  albums,
  artistImage,
  imagePreview,
  selectedAlbumId,
  selectedAlbumTitle,
  selectedSongCollectiveId,
  selectedSongCollectiveTitle,
  setSelectedSongCollectiveId,
  setSelectedSongCollectiveTitle,
  setSelectedAlbumId,
  setSelectedAlbumTitle,
  setArtistImage,
  setImagePreview,
  audioFiles,
  setAudioFiles,
}: SharedContributionProps) {
  return (
    <>
      <label className="field-label" htmlFor="entry-artists">Artist(s)<span>Separate with commas</span></label>
      <input id="entry-artists" name="artists" list="archive-artists" required placeholder="Artist or group" />
      <datalist id="archive-artists">{entries.filter((entry) => entry.kind === "artist").map((artist) => <option key={artist.title} value={artist.title} />)}</datalist>
      <label className="field-label" htmlFor="song-collective-search">Collective<span>Optional</span></label>
      <SearchInput
        id="song-collective-search"
        searchable={entries.filter((entry) => entry.kind === "collective").map((entry) => entry.title)}
        value={selectedSongCollectiveTitle}
        placeholder="Search for a collective"
        onChange={(event) => {
          const title = event.target.value;
          setSelectedSongCollectiveTitle(title);
          const match = entries.find((entry) => entry.kind === "collective" && entry.title.toLowerCase() === title.trim().toLowerCase());
          setSelectedSongCollectiveId(match?.id ?? "");
        }}
        onClickItem={(title) => {
          setSelectedSongCollectiveTitle(title);
          const match = entries.find((entry) => entry.kind === "collective" && entry.title.toLowerCase() === title.trim().toLowerCase());
          setSelectedSongCollectiveId(match?.id ?? "");
        }}
      />
      <input type="hidden" name="collectiveId" value={selectedSongCollectiveId} />
      <label className="field-label" htmlFor="song-album-search">Album<span>Optional · album artwork is used automatically</span></label>
      <SearchInput
        id="song-album-search"
        searchable={albums.map((album) => album.title)}
        value={selectedAlbumTitle}
        placeholder="Search for an album"
        onChange={(event) => {
          const title = event.target.value;
          setSelectedAlbumTitle(title);
          const match = albums.find((album) => album.title.toLowerCase() === title.trim().toLowerCase());
          setSelectedAlbumId(match?.id ?? "");
          setImagePreview(match?.mediaUrl ?? "");
        }}
        onClickItem={(title) => {
          setSelectedAlbumTitle(title);
          const match = albums.find((album) => album.title.toLowerCase() === title.trim().toLowerCase());
          setSelectedAlbumId(match?.id ?? "");
          setImagePreview(match?.mediaUrl ?? "");
        }}
      />
      <input type="hidden" name="albumId" value={selectedAlbumId} />
      <div className="field-row">
        <div className="field-group"><label className="field-label" htmlFor="entry-source">Audio source</label><select id="entry-source" name="source" defaultValue="unknown"><option value="soundcloud">SoundCloud</option><option value="spotify">Spotify</option><option value="youtube">YouTube</option><option value="social media">Social media</option><option value="unknown">Unknown</option></select></div>
        <div className="field-group"><label className="field-label" htmlFor="entry-audio">Audio files<span>Up to 10 · 8 MB each</span></label><label className="file-picker" htmlFor="entry-audio"><Music2 size={16} /><span>{audioFiles.length ? `${audioFiles.length} files selected` : "Choose audio files"}</span><input id="entry-audio" type="file" multiple accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/ogg,audio/flac,audio/webm" onChange={(event) => setAudioFiles(Array.from(event.target.files ?? []))} required /></label></div>
      </div>
      {audioFiles.length > 0 && <ul className="audio-file-list">{audioFiles.map((file) => <li key={`${file.name}-${file.size}`}><Music2 size={13} /><span>{file.name}</span><small>{(file.size / (1024 * 1024)).toFixed(1)} MB</small></li>)}</ul>}
      <div className="field-row">
        <div className="field-group"><label className="field-label" htmlFor="song-release-date">Release date<span>Optional</span></label><input id="song-release-date" name="songReleaseDate" type="date" max={new Date().toISOString().split("T")[0]} /></div>
        <div className="field-group"><label className="field-label" htmlFor="song-tags">Tags<span>Comma-separated</span></label><input id="song-tags" name="tags" placeholder="live, demo, remaster" /></div>
      </div>
      <fieldset className="genre-options"><legend>Genres<span>Choose any that fit</span></legend><div className="genre-chip-grid">{Object.values(Genre).map((genre) => <label key={genre} className="genre-chip"><input type="checkbox" name="genres" value={genre} /><span>{genre}</span></label>)}</div></fieldset>
      <label className="field-label" htmlFor="song-image">Song cover<span>Optional · album cover takes priority</span></label>
      <label className="image-picker" htmlFor="song-image">
        {imagePreview ? <Image src={imagePreview} alt="Song cover preview" width={36} height={36} unoptimized /> : <ImagePlus size={22} />}
        <span>{artistImage?.name ?? "Choose a cover image"}</span>
        <input id="song-image" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setArtistImage(file);
          setImagePreview(file ? URL.createObjectURL(file) : "");
        }} />
      </label>
      {imagePreview && <Image className="contribution-image-preview" src={imagePreview} alt="Song cover preview" width={300} height={180} unoptimized />}
      <label className="field-label" htmlFor="entry-bio">Audio bio / notes<span>Optional</span></label>
      <textarea id="entry-bio" name="bio" maxLength={2000} rows={3} placeholder="A little context about this recording…" />
    </>
  );
}
