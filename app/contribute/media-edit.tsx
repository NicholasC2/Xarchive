"use client";

import {
    Dispatch,
    SetStateAction,
    useEffect,
    useState,
} from "react";

import { MediaFile } from "@/lib/db/schema";
import { Plus, Upload, X } from "lucide-react";
import { MediaType, mediaTypes } from "@/lib/db/constants/mediaType";
import DropDown from "../dropdown/dropdown";
import { AudioSource, sources } from "@/lib/db/constants/sources";

export interface MediaEntry {
    file: File | null;
    media: MediaFile;
    isNew: boolean;
}

interface MediaEditProps {
    mediaDispatch?: [
        MediaEntry[],
        Dispatch<SetStateAction<MediaEntry[]>>
    ];
}

export default function MediaEdit({ mediaDispatch }: MediaEditProps) {
    const [media, setMedia] = mediaDispatch ?? useState<MediaEntry[]>([]);

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

        setMedia(previous => [...previous, {
            file,
            isNew: true,
            media: {
                url: "",
                name: file.name.slice(0, file.name.lastIndexOf(".")),
                createdAt: new Date(),
                format: file.name.split(".").pop() ?? "",
                mimeType: file.type,
                sizeBytes: file.size,
                source: "Unknown",
                type: getMediaType(file) as MediaType,
            } as MediaFile,
        }]);
    }

    function removeFile(index: number) {
        setMedia(previous =>
            previous.filter((m, i) => i !== index)
        );
    }

    function updateMedia(
        index: number,
        updates: Partial<MediaFile>
    ) {
        setMedia(previous =>
            previous.map((entry, i) =>
                i === index
                    ? {
                        ...entry,
                        media: {
                            ...entry.media,
                            ...updates,
                        },
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
        <div className="grid gap-2 grid-cols-2">
            {media.map((entry, index) => (
                <div 
                    className="panel nosize relative" 
                    style={{
                        padding: 10, 
                        margin: 0
                    }} 
                    key={index}
                >
                    <X onClick={()=>removeFile(index)} className="cursor-pointer absolute right-[10px]" size={18} />
                    <div 
                        className="flex flex-row"
                        style={{
                            alignItems: "center",
                            gap: "5px"
                        }}
                    >
                        <div className="font-[650] text-[11px]">URL:</div>
                        {
                            entry.isNew
                            ? <div>Not Uploaded</div>
                            : <a href={entry.media.url}>{entry.media.url}</a>
                        }
                    </div>
                    <div className="">
                        <label>Name:</label>
                        <input 
                            value={entry.media.name} 
                            onChange={e => updateMedia(index, {
                                name: e.target.value
                            })}
                        />
                        <div className="flex-1" />
                    </div>

                    {imageTypes.includes(entry.media.type) && <div>
                        <label>Image Type:</label>
                        <DropDown
                            items={imageTypes}
                            value={entry.media.type}
                            onChange={e => updateMedia(index, {
                                type: e.target.value as MediaType
                            })}
                        />
                    </div>}

                    {entry.media.type == "Audio" && <div>
                        <label>Audio Source:</label>
                        <DropDown
                            items={sources.values().toArray()}
                            value={entry.media.source}
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
