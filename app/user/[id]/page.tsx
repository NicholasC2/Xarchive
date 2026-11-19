"use client";

import NotFound from "@/app/not-found";
import Profile from "@/app/peices/profile";
import ReadMore from "@/app/peices/read-more";
import { Badge } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserPage({params}: {params: Promise<{ id: string }>}) {
	const [name, setName] = useState<string | false>(false);
	const [image, setImage] = useState<string | false>(false);
	const [bio, setBio] = useState<string | false>(false);
	const [badges, setBadges] = useState<Badge[] | false>(false);
	const [id, setId] = useState("");

	const [found, setFound] = useState<null | boolean>(null);

	const router = useRouter();
	
	useEffect(() => {
		(async() => {
			const { id } = await params

            setId(id);

			const result = (await fetch("/api/user/"+id));

			if(!result.ok) {
				setFound(false);
				return;
			};
			const JSON = await result.json()
			if(!JSON) return;

			setName(JSON.name);
			setImage(JSON.image);
			setBio(JSON.bio);
			setBadges(JSON.badges);
		})()
	}, [])

	return found != false
	 ? (
		<div className="archive-page gap-5 flex-1">
			<div className="flex flex-col flex-1">
				{/* <div className="loading h-full" /> */}
			</div>
			<div style={{
				border: "1px solid var(--line)"
			}} />
			<div className="flex flex-col gap-5" style={{
				minWidth: "300px"
			}}>
				<Profile name={name} image={image} badges={badges} />
				{typeof bio == "string"
				 ? <ReadMore maxChars={50} text={bio ?? ""} />
				 : <div className="loading h-[5rem]" />}
			</div>
		</div>
	 )
	 : <NotFound />
}
