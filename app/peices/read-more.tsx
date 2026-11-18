
import { HTMLAttributes, useState } from "react";

interface ReadMoreProps extends HTMLAttributes<HTMLDivElement> {
    maxChars?: number;
    text: string;
}

export default function ReadMore({
    maxChars = 100,
    text,
    ...props
}: ReadMoreProps) {
    const [readMore, setReadMore] = useState(false);

    const isTruncated = text.length > maxChars;

    return (
        <div {...props} style={{
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            ...props.style
        }}>
            {readMore || !isTruncated
                ? text
                : text.slice(0, maxChars).trimEnd() + "..."}

            {isTruncated && (
                <>
                    {" "}
                    <span
                        style={{
                            color: "var(--foreground-3)",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                        }}
                        onClick={() => setReadMore(prev => !prev)}
                    >
                        {readMore ? "Read Less" : "Read More"}
                    </span>
                </>
            )}
        </div>
    );
}
