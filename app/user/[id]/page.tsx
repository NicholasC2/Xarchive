"use client";

import { showError } from "@/app/error";
import NotFound from "@/app/not-found";
import Entry from "@/app/peices/entry";
import Profile from "@/app/peices/profile";
import ReadMore from "@/app/peices/read-more";
import { authClient } from "@/lib/auth/client";
import { Album, Artist, Badge, Song } from "@/lib/db";
import { useEffect, useState } from "react";

export default function UserPage({params}: {params: Promise<{ id: string }>}) {
	const [name, setName] = useState<string | false>(false);
	const [image, setImage] = useState<string | undefined | false>(false);
	const [bio, setBio] = useState<string | false>(false);
	const [badges, setBadges] = useState<false | {static: Badge[], badges: Badge[]}>(false);
	const [contributions, setContributions] = useState<(Song | Album | Artist)[] | false>(false);

	const [found, setFound] = useState<null | boolean>(null);
	
	useEffect(() => {
		(async() => {
			const { id } = await params

			const result = await authClient.getUser({
				query: {
					id
				}
			});

			if(result.error) {
				showError(result.error.message ?? "Unable to fetch user");
				setFound(false);
				return;
			}

			const data = result.data;

			setName(data.name);
			setImage(data.image ?? undefined);
			setBio(data.bio ?? "");
			setBadges(data.badges);
			setContributions(data.contributions);
		})()
	}, [])

	return found != false
	 ? (
		<div className="archive-page gap-5 flex-1">
			<div className="flex flex-col flex-1 gap-2">
				<label>Contributions:</label>
				{typeof contributions != "boolean"
				 ? contributions.length > 0
					? <ul className="flex flex-col gap-5">
						{contributions.map((c, i) => (
							<li key={c.name + c.createdAt + i}>
								<Entry entry={c} />
							</li>
						))}
					</ul>
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
