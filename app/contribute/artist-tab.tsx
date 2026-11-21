import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import MediaEdit, { MediaEntry } from "./media-edit";
import { showError } from "../error";
import { useRouter } from "next/navigation";

export default function ArtistTab({ artistId }: { artistId: string }) {
	const [name, setName] = useState("");
	const [bio, setBio] = useState("");
	const [media, setMedia] = useState<MediaEntry[]>([]);

	const [error, setError] = useState("");

	const [busy, setBusy] = useState("");

	const router = useRouter();

	async function addArtist(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			const uploadedMedia = await Promise.all(
				media.map(async mediaFile => {
					if (!(mediaFile.file instanceof File)) {
						return mediaFile.file;
					}

					const formData = new FormData();
					formData.append("file", mediaFile.file);

					const result = await fetch("/api/upload", {
						method: "POST",
						body: formData
					});

					const data = await result.json();

					if (!result.ok) {
						throw new Error(`Failed to upload "${mediaFile.file.name}"`);
					}

					return "/bucket/"+data.key
				})
			);

			const result = await fetch("/api/artist", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					name,
					bio,
					media: uploadedMedia
				})
			});

			if (!result.ok) {
				const data = await result.json();
				throw new Error(data.error || "Failed to create artist");
			}

			router.push("/artist/"+name);
		} catch (error) {
			setError(error instanceof Error ? error.message : "Something went wrong");
		}
	}

	return <form className="flex flex-col" onSubmit={addArtist}>
		<label>Name</label>
		<input
			type="text" 
			autoComplete="song-name" 
			value={name}
			onChange={(e) => setName(e.target.value)}
			required
		/>
		<label>Bio</label>
		<textarea
			autoComplete="song-bio"
			value={bio}
			onChange={(e) => setBio(e.target.value)}
		/>
		<div className="flex flex-row">
			<label>Media</label>&nbsp;<label style={{color: "var(--foreground-2)"}}>(Cover, Videos, etc)</label>
		</div>
		<MediaEdit mediaDispatch={[media, setMedia]} allowedTypes={["Banner", "Cover", "Video", "Image"]} />

		{error && <span style={{color: "var(--fail)"}}>{error}</span>}
		<button 
			type="submit" 
			className="w-full" 
			disabled={busy != ""}
		>
			{busy ? "saving entry…" : (artistId ? `edit artist` : `add artist`)} <ArrowUpRight size={16} />
		</button>
	</form>
}
