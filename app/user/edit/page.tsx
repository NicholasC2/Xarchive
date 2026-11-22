"use client";

import { showError } from "@/app/error";
import ProfilePhoto from "@/app/peices/profile-photo";
import { authClient } from "@/lib/auth/client";
import { Badge } from "@/lib/db";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { useSortable } from "@dnd-kit/react/sortable";
import { ArrowUpRight, ImagePlus, Trash, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TextColored from "@/app/peices/text-color";
import BadgeDisplay from "@/app/peices/badge";

export function SortableBadge({
    badge,
    index
}: {
    badge: Badge;
    index: number;
}) {
    const { ref, isDragging } = useSortable({
        id: badge.name,
        index
    });

    return (
        <li
            ref={ref}
            style={{
                opacity: isDragging ? 0.4 : 1,
                touchAction: "none",
				userSelect: "none"
            }}
            className="cursor-grab"
        >
            <Image
                src={badge.icon}
                alt={badge.name}
                width={20}
                height={20}
                draggable={false}
            />
        </li>
    );
}

export default function ProfileEditPage() {
	const [name, setName] = useState<false | string>(false);
	const [bio, setBio] = useState<false | string>(false);
	const [badges, setBadges] = useState<false | {static: Badge[], badges: Badge[]}>(false);
	const [image, setImage] = useState<string | false | File | null>(false);
	const [busy, setBusy] = useState<false | string>(false);

	const [email, setEmail] = useState<false | string>(false);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [accountError, setAccountError] = useState("");

	const [deleteBusy, setDeleteBusy] = useState<false | string>(false);
	const [deletePopup, setDeletePopup] = useState<boolean>(false);
	const [deleteConfirmError, setDeleteConfirmError] = useState("");

    const { data: session, isPending } = authClient.useSession();
    const [googleProfile, setGoogleProfile] = useState<string | false>(false);

	const router = useRouter();

	useEffect(() => {
		(async()=>{
			const accounts = await authClient.listAccounts();

			if(!accounts.data) return;

			const googleAccount = accounts.data.find(
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

			setGoogleProfile((await response.json()).picture ?? false);
		})()
	}, []);
	
	useEffect(() => {
		(async() => {
			setBusy("loading");

			if(!session) {
				showError("No Session");
				return;
			}

			setName(session.user.name);
			setImage(session.user.image ?? null);
			setBio(session.user.bio ?? "");
			setBadges(session.user.badges ?? { static: [], badges: [] });

			setEmail(session.user.email);

			setBusy(false);

		})()
	}, [isPending])

	async function deleteAccount() {
		setDeleteBusy("deleting account...");

		const result = await authClient.deleteUser();

		if (result.error) {
            setDeleteConfirmError(result.error.message ?? "Failed to delete account");
            return;
        } else {
			router.push("/");
		}
	}

	async function updateInfo() {
		if(!session) return;

		if(password != confirmPassword) {
			setAccountError("Passwords dont match");
			return;
		}

		setBusy("updating info...");

		if(typeof name != "string" || typeof badges == "boolean" || typeof bio != "string") {
			setBusy(false);
			return;
		};

		var imageUrl = image;

		if(image instanceof File) {
			try {
				const formData = new FormData();
				formData.append("file", image);

				const response = await fetch("/api/uploadPFP", {
					method: "POST",
					body: formData,
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error);
				}

				imageUrl = "/bucket/"+data.key;
			} catch(err) {
				showError("Failed file upload!")
				console.error(err);
			}
		}

		const result = await authClient.updateUser({
			name: name,
			badges: badges.badges.map(b => b.id),
			bio: bio,
			...(typeof imageUrl == "string" && { image: imageUrl })
		})

		if(result.error) {
			setBusy(false);
			showError(result.error.message ?? "Unknown Error")
		} else {
			showError("Info Updated", "success");
			setTimeout(()=>router.push(`/user/${session.user.id}`), 500)
		}

		if(email && email != session.user.email) {
			const result = await authClient.changeEmail({
				newEmail: email,
			});

			if(result.error) {
				setAccountError(result.error.message ?? "Failed to update email");
			}
		}

		if(password) {
			const result = await authClient.resetPassword({
				newPassword: password
			});

			if(result.error) {
				setAccountError(result.error.message ?? "Failed to update password");
			}
		}
	}

    const [imageEditPopup, setImageEditPopup] = useState(false);
    const [page, setPage] = useState("Upload");
    const [tempValue, setTempValue] = useState<string | false | File | null>("");

	return (
		<>
		{imageEditPopup && <div
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
                <X className="absolute top-2 right-2 cursor-pointer" onClick={()=>setImageEditPopup(false)} />

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
                            {tempValue instanceof File 
							? <span>Selected: "{tempValue.name}"</span>
							: <span style={{color: "var(--foreground-3)"}}>No image selected</span>}
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
                            setTempValue("");
                        } else if(page == "Google") {
                            setTempValue(googleProfile ?? "")
                        }
                        setImage(tempValue); 
                        setImageEditPopup(false);
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

		{deletePopup && <div
			style={{
				display: "flex",

				position:"fixed",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				background: "#0005"
			}}
		>
			<div className="panel nosize relative">
				<X onClick={()=>setDeletePopup(false)} className="absolute top-2 right-2 cursor-pointer" />
				<span className="text-[15px]">Are you sure you want to delete your account?</span>
				<form onSubmit={(e)=>{
					e.preventDefault();
					deleteAccount()
				}} className="w-full flex flex-col">
					<button type="submit">{deleteBusy != false ? deleteBusy : `delete account`}</button>
					{deleteConfirmError && <span style={{color: "var(--fail)"}}>{deleteConfirmError}</span>}
				</form>
			</div>
		</div>}

		<div className="panel">
			<h2>Edit Profile</h2>
			<div className="panel-row" style={{
				alignItems: "end"
			}}>
				<div className="w-[50px] h-[50px] relative" style={{
					borderRadius: "50%",
					flex: "none"
				}}>
					<ProfilePhoto disabled={busy != false} image={image ?? ""} />
					{typeof image !== "boolean" && <label 
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
						onClick={(e)=>setImageEditPopup(true)}
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
				<div className="panel-column">
					<label>Name:</label>
					{typeof name == "string"
					 ? <input 
							type="text" 
							value={name} 
							onChange={(e)=>setName(e.target.value)} 
							disabled={busy != false}
						/>
					 : <div className="loading min-h-[2.5rem] w-full flex-1" />}
				</div>
			</div>
			<label>Bio:</label>
			{typeof bio == "string"
			 ? <textarea 
					value={bio}
					onChange={(e) => setBio(e.target.value)}
					disabled={busy != false}
				/>
			 : <div className="loading min-h-[3.5rem] w-full flex-1" />}

			<label>Badge order: <span style={{color: "var(--foreground-3)"}}>(The top badge's text color will be used for your name)</span></label>
			{typeof badges != "boolean"
				? (
					<>

					<DragDropProvider
						onDragEnd={(event) => {
							if (event.canceled) return;

							setBadges(items =>
								items ? move(items, event) : items
							);
						}}
					>
						<ul className="flex flex-row gap-2 input">
							{badges.static.map((badge, index) => (
								<BadgeDisplay
									badge={badge}
									key={badge.name}
								/>
							))}
							{badges.badges.map((badge, index) => (
								<SortableBadge
									badge={badge}
									index={index}
									key={badge.name}
								/>
							))}
						</ul>
					</DragDropProvider>

					<TextColored 
						className="text-[20px] p-2" 
						style={{
							background: "var(--background-1)"
						}} 
						text={"Preview"} 
						textColor={badges.static[0]?.textColor ?? badges.badges[0]?.textColor ?? {}} 
					/>

					</>
				)
				: <div className="loading min-h-[3.5rem] w-full flex-1" />
			}
		</div>

		<div className="panel">
			<h2>Edit Account Settings</h2>

			<label>Email</label>
            {typeof email != "boolean"
			 ? <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
			 : <div className="loading min-h-[2.5rem] w-full flex-1" />
			}

            <label>Password<span className="secondary m-1">(Leave Empty to keep your current password)</span></label>
            <input type="password" minLength={8} value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" />

            <label>Confirm password</label>
            <input type="password" minLength={8} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} autoComplete="new-password" />

			{accountError && <span style={{color: "var(--fail)"}}>{accountError}</span>}
		</div>
		
		<div className="panel">
			<button 
				type="submit" 
				className="w-full" 
				disabled={busy != false}
				onClick={()=>updateInfo()}
			>
				{busy != false ? busy : `update info`} <ArrowUpRight size={16} />
			</button>
		</div>
		
		<div className="panel">
			<button 
				type="submit" 
				className="w-full secondary" 
				disabled={busy != false}
				onClick={()=>setDeletePopup(true)}
			>
				delete account<Trash size={16} />
			</button>
		</div>
		</>
	)
}
