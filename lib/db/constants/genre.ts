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