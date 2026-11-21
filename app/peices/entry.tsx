import { Album, Artist, Song } from "@/lib/db";
import Link from "next/link";
import ProfilePhoto from "./profile-photo";

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

    return <Link href={link} className="flex flex-row">
        <ProfilePhoto image={entry.media[0] ?? null} />
        <div className="flex flex-col">
            <h2>{entry.name}</h2>
            <span style={{overflowX: "clip", textOverflow: "ellipsis"}}>{entry.bio}</span>
        </div>
    </Link>
}