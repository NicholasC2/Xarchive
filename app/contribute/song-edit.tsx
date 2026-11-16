import { genres } from "@/lib/db/constants/genre";
import DropDown from "../drop/dropdown";
import { ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";
import Image from "next/image";

interface SongEditProps {
	songId?: string;
}

export default async function SongTab({ songId }: SongEditProps) {
	const [busy, setBusy] = useState(false);

	const songData = songId ? await (await fetch(`/api/song/${songId}`)).json() : null;

	return <form className="flex flex-col">
		<label>Name</label>
		<input name="song-name" type="text" autoComplete="song-name" />
		<label>Bio</label>
		<textarea name="song-bio" autoComplete="song-bio" ></textarea>
		<div className="panel-row">
			<div className="panel-column">
				<label>Tags</label>
				<input name="tags" type="text"/>
			</div>
			<div className="panel-column">
				<label>Genre</label>
				<DropDown
				items={genres.map(g => g.toString())}
				/>
			</div>
			<div className="panel-column">
				<label>Release Date</label>
				<input type="date" className="h-full" />
			</div>
		</div>

        <button type="submit" className="w-full" disabled={busy}>{busy ? "saving entry…" : `add song`} <ArrowUpRight size={16} /></button>
	</form>
}
