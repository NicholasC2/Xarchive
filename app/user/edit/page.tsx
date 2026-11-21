"use client";

import { showError } from "@/app/error";
import ProfilePhoto from "@/app/peices/profile-photo";
import { authClient } from "@/lib/auth/client";
import { Badge } from "@/lib/db";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { useSortable } from "@dnd-kit/react/sortable";
import { ArrowUpRight, Trash, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/app/peices/uploadFile";
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
	const [badges, setBadges] = useState<false | Badge[]>(false);
	const [image, setImage] = useState<string | false | File | null>(false);
	const [busy, setBusy] = useState<false | string>(false);
	const [staticBadges, setStaticBadges] = useState<false | Badge[]>(false);

	const [email, setEmail] = useState<false | string>(false);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [accountError, setAccountError] = useState("");

	const [deleteBusy, setDeleteBusy] = useState<false | string>(false);
	const [deletePopup, setDeletePopup] = useState<boolean>(false);
	const [deleteConfirmError, setDeleteConfirmError] = useState("");

    const { data: session, isPending } = authClient.useSession();

	const router = useRouter();
	
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

			setEmail(session.user.email);

			setBusy(false);

			const res = await fetch(`/api/user/${session.user.id}`);
			const badges = (await res.json()).badges as Badge[];

			setStaticBadges(badges.filter(b => !session.user.badgeOrder?.includes(b.id)))
			setBadges(badges.filter(b => session.user.badgeOrder?.includes(b.id)));
		})()
	}, [isPending])

	async function deleteAccount() {
		setDeleteBusy("deleting account...");

		const result = await authClient.deleteUser();

		if (result.error) {
            setDeleteConfirmError(result.error.message ?? "Failed to delete account");
            return;
        } else {
			router.replace("/");
		}
	}

	async function updateInfo() {
		if(!session) return;

		if(password != confirmPassword) {
			setAccountError("Passwords dont match");
			return;
		}

		setBusy("updating info...");

		if(typeof name != "string" || !Array.isArray(badges) || typeof bio != "string") {
			setBusy(false);
			return;
		};

		var imageUrl = image;

		if(image instanceof File) {
			try {
				imageUrl = "/bucket/"+await uploadFile(image, "pfp");
			} catch(err) {
				showError("Failed file upload!")
				console.error(err);
			}
		}

		const result = await authClient.updateUser({
			name: name,
			badgeOrder: badges.map(b => b.id),
			bio: bio,
			...(typeof imageUrl == "string" && { image: imageUrl })
		})

		if(result.error) {
			setBusy(false);
			showError(result.error.message ?? "Unknown Error")
		} else {
			showError("Info Updated", "success");
			setTimeout(()=>router.replace(`/user/${session.user.id}`), 500)
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

	return (
		<>
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
				<ProfilePhoto canEdit={true} disabled={busy != false} image={image ?? ""} edit={setImage} />
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
			{Array.isArray(badges) && Array.isArray(staticBadges)
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
							{staticBadges.map((badge, index) => (
								<BadgeDisplay
									badge={badge}
									hoverText={false}
									key={badge.name}
								/>
							))}
							{badges.map((badge, index) => (
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
						textColor={staticBadges[0]?.textColor ?? badges[0]?.textColor ?? {}} 
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
