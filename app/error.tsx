
"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

type ErrorColor = "success" | "fail" | "warn";

interface Error {
    id: string;
    message: string;
    color: ErrorColor;
    removing?: boolean;
}

export function showError(message: string, color: ErrorColor = "fail") {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
        new CustomEvent<Error>("app-error", {
            detail: {
                message: message, 
                color: "fail",
                id: crypto.randomUUID(),
                removing: false
            }
        })
    );
}

export default function ErrorProvider() {
    const [errors, setErrors] = useState<Error[]>([]);

    function removeError(id: string) {
        setErrors(previous =>
            previous.map(error =>
                error.id === id
                    ? { ...error, removing: true }
                    : error
            )
        );

        setTimeout(() => {
            setErrors(previous =>
                previous.filter(error => error.id !== id)
            );
        }, 300);
    }

    useEffect(() => {
        function handleError(event: Event) {
            const error = (event as CustomEvent<Error>).detail;

            setErrors(previous => [...previous, error]);

            setTimeout(() => {
                removeError(error.id)
            }, 4000);
        }

        window.addEventListener("app-error", handleError);

        return () => {
            window.removeEventListener("app-error", handleError);
        };
    }, []);

    return (
        <div className="flex flex-col fixed top-[10%] left-[5%] z-[9999] gap-[5px]">
            {errors.map((e, i) => (
                <div 
                    className={`w-full flex flex-row transition-all duration-300 ${
                        e.removing
                            ? "opacity-0 -translate-x-2"
                            : "opacity-100 translate-x-0"
                    }`}
                    key={i}
                    style={{
                        backgroundColor: `var(--${e.color}-bg)`,
                        color: `var(--${e.color})`,
                        padding: "15px 20px",
                        alignItems: "center",
                        gap: "10px"
                    }}
                >
                    <div>{e.message}</div>
                    <X 
                        className="cursor-pointer" 
                        size={16} 
                        onClick={() => removeError(e.id)}
                    />
                </div>
            ))}
        </div>
    );
}
