export const audioSources = [
    "Soundcloud",
    "Spotify",
    "Youtube",
    "Social Media",
    "Unknown",
] as const;
export type AudioSource = (typeof audioSources)[number];