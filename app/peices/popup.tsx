"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

let updatePopup: (popup: ReactNode | null) => void;

export function setPopup(popup: ReactNode | null) {
    updatePopup?.(popup);
}

export function PopupProvider() {
    const [popup, setPopupState] = useState<ReactNode | null>(null);
    const pathname = usePathname();

    updatePopup = setPopupState;

    useEffect(() => {
        setPopupState(null);
    }, [pathname]);

    return popup && (
        <div className="fixed top-0 left-0 right-0 bottom-0 flex" style={{
            background: "#00000050"
        }}>
            {popup}
        </div>
    )
}