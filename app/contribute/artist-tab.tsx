import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { Genre } from "@/lib/types";
import type { SharedContributionProps } from "./types";

export default function ArtistTab({
  imagePreview,
  artistImage,
  galleryImages,
  setArtistImage,
  setGalleryImages,
  setImagePreview,
}: SharedContributionProps) {
  return (
    <>
      <label className="field-label" htmlFor="entry-aka">Also known as<span>Separate names with commas</span></label>
      <input id="entry-aka" name="aka" placeholder="Aliases, former names, alternate spellings" />
      <fieldset className="genre-options"><legend>Genres<span>Choose any that fit</span></legend><div className="genre-chip-grid">{Object.values(Genre).map((genre) => <label key={genre} className="genre-chip"><input type="checkbox" name="genres" value={genre} /><span>{genre}</span></label>)}</div></fieldset>
      <label className="field-label" htmlFor="entry-image">Artist photo<span>Optional · PNG, JPG, GIF, WebP · up to 2 MB</span></label>
      <label className="image-picker" htmlFor="entry-image">
        {imagePreview ? <Image src={imagePreview} alt="Artist image preview" width={36} height={36} unoptimized /> : <ImagePlus size={22} />}
        <span>{artistImage?.name ?? "Choose a profile photo"}</span>
        <input id="entry-image" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setArtistImage(file);
          setImagePreview(file ? URL.createObjectURL(file) : "");
        }} />
      </label>
      <label className="field-label" htmlFor="entry-gallery">Additional photos<span>Optional · choose multiple</span></label>
      <label className="image-picker" htmlFor="entry-gallery">
        <ImagePlus size={22} />
        <span>{galleryImages.length ? `${galleryImages.length} photos selected` : "Choose photos"}</span>
        <input id="entry-gallery" type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple onChange={(event) => setGalleryImages(Array.from(event.target.files ?? []))} />
      </label>
    </>
  );
}
