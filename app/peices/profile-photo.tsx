import { ImagePlus, LoaderCircle, Trash, Upload, User, X } from "lucide-react";
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
            width: "50px",
            height: "50px",
            flex: "none",
            position: "relative",
        }}>
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: canEdit ? "#66666650" : "#666",
                overflow: "hidden",
                position: "relative",
                flex: "none",
                ...props.style
            }}
                {...props}
            >
                {loading
                    ? <div className="loading-spinner" ><LoaderCircle /></div>
                    : (file || image
                        ? <Image
                            src={file ? URL.createObjectURL(file) : image ?? ""}
                            alt="profile photo"
                            style={{
                                objectFit: "cover",
                                opacity: canEdit ? 0.3 : 1
                            }}
                            className="w-full h-full"
                            width={50}
                            height={50}
                        />
                        : !canEdit && <User size={40} />
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
            
            {canEdit && !loading && <label 
                htmlFor="profile_photo_upload" 
                style={{
                    display: "flex",
                    margin: 0,
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "visible",
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    top: 0,
                    left: 0
                }} 
                className="cursor-pointer w-full h-full absolute"
            >
                <ImagePlus size={16}
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        filter: "drop-shadow(0 0 2px black)"
                    }}
                />
                todo, onclick make it have a popup where you can choose external url or upload.
                <input 
                    type="file" 
                    id="profile_photo_upload" 
                    hidden 
                    accept="image/*"
                    onChange={async(e)=>{
                        let f = await e.target.files?.[0];

                        if(!f) return;

                        setFile(f);
                    }} 
                />
            </label>}
        </div>
    );
}