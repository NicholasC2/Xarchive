export interface Image {
    url: string;
    bio: string;
}

export interface Profile {
    username: string; //unique
    bio: string; 

    profilePhoto?: Image; 
    bannerPhoto?: Image; 
    
    followers: string[];
    following: string[];
}

export interface AudioFile {
    url: string;
    format: string;       // mp3, flac, wav, m4a, etc
    sampleRateHz: number;
    duration: number;     // seconds
    sizeBytes: number;
    bitrateKbps?: number;
    bitDepth?: number;
    bio?: string;
    source?: AudioSource;
}

export interface Artist {
    id: string;
    name: string;
    bio: string;
    aka?: string;

    profilePhoto?: Image;
    bannerPhoto?: Image; 
}

export const sources = [
    "soundcloud",
    "spotify",
    "youtube",
    "social media",
    "unknown"
]

export type AudioSource = (typeof sources)[number];

export const genres = [
    "pop",
    "rock",
    "hip-hop",
    "rnb",
    "electronic",
    "dance",
    "jazz",
    "blues",
    "classical",
    "country",
    "folk",
    "metal",
    "punk",
    "reggae",
    "latin",
    "world",
    "religious",
    "soundtrack",
    "experimental",
    "other",
] as const;

export type Genre = (typeof genres)[number];

export interface Album {
    id: string;
    name: string;
    bio: string;
    tags: string[];
    genre: Genre[];

    mainArtist: Artist[];
    collective?: Collective;
    
    releaseDate: Date | undefined; // undefined for unreleased
    songs: Song[];
    releaseYear?: number;

    coverPhotos?: Image[];
}

export interface Collective {
    id: string;
    name: string;
    artists: Artist[];
    bio?: string;

    profilePhoto?: Image;
    bannerPhoto?: Image; 
}

export interface Song {
    id: string;
    name: string;
    bio: string;
    tags: string[];
    genre: Genre[];

    mainArtist: Artist[];
    featuredArtists: Artist[];
    collective?: Collective;

    releaseDate: Date | undefined; // undefined for unreleased
    audioFiles: AudioFile[];
    coverPhotos?: Image[];
}