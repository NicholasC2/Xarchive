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
import { showError } from "../error";

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
}

export default function MediaEdit({ mediaDispatch }: MediaEditProps) {
    const [media, setMedia] = mediaDispatch ?? useState<MediaEntry[]>([]);

    const { data: session } = authClient.useSession();

    function getMediaType(file: File): MediaType | null {
        const mimeCategory = file.type.split("/")[0];

        switch (mimeCategory) {
            case "image":
                return "Image";
            case "audio":
                return "Audio";
            case "video":
                return "Video";
            default:
                return null;
        }
    }

    function addFile(file: File | undefined) {
        if(!file) return;

        if (!mediaTypes.includes(getMediaType(file) as MediaType)) return;

        if(!session) return;

        setMedia(previous => [
            ...previous,
            {
                comment: "",
                contributor: session.user.id,
                file: file,
                isNew: true,
                mediaType: getMediaType(file) as MediaType,
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

    const onlyOne = [
        "Cover front",
        "Cover back",
        "Banner",
        "Thumbnail"
    ]

    function updateMedia(
        index: number,
        updates: Partial<MediaEntry>
    ) {
        for (const one of onlyOne) {
            if (
                updates.mediaType === one &&
                media.some((m, i) => i !== index && m.mediaType === one)
            ) {
                showError(`Cannot have multiple "${one}"`);
                return;
            }
        }

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
        "Cover back",
        "Cover front",
        "Banner",
        "Thumbnail",
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
                            items={imageTypes}
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
                    accept="audio/*,image/*,video/*"
                    onChange={e => {
                        addFile(e.target.files?.[0]);
                        e.target.value = "";
                    }}
                />
            </label>
        </div>
    );
}
