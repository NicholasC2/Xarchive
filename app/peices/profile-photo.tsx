import { LoaderCircle, Upload, User } from "lucide-react";
import Image from "next/image";
import { Dispatch, HtmlHTMLAttributes, SetStateAction, useState } from "react";

interface ProfilePhotoParams extends HtmlHTMLAttributes<HTMLDivElement> {
    image?: string;
    loading?: boolean;
    edit?: [
        File | null,
        Dispatch<SetStateAction<File | null>>
    ];
    canEdit?: boolean;
    disabled?: boolean;
}

export default function ProfilePhoto({loading = false, image = undefined, disabled = false, canEdit = false, edit = useState<File | null>(null), ...props}: ProfilePhotoParams) {
    const [file, setFile] = edit;

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "#666",
            overflow: "hidden",
            position: "relative",
            flex: "none",
            ...props.style
        }}
            {...props}
        >
            {loading
                ? <div className="loading-spinner" ><LoaderCircle /></div>
                : (image
                    ? <Image
                        src={image}
                        alt="profile photo"
                        style={{ objectFit: "cover" }}
                        className="m-auto"
                    />
                    : !canEdit && <User size={40} />
                )
            }

            {canEdit && <div style={{
                background: "black",
                opacity: "0.65",
                position: "absolute",
                inset: 0
            }}>

            {canEdit && !loading && <label 
                htmlFor="profile_photo_upload" 
                style={{
                    margin: 0,
                    justifyContent: "center",
                    alignItems: "center",
                }} 
                className="flex w-full h-full cursor-pointer"
            >
                <Upload size={32} />
                <input type="file" id="profile_photo_upload" hidden />
            </label>}

            </div>}
        </div>
    );
}