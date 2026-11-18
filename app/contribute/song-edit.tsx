"use client";

import { Genre } from "@/lib/db/constants/genre";
import DropDown from "../dropdown/dropdown";
import { ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Song } from "@/lib/db";
import SearchInput from "../dropdown/search-input";
import MediaEdit, { MediaEntry } from "./media-edit";

interface SongEditProps {
	songId?: string;
}

export default function SongEdit({ songId }: SongEditProps) {
	const [busy, setBusy] = useState(false);

	const [name, setName] = useState("");
	const [bio, setBio] = useState("");
	const [artists, setArtists] = useState("");
	const [featuredArtists, setFeaturedArtists] = useState("");
	const [genres, setGenres] = useState("");
	const [tags, setTags] = useState("");
	const [releaseDate, setReleaseDate] = useState("");
	const [media, setMedia] = useState<MediaEntry[]>([]);

	const joiner = ", ";

	useEffect(() => {
		(async()=>{
			const songData: Song | null = songId ? await (await fetch(`/api/song/${songId}`)).json() : null;

			if(songData) {
				setName(songData.name);
				setBio(songData.bio);
				setArtists(songData.artists.join(joiner));
				setFeaturedArtists(songData.featuredArtists.join(joiner));
				setGenres(songData.genres.join(joiner));
				setTags(songData.tags.join(joiner));
				setReleaseDate(songData.releaseDate ?? "");
				const mediaEntries = await Promise.all(
					songData.media.map(async (url): Promise<MediaEntry | null> => {
						const media = await fetch(`/api/media/${url}`);
						const json = await media.json();
						if (!json) return null;
						return json as MediaEntry;
					})
				);

				setMedia(mediaEntries.filter((m): m is MediaEntry => m !== null));
			}
		})()
	}, [songId])

	const searchArtists = useCallback(async (query: string): Promise<string[]> => {
		const response = await fetch(
			`/api/search/artists${query ? `?query=${encodeURIComponent(query)}` : ""}`
		);

		if (!response.ok) return [];

		return response.json();
	}, []);

	return <form className="flex flex-col">
		<label>Name</label>
		<input
			type="text" 
			autoComplete="song-name" 
			value={name}
			onChange={(e) => setName(e.target.value)}
		/>
		<label>Bio</label>
		<textarea
			autoComplete="song-bio"
			value={bio}
			onChange={(e) => setBio(e.target.value)}
		/>
		<label>Artist/s</label>
		<SearchInput
			autoComplete="song-name" 
			value={artists}
			onChange={(e) => setArtists(e.target.value)}
			searchable={searchArtists}
		/>
		<label>Featured Artist/s</label>
		<SearchInput
			autoComplete="song-name" 
			value={featuredArtists}
			onChange={(e) => setFeaturedArtists(e.target.value)}
			searchable={searchArtists}
		/>
		<label>Tags</label>
		<input
			type="text"
			value={tags}
			onChange={(e) => setTags(e.target.value)}
		/>
		<label>Genre</label>
		<DropDown
			items={Object.values(Genre)}
			value={genres}
			onChange={(e) => setGenres(e.target.value)}
		/>
		<label>Release Date</label>
		<input 
			type="date" 
			className="h-full" 
			value={releaseDate ?? ""} 
			onChange={(e) => setReleaseDate(e.target.value)}
		/>
		<div className="flex flex-row">
			<label>Media</label>&nbsp;<label style={{color: "var(--foreground-2)"}}>(Covers, Audio, Videos, etc)</label>
		</div>
		<MediaEdit mediaDispatch={[media, setMedia]} />

        <button type="submit" className="w-full" disabled={busy}>{busy ? "saving entry…" : (songId ? `edit song` : `add song`)} <ArrowUpRight size={16} /></button>
	</form>
}
