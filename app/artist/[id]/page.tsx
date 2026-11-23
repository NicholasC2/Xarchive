"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NotFound from "@/app/not-found";
import { showError } from "@/app/error";
import { Artist } from "@/lib/db";
import Profile from "@/app/peices/profile";
import ReadMore from "@/app/peices/read-more";
import Link from "next/link";
import { Edit, LoaderCircle } from "lucide-react";
import MediaList from "@/app/peices/media-list";
import { authClient } from "@/lib/auth/client";

export default function ArtistPage() {
	const { id } = useParams<{ id: string }>();
	const [artist, setArtist] = useState<Artist | null | false>(false);

	const {data: session} = authClient.useSession();

	useEffect(() => {
		(async()=>{
			const response = await fetch(`/api/artist/${id}`);

			if (response.status === 404) {
				setArtist(null);
				return;
			}

			if (!response.ok) {
				showError("Failed to fetch artist");
				return;
			}

			setArtist(await response.json());
		})()
	}, []);

	if (typeof artist == "boolean") return <div className="archive-page items-center"><LoaderCircle className="loading-spinner" /></div>;
	if (artist == null) return <NotFound />;

	return <div className="archive-page gap-5 flex-1">
		<div className="flex flex-col flex-1 gap-2" style={{
			minWidth: "60%"
		}}>
			
		</div>
		<div style={{
			border: "1px solid var(--line)"
		}} />
		<div className="flex flex-col gap-5 relative" style={{
			minWidth: "25%"
		}}>
			{session && <Link href={`/artist/${id}/edit`} className="absolute right-0">
				<Edit size={24} />
			</Link>}
			
			<Profile name={artist?.name ?? false} image={artist ? artist?.media.find(m => m.mediaType == "Cover")?.url : false} />
			{artist
				? <ReadMore maxChars={50} text={artist?.bio ?? ""} />
				: <div className="loading h-[5rem]" />}

			<div className="flex-1" />

			{artist && artist.media.length > 0
				? <div className="flex flex-col">
					<label>Media:</label>
					<MediaList media={artist.media} />
				</div>
				: <div className="loading min-h-[240px] w-full" />}
		</div>
	</div>;
}