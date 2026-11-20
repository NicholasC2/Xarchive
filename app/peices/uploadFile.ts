"use client";

import { MediaType } from "@/lib/db/constants/mediaType";
import { AudioSource } from "@/lib/db/constants/sources";

export async function uploadFile(file: File, folder: string = "trash", metadata?: {
    comment?: string;
    mediaType?: MediaType;
    source?: AudioSource;
}): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    
    formData.append("comment", metadata?.comment ?? "");
    formData.append("mediaType", metadata?.mediaType ?? "None");
    formData.append("source", metadata?.source ?? "");

    const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data.key;
}