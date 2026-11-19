"use client";

import { showError } from "@/app/error";
import ProfilePhoto from "@/app/peices/profile-photo";
import { authClient } from "@/lib/auth/client";
import { Badge } from "@/lib/db";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { useSortable } from "@dnd-kit/react/sortable";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Session, User } from "better-auth";
import { useRouter } from "next/navigation";

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
	const [image, setImage] = useState<false | string>(false);
	const [bio, setBio] = useState<false | string>(false);
	const [badges, setBadges] = useState<false | Badge[]>(false);

	const [busy, setBusy] = useState<false | string>(false);

	const [session, setSession] = useState<null | {session: Session, user: User}>(null);

	const [imageFile, setImageFile] = useState<File | null>(null);

	const router = useRouter();
	
	useEffect(() => {
		(async() => {
			setBusy("loading");

			const session = (await authClient.getSession()).data;

			setSession(session);

			const result = (await fetch("/api/user/"+session?.user.id));

			if(!result.ok) {
				showError("Internal Error. Please try again.")
				return;
			};
			const JSON = await result.json()
			if(!JSON) return;

			setName(JSON.name);
			setImage(JSON.image);
			setBio(JSON.bio);
			setBadges(JSON.badges);

			setBusy(false);
		})()
	}, [])

	async function updateProfileInfo() {
		setBusy("updating profile");

		const result = await fetch(`/api/user/${session?.user.id}`, {
			method: "POST",
			body: JSON.stringify({
				name,
				bio,
				badges
			})
		})

		if(!result.ok) {
			showError((await result.json()).message ?? "Unknown Error")
		} else {
			showError("Info Updated", "success");
			setTimeout(()=>router.replace(`/user/${session?.user.id}`), 500)
		}
	}

	return (
		<div className="panel">
			<h2>Edit Profile</h2>
			<div className="panel-row" style={{
				alignItems: "end"
			}}>
				{typeof image == "string"
				 ? <ProfilePhoto canEdit={true} disabled={busy != false} image={image} edit={[imageFile, setImageFile]} />
				 : <ProfilePhoto canEdit={true} loading={true} />}
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
			{Array.isArray(badges)
				? (
					<DragDropProvider
						onDragEnd={(event) => {
							if (event.canceled) return;

							setBadges(items =>
								items ? move(items, event) : items
							);
						}}
					>
						<ul className="flex flex-row gap-2 input">
							{badges.map((badge, index) => (
								<SortableBadge
									badge={badge}
									index={index}
									key={badge.name}
								/>
							))}
						</ul>
					</DragDropProvider>
				)
				: <div className="loading min-h-[3.5rem] w-full flex-1" />
			}

			<button 
				type="submit" 
				className="w-full" 
				disabled={busy != false}
				onClick={()=>updateProfileInfo()}
			>
			{busy != false ? busy : `update profile`} <ArrowUpRight size={16} />
			</button>
		</div>
	)
}
