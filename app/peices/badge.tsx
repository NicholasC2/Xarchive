"use client";

import { type Badge } from "@/lib/db";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ColorText from "./text-color";

export default function BadgeDisplay({ badge }: { badge: Badge }) {
    const [hovering, setHovering] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);

    function handleMouseEnter(e: React.MouseEvent<HTMLImageElement>) {
        setRect(e.currentTarget.getBoundingClientRect());
        setHovering(true);
    }

    return (
        <>
            <Image
                src={badge.icon}
                width={32}
                height={32}
                className="shrink-1 w-auto h-auto min-h-0 min-w-0 max-h-full cursor-pointer"
                alt={badge.name + " badge icon"}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setHovering(false)}
            />

            {hovering && rect && createPortal(
                <div
                    className="fixed z-50 flex flex-col"
                    style={{
                        left: rect.left,
                        top: rect.bottom + 8,
                        background: "var(--background-3)",
                        padding: 5
                    }}
                >
                    <ColorText text={badge.name} style={{fontSize: "22px"}} textColor={badge.textColor} />
                    <div>{badge.acquireBy}</div>
                </div>,
                document.body
            )}
        </>
    );
}