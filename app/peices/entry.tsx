import { Album, Artist, Song } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { Music } from "lucide-react";
import Profile from "./profile";

interface EntryProps {
    entry: Song | Album | Artist;
    links?: boolean;
}

export default function Entry({ entry, links = true }: EntryProps) {
    let type: string;

    if ("artists" in entry) {
        type = "song";
    } else if ("songs" in entry) {
        type = "album";
    } else {
        type = "artist";
    }

    const cover = entry.media.find(m => m.mediaType == "Cover");

    const info = <div className="flex flex-row items-stretch gap-2">
        <div className="aspect-square flex h-full overflow-hidden flex-shrink-0"
            style={{
                justifyContent: "center",
                alignItems: "center",
                background: "#666",
                borderRadius: "50%"
            }}
        >
            {cover
                ? <Image
                    src={cover.url}
                    alt="Cover"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                />
                : <Music size={30} />}
        </div>

        <div className="flex flex-col min-w-0">
            <span className="text-[15px]">{entry.name}</span>
            <span className="overflow-hidden text-ellipsis">{entry.bio}</span>
        </div>
    </div>

    return links ? <Link href={`/${type}/${entry.id}`} className="grid grid-cols-[auto_1fr] items-stretch gap-2">
        {info}
    </Link>
    : <div className="grid grid-cols-[auto_1fr] items-stretch gap-2">
        {info}
    </div>
}