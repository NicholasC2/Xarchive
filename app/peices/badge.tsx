"use client";

import { type Badge } from "@/lib/db";
import Image from "next/image";
import { useState } from "react";
import { createPortal } from "react-dom";
import ColorText from "./text-color";

export default function BadgeDisplay({ badge }: { badge: Badge }) {
    const [hovering, setHovering] = useState(false);

    createPortal(
        hovering && <div className="flex flex-col">
            <ColorText text={badge.name} textColor={badge.textColor} />
            <div>{badge.acquireBy}</div>
        </div>,
        document.body
    )

    return (
        <Image src={badge.icon} alt={badge.name+" badge icon"} />
    )
}