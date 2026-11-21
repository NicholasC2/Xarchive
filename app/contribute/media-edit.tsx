"use client";

import {
    Dispatch,
    SetStateAction,
    useState,
} from "react";

import { Plus, X } from "lucide-react";
import { MediaType, mediaTypes } from "@/lib/db/constants/mediaType";
import DropDown from "../dropdown/dropdown";
import { AudioSource, sources } from "@/lib/db/constants/sources";
import { authClient } from "@/lib/auth/client";

export interface MediaEntry {
    file: File | string | null;
    isNew: boolean;
    comment: string;
    mediaType: MediaType;
    source: AudioSource;
    contributor: string;
}

interface MediaEditProps {
    mediaDispatch?: [
        MediaEntry[],
        Dispatch<SetStateAction<MediaEntry[]>>
    ];
    allowedTypes: readonly MediaType[];
}

const acceptedMimeTypes: Record<MediaType, string[]> = {
    "Image": ["image/*"],
    "Audio": ["audio/*"],
    "Video": ["video/*"],
    "Cover": ["image/*"],
    "Banner": ["image/*"]
};

export default function MediaEdit({ mediaDispatch, allowedTypes = mediaTypes }: MediaEditProps) {
    const [media, setMedia] = mediaDispatch ?? useState<MediaEntry[]>([]);

    const { data: session } = authClient.useSession();

    function getMediaType(file: File): MediaType | null {
        const mimeCategory = file.type.split("/")[0];

        switch (mimeCategory) {
            case "image":
                return "Cover";
            case "audio":
                return "Audio";
            case "video":
                return "Video";
            default:
                return null;
        }
    }

    function addFile(file: File | undefined) {
        if(!session || !file) return;

        const fileMediaType = getMediaType(file) as MediaType;

        if(!fileMediaType) return;
        if(!allowedTypes?.includes(fileMediaType)) return;

        setMedia(previous => [
            ...previous,
            {
                comment: "",
                contributor: session.user.id,
                file: file,
                isNew: true,
                mediaType: fileMediaType,
                source: "Unknown"
            }
        ]);
    }

    function removeFile(index: number) {
        if(media[index].contributor != session?.user.id) return;

        setMedia(previous =>
            previous.filter((m, i) => i !== index)
        );
    }

    function updateMedia(
        index: number,
        updates: Partial<MediaEntry>
    ) {
        setMedia(previous =>
            previous.map((entry, i) =>
                i === index
                    ? {
                        ...entry,
                        ...updates,
                    }
                    : entry
            )
        );
    }

    const imageTypes = [
        "Cover",
        "Banner",
        "Image"
    ]

    return (
        <div className="flex flex-col gap-2">
            {media.map((entry, index) => (
                <div 
                    className="panel nosize relative" 
                    style={{
                        padding: 10, 
                        margin: 0
                    }} 
                    key={index}
                >
                    {entry.contributor == session?.user.id
                        && <X onClick={()=>removeFile(index)} className="cursor-pointer absolute right-[10px]" size={18} />}
                    <div 
                        className="flex flex-row"
                        style={{
                            alignItems: "center",
                            gap: "5px",
                            overflowX: "auto",
                            maxWidth: "95%",
                            textWrap: "nowrap"
                        }}
                    >
                        {
                            typeof entry.file != "string"
                            ? <div>{entry.file?.name} (Not Uploaded)</div>
                            : <a href={entry.file}>{entry.file}</a>
                        }
                    </div>
                    <div className="">
                        <label>Comment:</label>
                        <textarea 
                            value={entry.comment} 
                            onChange={e => updateMedia(index, {
                                comment: e.target.value
                            })}
                        />
                        <div className="flex-1" />
                    </div>

                    {imageTypes.includes(entry.mediaType) && <div>
                        <label>Image Type:</label>
                        <DropDown
                            items={allowedTypes.filter(m => imageTypes.includes(m))}
                            value={entry.mediaType}
                            onChange={e => updateMedia(index, {
                                mediaType: e.target.value as MediaType
                            })}
                        />
                    </div>}

                    {entry.mediaType == "Audio" && <div>
                        <label>Audio Source:</label>
                        <DropDown
                            items={sources.values().toArray()}
                            value={entry.source}
                            onChange={e => updateMedia(index, {
                                source: e.target.value as AudioSource
                            })}
                            input={false}
                        />
                    </div>}
                </div>
            ))}

            <label
                className="panel nosize"
                style={{
                    margin: 0,
                    cursor: "pointer",
                    background: "var(--background-1)"
                }}
                htmlFor="file_upload"
            >
                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "center",
                        alignItems: "center",
                        margin: "auto",
                        height: "100%"
                    }}
                >
                    <Plus />
                    Add Media
                </div>
                <input
                    type="file"
                    hidden
                    id="file_upload"
                    name="file_upload"
                    accept={[
                        ...new Set(
                            allowedTypes.flatMap(type => acceptedMimeTypes[type])
                        )
                    ].join(",")}
                    onChange={e => {
                        addFile(e.target.files?.[0]);
                        e.target.value = "";
                    }}
                />
            </label>
        </div>
    );
}
