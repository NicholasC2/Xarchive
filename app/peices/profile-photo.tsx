import { User } from "lucide-react";
import Image from "next/image";
import { Dispatch, SetStateAction, useState } from "react";

interface ProfilePhotoParams {
    image: string;
    edit?: [
        File | null,
        Dispatch<SetStateAction<File | null>>
    ];
    canEdit?: boolean;
    disabled?: boolean;
}

export default function ProfilePhoto({image, disabled = false, canEdit = false, edit = useState<File | null>(null)}: ProfilePhotoParams) {
    const [file, setFile] = edit;

    return (
        <div style={{
            display: "flex",
            minWidth: "50px",
            minHeight: "50px",
            maxWidth: "50px",
            maxHeight: "50px",
            borderRadius: "50%",
            background: "var(--foreground-3)",
            overflow: "hidden"
        }}>
            {image
                ? <Image
                    src={image}
                    alt="profile photo"
                    width={50}
                    height={50}
                    style={{ objectFit: "cover" }}
                />
                : <User size={60} />
            }

            {canEdit && <div style={{
                background: "black",
                opacity: "0.65",
                inset: 0
            }}>

            </div>}
        </div>
    );
}