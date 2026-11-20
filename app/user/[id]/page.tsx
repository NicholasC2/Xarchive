"use client";

import { showError } from "@/app/error";
import NotFound from "@/app/not-found";
import Profile from "@/app/peices/profile";
import ReadMore from "@/app/peices/read-more";
import { Album, Artist, Badge, Song } from "@/lib/db";
import { useEffect, useState } from "react";

export default function UserPage({params}: {params: Promise<{ id: string }>}) {
	const [name, setName] = useState<string | false>(false);
	const [image, setImage] = useState<string | false>(false);
	const [bio, setBio] = useState<string | false>(false);
	const [badges, setBadges] = useState<Badge[] | false>(false);
	const [contributions, setContributions] = useState<(Song | Artist | Album)[] | false>(false);
	const [id, setId] = useState("");

	const [found, setFound] = useState<null | boolean>(null);
	
	useEffect(() => {
		(async() => {
			const { id } = await params

            setId(id);

			const result = (await fetch("/api/user/"+id));

			if(result.status == 404) {
				setFound(false);
				return;
			} else if(!result.ok) {
				showError(result.statusText);
				return;
			}
			const JSON = await result.json()
			if(!JSON) return;

			setName(JSON.name);
			setImage(JSON.image);
			setBio(JSON.bio);
			setBadges(JSON.badges);
			setContributions(JSON.contributions);
		})()
	}, [])

	return found != false
	 ? (
		<div className="archive-page gap-5 flex-1">
			<div className="flex flex-col flex-1 gap-2">
				<label>Contributions:</label>
				{Array.isArray(contributions)
				 ? contributions.length > 0
					? <ul></ul>
					: <span className="text-[10px]" style={{color: "var(--foreground-3)"}} >No contributions yet...</span>
				 : (
					<>
						<div className="loading h-full" />
					</>
				 )}
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
