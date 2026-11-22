"use client";
import { MediaEntry } from "@/lib/db";
import { HtmlHTMLAttributes } from "react";

interface MediaEditProps extends HtmlHTMLAttributes<HTMLDivElement> {
    media: MediaEntry[];
}

export default function MediaList({ media, ...props }: MediaEditProps) {
    return (
        <div 
            {...props} 
            className={"flex flex-row overflow-clip gap-2 w-full relative " + props.className}
        >
            {media.filter(m => m.mediaType != "Audio").map((entry, index) => (
                <div
                    className="h-[200px] flex-none flex relative"
                    key={index}
                >
                    {entry.mediaType == "Video"
                    ? <video 
                        src={entry.url} 
                        className="h-[200px] flex-none"
                    />
                    : <img
                        src={entry.url}
                        className="h-[200px] flex-none"
                    />
                    }

                    <div className="absolute flex flex-col p-1 right-0" style={{background: "black"}} >
                        <label>{entry.mediaType}</label>
                    </div>
                </div>
            ))}

            <div 
                style={{
                    background: "linear-gradient(-90deg, var(--background-1) 0%, transparent 100%)",
                    display: "flex"
                }} 
                className="absolute h-full w-[100px] right-0" 
            />
        </div>
    );
}
