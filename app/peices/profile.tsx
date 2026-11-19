"use client";

import { Badge } from "@/lib/db";
import ProfilePhoto from "./profile-photo";
import BadgeDisplay from "./badge";

interface ProfileProps {
    image: string | false;
    name: string | false;
    badges: Badge[] | false;
}

export default function Profile({ image, name, badges }: ProfileProps) {
    return (
        <div className="grid grid-cols-[auto_1fr] gap-5 items-stretch">
            {image != false
             ? <ProfilePhoto image={image} />
             : <ProfilePhoto loading={true} />}

            <div className="flex flex-col min-w-0">
                {name != false
                 ? <h2 style={{margin: 0}}>{name}</h2>
                 : <div style={{marginBottom: 5, height: "29px"}} className="loading w-full" />}

                {badges != false
                 ? <div className="flex flex-row gap-2">{badges.map(badge => (<BadgeDisplay badge={badge} />))}</div>
                 : <div className="loading w-full flex-1 min-h-0" />}
                
            </div>
        </div>
    );
}