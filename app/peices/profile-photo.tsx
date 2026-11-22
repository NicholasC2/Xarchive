import { ArrowUpRight, ImagePlus, LoaderCircle, Trash, Upload, User, X } from "lucide-react";
import Image from "next/image";
import { HtmlHTMLAttributes, useState } from "react";

interface ProfilePhotoParams extends HtmlHTMLAttributes<HTMLDivElement> {
    image?: string | File | false;
    disabled?: boolean;
}

export default function ProfilePhoto({image, disabled = false, ...props}: ProfilePhotoParams) {
    return (
        <>
        <div
            {...props}
            style={{
                width: "50px",
                height: "50px",
                flex: "none",
                borderRadius: "50%",
                background: "#666",
                position: "relative",
                ...props.style
            }}
        >
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: "50%",
                position: "relative",
                flex: "none"
            }}>
                {typeof image === "boolean"
                    ? <div className="loading-spinner" ><LoaderCircle /></div>
                    : (image
                        ? <img
                            src={typeof image === "string" ? image : URL.createObjectURL(image)}
                            style={{
                                objectFit: "cover"
                            }}
                            className="w-full h-full"
                            width={50}
                            height={50}
                        />
                        : <User size={"75%"} />
                    )
                }

                {disabled && <div 
                    style={{
                        background: "black",
                        opacity: 0.5
                    }}
                    className="w-full h-full absolute"
                />}
            </div>
        </div>
        </>
    );
}