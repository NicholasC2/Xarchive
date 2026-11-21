"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NotFound from "@/app/not-found";
import { showError } from "@/app/error";
import { Artist } from "@/lib/db";
import Profile from "@/app/peices/profile";
import ReadMore from "@/app/peices/read-more";

export default function ArtistPage() {
	const { name } = useParams<{ name: string }>();
	const [artist, setArtist] = useState<Artist>();
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		(async()=>{
			const response = await fetch(
				`/api/artist/${name}`
			);

			if (response.status === 404) {
				setNotFound(true);
				return;
			}

			if (!response.ok) {
				showError("Failed to fetch artist");
			}

			setArtist(await response.json());
		})()
	}, []);

	if (notFound) return <NotFound />;

	return <div className="archive-page gap-5 flex-1">
		<div className="flex flex-col flex-1 gap-2">
			
		</div>
		<div style={{
			border: "1px solid var(--line)"
		}} />
		<div className="flex flex-col gap-5" style={{
			minWidth: "300px"
		}}>
			<Profile name={artist?.name ?? false} image={artist?.media[0] ?? false} badges={[]} />
			{artist
				? <ReadMore maxChars={50} text={artist?.bio ?? ""} />
				: <div className="loading h-[5rem]" />}
		</div>
	</div>;
}