"use client";

import { Badge } from "@/lib/db";
import ProfilePhoto from "./profile-photo";
import BadgeDisplay from "./badge";
import TextColored from "./text-color";

interface ProfileProps {
    image: string | false;
    name: string | false;
    badges: Badge[] | false;
}

export default function Profile({ image, name, badges }: ProfileProps) {
    return (
        <div className="grid grid-cols-[auto_1fr] gap-5 items-stretch">
            {typeof image == "string"
             ? <ProfilePhoto image={image} />
             : <ProfilePhoto loading={true} />}

            <div className="flex flex-col min-w-0 max-h-[50px]">
                {typeof name == "string"
                 ? (Array.isArray(badges) && badges.length > 0
                     ? <TextColored style={{fontSize: "22px"}} text={name} textColor={badges[0].textColor} />
                     : <h2 style={{margin: 0, fontSize: "22px"}}>{name}</h2>
                   )
                 : <div style={{marginBottom: 5, height: "29px"}} className="loading w-full" />}

                {Array.isArray(badges)
                 ? <div className="flex flex-row gap-2 overflow-hidden">{badges.map(badge => (<BadgeDisplay badge={badge} key={badge.name} />))}</div>
                 : <div className="loading w-full flex-1 min-h-0" />}
                
            </div>
        </div>
    );
}