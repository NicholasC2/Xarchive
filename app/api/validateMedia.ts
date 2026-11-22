import { MediaEntry } from "@/lib/db";
import { audioSources } from "@/lib/db/constants/audioSources";
import { mediaTypes } from "@/lib/db/constants/mediaType";
import { z } from "zod";

const MediaEntrySchema: z.ZodType<MediaEntry> = z.object({
    url: z.string(),
    comment: z.string(),
    mediaType: z.enum(mediaTypes),
    audioSource: z.enum(audioSources),
    contributor: z.string()
});

export function validateMedia(media?: MediaEntry[] | undefined) {
    const MediaArraySchema = z.array(MediaEntrySchema);
    
    const mediaResult = MediaArraySchema.safeParse(media ?? []);

    if (!mediaResult.success) {
        throw mediaResult.error;
    }

    return mediaResult.data;
}