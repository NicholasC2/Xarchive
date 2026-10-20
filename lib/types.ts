export interface Image {
    url: string;
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
    source?: "soundcloud" | "spotify" | "youtube" | "social media" | "unknown";
}

export interface Artist {
    id: string;
    name: string;
    bio: string;
    aka?: string[];

    profilePhoto?: Image | undefined;
}

export enum Genre {
    Pop = "pop",
    Rock = "rock",
    HipHop = "hip-hop",
    RnB = "rnb",
    Electronic = "electronic",
    Dance = "dance",
    Jazz = "jazz",
    Blues = "blues",
    Classical = "classical",
    Country = "country",
    Folk = "folk",
    Metal = "metal",
    Punk = "punk",
    Reggae = "reggae",
    Latin = "latin",
    World = "world",
    Religious = "religious",
    Soundtrack = "soundtrack",
    Experimental = "experimental",
    Other = "other",
}

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
}

export interface Collective {
    id: string;
    name: string;
    artists: Artist[];
    bio?: string;
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
}