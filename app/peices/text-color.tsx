import { CSSProperties, HtmlHTMLAttributes } from "react";

export interface TextColor {
    css?: CSSProperties;
    className?: string;
}

interface TextColorProps {
    textColor: TextColor;
    text: string;
    style?: CSSProperties;
    className?: string;
}

export default function TextColored({ textColor, text, style, className }: TextColorProps ) {
    return <div className="colored-text flex flex-row">
        {text.split("").map((c, i) => (
            <div
                key={i}
                className={textColor.className + " " + className}
                style={{
                    animationDelay: i * 100 + "ms",
                    ...textColor.css,
                    ...style
                }}
            >{c}</div>
        ))}
    </div>
}