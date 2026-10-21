import type { Dispatch, SetStateAction } from "react";

export type ContributionMode = "song" | "album" | "artist" | "collective";

export type ArchiveEntry = {
  id: string;
  kind: string;
  title: string;
  aka: string[];
  artists?: string[];
  mediaUrl?: string | null;
  releaseYear?: number | null;
};

export type SharedContributionProps = {
  entries: ArchiveEntry[];
  albums: ArchiveEntry[];
  artistImage: File | null;
  bannerImage: File | null;
  galleryImages: File[];
  imagePreview: string;
  selectedAlbumId: string;
  selectedAlbumTitle: string;
  selectedAlbumCollectiveId: string;
  selectedAlbumCollectiveTitle: string;
  selectedSongCollectiveId: string;
  selectedSongCollectiveTitle: string;
  setArtistImage: Dispatch<SetStateAction<File | null>>;
  setBannerImage: Dispatch<SetStateAction<File | null>>;
  setGalleryImages: Dispatch<SetStateAction<File[]>>;
  setImagePreview: Dispatch<SetStateAction<string>>;
  setSelectedAlbumId: Dispatch<SetStateAction<string>>;
  setSelectedAlbumTitle: Dispatch<SetStateAction<string>>;
  setSelectedAlbumCollectiveId: Dispatch<SetStateAction<string>>;
  setSelectedAlbumCollectiveTitle: Dispatch<SetStateAction<string>>;
  setSelectedSongCollectiveId: Dispatch<SetStateAction<string>>;
  setSelectedSongCollectiveTitle: Dispatch<SetStateAction<string>>;
  albumArtistInput: string;
  setAlbumArtistInput: Dispatch<SetStateAction<string>>;
  albumTracks: string[];
  setAlbumTracks: Dispatch<SetStateAction<string[]>>;
  audioFiles: File[];
  setAudioFiles: Dispatch<SetStateAction<File[]>>;
};
