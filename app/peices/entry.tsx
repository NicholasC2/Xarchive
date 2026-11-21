import { Album, Artist, Song } from "@/lib/db";
import Link from "next/link";
import ProfilePhoto from "./profile-photo";
import Image from "next/image";
import { Music, User } from "lucide-react";

interface EntryProps {
    entry: Song | Artist | Album;
}

export default function Entry({ entry }: EntryProps) {
    let link;

    if("songs" in entry) {
        link = `/album/${entry.id}`
    } else if ("id" in entry) {
        link = `/song/${entry.id}`
    } else {
        link = `/artist/${entry.name}`
    }

    return <Link href={link} className="flex flex-row gap-2">
        <div className="flex" style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            overflow: "hidden"
        }}>
            {entry.media[0]
            ? <Image src={entry.media[0]} alt="Cover" width={40} height={40} className="w-full h-full" style={{
                objectFit: "cover"
            }} />
            : <Music size={30} />}
        </div>
        <div className="flex flex-col">
            <span className="text-[15px]">{entry.name}</span>
            <span style={{overflowX: "clip", textOverflow: "ellipsis"}}>{entry.bio}</span>
        </div>
    </Link>
}