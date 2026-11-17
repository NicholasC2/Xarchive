
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

interface MediaEntry {
    file: File | null;
    media: MediaFile;
    isNew: boolean;
}

interface MediaEditProps {
    mediaDispatch?: [
        string[],
        Dispatch<SetStateAction<string[]>>
    ];
}

export default function MediaEdit({ mediaDispatch }: MediaEditProps) {
    const [internalMedia, setInternalMedia] = useState<string[]>([]);

    const [media, setMedia] = mediaDispatch ?? [
        internalMedia,
        setInternalMedia,
    ];

    const [mediaData, setMediaData] = useState<MediaEntry[]>([]);

    useEffect(() => {
        let cancelled = false;

        async function fetchMedia() {
            if (!media.length) {
                setMediaData([]);
                return;
            }

            const results = await Promise.all(
                media.filter(Boolean).map(async url => {
                    const response = await fetch(
                        `/api/media/${encodeURIComponent(url)}`
                    );

                    if (!response.ok) return null;

                    const metadata = await response.json() as MediaFile;

                    return {
                        file: null,
                        media: metadata,
                        isNew: false,
                    } as MediaEntry;
                })
            );

            if (!cancelled) {
                setMediaData(previous => {
                    const newFiles = previous.filter(entry => entry.isNew);

                    return [
                        ...results.filter(
                            (entry): entry is MediaEntry => entry !== null
                        ),
                        ...newFiles,
                    ];
                });
            }
        }

        fetchMedia().catch(console.error);

        return () => {
            cancelled = true;
        };
    }, [media]);

    function addFile(file: File | undefined) {
        if(!file) return;

        const type = file.type.split("/")[0];

        if (!mediaTypes.includes(type as MediaType)) return;

        setMediaData(previous => [...previous, {
            file,
            isNew: true,
            media: {
                url: "",
                name: file.name,
                createdAt: new Date(),
                format: file.name.split(".").pop() ?? "",
                mimeType: file.type,
                sizeBytes: file.size,
                source: "unknown",
                type: type as MediaType,
            } as MediaFile,
        }]);
    }

    function removeFile(index: number) {
        const entry = mediaData[index];

        setMediaData(previous =>
            previous.filter((_, i) => i !== index)
        );

        if (!entry.isNew) {
            setMedia(previous =>
                previous.filter(url => url !== entry.media.url)
            );
        }
    }

    function updateMedia(
        index: number,
        updates: Partial<MediaFile>
    ) {
        setMediaData(previous =>
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
        "cover-back",
        "cover-front",
        "banner",
        "thumbnail",
        "image"
    ]

    return (
        <div className="grid gap-2 grid-cols-2">
            {mediaData.map((entry, index) => (
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

                    {entry.media.type == "audio" && <div>
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
