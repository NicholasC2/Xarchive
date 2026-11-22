"use client";

import { Badge } from "@/lib/db";
import ProfilePhoto from "./profile-photo";
import BadgeDisplay from "./badge";
import TextColored from "./text-color";

interface ProfileProps {
    image?: string | false | File;
    name: string | false;
    badges?: {static: Badge[], badges: Badge[]} | false;
}

export default function Profile({ image, name, badges }: ProfileProps) {
    return (
        <div className="grid grid-cols-[auto_1fr] gap-5 items-stretch">
            <ProfilePhoto image={image} />

            <div className="flex flex-col min-w-0 max-h-[50px]">
                {typeof name == "string"
                 ? (typeof badges != "boolean" && badges?.badges.length
                     ? <TextColored style={{fontSize: "22px"}} text={name} textColor={badges.static[0]?.textColor ?? badges.badges[0].textColor} />
                     : <h2 style={{margin: 0, fontSize: "22px"}}>{name}</h2>
                   )
                 : <div style={{marginBottom: 5, height: "29px"}} className="loading w-full" />}

                {typeof badges != "boolean"
                 ? <div className="flex flex-row gap-2 overflow-hidden">
                    {badges?.static?.map(badge => (<BadgeDisplay badge={badge} key={badge.name} />))}
                    {badges?.badges?.map(badge => (<BadgeDisplay badge={badge} key={badge.name} />))}
                </div>
                 : (typeof badges == "boolean"
                    ? <div className="loading w-full flex-1 min-h-0" />
                    : <></>
                )}
                
            </div>
        </div>
    );
}