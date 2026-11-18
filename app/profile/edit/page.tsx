"use client";

import ProfilePhoto from "@/app/peices/profile-photo";
import ReadMore from "@/app/peices/read-more";
import { authClient } from "@/lib/auth/client";
import { ArrowUpRight, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ProfileEditPage() {
	const [name, setName] = useState("");
	const [image, setImage] = useState("");
	const [bio, setBio] = useState("");

	const [busy, setBusy] = useState(false);

	const [session, setSession] = useState<
		typeof authClient.$Infer.Session | null
	>(null);
	
	useEffect(() => {
		(async() => {
			setBusy(true);
			
			const session = (await authClient.getSession()).data;
			setSession(session)

			const result = (await fetch("/api/profile/"+session?.user.id));

			if(!result.ok) {
				setName("Profile not found")
				return;
			};
			const JSON = await result.json()
			if(!JSON) return;

			setName(JSON.name);
			setImage(JSON.image);
			setBio(JSON.bio ?? "");

			setBusy(false);
		})()
	}, [])

	function updateProfileInfo() {
		setBusy(true);
	}

	return (
		<div className="panel">
			<h2>Edit Profile</h2>
			<div className="panel-row" style={{
				alignItems: "end"
			}}>
				<ProfilePhoto disabled={busy} canEdit={true} image={image} />
				<div className="panel-column">
					<label>Name:</label>
					<input 
						type="text" 
						value={name} 
						onChange={(e)=>setName(e.target.value)} 
						disabled={busy}
					/>
				</div>
			</div>
			<label>Bio:</label>
			<textarea 
				value={bio}
				onChange={(e) => setBio(e.target.value)}
				disabled={busy}
			/>

			<button 
				type="submit" 
				className="w-full" 
				disabled={busy}
				onClick={()=>updateProfileInfo()}
			>
			{busy ? "updating profile…" : `update profile`} <ArrowUpRight size={16} />
			</button>
		</div>
	)
}
