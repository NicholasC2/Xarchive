export const sources = [
    "Soundcloud",
    "Spotify",
    "Youtube",
    "Social Media",
    "Unknown",
] as const;
export type AudioSource = (typeof sources)[number];