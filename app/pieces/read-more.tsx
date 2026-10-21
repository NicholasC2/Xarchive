import { ReactNode } from "react";

interface ReadMoreProps {
    maxLines?: number;
    children: ReactNode;
}

export default function ReadMore({ maxLines = 1, children }: ReadMoreProps) {
    return <div
    style={{
        overflowY: "clip",
        maxHeight: maxLines+"em"
    }}>
        {children}
    </div>
}