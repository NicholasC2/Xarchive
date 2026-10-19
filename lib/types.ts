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
}

export interface Artist {
    id: string;
    name: string;
    bio: string;

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
    
    releaseDate: Date | undefined; // undefined for unreleased
    songs: Song[];
}

export interface Song {
    id: string;
    name: string;
    bio: string;
    tags: string[];
    genre: Genre[];

    mainArtist: Artist[];
    featuredArtists: Artist[];

    releaseDate: Date | undefined; // undefined for unreleased
    audioFiles: AudioFile[];
}