import { genres } from "@/lib/db/constants/genre";
import DropDown from "../pieces/dropdown";
import { Upload } from "lucide-react";

export default function SongTab() {
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
    </div>
    <div className="panel-row">
      <div className="panel-column">
        <label>Release Date</label>
        <input type="date" className="h-full" />
      </div>
      <div className="panel-column">
        <label>Cover Image</label>
        <div className="upload">
          <Upload />
          <span>Upload</span>
        </div>
      </div>
    </div>
  </>
}
