export const sources = [
    "soundcloud",
    "spotify",
    "youtube",
    "social media",
    "unknown",
] as const;

export type AudioSource = (typeof sources)[number];