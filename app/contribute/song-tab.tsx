import { genres } from "@/lib/db/constants/genre";
import DropDown from "../pieces/dropdown";
import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import Image from "next/image";

export default function SongTab() {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [images, setImages] = useState<File[]>([]);
	const [confirmDelete, setConfirmDelete] = useState(-1);

	function uploadImage() {
		fileInputRef.current?.click();
	}
  
	function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
		const files = Array.from(e.target.files ?? []);
	
		setImages(prev => [...prev, ...files]);
		e.target.value = "";
	}

	return <>
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
		<div className="panel-column">
			<label>Cover Image(s)</label>

			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleImageChange}
				hidden
			/>

			<div className="panel-row panel-scroll h-[134px]">
				{images.map((image, index) => 
					<div className="flex flex-col item w-[100px]" key={index}>
						<div className="flex flex-row items-center p-1 h-[34px] w-[100px]">
							<span>{index === 0 ? "Main" : "Alternate"}</span>

							<div className="flex-1" />

							<X
								width={20}
								className="cursor-pointer"
								onClick={() => setConfirmDelete(index)}
							/>
						</div>
						<Image
							src={URL.createObjectURL(image)}
							alt={image.name}
							width={0}
							height={0}
							sizes="100%"
							style={{
								width: "100px",
								height: "100px",
								objectFit: "cover",
								flex: 1
							}}
						/>
					</div>
				)}

				<div className="upload item min-w-[100px] min-h-full" onClick={uploadImage}>
					<Upload />
					<span>Upload</span>
				</div>
			</div>
		</div>

		{confirmDelete > -1 && (
			<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
				<div className="rounded-xl p-8 panel nosize">
					<div className="panel-inner">
						Are you sure you want to remove this cover?
						<div className="panel-row">
							<button onClick={() => setConfirmDelete(-1)} className="flex-1" style={{background: "var(--surface-1)"}}>No</button>
							<button onClick={() => {
								setImages(prev => prev.filter((_, i) => i !== confirmDelete));
								setConfirmDelete(-1);
							}} className="flex-1">
								Yes
							</button>
						</div>
					</div>
				</div>
			</div>
		)}
	</>
}
