import { authClient } from "@/lib/auth/client";
import * as betterAuth from "better-auth";
import { ArrowUpRight, ImagePlus, LoaderCircle, Trash, Upload, User, X } from "lucide-react";
import Image from "next/image";
import { Dispatch, HtmlHTMLAttributes, SetStateAction, useEffect, useState } from "react";
import { showError } from "../error";

interface ProfilePhotoParams extends HtmlHTMLAttributes<HTMLDivElement> {
    image: string | false | File | null;
    edit?: Dispatch<SetStateAction<string | false | File | null>>;
    canEdit?: boolean;
    disabled?: boolean;
}

async function getGoogleProfile(accounts: betterAuth.Account[]) {
    const googleAccount = accounts.find(
        account => account.providerId === "google"
    );

    if (!googleAccount) {
        return null;
    }

    const data = (await authClient.getAccessToken({
        accountId: googleAccount.id
    })).data;

    if (!data?.accessToken) {
        showError("Google access token unavailable");
        return;
    }

    const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
            headers: {
                Authorization: `Bearer ${data.accessToken}`,
            },
            cache: "no-store",
        }
    );

    if (!response.ok) {
        showError("Failed to fetch Google profile");
        return;
    }

    return response.json() as Promise<{
        id: string;
        email: string;
        verified_email: boolean;
        name: string;
        given_name: string;
        family_name: string;
        picture: string;
        locale: string;
    }>;
}


export default function ProfilePhoto({image, disabled = false, canEdit = false, edit = useState<string | false | File | null>(null)[1], ...props}: ProfilePhotoParams) {
    const [showImageEditPopup, setShowImageEditPopup] = useState(false);
    const [page, setPage] = useState("Upload");
    const [tempValue, setTempValue] = useState<string | false | File | null>("");

    const [googleProfile, setGoogleProfile] = useState<string>();

    if(canEdit) {
        useEffect(() => {
            (async()=>{
                const accounts = await authClient.listAccounts();

                if(!accounts.data) return;

                setGoogleProfile((await getGoogleProfile(accounts.data))?.picture);
            })()
        }, []);
    }
    
    return (
        <>
        {showImageEditPopup && <div
            style={{
                display: "flex",

                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                
                background: "#0005"
            }}
        >
            <div 
                className="panel nosize relative"
                style={{
                    paddingTop: "40px",
                    minWidth: "20%",
                    minHeight: "20%"
                }}
            >
                <X className="absolute top-2 right-2 cursor-pointer" onClick={()=>setShowImageEditPopup(false)} />

                <div className="panel-row"
                    style={{
                        margin: page == "Reset" ? 0 : 5
                    }}
                >
                    {["Upload", "External URL", "Reset"].map((entryMode) => 
                        <button 
                            key={entryMode}
                            aria-selected={page === entryMode} 
                            onClick={() => setPage(entryMode)}
                            className="flex-1"
                            style={{
                                textWrap: "nowrap"
                            }}
                        >{entryMode}</button>
                    )}
                    {googleProfile &&
                        <button 
                            aria-selected={page === "Google"} 
                            onClick={() => setPage("Google")}
                            className="flex-1"
                            style={{
                                textWrap: "nowrap"
                            }}
                        >Google</button>
                    }
                </div>

                {page == "Upload" &&
                    <label 
                        htmlFor="image_upload" 
                        className="cursor-pointer input gap-2"
                        style={{
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center"
                        }}
                    >
                        <Upload />
                        <div className="flex flex-col"
                            style={{
                                alignItems: "center"
                            }}
                        >
                            Upload Image
                            <span style={{color: "var(--foreground-3)"}}>No image selected</span>
                        </div>
                        <input 
                            type="file" 
                            id="image_upload" 
                            hidden 
                            onChange={(e)=>setTempValue(e.target.files?.[0] ?? image)}
                        />
                    </label>
                }

                {page == "External URL" && <input placeholder="External URL" onChange={(e)=>setTempValue(e.target.value ?? image)} />}

                <button 
                    onClick={()=>{
                        if(page == "Reset") {
                            edit("");
                        } else if(page == "Google") {
                            edit(googleProfile ?? "")
                        } else {
                            edit(tempValue); 
                        }
                        setShowImageEditPopup(false);
                    }}
                    className={page == "Reset" ? "secondary" : ""}
                    style={{
                        margin: (page == "Reset" || page == "Google") ? 0 : 5
                    }}
                >
                    {page == "Upload" && (<>Use Selected Image <ArrowUpRight size={16} /></>)}
                    {page == "External URL" && (<>Use External URL <ArrowUpRight size={16} /></>)}
                    {page == "Google" && (<>Use Google Profile Photo <ArrowUpRight size={16} /></>)}
                    {page == "Reset" && (<><Trash size={16} /> Reset</>)}
                </button>
            </div>
        </div>}

        <div
            {...props}
            style={{
                width: "50px",
                height: "50px",
                flex: "none",
                borderRadius: "50%",
                background: canEdit ? "#66666650" : "#666",
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
                        ? <Image
                            src={typeof image === "string" ? image : URL.createObjectURL(image)}
                            alt="profile photo"
                            style={{
                                objectFit: "cover"
                            }}
                            className="w-full h-full"
                            width={50}
                            height={50}
                            unoptimized
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
            
            {canEdit && typeof image !== "boolean" && <label 
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
                onClick={(e)=>setShowImageEditPopup(true)}
            >
                <ImagePlus size={16}
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        filter: "drop-shadow(0 0 2px black)"
                    }}
                />
            </label>}
        </div>
        </>
    );
}