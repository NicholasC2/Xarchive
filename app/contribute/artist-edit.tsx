import { ArrowUpRight, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import MediaEdit, { MediaUploadEntry } from "./media-edit";
import { useRouter } from "next/navigation";
import { showError } from "../error";
import { Artist, MediaEntry } from "@/lib/db";
import { setPopup } from "../peices/popup";
import { authClient } from "@/lib/auth/client";

export default function ArtistEdit({ artistId }: { artistId?: string }) {
	const [name, setName] = useState("");
	const [bio, setBio] = useState("");
	const [media, setMedia] = useState<MediaUploadEntry[]>([]);

	const [artist, setArtist] = useState<Artist>();

	const [error, setError] = useState("");

	const [busy, setBusy] = useState("");

	const router = useRouter();

	const { data: session } = authClient.useSession();

	if(artistId) {
		useEffect(()=>{
			(async() => {
				setBusy("loading info...");

				const result = await fetch(`/api/artist/${artistId}`);

				if(!result.ok) {
					showError("Artist not found");
					return;
				}

				const JSON = await result.json();
				
				setArtist(JSON);
				setName(JSON.name);
				setBio(JSON.bio);
				setMedia(JSON.media);

				setBusy("");
			})()
		}, [artistId])
	}

	async function uploadMedia() {
		return Promise.all(
			media.map(async mediaFile => {
				if (!(mediaFile.url instanceof File)) {
					return mediaFile as MediaEntry;
				}

				const formData = new FormData();
				formData.append("file", mediaFile.url);

				const result = await fetch("/api/upload", {
					method: "POST",
					body: formData
				});

				const data = await result.json();

				if (!result.ok) {
					throw new Error(`Failed to upload "${mediaFile.url.name}"`);
				}

				return {
					...mediaFile,
					url: "/bucket/"+data.key,
				} as MediaEntry
			})
		);
	}

	async function addArtist(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			setBusy("adding artist...");

			const result = await fetch("/api/artist", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					name,
					bio,
					media: await uploadMedia()
				})
			});

			if (!result.ok) {
				const data = await result.json();
				throw new Error(data.error || "Failed to create artist");
			}
			
			const data = await result.json();

			router.push("/artist/"+data.id);
		} catch (error) {
			setBusy("");
			setError(error instanceof Error ? error.message : "Something went wrong");
		}
	}

	async function editArtist(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			setBusy("editing artist...");

			const result = await fetch(`/api/artist/${artistId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					name,
					bio,
					media: (await uploadMedia()).filter(m => m.contributor == session?.user.id)
				})
			});

			if (!result.ok) {
				const data = await result.json();
				throw new Error(data.error || "Failed to edit artist");
			}
			
			const data = await result.json();

			router.push("/artist/"+data.id);
		} catch (error) {
			setBusy("");
			setError(error instanceof Error ? error.message : "Something went wrong");
		}
	}

	async function confirmDelete() {
		setPopup(<div className="panel">
			<h2>Confirm Delete</h2>
			<p>are you sure you want to delete "{name}"</p>
			<div className="panel-row">
				<button onClick={(e)=>deleteArtist()}>Yes</button>
				<button className="secondary" onClick={(e)=>setPopup(null)}>No</button>
			</div>
		</div>)
	}

	async function deleteArtist() {
		try {
			const result = await fetch(`/api/artist/${artistId}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json"
				}
			});

			if (!result.ok) {
				const data = await result.json();
				throw new Error(data.error || "Failed to delete artist");
			}

			showError("Arist Deleted", "success");
			router.push("/");
		} catch (error) {
			setError(error instanceof Error ? error.message : "Something went wrong");
		}
	}

	return <form className="flex flex-col relative" onSubmit={artistId ? editArtist : addArtist}>

		<label>Name</label>
		<input
			type="text" 
			autoComplete="song-name" 
			value={name}
			onChange={(e) => setName(e.target.value)}
			required
			disabled={busy != "" || session?.user.id != artist?.contributor}
		/>

		<label>Bio</label>
		<textarea
			autoComplete="song-bio"
			value={bio}
			onChange={(e) => setBio(e.target.value)}
			disabled={busy != "" || session?.user.id != artist?.contributor}
		/>
		
		<div className="flex flex-row">
			<label>Media</label>&nbsp;<label style={{color: "var(--foreground-2)"}}>(Cover, Videos, etc)</label>
		</div>
		<MediaEdit media={media} setMedia={setMedia} disabled={busy != ""} allowedTypes={["Banner", "Cover", "Video", "Image", "Audio"]} />

		{error && <span style={{color: "var(--fail)"}}>{error}</span>}

		<button 
			type="submit" 
			className="w-full" 
			disabled={busy != ""}
		>
			{busy ? busy : (artistId ? `edit artist` : `add artist`)} <ArrowUpRight size={16} />
		</button>

		{artistId && typeof name != "boolean" && session?.user.id == artist?.contributor &&
		<button 
			className="secondary" 
			type="button" 
			onClick={confirmDelete}
			disabled={busy != ""}
		>
			delete artist <Trash size={16} />	
		</button>}
	</form>
}
