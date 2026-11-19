import { CSSProperties } from "react";

export interface TextColor {
    css?: CSSProperties;
    className?: string;
}

export default function ColorText({ textColor, text }: { textColor: TextColor, text: string }) {
    return <div className="colored-text flex flex-row">
        {text.split("").map((c, i) => (
            <div
                className={textColor.className}
                style={{
                    animationDelay: i * 10 + "ms",
                    ...textColor.css
                }}
            >{c}</div>
        ))}
    </div>
}