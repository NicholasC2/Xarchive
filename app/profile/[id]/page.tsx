"use client";

import ProfilePhoto from "@/app/peices/profile-photo";
import ReadMore from "@/app/peices/read-more";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage({params}: {params: Promise<{ id: string }>}) {
	const [name, setName] = useState("");
	const [image, setImage] = useState("");
	const [bio, setBio] = useState("");
	const [id, setId] = useState("");

	const [session, setSession] = useState<
		typeof authClient.$Infer.Session | null
	>(null);

	const router = useRouter();
	
	useEffect(() => {
		(async() => {
			setSession((await authClient.getSession()).data)

			const { id } = await params

            setId(id);

			const result = (await fetch("/api/profile/"+id));

			if(!result.ok) {
				setName("Profile not found")
				return;
			};
			const JSON = await result.json()
			if(!JSON) return;

			setName(JSON.name);
			setImage(JSON.image);
			setBio(JSON.bio);
		})()
	}, [])

	return (
		<div className="archive-page gap-10">
			<div className="flex flex-col flex-1">
				<label>Contributions:</label>
			</div>
			<div style={{
				border: "1px solid var(--line)"
			}} />
			<div className="flex flex-row flex-1" style={{
				alignContent: "center",
				gap: "10px"
			}}>
				<ProfilePhoto image={image} />
				<div className="flex flex-col flex-1">
					<div className="flex flex-row gap-2" style={{
						maxHeight: "1rem",
						justifyItems: "center"
					}}>
						<h2>{name}</h2>
						<div className="flex-1" />
						{session?.user.id == id && <button style={{
							minHeight: "1em",
							padding: "10px"
						}}
							onClick={()=>router.replace("/profile/edit")}
						>
							Edit
						</button>}
					</div>
					<ReadMore maxChars={50} style={{maxWidth: "500px"}} text={bio ?? ""} />
				</div>
			</div>
		</div>
	)
}
